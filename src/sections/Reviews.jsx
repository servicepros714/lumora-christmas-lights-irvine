import { REVIEWS, BUSINESS } from '../data/site.js';
import { Reveal } from '../components/motion.jsx';
import { StarIcon, PhoneIcon } from '../components/Icons.jsx';

export default function Reviews() {
  return (
    <section id="reviews" className="section reviews">
      <div className="container">
        <Reveal className="section-head section-head--center">
          <p className="eyebrow">Reviews</p>
          <h2 className="h2">Words from <em>our neighbors.</em></h2>
        </Reveal>

        {REVIEWS.length > 0 ? (
          <div className="reviews__rail">
            {REVIEWS.map((r, i) => (
              <Reveal as="figure" key={r.name + i} delay={i * 90} className="review">
                <div className="review__stars" aria-label={`${r.stars} out of 5 stars`}>
                  {Array.from({ length: r.stars }).map((_, k) => <StarIcon key={k} width={16} height={16} />)}
                </div>
                <blockquote className="review__text">“{r.text}”</blockquote>
                <figcaption className="review__who">{r.name}<span> · {r.source}</span></figcaption>
              </Reveal>
            ))}
          </div>
        ) : (
          // TODO: add real Google reviews to REVIEWS in src/data/site.js — this card disappears automatically.
          <Reveal className="review-empty">
            <span className="review-empty__ornament" aria-hidden="true"><StarIcon width={22} height={22} /></span>
            <p className="review-empty__title">New for this season in Irvine</p>
            <p className="review-empty__text">
              Reviews from Irvine homeowners will appear here as this season's installs light up.
              Want to talk through a design before you book? We're happy to help.
            </p>
            <a href={BUSINESS.phoneHref} className="btn btn--ghost"><PhoneIcon width={18} height={18} /> Call {BUSINESS.phoneDisplay}</a>
          </Reveal>
        )}
      </div>
    </section>
  );
}
