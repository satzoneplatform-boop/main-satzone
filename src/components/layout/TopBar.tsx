import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/ui/Avatar';
import {
  BellIcon,
  ChevronDownIcon,
  GiftIcon,
  LogoutIcon,
  SearchIcon,
} from '@/components/icons';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/cn';

interface TopBarProps {
  title: string;
  onSignOut: () => void;
}

export function TopBar({ title, onSignOut }: TopBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  function onSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/explore/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ink-800 bg-ink-900 px-6 text-white">
      <h1 className="text-base font-semibold tracking-tight text-white">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        <form onSubmit={onSearchSubmit} role="search" className="hidden md:block">
          <label
            className={cn(
              'flex h-9 w-72 items-center gap-2 rounded-md border border-ink-800 bg-ink-800/70 px-3 text-sm text-ink-400',
              'focus-within:border-ink-700 focus-within:bg-ink-800',
            )}
          >
            <SearchIcon className="size-4" />
            <input
              type="search"
              name="q"
              placeholder="Search class or category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-white placeholder:text-ink-500 focus:outline-none"
            />
          </label>
        </form>

        <IconButton to="/inbox" label="Rewards">
          <GiftIcon />
        </IconButton>

        <IconButton to="/notifications" label="Notifications" hasUnread>
          <BellIcon />
        </IconButton>

        <AccountMenu onSignOut={onSignOut} userName={user?.full_name} userAvatar={user?.avatar_url} />
      </div>
    </header>
  );
}

function IconButton({
  to,
  label,
  children,
  hasUnread,
}: {
  to: string;
  label: string;
  children: React.ReactNode;
  hasUnread?: boolean;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="relative grid size-9 place-items-center rounded-md border border-ink-800 bg-ink-800/70 text-ink-300 transition-colors hover:bg-ink-800 hover:text-white"
    >
      {children}
      {hasUnread && (
        <span className="absolute right-2 top-2 size-1.5 rounded-full bg-danger-500 ring-2 ring-ink-900" />
      )}
    </Link>
  );
}

function AccountMenu({
  onSignOut,
  userName,
  userAvatar,
}: {
  onSignOut: () => void;
  userName?: string;
  userAvatar?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click and on Escape.
  useEffect(() => {
    if (!open) return;
    function onDocDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const firstName = userName?.split(' ')[0] ?? 'You';

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex h-9 items-center gap-2 rounded-md border border-ink-800 bg-ink-800/70 py-1 pl-1 pr-2 text-left transition-colors',
          'hover:bg-ink-800',
        )}
      >
        <Avatar shape="square" name={userName} src={userAvatar} size={28} />
        <span className="hidden text-sm font-medium text-white md:inline">
          {firstName}
        </span>
        <ChevronDownIcon className="text-ink-400" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 overflow-hidden rounded-lg border border-ink-200 bg-white text-ink-900 shadow-lg"
        >
          <Link
            to="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 border-b border-ink-100 px-3 py-3 hover:bg-ink-50"
          >
            <Avatar shape="square" name={userName} src={userAvatar} size={36} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{userName ?? 'You'}</p>
              <p className="truncate text-xs text-ink-500">View profile</p>
            </div>
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-danger-600 hover:bg-danger-50"
          >
            <LogoutIcon />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}
