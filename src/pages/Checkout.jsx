import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, ExpressCheckoutElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { BUSINESS, DEPOSIT, STRIPE_PK } from '../data/site.js';
import { loadDraft, saveDraft, clearDraft, draftIsReadyForCheckout, bookingPayload, api, formatDateLong } from '../lib/booking.js';
import BookingSummary from '../components/BookingSummary.jsx';
import { LockIcon, PhoneIcon } from '../components/Icons.jsx';

const stripePromise = STRIPE_PK ? loadStripe(STRIPE_PK) : null;
const PI_KEY = 'lumora_pi';

const appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#FCBE44',
    colorBackground: '#0b1736',
    colorText: '#f6eedb',
    colorTextSecondary: '#c9c0ad',
    colorDanger: '#ff7a6b',
    fontFamily: 'Outfit, system-ui, sans-serif',
    borderRadius: '12px',
  },
  rules: {
    '.Input': { border: '1px solid rgba(253, 234, 160, 0.22)', boxShadow: 'none' },
    '.Input:focus': { border: '1px solid #FCBE44', boxShadow: '0 0 0 3px rgba(252, 190, 68, 0.18)' },
    '.Tab': { border: '1px solid rgba(253, 234, 160, 0.18)' },
    '.Tab--selected': { borderColor: '#FCBE44' },
  },
};
const fonts = [{ cssSrc: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600&display=swap' }];

export function storeConfirmation(draft, result) {
  const conf = {
    id: result.id,
    payment_status: result.payment_status,
    date: draft.date,
    time: draft.time,
    name: draft.name,
    address: draft.address,
    ...bookingPayload(draft),
  };
  try { sessionStorage.setItem('lumora_confirmation', JSON.stringify(conf)); } catch (_) { /* ignore */ }
  clearDraft();
}

export default function Checkout() {
  const navigate = useNavigate();
  const draft = useMemo(() => loadDraft(), []);
  const ready = draftIsReadyForCheckout(draft);
  const [clientSecret, setClientSecret] = useState('');
  const [piError, setPiError] = useState('');
  const [laterBusy, setLaterBusy] = useState(false);
  const [laterError, setLaterError] = useState('');

  const signature = `${draft.ref}|${draft.date}|${draft.time}|${draft.packageId}|${draft.email}`;

  useEffect(() => {
    if (!ready || !stripePromise) return;
    let alive = true;
    try {
      const cached = JSON.parse(sessionStorage.getItem(PI_KEY) || 'null');
      if (cached && cached.sig === signature && cached.clientSecret) { setClientSecret(cached.clientSecret); return; }
    } catch (_) { /* ignore */ }
    api.createPaymentIntent(bookingPayload(draft))
      .then((r) => {
        if (!alive) return;
        setClientSecret(r.clientSecret);
        try { sessionStorage.setItem(PI_KEY, JSON.stringify({ sig: signature, clientSecret: r.clientSecret, id: r.paymentIntentId })); } catch (_) { /* ignore */ }
      })
      .catch((e) => { if (alive) setPiError(e.message || 'Card payment is unavailable right now.'); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, signature]);

  if (!ready) return <Navigate to="/book" replace />;

  const done = (result) => {
    storeConfirmation(draft, result);
    navigate('/confirmation', { replace: true });
  };

  const payLater = async () => {
    setLaterBusy(true);
    setLaterError('');
    try {
      const r = await api.createBooking(bookingPayload(draft, { payment_status: 'Pay Later' }));
      done(r);
    } catch (e) {
      if (e.status === 409) {
        saveDraft({ ...draft, time: '' });
        setLaterError('slot');
      } else {
        setLaterError(e.message || 'We could not save your booking. Please call us.');
      }
      setLaterBusy(false);
    }
  };

  return (
    <section className="flow checkout">
      <div className="container">
        <header className="flow__head">
          <p className="eyebrow">Checkout</p>
          <h1 className="flow__title">Hold your install date</h1>
          <p className="flow__sub">{formatDateLong(draft.date)} · {draft.time}</p>
        </header>

        <div className="checkout__grid">
          <div className="checkout__summary">
            <BookingSummary draft={draft} title="Reservation summary" showContact />
            <Link to="/book?step=5" className="link-gold checkout__edit">Edit details</Link>
          </div>

          <div className="pay-card">
            <div className="pay-card__head">
              <p className="pay-card__label">Reservation deposit</p>
              <p className="pay-card__amount">${DEPOSIT}<span>.00</span></p>
              <p className="pay-card__fine">Applied in full to your final invoice.</p>
            </div>

            {!stripePromise && (
              <p className="note note--warn">Online payment isn't set up yet. You can still reserve and pay at the visit below.</p>
            )}
            {stripePromise && piError && (
              <p className="note note--warn">{piError} You can still reserve and pay at the visit below.</p>
            )}
            {stripePromise && !clientSecret && !piError && (
              <div className="pay-card__loading" aria-live="polite"><span className="spinner" /> Preparing secure payment…</div>
            )}
            {stripePromise && clientSecret && (
              // Known-bug fix: Elements is only mounted once a clientSecret exists, and is keyed on it,
              // so ExpressCheckoutElement and PaymentElement always share a real PaymentIntent.
              <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret, appearance, fonts }}>
                <PaymentForm clientSecret={clientSecret} draft={draft} onDone={done} />
              </Elements>
            )}

            {laterError === 'slot' ? (
              <p className="note note--error" role="alert">
                That time window was just taken. <Link to="/book?step=3" className="link-gold">Choose another date or window</Link>.
              </p>
            ) : laterError ? (
              <p className="note note--error" role="alert">{laterError}</p>
            ) : null}

            <div className="pay-card__later">
              <button type="button" className="text-link" onClick={payLater} disabled={laterBusy}>
                {laterBusy ? 'Saving your reservation…' : "I'll pay at the visit"}
              </button>
            </div>
          </div>
        </div>
        <a href={BUSINESS.phoneHref} className="flow__call flow__call--center"><PhoneIcon width={16} height={16} /> Questions? Call {BUSINESS.phoneDisplay}</a>
      </div>
    </section>
  );
}

function PaymentForm({ clientSecret, draft, onDone }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [expressAvailable, setExpressAvailable] = useState(false);
  const [paidButUnsaved, setPaidButUnsaved] = useState('');

  const returnUrl = `${window.location.origin}/confirmation`;

  const finalize = async (piId) => {
    try {
      const r = await api.createBooking(bookingPayload(draft, { payment_status: 'Paid', payment_intent_id: piId }));
      onDone(r);
    } catch (e) {
      setPaidButUnsaved(piId);
      setBusy(false);
    }
  };

  const confirm = async () => {
    const { error: submitError } = await elements.submit();
    if (submitError) { setError(submitError.message); setBusy(false); return; }
    const { error: payError, paymentIntent } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });
    if (payError) { setError(payError.message || 'Payment failed. Please try again.'); setBusy(false); return; }
    if (paymentIntent && ['succeeded', 'processing', 'requires_capture'].includes(paymentIntent.status)) {
      await finalize(paymentIntent.id);
    } else {
      setError('Payment was not completed. Please try again.');
      setBusy(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || busy) return;
    setBusy(true);
    setError('');
    await confirm();
  };

  const onExpressConfirm = async () => {
    if (!stripe || !elements) return;
    setBusy(true);
    setError('');
    await confirm();
  };

  if (paidButUnsaved) {
    return (
      <div className="note note--error" role="alert">
        Your payment went through, but we couldn't save the booking automatically. Please call{' '}
        <a href={BUSINESS.phoneHref} className="link-gold">{BUSINESS.phoneDisplay}</a> and mention payment reference{' '}
        <span className="mono">{paidButUnsaved}</span>.{' '}
        <button type="button" className="text-link" onClick={() => { setBusy(true); finalize(paidButUnsaved); }}>Try saving again</button>
      </div>
    );
  }

  return (
    <form className="pay-form" onSubmit={onSubmit}>
      <div className={`express${expressAvailable ? '' : ' express--empty'}`}>
        <ExpressCheckoutElement
          options={{ buttonHeight: 48, buttonTheme: { applePay: 'white-outline', googlePay: 'white' }, layout: { maxColumns: 2, maxRows: 1 } }}
          onReady={({ availablePaymentMethods }) => setExpressAvailable(!!availablePaymentMethods && Object.values(availablePaymentMethods).some(Boolean))}
          onConfirm={onExpressConfirm}
        />
      </div>
      {expressAvailable && <div className="divider"><span>or pay with card</span></div>}
      <PaymentElement options={{ layout: 'tabs', fields: { billingDetails: { email: 'auto' } }, defaultValues: { billingDetails: { name: draft.name, email: draft.email, phone: draft.phone } } }} />
      {error && <p className="note note--error" role="alert">{error}</p>}
      <button type="submit" className="btn btn--gold btn--lg btn--block pay-form__btn" disabled={!stripe || busy}>
        {busy ? <><span className="spinner spinner--dark" /> Processing…</> : <>Pay ${DEPOSIT} deposit</>}
      </button>
      <p className="pay-form__secure"><LockIcon width={14} height={14} /> Secure payment processed by Stripe</p>
    </form>
  );
}
