import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { Radio, RadioGroup } from '@/components/ui/Radio';
import { ChevronDownIcon } from '@/components/icons';
import type { Category } from '@/types/api';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { DEFAULT_FILTERS, type FilterValue } from './filters';

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  initial?: FilterValue;
  onApply: (value: FilterValue) => void;
}

/**
 * Filter panel: bottom sheet below `sm`, right-hand drawer on larger
 * screens. Draft state is applied only on "Apply filters".
 */
export function FilterDrawer({
  open,
  onClose,
  categories,
  initial,
  onApply,
}: FilterDrawerProps) {
  const t = useT();
  const [value, setValue] = useState<FilterValue>(initial ?? DEFAULT_FILTERS);

  // Re-seed the draft whenever the drawer opens (or the applied filters
  // change while it is open) — adjust-state-during-render, so the reset
  // lands in the same render pass instead of a post-commit effect.
  const [prev, setPrev] = useState<{ open: boolean; initial?: FilterValue }>({
    open,
    initial,
  });
  if (prev.open !== open || prev.initial !== initial) {
    setPrev({ open, initial });
    if (open) setValue(initial ?? DEFAULT_FILTERS);
  }

  function clear() {
    setValue(DEFAULT_FILTERS);
  }

  function apply() {
    onApply(value);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      className={cn(
        // Mobile: bottom sheet pinned to the viewport edge.
        'absolute inset-x-0 bottom-0 top-auto m-0 flex max-h-[85dvh] w-full max-w-none flex-col overflow-hidden rounded-2xl rounded-b-none p-0',
        // ≥sm: right-hand filter drawer.
        'sm:inset-x-auto sm:right-4 sm:top-4 sm:bottom-4 sm:max-h-none sm:w-[360px] sm:rounded-2xl sm:p-0',
      )}
    >
      {/* Grab handle (mobile sheet affordance only). */}
      <div aria-hidden className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-ink-200 sm:hidden" />

      <header className="shrink-0 border-b border-ink-100 px-5 py-4 pr-14">
        <h2 className="text-lg font-semibold text-ink-900">{t('explore.filter.title')}</h2>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        <Section title={t('explore.filter.skill')}>
          <RadioGroup
            name="level"
            value={value.level}
            onChange={(v) => setValue((s) => ({ ...s, level: v }))}
            options={[
              { value: 'any', label: t('explore.filter.level.any') },
              { value: 'beginner', label: t('explore.filter.level.beginner') },
              { value: 'intermediate', label: t('explore.filter.level.intermediate') },
              { value: 'advanced', label: t('explore.filter.level.advanced') },
            ]}
          />
        </Section>

        <Section title={t('explore.filter.topic')}>
          <ul className="space-y-2.5">
            {categories.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Checkbox
                  label={c.name}
                  checked={value.topicIds.includes(c.id)}
                  onChange={(e) => {
                    setValue((s) => ({
                      ...s,
                      topicIds: e.target.checked
                        ? [...s.topicIds, c.id]
                        : s.topicIds.filter((id) => id !== c.id),
                    }));
                  }}
                />
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('explore.filter.duration')}>
          <RadioGroup
            name="duration"
            value={value.durationBucket}
            onChange={(v) => setValue((s) => ({ ...s, durationBucket: v }))}
            options={[
              { value: 'any', label: t('explore.filter.duration.any') },
              { value: 'lt2h', label: t('explore.filter.duration.lt2h') },
              { value: '2_6h', label: t('explore.filter.duration.2to6h') },
              { value: 'gt6h', label: t('explore.filter.duration.gt6h') },
            ]}
          />
        </Section>

        <Section title={t('explore.filter.price')} last>
          <div className="flex items-center gap-4">
            <Radio
              name="price"
              checked={value.isFree === 'any'}
              onChange={() => setValue((s) => ({ ...s, isFree: 'any' }))}
              label={t('explore.filter.price.any')}
            />
            <Radio
              name="price"
              checked={value.isFree === 'free'}
              onChange={() => setValue((s) => ({ ...s, isFree: 'free' }))}
              label={t('explore.filter.price.free')}
            />
            <Radio
              name="price"
              checked={value.isFree === 'paid'}
              onChange={() => setValue((s) => ({ ...s, isFree: 'paid' }))}
              label={t('explore.filter.price.paid')}
            />
          </div>
        </Section>
      </div>

      <footer className="flex shrink-0 items-center gap-3 border-t border-ink-100 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button variant="ghost" onClick={clear}>
          {t('explore.filter.clearAll')}
        </Button>
        <Button onClick={apply} className="ml-auto">
          {t('explore.filter.apply')}
        </Button>
      </footer>
    </Modal>
  );
}

function Section({
  title,
  children,
  last = false,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className={cn(!last && 'border-b border-ink-100 pb-4')}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between rounded-lg text-sm font-semibold text-ink-900"
      >
        {title}
        <ChevronDownIcon
          className={cn('text-ink-400 transition-transform duration-200', !open && '-rotate-90')}
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </section>
  );
}
