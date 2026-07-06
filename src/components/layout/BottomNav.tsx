import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  BookIcon,
  FlagIcon,
  GridIcon,
  HomeIcon,
} from '@/components/icons';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/features/auth/AuthProvider';
import { useT } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';

/**
 * Mobile bottom-tab navigation. Visible only below the `lg` breakpoint
 * (≥1024 px the Sidebar takes over). Sits fixed at the bottom of the
 * viewport with safe-area padding so it clears the home indicator on
 * iOS. The DashboardShell adds `pb-…` on its <main> to compensate.
 */
export function BottomNav() {
  const t = useT();
  const { user } = useAuth();

  return (
    <nav
      aria-label={t('nav.mainMenu')}
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-ink-200 bg-white lg:hidden',
        // iOS safe-area inset for the home bar.
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      <ul className="grid grid-cols-5">
        <Tab to="/dashboard" label={t('nav.dashboard')} icon={<HomeIcon />} end />
        <Tab to="/explore" label={t('nav.explore')} icon={<GridIcon />} />
        <Tab to="/learning-path" label={t('nav.myLearnings')} icon={<BookIcon />} />
        <Tab to="/quizzes" label={t('nav.quizzes')} icon={<FlagIcon />} />
        <AccountTab user={user} />
      </ul>
    </nav>
  );
}

const TAB_CLASS = (isActive: boolean) =>
  cn(
    // min-h-14 keeps every tab a comfortable ≥44px touch target.
    'relative flex min-h-14 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors duration-150',
    isActive ? 'text-brand-600' : 'text-ink-500 hover:text-ink-900',
  );

/** Small dot that slides between tabs to mark the active route. */
function ActiveDot() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      layoutId="bottomnav-active-dot"
      transition={
        reduce ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 32 }
      }
      className="absolute inset-x-0 top-1 mx-auto size-1 rounded-full bg-brand-600"
      aria-hidden
    />
  );
}

function Tab({
  to,
  label,
  icon,
  end,
}: {
  to: string;
  label: string;
  icon: React.ReactNode;
  end?: boolean;
}) {
  return (
    <li>
      <NavLink to={to} end={end} className={({ isActive }) => TAB_CLASS(isActive)}>
        {({ isActive }) => (
          <>
            {isActive && <ActiveDot />}
            <span className="grid size-6 place-items-center">{icon}</span>
            <span className="max-w-full truncate px-1">{label}</span>
          </>
        )}
      </NavLink>
    </li>
  );
}

function AccountTab({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
  const t = useT();
  return (
    <li>
      <NavLink to="/account" className={({ isActive }) => TAB_CLASS(isActive)}>
        {({ isActive }) => (
          <>
            {isActive && <ActiveDot />}
            <Avatar
              shape="square"
              name={user?.full_name}
              src={user?.avatar_url}
              size={22}
            />
            <span className="max-w-full truncate px-1">
              {user?.full_name?.split(' ')[0] ?? t('common.you')}
            </span>
          </>
        )}
      </NavLink>
    </li>
  );
}
