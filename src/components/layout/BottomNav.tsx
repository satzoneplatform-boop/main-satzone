import { NavLink } from 'react-router-dom';
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
      aria-label="Primary"
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
      <NavLink
        to={to}
        end={end}
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium',
            isActive ? 'text-brand-600' : 'text-ink-500 hover:text-ink-900',
          )
        }
      >
        <span className="grid size-6 place-items-center">{icon}</span>
        <span className="max-w-full truncate px-1">{label}</span>
      </NavLink>
    </li>
  );
}

function AccountTab({ user }: { user: ReturnType<typeof useAuth>['user'] }) {
  return (
    <li>
      <NavLink
        to="/account"
        className={({ isActive }) =>
          cn(
            'flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium',
            isActive ? 'text-brand-600' : 'text-ink-500 hover:text-ink-900',
          )
        }
      >
        <Avatar
          shape="square"
          name={user?.full_name}
          src={user?.avatar_url}
          size={22}
        />
        <span className="max-w-full truncate px-1">
          {user?.full_name?.split(' ')[0] ?? 'You'}
        </span>
      </NavLink>
    </li>
  );
}
