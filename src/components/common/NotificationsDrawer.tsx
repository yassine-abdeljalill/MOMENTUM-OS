import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Target,
  ArrowRight,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useApp, NavigationTab } from '../../lib/context';
import { DrawerShell, MOMENTUM_EASE } from './MotionPrimitives';

export const NotificationsDrawer: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    state,
    markNotificationRead,
    markAllNotificationsRead,
    setCurrentView,
    showToast,
  } = useApp();

  const prefersReduced = useReducedMotion();
  const notifications = state.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-4 h-4 text-danger" />;
      case 'habit':
        return <Sparkles className="w-4 h-4 text-accent" />;
      case 'milestone':
        return <Target className="w-4 h-4 text-success" />;
      default:
        return <Bell className="w-4 h-4 text-ink-muted" />;
    }
  };

  const handleNotificationClick = (item: any) => {
    markNotificationRead(item.id);
    if (item.linkTo) {
      setCurrentView(item.linkTo as NavigationTab);
      setIsNotificationsOpen(false);
    }
  };

  return (
    <DrawerShell
      isOpen={isNotificationsOpen}
      onClose={() => setIsNotificationsOpen(false)}
      side="right"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/[0.03] text-ink">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-brand-blue" />
          <h2 className="font-semibold text-sm font-heading">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md bg-accent text-accent-ink font-bold tabular-nums">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => {
                markAllNotificationsRead();
                showToast('All notifications marked as read.', 'info');
              }}
              className="text-[11px] text-ink-muted hover:text-accent transition-colors btn-press"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(false)}
            className="p-1.5 rounded-xl glass-control text-ink-muted hover:text-ink btn-press"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto space-y-1.5 p-2.5">
        {notifications.length === 0 ? (
          <div className="py-16 text-center text-ink-muted space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto opacity-40 text-ink" />
            <p className="text-sm font-semibold text-ink">All caught up</p>
            <p className="text-xs text-ink-muted">No pending alerts or deadline warnings.</p>
          </div>
        ) : (
          notifications.map((item, idx) => (
            <motion.button
              type="button"
              key={item.id}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: prefersReduced ? 0.01 : 0.18,
                delay: prefersReduced ? 0 : Math.min(idx * 0.03, 0.2),
                ease: MOMENTUM_EASE,
              }}
              onClick={() => handleNotificationClick(item)}
              className={`w-full text-left p-3 rounded-2xl transition-all group flex items-start gap-3 ${
                item.read
                  ? 'hover:bg-white/[0.05] opacity-80'
                  : 'bg-accent/14 hover:bg-accent/20 border border-accent/35'
              }`}
            >
              <div className="p-2 rounded-xl glass-control shrink-0 mt-0.5 transition-transform duration-150 group-hover:scale-105">
                {getIcon(item.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className={`text-xs font-semibold truncate ${item.read ? 'text-ink' : 'text-accent'}`}>
                    {item.title}
                  </h3>
                  <span className="text-[10px] text-ink-muted font-mono shrink-0 tabular-nums">
                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-1 line-clamp-2 leading-relaxed">
                  {item.message}
                </p>
                {item.linkTo && (
                  <div className="flex items-center gap-1 text-[11px] text-accent font-medium mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View details</span>
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                  </div>
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </DrawerShell>
  );
};
