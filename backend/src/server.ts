/// <reference types="node" />
import dotenv from 'dotenv';
dotenv.config();

import { createServer } from 'http';
import app from './app';
import { instrumentService } from './services/instrument.service';
import { strategyEngine } from './services/engine.service';
import { clientWebSocketServer } from './services/websocket.server';

const PORT = process.env.PORT || 5000;

// Create HTTP server for Express + WebSocket
const httpServer = createServer(app);

// Initialize client WebSocket server (for frontend)
clientWebSocketServer.init(httpServer);

httpServer.listen(PORT, async () => {
  console.log(`🚀 StraddleTrader Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔌 WebSocket ready on ws://localhost:${PORT}/ws/prices`);
  
  // Load instruments in background
  await instrumentService.loadMaster();
  
  // Check if any broker is already connected and start feed service
  const { feedService } = await import('./services/feed.service');
  const { decrypt } = await import('./services/encryption.service');
  const BrokerConnection = (await import('./models/BrokerConnection')).default;
  
  const brokerConn = await BrokerConnection.findOne({ status: 'connected' });
  if (brokerConn && brokerConn.feedTokenEncrypted) {
    try {
      const feedToken = decrypt(brokerConn.feedTokenEncrypted);
      const apiKey = decrypt(brokerConn.apiKeyEncrypted);
      feedService.connect(feedToken, apiKey);
      console.log(`[Server] 🔌 Auto-started feed service for connected broker`);
    } catch (error) {
      console.error('[Server] Failed to auto-start feed service:', error);
    }
  }
});

