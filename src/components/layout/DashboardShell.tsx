import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { SignOutModal } from '@/pages/dashboard/SignOutModal';
import { useT } from '@/i18n/I18nProvider';
import type { TranslationKey } from '@/i18n/en';

const TITLE_BY_PATH: Array<{ match: RegExp; titleKey: TranslationKey }> = [
  { match: /^\/dashboard/, titleKey: 'page.dashboard' },
  { match: /^\/explore\/search/, titleKey: 'page.explore' },
  { match: /^\/explore/, titleKey: 'page.explore' },
  { match: /^\/courses\/[^/]+\/lessons\//, titleKey: 'page.myLearnings' },
  { match: /^\/courses\/[^/]+\/assessments\//, titleKey: 'page.myLearnings' },
  { match: /^\/courses\/[^/]+\/learn/, titleKey: 'page.myLearnings' },
  { match: /^\/courses\/[^/]+\/checkout\/success/, titleKey: 'page.explore' },
  { match: /^\/courses\/[^/]+\/checkout/, titleKey: 'page.explore' },
  { match: /^\/courses\/[^/]+/, titleKey: 'page.explore' },
  { match: /^\/courses/, titleKey: 'page.courses' },
  { match: /^\/learning-path/, titleKey: 'page.myLearnings' },
  { match: /^\/notifications/, titleKey: 'page.notifications' },
  { match: /^\/inbox/, titleKey: 'page.inbox' },
  { match: /^\/help/, titleKey: 'page.help' },
  { match: /^\/account/, titleKey: 'page.account' },
  { match: /^\/contacts/, titleKey: 'page.contacts' },
];

export function DashboardShell() {
  const location = useLocation();
  const t = useT();
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const titleKey =
    TITLE_BY_PATH.find((r) => r.match.test(location.pathname))?.titleKey ??
    'page.dashboard';
  const title = t(titleKey);

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
