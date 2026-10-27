import { Link } from 'react-router-dom';
import { BUSINESS } from '../data/site.js';
import { PhoneIcon, PinIcon } from './Icons.jsx';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="foot">
      <div className="container">
        <div className="foot__row">
          <div className="foot__contact">
            <p className="eyebrow">Get in touch</p>
            <a href={BUSINESS.phoneHref} className="foot__phone"><PhoneIcon width={18} height={18} /> {BUSINESS.phoneDisplay}</a>
            <p className="foot__place"><PinIcon width={16} height={16} /> Irvine, CA · Serving Irvine and nearby cities</p>
            {BUSINESS.email && <a href={`mailto:${BUSINESS.email}`} className="foot__mail">{BUSINESS.email}</a>}
          </div>
          <nav className="foot__nav" aria-label="Footer">
            <Link to="/#how">How it works</Link>
            <Link to="/#gallery">Gallery</Link>
            <Link to="/#packages">Packages</Link>
            <Link to="/#season">Season</Link>
            <Link to="/#area">Service area</Link>
            <Link to="/#faq">FAQ</Link>
            <Link to="/book" className="foot__book">Reserve a date →</Link>
          </nav>
        </div>
      </div>
      <div className="foot__mark" aria-hidden="true">
        <span>Lumora</span>
      </div>
      <div className="container">
        <div className="foot__legal">
          <span>© {year} {BUSINESS.name}</span>
          <span>Christmas light design, installation & takedown · Irvine, California</span>
        </div>
      </div>
    </footer>
  );
}
