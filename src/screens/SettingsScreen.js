// src/screens/SettingsScreen.js
import React, { useState, useMemo, useRef, useEffect, useCallback, memo, useContext } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  StatusBar,
  Alert as RNAlert,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
  Share,
  Platform,
  Linking,
  FlatList,
  KeyboardAvoidingView,
  BackHandler,
  Image,
} from 'react-native';
import * as ReactNative from 'react-native';

const InteractionManager =
  ReactNative.InteractionManager && typeof ReactNative.InteractionManager.runAfterInteractions === 'function'
    ? ReactNative.InteractionManager
    : {
        runAfterInteractions: (cb) => {
          const id = setTimeout(cb, 50);
          return { cancel: () => clearTimeout(id) };
        },
      };
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAppStore, useTheme } from '../store/useAppStore';
import { ACCENT_COLORS, ACCENT_GROUPS, THEME_MODES, BASE_THEMES } from '../theme/colors';
import { cancelPrayerNotifications } from '../services/prayerNotifications';
import { clearPrayerCache } from '../services/ummahApi';
import { clearUmmahContentCache } from '../services/ummahContentApi';
import { clearDiyanetCache } from '../services/diyanetApi';
import { clearHomeCache } from '../services/homePreloader';
import { MEAL_EDITIONS, getMealEditionName } from '../data/vakitContent';
import { QURAN_SOURCE_LIST, clearAllQuranCache } from '../services/quranReaderService';
import { ThemedSwitch } from '../components/ThemedSwitch';
import { TURKEY_CITIES, detectIsTurkey } from '../data/turkeyLocations';

/* ================================================================
   Uygulama Simgesi
   ================================================================ */
let APP_ICON_SOURCE = null;
try { APP_ICON_SOURCE = require('../../assets/icon.png'); } catch {}
if (!APP_ICON_SOURCE) {
  try { APP_ICON_SOURCE = require('../../assets/adaptive-icon.png'); } catch {}
}

const AppLogoBadge = memo(function AppLogoBadge({ size = 34, theme, hc }) {
  const radius = Math.round(size * 0.28);
  if (APP_ICON_SOURCE) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', backgroundColor: 'transparent' }}>
        <Image source={APP_ICON_SOURCE} style={{ width: '100%', height: '100%' }} resizeMode="cover" accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <View style={{
      width: size, height: size, borderRadius: radius,
      backgroundColor: hc ? theme.text : `${theme.primary}1F`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <MaterialCommunityIcons name="star-crescent" size={Math.round(size * 0.56)} color={hc ? theme.background : theme.primary} />
    </View>
  );
});

/* ================================================================
   Renk yardımcıları (tema sınıflandırma için)
   ================================================================ */
function hexToLuminance(hex) {
  if (typeof hex !== 'string' || hex[0] !== '#') return 0.5;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length < 6) return 0.5;
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return 0.5;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function classifyTheme(themeId) {
  if (themeId === 'dynamic') return 'special';
  const base = BASE_THEMES[themeId];
  if (!base?.background) return 'dark';
  return hexToLuminance(base.background) < 0.4 ? 'dark' : 'light';
}

const THEME_CATEGORIES = (() => {
  const special = [];
  const dark = [];
  const light = [];
  for (const t of THEME_MODES) {
    const cat = classifyTheme(t.id);
    if (cat === 'special') special.push(t);
    else if (cat === 'dark') dark.push(t);
    else light.push(t);
  }
  return { special, dark, light };
})();

/* ================================================================
   Türkiye yerel konum yardımcıları
   ================================================================ */
const TR_CHAR_MAP = { İ: 'i', I: 'i', ı: 'i', Ş: 's', ş: 's', Ğ: 'g', ğ: 'g', Ü: 'u', ü: 'u', Ö: 'o', ö: 'o', Ç: 'c', ç: 'c' };
const normalizeForSearch = (s) =>
  String(s || '')
    .replace(/[İIıŞşĞğÜüÖöÇç]/g, (ch) => TR_CHAR_MAP[ch] || ch)
    .toLowerCase()
    .trim();

const CITY_GROUP_LIST = TURKEY_CITIES.map((c, idx) => ({
  id: `city-${c.plate ?? idx}`,
  isCityGroup: true,
  cityRef: c,
  title: c.city,
  subtitle: `${(c.districts || []).length} ilçe · Plaka ${String(c.plate ?? idx + 1).padStart(2, '0')}`,
  plate: c.plate,
  _norm: normalizeForSearch(c.city),
}));

let _cachedFlatDistricts = null;
function getFlatDistricts() {
  if (_cachedFlatDistricts) return _cachedFlatDistricts;
  const out = [];
  for (let i = 0; i < TURKEY_CITIES.length; i++) {
    const city = TURKEY_CITIES[i];
    const normCity = normalizeForSearch(city.city);
    const list = city.districts || [];
    for (let j = 0; j < list.length; j++) {
      const d = list[j];
      const normDist = normalizeForSearch(d.name);
      out.push({
        id: `tr-${city.plate}-${j}`,
        title: d.name,
        subtitle: `${city.city}, Türkiye`,
        city: city.city,
        district: d.name,
        country: 'Türkiye',
        latitude: d.lat,
        longitude: d.lon,
        timezone: 'Europe/Istanbul',
        _normDist: normDist,
        _normAll: `${normCity} ${normDist}`,
      });
    }
  }
  _cachedFlatDistricts = out;
  return out;
}

function getCityDistrictItems(cityRef) {
  if (!cityRef) return [];
  const list = cityRef.districts || [];
  const out = new Array(list.length);
  for (let i = 0; i < list.length; i++) {
    const d = list[i];
    out[i] = {
      id: `tr-${cityRef.plate}-${i}`,
      title: d.name,
      subtitle: `${cityRef.city}, Türkiye`,
      city: cityRef.city,
      district: d.name,
      country: 'Türkiye',
      latitude: d.lat,
      longitude: d.lon,
      timezone: 'Europe/Istanbul',
    };
  }
  return out;
}

function searchTurkeyLocations(query, selectedCityRef = null, limit = 25) {
  const q = normalizeForSearch(query);
  if (selectedCityRef) {
    const items = getCityDistrictItems(selectedCityRef);
    if (!q) return items;
    return items.filter((d) => normalizeForSearch(d.title).includes(q));
  }
  if (!q) return CITY_GROUP_LIST;
  const cityMatches = [];
  for (let i = 0; i < CITY_GROUP_LIST.length; i++) {
    if (CITY_GROUP_LIST[i]._norm.includes(q)) {
      cityMatches.push({ ...CITY_GROUP_LIST[i], title: `${CITY_GROUP_LIST[i].title} (Tüm İlçeler)` });
      if (cityMatches.length >= 4) break;
    }
  }
  const allDistricts = getFlatDistricts();
  const starts = [];
  const contains = [];
  for (let i = 0; i < allDistricts.length; i++) {
    const d = allDistricts[i];
    if (d._normDist.startsWith(q)) starts.push(d);
    else if (d._normAll.includes(q)) contains.push(d);
    if (starts.length + contains.length >= limit * 2) break;
  }
  return [...cityMatches, ...starts, ...contains].slice(0, limit);
}

function calcDistanceKm(lat1, lon1, lat2, lon2) {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestTurkeyDistricts(lat, lon, maxDistanceKm = 35, limit = 12) {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return [];
  const districts = getFlatDistricts();
  const candidates = [];
  for (let i = 0; i < districts.length; i++) {
    const d = districts[i];
    const km = calcDistanceKm(lat, lon, d.latitude, d.longitude);
    if (km <= maxDistanceKm) {
      candidates.push({ ...d, _distanceKm: km });
    }
  }
  candidates.sort((a, b) => a._distanceKm - b._distanceKm);
  return candidates.slice(0, limit);
}

function findNearestTurkeyDistrict(lat, lon, maxDistanceKm = 20) {
  const list = findNearestTurkeyDistricts(lat, lon, maxDistanceKm, 1);
  return list[0] || null;
}

function resolveBestTurkeyLocation(lat, lon, place) {
  const candidates = findNearestTurkeyDistricts(lat, lon, 40, 15);
  if (candidates.length === 0) return null;

  const normRegion = normalizeForSearch(place?.region || place?.city || '');
  const normSubregion = normalizeForSearch(
    place?.subregion || place?.district || place?.city || '',
  );

  // 1) Hem il hem ilçe tam/yakın eşleşmesi (Körfez/deniz aşırı komşu ilçeleri eler)
  if (normRegion && normSubregion) {
    const exactBoth = candidates.find((c) => {
      const cCity = normalizeForSearch(c.city);
      const cDist = normalizeForSearch(c.district);
      const cityMatch = cCity === normRegion || cCity.includes(normRegion) || normRegion.includes(cCity);
      const distMatch = cDist === normSubregion || cDist.includes(normSubregion) || normSubregion.includes(cDist);
      return cityMatch && distMatch;
    });
    if (exactBoth) return exactBoth;
  }

  // 2) Reverse geocode il bilgisiyle eşleşen en yakın ilçe (ör. Kocaeli -> Darıca/Gebze)
  if (normRegion) {
    const sameCityCandidates = candidates.filter((c) => {
      const cCity = normalizeForSearch(c.city);
      return cCity === normRegion || cCity.includes(normRegion) || normRegion.includes(cCity);
    });
    if (sameCityCandidates.length > 0) {
      if (normSubregion) {
        const distInSameCity = sameCityCandidates.find((c) => {
          const cDist = normalizeForSearch(c.district);
          return cDist === normSubregion || cDist.includes(normSubregion) || normSubregion.includes(cDist);
        });
        if (distInSameCity) return distInSameCity;
      }
      return sameCityCandidates[0];
    }
  }

  // 3) Reverse geocode ilçe adıyla eşleşen aday
  if (normSubregion) {
    const distMatch = candidates.find((c) => {
      const cDist = normalizeForSearch(c.district);
      return cDist === normSubregion || cDist.includes(normSubregion) || normSubregion.includes(cDist);
    });
    if (distMatch) return distMatch;
  }

  // 4) Geocode yoksa veya Türkiye dışı isim döndüyse en yakın ilçe
  return candidates[0];
}

/* ================================================================
   Güvenli modül yüklemeleri
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}

const isHapticEnabled = () => {
  try { return useAppStore.getState().globalHaptic !== false; }
  catch { return true; }
};

const hapticImpact = (style = 'light') => {
  try {
    if (!isHapticEnabled()) return;
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return;
    const map = Haptics.ImpactFeedbackStyle ?? {};
    const arg = style === 'medium' ? map.Medium : style === 'heavy' ? map.Heavy : map.Light;
    if (arg === undefined) Haptics.impactAsync(); else Haptics.impactAsync(arg);
  } catch {}
};

const hapticSuccess = () => {
  try {
    if (!isHapticEnabled()) return;
    if (!Haptics || typeof Haptics.notificationAsync !== 'function') return;
    const types = Haptics.NotificationFeedbackType ?? {};
    if (types.Success === undefined) Haptics.notificationAsync();
    else Haptics.notificationAsync(types.Success);
  } catch {}
};

const IS_WEB = Platform.OS === 'web';
const USE_NATIVE = !IS_WEB;

const FOCUS_RING = { outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2, outlineColor: '#2563EB' };

let KEYBOARD_NAV = false;
if (IS_WEB && typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => { if (e.key === 'Tab') KEYBOARD_NAV = true; }, true);
  document.addEventListener('pointerdown', () => { KEYBOARD_NAV = false; }, true);
}

const Alert = {
  alert(title, message, buttons) {
    if (!IS_WEB) return RNAlert.alert(title, message, buttons);
    const text = [title, message].filter(Boolean).join('\n\n');
    const btns = Array.isArray(buttons) ? buttons : [];
    try {
      if (btns.length <= 1) { window.alert(text); btns[0]?.onPress?.(); return undefined; }
      const cancel = btns.find((b) => b.style === 'cancel');
      const action = btns.find((b) => b.style !== 'cancel');
      if (window.confirm(text)) action?.onPress?.(); else cancel?.onPress?.();
    } catch {}
    return undefined;
  },
};

const SHADOW_SOFT = Platform.select({
  web: { boxShadow: '0 2px 10px rgba(0,0,0,0.06)' },
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
});

const SHADOW_RAISED = Platform.select({
  web: { boxShadow: '0 6px 24px rgba(0,0,0,0.10)' },
  default: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.10, shadowRadius: 16, elevation: 6 },
});

/* ================================================================
   Sabitler
   ================================================================ */
const APP_VERSION = '1.0.0';
const APP_NAME = 'Hilal';
const APP_TAGLINE = 'İslami Araçlar';
const APP_DESCRIPTION = "Namaz vakitleri, Kur'an, dualar, kıble ve daha fazlası. Sade, reklamsız ve tamamen cihazınızda çalışır.";
const DEVELOPER_NAME = 'Hasan Hüseyin KARAKAYA';
const GITHUB_URL = 'https://github.com/defacesh/hilal-app';
const CONTACT_EMAIL = 'mailto:krkyhsn@proton.me';

const CATEGORIES = [
  { id: 'prayer',        label: 'Konum ve vakitler',    icon: 'location-outline' },
  { id: 'notifications', label: 'Bildirimler',          icon: 'notifications-outline' },
  { id: 'look',          label: 'Görünüm ve ana sayfa', icon: 'color-palette-outline' },
  { id: 'reading',       label: "Okuma ve Kur'an",      icon: 'book-outline' },
  { id: 'access',        label: 'Erişilebilirlik',      icon: 'accessibility-outline' },
  { id: 'data',          label: 'Veri ve gizlilik',     icon: 'shield-checkmark-outline' },
  { id: 'about',         label: 'Hakkında',             icon: 'information-circle-outline' },
];

const ACCESSIBILITY_PRESETS = [
  { id: 'normal', label: 'Normal',    desc: 'Standart görünüm',       sampleSize: 20, settings: { readingFontScale: 1.0,  largeTouchTargets: false } },
  { id: 'large',  label: 'Büyük',     desc: 'Büyük yazı ve düğmeler', sampleSize: 26, settings: { readingFontScale: 1.15, largeTouchTargets: true } },
  { id: 'extra',  label: 'Çok büyük', desc: 'En büyük yazı boyutu',   sampleSize: 32, settings: { readingFontScale: 1.3,  largeTouchTargets: true } },
];

const A11Y_DEFAULTS = Object.freeze({
  readingFontScale: 1.0,
  highContrast: false,
  dyslexiaFont: false,
  largeTouchTargets: false,
  reduceMotion: false,
  globalHaptic: true,
  isSimpleMode: false,
});

function getA11yChanges(state) {
  const changes = [];
  if (Math.abs(state.readingFontScale - 1.0) > 0.01) {
    const label = state.readingFontScale >= 1.3 ? 'Çok büyük' : state.readingFontScale >= 1.15 ? 'Büyük' : 'Normal';
    changes.push({ key: 'readingFontScale', label: 'Yazı boyutu', value: label });
  }
  if (state.highContrast) changes.push({ key: 'highContrast', label: 'Yüksek kontrast', value: 'Açık' });
  if (state.dyslexiaFont) changes.push({ key: 'dyslexiaFont', label: 'Okuma dostu yazı tipi', value: 'Açık' });
  if (state.largeTouchTargets) changes.push({ key: 'largeTouchTargets', label: 'Büyük dokunma hedefleri', value: 'Açık' });
  if (state.reduceMotion) changes.push({ key: 'reduceMotion', label: 'Animasyonları azalt', value: 'Açık' });
  if (state.globalHaptic === false) changes.push({ key: 'globalHaptic', label: 'Titreşim', value: 'Kapalı' });
  if (state.isSimpleMode) changes.push({ key: 'isSimpleMode', label: 'Basit mod', value: 'Açık' });
  return changes;
}

const CALCULATION_METHODS = [
  { id: '13', name: 'Diyanet İşleri Başkanlığı (Türkiye)' },
  { id: '3',  name: 'Muslim World League (MWL)' },
  { id: '2',  name: 'Islamic Society of North America (ISNA)' },
  { id: '5',  name: 'Egyptian General Authority of Survey' },
  { id: '4',  name: 'Umm Al-Qura University, Makkah' },
  { id: '1',  name: 'University of Islamic Sciences, Karachi' },
];

const REMINDER_OPTIONS = [0, 5, 10, 15, 20, 30];
const TUNE_OPTIONS = [-10, -5, -3, -1, 0, 1, 3, 5, 10];

const DATA_SOURCES = [
  { id: 'auto',    name: 'Otomatik',         desc: 'Diyanet birincil, Aladhan yedek',    icon: 'git-merge-outline' },
  { id: 'diyanet', name: 'Yalnızca Diyanet', desc: 'Türkiye için birebir doğru veriler', icon: 'shield-checkmark-outline' },
  { id: 'aladhan', name: 'Yalnızca Aladhan', desc: 'Koordinat bazlı, uluslararası',      icon: 'earth-outline' },
];

const READING_MODE_OPTIONS = [
  { id: 'full',          name: 'Tam metin',        desc: 'Arapça, okunuş ve meal',       icon: 'book-outline' },
  { id: 'arabic-only',   name: 'Sadece Arapça',    desc: 'Yalnızca orijinal metin',      icon: 'language-outline' },
  { id: 'latin-only',    name: 'Sadece okunuş',    desc: 'Latin harfli okunuş',          icon: 'text-outline' },
  { id: 'meaning-only',  name: 'Sadece meal',      desc: 'Türkçe anlam',                 icon: 'document-text-outline' },
  { id: 'latin-meaning', name: 'Okunuş ve meal',   desc: 'Latin okunuş ve Türkçe anlam', icon: 'reader-outline' },
  { id: 'arabic-latin',  name: 'Arapça ve okunuş', desc: 'Orijinal metin ve okunuş',     icon: 'copy-outline' },
];

const FONT_SCALE_OPTIONS = [
  { id: 1.0,  name: 'Normal',    desc: 'Varsayılan boyut' },
  { id: 1.15, name: 'Büyük',     desc: '%15 daha büyük' },
  { id: 1.3,  name: 'Çok büyük', desc: '%30 daha büyük' },
];

const CREDITS = [
  { name: 'Diyanet İşleri Başkanlığı', desc: "Namaz vakitleri ve Kur'an metinleri" },
  { name: 'AlQuran Cloud',             desc: "Kur'an API" },
  { name: 'Açık Kuran',                desc: 'Türkçe meal ve dipnotlar' },
  { name: 'Aladhan',                   desc: 'Uluslararası vakit hesaplama' },
];

const PRIVACY_NOT_DOING = [
  'Analitik veya izleme kullanmıyoruz',
  'Reklam göstermiyoruz',
  'Kişisel verilerinizi sunucularımıza göndermiyoruz',
  'Konumunuzu kaydetmiyoruz (yalnızca vakit hesabı için anlık kullanılır)',
  'Çerez veya izleme pikseli yok',
];

const CHANGELOG_ITEMS = [
  'Diyanet namaz vakitleri', 'Ramazan imsakiyesi', 'Kıble pusulası',
  'Zikirmatik (zikir bazlı sayaçlar)', 'Dualar ve Esmaül Hüsna', "Kur'an okuyucu",
  'Bildirim hatırlatmaları',
  'Canlı önizlemeli tema seçici', 'Ayar arama ve kategori yapısı',
  'Kolay kullanım ön ayarları', '11 tema ve 29 vurgu rengi',
  'Erişilebilirlik: kontrast, büyük hedef, okuma fontu',
];

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const DEBOUNCE_MS = 300;
const SEARCH_TIMEOUT_MS = 8000;

const makePlace = (id, title, country, latitude, longitude, timezone) => ({
  id, title, subtitle: country, city: title, district: title, country, latitude, longitude, timezone,
});

const POPULAR_ABROAD_PLACES = [
  makePlace('p-mekke', 'Mekke', 'Suudi Arabistan', 21.3891, 39.8579, 'Asia/Riyadh'),
  makePlace('p-medine', 'Medine', 'Suudi Arabistan', 24.5247, 39.5692, 'Asia/Riyadh'),
  makePlace('p-kudus', 'Kudüs', 'Filistin', 31.7683, 35.2137, 'Asia/Jerusalem'),
  makePlace('p-berlin', 'Berlin', 'Almanya', 52.52, 13.405, 'Europe/Berlin'),
  makePlace('p-koln', 'Köln', 'Almanya', 50.9375, 6.9603, 'Europe/Berlin'),
  makePlace('p-paris', 'Paris', 'Fransa', 48.8566, 2.3522, 'Europe/Paris'),
  makePlace('p-londra', 'Londra', 'Birleşik Krallık', 51.5074, -0.1278, 'Europe/London'),
  makePlace('p-amsterdam', 'Amsterdam', 'Hollanda', 52.3676, 4.9041, 'Europe/Amsterdam'),
  makePlace('p-viyana', 'Viyana', 'Avusturya', 48.2082, 16.3738, 'Europe/Vienna'),
  makePlace('p-baku', 'Bakü', 'Azerbaycan', 40.4093, 49.8671, 'Asia/Baku'),
  makePlace('p-saraybosna', 'Saraybosna', 'Bosna-Hersek', 43.8563, 18.4131, 'Europe/Sarajevo'),
  makePlace('p-newyork', 'New York', 'Amerika Birleşik Devletleri', 40.7128, -74.006, 'America/New_York'),
];

const LIGHT_MODES = ['light', 'modernLight', 'ivory', 'sepia', 'sand'];

function resolveThemePreview(item, currentTheme) {
  if (!item || item.id === 'dynamic') {
    return {
      bg: currentTheme.background,
      surface: currentTheme.surfaceElevated || currentTheme.surface,
      text: currentTheme.text,
      primary: currentTheme.primary,
    };
  }
  const base = BASE_THEMES[item.id];
  if (base) {
    const accent = ACCENT_COLORS[currentTheme.accentId] || ACCENT_COLORS.emerald;
    return {
      bg: base.background,
      surface: base.surface,
      text: base.text,
      primary: currentTheme.primary || accent.primary,
    };
  }
  return {
    bg: currentTheme.background,
    surface: currentTheme.surface,
    text: currentTheme.text,
    primary: currentTheme.primary,
  };
}

/* ================================================================
   Yardımcılar
   ================================================================ */
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function mapGeocodingResult(item) {
  const name = item.name || '';
  const admin = item.admin1 || item.admin2 || '';
  return {
    id: String(item.id ?? `${item.latitude},${item.longitude}`),
    title: name,
    subtitle: [admin && admin !== name ? admin : null, item.country].filter(Boolean).join(', '),
    city: admin || name, district: name, country: item.country || '',
    latitude: item.latitude, longitude: item.longitude, timezone: item.timezone,
  };
}

const openLink = (url) => { try { Linking.openURL(url); } catch {} };
const normalize = (s) => String(s || '').toLocaleLowerCase('tr-TR');

const groupBy = (list, keyFn) => {
  const map = new Map();
  list.forEach((x) => {
    const k = keyFn(x);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(x);
  });
  return Array.from(map, ([name, items]) => ({ name, items }));
};

const getGreetingByClock = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return { text: 'Hayırlı sabahlar', icon: 'sunny-outline' };
  if (h >= 11 && h < 17) return { text: 'Hayırlı günler', icon: 'partly-sunny-outline' };
  if (h >= 17 && h < 20) return { text: 'Hayırlı akşamlar', icon: 'cloudy-outline' };
  return { text: 'Hayırlı geceler', icon: 'moon-outline' };
};

const formatAccuracy = (acc) => {
  const n = Number(acc);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1000) return `±${Math.round(n)}m`;
  return `±${(n / 1000).toFixed(1)}km`;
};

/* ================================================================
   UI Context
   ================================================================ */
const UI = React.createContext(null);
const useUI = () => useContext(UI);

/* ================================================================
   Temel bileşenler
   ================================================================ */
const Tap = memo(function Tap({
  onPress, style, pressedStyle = { opacity: 0.75 }, children, disabled,
  haptic = 'light', label, hint, role = 'button', state, hitSlop,
}) {
  const handle = useCallback((e) => {
    if (haptic) hapticImpact(haptic);
    onPress?.(e);
  }, [onPress, haptic]);
  return (
    <Pressable
      onPress={handle}
      disabled={disabled}
      focusable={!disabled}
      hitSlop={hitSlop}
      accessibilityRole={role}
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled, ...state }}
      style={(s) => [
        style,
        s.pressed && pressedStyle,
        IS_WEB && { cursor: disabled ? 'default' : 'pointer' },
        IS_WEB && s.focused && KEYBOARD_NAV && FOCUS_RING,
      ]}
    >
      {children}
    </Pressable>
  );
});

const IconChip = memo(function IconChip({ name, size = 38, tone = 'accent' }) {
  const { theme, hc, danger } = useUI();
  const fg = tone === 'danger' ? danger : (tone === 'muted' ? theme.textMuted : theme.primary);
  const bg = hc ? theme.text : tone === 'danger' ? `${danger}1C` : tone === 'muted' ? theme.surfaceElevated : `${theme.primary}1C`;
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.32), backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={Math.round(size * 0.5)} color={hc ? theme.background : fg} />
    </View>
  );
});

const Toast = memo(function Toast({ message, visible }) {
  const { theme, calm, hc, onPrimary } = useUI();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible && calm) { translateY.setValue(0); opacity.setValue(0); return; }
    if (calm) { translateY.setValue(0); opacity.setValue(visible ? 1 : 0); return; }
    Animated.parallel([
      Animated.timing(translateY, { toValue: visible ? 0 : 20, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: 200, useNativeDriver: USE_NATIVE }),
    ]).start();
  }, [visible, calm, translateY, opacity]);

  if (!message && !visible) return null;

  const textColor = hc ? '#000000' : onPrimary;
  const iconBg = hc ? '#000000' : onPrimary;
  const iconFg = hc ? '#FFFF00' : theme.primary;

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      importantForAccessibility={visible ? 'yes' : 'no-hide-descendants'}
      style={[
        styles.toast,
        { bottom: insets.bottom + 20, backgroundColor: theme.primary, opacity, transform: [{ translateY }] },
        !calm && SHADOW_RAISED,
      ]}
    >
      <View style={[styles.toastIconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name="checkmark" size={16} color={iconFg} />
      </View>
      <Text style={{ color: textColor, fontSize: 14, fontWeight: '700', flex: 1 }} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
});

const SectionTitle = memo(function SectionTitle({ title, footer, count }) {
  const { theme, hc, dim, fs } = useUI();
  if (!title) return null;
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionPill, { backgroundColor: hc ? theme.text : `${theme.primary}16` }]}>
        <Text style={{ color: hc ? theme.background : theme.primary, fontSize: fs(10.5), fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' }}>
          {title}
        </Text>
      </View>
      {typeof count === 'number' ? (
        <View style={[styles.sectionCount, { backgroundColor: hc ? 'transparent' : theme.surfaceElevated, borderColor: hc ? theme.text : theme.border, borderWidth: hc ? 1.5 : 0 }]}>
          <Text style={{ color: hc ? theme.text : dim, fontSize: fs(10.5), fontWeight: '700', fontVariant: ['tabular-nums'] }}>{count}</Text>
        </View>
      ) : null}
      {footer ? (
        <Text style={{ color: hc ? theme.text : dim, fontSize: fs(11.5), flex: 1, textAlign: 'right' }} numberOfLines={1}>{footer}</Text>
      ) : null}
    </View>
  );
});

const Group = memo(function Group({ title, footer, children, padded = false }) {
  const { theme, hc, dim, border, fs } = useUI();
  return (
    <View style={styles.group}>
      {title ? <SectionTitle title={title} /> : null}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: border, borderWidth: hc ? 2 : 1 }, !hc && SHADOW_SOFT, padded && { padding: 16 }]}>
        {children}
      </View>
      {footer ? (
        <Text style={{ color: hc ? theme.text : dim, fontSize: fs(12), lineHeight: fs(17), marginTop: 8, marginHorizontal: 6 }}>{footer}</Text>
      ) : null}
    </View>
  );
});

const Row = memo(function Row({ item, last }) {
  const { theme, hc, big, dim, danger, border, fs } = useUI();
  const isSwitch = item.type === 'switch';
  const isLink = item.type === 'link';
  const sub = isLink ? (item.value || item.desc) : item.desc;
  const valueShown = isLink && !!item.value;
  const subColor = hc ? theme.text : (valueShown && !item.plain ? theme.primary : dim);
  const labelColor = item.danger ? danger : theme.text;
  const press = () => { if (isSwitch) item.onChange?.(!item.on); else item.onPress?.(); };
  const a11yLabel = valueShown ? `${item.label}, ${item.value}` : item.label;

  return (
    <Tap
      onPress={press}
      disabled={item.disabled}
      role={isSwitch ? 'switch' : 'button'}
      label={a11yLabel}
      hint={valueShown ? item.desc : sub}
      state={isSwitch ? { checked: !!item.on } : undefined}
      pressedStyle={{ backgroundColor: `${theme.primary}0D` }}
      style={[styles.row, big && styles.rowBig, item.disabled && { opacity: 0.5 }]}
    >
      {item.icon ? (
        <View style={{ marginRight: 14 }}>
          <IconChip name={item.icon} size={big ? 42 : 38} tone={item.danger ? 'danger' : 'accent'} />
        </View>
      ) : null}
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ color: labelColor, fontSize: fs(15), fontWeight: hc ? '800' : '600', letterSpacing: -0.1 }}>{item.label}</Text>
        {sub ? (
          <Text style={{ color: subColor, fontSize: fs(12.5), lineHeight: fs(18), marginTop: 4, fontWeight: hc || (valueShown && !item.plain) ? '600' : '400' }}>{sub}</Text>
        ) : null}
      </View>
      {isSwitch ? (
        <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          <ThemedSwitch value={!!item.on} onValueChange={() => {}} disabled={item.disabled} />
        </View>
      ) : item.busy ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : isLink ? (
        <Ionicons name="chevron-forward" size={17} color={hc ? theme.text : theme.textMuted} />
      ) : null}
      {!last ? (
        <View style={[styles.divider, { backgroundColor: hc ? theme.text : border, left: item.icon ? (big ? 72 : 66) : 16 }]} />
      ) : null}
    </Tap>
  );
});

const LocationRowItem = memo(function LocationRowItem({ item, selected, isPopularAbroad, isLast, onSelect }) {
  const { theme, hc, big, dim, border, fs } = useUI();
  return (
    <Tap
      onPress={() => onSelect(item)}
      label={`${item.title}${item.subtitle ? ', ' + item.subtitle : ''}${selected ? '. Seçili' : ''}`}
      pressedStyle={{ backgroundColor: `${theme.primary}0D` }}
      style={[styles.row, big && styles.rowBig]}
    >
      <View style={{ marginRight: 14 }}>
        <IconChip name={item.isCityGroup ? 'business-outline' : (isPopularAbroad ? 'earth-outline' : 'location-outline')} size={38} tone="accent" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: selected ? theme.primary : theme.text, fontSize: fs(15), fontWeight: '700' }} numberOfLines={1}>{item.title}</Text>
        {!!item.subtitle && (
          <Text style={{ color: hc ? theme.text : dim, fontSize: fs(12.5), marginTop: 3 }} numberOfLines={1}>{item.subtitle}</Text>
        )}
      </View>
      {selected ? <Ionicons name="checkmark-circle" size={22} color={theme.primary} /> : <Ionicons name="chevron-forward" size={17} color={hc ? theme.text : theme.textMuted} />}
      {!isLast ? <View style={[styles.divider, { left: 56, backgroundColor: hc ? theme.text : border }]} /> : null}
    </Tap>
  );
});

const HubTile = memo(function HubTile({ category, summary, onPress }) {
  const { theme, hc, dim, border, big, fs } = useUI();
  return (
    <Tap
      onPress={onPress}
      label={`${category.label}. ${summary}`}
      style={[styles.hubTile, { backgroundColor: theme.surface, borderColor: hc ? theme.text : border, borderWidth: hc ? 2 : 1, height: big ? 158 : 140 }, !hc && SHADOW_SOFT]}
      pressedStyle={{ opacity: 0.85, transform: [{ scale: 0.985 }] }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={[styles.hubIconWrap, { backgroundColor: hc ? theme.text : `${theme.primary}16` }]}>
          <Ionicons name={category.icon} size={22} color={hc ? theme.background : theme.primary} />
        </View>
        <Ionicons name="chevron-forward" size={16} color={hc ? theme.text : dim} style={{ marginTop: 6 }} />
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={{ color: theme.text, fontSize: fs(14), fontWeight: '700', letterSpacing: -0.2 }} numberOfLines={1}>{category.label}</Text>
        <Text style={{ color: hc ? theme.text : dim, fontSize: fs(11.5), marginTop: 5, lineHeight: fs(15.5), fontWeight: '500' }} numberOfLines={2}>{summary}</Text>
      </View>
    </Tap>
  );
});

const PresetTiles = memo(function PresetTiles({ currentPreset, onSelect }) {
  const { theme, hc, dim, border, big, fs, onPrimary } = useUI();
  return (
    <View style={styles.presetRow}>
      {ACCESSIBILITY_PRESETS.map((p) => {
        const selected = currentPreset === p.id;
        return (
          <Tap
            key={p.id}
            onPress={() => onSelect(p)}
            role="radio"
            state={{ selected, checked: selected }}
            label={`Yazı boyutu: ${p.label}. ${p.desc}${selected ? '. Seçili.' : ''}`}
            style={[styles.presetTile, { backgroundColor: selected ? `${theme.primary}14` : theme.background, borderColor: selected ? theme.primary : border, borderWidth: selected || hc ? 2 : 1, minHeight: big ? 154 : 138 }]}
            pressedStyle={{ opacity: 0.85 }}
          >
            <View style={[styles.presetAaWrap, { backgroundColor: selected ? `${theme.primary}1A` : theme.surfaceElevated }]}>
              <Text style={{ fontSize: p.sampleSize, lineHeight: p.sampleSize * 1.05, fontWeight: '800', color: selected ? theme.primary : theme.text, textAlign: 'center', includeFontPadding: false }}>Aa</Text>
            </View>
            <Text style={{ color: selected ? theme.primary : theme.text, fontSize: fs(12.5), fontWeight: '700', marginTop: 10, textAlign: 'center' }} numberOfLines={1}>{p.label}</Text>
            <Text style={{ color: hc ? theme.text : dim, fontSize: fs(10.5), marginTop: 3, textAlign: 'center', fontWeight: '500' }} numberOfLines={2}>{p.desc}</Text>
            {selected ? (
              <View style={[styles.presetCheck, { backgroundColor: theme.primary }]}>
                <Ionicons name="checkmark" size={11} color={onPrimary} />
              </View>
            ) : null}
          </Tap>
        );
      })}
    </View>
  );
});

const HeroTile = memo(function HeroTile({ icon, label, value, onPress, active = true, role = 'button', checked }) {
  const { theme, hc, big, fs } = useUI();
  const fg = active ? theme.primary : (hc ? theme.text : theme.textMuted);
  return (
    <Tap
      onPress={onPress}
      role={role}
      state={role === 'switch' ? { checked: !!checked } : undefined}
      label={`${label}: ${value}`}
      style={[styles.heroTile, { backgroundColor: hc ? theme.background : theme.surfaceElevated, borderColor: hc ? theme.text : theme.border, borderWidth: hc ? 2 : 1, minHeight: big ? 112 : 96 }]}
      pressedStyle={{ opacity: 0.85 }}
    >
      <Ionicons name={icon} size={22} color={fg} />
      <Text style={{ color: hc ? theme.text : theme.textDim, fontSize: fs(10.5), marginTop: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' }} numberOfLines={1}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: fs(13), fontWeight: '700', marginTop: 2 }} numberOfLines={2}>{value}</Text>
    </Tap>
  );
});

const SearchField = memo(function SearchField({ value, onChange }) {
  const { theme, hc, big, border, fs } = useUI();
  return (
    <View style={[styles.searchField, { backgroundColor: theme.surface, borderColor: hc ? theme.text : border, borderWidth: hc ? 2 : 1, minHeight: big ? 64 : 52 }, !hc && SHADOW_SOFT]}>
      <Ionicons name="search" size={18} color={hc ? theme.text : theme.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Ayarlarda ara…"
        placeholderTextColor={theme.textMuted}
        style={[{ flex: 1, color: theme.text, fontSize: fs(15), paddingVertical: 10 }, IS_WEB && { outlineStyle: 'none' }]}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Ayarlarda ara"
      />
      {value.length > 0 ? (
        <Tap onPress={() => onChange('')} label="Aramayı temizle" hitSlop={10}>
          <Ionicons name="close-circle" size={20} color={hc ? theme.text : theme.textMuted} />
        </Tap>
      ) : null}
    </View>
  );
});

const Sheet = memo(function Sheet({ visible, onClose, title, subtitle, children, scroll = true, tall = false }) {
  const { theme, hc, dim, border, big, fs } = useUI();
  const insets = useSafeAreaInsets();
  const closeSize = big ? 50 : 42;
  if (!visible) return null;
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessible={false} focusable={false} />
        <View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: theme.background, borderColor: border, paddingBottom: Math.max(insets.bottom, 20) }, tall && { height: '90%' }]}>
          <View style={[styles.sheetHandle, { backgroundColor: hc ? theme.text : theme.border }]} />
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text accessibilityRole="header" style={{ color: theme.text, fontSize: fs(22), fontWeight: '800', letterSpacing: -0.3 }}>{title}</Text>
              {subtitle ? <Text style={{ color: hc ? theme.text : dim, fontSize: fs(13), lineHeight: fs(18), marginTop: 5, fontWeight: '500' }}>{subtitle}</Text> : null}
            </View>
            <Tap onPress={onClose} label="Kapat" style={[styles.closeBtn, { backgroundColor: theme.surfaceElevated, borderColor: hc ? theme.text : 'transparent', borderWidth: hc ? 1.5 : 0, width: closeSize, height: closeSize, borderRadius: closeSize / 2 }]}>
              <Ionicons name="close" size={20} color={theme.text} />
            </Tap>
          </View>
          {scroll ? (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 16 }}>{children}</ScrollView>
          ) : children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

const OptionRow = memo(function OptionRow({ option, selected, onPress, last }) {
  const { theme, hc, big, dim, border, fs } = useUI();
  return (
    <Tap
      onPress={() => onPress(option)}
      role="radio"
      state={{ selected, checked: selected }}
      label={`${option.label}${option.desc ? '. ' + option.desc : ''}${selected ? '. Seçili' : ''}`}
      pressedStyle={{ backgroundColor: `${theme.primary}0D` }}
      style={[styles.row, big && styles.rowBig, selected && { backgroundColor: `${theme.primary}0D` }]}
    >
      {option.icon ? (
        <View style={{ marginRight: 14 }}>
          <IconChip name={option.icon} size={big ? 42 : 38} tone="accent" />
        </View>
      ) : null}
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ color: selected ? theme.primary : theme.text, fontSize: fs(15), fontWeight: selected || hc ? '700' : '500' }}>{option.label}</Text>
        {option.desc ? <Text style={{ color: hc ? theme.text : dim, fontSize: fs(12.5), lineHeight: fs(17), marginTop: 3 }}>{option.desc}</Text> : null}
      </View>
      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={22} color={selected ? theme.primary : (hc ? theme.text : theme.textMuted)} />
      {!last ? <View style={[styles.divider, { left: option.icon ? 66 : 16, backgroundColor: hc ? theme.text : border }]} /> : null}
    </Tap>
  );
});

/* ================================================================
   Canlı Tema Önizlemesi
   ================================================================ */
const ThemeLivePreview = memo(function ThemeLivePreview({ item, currentTheme, accentName, theme, hc, dim, fs }) {
  const preview = resolveThemePreview(item, currentTheme);
  const isDark = hexToLuminance(preview.bg) < 0.4;
  const isDynamic = !item || item.id === 'dynamic';

  return (
    <View style={[styles.themeLiveWrap, { backgroundColor: theme.surface, borderColor: hc ? theme.text : theme.border, borderWidth: hc ? 2 : 1 }, !hc && SHADOW_SOFT]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <View style={{ width: 22, height: 22, borderRadius: 7, backgroundColor: `${theme.primary}1F`, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="eye-outline" size={12} color={theme.primary} />
        </View>
        <Text style={{ color: theme.text, fontSize: fs(11), fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' }}>Canlı önizleme</Text>
        <View style={{ flex: 1 }} />
        <View style={[styles.themeLiveBadgePill, { backgroundColor: hc ? theme.primary : `${theme.primary}18` }]}>
          <Text style={{ color: hc ? '#000000' : theme.primary, fontSize: fs(10.5), fontWeight: '800' }}>
            {isDynamic ? 'Otomatik' : (item?.name || 'Tema')}
          </Text>
        </View>
      </View>

      <View style={[styles.themeLiveMockup, { backgroundColor: preview.bg, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderWidth: 1 }]}>
        <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
          <Text style={{ color: preview.text, fontSize: fs(15), fontWeight: '800', letterSpacing: -0.3, opacity: 0.95 }}>Hayırlı sabahlar</Text>
          <Text style={{ color: preview.text, fontSize: fs(10), marginTop: 2, fontWeight: '500', opacity: 0.55 }}>Darıca, Kocaeli</Text>
        </View>

        <View style={[styles.themeLivePrayerCard, { backgroundColor: preview.surface }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: preview.text, fontSize: fs(8.5), opacity: 0.55, fontWeight: '700', letterSpacing: 0.6 }}>SIRADAKİ VAKİT</Text>
            <View style={[styles.themeLiveTimeBadge, { backgroundColor: `${preview.primary}22` }]}>
              <Text style={{ color: preview.primary, fontSize: fs(8), fontWeight: '800' }}>12 dk</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 6 }}>
            <Text style={{ color: preview.text, fontSize: fs(22), fontWeight: '900', letterSpacing: -0.5 }}>Öğle</Text>
            <Text style={{ color: preview.primary, fontSize: fs(15), fontWeight: '800', fontVariant: ['tabular-nums'] }}>13:12</Text>
          </View>
          <View style={[styles.themeLiveProgress, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <View style={[styles.themeLiveProgressFill, { width: '62%', backgroundColor: preview.primary }]} />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 4, paddingHorizontal: 14, paddingBottom: 14 }}>
          {[1, 0.35, 0.35, 0.35, 0.35].map((op, i) => (
            <View key={i} style={{ flex: 1, height: 3.5, borderRadius: 2, backgroundColor: i === 0 ? preview.primary : preview.text, opacity: op }} />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: preview.primary }} />
        <Text style={{ color: hc ? theme.text : dim, fontSize: fs(11.5), fontWeight: '600', flex: 1 }} numberOfLines={1}>
          {isDark ? 'Koyu tema' : 'Aydınlık tema'} · {accentName} vurgu
        </Text>
      </View>
    </View>
  );
});

/* ================================================================
   Zengin tema kartı
   ================================================================ */
const ThemePreviewCard = memo(function ThemePreviewCard({ item, selected, onPress, theme, hc, fs, onPrimary }) {
  const isDynamic = item.id === 'dynamic';
  const preview = resolveThemePreview(item, theme);

  return (
    <Tap
      onPress={() => onPress(item)}
      role="radio"
      state={{ selected, checked: selected }}
      label={`${item.name}${item.desc ? '. ' + item.desc : ''}${selected ? '. Seçili' : ''}`}
      style={[styles.themeCard, {
        borderColor: selected ? (hc ? '#FFFF00' : theme.primary) : (hc ? theme.text : theme.border),
        borderWidth: selected ? (hc ? 3 : 2) : 1,
        backgroundColor: theme.surface,
      }, !hc && SHADOW_SOFT]}
      pressedStyle={{ opacity: 0.9 }}
    >
      {isDynamic ? (
        <View style={[styles.themePreviewMockup, { backgroundColor: '#0F1115', padding: 0 }]}>
          <View style={{ flexDirection: 'row', flex: 1 }}>
            <View style={[styles.themeDynamicHalf, { backgroundColor: '#F8FAFC' }]}>
              <Ionicons name="sunny" size={22} color="#0F172A" />
              <Text style={{ color: '#0F172A', fontSize: 8, fontWeight: '800', marginTop: 4, opacity: 0.7 }}>GÜNDÜZ</Text>
            </View>
            <View style={[styles.themeDynamicHalf, { backgroundColor: '#121212' }]}>
              <Ionicons name="moon" size={20} color="#FFFFFF" />
              <Text style={{ color: '#FFFFFF', fontSize: 8, fontWeight: '800', marginTop: 4, opacity: 0.7 }}>GECE</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.themePreviewMockup, { backgroundColor: preview.bg }]}>
          <View style={[styles.themePreviewTopBar, { backgroundColor: preview.surface }]}>
            <View style={[styles.themePreviewAccentDot, { backgroundColor: preview.primary }]} />
            <View style={styles.themePreviewTopBarTextGroup}>
              <View style={[styles.themePreviewTextLine, { width: '72%', height: 3.5, backgroundColor: preview.text, opacity: 0.65 }]} />
              <View style={[styles.themePreviewTextLine, { width: '42%', height: 2.5, backgroundColor: preview.text, opacity: 0.35, marginTop: 3 }]} />
            </View>
          </View>

          <View style={[styles.themePreviewPrayerCard, { backgroundColor: preview.surface }]}>
            <View style={[styles.themePreviewTextLine, { width: '35%', height: 3, backgroundColor: preview.text, opacity: 0.4 }]} />
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 5 }}>
              <View style={[styles.themePreviewTextLine, { width: '42%', height: 6, backgroundColor: preview.text, opacity: 0.75 }]} />
              <View style={[styles.themePreviewTextLine, { width: '28%', height: 6, backgroundColor: preview.primary }]} />
            </View>
            <View style={[styles.themePreviewMiniBar, { backgroundColor: preview.text + '18' }]}>
              <View style={[styles.themePreviewMiniBarFill, { width: '58%', backgroundColor: preview.primary }]} />
            </View>
          </View>

          <View style={[styles.themePreviewAccentBar, { backgroundColor: preview.primary }]} />
        </View>
      )}

      <View style={styles.themeCardMeta}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ color: selected ? theme.primary : theme.text, fontSize: fs(13.5), fontWeight: hc ? '800' : '700', letterSpacing: -0.1 }}>{item.name}</Text>
          {item.desc ? (
            <Text numberOfLines={1} style={{ color: hc ? theme.text : theme.textMuted, fontSize: fs(10.5), marginTop: 2, fontWeight: hc ? '600' : '400' }}>{item.desc}</Text>
          ) : null}
        </View>
        <View style={[styles.themeCardCheck, {
          backgroundColor: selected ? theme.primary : 'transparent',
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 0 : 1.5,
        }]}>
          {selected ? <Ionicons name="checkmark" size={11} color={onPrimary} /> : null}
        </View>
      </View>
    </Tap>
  );
});

const Bullet = ({ icon, color, text }) => {
  const { theme, fs } = useUI();
  return (
    <View style={styles.bulletRow}>
      <Ionicons name={icon} size={17} color={color} style={{ marginTop: 3 }} />
      <Text style={{ color: theme.text, fontSize: fs(14), lineHeight: fs(21), flex: 1 }}>{text}</Text>
    </View>
  );
};

/* ================================================================
   Erişilebilirlik — Canlı Önizleme
   ================================================================ */
const LivePreviewCard = memo(function LivePreviewCard() {
  const { theme, dim, hc, onPrimary } = useUI();
  const readingFontScale = useAppStore((s) => s.readingFontScale) ?? 1.0;
  const largeTouchTargets = useAppStore((s) => s.largeTouchTargets) ?? false;
  const highContrast = useAppStore((s) => s.highContrast) ?? false;

  const pf = (n) => Math.round(n * readingFontScale);
  const rowMinH = largeTouchTargets ? 54 : 38;

  const sample = [
    { name: 'İmsak',  time: '05:42', state: 'past' },
    { name: 'Güneş',  time: '07:01', state: 'past' },
    { name: 'Öğle',   time: '13:12', state: 'next' },
    { name: 'İkindi', time: '16:24', state: 'future' },
    { name: 'Akşam',  time: '19:47', state: 'future' },
  ];

  return (
    <View style={[styles.livePreviewCard, { backgroundColor: theme.surface, borderColor: highContrast ? theme.text : theme.border, borderWidth: highContrast ? 2.5 : 1 }, !highContrast && SHADOW_RAISED]}>
      <View style={styles.livePreviewHeader}>
        <View style={[styles.livePreviewIconWrap, { backgroundColor: highContrast ? theme.text : `${theme.primary}1C`, width: rowMinH + 4, height: rowMinH + 4, borderRadius: Math.round((rowMinH + 4) * 0.32) }]}>
          <Ionicons name="sunny-outline" size={pf(20)} color={highContrast ? theme.background : theme.primary} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: theme.text, fontSize: pf(15), fontWeight: highContrast ? '900' : '700', letterSpacing: -0.2 }} numberOfLines={1}>Hayırlı sabahlar</Text>
          <Text style={{ color: highContrast ? theme.text : dim, fontSize: pf(11.5), fontWeight: highContrast ? '700' : '500', marginTop: 2 }} numberOfLines={1}>Vakitler İstanbul için</Text>
        </View>
      </View>
      <View style={{ marginTop: 10 }}>
        {sample.map((p, i) => {
          const isNext = p.state === 'next';
          const isPast = p.state === 'past';
          const faded = isPast && !highContrast;
          return (
            <View key={p.name} style={[styles.livePreviewRow, { minHeight: rowMinH, borderTopColor: highContrast ? theme.text : theme.border }, i === 0 && { borderTopWidth: 0 }]}>
              <Text style={{ flex: 1, color: faded ? dim : theme.text, fontSize: pf(13.5), fontWeight: isNext ? '800' : (highContrast ? '700' : '600'), opacity: faded ? 0.55 : 1 }}>{p.name}</Text>
              <Text style={{ color: isNext ? theme.primary : (faded ? dim : theme.text), fontSize: pf(13.5), fontWeight: isNext ? '900' : (highContrast ? '800' : '700'), fontVariant: ['tabular-nums'], opacity: faded ? 0.55 : 1 }}>{p.time}</Text>
              {isNext ? (
                <View style={[styles.livePreviewBadge, { backgroundColor: theme.primary }]}>
                  <Text style={{ color: hc ? '#000000' : onPrimary, fontSize: pf(8.5), fontWeight: '900', letterSpacing: 0.3 }}>SIRADAKİ</Text>
                </View>
              ) : <View style={{ width: pf(56) }} />}
            </View>
          );
        })}
      </View>
    </View>
  );
});

const FontSizeSelector = memo(function FontSizeSelector({ currentPreset, onSelect }) {
  const { theme, hc, dim, border, big, fs, onPrimary } = useUI();
  return (
    <View style={styles.fontSizeRow}>
      {ACCESSIBILITY_PRESETS.map((p) => {
        const selected = currentPreset === p.id;
        return (
          <Tap
            key={p.id}
            onPress={() => onSelect(p)}
            role="radio"
            state={{ selected, checked: selected }}
            label={`Yazı boyutu: ${p.label}. ${p.desc}${selected ? '. Seçili.' : ''}`}
            style={[styles.fontSizeTile, { backgroundColor: selected ? `${theme.primary}14` : theme.background, borderColor: selected ? theme.primary : border, borderWidth: selected || hc ? 2 : 1, minHeight: big ? 154 : 138 }]}
            pressedStyle={{ opacity: 0.85 }}
          >
            <View style={[styles.presetAaWrap, { backgroundColor: selected ? `${theme.primary}1A` : theme.surfaceElevated }]}>
              <Text style={{ fontSize: p.sampleSize, lineHeight: p.sampleSize * 1.05, fontWeight: '800', color: selected ? theme.primary : theme.text, textAlign: 'center', includeFontPadding: false }}>Aa</Text>
            </View>
            <Text style={{ color: selected ? theme.primary : theme.text, fontSize: fs(12.5), fontWeight: '700', marginTop: 10 }} numberOfLines={1}>{p.label}</Text>
            <Text style={{ color: hc ? theme.text : dim, fontSize: fs(10.5), fontWeight: '500', marginTop: 3 }} numberOfLines={1}>{p.desc}</Text>
            {selected ? (
              <View style={[styles.fontSizeCheck, { backgroundColor: theme.primary }]}>
                <Ionicons name="checkmark" size={10} color={onPrimary} />
              </View>
            ) : null}
          </Tap>
        );
      })}
    </View>
  );
});

const AccessibilityPage = memo(function AccessibilityPage({
  currentPreset, onSelectPreset, onToggleHighContrast, onToggleDyslexia,
  onToggleLargeTargets, onToggleReduceMotion, onToggleHaptic, onToggleSimpleMode, onReset,
}) {
  const { theme, dim, fs, hc, danger } = useUI();
  const highContrast = useAppStore((s) => s.highContrast) ?? false;
  const dyslexiaFont = useAppStore((s) => s.dyslexiaFont) ?? false;
  const largeTouchTargets = useAppStore((s) => s.largeTouchTargets) ?? false;
  const reduceMotion = useAppStore((s) => s.reduceMotion) ?? false;
  const globalHaptic = useAppStore((s) => s.globalHaptic) ?? true;
  const isSimpleMode = useAppStore((s) => s.isSimpleMode) ?? false;
  const readingFontScale = useAppStore((s) => s.readingFontScale) ?? 1.0;

  const changes = useMemo(() => getA11yChanges({
    readingFontScale, highContrast, dyslexiaFont, largeTouchTargets,
    reduceMotion, globalHaptic: globalHaptic !== false, isSimpleMode,
  }), [readingFontScale, highContrast, dyslexiaFont, largeTouchTargets, reduceMotion, globalHaptic, isSimpleMode]);
  const hasChanges = changes.length > 0;

  return (
    <View style={{ marginTop: 4 }}>
      <Text style={{ color: hc ? theme.text : dim, fontSize: fs(13), lineHeight: fs(19), paddingHorizontal: 4, marginBottom: 14, fontWeight: '500' }}>
        Ayar değişikliklerini aşağıdaki canlı önizlemede anında görün.
      </Text>
      <View style={{ marginBottom: 22 }}><LivePreviewCard /></View>
      <Group title="Yazı boyutu" footer="Okuma içerikleri (Kur'an, dua, tesbihat) bu boyutta görünür. Ayarlar arayüzünün kendisi sabit kalır.">
        <View style={{ padding: 16 }}><FontSizeSelector currentPreset={currentPreset} onSelect={onSelectPreset} /></View>
      </Group>
      <Group title="Okunabilirlik">
        <Row last={false} item={{ id: 'a11y-hc', type: 'switch', icon: 'contrast-outline', label: 'Yüksek kontrast', desc: 'Metin ve arka plan farkını artırır', on: highContrast, onChange: onToggleHighContrast }} />
        <Row last item={{ id: 'a11y-dys', type: 'switch', icon: 'text-outline', label: 'Okuma dostu yazı tipi', desc: 'Disleksi için OpenDyslexic', on: dyslexiaFont, onChange: onToggleDyslexia }} />
      </Group>
      <Group title="Dokunma ve hareket">
        <Row last={false} item={{ id: 'a11y-large', type: 'switch', icon: 'hand-right-outline', label: 'Büyük dokunma hedefleri', desc: 'Butonlar ve satırlar daha kolay dokunulur', on: largeTouchTargets, onChange: onToggleLargeTargets }} />
        <Row last={false} item={{ id: 'a11y-motion', type: 'switch', icon: 'flash-off-outline', label: 'Animasyonları azalt', desc: 'Geçiş efektlerini minimuma indirir', on: reduceMotion, onChange: onToggleReduceMotion }} />
        <Row last item={{ id: 'a11y-haptic', type: 'switch', icon: 'hand-left-outline', label: 'Titreşimli geri bildirim', desc: 'Dokunuşlarda hafif titreşim', on: globalHaptic !== false, onChange: onToggleHaptic }} />
      </Group>
      <Group title="Sade görünüm">
        <Row last item={{ id: 'a11y-simple', type: 'switch', icon: 'accessibility-outline', label: 'Basit mod', desc: 'Çok büyük yazı, sade ve az düğmeli arayüz', on: isSimpleMode, onChange: onToggleSimpleMode }} />
      </Group>
      <Group title="Sıfırlama">
        {hasChanges ? (
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: hc ? theme.text : theme.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: `${danger}1C` }}>
                <Text style={{ color: danger, fontSize: fs(10.5), fontWeight: '800', letterSpacing: 0.3 }}>{changes.length} DEĞİŞİKLİK</Text>
              </View>
              <Text style={{ color: hc ? theme.text : dim, fontSize: fs(12), fontWeight: '500', flex: 1 }}>Sıfırlanacak ayarlar</Text>
            </View>
            <View style={{ gap: 10 }}>
              {changes.map((c) => (
                <View key={c.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: hc ? theme.text : theme.textMuted }} />
                  <Text style={{ color: hc ? theme.text : theme.text, fontSize: fs(12.5), fontWeight: '500', flex: 1 }} numberOfLines={1}>{c.label}</Text>
                  <Text style={{ color: hc ? theme.text : dim, fontSize: fs(11.5), fontWeight: '700' }}>{c.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: hc ? theme.text : theme.border }}>
            <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
            <Text style={{ color: hc ? theme.text : dim, fontSize: fs(12.5), fontWeight: '500', flex: 1 }}>Tüm erişilebilirlik ayarları varsayılanda</Text>
          </View>
        )}
        <Row last item={{
          id: 'a11y-reset', type: 'action', icon: 'refresh-outline',
          label: hasChanges ? `${changes.length} ayarı varsayılana döndür` : 'Sıfırlanacak ayar yok',
          danger: hasChanges, disabled: !hasChanges, onPress: onReset,
        }} />
      </Group>
      <Text style={{ color: hc ? theme.text : theme.textMuted, fontSize: fs(11), lineHeight: fs(16), textAlign: 'center', marginTop: 4, marginBottom: 8, paddingHorizontal: 12 }}>
        Bu ayarlar yalnızca bu cihazda saklanır.
      </Text>
    </View>
  );
});

/* ================================================================
   ANA EKRAN
   ================================================================ */
export default function SettingsScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState(null);
  const [picker, setPicker] = useState(null);
  const [info, setInfo] = useState(null);
  const [locationModal, setLocationModal] = useState(false);
  const [themeModal, setThemeModal] = useState(false);
  const [themeTab, setThemeTab] = useState('theme');
  const [searchQuery, setSearchQuery] = useState('');
  const [resetting, setResetting] = useState(false);

  const defaultRegion = useMemo(() => {
    const loc = useAppStore.getState().selectedLocation;
    if (loc?.country) return normalizeForSearch(loc.country) === 'turkiye' ? 'tr' : 'abroad';
    return detectIsTurkey() ? 'tr' : 'abroad';
  }, []);
  const [locationRegion, setLocationRegion] = useState(defaultRegion);
  const [selectedCityRef, setSelectedCityRef] = useState(null);
  const [query, setQuery] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState({ status: 'idle', results: [] });
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimerRef = useRef(null);
  const scrollRef = useRef(null);
  const fade = useRef(new Animated.Value(1)).current;
  const greeting = useMemo(() => getGreetingByClock(), []);

  const showToast = useCallback((message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => setToast((p) => ({ ...p, visible: false })), 2200);
  }, []);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const rawTheme = useTheme();
  const themeMode = useAppStore((s) => s.themeMode);
  const accentColor = useAppStore((s) => s.accentColor);
  const isSimpleMode = useAppStore((s) => s.isSimpleMode);
  const location = useAppStore((s) => s.selectedLocation);
  const setSelectedLocation = useAppStore((s) => s.setSelectedLocation);
  const highContrast = useAppStore((s) => s.highContrast) ?? false;
  const setHighContrast = useAppStore((s) => s.setHighContrast);
  const reduceMotion = useAppStore((s) => s.reduceMotion) ?? false;
  const setReduceMotion = useAppStore((s) => s.setReduceMotion);
  const largeTouchTargets = useAppStore((s) => s.largeTouchTargets) ?? false;
  const setLargeTouchTargets = useAppStore((s) => s.setLargeTouchTargets);
  const dyslexiaFont = useAppStore((s) => s.dyslexiaFont) ?? false;
  const setDyslexiaFont = useAppStore((s) => s.setDyslexiaFont);

  const widgetsConfig = useAppStore((s) => s.widgetsConfig) || {
    showVerseCard: true, showDuaCard: true, showEsmaCard: true,
    showProgressTrack: true, showKerahatWarning: true,
    notificationsEnabled: true, reminderBeforeMinutes: 15,
    notificationSound: true, notificationVibrate: true,
    fridayReminder: false, quietHoursEnabled: false,
  };
  const homePrefs = useAppStore((s) => s.homePrefs) || {
    showCountdown: true, showDailyVerse: false,
    showStickyHero: true, showHijriInHeader: true, showPrayerStrip: true,
    showDailyProgress: true, showQuickActions: true, showDailyNames: true,
    showNotificationsCard: true, showManeviContent: true,
  };
  const tesbihatAutoAdvance = useAppStore((s) => s.tesbihatAutoAdvance) ?? true;
  const globalHaptic = useAppStore((s) => s.globalHaptic) ?? true;
  const readingFontScale = useAppStore((s) => s.readingFontScale) ?? 1.0;

  const prayerMethod = useAppStore((s) => s.prayerMethod) ?? 13;
  const tuneMinutes = useAppStore((s) => s.tuneMinutes) ?? 0;
  const mealEdition = useAppStore((s) => s.mealEdition) ?? 'tr.diyanet';
  const showArabic = useAppStore((s) => s.showArabic) ?? true;
  const prayerDataSource = useAppStore((s) => s.prayerDataSource) ?? 'auto';
  const quranSource = useAppStore((s) => s.quranSource) ?? 'offline';
  const readingMode = useAppStore((s) => s.readingMode) ?? 'full';

  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const setAccentColor = useAppStore((s) => s.setAccentColor);
  const setSimpleMode = useAppStore((s) => s.setSimpleMode);
  const toggleSimpleMode = useAppStore((s) => s.toggleSimpleMode);
  const toggleWidget = useAppStore((s) => s.toggleWidget);
  const setReminderBeforeMinutes = useAppStore((s) => s.setReminderBeforeMinutes);
  const setPrayerMethod = useAppStore((s) => s.setPrayerMethod);
  const setTuneMinutes = useAppStore((s) => s.setTuneMinutes);
  const setMealEdition = useAppStore((s) => s.setMealEdition);
  const toggleShowArabic = useAppStore((s) => s.toggleShowArabic);
  const setPrayerDataSource = useAppStore((s) => s.setPrayerDataSource);
  const setQuranSource = useAppStore((s) => s.setQuranSource);
  const setReadingMode = useAppStore((s) => s.setReadingMode);
  const setReadingFontScale = useAppStore((s) => s.setReadingFontScale);
  const setHomePref = useAppStore((s) => s.setHomePref);
  const setTesbihatAutoAdvance = useAppStore((s) => s.setTesbihatAutoAdvance);
  const setGlobalHaptic = useAppStore((s) => s.setGlobalHaptic);
  const resetAll = useAppStore((s) => s.resetAll);

  const theme = useMemo(() => {
    if (!highContrast) return rawTheme;
    return {
      ...rawTheme,
      background: '#000000', surface: '#121212', surfaceElevated: '#1E1E1E',
      text: '#FFFFFF', textDim: '#E0E0E0', textMuted: '#BDBDBD', border: '#FFFFFF',
      primary: '#FFFF00', primaryGlow: 'rgba(255, 255, 0, 0.3)', onPrimary: '#000000',
    };
  }, [rawTheme, highContrast]);

  const isLight = !highContrast && LIGHT_MODES.includes(theme.mode);
  const statusBarStyle = isLight ? 'dark-content' : 'light-content';
  const onPrimaryColor = highContrast ? '#000000' : (theme.onPrimary || '#FFFFFF');
  const settingsScale = 1 + (readingFontScale - 1) * 0.5;

  const ui = useMemo(() => ({
    theme, hc: highContrast, calm: reduceMotion, big: largeTouchTargets,
    fs: (n) => Math.max(1, Math.round(n * settingsScale)),
    dim: theme.textDim, border: highContrast ? theme.text : theme.border,
    danger: isLight ? '#B91C1C' : '#F87171',
    success: isLight ? '#16A34A' : '#22C55E',
    onPrimary: onPrimaryColor,
  }), [theme, highContrast, reduceMotion, largeTouchTargets, isLight, settingsScale, onPrimaryColor]);
  const { dim, border, hc } = ui;
  const headerBtnSize = largeTouchTargets ? 54 : 46;

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
    if (reduceMotion) { fade.setValue(1); return; }
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE }).start();
  }, [page, reduceMotion, fade]);

  useEffect(() => {
    if (IS_WEB) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (page) { setPage(null); return true; }
      if (onBack) { onBack(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [page, onBack]);

  const currentPreset = useMemo(() => {
    if (Math.abs(readingFontScale - 1.3) < 0.02 && largeTouchTargets) return 'extra';
    if (Math.abs(readingFontScale - 1.15) < 0.02 && largeTouchTargets) return 'large';
    if (Math.abs(readingFontScale - 1.0) < 0.02 && !largeTouchTargets) return 'normal';
    return null;
  }, [readingFontScale, largeTouchTargets]);

  const selectedMethodName = CALCULATION_METHODS.find((m) => Number(m.id) === prayerMethod)?.name ?? CALCULATION_METHODS[0].name;
  const selectedDataSource = DATA_SOURCES.find((d) => d.id === prayerDataSource) ?? DATA_SOURCES[0];
  const availableQuranSources = useMemo(() => QURAN_SOURCE_LIST.filter((q) => !q.requiresApiKey), []);
  const selectedQuranSource = availableQuranSources.find((q) => q.id === quranSource) ?? availableQuranSources[0] ?? QURAN_SOURCE_LIST[0];
  const selectedThemeMode = THEME_MODES.find((t) => t.id === themeMode) ?? THEME_MODES[0];
  const accentName = ACCENT_COLORS[accentColor]?.name ?? 'Zümrüt';
  const readingModeLabel = READING_MODE_OPTIONS.find((r) => r.id === readingMode)?.name ?? 'Tam metin';
  const readingFontLabel = FONT_SCALE_OPTIONS.find((f) => f.id === readingFontScale)?.name ?? 'Normal';
  const mealEditionLabel = getMealEditionName(mealEdition);
  const notifEnabled = widgetsConfig.notificationsEnabled ?? true;
  const reminderText = widgetsConfig.reminderBeforeMinutes === 0 ? 'Vakit girdiğinde' : `Vakitten ${widgetsConfig.reminderBeforeMinutes} dk önce`;
  const locationLabel = location?.district
    ? `${location.district}${location.city && location.city !== location.district ? ', ' + location.city : ''}`
    : 'Seçilmedi';

  const allowedAccentIds = useMemo(() => {
    try {
      const store = useAppStore.getState();
      if (typeof store.getAvailableAccents === 'function') {
        const list = store.getAvailableAccents(themeMode);
        if (Array.isArray(list) && list.length > 0) return new Set(list);
      }
    } catch {}
    return new Set(Object.keys(ACCENT_COLORS));
  }, [themeMode]);

  const visibleAccentGroups = useMemo(() => ACCENT_GROUPS
    .map((g) => ({ ...g, ids: g.ids.filter((id) => allowedAccentIds.has(id)) }))
    .filter((g) => g.ids.length > 0), [allowedAccentIds]);

  const totalAllowedAccents = useMemo(
    () => visibleAccentGroups.reduce((s, g) => s + g.ids.length, 0),
    [visibleAccentGroups]
  );

  const openLocationModal = useCallback(() => {
    const isTrLoc = location?.country ? normalizeForSearch(location.country) === 'turkiye' : detectIsTurkey();
    setLocationRegion(isTrLoc ? 'tr' : 'abroad');
    setSelectedCityRef(null);
    setQuery('');
    setSearch({ status: 'idle', results: [] });
    setLocationModal(true);
  }, [location?.country]);

  useEffect(() => {
    if (!locationModal) { setQuery(''); setSelectedCityRef(null); setSearch({ status: 'idle', results: [] }); }
  }, [locationModal]);

  useEffect(() => {
    if (!locationModal) return undefined;
    const q = query.trim();
    if (locationRegion === 'tr') {
      if (!q && !selectedCityRef) { setSearch({ status: 'done', results: CITY_GROUP_LIST }); return undefined; }
      if (!q && selectedCityRef) { setSearch({ status: 'done', results: getCityDistrictItems(selectedCityRef) }); return undefined; }
      const task = InteractionManager.runAfterInteractions(() => {
        const results = searchTurkeyLocations(q, selectedCityRef, 25);
        setSearch({ status: 'done', results });
      });
      return () => task?.cancel?.();
    }
    if (q.length < 2) { setSearch({ status: 'idle', results: [] }); return undefined; }
    setSearch((prev) => ({ ...prev, status: 'loading' }));
    const controller = new AbortController();
    let timedOut = false;
    let timeoutId;
    const debounceId = setTimeout(async () => {
      timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, SEARCH_TIMEOUT_MS);
      try {
        const res = await fetch(`${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=12&language=tr&format=json`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const seen = new Set();
        const results = (Array.isArray(data.results) ? data.results : [])
          .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
          .map(mapGeocodingResult)
          .filter((item) => (seen.has(item.id) ? false : seen.add(item.id)));
        setSearch({ status: 'done', results });
      } catch (e) {
        if (e?.name === 'AbortError' && !timedOut) return;
        setSearch({ status: 'error', results: [] });
      } finally { clearTimeout(timeoutId); }
    }, DEBOUNCE_MS);
    return () => { clearTimeout(debounceId); clearTimeout(timeoutId); controller.abort(); };
  }, [query, retryKey, locationModal, locationRegion, selectedCityRef]);

  const applyPreset = useCallback((preset) => {
    hapticImpact('medium');
    try {
      setReadingFontScale(preset.settings.readingFontScale);
      setLargeTouchTargets(preset.settings.largeTouchTargets);
      hapticSuccess();
      showToast(`Yazı boyutu: ${preset.label}`);
    } catch (e) { if (__DEV__) console.warn('[Settings] Preset error:', e); }
  }, [setReadingFontScale, setLargeTouchTargets, showToast]);

  const onSimpleModeToggle = useCallback(() => {
    hapticImpact('medium');
    const willEnable = !isSimpleMode;
    toggleSimpleMode();
    if (willEnable) hapticSuccess();
    showToast(willEnable ? 'Basit mod açıldı' : 'Basit mod kapatıldı');
  }, [isSimpleMode, toggleSimpleMode, showToast]);

  const setHomePrefWithFeedback = useCallback((key, value, label) => {
    setHomePref(key, value);
    showToast(`${label}: ${value ? 'açık' : 'kapalı'}`);
  }, [setHomePref, showToast]);

  const onNotificationsToggle = useCallback(async () => {
    const willEnable = !notifEnabled;
    toggleWidget('notificationsEnabled');
    if (!willEnable) { try { await cancelPrayerNotifications(); } catch {} }
    hapticSuccess();
    showToast(willEnable ? 'Bildirimler açıldı' : 'Bildirimler kapatıldı');
  }, [notifEnabled, toggleWidget, showToast]);

  const onToggleHighContrast = useCallback((v) => { setHighContrast(v); showToast(`Yüksek kontrast: ${v ? 'açık' : 'kapalı'}`); }, [setHighContrast, showToast]);
  const onToggleDyslexia = useCallback((v) => { setDyslexiaFont(v); showToast(`Okuma dostu yazı tipi: ${v ? 'açık' : 'kapalı'}`); }, [setDyslexiaFont, showToast]);
  const onToggleLargeTargets = useCallback((v) => { setLargeTouchTargets(v); showToast(`Büyük dokunma hedefleri: ${v ? 'açık' : 'kapalı'}`); }, [setLargeTouchTargets, showToast]);
  const onToggleReduceMotion = useCallback((v) => { setReduceMotion(v); showToast(`Animasyonlar: ${v ? 'azaltıldı' : 'açık'}`); }, [setReduceMotion, showToast]);
  const onToggleHaptic = useCallback((v) => { setGlobalHaptic(v); if (v) hapticImpact('medium'); showToast(`Titreşim: ${v ? 'açık' : 'kapalı'}`); }, [setGlobalHaptic, showToast]);

  const onResetAccessibility = useCallback(() => {
    const changes = getA11yChanges({ readingFontScale, highContrast, dyslexiaFont, largeTouchTargets, reduceMotion, globalHaptic, isSimpleMode });
    if (changes.length === 0) { showToast('Tüm ayarlar zaten varsayılanda'); return; }
    const listText = changes.map((c) => `• ${c.label}: ${c.value}`).join('\n');
    Alert.alert('Erişilebilirlik ayarları sıfırlansın mı?', `${changes.length} ayar varsayılana dönecek:\n\n${listText}`, [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sıfırla', style: 'destructive', onPress: () => {
        setReadingFontScale(A11Y_DEFAULTS.readingFontScale);
        setLargeTouchTargets(A11Y_DEFAULTS.largeTouchTargets);
        setHighContrast(A11Y_DEFAULTS.highContrast);
        setDyslexiaFont(A11Y_DEFAULTS.dyslexiaFont);
        setReduceMotion(A11Y_DEFAULTS.reduceMotion);
        setGlobalHaptic(A11Y_DEFAULTS.globalHaptic);
        setSimpleMode(A11Y_DEFAULTS.isSimpleMode);
        hapticSuccess();
        showToast(`${changes.length} ayar varsayılana döndürüldü`);
      } },
    ]);
  }, [readingFontScale, highContrast, dyslexiaFont, largeTouchTargets, reduceMotion, globalHaptic, isSimpleMode,
      setReadingFontScale, setLargeTouchTargets, setHighContrast, setDyslexiaFont, setReduceMotion, setGlobalHaptic, setSimpleMode, showToast]);

  /* ============================================================
     GPS — Yüksek doğruluk + idari sınır (il/ilçe) doğrulamalı seçim
     ============================================================ */
  const handleAutoGPS = async () => {
    if (detectingLocation) return;
    setDetectingLocation(true);
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) { Alert.alert('Konum kapalı', 'Lütfen cihazınızın konum servislerini açın.'); return; }

      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { Alert.alert('İzin verilmedi', 'Vakitleri otomatik hesaplamak için konum izni gerekiyor.'); return; }

      // Android'de ağ/baz istasyonu yerine gerçek GPS donanımını zorla
      if (Platform.OS === 'android' && typeof Location.enableNetworkProviderAsync === 'function') {
        try { await withTimeout(Location.enableNetworkProviderAsync(), 5000); } catch {}
      }

      // 1) Son bilinen konum: yalnız çok taze (30 sn) ve yüksek doğruluklu (<= 35m) ise ön aday al
      let best = null;
      try {
        best = await Location.getLastKnownPositionAsync({
          maxAge: 30 * 1000,
          requiredAccuracy: 35,
        });
      } catch { best = null; }

      let bestAcc = best?.coords?.accuracy ?? Infinity;

      // 2) Taze GPS sabitlemesi için BestForNavigation / Highest ile çoklu okuma (watchPositionAsync)
      if (!best || bestAcc > 35) {
        let watcher = null;
        try {
          await new Promise((resolve) => {
            let settled = false;
            const finish = () => {
              if (settled) return;
              settled = true;
              clearTimeout(maxTimer);
              try { watcher?.remove?.(); } catch {}
              resolve();
            };

            const maxTimer = setTimeout(finish, 12000);

            Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.BestForNavigation ?? Location.Accuracy.Highest,
                timeInterval: 800,
                distanceInterval: 0,
              },
              (pos) => {
                if (!pos?.coords) return;
                const acc = pos.coords.accuracy ?? Infinity;
                if (!best || acc < bestAcc) {
                  best = pos;
                  bestAcc = acc;
                }
                // 30m altına inildiyse yeterli hassasiyete ulaşıldı
                if (acc <= 30) finish();
              },
            )
              .then((sub) => {
                if (settled) {
                  try { sub?.remove?.(); } catch {}
                } else {
                  watcher = sub;
                }
              })
              .catch(() => finish());
          });
        } catch {}
      }

      // 3) Hâlâ konum yoksa tek seferlik High fallback
      if (!best) {
        try {
          best = await withTimeout(
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
            15000,
          );
        } catch {}
      }

      if (!best?.coords) {
        Alert.alert('Konum alınamadı', 'Lütfen şehri arayarak seçin.');
        return;
      }

      const { latitude, longitude, accuracy } = best.coords;
      const accLabel = formatAccuracy(accuracy);

      // 4) İdari sınır doğrulaması (İzmit Körfezi gibi kıyı/deniz aşırı ilçelerin karışmasını önler)
      let place = null;
      try {
        const results = await withTimeout(Location.reverseGeocodeAsync({ latitude, longitude }), 6000);
        place = Array.isArray(results) ? results[0] : null;
      } catch { place = null; }

      // 5) Türkiye il/ilçe veri tabanıyla idari + mesafe bazlı eşleştirme
      const isTurkeyCoord =
        normalizeForSearch(place?.country) === 'turkiye' ||
        place?.isoCountryCode === 'TR' ||
        (latitude >= 35.8 && latitude <= 42.2 && longitude >= 25.6 && longitude <= 44.9);

      if (isTurkeyCoord) {
        const localMatch = resolveBestTurkeyLocation(latitude, longitude, place);
        if (localMatch && typeof setSelectedLocation === 'function') {
          setSelectedLocation({
            city: localMatch.city,
            district: localMatch.district,
            country: 'Türkiye',
            timezone: 'Europe/Istanbul',
            latitude,
            longitude,
            isAutoGPS: true,
          });
          hapticSuccess();
          const suffix = accLabel ? ` · ${accLabel}` : '';
          showToast(`Konum: ${localMatch.district}, ${localMatch.city}${suffix}`);
          setLocationModal(false);
          return;
        }
      }

      // 6) Yurt dışı / genel reverse geocode fallback
      if (!place) {
        Alert.alert(
          'Konum belirlenemedi',
          'Koordinatlarınız alındı ancak şehir/ilçe tespit edilemedi. Lütfen listeden manuel seçin.',
        );
        return;
      }

      const city = place.region || place.city || place.subregion || 'Konumum';
      const districtCandidate = place.subregion || place.city || place.district;
      const district = districtCandidate && districtCandidate !== city ? districtCandidate : city;

      if (typeof setSelectedLocation === 'function') {
        setSelectedLocation({
          city,
          district,
          country: place.country || '',
          latitude,
          longitude,
          isAutoGPS: true,
        });
        hapticSuccess();
        const suffix = accLabel ? ` · ${accLabel}` : '';
        showToast(`Konum: ${district}, ${city}${suffix}`);
        setLocationModal(false);
      }
    } catch {
      Alert.alert('Konum alınamadı', 'Lütfen şehri arayarak seçin.');
    } finally {
      setDetectingLocation(false);
    }
  };

  const handleSelectPlace = useCallback((item) => {
    if (item.isCityGroup && item.cityRef) { hapticImpact('light'); setSelectedCityRef(item.cityRef); setQuery(''); return; }
    hapticImpact('medium');
    if (typeof setSelectedLocation === 'function') {
      setSelectedLocation({ city: item.city, district: item.district, country: item.country, timezone: item.timezone, latitude: item.latitude, longitude: item.longitude, isAutoGPS: false });
      hapticSuccess(); showToast(`Konum: ${item.district}, ${item.city}`); setLocationModal(false);
    }
  }, [setSelectedLocation, showToast]);

  const onThemeSelect = useCallback((item) => {
    hapticImpact();
    try {
      const prevAccent = useAppStore.getState().accentColor;
      setThemeMode(item.id);
      setTimeout(() => {
        const state = useAppStore.getState();
        if (state.themeMode !== item.id) {
          Alert.alert('Tema uygulanamadı', `"${item.name}" teması şu anda desteklenmiyor.`, [{ text: 'Tamam' }]);
          return;
        }
        showToast(state.accentColor !== prevAccent ? `Tema: ${item.name} · renk uyumlu` : `Tema: ${item.name}`);
      }, 50);
    } catch (e) { Alert.alert('Tema değiştirilemedi', e?.message || 'Bilinmeyen bir sorun oluştu.'); }
  }, [setThemeMode, showToast]);

  const handleAccentSelect = useCallback((id) => {
    const color = ACCENT_COLORS[id];
    if (!color) return;
    if (!allowedAccentIds.has(id)) return;
    hapticImpact('light');
    setAccentColor(id);
    showToast(`Renk: ${color.name}`);
  }, [allowedAccentIds, setAccentColor, showToast]);

  const handleResetAll = () => {
    if (resetting) return;
    Alert.alert('Tüm veriler silinsin mi?', 'Tüm tercihleriniz ve kayıtlı verileriniz silinir. Bu işlem geri alınamaz.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Hepsini sil', style: 'destructive', onPress: async () => {
        setResetting(true);
        try {
          await resetAll(); hapticSuccess(); setPage(null); setSearchQuery(''); showToast('Tüm veriler sıfırlandı');
        } catch { Alert.alert('Sıfırlanamadı', 'Lütfen tekrar deneyin.'); }
        finally { setResetting(false); }
      } },
    ]);
  };

  const clearCache = () => {
    Alert.alert('Önbellek temizlensin mi?', 'Çevrimdışı veriler silinir. Tercihleriniz korunur.', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Temizle', style: 'destructive', onPress: async () => {
        try {
          await clearPrayerCache(); await clearUmmahContentCache(); await clearDiyanetCache(); await clearHomeCache();
          try { await clearAllQuranCache(); } catch {}
          hapticSuccess(); showToast('Önbellek temizlendi');
        } catch { Alert.alert('Temizlenemedi', 'Lütfen tekrar deneyin.'); }
      } },
    ]);
  };

  const handleFeedback = async () => {
    hapticImpact();
    if (IS_WEB) {
      const subject = encodeURIComponent(`${APP_NAME} geri bildirim`);
      const body = encodeURIComponent(`${APP_NAME} v${APP_VERSION}\nPlatform: web\n\n[Düşüncelerinizi buraya yazın]`);
      openLink(`${CONTACT_EMAIL}?subject=${subject}&body=${body}`);
      return;
    }
    try {
      await Share.share({
        message: `${APP_NAME} v${APP_VERSION} hakkında geri bildirim:\n\n[Düşüncelerinizi buraya yazın]\n\n---\nPlatform: ${Platform.OS}\nKonum: ${location?.district ?? '?'}, ${location?.city ?? '?'}`,
        title: `${APP_NAME} geri bildirim`,
      });
    } catch {}
  };

  const pickers = {
    dataSource: { title: 'Veri kaynağı', subtitle: 'Namaz vakitlerinin hangi sunucudan alınacağını seçin', options: DATA_SOURCES.map((d) => ({ id: d.id, label: d.name, desc: d.desc, icon: d.icon })), selected: prayerDataSource, onSelect: (o) => { setPrayerDataSource(o.id); return `Kaynak: ${o.label}`; } },
    method: { title: 'Hesaplama yöntemi', subtitle: 'Vakit hesabında kullanılan astronomik standart', options: CALCULATION_METHODS.map((m) => ({ id: m.id, label: m.name })), selected: String(prayerMethod), onSelect: (o) => { setPrayerMethod(Number(o.id)); return 'Yöntem güncellendi'; } },
    tune: { title: 'Sapma dakikaları', subtitle: 'Tüm vakitlere uygulanacak düzeltme', options: TUNE_OPTIONS.map((v) => ({ id: String(v), label: v === 0 ? 'Sapma yok' : `${v > 0 ? '+' : ''}${v} dakika` })), selected: String(tuneMinutes), onSelect: (o) => { const v = Number(o.id); setTuneMinutes(v); return v === 0 ? 'Sapma kaldırıldı' : `${v > 0 ? '+' : ''}${v} dk`; } },
    reminder: { title: 'Hatırlatma zamanı', subtitle: 'Vakitten ne kadar önce bildirim gelsin', options: REMINDER_OPTIONS.map((m) => ({ id: String(m), label: m === 0 ? 'Vakit girdiğinde' : `${m} dakika önce` })), selected: String(widgetsConfig.reminderBeforeMinutes ?? 15), onSelect: (o) => { const m = Number(o.id); setReminderBeforeMinutes(m); return m === 0 ? 'Vakit girdiğinde' : `${m} dk önce`; } },
    meal: { title: 'Meal kaynağı', subtitle: "Ana sayfadaki vakit ayetleri ve Kur'an mealleri bu yayınevine aittir", options: MEAL_EDITIONS.map((m) => ({ id: m.id, label: m.name })), selected: mealEdition, onSelect: (o) => { setMealEdition(o.id); return `Meal: ${o.label}`; }, footer: "Seçili kaynak; ana sayfadaki vakit ayetleri, dualar ve Kur'an okuma ekranlarındaki tüm ayet meallerini etkiler." },
    readingMode: { title: 'Okuma modu', subtitle: 'Dua, sure ve zikirlerin nasıl gösterileceğini seçin', options: READING_MODE_OPTIONS.map((r) => ({ id: r.id, label: r.name, desc: r.desc, icon: r.icon })), selected: readingMode, onSelect: (o) => { setReadingMode(o.id); return `Okuma modu: ${o.label}`; } },
    fontScale: { title: 'Okuma yazısı boyutu', subtitle: "Kur'an, dua ve tesbihat yazılarının boyutu", options: FONT_SCALE_OPTIONS.map((f) => ({ id: String(f.id), label: f.name, desc: f.desc })), selected: String(readingFontScale), onSelect: (o) => { setReadingFontScale(Number(o.id)); return `Yazı boyutu: ${o.label}`; } },
    quranSource: { title: "Kur'an kaynağı", subtitle: 'Metin ve meal kaynağı', options: availableQuranSources.map((q) => ({ id: q.id, label: q.label, desc: q.description })), selected: quranSource, onSelect: (o) => { setQuranSource(o.id); return `Kur'an: ${o.label}`; } },
  };
  const activePicker = picker ? pickers[picker] : null;

  const choose = (option) => {
    if (!activePicker) return;
    hapticImpact();
    const message = activePicker.onSelect(option);
    if (message === false) return;
    setPicker(null); hapticSuccess();
    if (message) showToast(message);
  };

  const items = useMemo(() => {
    const list = [];
    const add = (cat, group, it) => list.push({ ...it, cat, group });
    const homeToggle = (id, group, icon, label, desc, key, fb, def = true) => add('look', group, { id, type: 'switch', icon, label, desc, keywords: fb, on: def ? homePrefs[key] !== false : homePrefs[key] === true, onChange: (v) => setHomePrefWithFeedback(key, v, fb) });
    const cardToggle = (id, group, icon, label, desc, key) => add('look', group, { id, type: 'switch', icon, label, desc, on: widgetsConfig[key] !== false, onChange: () => toggleWidget(key) });

    add('prayer', 'Konum', { id: 'location', type: 'link', icon: 'location-outline', label: 'Konum', desc: 'Namaz vakitleri bu konuma göre hesaplanır', value: locationLabel, keywords: 'şehir il ilçe lokasyon gps türkiye yurt dışı', onPress: openLocationModal });
    add('prayer', 'Hesaplama', { id: 'dataSource', type: 'link', icon: 'server-outline', label: 'Veri kaynağı', desc: 'Vakitler nereden alınsın', value: selectedDataSource.name, keywords: 'diyanet aladhan api sunucu', onPress: () => setPicker('dataSource') });
    add('prayer', 'Hesaplama', { id: 'method', type: 'link', icon: 'calculator-outline', label: 'Hesaplama yöntemi', desc: 'Vakit hesabında kullanılan standart', value: selectedMethodName, keywords: 'metot diyanet mwl isna', onPress: () => setPicker('method') });
    add('prayer', 'Hesaplama', { id: 'tune', type: 'link', icon: 'time-outline', label: 'Sapma dakikaları', desc: 'Tüm vakitlere artı veya eksi düzeltme', value: tuneMinutes === 0 ? 'Yok' : `${tuneMinutes > 0 ? '+' : ''}${tuneMinutes} dk`, keywords: 'düzeltme tune', onPress: () => setPicker('tune') });

    add('notifications', 'Vakit bildirimleri', { id: 'notifications', type: 'switch', icon: notifEnabled ? 'notifications-outline' : 'notifications-off-outline', label: 'Vakit bildirimleri', desc: notifEnabled ? 'Açık' : 'Kapalı', keywords: 'hatırlatma alarm ezan', on: notifEnabled, onChange: onNotificationsToggle });
    add('notifications', 'Vakit bildirimleri', { id: 'reminder', type: 'link', icon: 'alarm-outline', label: 'Hatırlatma zamanı', desc: notifEnabled ? 'Vakitten ne kadar önce bildirim gelsin' : 'Önce vakit bildirimlerini açın', value: notifEnabled ? reminderText : undefined, keywords: 'dakika önce', disabled: !notifEnabled, onPress: () => setPicker('reminder') });
    add('notifications', 'Bildirim tarzı', { id: 'notifSound', type: 'switch', icon: 'volume-medium-outline', label: 'Bildirim sesi', desc: 'Bildirimlerde ses çal', keywords: 'ses uyarı', on: widgetsConfig.notificationSound !== false, onChange: () => toggleWidget('notificationSound') });
    add('notifications', 'Bildirim tarzı', { id: 'notifVibrate', type: 'switch', icon: 'phone-portrait-outline', label: 'Bildirim titreşimi', desc: 'Bildirimlerde titret', keywords: 'titreşim vibrate', on: widgetsConfig.notificationVibrate !== false, onChange: () => toggleWidget('notificationVibrate') });
    add('notifications', 'Özel zamanlar', { id: 'fridayReminder', type: 'switch', icon: 'calendar-outline', label: 'Cuma hatırlatması', desc: 'Cuma günleri özel hatırlatma', keywords: 'cuma günü', on: widgetsConfig.fridayReminder === true, onChange: () => toggleWidget('fridayReminder') });
    add('notifications', 'Özel zamanlar', { id: 'quietHours', type: 'switch', icon: 'moon-outline', label: 'Sessiz saatler', desc: '00:00 – 05:00 arası bildirim yok', keywords: 'gece rahatsız etme', on: widgetsConfig.quietHoursEnabled === true, onChange: () => toggleWidget('quietHoursEnabled') });

    add('look', 'Tema', { id: 'theme', type: 'link', icon: 'color-palette-outline', label: 'Tema ve renk', desc: 'Uygulamanın genel görünümü', value: `${selectedThemeMode.name} · ${accentName}`, keywords: 'karanlık aydınlık dark light siyah vurgu', onPress: () => { setThemeTab('theme'); setThemeModal(true); } });
    homeToggle('showStickyHero', 'Ana sayfanın üstü', 'albums-outline', 'Sabit mini kart', 'Aşağı kaydırınca üstte sıradaki vakit görünür', 'showStickyHero', 'Sabit kart');
    homeToggle('showHijriInHeader', 'Ana sayfanın üstü', 'moon-outline', 'Hicri tarih', 'Başlığın altında hicri tarihi göster', 'showHijriInHeader', 'Hicri tarih');
    homeToggle('showPrayerStrip', 'Ana sayfanın üstü', 'apps-outline', 'Vakit şeridi', 'Yatay vakit kartları', 'showPrayerStrip', 'Vakit şeridi');
    homeToggle('showCountdown', 'Ana sayfanın üstü', 'timer-outline', 'Geri sayım', 'Sıradaki vakte kalan süre', 'showCountdown', 'Geri sayım');
    homeToggle('showDailyProgress', 'Ana sayfa içeriği', 'stopwatch-outline', 'Bugünkü ilerleme', 'Bugün kaç vakit geçti, kaç kaldı', 'showDailyProgress', 'İlerleme');
    homeToggle('showQuickActions', 'Ana sayfa içeriği', 'compass-outline', 'Keşfet düğmeleri', 'Kıble, zikir, dualar ve takvim kısayolları', 'showQuickActions', 'Keşfet düğmeleri');
    homeToggle('showDailyNames', 'Ana sayfa içeriği', 'library-outline', 'Günün isimleri', 'Kız ve erkek isim önerileri', 'showDailyNames', 'Günün isimleri');
    homeToggle('showNotificationsCard', 'Ana sayfa içeriği', 'notifications-outline', 'Hatırlatmalar kartı', 'Bildirim ayarlarına hızlı erişim', 'showNotificationsCard', 'Hatırlatmalar kartı');
    homeToggle('showManeviContent', 'Ana sayfa içeriği', 'sparkles-outline', 'Manevi içerik bölümü', 'Vakte özel ayet, dua ve esma kartları', 'showManeviContent', 'Manevi içerik');
    homeToggle('showDailyVerse', 'Ana sayfa içeriği', 'book-outline', 'Günün ayeti', 'Her gün farklı bir ayet', 'showDailyVerse', 'Günün ayeti', false);
    cardToggle('verseCard', 'Manevi içerik kartları', 'albums-outline', 'Vakit ayeti', 'Ayet kartını göster', 'showVerseCard');
    cardToggle('duaCard', 'Manevi içerik kartları', 'heart-outline', 'Vakit duası', 'Dua kartını göster', 'showDuaCard');
    cardToggle('esmaCard', 'Manevi içerik kartları', 'sparkles-outline', 'Esmaül Hüsna', 'Esma kartını göster', 'showEsmaCard');
    cardToggle('progressTrack', 'Vakit kartı', 'pie-chart-outline', 'İlerleme çubuğu', 'Vakit içi ilerleme göstergesi', 'showProgressTrack');
    cardToggle('kerahat', 'Vakit kartı', 'warning-outline', 'Kerahat uyarıları', 'Kerahat vakitlerinde görsel uyarı', 'showKerahatWarning');

    add('reading', "Kur'an", { id: 'quranSource', type: 'link', icon: 'library-outline', label: "Kur'an kaynağı", desc: 'Metin ve meal kaynağı', value: selectedQuranSource.label, keywords: 'quran offline diyanet', onPress: () => setPicker('quranSource') });
    add('reading', 'Meal ve gösterim', { id: 'readingMode', type: 'link', icon: 'reader-outline', label: 'Okuma modu', desc: 'Arapça, okunuş ve meal gösterimi', value: readingModeLabel, keywords: 'arapça türkçe meal okunuş', onPress: () => setPicker('readingMode') });
    add('reading', 'Meal ve gösterim', { id: 'showArabic', type: 'switch', icon: 'language-outline', label: 'Arapça metni göster', desc: 'Kapalıysa yalnızca Türkçe görünür', keywords: 'arapça gizle', on: showArabic, onChange: () => toggleShowArabic() });
    add('reading', 'Meal ve gösterim', { id: 'mealEdition', type: 'link', icon: 'document-text-outline', label: 'Meal kaynağı', desc: "Ana sayfa vakit ayetleri ve Kur'an çevirisi için kullanılır", value: mealEditionLabel, keywords: 'meal edition kaynak çeviri ayet ana sayfa vakit kuran diyanet', onPress: () => setPicker('meal') });
    add('reading', 'Tesbihat', { id: 'tesbihatAuto', type: 'switch', icon: 'play-forward-outline', label: 'Otomatik ilerle', desc: 'Sayaç dolunca sonraki adıma geç', keywords: 'tesbihat sayaç', on: tesbihatAutoAdvance !== false, onChange: (v) => setTesbihatAutoAdvance(v) });

    add('access', 'Yazı ve düğme boyutu', { id: 'presets', type: 'custom', label: 'Kolay kullanım', keywords: 'kolay kullanım büyük yazı yaşlı normal çok büyük font punto', render: () => <PresetTiles currentPreset={currentPreset} onSelect={applyPreset} /> });
    add('access', 'Yazı ve düğme boyutu', { id: 'fontSizeDetail', type: 'link', icon: 'text-outline', label: 'Okuma yazısı boyutu', desc: "Kur'an, dua ve tesbihat yazıları", value: readingFontLabel, keywords: 'yazı boyut font punto', onPress: () => setPicker('fontScale') });
    add('access', 'Okuma ve görme', { id: 'highContrast', type: 'switch', icon: 'contrast-outline', label: 'Yüksek kontrast', desc: 'Metin ve arka plan farkını artırır', keywords: 'okunabilir görme', on: highContrast, onChange: onToggleHighContrast });
    add('access', 'Okuma ve görme', { id: 'dyslexiaFont', type: 'switch', icon: 'text-outline', label: 'Okuma dostu yazı tipi', desc: 'Disleksi için tasarlanmış OpenDyslexic', keywords: 'disleksi font yazı tipi', on: dyslexiaFont, onChange: onToggleDyslexia });
    add('access', 'Okuma ve görme', { id: 'largeTargets', type: 'switch', icon: 'hand-right-outline', label: 'Büyük dokunma hedefleri', desc: 'Düğmeleri ve satırları büyütür', keywords: 'buton hedef dokunma', on: largeTouchTargets, onChange: onToggleLargeTargets });
    add('access', 'Okuma ve görme', { id: 'simpleMode', type: 'switch', icon: 'accessibility-outline', label: 'Basit mod', desc: 'Çok büyük yazılar ve sade arayüz', keywords: 'yaşlı sade kolay', on: isSimpleMode, onChange: onSimpleModeToggle });
    add('access', 'Hareket ve dokunma', { id: 'reduceMotion', type: 'switch', icon: 'flash-off-outline', label: 'Animasyonları azalt', desc: 'Geçişleri ve hareketleri sadeleştirir', keywords: 'reduce motion hareket', on: reduceMotion, onChange: onToggleReduceMotion });
    add('access', 'Hareket ve dokunma', { id: 'haptic', type: 'switch', icon: 'hand-left-outline', label: 'Titreşimli geri bildirim', desc: 'Dokunuşlarda hafif titreşim', keywords: 'haptic dokunma', on: globalHaptic !== false, onChange: onToggleHaptic });
    add('access', 'Sıfırlama', { id: 'a11yReset', type: 'action', icon: 'refresh-outline', label: 'Erişilebilirlik ayarlarını sıfırla', desc: 'Yazı boyutu, kontrast ve hareket ayarlarını varsayılana döndürür', keywords: 'erişilebilirlik sıfırla reset varsayılan kolay kullanım', onPress: onResetAccessibility });

    add('data', 'Gizlilik', { id: 'privacy', type: 'link', icon: 'shield-checkmark-outline', label: 'Gizlilik politikası', desc: 'Hiçbir kişisel veri toplanmaz', value: 'Veri toplanmıyor', keywords: 'privacy veri toplama', onPress: () => setInfo('privacy') });
    add('data', 'Depolama', { id: 'clearCache', type: 'action', icon: 'trash-outline', label: 'Önbelleği temizle', desc: 'Çevrimdışı verileri siler, tercihlerinizi korur', keywords: 'cache sil', onPress: clearCache });
    add('data', 'Tehlikeli işlem', { id: 'resetAll', type: 'action', icon: 'warning-outline', danger: true, label: resetting ? 'Sıfırlanıyor…' : 'Tüm verileri sıfırla', desc: 'Uygulamayı ilk haline döndürür. Geri alınamaz.', keywords: 'reset fabrika ayar sil', busy: resetting, disabled: resetting, onPress: handleResetAll });

    add('about', 'Uygulama', { id: 'about', type: 'link', icon: 'apps-outline', label: 'Uygulama hakkında', value: `${APP_NAME} · v${APP_VERSION}`, plain: true, keywords: 'sürüm versiyon', onPress: () => setInfo('about') });
    add('about', 'Uygulama', { id: 'changelog', type: 'link', icon: 'list-outline', label: 'Değişiklik geçmişi', value: `v${APP_VERSION}`, plain: true, keywords: 'changelog sürüm notları', onPress: () => setInfo('changelog') });
    add('about', 'Uygulama', { id: 'credits', type: 'link', icon: 'heart-outline', label: 'Teşekkürler', desc: 'Açık kaynak servisler ve katkıda bulunanlar', keywords: 'kaynaklar credits katkı', onPress: () => setInfo('credits') });
    add('about', 'Destek', { id: 'feedback', type: 'action', icon: 'chatbubble-ellipses-outline', label: 'Geri bildirim gönder', desc: 'Düşüncelerinizi ve önerilerinizi paylaşın', keywords: 'öneri hata şikayet', onPress: handleFeedback });

    return list;
  }, [locationLabel, openLocationModal, selectedDataSource.name, selectedMethodName, tuneMinutes, notifEnabled, onNotificationsToggle, reminderText, widgetsConfig, selectedThemeMode.name, accentName, homePrefs, setHomePrefWithFeedback, toggleWidget, selectedQuranSource.label, readingModeLabel, showArabic, toggleShowArabic, mealEdition, mealEditionLabel, tesbihatAutoAdvance, setTesbihatAutoAdvance, currentPreset, applyPreset, readingFontLabel, highContrast, onToggleHighContrast, dyslexiaFont, onToggleDyslexia, largeTouchTargets, onToggleLargeTargets, isSimpleMode, onSimpleModeToggle, reduceMotion, onToggleReduceMotion, globalHaptic, onToggleHaptic, onResetAccessibility, resetting]);

  const searching = searchQuery.trim().length > 0;
  const q = normalize(searchQuery.trim());
  const results = searching ? items.filter((it) => {
    const catLabel = CATEGORIES.find((c) => c.id === it.cat)?.label;
    return [it.label, it.desc, it.value, it.keywords, it.group, catLabel].some((s) => normalize(s).includes(q));
  }) : [];
  const searchGroups = groupBy(results, (it) => CATEGORIES.find((c) => c.id === it.cat)?.label ?? '');
  const activeCat = CATEGORIES.find((c) => c.id === page) ?? null;
  const pageGroups = activeCat ? groupBy(items.filter((it) => it.cat === activeCat.id), (it) => it.group) : [];

  const categorySummary = (id) => {
    switch (id) {
      case 'prayer': return location?.district ? `${location.district} · ${selectedDataSource.name}` : 'Konum seçilmedi';
      case 'notifications': return notifEnabled ? reminderText : 'Kapalı';
      case 'look': return `${selectedThemeMode.name} · ${accentName}`;
      case 'reading': return `${readingModeLabel} · ${mealEditionLabel}`;
      case 'access': return [currentPreset ? ACCESSIBILITY_PRESETS.find((p) => p.id === currentPreset)?.label : 'Özel boyut', highContrast ? 'Yüksek kontrast' : null].filter(Boolean).join(' · ');
      case 'data': return 'Önbellek, gizlilik, sıfırlama';
      default: return `v${APP_VERSION}`;
    }
  };

  const renderGroupBlocks = (groups) => groups.map((g) => (
    <Group key={g.name} title={g.name} footer={g.name === 'Tehlikeli işlem' ? 'Tüm tercihleriniz ve kayıtlı verileriniz silinir.' : undefined} padded={g.items.length === 1 && g.items[0].type === 'custom'}>
      {g.items.map((it, i) => (it.type === 'custom' ? <React.Fragment key={it.id}>{it.render()}</React.Fragment> : <Row key={it.id} item={it} last={i === g.items.length - 1} />))}
    </Group>
  ));

  const headerTitle = activeCat ? activeCat.label : 'Ayarlar';
  const goBack = () => { hapticImpact(); if (activeCat) setPage(null); else onBack?.(); };
  const openCategory = useCallback((catId) => { hapticImpact(); setSearchQuery(''); setPage(catId); }, []);

  const locationListData = useMemo(() => {
    if (locationRegion === 'tr') return search.results;
    return search.results.length > 0 ? search.results : (query.trim().length < 2 ? POPULAR_ABROAD_PLACES : []);
  }, [locationRegion, search.results, query]);

  const rowHeight = largeTouchTargets ? 82 : 66;
  const getLocationItemLayout = useCallback((_, index) => ({ length: rowHeight, offset: rowHeight * index, index }), [rowHeight]);

  const renderLocationItem = useCallback(({ item, index }) => {
    const isPopularAbroad = locationRegion === 'abroad' && search.results.length === 0;
    const selected = !item.isCityGroup && location?.city === item.city && location?.district === item.district;
    return <LocationRowItem item={item} selected={selected} isPopularAbroad={isPopularAbroad} isLast={index === locationListData.length - 1} onSelect={handleSelectPlace} />;
  }, [locationRegion, search.results.length, location?.city, location?.district, locationListData.length, handleSelectPlace]);

  return (
    <UI.Provider value={ui}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={statusBarStyle} />
        <View style={styles.shell}>
          <View style={styles.header}>
            <Tap onPress={goBack} label={activeCat ? 'Ayarlara dön' : 'Geri dön'} haptic={null} style={[styles.headerBtn, { backgroundColor: theme.surface, borderColor: hc ? theme.text : border, borderWidth: hc ? 2 : 1, width: headerBtnSize, height: headerBtnSize, borderRadius: headerBtnSize / 2 }]}>
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </Tap>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text accessibilityRole="header" numberOfLines={1} style={{ color: theme.text, fontSize: ui.fs(activeCat ? 20 : 24), fontWeight: '800', letterSpacing: -0.4 }}>{headerTitle}</Text>
              {activeCat ? <Text numberOfLines={1} style={{ color: hc ? theme.text : dim, fontSize: ui.fs(12), marginTop: 2, fontWeight: '500' }}>{activeCat.label} ayarları</Text> : null}
            </View>
          </View>

          {!activeCat ? (
            <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
              <SearchField value={searchQuery} onChange={setSearchQuery} />
            </View>
          ) : null}

          <Animated.View style={{ flex: 1, opacity: fade }}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(56, insets.bottom + 56) }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {searching ? (
                <>
                  <Text accessibilityLiveRegion="polite" style={{ color: hc ? theme.text : dim, fontSize: ui.fs(12.5), fontWeight: '700', marginTop: 12, marginLeft: 4, letterSpacing: 0.3 }}>
                    {results.length === 0 ? 'SONUÇ YOK' : `${results.length} SONUÇ`}
                  </Text>
                  {results.length === 0 ? (
                    <View style={styles.empty}>
                      <IconChip name="search" size={64} tone="muted" />
                      <Text style={{ color: theme.text, fontSize: ui.fs(16), fontWeight: '700', marginTop: 18 }}>Eşleşen ayar bulunamadı</Text>
                      <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(13.5), lineHeight: ui.fs(20), textAlign: 'center', marginTop: 8, maxWidth: 320 }}>
                        “{searchQuery.trim()}” için sonuç yok. “tema”, “konum” ya da “bildirim” gibi bir kelime deneyin.
                      </Text>
                      <Tap onPress={() => setSearchQuery('')} label="Aramayı temizle" style={[styles.ghostBtn, { borderColor: border, borderWidth: hc ? 2 : 1 }]}>
                        <Text style={{ color: theme.primary, fontWeight: '700', fontSize: ui.fs(14) }}>Aramayı temizle</Text>
                      </Tap>
                    </View>
                  ) : (
                    <View style={{ marginTop: 12 }}>{renderGroupBlocks(searchGroups)}</View>
                  )}
                </>
              ) : activeCat ? (
                activeCat.id === 'access' ? (
                  <AccessibilityPage
                    currentPreset={currentPreset}
                    onSelectPreset={applyPreset}
                    onToggleHighContrast={onToggleHighContrast}
                    onToggleDyslexia={onToggleDyslexia}
                    onToggleLargeTargets={onToggleLargeTargets}
                    onToggleReduceMotion={onToggleReduceMotion}
                    onToggleHaptic={onToggleHaptic}
                    onToggleSimpleMode={onSimpleModeToggle}
                    onReset={onResetAccessibility}
                  />
                ) : (
                  <View style={{ marginTop: 8 }}>{renderGroupBlocks(pageGroups)}</View>
                )
              ) : (
                <>
                  <View style={[styles.hero, { backgroundColor: theme.surface, borderColor: hc ? theme.text : border, borderWidth: hc ? 2 : 1 }, !hc && SHADOW_RAISED]}>
                    <View style={styles.heroTop}>
                      <AppLogoBadge size={56} theme={theme} hc={hc} />
                      <View style={{ flex: 1, marginLeft: 14, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text numberOfLines={1} style={{ color: theme.text, fontSize: ui.fs(19), fontWeight: '800', letterSpacing: -0.3, flexShrink: 1 }}>{greeting.text}</Text>
                          <View style={[styles.versionBadge, { backgroundColor: hc ? theme.primary : `${theme.primary}1F` }]}>
                            <Text style={[styles.versionBadgeText, { color: hc ? '#000000' : theme.primary }]}>v1.0</Text>
                          </View>
                        </View>
                        <Text numberOfLines={2} style={{ color: hc ? theme.text : dim, fontSize: ui.fs(12.5), marginTop: 4, fontWeight: '500', lineHeight: ui.fs(17) }}>
                          {location?.district ? `Vakitler ${locationLabel} için gösteriliyor` : 'Vakitler için bir konum seçin'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.heroQuickRow}>
                      <HeroTile icon="location" label="Konum" value={location?.district || 'Seç'} onPress={openLocationModal} />
                      <HeroTile icon={notifEnabled ? 'notifications' : 'notifications-off'} label="Bildirim" value={notifEnabled ? 'Açık' : 'Kapalı'} role="switch" checked={notifEnabled} active={notifEnabled} onPress={onNotificationsToggle} />
                      <HeroTile icon="color-palette" label="Tema" value={selectedThemeMode.name} onPress={() => { setThemeTab('theme'); setThemeModal(true); }} />
                    </View>
                  </View>

                  <Group title="Yazı ve düğme boyutu" footer="Tek dokunuşla yazıları ve düğmeleri birlikte büyütür. Okuma içeriğinde geçerli.">
                    <View style={{ padding: 16 }}><PresetTiles currentPreset={currentPreset} onSelect={applyPreset} /></View>
                  </Group>

                  <SectionTitle title="Tüm kategoriler" />
                  <View style={styles.hubGrid}>
                    {CATEGORIES.map((c) => <HubTile key={c.id} category={c} summary={categorySummary(c.id)} onPress={() => openCategory(c.id)} />)}
                  </View>

                  <View style={styles.footerBrand}>
                    <AppLogoBadge size={22} theme={theme} hc={hc} />
                    <Text style={{ color: hc ? theme.text : theme.textMuted, fontSize: ui.fs(11.5), fontWeight: '600' }}>
                      {APP_NAME} v{APP_VERSION} · Reklamsız · Açık kaynak
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>

        <Toast message={toast.message} visible={toast.visible} />

        <Sheet visible={!!activePicker} onClose={() => setPicker(null)} title={activePicker?.title ?? ''} subtitle={activePicker?.subtitle}>
          {activePicker ? (
            <>
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: border, borderWidth: hc ? 2 : 1 }, !hc && SHADOW_SOFT]}>
                {activePicker.options.map((o, i) => <OptionRow key={o.id} option={o} selected={String(o.id) === String(activePicker.selected)} onPress={choose} last={i === activePicker.options.length - 1} />)}
              </View>
              {activePicker.footer ? (
                <View style={{ marginTop: 14, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 14, backgroundColor: hc ? theme.surfaceElevated : `${theme.primary}0E`, borderWidth: 1, borderColor: hc ? theme.text : `${theme.primary}28`, flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                  <Ionicons name="information-circle-outline" size={16} color={theme.primary} style={{ marginTop: 1 }} />
                  <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(12.5), lineHeight: ui.fs(17), flex: 1 }}>{activePicker.footer}</Text>
                </View>
              ) : null}
            </>
          ) : null}
        </Sheet>

        <Sheet visible={themeModal} onClose={() => setThemeModal(false)} title="Tema ve renk" subtitle="Uygulamanın görünümünü kişiselleştirin">
          <View style={[styles.themeTabs, { backgroundColor: theme.surfaceElevated, borderColor: hc ? theme.text : border, borderWidth: hc ? 2 : 1 }]}>
            {[
              { id: 'theme', label: 'Tema', icon: 'color-palette' },
              { id: 'accent', label: 'Vurgu', icon: 'brush-outline' },
            ].map((t) => {
              const active = themeTab === t.id;
              return (
                <Tap
                  key={t.id}
                  onPress={() => setThemeTab(t.id)}
                  role="tab"
                  state={{ selected: active }}
                  label={t.label}
                  style={[styles.themeTab, active && { backgroundColor: theme.surface }]}
                  pressedStyle={{ opacity: 0.9 }}
                >
                  <Ionicons name={t.icon} size={15} color={active ? theme.primary : (hc ? theme.text : theme.textMuted)} />
                  <Text style={{ color: active ? theme.primary : (hc ? theme.text : theme.textMuted), fontSize: ui.fs(13.5), fontWeight: '700', marginLeft: 7 }}>{t.label}</Text>
                </Tap>
              );
            })}
          </View>

          {themeTab === 'theme' ? (
            <View>
              <View style={{ marginBottom: 20 }}>
                <ThemeLivePreview
                  item={selectedThemeMode}
                  currentTheme={theme}
                  accentName={accentName}
                  theme={theme}
                  hc={hc}
                  dim={dim}
                  fs={ui.fs}
                />
              </View>

              {THEME_CATEGORIES.special.length > 0 ? (
                <View style={{ marginBottom: 20 }}>
                  <SectionTitle title="Otomatik" count={THEME_CATEGORIES.special.length} />
                  <View style={styles.themeGrid}>
                    {THEME_CATEGORIES.special.map((item) => (
                      <ThemePreviewCard key={item.id} item={item} selected={themeMode === item.id} onPress={onThemeSelect} theme={theme} hc={hc} fs={ui.fs} onPrimary={onPrimaryColor} />
                    ))}
                  </View>
                </View>
              ) : null}

              {THEME_CATEGORIES.dark.length > 0 ? (
                <View style={{ marginBottom: 20 }}>
                  <SectionTitle title="Koyu temalar" count={THEME_CATEGORIES.dark.length} />
                  <View style={styles.themeGrid}>
                    {THEME_CATEGORIES.dark.map((item) => (
                      <ThemePreviewCard key={item.id} item={item} selected={themeMode === item.id} onPress={onThemeSelect} theme={theme} hc={hc} fs={ui.fs} onPrimary={onPrimaryColor} />
                    ))}
                  </View>
                </View>
              ) : null}

              {THEME_CATEGORIES.light.length > 0 ? (
                <View style={{ marginBottom: 20 }}>
                  <SectionTitle title="Aydınlık temalar" count={THEME_CATEGORIES.light.length} />
                  <View style={styles.themeGrid}>
                    {THEME_CATEGORIES.light.map((item) => (
                      <ThemePreviewCard key={item.id} item={item} selected={themeMode === item.id} onPress={onThemeSelect} theme={theme} hc={hc} fs={ui.fs} onPrimary={onPrimaryColor} />
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: hc ? theme.surfaceElevated : `${theme.primary}0A`, borderRadius: 12, marginTop: 4 }}>
                <Ionicons name="information-circle-outline" size={16} color={theme.primary} />
                <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(12), lineHeight: ui.fs(17), flex: 1 }}>
                  Her tema tüm vurgu renkleriyle çalışır. Yeni renkleri "Vurgu" sekmesinden seçin.
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <View style={{ marginBottom: 20 }}>
                <ThemeLivePreview
                  item={null}
                  currentTheme={theme}
                  accentName={accentName}
                  theme={theme}
                  hc={hc}
                  dim={dim}
                  fs={ui.fs}
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4, marginBottom: 20 }}>
                <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={24} color={onPrimaryColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: ui.fs(16), fontWeight: '800', letterSpacing: -0.2 }}>{accentName}</Text>
                  <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(12), marginTop: 2, fontWeight: '500' }}>
                    Bu temayla uyumlu {totalAllowedAccents} renk
                  </Text>
                </View>
              </View>

              {visibleAccentGroups.map((group) => (
                <View key={group.name} style={{ marginBottom: 20 }}>
                  <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(11.5), fontWeight: '800', marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>{group.name}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                    {group.ids.map((id) => {
                      const color = ACCENT_COLORS[id];
                      if (!color) return null;
                      const sel = accentColor === id;
                      return (
                        <Tap
                          key={id}
                          onPress={() => handleAccentSelect(id)}
                          role="radio"
                          state={{ selected: sel, checked: sel }}
                          label={`${color.name}${sel ? '. Seçili' : ''}`}
                          style={[styles.colorCircle, {
                            backgroundColor: color.primary,
                            borderColor: sel ? theme.text : 'transparent',
                            borderWidth: sel ? 3 : 2,
                          }]}
                          pressedStyle={{ opacity: 0.85 }}
                        >
                          {sel ? <Ionicons name="checkmark" size={22} color="#FFFFFF" /> : null}
                        </Tap>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}
        </Sheet>

        <Sheet visible={locationModal} onClose={() => setLocationModal(false)} title="Konum" subtitle="Namaz vakitleri seçtiğiniz yere göre hesaplanır" scroll={false} tall>
          <View style={[styles.themeTabs, { backgroundColor: theme.surfaceElevated, borderColor: hc ? theme.text : border, borderWidth: hc ? 2 : 1, marginBottom: 14 }]}>
            {[
              { id: 'tr', label: 'Türkiye (81 İl)', icon: 'location' },
              { id: 'abroad', label: 'Yurt Dışı', icon: 'earth-outline' },
            ].map((tab) => {
              const active = locationRegion === tab.id;
              return (
                <Tap
                  key={tab.id}
                  onPress={() => { hapticImpact('light'); setLocationRegion(tab.id); setSelectedCityRef(null); setQuery(''); setSearch({ status: 'idle', results: [] }); }}
                  role="tab"
                  state={{ selected: active }}
                  label={tab.label}
                  style={[styles.themeTab, active && { backgroundColor: theme.surface }]}
                  pressedStyle={{ opacity: 0.9 }}
                >
                  <Ionicons name={tab.icon} size={15} color={active ? theme.primary : (hc ? theme.text : theme.textMuted)} />
                  <Text style={{ color: active ? theme.primary : (hc ? theme.text : theme.textMuted), fontSize: ui.fs(13.5), fontWeight: '700', marginLeft: 7 }}>{tab.label}</Text>
                </Tap>
              );
            })}
          </View>

          <Tap onPress={handleAutoGPS} disabled={detectingLocation} label="Mevcut konumumu kullan" style={[styles.gpsBtn, { backgroundColor: theme.primary, minHeight: largeTouchTargets ? 56 : 52 }, !hc && SHADOW_SOFT]}>
            {detectingLocation ? <ActivityIndicator size="small" color={onPrimaryColor} /> : <Ionicons name="navigate" size={18} color={onPrimaryColor} />}
            <Text style={{ color: onPrimaryColor, fontSize: ui.fs(14.5), fontWeight: '700' }}>
              {detectingLocation ? 'Yüksek doğrulukla aranıyor…' : 'Mevcut konumumu kullan (GPS)'}
            </Text>
          </Tap>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, marginTop: 10 }}>
            <Ionicons name="information-circle-outline" size={13} color={hc ? theme.text : theme.textMuted} />
            <Text style={{ color: hc ? theme.text : theme.textMuted, fontSize: ui.fs(11.5), flex: 1, lineHeight: ui.fs(16) }}>
              En doğru sonuç için açık alanda deneyin. Yüksek doğruluk modu 20 saniyeye kadar sürebilir.
            </Text>
          </View>

          {locationRegion === 'tr' && selectedCityRef ? (
            <Tap
              onPress={() => { hapticImpact('light'); setSelectedCityRef(null); setQuery(''); }}
              label="Tüm illere dön"
              style={[styles.cityBreadcrumb, { backgroundColor: `${theme.primary}14`, borderColor: hc ? theme.text : `${theme.primary}40` }]}
            >
              <Ionicons name="arrow-back" size={16} color={theme.primary} />
              <Text style={{ color: theme.primary, fontSize: ui.fs(13), fontWeight: '800', flex: 1 }}>
                {selectedCityRef.city} İlçeleri · Tüm İllere Dön
              </Text>
            </Tap>
          ) : null}

          <View style={[styles.searchField, { backgroundColor: theme.surface, borderColor: hc ? theme.text : border, borderWidth: hc ? 2 : 1, marginVertical: 12, minHeight: largeTouchTargets ? 56 : 50 }]}>
            <Ionicons name="search" size={18} color={hc ? theme.text : dim} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={locationRegion === 'tr' ? (selectedCityRef ? `${selectedCityRef.city} içinde ilçe ara…` : 'İl veya ilçe ara (örn. Gebze, Kadıköy)…') : 'Şehir veya ülke ara (örn. Berlin, Mekke)…'}
              placeholderTextColor={theme.textMuted}
              style={[{ flex: 1, color: theme.text, fontSize: ui.fs(15), paddingVertical: 10 }, IS_WEB && { outlineStyle: 'none' }]}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="search"
              accessibilityLabel="Konum ara"
            />
            {!!query && (
              <Tap onPress={() => setQuery('')} label="Aramayı temizle" hitSlop={10}>
                <Ionicons name="close-circle" size={20} color={hc ? theme.text : theme.textMuted} />
              </Tap>
            )}
          </View>

          <FlatList
            data={locationListData}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            initialNumToRender={12}
            maxToRenderPerBatch={14}
            windowSize={5}
            removeClippedSubviews={!IS_WEB}
            getItemLayout={getLocationItemLayout}
            ListHeaderComponent={
              locationRegion === 'tr' ? (
                <SectionTitle
                  title={selectedCityRef ? `${selectedCityRef.city} İlçeleri` : (query.trim() ? 'Arama Sonuçları (Çevrimdışı)' : 'Tüm İller (81 İl · Çevrimdışı)')}
                  count={locationListData.length}
                />
              ) : (
                search.results.length > 0 && query.trim().length >= 2 ? (
                  <SectionTitle title="Dünya Genelinde Sonuçlar" count={search.results.length} />
                ) : (
                  <SectionTitle title="Popüler Yurt Dışı Şehirleri" />
                )
              )
            }
            renderItem={renderLocationItem}
            ListEmptyComponent={
              <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
                {search.status === 'loading' && (<><ActivityIndicator color={theme.primary} /><Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(13.5) }}>Aranıyor…</Text></>)}
                {search.status === 'error' && (
                  <>
                    <Ionicons name="cloud-offline-outline" size={34} color={hc ? theme.text : dim} />
                    <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(13.5), textAlign: 'center', lineHeight: ui.fs(20) }}>Arama yapılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.</Text>
                    <Tap onPress={() => setRetryKey((k) => k + 1)} label="Tekrar dene" style={[styles.ghostBtn, { borderColor: border, borderWidth: hc ? 2 : 1 }]}>
                      <Text style={{ color: theme.primary, fontWeight: '700', fontSize: ui.fs(14) }}>Tekrar dene</Text>
                    </Tap>
                  </>
                )}
                {search.status === 'done' && locationListData.length === 0 && (
                  <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(13.5), textAlign: 'center', lineHeight: ui.fs(20) }}>“{query.trim()}” için sonuç bulunamadı.</Text>
                )}
              </View>
            }
          />
        </Sheet>

        <Sheet
          visible={!!info}
          onClose={() => setInfo(null)}
          title={{ about: 'Uygulama hakkında', privacy: 'Gizlilik politikası', changelog: 'Değişiklik geçmişi', credits: 'Teşekkürler' }[info] ?? ''}
          subtitle={info === 'credits' ? 'Bu uygulama açık kaynak servis ve verilerle çalışır.' : undefined}
        >
          {info === 'about' && (
            <View>
              <View style={[styles.aboutHero, { backgroundColor: theme.surface, borderColor: hc ? theme.text : border, borderWidth: hc ? 2 : 1 }, !hc && SHADOW_SOFT]}>
                <AppLogoBadge size={84} theme={theme} hc={hc} />
                <Text style={{ color: theme.text, fontSize: ui.fs(22), fontWeight: '800', marginTop: 14, letterSpacing: -0.3 }}>{APP_NAME}</Text>
                <Text style={{ color: theme.primary, fontSize: ui.fs(13), fontWeight: '600', marginTop: 3 }}>{APP_TAGLINE} · v{APP_VERSION}</Text>
                <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(13.5), lineHeight: ui.fs(20), textAlign: 'center', marginTop: 14, maxWidth: 320 }}>{APP_DESCRIPTION}</Text>
              </View>
              <View style={{ height: 18 }} />
              <Group>
                <Row last={false} item={{ id: 'dev', type: 'action', icon: 'person-outline', label: 'Geliştirici', desc: DEVELOPER_NAME }} />
                <Row last={false} item={{ id: 'git', type: 'link', icon: 'logo-github', label: 'Kaynak kodu', value: 'GitHub', plain: true, onPress: () => openLink(GITHUB_URL) }} />
                <Row last item={{ id: 'mail', type: 'link', icon: 'mail-outline', label: 'İletişim', value: 'krkyhsn@proton.me', plain: true, onPress: () => openLink(CONTACT_EMAIL) }} />
              </Group>
              <View style={[styles.note, { backgroundColor: `${theme.primary}14`, borderColor: hc ? theme.text : `${theme.primary}40`, borderWidth: hc ? 2 : 1 }]}>
                <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
                <Text style={{ color: theme.text, fontSize: ui.fs(13), lineHeight: ui.fs(19), flex: 1 }}>Hiçbir veri toplanmıyor. Tüm tercihleriniz yalnızca cihazınızda saklanır.</Text>
              </View>
            </View>
          )}
          {info === 'privacy' && (
            <View>
              <Text style={{ color: theme.text, fontSize: ui.fs(18), fontWeight: '800', letterSpacing: -0.2 }}>Verileriniz sizde kalır</Text>
              <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(14), lineHeight: ui.fs(21), marginTop: 8, marginBottom: 20 }}>{APP_NAME}, kişisel verilerinizi toplamaz, saklamaz ve üçüncü taraflarla paylaşmaz.</Text>
              <SectionTitle title="Neler yapmıyoruz?" />
              {PRIVACY_NOT_DOING.map((t) => <Bullet key={t} icon="close-circle" color={ui.danger} text={t} />)}
              <SectionTitle title="Verileriniz nerede?" />
              <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(14), lineHeight: ui.fs(21) }}>Tüm tercihleriniz yalnızca cihazınızın yerel depolamasında tutulur.</Text>
            </View>
          )}
          {info === 'changelog' && (
            <View>
              <View style={[styles.pillBtn, { alignSelf: 'flex-start', backgroundColor: hc ? theme.primary : `${theme.primary}1F`, borderColor: 'transparent' }]}>
                <Text style={{ color: hc ? '#000000' : theme.primary, fontSize: ui.fs(12.5), fontWeight: '800' }}>v{APP_VERSION} · İlk sürüm</Text>
              </View>
              <View style={{ marginTop: 18 }}>
                {CHANGELOG_ITEMS.map((t) => <Bullet key={t} icon="checkmark-circle" color={ui.success} text={t} />)}
              </View>
            </View>
          )}
          {info === 'credits' && (
            <View>
              <Group>
                {CREDITS.map((c, i) => (
                  <View key={c.name} style={[styles.row, { minHeight: 68 }]}>
                    <View style={{ marginRight: 14 }}><IconChip name="checkmark-done" size={38} tone="accent" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontSize: ui.fs(15), fontWeight: '700' }}>{c.name}</Text>
                      <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(12.5), marginTop: 3 }}>{c.desc}</Text>
                    </View>
                    {i !== CREDITS.length - 1 ? <View style={[styles.divider, { left: 66, backgroundColor: hc ? theme.text : border }]} /> : null}
                  </View>
                ))}
              </Group>
              <Text style={{ color: hc ? theme.text : dim, fontSize: ui.fs(13), lineHeight: ui.fs(19), textAlign: 'center', marginTop: 4 }}>
                Bu uygulamanın gelişimine katkıda bulunan herkese, özellikle kaynak veri sağlayıcılarına teşekkür ederiz.
              </Text>
            </View>
          )}
        </Sheet>
      </SafeAreaView>
    </UI.Provider>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  shell: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerBtn: { alignItems: 'center', justifyContent: 'center' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 8 },

  searchField: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderRadius: 20 },

  hero: { borderRadius: 26, padding: 20, marginBottom: 22, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', alignItems: 'center' },
  versionBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, flexShrink: 0 },
  versionBadgeText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.3 },
  heroQuickRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  heroTile: { flex: 1, borderRadius: 18, padding: 14, justifyContent: 'flex-start' },

  hubGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 20 },
  hubTile: { width: '48.3%', borderRadius: 22, padding: 16, justifyContent: 'space-between', overflow: 'hidden' },
  hubIconWrap: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },

  footerBrand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 20 },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, marginLeft: 2, marginRight: 2 },
  sectionPill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 10 },
  sectionCount: { minWidth: 22, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  group: { marginBottom: 22 },
  card: { borderRadius: 22, overflow: 'hidden' },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, minHeight: 66 },
  rowBig: { paddingVertical: 20, minHeight: 82 },
  divider: { position: 'absolute', right: 16, bottom: 0, height: StyleSheet.hairlineWidth },

  presetRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  presetTile: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, paddingVertical: 16, borderRadius: 18, position: 'relative' },
  presetAaWrap: { width: 56, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  presetCheck: { position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },

  empty: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  ghostBtn: { marginTop: 18, minHeight: 48, paddingHorizontal: 22, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  toast: { position: 'absolute', left: 20, right: 20, alignSelf: 'center', maxWidth: 480, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 20, zIndex: 999 },
  toastIconWrap: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },

  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: { width: '100%', maxWidth: 680, alignSelf: 'center', maxHeight: '92%', borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, paddingHorizontal: 22, paddingTop: 12 },
  sheetHandle: { width: 42, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 16, opacity: 0.7 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  closeBtn: { alignItems: 'center', justifyContent: 'center' },

  gpsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18 },
  primaryBtn: { minHeight: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  cityBreadcrumb: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderWidth: 1, marginTop: 12 },

  themeTabs: { flexDirection: 'row', padding: 4, borderRadius: 16, marginBottom: 18, gap: 4 },
  themeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12 },

  themeLiveWrap: { borderRadius: 22, padding: 16 },
  themeLiveBadgePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  themeLiveMockup: { borderRadius: 16, overflow: 'hidden' },
  themeLivePrayerCard: { marginHorizontal: 14, marginTop: 12, marginBottom: 14, borderRadius: 14, padding: 12 },
  themeLiveTimeBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  themeLiveProgress: { height: 4, borderRadius: 2, marginTop: 10, overflow: 'hidden' },
  themeLiveProgressFill: { height: 4, borderRadius: 2 },

  themeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 4 },
  themeCard: { width: '48.3%', borderRadius: 20, overflow: 'hidden', padding: 10, position: 'relative' },
  themePreviewMockup: { width: '100%', height: 138, borderRadius: 14, overflow: 'hidden', padding: 8, marginBottom: 10, position: 'relative' },
  themePreviewTopBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 5, borderRadius: 8, gap: 6 },
  themePreviewAccentDot: { width: 8, height: 8, borderRadius: 4 },
  themePreviewTopBarTextGroup: { flex: 1 },
  themePreviewTextLine: { borderRadius: 2 },
  themePreviewPrayerCard: { marginHorizontal: 4, marginTop: 8, borderRadius: 10, padding: 8 },
  themePreviewMiniBar: { height: 3, borderRadius: 1.5, marginTop: 6, overflow: 'hidden' },
  themePreviewMiniBarFill: { height: 3, borderRadius: 1.5 },
  themePreviewAccentBar: { height: 6, borderRadius: 3, marginTop: 8, marginHorizontal: 4 },
  themeDynamicHalf: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  themeCardMeta: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 6 },
  themeCardCheck: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  pillBtn: { flexDirection: 'row', alignItems: 'center', minHeight: 36, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1 },
  colorCircle: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },

  aboutHero: { alignItems: 'center', padding: 26, borderRadius: 24 },
  aboutIconWrap: { width: 84, height: 84, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 16 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },

  livePreviewCard: { borderRadius: 22, padding: 16, overflow: 'hidden' },
  livePreviewHeader: { flexDirection: 'row', alignItems: 'center' },
  livePreviewIconWrap: { alignItems: 'center', justifyContent: 'center' },
  livePreviewRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12, borderTopWidth: StyleSheet.hairlineWidth },
  livePreviewBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, minWidth: 56, alignItems: 'center', justifyContent: 'center' },

  fontSizeRow: { flexDirection: 'row', gap: 10 },
  fontSizeTile: { flex: 1, borderRadius: 18, paddingHorizontal: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  fontSizeAa: { height: 44, alignItems: 'center', justifyContent: 'center' },
  fontSizeCheck: { position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});