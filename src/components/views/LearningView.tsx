import React, { useState } from 'react';
import {
  GraduationCap,
  Plus,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  Layers,
  Sparkles,
  ChevronRight,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { Course, Lesson, StudySession } from '../../types';
import { formatMinutes } from '../../lib/logic';

export const LearningView: React.FC = () => {
  const {
    state,
    addCourse,
    updateCourse,
    toggleLessonCompleted,
    addStudySession,
    selectedCourseId,
    setSelectedCourseId,
    startFocusTimer,
    setIsFocusTimerOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'courses' | 'sessions'>('courses');
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // New study session logger form
  const [sessionSubject, setSessionSubject] = useState('');
  const [sessionDuration, setSessionDuration] = useState(60);
  const [sessionLearned, setSessionLearned] = useState('');
  const [showLogSession, setShowLogSession] = useState(false);

  // New course modal state
  const [showNewCourseModal, setShowNewCourseModal] = useState(false);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseCategory, setCourseCategory] = useState('Cybersecurity');
  const [courseInstructor, setCourseInstructor] = useState('');
  const [courseDescription, setCourseDescription] = useState('');

  const currentCourse = selectedCourseId
    ? state.courses.find(c => c.id === selectedCourseId) || state.courses[0]
    : state.courses[0];

  const totalStudyMinutes = state.studySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalLessons = state.courses.reduce((acc, c) => acc + c.lessons.length, 0);
  const completedLessons = state.courses.reduce(
    (acc, c) => acc + c.lessons.filter(l => l.completed).length,
    0
  );

  const handleLogStudySession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionSubject.trim() || !sessionLearned.trim()) return;

    addStudySession({
      courseId: currentCourse?.id,
      subject: sessionSubject.trim(),
      date: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: sessionDuration,
      whatWasLearned: sessionLearned.trim(),
    });

    setSessionSubject('');
    setSessionLearned('');
    setShowLogSession(false);
  };

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseTitle.trim()) return;

    const newC = addCourse({
      title: courseTitle.trim(),
      description: courseDescription.trim(),
      category: courseCategory,
      instructor: courseInstructor.trim() || undefined,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      lessons: [
        {
          id: `les-${Date.now()}-1`,
          courseId: '',
          title: 'Module 1: Foundational Theory & Architecture',
          learningObjectives: ['Understand core terminology', 'Review system specifications'],
          content: 'Introductory concepts, protocol mechanics, and foundational mental models.',
          completed: false,
          studyDurationMinutes: 60,
          order: 1,
        },
      ],
    });

    setCourseTitle('');
    setCourseDescription('');
    setShowNewCourseModal(false);
    setSelectedCourseId(newC.id);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-[#3B2418] tracking-tight">
            Knowledge Center & Learning
          </h1>
          <p className="text-xs text-[#6E5648]">
            Curated coursework, lesson objectives, and deliberate study session logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-[#F2E8DA] p-1 rounded-xl border border-[#D6C6B2] text-xs">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'courses' ? 'bg-[#8EC5FF] text-[#3B2418] font-bold shadow-xs' : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              Courses ({state.courses.length})
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                activeTab === 'sessions' ? 'bg-[#8EC5FF] text-[#3B2418] font-bold shadow-xs' : 'text-[#6E5648] hover:text-[#3B2418]'
              }`}
            >
              Study Logs ({state.studySessions.length})
            </button>
          </div>

          <button
            onClick={() => setShowNewCourseModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Course</span>
          </button>
        </div>
      </div>

      {/* Learning Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Total Study Time</span>
          <div className="font-mono text-2xl font-bold text-[#3B2418] mt-1">
            {formatMinutes(totalStudyMinutes)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Lessons Completed</span>
          <div className="font-mono text-2xl font-bold text-[#1E5A99] mt-1">
            {completedLessons} / {totalLessons}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Active Courses</span>
          <div className="font-mono text-2xl font-bold text-[#3B2418] mt-1">
            {state.courses.filter(c => c.status === 'active').length}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Logged Sessions</span>
          <div className="font-mono text-2xl font-bold text-[#3E7B52] mt-1">
            {state.studySessions.length}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'courses' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Courses List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6E5648] block px-1">
              Curriculum Modules
            </span>

            {state.courses.map(course => {
              const isSelected = currentCourse && currentCourse.id === course.id;
              const completedCount = course.lessons.filter(l => l.completed).length;
              const pct = course.lessons.length > 0
                ? Math.round((completedCount / course.lessons.length) * 100)
                : 0;

              return (
                <div
                  key={course.id}
                  onClick={() => {
                    setSelectedCourseId(course.id);
                    setSelectedLesson(course.lessons[0] || null);
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 ${
                    isSelected
                      ? 'bg-[#3B2418] border-[#5A3927] shadow-md'
                      : 'bg-[#FAF5ED] border-[#D6C6B2] hover:border-[#8EC5FF]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-sm font-semibold truncate ${isSelected ? 'text-[#F2E8DA]' : 'text-[#3B2418]'}`}>
                      {course.title}
                    </h3>
                    <span className={`font-mono text-xs font-bold shrink-0 ${isSelected ? 'text-[#8EC5FF]' : 'text-[#1E5A99]'}`}>
                      {pct}%
                    </span>
                  </div>

                  <div className={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-[#4D3021]' : 'bg-[#EAE0D0]'}`}>
                    <div
                      className="bg-[#8EC5FF] h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className={`flex items-center justify-between text-[11px] ${isSelected ? 'text-[#D8C7B4]' : 'text-[#6E5648]'}`}>
                    <span>{course.category}</span>
                    <span>{completedCount}/{course.lessons.length} lessons</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Course Details & Lessons (7 cols) */}
          <div className="lg:col-span-7">
            {currentCourse ? (
              <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-6">
                <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D6C6B2]">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#3B2418] text-[#8EC5FF] border border-[#5A3927]">
                      {currentCourse.category}
                    </span>
                    <h2 className="text-lg font-bold text-[#3B2418] pt-1">
                      {currentCourse.title}
                    </h2>
                    {currentCourse.instructor && (
                      <p className="text-xs text-[#6E5648]">
                        Instructor: {currentCourse.instructor}
                      </p>
                    )}
                    <p className="text-xs text-[#6E5648] leading-relaxed">
                      {currentCourse.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      startFocusTimer(50, { id: currentCourse.id, title: `Study: ${currentCourse.title}` });
                      setIsFocusTimerOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 text-xs font-bold shrink-0 transition-colors shadow-xs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start Study Timer</span>
                  </button>
                </div>

                {/* Lessons List */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#3B2418] block">
                    Lessons & Modules ({currentCourse.lessons.length})
                  </span>

                  <div className="space-y-2">
                    {currentCourse.lessons.map(lesson => (
                      <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(lesson)}
                        className={`p-3 rounded-xl border transition-colors cursor-pointer flex items-center justify-between ${
                          selectedLesson?.id === lesson.id
                            ? 'bg-[#8EC5FF]/25 border-[#8EC5FF]'
                            : 'bg-[#F2E8DA] border-[#D6C6B2] hover:border-[#8EC5FF]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              toggleLessonCompleted(currentCourse.id, lesson.id);
                            }}
                            className="text-[#6E5648] hover:text-[#3E7B52] shrink-0"
                          >
                            {lesson.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-[#3E7B52]" />
                            ) : (
                              <Circle className="w-4 h-4" />
                            )}
                          </button>
                          <span className={`text-xs font-medium truncate ${lesson.completed ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'}`}>
                            {lesson.title}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-[#6E5648] shrink-0">
                          {lesson.studyDurationMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Selected Lesson Reader / Objectives */}
                {selectedLesson && (
                  <div className="p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-3">
                    <h3 className="text-xs font-bold text-[#1E5A99] uppercase tracking-wider font-mono">
                      Lesson Objectives & Notes
                    </h3>
                    <p className="text-xs text-[#3B2418] leading-relaxed">
                      {selectedLesson.content}
                    </p>
                    {selectedLesson.learningObjectives?.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] text-[#6E5648] uppercase font-mono block">Learning Objectives:</span>
                        <ul className="text-xs text-[#6E5648] list-disc list-inside space-y-0.5">
                          {selectedLesson.learningObjectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {selectedLesson.notes && (
                      <div className="p-2.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#6E5648] italic">
                        Note: {selectedLesson.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-[#6E5648]">No course selected</div>
            )}
          </div>
        </div>
      ) : (
        /* Study Sessions Log Tab */
        <div className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#3B2418]">
              Deliberate Study Session Logs
            </h2>
            <button
              onClick={() => setShowLogSession(!showLogSession)}
              className="px-3 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs transition-colors"
            >
              + Log Study Session
            </button>
          </div>

          {showLogSession && (
            <form onSubmit={handleLogStudySession} className="p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6E5648] mb-1">Subject / Topic</label>
                  <input
                    type="text"
                    required
                    value={sessionSubject}
                    onChange={e => setSessionSubject(e.target.value)}
                    placeholder="e.g. Asymmetric Cryptography & ECDHE"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6E5648] mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={sessionDuration}
                    onChange={e => setSessionDuration(parseInt(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5648] mb-1">What Was Learned / Key Realization</label>
                <textarea
                  rows={2}
                  required
                  value={sessionLearned}
                  onChange={e => setSessionLearned(e.target.value)}
                  placeholder="Concrete insights, proof summaries, or mental models..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#FAF5ED] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogSession(false)}
                  className="px-3 py-1 text-xs text-[#6E5648] hover:text-[#3B2418]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs"
                >
                  Save Log
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {state.studySessions.map(session => (
              <div
                key={session.id}
                className="p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#1E5A99]" />
                    <span className="text-sm font-semibold text-[#3B2418]">{session.subject}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-[#6E5648]">
                    <span>{session.date}</span>
                    <span>• {session.durationMinutes} mins</span>
                  </div>
                </div>
                <p className="text-xs text-[#6E5648] leading-relaxed pl-6">
                  {session.whatWasLearned}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Course Modal */}
      {showNewCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2418]/65 backdrop-blur-xs">
          <div
            className="w-full max-w-lg bg-[#FAF5ED] border border-[#D6C6B2] rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#5A3927] bg-[#3B2418]">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#8EC5FF]" />
                <h3 className="text-sm font-bold text-[#F2E8DA]">Create Course</h3>
              </div>
              <button
                onClick={() => setShowNewCourseModal(false)}
                className="text-[#D8C7B4] hover:text-[#F2E8DA]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#6E5648] mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  value={courseTitle}
                  onChange={e => setCourseTitle(e.target.value)}
                  placeholder="e.g. Linux Kernel Security & Hardening"
                  className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#6E5648] mb-1">Category</label>
                  <select
                    value={courseCategory}
                    onChange={e => setCourseCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  >
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Programming">Programming</option>
                    <option value="Networking">Networking</option>
                    <option value="Linux">Linux</option>
                    <option value="Cloud Computing">Cloud Computing</option>
                    <option value="DevSecOps">DevSecOps</option>
                    <option value="University">University</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#6E5648] mb-1">Instructor (opt)</label>
                  <input
                    type="text"
                    value={courseInstructor}
                    onChange={e => setCourseInstructor(e.target.value)}
                    placeholder="e.g. Dr. Vance"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#6E5648] mb-1">Description</label>
                <textarea
                  rows={2}
                  value={courseDescription}
                  onChange={e => setCourseDescription(e.target.value)}
                  placeholder="Core syllabus and target skills..."
                  className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-xs text-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D6C6B2]">
                <button
                  type="button"
                  onClick={() => setShowNewCourseModal(false)}
                  className="px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15 shadow-xs"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
