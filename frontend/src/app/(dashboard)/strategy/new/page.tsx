"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { marketApi, strategyApi } from "@/api";
import { useTheme } from "@/components/ThemeProvider";

const SYMBOLS = ["NIFTY", "BANKNIFTY", "FINNIFTY", "MIDCPNIFTY", "SENSEX"];
const STRIKE_STEPS: Record<string, number> = {
  NIFTY: 50, BANKNIFTY: 100, FINNIFTY: 50, MIDCPNIFTY: 25, SENSEX: 100,
};

function getInitialFormState() {
  // Read URL params synchronously during render (safe)
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const type = params?.get('type');
  
  if (type === 'strangle') {
    return {
      name: "My OTM Strangle",
      symbol: "NIFTY",
      strategyType: "strangle" as "straddle" | "strangle",
      expiry: "",
      direction: "short" as "long" | "short",
      quantityLots: 1,
      entryTime: "09:20",
      slPoints: 50,
      targetPoints: 100,
      maxLoss: 5000,
      squareOffTime: "15:20",
    };
  }
  
  return {
    name: "My ATM Straddle",
    symbol: "NIFTY",
    strategyType: "straddle" as "straddle" | "strangle",
    expiry: "",
    direction: "short" as "long" | "short",
    quantityLots: 1,
    entryTime: "09:20",
    slPoints: 50,
    targetPoints: 100,
    maxLoss: 5000,
    squareOffTime: "15:20",
  };
}

export default function NewStrategyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { isDark } = useTheme();
  
  const getCardClass = () => isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' : 'bg-white/60 border-[#e0e0e0]';
  const getInputClass = () => isDark
    ? 'w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-lg px-3 py-2 text-white outline-none focus:border-[#33b843] border'
    : 'w-full bg-white border-[#e0e0e0] rounded-lg px-3 py-2 text-[#1a1a1a] outline-none focus:border-[#33b843] border';
  const getSelectClass = () => isDark
    ? 'w-full bg-[#1a1a1a] border-[#2a2a2a] rounded-lg px-3 py-2 text-white outline-none focus:border-[#33b843] border'
    : 'w-full bg-white border-[#e0e0e0] rounded-lg px-3 py-2 text-[#1a1a1a] outline-none focus:border-[#33b843] border';
  const [error, setError] = useState("");
  const [expiries, setExpiries] = useState<string[]>([]);
  const [lotSize, setLotSize] = useState<number | null>(null);

  const [form, setForm] = useState(getInitialFormState);

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
        strategyType: form.strategyType,
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
      <label className={`block text-sm mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</label>
      {children}
    </div>
  );

  const inputClass = "w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition-colors text-sm";
  const selectClass = inputClass + " cursor-pointer";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className={`p-2 rounded-lg transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-50 text-gray-500 hover:text-[#1a1a1a] border border-[#e0e0e0]'}`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>New Strategy</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Configure your {form.strategyType === 'straddle' ? 'ATM Straddle' : 'OTM Strangle'}</p>
        </div>
      </div>

      {error && (
        <div className={`p-3 border rounded-lg text-sm ${isDark ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-red-50 border-red-200 text-red-500'}`}>{error}</div>
      )}

      <form onSubmit={handleSubmit} className={`border rounded-xl p-6 space-y-5 ${getCardClass()}`}>
        {/* Strategy Type & Name */}
        <div className="grid grid-cols-2 gap-4">
          {field("Strategy Type",
            <select 
              id="strategy-type"
              value={form.strategyType} 
              onChange={(e) => {
                const newType = e.target.value as "straddle" | "strangle";
                const defaultName = form.strategyType === 'straddle' ? 'My ATM Straddle' : 'My OTM Strangle';
                const newDefaultName = newType === 'straddle' ? 'My ATM Straddle' : 'My OTM Strangle';
                const shouldUpdateName = form.name === defaultName || form.name === '';
                setForm({ 
                  ...form, 
                  strategyType: newType, 
                  name: shouldUpdateName ? newDefaultName : form.name
                });
              }} 
              className={getSelectClass()}
            >
              <option value="straddle">Straddle (ATM)</option>
              <option value="strangle">Strangle (OTM)</option>
            </select>
          )}
          {field("Direction",
            <select 
              id="strategy-direction" 
              value={form.direction} 
              onChange={(e) => setForm({ ...form, direction: e.target.value as "long" | "short" })} 
              className={getSelectClass()}
            >
              <option value="short">SELL (Sell CE + Sell PE)</option>
              <option value="long">BUY (Buy CE + Buy PE)</option>
            </select>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Symbol */}
          {field("Symbol",
            <select id="strategy-symbol" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} className={getSelectClass()}>
              {SYMBOLS.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}

          {/* Strategy Name */}
          {field("Strategy Name",
            <input id="strategy-name" type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={getInputClass()} placeholder="Strategy Name" />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Expiry */}
          {field("Expiry Date",
            expiries.length > 0
              ? <select id="strategy-expiry" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className={getSelectClass()}>
                  {expiries.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
                </select>
              : <input id="strategy-expiry-input" type="date" required value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} className={getInputClass()} />
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
            <input id="strategy-lots" type="number" min={1} required value={form.quantityLots} onChange={(e) => setForm({ ...form, quantityLots: +e.target.value })} className={getInputClass()} />
          )}

          {/* Entry Time */}
          {field("Entry Time",
            <input id="strategy-entry-time" type="time" value={form.entryTime} onChange={(e) => setForm({ ...form, entryTime: e.target.value })} className={getInputClass()} />
          )}

          {/* Square Off Time */}
          {field("Auto Square-off Time",
            <input id="strategy-squareoff" type="time" value={form.squareOffTime} onChange={(e) => setForm({ ...form, squareOffTime: e.target.value })} className={getInputClass()} />
          )}
        </div>

        {/* Risk Management */}
        <div className={`border-t pt-4 ${isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'}`}>
          <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Risk Management</p>
          <div className="grid grid-cols-3 gap-4">
            {field("SL Points",
              <input id="strategy-sl" type="number" min={0} value={form.slPoints} onChange={(e) => setForm({ ...form, slPoints: +e.target.value })} className={getInputClass()} />
            )}
            {field("Target Points",
              <input id="strategy-target" type="number" min={0} value={form.targetPoints} onChange={(e) => setForm({ ...form, targetPoints: +e.target.value })} className={getInputClass()} />
            )}
            {field("Max Loss (₹)",
              <input id="strategy-maxloss" type="number" min={0} value={form.maxLoss} onChange={(e) => setForm({ ...form, maxLoss: +e.target.value })} className={getInputClass()} />
            )}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-300' : 'bg-white hover:bg-gray-50 text-gray-500 border border-[#e0e0e0]'}`}>
            Cancel
          </button>
          <button id="create-strategy-submit" type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#33b843] hover:bg-[#2da33a] disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-[#33b843]/20">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Creating..." : "Create Strategy"}
          </button>
        </div>
      </form>
    </div>
  );
}
