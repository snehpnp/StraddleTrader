"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { portfolioApi, type Position } from "@/api";
import { useTheme } from "@/components/ThemeProvider";

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isDark } = useTheme();

  const fetchPositions = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await portfolioApi.getPositions();
      setPositions(data.positions || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load positions");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const totalPnL = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Positions</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Live open positions from Stoxkart</p>
        </div>
        <button onClick={fetchPositions} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] border-[#2a2a2a] text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-50 border-[#e0e0e0] text-gray-500 hover:text-[#1a1a1a]'}`}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Total P&L */}
      {positions.length > 0 && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${totalPnL >= 0 ? (isDark ? 'bg-[#33b843]/10 border-[#33b843]/30' : 'bg-[#33b843]/10 border-[#33b843]/30') : (isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200')}`}>
          {totalPnL >= 0 ? <TrendingUp className={`w-5 h-5 ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`} /> : <TrendingDown className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-500'}`} />}
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total P&L:</span>
          <span className={`text-xl font-bold ${totalPnL >= 0 ? (isDark ? 'text-[#33b843]' : 'text-[#2da33a]') : (isDark ? 'text-red-400' : 'text-red-500')}`}>
            {totalPnL >= 0 ? "+" : ""}₹{totalPnL.toFixed(2)}
          </span>
        </div>
      )}

      {error && <div className={`p-3 border rounded-lg text-sm ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-500'}`}>{error}</div>}

      {loading ? (
        <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading positions...</div>
      ) : positions.length === 0 ? (
        <div className={`border border-dashed rounded-xl p-12 text-center ${isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' : 'bg-white/60 border-[#e0e0e0]'}`}>
          <p className={`font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No open positions</p>
          <p className={`text-sm ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Activate a strategy to start trading</p>
        </div>
      ) : (
        <div className={`border rounded-xl overflow-hidden ${isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' : 'bg-white/60 border-[#e0e0e0]'}`}>
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'}`}>
                <th className={`text-left font-medium px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Symbol</th>
                <th className={`text-right font-medium px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Qty</th>
                <th className={`text-right font-medium px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Avg Price</th>
                <th className={`text-right font-medium px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>LTP</th>
                <th className={`text-right font-medium px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>P&L</th>
                <th className={`text-right font-medium px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Product</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={i} className={`border-b last:border-0 transition-colors ${isDark ? 'border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/30' : 'border-[#e0e0e0]/50 hover:bg-gray-50/50'}`}>
                  <td className={`px-4 py-3 font-mono text-xs ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>{p.tradingSymbol || p.symbol || "-"}</td>
                  <td className={`px-4 py-3 text-right ${(p.netQty ?? 0) > 0 ? (isDark ? 'text-[#33b843]' : 'text-[#2da33a]') : (isDark ? 'text-red-400' : 'text-red-500')}`}>{(p.netQty ?? 0) > 0 ? "+" : ""}{p.netQty ?? 0}</td>
                  <td className={`px-4 py-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>₹{(p.buyAvg || p.sellAvg || 0).toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>₹{(p.ltp || 0).toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${(p.pnl || 0) >= 0 ? (isDark ? 'text-[#33b843]' : 'text-[#2da33a]') : (isDark ? 'text-red-400' : 'text-red-500')}`}>
                    {(p.pnl || 0) >= 0 ? "+" : ""}₹{(p.pnl || 0).toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-right text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.product || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
