/**
 * Lumora Christmas Lights Irvine — booking + Stripe API
 * Worker name: lumora-irvine-api      Source tag: lumora-irvine      Booking ID prefix: LUM-
 *
 * Paste this whole file into Cloudflare dashboard > Workers & Pages > lumora-irvine-api > Edit code.
 * Bindings (Settings > Bindings):   D1 database  ->  variable name: DB
 * Secrets  (Settings > Variables):  STRIPE_SECRET_KEY  (required)
 *                                   ADMIN_TOKEN        (optional — protects GET/PATCH of bookings)
 *                                   ALLOWED_ORIGIN     (optional — e.g. https://lumoralightsirvine.com ; defaults to *)
 *
 * Known-bug fixes baked in:
 *  - ensureSchema never blocks payment: /api/create-payment-intent does not touch D1, and schema
 *    errors are caught and logged instead of failing the request.
 *  - No D1 .exec(): every statement is a single-line prepare().run(), so newline parsing can't break it.
 *  - Availability and listing queries are always source-scoped (AND source = ?).
 */

const SOURCE = 'lumora-irvine';
const ID_PREFIX = 'LUM-';
const DEPOSIT_CENTS = 14900; // $149 reservation deposit, applied to final invoice
const TIME_SLOTS = ['8AM–12PM', '12PM–4PM']; // en dash — matches shared D1 values
const SLOT_START_HOUR = { '8AM–12PM': 8, '12PM–4PM': 12 };
const SLOT_CAPACITY = 1; // install crews per window
const LEAD_HOURS = 48;
const SEASON_START = { month: 10, day: 20 };
const SEASON_END = { month: 12, day: 20 };
const SERVICES = ['Front Only', 'Front & Sides'];
const PATCHABLE = ['status', 'reschedule_date', 'reschedule_time', 'notes2', 'original_date', 'original_time', 'payment_status', 'date', 'time'];
const INACTIVE_STATUSES = ['Cancelled', 'Canceled'];

const SCHEMA_STATEMENTS = [
  "CREATE TABLE IF NOT EXISTS bookings (id TEXT PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL, service TEXT, name TEXT, phone TEXT, email TEXT, vehicle TEXT, address TEXT, notes TEXT, source TEXT, created_at TEXT, status TEXT DEFAULT 'Booked', reschedule_date TEXT, reschedule_time TEXT, notes2 TEXT, original_date TEXT, original_time TEXT, payment_status TEXT)",
  'CREATE INDEX IF NOT EXISTS idx_bookings_source_date ON bookings (source, date)',
];

let schemaReady = false;
async function ensureSchema(env) {
  if (schemaReady) return;
  try {
    for (const sql of SCHEMA_STATEMENTS) {
      await env.DB.prepare(sql).run();
    }
    schemaReady = true;
  } catch (err) {
    // Never block the request on schema setup — the table usually already exists.
    console.error('ensureSchema failed (continuing):', err && err.message);
  }
}

/* ---------------- helpers ---------------- */

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': (env && env.ALLOWED_ORIGIN) || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(data, status, env) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
  });
}

function clean(v, max) {
  return String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max || 300);
}

/** Current wall-clock time in America/Los_Angeles, expressed as a UTC timestamp of the same wall time. */
function pacificNowWallMs() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t) => Number(parts.find((p) => p.type === t).value);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
}

function isValidDateStr(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
}

function inSeason(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  const v = m * 100 + d;
  return v >= SEASON_START.month * 100 + SEASON_START.day && v <= SEASON_END.month * 100 + SEASON_END.day;
}

function slotIsBookable(dateStr, time) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const slotMs = Date.UTC(y, m - 1, d, SLOT_START_HOUR[time] || 0);
  return slotMs >= pacificNowWallMs() + LEAD_HOURS * 3600 * 1000;
}

function makeId() {
  const now = new Date();
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  const buf = new Uint8Array(5);
  crypto.getRandomValues(buf);
  for (const b of buf) rand += chars[b % chars.length];
  return `${ID_PREFIX}${ymd}-${rand}`;
}

const ACTIVE_FILTER = `AND (status IS NULL OR status NOT IN (${INACTIVE_STATUSES.map(() => '?').join(',')}))`;
const EFFECTIVE_DATE = "COALESCE(NULLIF(reschedule_date, ''), date)";
const EFFECTIVE_TIME = "COALESCE(NULLIF(reschedule_time, ''), time)";

async function countSlot(env, date, time) {
  const row = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM bookings WHERE ${EFFECTIVE_DATE} = ? AND ${EFFECTIVE_TIME} = ? AND source = ? ${ACTIVE_FILTER}`
  ).bind(date, time, SOURCE, ...INACTIVE_STATUSES).first();
  return (row && row.n) || 0;
}

async function stripeRequest(env, method, path, form) {
  const res = await fetch('https://api.stripe.com/v1/' + path, {
    method,
    headers: {
      Authorization: 'Bearer ' + env.STRIPE_SECRET_KEY,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || 'Stripe request failed';
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

function isAuthorized(request, env) {
  if (!env.ADMIN_TOKEN) return true;
  const h = request.headers.get('Authorization') || '';
  return h === 'Bearer ' + env.ADMIN_TOKEN;
}

/* ---------------- handlers ---------------- */

async function handleAvailability(url, env) {
  await ensureSchema(env);
  const date = url.searchParams.get('date');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');

  if (date) {
    if (!isValidDateStr(date)) return json({ error: 'Invalid date' }, 400, env);
    const { results } = await env.DB.prepare(
      `SELECT ${EFFECTIVE_TIME} AS t, COUNT(*) AS n FROM bookings WHERE ${EFFECTIVE_DATE} = ? AND source = ? ${ACTIVE_FILTER} GROUP BY t`
    ).bind(date, SOURCE, ...INACTIVE_STATUSES).all();
    const booked = {};
    for (const r of results || []) booked[r.t] = r.n;
    const unavailable = TIME_SLOTS.filter((t) => (booked[t] || 0) >= SLOT_CAPACITY || !slotIsBookable(date, t));
    return json({ date, slots: TIME_SLOTS, unavailable }, 200, env);
  }

  if (from && to && isValidDateStr(from) && isValidDateStr(to)) {
    const { results } = await env.DB.prepare(
      `SELECT ${EFFECTIVE_DATE} AS d, COUNT(*) AS n FROM bookings WHERE ${EFFECTIVE_DATE} BETWEEN ? AND ? AND source = ? ${ACTIVE_FILTER} GROUP BY d`
    ).bind(from, to, SOURCE, ...INACTIVE_STATUSES).all();
    const full = (results || []).filter((r) => r.n >= TIME_SLOTS.length * SLOT_CAPACITY).map((r) => r.d);
    return json({ from, to, fullDates: full }, 200, env);
  }

  return json({ error: 'Pass ?date=YYYY-MM-DD or ?from=&to=' }, 400, env);
}

async function handleCreatePaymentIntent(request, env) {
  // Intentionally does NOT touch D1 — payment must never be blocked by database setup.
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Payments are not configured yet.' }, 500, env);
  let body = {};
  try { body = await request.json(); } catch (_) { /* empty body is fine */ }

  const form = {
    amount: String(DEPOSIT_CENTS),
    currency: 'usd',
    'automatic_payment_methods[enabled]': 'true',
    description: `Lumora Christmas Lights Irvine — install reservation deposit${body.date ? ' (' + clean(body.date, 10) + ' ' + clean(body.time, 12) + ')' : ''}`,
    'metadata[source]': SOURCE,
    'metadata[service]': clean(body.service, 40),
    'metadata[home]': clean(body.vehicle, 200),
    'metadata[date]': clean(body.date, 10),
    'metadata[time]': clean(body.time, 12),
    'metadata[name]': clean(body.name, 100),
    'metadata[phone]': clean(body.phone, 30),
    'metadata[ref]': clean(body.ref, 40),
  };
  const email = clean(body.email, 200);
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) form.receipt_email = email;

  try {
    const pi = await stripeRequest(env, 'POST', 'payment_intents', form);
    return json({ clientSecret: pi.client_secret, paymentIntentId: pi.id, amount: DEPOSIT_CENTS }, 200, env);
  } catch (err) {
    return json({ error: err.message }, err.status || 500, env);
  }
}

async function handleCreateBooking(request, env) {
  await ensureSchema(env);
  let b;
  try { b = await request.json(); } catch (_) { return json({ error: 'Invalid JSON' }, 400, env); }

  const data = {
    date: clean(b.date, 10),
    time: clean(b.time, 12),
    service: clean(b.service, 40),
    name: clean(b.name, 120),
    phone: clean(b.phone, 30),
    email: clean(b.email, 200),
    vehicle: clean(b.vehicle, 250),
    address: clean(b.address, 300),
  };
  const addons = Array.isArray(b.addons) ? b.addons.map((a) => clean(a, 60)).filter(Boolean).slice(0, 12) : [];
  const estimate = clean(b.estimate, 80);
  const ref = clean(b.ref, 40);
  const piId = clean(b.payment_intent_id, 80);
  const wantsPaid = b.payment_status === 'Paid';

  const required = { name: 'Full Name', phone: 'Phone', email: 'Email', address: 'Service Address', date: 'Install date', time: 'Time window', service: 'Package' };
  for (const [k, label] of Object.entries(required)) {
    if (!data[k]) return json({ error: `${label} is required`, field: k }, 400, env);
  }
  if (!isValidDateStr(data.date) || !inSeason(data.date)) return json({ error: 'Install date is outside the install season', field: 'date' }, 400, env);
  if (!TIME_SLOTS.includes(data.time)) return json({ error: 'Invalid time window', field: 'time' }, 400, env);
  if (!SERVICES.includes(data.service)) return json({ error: 'Invalid package', field: 'service' }, 400, env);
  if (wantsPaid && !/^pi_[A-Za-z0-9_]+$/.test(piId)) return json({ error: 'Missing payment reference' }, 400, env);

  // Idempotency: the same PaymentIntent (or the same draft ref for pay-later) never creates two rows.
  const idemKey = wantsPaid ? `PI: ${piId}` : (ref ? `Ref: ${ref}` : '');
  if (idemKey) {
    const existing = await env.DB.prepare('SELECT id, payment_status FROM bookings WHERE source = ? AND notes LIKE ? LIMIT 1')
      .bind(SOURCE, `%${idemKey}%`).first();
    if (existing) return json({ ok: true, id: existing.id, payment_status: existing.payment_status, duplicate: true }, 200, env);
  }

  let paymentStatus = 'Pay Later';
  let paymentNote = 'Deposit: pay at visit';
  if (wantsPaid) {
    try {
      const pi = await stripeRequest(env, 'GET', 'payment_intents/' + encodeURIComponent(piId));
      if (!['succeeded', 'processing', 'requires_capture'].includes(pi.status)) {
        return json({ error: 'Payment has not completed. Please try again.' }, 402, env);
      }
      paymentStatus = 'Paid';
      paymentNote = `Deposit: $${(pi.amount_received || pi.amount) / 100} ${pi.status === 'succeeded' ? 'paid' : pi.status}`;
    } catch (err) {
      // Stripe unreachable: the client already confirmed payment, so keep the booking and flag it.
      paymentStatus = 'Paid';
      paymentNote = 'Deposit: paid (verify in Stripe)';
    }
  }

  const taken = await countSlot(env, data.date, data.time);
  let conflictNote = '';
  if (taken >= SLOT_CAPACITY || !slotIsBookable(data.date, data.time)) {
    if (!wantsPaid) {
      return json({ error: 'That time window is no longer available. Please choose another.', field: 'time' }, 409, env);
    }
    // Customer has already paid — keep the booking and flag it for a reschedule call.
    conflictNote = 'SLOT CONFLICT – call to reschedule';
  }

  const notesParts = [
    addons.length ? `Add-ons: ${addons.join(', ')}` : 'Add-ons: none',
    estimate ? `Estimate: ${estimate}` : '',
    paymentNote,
    conflictNote,
    ref ? `Ref: ${ref}` : '',
    piId ? `PI: ${piId}` : '',
  ].filter(Boolean);

  const id = makeId();
  await env.DB.prepare(
    'INSERT INTO bookings (id, date, time, service, name, phone, email, vehicle, address, notes, source, created_at, status, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, data.date, data.time, data.service, data.name, data.phone, data.email, data.vehicle, data.address,
    notesParts.join(' | '), SOURCE, new Date().toISOString(), 'Booked', paymentStatus
  ).run();

  return json({ ok: true, id, payment_status: paymentStatus }, 201, env);
}

async function handleListBookings(request, url, env) {
  if (!isAuthorized(request, env)) return json({ error: 'Unauthorized' }, 401, env);
  await ensureSchema(env);
  const { results } = await env.DB.prepare('SELECT * FROM bookings WHERE source = ? ORDER BY date ASC, time ASC').bind(SOURCE).all();
  return json({ bookings: results || [] }, 200, env);
}

async function handlePatchBooking(request, id, env) {
  if (!isAuthorized(request, env)) return json({ error: 'Unauthorized' }, 401, env);
  await ensureSchema(env);
  let body;
  try { body = await request.json(); } catch (_) { return json({ error: 'Invalid JSON' }, 400, env); }
  const keys = Object.keys(body || {}).filter((k) => PATCHABLE.includes(k));
  if (!keys.length) return json({ error: 'No patchable fields', patchable: PATCHABLE }, 400, env);
  if (body.payment_status != null && !['Paid', 'Pay Later'].includes(body.payment_status)) {
    return json({ error: "payment_status must be 'Paid' or 'Pay Later'" }, 400, env);
  }
  const sets = keys.map((k) => `${k} = ?`).join(', ');
  const values = keys.map((k) => (body[k] == null ? null : clean(body[k], 500)));
  const res = await env.DB.prepare(`UPDATE bookings SET ${sets} WHERE id = ? AND source = ?`).bind(...values, id, SOURCE).run();
  const changed = res && res.meta ? res.meta.changes : 0;
  if (!changed) return json({ error: 'Booking not found' }, 404, env);
  return json({ ok: true, id, updated: keys }, 200, env);
}

/* ---------------- router ---------------- */

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(env) });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    try {
      if (path === '/' || path === '/api/health') return json({ ok: true, source: SOURCE }, 200, env);
      if (path === '/api/availability' && request.method === 'GET') return await handleAvailability(url, env);
      if (path === '/api/create-payment-intent' && request.method === 'POST') return await handleCreatePaymentIntent(request, env);
      if (path === '/api/bookings' && request.method === 'POST') return await handleCreateBooking(request, env);
      if (path === '/api/bookings' && request.method === 'GET') return await handleListBookings(request, url, env);
      const m = path.match(/^\/api\/bookings\/([^/]+)$/);
      if (m && request.method === 'PATCH') return await handlePatchBooking(request, decodeURIComponent(m[1]), env);
      return json({ error: 'Not found' }, 404, env);
    } catch (err) {
      console.error(err);
      return json({ error: 'Server error. Please call us to book.' }, 500, env);
    }
  },
};
