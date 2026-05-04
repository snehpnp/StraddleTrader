"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Link2,
  Zap,
  BookOpen,
  BarChart3,
  FileText,
  LogOut,
  TrendingUp,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/components/auth";
import Image from "next/image";
import LivePriceTicker from "@/components/LivePriceTicker";
import { useTheme, ThemeStyles } from "@/components/ThemeProvider";
import { User, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/broker", icon: Link2, label: "Broker Connect" },
  { href: "/strategy", icon: Zap, label: "Strategies" },
  { href: "/positions", icon: BarChart3, label: "Positions" },
  { href: "/orders", icon: BookOpen, label: "Orders" },
  { href: "/logs", icon: FileText, label: "Audit Logs" },
  { href: "/profile", icon: User, label: "Profile" },
];

// Separate Sidebar component to avoid creating during render
interface SidebarProps {
  pathname: string;
  userName: string;
  setSidebarOpen: (open: boolean) => void;
  onLogout: () => void;
}

function Sidebar({ pathname, userName, setSidebarOpen, onLogout }: SidebarProps) {
  const { isDark } = useTheme();
  return (
    <aside className={`flex flex-col h-full border-r w-64 transition-colors ${isDark ? 'bg-[#0a0a0a] border-[#2a2a2a]' : 'bg-white border-[#e0e0e0]'}`}>
     <div className={`flex ml-4 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'}`}>
  <Image
    src="/logo_trans.png"
    alt="StraddleTrader Logo"
    width={160}
    height={40}
    className="object-contain"
    priority
  />
</div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
                active
                  ? (isDark ? 'bg-[#33b843]/10 text-[#33b843] border-r-2 border-[#33b843]' : 'bg-[#33b843]/10 text-[#2da33a] border-r-2 border-[#33b843]')
                  : (isDark ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]' : 'text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-50')
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? (isDark ? 'text-[#33b843]' : 'text-[#2da33a]') : (isDark ? 'text-gray-500 group-hover:text-white' : 'text-gray-400 group-hover:text-[#1a1a1a]')}`} />
              {label}
              {active && <ChevronRight className={`w-3.5 h-3.5 ml-auto ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`} />}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className={`px-3 py-4 border-t ${isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'}`}>
        <div className={`flex items-center gap-3 px-3 py-2 rounded-lg mb-2 ${isDark ? 'bg-[#1a1a1a]' : 'bg-gray-50'}`}>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-[#33b843]/20' : 'bg-[#33b843]/10'}`}>
            <span className={`text-xs font-bold ${isDark ? 'text-[#33b843]' : 'text-[#2da33a]'}`}>{userName[0]?.toUpperCase()}</span>
          </div>
          <span className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>{userName}</span>
        </div>
        <button
          id="logout-btn"
          onClick={onLogout}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium transition-all ${isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-500 hover:text-red-500 hover:bg-red-50'}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?returnUrl=${returnUrl}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  const handleLogout = async () => {
    await logout();
  };

  // Get user name from auth context
  const userName = user?.name || "Trader";

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f5]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#33b843]/30 border-t-[#33b843] rounded-full animate-spin" />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render layout if not authenticated
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f5]'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#33b843]/30 border-t-[#33b843] rounded-full animate-spin" />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ThemeStyles />
      <div className={`flex h-screen overflow-hidden transition-colors ${isDark ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f5]'}`}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex flex-shrink-0">
          <Sidebar 
            pathname={pathname}
            userName={userName}
            setSidebarOpen={setSidebarOpen}
            onLogout={handleLogout}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="relative z-10">
              <Sidebar 
                pathname={pathname}
                userName={userName}
                setSidebarOpen={setSidebarOpen}
                onLogout={handleLogout}
              />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile Header */}
          <header className={`lg:hidden flex items-center gap-3 px-4 py-3 border-b ${isDark ? 'bg-[#0a0a0a] border-[#2a2a2a]' : 'bg-white border-[#e0e0e0]'}`}>
            <button onClick={() => setSidebarOpen(true)} className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#1a1a1a]'}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#33b843]" />
              <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#1a1a1a]'}`}>StraddleTrader</span>
            </div>
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} className={`ml-auto ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-[#1a1a1a]'}`}>
                <X className="w-5 h-5" />
              </button>
            )}
          </header>

          {/* Desktop Header */}
          <header className={`hidden lg:flex items-center justify-end gap-3 px-4 py-2 border-b ${isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'}`}>
            <Link href="/profile" className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${isDark ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]' : 'text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-50'}`}>
              <Settings className="w-4 h-4" />
              <span>Profile</span>
            </Link>
          </header>

          {/* Live Price Ticker - Desktop only (mobile has limited space) */}
          <div className="hidden lg:block">
            <LivePriceTicker />
          </div>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
