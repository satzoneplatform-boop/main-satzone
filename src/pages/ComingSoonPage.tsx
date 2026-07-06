import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { LightbulbIcon } from '@/components/icons';
import { Reveal } from '@/components/motion/Reveal';
import { useT } from '@/i18n/I18nProvider';

/** Placeholder for sidebar nav stubs — replace as those pages are designed. */
export function ComingSoon({ title }: { title: string }) {
  const t = useT();
  return (
    <div className="grid place-items-center px-4 py-24">
      <Reveal onView={false} className="w-full max-w-md">
        <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <LightbulbIcon className="size-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-ink-900">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{t('comingSoon.body')}</p>
          <div className="mt-6 flex justify-center">
            <Link to="/dashboard">
              <Button variant="outline">{t('comingSoon.back')}</Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
