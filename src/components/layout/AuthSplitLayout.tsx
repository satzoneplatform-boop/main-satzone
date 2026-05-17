import type { ReactNode } from 'react';
import authIllustration from '@/assets/auth-illustration.png';
import { LogoMark } from '@/components/brand/Logo';
import { LanguageDropdown } from './LanguageDropdown';

interface AuthSplitLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Split-panel layout used by Sign Up / Sign In screens.
 * Left: brand illustration on a violet field. Right: form column.
 *
 * Sized for laptops (≥1280 px). On smaller widths the illustration collapses.
 */
export function AuthSplitLayout({ children, footer }: AuthSplitLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_minmax(560px,1fr)] lg:p-6">
      <div className="hidden lg:block">
        <div className="relative h-full overflow-hidden rounded-2xl bg-auth-bg">
          <img
            src={authIllustration}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center"
            draggable={false}
          />
        </div>
      </div>

      <div className="flex flex-col">
        <div className="flex justify-end px-4 pt-4 lg:px-8">
          <LanguageDropdown variant="light" />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 lg:px-12">
          <div className="w-full max-w-[400px]">
            <div className="mb-6 flex justify-center lg:hidden">
              <LogoMark size={40} />
            </div>
            {children}
          </div>
        </div>
        {footer && (
          <div className="px-6 pb-6 text-center text-xs text-ink-500">{footer}</div>
        )}
      </div>
    </div>
  );
}
