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

export function SignUpStartPage() {
  const navigate = useNavigate();
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
          By clicking ‘Continue’ you agree to the{' '}
          <a href="#" className="underline">Terms of Services</a> and{' '}
          <a href="#" className="underline">Privacy Policy</a>.
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex flex-col items-center text-center">
          <LogoMark size={40} />
          <h1 className="mt-5 text-[28px] font-semibold tracking-tight text-ink-900">
            Let’s get started
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Create your free Edura account to sign in or
            <br />
            you already has an account
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
          Sign up with Google
        </Button>

        <Divider label="Or sign up with email" />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          required
          placeholder="Ex: hendrick.fin@gmail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button type="submit" fullWidth size="lg" disabled={!email}>
          Continue
        </Button>

        <p className="text-center text-sm text-ink-500">
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
