import { useId, useMemo } from 'react';

/**
 * Illustrated night-install scenes in the Lumora palette.
 * Used as stand-ins until real install photos are added (see GALLERY in src/data/site.js).
 */

const WARM = ['#FFE7A8', '#FCBE44', '#FFD978'];
const MULTI = ['#DD1416', '#0CBE5D', '#FCBE44', '#3D7BFF', '#DD1416', '#0CBE5D'];

function rng(seed) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/** evenly spaced points along a polyline */
function along(points, step) {
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, y1] = points[i];
    const [x2, y2] = points[i + 1];
    const len = Math.hypot(x2 - x1, y2 - y1);
    const n = Math.max(1, Math.round(len / step));
    for (let k = 0; k < n; k++) out.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
  }
  out.push(points[points.length - 1]);
  return out;
}

function Bulbs({ pts, colors, r = 3.4, glow }) {
  return (
    <g filter={`url(#${glow})`}>
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={r} fill={colors[i % colors.length]} />
      ))}
    </g>
  );
}

function Palm({ x, base, h, lean = 0, glow, lit = true }) {
  const topX = x + lean;
  const topY = base - h;
  const trunk = `M${x - 6} ${base} Q ${x + lean * 0.4 - 4} ${base - h / 2} ${topX - 3} ${topY} L ${topX + 3} ${topY} Q ${x + lean * 0.4 + 4} ${base - h / 2} ${x + 6} ${base} Z`;
  const fronds = [-160, -130, -100, -70, -40, -15, 15, 40].map((a, i) => {
    const rad = (a * Math.PI) / 180;
    const len = 58 + (i % 3) * 10;
    const ex = topX + Math.cos(rad) * len;
    const ey = topY + Math.sin(rad) * len * 0.55 + 22;
    const cx = topX + Math.cos(rad) * len * 0.5;
    const cy = topY + Math.sin(rad) * len * 0.5 - 14;
    return `M${topX} ${topY} Q ${cx} ${cy} ${ex} ${ey}`;
  });
  const wrap = [];
  if (lit) {
    for (let t = 0.02; t < 0.98; t += 0.022) {
      const yy = base - h * t;
      const xx = x + lean * t * t * 0.9 + Math.sin(t * 60) * 5;
      wrap.push([xx, yy]);
    }
  }
  return (
    <g>
      <path d={trunk} fill="#1b130d" />
      {fronds.map((d, i) => (
        <path key={i} d={d} stroke="#0c1a12" strokeWidth="7" fill="none" strokeLinecap="round" />
      ))}
      {lit && <Bulbs pts={wrap} colors={WARM} r={2.6} glow={glow} />}
    </g>
  );
}

function Sky({ id, stars = 26, seed = 7 }) {
  const r = rng(seed);
  const pts = Array.from({ length: stars }, () => [r() * 600, r() * 260, r() * 1.4 + 0.4]);
  return (
    <>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#04060D" />
          <stop offset="0.42" stopColor="#0B1A45" />
          <stop offset="0.66" stopColor="#24205a" />
          <stop offset="0.8" stopColor="#9D4B6A" />
          <stop offset="0.9" stopColor="#E0805E" />
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill={`url(#${id}-sky)`} />
      {pts.map(([x, y, s], i) => (
        <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r={s.toFixed(2)} fill="#FDEAA0" opacity={0.35 + (i % 4) * 0.15} />
      ))}
      <path d="M0 420 L90 368 L150 392 L240 340 L330 386 L410 352 L500 392 L600 362 L600 470 L0 470 Z" fill="#141a52" opacity="0.85" />
    </>
  );
}

function House({ kind, glow }) {
  if (kind === 'twostory') {
    const roof = [[120, 300], [300, 190], [480, 300]];
    const lower = [[80, 400], [130, 360], [470, 360], [520, 400]];
    return (
      <g>
        <rect x="140" y="292" width="320" height="200" fill="#e8dcc4" />
        <polygon points="120,300 300,190 480,300" fill="#2a2430" />
        <rect x="90" y="396" width="420" height="110" fill="#efe3c9" />
        <polygon points="80,400 130,360 470,360 520,400" fill="#2a2430" />
        {[[180, 320], [270, 320], [360, 320]].map(([x, y], i) => <rect key={i} x={x} y={y} width="50" height="34" fill="#FCBE44" opacity="0.88" />)}
        {[[130, 425], [400, 425]].map(([x, y], i) => <rect key={i} x={x} y={y} width="70" height="44" fill="#FFCF66" opacity="0.9" />)}
        <rect x="278" y="420" width="44" height="86" fill="#3a2316" />
        <Bulbs pts={along(roof, 9)} colors={WARM} glow={glow} />
        <Bulbs pts={along(lower, 9)} colors={WARM} glow={glow} />
      </g>
    );
  }
  if (kind === 'ranch') {
    const roof = [[40, 400], [170, 330], [300, 372], [430, 330], [560, 400]];
    return (
      <g>
        <rect x="60" y="392" width="480" height="114" fill="#efe1c3" />
        <polygon points="40,400 170,330 300,372 430,330 560,400" fill="#7a3a24" />
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => (
          <path key={i} d={`M${48 + i * 43} 400 q 21 -10 43 0`} stroke="#5b2a1a" strokeWidth="3" fill="none" opacity="0.6" />
        ))}
        {[[100, 425], [400, 425]].map(([x, y], i) => <path key={i} d={`M${x} ${y + 50} v-38 a 30 30 0 0 1 60 0 v38 z`} fill="#FFCF66" opacity="0.9" />)}
        <path d="M270 506 v-56 a 30 30 0 0 1 60 0 v56 z" fill="#3a2316" />
        <Bulbs pts={along(roof, 9)} colors={WARM} glow={glow} />
      </g>
    );
  }
  // classic single-story with gables
  const roof = [[60, 392], [180, 318], [300, 380], [380, 330], [540, 392]];
  return (
    <g>
      <rect x="80" y="386" width="440" height="120" fill="#ebe0c8" />
      <polygon points="60,392 180,318 300,380 380,330 540,392" fill="#2b2733" />
      {[[110, 420], [210, 420]].map(([x, y], i) => <rect key={i} x={x} y={y} width="60" height="46" fill="#FFCF66" opacity="0.9" />)}
      <rect x="360" y="410" width="130" height="96" fill="#3c2a22" />
      <rect x="290" y="416" width="40" height="90" fill="#3a2316" />
      <Bulbs pts={along(roof, 9)} colors={kind === 'multicolor' ? MULTI : WARM} r={kind === 'multicolor' ? 4.2 : 3.4} glow={glow} />
    </g>
  );
}

function Shrubs({ glow, colors = WARM, seed = 3 }) {
  const r = rng(seed);
  const bushes = [[70, 506, 48], [190, 512, 34], [430, 510, 40], [540, 506, 50]];
  return (
    <g>
      {bushes.map(([x, y, s], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx={s} ry={s * 0.62} fill="#0c2a1a" />
          <Bulbs pts={Array.from({ length: 12 }, () => [x + (r() - 0.5) * s * 1.6, y + (r() - 0.5) * s * 0.9])} colors={colors} r={2.2} glow={glow} />
        </g>
      ))}
    </g>
  );
}

export default function NightScene({ variant = 'classic', label }) {
  const raw = useId();
  const id = 'ns' + raw.replace(/[^a-zA-Z0-9]/g, '');
  const glow = `${id}-glow`;

  const content = useMemo(() => {
    switch (variant) {
      case 'palms':
        return (
          <>
            <Palm x={110} base={520} h={380} lean={-20} glow={glow} />
            <Palm x={470} base={520} h={420} lean={26} glow={glow} />
            <Palm x={300} base={540} h={300} lean={8} glow={glow} />
            <House kind="classic" glow={glow} />
            <Shrubs glow={glow} seed={11} />
          </>
        );
      case 'multicolor':
        return (
          <>
            <Palm x={540} base={520} h={300} lean={14} glow={glow} lit={false} />
            <House kind="multicolor" glow={glow} />
            <Shrubs glow={glow} colors={MULTI} seed={5} />
          </>
        );
      case 'twostory':
        return (
          <>
            <Palm x={50} base={520} h={360} lean={10} glow={glow} />
            <House kind="twostory" glow={glow} />
            <Shrubs glow={glow} seed={9} />
          </>
        );
      case 'ranch':
        return (
          <>
            <Palm x={560} base={520} h={340} lean={-16} glow={glow} />
            <Palm x={30} base={520} h={300} lean={12} glow={glow} />
            <House kind="ranch" glow={glow} />
            <Shrubs glow={glow} seed={21} />
          </>
        );
      default:
        return (
          <>
            <House kind="classic" glow={glow} />
            <Shrubs glow={glow} />
          </>
        );
    }
  }, [variant, glow]);

  return (
    <svg className="night-scene" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label || 'Illustration of a home with Christmas lights at night'}>
      <defs>
        <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <Sky id={id} seed={variant.length * 13 + 3} />
      <rect x="0" y="500" width="600" height="100" fill="#06090f" />
      {content}
      <rect x="0" y="540" width="600" height="60" fill="#05070c" opacity="0.7" />
    </svg>
  );
}
