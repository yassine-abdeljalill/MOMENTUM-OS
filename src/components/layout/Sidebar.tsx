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
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp, NavigationTab } from '../../lib/context';
import { DrawerShell, MOMENTUM_EASE } from '../common/MotionPrimitives';

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
  { id: 'finance', label: 'Finance', icon: Wallet },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'resources', label: 'Resources', icon: Library },
];

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, state, authUser, setIsAuthModalOpen } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleNavClick = (view: NavigationTab) => {
    setCurrentView(view);
    setIsMobileOpen(false);
  };

  const renderNavContent = (layoutPrefix: string, collapsed: boolean) => (
    <div className="flex flex-col h-full select-none overflow-hidden">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-[#5A3927] shrink-0">
        <div className={`flex items-center gap-3 min-w-0 ${collapsed ? 'mx-auto' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-[#8EC5FF] flex items-center justify-center text-[#3B2418] font-bold shadow-md shrink-0">
            <Compass className="w-5 h-5 text-[#3B2418]" />
          </div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, width: 0 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="font-bold text-sm tracking-wider text-[#F2E8DA] uppercase font-mono">
                  MOMENTUM
                </span>
                <span className="text-[10px] text-[#8EC5FF] font-medium tracking-tight">
                  Life Operating System
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex p-1.5 rounded-md text-[#F2E8DA]/75 hover:text-[#F2E8DA] hover:bg-[#4D3021] transition-colors btn-press shrink-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
            className="flex items-center justify-center"
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.span>
        </button>

        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden p-1.5 rounded-md text-[#F2E8DA]/75 hover:text-[#F2E8DA] hover:bg-[#4D3021] btn-press"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Philosophy Banner (when expanded) */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
            className="mx-3 overflow-hidden shrink-0"
          >
            <div className="px-3 py-2 rounded-md bg-[#4D3021]/80 border border-[#5A3927] text-[11px] text-[#E6D8C7] italic leading-tight">
              &ldquo;Don&apos;t just track what you do. Track who you&apos;re becoming.&rdquo;
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const badgeCount = item.badge ? item.badge(state) : null;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 group relative btn-press ${
                isActive
                  ? 'text-[#3B2418] font-semibold'
                  : 'text-[#F2E8DA]/85 hover:text-[#F2E8DA] hover:bg-[#4D3021]/90'
              }`}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId={`${layoutPrefix}-active-pill`}
                  transition={{
                    type: 'spring',
                    stiffness: 420,
                    damping: 34,
                    mass: 0.8,
                  }}
                  className="absolute inset-0 rounded-lg bg-[#8EC5FF] shadow-sm z-0"
                />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 relative z-10 transition-transform duration-150 ${
                  isActive
                    ? 'text-[#3B2418] scale-105'
                    : 'text-[#8EC5FF]/85 group-hover:text-[#8EC5FF] group-hover:translate-x-0.5 group-hover:scale-105'
                }`}
              />

              {!collapsed && (
                <span className="flex-1 text-left truncate relative z-10 transition-transform duration-150 group-hover:translate-x-0.5">
                  {item.label}
                </span>
              )}

              {!collapsed && badgeCount !== null && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono font-bold relative z-10 transition-colors ${
                    isActive
                      ? 'bg-[#3B2418] text-[#8EC5FF]'
                      : 'bg-[#4D3021] text-[#8EC5FF] border border-[#8EC5FF]/35'
                  }`}
                >
                  {badgeCount}
                </span>
              )}

              {/* Hover Tooltip when collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded bg-[#3B2418] text-[#F2E8DA] text-xs shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 border border-[#8EC5FF]/40">
                  {item.label}
                  {badgeCount !== null && ` (${badgeCount})`}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="p-2 border-t border-[#5A3927] space-y-1 shrink-0">
        <button
          onClick={() => handleNavClick('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-150 group relative btn-press ${
            currentView === 'settings'
              ? 'text-[#3B2418] font-semibold'
              : 'text-[#F2E8DA]/85 hover:text-[#F2E8DA] hover:bg-[#4D3021]/90'
          }`}
          title={collapsed ? 'Settings' : undefined}
        >
          {currentView === 'settings' && (
            <motion.div
              layoutId={`${layoutPrefix}-active-pill`}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 34,
                mass: 0.8,
              }}
              className="absolute inset-0 rounded-lg bg-[#8EC5FF] shadow-sm z-0"
            />
          )}
          <Settings
            className={`w-4 h-4 shrink-0 relative z-10 transition-transform duration-200 ${
              currentView === 'settings'
                ? 'text-[#3B2418]'
                : 'text-[#8EC5FF]/85 group-hover:text-[#8EC5FF] group-hover:rotate-45'
            }`}
          />
          {!collapsed && <span className="flex-1 text-left relative z-10">Settings</span>}
        </button>

        {/* User Account / Profile Button */}
        <div
          onClick={() => setIsAuthModalOpen(true)}
          className="mt-2 pt-2 border-t border-[#5A3927] flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#4D3021] cursor-pointer transition-colors btn-press"
          title={state.profile.fullName}
        >
          <div className="w-7 h-7 rounded-full bg-[#8EC5FF]/20 border border-[#8EC5FF]/60 flex items-center justify-center text-xs font-semibold text-[#8EC5FF] shrink-0">
            {(authUser?.fullName || state.profile.fullName).charAt(0)}
          </div>
          {!collapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-[#F2E8DA] truncate">
                {authUser?.fullName || state.profile.fullName}
              </span>
              <span className="text-[10px] text-[#D8C7B4] truncate">
                {authUser ? authUser.email : state.isDemoMode ? 'Sign in for Finance' : state.profile.email}
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
            className="p-1.5 rounded-md text-[#F2E8DA] hover:bg-[#4D3021] btn-press"
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
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#4D3021] text-[#8EC5FF] border border-[#8EC5FF]/40 capitalize">
            {currentView}
          </span>
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 64 : 240 }}
        transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: MOMENTUM_EASE }}
        className="hidden md:block shrink-0 bg-[#3B2418] h-screen sticky top-0 z-30 border-r border-[#5A3927] overflow-hidden"
      >
        {renderNavContent('desktop', isCollapsed)}
      </motion.aside>

      {/* Mobile Drawer Backdrop & Drawer */}
      <DrawerShell
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
        side="left"
        panelClassName="relative w-64 max-w-[80vw] h-full bg-[#3B2418] shadow-2xl z-50 md:hidden"
      >
        {renderNavContent('mobile', false)}
      </DrawerShell>
    </>
  );
};
