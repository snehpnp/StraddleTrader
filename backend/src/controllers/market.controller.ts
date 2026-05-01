import { Request, Response } from 'express';
import BrokerConnection from '../models/BrokerConnection';
import { decrypt } from '../services/encryption.service';
import { StoxkartService } from '../services/stoxkart.service';

interface AuthReq extends Request { userId?: string; }

export const getQuote = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const { tokens } = req.query;
    if (!tokens) { res.status(400).json({ success: false, message: 'tokens query required' }); return; }
    const conn = await BrokerConnection.findOne({ userId: req.userId, status: 'connected' });
    if (!conn) { res.status(400).json({ success: false, message: 'Broker not connected' }); return; }
    const svc = new StoxkartService(decrypt(conn.accessTokenEncrypted));
    const tokenList = (tokens as string).split(',');
    const data = await svc.getQuote(tokenList);
    res.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, message: msg });
  }
};

export const getInstruments = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const { exchange } = req.query;
    const conn = await BrokerConnection.findOne({ userId: req.userId, status: 'connected' });
    if (!conn) { res.status(400).json({ success: false, message: 'Broker not connected' }); return; }
    const svc = new StoxkartService(decrypt(conn.accessTokenEncrypted));
    const data = await svc.getInstruments((exchange as string) || 'NFO');
    res.json({ success: true, data });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, message: msg });
  }
};

export const getExpiries = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const { underlying } = req.query;
    const conn = await BrokerConnection.findOne({ userId: req.userId, status: 'connected' });
    if (!conn) { res.status(400).json({ success: false, message: 'Broker not connected' }); return; }
    const svc = new StoxkartService(decrypt(conn.accessTokenEncrypted));
    const instruments = await svc.getInstruments('NFO');
    // Filter unique expiries for the given underlying
    const filtered = Array.isArray(instruments?.data) ? instruments.data : [];
    const expiries: string[] = [
      ...new Set(
        filtered
          .filter((i: { name?: string; instrumentType?: string }) =>
            (!underlying || i.name === underlying) &&
            (i.instrumentType === 'CE' || i.instrumentType === 'PE')
          )
          .map((i: { expiry?: string }) => i.expiry)
          .filter(Boolean)
      ),
    ] as string[];
    res.json({ success: true, expiries: expiries.sort() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    res.status(500).json({ success: false, message: msg });
  }
};
