import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ApiError } from '@/api/errors';
import { meApi } from '@/api/me';
import { authErrorMessage } from '@/features/auth/hooks';
import { useAuth } from '@/features/auth/AuthProvider';
import { useT } from '@/i18n/I18nProvider';

/**
 * Personal Data tab (Figma 14137:29221).
 *
 * Backend coverage today (FRONTEND.md §4.2):
 *  - PATCH /me      → first/last name (combined into full_name)
 *  - /auth/phone    → changing phone re-triggers the verify flow; we
 *                     do not rewrite phone here without going through
 *                     /verify-phone.
 *  - country / city / address are not yet in the schema — kept as
 *    UI-only fields that no-op on save until the backend lands them.
 */
export function PersonalDataTab() {
  const t = useT();
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const COUNTRIES = useMemo(
    () => [
      { value: 'US', label: t('account.personalData.country.US') },
      { value: 'GB', label: t('account.personalData.country.GB') },
      { value: 'DE', label: t('account.personalData.country.DE') },
      { value: 'ID', label: t('account.personalData.country.ID') },
      { value: 'UZ', label: t('account.personalData.country.UZ') },
      { value: 'IN', label: t('account.personalData.country.IN') },
    ],
    [t],
  );

  // Sync the name fields when the auth user lands / changes — done during
  // render (adjust-state pattern) instead of via a setState-in-effect.
  const [prevUser, setPrevUser] = useState<typeof user>(null);
  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      const [first, ...rest] = user.full_name.split(' ');
      setFirstName(first ?? '');
      setLastName(rest.join(' '));
    }
  }

  const save = useMutation({
    mutationFn: (full_name: string) => meApi.update({ full_name }),
    onSuccess: async () => {
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      setInfo(t('account.personalData.profileUpdated'));
      setTimeout(() => setInfo(null), 2500);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? authErrorMessage(err) : t('account.personalData.saveFailed'));
    },
  });

  function reset() {
    if (!user) return;
    const [first, ...rest] = user.full_name.split(' ');
    setFirstName(first ?? '');
    setLastName(rest.join(' '));
    setCountry('');
    setCity('');
    setAddress('');
    setError(null);
    setInfo(null);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const full = `${firstName} ${lastName}`.trim();
    if (!full) return;
    save.mutate(full);
  }

  if (!user) return null;

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <header>
        <h2 className="text-base font-semibold text-ink-900">{t('account.personalData.title')}</h2>
      </header>

      {error && <Banner tone="error">{error}</Banner>}
      {info && <Banner tone="info">{info}</Banner>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label={t('account.personalData.firstName')}
          required
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          label={t('account.personalData.lastName')}
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <Input
          label={t('account.personalData.email')}
          type="email"
          value={user.email}
          disabled
          hint={t('account.personalData.emailHint')}
        />
        <PhoneInput
          label={t('account.personalData.phone')}
          value={user.phone_number ?? ''}
          onChange={() => {
            /* Phone changes go through /verify-phone — disabled here. */
          }}
          countries={['UZ']}
          defaultCountry="UZ"
          disabled
        />

        <Select
          label={t('account.personalData.country')}
          placeholder={t('account.personalData.countryPlaceholder')}
          options={COUNTRIES}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <Input
          label={t('account.personalData.city')}
          placeholder={t('account.personalData.cityPlaceholder')}
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <div className="sm:col-span-2">
          <Textarea
            label={t('account.personalData.address')}
            placeholder={t('account.personalData.addressPlaceholder')}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <footer className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
        <Button variant="outline" type="button" onClick={reset}>
          {t('common.reset')}
        </Button>
        <Button type="submit" loading={save.isPending}>
          {t('common.save')}
        </Button>
      </footer>
    </form>
  );
}

function Banner({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: 'error' | 'info';
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={
        tone === 'error'
          ? 'rounded-md border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-600'
          : 'rounded-md border border-brand-100 bg-brand-25 px-3 py-2 text-sm text-brand-700'
      }
    >
      {children}
    </div>
  );
}
