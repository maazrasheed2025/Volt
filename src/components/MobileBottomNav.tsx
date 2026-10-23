// src/components/MobileBottomNav.tsx
import React from 'react';
import { useTheme } from '../context/ThemeContext.tsx';
import { Wallet, Users, Boxes, Zap, HandCoins, Building2 } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, setCurrentTab }) => {
  const { isDark } = useTheme();

  const navItems = [
    { id: 'overview', label: 'Cash', icon: Wallet },
    { id: 'employees', label: 'Staff', icon: Users },
    { id: 'inventory', label: 'Raw Mat', icon: Boxes },
    { id: 'generators', label: 'Gensets', icon: Zap },
    { id: 'financier', label: 'Loans', icon: HandCoins },
    { id: 'factory', label: 'Factory', icon: Building2 },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      id="mobile-bottom-navigation"
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-md transition-colors duration-200 border-t select-none ${
        isDark
          ? 'bg-slate-950/95 border-slate-800/90 text-slate-400'
          : 'bg-white/95 border-slate-200 text-slate-600 shadow-lg'
      }`}
      style={{
        paddingBottom: 'var(--safe-area-bottom, env(safe-area-inset-bottom, 0px))',
      }}
    >
      <div className="grid grid-cols-6 h-14 max-w-lg mx-auto px-0.5">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const IconComp = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              id={`mobile-nav-${item.id}`}
              onClick={() => {
                setCurrentTab(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center py-1 px-1 transition-all relative ${
                isActive
                  ? isDark
                    ? 'text-emerald-400 font-bold'
                    : 'text-emerald-600 font-bold'
                  : isDark
                  ? 'hover:text-slate-200'
                  : 'hover:text-slate-900'
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span
                  className={`absolute top-0 left-2 right-2 h-0.5 rounded-full ${
                    isDark ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-emerald-600'
                  }`}
                />
              )}

              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive ? 'scale-110' : ''
                }`}
              >
                <IconComp className="w-4 h-4" />
              </div>

              <span className="text-[10px] tracking-tight leading-none mt-0.5 truncate max-w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
