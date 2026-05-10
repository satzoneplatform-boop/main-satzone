import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CloseIcon, CreditCardIcon, DownloadIcon } from '@/components/icons';

/**
 * Payments & Billing tab (Figma 14137:29535).
 *
 * Backend currently has no /me/payment-methods or /me/payments endpoint
 * documented in FRONTEND.md, so this tab renders the UI surface with
 * placeholder data until those land. Replace the constants with TanStack
 * queries against the new endpoints once shipped.
 */
const PAYMENTS = [
  {
    id: 'ICE-0125',
    name: 'Best strategic business thinking for modern professionals',
    type: 'Course',
    amount: 28.0,
    status: 'Paid',
  },
  {
    id: 'ICE-0124',
    name: 'The best tips for become a digital marketing',
    type: 'Course',
    amount: 22.0,
    status: 'Paid',
  },
  {
    id: 'ICE-0123',
    name: 'Business Analytics for Strategic',
    type: 'Course',
    amount: 35.0,
    status: 'Paid',
  },
  {
    id: 'ICE-0122',
    name: 'Digital Strategy & Competitive Advantage',
    type: 'Course',
    amount: 30.0,
    status: 'Paid',
  },
];

export function PaymentsBillingTab() {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-base font-semibold text-ink-900">Payments &amp; Billing</h2>
      </header>

      <section className="rounded-2xl border border-ink-200 bg-white p-5 shadow-[var(--shadow-card)]">
        <h3 className="text-sm font-semibold text-ink-900">Payment method</h3>
        <ul className="mt-4 space-y-3">
          <li className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3">
            <span className="grid h-9 w-12 place-items-center rounded-md bg-ink-900 text-[10px] font-bold uppercase tracking-wider text-white">
              VISA
            </span>
            <span className="flex-1 text-sm">
              <span className="font-semibold text-ink-900">Hendrick Finn</span>{' '}
              <span className="text-ink-500">**** **** **** 1234</span>
            </span>
            <button
              type="button"
              aria-label="Edit card"
              className="grid size-8 place-items-center rounded-md text-ink-500 hover:bg-ink-50"
            >
              <CreditCardIcon className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Remove card"
              className="grid size-8 place-items-center rounded-md text-ink-500 hover:bg-ink-50"
            >
              <CloseIcon />
            </button>
          </li>
        </ul>
        <Button variant="outline" className="mt-4" leftIcon={<CreditCardIcon />}>
          Add credit card
        </Button>
      </section>

      <section className="rounded-2xl border border-ink-200 bg-white shadow-[var(--shadow-card)]">
        <header className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h3 className="text-sm font-semibold text-ink-900">Payment history</h3>
          <Button variant="ghost" size="sm" leftIcon={<DownloadIcon />}>
            Export
          </Button>
        </header>
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-ink-500">
            <tr className="border-b border-ink-100">
              <th className="px-5 py-3 text-left font-medium">Payment ID</th>
              <th className="px-5 py-3 text-left font-medium">Name</th>
              <th className="px-5 py-3 text-left font-medium">Type</th>
              <th className="px-5 py-3 text-right font-medium">Amount</th>
              <th className="px-5 py-3 text-right font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {PAYMENTS.map((p) => (
              <tr key={p.id} className="border-b border-ink-100 last:border-b-0">
                <td className="px-5 py-3 font-medium text-ink-900">{p.id}</td>
                <td className="px-5 py-3 text-ink-600">{p.name}</td>
                <td className="px-5 py-3 text-ink-600">{p.type}</td>
                <td className="px-5 py-3 text-right font-medium text-ink-900">
                  ${p.amount.toFixed(2)}
                </td>
                <td className="px-5 py-3 text-right">
                  <Badge tone="success">{p.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
