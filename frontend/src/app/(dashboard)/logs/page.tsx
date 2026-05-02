"use client";
import { useEffect, useState } from "react";
import { RefreshCw, FileText } from "lucide-react";
import { portfolioApi, type Log } from "@/api";

const actionColors: Record<string, string> = {
  ENTRY: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  EXIT: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  SL_HIT: "text-red-400 bg-red-500/10 border-red-500/20",
  TARGET_HIT: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  ERROR: "text-red-400 bg-red-500/10 border-red-500/20",
  INFO: "text-gray-400 bg-gray-500/10 border-gray-500/20",
  MANUAL_EXIT: "text-amber-400 bg-amber-500/10 border-amber-500/20",
};

export default function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await portfolioApi.getLogs();
      setLogs(data.logs || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-gray-400 text-sm mt-0.5">All strategy actions and system events</p>
        </div>
        <button onClick={fetchLogs} className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-400 hover:text-white text-sm transition-all">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-gray-500 text-sm">Loading logs...</div>
      ) : logs.length === 0 ? (
        <div className="bg-gray-900/60 border border-gray-800 border-dashed rounded-xl p-12 text-center">
          <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No audit logs yet</p>
          <p className="text-gray-600 text-sm mt-1">Strategy actions will be logged here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log._id} className="bg-gray-900/60 border border-gray-800 rounded-xl px-4 py-3 flex items-start gap-4">
              <span className={`mt-0.5 px-2 py-0.5 rounded-full text-xs font-medium border flex-shrink-0 ${actionColors[log.action] || "text-gray-400"}`}>
                {log.action}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm">{log.message}</p>
                {log.pnl !== undefined && (
                  <p className={`text-xs mt-0.5 ${log.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    P&L: {log.pnl >= 0 ? "+" : ""}₹{log.pnl.toFixed(2)}
                  </p>
                )}
              </div>
              <span className="text-gray-600 text-xs flex-shrink-0">
                {new Date(log.executedAt).toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
