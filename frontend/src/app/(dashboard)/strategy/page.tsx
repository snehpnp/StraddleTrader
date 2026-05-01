"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Plus, Play, Square, LogOut, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

interface Strategy {
  _id: string;
  name: string;
  strategyType: string;
  status: string;
  config: {
    underlying: string;
    expiry: string;
    direction: string;
    quantityLots: number;
  };
  currentPnL: number;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  draft: "text-gray-400 bg-gray-500/10 border-gray-500/30",
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  stopped: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  completed: "text-blue-400 bg-blue-500/10 border-blue-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="w-3 h-3" />,
  active: <CheckCircle className="w-3 h-3" />,
  stopped: <XCircle className="w-3 h-3" />,
  completed: <CheckCircle className="w-3 h-3" />,
};

export default function StrategyPage() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const getToken = () => localStorage.getItem("token") || "";
  const headers = { Authorization: `Bearer ${getToken()}` };

  const fetchStrategies = async () => {
    try {
      const res = await fetch(`${API}/api/strategy`, { headers });
      const data = await res.json();
      setStrategies(data.strategies || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStrategies(); }, []);

  const action = async (id: string, endpoint: string) => {
    setActionId(id);
    await fetch(`${API}/api/strategy/${id}/${endpoint}`, { method: "POST", headers });
    await fetchStrategies();
    setActionId(null);
  };

  const deleteStrategy = async (id: string) => {
    if (!confirm("Delete this strategy?")) return;
    setActionId(id);
    await fetch(`${API}/api/strategy/${id}`, { method: "DELETE", headers });
    await fetchStrategies();
    setActionId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Strategies</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage your algo trading strategies</p>
        </div>
        <Link
          href="/strategy/new"
          id="new-strategy-btn"
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" /> New Strategy
        </Link>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading strategies...</div>
      ) : strategies.length === 0 ? (
        <div className="bg-gray-900/60 border border-gray-800 border-dashed rounded-xl p-12 text-center">
          <Zap className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium mb-1">No strategies yet</p>
          <p className="text-gray-600 text-sm mb-5">Create your first ATM Straddle strategy</p>
          <Link href="/strategy/new" className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Create Strategy
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {strategies.map((s) => (
            <div key={s._id} className="bg-gray-900/60 border border-gray-800 hover:border-gray-700 rounded-xl p-5 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-white font-semibold">{s.name}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[s.status] || "text-gray-400"}`}>
                      {statusIcons[s.status]} {s.status.toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs">
                      {s.config.direction === "long" ? "Long" : "Short"} Straddle
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span><span className="text-gray-400">Underlying:</span> {s.config.underlying}</span>
                    <span><span className="text-gray-400">Expiry:</span> {s.config.expiry}</span>
                    <span><span className="text-gray-400">Lots:</span> {s.config.quantityLots}</span>
                    <span className={s.currentPnL >= 0 ? "text-emerald-400" : "text-red-400"}>
                      P&L: {s.currentPnL >= 0 ? "+" : ""}₹{s.currentPnL.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.status === "draft" || s.status === "stopped" ? (
                    <button
                      onClick={() => action(s._id, "activate")}
                      disabled={actionId === s._id}
                      title="Activate"
                      className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition-all disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  ) : s.status === "active" ? (
                    <>
                      <button onClick={() => action(s._id, "deactivate")} disabled={actionId === s._id} title="Stop"
                        className="p-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg transition-all disabled:opacity-50">
                        <Square className="w-4 h-4" />
                      </button>
                      <button onClick={() => action(s._id, "exit")} disabled={actionId === s._id} title="Exit All Positions"
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all disabled:opacity-50">
                        <LogOut className="w-4 h-4" />
                      </button>
                    </>
                  ) : null}
                  {(s.status === "draft" || s.status === "stopped" || s.status === "completed") && (
                    <button onClick={() => deleteStrategy(s._id)} disabled={actionId === s._id} title="Delete"
                      className="p-2 bg-gray-800 hover:bg-red-500/10 border border-gray-700 hover:border-red-500/30 text-gray-500 hover:text-red-400 rounded-lg transition-all disabled:opacity-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
