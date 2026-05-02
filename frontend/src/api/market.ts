import { axiosInstance } from './axios';

// Get market quote
export const getQuote = (symbol: string, exchange?: string) =>
  axiosInstance.get<{ success: boolean; quote: unknown }>('/api/market/quote', {
    params: { symbol, exchange },
  });

// Get OHLC data
export const getOHLC = (symbol: string, timeframe?: string, limit?: number) =>
  axiosInstance.get<{ success: boolean; data: unknown[] }>('/api/market/ohlc', {
    params: { symbol, timeframe, limit },
  });

// Get instruments
export const getInstruments = (exchange?: string) =>
  axiosInstance.get<{ success: boolean; instruments: unknown[] }>('/api/market/instruments', {
    params: { exchange },
  });

// Get expiries (for options)
export const getExpiries = (underlying: string) =>
  axiosInstance.get<{ success: boolean; expiries: string[] }>('/api/market/expiries', {
    params: { underlying },
  });

// Get lot size for symbol
export const getLotSize = (underlying: string) =>
  axiosInstance.get<{ success: boolean; lotSize: number | null }>('/api/market/lot-size', {
    params: { underlying },
  });
