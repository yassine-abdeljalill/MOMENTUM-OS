import React from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Target,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { useApp, NavigationTab } from '../../lib/context';

export const NotificationsDrawer: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    state,
    markNotificationRead,
    markAllNotificationsRead,
    setCurrentView,
  } = useApp();

  if (!isNotificationsOpen) return null;

  const notifications = state.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case 'deadline':
        return <Clock className="w-4 h-4 text-[#B84A44]" />;
      case 'habit':
        return <Sparkles className="w-4 h-4 text-[#1E5A99]" />;
      case 'milestone':
        return <Target className="w-4 h-4 text-[#3E7B52]" />;
      default:
        return <Bell className="w-4 h-4 text-[#6E5648]" />;
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
    <div className="fixed inset-0 z-50 flex justify-end bg-[#3B2418]/50 backdrop-blur-xs">
      <div
        className="w-full max-w-sm h-full bg-[#FAF5ED] border-l border-[#D6C6B2] shadow-2xl flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#5A3927] bg-[#3B2418]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#8EC5FF]" />
            <h2 className="font-semibold text-sm text-[#F2E8DA]">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#8EC5FF] text-[#3B2418] font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[11px] text-[#D8C7B4] hover:text-[#8EC5FF] transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="p-1 rounded text-[#D8C7B4] hover:text-[#F2E8DA] hover:bg-[#4D3021]"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#D6C6B2]/60 p-2">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-[#6E5648] space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto opacity-40 text-[#3B2418]" />
              <p className="text-sm font-semibold text-[#3B2418]">All caught up</p>
              <p className="text-xs text-[#6E5648]">No pending alerts or deadline warnings.</p>
            </div>
          ) : (
            notifications.map(item => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3 rounded-lg transition-colors cursor-pointer group flex items-start gap-3 ${
                  item.read ? 'hover:bg-[#F2E8DA] opacity-80' : 'bg-[#8EC5FF]/20 hover:bg-[#8EC5FF]/35 border border-[#8EC5FF]/50'
                }`}
              >
                <div className="p-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className={`text-xs font-semibold truncate ${item.read ? 'text-[#3B2418]' : 'text-[#1E5A99]'}`}>
                      {item.title}
                    </h3>
                    <span className="text-[10px] text-[#6E5648] font-mono shrink-0">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#6E5648] mt-1 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  {item.linkTo && (
                    <div className="flex items-center gap-1 text-[11px] text-[#1E5A99] font-medium mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>View details</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
