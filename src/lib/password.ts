export interface PasswordChecks {
  uppercase: boolean;
  number: boolean;
  length: boolean;
}

export function evaluatePassword(value: string): PasswordChecks {
  return {
    uppercase: /[A-Z]/.test(value),
    number: /[0-9]/.test(value),
    length: value.length >= 8,
  };
}

export function passwordStrength(checks: PasswordChecks): 0 | 1 | 2 | 3 {
  return (Number(checks.uppercase) + Number(checks.number) + Number(checks.length)) as 0 | 1 | 2 | 3;
}
