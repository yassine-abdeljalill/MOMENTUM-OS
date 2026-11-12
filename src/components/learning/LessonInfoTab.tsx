import React, { useEffect, useState } from 'react';
import { Calendar, Check, Clock, Plus, Save, User, X } from 'lucide-react';
import type { LearningLesson, LearningStatus } from '../../types/learning';
import { learningApi } from '../../lib/learningApi';
import { useApp } from '../../lib/context';

export const LessonInfoTab: React.FC<{
  lesson: LearningLesson;
}> = ({ lesson }) => {
  const { updateLearningData, showToast } = useApp();

  const [title, setTitle] = useState(lesson.title);
  const [description, setDescription] = useState(lesson.description);
  const [teacherName, setTeacherName] = useState(lesson.teacherName);
  const [lessonDate, setLessonDate] = useState(lesson.lessonDate);
  const [status, setStatus] = useState<LearningStatus>(lesson.status);
  const [studyDurationMinutes, setStudyDurationMinutes] = useState(lesson.studyDurationMinutes);
  const [objectives, setObjectives] = useState<string[]>(lesson.learningObjectives || []);
  const [newObjective, setNewObjective] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(lesson.title);
    setDescription(lesson.description);
    setTeacherName(lesson.teacherName);
    setLessonDate(lesson.lessonDate);
    setStatus(lesson.status);
    setStudyDurationMinutes(lesson.studyDurationMinutes);
    setObjectives(lesson.learningObjectives || []);
  }, [lesson]);

  const handleAddObjective = () => {
    const trimmed = newObjective.trim();
    if (!trimmed) return;
    setObjectives(prev => [...prev, trimmed]);
    setNewObjective('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const { lesson: updated } = await learningApi.updateLesson(lesson.id, {
        title: title.trim(),
        description: description.trim(),
        teacherName: teacherName.trim(),
        lessonDate,
        status,
        studyDurationMinutes: Math.max(5, Number(studyDurationMinutes) || 60),
        learningObjectives: objectives,
      });
      updateLearningData(prev => ({
        ...prev,
        lessons: prev.lessons.map(l => (l.id === updated.id ? updated : l)),
      }));
      showToast('Lesson information updated');
    } catch (err: any) {
      showToast(err?.message || 'Failed to update lesson info.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] space-y-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#D6C6B2]">
          <div>
            <h3 className="text-sm font-bold text-[#3B2418]">Lesson Information & Objectives</h3>
            <p className="text-xs text-[#6E5648]">
              Maintain syllabus metadata, instructor details, dates, and target outcomes.
            </p>
          </div>
          <div className="text-[11px] font-mono text-[#6E5648] tabular-nums">
            Last updated: {new Date(lesson.updatedAt).toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Lesson Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs font-medium text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              <span className="inline-flex items-center gap-1">
                <User className="w-3 h-3" /> Teacher / Instructor
              </span>
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={e => setTeacherName(e.target.value)}
              placeholder="e.g. Dr. Katherine Meyer"
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Lesson Date
              </span>
            </label>
            <input
              type="date"
              value={lessonDate}
              onChange={e => setLessonDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Completion Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as LearningStatus)}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs font-medium text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            >
              <option value="not_started">Not Started</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> Study Duration (Minutes)
              </span>
            </label>
            <input
              type="number"
              min={5}
              max={600}
              value={studyDurationMinutes}
              onChange={e => setStudyDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs font-mono text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#6E5648] mb-1">Lesson Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Overview of key topics, theorems, or practical architectures covered..."
              className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] leading-relaxed focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="space-y-3 pt-2 border-t border-[#D6C6B2]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[#3B2418]">Learning Objectives</label>
            <span className="text-[11px] font-mono text-[#6E5648] tabular-nums">
              {objectives.length} objective{objectives.length === 1 ? '' : 's'}
            </span>
          </div>

          {objectives.length > 0 ? (
            <ul className="space-y-2">
              {objectives.map((obj, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Check className="w-3.5 h-3.5 text-[#1E5A99] shrink-0" />
                    <span className="truncate">{obj}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setObjectives(prev => prev.filter((_, i) => i !== idx))}
                    className="p-1 text-[#6E5648] hover:text-[#B84A44] shrink-0"
                    aria-label="Remove objective"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#6E5648]">
              No learning objectives added yet.
            </p>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={newObjective}
              onChange={e => setNewObjective(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddObjective();
                }
              }}
              placeholder="Add a learning objective and press Enter..."
              className="flex-1 px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
            />
            <button
              type="button"
              onClick={handleAddObjective}
              className="btn-press flex items-center gap-1 px-3 py-2 rounded-lg bg-[#EAE0D0] hover:bg-[#E3D5C1] text-[#3B2418] border border-[#D6C6B2] text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-[#D6C6B2]">
          <span className="text-[11px] font-mono text-[#6E5648] tabular-nums">
            Created {new Date(lesson.createdAt).toLocaleDateString()}
          </span>
          <button
            type="submit"
            disabled={saving}
            className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs disabled:opacity-60"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? 'Saving...' : 'Save Lesson Information'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};
