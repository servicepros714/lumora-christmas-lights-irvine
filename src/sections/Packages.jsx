import { Link } from 'react-router-dom';
import { PACKAGES, FEATURES, ADDONS, TWO_STORY_PERCENT, DEPOSIT } from '../data/site.js';
import { packagePriceLabel, addonPriceLabel } from '../lib/booking.js';
import { Reveal } from '../components/motion.jsx';
import { CheckIcon, MinusIcon, ArrowRight } from '../components/Icons.jsx';

export default function Packages() {
  return (
    <section id="packages" className="section packages">
      <div className="container">
        <Reveal className="section-head section-head--center">
          <p className="eyebrow">Packages</p>
          <h2 className="h2">Compare, choose, <em>then glow.</em></h2>
          <p className="section-head__lede">
            Both packages include design, leased lights, install, maintenance and takedown. Prices are starting points —
            your final price is confirmed at the on-site visit.
          </p>
        </Reveal>

        <Reveal className="compare-wrap">
          <table className="compare">
            <caption className="sr-only">Package comparison</caption>
            <thead>
              <tr>
                <th scope="col" className="compare__corner">What's included</th>
                {PACKAGES.map((p) => (
                  <th scope="col" key={p.id} className={`compare__pkg${p.featured ? ' is-featured' : ''}`}>
                    {p.featured && <span className="compare__flag">Fuller look</span>}
                    <span className="compare__name">{p.name}</span>
                    <span className="compare__tag">{p.tagline}</span>
                    <span className="compare__price">{packagePriceLabel(p)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f) => (
                <tr key={f.label}>
                  <th scope="row">{f.label}</th>
                  {PACKAGES.map((p) => (
                    <td key={p.id} className={p.featured ? 'is-featured' : ''}>
                      {f.in.includes(p.id) ? (
                        <span className="compare__yes" aria-label="Included"><CheckIcon width={16} height={16} /></span>
                      ) : (
                        <span className="compare__no" aria-label="Not included"><MinusIcon width={16} height={16} /></span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>

        <div className="packages__lower">
          <Reveal className="addons-card">
            <h3 className="h3">Add-ons <span className="muted">· chosen in step 2 of booking</span></h3>
            <ul className="addons-list">
              <li>
                <span>Two-story home</span>
                <span className="addons-list__price">+{TWO_STORY_PERCENT}% of package price</span>
              </li>
              {ADDONS.map((a) => (
                <li key={a.id}>
                  <span>{a.label}</span>
                  <span className="addons-list__price">{addonPriceLabel(a)}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal className="book-card" delay={120}>
            <p className="eyebrow">One step to start</p>
            <p className="book-card__text">
              Pick your package inside the booking flow, add your home details, and choose an install window.
              A <span className="gold">${DEPOSIT}</span> deposit reserves it — applied to your final invoice.
            </p>
            <ul className="book-card__facts">
              <li>Five short steps — package to checkout</li>
              <li>Install windows 7 days a week, Oct 20 – Dec 20</li>
              <li>Pay the deposit now or at the visit</li>
            </ul>
            <Link to="/book" className="btn btn--gold btn--lg btn--block">Book Now <ArrowRight width={18} height={18} /></Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
