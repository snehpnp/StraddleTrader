import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.STOXKART_BASE_URL || 'https://api.stoxkart.in/v1';

export class StoxkartService {
  private client: AxiosInstance;
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });
  }

  // ─── Authentication ───────────────────────────────────────────────────
  static async generateSession(apiKey: string, apiSecret: string) {
    const res = await axios.post(`${BASE_URL}/auth/login`, { apiKey, apiSecret });
    return res.data; // { accessToken, userId, ... }
  }

  async getProfile() {
    const res = await this.client.get('/user/profile');
    return res.data;
  }

  // ─── Market Data ──────────────────────────────────────────────────────
  async getQuote(tokens: string[]) {
    const res = await this.client.get('/market/quote', {
      params: { tokens: tokens.join(',') },
    });
    return res.data;
  }

  async getLTP(token: string): Promise<number> {
    const res = await this.client.get('/market/ltp', { params: { token } });
    return res.data?.ltp || 0;
  }

  async getInstruments(exchange = 'NFO') {
    const res = await this.client.get('/instruments', { params: { exchange } });
    return res.data;
  }

  // ─── Trading ──────────────────────────────────────────────────────────
  async placeOrder(payload: {
    tradingSymbol: string;
    exchange: string;
    transactionType: 'BUY' | 'SELL';
    orderType: 'MARKET' | 'LIMIT';
    quantity: number;
    productType: 'MIS' | 'NRML';
    price?: number;
    triggerPrice?: number;
  }) {
    const res = await this.client.post('/orders/place', payload);
    return res.data; // { orderId, status, ... }
  }

  async modifyOrder(orderId: string, payload: Record<string, unknown>) {
    const res = await this.client.put(`/orders/${orderId}`, payload);
    return res.data;
  }

  async cancelOrder(orderId: string) {
    const res = await this.client.delete(`/orders/${orderId}`);
    return res.data;
  }

  async getOrders() {
    const res = await this.client.get('/orders');
    return res.data;
  }

  async getTrades() {
    const res = await this.client.get('/trades');
    return res.data;
  }

  // ─── Portfolio ────────────────────────────────────────────────────────
  async getPositions() {
    const res = await this.client.get('/portfolio/positions');
    return res.data;
  }

  async getHoldings() {
    const res = await this.client.get('/portfolio/holdings');
    return res.data;
  }

  async getBalance() {
    const res = await this.client.get('/funds/balance');
    return res.data;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────
  static calculateATMStrike(ltp: number, strikeStep: number): number {
    return Math.round(ltp / strikeStep) * strikeStep;
  }
}
