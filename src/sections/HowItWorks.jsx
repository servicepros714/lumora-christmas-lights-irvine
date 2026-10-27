import { STEPS_HOW } from '../data/site.js';
import { Reveal } from '../components/motion.jsx';

export default function HowItWorks() {
  return (
    <section id="how" className="section how">
      <div className="container">
        <Reveal className="section-head section-head--center">
          <p className="eyebrow">How it works</p>
          <h2 className="h2">Four visits' worth of work. <em>Zero ladders for you.</em></h2>
        </Reveal>
        <ol className="how__track">
          {STEPS_HOW.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 110} className="how__step">
              <span className="how__num" aria-hidden="true">{s.n}</span>
              <span className="how__dot" aria-hidden="true" />
              <h3 className="how__title">{s.title}</h3>
              <p className="how__text">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
