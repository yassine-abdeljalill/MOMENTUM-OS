import React, { useEffect, useRef } from 'react';
import { AnimatePresence, MotionConfig } from 'motion/react';
import { AppProvider, useApp } from './lib/context';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { IntroSplash } from './components/common/IntroSplash';
import { OverviewView } from './components/views/OverviewView';
import { TodayView } from './components/views/TodayView';
import { TasksView } from './components/views/TasksView';
import { CalendarView } from './components/views/CalendarView';
import { GoalsView } from './components/views/GoalsView';
import { ProjectsView } from './components/views/ProjectsView';
import { LearningView } from './components/views/LearningView';
import { FitnessView } from './components/views/FitnessView';
import { HabitsView } from './components/views/HabitsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { JournalView } from './components/views/JournalView';
import { ResourcesView } from './components/views/ResourcesView';
import { FinanceView } from './components/views/FinanceView';
import { SettingsView } from './components/views/SettingsView';

import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickAddModal } from './components/common/QuickAddModal';
import { FocusTimerModal } from './components/common/FocusTimerModal';
import { NotificationsDrawer } from './components/common/NotificationsDrawer';
import { OnboardingModal } from './components/common/OnboardingModal';
import { AuthModal } from './components/views/AuthModal';
import { PageTransition } from './components/common/MotionPrimitives';
import { ToastContainer } from './components/common/ToastContainer';

const MainContent: React.FC = () => {
  const { currentView, setCurrentView } = useApp();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [currentView]);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'overview':
        return <OverviewView />;
      case 'today':
        return <TodayView />;
      case 'tasks':
        return <TasksView />;
      case 'calendar':
        return <CalendarView />;
      case 'goals':
        return <GoalsView />;
      case 'projects':
        return <ProjectsView />;
      case 'learning':
        return <LearningView />;
      case 'fitness':
        return <FitnessView />;
      case 'habits':
        return <HabitsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'journal':
        return <JournalView />;
      case 'resources':
        return <ResourcesView />;
      case 'finance':
        return <FinanceView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-canvas text-ink">
      {/* Animated Liquid Glass Intro Splash (session-gated, bypassed with ?autostart=1) */}
      <IntroSplash />

      {/* Desktop / Tablet Sidebar */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="relative flex-1 min-w-0 h-full flex flex-col overflow-hidden bg-canvas">
        {/* Minimal Top Bar */}
        <Header />

        {/* Scrollable Content Viewport */}
        <main
          ref={mainRef}
          className="relative z-10 flex-1 min-h-0 w-full overflow-y-auto flex flex-col px-4 sm:px-6 md:px-8 pt-6 md:pt-8 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-8"
        >
          <div className="flex-1">
            <AnimatePresence mode="wait" initial={false}>
              <PageTransition viewKey={currentView}>
                {renderCurrentView()}
              </PageTransition>
            </AnimatePresence>
          </div>

          <footer className="hidden md:flex flex-wrap w-full max-w-7xl mx-auto mt-10 pt-5 border-t border-line items-center justify-between gap-x-6 gap-y-2 text-xs text-ink-muted shrink-0">
            <span>MOMENTUM · Personal Workspace</span>
            <nav aria-label="Footer quick links" className="flex flex-wrap items-center gap-x-5 gap-y-1">
              {(
                [
                  { id: 'overview', label: 'Overview' },
                  { id: 'today', label: 'Today' },
                  { id: 'tasks', label: 'Tasks' },
                  { id: 'calendar', label: 'Calendar' },
                  { id: 'finance', label: 'Finance' },
                  { id: 'settings', label: 'Settings' },
                ] as const
              ).map(link => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => setCurrentView(link.id)}
                  className={`transition-colors whitespace-nowrap hover:text-ink ${
                    currentView === link.id ? 'text-stone font-medium' : ''
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </footer>
        </main>
      </div>

      {/* Floating Mobile Liquid Glass Capsule & More Sheet */}
      <MobileNav />

      {/* Global Modals & Overlays */}
      <GlobalSearchModal />
      <QuickAddModal />
      <FocusTimerModal />
      <NotificationsDrawer />
      <OnboardingModal />
      <AuthModal />
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <MainContent />
      </AppProvider>
    </MotionConfig>
  );
}
