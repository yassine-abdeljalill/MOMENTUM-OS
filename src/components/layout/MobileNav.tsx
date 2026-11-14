import React, { useState } from 'react';
import {
  Grid2x2,
  Settings,
  User,
  X,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp, NavigationTab } from '../../lib/context';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { ALL_NAV_ITEMS, MOBILE_PRIMARY_TAB_IDS, NAV_GROUPS } from './navConfig';

export const MobileNav: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    state,
    authUser,
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

  const displayName =
    authUser && !authUser.isWorkspace ? authUser.fullName : state.profile.fullName;
  const displayEmail =
    authUser && !authUser.isWorkspace ? authUser.email : state.profile.email;

  return (
    <>
      {/* Subtle bottom edge atmospheric gradient behind floating capsule */}
      <div
        aria-hidden="true"
        className="md:hidden fixed bottom-0 inset-x-0 h-24 pointer-events-none z-30"
        style={{
          background:
            'linear-gradient(to top, rgba(26, 26, 29, 0.92) 0%, rgba(26, 26, 29, 0.52) 55%, rgba(26, 26, 29, 0) 100%)',
        }}
      />

      {/* Floating 5-Tab Liquid Glass Bottom Navigation Capsule (Mobile < md) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-[max(0.65rem,env(safe-area-inset-bottom))] inset-x-2.5 z-40 max-w-md mx-auto pointer-events-none select-none"
      >
        <div className="pointer-events-auto glass-floating-bar glass-specular-rim rounded-[26px] grid grid-cols-5 items-stretch p-1.5">
          {primaryItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.id && !moreOpen;
            const badgeCount = item.badge ? item.badge(state) : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[48px] rounded-[20px] transition-colors btn-press focus-visible:outline-none"
                aria-current={isActive ? 'page' : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-bottom-active-capsule"
                    transition={
                      prefersReduced
                        ? { duration: 0.01 }
                        : { type: 'spring', stiffness: 450, damping: 34, mass: 0.78 }
                    }
                    className="absolute inset-0.5 rounded-[18px] bg-[#D2925B]/16 border border-[#D2925B]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
                  />
                )}
                <div className="relative z-10 flex items-center justify-center">
                  <Icon
                    className={`w-[20px] h-[20px] transition-colors ${
                      isActive ? 'text-[#D2925B]' : 'text-[#868A7A]'
                    }`}
                    strokeWidth={isActive ? 2.25 : 1.75}
                  />
                  {badgeCount !== null && (
                    <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-[#D2925B] text-[#1A1A1D] font-mono text-[9px] font-bold flex items-center justify-center tabular-nums leading-none shadow-xs">
                      {badgeCount > 9 ? '9+' : badgeCount}
                    </span>
                  )}
                </div>
                <span
                  className={`relative z-10 text-[10px] leading-[12px] tracking-tight whitespace-nowrap transition-colors ${
                    isActive
                      ? 'text-[#D2925B] font-bold'
                      : 'text-[#868A7A] font-medium'
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
            className="relative flex flex-col items-center justify-center gap-0.5 py-1.5 min-h-[48px] rounded-[20px] transition-colors btn-press focus-visible:outline-none"
            aria-expanded={moreOpen}
            aria-label="Open more modules menu"
          >
            {isMoreActive && (
              <motion.span
                layoutId="mobile-bottom-active-capsule"
                transition={
                  prefersReduced
                    ? { duration: 0.01 }
                    : { type: 'spring', stiffness: 450, damping: 34, mass: 0.78 }
                }
                className="absolute inset-0.5 rounded-[18px] bg-[#D2925B]/16 border border-[#D2925B]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]"
              />
            )}
            <Grid2x2
              className={`relative z-10 w-[20px] h-[20px] transition-colors ${
                isMoreActive ? 'text-[#D2925B]' : 'text-[#868A7A]'
              }`}
              strokeWidth={isMoreActive ? 2.25 : 1.75}
            />
            <span
              className={`relative z-10 text-[10px] leading-[12px] tracking-tight whitespace-nowrap transition-colors ${
                isMoreActive
                  ? 'text-[#D2925B] font-bold'
                  : 'text-[#868A7A] font-medium'
              }`}
            >
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Liquid Glass "More" Bottom Sheet */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.18 }}
            onClick={() => setMoreOpen(false)}
            className="md:hidden fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-end"
          >
            <motion.div
              initial={prefersReduced ? { opacity: 1 } : { y: '100%' }}
              animate={{ y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { y: '100%' }}
              transition={{ duration: prefersReduced ? 0.01 : 0.26, ease: MOMENTUM_EASE }}
              onClick={e => e.stopPropagation()}
              className="w-full max-h-[86dvh] glass-sheet glass-specular-rim rounded-t-[30px] border-x-0 border-b-0 flex flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]"
            >
              {/* Drag Pill Handle */}
              <div className="pt-2.5 flex justify-center shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/25" />
              </div>

              {/* Sheet Header */}
              <div className="pt-2 pb-3.5 px-5 border-b border-white/10 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/brand-logo.png"
                    alt="MOMENTUM"
                    className="w-7 h-7 rounded-lg object-contain"
                  />
                  <div>
                    <h2 className="text-sm font-bold text-ink font-heading leading-tight">
                      All Workspaces
                    </h2>
                    <p className="text-[11px] text-brand-blue">MOMENTUM Life OS</p>
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
              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {NAV_GROUPS.map(group => (
                  <div key={group.id} className="space-y-2">
                    <div className="px-1 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-ink-muted">
                      <span>{group.label}</span>
                      <span className="tabular-nums">{group.items.length}</span>
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
                            className={`relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border text-center transition-colors btn-press min-h-[72px] ${
                              active
                                ? 'bg-accent/18 border-accent/60 text-ink font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                                : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-ink hover:border-brand-blue/45 font-medium'
                            }`}
                          >
                            {badgeCount !== null && (
                              <span className="absolute top-2 right-2 px-1.5 py-0.2 rounded-md bg-brand-blue text-brand-blue-ink font-mono text-[9px] font-bold tabular-nums">
                                {badgeCount}
                              </span>
                            )}
                            <Icon
                              className={`w-5 h-5 ${
                                active ? 'text-accent' : 'text-brand-blue'
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
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <div className="px-1 text-[10px] font-mono uppercase tracking-[0.14em] text-ink-muted">
                    System & Account
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect('settings')}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-2xl border text-xs font-semibold btn-press min-h-[44px] ${
                      currentView === 'settings'
                        ? 'glass-accent-pill text-accent-ink border-transparent'
                        : 'glass-control text-ink hover:border-brand-blue/45'
                    }`}
                  >
                    <Settings
                      className={`w-4 h-4 shrink-0 ${
                        currentView === 'settings' ? 'text-accent-ink' : 'text-brand-blue'
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
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl glass-control text-left btn-press min-h-[48px]"
                  >
                    <div className="w-8 h-8 rounded-full glass-blue-chip text-brand-blue flex items-center justify-center text-xs font-bold shrink-0">
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
