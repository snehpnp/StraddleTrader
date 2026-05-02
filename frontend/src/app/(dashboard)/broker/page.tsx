"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ShieldCheck, AlertTriangle, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { brokerApi } from "@/api";

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

  // Handle connect after redirect from Stoxkart
  const handleConnectAfterRedirect = useCallback(async (authToken: string) => {
    setConnecting(true); setMsg(null);
    try {
      const { data } = await brokerApi.connectBroker(authToken);
      setMsg({ type: "success", text: data.message || "Broker connected successfully! ✓" });

      // Clean up URL
      router.replace("/broker");

      // Refresh status
      const statusRes = await brokerApi.getBrokerStatus();
      setStatus(statusRes.data);
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Connection failed" });
    } finally { setConnecting(false); }
  }, [router]);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await brokerApi.getBrokerStatus();
        setStatus(data);
      } catch { /* silent */ }
    };

    fetchStatus();
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
    setSaving(true); setMsg(null);
    try {
      const { data } = await brokerApi.saveCredentials(apiKey, apiSecret);
      setMsg({ type: "success", text: data.message || "Credentials saved securely ✓. Now click Login to connect." });
    } catch (err: unknown) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed" });
    } finally { setSaving(false); }
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
        <h1 className="text-2xl font-bold text-white">Broker Connect</h1>
        <p className="text-gray-400 text-sm mt-0.5">Link your Stoxkart account to enable live trading</p>
      </div>

      {/* Status Card */}
      <div className={`flex items-center justify-between p-4 rounded-xl border ${
        status?.connected
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-gray-900/60 border-gray-800"
      }`}>
        <div className="flex items-center gap-3">
          {status?.connected
            ? <CheckCircle className="w-5 h-5 text-emerald-400" />
            : <AlertTriangle className="w-5 h-5 text-amber-400" />}
          <div>
            <p className={`text-sm font-semibold ${status?.connected ? "text-emerald-400" : "text-amber-400"}`}>
              {status?.connected ? "Connected to Stoxkart" : "Not Connected"}
            </p>
            {status?.brokerUserId && (
              <p className="text-gray-500 text-xs">User ID: {status.brokerUserId}</p>
            )}
            {status?.lastSyncedAt && (
              <p className="text-gray-500 text-xs">Last sync: {new Date(status.lastSyncedAt).toLocaleString("en-IN")}</p>
            )}
          </div>
        </div>
        {status?.connected && (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-all"
          >
            {disconnecting ? "..." : "Disconnect"}
          </button>
        )}
      </div>

      {/* Feedback message */}
      {msg && (
        <div className={`p-3 rounded-lg border text-sm ${
          msg.type === "success"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border-red-500/30 text-red-400"
        }`}>
          {msg.text}
        </div>
      )}

      {/* Credentials Form & Guide Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* API Credentials Form - Takes 3 columns */}
        <div className="lg:col-span-3 bg-gray-900/60 border border-gray-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-semibold">API Credentials</h2>
          </div>
          <p className="text-gray-500 text-xs">Your credentials are encrypted with AES-256 before storing. Never stored in plaintext.</p>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-mono"
                placeholder="Enter your Stoxkart API Key"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full bg-gray-800/60 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500 transition-colors text-sm font-mono"
                placeholder="Enter your Stoxkart API Secret"
                required
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {saving ? "Saving..." : "Save Credentials"}
              </button>
              <button
                type="button"
                onClick={handleLoginClick}
                disabled={connecting}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-emerald-500/20"
              >
                {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                {connecting ? "Connecting..." : "Login with Stoxkart"}
              </button>
            </div>
          </form>
        </div>

        {/* How to Get API Keys Guide - Takes 2 columns */}
        <div className="lg:col-span-2 bg-gray-900/40 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            How to get Stoxkart API Keys?
          </h3>
          <div className="space-y-3 text-xs text-gray-500">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-[10px]">1</span>
              <p>Login to your <a href="https://superrtrade.stoxkart.com" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">Stoxkart SuperrTrade</a> portal.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-[10px]">2</span>
              <p>Go to <strong>Settings</strong> or <strong>My Profile</strong> section from the top-right menu.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-[10px]">3</span>
              <p>Look for the <strong>API / Developer Options</strong> tab.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-[10px]">4</span>
              <p>Click on <strong>Generate API Key</strong>. You will receive an <strong>API Key</strong> and an <strong>API Secret</strong>.</p>
            </div>
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 text-[10px]">5</span>
              <p>Enter those keys in the form and click <strong>Save Credentials</strong> before connecting.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
