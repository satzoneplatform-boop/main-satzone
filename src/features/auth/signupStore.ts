/**
 * Sign-up wizard state.
 *
 * Step 1 (SignUpStartPage) collects an email and forwards to
 * /sign-up/details. Step 2 (CompleteDataPage) collects name + password
 * and calls POST /auth/register. Phone is NOT collected here — it's set
 * later via the Telegram bot OTP flow on /auth/verify-phone.
 *
 * Held in sessionStorage so a refresh between steps doesn't lose the email.
 */
const KEY = 'edure.signup_draft';

export interface SignupDraft {
  email: string;
}

export const signupStore = {
  get(): SignupDraft | null {
    if (typeof window === 'undefined') return null;
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SignupDraft;
    } catch {
      return null;
    }
  },
  set(draft: SignupDraft) {
    sessionStorage.setItem(KEY, JSON.stringify(draft));
  },
  clear() {
    sessionStorage.removeItem(KEY);
  },
};
