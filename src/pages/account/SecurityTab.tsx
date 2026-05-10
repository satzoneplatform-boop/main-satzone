import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Spinner } from '@/components/ui/Spinner';
import { ApiError } from '@/api/errors';
import { meApi, type SessionRead } from '@/api/me';
import { authErrorMessage } from '@/features/auth/hooks';
import { evaluatePassword } from '@/components/ui/PasswordStrength';

export function SecurityTab() {
  const queryClient = useQueryClient();
  const sessions = useQuery({
    queryKey: ['me', 'sessions'],
    queryFn: () => meApi.listSessions(),
  });
  const [pwOpen, setPwOpen] = useState(false);

  const revokeOne = useMutation({
    mutationFn: (id: string) => meApi.revokeSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me', 'sessions'] }),
  });
  const revokeAll = useMutation({
    mutationFn: () => meApi.revokeAllSessions(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me', 'sessions'] }),
  });

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-base font-semibold text-ink-900">Security</h2>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SecurityCard
          title="Password"
          description="If you forgot your password, you can reset it here."
          ctaLabel="Change now"
          onClick={() => setPwOpen(true)}
        />
        <SecurityCard
          title="Two-Factor Auth"
          description="Add an extra layer of security to your account by enabling 2FA."
          ctaLabel="Enable"
          disabled
          ctaVariant="primary"
        />
      </div>

      <section className="rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
        <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h3 className="text-base font-semibold text-ink-900">Active sessions</h3>
          <button
            type="button"
            onClick={() => revokeAll.mutate()}
            disabled={revokeAll.isPending || (sessions.data?.length ?? 0) <= 1}
            className="text-sm font-medium text-danger-600 hover:underline disabled:cursor-not-allowed disabled:text-ink-400"
          >
            {revokeAll.isPending ? 'Signing out…' : 'Sign out All devices'}
          </button>
        </header>

        {sessions.isLoading ? (
          <div className="grid place-items-center py-12">
            <Spinner />
          </div>
        ) : (sessions.data?.length ?? 0) === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-ink-500">No active sessions.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-wider text-ink-500">
              <tr className="border-b border-ink-100">
                <th className="px-5 py-3 text-left font-medium">Device</th>
                <th className="px-5 py-3 text-left font-medium">Location</th>
                <th className="px-5 py-3 text-left font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {sessions.data!.map((s) => (
                <SessionRow
                  key={s.id}
                  session={s}
                  onRevoke={() => revokeOne.mutate(s.id)}
                  busy={revokeOne.isPending}
                />
              ))}
            </tbody>
          </table>
        )}
      </section>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}

function SecurityCard({
  title,
  description,
  ctaLabel,
  onClick,
  disabled,
  ctaVariant = 'outline',
}: {
  title: string;
  description: string;
  ctaLabel: string;
  onClick?: () => void;
  disabled?: boolean;
  ctaVariant?: 'primary' | 'outline';
}) {
  return (
    <article className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      <p className="mt-2 text-xs text-ink-500">{description}</p>
      <Button
        variant={ctaVariant}
        className="mt-4"
        onClick={onClick}
        disabled={disabled}
      >
        {ctaLabel}
      </Button>
    </article>
  );
}

function SessionRow({
  session,
  onRevoke,
  busy,
}: {
  session: SessionRead;
  onRevoke: () => void;
  busy: boolean;
}) {
  const ua = session.user_agent ?? 'Unknown';
  const isRecent = Date.now() - new Date(session.created_at).getTime() < 60 * 60 * 1000;
  return (
    <tr className="border-b border-ink-100 last:border-b-0">
      <td className="px-5 py-3 text-ink-900">{shortBrowser(ua)}</td>
      <td className="px-5 py-3 text-ink-600">{session.ip_address ?? '—'}</td>
      <td className="px-5 py-3">
        <Badge tone={isRecent ? 'success' : 'neutral'}>
          {isRecent ? 'Active now' : relativeTime(session.created_at)}
        </Badge>
      </td>
      <td className="px-5 py-3 text-right">
        <button
          type="button"
          onClick={onRevoke}
          disabled={busy}
          className="text-xs font-medium text-danger-600 hover:underline disabled:opacity-50"
        >
          Revoke
        </button>
      </td>
    </tr>
  );
}

function shortBrowser(ua: string): string {
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome/i.test(ua)) return 'Chrome';
  if (/firefox/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  return ua.split(' ')[0] ?? 'Unknown';
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / (1000 * 60 * 60));
  if (h < 1) return 'Just now';
  if (h < 24) return `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<string | null>(null);

  const change = useMutation({
    mutationFn: () => meApi.changePassword({ current_password: current, new_password: next }),
    onSuccess: () => {
      setCurrent('');
      setNext('');
      setError(null);
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? authErrorMessage(err) : 'Could not change password.');
    },
  });

  const checks = evaluatePassword(next);
  const passwordValid = checks.uppercase && checks.number && checks.length;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!passwordValid) {
      setError('New password must contain an uppercase letter, a number and 8+ characters.');
      return;
    }
    change.mutate();
  }

  return (
    <Modal open={open} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">Change password</h2>
          <p className="mt-1 text-sm text-ink-500">
            Enter your current password and choose a new one.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-danger-500/30 bg-red-50 px-3 py-2 text-sm text-danger-600">
            {error}
          </div>
        )}

        <PasswordInput
          label="Current password"
          required
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
        />

        <PasswordInput
          label="New password"
          required
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          hint="At least 8 characters, 1 uppercase letter, 1 number."
        />

        <Button
          type="submit"
          fullWidth
          size="lg"
          loading={change.isPending}
          disabled={!current || !passwordValid}
        >
          Update password
        </Button>
      </form>
    </Modal>
  );
}
