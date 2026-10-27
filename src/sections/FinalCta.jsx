import { Link } from 'react-router-dom';
import { BUSINESS, DEPOSIT } from '../data/site.js';
import { Reveal } from '../components/motion.jsx';
import { PhoneIcon, ArrowRight } from '../components/Icons.jsx';

export default function FinalCta() {
  return (
    <section className="final">
      <div className="container">
        <Reveal className="final__card">
          <img className="final__emblem" src="/images/lumora-emblem-1024.webp" alt="Lumora Christmas Lights Irvine emblem" width="260" height="260" loading="lazy" />
          <div className="final__copy">
            <p className="eyebrow">Reserve your night</p>
            <h2 className="h2">Let's make your street <em>look twice.</em></h2>
            <p className="section-head__lede">
              Choose a package and install window in just a few steps. ${DEPOSIT} holds your date — or pay at the visit.
            </p>
            <div className="hero__ctas final__ctas">
              <Link to="/book" className="btn btn--gold btn--lg">Book online <ArrowRight width={18} height={18} /></Link>
              <a href={BUSINESS.phoneHref} className="btn btn--ghost btn--lg"><PhoneIcon width={18} height={18} /> Call now</a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
