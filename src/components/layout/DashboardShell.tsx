import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SignOutModal } from '@/pages/dashboard/SignOutModal';

const TITLE_BY_PATH: Array<{ match: RegExp; title: string }> = [
  { match: /^\/$/, title: 'Dashboard' },
  { match: /^\/explore\/search/, title: 'Explore' },
  { match: /^\/explore/, title: 'Explore' },
  { match: /^\/courses\/[^/]+\/lessons\//, title: 'My learnings' },
  { match: /^\/courses\/[^/]+\/assessments\//, title: 'My learnings' },
  { match: /^\/courses\/[^/]+\/learn/, title: 'My learnings' },
  { match: /^\/courses\/[^/]+\/checkout\/success/, title: 'Explore' },
  { match: /^\/courses\/[^/]+\/checkout/, title: 'Explore' },
  { match: /^\/courses\/[^/]+/, title: 'Explore' },
  { match: /^\/courses/, title: 'Courses' },
  { match: /^\/learning-path/, title: 'My learnings' },
  { match: /^\/notifications/, title: 'Notifications' },
  { match: /^\/inbox/, title: 'Inbox' },
  { match: /^\/help/, title: 'Help Center' },
  { match: /^\/account/, title: 'Account & Settings' },
];

export function DashboardShell() {
  const location = useLocation();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const title =
    TITLE_BY_PATH.find((t) => t.match.test(location.pathname))?.title ?? 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title={title} onSignOut={() => setSignOutOpen(true)} />
        <main className="flex-1 overflow-auto px-8 py-6">
          <Outlet />
        </main>
      </div>
      <SignOutModal open={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </div>
  );
}
