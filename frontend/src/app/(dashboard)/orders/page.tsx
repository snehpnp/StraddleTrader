"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { portfolioApi, type Order } from "@/api";

const orderStatusColor: Record<string, string> = {
  COMPLETE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  REJECTED: "text-red-400 bg-red-500/10 border-red-500/20",
  CANCELLED: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  PENDING: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  OPEN: "text-blue-400 bg-blue-500/10 border-blue-500/20",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          <h1 className="text-2xl font-bold text-white">Order Book</h1>
          <p className="text-gray-400 text-sm mt-0.5">All orders placed via StraddleTrader</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white text-sm transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>}

      {loading ? (
        <div className="text-gray-500 text-sm">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-gray-900/60 border border-gray-800 border-dashed rounded-xl p-12 text-center">
          <p className="text-gray-400 font-medium">No orders found</p>
          <p className="text-gray-600 text-sm mt-1">Orders placed by strategies will appear here</p>
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-800">
                {["Order ID", "Symbol", "Type", "Qty", "Price", "Status", "Time"].map((h) => (
                  <th key={h} className="text-left text-gray-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{o.orderId}</td>
                  <td className="px-4 py-3 text-white font-mono text-xs">{o.tradingSymbol}</td>
                  <td className={`px-4 py-3 font-semibold ${o.transactionType === "BUY" ? "text-emerald-400" : "text-red-400"}`}>{o.transactionType}</td>
                  <td className="px-4 py-3 text-gray-300">{o.quantity}</td>
                  <td className="px-4 py-3 text-gray-300">₹{o.price}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${orderStatusColor[o.status] || "text-gray-400"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{o.orderTime || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
