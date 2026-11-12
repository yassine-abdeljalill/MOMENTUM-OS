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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold text-[#3B2418] tracking-tight">
              Personal Journal & Reflection
            </h1>
            <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#3B2418] text-[#8EC5FF]">
              <Lock className="w-3 h-3" />
              <span>Private & Local</span>
            </span>
          </div>
          <p className="text-xs text-[#6E5648]">
            End-of-day reviews, gratitude, lessons learned, and honest personal reflections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowNewEntryModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs transition-all"
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
              <Search className="w-3.5 h-3.5 text-[#6E5648] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search journal entries..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
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
                      ? 'bg-[#3B2418] border-[#5A3927] shadow-md'
                      : 'bg-[#FAF5ED] border-[#D6C6B2] hover:border-[#8EC5FF]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-[#F2E8DA]' : 'text-[#3B2418]'}`}>
                      {entry.title}
                    </h3>
                    <span className={`font-mono text-[10px] shrink-0 ${isSelected ? 'text-[#D8C7B4]' : 'text-[#6E5648]'}`}>
                      {entry.date}
                    </span>
                  </div>

                  <p className={`text-xs line-clamp-2 leading-relaxed ${isSelected ? 'text-[#D8C7B4]' : 'text-[#6E5648]'}`}>
                    {entry.content}
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-[#4D3021] text-[#8EC5FF]' : 'bg-[#F2E8DA] text-[#6E5648] border border-[#D6C6B2]/60'
                    }`}>
                      {entry.category.replace('_', ' ')}
                    </span>
                    {entry.mood && (
                      <span className={`text-[10px] capitalize font-medium ${isSelected ? 'text-[#8EC5FF]' : 'text-[#1E5A99]'}`}>
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
            <div className="p-6 md:p-8 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-6">
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D6C6B2]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#3B2418] text-[#8EC5FF]">
                      {selectedEntry.category.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-[#6E5648]">
                      {selectedEntry.date}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-[#3B2418] pt-1">
                    {selectedEntry.title}
                  </h2>
                </div>

                <button
                  onClick={() => {
                    deleteJournalEntry(selectedEntry.id);
                    setSelectedEntry(null);
                  }}
                  className="text-xs font-semibold text-[#9E3530] hover:underline"
                >
                  Delete
                </button>
              </div>

              {/* Reflection Questions Breakdown if available */}
              {selectedEntry.reflectionQuestions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] text-xs">
                  {selectedEntry.reflectionQuestions.wentWell && (
                    <div>
                      <span className="font-semibold text-[#3E7B52] block">Went Well:</span>
                      <p className="text-[#6E5648] mt-0.5">{selectedEntry.reflectionQuestions.wentWell}</p>
                    </div>
                  )}
                  {selectedEntry.reflectionQuestions.learned && (
                    <div>
                      <span className="font-semibold text-[#1E5A99] block">Learned:</span>
                      <p className="text-[#6E5648] mt-0.5">{selectedEntry.reflectionQuestions.learned}</p>
                    </div>
                  )}
                  {selectedEntry.reflectionQuestions.tomorrowPriority && (
                    <div className="sm:col-span-2 pt-2 border-t border-[#D6C6B2]">
                      <span className="font-semibold text-[#3B2418] block">Tomorrow Priority:</span>
                      <p className="text-[#1E5A99] font-medium mt-0.5">{selectedEntry.reflectionQuestions.tomorrowPriority}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Full Content */}
              <div className="text-sm text-[#3B2418] leading-relaxed whitespace-pre-line font-serif">
                {selectedEntry.content}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-[#6E5648] rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2]">
              No entry selected. Choose one from the left or create a new reflection.
            </div>
          )}
        </div>
      </div>

      {/* New Reflection Modal */}
      {showNewEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2418]/65 backdrop-blur-xs">
          <div
            className="w-full max-w-xl bg-[#FAF5ED] border border-[#D6C6B2] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#5A3927] bg-[#3B2418]">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#8EC5FF]" />
                <h3 className="text-sm font-bold text-[#F2E8DA]">New Journal Entry</h3>
              </div>
              <button
                onClick={() => setShowNewEntryModal(false)}
                className="text-[#D8C7B4] hover:text-[#F2E8DA]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6E5648] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Overcoming resistance on distributed consensus"
                  className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6E5648] mb-1">Entry Type</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as JournalCategory)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
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
                  <label className="block text-xs font-semibold text-[#6E5648] mb-1">Mood</label>
                  <select
                    value={newMood}
                    onChange={e => setNewMood(e.target.value as JournalMood)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  >
                    <option value="great">Great</option>
                    <option value="good">Good</option>
                    <option value="neutral">Neutral</option>
                    <option value="challenging">Challenging</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5648] mb-1">Content</label>
                <textarea
                  rows={6}
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Write freely and honestly..."
                  className="w-full px-4 py-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
                <button
                  type="button"
                  onClick={() => setShowNewEntryModal(false)}
                  className="px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15 shadow-xs"
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
