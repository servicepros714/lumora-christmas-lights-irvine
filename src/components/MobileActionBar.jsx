import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BUSINESS } from '../data/site.js';
import { PhoneIcon, CalendarIcon } from './Icons.jsx';

/** Slides in after the visitor scrolls past the hero. Not rendered on /book, /checkout, /confirmation. */
export default function MobileActionBar() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const hero = document.getElementById('hero');
      const limit = hero ? hero.offsetTop + hero.offsetHeight - 80 : window.innerHeight * 0.8;
      setShow(window.scrollY > limit);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div className={`m-bar${show ? ' is-visible' : ''}`} aria-hidden={!show}>
      <a href={BUSINESS.phoneHref} className="btn btn--ghost" tabIndex={show ? 0 : -1}>
        <PhoneIcon width={18} height={18} /> Call Now
      </a>
      <Link to="/book" className="btn btn--gold" tabIndex={show ? 0 : -1}>
        <CalendarIcon width={18} height={18} /> Book Online
      </Link>
    </div>
  );
}
