import { Request, Response } from 'express';
import BrokerConnection from '../models/BrokerConnection';
import { decrypt } from '../services/encryption.service';
import { StoxkartService } from '../services/stoxkart.service';
import { instrumentService } from '../services/instrument.service';
import { feedService, INDEX_TOKENS } from '../services/feed.service';

interface AuthReq extends Request { userId?: string; }

export const getQuote = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const { symbols } = req.query;
    if (!symbols) { res.status(400).json({ success: false, message: 'symbols query required (e.g. NSE:NIFTY50)' }); return; }
    
    const conn = await BrokerConnection.findOne({ userId: req.userId, status: 'connected' });
    if (!conn) { res.status(400).json({ success: false, message: 'Broker not connected' }); return; }
    
    const svc = new StoxkartService(decrypt(conn.accessTokenEncrypted), decrypt(conn.apiKeyEncrypted));
    const symbolList = (symbols as string).split(',');
    const data = await svc.getQuote(symbolList);
    res.json({ success: true, data: data.data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, message: msg });
  }
};

export const getInstruments = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    // Return instruments filtered by exchange from master scrip
    // For now returning count and sample as it's too large
    res.json({ success: true, message: 'Use scrip search for specific instruments' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, message: msg });
  }
};

export const getExpiries = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const { underlying } = req.query;
    if (!underlying) {
        res.status(400).json({ success: false, message: 'underlying query required' });
        return;
    }
    
    const expiries = instrumentService.getUniqueExpiries(underlying as string);
    res.json({ success: true, expiries });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, message: msg });
  }
};

export const getLotSize = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const { underlying } = req.query;
    if (!underlying) {
        res.status(400).json({ success: false, message: 'underlying query required' });
        return;
    }
    
    const lotSize = instrumentService.getLotSize(underlying as string);
    res.json({ success: true, lotSize });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, message: msg });
  }
};

export const getLivePrices = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const prices: Record<string, { ltp: number | null; change: number; changePercent: number }> = {};
    
    for (const [symbol, token] of Object.entries(INDEX_TOKENS)) {
      const data = feedService.getPriceData(symbol as any);
      prices[symbol] = {
        ltp: data?.ltp || null,
        change: data?.change || 0,
        changePercent: data?.changePercent || 0,
      };
    }
    
    res.json({ 
      success: true, 
      prices,
      wsConnected: feedService.isWebSocketConnected(),
      timestamp: new Date().toISOString()
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, message: msg });
  }
};
