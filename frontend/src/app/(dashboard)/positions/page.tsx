"use client";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { portfolioApi, type Position } from "@/api";

export default function PositionsPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <h1 className="text-2xl font-bold text-white">Positions</h1>
          <p className="text-gray-400 text-sm mt-0.5">Live open positions from Stoxkart</p>
        </div>
        <button onClick={fetchPositions} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white text-sm transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Total P&L */}
      {positions.length > 0 && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${totalPnL >= 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
          {totalPnL >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-400" /> : <TrendingDown className="w-5 h-5 text-red-400" />}
          <span className="text-gray-400 text-sm">Total P&L:</span>
          <span className={`text-xl font-bold ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {totalPnL >= 0 ? "+" : ""}₹{totalPnL.toFixed(2)}
          </span>
        </div>
      )}

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading positions...</div>
      ) : positions.length === 0 ? (
        <div className="bg-gray-900/60 border border-gray-800 border-dashed rounded-xl p-12 text-center">
          <p className="text-gray-400 font-medium mb-1">No open positions</p>
          <p className="text-gray-600 text-sm">Activate a strategy to start trading</p>
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left text-gray-500 font-medium px-4 py-3">Symbol</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">Qty</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">Avg Price</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">LTP</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">P&L</th>
                <th className="text-right text-gray-500 font-medium px-4 py-3">Product</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((p, i) => (
                <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 text-white font-mono text-xs">{p.tradingSymbol || p.symbol || "-"}</td>
                  <td className={`px-4 py-3 text-right ${(p.netQty ?? 0) > 0 ? "text-emerald-400" : "text-red-400"}`}>{(p.netQty ?? 0) > 0 ? "+" : ""}{p.netQty ?? 0}</td>
                  <td className="px-4 py-3 text-right text-gray-300">₹{(p.buyAvg || p.sellAvg || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-gray-300">₹{(p.ltp || 0).toFixed(2)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${(p.pnl || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {(p.pnl || 0) >= 0 ? "+" : ""}₹{(p.pnl || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500 text-xs">{p.product || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
