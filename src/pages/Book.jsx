import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PACKAGES, ADDONS, FEATURES, SEASON, TWO_STORY_PERCENT, BUSINESS } from '../data/site.js';
import {
  loadDraft, saveDraft, packagePriceLabel, addonPriceLabel, seasonWindow, dateIsBookable, slotIsBookable,
  formatDateLong, toKey, api,
} from '../lib/booking.js';
import BookingSummary from '../components/BookingSummary.jsx';
import { ArrowLeft, ArrowRight, CheckIcon, PhoneIcon } from '../components/Icons.jsx';

const STEP_LABELS = ['Package', 'Home & add-ons', 'Install date', 'Time window', 'Your info'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function firstOpenStep(d) {
  if (!d.packageId) return 1;
  if (!d.stories) return 2;
  if (!d.date) return 3;
  if (!d.time) return 4;
  return 5;
}

export default function Book() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [draft, setDraft] = useState(loadDraft);
  const [step, setStep] = useState(() => {
    const wanted = Number(params.get('step')) || 1;
    return Math.max(1, Math.min(wanted, firstOpenStep(loadDraft())));
  });
  const [error, setError] = useState('');
  const [fullDates, setFullDates] = useState([]);
  const [apiWarning, setApiWarning] = useState('');
  const [dayInfo, setDayInfo] = useState({ date: '', unavailable: [], loading: false });
  const panelRef = useRef(null);

  const season = useMemo(() => seasonWindow(), []);

  const update = (patch) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      saveDraft(next);
      return next;
    });
    setError('');
  };

  // Auto-scroll to top on every step change
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [step]);

  // Load fully booked dates for the season once
  useEffect(() => {
    let alive = true;
    api.fullDates(season.startKey, season.endKey)
      .then((r) => { if (alive) setFullDates(r.fullDates || []); })
      .catch(() => { if (alive) setApiWarning('Live availability could not be loaded. You can still choose a date — we will confirm it with you.'); });
    return () => { alive = false; };
  }, [season.startKey, season.endKey]);

  // Load the chosen day's taken windows
  useEffect(() => {
    if (!draft.date) return;
    let alive = true;
    setDayInfo({ date: draft.date, unavailable: [], loading: true });
    api.dayAvailability(draft.date)
      .then((r) => { if (alive) setDayInfo({ date: draft.date, unavailable: r.unavailable || [], loading: false }); })
      .catch(() => { if (alive) setDayInfo({ date: draft.date, unavailable: [], loading: false }); });
    return () => { alive = false; };
  }, [draft.date]);

  const slotDisabled = (slot) =>
    !draft.date || !slotIsBookable(draft.date, slot) || (dayInfo.date === draft.date && dayInfo.unavailable.includes(slot));

  // Clear a chosen time window that became unavailable
  useEffect(() => {
    if (draft.time && !dayInfo.loading && dayInfo.date === draft.date && slotDisabled(draft.time)) update({ time: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayInfo]);

  const fail = (message, selector) => {
    setError(message);
    requestAnimationFrame(() => {
      const el = panelRef.current?.querySelector(selector);
      if (el) { el.focus({ preventScroll: true }); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    });
    return false;
  };

  const validate = () => {
    if (step === 1 && !draft.packageId) return fail('Please choose a package to continue.', 'input[name="package"]');
    if (step === 2 && !draft.stories) return fail('Please choose your home height — 1-story or 2-story.', 'input[name="stories"]');
    if (step === 3 && !draft.date) return fail('Please choose an install date.', '.cal__day:not(:disabled)');
    if (step === 4 && !draft.time) return fail('Please choose a time window.', 'input[name="time"]:not(:disabled)');
    if (step === 5) {
      if (!draft.name.trim()) return fail('Please enter your Full Name.', '#f-name');
      const digits = draft.phone.replace(/\D/g, '');
      if (!digits) return fail('Please enter your Phone number.', '#f-phone');
      if (digits.length < 10) return fail('Please enter a valid Phone number (10 digits).', '#f-phone');
      if (!draft.email.trim()) return fail('Please enter your Email.', '#f-email');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email.trim())) return fail('Please enter a valid Email address.', '#f-email');
      if (!draft.address.trim()) return fail('Please enter your Service Address.', '#f-address');
    }
    return true;
  };

  const next = () => {
    if (!validate()) return;
    if (step < 5) setStep(step + 1);
    else navigate('/checkout');
  };
  const back = () => {
    setError('');
    if (step > 1) setStep(step - 1);
    else navigate('/');
  };

  return (
    <section className="flow">
      <div className="container">
        <header className="flow__head">
          <p className="eyebrow">Reserve your install</p>
          <h1 className="flow__title">{STEP_LABELS[step - 1]}</h1>
          <ol className="bulbs" aria-label={`Step ${step} of 5`}>
            {STEP_LABELS.map((l, i) => (
              <li key={l} className={`bulbs__item${i + 1 < step ? ' is-done' : ''}${i + 1 === step ? ' is-current' : ''}`}>
                <span className="bulbs__bulb" aria-hidden="true" />
                <span className="bulbs__label">{l}</span>
              </li>
            ))}
          </ol>
        </header>

        <div className="flow__grid">
          <div className="flow__panel" ref={panelRef}>
            {step === 1 && (
              <fieldset className="fs">
                <legend className="fs__legend">Which package fits your home?</legend>
                <div className="pick-grid">
                  {PACKAGES.map((p) => {
                    const on = draft.packageId === p.id;
                    const feats = FEATURES.filter((f) => f.in.includes(p.id));
                    return (
                      <label key={p.id} className={`pick pick--pkg${on ? ' is-on' : ''}`}>
                        <input type="radio" name="package" value={p.id} checked={on} onChange={() => update({ packageId: p.id })} />
                        <span className="pick__check" aria-hidden="true"><CheckIcon width={14} height={14} /></span>
                        <span className="pick__name">{p.name}</span>
                        <span className="pick__price">{packagePriceLabel(p)}</span>
                        <ul className="pick__feats">
                          {feats.map((f) => <li key={f.label}>{f.label}</li>)}
                        </ul>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {step === 2 && (
              <>
                <fieldset className="fs">
                  <legend className="fs__legend">How tall is your home?</legend>
                  <div className="pick-grid">
                    {[1, 2].map((n) => {
                      const on = draft.stories === n;
                      return (
                        <label key={n} className={`pick${on ? ' is-on' : ''}`}>
                          <input type="radio" name="stories" value={n} checked={on} onChange={() => update({ stories: n })} />
                          <span className="pick__check" aria-hidden="true"><CheckIcon width={14} height={14} /></span>
                          <span className="pick__name">{n}-story home</span>
                          <span className="pick__price">{n === 2 ? `+${TWO_STORY_PERCENT}% of package price` : 'Included'}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
                <fieldset className="fs">
                  <legend className="fs__legend">Add-ons <span className="fs__opt">optional</span></legend>
                  <div className="pick-grid pick-grid--addons">
                    {ADDONS.map((a) => {
                      const on = draft.addons.includes(a.id);
                      return (
                        <label key={a.id} className={`pick pick--box${on ? ' is-on' : ''}`}>
                          <input
                            type="checkbox"
                            name="addons"
                            value={a.id}
                            checked={on}
                            onChange={() => update({ addons: on ? draft.addons.filter((x) => x !== a.id) : [...draft.addons, a.id] })}
                          />
                          <span className="pick__check pick__check--box" aria-hidden="true"><CheckIcon width={14} height={14} /></span>
                          <span className="pick__name">{a.label}</span>
                          <span className="pick__price">{addonPriceLabel(a)}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            )}

            {step === 3 && (
              <fieldset className="fs">
                <legend className="fs__legend">Choose your install date</legend>
                <p className="fs__help">
                  Installs run {MONTHS[SEASON.start.month - 1].slice(0, 3)} {SEASON.start.day} – {MONTHS[SEASON.end.month - 1].slice(0, 3)} {SEASON.end.day}, Monday through Sunday.
                  The earliest available install is {SEASON.leadHours} hours from now (California time).
                </p>
                {apiWarning && <p className="note note--warn">{apiWarning}</p>}
                <Calendar
                  season={season}
                  value={draft.date}
                  fullDates={fullDates}
                  onPick={(key) => update({ date: key, time: key === draft.date ? draft.time : '' })}
                />
              </fieldset>
            )}

            {step === 4 && (
              <fieldset className="fs">
                <legend className="fs__legend">Pick a time window</legend>
                <p className="fs__help">For {formatDateLong(draft.date)}. Our crew arrives within the window you choose.</p>
                <div className="pick-grid">
                  {SEASON.timeSlots.map((slot) => {
                    const disabled = slotDisabled(slot);
                    const on = draft.time === slot;
                    return (
                      <label key={slot} className={`pick pick--slot${on ? ' is-on' : ''}${disabled ? ' is-disabled' : ''}`}>
                        <input type="radio" name="time" value={slot} checked={on} disabled={disabled} onChange={() => update({ time: slot })} />
                        <span className="pick__check" aria-hidden="true"><CheckIcon width={14} height={14} /></span>
                        <span className="pick__name">{slot}</span>
                        <span className="pick__price">
                          {dayInfo.loading ? 'Checking…' : disabled ? 'Unavailable' : slot.startsWith('8') ? 'Morning window' : 'Afternoon window'}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {!dayInfo.loading && SEASON.timeSlots.every(slotDisabled) && (
                  <p className="note note--warn">Both windows on this date are taken. Please go back and choose another date.</p>
                )}
              </fieldset>
            )}

            {step === 5 && (
              <fieldset className="fs">
                <legend className="fs__legend">Where should we install?</legend>
                <div className="form-grid">
                  <div className="field field--full">
                    <label htmlFor="f-name">Full Name</label>
                    <input id="f-name" type="text" autoComplete="name" value={draft.name} onChange={(e) => update({ name: e.target.value })} aria-invalid={error.includes('Full Name') || undefined} />
                  </div>
                  <div className="field">
                    <label htmlFor="f-phone">Phone</label>
                    <input id="f-phone" type="tel" inputMode="tel" autoComplete="tel" value={draft.phone} onChange={(e) => update({ phone: e.target.value })} aria-invalid={error.includes('Phone') || undefined} />
                  </div>
                  <div className="field">
                    <label htmlFor="f-email">Email</label>
                    <input id="f-email" type="email" inputMode="email" autoComplete="email" value={draft.email} onChange={(e) => update({ email: e.target.value })} aria-invalid={error.includes('Email') || undefined} />
                  </div>
                  <div className="field field--full">
                    <label htmlFor="f-address">Service Address</label>
                    <input id="f-address" type="text" autoComplete="street-address" placeholder="Street, city, ZIP" value={draft.address} onChange={(e) => update({ address: e.target.value })} aria-invalid={error.includes('Service Address') || undefined} />
                  </div>
                </div>
              </fieldset>
            )}

            {error && <p className="note note--error" role="alert">{error}</p>}

            <div className="flow-actions">
              <button type="button" className="btn btn--ghost" onClick={back}><ArrowLeft width={18} height={18} /> Back</button>
              <button type="button" className="btn btn--gold" onClick={next}>
                {step < 5 ? 'Continue' : 'Continue to checkout'} <ArrowRight width={18} height={18} />
              </button>
            </div>
          </div>

          <aside className="flow__aside">
            <BookingSummary draft={draft} />
            <a href={BUSINESS.phoneHref} className="flow__call"><PhoneIcon width={16} height={16} /> Prefer to book by phone? {BUSINESS.phoneDisplay}</a>
          </aside>
        </div>
      </div>
    </section>
  );
}

function Calendar({ season, value, fullDates, onPick }) {
  const months = useMemo(() => {
    const list = [];
    for (let m = SEASON.start.month; m <= SEASON.end.month; m++) list.push({ y: season.year, m });
    return list;
  }, [season.year]);

  const initialIdx = useMemo(() => {
    const target = value || (() => {
      // first bookable day in the season
      for (const { y, m } of months) {
        const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
        for (let d = 1; d <= days; d++) { const k = toKey(y, m, d); if (dateIsBookable(k)) return k; }
      }
      return '';
    })();
    const mm = target ? Number(target.split('-')[1]) : SEASON.start.month;
    return Math.max(0, months.findIndex((x) => x.m === mm));
  }, [months, value]);

  const [idx, setIdx] = useState(initialIdx);
  const { y, m } = months[idx];
  const firstDow = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  return (
    <div className="cal">
      <div className="cal__head">
        <button type="button" className="cal__nav" onClick={() => setIdx(idx - 1)} disabled={idx === 0} aria-label="Previous month"><ArrowLeft width={18} height={18} /></button>
        <p className="cal__month" aria-live="polite">{MONTHS[m - 1]} {y}</p>
        <button type="button" className="cal__nav" onClick={() => setIdx(idx + 1)} disabled={idx === months.length - 1} aria-label="Next month"><ArrowRight width={18} height={18} /></button>
      </div>
      <div className="cal__grid" role="grid">
        {DOW.map((d) => <span key={d} className="cal__dow" role="columnheader">{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={'e' + i} className="cal__pad" />;
          const key = toKey(y, m, d);
          const full = fullDates.includes(key);
          const ok = dateIsBookable(key) && !full;
          const on = value === key;
          return (
            <button
              key={key}
              type="button"
              className={`cal__day${on ? ' is-on' : ''}${full ? ' is-full' : ''}`}
              disabled={!ok}
              aria-pressed={on}
              aria-label={`${formatDateLong(key)}${full ? ', fully booked' : ok ? '' : ', unavailable'}`}
              onClick={() => onPick(key)}
            >
              {d}
            </button>
          );
        })}
      </div>
      <div className="cal__legend">
        <span><i className="lg lg--open" /> Open</span>
        <span><i className="lg lg--on" /> Selected</span>
        <span><i className="lg lg--off" /> Unavailable</span>
      </div>
    </div>
  );
}
