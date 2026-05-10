import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';

interface AuthCenteredLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  headerSlot?: ReactNode;
}

/**
 * Centered-card layout used by:
 *  - "Complete data" wizard step
 *  - Reset password form
 *  - Reset success card
 *
 * Header has the IdrokHub wordmark + locale switcher (slot).
 * Footer has © + legal links.
 */
export function AuthCenteredLayout({
  children,
  showHeader = true,
  showFooter = true,
  headerSlot,
}: AuthCenteredLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50">
      {showHeader && (
        <header className="flex h-[72px] items-center justify-between border-b border-ink-200 bg-white px-8">
          <Logo withWordmark size={32} />
          {headerSlot}
        </header>
      )}

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        {children}
      </main>

      {showFooter && (
        <footer className="flex items-center justify-between border-t border-transparent px-8 py-5 text-sm text-ink-500">
          <span>@2025 edura</span>
          <div className="flex items-center gap-6">
            <a href="#" className="underline-offset-2 hover:underline">Privacy Policy</a>
            <a href="#" className="underline-offset-2 hover:underline">Terms of Services</a>
          </div>
        </footer>
      )}
    </div>
  );
}
