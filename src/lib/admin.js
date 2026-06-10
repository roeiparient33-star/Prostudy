// Admin access — only these emails see the "חמ"ל" page.
// The DB function admin_get_stats() enforces the same check server-side.
const ADMIN_EMAILS = ['roeiparient33@gmail.com'];

export function isAdmin(user) {
  return !!user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
}
