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

  // Profile data
  const [fullName, setFullName] = useState('Alex Vance');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [preferredLanguage, setPreferredLanguage] = useState('English');

  // Life areas
  const [selectedAreas, setSelectedAreas] = useState<LifeArea[]>([
    'education',
    'career',
    'fitness',
    'personal_development',
  ]);

  // Long-term vision
  const [visionStatement, setVisionStatement] = useState(
    'Become a world-class engineer and disciplined leader who builds secure, impactful products while maintaining peak vitality.'
  );

  // First goal
  const [firstGoalTitle, setFirstGoalTitle] = useState('Master High-Impact Systems Architecture');
  const [firstGoalCategory, setFirstGoalCategory] = useState<LifeArea>('career');

  // Daily availability
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

  return (
    <ModalShell
      isOpen={isOnboardingOpen}
      onClose={handleSkip}
      maxWidthClass="max-w-xl"
      backdropClassName="bg-[#3B2418]/75 backdrop-blur-md"
      panelClassName="bg-[#FAF5ED] border border-[#D6C6B2] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Progress Bar & Header */}
      <div className="bg-[#3B2418] px-6 pt-5 pb-4 border-b border-[#5A3927]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <img
              src="/brand-logo.png"
              alt="MOMENTUM logo"
              className="w-7 h-7 rounded-lg object-contain shrink-0"
            />
            <span className="font-mono text-xs font-bold text-[#F2E8DA] tracking-wider uppercase">
              MOMENTUM Setup
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-[#8EC5FF] font-semibold">
              Step {step} of 7
            </span>
            <button
              onClick={handleSkip}
              className="text-xs text-[#D8C7B4] hover:text-[#F2E8DA] transition-colors btn-press"
            >
              Skip for now
            </button>
          </div>
        </div>

        <div className="w-full bg-[#4D3021] h-1.5 rounded-full overflow-hidden">
          <motion.div
            className="bg-[#8EC5FF] h-full rounded-full"
            animate={{ width: `${(step / 7) * 100}%` }}
            transition={{ duration: prefersReduced ? 0.01 : 0.25, ease: MOMENTUM_EASE }}
          />
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 md:p-8 min-h-[360px] flex flex-col justify-between">
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
              <h2 className="text-2xl font-bold text-[#3B2418] tracking-tight">
                Welcome to MOMENTUM
              </h2>
              <p className="text-sm text-[#6E5648] max-w-md mx-auto leading-relaxed">
                Your personal Life Operating System designed to help you transform long-term ambitions
                into disciplined daily actions.
              </p>
              <div className="p-4 rounded-xl bg-[#3B2418] border border-[#5A3927] text-xs text-[#8EC5FF] font-serif italic max-w-sm mx-auto">
                &ldquo;Don&apos;t just track what you do. Track who you&apos;re becoming.&rdquo;
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 my-auto">
              <h2 className="text-lg font-bold text-[#3B2418]">Personal Profile</h2>
              <p className="text-xs text-[#6E5648]">
                Configure your basic identity details to personalize greetings and schedule timezones.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#6E5648] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-sm focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#6E5648] mb-1">Timezone</label>
                    <input
                      type="text"
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6E5648] mb-1">Language</label>
                    <select
                      value={preferredLanguage}
                      onChange={e => setPreferredLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
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
              <h2 className="text-lg font-bold text-[#3B2418]">Select Life Areas</h2>
              <p className="text-xs text-[#6E5648]">
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
                          ? 'bg-[#8EC5FF] border-[#3B2418] text-[#3B2418]'
                          : 'bg-[#F2E8DA] border-[#D6C6B2] text-[#6E5648] hover:text-[#3B2418]'
                      }`}
                    >
                      <span>{area.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#3B2418]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 my-auto">
              <h2 className="text-lg font-bold text-[#3B2418]">Your Long-Term Vision</h2>
              <p className="text-xs text-[#6E5648]">
                What kind of person do you want to become? Describe the character, capabilities, and life you are striving toward.
              </p>

              <textarea
                rows={4}
                value={visionStatement}
                onChange={e => setVisionStatement(e.target.value)}
                placeholder="e.g. Become an elite engineer and disciplined leader who builds secure, impactful products while maintaining peak physical vitality and mental clarity..."
                className="w-full px-4 py-3 rounded-xl bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-sm focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden leading-relaxed"
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 my-auto">
              <h2 className="text-lg font-bold text-[#3B2418]">Establish Your First Goal</h2>
              <p className="text-xs text-[#6E5648]">
                Translate your vision into a concrete objective with a 90-day execution milestone.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#6E5648] mb-1">Goal Title</label>
                  <input
                    type="text"
                    value={firstGoalTitle}
                    onChange={e => setFirstGoalTitle(e.target.value)}
                    placeholder="e.g. Complete Advanced System Architecture Lab"
                    className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-sm focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6E5648] mb-1">Primary Life Area</label>
                  <select
                    value={firstGoalCategory}
                    onChange={e => setFirstGoalCategory(e.target.value as LifeArea)}
                    className="w-full px-3 py-2 rounded-lg bg-[#F2E8DA] border border-[#D6C6B2] text-[#3B2418] text-xs focus:border-[#3B2418] focus:ring-2 focus:ring-[#8EC5FF] focus:outline-hidden"
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
              <h2 className="text-lg font-bold text-[#3B2418]">Daily Availability</h2>
              <p className="text-xs text-[#6E5648]">
                How much dedicated time can you realistically commit each day to deliberate work, study, and training?
              </p>

              <div className="pt-4 text-center">
                <span className="font-mono text-4xl font-extrabold text-[#3B2418] px-4 py-1.5 rounded-xl bg-[#8EC5FF]/50 border border-[#8EC5FF]">
                  {dailyHours} hrs / day
                </span>
                <p className="text-xs text-[#6E5648] mt-3">
                  Equals ~{Math.round(dailyHours * 7)} hours of compounding weekly progress.
                </p>

                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={dailyHours}
                  onChange={e => setDailyHours(parseFloat(e.target.value))}
                  className="w-full max-w-sm mt-6 accent-[#3B2418]"
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4 my-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#3E7B52]/15 border border-[#3E7B52]/40 flex items-center justify-center mx-auto text-[#3E7B52]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#3B2418]">
                Your Operating System is Ready
              </h2>
              <p className="text-xs text-[#6E5648] max-w-sm mx-auto leading-relaxed">
                MOMENTUM has initialized your personalized Command Center, active goals, priority schedules,
                and consistency tracker.
              </p>
            </div>
          )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-[#D6C6B2] mt-6">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#6E5648] hover:text-[#3B2418] rounded-lg transition-colors btn-press"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : <div />}

          {step < 7 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15 shadow-sm btn-press"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-lg bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15 shadow-md btn-press"
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
