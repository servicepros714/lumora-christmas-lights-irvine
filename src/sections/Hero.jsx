import { Link } from 'react-router-dom';
import { BUSINESS, DEPOSIT } from '../data/site.js';
import { seasonWindow } from '../lib/booking.js';
import NightScene from '../components/NightScene.jsx';
import { useParallax } from '../components/motion.jsx';
import { PhoneIcon, ArrowRight } from '../components/Icons.jsx';

const SWAG_COLORS = ['#DD1416', '#0CBE5D', '#FCBE44', '#DD1416', '#0CBE5D', '#FCBE44', '#DD1416', '#0CBE5D', '#FCBE44'];

function BulbSwag() {
  // a static C9 string echoing the bulbs under the Lumora wordmark
  const bulbs = SWAG_COLORS.map((c, i) => {
    const t = (i + 0.5) / SWAG_COLORS.length;
    const x = 20 + t * 960;
    const y = 18 + Math.sin(t * Math.PI * 2) * 6 + Math.sin(t * Math.PI) * 28;
    return { x, y, c };
  });
  return (
    <svg className="swag" viewBox="0 0 1000 90" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 14 C 160 70, 330 70, 500 40 S 840 8, 1000 40" fill="none" stroke="#C67C30" strokeWidth="2.2" />
      {bulbs.map((b, i) => (
        <g key={i} transform={`translate(${b.x} ${b.y + 8})`}>
          <rect x="-5" y="-4" width="10" height="9" rx="2" fill="#2e7d3c" />
          <path d="M0 4 C 11 12, 9 30, 0 38 C -9 30, -11 12, 0 4 Z" fill={b.c} className="swag__bulb" style={{ '--c': b.c }} />
          <ellipse cx="-3" cy="16" rx="2" ry="5" fill="#fff" opacity="0.45" />
        </g>
      ))}
    </svg>
  );
}

export default function Hero() {
  const left = useParallax(0.05);
  const right = useParallax(0.08);
  const center = useParallax(0.025);
  const { year } = seasonWindow();

  return (
    <section id="hero" className="hero">
      <div className="hero__sky" aria-hidden="true" />
      <div className="container hero__inner">
        <p className="eyebrow hero__eyebrow">Irvine, CA · {year} install season now booking</p>
        <h1 className="hero__title">
          Irvine homes,
          <em className="shimmer"> lit like a postcard.</em>
        </h1>
        <p className="hero__lede">
          Custom-designed Christmas lighting with leased commercial-grade LEDs — designed for your home, installed by our crew,
          maintained all season and taken down after the holidays.
        </p>
        <div className="hero__ctas">
          <Link to="/book" className="btn btn--gold btn--lg">Reserve your install date <ArrowRight width={18} height={18} /></Link>
          <a href={BUSINESS.phoneHref} className="btn btn--ghost btn--lg"><PhoneIcon width={18} height={18} /> {BUSINESS.phoneDisplay}</a>
        </div>
        <p className="hero__fine">${DEPOSIT} reservation deposit holds your date and is applied to your final invoice.</p>
      </div>

      <div className="hero__collage container">
        <BulbSwag />
        <div className="collage">
          <figure ref={left} className="collage__tile collage__tile--arch collage__tile--left">
            <NightScene variant="palms" label="Illustration: palm trees wrapped in warm white lights" />
          </figure>
          <figure ref={center} className="collage__tile collage__tile--wide">
            <img src="/images/lumora-house-wide.webp" alt="Irvine-style home with warm white roofline lights, lit trees and a wreath on the front door" width="1400" height="560" />
            <figcaption className="collage__cap">Front &amp; sides · warm white</figcaption>
          </figure>
          <figure ref={right} className="collage__tile collage__tile--arch collage__tile--right">
            <NightScene variant="twostory" label="Illustration: two-story home with lit gables" />
          </figure>
        </div>
      </div>
    </section>
  );
}
