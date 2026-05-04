"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Activity,
  Zap, BarChart3, RefreshCw, AlertCircle
} from "lucide-react";
import { brokerApi } from "@/api";
import { useTheme } from "@/components/ThemeProvider";

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
  const { isDark } = useTheme();
  
  const getCardClass = () => isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' : 'bg-white/60 border-[#e0e0e0]';
  const getCardHover = () => isDark ? 'hover:border-[#33b843]/40' : 'hover:border-[#33b843]/40';
  const getTextClass = () => isDark ? 'text-white' : 'text-[#1a1a1a]';
  const getSecondaryText = () => isDark ? 'text-gray-400' : 'text-[#666666]';
  const getMutedText = () => isDark ? 'text-gray-500' : 'text-[#999999]';

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await brokerApi.getBrokerStatus();
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
    emerald: isDark 
      ? "bg-[#33b843]/15 text-[#33b843] border-[#33b843]/20" 
      : "bg-[#33b843]/10 text-[#2da33a] border-[#33b843]/20",
    blue: isDark 
      ? "bg-blue-500/15 text-blue-400 border-blue-500/20" 
      : "bg-blue-500/10 text-blue-500 border-blue-500/20",
    purple: isDark 
      ? "bg-purple-500/15 text-purple-400 border-purple-500/20" 
      : "bg-purple-500/10 text-purple-500 border-purple-500/20",
    orange: isDark 
      ? "bg-amber-500/15 text-amber-400 border-amber-500/20" 
      : "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${getTextClass()}`}>Dashboard</h1>
          <p className={`${getSecondaryText()} text-sm mt-0.5`}>Welcome back! Here's your trading overview.</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] border-[#2a2a2a] text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-50 border-[#e0e0e0] text-gray-500 hover:text-[#1a1a1a]'} border`}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Broker Status Banner */}
      {!loading && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
          brokerStatus?.connected
            ? (isDark ? "bg-[#33b843]/10 border-[#33b843]/30 text-[#33b843]" : "bg-[#33b843]/10 border-[#33b843]/30 text-[#2da33a]")
            : (isDark ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-500")
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
                <a href="/broker" className={`underline font-medium ${isDark ? 'hover:text-amber-300' : 'hover:text-amber-600'}`}>
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
            className={`border rounded-xl p-5 transition-colors ${getCardClass()} ${getCardHover()}`}
          >
            <div className="flex items-start justify-between mb-4">
              <span className={`text-sm font-medium ${getSecondaryText()}`}>{s.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colorMap[s.color]}`}>
                {s.icon}
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className={`text-2xl font-bold ${getTextClass()}`}>{s.value}</span>
              {s.up !== undefined && (
                <span className={`text-xs font-medium mb-1 flex items-center gap-0.5 ${s.up ? (isDark ? "text-[#33b843]" : "text-[#2da33a]") : (isDark ? "text-red-400" : "text-red-500")}`}>
                  {s.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  Today
                </span>
              )}
            </div>
            <p className={`text-xs mt-1 ${getMutedText()}`}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a href="/broker" className={`group border rounded-xl p-5 transition-all cursor-pointer ${getCardClass()} ${isDark ? 'hover:border-[#33b843]/40' : 'hover:border-[#33b843]/40'}`}>
          <div className={`w-10 h-10 border rounded-lg flex items-center justify-center mb-3 ${isDark ? 'bg-[#33b843]/15 border-[#33b843]/20' : 'bg-[#33b843]/10 border-[#33b843]/20'}`}>
            <Activity className={`w-5 h-5 ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`} />
          </div>
          <h3 className={`font-semibold text-sm mb-1 ${getTextClass()}`}>Connect Broker</h3>
          <p className={`text-xs ${getMutedText()}`}>Link your Stoxkart account via API keys</p>
        </a>

        <a href="/strategy/new" className={`group border rounded-xl p-5 transition-all cursor-pointer ${getCardClass()} hover:border-blue-500/40`}>
          <div className={`w-10 h-10 border rounded-lg flex items-center justify-center mb-3 ${isDark ? 'bg-blue-500/15 border-blue-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
            <Zap className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
          </div>
          <h3 className={`font-semibold text-sm mb-1 ${getTextClass()}`}>New Strategy</h3>
          <p className={`text-xs ${getMutedText()}`}>Create an ATM Straddle (Long or Short)</p>
        </a>

        <a href="/positions" className={`group border rounded-xl p-5 transition-all cursor-pointer ${getCardClass()} hover:border-purple-500/40`}>
          <div className={`w-10 h-10 border rounded-lg flex items-center justify-center mb-3 ${isDark ? 'bg-purple-500/15 border-purple-500/20' : 'bg-purple-500/10 border-purple-500/20'}`}>
            <BarChart3 className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
          </div>
          <h3 className={`font-semibold text-sm mb-1 ${getTextClass()}`}>View Positions</h3>
          <p className={`text-xs ${getMutedText()}`}>Monitor live P&L on open legs</p>
        </a>
      </div>

      {/* Disclaimer */}
      <div className={`border rounded-xl p-4 text-xs ${isDark ? 'bg-[#141414]/40 border-[#2a2a2a] text-gray-500' : 'bg-gray-50/60 border-[#e0e0e0] text-gray-500'}`}>
        ⚠️ <strong className={isDark ? 'text-gray-400' : 'text-gray-600'}>Risk Disclaimer:</strong> Algorithmic trading involves substantial risk of capital loss. Ensure you understand the strategy before activating. This platform is for a single user only.
      </div>
    </div>
  );
}
