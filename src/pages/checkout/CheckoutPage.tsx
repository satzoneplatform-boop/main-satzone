import { useState, type FormEvent } from 'react';
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

type Method = 'card' | 'paypal';

const COUNTRIES = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'UZ', label: 'Uzbekistan' },
];

export function CheckoutPage() {
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
        <p className="text-sm text-ink-500">This course is unavailable.</p>
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
          { label: 'Explore', to: '/explore' },
          { label: 'Search results', to: '/explore/search' },
          { label: 'Detail course', to: `/courses/${slug}` },
          { label: 'Payment' },
        ]}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <form onSubmit={onCheckout} className="space-y-6">
          <header>
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              Checkout payment
            </h1>
            <p className="mt-1 text-sm text-ink-500">
              Please complete and finish the payment and enjoy the course.
            </p>
          </header>

          <section>
            <h2 className="text-sm font-semibold text-ink-900">Choose method</h2>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <MethodPickerCard
                name="method"
                value="card"
                selected={method === 'card'}
                onSelect={() => setMethod('card')}
                icon={<CreditCardIcon />}
                title="Credit card"
                subtitle="Visa/Mastercard"
              />
              <MethodPickerCard
                name="method"
                value="paypal"
                selected={method === 'paypal'}
                onSelect={() => setMethod('paypal')}
                icon={<PaypalIcon />}
                title="PayPal"
                subtitle="E-Wallet payment"
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
          {enroll.error.message || 'We could not start your free trial.'}
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
  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold text-ink-900">Payment</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Card number" placeholder="Enter number" inputMode="numeric" />
          <Input label="Card name" placeholder="Name as shown on your card" />
          <Input label="Expired date" placeholder="MM/YY" inputMode="numeric" />
          <Input label="CVV" placeholder="Enter code" inputMode="numeric" maxLength={4} />
        </div>

        {showCardNote && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-ink-200 bg-ink-50 p-3 text-sm text-ink-700">
            <InfoIcon className="mt-0.5 shrink-0 text-ink-500" />
            <p className="flex-1">
              By providing your card information, you allow Edura, Inc. to charge your card for
              future payments in accordance with their terms.
            </p>
            <button
              type="button"
              onClick={onCloseNote}
              aria-label="Dismiss"
              className="text-ink-400 hover:text-ink-700"
            >
              <CloseIcon />
            </button>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-semibold text-ink-900">Billing</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First name" placeholder="Enter name" autoComplete="given-name" />
          <Input label="Last name" placeholder="Enter name" autoComplete="family-name" />
          <Select
            label="Country"
            placeholder="Select country"
            options={COUNTRIES}
            defaultValue=""
            autoComplete="country"
          />
          <Input label="City" placeholder="Select city" autoComplete="address-level2" />
          <div className="sm:col-span-2">
            <Textarea
              label="Address"
              placeholder="Enter your full address"
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
  return (
    <section className="rounded-2xl border border-ink-200 bg-white py-16 text-center shadow-[var(--shadow-card)]">
      <PaypalIcon className="mx-auto size-10" />
      <h3 className="mt-4 text-base font-semibold text-ink-900">Finish payment with PayPal</h3>
      <p className="mt-2 px-8 text-sm text-ink-500">
        You’ll be prompted for your PayPal account email and password through a secure PayPal
        login form.
      </p>
      <p className="mx-auto mt-6 inline-flex max-w-sm items-start gap-2 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-left text-xs text-ink-600">
        <InfoIcon className="mt-0.5 size-4 shrink-0 text-ink-500" />
        Your 7-day free trial starts today. PayPal will only be charged after the trial ends.
      </p>
    </section>
  );
}
