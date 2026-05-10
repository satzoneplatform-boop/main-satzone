/**
 * Sign-up wizard state.
 *
 * Step 1 (SignUpStartPage) collects an email and forwards to /sign-up/details.
 * Step 2 (CompleteDataPage) collects name + phone + password, then calls
 * POST /auth/register. The phone number is held in component state until
 * after login + email verification, at which point it is replayed via
 * /auth/phone (FRONTEND.md §2 — phone is set post-login, not at register).
 *
 * Held in sessionStorage so a refresh between steps doesn't lose the email.
 */
const KEY = 'edure.signup_draft';

export interface SignupDraft {
  email: string;
  pendingPhone?: string;
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
