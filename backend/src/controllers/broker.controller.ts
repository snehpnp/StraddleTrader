import { Request, Response } from 'express';
import BrokerConnection from '../models/BrokerConnection';
import { encrypt, decrypt } from '../services/encryption.service';
import { StoxkartService } from '../services/stoxkart.service';

interface AuthReq extends Request { userId?: string; }

export const saveCredentials = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const { apiKey, apiSecret } = req.body;
    if (!apiKey || !apiSecret) {
      res.status(400).json({ success: false, message: 'API Key and Secret required' });
      return;
    }
    const existing = await BrokerConnection.findOne({ userId: req.userId });
    const data = {
      apiKeyEncrypted: encrypt(apiKey),
      apiSecretEncrypted: encrypt(apiSecret),
      status: 'disconnected' as const,
    };
    if (existing) {
      await BrokerConnection.updateOne({ userId: req.userId }, data);
    } else {
      await BrokerConnection.create({ userId: req.userId, ...data, accessTokenEncrypted: '' });
    }
    res.json({ success: true, message: 'Credentials saved securely' });
  } catch (err) {
    console.error('saveCredentials error:', err);
    res.status(500).json({ success: false, message: 'Failed to save credentials' });
  }
};

export const connectBroker = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const conn = await BrokerConnection.findOne({ userId: req.userId });
    if (!conn) {
      res.status(404).json({ success: false, message: 'Credentials not found. Save them first.' });
      return;
    }
    const apiKey = decrypt(conn.apiKeyEncrypted);
    const apiSecret = decrypt(conn.apiSecretEncrypted);

    const sessionData = await StoxkartService.generateSession(apiKey, apiSecret);
    const accessToken: string = sessionData.accessToken || sessionData.data?.accessToken || '';

    await BrokerConnection.updateOne(
      { userId: req.userId },
      {
        accessTokenEncrypted: encrypt(accessToken),
        brokerUserId: sessionData.userId || sessionData.data?.userId || '',
        status: 'connected',
        lastSyncedAt: new Date(),
        tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
    );
    res.json({ success: true, message: 'Broker connected successfully' });
  } catch (err: unknown) {
    console.error('connectBroker error:', err);
    const msg = err instanceof Error ? err.message : 'Connection failed';
    await BrokerConnection.updateOne({ userId: req.userId }, { status: 'error' });
    res.status(500).json({ success: false, message: msg });
  }
};

export const getBrokerStatus = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const conn = await BrokerConnection.findOne({ userId: req.userId }).select(
      '-apiKeyEncrypted -apiSecretEncrypted -accessTokenEncrypted'
    );
    if (!conn) {
      res.json({ success: true, connected: false, status: 'not_configured' });
      return;
    }
    res.json({
      success: true,
      connected: conn.status === 'connected',
      status: conn.status,
      brokerUserId: conn.brokerUserId,
      lastSyncedAt: conn.lastSyncedAt,
      tokenExpiry: conn.tokenExpiry,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const disconnectBroker = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    await BrokerConnection.updateOne(
      { userId: req.userId },
      { status: 'disconnected', accessTokenEncrypted: '' }
    );
    res.json({ success: true, message: 'Broker disconnected' });
  } catch {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
