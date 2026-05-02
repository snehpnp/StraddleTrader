import { Server as HTTPServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { feedService } from './feed.service';
import BrokerConnection from '../models/BrokerConnection';

/**
 * ClientWebSocketServer - Broadcasts live prices to frontend clients
 * 
 * This is separate from the Stoxkart WebSocket (feed.service.ts)
 * This server pushes prices from backend → frontend clients
 */

interface ClientConnection {
  ws: WebSocket;
  subscribedIndices: string[];
  isAlive: boolean;
}

class ClientWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private broadcastInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize WebSocket server on HTTP server
   */
  init(httpServer: HTTPServer): void {
    this.wss = new WebSocketServer({ 
      server: httpServer,
      path: '/ws/prices' // Clients connect to ws://localhost:5000/ws/prices
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[WS] 🔌 Client connected');
      
      const client: ClientConnection = {
        ws,
        subscribedIndices: ['NIFTY', 'BANKNIFTY', 'FINNIFTY', 'SENSEX'],
        isAlive: true,
      };
      
      this.clients.set(ws, client);

      // Send immediate price update
      this.sendPricesToClient(client);

      // Handle pong (keep-alive)
      ws.on('pong', () => {
        client.isAlive = true;
      });

      // Handle client messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.action === 'subscribe' && message.indices) {
            client.subscribedIndices = message.indices;
            console.log('[WS] 📡 Client subscribed to:', message.indices);
          }
          
          if (message.action === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
        } catch (error) {
          console.error('[WS] Invalid message:', error);
        }
      });

      // Handle close
      ws.on('close', () => {
        console.log('[WS] 🔌 Client disconnected');
        this.clients.delete(ws);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error('[WS] Client error:', error);
        this.clients.delete(ws);
      });
    });

    // Start price broadcasting
    this.startBroadcasting();
    
    // Start keep-alive check
    this.startKeepAlive();

    console.log('[WS] ✅ Client WebSocket server ready on /ws/prices');
  }

  /**
   * Send current prices to a specific client
   */
  private async sendPricesToClient(client: ClientConnection): Promise<void> {
    if (client.ws.readyState !== WebSocket.OPEN) return;

    // Check if any broker is connected
    const brokerConn = await BrokerConnection.findOne({ status: 'connected' });
    const isBrokerConnected = !!brokerConn;

    if (!isBrokerConnected) {
      // Send broker not connected status
      client.ws.send(JSON.stringify({
        type: 'status',
        brokerConnected: false,
        message: 'Broker not connected. Please connect your Stoxkart account to see live prices.',
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    // Check if feed service is connected to Stoxkart
    if (!feedService.isWebSocketConnected()) {
      // Try to reconnect feed service if broker is connected but feed is not
      if (brokerConn.feedTokenEncrypted) {
        const { decrypt } = await import('./encryption.service');
        const feedToken = decrypt(brokerConn.feedTokenEncrypted);
        const apiKey = decrypt(brokerConn.apiKeyEncrypted);
        feedService.connect(feedToken, apiKey);
      }
    }

    const prices: Record<string, { ltp: number | null; change: number; changePercent: number }> = {};
    
    for (const symbol of client.subscribedIndices) {
      const data = feedService.getPriceData(symbol as any);
      prices[symbol] = {
        ltp: data?.ltp || null,
        change: data?.change || 0,
        changePercent: data?.changePercent || 0,
      };
    }

    client.ws.send(JSON.stringify({
      type: 'prices',
      data: prices,
      brokerConnected: true,
      wsConnected: feedService.isWebSocketConnected(),
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * Broadcast prices to all connected clients
   */
  private async broadcastPrices(): Promise<void> {
    for (const client of this.clients.values()) {
      await this.sendPricesToClient(client);
    }
  }

  /**
   * Start broadcasting prices every 1 second (when WebSocket connected)
   */
  private startBroadcasting(): void {
    this.broadcastInterval = setInterval(() => {
      if (this.clients.size > 0) {
        this.broadcastPrices().catch(console.error);
      }
    }, 1000); // 1 second updates
  }

  /**
   * Keep-alive check - disconnect dead clients
   */
  private startKeepAlive(): void {
    const interval = setInterval(() => {
      for (const [ws, client] of this.clients.entries()) {
        if (!client.isAlive) {
          ws.terminate();
          this.clients.delete(ws);
          continue;
        }
        
        client.isAlive = false;
        ws.ping();
      }
    }, 30000); // Check every 30 seconds

    // Clean up on process exit
    process.on('SIGTERM', () => clearInterval(interval));
    process.on('SIGINT', () => clearInterval(interval));
  }

  /**
   * Get connected client count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Stop the server
   */
  stop(): void {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }
    
    for (const [ws] of this.clients) {
      ws.close();
    }
    
    this.clients.clear();
    this.wss?.close();
  }
}

export const clientWebSocketServer = new ClientWebSocketServer();
