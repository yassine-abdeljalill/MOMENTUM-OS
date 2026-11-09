import React from 'react';
import { AppProvider, useApp } from './lib/context';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
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
import { SettingsView } from './components/views/SettingsView';

import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { QuickAddModal } from './components/common/QuickAddModal';
import { FocusTimerModal } from './components/common/FocusTimerModal';
import { NotificationsDrawer } from './components/common/NotificationsDrawer';
import { OnboardingModal } from './components/common/OnboardingModal';
import { AuthModal } from './components/views/AuthModal';

const MainContent: React.FC = () => {
  const { currentView } = useApp();

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
      case 'settings':
        return <SettingsView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#242B31] text-[#F4F0E9]">
      {/* Persistent Left Sidebar */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <Header />

        {/* Dynamic Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8 bg-[#242B31]">
          {renderCurrentView()}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <GlobalSearchModal />
      <QuickAddModal />
      <FocusTimerModal />
      <NotificationsDrawer />
      <OnboardingModal />
      <AuthModal />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
