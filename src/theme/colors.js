// src/theme/colors.js

/* ================================================================
   WCAG 2.1 AA KONTRAST & RENK ENTERPOLASYON YARDIMCILARI
   ================================================================ */
const parseHex = (hex) => {
  const clean = String(hex || '#000000').replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16) || 0,
    g: parseInt(clean.substring(2, 4), 16) || 0,
    b: parseInt(clean.substring(4, 6), 16) || 0,
  };
};

const toHex = (n) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0');

export const interpolateHex = (hex1, hex2, factor = 0.5) => {
  const t = Math.max(0, Math.min(1, factor));
  const c1 = parseHex(hex1);
  const c2 = parseHex(hex2);
  return `#${toHex(c1.r + (c2.r - c1.r) * t)}${toHex(c1.g + (c2.g - c1.g) * t)}${toHex(c1.b + (c2.b - c1.b) * t)}`;
};

const getLuminance = (hex) => {
  const { r: rawR, g: rawG, b: rawB } = parseHex(hex);
  const [r, g, b] = [rawR / 255, rawG / 255, rawB / 255].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
};

export const getContrastRatio = (hex1, hex2) => {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

/* ================================================================
   VARSAYILAN SABİTLER (Koyu: Grafen | Aydınlık: Fildişi | Renk: Türbe Yeşili)
   ================================================================ */
export const DEFAULT_LIGHT_THEME = 'light'; // Fildişi
export const DEFAULT_DARK_THEME = 'obsidian'; // Grafen
export const DEFAULT_ACCENT_COLOR = 'emerald'; // Türbe Yeşili

/* ================================================================
   VURGU RENKLERİ (ACCENT COLORS) - WCAG AA UYUMLU PALETLER
   ================================================================ */
export const ACCENT_COLORS = {
  /* --- Klasik & Geleneksel (Varsayılan: Türbe Yeşili / Emerald) --- */
  emerald: {
    id: 'emerald',
    name: 'Türbe Yeşili',
    primary: '#059669',
    dark: '#047857',
    light: '#A7F3D0',
    glow: 'rgba(5, 150, 105, 0.20)',
  },
  amber: {
    id: 'amber',
    name: 'Kehribar',
    primary: '#B88A32',
    dark: '#78350F',
    light: '#FDE68A',
    glow: 'rgba(184, 138, 50, 0.20)',
  },
  gold: {
    id: 'gold',
    name: 'Hilal Gold',
    primary: '#B88A32',
    dark: '#78350F',
    light: '#FDE68A',
    glow: 'rgba(184, 138, 50, 0.20)',
  },
  sapphire: {
    id: 'sapphire',
    name: 'Safir',
    primary: '#2563EB',
    dark: '#1E40AF',
    light: '#BFDBFE',
    glow: 'rgba(37, 99, 235, 0.20)',
  },
  teal: {
    id: 'teal',
    name: 'Gökyüzü',
    primary: '#0D9488',
    dark: '#115E59',
    light: '#99F6E4',
    glow: 'rgba(13, 148, 136, 0.20)',
  },

  /* --- Modern & Minimalist Pastel --- */
  nordic: {
    id: 'nordic',
    name: 'İskandinav Mavisi',
    primary: '#6366F1',
    dark: '#3730A3',
    light: '#EEF2FF',
    glow: 'rgba(99, 102, 241, 0.20)',
  },
  mint: {
    id: 'mint',
    name: 'Taze Nane',
    primary: '#059669',
    dark: '#047857',
    light: '#D1FAE5',
    glow: 'rgba(5, 150, 105, 0.20)',
  },
  coral: {
    id: 'coral',
    name: 'Mercan',
    primary: '#E11D48',
    dark: '#9F1239',
    light: '#FFE4E6',
    glow: 'rgba(225, 29, 72, 0.20)',
  },
  lavender: {
    id: 'lavender',
    name: 'Lavanta',
    primary: '#7C3AED',
    dark: '#5B21B6',
    light: '#EDE9FE',
    glow: 'rgba(124, 58, 237, 0.20)',
  },
  peach: {
    id: 'peach',
    name: 'Şeftali',
    primary: '#EA580C',
    dark: '#9A3412',
    light: '#FFEDD5',
    glow: 'rgba(234, 88, 12, 0.20)',
  },

  /* --- Cyberpunk & Canlı Neon --- */
  electricCyan: {
    id: 'electricCyan',
    name: 'Elektrik Turkuaz',
    primary: '#0891B2',
    dark: '#164E63',
    light: '#CFFAFE',
    glow: 'rgba(8, 145, 178, 0.20)',
  },
  neonPurple: {
    id: 'neonPurple',
    name: 'Neon Mor',
    primary: '#9333EA',
    dark: '#581C87',
    light: '#F3E8FF',
    glow: 'rgba(147, 51, 234, 0.20)',
  },
  sunsetOrange: {
    id: 'sunsetOrange',
    name: 'Gün Batımı',
    primary: '#D97706',
    dark: '#78350F',
    light: '#FFEDD5',
    glow: 'rgba(217, 119, 6, 0.20)',
  },
  emeraldGreen: {
    id: 'emeraldGreen',
    name: 'Siber Zümrüt',
    primary: '#059669',
    dark: '#064E3B',
    light: '#D1FAE5',
    glow: 'rgba(5, 150, 105, 0.20)',
  },

  /* --- Bozkır & Sıcak Toprak Tonları --- */
  bronze: {
    id: 'bronze',
    name: 'Tunç',
    primary: '#A15C26',
    dark: '#6B3912',
    light: '#E8C9A8',
    glow: 'rgba(161, 92, 38, 0.20)',
  },
  copper: {
    id: 'copper',
    name: 'Bakır',
    primary: '#B45309',
    dark: '#78350F',
    light: '#F0CFB3',
    glow: 'rgba(180, 83, 9, 0.20)',
  },
  clay: {
    id: 'clay',
    name: 'Kiremit',
    primary: '#C2410C',
    dark: '#7C2D12',
    light: '#F2C6B0',
    glow: 'rgba(194, 65, 12, 0.20)',
  },
  ruby: {
    id: 'ruby',
    name: 'Yakut',
    primary: '#BE123C',
    dark: '#881337',
    light: '#FECDD3',
    glow: 'rgba(190, 18, 60, 0.20)',
  },
  rose: {
    id: 'rose',
    name: 'Gül',
    primary: '#E11D48',
    dark: '#9F1239',
    light: '#FECDD3',
    glow: 'rgba(225, 29, 72, 0.20)',
  },
  saffron: {
    id: 'saffron',
    name: 'Safran',
    primary: '#D97706',
    dark: '#78350F',
    light: '#FDE68A',
    glow: 'rgba(217, 119, 6, 0.20)',
  },
  terracotta: {
    id: 'terracotta',
    name: 'Terrakota',
    primary: '#B94A28',
    dark: '#7A2C14',
    light: '#F5C7B5',
    glow: 'rgba(185, 74, 40, 0.20)',
  },

  /* --- Doğa & Orman Tonları --- */
  forest: {
    id: 'forest',
    name: 'Orman',
    primary: '#15803D',
    dark: '#14532D',
    light: '#BBF7D0',
    glow: 'rgba(21, 128, 61, 0.20)',
  },
  sage: {
    id: 'sage',
    name: 'Adaçayı',
    primary: '#476852',
    dark: '#2D4435',
    light: '#D6E2D9',
    glow: 'rgba(71, 104, 82, 0.20)',
  },
  moss: {
    id: 'moss',
    name: 'Yosun',
    primary: '#4D7C0F',
    dark: '#1A3A02',
    light: '#D9F99D',
    glow: 'rgba(77, 124, 15, 0.20)',
  },
  lime: {
    id: 'lime',
    name: 'Zeytin',
    primary: '#65A30D',
    dark: '#365314',
    light: '#D9F99D',
    glow: 'rgba(101, 163, 13, 0.20)',
  },

  /* --- Gece & Gökyüzü Tonları --- */
  midnight: {
    id: 'midnight',
    name: 'Gece',
    primary: '#2563EB',
    dark: '#1E3A8A',
    light: '#A7C4E3',
    glow: 'rgba(37, 99, 235, 0.20)',
  },
  indigo: {
    id: 'indigo',
    name: 'Çivit',
    primary: '#4338CA',
    dark: '#312E81',
    light: '#C7D2FE',
    glow: 'rgba(67, 56, 202, 0.20)',
  },
  ocean: {
    id: 'ocean',
    name: 'Okyanus',
    primary: '#0284C7',
    dark: '#0C4A6E',
    light: '#BAE6FD',
    glow: 'rgba(2, 132, 199, 0.20)',
  },
  violet: {
    id: 'violet',
    name: 'Erguvan',
    primary: '#7C3AED',
    dark: '#4C1D95',
    light: '#DDD6FE',
    glow: 'rgba(124, 58, 237, 0.20)',
  },
  plum: {
    id: 'plum',
    name: 'Mürdüm',
    primary: '#86198F',
    dark: '#500750',
    light: '#E8C5E2',
    glow: 'rgba(134, 25, 143, 0.20)',
  },

  /* --- Nötr & Zarif Tonlar --- */
  pearl: {
    id: 'pearl',
    name: 'İnci',
    primary: '#475569',
    dark: '#1E293B',
    light: '#E2E8F0',
    glow: 'rgba(71, 85, 105, 0.20)',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidyen',
    primary: '#334155',
    dark: '#0F172A',
    light: '#CBD5E1',
    glow: 'rgba(51, 65, 85, 0.20)',
  },
  cyan: {
    id: 'cyan',
    name: 'Turkuaz',
    primary: '#0891B2',
    dark: '#155E75',
    light: '#A5F3FC',
    glow: 'rgba(8, 145, 178, 0.20)',
  },
};

/* ================================================================
   TEMEL TEMALAR — VARSAYILANLAR: FİLDİŞİ (light) & GRAFEN (obsidian)
   ================================================================ */
export const BASE_THEMES = {
  light: {
    mode: 'light',
    name: 'Fildişi',
    icon: 'sunny-outline',
    desc: 'Varsayılan sıcak aydınlık',
    background: '#F7F3E8',
    surface: '#FFFDF7',
    surfaceElevated: '#F0EBDD',
    border: '#D8D0BA',
    text: '#172B23',
    textDim: '#3D4D45',
    textMuted: '#5C6C63',
    compatibleAccents: [
      'emerald', 'nordic', 'mint', 'coral', 'lavender', 'peach',
      'amber', 'gold', 'sapphire', 'teal',
      'bronze', 'copper', 'clay', 'ruby', 'rose', 'saffron', 'terracotta',
      'forest', 'sage', 'moss', 'lime',
      'indigo', 'violet', 'plum',
      'pearl', 'obsidian',
    ],
  },

  obsidian: {
    mode: 'obsidian',
    name: 'Grafen',
    icon: 'moon-outline',
    desc: 'Varsayılan koyu antrasit',
    background: '#0F1115',
    surface: '#181A20',
    surfaceElevated: '#22252D',
    border: '#2F333D',
    text: '#F4F4F5',
    textDim: '#A1A1AA',
    textMuted: '#71717A',
    compatibleAccents: [
      'emerald', 'nordic', 'mint', 'coral', 'lavender', 'peach',
      'electricCyan', 'neonPurple', 'sunsetOrange', 'emeraldGreen',
      'sapphire', 'teal',
      'ruby', 'rose', 'saffron',
      'sage', 'moss',
      'midnight', 'indigo', 'ocean', 'violet', 'plum',
      'pearl', 'obsidian', 'cyan',
    ],
  },

  modernLight: {
    mode: 'modernLight',
    name: 'Modern Açık',
    icon: 'sunny-outline',
    desc: 'Minimalist beyaz',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceElevated: '#F1F5F9',
    border: '#CBD5E1',
    text: '#0F172A',
    textDim: '#334155',
    textMuted: '#475569',
  },

  sepia: {
    mode: 'sepia',
    name: 'Sepya',
    icon: 'book-outline',
    desc: 'Eski el yazması',
    background: '#F2E8D5',
    surface: '#FAF3E4',
    surfaceElevated: '#E8DCC3',
    border: '#C7B594',
    text: '#2C1E12',
    textDim: '#4A3728',
    textMuted: '#6B5540',
  },

  sand: {
    mode: 'sand',
    name: 'Kum',
    icon: 'hourglass-outline',
    desc: 'Çöl sıcaklığı',
    background: '#EDE4D3',
    surface: '#F7EFE0',
    surfaceElevated: '#E0D2B8',
    border: '#BCA883',
    text: '#241A10',
    textDim: '#423223',
    textMuted: '#614E3D',
  },

  carbonNight: {
    mode: 'carbonNight',
    name: 'Gece Karbonu',
    icon: 'moon-outline',
    desc: 'Derin modern koyu',
    background: '#111318',
    surface: '#181B22',
    surfaceElevated: '#21252E',
    border: '#2C323D',
    text: '#FAFAFA',
    textDim: '#D1D5DB',
    textMuted: '#9CA3AF',
  },

  dark: {
    mode: 'dark',
    name: 'Slate Koyu',
    icon: 'ellipse-outline',
    desc: 'Modern koyu gri',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceElevated: '#334155',
    border: '#475569',
    text: '#F8FAFC',
    textDim: '#CBD5E1',
    textMuted: '#94A3B8',
  },

  charcoal: {
    mode: 'charcoal',
    name: 'Titanyum',
    icon: 'hardware-chip-outline',
    desc: 'Nötr düz koyu',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceElevated: '#282828',
    border: '#3D3D3D',
    text: '#FFFFFF',
    textDim: '#CCCCCC',
    textMuted: '#A0A0A0',
  },

  midnight: {
    mode: 'midnight',
    name: 'Gece Yarısı',
    icon: 'cloudy-night-outline',
    desc: 'Lacivert gökyüzü',
    background: '#0A1128',
    surface: '#131E3A',
    surfaceElevated: '#1E2C4F',
    border: '#324570',
    text: '#FFFFFF',
    textDim: '#CBD5E1',
    textMuted: '#94A3B8',
  },

  cyber: {
    mode: 'cyber',
    name: 'Siber',
    icon: 'sparkles-outline',
    desc: 'Derin mor gece',
    background: '#0D0B18',
    surface: '#161329',
    surfaceElevated: '#231E42',
    border: '#453C7D',
    text: '#FFFFFF',
    textDim: '#D0C9EC',
    textMuted: '#9B91C9',
    widget: {
      gold: '#C084FC',
      goldSoft: '#7E22CE',
      goldBright: '#E9D5FF',
    },
  },

  oled: {
    mode: 'oled',
    name: 'OLED',
    icon: 'phone-portrait-outline',
    desc: 'Saf siyah',
    background: '#000000',
    surface: '#121212',
    surfaceElevated: '#1C1C1C',
    border: '#333333',
    text: '#FFFFFF',
    textDim: '#D4D4D4',
    textMuted: '#A3A3A3',
  },
};

/* ================================================================
   GÜNÜN SAATİNE GÖRE KADEMELİ DİNAMİK TEMA HESAPLAYICI
   - 05:30 - 07:30: Grafen -> Fildişi (Şafak / Sabah Aydınlanması)
   - 07:30 - 16:30: Tam Fildişi (Gündüz Aydınlık)
   - 16:30 - 18:30: Fildişi -> Sıcak İkindi/Gün Batımı Tonu (Kademeli Kısılma)
   - 18:30 - 20:00: Gün Batımı -> Grafen (Akşam Kararması)
   - 20:00 - 05:30: Tam Grafen (Gece Koyu)
   ================================================================ */
const blendBaseThemes = (themeA, themeB, ratio, modeLabel = 'dynamic') => {
  const bg = interpolateHex(themeA.background, themeB.background, ratio);
  const isLight = getLuminance(bg) > 0.42;
  // Metin kontrastını korumak için geçiş eşiğinde keskin ama güvenli metin rengi
  const textSource = isLight ? BASE_THEMES.light : BASE_THEMES.obsidian;

  return {
    mode: modeLabel,
    name: 'Dinamik',
    icon: 'contrast-outline',
    desc: 'Günün saatine göre otomatik',
    background: bg,
    surface: interpolateHex(themeA.surface, themeB.surface, ratio),
    surfaceElevated: interpolateHex(themeA.surfaceElevated, themeB.surfaceElevated, ratio),
    border: interpolateHex(themeA.border, themeB.border, ratio),
    text: textSource.text,
    textDim: textSource.textDim,
    textMuted: textSource.textMuted,
  };
};

export const resolveDynamicBaseTheme = (date = new Date()) => {
  const hours = date.getHours() + date.getMinutes() / 60;
  const ivory = BASE_THEMES[DEFAULT_LIGHT_THEME]; // Fildişi
  const graphene = BASE_THEMES[DEFAULT_DARK_THEME]; // Grafen
  const duskWarm = BASE_THEMES.sand; // Gün batımı ara sıcak tonu

  // 1. Şafak Aydınlanması (05:30 -> 07:30)
  if (hours >= 5.5 && hours < 7.5) {
    const progress = (hours - 5.5) / 2.0;
    return blendBaseThemes(graphene, ivory, progress);
  }

  // 2. Tam Gündüz (07:30 -> 16:30) -> Fildişi
  if (hours >= 7.5 && hours < 16.5) {
    return { ...ivory, mode: 'dynamic' };
  }

  // 3. İkindi / Gün Batımı Yumuşak Kısılma (16:30 -> 18:30)
  if (hours >= 16.5 && hours < 18.5) {
    const progress = (hours - 16.5) / 2.0;
    return blendBaseThemes(ivory, duskWarm, progress);
  }

  // 4. Akşam Kararması (18:30 -> 20:00)
  if (hours >= 18.5 && hours < 20.0) {
    const progress = (hours - 18.5) / 1.5;
    return blendBaseThemes(duskWarm, graphene, progress);
  }

  // 5. Gece (20:00 -> 05:30) -> Grafen
  return { ...graphene, mode: 'dynamic' };
};

/* ================================================================
   OTOMATİK TÜRETİLEN LİSTELER & MATRİSLER
   ================================================================ */
export const THEME_MODES = [
  { id: 'dynamic', name: 'Dinamik', icon: 'contrast-outline', desc: 'Günün saatine göre otomatik' },
  ...Object.entries(BASE_THEMES).map(([id, theme]) => ({
    id,
    name: theme.name || id,
    icon: theme.icon || 'color-palette-outline',
    desc: theme.desc || '',
  })),
];

export const VALID_THEME_MODES = THEME_MODES.map((t) => t.id);

export const VALID_WIDGET_THEME_MODES = ['auto', ...Object.keys(BASE_THEMES)];

export const THEME_ACCENT_COMPAT = Object.entries(BASE_THEMES).reduce(
  (acc, [id, theme]) => {
    acc[id] = Array.isArray(theme.compatibleAccents) ? theme.compatibleAccents : null;
    return acc;
  },
  { dynamic: null }
);

/* ================================================================
   WIDGET PALETİ — Varsayılan Koyu: Grafen (obsidian)
   ================================================================ */
export const getWidgetPalette = (themeMode = 'auto') => {
  const mode = themeMode === 'auto' ? DEFAULT_DARK_THEME : themeMode;
  const base = BASE_THEMES[mode] || BASE_THEMES[DEFAULT_DARK_THEME];
  const isLight = getLuminance(base.background) > 0.45;

  return {
    bg: base.background,
    surface: base.surface,
    surfaceElevated: base.surfaceElevated,
    border: base.border,
    text: base.text,
    textDim: base.textDim,
    textMuted: base.textMuted,
    gold: isLight ? '#047857' : '#10B981',
    goldSoft: isLight ? '#065F46' : '#059669',
    goldBright: isLight ? '#059669' : '#34D399',
    error: isLight ? '#B91C1C' : '#F87171',
    ...(base.widget || {}),
  };
};

/* ================================================================
   TEMA OLUŞTURUCU (BUILDER)
   - Varsayılan Koyu: Grafen (obsidian)
   - Varsayılan Aydınlık: Fildişi (light)
   - Varsayılan Renk: Türbe Yeşili (emerald)
   ================================================================ */
export const buildTheme = (
  themeMode = 'dynamic',
  accentId = DEFAULT_ACCENT_COLOR,
  now = new Date()
) => {
  let base;
  if (themeMode === 'dynamic') {
    base = resolveDynamicBaseTheme(now);
  } else {
    base = BASE_THEMES[themeMode] || BASE_THEMES[DEFAULT_DARK_THEME];
  }

  const accent = ACCENT_COLORS[accentId] || ACCENT_COLORS[DEFAULT_ACCENT_COLOR];
  const isLightTheme = getLuminance(base.background) > 0.42;
  const primaryColor = isLightTheme ? accent.dark : accent.primary;

  const { compatibleAccents: _c, widget: _w, ...cleanBase } = base;

  return {
    ...cleanBase,
    isLight: isLightTheme,
    primary: primaryColor,
    primaryDark: accent.dark,
    primaryLight: accent.light,
    primaryGlow: accent.glow,
  };
};

/* ================================================================
   VURGU RENGİ GRUPLARI
   ================================================================ */
export const ACCENT_GROUPS = [
  {
    name: 'Klasik',
    ids: ['emerald', 'amber', 'gold', 'sapphire', 'teal'],
  },
  {
    name: 'Modern Pastel',
    ids: ['nordic', 'mint', 'coral', 'lavender', 'peach'],
  },
  {
    name: 'Neon & Canlı',
    ids: ['electricCyan', 'neonPurple', 'sunsetOrange', 'emeraldGreen'],
  },
  {
    name: 'Sıcak Toprak',
    ids: ['ruby', 'rose', 'clay', 'terracotta', 'saffron', 'copper'],
  },
  {
    name: 'Doğa',
    ids: ['forest', 'moss', 'sage', 'lime'],
  },
  {
    name: 'Gece & Derin',
    ids: ['midnight', 'indigo', 'violet', 'ocean', 'plum'],
  },
  {
    name: 'Nötr & Zarif',
    ids: ['pearl', 'obsidian', 'bronze', 'cyan'],
  },
];