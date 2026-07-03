import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogoMark } from '@/components/brand/Logo';
import { AuthSplitLayout } from '@/components/layout/AuthSplitLayout';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { Input } from '@/components/ui/Input';
import { GoogleIcon } from '@/components/icons';
import { signupStore } from '@/features/auth/signupStore';
import { googleSignInUrl } from '@/features/auth/hooks';
import { useT } from '@/i18n/I18nProvider';

export function SignUpStartPage() {
  const navigate = useNavigate();
  const t = useT();
  const [email, setEmail] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    signupStore.set({ email });
    navigate('/sign-up/details');
  }

  return (
    <AuthSplitLayout
      footer={
        <p>
          {t('auth.signUp.termsPrefix')}{' '}
          <a href="#" className="underline">{t('auth.signUp.terms')}</a>{' '}
          {t('auth.signUp.and')}{' '}
          <a href="#" className="underline">{t('auth.signUp.privacy')}</a>.
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={40} />
          <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-ink-900">
            {t('auth.signUp.title')}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            {t('auth.signUp.subtitle')}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          fullWidth
          leftIcon={<GoogleIcon />}
          onClick={() => {
            window.location.href = googleSignInUrl();
          }}
        >
          {t('auth.signUp.continueWithGoogle')}
        </Button>

        <Divider label={t('auth.signUp.orWithEmail')} />

        <Input
          label={t('auth.signIn.email')}
          type="email"
          autoComplete="email"
          required
          placeholder={t('auth.signIn.emailPlaceholder')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" fullWidth size="lg" disabled={!email}>
          {t('auth.signUp.continue')}
        </Button>

        <p className="text-center text-sm text-ink-500">
          {t('auth.signUp.haveAccount')}{' '}
          <Link to="/sign-in" className="font-medium text-brand-600 hover:underline">
            {t('auth.common.signIn')}
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
