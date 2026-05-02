import { axiosInstance } from './axios';

export interface Position {
  symbol?: string;
  tradingSymbol?: string;
  quantity?: number;
  netQty?: number;
  avgPrice?: number;
  buyAvg?: number;
  sellAvg?: number;
  currentPrice?: number;
  ltp?: number;
  pnl: number;
  pnlPercent?: number;
  product?: string;
}

export interface Holding {
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  value: number;
  pnl: number;
}

export interface Order {
  orderId: string;
  tradingSymbol: string;
  transactionType: string;
  orderType: string;
  quantity: number;
  price: number;
  status: string;
  orderTime?: string;
}

export interface Log {
  _id: string;
  action: string;
  message: string;
  executedAt: string;
  pnl?: number;
}

export interface Portfolio {
  totalValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: Position[];
  holdings: Holding[];
}

// Get portfolio summary
export const getPortfolio = () =>
  axiosInstance.get<{ success: boolean; portfolio: Portfolio }>('/api/portfolio');

// Get positions
export const getPositions = () =>
  axiosInstance.get<{ success: boolean; positions: Position[] }>('/api/portfolio/positions');

// Get holdings
export const getHoldings = () =>
  axiosInstance.get<{ success: boolean; holdings: Holding[] }>('/api/portfolio/holdings');

// Get PnL report
export const getPnL = (params?: { from?: string; to?: string }) =>
  axiosInstance.get<{ success: boolean; pnl: unknown }>('/api/portfolio/pnl', { params });

// Get orders
export const getOrders = () =>
  axiosInstance.get<{ success: boolean; orders: Order[] }>('/api/portfolio/orders');

// Get logs
export const getLogs = () =>
  axiosInstance.get<{ success: boolean; logs: Log[] }>('/api/portfolio/logs');
