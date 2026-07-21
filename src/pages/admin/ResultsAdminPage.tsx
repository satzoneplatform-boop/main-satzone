import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs } from '@/components/ui/Tabs';
import { Logo } from '@/components/brand/Logo';
import { LockIcon, LogoutIcon, TrendingUpIcon } from '@/components/icons';
import { adminResultsApi } from '@/api/adminResults';
import { CmsError } from '@/api/cmsClient';
import type {
  MathResult,
  ResultCategory,
  UniversityResult,
} from '@/features/results/types';

/**
 * Private Results CMS admin panel (route: /admin/results).
 *
 * Deliberately standalone — not in the site navigation and not behind the app's
 * user auth. It has its own shared-password gate (see AdminAuthGate) and manages
 * both result categories: create/edit/delete, publish/unpublish, and student
 * photo uploads with a live preview. Strings are inline English on purpose; this
 * is an internal ops tool, not part of the localized public site.
 */
export function ResultsAdminPage() {
  return (
    <AdminAuthGate>
      <ResultsManager />
    </AdminAuthGate>
  );
}

/* -------------------------------------------------------------------------- */
/* Auth gate                                                                  */
/* -------------------------------------------------------------------------- */

function AdminAuthGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'out' | 'in'>('checking');

  useEffect(() => {
    let active = true;
    // validateSession() resolves false immediately when no token is stored, so
    // this single async path covers both "no token" and "expired token".
    adminResultsApi.validateSession().then((ok) => {
      if (active) setState(ok ? 'in' : 'out');
    });
    return () => {
      active = false;
    };
  }, []);

  if (state === 'checking') {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-50">
        <Spinner size="lg" />
      </div>
    );
  }
  if (state === 'out') {
    return <AdminLogin onSuccess={() => setState('in')} />;
  }
  return <>{children}</>;
}

function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const login = useMutation<void, CmsError, string>({
    mutationFn: (pw) => adminResultsApi.login(pw),
    onSuccess,
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password) login.mutate(password);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-navy-900 px-4">
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white p-8 shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]"
      >
        <div className="flex flex-col items-center text-center">
          <Logo size={40} />
          <span className="mt-4 grid size-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
            <LockIcon className="size-5" />
          </span>
          <h1 className="mt-4 text-lg font-bold text-navy-900">Results admin</h1>
          <p className="mt-1 text-sm text-ink-500">Enter the admin password to manage student results.</p>
        </div>

        <div className="mt-6">
          <Input
            type="password"
            label="Password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            error={login.isError ? 'Incorrect password. Try again.' : undefined}
          />
        </div>

        <Button type="submit" fullWidth className="mt-5" loading={login.isPending} disabled={!password}>
          Sign in
        </Button>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Manager                                                                    */
/* -------------------------------------------------------------------------- */

const TABS = [
  { value: 'university' as const, label: 'University Acceptances' },
  { value: 'math' as const, label: 'SAT Math Improvements' },
];

function ResultsManager() {
  const qc = useQueryClient();
  const [category, setCategory] = useState<ResultCategory>('university');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UniversityResult | MathResult | null>(null);
  const [deleting, setDeleting] = useState<UniversityResult | MathResult | null>(null);

  const list = useQuery({
    queryKey: ['admin-results', category],
    queryFn: () => adminResultsApi.list(category),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-results', category] });
    // Public landing query for this category is now stale too.
    qc.invalidateQueries({ queryKey: ['results', category] });
  };

  const publish = useMutation<unknown, CmsError, { id: string; published: boolean }>({
    mutationFn: ({ id, published }) => adminResultsApi.setPublished(category, id, published),
    onSuccess: invalidate,
  });

  const remove = useMutation<void, CmsError, string>({
    mutationFn: (id) => adminResultsApi.remove(category, id),
    onSuccess: () => {
      setDeleting(null);
      invalidate();
    },
  });

  const items = list.data ?? [];

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6">
          <Logo withWordmark size={26} />
          <span className="rounded-md bg-ink-100 px-2 py-0.5 text-xs font-semibold text-ink-600">
            Results CMS
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            leftIcon={<LogoutIcon />}
            onClick={() => {
              adminResultsApi.logout();
              window.location.reload();
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-navy-900">Student results</h1>
            <p className="mt-1 text-sm text-ink-500">
              Manage what appears in the Results section of the landing page.
            </p>
          </div>
          <Button onClick={() => setCreating(true)}>Add result</Button>
        </div>

        <div className="flex justify-between gap-3">
          <Tabs items={TABS} value={category} onChange={setCategory} variant="underline" className="flex-1" />
        </div>

        {list.isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : list.isError ? (
          <ErrorBlock onRetry={() => list.refetch()} />
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
            <p className="text-sm text-ink-500">No results yet in this category.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setCreating(true)}>
              Add the first one
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.id}>
                <ResultRow
                  category={category}
                  result={item}
                  publishBusy={publish.isPending && publish.variables?.id === item.id}
                  onTogglePublish={() => publish.mutate({ id: item.id, published: !item.published })}
                  onEdit={() => setEditing(item)}
                  onDelete={() => setDeleting(item)}
                />
              </li>
            ))}
          </ul>
        )}
      </main>

      {(creating || editing) && (
        <ResultFormModal
          category={category}
          result={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            invalidate();
          }}
        />
      )}

      {deleting && (
        <Modal open onClose={() => setDeleting(null)} className="max-w-sm">
          <h2 className="text-lg font-bold text-navy-900">Delete this result?</h2>
          <p className="mt-2 text-sm text-ink-500">
            “{deleting.studentName}” will be permanently removed. This cannot be undone.
          </p>
          {remove.isError && (
            <p role="alert" className="mt-3 rounded-md bg-danger-50 px-3 py-2 text-sm text-danger-600">
              Couldn't delete — please try again.
            </p>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={remove.isPending} onClick={() => remove.mutate(deleting.id)}>
              Delete
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ErrorBlock({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-danger-500/30 bg-danger-50 py-14 text-center">
      <p className="text-sm text-danger-600">Couldn't load results. Is the CMS server running?</p>
      <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* List row                                                                   */
/* -------------------------------------------------------------------------- */

function ResultRow({
  category,
  result,
  publishBusy,
  onTogglePublish,
  onEdit,
  onDelete,
}: {
  category: ResultCategory;
  result: UniversityResult | MathResult;
  publishBusy: boolean;
  onTogglePublish: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink-200 bg-white p-3 shadow-[var(--shadow-card)] sm:flex-nowrap">
      <img
        src={result.photoUrl}
        alt=""
        className="size-14 shrink-0 rounded-xl object-cover"
        onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-navy-900">{result.studentName}</p>
          <Badge tone={result.published ? 'success' : 'neutral'}>
            {result.published ? 'Published' : 'Draft'}
          </Badge>
        </div>
        <p className="mt-0.5 truncate text-sm text-ink-500">
          {category === 'university'
            ? [
                (result as UniversityResult).universityName,
                (result as UniversityResult).country,
                (result as UniversityResult).overallScore,
              ]
                .filter(Boolean)
                .join(' · ')
            : `${(result as MathResult).mathBefore} → ${(result as MathResult).mathAfter}`}
        </p>
      </div>

      {category === 'math' && (
        <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-sm font-bold text-brand-600">
          <TrendingUpIcon className="size-4" />+{(result as MathResult).improvement}
        </span>
      )}

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-ink-500">
          <Switch
            checked={result.published}
            onChange={onTogglePublish}
            disabled={publishBusy}
            label="Published"
          />
        </label>
        <Button size="sm" variant="ghost" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="ghost" className="text-danger-600" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Create / edit form                                                         */
/* -------------------------------------------------------------------------- */

interface FormState {
  studentName: string;
  photoUrl: string;
  photoFile: File | null;
  testimonial: string;
  published: boolean;
  universityName: string;
  universityLogoUrl: string;
  logoFile: File | null;
  country: string;
  overallScore: string;
  acceptanceStatus: string;
  mathBefore: string;
  mathAfter: string;
  mathOverall: string;
}

function initialForm(result: UniversityResult | MathResult | null, category: ResultCategory): FormState {
  const uni = category === 'university' ? (result as UniversityResult | null) : null;
  const math = category === 'math' ? (result as MathResult | null) : null;
  return {
    studentName: result?.studentName ?? '',
    photoUrl: result?.photoUrl ?? '',
    photoFile: null,
    testimonial: result?.testimonial ?? '',
    published: result?.published ?? false,
    universityName: uni?.universityName ?? '',
    universityLogoUrl: uni?.universityLogoUrl ?? '',
    logoFile: null,
    country: uni?.country ?? '',
    overallScore: uni?.overallScore != null ? String(uni.overallScore) : '',
    acceptanceStatus: uni?.acceptanceStatus ?? '',
    mathBefore: math?.mathBefore != null ? String(math.mathBefore) : '',
    mathAfter: math?.mathAfter != null ? String(math.mathAfter) : '',
    mathOverall: math?.overallScore != null ? String(math.overallScore) : '',
  };
}

function ResultFormModal({
  category,
  result,
  onClose,
  onSaved,
}: {
  category: ResultCategory;
  result: UniversityResult | MathResult | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(result);
  const [form, setForm] = useState<FormState>(() => initialForm(result, category));
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const improvement = useMemo(() => {
    const before = Number(form.mathBefore);
    const after = Number(form.mathAfter);
    if (!form.mathBefore || !form.mathAfter || Number.isNaN(before) || Number.isNaN(after)) return null;
    return after - before;
  }, [form.mathBefore, form.mathAfter]);

  const save = useMutation<unknown, CmsError, void>({
    mutationFn: async () => {
      // Upload any newly-picked images first, then persist the record.
      let photoUrl = form.photoUrl;
      if (form.photoFile) photoUrl = (await adminResultsApi.uploadImage(form.photoFile)).url;
      let logoUrl = form.universityLogoUrl;
      if (form.logoFile) logoUrl = (await adminResultsApi.uploadImage(form.logoFile)).url;

      if (category === 'university') {
        // Optional fields are sent as '' (not dropped) so an edit can clear
        // them — the server turns '' into "unset" and merge-updates.
        const payload = {
          studentName: form.studentName.trim(),
          photoUrl,
          testimonial: form.testimonial.trim(),
          published: form.published,
          universityName: form.universityName.trim(),
          universityLogoUrl: logoUrl,
          country: form.country.trim(),
          overallScore: Number(form.overallScore),
          acceptanceStatus: form.acceptanceStatus.trim(),
        };
        return isEdit
          ? adminResultsApi.update('university', result!.id, payload)
          : adminResultsApi.create('university', payload);
      }
      const payload = {
        studentName: form.studentName.trim(),
        photoUrl,
        testimonial: form.testimonial.trim(),
        published: form.published,
        mathBefore: Number(form.mathBefore),
        mathAfter: Number(form.mathAfter),
        overallScore: form.mathOverall ? Number(form.mathOverall) : undefined,
      };
      return isEdit
        ? adminResultsApi.update('math', result!.id, payload)
        : adminResultsApi.create('math', payload);
    },
    onSuccess: onSaved,
    onError: (err) => setError(formatCmsError(err)),
  });

  function validate(): string | null {
    if (!form.studentName.trim()) return 'Student name is required.';
    if (!form.photoUrl && !form.photoFile) return 'A student photo is required.';
    if (category === 'university') {
      if (!form.country.trim()) return 'Country is required.';
      const score = Number(form.overallScore);
      if (!form.overallScore || score < 400 || score > 1600) return 'Overall SAT must be between 400 and 1600.';
    } else {
      const before = Number(form.mathBefore);
      const after = Number(form.mathAfter);
      if (!form.mathBefore || before < 200 || before > 800) return 'Math before must be between 200 and 800.';
      if (!form.mathAfter || after < 200 || after > 800) return 'Math after must be between 200 and 800.';
      if (after < before) return 'Math after must be greater than or equal to before.';
      if (form.mathOverall) {
        const overall = Number(form.mathOverall);
        if (overall < 400 || overall > 1600) return 'Overall SAT must be between 400 and 1600.';
      }
    }
    return null;
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    save.mutate();
  }

  return (
    <Modal open onClose={onClose} className="max-w-lg">
      <form onSubmit={onSubmit} className="-mr-2 max-h-[82vh] space-y-5 overflow-y-auto pr-2">
        <h2 className="text-lg font-bold text-navy-900">
          {isEdit ? 'Edit result' : 'Add result'} ·{' '}
          <span className="text-ink-500">{category === 'university' ? 'University' : 'SAT Math'}</span>
        </h2>

        <ImageField
          label="Student photo"
          url={form.photoUrl}
          file={form.photoFile}
          onPick={(file) => set('photoFile', file)}
          onClear={() => {
            set('photoFile', null);
            set('photoUrl', '');
          }}
          onError={setError}
        />

        <Input
          label="Student name"
          value={form.studentName}
          onChange={(e) => set('studentName', e.target.value)}
          required
        />

        {category === 'university' ? (
          <>
            <Input
              label="University name (optional)"
              hint="Leave empty if the student isn't accepted anywhere yet"
              value={form.universityName}
              onChange={(e) => set('universityName', e.target.value)}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Country"
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
                required
              />
              <Input
                label="Overall SAT score"
                type="number"
                min={400}
                max={1600}
                value={form.overallScore}
                onChange={(e) => set('overallScore', e.target.value)}
                required
              />
            </div>
            <Input
              label="Acceptance status (optional)"
              hint="e.g. Accepted, Full Scholarship, Waitlist → Accepted"
              value={form.acceptanceStatus}
              onChange={(e) => set('acceptanceStatus', e.target.value)}
            />
            <ImageField
              label="University logo (optional)"
              url={form.universityLogoUrl}
              file={form.logoFile}
              onPick={(file) => set('logoFile', file)}
              onClear={() => {
                set('logoFile', null);
                set('universityLogoUrl', '');
              }}
              onError={setError}
              compact
            />
          </>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Math score before"
                type="number"
                min={200}
                max={800}
                value={form.mathBefore}
                onChange={(e) => set('mathBefore', e.target.value)}
                required
              />
              <Input
                label="Math score after"
                type="number"
                min={200}
                max={800}
                value={form.mathAfter}
                onChange={(e) => set('mathAfter', e.target.value)}
                required
              />
            </div>
            {/* Auto-calculated improvement */}
            <div className="flex items-center justify-between rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">
              <span className="text-sm font-medium text-ink-600">Improvement (auto-calculated)</span>
              <span className="inline-flex items-center gap-1 text-lg font-bold text-brand-600">
                <TrendingUpIcon className="size-5" />
                {improvement == null ? '—' : `${improvement >= 0 ? '+' : ''}${improvement} pts`}
              </span>
            </div>
            <Input
              label="Overall SAT score (optional)"
              type="number"
              min={400}
              max={1600}
              value={form.mathOverall}
              onChange={(e) => set('mathOverall', e.target.value)}
            />
          </>
        )}

        <Textarea
          label="Testimonial (optional)"
          rows={3}
          value={form.testimonial}
          onChange={(e) => set('testimonial', e.target.value)}
        />

        <div className="rounded-xl border border-ink-200 p-4">
          <Switch
            checked={form.published}
            onChange={(v) => set('published', v)}
            label="Published (visible on the landing page)"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md border border-danger-500/30 bg-danger-50 px-3 py-2 text-sm text-danger-600">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={save.isPending}>
            {isEdit ? 'Save changes' : 'Create result'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/* Image upload field (with live preview)                                     */
/* -------------------------------------------------------------------------- */

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function ImageField({
  label,
  url,
  file,
  onPick,
  onClear,
  onError,
  compact = false,
}: {
  label: string;
  url: string;
  file: File | null;
  onPick: (file: File) => void;
  onClear: () => void;
  onError: (message: string) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Local preview URL for the pending file; revoked on change/unmount so we
  // don't leak object URLs. Derived (not stored in state) to keep the effect
  // side-effect-free apart from cleanup.
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const preview = objectUrl ?? (url || null);

  function handlePick(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!picked) return;
    if (!picked.type.startsWith('image/')) {
      onError('Please choose an image file.');
      return;
    }
    if (picked.size > MAX_IMAGE_BYTES) {
      onError('Image must be 5 MB or smaller.');
      return;
    }
    onPick(picked);
  }

  const box = compact ? 'size-16' : 'size-24';

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium text-ink-700">{label}</span>
      <div className="flex items-center gap-4">
        <div className={`relative shrink-0 overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 ${box}`}>
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-ink-400">No image</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handlePick} />
          <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
            {preview ? 'Replace image' : 'Upload image'}
          </Button>
          {preview && (
            <Button type="button" size="sm" variant="ghost" className="text-danger-600" onClick={onClear}>
              Remove
            </Button>
          )}
          {file && <span className="text-xs text-ink-400">Will upload on save · optimized automatically</span>}
        </div>
      </div>
    </div>
  );
}

function formatCmsError(err: CmsError): string {
  if (err.details) {
    const first = Object.values(err.details).flat().filter(Boolean)[0];
    if (first) return String(first);
  }
  if (err.status === 401) return 'Your session expired. Please sign in again.';
  return err.message || 'Something went wrong. Please try again.';
}
