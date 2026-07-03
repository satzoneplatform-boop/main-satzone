import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AccountHero } from '@/components/account/AccountHero';
import { ProfileSidebar } from '@/components/account/ProfileSidebar';
import { Spinner } from '@/components/ui/Spinner';
import { Tabs, type TabItem } from '@/components/ui/Tabs';
import { enrollmentsApi } from '@/api/enrollments';
import { api } from '@/api/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { SignOutModal } from '@/pages/dashboard/SignOutModal';
import type { CertificateRead } from '@/types/api';
import { useT } from '@/i18n/I18nProvider';
import { LanguageTab } from './LanguageTab';
import { NotificationTab } from './NotificationTab';
import { PersonalDataTab } from './PersonalDataTab';
import { PreferencesTab } from './PreferencesTab';
import { SecurityTab } from './SecurityTab';

type Tab = 'personal' | 'notification' | 'preferences' | 'security' | 'language';

export function AccountPage() {
  const { user } = useAuth();
  const t = useT();
  const [tab, setTab] = useState<Tab>('personal');
  const [signOutOpen, setSignOutOpen] = useState(false);

  const tabs: TabItem<Tab>[] = [
    { value: 'personal', label: t('account.tabs.personal') },
    { value: 'notification', label: t('account.tabs.notification') },
    { value: 'preferences', label: t('account.tabs.preferences') },
    { value: 'security', label: t('account.tabs.security') },
    { value: 'language', label: t('account.tabs.language') },
  ];

  const enrollments = useQuery({
    queryKey: ['enrollments', { all: true }],
    queryFn: () => enrollmentsApi.list({ size: 100 }),
    enabled: Boolean(user),
  });

  const certificates = useQuery({
    queryKey: ['me', 'certificates'],
    queryFn: () => api.get<CertificateRead[]>('/me/certificates'),
    enabled: Boolean(user),
  });

  if (!user) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalCourses = enrollments.data?.total ?? 0;
  const studyHours = Math.round(
    (enrollments.data?.items ?? []).reduce(
      (sum, e) => sum + (e.course.duration_minutes * (e.progress_percent / 100)),
      0,
    ) / 60,
  );

  return (
    <>
      <div className="space-y-6">
        <AccountHero />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="relative z-10 -mt-20">
            <ProfileSidebar
              user={user}
              totalCourses={totalCourses}
              studyHours={studyHours}
              certificates={certificates.data?.length ?? 0}
              onSignOut={() => setSignOutOpen(true)}
            />
          </div>

          <section className="min-w-0 rounded-2xl border border-ink-200 bg-white p-4 shadow-[var(--shadow-card)] sm:p-6">
            {/* Horizontal scroll keeps all five tabs reachable at 360px. */}
            <div className="mb-6 overflow-x-auto">
              <Tabs
                items={tabs}
                value={tab}
                onChange={(v) => setTab(v as Tab)}
                variant="underline"
                className="min-w-max whitespace-nowrap"
              />
            </div>
            {tab === 'personal' && <PersonalDataTab />}
            {tab === 'notification' && <NotificationTab />}
            {tab === 'preferences' && <PreferencesTab />}
            {tab === 'security' && <SecurityTab />}
            {tab === 'language' && <LanguageTab />}
          </section>
        </div>
      </div>

      <SignOutModal open={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </>
  );
}
