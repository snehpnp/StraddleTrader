'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): ThemeMode {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('theme') as ThemeMode | null;
    if (saved === 'dark' || saved === 'light') return saved;
  }
  return 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.remove('dark', 'light');
    document.documentElement.classList.add(mode);
    localStorage.setItem('theme', mode);
  }, [mode]);

  const setMode = (newMode: ThemeMode) => setModeState(newMode);
  const toggleMode = () => setModeState(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggleMode, isDark: mode === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Simple utility to get theme-aware class names
export function useThemeClasses() {
  const { isDark } = useTheme();
  return {
    // Background
    bg: isDark ? 'bg-[#0a0a0a]' : 'bg-[#f5f5f5]',
    bgCard: isDark ? 'bg-[#1a1a1a]' : 'bg-white',
    bgHover: isDark ? 'hover:bg-[#252525]' : 'hover:bg-gray-50',
    bgInput: isDark ? 'bg-[#1a1a1a]' : 'bg-white',
    bgSidebar: isDark ? 'bg-[#0a0a0a]' : 'bg-white',
    bgHeader: isDark ? 'bg-[#0a0a0a]/90' : 'bg-white/90',
    
    // Border
    border: isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]',
    borderHover: isDark ? 'hover:border-[#33b843]' : 'hover:border-[#33b843]',
    
    // Text
    text: isDark ? 'text-white' : 'text-[#1a1a1a]',
    textSecondary: isDark ? 'text-gray-400' : 'text-[#666666]',
    textMuted: isDark ? 'text-gray-500' : 'text-[#999999]',
    
    // Primary (Green like Dhan)
    primary: 'text-[#33b843]',
    primaryBg: 'bg-[#33b843]',
    primaryHover: 'hover:bg-[#2da33a]',
    primaryBorder: 'border-[#33b843]',
    accent: isDark ? 'bg-[#33b843]/10' : 'bg-[#33b843]/10',
    accentText: 'text-[#33b843]',
    
    // Buttons
    btnPrimary: 'bg-[#33b843] hover:bg-[#2da33a] text-white',
    btnSecondary: isDark ? 'bg-[#1a1a1a] hover:bg-[#252525] text-white border-[#2a2a2a]' : 'bg-white hover:bg-gray-50 text-[#1a1a1a] border-[#e0e0e0]',
    btnDanger: isDark ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 'bg-red-50 hover:bg-red-100 text-red-500',
    btnGhost: isDark ? 'hover:bg-[#1a1a1a] text-gray-400 hover:text-white' : 'hover:bg-gray-50 text-gray-500 hover:text-[#1a1a1a]',
    
    // Form elements
    input: isDark 
      ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500 focus:border-[#33b843] focus:ring-[#33b843]/20'
      : 'bg-white border-[#e0e0e0] text-[#1a1a1a] placeholder-gray-400 focus:border-[#33b843] focus:ring-[#33b843]/20',
    select: isDark 
      ? 'bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#33b843] focus:ring-[#33b843]/20'
      : 'bg-white border-[#e0e0e0] text-[#1a1a1a] focus:border-[#33b843] focus:ring-[#33b843]/20',
    
    // Cards
    card: isDark ? 'bg-[#1a1a1a]/60 border-[#2a2a2a]' : 'bg-white/60 border-[#e0e0e0]',
    cardHover: isDark ? 'hover:border-[#33b843]' : 'hover:border-[#33b843]',
    
    // Table
    tableHeader: isDark ? 'bg-[#141414]/50 text-gray-400' : 'bg-gray-50/50 text-gray-600',
    tableRow: isDark ? 'hover:bg-[#252525]/50 border-[#2a2a2a]' : 'hover:bg-gray-50/50 border-[#e0e0e0]',
    
    // Sidebar nav
    navItem: (active: boolean) => active
      ? (isDark ? 'bg-[#33b843]/10 text-[#33b843] border-r-2 border-[#33b843]' : 'bg-[#33b843]/10 text-[#2da33a] border-r-2 border-[#33b843]')
      : (isDark ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]' : 'text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-50'),
    
    // Badges
    badge: (type: 'success' | 'danger' | 'warning' | 'info' = 'success') => {
      const map = {
        success: isDark ? 'bg-[#33b843]/10 text-[#33b843]' : 'bg-[#33b843]/10 text-[#2da33a]',
        danger: isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500',
        warning: isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-500',
        info: isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-500',
      };
      return map[type];
    },
    
    // Alerts
    alert: (type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      const map = {
        success: isDark ? 'bg-[#33b843]/10 border-[#33b843]/20 text-[#33b843]' : 'bg-[#33b843]/10 border-[#33b843]/20 text-[#2da33a]',
        error: isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-500',
        warning: isDark ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-500',
        info: isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-500',
      };
      return map[type];
    },
    
    // Dropdown/menu
    dropdown: isDark ? 'bg-[#1a1a1a] border-[#2a2a2a] shadow-xl shadow-black/50' : 'bg-white border-[#e0e0e0] shadow-xl shadow-gray-200/50',
    menuItem: (active: boolean) => active
      ? (isDark ? 'bg-[#33b843]/10 text-[#33b843]' : 'bg-[#33b843]/10 text-[#2da33a]')
      : (isDark ? 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]' : 'text-gray-500 hover:text-[#1a1a1a] hover:bg-gray-50'),
    
    // Modal
    modalOverlay: isDark ? 'bg-black/70' : 'bg-black/30',
    modalContent: isDark ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-[#e0e0e0]',
    
    // Misc
    divider: isDark ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]',
    skeleton: isDark ? 'bg-[#2a2a2a] animate-pulse' : 'bg-gray-200 animate-pulse',
    code: isDark ? 'bg-[#141414] text-gray-300' : 'bg-gray-50 text-gray-700',
    tooltip: isDark ? 'bg-[#1a1a1a] text-white border-[#2a2a2a]' : 'bg-white text-[#1a1a1a] border-[#e0e0e0] shadow-lg',
    
    // Scrollbar (inline styles handled by ThemeStyles component)
    scrollTrack: isDark ? '#141414' : '#f5f5f5',
    scrollThumb: isDark ? '#333' : '#ccc',
    scrollThumbHover: isDark ? '#444' : '#bbb',
  };
}

// Global CSS-in-JSX component
export function ThemeStyles() {
  const { isDark } = useTheme();
  
  return (
    <style jsx global>{`
      :root {
        --primary-color: #33b843;
      }
      
      html.light {
        --bg-primary: #f5f5f5;
        --bg-secondary: #ffffff;
        --bg-card: #ffffff;
        --text-primary: #1a1a1a;
        --text-secondary: #666666;
        --text-muted: #999999;
        --border-color: #e0e0e0;
        color-scheme: light;
      }
      
      html.dark {
        --bg-primary: #0a0a0a;
        --bg-secondary: #141414;
        --bg-card: #1a1a1a;
        --text-primary: #ffffff;
        --text-secondary: #a0a0a0;
        --text-muted: #666666;
        --border-color: #2a2a2a;
        color-scheme: dark;
      }
      
      html {
        background-color: var(--bg-primary);
        color: var(--text-primary);
      }
      
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      
      ::-webkit-scrollbar-track {
        background: var(--bg-secondary);
      }
      
      ::-webkit-scrollbar-thumb {
        background: ${isDark ? '#333' : '#ccc'};
        border-radius: 3px;
      }
      
      ::-webkit-scrollbar-thumb:hover {
        background: ${isDark ? '#444' : '#bbb'};
      }
    `}</style>
  );
}

// Theme toggle button component
export function ThemeToggle() {
  const { isDark, toggleMode } = useTheme();
  
  return (
    <button
      onClick={toggleMode}
      className="p-2 rounded-lg transition-colors bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      )}
    </button>
  );
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default ThemeProvider;
