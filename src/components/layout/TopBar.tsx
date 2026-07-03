import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Avatar } from '@/components/ui/Avatar';
import {
  ChevronDownIcon,
  LogoutIcon,
  SearchIcon,
} from '@/components/icons';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/i18n/I18nProvider';
import { cn } from '@/lib/cn';
import { LanguageDropdown } from './LanguageDropdown';

interface TopBarProps {
  title: string;
  onSignOut: () => void;
}

export function TopBar({ title, onSignOut }: TopBarProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [search, setSearch] = useState('');

  function onSearchSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/explore/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-ink-800 bg-ink-900 px-4 text-white sm:px-6 lg:px-8">
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
              placeholder={t('topbar.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-white placeholder:text-ink-500 focus:outline-none"
            />
          </label>
        </form>

        <LanguageDropdown variant="dark" />

        <AccountMenu onSignOut={onSignOut} userName={user?.full_name} userAvatar={user?.avatar_url} />
      </div>
    </header>
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
  const { t } = useI18n();
  const reduce = useReducedMotion();
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

  const firstName = userName?.split(' ')[0] ?? t('common.you');

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'relative flex h-9 items-center gap-2 rounded-md border border-ink-800 bg-ink-800/70 py-1 pl-1 pr-2 text-left transition-colors duration-150',
          // Invisible expanded hit area — keeps the touch target ≥44px on mobile.
          "after:absolute after:-inset-1.5 after:content-['']",
          'hover:bg-ink-800',
        )}
      >
        <Avatar shape="square" name={userName} src={userAvatar} size={28} />
        <span className="hidden text-sm font-medium text-white md:inline">
          {firstName}
        </span>
        <ChevronDownIcon className="text-ink-400" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 overflow-hidden rounded-xl border border-ink-200 bg-white text-ink-900 shadow-[var(--shadow-dropdown)]"
          >
            <Link
              to="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 border-b border-ink-100 px-3 py-3 transition-colors duration-150 hover:bg-ink-50"
            >
              <Avatar shape="square" name={userName} src={userAvatar} size={36} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{userName ?? t('common.you')}</p>
                <p className="truncate text-xs text-ink-500">{t('topbar.viewProfile')}</p>
              </div>
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="flex min-h-11 w-full items-center gap-3 px-3 py-2.5 text-left text-sm text-danger-600 transition-colors duration-150 hover:bg-danger-50"
            >
              <LogoutIcon />
              <span>{t('topbar.signOut')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
