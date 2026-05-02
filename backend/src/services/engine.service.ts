import cron from 'node-cron';
import Strategy, { IStrategy } from '../models/Strategy';
import BrokerConnection from '../models/BrokerConnection';
import StrategyLog from '../models/StrategyLog';
import { StoxkartService } from './stoxkart.service';
import { decrypt } from './encryption.service';
import { instrumentService } from './instrument.service';
import { feedService } from './feed.service';

class StrategyEngine {
  private isProcessing = false;

  constructor() {
    // Run every minute during trading hours
    cron.schedule('* 9-15 * * 1-5', () => {
      this.processStrategies();
    });
  }

  async processStrategies() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const activeStrategies = await Strategy.find({ status: 'active', isActive: true });
      
      for (const strategy of activeStrategies) {
        try {
          await this.handleStrategy(strategy);
        } catch (err) {
          console.error(`Error processing strategy ${strategy._id}:`, err);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async handleStrategy(strategy: IStrategy) {
    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    // 1. Entry Logic
    if (!strategy.entryTime && strategy.config.entryTime === currentTime) {
      await this.entryStrategy(strategy);
    }

    // 2. Monitoring Logic
    if (strategy.entryTime) {
      await this.monitorStrategy(strategy);
    }
    
    // 3. Auto Square-off Logic
    if (strategy.config.squareOffTime === currentTime) {
        await this.exitStrategy(strategy, 'AUTO_SQUARE_OFF');
    }
  }

  private async entryStrategy(strategy: IStrategy) {
    console.log(`🎬 Entering matching strategy: ${strategy.name}`);
    
    const conn = await BrokerConnection.findOne({ userId: strategy.userId, status: 'connected' });
    if (!conn) {
       await this.log(strategy, 'ERROR', 'Broker not connected. Entrance failed.');
       return;
    }

    const svc = new StoxkartService(decrypt(conn.accessTokenEncrypted), decrypt(conn.apiKeyEncrypted));
    
    // Get ATM Strike from WebSocket price cache (real-time)
    const underlyingSymbol = strategy.config.underlying as 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY';
    const ltp = feedService.getPrice(underlyingSymbol);
    
    if (!ltp) {
        await this.log(strategy, 'ERROR', `No live price for ${strategy.config.underlying}. WebSocket may be disconnected.`);
        return;
    }

    const atmStrike = StoxkartService.calculateATMStrike(ltp, strategy.config.strikeStep || 50);
    const { ce, pe } = instrumentService.findATMOptions(strategy.config.underlying, strategy.config.expiry, atmStrike);

    if (!ce || !pe) {
        await this.log(strategy, 'ERROR', `Could not find ATM options for ${atmStrike}. Entrance failed.`);
        return;
    }

    // Place Orders
    const quantity = strategy.config.quantityLots * parseInt(ce.lotSize);
    const direction = strategy.config.direction;
    
    const result = await svc.placeStraddleOrders({
        underlying: strategy.config.underlying,
        ceSymbol: ce.symbol,
        peSymbol: pe.symbol,
        quantity,
        direction,
        productType: 'MIS'
    });

    if (result.ceOrderId && result.peOrderId) {
        strategy.entryTime = new Date();
        strategy.entryPremium = 0; // Will be updated after order fill
        const ceLotSize = parseInt(ce.lotSize) || 1;
        const peLotSize = parseInt(pe.lotSize) || 1;
        strategy.config.legs = [
            { type: 'CE', strike: atmStrike, token: ce.token, tradingSymbol: ce.symbol, action: direction === 'long' ? 'BUY' : 'SELL', lotSize: ceLotSize },
            { type: 'PE', strike: atmStrike, token: pe.token, tradingSymbol: pe.symbol, action: direction === 'long' ? 'BUY' : 'SELL', lotSize: peLotSize }
        ];
        await strategy.save();
        await this.log(strategy, 'ENTRY', `Straddle entered at ATM ${atmStrike}. C:${ce.symbol}, P:${pe.symbol}`, [result.ceOrderId, result.peOrderId]);
    } else {
        await this.log(strategy, 'ERROR', 'Order placement failed for one or both legs.');
    }
  }

  private async monitorStrategy(strategy: IStrategy) {
    if (!strategy.config.legs || strategy.config.legs.length < 2) return;

    const conn = await BrokerConnection.findOne({ userId: strategy.userId, status: 'connected' });
    if (!conn) return;

    const svc = new StoxkartService(decrypt(conn.accessTokenEncrypted), decrypt(conn.apiKeyEncrypted));
    
    try {
      // Get live LTP of both legs
      const ceLeg = strategy.config.legs.find(l => l.type === 'CE');
      const peLeg = strategy.config.legs.find(l => l.type === 'PE');
      
      if (!ceLeg?.tradingSymbol || !peLeg?.tradingSymbol) return;

      const quote = await svc.getQuote([`NFO:${ceLeg.tradingSymbol}`, `NFO:${peLeg.tradingSymbol}`]);
      const quotes = quote?.data;
      
      if (!quotes) return;

      const ceLtp = quotes[`NFO:${ceLeg.tradingSymbol}`]?.ltp || 0;
      const peLtp = quotes[`NFO:${peLeg.tradingSymbol}`]?.ltp || 0;
      
      const currentPremium = ceLtp + peLtp;
      const ceQuantity = strategy.config.quantityLots * (ceLeg.lotSize || 1);
      const peQuantity = strategy.config.quantityLots * (peLeg.lotSize || 1);
      const totalQuantity = (ceQuantity + peQuantity) / 2; // Average for PnL calc
      
      // Calculate P&L based on direction
      let currentPnL = 0;
      if (strategy.config.direction === 'short') {
        // Short straddle: entryPremium - currentPremium
        currentPnL = (strategy.entryPremium || 0) - currentPremium;
      } else {
        // Long straddle: currentPremium - entryPremium
        currentPnL = currentPremium - (strategy.entryPremium || 0);
      }
      currentPnL *= totalQuantity;

      // Update current P&L
      strategy.currentPnL = currentPnL;
      await strategy.save();

      // Check exit conditions
      const { slPoints, targetPoints, maxLoss } = strategy.config;
      const entryUnderlyingPrice = strategy.entryPremium || 0; // Using premium as reference

      // SL Check (points based)
      if (slPoints && currentPnL <= -slPoints * quantity) {
        await this.exitStrategy(strategy, `SL_HIT`, svc);
        return;
      }

      // Target Check (points based)
      if (targetPoints && currentPnL >= targetPoints * quantity) {
        await this.exitStrategy(strategy, `TARGET_HIT`, svc);
        return;
      }

      // Max Loss Check (absolute ₹ amount)
      if (maxLoss && currentPnL <= -maxLoss) {
        await this.exitStrategy(strategy, `MAX_LOSS_HIT`, svc);
        return;
      }

    } catch (error) {
      console.error(`[Engine] Monitor error for strategy ${strategy._id}:`, error);
    }
  }

  private async exitStrategy(strategy: IStrategy, reason: string, svc?: StoxkartService) {
    try {
      // Square off all legs if service provided
      if (svc && strategy.config.legs) {
        for (const leg of strategy.config.legs) {
          if (!leg.tradingSymbol || !leg.lotSize) continue;
          
          // Reverse the action (BUY becomes SELL, SELL becomes BUY)
          const exitAction = leg.action === 'BUY' ? 'SELL' : 'BUY';
          const quantity = strategy.config.quantityLots * leg.lotSize;
          
          try {
            await svc.placeOrder({
              exchange: 'NFO',
              tradingsymbol: leg.tradingSymbol,
              transaction_type: exitAction,
              order_type: 'MARKET',
              quantity,
              product_type: 'MIS',
              tag: 'ST_EXIT',
            });
            console.log(`[Engine] Exit order placed: ${leg.tradingSymbol} ${exitAction} ${quantity}`);
          } catch (orderError) {
            console.error(`[Engine] Exit order failed for ${leg.tradingSymbol}:`, orderError);
          }
        }
      }

      await this.log(strategy, 'EXIT', `Strategy exited due to ${reason}`);
      strategy.status = 'completed';
      strategy.isActive = false;
      strategy.exitTime = new Date();
      await strategy.save();
    } catch (error) {
      console.error(`[Engine] Exit error for strategy ${strategy._id}:`, error);
      await this.log(strategy, 'ERROR', `Exit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async log(strategy: IStrategy, action: any, message: string, orderIds?: string[]) {
    await StrategyLog.create({
      strategyId: strategy._id,
      userId: strategy.userId,
      action,
      message,
      orderIds,
      executedAt: new Date()
    });
  }
}

export const strategyEngine = new StrategyEngine();
