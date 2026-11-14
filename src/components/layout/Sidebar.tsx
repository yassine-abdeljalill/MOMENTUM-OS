import React, { useState } from 'react';
import {
  Settings,
  ChevronLeft,
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp, NavigationTab } from '../../lib/context';
import { MOMENTUM_EASE } from '../common/MotionPrimitives';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { NAV_GROUPS } from './navConfig';

export const Sidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    state,
    authUser,
    setIsAuthModalOpen,
  } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleNavClick = (view: NavigationTab) => {
    setCurrentView(view);
  };

  const displayName =
    authUser && !authUser.isWorkspace ? authUser.fullName : state.profile.fullName;
  const displayEmail =
    authUser && !authUser.isWorkspace ? authUser.email : state.profile.email;

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 68 : 252 }}
      transition={{ duration: prefersReduced ? 0.01 : 0.22, ease: MOMENTUM_EASE }}
      className="hidden md:flex flex-col shrink-0 bg-sidebar text-sidebar-ink h-dvh sticky top-0 z-30 border-r border-sidebar-border overflow-hidden select-none"
      aria-label="Primary sidebar"
    >
      {/* Brand Header */}
      <div className="h-15 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
        <div className={`flex items-center gap-3 min-w-0 ${isCollapsed ? 'mx-auto' : ''}`}>
          <img
            src="/brand-logo.png"
            alt="MOMENTUM logo"
            className="w-8 h-8 rounded-lg object-contain shadow-md shrink-0"
          />
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={prefersReduced ? { opacity: 0 } : { opacity: 0, width: 0 }}
                transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                className="flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="font-bold text-sm tracking-[0.14em] text-sidebar-ink uppercase font-heading">
                  MOMENTUM
                </span>
                <span className="text-[10px] text-brand-blue font-medium tracking-tight">
                  Personal Life OS
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isCollapsed && (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-ink hover:bg-sidebar-surface transition-colors btn-press shrink-0"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <div className="px-2 pt-2 flex justify-center shrink-0">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="w-full py-1.5 rounded-lg text-sidebar-muted hover:text-sidebar-ink hover:bg-sidebar-surface transition-colors btn-press flex items-center justify-center"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        </div>
      )}

      {/* Philosophy Quote Banner */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
            className="mx-3 overflow-hidden shrink-0"
          >
            <div className="px-3 py-2 rounded-xl bg-sidebar-surface border border-sidebar-border text-[11px] text-sidebar-muted font-serif italic leading-snug">
              &ldquo;Don&apos;t just track what you do. Track who you&apos;re becoming.&rdquo;
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grouped Navigation Links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2.5 py-3 space-y-4">
        {NAV_GROUPS.map(group => (
          <div key={group.id} className="space-y-1">
            {!isCollapsed ? (
              <div className="px-2.5 pb-0.5 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-sidebar-muted">
                <span>{group.label}</span>
                <span className="tabular-nums opacity-75">{group.items.length}</span>
              </div>
            ) : (
              <div className="mx-3 border-t border-sidebar-border/80 my-1" />
            )}

            <div className="space-y-0.5">
              {group.items.map(item => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                const badgeCount = item.badge ? item.badge(state) : null;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors duration-150 group relative btn-press ${
                      isActive
                        ? 'text-accent-ink font-semibold'
                        : 'text-sidebar-ink/85 hover:text-sidebar-ink hover:bg-sidebar-surface font-medium'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="desktop-sidebar-active-pill"
                        transition={{
                          type: 'spring',
                          stiffness: 420,
                          damping: 34,
                          mass: 0.8,
                        }}
                        className="absolute inset-0 rounded-xl bg-accent shadow-sm z-0"
                      />
                    )}

                    <Icon
                      className={`w-4 h-4 shrink-0 relative z-10 transition-transform duration-150 ${
                        isActive
                          ? 'text-accent-ink scale-105'
                          : 'text-ink-muted group-hover:text-brand-blue group-hover:translate-x-0.5'
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="flex-1 text-left truncate relative z-10 transition-transform duration-150 group-hover:translate-x-0.5">
                        {item.label}
                      </span>
                    )}

                    {!isCollapsed && badgeCount !== null && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] rounded-md font-mono font-bold tabular-nums relative z-10 transition-colors ${
                          isActive
                            ? 'bg-[#1A1A1D] text-accent'
                            : 'bg-[#1A1A1D] text-brand-blue border border-brand-blue/30'
                        }`}
                      >
                        {badgeCount}
                      </span>
                    )}

                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2.5 py-1 rounded-lg bg-[#1A1A1D] text-ink text-xs shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50 border border-brand-blue/40">
                        {item.label}
                        {badgeCount !== null && ` (${badgeCount})`}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Dock */}
      <div className="p-2.5 border-t border-sidebar-border space-y-1 shrink-0 bg-sidebar">
        <PWAInstallButton compact={isCollapsed} />

        {/* Settings */}
        <button
          type="button"
          onClick={() => handleNavClick('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors duration-150 group relative btn-press ${
            currentView === 'settings'
              ? 'text-accent-ink font-semibold'
              : 'text-sidebar-ink/85 hover:text-sidebar-ink hover:bg-sidebar-surface'
          } ${isCollapsed ? 'justify-center px-2' : ''}`}
          title={isCollapsed ? 'Settings' : undefined}
        >
          {currentView === 'settings' && (
            <motion.div
              layoutId="desktop-sidebar-active-pill"
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 34,
                mass: 0.8,
              }}
              className="absolute inset-0 rounded-xl bg-accent shadow-sm z-0"
            />
          )}
          <Settings
            className={`w-4 h-4 shrink-0 relative z-10 transition-transform duration-200 ${
              currentView === 'settings'
                ? 'text-accent-ink'
                : 'text-ink-muted group-hover:text-brand-blue group-hover:rotate-45'
            }`}
          />
          {!isCollapsed && <span className="flex-1 text-left relative z-10">Settings</span>}
        </button>

        {/* User Account / Profile Trigger */}
        <button
          type="button"
          onClick={() => setIsAuthModalOpen(true)}
          className={`w-full mt-1 pt-2 border-t border-sidebar-border flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-sidebar-surface transition-colors btn-press text-left ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={displayName}
        >
          <div className="w-7 h-7 rounded-full bg-brand-blue/15 border border-brand-blue/50 flex items-center justify-center text-xs font-bold text-brand-blue shrink-0">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-sidebar-ink truncate">
                {displayName}
              </span>
              <span className="text-[10px] text-sidebar-muted truncate">
                {displayEmail}
              </span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
};
