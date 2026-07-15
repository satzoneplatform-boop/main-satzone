import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { transitions } from '@/components/motion/variants';
import { MarketingPanel } from '@/components/auth/marketing';
import { LanguageDropdown } from './LanguageDropdown';

interface AuthSplitLayoutProps {
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Split-panel layout used by Sign Up / Sign In screens.
 *
 * Left: the animated navy <MarketingPanel> (brand pattern, rotating slogan,
 * instructor social proof, testimonial carousel). Right: the form column,
 * which fades in.
 *
 * Sized for laptops (≥1280 px). On smaller widths the brand panel collapses.
 */
export function AuthSplitLayout({ children, footer }: AuthSplitLayoutProps) {
  const reduce = useReducedMotion();

  return (
    <div className="grid min-h-screen grid-cols-1 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_minmax(560px,1fr)] lg:p-6">
      <div className="hidden lg:block">
        <MarketingPanel />
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex justify-end px-4 pt-4 lg:px-8">
          <LanguageDropdown variant="light" />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 py-10 lg:px-12">
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transitions.base, delay: 0.1 }}
            className="w-full max-w-[400px]"
          >
            {children}
          </motion.div>
        </div>
        {footer && (
          <div className="mx-auto w-full max-w-[400px] px-6 pb-6 text-center text-xs leading-relaxed text-ink-500">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
