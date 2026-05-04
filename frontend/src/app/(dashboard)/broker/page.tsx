"use client";
import { useState, useEffect, useCallback } from "react";
import { brokerApi } from "@/api";
import { useTheme } from "@/components/ThemeProvider";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle, CheckCircle, Loader2, ExternalLink, Edit2 } from "lucide-react";

export default function BrokerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [saving, setSaving] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [status, setStatus] = useState<{ connected: boolean; status: string; brokerUserId?: string; lastSyncedAt?: string } | null>(null);
  const [savedCreds, setSavedCreds] = useState<{ hasCredentials: boolean; apiKey: string | null } | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const { isDark } = useTheme();

  const getCardClass = () => isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' : 'bg-white/60 border-[#e0e0e0]';
  const getInputClass = () => isDark
    ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#33b843]'
    : 'bg-white border-[#e0e0e0] text-[#1a1a1a] placeholder-gray-400 focus:border-[#33b843]';

  // Handle connect after redirect from Stoxkart
  const handleConnectAfterRedirect = useCallback(async (authToken: string) => {
    setConnecting(true); setMsg(null);
    try {
      const { data } = await brokerApi.connectBroker(authToken);
      setMsg({ type: "success", text: data.message || "Broker connected successfully! " });

      // Clean up URL
      router.replace("/broker");

      // Refresh status
      const statusRes = await brokerApi.getBrokerStatus();
      setStatus(statusRes.data);
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Connection failed" });
    } finally { setConnecting(false); }
  }, [router]);

  // Fetch saved credentials on load
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, credsRes] = await Promise.all([
          brokerApi.getBrokerStatus(),
          brokerApi.getCredentials()
        ]);
        setStatus(statusRes.data);
        setSavedCreds({
          hasCredentials: credsRes.data.hasCredentials,
          apiKey: credsRes.data.apiKey
        });
      } catch { /* silent */ }
    };

    fetchData();
  }, []);

  // Handle OAuth redirect in separate effect to avoid cascading renders
  useEffect(() => {
    const authToken = searchParams.get("auth_token");
    if (authToken) {
      // Use setTimeout to break synchronous execution
      const timer = setTimeout(() => {
        handleConnectAfterRedirect(authToken);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [searchParams, handleConnectAfterRedirect]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const { data } = await brokerApi.saveCredentials(apiKey, apiSecret);
      if (data.success) {
        setMsg({ type: "success", text: "Credentials saved. You can now connect." });
        // Refresh saved credentials and hide edit form
        const { data: credsData } = await brokerApi.getCredentials();
        setSavedCreds({
          hasCredentials: credsData.hasCredentials,
          apiKey: credsData.apiKey
        });
        setShowEditForm(false);
        setApiKey("");
        setApiSecret("");
      } else {
        setMsg({ type: "error", text: data.message || "Failed to save" });
      }
    } catch {
      setMsg({ type: "error", text: "Failed to save credentials" });
    } finally {
      setSaving(false);
    }
  };

  const handleLoginClick = async () => {
    setConnecting(true); setMsg(null);
    try {
      const { data } = await brokerApi.getLoginUrl();

      // Redirect to Stoxkart
      window.location.href = data.url;
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to get login URL" });
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true); setMsg(null);
    try {
      const { data } = await brokerApi.disconnectBroker();
      setMsg({ type: "success", text: data.message || "Broker disconnected" });

      // Refresh status
      const statusRes = await brokerApi.getBrokerStatus();
      setStatus(statusRes.data);
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally { setDisconnecting(false); }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>Broker Connect</h1>
        <p className={`text-gray-400 text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Link your Stoxkart account to enable live trading</p>
      </div>

      {/* Status Card */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${
        status?.connected
          ? (isDark ? "bg-[#33b843]/10 border-[#33b843]/30" : "bg-[#33b843]/10 border-[#33b843]/30")
          : (isDark ? "bg-[#1a1a1a]/60 border-[#2a2a2a]" : "bg-white/60 border-[#e0e0e0]")
      }`}>
        <div className="flex items-center gap-3">
          {status?.connected
            ? <CheckCircle className={`w-5 h-5 ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`} />
            : <AlertTriangle className="w-5 h-5 text-amber-400" />}
          <div>
            <p className={`text-sm font-semibold ${status?.connected ? (isDark ? 'text-[#33b843]' : 'text-[#2da33a]') : 'text-amber-400'}`}>
              {status?.connected ? "Connected to Stoxkart" : "Not Connected"}
            </p>
            {status?.brokerUserId && (
              <p className={`text-gray-500 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>User ID: {status.brokerUserId}</p>
            )}
            {status?.lastSyncedAt && (
              <p className={`text-gray-500 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Last sync: {new Date(status.lastSyncedAt).toLocaleString("en-IN")}</p>
            )}
          </div>
        </div>
        {status?.connected && (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className={`px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-all ${isDark ? 'text-red-400' : 'text-red-400'}`}
          >
            {disconnecting ? "..." : "Disconnect"}
          </button>
        )}
      </div>

      {/* Feedback message */}
      {msg && (
        <div className={`p-3 rounded-lg border text-sm ${
          msg.type === "success"
            ? (isDark ? "bg-[#33b843]/10 border-[#33b843]/30 text-[#33b843]" : "bg-[#33b843]/10 border-[#33b843]/30 text-[#2da33a]")
            : (isDark ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-red-500/10 border-red-500/30 text-red-400")
        }`}>
          {msg.text}
        </div>
      )}

      {/* Credentials Form & Guide Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* API Credentials Form - Takes 3 columns */}
        <div className={`lg:col-span-3 border rounded-xl p-6 space-y-5 ${getCardClass()}`}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`w-5 h-5 ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`} />
              <h2 className={`font-semibold ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>API Credentials</h2>
            </div>
            {savedCreds?.hasCredentials && !showEditForm && (
              <button
                onClick={() => setShowEditForm(true)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-colors ${isDark ? 'text-[#33b843] hover:text-[#2da33a] bg-[#33b843]/10 hover:bg-[#33b843]/20' : 'text-[#2da33a] hover:text-[#33b843] bg-[#33b843]/10 hover:bg-[#33b843]/20'}`}
              >
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
            )}
          </div>
          <p className={`text-gray-500 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Your credentials are encrypted with AES-256 before storing. Never stored in plaintext.</p>

          {/* Show Saved Credentials or Edit Form */}
          {savedCreds?.hasCredentials && !showEditForm ? (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${isDark ? 'bg-[#1a1a1a]/50 border-[#2a2a2a]' : 'bg-gray-50 border-[#e0e0e0]'}`}>
                <ShieldCheck className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`} />
                <div>
                  <p className={`text-xs mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Saved API Key</p>
                  <p className={`text-sm font-mono ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>{savedCreds.apiKey}</p>
                </div>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Your API Key is saved and encrypted. Click Edit to update credentials.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleLoginClick}
                  disabled={connecting}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#33b843] hover:bg-[#2da33a] text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-[#33b843]/20"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  {connecting ? "Connecting..." : "Login with Stoxkart"}
                </button>
                <button
                  onClick={() => setShowEditForm(true)}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-white' : 'bg-white hover:bg-gray-50 text-[#1a1a1a] border border-[#e0e0e0]'}`}
                >
                  <Edit2 className="w-4 h-4" />
                  Update Credentials
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className={`block text-sm mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>API Key</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm font-mono ${getInputClass()}`}
                  placeholder="Enter your Stoxkart API Key"
                  required
                />
              </div>
              <div>
                <label className={`block text-sm mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>API Secret</label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className={`w-full border rounded-lg px-4 py-2.5 outline-none transition-colors text-sm font-mono ${getInputClass()}`}
                  placeholder="Enter your Stoxkart API Secret"
                  required
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-60 ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-white' : 'bg-white hover:bg-gray-50 text-[#1a1a1a] border border-[#e0e0e0]'}`}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {saving ? "Saving..." : (savedCreds?.hasCredentials ? "Update Credentials" : "Save Credentials")}
                </button>
                {savedCreds?.hasCredentials && (
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white' : 'bg-white hover:bg-gray-50 text-gray-500 hover:text-[#1a1a1a] border border-[#e0e0e0]'}`}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLoginClick}
                  disabled={connecting}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#33b843] hover:bg-[#2da33a] text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-[#33b843]/20"
                >
                  {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                  {connecting ? "Connecting..." : "Login with Stoxkart"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* How to Get API Keys Guide - Takes 2 columns */}
        <div className={`lg:col-span-2 border rounded-xl p-5 space-y-4 ${isDark ? 'bg-[#141414]/40 border-[#2a2a2a]' : 'bg-gray-50/60 border-[#e0e0e0]'}`}>
          <h3 className={`font-semibold text-sm flex items-center gap-2 ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>
            <ShieldCheck className={`w-4 h-4 ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`} />
            How to get Stoxkart API Keys?
          </h3>
          <div className={`space-y-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
            <div className="flex gap-3">
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isDark ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>1</span>
              <p>Login to your <a href="https://superrtrade.stoxkart.com" target="_blank" rel="noopener noreferrer" className={`hover:underline ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`}>Stoxkart SuperrTrade</a> portal.</p>
            </div>
            <div className="flex gap-3">
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isDark ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>2</span>
              <p>Go to <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>Settings</strong> or <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>My Profile</strong> section from the top-right menu.</p>
            </div>
            <div className="flex gap-3">
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isDark ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>3</span>
              <p>Look for the <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>API / Developer Options</strong> tab.</p>
            </div>
            <div className="flex gap-3">
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isDark ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>4</span>
              <p>Click on <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>Generate API Key</strong>. You will receive an <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>API Key</strong> and an <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>API Secret</strong>.</p>
            </div>
            <div className="flex gap-3">
              <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isDark ? 'bg-[#1a1a1a] text-gray-400' : 'bg-gray-100 text-gray-500'}`}>5</span>
              <p>Enter those keys in the form and click <strong className={isDark ? 'text-gray-300' : 'text-gray-700'}>Save Credentials</strong> before connecting.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
