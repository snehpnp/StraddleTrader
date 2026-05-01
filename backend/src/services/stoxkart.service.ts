import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

// ─── Stoxkart API — Based on official docs at developers.stoxkart.com ───────
//
// Auth Flow:
//   1. User visits: https://superrtrade.stoxkart.com/login?api_key={YOUR_API_KEY}
//   2. On success, redirected to: {redirect_url}?auth_token=xxx&feed_token=yyy
//   3. Backend calls /auth/token with HMAC-SHA256 signature to get access_token
//   4. All subsequent calls use headers: x-authorization + x-api-key
//
// Base URL: https://preprod-openapi.stoxkart.com
// Rate Limit: 10 requests/second

const BASE_URL = process.env.STOXKART_BASE_URL || 'https://preprod-openapi.stoxkart.com';

export const STOXKART_LOGIN_URL = (apiKey: string) =>
  `https://superrtrade.stoxkart.com/login?api_key=${apiKey}`;

// ─── HMAC-SHA256 Signature (api_key + auth_token, secret) ────────────────────
export function generateSignature(apiKey: string, authToken: string, apiSecret: string): string {
  return crypto
    .createHmac('sha256', apiSecret)
    .update(apiKey + authToken)
    .digest('hex');
}

// ─── Main Stoxkart Service Class ──────────────────────────────────────────────
export class StoxkartService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(accessToken: string, apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'x-authorization': accessToken,  // Stoxkart uses x-authorization header
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Centralized error logging
    this.client.interceptors.response.use(
      (res) => res,
      (err) => {
        console.error(`[Stoxkart API Error] ${err?.response?.status} — ${err?.response?.data?.message || err.message}`);
        return Promise.reject(err);
      }
    );
  }

  // ─── Step B: Exchange auth_token for access_token ─────────────────────────
  // Call this after user logs in via browser and you get auth_token from redirect
  static async generateSession(apiKey: string, apiSecret: string, authToken: string) {
    const signature = generateSignature(apiKey, authToken, apiSecret);
    const res = await axios.post(`${BASE_URL}/auth/token`, {
      api_key: apiKey,
      request_token: authToken,
      signature,
    }, {
      headers: { 'Content-Type': 'application/json' },
    });
    // Returns: { status: 'success', data: { access_token, feed_token, user_id, ... } }
    return res.data;
  }

  // ─── Profile ───────────────────────────────────────────────────────────────
  async getProfile() {
    const res = await this.client.get('/user/profile');
    return res.data;
  }

  // ─── Funds / Margin ────────────────────────────────────────────────────────
  async getBalance() {
    const res = await this.client.get('/funds');
    return res.data; // { status, data: { equity: { net, available, utilisedMargin }, ... } }
  }

  // ─── Market Data: Quotes ───────────────────────────────────────────────────
  async getQuote(symbols: string[]) {
    // symbols format: ["NSE:NIFTY50", "NFO:NIFTY25MAY24500CE"]
    const res = await this.client.get('/instruments/quotes', {
      params: { symbols: symbols.join(',') },
    });
    return res.data;
  }

  async getLTP(symbol: string): Promise<number> {
    const data = await this.getQuote([symbol]);
    const quotes = data?.data;
    if (quotes && quotes[symbol]) return quotes[symbol].ltp || 0;
    return 0;
  }

  // ─── Instruments / Scrip Master ───────────────────────────────────────────
  // Direct download from stoxkart CDN — no auth needed
  static async downloadInstruments(exchange: 'NSE' | 'BSE' | 'MCX' | 'CUR' | 'NFO' = 'NFO') {
    const url = `https://stoxkart.com/Master_Scrip/${exchange}_Instruments.json`;
    const res = await axios.get(url, { timeout: 30000 });
    return res.data; // Array of instrument objects
  }

  // ─── Order Management ─────────────────────────────────────────────────────
  // variety: 'regular' | 'amo' | 'bo'
  async placeOrder(payload: {
    exchange: 'NSE' | 'BSE' | 'NFO' | 'MCX' | 'CDS';
    tradingsymbol: string;
    transaction_type: 'BUY' | 'SELL';
    order_type: 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
    quantity: number;
    price?: number;
    trigger_price?: number;
    product_type: 'MIS' | 'NRML' | 'CNC';
    validity?: 'DAY' | 'IOC';
    variety?: 'regular' | 'amo' | 'bo';
    tag?: string;
  }) {
    const variety = payload.variety || 'regular';
    const res = await this.client.post(`/orders/${variety}`, {
      exchange: payload.exchange,
      tradingsymbol: payload.tradingsymbol,
      transaction_type: payload.transaction_type,
      order_type: payload.order_type,
      quantity: payload.quantity,
      price: payload.price || 0,
      trigger_price: payload.trigger_price || 0,
      product_type: payload.product_type,
      validity: payload.validity || 'DAY',
      tag: payload.tag || 'StraddleTrader',
    });
    // Returns: { status: 'success', data: { order_id: 'xxx' } }
    return res.data;
  }

  async modifyOrder(orderId: string, payload: {
    variety?: 'regular' | 'amo' | 'bo';
    order_type?: string;
    quantity?: number;
    price?: number;
    trigger_price?: number;
    validity?: string;
  }) {
    const variety = payload.variety || 'regular';
    const res = await this.client.put(`/orders/${variety}/${orderId}`, payload);
    return res.data;
  }

  async cancelOrder(orderId: string, variety = 'regular') {
    const res = await this.client.delete(`/orders/${variety}/${orderId}`);
    return res.data;
  }

  // ─── Order & Trade Book ───────────────────────────────────────────────────
  async getOrders() {
    const res = await this.client.get('/reports/order-book');
    return res.data; // { status, data: { orders: [...] } }
  }

  async getTrades() {
    const res = await this.client.get('/reports/trade-book');
    return res.data;
  }

  // ─── Portfolio ────────────────────────────────────────────────────────────
  async getPositions() {
    const res = await this.client.get('/portfolio/positions');
    return res.data; // { status, data: { positions: [...] } }
  }

  async getHoldings() {
    const res = await this.client.get('/portfolio/holdings');
    return res.data;
  }

  // ─── Strategy Helpers ─────────────────────────────────────────────────────
  // Calculate ATM strike for a given underlying LTP and strike step
  static calculateATMStrike(ltp: number, strikeStep: number): number {
    return Math.round(ltp / strikeStep) * strikeStep;
  }

  // Place multi-leg orders (CE + PE for straddle)
  async placeStraddleOrders(params: {
    underlying: string;
    ceSymbol: string;
    peSymbol: string;
    quantity: number;
    direction: 'long' | 'short';
    productType: 'MIS' | 'NRML';
  }) {
    const txType = params.direction === 'long' ? 'BUY' : 'SELL';

    const [ceResult, peResult] = await Promise.all([
      this.placeOrder({
        exchange: 'NFO',
        tradingsymbol: params.ceSymbol,
        transaction_type: txType,
        order_type: 'MARKET',
        quantity: params.quantity,
        product_type: params.productType,
        tag: 'ST_CE',
      }),
      this.placeOrder({
        exchange: 'NFO',
        tradingsymbol: params.peSymbol,
        transaction_type: txType,
        order_type: 'MARKET',
        quantity: params.quantity,
        product_type: params.productType,
        tag: 'ST_PE',
      }),
    ]);

    return {
      ceOrderId: ceResult?.data?.order_id,
      peOrderId: peResult?.data?.order_id,
    };
  }

  // Get API key for this instance (needed for WebSocket)
  getApiKey(): string { return this.apiKey; }
}
