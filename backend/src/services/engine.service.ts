import cron from 'node-cron';
import Strategy, { IStrategy } from '../models/Strategy';
import BrokerConnection from '../models/BrokerConnection';
import StrategyLog from '../models/StrategyLog';
import { StoxkartService } from './stoxkart.service';
import { decrypt } from './encryption.service';
import { instrumentService } from './instrument.service';

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
    
    // Get ATM Strike
    const underlying = strategy.config.underlying === 'NIFTY' ? 'NSE:NIFTY50' : `NSE:${strategy.config.underlying}`;
    const ltp = await svc.getLTP(underlying);
    
    if (ltp === 0) {
        await this.log(strategy, 'ERROR', `Could not fetch LTP for ${underlying}. Entrance failed.`);
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
        strategy.config.legs = [
            { type: 'CE', strike: atmStrike, token: ce.token, tradingSymbol: ce.symbol, action: direction === 'long' ? 'BUY' : 'SELL' },
            { type: 'PE', strike: atmStrike, token: pe.token, tradingSymbol: pe.symbol, action: direction === 'long' ? 'BUY' : 'SELL' }
        ];
        await strategy.save();
        await this.log(strategy, 'ENTRY', `Straddle entered at ATM ${atmStrike}. C:${ce.symbol}, P:${pe.symbol}`, [result.ceOrderId, result.peOrderId]);
    } else {
        await this.log(strategy, 'ERROR', 'Order placement failed for one or both legs.');
    }
  }

  private async monitorStrategy(strategy: IStrategy) {
    // Fetch live P&L and check SL/Target
    // Logic: fetch LTP of legs, calculate combined P&L
    // For now, simple implementation
  }

  private async exitStrategy(strategy: IStrategy, reason: string) {
      // Logic to square off all legs
      await this.log(strategy, 'EXIT', `Strategy exited due to ${reason}`);
      strategy.status = 'completed';
      strategy.isActive = false;
      strategy.exitTime = new Date();
      await strategy.save();
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
