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
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { Course, Lesson, StudySession } from '../../types';
import { formatMinutes } from '../../lib/logic';
import {
  ModalShell,
  AnimatedNumber,
  AnimatedProgressBar,
  AnimatedCheckButton,
  StaggerContainer,
  StaggerItem,
  MOMENTUM_EASE,
} from '../common/MotionPrimitives';

export const LearningView: React.FC = () => {
  const prefersReduced = useReducedMotion();
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
    showToast,
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
    showToast('Study session logged');
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
    showToast('Course added to Knowledge Center');
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
          <div className="flex bg-[#F2E8DA] p-1 rounded-xl border border-[#D6C6B2] text-xs relative">
            {([
              { id: 'courses', label: `Courses (${state.courses.length})` },
              { id: 'sessions', label: `Study Logs (${state.studySessions.length})` },
            ] as const).map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative z-10 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive ? 'text-[#3B2418] font-bold' : 'text-[#6E5648] hover:text-[#3B2418] font-medium'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="learning-tab-pill"
                      transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                      className="absolute inset-0 bg-[#8EC5FF] rounded-lg shadow-xs -z-10"
                    />
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowNewCourseModal(true)}
            className="btn-press group flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5] transition-transform duration-200 group-hover:rotate-90" />
            <span>New Course</span>
          </button>
        </div>
      </div>

      {/* Learning Metrics Bar */}
      <StaggerContainer className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StaggerItem className="p-4 rounded-xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs card-hover">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Total Study Time</span>
          <div className="font-mono text-2xl font-bold text-[#3B2418] mt-1">
            <AnimatedNumber value={totalStudyMinutes} formatter={formatMinutes} />
          </div>
        </StaggerItem>
        <StaggerItem className="p-4 rounded-xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs card-hover">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Lessons Completed</span>
          <div className="font-mono text-2xl font-bold text-[#1E5A99] mt-1">
            <AnimatedNumber value={completedLessons} /> / {totalLessons}
          </div>
        </StaggerItem>
        <StaggerItem className="p-4 rounded-xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs card-hover">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Active Courses</span>
          <div className="font-mono text-2xl font-bold text-[#3B2418] mt-1">
            <AnimatedNumber value={state.courses.filter(c => c.status === 'active').length} />
          </div>
        </StaggerItem>
        <StaggerItem className="p-4 rounded-xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs card-hover">
          <span className="text-[10px] font-mono uppercase text-[#6E5648]">Logged Sessions</span>
          <div className="font-mono text-2xl font-bold text-[#3E7B52] mt-1">
            <AnimatedNumber value={state.studySessions.length} />
          </div>
        </StaggerItem>
      </StaggerContainer>

      {/* Main Content */}
      <AnimatePresence mode="wait" initial={false}>
        {activeTab === 'courses' ? (
          <motion.div
            key="learning-courses"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
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
                    className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer space-y-2.5 card-hover ${
                      isSelected
                        ? 'bg-[#3B2418] border-[#5A3927] shadow-md'
                        : 'bg-[#FAF5ED] border-[#D6C6B2] hover:border-[#8EC5FF]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`text-sm font-semibold truncate transition-colors ${isSelected ? 'text-[#F2E8DA]' : 'text-[#3B2418]'}`}>
                        {course.title}
                      </h3>
                      <span className={`font-mono text-xs font-bold shrink-0 ${isSelected ? 'text-[#8EC5FF]' : 'text-[#1E5A99]'}`}>
                        {pct}%
                      </span>
                    </div>

                    <AnimatedProgressBar
                      percentage={pct}
                      trackClassName={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-[#4D3021]' : 'bg-[#EAE0D0]'}`}
                      fillClassName="bg-[#8EC5FF] h-full rounded-full"
                    />

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
              <AnimatePresence mode="wait" initial={false}>
                {currentCourse ? (
                  <motion.div
                    key={currentCourse.id}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
                    className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-6"
                  >
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
                        className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 text-xs font-bold shrink-0 transition-colors shadow-xs"
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
                            className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                              selectedLesson?.id === lesson.id
                                ? 'bg-[#8EC5FF]/25 border-[#8EC5FF]'
                                : 'bg-[#F2E8DA] border-[#D6C6B2] hover:border-[#8EC5FF]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <AnimatedCheckButton
                                checked={lesson.completed}
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleLessonCompleted(currentCourse.id, lesson.id);
                                }}
                              />
                              <span className={`text-xs font-medium truncate transition-colors ${lesson.completed ? 'line-through text-[#6E5648]' : 'text-[#3B2418]'}`}>
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
                    <AnimatePresence mode="wait" initial={false}>
                      {selectedLesson && (
                        <motion.div
                          key={selectedLesson.id}
                          initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                          transition={{ duration: prefersReduced ? 0.01 : 0.15, ease: MOMENTUM_EASE }}
                          className="p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-3"
                        >
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
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <div className="p-12 text-center text-[#6E5648]">No course selected</div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          /* Study Sessions Log Tab */
          <motion.div
            key="learning-sessions"
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="p-6 rounded-2xl bg-[#FAF5ED] border border-[#D6C6B2] shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#3B2418]">
                Deliberate Study Session Logs
              </h2>
              <button
                onClick={() => setShowLogSession(!showLogSession)}
                className="btn-press px-3 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs transition-colors"
              >
                {showLogSession ? 'Close Form' : '+ Log Study Session'}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {showLogSession && (
                <motion.form
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={prefersReduced ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: prefersReduced ? 0.01 : 0.2, ease: MOMENTUM_EASE }}
                  onSubmit={handleLogStudySession}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-3">
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
                        className="btn-press px-3 py-1 text-xs text-[#6E5648] hover:text-[#3B2418]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn-press px-4 py-1.5 rounded-lg bg-[#8EC5FF] hover:bg-[#73B6FC] text-[#3B2418] border border-[#3B2418]/15 font-bold text-xs shadow-xs transition-colors"
                      >
                        Save Log
                      </button>
                    </div>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {state.studySessions.map(session => (
                  <motion.div
                    key={session.id}
                    initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReduced ? { opacity: 0 } : { opacity: 0 }}
                    transition={{ duration: prefersReduced ? 0.01 : 0.18, ease: MOMENTUM_EASE }}
                    className="p-4 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] space-y-2 card-hover"
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Course Modal */}
      <ModalShell
        isOpen={showNewCourseModal}
        onClose={() => setShowNewCourseModal(false)}
        maxWidthClass="max-w-lg"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#5A3927] bg-[#3B2418]">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#8EC5FF]" />
            <h3 className="text-sm font-bold text-[#F2E8DA]">Create Course</h3>
          </div>
          <button
            onClick={() => setShowNewCourseModal(false)}
            className="text-[#D8C7B4] hover:text-[#F2E8DA] transition-colors"
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
              className="btn-press px-3 py-1.5 text-xs text-[#6E5648] hover:text-[#3B2418]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-press px-4 py-1.5 rounded-lg text-xs font-bold bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15 shadow-xs transition-colors"
            >
              Create Course
            </button>
          </div>
        </form>
      </ModalShell>
    </div>
  );
};
