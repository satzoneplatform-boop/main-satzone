import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { SearchIcon } from '@/components/icons';
import { ApiError } from '@/api/errors';
import {
  adminPromocodesApi,
  type AdminPromocode,
  type AdminPromocodeCreatePayload,
  type PromoStatusFilter,
  type RedemptionStatus,
} from '@/api/adminPromocodes';
import { useAuth } from '@/features/auth/AuthProvider';
import { formatPrice } from '@/lib/format';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

const STATUS_TABS: PromoStatusFilter[] = [
  'all',
  'active',
  'scheduled',
  'expired',
  'exhausted',
  'archived',
];

type DerivedStatus = 'active' | 'inactive' | 'scheduled' | 'expired' | 'exhausted' | 'archived';

function deriveStatus(p: AdminPromocode): DerivedStatus {
  const now = Date.now();
  if (p.archived_at) return 'archived';
  if (!p.is_active) return 'inactive';
  if (p.starts_at && new Date(p.starts_at).getTime() > now) return 'scheduled';
  if (p.expires_at && new Date(p.expires_at).getTime() <= now) return 'expired';
  if (p.uses_count >= p.max_uses) return 'exhausted';
  return 'active';
}

const STATUS_TONE: Record<DerivedStatus, 'success' | 'neutral' | 'brand' | 'warn' | 'danger'> = {
  active: 'success',
  inactive: 'neutral',
  scheduled: 'brand',
  expired: 'warn',
  exhausted: 'warn',
  archived: 'danger',
};

export function PromocodesAdminPage() {
  const t = useT();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PromoStatusFilter>('all');
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<AdminPromocode | null>(null);
  const [creating, setCreating] = useState(false);
  const [statsFor, setStatsFor] = useState<AdminPromocode | null>(null);

  const list = useQuery({
    queryKey: ['admin', 'promocodes', status, q],
    queryFn: () => adminPromocodesApi.list({ status, q: q.trim() || undefined, size: 100 }),
    enabled: user?.role === 'admin',
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'promocodes'] });

  const lifecycle = useMutation<
    AdminPromocode,
    ApiError,
    { id: string; action: 'activate' | 'deactivate' | 'archive' | 'unarchive' }
  >({
    mutationFn: ({ id, action }) => adminPromocodesApi[action](id),
    onSuccess: invalidate,
  });

  if (user && user.role !== 'admin') {
    return (
      <div className="grid place-items-center py-24 text-center">
        <div>
          <p className="text-sm font-semibold text-navy-900">{t('admin.promo.adminsOnly')}</p>
          <p className="mt-1 text-sm text-ink-500">{t('admin.promo.adminsOnlyBody')}</p>
        </div>
      </div>
    );
  }

  const items = list.data?.items ?? [];
  const rowBusyId = lifecycle.isPending ? lifecycle.variables?.id : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-navy-900">
            {t('admin.promo.title')}
          </h1>
          <p className="mt-1 text-sm text-ink-500">{t('admin.promo.subtitle')}</p>
        </div>
        <Button onClick={() => setCreating(true)}>{t('admin.promo.create')}</Button>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 shadow-[var(--shadow-card)]">
        <div className="min-w-[220px] flex-1">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('admin.promo.searchPlaceholder')}
            aria-label={t('admin.promo.searchPlaceholder')}
            leftSlot={<SearchIcon />}
          />
        </div>
        <div
          role="group"
          aria-label={t('admin.promo.statusFilterLabel')}
          className="flex flex-wrap gap-1.5"
        >
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              aria-pressed={status === s}
              className={cn(
                'min-h-11 rounded-full px-3.5 text-xs font-semibold transition-colors',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
                status === s
                  ? 'bg-brand-600 text-white'
                  : 'bg-ink-100 text-ink-600 hover:bg-ink-200',
              )}
            >
              {t(`admin.promo.status.${s}` as never)}
            </button>
          ))}
        </div>
      </div>

      {list.isLoading ? (
        <div className="space-y-3 rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
          <Skeleton className="h-4 w-1/3" />
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : list.error ? (
        <div className="rounded-2xl border border-danger-500/30 bg-danger-50 py-14 text-center">
          <p className="text-sm text-danger-600">{t('admin.promo.loadError')}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void list.refetch()}
          >
            {t('admin.promo.retry')}
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
          <p className="text-sm text-ink-500">{t('admin.promo.empty')}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setCreating(true)}>
            {t('admin.promo.create')}
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
          <p className="border-b border-ink-100 px-4 py-2.5 text-xs font-medium text-ink-500">
            {t('admin.promo.count', { n: list.data?.total ?? items.length })}
          </p>
          <div className="overflow-x-auto rounded-b-2xl">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-xs uppercase tracking-wide text-ink-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">{t('admin.promo.col.code')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.promo.col.discount')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.promo.col.scope')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.promo.col.usage')}</th>
                  <th className="px-4 py-3 font-semibold">{t('admin.promo.col.status')}</th>
                  <th className="px-4 py-3 text-right font-semibold">{t('admin.promo.col.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {items.map((p) => {
                  const s = deriveStatus(p);
                  const busy = rowBusyId === p.id;
                  return (
                    <tr key={p.id} className="align-middle transition-colors hover:bg-ink-50/40">
                      <td className="px-4 py-2.5">
                        <span className="font-mono font-semibold text-navy-900">{p.code}</span>
                        {p.description && (
                          <p className="mt-0.5 max-w-[220px] truncate text-xs text-ink-500">
                            {p.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-ink-700">
                        {p.discount_kind === 'percent'
                          ? `${p.discount_value}%`
                          : formatPrice(p.discount_value, 'UZS', false)}
                      </td>
                      <td className="px-4 py-2.5 text-ink-700">
                        {p.applies_to_all_courses
                          ? t('admin.promo.allCourses')
                          : t('admin.promo.oneCourse')}
                      </td>
                      <td className="px-4 py-2.5 tabular-nums text-ink-700">
                        {p.uses_count}/{p.max_uses}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={STATUS_TONE[s]}>{t(`admin.promo.status.${s}` as never)}</Badge>
                      </td>
                      <td className="px-4 py-1.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="min-h-11"
                            onClick={() => setStatsFor(p)}
                          >
                            {t('admin.promo.action.stats')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="min-h-11"
                            onClick={() => setEditing(p)}
                          >
                            {t('admin.promo.action.edit')}
                          </Button>
                          {p.archived_at ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="min-h-11"
                              loading={busy}
                              disabled={lifecycle.isPending && !busy}
                              onClick={() => lifecycle.mutate({ id: p.id, action: 'unarchive' })}
                            >
                              {t('admin.promo.action.unarchive')}
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="min-h-11"
                                loading={busy}
                                disabled={lifecycle.isPending && !busy}
                                onClick={() =>
                                  lifecycle.mutate({
                                    id: p.id,
                                    action: p.is_active ? 'deactivate' : 'activate',
                                  })
                                }
                              >
                                {p.is_active
                                  ? t('admin.promo.action.deactivate')
                                  : t('admin.promo.action.activate')}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="min-h-11"
                                disabled={lifecycle.isPending}
                                onClick={() => lifecycle.mutate({ id: p.id, action: 'archive' })}
                              >
                                {t('admin.promo.action.archive')}
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(creating || editing) && (
        <PromocodeFormModal
          promo={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            void invalidate();
          }}
        />
      )}

      {statsFor && (
        <PromocodeStatsModal promo={statsFor} onClose={() => setStatsFor(null)} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / edit form
// ---------------------------------------------------------------------------

function isoToLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const PROMO_ERROR_KEY: Record<string, string> = {
  promocode_code_taken: 'admin.promo.err.codeTaken',
  discount_makes_free: 'admin.promo.err.discountMakesFree',
  discount_exceeds_price: 'admin.promo.err.discountExceedsPrice',
  promocode_scope_required: 'admin.promo.err.scopeRequired',
  promocode_max_uses_below_used: 'admin.promo.err.maxUsesBelowUsed',
  promocode_discount_frozen: 'admin.promo.err.discountFrozen',
  window_invalid: 'admin.promo.err.windowInvalid',
  expires_in_past: 'admin.promo.err.expiresInPast',
};

function PromocodeFormModal({
  promo,
  onClose,
  onSaved,
}: {
  promo: AdminPromocode | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const isEdit = Boolean(promo);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<AdminPromocodeCreatePayload>({
    code: promo?.code ?? '',
    description: promo?.description ?? '',
    discount_kind: promo?.discount_kind ?? 'percent',
    discount_value: promo?.discount_value ?? 10,
    course_id: promo?.course_id ?? null,
    applies_to_all_courses: promo?.applies_to_all_courses ?? false,
    max_uses: promo?.max_uses ?? 1,
    per_user_limit: promo?.per_user_limit ?? null,
    min_purchase_cents: promo?.min_purchase_cents ?? null,
    first_purchase_only: promo?.first_purchase_only ?? false,
    starts_at: promo?.starts_at ?? null,
    expires_at: promo?.expires_at ?? null,
    is_active: promo?.is_active ?? true,
  });

  const courses = useQuery({
    queryKey: ['admin', 'promo-course-options'],
    queryFn: () => adminPromocodesApi.listCourses(),
    enabled: !form.applies_to_all_courses,
    staleTime: 60_000,
  });

  const save = useMutation<AdminPromocode, ApiError, void>({
    mutationFn: () => {
      const payload: AdminPromocodeCreatePayload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        description: form.description?.trim() || null,
        course_id: form.applies_to_all_courses ? null : form.course_id,
      };
      return isEdit
        ? adminPromocodesApi.update(promo!.id, payload)
        : adminPromocodesApi.create(payload);
    },
    onSuccess: onSaved,
    onError: (err) => {
      setError(
        err.code in PROMO_ERROR_KEY
          ? t(PROMO_ERROR_KEY[err.code] as never)
          : err.message || t('admin.promo.err.generic'),
      );
    },
  });

  function set<K extends keyof AdminPromocodeCreatePayload>(
    key: K,
    value: AdminPromocodeCreatePayload[K],
  ) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.applies_to_all_courses && !form.course_id) {
      setError(t('admin.promo.err.scopeRequired'));
      return;
    }
    save.mutate();
  }

  const courseOptions = useMemo(
    () =>
      (courses.data?.items ?? []).map((c) => ({ value: c.id, label: c.title })),
    [courses.data],
  );

  return (
    <Modal open onClose={onClose} className="max-w-lg">
      <form onSubmit={onSubmit} className="-mr-2 max-h-[80vh] space-y-5 overflow-y-auto pr-2">
        <h2 className="text-lg font-bold text-navy-900">
          {isEdit ? t('admin.promo.editTitle') : t('admin.promo.createTitle')}
        </h2>

        <div className="space-y-4">
          <Input
            label={t('admin.promo.field.code')}
            value={form.code}
            onChange={(e) => set('code', e.target.value.toUpperCase())}
            autoCapitalize="characters"
            className="font-mono uppercase"
            required
          />
          <Input
            label={t('admin.promo.field.description')}
            value={form.description ?? ''}
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <FormSection title={t('admin.promo.section.discount')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Select
              label={t('admin.promo.field.discountKind')}
              value={form.discount_kind}
              onChange={(e) => set('discount_kind', e.target.value as 'percent' | 'fixed')}
              options={[
                { value: 'percent', label: t('admin.promo.kind.percent') },
                { value: 'fixed', label: t('admin.promo.kind.fixed') },
              ]}
            />
            <Input
              label={
                form.discount_kind === 'percent'
                  ? t('admin.promo.field.percentValue')
                  : t('admin.promo.field.fixedValue')
              }
              type="number"
              min={1}
              value={form.discount_value}
              onChange={(e) => set('discount_value', Number(e.target.value))}
              required
            />
          </div>
        </FormSection>

        <FormSection title={t('admin.promo.section.scope')}>
          <Switch
            checked={form.applies_to_all_courses}
            onChange={(v) => set('applies_to_all_courses', v)}
            label={t('admin.promo.field.allCourses')}
          />
          {!form.applies_to_all_courses && (
            <div className="mt-3">
              <Select
                label={t('admin.promo.field.course')}
                value={form.course_id ?? ''}
                onChange={(e) => set('course_id', e.target.value || null)}
                placeholder={t('admin.promo.field.coursePlaceholder')}
                options={courseOptions}
              />
            </div>
          )}
        </FormSection>

        <FormSection title={t('admin.promo.section.limits')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label={t('admin.promo.field.maxUses')}
              type="number"
              min={1}
              value={form.max_uses}
              onChange={(e) => set('max_uses', Number(e.target.value))}
            />
            <Input
              label={t('admin.promo.field.perUserLimit')}
              hint={t('admin.promo.field.optionalHint')}
              type="number"
              min={1}
              value={form.per_user_limit ?? ''}
              onChange={(e) =>
                set('per_user_limit', e.target.value ? Number(e.target.value) : null)
              }
            />
          </div>

          <Input
            label={t('admin.promo.field.minPurchase')}
            hint={t('admin.promo.field.minorUnitsHint')}
            type="number"
            min={0}
            value={form.min_purchase_cents ?? ''}
            onChange={(e) =>
              set('min_purchase_cents', e.target.value ? Number(e.target.value) : null)
            }
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label={t('admin.promo.field.startsAt')}
              type="datetime-local"
              value={isoToLocalInput(form.starts_at ?? null)}
              onChange={(e) => set('starts_at', localInputToIso(e.target.value))}
            />
            <Input
              label={t('admin.promo.field.expiresAt')}
              type="datetime-local"
              value={isoToLocalInput(form.expires_at ?? null)}
              onChange={(e) => set('expires_at', localInputToIso(e.target.value))}
            />
          </div>
        </FormSection>

        <FormSection title={t('admin.promo.section.flags')}>
          <div className="space-y-2.5">
            <Switch
              checked={form.first_purchase_only}
              onChange={(v) => set('first_purchase_only', v)}
              label={t('admin.promo.field.firstPurchaseOnly')}
            />
            <Switch
              checked={form.is_active}
              onChange={(v) => set('is_active', v)}
              label={t('admin.promo.field.active')}
            />
          </div>
        </FormSection>

        <p className="text-xs text-ink-500">{t('admin.promo.oneCodeNote')}</p>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-600"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('admin.promo.cancel')}
          </Button>
          <Button type="submit" loading={save.isPending}>
            {isEdit ? t('admin.promo.save') : t('admin.promo.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-ink-200 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-500">{title}</h3>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Usage stats + redemptions
// ---------------------------------------------------------------------------

const REDEMPTION_TONE: Record<RedemptionStatus, 'success' | 'brand' | 'neutral'> = {
  confirmed: 'success',
  reserved: 'brand',
  released: 'neutral',
};

const REDEMPTION_KEY: Record<RedemptionStatus, 'admin.promo.redemption.confirmed' | 'admin.promo.redemption.reserved' | 'admin.promo.redemption.released'> = {
  confirmed: 'admin.promo.redemption.confirmed',
  reserved: 'admin.promo.redemption.reserved',
  released: 'admin.promo.redemption.released',
};

function PromocodeStatsModal({
  promo,
  onClose,
}: {
  promo: AdminPromocode;
  onClose: () => void;
}) {
  const t = useT();
  const stats = useQuery({
    queryKey: ['admin', 'promo-stats', promo.id],
    queryFn: () => adminPromocodesApi.stats(promo.id),
  });
  const redemptions = useQuery({
    queryKey: ['admin', 'promo-redemptions', promo.id],
    queryFn: () => adminPromocodesApi.redemptions(promo.id, { size: 10 }),
  });

  return (
    <Modal open onClose={onClose} className="max-w-md">
      <div className="-mr-2 max-h-[80vh] space-y-4 overflow-y-auto pr-2">
        <div>
          <h2 className="text-lg font-bold text-navy-900">{t('admin.promo.statsTitle')}</h2>
          <p className="font-mono text-sm text-ink-500">{promo.code}</p>
        </div>
        {stats.isLoading ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : stats.data ? (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Stat label={t('admin.promo.stats.confirmed')} value={String(stats.data.confirmed_count)} />
            <Stat label={t('admin.promo.stats.reserved')} value={String(stats.data.reserved_count)} />
            <Stat label={t('admin.promo.stats.released')} value={String(stats.data.released_count)} />
            <Stat
              label={t('admin.promo.stats.totalUses')}
              value={`${stats.data.total_uses}/${stats.data.max_uses}`}
            />
            <Stat
              label={t('admin.promo.stats.totalDiscount')}
              value={formatPrice(stats.data.total_discount_cents, 'UZS', false)}
            />
            <Stat
              label={t('admin.promo.stats.revenue')}
              value={formatPrice(stats.data.revenue_after_discount_cents, 'UZS', false)}
            />
          </dl>
        ) : (
          <p className="text-sm text-danger-600">{t('admin.promo.loadError')}</p>
        )}

        <section>
          <h3 className="text-sm font-semibold text-navy-900">
            {t('admin.promo.redemptionsTitle')}
          </h3>
          {redemptions.isLoading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : redemptions.error ? (
            <p className="mt-3 text-sm text-danger-600">
              {t('admin.promo.redemptions.loadError')}
            </p>
          ) : (redemptions.data?.items.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-ink-500">{t('admin.promo.redemptions.empty')}</p>
          ) : (
            <ul className="mt-3 divide-y divide-ink-100 rounded-xl border border-ink-100">
              {redemptions.data!.items.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-xs text-ink-500">
                      {new Date(r.created_at).toLocaleString()}
                    </p>
                    <p className="mt-0.5 text-sm font-medium tabular-nums text-navy-900">
                      −{formatPrice(r.discount_cents, 'UZS', false)}
                    </p>
                  </div>
                  <Badge tone={REDEMPTION_TONE[r.status]}>{t(REDEMPTION_KEY[r.status])}</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            {t('admin.promo.close')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3">
      <dt className="text-xs text-ink-500">{label}</dt>
      <dd className="mt-1 text-lg font-bold text-navy-900">{value}</dd>
    </div>
  );
}
