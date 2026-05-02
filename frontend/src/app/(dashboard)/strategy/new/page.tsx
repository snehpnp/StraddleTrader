"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { marketApi, strategyApi } from "@/api";

const SYMBOLS = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "SENSEX"];
const STRIKE_STEPS: Record<string, number> = {
  NIFTY: 50, BANKNIFTY: 100, FINNIFTY: 50, MIDCPNIFTY: 25, SENSEX: 100,
};

export default function NewStrategyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expiries, setExpiries] = useState<string[]>([]);
  const [lotSize, setLotSize] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "My ATM Straddle",
    symbol: "NIFTY",
    expiry: "",
    direction: "short" as "long" | "short",
    quantityLots: 1,
    entryTime: "09:20",
    slPoints: 50,
    targetPoints: 100,
    maxLoss: 5000,
    squareOffTime: "15:20",
  });

  useEffect(() => {
    const fetchExpiriesAndLotSize = async () => {
      try {
        // Fetch expiries for selected symbol
        const expiriesRes = await marketApi.getExpiries(form.symbol);
        if (expiriesRes.data.expiries?.length) {
          setExpiries(expiriesRes.data.expiries);
          setForm((f) => ({ ...f, expiry: expiriesRes.data.expiries[0] }));
        }

        // Fetch lot size for selected symbol
        const lotSizeRes = await marketApi.getLotSize(form.symbol);
        setLotSize(lotSizeRes.data.lotSize);
      } catch {
        // Broker might not be connected — use manual input
        setLotSize(null);
      }
    };
    fetchExpiriesAndLotSize();
  }, [form.symbol]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await strategyApi.createStrategy({
        name: form.name,
        strategyType: "straddle",
        config: {
          symbol: form.symbol,
          underlying: form.symbol,
          expiry: form.expiry,
          direction: form.direction,
          quantityLots: form.quantityLots,
          lotSize: lotSize,
          entryTime: form.entryTime,
          slPoints: form.slPoints,
          targetPoints: form.targetPoints,
          maxLoss: form.maxLoss,
          squareOffTime: form.squareOffTime,
          strikeStep: STRIKE_STEPS[form.symbol] || 50,
        },
      });
      router.push("/strategy");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create strategy");
    } finally { setLoading(false); }
  };

  const field = (label: React.ReactNode, children: React.ReactNode) => (
    <div>
      <label className="block text-sm text-gray-400 mb-1.5">{label}</label>
      {children}
    </div>
  );

  const inputClass = "w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm";
  const selectClass = inputClass + " cursor-pointer";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">New Strategy</h1>
          <p className="text-gray-400 text-sm">Configure your ATM Straddle</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900/60 border border-gray-800 rounded-xl p-6 space-y-5">
        {/* Strategy Name */}
        {field("Strategy Name",
          <input id="strategy-name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} placeholder="My ATM Straddle" />
        )}

        <div className="grid grid-cols-2 gap-4">
          {/* Symbol */}
          {field("Symbol",
            <select id="strategy-symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className={selectClass}>
              {SYMBOLS.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* Direction */}
          {field("Direction",
            <select id="strategy-direction" value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value as "long" | "short" })} className={selectClass}>
              <option value="short">Short Straddle (Sell CE+PE)</option>
              <option value="long">Long Straddle (Buy CE+PE)</option>
            </select>
          )}

          {/* Expiry */}
          {field("Expiry Date",
            expiries.length > 0
              ? <select id="strategy-expiry" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className={selectClass}>
                  {expiries.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              : <input id="strategy-expiry-input" type="date" required value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className={inputClass} />
          )}

          {/* Lots with Lot Size Info */}
          {field(
            <span className="flex items-center gap-2">
              Quantity (Lots)
              {lotSize && (
                <span className="text-xs text-emerald-400 font-normal">
                  (1 Lot = {lotSize} Qty)
                </span>
              )}
            </span>,
            <input id="strategy-lots" type="number" min={1} required value={form.quantityLots} onChange={(e) => setForm({ ...form, quantityLots: +e.target.value })} className={inputClass} />
          )}

          {/* Entry Time */}
          {field("Entry Time",
            <input id="strategy-entry-time" type="time" value={form.entryTime} onChange={(e) => setForm({ ...form, entryTime: e.target.value })} className={inputClass} />
          )}

          {/* Square Off Time */}
          {field("Auto Square-off Time",
            <input id="strategy-squareoff" type="time" value={form.squareOffTime} onChange={(e) => setForm({ ...form, squareOffTime: e.target.value })} className={inputClass} />
          )}
        </div>

        {/* Risk Management */}
        <div className="border-t border-gray-800 pt-4">
          <p className="text-white text-sm font-semibold mb-3">Risk Management</p>
          <div className="grid grid-cols-3 gap-4">
            {field("SL Points",
              <input id="strategy-sl" type="number" min={0} value={form.slPoints} onChange={(e) => setForm({ ...form, slPoints: +e.target.value })} className={inputClass} />
            )}
            {field("Target Points",
              <input id="strategy-target" type="number" min={0} value={form.targetPoints} onChange={(e) => setForm({ ...form, targetPoints: +e.target.value })} className={inputClass} />
            )}
            {field("Max Loss (₹)",
              <input id="strategy-maxloss" type="number" min={0} value={form.maxLoss} onChange={(e) => setForm({ ...form, maxLoss: +e.target.value })} className={inputClass} />
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-all">
            Cancel
          </button>
          <button id="create-strategy-submit" type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Create Strategy"}
          </button>
        </div>
      </form>
    </div>
  );
}
