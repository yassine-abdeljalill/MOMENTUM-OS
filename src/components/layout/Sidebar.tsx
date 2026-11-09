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
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#7E5437]/40">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D2925B] flex items-center justify-center text-[#22292F] font-bold shadow-md">
              <Compass className="w-5 h-5 text-[#242B31]" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wider text-[#F4F0E9] uppercase font-mono">
                MOMENTUM
              </span>
              <span className="text-[10px] text-[#D2925B] font-medium tracking-tight">
                Life Operating System
              </span>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 mx-auto rounded-lg bg-[#D2925B] flex items-center justify-center text-[#242B31] font-bold shadow-md">
            <Compass className="w-5 h-5 text-[#242B31]" />
          </div>
        )}

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-md text-[#F4F0E9]/70 hover:text-[#F4F0E9] hover:bg-[#4E3320] transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-md text-[#F4F0E9]/70 hover:text-[#F4F0E9] hover:bg-[#4E3320]"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Philosophy Banner (when expanded) */}
      {!isCollapsed && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-md bg-[#4E3320]/60 border border-[#7E5437]/30 text-[11px] text-[#A8A8A2] italic leading-tight">
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
                  ? 'bg-[#D2925B] text-[#242B31] font-semibold shadow-sm'
                  : 'text-[#F4F0E9]/80 hover:text-[#F4F0E9] hover:bg-[#4E3320]/80'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-105 ${
                  isActive ? 'text-[#242B31]' : 'text-[#868A7A] group-hover:text-[#F4F0E9]'
                }`}
              />

              {!isCollapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {!isCollapsed && badgeCount !== null && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-[#242B31]/20 text-[#242B31]'
                      : 'bg-[#4E3320] text-[#D2925B] border border-[#7E5437]/50'
                  }`}
                >
                  {badgeCount}
                </span>
              )}

              {/* Hover Tooltip when collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded bg-[#242B31] text-[#F4F0E9] text-xs shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-[#434D56]">
                  {item.label}
                  {badgeCount !== null && ` (${badgeCount})`}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-2 border-t border-[#7E5437]/40 space-y-1">
        <button
          onClick={() => handleNavClick('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors group relative ${
            currentView === 'settings'
              ? 'bg-[#D2925B] text-[#242B31] font-semibold'
              : 'text-[#F4F0E9]/80 hover:text-[#F4F0E9] hover:bg-[#4E3320]/80'
          }`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          <Settings
            className={`w-4 h-4 shrink-0 ${
              currentView === 'settings' ? 'text-[#242B31]' : 'text-[#868A7A]'
            }`}
          />
          {!isCollapsed && <span className="flex-1 text-left">Settings</span>}
        </button>

        {/* User Account / Profile Button */}
        <div
          onClick={() => setIsAuthModalOpen(true)}
          className="mt-2 pt-2 border-t border-[#7E5437]/30 flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#4E3320] cursor-pointer transition-colors"
          title={state.profile.fullName}
        >
          <div className="w-7 h-7 rounded-full bg-[#868A7A]/30 border border-[#868A7A] flex items-center justify-center text-xs font-semibold text-[#F4F0E9] shrink-0">
            {state.profile.fullName.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-[#F4F0E9] truncate">
                {state.profile.fullName}
              </span>
              <span className="text-[10px] text-[#A8A8A2] truncate">
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#64432B] z-30 flex items-center justify-between px-4 border-b border-[#7E5437]/40 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-1.5 rounded-md text-[#F4F0E9] hover:bg-[#4E3320]"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#D2925B] flex items-center justify-center">
              <Compass className="w-4 h-4 text-[#242B31]" />
            </div>
            <span className="font-bold text-sm tracking-wider text-[#F4F0E9] uppercase font-mono">
              MOMENTUM
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#4E3320] text-[#D2925B] border border-[#7E5437]/50">
            {currentView}
          </span>
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 bg-[#64432B] h-screen sticky top-0 transition-all duration-200 z-30 border-r border-[#7E5437]/30 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {navContent}
      </aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full bg-[#64432B] shadow-2xl z-50">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
