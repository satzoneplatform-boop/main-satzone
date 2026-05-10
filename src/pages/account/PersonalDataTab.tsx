import { useEffect, useState, type FormEvent } from 'react';
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

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'UZ', label: 'Uzbekistan' },
  { value: 'IN', label: 'India' },
];

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
  const { user, refresh } = useAuth();
  const queryClient = useQueryClient();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const [first, ...rest] = user.full_name.split(' ');
    setFirstName(first ?? '');
    setLastName(rest.join(' '));
  }, [user]);

  const save = useMutation({
    mutationFn: (full_name: string) => meApi.update({ full_name }),
    onSuccess: async () => {
      await refresh();
      void queryClient.invalidateQueries({ queryKey: ['me'] });
      setInfo('Profile updated.');
      setTimeout(() => setInfo(null), 2500);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? authErrorMessage(err) : 'Could not save changes.');
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
        <h2 className="text-base font-semibold text-ink-900">Personal Data</h2>
      </header>

      {error && <Banner tone="error">{error}</Banner>}
      {info && <Banner tone="info">{info}</Banner>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="First name"
          required
          autoComplete="given-name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <Input
          label="Last name"
          autoComplete="family-name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <Input
          label="Email"
          type="email"
          value={user.email}
          disabled
          hint="Email is locked. Contact support to change it."
        />
        <PhoneInput
          label="Phone number"
          value={user.phone_number ?? ''}
          onChange={() => {
            /* Phone changes go through /verify-phone — disabled here. */
          }}
          disabled
        />

        <Select
          label="Country"
          placeholder="Select country"
          options={COUNTRIES}
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        />
        <Input
          label="City"
          placeholder="Select city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />

        <div className="sm:col-span-2">
          <Textarea
            label="Address"
            placeholder="Enter your full address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <footer className="flex items-center justify-end gap-3 border-t border-ink-100 pt-4">
        <Button variant="outline" type="button" onClick={reset}>
          Reset
        </Button>
        <Button type="submit" loading={save.isPending}>
          Save
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
      className={
        tone === 'error'
          ? 'rounded-md border border-danger-500/30 bg-red-50 px-3 py-2 text-sm text-danger-600'
          : 'rounded-md border border-brand-100 bg-brand-25 px-3 py-2 text-sm text-brand-700'
      }
    >
      {children}
    </div>
  );
}
