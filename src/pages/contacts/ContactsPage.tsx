import type { ReactElement, SVGProps } from 'react';
import { MailIcon, PhoneIcon, ArrowRightIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';

const TELEGRAM_HANDLE = 'idrokhub';
const PHONE_DISPLAY = '+998 71 200 00 00';
const PHONE_HREF = '+998712000000';
const EMAIL = 'support@idrokhub.uz';

export function ContactsPage() {
  const t = useT();

  const channels: ChannelCardProps[] = [
    {
      tone: 'sky',
      Icon: TelegramIcon,
      label: t('contacts.telegram'),
      value: `@${TELEGRAM_HANDLE}`,
      href: `https://t.me/${TELEGRAM_HANDLE}`,
      cta: t('contacts.openTelegram'),
      external: true,
    },
    {
      tone: 'brand',
      Icon: PhoneIcon,
      label: t('contacts.phone'),
      value: PHONE_DISPLAY,
      href: `tel:${PHONE_HREF}`,
      cta: t('contacts.callUs'),
    },
    {
      tone: 'teal',
      Icon: MailIcon,
      label: t('contacts.email'),
      value: EMAIL,
      href: `mailto:${EMAIL}`,
      cta: t('contacts.sendEmail'),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-ink-900">{t('contacts.title')}</h1>
        <p className="max-w-xl text-sm text-ink-500">{t('contacts.subtitle')}</p>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {channels.map((c) => (
          <ChannelCard key={c.label} {...c} />
        ))}
      </section>
    </div>
  );
}

interface ChannelCardProps {
  tone: 'brand' | 'teal' | 'sky';
  Icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
  label: string;
  value: string;
  href: string;
  cta: string;
  external?: boolean;
}

const TONE_STYLES: Record<ChannelCardProps['tone'], { badge: string; cta: string }> = {
  brand: { badge: 'bg-brand-50 text-brand-600', cta: 'text-brand-600 hover:text-brand-700' },
  teal: { badge: 'bg-teal-25 text-teal-700', cta: 'text-teal-700 hover:text-teal-500' },
  sky: { badge: 'bg-[#E6F4FF] text-[#0284C7]', cta: 'text-[#0284C7] hover:text-[#0369A1]' },
};

function ChannelCard({ tone, Icon, label, value, href, cta, external }: ChannelCardProps) {
  const tones = TONE_STYLES[tone];
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="group flex flex-col gap-4 rounded-2xl border border-ink-200 bg-white p-6 shadow-card transition-colors hover:border-ink-300"
    >
      <span className={`grid size-11 place-items-center rounded-xl ${tones.badge}`}>
        <Icon width={22} height={22} />
      </span>
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">{label}</p>
        <p className="break-all text-base font-medium text-ink-900">{value}</p>
      </div>
      <span
        className={`mt-auto inline-flex items-center gap-1.5 text-sm font-semibold ${tones.cta}`}
      >
        {cta}
        <ArrowRightIcon
          width={16}
          height={16}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </a>
  );
}

function TelegramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden {...props}>
      <path d="M21.7 4.3c-.3-.3-.7-.4-1.1-.3L3.2 10.7c-.5.2-.8.7-.8 1.2 0 .5.3.9.8 1.1l4.1 1.4 1.6 5c.1.4.4.6.8.6.3 0 .6-.1.8-.4l2.2-2.5 4.2 3.1c.2.1.4.2.7.2.1 0 .3 0 .4-.1.4-.1.6-.4.7-.8l3.2-13.9c.1-.4 0-.8-.2-1.1ZM9.6 14.4l-.8 2.6-1-3.2 8.7-5.8-6.9 6.4Z" />
    </svg>
  );
}
