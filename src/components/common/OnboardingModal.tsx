import React, { useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useApp } from '../../lib/context';
import { LifeArea } from '../../types';
import { ModalShell, MOMENTUM_EASE } from './MotionPrimitives';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, completeOnboarding, addGoal } = useApp();
  const prefersReduced = useReducedMotion();

  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('Alex Vance');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  const [selectedAreas, setSelectedAreas] = useState<LifeArea[]>([
    'education',
    'career',
    'fitness',
    'personal_development',
  ]);

  const [visionStatement, setVisionStatement] = useState(
    'Become a world-class engineer and disciplined leader who builds secure, impactful products while maintaining peak vitality.'
  );

  const [firstGoalTitle, setFirstGoalTitle] = useState('Master High-Impact Systems Architecture');
  const [firstGoalCategory, setFirstGoalCategory] = useState<LifeArea>('career');
  const [dailyHours, setDailyHours] = useState(3.5);

  const toggleArea = (area: LifeArea) => {
    setSelectedAreas(prev =>
      prev.includes(area)
        ? prev.length > 1
          ? prev.filter(a => a !== area)
          : prev
        : [...prev, area]
    );
  };

  const handleSkip = () => {
    completeOnboarding({ onboardingCompleted: true });
    setIsOnboardingOpen(false);
  };

  const handleFinish = () => {
    if (firstGoalTitle.trim()) {
      const today = new Date();
      const target = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
      addGoal({
        title: firstGoalTitle.trim(),
        description: 'Initial 90-day priority established during MOMENTUM onboarding.',
        category: firstGoalCategory,
        startDate: today.toISOString().split('T')[0],
        targetDate: target.toISOString().split('T')[0],
        status: 'active',
        priority: 'high',
        progressCalculation: 'milestones',
        manualProgress: 0,
        successCriteria: 'Complete initial 90-day milestone deliverables.',
        motivation: visionStatement,
        milestones: [
          {
            id: `ms-onboard-${Date.now()}`,
            goalId: 'pending',
            title: 'Complete foundational 30-day execution block',
            completed: false,
            order: 1,
          },
        ],
        relatedProjectIds: [],
      });
    }

    completeOnboarding({
      fullName: fullName.trim() || 'Alex Vance',
      timezone: timezone.trim() || 'UTC',
      preferredLanguage,
      lifeAreas: selectedAreas,
      visionStatement: visionStatement.trim(),
      dailyAvailabilityHours: dailyHours,
      onboardingCompleted: true,
    });
  };

  const inputCls =
    'w-full px-3 py-2 rounded-xl bg-[#1A1A1D]/75 border border-white/12 text-ink text-xs focus:border-accent focus:ring-2 focus:ring-accent/30 focus:outline-hidden';

  return (
    <ModalShell
      isOpen={isOnboardingOpen}
      onClose={handleSkip}
      maxWidthClass="max-w-xl"
    >
      {/* Progress Bar & Header */}
      <div className="bg-white/[0.03] text-ink px-6 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img
              src="/brand-logo.png"
              alt="MOMENTUM logo"
              className="w-7 h-7 rounded-lg object-contain shrink-0"
            />
            <span className="font-mono text-xs font-bold tracking-wider uppercase">
              MOMENTUM Setup
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-brand-blue font-semibold tabular-nums">
              Step {step} of 7
            </span>
            <button
              type="button"
              onClick={handleSkip}
              className="text-xs text-ink-muted hover:text-ink transition-colors btn-press"
            >
              Skip for now
            </button>
          </div>
        </div>

        <div className="w-full bg-white/[0.08] h-1.5 rounded-full overflow-hidden">
          <motion.div
            className="bg-accent h-full rounded-full"
            animate={{ width: `${(step / 7) * 100}%` }}
            transition={{ duration: prefersReduced ? 0.01 : 0.25, ease: MOMENTUM_EASE }}
          />
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 md:p-8 min-h-[340px] flex flex-col justify-between">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -10 }}
            transition={{ duration: prefersReduced ? 0.01 : 0.16, ease: MOMENTUM_EASE }}
            className="my-auto"
          >
            {step === 1 && (
              <div className="space-y-4 my-auto text-center">
                <img
                  src="/brand-logo.png"
                  alt="MOMENTUM logo"
                  className="w-16 h-16 rounded-2xl object-contain mx-auto shadow-lg"
                />
                <h2 className="text-2xl font-bold text-ink tracking-tight font-heading">
                  Welcome to MOMENTUM
                </h2>
                <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed">
                  Your personal Life Operating System designed to help you transform long-term ambitions
                  into disciplined daily actions.
                </p>
                <div className="p-4 rounded-xl bg-surface-warm border border-line text-xs text-accent font-serif italic max-w-sm mx-auto">
                  &ldquo;Don&apos;t just track what you do. Track who you&apos;re becoming.&rdquo;
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 my-auto">
                <h2 className="text-lg font-bold text-ink font-heading">Personal Profile</h2>
                <p className="text-xs text-ink-muted">
                  Configure your basic identity details to personalize greetings and schedule timezones.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className={`${inputCls} text-sm`}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1">Timezone</label>
                      <input
                        type="text"
                        value={timezone}
                        onChange={e => setTimezone(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-ink-muted mb-1">Language</label>
                      <select
                        value={preferredLanguage}
                        onChange={e => setPreferredLanguage(e.target.value)}
                        className={inputCls}
                      >
                        <option value="English">English</option>
                        <option value="French">French</option>
                        <option value="Spanish">Spanish</option>
                        <option value="German">German</option>
                        <option value="Arabic">Arabic</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 my-auto">
                <h2 className="text-lg font-bold text-ink font-heading">Select Life Areas</h2>
                <p className="text-xs text-ink-muted">
                  Choose the domains you actively manage. MOMENTUM balances goals and tasks across these categories.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                  {[
                    { id: 'education', label: 'Education' },
                    { id: 'career', label: 'Career' },
                    { id: 'health', label: 'Health' },
                    { id: 'fitness', label: 'Fitness' },
                    { id: 'financial', label: 'Financial' },
                    { id: 'personal_development', label: 'Personal Dev' },
                    { id: 'relationships', label: 'Relationships' },
                    { id: 'other', label: 'Other' },
                  ].map(area => {
                    const isSelected = selectedAreas.includes(area.id as LifeArea);
                    return (
                      <button
                        key={area.id}
                        type="button"
                        onClick={() => toggleArea(area.id as LifeArea)}
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-accent border-accent text-accent-ink'
                            : 'bg-surface-warm/60 border-line text-ink-muted hover:text-ink'
                        }`}
                      >
                        <span>{area.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4 my-auto">
                <h2 className="text-lg font-bold text-ink font-heading">Your Long-Term Vision</h2>
                <p className="text-xs text-ink-muted">
                  What kind of person do you want to become? Describe the character, capabilities, and life you are striving toward.
                </p>

                <textarea
                  rows={4}
                  value={visionStatement}
                  onChange={e => setVisionStatement(e.target.value)}
                  placeholder="e.g. Become an elite engineer and disciplined leader who builds secure, impactful products while maintaining peak physical vitality and mental clarity..."
                  className={`${inputCls} text-sm leading-relaxed`}
                />
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4 my-auto">
                <h2 className="text-lg font-bold text-ink font-heading">Establish Your First Goal</h2>
                <p className="text-xs text-ink-muted">
                  Translate your vision into a concrete objective with a 90-day execution milestone.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Goal Title</label>
                    <input
                      type="text"
                      value={firstGoalTitle}
                      onChange={e => setFirstGoalTitle(e.target.value)}
                      placeholder="e.g. Complete Advanced System Architecture Lab"
                      className={`${inputCls} text-sm`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-muted mb-1">Primary Life Area</label>
                    <select
                      value={firstGoalCategory}
                      onChange={e => setFirstGoalCategory(e.target.value as LifeArea)}
                      className={inputCls}
                    >
                      {selectedAreas.map(a => (
                        <option key={a} value={a}>{a.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4 my-auto">
                <h2 className="text-lg font-bold text-ink font-heading">Daily Availability</h2>
                <p className="text-xs text-ink-muted">
                  How much dedicated time can you realistically commit each day to deliberate work, study, and training?
                </p>

                <div className="pt-4 text-center">
                  <span className="font-mono text-4xl font-extrabold text-ink px-4 py-1.5 rounded-xl bg-accent/20 border border-accent tabular-nums">
                    {dailyHours} hrs / day
                  </span>
                  <p className="text-xs text-ink-muted mt-3">
                    Equals ~{Math.round(dailyHours * 7)} hours of compounding weekly progress.
                  </p>

                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="0.5"
                    value={dailyHours}
                    onChange={e => setDailyHours(parseFloat(e.target.value))}
                    className="w-full max-w-sm mt-6 accent-accent"
                  />
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="space-y-4 my-auto text-center">
                <div className="w-14 h-14 rounded-2xl bg-success/15 border border-success/40 flex items-center justify-center mx-auto text-success">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-ink font-heading">
                  Your Operating System is Ready
                </h2>
                <p className="text-xs text-ink-muted max-w-sm mx-auto leading-relaxed">
                  MOMENTUM has initialized your personalized Command Center, active goals, priority schedules,
                  and consistency tracker.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-line mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-ink-muted hover:text-ink rounded-lg transition-colors btn-press"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 7 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl bg-accent hover:bg-accent-hover text-accent-ink shadow-sm btn-press"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-xl bg-accent hover:bg-accent-hover text-accent-ink shadow-md btn-press"
            >
              <span>Launch MOMENTUM</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </ModalShell>
  );
};
