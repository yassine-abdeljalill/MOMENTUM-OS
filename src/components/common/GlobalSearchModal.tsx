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
import { motion, useReducedMotion } from 'motion/react';
import { useApp, NavigationTab } from '../../lib/context';
import { ModalShell, MOMENTUM_EASE } from './MotionPrimitives';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    state,
    learningData,
    setCurrentView,
    setSelectedGoalId,
    setSelectedProjectId,
    setSelectedCourseId,
    setSelectedLearningModuleId,
    setSelectedLearningLessonId,
  } = useApp();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const prefersReduced = useReducedMotion();

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

    // Search Learning Modules, Lessons & Rich-Text Notes
    if (learningData) {
      const modulesById = new Map(learningData.modules.map(m => [m.id, m]));
      const lessonsById = new Map(learningData.lessons.map(l => [l.id, l]));

      for (const m of learningData.modules) {
        if (m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q)) {
          const count = learningData.lessons.filter(l => l.moduleId === m.id).length;
          results.push({
            id: `lmod-${m.id}`,
            title: m.title,
            subtitle: `Learning Module • ${count} lesson${count === 1 ? '' : 's'}`,
            category: 'Learning',
            icon: GraduationCap,
            view: 'learning',
            action: () => {
              setSelectedLearningLessonId(null);
              setSelectedLearningModuleId(m.id);
            },
          });
        }
      }

      for (const l of learningData.lessons) {
        if (
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.teacherName.toLowerCase().includes(q)
        ) {
          const mod = modulesById.get(l.moduleId);
          results.push({
            id: `lles-${l.id}`,
            title: l.title,
            subtitle: `Lesson${mod ? ` in ${mod.title}` : ''}${l.teacherName ? ` • ${l.teacherName}` : ''}`,
            category: 'Learning',
            icon: GraduationCap,
            view: 'learning',
            action: () => {
              setSelectedLearningModuleId(l.moduleId);
              setSelectedLearningLessonId(l.id);
            },
          });
        }
      }

      for (const n of learningData.notes) {
        if (n.title.toLowerCase().includes(q) || n.plainText.toLowerCase().includes(q)) {
          const les = lessonsById.get(n.lessonId);
          results.push({
            id: `lnote-${n.id}`,
            title: n.title,
            subtitle: `Lesson Note${les ? ` • ${les.title}` : ''}`,
            category: 'Notes',
            icon: BookOpen,
            view: 'learning',
            action: () => {
              if (les) setSelectedLearningModuleId(les.moduleId);
              setSelectedLearningLessonId(n.lessonId);
            },
          });
        }
      }
    } else {
      // Fallback legacy courses search if learningData hasn't loaded
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
  }, [
    query,
    state,
    learningData,
    setSelectedGoalId,
    setSelectedProjectId,
    setSelectedCourseId,
    setSelectedLearningModuleId,
    setSelectedLearningLessonId,
  ]);

  return (
    <ModalShell
      isOpen={isSearchOpen}
      onClose={() => setIsSearchOpen(false)}
      alignTop
      maxWidthClass="max-w-2xl"
      backdropClassName="bg-[#3B2418]/60 backdrop-blur-xs"
      panelClassName="bg-[#FAF5ED] border border-[#D6C6B2] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
    >
      {/* Search Input Bar */}
      <div className="flex items-center px-4 py-3.5 border-b border-[#5A3927] gap-3 bg-[#3B2418]">
        <Search className="w-5 h-5 text-[#8EC5FF] shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search tasks, goals, projects, courses, notes, habits..."
          className="flex-1 bg-transparent border-0 text-[#F2E8DA] placeholder-[#D8C7B4]/70 focus:outline-hidden text-sm"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1 text-[#D8C7B4] hover:text-[#F2E8DA] btn-press"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => setIsSearchOpen(false)}
          className="px-2 py-1 text-xs text-[#F2E8DA] hover:text-[#8EC5FF] bg-[#4D3021] rounded border border-[#5A3927] btn-press"
        >
          ESC
        </button>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-y-auto p-2 divide-y divide-[#D6C6B2]/60">
        {query.trim() === '' ? (
          <div className="py-12 text-center text-[#6E5648] space-y-2">
            <div className="w-12 h-12 rounded-xl bg-[#8EC5FF]/30 border border-[#8EC5FF] flex items-center justify-center mx-auto">
              <Search className="w-6 h-6 text-[#3B2418]" />
            </div>
            <p className="text-sm font-semibold text-[#3B2418]">Type to search across MOMENTUM</p>
            <p className="text-xs text-[#6E5648]">
              Quickly jump to any goal, project, course lesson, habit, or journal reflection.
            </p>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="py-10 text-center text-[#6E5648]">
            <p className="text-sm font-medium text-[#3B2418]">No results found for &ldquo;{query}&rdquo;</p>
            <p className="text-xs text-[#6E5648] mt-1">Try another keyword or filter.</p>
          </div>
        ) : (
          searchResults.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.id}
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: prefersReduced ? 0.01 : 0.14,
                  delay: prefersReduced ? 0 : Math.min(idx * 0.02, 0.16),
                  ease: MOMENTUM_EASE,
                }}
                onClick={() => {
                  item.action?.();
                  setCurrentView(item.view);
                  setIsSearchOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-[#F2E8DA] transition-colors group text-left btn-press"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded bg-[#3B2418] text-[#8EC5FF] shrink-0 transition-transform duration-150 group-hover:scale-105">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-[#3B2418] truncate group-hover:text-[#1E5A99]">
                      {item.title}
                    </span>
                    <span className="text-xs text-[#6E5648] truncate">
                      {item.subtitle}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-3">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#8EC5FF]/40 text-[#3B2418] border border-[#8EC5FF] font-semibold">
                    {item.category}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#3B2418] opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </div>
              </motion.button>
            );
          })
        )}
      </div>
    </ModalShell>
  );
};
