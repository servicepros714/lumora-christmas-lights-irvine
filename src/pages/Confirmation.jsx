import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS, DEPOSIT } from '../data/site.js';
import { formatDateLong, loadDraft, draftIsReadyForCheckout, bookingPayload, api } from '../lib/booking.js';
import { storeConfirmation } from './Checkout.jsx';
import { PhoneIcon } from '../components/Icons.jsx';

function readConfirmation() {
  try { return JSON.parse(sessionStorage.getItem('lumora_confirmation') || 'null'); } catch (_) { return null; }
}

export default function Confirmation() {
  const [conf, setConf] = useState(readConfirmation);
  const [state, setState] = useState(conf ? 'done' : 'checking');
  const started = useRef(false);

  // Returning from a redirect-based payment method (?payment_intent=...&redirect_status=...)
  useEffect(() => {
    if (conf || started.current) return;
    started.current = true;
    const p = new URLSearchParams(window.location.search);
    const piId = p.get('payment_intent');
    const status = p.get('redirect_status');
    const draft = loadDraft();
    if (piId && status === 'succeeded' && draftIsReadyForCheckout(draft)) {
      api.createBooking(bookingPayload(draft, { payment_status: 'Paid', payment_intent_id: piId }))
        .then((r) => {
          storeConfirmation(draft, r);
          setConf(readConfirmation());
          setState('done');
          window.history.replaceState(null, '', '/confirmation');
        })
        .catch(() => setState('error'));
    } else if (piId && status && status !== 'succeeded') {
      setState('failed');
    } else {
      setState('none');
    }
  }, [conf]);

  if (state === 'checking') {
    return (
      <section className="flow flow-msg"><div className="container flow-msg__inner"><span className="spinner" /> <p>Confirming your reservation…</p></div></section>
    );
  }

  if (state !== 'done' || !conf) {
    const msg = {
      failed: 'Your payment was not completed, so no reservation was made.',
      error: 'Your payment went through, but we could not save the booking automatically. Please call us and we will confirm it right away.',
      none: 'We could not find a recent reservation in this browser.',
    }[state];
    return (
      <section className="flow flow-msg">
        <div className="container flow-msg__inner">
          <p className="eyebrow">Reservation</p>
          <h1 className="h2">Let's get you <em>on the calendar.</em></h1>
          <p className="section-head__lede">{msg}</p>
          <div className="hero__ctas">
            <Link to="/book" className="btn btn--gold">Book online</Link>
            <a href={BUSINESS.phoneHref} className="btn btn--ghost"><PhoneIcon width={18} height={18} /> {BUSINESS.phoneDisplay}</a>
          </div>
        </div>
      </section>
    );
  }

  const paid = conf.payment_status === 'Paid';

  return (
    <section className="flow confirm">
      <div className="container">
        <div className="confirm__card">
          <img src="/images/lumora-emblem-240.webp" alt="" width="120" height="120" className="confirm__emblem" />
          <p className="eyebrow">You're on the calendar</p>
          <h1 className="h2">Thank you, <em>{(conf.name || '').split(' ')[0] || 'neighbor'}.</em></h1>
          <p className="section-head__lede">
            {paid
              ? `Your $${DEPOSIT} reservation deposit is paid and will be applied to your final invoice.`
              : 'Your install date is reserved. The deposit will be collected at the visit.'}
          </p>

          <dl className="confirm__list">
            <div><dt>Confirmation #</dt><dd className="mono">{conf.id}</dd></div>
            <div><dt>Install date</dt><dd>{formatDateLong(conf.date)}</dd></div>
            <div><dt>Time window</dt><dd>{conf.time}</dd></div>
            <div><dt>Package</dt><dd>{conf.vehicle}</dd></div>
            <div><dt>Service address</dt><dd>{conf.address}</dd></div>
            <div><dt>Payment</dt><dd>{paid ? 'Deposit paid' : 'Pay at visit'}</dd></div>
          </dl>

          <div className="confirm__next">
            <p className="confirm__next-title">What happens next</p>
            <ol>
              <li>We'll call or text to confirm your design details before install day.</li>
              <li>Our crew arrives within your time window, walks the design with you and confirms your final price.</li>
              <li>Lights go up, timer gets set — and we come back after the holidays for takedown.</li>
            </ol>
          </div>

          <div className="hero__ctas">
            <a href={BUSINESS.phoneHref} className="btn btn--ghost"><PhoneIcon width={18} height={18} /> {BUSINESS.phoneDisplay}</a>
            <Link to="/" className="btn btn--gold">Back to home</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
