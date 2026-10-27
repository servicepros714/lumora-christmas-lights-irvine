import { PACKAGES, ADDONS, DEPOSIT } from '../data/site.js';
import { estimateLabel, formatDateLong } from '../lib/booking.js';

export default function BookingSummary({ draft, title = 'Your reservation', showContact = false }) {
  const pkg = PACKAGES.find((p) => p.id === draft.packageId);
  const addons = (draft.addons || []).map((id) => ADDONS.find((a) => a.id === id)?.label).filter(Boolean);
  const Row = ({ k, v, c }) => (
    <div className={`summary__row${c ? ' summary__row--contact' : ''}`}>
      <dt>{k}</dt>
      <dd>{v || <span className="summary__empty">—</span>}</dd>
    </div>
  );
  return (
    <div className="summary">
      <p className="summary__title">{title}</p>
      <dl className="summary__list">
        <Row k="Package" v={pkg?.name} />
        <Row k="Home" v={draft.stories ? `${draft.stories}-story` : ''} />
        <Row k="Add-ons" v={addons.length ? addons.join(', ') : (draft.stories ? 'None' : '')} />
        <Row k="Install date" v={draft.date ? formatDateLong(draft.date) : ''} />
        <Row k="Time window" v={draft.time} />
        {showContact && <Row k="Name" v={draft.name} c />}
        {showContact && <Row k="Phone" v={draft.phone} c />}
        {showContact && <Row k="Email" v={draft.email} c />}
        {showContact && <Row k="Address" v={draft.address} c />}
      </dl>
      <div className="summary__totals">
        <div className="summary__row summary__row--est">
          <dt>Estimate</dt>
          <dd>{draft.packageId ? estimateLabel(draft) : '—'}</dd>
        </div>
        <div className="summary__row summary__row--dep">
          <dt>Reservation deposit</dt>
          <dd>${DEPOSIT}</dd>
        </div>
        <p className="summary__fine">Applied to your final invoice. Final price is confirmed at the on-site visit.</p>
      </div>
    </div>
  );
}
