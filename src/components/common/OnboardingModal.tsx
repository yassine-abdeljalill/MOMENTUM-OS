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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div
        className="w-full max-w-xl bg-[#242B31] border border-[#434D56] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Progress Bar & Header */}
        <div className="bg-[#22292F] px-6 pt-5 pb-4 border-b border-[#434D56]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#D2925B] flex items-center justify-center text-[#242B31] font-bold">
                <Compass className="w-4 h-4 text-[#242B31]" />
              </div>
              <span className="font-mono text-xs font-bold text-[#F4F0E9] tracking-wider uppercase">
                MOMENTUM Setup
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-[#D2925B] font-semibold">
                Step {step} of 7
              </span>
              <button
                onClick={handleSkip}
                className="text-xs text-[#868A7A] hover:text-[#F4F0E9] transition-colors"
              >
                Skip for now
              </button>
            </div>
          </div>

          <div className="w-full bg-[#2E373F] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#D2925B] h-full transition-all duration-300"
              style={{ width: `${(step / 7) * 100}%` }}
            />
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 min-h-[360px] flex flex-col justify-between">
          {step === 1 && (
            <div className="space-y-4 my-auto text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#64432B] border border-[#D2925B]/40 flex items-center justify-center mx-auto text-[#D2925B] shadow-lg">
                <Compass className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#F4F0E9] tracking-tight">
                Welcome to MOMENTUM
              </h2>
              <p className="text-sm text-[#A8A8A2] max-w-md mx-auto leading-relaxed">
                Your personal Life Operating System designed to help you transform long-term ambitions
                into disciplined daily actions.
              </p>
              <div className="p-4 rounded-xl bg-[#2E373F]/70 border border-[#434D56]/60 text-xs text-[#D2925B] font-serif italic max-w-sm mx-auto">
                &ldquo;Don&apos;t just track what you do. Track who you&apos;re becoming.&rdquo;
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 my-auto">
              <h2 className="text-lg font-bold text-[#F4F0E9]">Personal Profile</h2>
              <p className="text-xs text-[#A8A8A2]">
                Configure your basic identity details to personalize greetings and schedule timezones.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-sm focus:border-[#D2925B] focus:outline-hidden"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Timezone</label>
                    <input
                      type="text"
                      value={timezone}
                      onChange={e => setTimezone(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Language</label>
                    <select
                      value={preferredLanguage}
                      onChange={e => setPreferredLanguage(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
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
              <h2 className="text-lg font-bold text-[#F4F0E9]">Select Life Areas</h2>
              <p className="text-xs text-[#A8A8A2]">
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
                      className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-[#D2925B]/20 border-[#D2925B] text-[#D2925B]'
                          : 'bg-[#2E373F] border-[#434D56] text-[#A8A8A2] hover:text-[#F4F0E9]'
                      }`}
                    >
                      <span>{area.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#D2925B]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4 my-auto">
              <h2 className="text-lg font-bold text-[#F4F0E9]">Your Long-Term Vision</h2>
              <p className="text-xs text-[#A8A8A2]">
                What kind of person do you want to become? Describe the character, capabilities, and life you are striving toward.
              </p>

              <textarea
                rows={4}
                value={visionStatement}
                onChange={e => setVisionStatement(e.target.value)}
                placeholder="e.g. Become an elite engineer and disciplined leader who builds secure, impactful products while maintaining peak physical vitality and mental clarity..."
                className="w-full px-4 py-3 rounded-xl bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-sm focus:border-[#D2925B] focus:outline-hidden leading-relaxed"
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4 my-auto">
              <h2 className="text-lg font-bold text-[#F4F0E9]">Establish Your First Goal</h2>
              <p className="text-xs text-[#A8A8A2]">
                Translate your vision into a concrete objective with a 90-day execution milestone.
              </p>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Goal Title</label>
                  <input
                    type="text"
                    value={firstGoalTitle}
                    onChange={e => setFirstGoalTitle(e.target.value)}
                    placeholder="e.g. Complete Advanced System Architecture Lab"
                    className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-sm focus:border-[#D2925B] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#A8A8A2] mb-1">Primary Life Area</label>
                  <select
                    value={firstGoalCategory}
                    onChange={e => setFirstGoalCategory(e.target.value as LifeArea)}
                    className="w-full px-3 py-2 rounded-lg bg-[#2E373F] border border-[#434D56] text-[#F4F0E9] text-xs focus:border-[#D2925B] focus:outline-hidden"
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
              <h2 className="text-lg font-bold text-[#F4F0E9]">Daily Availability</h2>
              <p className="text-xs text-[#A8A8A2]">
                How much dedicated time can you realistically commit each day to deliberate work, study, and training?
              </p>

              <div className="pt-4 text-center">
                <span className="font-mono text-4xl font-extrabold text-[#D2925B]">
                  {dailyHours} hrs / day
                </span>
                <p className="text-xs text-[#868A7A] mt-2">
                  Equals ~{Math.round(dailyHours * 7)} hours of compounding weekly progress.
                </p>

                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={dailyHours}
                  onChange={e => setDailyHours(parseFloat(e.target.value))}
                  className="w-full max-w-sm mt-6 accent-[#D2925B]"
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4 my-auto text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#5B8C67]/20 border border-[#5B8C67]/40 flex items-center justify-center mx-auto text-[#5B8C67]">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-[#F4F0E9]">
                Your Operating System is Ready
              </h2>
              <p className="text-xs text-[#A8A8A2] max-w-sm mx-auto leading-relaxed">
                MOMENTUM has initialized your personalized Command Center, active goals, priority schedules,
                and consistency tracker.
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[#434D56]/60 mt-6">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#868A7A] hover:text-[#F4F0E9] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step < 7 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B] shadow-sm transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold rounded-lg bg-[#D2925B] text-[#242B31] hover:bg-[#C2824B] shadow-md transition-all active:scale-95"
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
