"use client";

import { useState, useEffect, useRef } from "react";
import { TrendingUp, TrendingDown, Activity, Wifi, WifiOff } from "lucide-react";

interface PriceData {
  ltp: number | null;
  change: number;
  changePercent: number;
}

interface Prices {
  NIFTY?: PriceData;
  BANKNIFTY?: PriceData;
  FINNIFTY?: PriceData;
  SENSEX?: PriceData;
}

const INDICES = [
  { key: "NIFTY", label: "NIFTY 50", color: "bg-blue-500/20" },
  { key: "BANKNIFTY", label: "BANKNIFTY", color: "bg-purple-500/20" },
  { key: "FINNIFTY", label: "FINNIFTY", color: "bg-orange-500/20" },
  { key: "SENSEX", label: "SENSEX", color: "bg-pink-500/20" },
];

export default function LivePriceTicker() {
  const [prices, setPrices] = useState<Prices>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [brokerConnected, setBrokerConnected] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef(false); // Prevent double connection

  useEffect(() => {
    // Prevent double connection in React Strict Mode
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    const connectWebSocket = () => {
      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      // Use environment variable or default to localhost
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000/ws/prices";
      
      console.log("[WS] Connecting to:", wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] ✅ Connected to price stream");
        setWsConnected(true);
        setIsLoading(false);
        
        // Subscribe to all indices
        ws.send(JSON.stringify({
          action: "subscribe",
          indices: ["NIFTY", "BANKNIFTY", "FINNIFTY", "SENSEX"]
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === "prices") {
            setPrices(message.data);
            setBrokerConnected(message.brokerConnected);
            setLastUpdated(new Date(message.timestamp));
            if (message.brokerConnected) {
              setStatusMessage("");
            }
          }
          
          if (message.type === "status") {
            setBrokerConnected(message.brokerConnected);
            setStatusMessage(message.message);
            setPrices({}); // Clear prices when broker disconnected
          }
          
          if (message.type === "pong") {
            // Keep-alive response received
          }
        } catch (error) {
          console.error("[WS] Failed to parse message:", error);
        }
      };

      ws.onerror = (error) => {
        setWsConnected(false);
      };

      ws.onclose = () => {
        console.log("[WS] Connection closed, reconnecting...");
        setWsConnected(false);
        
        // Reconnect after 3 seconds (only if component still mounted)
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isConnectingRef.current) {
            connectWebSocket();
          }
        }, 3000);
      };
    };

    connectWebSocket();

    // Cleanup
    return () => {
      isConnectingRef.current = false; // Mark as disconnected
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "--";
    return price.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined) return "--";
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)}`;
  };

  const formatChangePercent = (percent: number | undefined) => {
    if (percent === undefined) return "--";
    const sign = percent >= 0 ? "+" : "";
    return `${sign}${percent.toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-900/80 border-b border-gray-800">
        <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span className="text-gray-400 text-sm">Connecting...</span>
      </div>
    );
  }

  // Show broker not connected message
  if (brokerConnected === false) {
    return (
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-xs">{statusMessage || "Broker not connected"}</span>
        </div>
        <a 
          href="/broker" 
          className="text-emerald-400 text-xs hover:underline"
        >
          Connect Broker →
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900/80 border-b border-gray-800">
      <div className="flex items-center gap-1">
        <Activity className="w-4 h-4 text-emerald-400" />
        <span className="text-gray-400 text-xs hidden sm:inline">Live:</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-3 overflow-x-auto scrollbar-hide">
        {INDICES.map(({ key, label, color }) => {
          const data = prices[key as keyof Prices];
          const isPositive = (data?.change || 0) >= 0;
          const hasData = data?.ltp !== null && data?.ltp !== undefined;

          return (
            <div
              key={key}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${color} border border-gray-800/50 min-w-fit`}
            >
              <span className="text-gray-400 text-xs font-medium hidden sm:inline">
                {label}
              </span>
              <span className="text-gray-400 text-xs font-medium sm:hidden">
                {key === "BANKNIFTY" ? "BNF" : key === "FINNIFTY" ? "FNF" : key}
              </span>

              {hasData ? (
                <>
                  <span className="text-white text-xs font-bold font-mono">
                    {formatPrice(data?.ltp)}
                  </span>
                  <span
                    className={`text-[10px] font-medium flex items-center gap-0.5 ${
                      isPositive ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">
                      {formatChangePercent(data?.changePercent)}
                    </span>
                    <span className="sm:hidden">
                      {formatChange(data?.changePercent)}
                    </span>
                  </span>
                </>
              ) : (
                <span className="text-gray-500 text-xs">--</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {wsConnected ? (
          <span title="WebSocket Connected">
            <Wifi className="w-4 h-4 text-emerald-400" />
          </span>
        ) : (
          <span title="WebSocket Disconnected">
            <WifiOff className="w-4 h-4 text-red-400" />
          </span>
        )}
        {lastUpdated && (
          <span className="text-gray-500 text-[10px] hidden md:inline">
            {lastUpdated.toLocaleTimeString("en-IN", { hour12: false })}
          </span>
        )}
      </div>
    </div>
  );
}
