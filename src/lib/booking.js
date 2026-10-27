import { PACKAGES, ADDONS, SEASON, TWO_STORY_PERCENT, UNSET_PRICE_LABEL, API_URL } from '../data/site.js';

/* ---------- price labels ---------- */

export const money = (n) => '$' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 });

export function packagePriceLabel(pkg) {
  return typeof pkg.price === 'number' ? `Starting at ${money(pkg.price)}` : UNSET_PRICE_LABEL;
}

export function addonPriceLabel(addon) {
  if (typeof addon.price !== 'number') return UNSET_PRICE_LABEL;
  if (addon.type === 'percent') return `+${addon.price}% of package`;
  if (addon.type === 'fixed') return `${money(addon.price)}`;
  return `+${money(addon.price)}`;
}

/** Returns a dollar figure when every chosen piece is priced, otherwise the unset label. */
export function estimateLabel({ packageId, stories, addons }) {
  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg || typeof pkg.price !== 'number') return UNSET_PRICE_LABEL;
  let total = pkg.price;
  if (stories === 2) total += pkg.price * (TWO_STORY_PERCENT / 100);
  for (const id of addons || []) {
    const a = ADDONS.find((x) => x.id === id);
    if (!a || typeof a.price !== 'number') return UNSET_PRICE_LABEL;
    total += a.type === 'percent' ? pkg.price * (a.price / 100) : a.price;
  }
  return `From ${money(Math.round(total))}`;
}

/** Shared D1 "vehicle" column carries home details, e.g. "2-Story · Front & Sides · +Wreaths" */
export function homeDetailsString({ packageId, stories, addons }) {
  const pkg = PACKAGES.find((p) => p.id === packageId);
  const parts = [`${stories === 2 ? '2' : '1'}-Story`, pkg ? pkg.name : ''];
  for (const id of addons || []) {
    const a = ADDONS.find((x) => x.id === id);
    if (a) parts.push('+' + a.short);
  }
  return parts.filter(Boolean).join(' · ');
}

/* ---------- Pacific time + season ---------- */

const pad = (n) => String(n).padStart(2, '0');
export const toKey = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

/** Current wall-clock time in California as a UTC timestamp of that wall time. */
export function pacificNowWallMs() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
}

export function pacificToday() {
  const d = new Date(pacificNowWallMs());
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
}

/** Season for the current year, or next year once this year's season has ended. */
export function seasonWindow() {
  const t = pacificToday();
  let year = t.y;
  const todayVal = t.m * 100 + t.d;
  if (todayVal > SEASON.end.month * 100 + SEASON.end.day) year += 1;
  return {
    year,
    startKey: toKey(year, SEASON.start.month, SEASON.start.day),
    endKey: toKey(year, SEASON.end.month, SEASON.end.day),
  };
}

const SLOT_START_HOUR = { '8AM–12PM': 8, '12PM–4PM': 12 };

export function slotIsBookable(dateKey, slot) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const slotMs = Date.UTC(y, m - 1, d, SLOT_START_HOUR[slot] ?? 0);
  return slotMs >= pacificNowWallMs() + SEASON.leadHours * 3600 * 1000;
}

export function dateIsBookable(dateKey) {
  const { startKey, endKey } = seasonWindow();
  if (dateKey < startKey || dateKey > endKey) return false;
  return SEASON.timeSlots.some((s) => slotIsBookable(dateKey, s));
}

export function formatDateLong(dateKey) {
  if (!dateKey) return '';
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}

/* ---------- API ---------- */

async function request(path, options) {
  if (!API_URL) throw new Error('Booking API is not configured (VITE_API_URL).');
  const res = await fetch(API_URL + path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data = {};
  try { data = await res.json(); } catch (_) { /* ignore */ }
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.field = data.field;
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  fullDates: (from, to) => request(`/api/availability?from=${from}&to=${to}`),
  dayAvailability: (date) => request(`/api/availability?date=${date}`),
  createPaymentIntent: (body) => request('/api/create-payment-intent', { method: 'POST', body: JSON.stringify(body) }),
  createBooking: (body) => request('/api/bookings', { method: 'POST', body: JSON.stringify(body) }),
};

/* ---------- booking draft persistence ---------- */

const KEY = 'lumora_booking_draft';
export const emptyDraft = () => ({
  packageId: '', stories: 0, addons: [], date: '', time: '',
  name: '', phone: '', email: '', address: '',
  ref: 'r' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36),
});

export function loadDraft() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return { ...emptyDraft(), ...JSON.parse(raw) };
  } catch (_) { /* storage unavailable */ }
  return emptyDraft();
}
export function saveDraft(d) {
  try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch (_) { /* ignore */ }
}
export function clearDraft() {
  try { sessionStorage.removeItem(KEY); sessionStorage.removeItem('lumora_pi'); } catch (_) { /* ignore */ }
}

export function bookingPayload(draft, extra) {
  const pkg = PACKAGES.find((p) => p.id === draft.packageId);
  return {
    service: pkg ? pkg.name : '',
    vehicle: homeDetailsString(draft),
    addons: (draft.addons || []).map((id) => ADDONS.find((a) => a.id === id)?.label).filter(Boolean),
    estimate: estimateLabel(draft),
    date: draft.date,
    time: draft.time,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    address: draft.address.trim(),
    ref: draft.ref,
    ...extra,
  };
}

export function draftIsReadyForCheckout(d) {
  return d.packageId && d.stories && d.date && d.time && d.name && d.phone && d.email && d.address;
}
