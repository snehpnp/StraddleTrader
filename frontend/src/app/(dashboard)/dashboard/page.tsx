"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Activity,
  Zap, BarChart3, RefreshCw, AlertCircle
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface BrokerStatus {
  connected: boolean;
  status: string;
  brokerUserId?: string;
}

interface StatCard {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  up?: boolean;
}

export default function DashboardPage() {
  const [brokerStatus, setBrokerStatus] = useState<BrokerStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => typeof window !== "undefined" ? localStorage.getItem("token") || "" : "";

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API}/api/broker/status`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        setBrokerStatus(data);
      } catch {
        setBrokerStatus({ connected: false, status: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const stats: StatCard[] = [
    {
      label: "Available Margin",
      value: "₹ --",
      sub: "Fetch after broker connect",
      color: "emerald",
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      label: "Day P&L",
      value: "₹ 0.00",
      sub: "No active positions",
      color: "blue",
      icon: <TrendingUp className="w-5 h-5" />,
      up: true,
    },
    {
      label: "Open Positions",
      value: "0",
      sub: "No legs open",
      color: "purple",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      label: "Active Strategies",
      value: "0",
      sub: "Create a strategy to begin",
      color: "orange",
      icon: <Zap className="w-5 h-5" />,
    },
  ];

  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    purple: "bg-purple-500/15 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/15 text-orange-400 border-orange-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Welcome back! Here's your trading overview.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white text-sm transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Broker Status Banner */}
      {!loading && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
          brokerStatus?.connected
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
        }`}>
          {brokerStatus?.connected ? (
            <>
              <Activity className="w-4 h-4 flex-shrink-0" />
              <span>Stoxkart broker is <strong>connected</strong>. User ID: {brokerStatus.brokerUserId || "N/A"}</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>
                Broker not connected.{" "}
                <a href="/broker" className="underline font-medium hover:text-amber-300">
                  Connect Stoxkart →
                </a>
              </span>
            </>
          )}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-gray-400 text-sm font-medium">{s.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colorMap[s.color]}`}>
                {s.icon}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-white">{s.value}</span>
              {s.up !== undefined && (
                <span className={`text-xs font-medium mb-1 flex items-center gap-0.5 ${s.up ? "text-emerald-400" : "text-red-400"}`}>
                  {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  Today
                </span>
              )}
            </div>
            <p className="text-gray-500 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/broker" className="group bg-gray-900/60 border border-gray-800 hover:border-emerald-500/40 rounded-xl p-5 transition-all cursor-pointer">
          <div className="w-10 h-10 bg-emerald-500/15 border border-emerald-500/20 rounded-lg flex items-center justify-center mb-3">
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-white font-semibold text-sm mb-1">Connect Broker</h3>
          <p className="text-gray-500 text-xs">Link your Stoxkart account via API keys</p>
        </a>

        <a href="/strategy/new" className="group bg-gray-900/60 border border-gray-800 hover:border-blue-500/40 rounded-xl p-5 transition-all cursor-pointer">
          <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/20 rounded-lg flex items-center justify-center mb-3">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-white font-semibold text-sm mb-1">New Strategy</h3>
          <p className="text-gray-500 text-xs">Create an ATM Straddle (Long or Short)</p>
        </a>

        <a href="/positions" className="group bg-gray-900/60 border border-gray-800 hover:border-purple-500/40 rounded-xl p-5 transition-all cursor-pointer">
          <div className="w-10 h-10 bg-purple-500/15 border border-purple-500/20 rounded-lg flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-purple-400" />
          </div>
          <h3 className="text-white font-semibold text-sm mb-1">View Positions</h3>
          <p className="text-gray-500 text-xs">Monitor live P&L on open legs</p>
        </a>
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 text-xs text-gray-500">
        ⚠️ <strong className="text-gray-400">Risk Disclaimer:</strong> Algorithmic trading involves substantial risk of capital loss. Ensure you understand the strategy before activating. This platform is for a single user only.
      </div>
    </div>
  );
}
