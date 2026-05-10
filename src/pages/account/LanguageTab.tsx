import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { onboardingApi } from '@/api/onboarding';
import { useOnboarding } from '@/features/home/hooks';

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'uz', label: 'O‘zbekcha' },
  { value: 'ru', label: 'Русский' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
  { value: 'fr', label: 'Français' },
];

const PROFICIENCY = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

export function LanguageTab() {
  const queryClient = useQueryClient();
  const onboarding = useOnboarding();
  const [locale, setLocale] = useState('en');
  const [contentLocale, setContentLocale] = useState('en');
  const [subtitleLocale, setSubtitleLocale] = useState('en');
  const [subtitlesOn, setSubtitlesOn] = useState(true);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [proficiency, setProficiency] = useState('beginner');
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    const profile = onboarding.data?.profile;
    if (!profile) return;
    setLocale(profile.locale || 'en');
    if (profile.skill_level) setProficiency(profile.skill_level);
  }, [onboarding.data]);

  const save = useMutation({
    mutationFn: () =>
      onboardingApi.update({
        locale,
        skill_level: proficiency as 'beginner' | 'intermediate' | 'advanced',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      setInfo('Language preferences saved.');
      setTimeout(() => setInfo(null), 2500);
    },
  });

  function reset() {
    const profile = onboarding.data?.profile;
    setLocale(profile?.locale || 'en');
    setContentLocale('en');
    setSubtitleLocale('en');
    setSubtitlesOn(true);
    setAutoTranslate(false);
    setProficiency(profile?.skill_level || 'beginner');
  }

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-base font-semibold text-ink-900">Language</h2>
      </header>

      {info && (
        <div className="rounded-md border border-brand-100 bg-brand-25 px-3 py-2 text-sm text-brand-700">
          {info}
        </div>
      )}

      <Group
        title="Interface language"
        description="Controls the language used in menus, buttons, and system messages across the platform."
      >
        <Select
          options={LANGUAGES}
          value={locale}
          onChange={(e) => setLocale(e.target.value)}
        />
      </Group>

      <Group
        title="Course content language"
        description="Choose the preferred language for course content. We'll prioritize courses available in this language."
      >
        <Select
          options={LANGUAGES}
          value={contentLocale}
          onChange={(e) => setContentLocale(e.target.value)}
        />
      </Group>

      <Group
        title="Subtitles & Captions"
        description="Customize subtitle behavior for video lessons."
      >
        <Select
          options={LANGUAGES}
          value={subtitleLocale}
          onChange={(e) => setSubtitleLocale(e.target.value)}
        />
        <ToggleRow
          label="Enable subtitles by default"
          checked={subtitlesOn}
          onChange={setSubtitlesOn}
        />
        <ToggleRow
          label="Auto translate subtitles when available"
          checked={autoTranslate}
          onChange={setAutoTranslate}
        />
      </Group>

      <Group
        title="Language Proficiency"
        description="Helps us recommend courses at the right level."
      >
        <Select
          options={PROFICIENCY}
          value={proficiency}
          onChange={(e) => setProficiency(e.target.value)}
        />
      </Group>

      <footer className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
        <Button variant="outline" type="button" onClick={reset}>
          Reset
        </Button>
        <Button onClick={() => save.mutate()} loading={save.isPending}>
          Save
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
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-ink-700">
      {label}
      <Switch checked={checked} onChange={onChange} label={label} />
    </label>
  );
}
