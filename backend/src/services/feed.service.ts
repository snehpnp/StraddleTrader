import WebSocket from 'ws';
import { decrypt } from './encryption.service';
import BrokerConnection from '../models/BrokerConnection';

/**
 * FeedService - Real-time price streaming from Stoxkart WebSocket
 * 
 * WebSocket URL: wss://stoxkart.com/feed/?type=index
 * Stoxkart streaming docs: developers.stoxkart.com
 */

// Index tokens for subscription
export const INDEX_TOKENS = {
  NIFTY: '26000',      // NIFTY 50
  BANKNIFTY: '26001',  // BANKNIFTY
  FINNIFTY: '26002',   // FINNIFTY
  SENSEX: '1',         // SENSEX
};

// Token to symbol mapping
const TOKEN_TO_SYMBOL: Record<string, string> = {
  '26000': 'NIFTY',
  '26001': 'BANKNIFTY',
  '26002': 'FINNIFTY',
  '1': 'SENSEX',
};

// Price cache - stores latest LTP for each token
interface PriceData {
  ltp: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volume: number;
  lastUpdated: Date;
}

class FeedService {
  private ws: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly reconnectDelay = 5000; // 5 seconds
  private priceCache: Map<string, PriceData> = new Map();
  private feedToken: string | null = null;
  private apiKey: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-connect when any user has active broker connection
    this.init();
  }

  private async init() {
    // Try to connect with first available broker connection
    const brokerConn = await BrokerConnection.findOne({ status: 'connected' });
    if (brokerConn) {
      this.apiKey = decrypt(brokerConn.apiKeyEncrypted);
      // Note: feed_token should be stored during auth - we'll add this to BrokerConnection
      // For now, we'll use accessToken as fallback
      this.feedToken = decrypt(brokerConn.accessTokenEncrypted);
      this.connect();
    }
  }

  /**
   * Connect to Stoxkart WebSocket
   */
  connect(feedToken?: string, apiKey?: string): void {
    if (this.isConnected || this.isConnecting) return;
    
    this.isConnecting = true;
    
    if (feedToken) this.feedToken = feedToken;
    if (apiKey) this.apiKey = apiKey;

    if (!this.feedToken || !this.apiKey) {
      console.error('[FeedService] ❌ Cannot connect: Missing feed_token or api_key');
      this.isConnecting = false;
      return;
    }

    try {
      const wsUrl = `wss://stoxkart.com/feed/?type=index&feed_token=${this.feedToken}&api_key=${this.apiKey}`;
      
      console.log('[FeedService] 🔌 Connecting to WebSocket...');
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => this.handleOpen());
      this.ws.on('message', (data) => this.handleMessage(data));
      this.ws.on('error', (err) => this.handleError(err));
      this.ws.on('close', () => this.handleClose());

    } catch (error) {
      console.error('[FeedService] ❌ Connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleOpen(): void {
    console.log('[FeedService] ✅ WebSocket connected');
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Subscribe to all index tokens
    this.subscribeToIndices();
    
    // Start heartbeat
    this.startHeartbeat();
  }

  private handleMessage(data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle different message types
      if (message.t === 'tk' || message.t === 'tf') {
        // Touchline or full data - update price cache
        this.updatePriceCache(message);
      } else if (message.t === 'ck') {
        // Connection acknowledgement
        console.log('[FeedService] 📡 Subscription acknowledged');
      } else if (message.t === 'bm') {
        // Binary message - parse tick data
        this.parseBinaryTick(message);
      }
    } catch (error) {
      // Binary data handling
      if (Buffer.isBuffer(data)) {
        this.parseBinaryData(data);
      }
    }
  }

  private parseBinaryData(data: Buffer): void {
    try {
      // Stoxkart binary format parsing
      // Format: [token:4][ltp:4][change:4][open:4][high:4][low:4][close:4][volume:4]
      let offset = 0;
      
      while (offset < data.length) {
        const token = data.readUInt32LE(offset).toString();
        offset += 4;
        
        const ltp = data.readFloatLE(offset);
        offset += 4;
        
        const change = data.readFloatLE(offset);
        offset += 4;
        
        const open = data.readFloatLE(offset);
        offset += 4;
        
        const high = data.readFloatLE(offset);
        offset += 4;
        
        const low = data.readFloatLE(offset);
        offset += 4;
        
        const close = data.readFloatLE(offset);
        offset += 4;
        
        const volume = data.readUInt32LE(offset);
        offset += 4;

        if (TOKEN_TO_SYMBOL[token]) {
          this.priceCache.set(token, {
            ltp,
            change,
            changePercent: close > 0 ? (change / close) * 100 : 0,
            high,
            low,
            open,
            close,
            volume,
            lastUpdated: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('[FeedService] ❌ Binary parse error:', error);
    }
  }

  private parseBinaryTick(message: any): void {
    // Handle binary tick messages
    if (message.k && Array.isArray(message.k)) {
      for (const tick of message.k) {
        const token = tick.tk;
        if (TOKEN_TO_SYMBOL[token]) {
          this.priceCache.set(token, {
            ltp: parseFloat(tick.lp) || 0,
            change: parseFloat(tick.c) || 0,
            changePercent: parseFloat(tick.cp) || 0,
            high: parseFloat(tick.h) || 0,
            low: parseFloat(tick.l) || 0,
            open: parseFloat(tick.o) || 0,
            close: parseFloat(tick.c) || 0,
            volume: parseInt(tick.v) || 0,
            lastUpdated: new Date(),
          });
        }
      }
    }
  }

  private updatePriceCache(message: any): void {
    const token = message.tk;
    if (!TOKEN_TO_SYMBOL[token]) return;

    const existing = this.priceCache.get(token);
    const close = parseFloat(message.c) || existing?.close || 0;
    const ltp = parseFloat(message.lp) || existing?.ltp || 0;
    const change = ltp - close;

    this.priceCache.set(token, {
      ltp,
      change,
      changePercent: close > 0 ? (change / close) * 100 : 0,
      high: parseFloat(message.h) || existing?.high || ltp,
      low: parseFloat(message.l) || existing?.low || ltp,
      open: parseFloat(message.o) || existing?.open || ltp,
      close,
      volume: parseInt(message.v) || existing?.volume || 0,
      lastUpdated: new Date(),
    });
  }

  private handleError(err: Error): void {
    console.error('[FeedService] ❌ WebSocket error:', err.message);
  }

  private handleClose(): void {
    console.log('[FeedService] 🔌 WebSocket closed');
    this.isConnected = false;
    this.isConnecting = false;
    this.stopHeartbeat();
    this.scheduleReconnect();
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[FeedService] ❌ Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[FeedService] 🔄 Reconnecting... (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  private startHeartbeat(): void {
    // Send ping every 30 seconds to keep connection alive
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.isConnected) {
        this.ws.send(JSON.stringify({ t: 'h' })); // heartbeat
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Subscribe to index tokens
   */
  private subscribeToIndices(): void {
    if (!this.ws || !this.isConnected) return;

    const subscription = {
      t: 't',
      k: Object.values(INDEX_TOKENS).join('#'),
    };

    this.ws.send(JSON.stringify(subscription));
    console.log('[FeedService] 📡 Subscribed to indices:', Object.keys(INDEX_TOKENS).join(', '));
  }

  /**
   * Get latest price for a symbol
   */
  getPrice(symbol: 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'SENSEX'): number | null {
    const token = INDEX_TOKENS[symbol];
    if (!token) return null;

    const data = this.priceCache.get(token);
    if (!data) {
      console.warn(`[FeedService] ⚠️ No price data for ${symbol}`);
      return null;
    }

    // Check if data is stale (older than 30 seconds)
    const age = Date.now() - data.lastUpdated.getTime();
    if (age > 30000) {
      console.warn(`[FeedService] ⚠️ Stale data for ${symbol} (${age}ms old)`);
    }

    return data.ltp;
  }

  /**
   * Get full price data for a symbol
   */
  getPriceData(symbol: 'NIFTY' | 'BANKNIFTY' | 'FINNIFTY' | 'SENSEX'): PriceData | null {
    const token = INDEX_TOKENS[symbol];
    if (!token) return null;
    return this.priceCache.get(token) || null;
  }

  /**
   * Check if connected
   */
  isWebSocketConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.priceCache.clear();
    console.log('[FeedService] 🔌 Disconnected');
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      cachedSymbols: Array.from(this.priceCache.keys()).map(t => TOKEN_TO_SYMBOL[t]).filter(Boolean),
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Singleton instance
export const feedService = new FeedService();
