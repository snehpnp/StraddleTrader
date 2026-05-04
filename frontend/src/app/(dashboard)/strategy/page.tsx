"use client";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Plus, Play, Square, LogOut, Trash2, Clock, CheckCircle, XCircle, BookOpen, Edit2, Check, X } from "lucide-react";
import { strategyApi, type Strategy } from "@/api";
import { useTheme } from "@/components/ThemeProvider";

const getStatusColors = (isDark: boolean): Record<string, string> => ({
  draft: isDark 
    ? "text-gray-400 bg-gray-500/10 border-gray-500/30" 
    : "text-gray-500 bg-gray-100 border-gray-200",
  active: isDark 
    ? "text-[#33b843] bg-[#33b843]/10 border-[#33b843]/20" 
    : "text-[#2da33a] bg-[#33b843]/10 border-[#33b843]/20",
  stopped: isDark 
    ? "text-amber-400 bg-amber-500/10 border-amber-500/20" 
    : "text-amber-500 bg-amber-50 border-amber-200",
  completed: isDark 
    ? "text-blue-400 bg-blue-500/10 border-blue-500/20" 
    : "text-blue-500 bg-blue-50 border-blue-200",
});

const statusIcons: Record<string, React.ReactNode> = {
  draft: <Clock className="w-3 h-3" />,
  active: <CheckCircle className="w-3 h-3" />,
  stopped: <XCircle className="w-3 h-3" />,
  completed: <CheckCircle className="w-3 h-3" />,
};

export default function StrategyPage() {
  const router = useRouter();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const { isDark } = useTheme();
  const statusColors = getStatusColors(isDark);

  const fetchStrategies = useCallback(async () => {
    try {
      const { data } = await strategyApi.getStrategies();
      setStrategies(data.strategies || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, [fetchStrategies]);

  const action = async (id: string, endpoint: string) => {
    setActionId(id);
    try {
      if (endpoint === "activate") {
        await strategyApi.activateStrategy(id);
      } else if (endpoint === "deactivate") {
        await strategyApi.deactivateStrategy(id);
      } else if (endpoint === "exit") {
        await strategyApi.exitStrategy(id);
      }
      await fetchStrategies();
    } catch { /* silent */ }
    finally {
      setActionId(null);
    }
  };

  const deleteStrategy = async (id: string) => {
    if (!confirm("Delete this strategy?")) return;
    setActionId(id);
    try {
      await strategyApi.deleteStrategy(id);
      await fetchStrategies();
    } catch { /* silent */ }
    finally {
      setActionId(null);
    }
  };

  const handleEdit = async (id: string, newName: string) => {
    try {
      const strategy = strategies.find(s => s._id === id);
      if (!strategy) return;
      
      await strategyApi.updateStrategy(id, { ...strategy, name: newName });
      await fetchStrategies();
      setEditingId(null);
    } catch {
      /* silent */
    }
  };

  const startEdit = (s: Strategy) => {
    setEditingId(s._id);
    setEditName(s.name);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Strategies</h1>
          <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Manage and monitor your algo strategies</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/strategy/learn" className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] border-[#2a2a2a] text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-50 border-[#e0e0e0] text-gray-500 hover:text-[#1a1a1a]'}`}>
            <BookOpen className="w-4 h-4" /> Learn
          </Link>
          <Link href="/strategy/new" className="flex items-center gap-2 px-4 py-2 bg-[#33b843] hover:bg-[#2da33a] text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-[#33b843]/20">
            <Plus className="w-4 h-4" /> Create Strategy
          </Link>
        </div>
      </div>

      {loading ? (
        <div className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading strategies...</div>
      ) : strategies.length === 0 ? (
        <div className={`border border-dashed rounded-xl p-12 text-center ${isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' : 'bg-white/60 border-[#e0e0e0]'}`}>
          <Zap className={`w-10 h-10 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
          <p className={`font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>No strategies yet</p>
          <p className={`text-sm mb-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>Create your first options strategy</p>
          <Link href="/strategy/new" className="inline-flex items-center gap-2 px-4 py-2 bg-[#33b843] hover:bg-[#2da33a] text-white rounded-lg text-sm font-semibold transition-all">
            <Plus className="w-4 h-4" /> Create Strategy
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {strategies.map((s) => (
            <div key={s._id} className={`group border rounded-xl p-4 transition-all ${isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a] hover:border-[#333]' : 'bg-white/60 border-[#e0e0e0] hover:border-[#ccc]'}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Name + Type */}
                  <div className="flex items-center gap-2 mb-1">
                    {editingId === s._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`border rounded px-2 py-1 text-sm w-48 ${isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white' : 'bg-white border-[#e0e0e0] text-[#1a1a1a]'}`}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEdit(s._id, editName);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleEdit(s._id, editName)}
                          className={`p-1 ${isDark ? 'text-[#33b843] hover:text-[#2da33a]' : 'text-[#2da33a] hover:text-[#33b843]'}`}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className={`p-1 ${isDark ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-400'}`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>{s.name}</span>
                        <button
                          onClick={() => startEdit(s)}
                          className={`p-1 opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-gray-500 hover:text-[#33b843]' : 'text-gray-400 hover:text-[#2da33a]'}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusColors[s.status] || "text-gray-400"}`}>
                      {statusIcons[s.status]} {s.status.toUpperCase()}
                    </span>
                    <span className={`px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-500'}`}>
                      {s.config?.direction === "long" ? "BUY" : "SELL"} {s.strategyType === 'strangle' ? 'Strangle' : 'Straddle'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                    <span><span className="text-gray-400">Underlying:</span> {s.config?.underlying || s.config?.symbol || '-'}</span>
                    <span><span className="text-gray-400">Expiry:</span> {s.config?.expiry || '-'}</span>
                    <span><span className="text-gray-400">Lots:</span> {s.config?.quantityLots ?? '-'}</span>
                    <span className={(s.currentPnL ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}>
                      P&L: {(s.currentPnL ?? 0) >= 0 ? "+" : ""}₹{(s.currentPnL ?? 0).toFixed(2)}
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
