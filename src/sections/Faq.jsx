import { useState } from 'react';
import { FAQS, BUSINESS } from '../data/site.js';
import { Reveal } from '../components/motion.jsx';

export default function Faq() {
  const [openIdx, setOpenIdx] = useState(0);
  return (
    <section id="faq" className="section faq">
      <div className="container faq__grid">
        <Reveal className="faq__head">
          <p className="eyebrow">FAQ</p>
          <h2 className="h2">Good questions, <em>clear answers.</em></h2>
          <p className="section-head__lede">
            Outlets, leasing, timers, weather, takedown — the things Irvine homeowners ask before booking.
          </p>
          <a href={BUSINESS.phoneHref} className="link-gold">Still wondering? Call {BUSINESS.phoneDisplay}</a>
        </Reveal>

        <div className="faq__list">
          {FAQS.map((f, i) => {
            const open = openIdx === i;
            return (
              <Reveal key={f.q} delay={i * 50} className={`faq__item${open ? ' is-open' : ''}`}>
                <h3 className="faq__q">
                  <button type="button" aria-expanded={open} aria-controls={`faq-a-${i}`} id={`faq-q-${i}`} onClick={() => setOpenIdx(open ? -1 : i)}>
                    <span>{f.q}</span>
                    <span className="faq__icon" aria-hidden="true" />
                  </button>
                </h3>
                <div id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`} className="faq__a" hidden={!open}>
                  <p>{f.a}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
