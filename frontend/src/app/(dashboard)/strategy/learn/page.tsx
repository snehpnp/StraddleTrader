"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Info, TrendingUp } from "lucide-react";

const STRATEGY_DETAILS = [
  {
    id: "straddle",
    name: "Short Straddle",
    description: "Selling both an At-the-Money (ATM) Call (CE) and Put (PE) option of the same strike and expiry. This is a non-directional strategy used when the market is expected to remain range-bound.",
    bestFor: "Low Volatility / Sideways Market",
    risk: "Unlimited (if market moves sharply)",
    reward: "Maximum Premium Received",
    pattern: "V-shaped Payoff (Short)",
    image: "https://www.investopedia.com/thmb/9-0n9-u-z-v-h-t-k-l-m-n-o-p-q-r-s-t-u-v-w-x-y-z-1/straddle_short-5bfc3c5bc9e77c005170757d.png"
  },
  {
    id: "strangle",
    name: "Short Strangle",
    description: "Selling an Out-of-the-Money (OTM) Call (CE) and Put (PE) option. This gives a wider range for profit compared to a Straddle, but the premium received is lower.",
    bestFor: "Neutral Market with Wider Buffer",
    risk: "Unlimited (if market moves beyond OTM strikes)",
    reward: "Premium Received",
    pattern: "Table-top Payoff (Short)",
    image: "https://www.investopedia.com/thmb/r-s-t-u-v-w-x-y-z-1/strangle_short-5bfc3c5bc9e77c005170757d.png"
  }
];

export default function LearningPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-all">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Strategy Education</h1>
          <p className="text-gray-400 text-sm">Understand how different strategies work</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {STRATEGY_DETAILS.map((strategy) => (
          <div key={strategy.id} className="bg-gray-900/60 border border-gray-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-6 space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-400" />
                  {strategy.name}
                </h2>
                <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                  {strategy.bestFor}
                </span>
              </div>
              
              <p className="text-gray-400 text-sm leading-relaxed">
                {strategy.description}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Risk</p>
                  <p className="text-red-400 text-xs font-medium">{strategy.risk}</p>
                </div>
                <div className="bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
                  <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Reward</p>
                  <p className="text-emerald-400 text-xs font-medium">{strategy.reward}</p>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">Payoff Pattern</p>
                <div className="aspect-video w-full bg-gray-800/40 rounded-lg flex items-center justify-center border border-gray-700/50 text-gray-600">
                   <TrendingUp className="w-8 h-8 opacity-20" />
                   <span className="text-xs ml-2 italic">{strategy.pattern} Diagram</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => router.push(`/strategy/new?type=${strategy.id}`)}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white text-sm font-semibold transition-all border-t border-gray-700"
            >
              Configure this Strategy
            </button>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-4">
        <Info className="w-5 h-5 text-blue-400 shrink-0" />
        <div className="text-sm">
          <p className="text-blue-400 font-medium mb-1">Quick Tip</p>
          <p className="text-gray-400">Straddles are tighter and collect more premium, while Strangles are wider and have a higher probability of success but collect less premium.</p>
        </div>
      </div>
    </div>
  );
}
