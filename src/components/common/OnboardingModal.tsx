import React, { useState } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Sparkles,
  Target,
  Clock,
  User,
  Heart,
  X,
} from 'lucide-react';
import { useApp } from '../../lib/context';
import { LifeArea } from '../../types';

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen, completeOnboarding, addGoal } = useApp();

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

  if (!isOnboardingOpen) return null;

  const toggleArea = (area: LifeArea) => {
    if (selectedAreas.includes(area)) {
      if (selectedAreas.length > 1) {
        setSelectedAreas(selectedAreas.filter(a => a !== area));
      }
    } else {
      setSelectedAreas([...selectedAreas, area]);
    }
  };

  const handleFinish = () => {
    if (firstGoalTitle.trim()) {
      addGoal({
        title: firstGoalTitle.trim(),
        description: 'First key objective created during onboarding',
        category: firstGoalCategory,
        startDate: new Date().toISOString().split('T')[0],
        targetDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        status: 'active',
        priority: 'high',
        progressCalculation: 'milestones',
        manualProgress: 0,
        successCriteria: 'Achieve quarterly milestones and review outcomes weekly',
        motivation: visionStatement || 'Continuous self-mastery',
        milestones: [
          { id: `gm-onboard-1`, goalId: '', title: 'Phase 1 Foundations', completed: false, order: 1 },
          { id: `gm-onboard-2`, goalId: '', title: 'Phase 2 Capstone Delivery', completed: false, order: 2 },
        ],
        relatedProjectIds: [],
      });
    }

    completeOnboarding({
      fullName: fullName.trim() || 'Alex Vance',
      timezone,
      preferredLanguage,
      lifeAreas: selectedAreas,
      visionStatement,
      dailyAvailabilityHours: dailyHours,
    });
  };

  const handleSkip = () => {
    completeOnboarding({});
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#3B2418]/75 backdrop-blur-md">
      <div
        className="w-full max-w-xl bg-[#FAF5ED] border border-[#D6C6B2] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Progress Bar & Header */}
        <div className="bg-[#3B2418] px-6 pt-5 pb-4 border-b border-[#5A3927]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#8EC5FF] flex items-center justify-center text-[#3B2418] font-bold">
                <Compass className="w-4 h-4 text-[#3B2418]" />
              </div>
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
                className="text-xs text-[#D8C7B4] hover:text-[#F2E8DA] transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>

          <div className="w-full bg-[#4D3021] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#8EC5FF] h-full transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 min-h-[360px] flex flex-col justify-between">
          {step === 1 && (
            <div className="space-y-4 my-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#3B2418] border-2 border-[#8EC5FF] flex items-center justify-center mx-auto text-[#8EC5FF] shadow-lg">
                <Compass className="w-8 h-8" />
              </div>
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

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[#D6C6B2] mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#6E5648] hover:text-[#3B2418] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 7 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15 shadow-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-lg bg-[#8EC5FF] text-[#3B2418] hover:bg-[#73B6FC] border border-[#3B2418]/15 shadow-md transition-all active:scale-95"
              >
                <span>Launch MOMENTUM</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
