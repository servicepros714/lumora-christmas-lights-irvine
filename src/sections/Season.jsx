import { Link } from 'react-router-dom';
import { SEASON } from '../data/site.js';
import { seasonWindow, pacificToday, toKey } from '../lib/booking.js';
import { Reveal } from '../components/motion.jsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayMs = 86400000;
const utc = (key) => { const [y, m, d] = key.split('-').map(Number); return Date.UTC(y, m - 1, d); };

/** Thanksgiving: 4th Thursday of November */
function thanksgivingKey(year) {
  const first = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const day = 1 + ((4 - first + 7) % 7) + 21;
  return toKey(year, 11, day);
}

export default function Season() {
  const { year, startKey, endKey } = seasonWindow();
  const t = pacificToday();
  const todayKey = toKey(t.y, t.m, t.d);
  const start = utc(startKey);
  const end = utc(endKey);
  const total = (end - start) / dayMs;
  const pos = (key) => Math.min(100, Math.max(0, ((utc(key) - start) / dayMs / total) * 100));

  const earliest = new Date(utc(todayKey) + Math.ceil(SEASON.leadHours / 24) * dayMs);
  const earliestKey = toKey(earliest.getUTCFullYear(), earliest.getUTCMonth() + 1, earliest.getUTCDate());

  const before = todayKey < startKey;
  const daysLeft = Math.max(0, Math.round((end - utc(todayKey)) / dayMs));
  const daysUntil = Math.max(0, Math.round((start - utc(todayKey)) / dayMs));
  const progress = before ? 0 : pos(todayKey);

  const edge = (x) => (x < 14 ? ' is-start' : x > 86 ? ' is-end' : '');

  const marks = [
    { key: startKey, label: `Season opens`, sub: `${MONTHS[SEASON.start.month - 1]} ${SEASON.start.day}` },
    { key: thanksgivingKey(year), label: 'Thanksgiving week', sub: 'Lights on before guests arrive' },
    { key: endKey, label: 'Last install day', sub: `${MONTHS[SEASON.end.month - 1]} ${SEASON.end.day}` },
  ];

  return (
    <section id="season" className="section season">
      <div className="container">
        <div className="season__grid">
          <Reveal className="season__copy">
            <p className="eyebrow">{year} season</p>
            <h2 className="h2">Book early, <em>glow longer.</em></h2>
            <p className="section-head__lede">
              We install from {MONTHS[SEASON.start.month - 1]} {SEASON.start.day} through {MONTHS[SEASON.end.month - 1]} {SEASON.end.day}, seven days a week,
              in two windows a day. The earlier your install, the more nights your home is lit — and the more dates there are to choose from.
            </p>
            <div className="season__count">
              <span className="season__big">{before ? daysUntil : daysLeft}</span>
              <span className="season__unit">{before ? 'days until the season opens' : 'days of install season left'}</span>
            </div>
            <Link to="/book" className="btn btn--gold">See open dates</Link>
          </Reveal>

          <Reveal className="timeline" delay={120} aria-label="Install season timeline">
            <div className="timeline__bar">
              <div className="timeline__fill" style={{ width: `${progress}%` }} />
              {!before && todayKey <= endKey && (
                <span className={`timeline__now${edge(pos(todayKey))}`} style={{ left: `${pos(todayKey)}%` }}>
                  <span className="timeline__now-label">Today</span>
                </span>
              )}
              {earliestKey >= startKey && earliestKey <= endKey && (
                <span className={`timeline__earliest${edge(pos(earliestKey))}`} style={{ left: `${pos(earliestKey)}%` }}>
                  <span className="timeline__earliest-label">Earliest open install</span>
                </span>
              )}
            </div>
            <ul className="timeline__marks">
              {marks.map((m) => (
                <li key={m.label} style={{ '--x': `${pos(m.key)}%` }}>
                  <span className="timeline__tick" />
                  <span className="timeline__label">{m.label}</span>
                  <span className="timeline__sub">{m.sub}</span>
                </li>
              ))}
            </ul>
            <div className="timeline__windows">
              {SEASON.timeSlots.map((s) => (
                <span key={s} className="chip">{s} window</span>
              ))}
              <span className="chip">Mon – Sun</span>
              <span className="chip">Book {SEASON.leadHours} hrs ahead</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
