import { Request, Response } from 'express';
import BrokerConnection from '../models/BrokerConnection';
import { decrypt } from '../services/encryption.service';
import { StoxkartService } from '../services/stoxkart.service';

interface AuthReq extends Request { userId?: string; }

async function getBrokerService(userId: string): Promise<StoxkartService> {
  const conn = await BrokerConnection.findOne({ userId, status: 'connected' });
  if (!conn) throw new Error('Broker not connected');
  const token = decrypt(conn.accessTokenEncrypted);
  return new StoxkartService(token);
}

export const getBalance = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const svc = await getBrokerService(req.userId!);
    const data = await svc.getBalance();
    res.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, message: msg });
  }
};

export const getPositions = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const svc = await getBrokerService(req.userId!);
    const data = await svc.getPositions();
    res.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, message: msg });
  }
};

export const getOrders = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const svc = await getBrokerService(req.userId!);
    const data = await svc.getOrders();
    res.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, message: msg });
  }
};

export const getTrades = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const svc = await getBrokerService(req.userId!);
    const data = await svc.getTrades();
    res.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(400).json({ success: false, message: msg });
  }
};

export const getLogs = async (_req: AuthReq, res: Response): Promise<void> => {
  // TODO: Fetch from StrategyLog collection
  res.json({ success: true, data: [] });
};
