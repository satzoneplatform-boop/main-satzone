import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CloseIcon, GiftIcon } from '@/components/icons';
import { ApiError } from '@/api/errors';
import {
  promocodesApi,
  type SavedPromocode,
  type SavedPromocodeStatus,
} from '@/api/promocodes';
import { formatPrice } from '@/lib/format';
import { useT } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/en';
import { cn } from '@/lib/cn';

/** Backend save errors → precise messages (shares checkout's promo copy). */
const SAVE_ERROR_KEY: Record<string, TranslationKey> = {
  promocode_not_found: 'checkout.promo.err.notFound',
  promocode_inactive: 'checkout.promo.err.inactive',
  promocode_expired: 'checkout.promo.err.expired',
  promocode_exhausted: 'checkout.promo.err.exhausted',
  promocode_already_saved: 'account.promo.err.alreadySaved',
};

const STATUS_KEY: Record<SavedPromocodeStatus, TranslationKey> = {
  usable: 'account.promo.status.usable',
  expired: 'account.promo.status.expired',
  used: 'account.promo.status.used',
  revoked: 'account.promo.status.revoked',
};

const STATUS_TONE: Record<SavedPromocodeStatus, 'success' | 'warn' | 'neutral' | 'danger'> = {
  usable: 'success',
  expired: 'warn',
  used: 'neutral',
  revoked: 'danger',
};

const WALLET_KEY = ['me', 'promocodes'];

/**
 * "Promo codes" tab on the Account page — the discount wallet backed by
 * GET/POST/DELETE /me/promocodes. Saving here only bookmarks a code for
 * later; the actual redemption still happens at checkout, so a usable
 * entry deep-links straight to its course's checkout page.
 */
export function PromocodesTab() {
  const t = useT();
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState<string | null>(null);

  const wallet = useQuery({
    queryKey: WALLET_KEY,
    queryFn: () => promocodesApi.listSaved(),
  });

  const save = useMutation<SavedPromocode, ApiError, string>({
    mutationFn: (value) => promocodesApi.save(value),
    onSuccess: (saved) => {
      setCode('');
      setJustSaved(saved.code);
      void queryClient.invalidateQueries({ queryKey: WALLET_KEY });
    },
    onError: (err) => {
      const key = SAVE_ERROR_KEY[err.code] ?? 'checkout.promo.err.generic';
      setError(t(key));
    },
  });

  const remove = useMutation<void, ApiError, string>({
    mutationFn: (savedId) => promocodesApi.remove(savedId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WALLET_KEY });
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const normalized = code.trim().toUpperCase();
    if (!normalized || save.isPending) return;
    setError(null);
    setJustSaved(null);
    save.mutate(normalized);
  }

  const entries = wallet.data ?? [];

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-base font-semibold text-ink-900">{t('account.promo.title')}</h2>
        <p className="mt-1 text-xs text-ink-500">{t('account.promo.subtitle')}</p>
      </header>

      <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-input)]">
        <h3 className="text-sm font-semibold text-ink-900">{t('account.promo.add.title')}</h3>
        <p className="mt-1 text-xs text-ink-500">{t('account.promo.add.description')}</p>
        <form onSubmit={onSubmit} className="mt-4">
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (error) setError(null);
                if (justSaved) setJustSaved(null);
              }}
              placeholder={t('account.promo.placeholder')}
              aria-label={t('account.promo.add.title')}
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
              loading={save.isPending}
              disabled={!code.trim()}
              className="shrink-0"
            >
              {t('account.promo.save')}
            </Button>
          </div>
          <AnimatePresence>
            {(error || justSaved) && (
              <motion.p
                initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: reduce ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={cn('mt-2 text-xs', error ? 'text-danger-600' : 'text-success-600')}
                role={error ? 'alert' : 'status'}
              >
                {error ?? t('account.promo.added', { code: justSaved ?? '' })}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </section>

      <section className="rounded-xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-input)]">
        <h3 className="text-sm font-semibold text-ink-900">{t('account.promo.saved.title')}</h3>

        {wallet.isLoading ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : wallet.error ? (
          <p className="mt-4 text-sm text-danger-600">{t('account.promo.loadFailed')}</p>
        ) : entries.length === 0 ? (
          <div className="mt-4 grid place-items-center rounded-xl border border-dashed border-ink-200 bg-ink-50 py-10 text-center">
            <span className="grid size-10 place-items-center rounded-full bg-brand-50 text-brand-600">
              <GiftIcon className="size-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-navy-900">
              {t('account.promo.empty.title')}
            </p>
            <p className="mt-1 max-w-xs text-xs text-ink-500">{t('account.promo.empty.body')}</p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-ink-100">
            {entries.map((entry) => (
              <WalletRow
                key={entry.id}
                entry={entry}
                onRemove={() => remove.mutate(entry.id)}
                removing={remove.isPending && remove.variables === entry.id}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function WalletRow({
  entry,
  onRemove,
  removing,
}: {
  entry: SavedPromocode;
  onRemove: () => void;
  removing: boolean;
}) {
  const t = useT();

  const discountLabel =
    entry.discount_kind === 'percent'
      ? t('account.promo.percentOff', { value: entry.discount_value })
      : t('account.promo.amountOff', {
          // Wallet reads carry no currency; UZS matches the platform-wide
          // convention already used by the admin promocodes table.
          amount: formatPrice(entry.discount_value, 'UZS', false),
        });

  return (
    <li
      className={cn(
        'flex flex-wrap items-center gap-x-4 gap-y-2 py-4 first:pt-0 last:pb-0',
        !entry.is_valid && 'opacity-60',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-navy-900">
            {entry.code}
          </span>
          <Badge tone={STATUS_TONE[entry.status]}>{t(STATUS_KEY[entry.status])}</Badge>
        </p>
        <p className="mt-1.5 text-xs text-ink-600">
          <span className="font-medium text-navy-900">{discountLabel}</span>
          {entry.course_title && (
            <>
              {' · '}
              {entry.course_slug ? (
                <Link
                  to={`/courses/${entry.course_slug}`}
                  className="text-brand-600 hover:underline"
                >
                  {entry.course_title}
                </Link>
              ) : (
                entry.course_title
              )}
            </>
          )}
          {entry.expires_at && (
            <>
              {' · '}
              {t('account.promo.expires', {
                date: new Date(entry.expires_at).toLocaleDateString(),
              })}
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {entry.is_valid && entry.course_slug && (
          <Link
            to={`/courses/${entry.course_slug}/checkout`}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 text-sm font-medium text-ink-900 shadow-[var(--shadow-input)] transition-colors hover:border-ink-300 hover:bg-ink-50"
          >
            {t('account.promo.useAtCheckout')}
          </Link>
        )}
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
          aria-label={t('account.promo.remove')}
        >
          {removing ? <Spinner size="sm" /> : <CloseIcon className="size-4" />}
        </button>
      </div>
    </li>
  );
}
