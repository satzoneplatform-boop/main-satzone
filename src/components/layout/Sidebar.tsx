import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Logo, LogoMark } from '@/components/brand/Logo';
import {
  BookIcon,
  GridIcon,
  HelpIcon,
  HomeIcon,
  PanelLeftIcon,
  SearchIcon,
} from '@/components/icons';
import { cn } from '@/lib/cn';
import { useHomeFeed } from '@/features/home/hooks';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

interface NavItemConfig {
  to: string;
  label: string;
  icon: typeof HomeIcon;
  badge?: number;
}

/**
 * Authed app sidebar — matches the Explore / Search Results layout in Figma:
 *  - Brand wordmark + collapse toggle
 *  - Search box with ⌘K hint
 *  - MAIN MENU group
 *  - LATEST LEARNINGS group (continue-learning history)
 *  - Help Center footer
 */
export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const [search, setSearch] = useState('');
  const home = useHomeFeed();

  // Show 4 most recent in-progress courses (FRONTEND.md §4.4 — `continue_learning`).
  const recent = (home.data?.continue_learning ?? []).slice(0, 4);

  const main: NavItemConfig[] = [
    { to: '/', label: 'Dashboard', icon: HomeIcon },
    { to: '/explore', label: 'Explore', icon: GridIcon, badge: 2 },
    { to: '/learning-path', label: 'My learnings', icon: BookIcon },
  ];

  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col bg-ink-900 py-4 text-ink-300 transition-[width] duration-200',
        collapsed ? 'w-[72px] px-2' : 'w-[260px] px-3',
      )}
    >
      <div
        className={cn(
          'flex items-center pb-4',
          collapsed ? 'flex-col gap-3 px-0' : 'justify-between px-2',
        )}
      >
        {collapsed ? (
          <LogoMark size={26} />
        ) : (
          <Logo withWordmark size={26} className="[&>span]:text-white" />
        )}
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="grid size-8 place-items-center rounded-md text-ink-500 hover:bg-ink-800 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
        >
          <PanelLeftIcon />
        </button>
      </div>

      {!collapsed && (
        <div className="px-2 pb-3">
          <label
            className={cn(
              'flex h-9 items-center gap-2 rounded-lg border border-ink-800 bg-ink-800 px-3 text-sm text-ink-400',
              'focus-within:border-ink-700',
            )}
          >
            <SearchIcon className="size-4" />
            <input
              type="search"
              placeholder="Search.."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-white placeholder:text-ink-500 focus:outline-none"
            />
            <kbd className="rounded border border-ink-700 px-1 text-[10px] uppercase tracking-wide text-ink-500">
              ⌘K
            </kbd>
          </label>
        </div>
      )}

      <nav className="flex-1 space-y-6 overflow-y-auto pr-1 pt-2">
        <NavGroup title="Main Menu" collapsed={collapsed}>
          {main.map((item) => (
            <NavRow key={item.to} item={item} collapsed={collapsed} />
          ))}
        </NavGroup>

        {recent.length > 0 && !collapsed && (
          <NavGroup title="Latest Learnings" collapsed={collapsed}>
            {recent.map((e) => (
              <NavLink
                key={e.id}
                to={`/courses/${e.course.slug}`}
                className="flex h-9 items-center gap-3 rounded-lg px-3 text-sm text-ink-400 hover:bg-ink-800 hover:text-white"
              >
                <RecentBadge progress={e.progress_percent} />
                <span className="truncate">{e.course.title}</span>
              </NavLink>
            ))}
          </NavGroup>
        )}
      </nav>

      <div className="space-y-1 border-t border-ink-800 pt-3">
        <NavRow
          item={{ to: '/help', label: 'Help Center', icon: HelpIcon }}
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  children,
  collapsed,
}: {
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
}) {
  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

function NavRow({ item, collapsed }: { item: NavItemConfig; collapsed: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center rounded-lg text-sm font-medium transition-colors',
          collapsed ? 'justify-center px-0' : 'gap-3 px-3',
          isActive
            ? 'bg-brand-600 text-white shadow-[0_1px_0_0_rgba(2,6,24,0.3)]'
            : 'text-ink-400 hover:bg-ink-800 hover:text-white',
        )
      }
    >
      <item.icon />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {!collapsed && item.badge ? (
        <span className="ml-auto grid size-5 place-items-center rounded-full bg-white text-[10px] font-semibold text-ink-900">
          {item.badge}
        </span>
      ) : null}
    </NavLink>
  );
}

function RecentBadge({ progress }: { progress: number }) {
  // Tiny circular progress dot.
  const r = 7;
  const c = 2 * Math.PI * r;
  const filled = c * (Math.min(100, Math.max(0, progress)) / 100);
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden>
      <circle cx="9" cy="9" r={r} fill="none" stroke="#314158" strokeWidth="2" />
      <circle
        cx="9"
        cy="9"
        r={r}
        fill="none"
        stroke="#46ECD5"
        strokeWidth="2"
        strokeDasharray={`${filled} ${c - filled}`}
        strokeLinecap="round"
        transform="rotate(-90 9 9)"
      />
    </svg>
  );
}
