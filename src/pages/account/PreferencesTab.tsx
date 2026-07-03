import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { RadioGroup } from '@/components/ui/Radio';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { ApiError } from '@/api/errors';
import { catalogApi } from '@/api/catalog';
import { onboardingApi, type OnboardingUpdate } from '@/api/onboarding';
import { useOnboarding } from '@/features/home/hooks';
import { cn } from '@/lib/cn';
import type { SkillLevel } from '@/types/api';
import { useT } from '@/i18n/I18nProvider';

interface FormState {
  headline: string;
  bio: string;
  learning_goal: string;
  weekly_goal_minutes: string;
  skill_level: SkillLevel;
  interest_ids: string[];
}

const EMPTY_FORM: FormState = {
  headline: '',
  bio: '',
  learning_goal: 'career_advancement',
  weekly_goal_minutes: '120',
  skill_level: 'beginner',
  interest_ids: [],
};

/**
 * Preferences tab on the Account page. Every field here is a real
 * `OnboardingUpdate` field on the backend (FRONTEND.md §4.3) — no
 * pseudo-fields. Saving sends only the keys that changed since the last
 * fetched profile so we don't accidentally clobber other onboarding-set
 * values (Pydantic on the backend honors `exclude_unset`).
 */
export function PreferencesTab() {
  const t = useT();
  const queryClient = useQueryClient();
  const onboarding = useOnboarding();
  const categories = useQuery({
    queryKey: ['categories'],
    queryFn: () => catalogApi.categories(),
    staleTime: 5 * 60_000,
  });

  const LEARNING_GOALS = useMemo(
    () => [
      { value: 'career_advancement', label: t('account.preferences.learningGoal.career') },
      { value: 'skill_building', label: t('account.preferences.learningGoal.skill') },
      { value: 'academic_degree', label: t('account.preferences.learningGoal.academic') },
      { value: 'personal_growth', label: t('account.preferences.learningGoal.personal') },
      { value: 'exploring_new_topics', label: t('account.preferences.learningGoal.exploring') },
    ],
    [t],
  );

  const WEEKLY_GOAL_OPTIONS = useMemo(
    () => [
      { value: '30', label: t('account.preferences.weeklyGoal.30') },
      { value: '60', label: t('account.preferences.weeklyGoal.60') },
      { value: '120', label: t('account.preferences.weeklyGoal.120') },
      { value: '180', label: t('account.preferences.weeklyGoal.180') },
      { value: '300', label: t('account.preferences.weeklyGoal.300') },
      { value: '420', label: t('account.preferences.weeklyGoal.420') },
      { value: '600', label: t('account.preferences.weeklyGoal.600') },
    ],
    [t],
  );

  const DIFFICULTY: Array<{ value: SkillLevel; label: string }> = useMemo(
    () => [
      { value: 'beginner', label: t('account.preferences.difficulty.beginner') },
      { value: 'intermediate', label: t('account.preferences.difficulty.intermediate') },
      { value: 'advanced', label: t('account.preferences.difficulty.advanced') },
    ],
    [t],
  );

  const initial = useMemo<FormState>(() => {
    const profile = onboarding.data?.profile;
    if (!profile) return EMPTY_FORM;
    return {
      headline: profile.headline ?? '',
      bio: profile.bio ?? '',
      learning_goal: profile.learning_goal ?? EMPTY_FORM.learning_goal,
      weekly_goal_minutes: String(
        profile.weekly_goal_minutes || Number(EMPTY_FORM.weekly_goal_minutes),
      ),
      skill_level: profile.skill_level ?? EMPTY_FORM.skill_level,
      interest_ids: (onboarding.data?.interests ?? []).map((c) => c.id),
    };
  }, [onboarding.data]);

  const [form, setForm] = useState<FormState>(initial);

  // Re-hydrate when the server data lands / changes — done during render
  // (adjust-state pattern) instead of via a setState-in-effect.
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setForm(initial);
  }

  const save = useMutation({
    mutationFn: (payload: OnboardingUpdate) => onboardingApi.update(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  function toggleInterest(id: string) {
    setForm((f) =>
      f.interest_ids.includes(id)
        ? { ...f, interest_ids: f.interest_ids.filter((x) => x !== id) }
        : { ...f, interest_ids: [...f.interest_ids, id] },
    );
  }

  function onSave() {
    const payload: OnboardingUpdate = {};
    if (form.headline !== initial.headline) payload.headline = form.headline;
    if (form.bio !== initial.bio) payload.bio = form.bio;
    if (form.learning_goal !== initial.learning_goal) {
      payload.learning_goal = form.learning_goal;
    }
    const weekly = Number(form.weekly_goal_minutes);
    if (weekly !== Number(initial.weekly_goal_minutes) && Number.isFinite(weekly)) {
      payload.weekly_goal_minutes = weekly;
    }
    if (form.skill_level !== initial.skill_level) {
      payload.skill_level = form.skill_level;
    }
    const sameInterests =
      form.interest_ids.length === initial.interest_ids.length &&
      form.interest_ids.every((id) => initial.interest_ids.includes(id));
    if (!sameInterests) payload.interest_category_ids = form.interest_ids;

    if (Object.keys(payload).length === 0) return;
    save.mutate(payload);
  }

  const dirty =
    form.headline !== initial.headline ||
    form.bio !== initial.bio ||
    form.learning_goal !== initial.learning_goal ||
    form.weekly_goal_minutes !== initial.weekly_goal_minutes ||
    form.skill_level !== initial.skill_level ||
    form.interest_ids.length !== initial.interest_ids.length ||
    form.interest_ids.some((id) => !initial.interest_ids.includes(id));

  if (onboarding.isLoading) {
    return (
      <div className="grid place-items-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  const saveError =
    save.error instanceof ApiError
      ? save.error.message
      : save.error
        ? t('account.preferences.saveFailed')
        : null;

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-base font-semibold text-ink-900">{t('account.preferences.title')}</h2>
        <p className="mt-1 text-xs text-ink-500">
          {t('account.preferences.subtitle')}
        </p>
      </header>

      <Group
        title={t('account.preferences.profile.title')}
        description={t('account.preferences.profile.description')}
      >
        <div className="space-y-3">
          <Input
            label={t('account.preferences.profile.jobTitle')}
            placeholder={t('account.preferences.profile.jobTitlePlaceholder')}
            value={form.headline}
            onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
            maxLength={120}
          />
          <Textarea
            label={t('account.preferences.profile.bio')}
            placeholder={t('account.preferences.profile.bioPlaceholder')}
            rows={3}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            maxLength={500}
          />
        </div>
      </Group>

      <Group
        title={t('account.preferences.learningGoal.title')}
        description={t('account.preferences.learningGoal.description')}
      >
        <RadioGroup
          name="learning-goal"
          value={form.learning_goal}
          onChange={(v) => setForm((f) => ({ ...f, learning_goal: v }))}
          options={LEARNING_GOALS}
        />
      </Group>

      <Group
        title={t('account.preferences.weeklyGoal.title')}
        description={t('account.preferences.weeklyGoal.description')}
      >
        <Select
          value={form.weekly_goal_minutes}
          onChange={(e) =>
            setForm((f) => ({ ...f, weekly_goal_minutes: e.target.value }))
          }
          options={WEEKLY_GOAL_OPTIONS}
        />
      </Group>

      <Group
        title={t('account.preferences.difficulty.title')}
        description={t('account.preferences.difficulty.description')}
      >
        <Select
          value={form.skill_level}
          onChange={(e) =>
            setForm((f) => ({ ...f, skill_level: e.target.value as SkillLevel }))
          }
          options={DIFFICULTY}
        />
      </Group>

      <Group
        title={t('account.preferences.interests.title')}
        description={t('account.preferences.interests.description')}
      >
        {categories.isLoading ? (
          <Spinner />
        ) : (
          <div className="flex flex-wrap gap-2">
            {(categories.data ?? []).map((c) => {
              const selected = form.interest_ids.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleInterest(c.id)}
                  aria-pressed={selected}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    selected
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300',
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </Group>

      {saveError && (
        <p className="text-sm text-danger-600">{saveError}</p>
      )}
      {save.isSuccess && !dirty && (
        <p className="text-sm text-success-600">{t('account.preferences.saved')}</p>
      )}

      <footer className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => setForm(initial)}
          disabled={!dirty || save.isPending}
        >
          {t('common.reset')}
        </Button>
        <Button
          onClick={onSave}
          loading={save.isPending}
          disabled={!dirty}
        >
          {t('common.save')}
        </Button>
      </footer>
    </div>
  );
}

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-input)]">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mt-1 text-xs text-ink-500">{description}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}
