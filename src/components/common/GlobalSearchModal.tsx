import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  CheckSquare,
  Target,
  FolderGit2,
  GraduationCap,
  Sparkles,
  BookOpen,
  Library,
  ArrowRight,
} from 'lucide-react';
import { useApp, NavigationTab } from '../../lib/context';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    state,
    setCurrentView,
    setSelectedGoalId,
    setSelectedProjectId,
    setSelectedCourseId,
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const results: Array<{
      id: string;
      title: string;
      subtitle: string;
      category: string;
      icon: React.ElementType;
      view: NavigationTab;
      action?: () => void;
    }> = [];

    // Search tasks
    for (const t of state.tasks) {
      if (t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))) {
        results.push({
          id: `task-${t.id}`,
          title: t.title,
          subtitle: `Task • Priority: ${t.priority} • Status: ${t.status}`,
          category: 'Tasks',
          icon: CheckSquare,
          view: 'tasks',
        });
      }
    }

    // Search goals
    for (const g of state.goals) {
      if (g.title.toLowerCase().includes(q) || g.description.toLowerCase().includes(q)) {
        results.push({
          id: `goal-${g.id}`,
          title: g.title,
          subtitle: `Goal • ${g.category} • Target: ${g.targetDate}`,
          category: 'Goals',
          icon: Target,
          view: 'goals',
          action: () => setSelectedGoalId(g.id),
        });
      }
    }

    // Search projects
    for (const p of state.projects) {
      if (p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) {
        results.push({
          id: `proj-${p.id}`,
          title: p.name,
          subtitle: `Project • ${p.category} • ${p.status}`,
          category: 'Projects',
          icon: FolderGit2,
          view: 'projects',
          action: () => setSelectedProjectId(p.id),
        });
      }
    }

    // Search courses
    for (const c of state.courses) {
      if (c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)) {
        results.push({
          id: `course-${c.id}`,
          title: c.title,
          subtitle: `Course • ${c.category} • ${c.lessons.length} lessons`,
          category: 'Learning',
          icon: GraduationCap,
          view: 'learning',
          action: () => setSelectedCourseId(c.id),
        });
      }
      for (const l of c.lessons) {
        if (l.title.toLowerCase().includes(q) || (l.notes && l.notes.toLowerCase().includes(q))) {
          results.push({
            id: `lesson-${l.id}`,
            title: l.title,
            subtitle: `Lesson in ${c.title}`,
            category: 'Learning',
            icon: GraduationCap,
            view: 'learning',
            action: () => setSelectedCourseId(c.id),
          });
        }
      }
    }

    // Search habits
    for (const h of state.habits) {
      if (h.name.toLowerCase().includes(q) || (h.description && h.description.toLowerCase().includes(q))) {
        results.push({
          id: `habit-${h.id}`,
          title: h.name,
          subtitle: `Habit • Frequency: ${h.frequency}`,
          category: 'Habits',
          icon: Sparkles,
          view: 'habits',
        });
      }
    }

    // Search journal
    for (const j of state.journalEntries) {
      if (j.title.toLowerCase().includes(q) || j.content.toLowerCase().includes(q)) {
        results.push({
          id: `journal-${j.id}`,
          title: j.title,
          subtitle: `Journal • ${j.date} • ${j.category.replace('_', ' ')}`,
          category: 'Journal',
          icon: BookOpen,
          view: 'journal',
        });
      }
    }

    // Search resources
    for (const r of state.resources) {
      if (r.title.toLowerCase().includes(q) || (r.description && r.description.toLowerCase().includes(q))) {
        results.push({
          id: `resource-${r.id}`,
          title: r.title,
          subtitle: `Resource • ${r.resourceType} • ${r.category}`,
          category: 'Resources',
          icon: Library,
          view: 'resources',
        });
      }
    }

    return results.slice(0, 15);
  }, [query, state, setSelectedGoalId, setSelectedProjectId, setSelectedCourseId]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 px-4 bg-black/60 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-[#2E373F] border border-[#434D56] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#434D56] gap-3 bg-[#242B31]">
          <Search className="w-5 h-5 text-[#D2925B] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search tasks, goals, projects, courses, notes, habits..."
            className="flex-1 bg-transparent border-0 text-[#F4F0E9] placeholder-[#868A7A] focus:outline-hidden text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[#868A7A] hover:text-[#F4F0E9]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="px-2 py-1 text-xs text-[#868A7A] hover:text-[#F4F0E9] bg-[#2E373F] rounded border border-[#434D56]"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#434D56]/30">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-[#868A7A] space-y-2">
              <Search className="w-8 h-8 mx-auto opacity-40 text-[#D2925B]" />
              <p className="text-sm font-medium text-[#F4F0E9]">Type to search across MOMENTUM</p>
              <p className="text-xs text-[#A8A8A2]">
                Quickly jump to any goal, project, course lesson, habit, or journal reflection.
              </p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-10 text-center text-[#868A7A]">
              <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-[#A8A8A2] mt-1">Try another keyword or filter.</p>
            </div>
          ) : (
            searchResults.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    item.action?.();
                    setCurrentView(item.view);
                    setIsSearchOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#36414A] transition-colors group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded bg-[#242B31] border border-[#434D56] text-[#D2925B] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-[#F4F0E9] truncate group-hover:text-[#D2925B]">
                        {item.title}
                      </span>
                      <span className="text-xs text-[#A8A8A2] truncate">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#242B31] text-[#868A7A] border border-[#434D56]">
                      {item.category}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#868A7A] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
