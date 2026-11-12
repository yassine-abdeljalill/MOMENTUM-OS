import React, { useState } from 'react';
import {
  LayoutDashboard,
  SunMedium,
  CheckSquare,
  CalendarDays,
  Target,
  FolderGit2,
  GraduationCap,
  Dumbbell,
  Sparkles,
  BarChart3,
  BookOpen,
  Library,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useApp, NavigationTab } from '../../lib/context';

interface NavItemConfig {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: (state: any) => number | null;
}

const navItems: NavItemConfig[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  {
    id: 'today',
    label: 'Today',
    icon: SunMedium,
    badge: (state) => {
      const topCount = state.tasks.filter((t: any) => t.isDailyPriority && t.status !== 'completed').length;
      return topCount > 0 ? topCount : null;
    },
  },
  {
    id: 'tasks',
    label: 'Tasks',
    icon: CheckSquare,
    badge: (state) => {
      const pending = state.tasks.filter((t: any) => t.status !== 'completed').length;
      return pending > 0 ? pending : null;
    },
  },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'projects', label: 'Projects', icon: FolderGit2 },
  { id: 'learning', label: 'Learning', icon: GraduationCap },
  { id: 'fitness', label: 'Fitness', icon: Dumbbell },
  {
    id: 'habits',
    label: 'Habits',
    icon: Sparkles,
  },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'resources', label: 'Resources', icon: Library },
];

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, state, setIsAuthModalOpen } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleNavClick = (view: NavigationTab) => {
    setCurrentView(view);
    setIsMobileOpen(false);
  };

  const navContent = (
    <div className="flex flex-col h-full select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#5A3927]">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#8EC5FF] flex items-center justify-center text-[#3B2418] font-bold shadow-md">
              <Compass className="w-5 h-5 text-[#3B2418]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wider text-[#F2E8DA] uppercase font-mono">
                MOMENTUM
              </span>
              <span className="text-[10px] text-[#8EC5FF] font-medium tracking-tight">
                Life Operating System
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-lg bg-[#8EC5FF] flex items-center justify-center text-[#3B2418] font-bold shadow-md">
            <Compass className="w-5 h-5 text-[#3B2418]" />
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-md text-[#F2E8DA]/75 hover:text-[#F2E8DA] hover:bg-[#4D3021] transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-md text-[#F2E8DA]/75 hover:text-[#F2E8DA] hover:bg-[#4D3021]"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Philosophy Banner (when expanded) */}
      {!isCollapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-md bg-[#4D3021]/80 border border-[#5A3927] text-[11px] text-[#E6D8C7] italic leading-tight">
          &ldquo;Don&apos;t just track what you do. Track who you&apos;re becoming.&rdquo;
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const badgeCount = item.badge ? item.badge(state) : null;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-[#8EC5FF] text-[#3B2418] font-semibold shadow-sm'
                  : 'text-[#F2E8DA]/85 hover:text-[#F2E8DA] hover:bg-[#4D3021]'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-[#3B2418]' : 'text-[#8EC5FF]/85 group-hover:text-[#8EC5FF]'
                }`}
              />

              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {!isCollapsed && badgeCount !== null && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-[#3B2418] text-[#8EC5FF]'
                      : 'bg-[#4D3021] text-[#8EC5FF] border border-[#8EC5FF]/35'
                  }`}
                >
                  {badgeCount}
                </span>
              )}

              {/* Hover Tooltip when collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded bg-[#3B2418] text-[#F2E8DA] text-xs shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-[#8EC5FF]/40">
                  {item.label}
                  {badgeCount !== null && ` (${badgeCount})`}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-2 border-t border-[#5A3927] space-y-1">
        <button
          onClick={() => handleNavClick('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group relative ${
            currentView === 'settings'
              ? 'bg-[#8EC5FF] text-[#3B2418] font-semibold'
              : 'text-[#F2E8DA]/85 hover:text-[#F2E8DA] hover:bg-[#4D3021]'
          }`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings
            className={`w-4 h-4 shrink-0 ${
              currentView === 'settings' ? 'text-[#3B2418]' : 'text-[#8EC5FF]/85'
            }`}
          />
          {!isCollapsed && <span className="flex-1 text-left">Settings</span>}
        </button>

        {/* User Account / Profile Button */}
        <div
          onClick={() => setIsAuthModalOpen(true)}
          className="mt-2 pt-2 border-t border-[#5A3927] flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#4D3021] cursor-pointer transition-colors"
          title={state.profile.fullName}
        >
          <div className="w-7 h-7 rounded-full bg-[#8EC5FF]/20 border border-[#8EC5FF]/60 flex items-center justify-center text-xs font-semibold text-[#8EC5FF] shrink-0">
            {state.profile.fullName.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-[#F2E8DA] truncate">
                {state.profile.fullName}
              </span>
              <span className="text-[10px] text-[#D8C7B4] truncate">
                {state.isDemoMode ? 'Demo Mode' : state.profile.email}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Trigger Header (when on small devices) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#3B2418] z-30 flex items-center justify-between px-4 border-b border-[#5A3927] shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded-md text-[#F2E8DA] hover:bg-[#4D3021]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#8EC5FF] flex items-center justify-center">
              <Compass className="w-4 h-4 text-[#3B2418]" />
            </div>
            <span className="font-bold text-sm tracking-wider text-[#F2E8DA] uppercase font-mono">
              MOMENTUM
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#4D3021] text-[#8EC5FF] border border-[#8EC5FF]/40">
            {currentView}
          </span>
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 bg-[#3B2418] h-screen sticky top-0 transition-all duration-200 z-30 border-r border-[#5A3927] ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#3B2418]/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full bg-[#3B2418] shadow-2xl z-50">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
