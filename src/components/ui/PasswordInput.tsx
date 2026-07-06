import { forwardRef, useState } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/icons';
import { useT } from '@/i18n/I18nProvider';
import { Input, type InputProps } from './Input';

export type PasswordInputProps = Omit<InputProps, 'type' | 'rightSlot'>;

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const t = useT();
    const [visible, setVisible] = useState(false);
    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        rightSlot={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="-mr-1 grid size-9 place-items-center rounded-lg text-ink-500 transition-colors duration-150 hover:text-ink-700"
            aria-label={visible ? t('ui.hidePassword') : t('ui.showPassword')}
            tabIndex={-1}
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        }
        {...props}
      />
    );
  },
);
