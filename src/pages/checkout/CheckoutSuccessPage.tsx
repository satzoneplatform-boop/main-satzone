import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { CommitmentModal } from '@/pages/course/CommitmentModal';
import { useCourseDetail } from '@/features/course/hooks';
import type { EnrollmentRead } from '@/types/api';

const COMMITMENT_KEY = (courseId: string) => `edure.commitment.${courseId}`;

export function CheckoutSuccessPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const enrollment = (location.state as { enrollment?: EnrollmentRead } | null)?.enrollment;
  const course = useCourseDetail(slug);
  const [commitmentOpen, setCommitmentOpen] = useState(false);

  if (course.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const c = course.data;
  if (!c) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-sm text-ink-500">This course is unavailable.</p>
      </div>
    );
  }

  const startUrl =
    enrollment?.last_lesson_id
      ? `/lessons/${enrollment.last_lesson_id}`
      : `/courses/${c.slug}`;

  function onGetStarted() {
    const seen =
      typeof window !== 'undefined' &&
      window.localStorage.getItem(COMMITMENT_KEY(c!.id));
    if (seen) {
      navigate(startUrl);
    } else {
      setCommitmentOpen(true);
    }
  }

  function onAccept() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COMMITMENT_KEY(c!.id), '1');
    }
    navigate(startUrl);
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Explore', to: '/explore' },
          { label: 'Search results', to: '/explore/search' },
          { label: 'Detail course', to: `/courses/${c.slug}` },
          { label: 'Payment' },
        ]}
      />

      <div className="grid place-items-center py-16">
        <article className="w-full max-w-md overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
          <div className="bg-gradient-to-b from-emerald-50 to-white px-8 pt-12 pb-8 text-center">
            <div className="mx-auto grid size-24 place-items-center rounded-full bg-white shadow-md">
              <SuccessBadge />
            </div>
            <h1 className="mt-6 text-2xl font-semibold tracking-tight text-ink-900">
              Successfully enrolled!
            </h1>
            <p className="mt-2 text-sm text-ink-500">
              Your 7-day free trial has started. You now
              <br />
              have full access to this course and all
              <br />
              learning materials.
            </p>
          </div>

          <div className="space-y-4 border-t border-ink-100 px-6 py-5">
            <div className="flex gap-3 rounded-xl border border-ink-200 bg-white p-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-lg bg-ink-100">
                {c.thumbnail_url && (
                  <img
                    src={c.thumbnail_url}
                    alt={c.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                {c.instructor && (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-700">
                    <Avatar
                      src={c.instructor.avatar_url}
                      name={c.instructor.full_name}
                      size={14}
                    />
                    {c.instructor.full_name}
                  </span>
                )}
                <p className="mt-1 line-clamp-2 text-sm font-semibold text-ink-900">
                  {c.title}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-ink-100 pt-3 text-sm">
              <span className="text-ink-500">Total payment</span>
              <span className="font-semibold text-ink-900">$0.00</span>
            </div>

            <Button fullWidth size="lg" onClick={onGetStarted}>
              Get started
            </Button>
          </div>
        </article>
      </div>

      <CommitmentModal
        open={commitmentOpen}
        onClose={() => setCommitmentOpen(false)}
        onStart={onAccept}
      />
    </div>
  );
}

function SuccessBadge() {
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" fill="none" aria-hidden>
      <path
        d="M32 4l5.7 4.3 7-1 2 6.8 6.8 2-1 7L57 32l-4.3 5.7 1 7-6.8 2-2 6.8-7-1L32 56l-5.7-4.3-7 1-2-6.8-6.8-2 1-7L7 32l4.3-5.7-1-7 6.8-2 2-6.8 7 1L32 4Z"
        fill="#22C55E"
      />
      <path
        d="M22 32.5l7 7 13-14"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
