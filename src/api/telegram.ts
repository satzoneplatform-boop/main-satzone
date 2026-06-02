import { api } from './client';

/**
 * Telegram-bot phone verification endpoints (see satzone
 * `app/api/v1/telegram.py`).
 *
 * Flow:
 *   1. init() → { state, link_url, expires_at }
 *   2. user opens link_url, taps Start in the bot
 *   3. poll status(state) every ~2 s until { verified: true }
 *   4. caller refreshes /auth/me — `is_phone_verified` is now true
 */

export interface TelegramInitResponse {
  state: string;
  link_url: string;
  expires_at: string;
}

export interface TelegramStatusResponse {
  state: string;
  verified: boolean;
  expired: boolean;
  verified_at: string | null;
}

export const telegramApi = {
  init() {
    return api.post<TelegramInitResponse>('/auth/telegram/init');
  },
  status(state: string) {
    return api.get<TelegramStatusResponse>('/auth/telegram/status', {
      params: { state },
    });
  },
};
