import { IRVINE_VILLAGES, NEARBY_CITIES } from '../data/site.js';
import { Reveal } from '../components/motion.jsx';
import { StarIcon } from '../components/Icons.jsx';

export default function ServiceArea() {
  const n = IRVINE_VILLAGES.length;
  return (
    <section id="area" className="section area">
      <div className="container area__grid">
        <Reveal className="area__copy">
          <p className="eyebrow">Service area</p>
          <h2 className="h2">Every village <em>in Irvine.</em></h2>
          <p className="section-head__lede">
            From Woodbridge lakefront homes to the newest streets at Great Park, we design and install across all of Irvine —
            plus nearby cities in central Orange County.
          </p>
          <h3 className="area__nearby-title">Also serving</h3>
          <ul className="area__nearby">
            {NEARBY_CITIES.map((c) => <li key={c}>{c}</li>)}
          </ul>
          <p className="muted area__note">Not sure if you're in range? Call us — we'll let you know.</p>
        </Reveal>

        <Reveal className="constellation" delay={120}>
          <div className="constellation__ring" aria-hidden="true" />
          <div className="constellation__ring constellation__ring--inner" aria-hidden="true" />
          <div className="constellation__center">
            <StarIcon width={30} height={30} />
            <span className="constellation__city">Irvine</span>
            <span className="constellation__state">California</span>
          </div>
          <ul className="constellation__list" aria-label="Irvine villages we serve">
            {IRVINE_VILLAGES.map((v, i) => {
              const a = (i / n) * Math.PI * 2 - Math.PI / 2;
              return (
                <li key={v} style={{ '--x': Math.cos(a).toFixed(3), '--y': Math.sin(a).toFixed(3) }}>
                  <span className="constellation__dot" aria-hidden="true" />
                  <span className="constellation__name">{v}</span>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
