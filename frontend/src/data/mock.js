// Linderudkollen Sportsstue - Central Mock Data
// All content can be easily replaced with backend API data later

export const siteInfo = {
  name: 'Linderudkollen',
  fullName: 'Linderudkollen Sportsstue',
  tagline: 'Hjemmelaget mat og peiskos i hjertet av Lillomarka',
  description: 'Sentralt utgangspunkt for turer i Lillomarka, med hjemmelaget mat og peiskos.',
  owners: 'Martina Mercellova & Fritz Andre Hammerstrøm',
  phone: '944 78 021',
  phoneRaw: '94478021',
  email: 'mmercellova@gmail.com',
  facebook: 'https://www.facebook.com/profile.php?id=100057194900966',
  address: {
    line1: 'Linderudkollen Sportsstue',
    line2: 'Lillomarka, Oslo',
  },
};

export const heroContent = {
  heading: 'Linderudkollen',
  subheading: 'Sportsstue i hjertet av Lillomarka',
  description: 'Hjemmelaget surdeig, peiskos og frisk skogsluft — velkommen inn!',
  ctaPrimary: 'Se åpningstider',
  ctaSecondary: 'Se menyen',
  backgroundImage: '/hero.jpg',
};

export const aboutContent = {
  title: 'Velkommen til Linderudkollen',
  paragraphs: [
    'Linderudkollen Sportsstue ligger sørvest i Lillomarka, og er et sentralt utgangspunkt for turer i området. Stedet har en lang historie — Linderudkollen var en av de siste stølene i Akersdalen, og driften ble lagt ned omkring 1930.',
    'På selveste Valentinsdagen 2026 gjenåpnet sportsstuen med nye bestyrere: Martina og Fritz. De møttes i sin tid på Ullevålseter — hun som ansatt, han som gjest — og deler en felles kjærlighet til marka og god, hjemmelaget mat.',
    'Stua er nyoppgradert med storkjøkken, nye kaffemaskiner og nyrestaurerte møbler. Enten du kommer til fots, på ski, sykkel eller med barnevogn — dørene står åpne for alle.',
  ],
  image: 'https://images.unsplash.com/photo-1758116448135-e989799305da?w=800&q=80',
  features: [
    {
      icon: 'bread',
      title: 'Surdeigsbakst',
      description: 'Hjertet på kjøkkenet — påsmurt brød eller ta med hjem',
    },
    {
      icon: 'clock',
      title: 'Gjenåpnet 2026',
      description: 'Nyoppgradert stue med nytt storkjøkken og interiør',
    },
    {
      icon: 'users',
      title: 'Plass til alle',
      description: 'Familier, turgjengere, barnevogner — alle er velkomne',
    },
    {
      icon: 'mapPin',
      title: 'Lillomarka',
      description: 'Lett tilgjengelig med stor parkeringsplass hele året',
    },
  ],
};

export const menuContent = {
  title: 'Meny & Tilbud',
  subtitle: 'Alt laget fra bunnen, på huset',
  items: [
    {
      icon: 'wheat',
      title: 'Surdeigsbakst',
      description: 'Nybakt surdeig hver dag — få det påsmurt eller kjøp med hjem',
    },
    {
      icon: 'soup',
      title: 'Kraftsupper',
      description: 'Varme, næringsrike supper laget fra bunnen',
    },
    {
      icon: 'coffee',
      title: 'Vafler & Kanelsnurrer',
      description: 'Klassiske norske favoritter, ferske fra kjøkkenet',
    },
    {
      icon: 'apple',
      title: 'Fruktsmoothies',
      description: 'Friske smoothies med sesongens frukter',
    },
    {
      icon: 'leafy',
      title: 'Glutenfritt',
      description: 'Eget glutenfritt tilbud tilgjengelig',
    },
    {
      icon: 'cup',
      title: 'Kaffe & Te',
      description: 'Nytt kaffemaskiner med et godt utvalg',
    },
  ],
  image: 'https://images.unsplash.com/photo-1564529726702-e1cb05b106b3?w=800&q=80',
};

export const activitiesContent = {
  title: 'Aktiviteter & Fasiliteter',
  subtitle: 'Mer enn bare en kafé',
  activities: [
    {
      icon: 'flame',
      title: 'Peiskos',
      description: 'Sett deg godt til rette foran peisen med en kopp kakao',
    },
    {
      icon: 'scissors',
      title: 'Strikkekafé',
      description: 'Bli med på strikkekafé i hyggelige omgivelser',
    },
    {
      icon: 'laptop',
      title: 'Skogskontor',
      description: 'Jobb hjemmefra — eller rettere sagt, fra skogen!',
    },
    {
      icon: 'baby',
      title: 'Familievennlig',
      description: 'Barnekrok og barsel-sone — vi tar godt imot de minste og nybakte foreldre',
    },
    {
      icon: 'wheat-off',
      title: 'Glutenfrie alternativer',
      description: 'Vi tilbyr glutenfrie alternativer på mye av menyen — spør oss gjerne!',
    },
    {
      icon: 'sun',
      title: 'Uteområde',
      description: 'Hent maten inne og nyt den i sola på våre fine uteområder — perfekt etter en tur i marka',
    },
  ],
};

export const openingHours = {
  title: 'Åpningstider',
  period: '16.02.2026 — 21.06.2026',
  schedule: [
    { day: 'Mandag', hours: 'Stengt', closed: true },
    { day: 'Tirsdag', hours: '10:00 — 20:00' },
    { day: 'Onsdag', hours: '10:00 — 20:00' },
    { day: 'Torsdag', hours: '10:00 — 20:00' },
    { day: 'Fredag', hours: '10:00 — 20:00' },
    { day: 'Lørdag', hours: '10:00 — 16:00' },
    { day: 'Søndag', hours: '10:00 — 16:00' },
  ],
  notices: [
    'For oppdaterte åpningstider, sjekk vår Facebook-side',
    'Kveldsåpent tirsdag til fredag med utvidede tider',
    'Helårsvei med stor parkeringsplass',
  ],
  footerNote: 'Sjekk Facebook for eventuelle endringer i åpningstider',
};


export const defaultOpeningHours = {
  id: 'current',
  period: '16.02.2026 — 21.06.2026',
  schedule: [
    { day: 'Mandag',  hours: 'Stengt',        closed: true  },
    { day: 'Tirsdag', hours: '10:00 — 20:00', closed: false },
    { day: 'Onsdag',  hours: '10:00 — 20:00', closed: false },
    { day: 'Torsdag', hours: '10:00 — 20:00', closed: false },
    { day: 'Fredag',  hours: '10:00 — 20:00', closed: false },
    { day: 'Lørdag',  hours: '10:00 — 16:00', closed: false },
    { day: 'Søndag',  hours: '10:00 — 16:00', closed: false },
  ],
  notices: [
    'For oppdaterte åpningstider, sjekk vår Facebook-side',
    'Kveldsåpent tirsdag til fredag med utvidede tider',
    'Helårsvei med stor parkeringsplass',
  ],
  footer_note: 'Sjekk Facebook for eventuelle endringer i åpningstider',
};

export const defaultMenuCategories = ['Bakst', 'Varm mat', 'Drikke', 'Spesielt'];

export const defaultMenuItems = [
  { id: 'ex-1',  category: 'Bakst',    name: 'Surdeigbrød, påsmurt',     description: 'Hjemmelaget surdeig med smør og pålegg',    price: 79,   is_available: true, sort_order: 1 },
  { id: 'ex-2',  category: 'Bakst',    name: 'Surdeigbrød, ta med hjem', description: 'Helt brød til å ta med',                   price: 89,   is_available: true, sort_order: 2 },
  { id: 'ex-3',  category: 'Bakst',    name: 'Kanelsnurr',               description: 'Klassisk nybakt kanelsnurr',               price: 49,   is_available: true, sort_order: 3 },
  { id: 'ex-4',  category: 'Bakst',    name: 'Vaffel m/ syltetøy',       description: 'Norsk vaffel med syltetøy og rømme',       price: 59,   is_available: true, sort_order: 4 },
  { id: 'ex-5',  category: 'Varm mat', name: 'Dagens kraftsuppe',        description: 'Varm, næringsrik suppe laget fra bunnen',  price: 119,  is_available: true, sort_order: 1 },
  { id: 'ex-6',  category: 'Drikke',   name: 'Kaffe',                    description: 'Nybrygget filterkaffe',                    price: 39,   is_available: true, sort_order: 1 },
  { id: 'ex-7',  category: 'Drikke',   name: 'Kakao',                    description: 'Varm kakao med krem',                      price: 49,   is_available: true, sort_order: 2 },
  { id: 'ex-8',  category: 'Drikke',   name: 'Te',                       description: 'Utvalg av te-sorter',                      price: 39,   is_available: true, sort_order: 3 },
  { id: 'ex-9',  category: 'Drikke',   name: 'Fruktsmoothie',            description: 'Frisk smoothie med sesongens frukter',     price: 69,   is_available: true, sort_order: 4 },
  { id: 'ex-10', category: 'Spesielt', name: 'Glutenfritt alternativ',   description: 'Spør oss om dagens glutenfrie tilbud',     price: null, is_available: true, sort_order: 1 },
];

// Build the categories/items structure the API normally returns
function buildDefaultMenuData() {
  const categories = {};
  defaultMenuItems.forEach(item => {
    if (!categories[item.category]) categories[item.category] = [];
    categories[item.category].push(item);
  });
  return { items: defaultMenuItems, categories };
}
export const defaultMenuData = buildDefaultMenuData();

export const navLinks = [
  { id: 'meny',          label: 'Meny',        path: '/meny' },
  { id: 'aktiviteter',   label: 'Aktiviteter' },
  { id: 'apningstider',  label: 'Åpningstider' },
  { id: 'arrangement',   label: 'Arrangement',  path: '/arrangement' },
  { id: 'blogg',         label: 'Blogg',        path: '/blogg' },
  { id: 'kontakt',       label: 'Kontakt' },
];
