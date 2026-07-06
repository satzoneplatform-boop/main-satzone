import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { ArrowRightIcon } from '@/components/icons';
import { Reveal } from '@/components/motion/Reveal';
import { useT } from '@/i18n/I18nProvider';

export function NotFoundPage() {
  const t = useT();
  return (
    <div className="grid min-h-screen place-items-center bg-ink-50 p-6">
      <Reveal onView={false} className="w-full max-w-md">
        <div className="rounded-2xl border border-ink-200 bg-white p-8 text-center shadow-[var(--shadow-card)] sm:p-10">
          <div className="flex justify-center">
            <LogoMark size={40} />
          </div>
          <p className="mt-6 text-5xl font-bold tracking-tight text-brand-600">404</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink-900">
            {t('notFound.title')}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{t('notFound.body')}</p>
          <div className="mt-8 flex justify-center">
            <Link to="/dashboard">
              <Button size="lg" rightIcon={<ArrowRightIcon />}>
                {t('notFound.back')}
              </Button>
            </Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
