import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Spinner } from '@/components/ui/Spinner';
import { Textarea } from '@/components/ui/Textarea';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { MethodPickerCard } from '@/components/checkout/MethodPickerCard';
import {
  CloseIcon,
  CreditCardIcon,
  InfoIcon,
  PaypalIcon,
} from '@/components/icons';
import { ApiError } from '@/api/errors';
import { enrollmentsApi } from '@/api/enrollments';
import { useCourseDetail } from '@/features/course/hooks';
import type { EnrollmentRead } from '@/types/api';
import { useT } from '@/i18n/I18nProvider';

type Method = 'card' | 'paypal';

export function CheckoutPage() {
  const t = useT();
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const course = useCourseDetail(slug);
  const [method, setMethod] = useState<Method>('paypal');
  const [showCardNote, setShowCardNote] = useState(true);

  const enroll = useMutation<EnrollmentRead, ApiError, void>({
    mutationFn: () => enrollmentsApi.enroll(course.data!.id),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['home'] });
      navigate(`/courses/${slug}/checkout/success`, {
        state: { enrollment: data },
        replace: true,
      });
    },
    onError: (err) => {
      if (err.code === 'phone_not_verified') navigate('/verify-phone');
    },
  });

  if (course.isLoading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (course.error || !course.data) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-sm text-ink-500">{t('checkout.unavailable')}</p>
      </div>
    );
  }

  function onCheckout(e?: FormEvent) {
    e?.preventDefault();
    // Free / trial enroll path. A real paid-plan path needs a payment-intent
    // endpoint that is not yet exposed in FRONTEND.md — wire that in once
    // the backend ships /me/payments or equivalent.
    enroll.mutate();
  }

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: t('course.breadcrumb.explore'), to: '/explore' },
          { label: t('course.breadcrumb.searchResults'), to: '/explore/search' },
          { label: t('course.breadcrumb.detail'), to: `/courses/${slug}` },
          { label: t('course.breadcrumb.payment') },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={onCheckout} className="space-y-6">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              {t('checkout.title')}
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              {t('checkout.subtitle')}
            </p>
          </header>

          <section>
            <h2 className="text-sm font-semibold text-ink-900">{t('checkout.chooseMethod')}</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MethodPickerCard
                name="method"
                value="card"
                selected={method === 'card'}
                onSelect={() => setMethod('card')}
                icon={<CreditCardIcon />}
                title={t('checkout.method.card.title')}
                subtitle={t('checkout.method.card.subtitle')}
              />
              <MethodPickerCard
                name="method"
                value="paypal"
                selected={method === 'paypal'}
                onSelect={() => setMethod('paypal')}
                icon={<PaypalIcon />}
                title={t('checkout.method.paypal.title')}
                subtitle={t('checkout.method.paypal.subtitle')}
              />
            </div>
          </section>

          {method === 'card' ? (
            <CardForm
              showCardNote={showCardNote}
              onCloseNote={() => setShowCardNote(false)}
            />
          ) : (
            <PaypalPanel />
          )}
        </form>

        <CheckoutSummary
          course={course.data}
          loading={enroll.isPending}
          onSubmit={() => onCheckout()}
        />
      </div>

      {enroll.error && enroll.error.code !== 'phone_not_verified' && (
        <div className="rounded-md border border-danger-500/30 bg-red-50 px-3 py-2 text-sm text-danger-600">
          {enroll.error.message || t('checkout.trialError')}
        </div>
      )}
    </div>
  );
}

function CardForm({
  showCardNote,
  onCloseNote,
}: {
  showCardNote: boolean;
  onCloseNote: () => void;
}) {
  const t = useT();
  const COUNTRIES = useMemo(
    () => [
      { value: 'US', label: t('account.personalData.country.US') },
      { value: 'GB', label: t('account.personalData.country.GB') },
      { value: 'DE', label: t('account.personalData.country.DE') },
      { value: 'FR', label: t('account.personalData.country.FR') },
      { value: 'ID', label: t('account.personalData.country.ID') },
      { value: 'UZ', label: t('account.personalData.country.UZ') },
    ],
    [t],
  );
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-ink-900">{t('checkout.payment')}</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('checkout.cardNumber')} placeholder={t('checkout.cardNumberPlaceholder')} inputMode="numeric" />
          <Input label={t('checkout.cardName')} placeholder={t('checkout.cardNamePlaceholder')} />
          <Input label={t('checkout.expiredDate')} placeholder="MM/YY" inputMode="numeric" />
          <Input label={t('checkout.cvv')} placeholder={t('checkout.cvvPlaceholder')} inputMode="numeric" maxLength={4} />
        </div>

        {showCardNote && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
            <InfoIcon className="mt-0.5 shrink-0 text-ink-500" />
            <p className="flex-1">
              {t('checkout.cardNote')}
            </p>
            <button
              type="button"
              onClick={onCloseNote}
              aria-label={t('checkout.dismiss')}
              className="text-ink-400 hover:text-ink-700"
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink-900">{t('checkout.billing')}</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('checkout.firstName')} placeholder={t('checkout.firstNamePlaceholder')} autoComplete="given-name" />
          <Input label={t('checkout.lastName')} placeholder={t('checkout.lastNamePlaceholder')} autoComplete="family-name" />
          <Select
            label={t('checkout.country')}
            placeholder={t('checkout.countryPlaceholder')}
            options={COUNTRIES}
            defaultValue=""
            autoComplete="country"
          />
          <Input label={t('checkout.city')} placeholder={t('checkout.cityPlaceholder')} autoComplete="address-level2" />
          <div className="sm:col-span-2">
            <Textarea
              label={t('checkout.address')}
              placeholder={t('checkout.addressPlaceholder')}
              autoComplete="street-address"
              rows={3}
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function PaypalPanel() {
  const t = useT();
  return (
    <section className="rounded-2xl border border-ink-200 bg-white py-16 text-center shadow-[var(--shadow-card)]">
      <PaypalIcon className="mx-auto size-10" />
      <h3 className="mt-4 text-base font-semibold text-ink-900">{t('checkout.paypal.title')}</h3>
      <p className="mt-2 px-8 text-sm text-ink-500">
        {t('checkout.paypal.body')}
      </p>
      <p className="mx-auto mt-6 inline-flex max-w-sm items-start gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-left text-xs text-ink-600">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-ink-500" />
        {t('checkout.paypal.trialNote')}
      </p>
    </section>
  );
}
