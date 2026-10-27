import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { BUSINESS } from '../data/site.js';
import { PhoneIcon, MenuIcon, CloseIcon, CalendarIcon } from './Icons.jsx';

const LINKS = [
  { to: '/#how', label: 'How it works' },
  { to: '/#gallery', label: 'Gallery' },
  { to: '/#packages', label: 'Packages' },
  { to: '/#area', label: 'Service area' },
  { to: '/#faq', label: 'FAQ' },
];

export default function Nav({ compact }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();
  const closeBtn = useRef(null);
  const menuBtn = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname, hash]);

  useEffect(() => {
    document.body.classList.toggle('no-scroll', open);
    if (open) closeBtn.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') { setOpen(false); menuBtn.current?.focus(); } };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className={`capsule-wrap${scrolled ? ' is-scrolled' : ''}${compact ? ' is-compact' : ''}`}>
      <nav className="capsule" aria-label="Main">
        <Link to="/" className="capsule__brand" aria-label={`${BUSINESS.name} home`}>
          <img src="/images/lumora-emblem-240.webp" alt="" width="44" height="44" className="capsule__emblem" />
          <span className="capsule__word">
            <span className="capsule__name">Lumora</span>
            <span className="capsule__sub">Christmas Lights · Irvine</span>
          </span>
        </Link>

        {!compact && (
          <ul className="capsule__links">
            {LINKS.map((l) => (
              <li key={l.to}><NavLink to={l.to} className="capsule__link">{l.label}</NavLink></li>
            ))}
          </ul>
        )}

        <div className="capsule__actions">
          <a href={BUSINESS.phoneHref} className="capsule__phone">
            <PhoneIcon width={16} height={16} />
            <span>{BUSINESS.phoneDisplay}</span>
          </a>
          {!compact && (
            <Link to="/book" className="btn btn--gold btn--sm capsule__cta">Reserve a date</Link>
          )}
          {!compact && (
            <button ref={menuBtn} type="button" className="capsule__menu" aria-label="Open menu" aria-expanded={open} aria-controls="sheet-menu" onClick={() => setOpen(true)}>
              <MenuIcon />
            </button>
          )}
        </div>
      </nav>

      <div id="sheet-menu" className={`sheet${open ? ' is-open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu" hidden={!open}>
        <div className="sheet__top">
          <Link to="/" className="capsule__brand" onClick={() => setOpen(false)}>
            <img src="/images/lumora-emblem-240.webp" alt="" width="44" height="44" className="capsule__emblem" />
            <span className="capsule__word">
              <span className="capsule__name">Lumora</span>
              <span className="capsule__sub">Christmas Lights · Irvine</span>
            </span>
          </Link>
          <button ref={closeBtn} type="button" className="capsule__menu" aria-label="Close menu" onClick={() => setOpen(false)}>
            <CloseIcon />
          </button>
        </div>
        <ul className="sheet__links">
          {LINKS.map((l, i) => (
            <li key={l.to} style={{ '--i': i }}>
              <Link to={l.to} className="sheet__link" onClick={() => setOpen(false)}>{l.label}</Link>
            </li>
          ))}
        </ul>
        <div className="sheet__actions">
          <a href={BUSINESS.phoneHref} className="btn btn--ghost btn--block"><PhoneIcon width={18} height={18} /> Call Now</a>
          <Link to="/book" className="btn btn--gold btn--block" onClick={() => setOpen(false)}><CalendarIcon width={18} height={18} /> Book Online</Link>
        </div>
      </div>
    </header>
  );
}
