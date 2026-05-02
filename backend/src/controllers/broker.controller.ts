import { Request, Response } from 'express';
import BrokerConnection from '../models/BrokerConnection';
import { encrypt, decrypt } from '../services/encryption.service';
import { StoxkartService, STOXKART_LOGIN_URL } from '../services/stoxkart.service';
import { feedService } from '../services/feed.service';

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

export const getLoginUrl = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const conn = await BrokerConnection.findOne({ userId: req.userId });
    if (!conn) {
      res.status(404).json({ success: false, message: 'Credentials not found. Save them first.' });
      return;
    }
    const apiKey = decrypt(conn.apiKeyEncrypted);
    const url = STOXKART_LOGIN_URL(apiKey);
    res.json({ success: true, url });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to generate login URL' });
  }
};

export const connectBroker = async (req: AuthReq, res: Response): Promise<void> => {
  try {
    const { authToken } = req.body;
    if (!authToken) {
      res.status(400).json({ success: false, message: 'Auth token (request_token) is required from redirect' });
      return;
    }

    const conn = await BrokerConnection.findOne({ userId: req.userId });
    if (!conn) {
      res.status(404).json({ success: false, message: 'Credentials not found. Save them first.' });
      return;
    }
    const apiKey = decrypt(conn.apiKeyEncrypted);
    const apiSecret = decrypt(conn.apiSecretEncrypted);

    const sessionData = await StoxkartService.generateSession(apiKey, apiSecret, authToken);
    
    // According to docs, data comes inside sessionData.data
    const tokenData = sessionData.data;
    if (!tokenData?.access_token) {
        throw new Error(sessionData.message || 'Failed to get access token');
    }

    await BrokerConnection.updateOne(
      { userId: req.userId },
      {
        accessTokenEncrypted: encrypt(tokenData.access_token),
        feedTokenEncrypted: tokenData.feed_token ? encrypt(tokenData.feed_token) : undefined,
        brokerUserId: tokenData.user_id || '',
        status: 'connected',
        lastSyncedAt: new Date(),
        tokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }
    );

    // Start WebSocket connection for live price streaming
    if (tokenData.feed_token) {
      feedService.connect(tokenData.feed_token, apiKey);
      console.log(`[Broker] 🔌 WebSocket started for user ${req.userId}`);
    }

    res.json({ success: true, message: 'Broker connected successfully', user: tokenData.user_name });
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
