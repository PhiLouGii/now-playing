/*
 * Artists allowed for each category.
 *
 * These lists define the boundaries of each category.
 * The actual songs are fetched dynamically from Deezer.
 */

export const CATEGORY_ARTISTS = {
  // ─────────────────────────────
  // ALL THINGS AFRICAN
  // ─────────────────────────────

  african: [
    // Afrobeats
    'Wizkid',
    'Davido',
    'Burna Boy',
    'Tems',
    'Rema',
    'Ayra Starr',
    'Fireboy DML',
    'Omah Lay',
    'CKay',
    'Yemi Alade',
    'Tiwa Savage',
    'Mr Eazi',
    'Patoranking',
    'Tekno',
    'Asake',
    'Joeboy',
    'Kizz Daniel',
    'Seyi Vibez',

    // East / Central Africa
    'Diamond Platnumz',
    'Harmonize',
    'Sauti Sol',
    'Bien',
    'Fally Ipupa',

    // South Africa
    'Tyla',
    'Sho Madjozi',
    'Nasty C',
    'Cassper Nyovest',
    'AKA',
    'Kabza De Small',
    'DJ Maphorisa',
    'Tyler ICU',
    'Uncle Waffles',
    'Focalistic',
    'Young Stunna',
    'Aymos',
    'Major League DJz',
    'Sha Sha',
    'DJ Zinhle',
    'Busiswa',
  ],

  // ─────────────────────────────
  // K-POP
  // ─────────────────────────────

  kpop: [
    'EXO',
    'MONSTA X',
    'GOT7',
    'BTS',
    'BLACKPINK',
    'Stray Kids',
    'TWICE',
    'SEVENTEEN',
    'Red Velvet',
    'NewJeans',
    'LE SSERAFIM',
    'aespa',
    'IVE',
    'ITZY',
    'ATEEZ',
    'SHINee',
  ],

  // ─────────────────────────────
  // DISNEY & NICK THROWBACKS
  // ─────────────────────────────
  //
  // This category is intentionally an artist pool.
  // The category service can later expand this with
  // soundtrack/title searches if needed.
  //

  'disney-nick': [
  // Disney Channel
  'Hannah Montana',
  'High School Musical',
  'Camp Rock',
  'The Cheetah Girls',
  'Teen Beach Movie',
  'Lemonade Mouth',
  'Wizards of Waverly Place',
  'That’s So Raven',
  'Shake It Up',
  'Sonny with a Chance',
  'Austin & Ally',
  'Liv and Maddie',
  'Phineas and Ferb',

  // Nickelodeon
  'iCarly',
  'Victorious',
  'Big Time Rush',
  'Zoey 101',
  'Drake & Josh',
  'The Naked Brothers Band',
  'Rags',
  'Spectacular!',
],

  // ─────────────────────────────
  // GIRL GROUPS
  // ─────────────────────────────

  'girl-groups': [
    // 90s / 2000s
    'Spice Girls',
    'Destiny’s Child',
    'TLC',
    'En Vogue',
    'Pussycat Dolls',
    'Sugababes',
    'Girls Aloud',
    'Atomic Kitten',

    // 2010s
    'Little Mix',
    'Fifth Harmony',
    'The Saturdays',
    'G.R.L.',

    // 2020s
    'KATSEYE',
  ],

  // ─────────────────────────────
  // BOY BANDS
  // ─────────────────────────────

  'boy-bands': [
    // 90s
    'Backstreet Boys',
    '*NSYNC',
    'Boyz II Men',
    'Westlife',
    '98 Degrees',
    'Take That',
    'All-4-One',
    '5ive',
    'New Kids on the Block',

    // 2000s
    'Jonas Brothers',
    'B2K',
    'Blue',
    'O-Town',

    // 2010s
    'One Direction',
    '5 Seconds of Summer',
    'Why Don’t We',
    'The Wanted',
    'Big Time Rush',
    'PRETTYMUCH',
    'The Vamps',
    'Mindless Behaviour',
    'New District',
  ],

  // ─────────────────────────────
  // INDIE & ALT
  // ─────────────────────────────

  'indie-alt': [
    // Core category artists
    'Yeah Yeah Yeahs',
    'Tame Impala',
    'MGMT',

    // Indie rock
    'The Strokes',
    'Arctic Monkeys',
    'The 1975',
    'Glass Animals',
    'The Killers',
    'Foster the People',
    'Franz Ferdinand',
    'The White Stripes',
    'Foals',
    'Vampire Weekend',
    'Two Door Cinema Club',
    'The Wombats',

    // Alternative
    'Radiohead',
    'Nirvana',
    'The Smashing Pumpkins',
    'Red Hot Chili Peppers',
    'Oasis',
    'Blur',
    'The Cranberries',
    'Weezer',
    'R.E.M.',

    // Indie / alternative pop
    'Lorde',
    'Lana Del Rey',
    'Hozier',
    'Phoebe Bridgers',
    'Mitski',
    'beabadoobee',
    'Girl in Red',
    'Dominic Fike',
    'Cigarettes After Sex',
    'Fontaines D.C.',
    'Wet Leg',
  ],

  // ─────────────────────────────
  // MICHAEL JACKSON
  // ─────────────────────────────

  'michael-jackson': [
    'Michael Jackson',
    'The Jackson 5',
    'The Jacksons',
  ],

  // ─────────────────────────────
  // BEYONCÉ
  // ─────────────────────────────

  beyonce: [
    'Beyoncé',
    'Destiny’s Child',
  ],

  // ─────────────────────────────
  // QUEEN
  // ─────────────────────────────

  queen: [
    'Queen',
  ],

  // ─────────────────────────────
  // ARIANA GRANDE
  // ─────────────────────────────

  'ariana-grande': [
    'Ariana Grande',
  ],
} as const
