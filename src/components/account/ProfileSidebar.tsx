import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { LogoutIcon } from '@/components/icons';
import { meApi } from '@/api/me';
import { ApiError } from '@/api/errors';
import { useAuth } from '@/features/auth/AuthProvider';
import { useT } from '@/i18n/I18nProvider';
import type { UserMe } from '@/types/api';

interface ProfileSidebarProps {
  user: UserMe;
  totalCourses: number;
  studyHours: number;
  certificates: number;
  onSignOut: () => void;
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Left-rail profile card on the Account & Settings page (Figma 14137:29221).
 * Displays the user's identity, a 3-up stats row, and "work preferences"
 * pulled from the onboarding profile (job/headline + interests).
 */
export function ProfileSidebar({
  user,
  totalCourses,
  studyHours,
  certificates,
  onSignOut,
}: ProfileSidebarProps) {
  const t = useT();
  return (
    <aside className="space-y-4 rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col items-center text-center">
        <AvatarUploader user={user} />
        <p className="mt-3 text-base font-semibold text-ink-900">
          {user.full_name || 'SATZone learner'}
        </p>
        <p className="text-xs text-ink-500">{user.email}</p>
        {user.phone_number && (
          <p className="text-xs text-ink-500">{user.phone_number}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-ink-100 pt-4 text-center">
        <Stat value={String(totalCourses)} label={t('account.profile.totalCourses')} />
        <Stat value={`${studyHours}h ${studyHours > 0 ? '0' : ''}m`} label={t('account.profile.totalTime')} />
        <Stat value={String(certificates)} label={t('account.profile.certificates')} />
      </div>

      <section className="rounded-xl border border-ink-200 bg-ink-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
          {t('account.profile.workPreferences')}
        </p>
        <div className="mt-3">
          <p className="text-xs text-ink-500">{t('account.profile.currentJobTitle')}</p>
          <p className="text-sm font-medium text-ink-900">
            Digital Marketings
          </p>
        </div>
        <div className="mt-3">
          <p className="text-xs text-ink-500">{t('account.profile.interests')}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <Badge tone="brand">Marketing</Badge>
            <Badge tone="brand">Business</Badge>
            <Badge tone="brand">Analytics</Badge>
          </div>
        </div>
      </section>

      <Button
        type="button"
        variant="outline"
        fullWidth
        leftIcon={<LogoutIcon />}
        onClick={onSignOut}
        className="text-danger-600 hover:bg-red-50"
      >
        {t('account.profile.signOut')}
      </Button>
    </aside>
  );
}

/**
 * Click-to-upload avatar control. Hits POST /me/avatar (multipart `file` field
 * per app/api/v1/account.py) and refreshes the auth user so the new URL
 * propagates to the topbar / sidebar / etc.
 */
function AvatarUploader({ user }: { user: UserMe }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const { refresh } = useAuth();
  const t = useT();
  const [error, setError] = useState<string | null>(null);

  const upload = useMutation({
    mutationFn: (file: File) => meApi.uploadAvatar(file),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? `Couldn’t upload: ${err.message}`
          : 'Couldn’t upload — please try again.',
      );
    },
  });

  const remove = useMutation({
    mutationFn: () => meApi.deleteAvatar(),
    onSuccess: async () => {
      setError(null);
      await refresh();
    },
    onError: (err) => {
      setError(
        err instanceof ApiError
          ? `Couldn’t remove: ${err.message}`
          : 'Couldn’t remove — please try again.',
      );
    },
  });

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Pick an image file (JPEG, PNG, etc.).');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('Image is over 5 MB — pick a smaller one.');
      return;
    }
    upload.mutate(file);
  }

  const busy = upload.isPending || remove.isPending;

  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={busy}
        aria-label={user.avatar_url ? 'Change profile photo' : 'Upload profile photo'}
        className="group relative rounded-full ring-4 ring-white shadow-md focus:outline-none focus-visible:ring-brand-500"
      >
        <Avatar src={user.avatar_url} name={user.full_name} size={72} />
        <span
          className={
            busy
              ? 'absolute inset-0 grid place-items-center rounded-full bg-black/55 text-white'
              : 'absolute inset-0 grid place-items-center rounded-full bg-black/0 text-white opacity-0 transition group-hover:bg-black/55 group-hover:opacity-100'
          }
        >
          {busy ? <Spinner className="text-white" /> : <CameraIcon />}
        </span>
      </button>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onPick}
      />

      {user.avatar_url && !busy && (
        <button
          type="button"
          onClick={() => remove.mutate()}
          className="mt-2 text-xs font-medium text-ink-500 hover:text-danger-600"
        >
          {t('account.profile.removePhoto')}
        </button>
      )}

      {error && <p className="mt-2 max-w-[12rem] text-xs text-danger-600">{error}</p>}
    </div>
  );
}

function CameraIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-base font-semibold text-ink-900">{value}</p>
      <p className="text-[11px] text-ink-500">{label}</p>
    </div>
  );
}
