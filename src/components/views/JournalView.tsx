import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Lock,
  Trash2,
  Tag,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { JournalCategory, JournalEntry, JournalMood } from '../../types';

export const JournalView: React.FC = () => {
  const { state, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(
    state.journalEntries[0] || null
  );

  // New entry modal state
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
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#2E373F] border border-[#434D56]/60">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#F4F0E9] tracking-tight">
              Personal Journal & Reflection
            </h1>
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#64432B] text-[#D2925B]">
              <Lock className="w-3 h-3" />
              <span>Private & Local</span>
            </span>
          </div>
          <p className="text-xs text-[#A8A8A2]">
            End-of-day reviews, gratitude, lessons learned, and honest personal reflections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewEntryModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#D2925B] hover:bg-[#C2824B] text-[#242B31] font-bold text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Reflection</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Entries List + Reading/Writing View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Search, Filter & Entries List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-[#868A7A] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search journal entries..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
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
            {filteredEntries.map(entry => {
              const isSelected = selectedEntry && selectedEntry.id === entry.id;

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-[#2E373F] border-[#D2925B] shadow-md'
                      : 'bg-[#242B31] border-[#434D56] hover:border-[#868A7A]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-[#D2925B]' : 'text-[#F4F0E9]'}`}>
                      {entry.title}
                    </h3>
                    <span className="font-mono text-[10px] text-[#868A7A] shrink-0">
                      {entry.date}
                    </span>
                  </div>

                  <p className="text-xs text-[#A8A8A2] line-clamp-2 leading-relaxed">
                    {entry.content}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-[#2E373F] text-[#868A7A]">
                      {entry.category.replace('_', ' ')}
                    </span>
                    {entry.mood && (
                      <span className="text-[10px] text-[#D2925B] capitalize">
                        • Mood: {entry.mood}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 cols): Selected Entry Reader / Editor */}
        <div className="lg:col-span-7">
          {selectedEntry ? (
            <div className="p-6 md:p-8 rounded-2xl bg-[#2E373F] border border-[#434D56]/60 space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#434D56]/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#242B31] text-[#D2925B]">
                      {selectedEntry.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-[#868A7A]">
                      {selectedEntry.date}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#F4F0E9] pt-1">
                    {selectedEntry.title}
                  </h2>
                </div>

                <button
                  onClick={() => {
                    deleteJournalEntry(selectedEntry.id);
                    setSelectedEntry(null);
                  }}
                  className="text-xs text-[#E57373] hover:underline"
                >
                  Delete
                </button>
              </div>

              {/* Reflection Questions Breakdown if available */}
              {selectedEntry.reflectionQuestions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#242B31] border border-[#434D56]/60 text-xs">
                  {selectedEntry.reflectionQuestions.wentWell && (
                    <div>
                      <span className="font-semibold text-[#5B8C67] block">Went Well:</span>
                      <p className="text-[#A8A8A2] mt-0.5">{selectedEntry.reflectionQuestions.wentWell}</p>
                    </div>
                  )}
                  {selectedEntry.reflectionQuestions.learned && (
                    <div>
                      <span className="font-semibold text-[#D2925B] block">Learned:</span>
                      <p className="text-[#A8A8A2] mt-0.5">{selectedEntry.reflectionQuestions.learned}</p>
                    </div>
                  )}
                  {selectedEntry.reflectionQuestions.tomorrowPriority && (
                    <div className="sm:col-span-2 pt-2 border-t border-[#434D56]/30">
                      <span className="font-semibold text-[#F4F0E9] block">Tomorrow Priority:</span>
                      <p className="text-[#D2925B] mt-0.5">{selectedEntry.reflectionQuestions.tomorrowPriority}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Full Content */}
              <div className="text-sm text-[#F4F0E9] leading-relaxed whitespace-pre-line font-serif">
                {selectedEntry.content}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-[#868A7A] rounded-2xl bg-[#2E373F] border border-[#434D56]">
              No entry selected. Choose one from the left or create a new reflection.
            </div>
          )}
        </div>
      </div>

      {/* New Reflection Modal */}
      {showNewEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className="w-full max-w-xl bg-[#242B31] border border-[#434D56] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#434D56] bg-[#22292F]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#D2925B]" />
                <h3 className="text-sm font-bold text-[#F4F0E9]">New Journal Entry</h3>
              </div>
              <button
                onClick={() => setShowNewEntryModal(false)}
                className="text-[#868A7A] hover:text-[#F4F0E9]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Overcoming resistance on distributed consensus"
                  className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Entry Type</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as JournalCategory)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
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
                  <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Mood</label>
                  <select
                    value={newMood}
                    onChange={e => setNewMood(e.target.value as JournalMood)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden"
                  >
                    <option value="great">Great</option>
                    <option value="good">Good</option>
                    <option value="neutral">Neutral</option>
                    <option value="challenging">Challenging</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#A8A8A2] mb-1">Content</label>
                <textarea
                  rows={6}
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Write freely and honestly..."
                  className="w-full px-4 py-3 rounded-xl bg-[#2E373F] border border-[#434D56] text-xs text-[#F4F0E9] focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#434D56]">
                <button
                  type="button"
                  onClick={() => setShowNewEntryModal(false)}
                  className="px-3 py-1.5 text-xs text-[#868A7A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B]"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
