import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Modal } from '@/components/ui/Modal';
import { Radio, RadioGroup } from '@/components/ui/Radio';
import { ChevronDownIcon } from '@/components/icons';
import type { Category, CourseLevel } from '@/types/api';
import { cn } from '@/lib/cn';

export interface FilterValue {
  level: CourseLevel | 'any';
  topicIds: string[];
  durationBucket: 'any' | 'lt2h' | '2_6h' | 'gt6h';
  isFree: 'any' | 'free' | 'paid';
}

export const DEFAULT_FILTERS: FilterValue = {
  level: 'any',
  topicIds: [],
  durationBucket: 'any',
  isFree: 'any',
};

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  initial?: FilterValue;
  onApply: (value: FilterValue) => void;
}

export function FilterDrawer({
  open,
  onClose,
  categories,
  initial,
  onApply,
}: FilterDrawerProps) {
  const [value, setValue] = useState<FilterValue>(initial ?? DEFAULT_FILTERS);

  useEffect(() => {
    if (open) setValue(initial ?? DEFAULT_FILTERS);
  }, [open, initial]);

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
      className="absolute right-4 top-4 bottom-4 m-0 max-h-none w-[360px] overflow-y-auto rounded-2xl p-6"
    >
      <div className="space-y-5 pb-20">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Filter your result</h2>
        </div>

        <Section title="Skill you’re building">
          <RadioGroup
            name="level"
            value={value.level}
            onChange={(v) => setValue((s) => ({ ...s, level: v }))}
            options={[
              { value: 'any', label: 'Any level' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />
        </Section>

        <Section title="Topic">
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

        <Section title="Duration">
          <RadioGroup
            name="duration"
            value={value.durationBucket}
            onChange={(v) => setValue((s) => ({ ...s, durationBucket: v }))}
            options={[
              { value: 'any', label: 'Any duration' },
              { value: 'lt2h', label: 'Less than 2 hours' },
              { value: '2_6h', label: '2 – 6 hours' },
              { value: 'gt6h', label: 'More than 6 hours' },
            ]}
          />
        </Section>

        <Section title="Price">
          <div className="flex items-center gap-3">
            <Radio
              name="price"
              checked={value.isFree === 'any'}
              onChange={() => setValue((s) => ({ ...s, isFree: 'any' }))}
              label="Any"
            />
            <Radio
              name="price"
              checked={value.isFree === 'free'}
              onChange={() => setValue((s) => ({ ...s, isFree: 'free' }))}
              label="Free"
            />
            <Radio
              name="price"
              checked={value.isFree === 'paid'}
              onChange={() => setValue((s) => ({ ...s, isFree: 'paid' }))}
              label="Paid"
            />
          </div>
        </Section>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 border-t border-ink-100 bg-white px-6 py-3">
        <button
          type="button"
          onClick={clear}
          className="text-sm font-medium text-ink-600 hover:text-ink-900"
        >
          Clear all
        </button>
        <Button onClick={apply} className="ml-auto">
          Apply filter
        </Button>
      </div>
    </Modal>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section className="border-b border-ink-100 pb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-sm font-semibold text-ink-900"
      >
        {title}
        <ChevronDownIcon className={cn('text-ink-400 transition-transform', !open && '-rotate-90')} />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </section>
  );
}

/** Convert UI filter state into the backend `CourseFilters` shape. */
export function toCourseFilters(value: FilterValue): {
  level?: CourseLevel;
  is_free?: boolean;
  min_duration_minutes?: number;
  max_duration_minutes?: number;
  category_id?: string;
} {
  const out: ReturnType<typeof toCourseFilters> = {};
  if (value.level !== 'any') out.level = value.level;
  if (value.isFree === 'free') out.is_free = true;
  if (value.isFree === 'paid') out.is_free = false;
  if (value.durationBucket === 'lt2h') out.max_duration_minutes = 120;
  if (value.durationBucket === '2_6h') {
    out.min_duration_minutes = 120;
    out.max_duration_minutes = 360;
  }
  if (value.durationBucket === 'gt6h') out.min_duration_minutes = 360;
  if (value.topicIds.length > 0) out.category_id = value.topicIds[0]; // backend filters single
  return out;
}
