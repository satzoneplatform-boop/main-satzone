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
import { LanguageTab } from './LanguageTab';
import { NotificationTab } from './NotificationTab';
import { PaymentsBillingTab } from './PaymentsBillingTab';
import { PersonalDataTab } from './PersonalDataTab';
import { PreferencesTab } from './PreferencesTab';
import { SecurityTab } from './SecurityTab';

const TABS = [
  { value: 'personal', label: 'Personal Data' },
  { value: 'notification', label: 'Notification' },
  { value: 'security', label: 'Security' },
  { value: 'billing', label: 'Payments & Billing' },
  { value: 'language', label: 'Language' },
  { value: 'preferences', label: 'Preferences' },
] as const satisfies readonly TabItem<string>[];

type Tab = (typeof TABS)[number]['value'];

export function AccountPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('personal');
  const [signOutOpen, setSignOutOpen] = useState(false);

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
              onEditPreferences={() => setTab('preferences')}
            />
          </div>

          <section className="rounded-2xl border border-ink-200 bg-white p-6 shadow-[var(--shadow-card)]">
            <Tabs
              items={TABS}
              value={tab}
              onChange={(v) => setTab(v as Tab)}
              variant="underline"
              className="mb-6"
            />
            {tab === 'personal' && <PersonalDataTab />}
            {tab === 'notification' && <NotificationTab />}
            {tab === 'security' && <SecurityTab />}
            {tab === 'billing' && <PaymentsBillingTab />}
            {tab === 'language' && <LanguageTab />}
            {tab === 'preferences' && <PreferencesTab />}
          </section>
        </div>
      </div>

      <SignOutModal open={signOutOpen} onClose={() => setSignOutOpen(false)} />
    </>
  );
}
