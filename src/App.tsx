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
  const { currentView } = useApp();
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

      {/* Desktop Translucent Liquid Glass Sidebar */}
      <Sidebar />

      {/* Main App Canvas with Floating Liquid Glass Header & Scroll-Under Layer */}
      <div className="relative flex-1 min-w-0 h-full overflow-hidden bg-canvas">
        {/* Ultra-subtle atmospheric radial light strictly using official blue & beige */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse 65% 45% at 15% 0%, rgba(158, 204, 253, 0.045) 0%, transparent 70%), radial-gradient(ellipse 55% 45% at 88% 8%, rgba(210, 146, 91, 0.04) 0%, transparent 70%)',
          }}
        />

        {/* Floating Liquid Glass Top Toolbar */}
        <Header />

        {/* Full-Height Scrollable Content Layer gliding behind floating glass controls */}
        <main
          ref={mainRef}
          className="relative z-10 h-full w-full overflow-y-auto px-3.5 sm:px-5 md:px-7 pt-[calc(5.15rem+env(safe-area-inset-top))] md:pt-[5.75rem] pb-[calc(6.75rem+env(safe-area-inset-bottom))] md:pb-10"
        >
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition viewKey={currentView}>
              {renderCurrentView()}
            </PageTransition>
          </AnimatePresence>
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
