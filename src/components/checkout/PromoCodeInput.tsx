import { useRef, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Button } from '@/components/ui/Button';
import { CheckIcon, CloseIcon, GiftIcon } from '@/components/icons';
import { ApiError } from '@/api/errors';
import { promocodesApi, type PromocodePreview } from '@/api/promocodes';
import { formatPrice } from '@/lib/format';
import { launchConfettiAt } from '@/lib/confetti';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

interface PromoCodeInputProps {
  courseId: string;
  /** The applied preview (lifted to the page so the summary can react). */
  applied: PromocodePreview | null;
  onApplied: (preview: PromocodePreview) => void;
  onRemoved: () => void;
}

/** Map the backend's stable error codes to precise, friendly messages. */
const ERROR_KEY: Record<string, string> = {
  promocode_not_found: 'checkout.promo.err.notFound',
  promocode_wrong_course: 'checkout.promo.err.wrongCourse',
  promocode_inactive: 'checkout.promo.err.inactive',
  promocode_expired: 'checkout.promo.err.expired',
  promocode_not_started: 'checkout.promo.err.notStarted',
  promocode_exhausted: 'checkout.promo.err.exhausted',
  course_is_free: 'checkout.promo.err.free',
  promocode_makes_free: 'checkout.promo.err.makesFree',
  // Extended rules (available once the backend model is extended):
  promocode_min_amount: 'checkout.promo.err.minAmount',
  promocode_first_purchase_only: 'checkout.promo.err.firstPurchase',
  promocode_user_limit: 'checkout.promo.err.userLimit',
  promocode_already_used: 'checkout.promo.err.alreadyUsed',
};

export function PromoCodeInput({
  courseId,
  applied,
  onApplied,
  onRemoved,
}: PromoCodeInputProps) {
  const t = useT();
  const reduce = useReducedMotion();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);

  // Codes the user saved to their profile wallet that apply to this course —
  // offered as one-tap chips below the manual input. A failed fetch (or an
  // empty wallet) simply renders no chips.
  const saved = useQuery({
    queryKey: ['me', 'promocodes', { course: courseId }],
    queryFn: () => promocodesApi.listSavedForCourse(courseId),
    staleTime: 60_000,
  });
  const savedUsable = (saved.data ?? []).filter(
    (s) => s.is_valid && s.final_amount_cents !== null,
  );

  async function applyCode(normalized: string) {
    if (!normalized || loading) return;
    setLoading(true);
    setError(null);
    try {
      const preview = await promocodesApi.preview({
        code: normalized,
        course_id: courseId,
      });
      onApplied(preview);
      setCode('');
      // A small pop from the promo section — a saved discount is a minor
      // win, so it gets the localized burst, not the full-screen volley.
      const el = sectionRef.current;
      if (el) {
        const r = el.getBoundingClientRect();
        launchConfettiAt(r.left + r.width / 2, r.top + r.height / 2, 0.9);
      }
    } catch (err) {
      const key =
        err instanceof ApiError && ERROR_KEY[err.code]
          ? ERROR_KEY[err.code]
          : 'checkout.promo.err.generic';
      setError(t(key as never));
    } finally {
      setLoading(false);
    }
  }

  function apply(e?: FormEvent) {
    e?.preventDefault();
    void applyCode(code.trim().toUpperCase());
  }

  const discountLabel = applied
    ? applied.discount_kind === 'percent'
      ? t('checkout.promo.percentOff', { value: applied.discount_value })
      : t('checkout.promo.amountOff', {
          amount: formatPrice(applied.discount_cents, applied.currency, false),
        })
    : '';

  return (
    <section ref={sectionRef}>
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <GiftIcon className="size-4" />
        </span>
        <h2 className="text-sm font-semibold text-navy-900">{t('checkout.promo.title')}</h2>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {applied ? (
          <motion.div
            key="applied"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 rounded-xl border border-success-500/40 bg-success-50 p-3.5"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success-500 text-white">
              <CheckIcon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">
                <span className="rounded bg-white px-1.5 py-0.5 font-mono text-xs text-success-700">
                  {applied.code}
                </span>
                {t('checkout.promo.applied')}
              </p>
              <p className="mt-0.5 text-xs text-ink-600">{discountLabel}</p>
            </div>
            <button
              type="button"
              onClick={onRemoved}
              className="shrink-0 rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-white hover:text-danger-600"
              aria-label={t('checkout.promo.remove')}
            >
              <CloseIcon className="size-4" />
            </button>
          </motion.div>
        ) : (
          <motion.form
            key="input"
            onSubmit={apply}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex gap-2">
              <input
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={t('checkout.promo.placeholder')}
                aria-label={t('checkout.promo.title')}
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                className={cn(
                  'h-11 min-w-0 flex-1 rounded-xl border bg-white px-3.5 text-sm font-medium uppercase tracking-wide text-navy-900 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-400 focus:outline-none focus:ring-2',
                  error
                    ? 'border-danger-500 focus:ring-danger-500/30'
                    : 'border-ink-200 focus:border-brand-500 focus:ring-brand-400/30',
                )}
              />
              <Button
                type="submit"
                variant="outline"
                loading={loading}
                disabled={!code.trim()}
                className="shrink-0"
              >
                {t('checkout.promo.apply')}
              </Button>
            </div>
            <AnimatePresence>
              {error && (
                <motion.p
                  initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                  transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-2 text-xs text-danger-600"
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            {savedUsable.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-ink-500">
                  {t('checkout.promo.savedCodes')}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {savedUsable.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={loading}
                      onClick={() => void applyCode(s.code)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-100 disabled:opacity-50"
                    >
                      <span className="font-mono font-semibold">{s.code}</span>
                      <span>
                        −
                        {s.discount_kind === 'percent'
                          ? `${s.discount_value}%`
                          : formatPrice(s.discount_cents ?? 0, s.currency, false)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.form>
        )}
      </AnimatePresence>
    </section>
  );
}
