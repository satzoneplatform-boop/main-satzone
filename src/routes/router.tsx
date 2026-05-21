import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ExplorePage } from '@/pages/explore/ExplorePage';
import { SearchResultsPage } from '@/pages/explore/SearchResultsPage';
import { CourseDetailPage } from '@/pages/course/CourseDetailPage';
import { CheckoutPage } from '@/pages/checkout/CheckoutPage';
import { CheckoutSuccessPage } from '@/pages/checkout/CheckoutSuccessPage';
import { MyLearningsPage } from '@/pages/learning/MyLearningsPage';
import { CourseLearnPage } from '@/pages/learning/CourseLearnPage';
import { AssessmentOverviewPage } from '@/pages/learning/AssessmentOverviewPage';
import { AssessmentTakePage } from '@/pages/learning/AssessmentTakePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SignInPage } from '@/pages/auth/SignInPage';
import { SignUpStartPage } from '@/pages/auth/SignUpStartPage';
import { CompleteDataPage } from '@/pages/auth/CompleteDataPage';
import { CheckEmailPage } from '@/pages/auth/CheckEmailPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { ResetSuccessPage } from '@/pages/auth/ResetSuccessPage';
import { VerifyPhonePage } from '@/pages/auth/VerifyPhonePage';
import { AccountPage } from '@/pages/account/AccountPage';
import { ContactsPage } from '@/pages/contacts/ContactsPage';
import { AssessmentsAdminPage } from '@/pages/instructor/AssessmentsAdminPage';
import { GoogleCallbackPage } from '@/pages/auth/GoogleCallbackPage';
import { Spinner } from '@/components/ui/Spinner';
import { RedirectIfAuthed, RequireAuth } from './guards';

// Lazy-load the lesson player so hls.js is only fetched when a learner opens a video.
const LessonPlayerPage = lazy(() =>
  import('@/pages/learning/LessonPlayerPage').then((m) => ({
    default: m.LessonPlayerPage,
  })),
);

function withSuspense(node: React.ReactNode) {
  return (
    <Suspense
      fallback={
        <div className="grid place-items-center py-24">
          <Spinner size="lg" />
        </div>
      }
    >
      {node}
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // Public auth-flow pages — bounce away if already signed in.
  {
    element: <RedirectIfAuthed />,
    children: [
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/sign-up', element: <SignUpStartPage /> },
      { path: '/sign-up/details', element: <CompleteDataPage /> },
      { path: '/login', element: <Navigate to="/sign-in" replace /> },
    ],
  },

  // Always-public pages.
  { path: '/sign-up/check-email', element: <CheckEmailPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  { path: '/reset-password/success', element: <ResetSuccessPage /> },
  // OAuth handoff — must be always-public because the user arrives
  // unauthenticated and this page is the one that completes sign-in.
  { path: '/auth/google/callback', element: <GoogleCallbackPage /> },

  // Full-screen authed pages (no dashboard shell).
  // /verify-phone must live here — RequireAuth lets it through specifically
  // so the user can clear the phone-verify gate (FRONTEND.md §2).
  {
    element: <RequireAuth />,
    children: [
      { path: '/verify-phone', element: <VerifyPhonePage /> },
      { path: '/courses/:slug/assessments/:assessmentId/take', element: <AssessmentTakePage /> },
    ],
  },

  // Authenticated app surface.
  {
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardShell />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/explore', element: <ExplorePage /> },
          { path: '/explore/search', element: <SearchResultsPage /> },
          { path: '/courses/:slug', element: <CourseDetailPage /> },
          { path: '/courses/:slug/checkout', element: <CheckoutPage /> },
          { path: '/courses/:slug/checkout/success', element: <CheckoutSuccessPage /> },
          { path: '/courses/:slug/learn', element: <CourseLearnPage /> },
          { path: '/courses/:slug/lessons/:lessonId', element: withSuspense(<LessonPlayerPage />) },
          { path: '/courses/:slug/assessments/:assessmentId', element: <AssessmentOverviewPage /> },
          { path: '/instructor/courses/:slug/assessments', element: <AssessmentsAdminPage /> },
          { path: '/learning-path', element: <MyLearningsPage /> },
          { path: '/account', element: <AccountPage /> },
          { path: '/contacts', element: <ContactsPage /> },
          // Sidebar nav stubs — replace as those pages are designed.
          { path: '/courses', element: <ComingSoon title="Courses" /> },
          { path: '/notifications', element: <ComingSoon title="Notifications" /> },
          { path: '/inbox', element: <ComingSoon title="Inbox" /> },
          { path: '/help', element: <ComingSoon title="Help Center" /> },
        ],
      },
    ],
  },

  { path: '*', element: <NotFoundPage /> },
]);

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="grid place-items-center py-24 text-center">
      <div>
        <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
        <p className="mt-2 text-sm text-ink-500">This page is coming soon.</p>
      </div>
    </div>
  );
}
