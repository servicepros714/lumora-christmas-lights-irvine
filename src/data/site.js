// ─────────────────────────────────────────────────────────────
// Lumora Christmas Lights Irvine — all editable business content
// ─────────────────────────────────────────────────────────────

export const BUSINESS = {
  name: 'Lumora Christmas Lights Irvine',
  shortName: 'Lumora',
  city: 'Irvine',
  region: 'CA',
  phoneDisplay: '657-577-2597',
  phoneHref: 'tel:+16575772597',
  // TODO: add a public email if you want one shown in the footer
  email: '',
  source: 'lumora-irvine',
};

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// Shown wherever a price has not been set yet (applies to every Christmas light site)
export const UNSET_PRICE_LABEL = 'Online quoting';

export const DEPOSIT = 149;

export const SEASON = {
  start: { month: 10, day: 20 }, // Oct 20
  end: { month: 12, day: 20 }, // Dec 20
  leadHours: 48,
  timeSlots: ['8AM–12PM', '12PM–4PM'], // en dash — must match D1 values
};

// Set price to a number (e.g. 499) to show "Starting at $499"; null shows "Online quoting".
export const PACKAGES = [
  {
    id: 'front',
    name: 'Front Only',
    price: null,
    tagline: 'A finished, glowing face for the street.',
  },
  {
    id: 'front-sides',
    name: 'Front & Sides',
    price: null,
    tagline: 'Wrap the light around the corners for a fuller look.',
    featured: true,
  },
];

// Comparison table rows — `in` lists the package ids that include the feature
export const FEATURES = [
  { label: 'Professional design for the front of the home', in: ['front', 'front-sides'] },
  { label: 'Commercial-grade LED lights (leased, no purchase needed)', in: ['front', 'front-sides'] },
  { label: 'Roofline & gutter-line installation', in: ['front', 'front-sides'] },
  { label: 'Timer setup', in: ['front', 'front-sides'] },
  { label: 'In-season maintenance & bulb replacement', in: ['front', 'front-sides'] },
  { label: 'Takedown after the holidays', in: ['front', 'front-sides'] },
  { label: 'Side rooflines & gutters', in: ['front-sides'] },
  { label: 'Expanded custom design', in: ['front-sides'] },
];

// type: 'percent' = % of package price, 'flat' = +$, 'fixed' = $ (replaces package lights)
export const ADDONS = [
  { id: 'trees', label: 'Tree & bush wrapping', short: 'Tree wrap', type: 'flat', price: null },
  { id: 'wreaths', label: 'Wreaths / garland', short: 'Wreaths', type: 'flat', price: null },
  { id: 'pathway', label: 'Pathway / stake lights', short: 'Pathway', type: 'flat', price: null },
  { id: 'own-lights', label: 'Install customer-owned lights', short: 'Own lights', type: 'fixed', price: null },
  { id: 'storage', label: 'Off-season storage', short: 'Storage', type: 'flat', price: null },
];

export const TWO_STORY_PERCENT = 50;

export const STEPS_HOW = [
  { n: '01', title: 'Book', text: 'Pick your package, home details and an install window online. A $149 reservation deposit holds your date and comes off your final invoice.' },
  { n: '02', title: 'Design', text: 'We walk the property with you, plan the rooflines, colors and accents, and confirm your final price on site.' },
  { n: '03', title: 'Install', text: 'Our crew hangs commercial-grade LED lights on clips, sets your timer, and tests every run before we leave.' },
  { n: '04', title: 'Takedown', text: 'After the holidays we come back, take everything down and haul it away. Nothing to store, nothing to untangle.' },
];

// Gallery — layout slots g1 (large) … g6 are fixed by id. TODO: replace with real Lumora night install photos.
// Drop files in /public/gallery/ and set `src` (e.g. '/gallery/turtle-rock-roofline.jpg').
// Items without `src` render a styled night-scene illustration of that lighting style.
export const GALLERY = [
  { id: 'g1', src: '/images/lumora-house-wide.webp', title: 'Warm-white roofline & entry', note: 'Lumora brand artwork', size: 'wide', scene: null },
  { id: 'g2', src: '', title: 'Palm trunk wraps', note: 'Lighting style', size: 'tall', scene: 'palms' },
  { id: 'g3', src: '', title: 'Multicolor C9 eaves', note: 'Lighting style', size: 'square', scene: 'multicolor' },
  { id: 'g4', src: '', title: 'Two-story gables', note: 'Lighting style', size: 'square', scene: 'twostory' },
  { id: 'g5', src: '', title: 'Spanish-tile ranch', note: 'Lighting style', size: 'wide', scene: 'ranch' },
  { id: 'g6', src: '/images/lumora-house-door.webp', title: 'Wreath & doorway glow', note: 'Lumora brand artwork', size: 'square', scene: null },
];

// Reviews — TODO: paste real Google reviews here as { name, text, stars, source: 'Google' }.
// Never add made-up reviews. While empty, the section shows a neutral "new this season" card.
export const REVIEWS = [];

// Service area — Irvine villages + nearby cities. Edit freely.
export const IRVINE_VILLAGES = [
  'Woodbridge', 'Northwood', 'Turtle Rock', 'Quail Hill', 'Portola Springs', 'Great Park',
  'Orchard Hills', 'Westpark', 'University Park', 'Shady Canyon', 'Woodbury', 'Stonegate',
  'Cypress Village', 'Eastwood',
];
export const NEARBY_CITIES = ['Tustin', 'Newport Beach', 'Newport Coast', 'Costa Mesa', 'Santa Ana', 'Orange'];

export const FAQS = [
  {
    q: 'Do I need special outlets or extra power?',
    a: 'Usually not. Modern LED strands draw very little power, so most homes run on existing exterior outlets. During the design visit we map every run to an outlet and make sure no circuit is overloaded. If a section has no nearby outlet, we will talk through options before installing.',
  },
  {
    q: 'Do I lease the lights or own them?',
    a: 'Our packages use commercial-grade LED lights that we lease to you for the season — no purchase, no storage, no tangled boxes in the garage. If you already own lights you love, choose the "Install customer-owned lights" add-on and we will hang yours instead.',
  },
  {
    q: 'How do the timers work?',
    a: 'Every install includes timer setup. We set your lights to come on at dusk and turn off at the time you choose, so the display runs itself all season.',
  },
  {
    q: 'What happens if it rains or gets windy?',
    a: 'We use outdoor-rated lights and clip-on mounting made for Southern California weather. If a bulb or strand stops working during the season, in-season maintenance is included — just call and we will come fix it. If weather makes an install day unsafe, we will reach out to reschedule.',
  },
  {
    q: 'When do you take the lights down?',
    // TODO: confirm the takedown window you want to promise
    a: 'Takedown is scheduled after the holidays. We confirm your takedown window when we install, and our crew removes everything — you never touch a ladder.',
  },
  {
    q: 'How does the $149 deposit work?',
    a: 'The reservation deposit holds your install date and time window, and the full $149 is applied to your final invoice. Prefer to settle up in person? Choose "I\'ll pay at the visit" at checkout.',
  },
  {
    q: 'How is the final price set?',
    a: 'Prices on the site are starting points. Your final price is confirmed at the on-site visit once we see your rooflines, home height and any add-ons.',
  },
];
