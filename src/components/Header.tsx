import React from 'react';
import { KurasiWordmark } from './KurasiLogo';
import {
  Sparkles,
  LayoutDashboard,
  Grid3X3,
  History,
  Settings2,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'generator' | 'dashboard' | 'matrix' | 'history' | 'settings';
  setActiveTab: (tab: 'generator' | 'dashboard' | 'matrix' | 'history' | 'settings') => void;
  totalGenerationsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  totalGenerationsCount,
}) => {
  const navItems: Array<{
    id: 'generator' | 'dashboard' | 'matrix' | 'history' | 'settings';
    label: string;
    icon: React.ReactNode;
    hideLabelOnMobile?: boolean;
  }> = [
    { id: 'generator', label: 'Generator', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" />, hideLabelOnMobile: true },
    { id: 'matrix', label: 'Smart Matrix', icon: <Grid3X3 className="w-4 h-4" />, hideLabelOnMobile: true },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" />, hideLabelOnMobile: true },
    { id: 'settings', label: 'Settings', icon: <Settings2 className="w-4 h-4" />, hideLabelOnMobile: true },
  ];

  return (
    <header className="border-b border-slate-200 bg-white/95 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16 sm:h-[72px]">
          {/* Zone 1: Brand Lockup matching latest Kurasi Logo */}
          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className="flex items-center gap-3 cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6322D8] rounded-lg"
            title="Kembali ke Kurasi Generator"
          >
            <KurasiWordmark height={32} />
            <span className="hidden lg:inline-block h-5 w-px bg-slate-200" aria-hidden="true" />
            <span className="hidden lg:inline-block text-xs font-semibold text-slate-500 whitespace-nowrap">
              AI Metanarasi Generator
            </span>
          </button>

          {/* Zone 2: Clean Single-Line Navigation */}
          <nav className="flex items-center gap-1 sm:gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#6322D8] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  {item.icon}
                  <span className={item.hideLabelOnMobile ? 'hidden sm:inline' : ''}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Saved Count Summary */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 shrink-0 whitespace-nowrap">
            <span className="font-mono tabular-nums font-semibold text-slate-700">
              {totalGenerationsCount}
            </span>
            <span>Projects Saved</span>
          </div>
        </div>
      </div>
    </header>
  );
};
