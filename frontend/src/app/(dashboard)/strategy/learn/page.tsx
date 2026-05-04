"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Info, TrendingUp, ArrowRight, Target, ShieldAlert, DollarSign } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

// SVG Payoff Diagrams
const StraddlePayoff = () => (
  <svg viewBox="0 0 300 200" className="w-full h-full">
    {/* Grid lines */}
    <line x1="50" y1="150" x2="250" y2="150" stroke="#374151" strokeWidth="1" strokeDasharray="4"/>
    <line x1="150" y1="50" x2="150" y2="150" stroke="#374151" strokeWidth="1" strokeDasharray="4"/>
    
    {/* X and Y axis */}
    <line x1="50" y1="150" x2="250" y2="150" stroke="#6B7280" strokeWidth="2"/>
    <line x1="50" y1="150" x2="50" y2="50" stroke="#6B7280" strokeWidth="2"/>
    
    {/* Labels */}
    <text x="140" y="170" fill="#9CA3AF" fontSize="10">Spot Price</text>
    <text x="20" y="100" fill="#9CA3AF" fontSize="10" transform="rotate(-90 20 100)">Profit/Loss</text>
    
    {/* Straddle Payoff - V shape for long, inverted V for short */}
    <path d="M 50 50 L 150 130 L 250 50" fill="none" stroke="#10B981" strokeWidth="3"/>
    
    {/* Break-even points */}
    <circle cx="100" cy="90" r="4" fill="#F59E0B"/>
    <circle cx="200" cy="90" r="4" fill="#F59E0B"/>
    <text x="85" y="85" fill="#F59E0B" fontSize="8">BE</text>
    <text x="195" y="85" fill="#F59E0B" fontSize="8">BE</text>
    
    {/* ATM point */}
    <circle cx="150" cy="130" r="4" fill="#EF4444"/>
    <text x="140" y="145" fill="#EF4444" fontSize="8">ATM</text>
  </svg>
);

const StranglePayoff = () => (
  <svg viewBox="0 0 300 200" className="w-full h-full">
    {/* Grid lines */}
    <line x1="50" y1="150" x2="250" y2="150" stroke="#374151" strokeWidth="1" strokeDasharray="4"/>
    <line x1="150" y1="50" x2="150" y2="150" stroke="#374151" strokeWidth="1" strokeDasharray="4"/>
    
    {/* X and Y axis */}
    <line x1="50" y1="150" x2="250" y2="150" stroke="#6B7280" strokeWidth="2"/>
    <line x1="50" y1="150" x2="50" y2="50" stroke="#6B7280" strokeWidth="2"/>
    
    {/* Labels */}
    <text x="140" y="170" fill="#9CA3AF" fontSize="10">Spot Price</text>
    <text x="20" y="100" fill="#9CA3AF" fontSize="10" transform="rotate(-90 20 100)">Profit/Loss</text>
    
    {/* Strangle Payoff - Flat in middle, V at ends */}
    <path d="M 50 50 L 100 130 L 200 130 L 250 50" fill="none" stroke="#10B981" strokeWidth="3"/>
    
    {/* Break-even points */}
    <circle cx="80" cy="105" r="4" fill="#F59E0B"/>
    <circle cx="220" cy="105" r="4" fill="#F59E0B"/>
    <text x="70" y="100" fill="#F59E0B" fontSize="8">BE</text>
    <text x="215" y="100" fill="#F59E0B" fontSize="8">BE</text>
    
    {/* OTM points */}
    <circle cx="100" cy="130" r="4" fill="#3B82F6"/>
    <circle cx="200" cy="130" r="4" fill="#3B82F6"/>
    <text x="85" y="145" fill="#3B82F6" fontSize="8">OTM</text>
    <text x="185" y="145" fill="#3B82F6" fontSize="8">OTM</text>
    
    {/* Profit zone */}
    <rect x="100" y="100" width="100" height="30" fill="#10B981" fillOpacity="0.1"/>
  </svg>
);

const STRATEGY_DETAILS = [
  {
    id: "straddle",
    name: "Straddle",
    subtitle: "ATM Strategy",
    description: "Buy/Sell both Call (CE) and Put (PE) at the SAME strike price (ATM). Used when expecting a BIG move but direction is unknown.",
    bestFor: "High Volatility / Big Move Expected",
    risk: "Limited to Premium Paid (for BUY)",
    reward: "Unlimited (for BUY)",
    breakeven: "ATM Strike +/- Total Premium",
    example: "NIFTY @ 23000 → Buy 23000 CE + Buy 23000 PE",
    direction: "BUY for volatility, SELL for range-bound",
    PayoffComponent: StraddlePayoff
  },
  {
    id: "strangle",
    name: "Strangle",
    subtitle: "OTM Strategy",
    description: "Buy/Sell Call (CE) and Put (PE) at DIFFERENT strike prices (OTM). Cheaper than Straddle but needs BIGGER move to profit.",
    bestFor: "High Volatility / Very Big Move Expected",
    risk: "Limited to Premium Paid (for BUY)",
    reward: "Unlimited (for BUY)",
    breakeven: "CE Strike + Premium / PE Strike - Premium",
    example: "NIFTY @ 23000 → Buy 23200 CE + Buy 22800 PE",
    direction: "BUY for volatility, SELL for range-bound",
    PayoffComponent: StranglePayoff
  }
];

export default function LearningPage() {
  const router = useRouter();
  const { isDark } = useTheme();
  
  const getCardClass = () => isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' : 'bg-white/60 border-[#e0e0e0]';
  const getHeaderBg = () => isDark ? 'bg-[#1a1a1a]' : 'bg-white';
  const getTextClass = () => isDark ? 'text-white' : 'text-[#1a1a1a]';
  const getSecondaryText = () => isDark ? 'text-gray-400' : 'text-gray-600';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className={`p-2 rounded-lg transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-50 text-gray-500 hover:text-[#1a1a1a] border border-[#e0e0e0]'}`}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className={`text-2xl font-bold ${getTextClass()}`}>Options Strategies Guide</h1>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Master Straddle & Strangle strategies for volatility trading</p>
        </div>
      </div>

      {/* Key Concepts Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-blue-400 font-medium text-sm">ATM (At The Money)</span>
          </div>
          <p className="text-gray-400 text-xs">Strike price = Current market price. Most expensive but highest probability of movement.</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-purple-400" />
            <span className="text-purple-400 font-medium text-sm">OTM (Out of The Money)</span>
          </div>
          <p className="text-gray-400 text-xs">Strike price away from current price. Cheaper but needs bigger move to profit.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-400 font-medium text-sm">Volatility Play</span>
          </div>
          <p className="text-gray-400 text-xs">Both strategies profit from BIG moves. BUY when expecting movement, SELL when range-bound.</p>
        </div>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {STRATEGY_DETAILS.map((strategy) => {
          const PayoffSVG = strategy.PayoffComponent;
          return (
            <div key={strategy.id} className={`border rounded-xl overflow-hidden flex flex-col ${getCardClass()}`}>
              {/* Card Header */}
              <div className={`p-5 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className={`w-5 h-5 ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`} />
                    <h2 className={`text-xl font-bold ${getTextClass()}`}>{strategy.name}</h2>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${isDark ? 'bg-[#33b843]/10 text-[#33b843] border-[#33b843]/20' : 'bg-[#33b843]/10 text-[#2da33a] border-[#33b843]/20'}`}>
                    {strategy.subtitle}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{strategy.description}</p>
              </div>

              {/* Payoff Diagram */}
              <div className={`p-5 ${isDark ? 'bg-[#1a1a1a]/30' : 'bg-gray-50/50'}`}>
                <p className={`text-xs font-medium mb-3 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Payoff Diagram (Long Position)</p>
                <div className={`h-48 rounded-lg p-4 ${isDark ? 'bg-[#0a0a0a]' : 'bg-white border border-[#e0e0e0]'}`}>
                  <PayoffSVG />
                </div>
                <div className="flex justify-center gap-4 mt-3">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-400 text-xs">Profit Zone</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-gray-400 text-xs">Break-even</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-400 text-xs">Max Loss (Premium)</span>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#1a1a1a]/40 border-[#2a2a2a]/50' : 'bg-gray-50 border-[#e0e0e0]/50'}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <ShieldAlert className={`w-3 h-3 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
                      <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Risk</p>
                    </div>
                    <p className={`text-xs font-medium ${isDark ? 'text-red-400' : 'text-red-500'}`}>{strategy.risk}</p>
                  </div>
                  <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#1a1a1a]/40 border-[#2a2a2a]/50' : 'bg-gray-50 border-[#e0e0e0]/50'}`}>
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className={`w-3 h-3 ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`} />
                      <p className={`text-[10px] uppercase font-bold tracking-wider ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Reward</p>
                    </div>
                    <p className={`text-xs font-medium ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`}>{strategy.reward}</p>
                  </div>
                </div>

                <div className={`p-3 rounded-lg border ${isDark ? 'bg-[#1a1a1a]/30 border-[#2a2a2a]/30' : 'bg-gray-50/50 border-[#e0e0e0]/30'}`}>
                  <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Break-even Points</p>
                  <p className={`text-sm font-mono ${getTextClass()}`}>{strategy.breakeven}</p>
                </div>

                <div className="bg-blue-500/5 p-3 rounded-lg border border-blue-500/20">
                  <p className="text-blue-400 text-[10px] uppercase font-bold tracking-wider mb-1">Example</p>
                  <p className="text-gray-300 text-sm">{strategy.example}</p>
                </div>
              </div>
              
              {/* Action Button */}
              <button 
                onClick={() => router.push(`/strategy/new?type=${strategy.id}`)}
                className="w-full py-3 bg-[#33b843] hover:bg-[#2da33a] text-white text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                Create {strategy.name} Strategy
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Comparison Table */}
      <div className={`border rounded-xl overflow-hidden ${getCardClass()}`}>
        <div className={`p-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'}`}>
          <h3 className={`text-lg font-semibold ${getTextClass()}`}>Straddle vs Strangle Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${isDark ? 'bg-[#1a1a1a]/50' : 'bg-gray-50/50'}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Feature</th>
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`}>Straddle (ATM)</th>
                <th className={`px-4 py-3 text-center text-xs font-medium uppercase ${isDark ? 'text-purple-400' : 'text-purple-500'}`}>Strangle (OTM)</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#2a2a2a]/50' : 'divide-[#e0e0e0]/50'}`}>
              <tr>
                <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Strike Selection</td>
                <td className={`px-4 py-3 text-center text-sm font-medium ${getTextClass()}`}>ATM (Same strike)</td>
                <td className={`px-4 py-3 text-center text-sm font-medium ${getTextClass()}`}>OTM (Different strikes)</td>
              </tr>
              <tr>
                <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Premium Cost</td>
                <td className={`px-4 py-3 text-center text-sm ${getTextClass()}`}>Higher 💸</td>
                <td className={`px-4 py-3 text-center text-sm ${getTextClass()}`}>Lower 💰</td>
              </tr>
              <tr>
                <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Breakeven Range</td>
                <td className={`px-4 py-3 text-center text-sm ${getTextClass()}`}>Narrow</td>
                <td className={`px-4 py-3 text-center text-sm ${getTextClass()}`}>Wider</td>
              </tr>
              <tr>
                <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Profit Probability</td>
                <td className={`px-4 py-3 text-center text-sm ${getTextClass()}`}>Lower (needs big move)</td>
                <td className={`px-4 py-3 text-center text-sm ${getTextClass()}`}>Even Lower (needs very big move)</td>
              </tr>
              <tr>
                <td className={`px-4 py-3 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Best For</td>
                <td className={`px-4 py-3 text-center text-sm ${getTextClass()}`}>Events, Results, Budget</td>
                <td className={`px-4 py-3 text-center text-sm ${getTextClass()}`}>Major Breakouts/Breakdowns</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Decision Guide */}
      <div className={`border rounded-xl p-5 ${isDark ? 'bg-gradient-to-r from-[#33b843]/10 to-blue-500/10 border-[#33b843]/20' : 'bg-gradient-to-r from-[#33b843]/5 to-blue-500/5 border-[#33b843]/20'}`}>
        <h3 className={`text-lg font-semibold mb-4 ${getTextClass()}`}>🎯 Which Strategy to Choose?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className={`font-medium text-sm ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`}>Choose STRADDLE when:</p>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Expecting BIG move before expiry</li>
              <li>Trading high-volatility events</li>
              <li>Budget allows higher premium</li>
              <li>Want wider profit zone</li>
            </ul>
          </div>
          <div className="space-y-2">
            <p className="text-blue-400 font-medium text-sm">Choose STRANGLE when:</p>
            <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
              <li>Expecting VERY BIG directional move</li>
              <li>Want cheaper entry (lower premium)</li>
              <li>Market is at support/resistance</li>
              <li>Can tolerate some time decay</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Risk Warning */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-4">
        <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
        <div className="text-sm">
          <p className="text-red-400 font-medium mb-1">Risk Warning</p>
          <p className="text-gray-400">
            Both strategies are for experienced traders. Time decay (theta) works against BUY positions. 
            SELL positions have unlimited risk. Always use stop-loss and proper position sizing.
          </p>
        </div>
      </div>
    </div>
  );
}
