/**
 * Decorative banner shown at the top of the Account & Settings page.
 * Matches the navy + shield/acorn pattern treatment used across the app
 * (dashboard greeting, analytics hero) — all colors come from theme tokens.
 */
export function AccountHero() {
  return (
    <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-navy-900">
      <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-brand-500/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-teal-400/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-navy-950/40 to-transparent" />
    </div>
  );
}
