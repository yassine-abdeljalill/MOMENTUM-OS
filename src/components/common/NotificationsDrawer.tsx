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
        return <Clock className="w-4 h-4 text-[#B9534F]" />;
      case 'habit':
        return <Sparkles className="w-4 h-4 text-[#D2925B]" />;
      case 'milestone':
        return <Target className="w-4 h-4 text-[#5B8C67]" />;
      default:
        return <Bell className="w-4 h-4 text-[#868A7A]" />;
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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
      <div
        className="w-full max-w-sm h-full bg-[#242B31] border-l border-[#434D56] shadow-2xl flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#434D56] bg-[#22292F]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#D2925B]" />
            <h2 className="font-semibold text-sm text-[#F4F0E9]">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-[#D2925B] text-[#242B31] font-bold">
                {unreadCount} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-[11px] text-[#A8A8A2] hover:text-[#D2925B] transition-colors"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsNotificationsOpen(false)}
              className="p-1 rounded text-[#868A7A] hover:text-[#F4F0E9] hover:bg-[#2E373F]"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#434D56]/40 p-2">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-[#868A7A] space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto opacity-30 text-[#868A7A]" />
              <p className="text-sm font-medium text-[#F4F0E9]">All caught up</p>
              <p className="text-xs text-[#A8A8A2]">No pending alerts or deadline warnings.</p>
            </div>
          ) : (
            notifications.map(item => (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3 rounded-lg transition-colors cursor-pointer group flex items-start gap-3 ${
                  item.read ? 'hover:bg-[#2E373F]/50 opacity-75' : 'bg-[#2E373F]/80 hover:bg-[#2E373F]'
                }`}
              >
                <div className="p-2 rounded-lg bg-[#22292F] border border-[#434D56] shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className={`text-xs font-semibold truncate ${item.read ? 'text-[#F4F0E9]' : 'text-[#D2925B]'}`}>
                      {item.title}
                    </h3>
                    <span className="text-[10px] text-[#868A7A] font-mono shrink-0">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-[#A8A8A2] mt-1 line-clamp-2 leading-relaxed">
                    {item.message}
                  </p>
                  {item.linkTo && (
                    <div className="flex items-center gap-1 text-[11px] text-[#D2925B] mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
