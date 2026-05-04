"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { portfolioApi, type Order } from "@/api";
import { useTheme } from "@/components/ThemeProvider";

const orderStatusColor = (isDark: boolean): Record<string, string> => ({
  COMPLETE: isDark 
    ? "text-[#33b843] bg-[#33b843]/10 border-[#33b843]/20" 
    : "text-[#2da33a] bg-[#33b843]/10 border-[#33b843]/20",
  REJECTED: isDark 
    ? "text-red-400 bg-red-500/10 border-red-500/20" 
    : "text-red-500 bg-red-50 border-red-200",
  CANCELLED: isDark 
    ? "text-gray-400 bg-gray-500/10 border-gray-500/20" 
    : "text-gray-500 bg-gray-100 border-gray-200",
  PENDING: isDark 
    ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
    : "text-amber-500 bg-amber-50 border-amber-200",
  OPEN: isDark 
    ? "text-blue-400 bg-blue-500/10 border-blue-500/20" 
    : "text-blue-500 bg-blue-50 border-blue-200",
});

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { isDark } = useTheme();
  const statusColors = orderStatusColor(isDark);

  const fetchOrders = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await portfolioApi.getOrders();
      setOrders(data.orders || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Order Book</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>All orders placed via StraddleTrader</p>
        </div>
        <button onClick={fetchOrders} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] border-[#2a2a2a] text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-50 border-[#e0e0e0] text-gray-500 hover:text-[#1a1a1a]'}`}>
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <div className={`p-3 border rounded-lg text-sm ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-500'}`}>{error}</div>}

      {loading ? (
        <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className={`border border-dashed rounded-xl p-12 text-center ${isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' : 'bg-white/60 border-[#e0e0e0]'}`}>
          <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No orders found</p>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Orders placed by strategies will appear here</p>
        </div>
      ) : (
        <div className={`border rounded-xl overflow-x-auto ${isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' : 'bg-white/60 border-[#e0e0e0]'}`}>
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className={`border-b ${isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'}`}>
                {["Order ID", "Symbol", "Type", "Qty", "Price", "Status", "Time"].map((h) => (
                  <th key={h} className={`text-left font-medium px-4 py-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} className={`border-b last:border-0 transition-colors ${isDark ? 'border-[#2a2a2a]/50 hover:bg-[#1a1a1a]/30' : 'border-[#e0e0e0]/50 hover:bg-gray-50/50'}`}>
                  <td className={`px-4 py-3 font-mono text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{o.orderId}</td>
                  <td className={`px-4 py-3 font-mono text-xs ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>{o.tradingSymbol}</td>
                  <td className={`px-4 py-3 font-semibold ${o.transactionType === "BUY" ? (isDark ? 'text-[#33b843]' : 'text-[#2da33a]') : (isDark ? 'text-red-400' : 'text-red-500')}`}>{o.transactionType}</td>
                  <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{o.quantity}</td>
                  <td className={`px-4 py-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>₹{o.price}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[o.status] || (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{o.orderTime || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
