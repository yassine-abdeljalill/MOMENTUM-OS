import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Lock,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useApp } from '../../lib/context';
import { JournalCategory, JournalEntry, JournalMood } from '../../types';
import { MOMENTUM_EASE, ModalShell } from '../common/MotionPrimitives';

export const JournalView: React.FC = () => {
  const { state, addJournalEntry, deleteJournalEntry, showToast } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(
    state.journalEntries[0] || null
  );

  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<JournalCategory>('daily_reflection');
  const [newMood, setNewMood] = useState<JournalMood>('good');
  const [newContent, setNewContent] = useState('');

  const filteredEntries = state.journalEntries.filter(entry => {
    if (categoryFilter !== 'all' && entry.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        entry.title.toLowerCase().includes(q) ||
        entry.content.toLowerCase().includes(q) ||
        entry.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const created = addJournalEntry({
      title: newTitle.trim(),
      content: newContent.trim(),
      date: new Date().toISOString().split('T')[0],
      category: newCategory,
      mood: newMood,
      tags: ['reflection'],
    });

    setNewTitle('');
    setNewContent('');
    setShowNewEntryModal(false);
    setSelectedEntry(created);
    showToast('Reflection saved to journal.', 'success');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-line">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-ink tracking-tight">
              Personal Journal & Reflection
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-ink-muted">
              <Lock className="w-3 h-3 text-accent" />
              <span>Private & Local</span>
            </span>
          </div>
          <p className="text-xs text-ink-muted">
            End-of-day reviews, gratitude, lessons learned, and honest personal reflections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowNewEntryModal(true)}
            className="btn-press flex items-center gap-1.5 px-4 py-2 min-h-[44px] sm:min-h-0 rounded-xl bg-accent hover:bg-accent-hover text-accent-ink font-semibold text-xs transition-all whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Reflection</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Entries List + Reading/Writing View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search journal entries..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-surface border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
              aria-label="Filter journal entries by type"
            >
              <option value="all">All Types</option>
              <option value="daily_reflection">Daily</option>
              <option value="weekly_review">Weekly</option>
              <option value="monthly_review">Monthly</option>
              <option value="gratitude">Gratitude</option>
              <option value="lessons_learned">Lessons</option>
            </select>
          </div>

          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {filteredEntries.map(entry => {
                const isSelected = selectedEntry && selectedEntry.id === entry.id;

                return (
                  <motion.button
                    type="button"
                    layout
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
                    onClick={() => setSelectedEntry(entry)}
                    className={`w-full text-left card-hover p-4 rounded-2xl border transition-colors space-y-2 ${
                      isSelected
                        ? 'bg-surface-warm border-accent text-ink'
                        : 'bg-surface border-line hover:border-accent/60 text-ink'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-accent' : 'text-ink'}`}>
                        {entry.title}
                      </h3>
                      <span className="font-mono text-[10px] shrink-0 tabular-nums text-ink-muted">
                        {entry.date}
                      </span>
                    </div>

                    <p className="text-xs line-clamp-2 leading-relaxed text-ink-muted">
                      {entry.content}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[10px] font-mono uppercase">
                      <span className={isSelected ? 'text-brand-blue' : 'text-ink-muted'}>
                        {entry.category.replace('_', ' ')}
                      </span>
                      {entry.mood && (
                        <span className="text-accent">
                          · Mood: {entry.mood}
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedEntry ? (
              <motion.div
                key={selectedEntry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: MOMENTUM_EASE }}
                className="p-6 md:p-8 rounded-2xl bg-surface border border-line space-y-6"
              >
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="uppercase text-accent font-semibold">
                        {selectedEntry.category.replace('_', ' ')}
                      </span>
                      <span className="text-line-strong" aria-hidden="true">·</span>
                      <span className="text-ink-muted tabular-nums">{selectedEntry.date}</span>
                    </div>
                    <h2 className="text-xl font-bold text-ink pt-1">
                      {selectedEntry.title}
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      deleteJournalEntry(selectedEntry.id);
                      setSelectedEntry(null);
                      showToast('Journal entry deleted.', 'info');
                    }}
                    className="btn-press text-xs font-semibold text-danger hover:underline"
                  >
                    Delete
                  </button>
                </div>

                {selectedEntry.reflectionQuestions && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-canvas border border-line text-xs">
                    {selectedEntry.reflectionQuestions.wentWell && (
                      <div>
                        <span className="font-semibold text-success block">Went Well:</span>
                        <p className="text-ink-muted mt-0.5">{selectedEntry.reflectionQuestions.wentWell}</p>
                      </div>
                    )}
                    {selectedEntry.reflectionQuestions.learned && (
                      <div>
                        <span className="font-semibold text-accent block">Learned:</span>
                        <p className="text-ink-muted mt-0.5">{selectedEntry.reflectionQuestions.learned}</p>
                      </div>
                    )}
                    {selectedEntry.reflectionQuestions.tomorrowPriority && (
                      <div className="sm:col-span-2 pt-2 border-t border-line">
                        <span className="font-semibold text-ink block">Tomorrow Priority:</span>
                        <p className="text-accent font-medium mt-0.5">
                          {selectedEntry.reflectionQuestions.tomorrowPriority}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="text-sm text-ink leading-relaxed whitespace-pre-line font-serif">
                  {selectedEntry.content}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-journal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-12 text-center text-ink-muted rounded-2xl bg-surface border border-line text-sm"
              >
                No entry selected. Choose one from the left or create a new reflection.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* New Reflection Modal */}
      <ModalShell
        isOpen={showNewEntryModal}
        onClose={() => setShowNewEntryModal(false)}
        maxWidthClass="max-w-xl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface-warm">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-blue" />
            <h3 className="text-sm font-bold text-ink">New Journal Entry</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowNewEntryModal(false)}
            className="text-ink-muted hover:text-ink transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleCreateEntry} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Title</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="e.g. Overcoming resistance on distributed consensus"
              className="w-full px-3 py-2 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Entry Type</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as JournalCategory)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
              >
                <option value="daily_reflection">Daily Reflection</option>
                <option value="weekly_review">Weekly Review</option>
                <option value="monthly_review">Monthly Review</option>
                <option value="gratitude">Gratitude</option>
                <option value="lessons_learned">Lessons Learned</option>
                <option value="free_writing">Free Writing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-muted mb-1">Mood</label>
              <select
                value={newMood}
                onChange={e => setNewMood(e.target.value as JournalMood)}
                className="w-full px-2.5 py-2 rounded-xl bg-canvas border border-line text-xs text-ink focus:ring-2 focus:ring-accent focus:outline-hidden"
              >
                <option value="great">Great</option>
                <option value="good">Good</option>
                <option value="neutral">Neutral</option>
                <option value="challenging">Challenging</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-muted mb-1">Content</label>
            <textarea
              rows={6}
              required
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Write freely and honestly..."
              className="w-full px-4 py-3 rounded-xl bg-canvas border border-line text-xs text-ink placeholder:text-ink-muted focus:ring-2 focus:ring-accent focus:outline-hidden leading-relaxed"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => setShowNewEntryModal(false)}
              className="btn-press px-3 py-1.5 text-xs text-ink-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-1.5 rounded-xl text-xs font-semibold bg-accent text-accent-ink hover:bg-accent-hover"
            >
              Save Entry
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
