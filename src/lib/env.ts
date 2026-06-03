export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  /**
   * Telegram bot the phone-verification flow links to. The user taps
   * Start in the bot, shares their phone, and the bot DMs them an OTP
   * to type back on /auth/verify-phone. Set to the full t.me URL,
   * e.g. `https://t.me/SATZoneBot`.
   */
  telegramBotUrl: import.meta.env.VITE_TELEGRAM_BOT_URL ?? '',
} as const;
