import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthProvider';
import { Spinner } from '@/components/ui/Spinner';

function FullPageSpinner() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Spinner size="lg" />
    </div>
  );
}

/** Block child routes unless the user is authenticated. */
export function RequireAuth() {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  // Phone-verify gate: backend returns 403 phone_not_verified on every other
  // authed endpoint. Surface the verify-phone screen up front rather than
  // letting individual pages crash. (FRONTEND.md §2.)
  if (!user.is_phone_verified && !location.pathname.startsWith('/verify-phone')) {
    return <Navigate to="/verify-phone" replace />;
  }
  return <Outlet />;
}

/** Bounce already-authed users away from /login, /register, etc. */
export function RedirectIfAuthed() {
  const { status, user } = useAuth();
  if (status === 'loading') return <FullPageSpinner />;
  if (status === 'authenticated' && user) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
