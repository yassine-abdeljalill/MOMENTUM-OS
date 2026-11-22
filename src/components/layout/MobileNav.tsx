import React, { useState } from 'react';
import {
  Grid2x2,
  Settings,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp, NavigationTab } from '../../lib/context';
import { MOMENTUM_EASE, MOMENTUM_SPRING } from '../common/MotionPrimitives';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { BrandMark } from '../common/BrandMark';
import { ALL_NAV_ITEMS, MOBILE_PRIMARY_TAB_IDS, NAV_GROUPS } from './navConfig';

export const MobileNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    state,
    authUser,
    authChecked,
    setIsAuthModalOpen,
  } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const prefersReduced = useReducedMotion();

  const primaryItems = MOBILE_PRIMARY_TAB_IDS.map(
    id => ALL_NAV_ITEMS.find(item => item.id === id)!
  ).filter(Boolean);

  const isMoreActive =
    !MOBILE_PRIMARY_TAB_IDS.includes(currentView) || moreOpen;

  const handleSelect = (view: NavigationTab) => {
    setCurrentView(view);
    setMoreOpen(false);
  };

  const isSignedOut = authChecked && !authUser;
  const displayName = isSignedOut
    ? 'Sign In'
    : authUser && !authUser.isWorkspace
    ? authUser.fullName
    : state.profile.fullName;
  const displayEmail = isSignedOut
    ? 'Click to sign in or register'
    : authUser && !authUser.isWorkspace
    ? authUser.email
    : state.profile.email;

  return (
    <>
      {/* Fixed 5-Tab Bottom Navigation Bar (Mobile < md) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FBFBFD]/88 backdrop-blur-xl border-t border-line pb-[env(safe-area-inset-bottom)] select-none"
      >
        <div className="grid grid-cols-5 items-stretch h-14 px-1">
          {primaryItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id && !moreOpen;
            const badgeCount = item.badge ? item.badge(state) : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className="relative flex flex-col items-center justify-center gap-0.5 h-full min-h-[44px] transition-colors btn-press focus-visible:outline-none"
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-bottom-active-indicator"
                    transition={prefersReduced ? { duration: 0.01 } : MOMENTUM_SPRING}
                    className="absolute top-0 w-6 h-[2px] rounded-full bg-accent"
                  />
                )}
                <motion.div
                  animate={prefersReduced ? undefined : { scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
                  transition={MOMENTUM_SPRING}
                  className="relative flex items-center justify-center"
                >
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive ? 'text-accent' : 'text-ink-muted'
                    }`}
                    strokeWidth={isActive ? 2.15 : 1.75}
                  />
                  {badgeCount !== null && (
                    <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-accent text-accent-ink font-mono text-[9px] font-bold flex items-center justify-center tabular-nums leading-none">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </motion.div>
                <span
                  className={`text-[10.5px] leading-tight tracking-tight whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-accent font-semibold'
                      : 'text-ink-muted font-medium'
                  }`}
                >
                  {item.shortLabel || item.label}
                </span>
              </button>
            );
          })}

          {/* More Hub Trigger */}
          <button
            type="button"
            onClick={() => setMoreOpen(prev => !prev)}
            className="relative flex flex-col items-center justify-center gap-0.5 h-full min-h-[44px] transition-colors btn-press focus-visible:outline-none"
            aria-expanded={moreOpen}
            aria-label="Open more modules menu"
          >
            {isMoreActive && (
              <motion.span
                layoutId="mobile-bottom-active-indicator"
                transition={prefersReduced ? { duration: 0.01 } : MOMENTUM_SPRING}
                className="absolute top-0 w-6 h-[2px] rounded-full bg-accent"
              />
            )}
            <Grid2x2
              className={`w-5 h-5 transition-colors ${
                isMoreActive ? 'text-accent' : 'text-ink-muted'
              }`}
              strokeWidth={isMoreActive ? 2.15 : 1.75}
            />
            <span
              className={`text-[10.5px] leading-tight tracking-tight whitespace-nowrap transition-colors ${
                isMoreActive
                  ? 'text-accent font-semibold'
                  : 'text-ink-muted font-medium'
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile More Bottom Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.18 }}
            onClick={() => setMoreOpen(false)}
            className="md:hidden fixed inset-0 z-50 bg-black/28 backdrop-blur-xs flex items-end"
          >
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { y: '100%' }}
              animate={{ y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { y: '100%' }}
              transition={{ duration: prefersReduced ? 0.01 : 0.24, ease: MOMENTUM_EASE }}
              onClick={e => e.stopPropagation()}
              className="w-full max-h-[85dvh] glass-elevated border-b-0 rounded-t-3xl flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
            >
              {/* Drag Handle & Sheet Header */}
              <div className="pt-2.5 pb-3 px-5 border-b border-line flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <BrandMark size="sm" interactive />
                  <div>
                    <h2 className="text-sm font-bold text-ink font-heading leading-tight">
                      All Workspaces
                    </h2>
                    <p className="text-[11px] text-ink-muted">MOMENTUM</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreOpen(false)}
                  className="p-2 rounded-xl glass-control text-ink-muted hover:text-ink btn-press min-h-[40px] min-w-[40px] flex items-center justify-center"
                  aria-label="Close workspace menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Grouped Workspace Grid */}
              <div className="flex-1 overflow-y-auto px-4 pt-3.5 pb-6 space-y-4">
                {NAV_GROUPS.map(group => (
                  <div key={group.id} className="space-y-2">
                    <div className="px-1 text-[11px] font-medium text-ink-muted">
                      {group.label}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {group.items.map(item => {
                        const Icon = item.icon;
                        const active = currentView === item.id;
                        const badgeCount = item.badge ? item.badge(state) : null;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleSelect(item.id)}
                            className={`relative flex flex-col items-center justify-center gap-1 p-2.5 rounded-2xl border text-center transition-colors btn-press min-h-[64px] ${
                              active
                                ? 'bg-accent text-accent-ink border-accent font-semibold shadow-sm'
                                : 'glass-control text-ink font-medium'
                            }`}
                          >
                            {badgeCount !== null && (
                              <span
                                className={`absolute top-2 right-2.5 font-mono text-[10px] font-semibold tabular-nums ${
                                  active ? 'text-accent-ink/85' : 'text-ink-muted'
                                }`}
                              >
                                {badgeCount}
                              </span>
                            )}
                            <Icon
                              className={`w-5 h-5 ${
                                active ? 'text-accent-ink' : 'text-ink'
                              }`}
                            />
                            <span className="text-[11px] leading-tight truncate w-full">
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* System Actions */}
                <div className="space-y-2 pt-2 border-t border-line">
                  <div className="px-1 text-[11px] font-medium text-ink-muted">
                    System & Account
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect('settings')}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-xs font-semibold btn-press min-h-[44px] ${
                      currentView === 'settings'
                        ? 'bg-accent text-accent-ink border-accent'
                        : 'glass-control text-ink'
                    }`}
                  >
                    <Settings
                      className={`w-4 h-4 shrink-0 ${
                        currentView === 'settings' ? 'text-accent-ink' : 'text-ink'
                      }`}
                    />
                    <span>Settings & Preferences</span>
                  </button>

                  <PWAInstallButton variant="sheet" />

                  <button
                    type="button"
                    onClick={() => {
                      setMoreOpen(false);
                      setIsAuthModalOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl glass-control text-left btn-press min-h-[48px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-surface-inset border border-line-strong text-ink flex items-center justify-center text-xs font-bold shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-ink truncate">{displayName}</div>
                      <div className="text-[11px] text-ink-muted truncate">{displayEmail}</div>
                    </div>
                    <User className="w-4 h-4 text-ink-muted shrink-0" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
