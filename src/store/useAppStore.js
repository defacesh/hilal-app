// src/store/useAppStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  buildTheme,
  ACCENT_COLORS,
  ACCENT_GROUPS,
  THEME_ACCENT_COMPAT,
  VALID_THEME_MODES,
  VALID_WIDGET_THEME_MODES,
  DEFAULT_LIGHT_THEME,
  DEFAULT_DARK_THEME,
  DEFAULT_ACCENT_COLOR,
} from '../theme/colors';
import {
  HOME_LAYOUT_THEMES,
  HOME_LAYOUT_MODES,
  DEFAULT_HOME_LAYOUT_THEME,
  isValidHomeLayoutTheme,
} from '../theme/homeThemes';
import { cancelPrayerNotifications } from '../services/prayerNotifications';
import { resetAppData } from '../services/appReset';
import { MEAL_EDITIONS } from '../data/vakitContent';
import { DEFAULT_PRICES } from '../services/zekatApi';

/* ================================================================
   Geriye dönük uyumluluk için tema listelerini dışa aktar
   ================================================================ */
export { HOME_LAYOUT_THEMES, HOME_LAYOUT_MODES };

/* ================================================================
   Varsayılanlar
   ================================================================ */

const DEFAULT_LOCATION = {
  city: 'Kocaeli',
  district: 'Darıca',
  country: 'Türkiye',
  latitude: 40.7739,
  longitude: 29.4003,
  timezone: 'Europe/Istanbul',
  isAutoGPS: true,
};

const DEFAULT_WIDGETS_CONFIG = {
  showVerseCard: true,
  showDuaCard: true,
  showEsmaCard: true,
  showProgressTrack: true,
  showKerahatWarning: true,
  notificationsEnabled: true,
  reminderBeforeMinutes: 15,
  notificationSound: true,
  notificationVibrate: true,
  fridayReminder: false,
  quietHoursEnabled: false,
};

const DEFAULT_WIDGET_PREFS = {
  showHijri: true,
  themeMode: 'auto',
  showWeekday: true,
  layoutVariant: 'hero-list',
};

const DEFAULT_HOME_PREFS = {
  showCountdown: true,
  showDailyVerse: false,
  showStickyHero: true,
  showHijriInHeader: true,
  showPrayerStrip: true,
  showDailyProgress: true,
  showQuickActions: true,
  showDailyNames: true,
  showNotificationsCard: true,
  showManeviContent: true,
};

const DEFAULT_ZEKAT_ASSET_DATA = {
  cashTL: '',
  cashUSD: '',
  cashEUR: '',
  goldGram: '',
  silverGram: '',
  commercialGoods: '',
  receivables: '',
  debts: '',
  stocks: '',
  crypto: '',
  rentalIncome: '',
  pension: '',
  otherAssets: '',
};

const DEFAULT_THEME_MODE = 'dynamic';
const DEFAULT_ACCENT = DEFAULT_ACCENT_COLOR; // 'emerald' (Türbe Yeşili)
const DEFAULT_PRAYER_METHOD = 13;
const DEFAULT_TUNE_MINUTES = 0;
const DEFAULT_SHOW_ARABIC = true;
const DEFAULT_MEAL_EDITION = 'tr.diyanet';
const DEFAULT_PRAYER_DATA_SOURCE = 'auto';
const DEFAULT_QURAN_SOURCE = 'offline';
const DEFAULT_DIYANET_KURAN_API_KEY = '';
const DEFAULT_READING_MODE = 'full';
const DEFAULT_READING_FONT_SCALE = 1.0;
const DEFAULT_TESBIHAT_AUTO_ADVANCE = true;
const DEFAULT_GLOBAL_HAPTIC = true;
const DEFAULT_SELECTED_ZIKIR_ID = 'z1';
const DEFAULT_ZIKIR_TARGET = 33;

/* ================================================================
   Geçerlilik listeleri
   ================================================================ */

const VALID_DATA_SOURCES = ['auto', 'diyanet', 'aladhan'];
const VALID_WIDGET_LAYOUTS = ['hero-list', 'timeline', 'grid', 'focus', 'prayer-strip'];
const VALID_QURAN_SOURCES = ['offline', 'qurancom', 'diyanet', 'acikkuran', 'apacik'];
const VALID_READING_MODES = [
  'full', 'arabic-only', 'latin-only', 'meaning-only', 'latin-meaning', 'arabic-latin',
];
const VALID_READING_FONT_SCALES = [1.0, 1.15, 1.3];

/* ================================================================
   Doğrulama yardımcıları
   ================================================================ */

const isValidAccent = (id) => Boolean(ACCENT_COLORS[id]);
const isValidThemeMode = (mode) => VALID_THEME_MODES.includes(mode);
const isValidMealEdition = (id) =>
  Array.isArray(MEAL_EDITIONS) && MEAL_EDITIONS.some((m) => m.id === id);
const isValidDataSource = (source) => VALID_DATA_SOURCES.includes(source);
const isValidWidgetTheme = (mode) => VALID_WIDGET_THEME_MODES.includes(mode);
const isValidWidgetLayout = (variant) => VALID_WIDGET_LAYOUTS.includes(variant);
const isValidQuranSource = (id) => VALID_QURAN_SOURCES.includes(id);
const isValidReadingMode = (mode) => VALID_READING_MODES.includes(mode);
const isValidReadingFontScale = (v) =>
  VALID_READING_FONT_SCALES.some((s) => Math.abs(s - Number(v)) < 0.001);

const resolveDynamicAnchorMode = (date = new Date()) => {
  const hours = date.getHours() + date.getMinutes() / 60;
  return hours >= 6.5 && hours < 18.5 ? DEFAULT_LIGHT_THEME : DEFAULT_DARK_THEME;
};

const isAccentCompatibleWithTheme = (themeMode, accentId) => {
  if (!isValidAccent(accentId)) return false;
  if (themeMode === 'dynamic') {
    const lightAllowed = THEME_ACCENT_COMPAT[DEFAULT_LIGHT_THEME];
    const darkAllowed = THEME_ACCENT_COMPAT[DEFAULT_DARK_THEME];
    const okLight = !lightAllowed || lightAllowed.includes(accentId);
    const okDark = !darkAllowed || darkAllowed.includes(accentId);
    return okLight && okDark;
  }
  const allowed = THEME_ACCENT_COMPAT[themeMode];
  if (!allowed) return true;
  return allowed.includes(accentId);
};

const resolveAccentForTheme = (themeMode, currentAccent) => {
  if (isAccentCompatibleWithTheme(themeMode, currentAccent)) return currentAccent;
  if (themeMode === 'dynamic') return DEFAULT_ACCENT;
  const allowed = THEME_ACCENT_COMPAT[themeMode];
  if (!allowed || allowed.length === 0) return DEFAULT_ACCENT;
  const firstValid = allowed.find((id) => isValidAccent(id));
  return firstValid || DEFAULT_ACCENT;
};

const normalizeApiKey = (key) => (typeof key === 'string' ? key.trim() : '');

const normalizeLocation = (location) => {
  if (!location || typeof location !== 'object') return DEFAULT_LOCATION;
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return DEFAULT_LOCATION;
  return {
    city: location.city || location.district || DEFAULT_LOCATION.city,
    district: location.district || location.city || DEFAULT_LOCATION.district,
    country: location.country ?? DEFAULT_LOCATION.country,
    latitude,
    longitude,
    timezone: location.timezone || DEFAULT_LOCATION.timezone,
    isAutoGPS: Boolean(location.isAutoGPS),
  };
};

/* ================================================================
   Persist edilen anahtarlar
   ================================================================ */

const PERSISTED_KEYS = [
  'isFirstLaunch',
  'hasShownIntro',
  'selectedLocation',
  'themeMode',
  'accentColor',
  'homeLayoutTheme',
  'isSimpleMode',
  'highContrast',
  'reduceMotion',
  'largeTouchTargets',
  'dyslexiaFont',
  'showArabic',
  'mealEdition',
  'readingMode',
  'readingFontScale',
  'homePrefs',
  'tesbihatAutoAdvance',
  'globalHaptic',
  'favoriteDuas',
  'widgetsConfig',
  'widgetPrefs',
  'prayerMethod',
  'tuneMinutes',
  'prayerDataSource',
  'quranSource',
  'diyanetKuranApiKey',
  'selectedZikirId',
  'customZikirs',
  'favoriteZikirs',
  'zekatAssetData',
  'zekatPrices',
];

/* ================================================================
   Store
   ================================================================ */

export const useAppStore = create(
  persist(
    (set, get) => ({
      /* ---------------- Onboarding ---------------- */
      isFirstLaunch: true,
      hasShownIntro: false,

      /* ---------------- Konum ---------------- */
      selectedLocation: DEFAULT_LOCATION,

      /* ---------------- Tema & Erişilebilirlik ---------------- */
      themeMode: DEFAULT_THEME_MODE,
      accentColor: DEFAULT_ACCENT,
      homeLayoutTheme: DEFAULT_HOME_LAYOUT_THEME,
      highContrast: false,
      reduceMotion: false,
      largeTouchTargets: false,
      dyslexiaFont: false,

      /* ---------------- İçerik tercihleri ---------------- */
      isSimpleMode: false,
      showArabic: DEFAULT_SHOW_ARABIC,
      mealEdition: DEFAULT_MEAL_EDITION,
      readingMode: DEFAULT_READING_MODE,
      readingFontScale: DEFAULT_READING_FONT_SCALE,

      /* ---------------- Ana sayfa özelleştirmeleri ---------------- */
      homePrefs: DEFAULT_HOME_PREFS,

      /* ---------------- Davranış tercihleri ---------------- */
      tesbihatAutoAdvance: DEFAULT_TESBIHAT_AUTO_ADVANCE,
      globalHaptic: DEFAULT_GLOBAL_HAPTIC,

      /* ---------------- Favoriler ---------------- */
      favoriteDuas: [],

      /* ---------------- Zikirmatik ---------------- */
      zikirCounts: {},
      zikirTargets: {},
      selectedZikirId: DEFAULT_SELECTED_ZIKIR_ID,
      customZikirs: [],
      favoriteZikirs: [],

      /* ---------------- Zekât Hesaplayıcı ---------------- */
      zekatAssetData: DEFAULT_ZEKAT_ASSET_DATA,
      zekatPrices: DEFAULT_PRICES,

      /* ---------------- Ana ekran widget ayarları ---------------- */
      widgetsConfig: DEFAULT_WIDGETS_CONFIG,

      /* ---------------- Android home-screen widget tercihleri ---------------- */
      widgetPrefs: DEFAULT_WIDGET_PREFS,

      /* ---------------- Namaz vakit ayarları ---------------- */
      prayerMethod: DEFAULT_PRAYER_METHOD,
      tuneMinutes: DEFAULT_TUNE_MINUTES,
      prayerDataSource: DEFAULT_PRAYER_DATA_SOURCE,

      /* ---------------- Kur'an okuyucu ---------------- */
      quranSource: DEFAULT_QURAN_SOURCE,

      /* ---------------- Diyanet Kur'an API (Beta) ---------------- */
      diyanetKuranApiKey: DEFAULT_DIYANET_KURAN_API_KEY,

      /* ================================================================
         Tema & Layout
         ================================================================ */
      getTheme: (now = new Date()) => {
        const { themeMode, accentColor } = get();
        const safeAccent = isAccentCompatibleWithTheme(themeMode, accentColor)
          ? accentColor
          : resolveAccentForTheme(themeMode, accentColor);
        return buildTheme(
          themeMode,
          isValidAccent(safeAccent) ? safeAccent : DEFAULT_ACCENT,
          now,
        );
      },

      setThemeMode: (mode) => {
        if (!isValidThemeMode(mode)) {
          if (__DEV__) console.warn('[Store] Geçersiz tema modu:', mode);
          return;
        }
        const { accentColor } = get();
        const nextAccent = isAccentCompatibleWithTheme(mode, accentColor)
          ? accentColor
          : resolveAccentForTheme(mode, accentColor);
        set({ themeMode: mode, accentColor: nextAccent });
      },

      setAccentColor: (colorId) => {
        if (!isValidAccent(colorId)) {
          if (__DEV__) console.warn('[Store] Geçersiz vurgu rengi:', colorId);
          return;
        }
        const { themeMode, accentColor } = get();
        if (!isAccentCompatibleWithTheme(themeMode, colorId)) {
          if (__DEV__) {
            console.warn(
              '[Store] Bu renk mevcut temayla uyumsuz:',
              colorId, '→', themeMode,
            );
          }
          return;
        }
        if (colorId === accentColor) return;
        set({ accentColor: colorId });
      },

      setHomeLayoutTheme: (layoutMode) => {
        if (!isValidHomeLayoutTheme(layoutMode)) {
          if (__DEV__) console.warn('[Store] Geçersiz home layout teması:', layoutMode);
          return;
        }
        if (get().homeLayoutTheme === layoutMode) return;
        set({ homeLayoutTheme: layoutMode });
      },

      getAvailableAccents: (themeModeArg) => {
        const mode = themeModeArg ?? get().themeMode;
        if (mode === 'dynamic') {
          const lightAllowed = THEME_ACCENT_COMPAT[DEFAULT_LIGHT_THEME] || Object.keys(ACCENT_COLORS);
          const darkAllowed = THEME_ACCENT_COMPAT[DEFAULT_DARK_THEME] || Object.keys(ACCENT_COLORS);
          return lightAllowed.filter((id) => darkAllowed.includes(id) && isValidAccent(id));
        }
        const resolvedMode = mode === 'dynamic' ? resolveDynamicAnchorMode() : mode;
        const allowed = THEME_ACCENT_COMPAT[resolvedMode];
        if (!allowed) return Object.keys(ACCENT_COLORS);
        return allowed.filter((id) => isValidAccent(id));
      },

      getAvailableAccentGroups: (themeModeArg) => {
        const allowed = get().getAvailableAccents(themeModeArg);
        if (!Array.isArray(ACCENT_GROUPS)) return [];
        return ACCENT_GROUPS
          .map((group) => ({
            ...group,
            ids: group.ids.filter((id) => allowed.includes(id)),
          }))
          .filter((group) => group.ids.length > 0);
      },

      setHighContrast: (value) => set({ highContrast: Boolean(value) }),
      setReduceMotion: (value) => set({ reduceMotion: Boolean(value) }),
      setLargeTouchTargets: (value) => set({ largeTouchTargets: Boolean(value) }),
      setDyslexiaFont: (value) => set({ dyslexiaFont: Boolean(value) }),

      /* ================================================================
         Basit mod & İçerik
         ================================================================ */
      setSimpleMode: (value) => set({ isSimpleMode: Boolean(value) }),
      toggleSimpleMode: () =>
        set((state) => ({ isSimpleMode: !state.isSimpleMode })),

      setShowArabic: (value) => set({ showArabic: Boolean(value) }),
      toggleShowArabic: () =>
        set((state) => ({ showArabic: !state.showArabic })),

      setMealEdition: (edition) => {
        if (!isValidMealEdition(edition)) return;
        set({ mealEdition: edition });
      },

      /* ================================================================
         Okuma modu ve yazı boyutu
         ================================================================ */
      setReadingMode: (mode) => {
        if (!isValidReadingMode(mode)) {
          if (__DEV__) console.warn('[Store] Geçersiz okuma modu:', mode);
          return;
        }
        set({ readingMode: mode });
      },

      setReadingFontScale: (value) => {
        const num = Number(value);
        if (!isValidReadingFontScale(num)) {
          if (__DEV__) console.warn('[Store] Geçersiz yazı boyutu:', value);
          return;
        }
        set({ readingFontScale: num });
      },

      /* ================================================================
         Ana sayfa özelleştirmeleri
         ================================================================ */
      setHomePref: (key, value) => {
        if (!(key in DEFAULT_HOME_PREFS)) {
          if (__DEV__) console.warn('[Store] Geçersiz home pref:', key);
          return;
        }
        set((state) => ({
          homePrefs: {
            ...state.homePrefs,
            [key]: Boolean(value),
          },
        }));
      },

      toggleHomePref: (key) => {
        if (!(key in DEFAULT_HOME_PREFS)) return;
        set((state) => ({
          homePrefs: {
            ...state.homePrefs,
            [key]: !state.homePrefs[key],
          },
        }));
      },

      resetHomePrefs: () => set({ homePrefs: DEFAULT_HOME_PREFS }),

      /* ================================================================
         Davranış tercihleri
         ================================================================ */
      setTesbihatAutoAdvance: (v) => set({ tesbihatAutoAdvance: Boolean(v) }),
      setGlobalHaptic: (v) => set({ globalHaptic: Boolean(v) }),
      isHapticEnabled: () => get().globalHaptic !== false,

      /* ================================================================
         Favoriler
         ================================================================ */
      toggleFavoriteDua: (duaId) => {
        if (duaId == null) return;
        const id = String(duaId);
        const currentFavorites = get().favoriteDuas || [];
        if (currentFavorites.includes(id)) {
          set({ favoriteDuas: currentFavorites.filter((x) => x !== id) });
        } else {
          set({ favoriteDuas: [...currentFavorites, id] });
        }
      },

      isFavoriteDua: (duaId) => {
        if (duaId == null) return false;
        return (get().favoriteDuas || []).includes(String(duaId));
      },

      clearFavorites: () => set({ favoriteDuas: [] }),

      /* ================================================================
         Zikirmatik — Zikir bazlı sayaçlar
         ================================================================ */
      getZikirCount: (zikirId) => {
        const id = zikirId ?? get().selectedZikirId;
        if (!id) return 0;
        const counts = get().zikirCounts;
        if (!counts || typeof counts !== 'object') return 0;
        const val = Number(counts[id]);
        return Number.isFinite(val) && val > 0 ? val : 0;
      },

      setZikirCount: (updater, zikirId) => {
        const id = zikirId ?? get().selectedZikirId;
        if (!id) return;

        const currentCounts = get().zikirCounts || {};
        const current = Number(currentCounts[id]) || 0;
        const rawNext = typeof updater === 'function' ? updater(current) : updater;
        const safeNext = Math.max(0, Number(rawNext) || 0);

        if (safeNext === current) return;

        const nextCounts = { ...currentCounts, [id]: safeNext };
        if (safeNext === 0) delete nextCounts[id];

        set({ zikirCounts: nextCounts });
      },

      resetZikirCount: (zikirId) => {
        const id = zikirId ?? get().selectedZikirId;
        if (!id) return;

        const currentCounts = get().zikirCounts || {};
        if (!(id in currentCounts)) return;

        const nextCounts = { ...currentCounts };
        delete nextCounts[id];

        set({ zikirCounts: nextCounts });
      },

      resetAllZikirCounts: () => {
        const current = get().zikirCounts || {};
        if (Object.keys(current).length === 0) return;
        set({ zikirCounts: {} });
      },

      getZikirTarget: (zikirId, defaultTarget = DEFAULT_ZIKIR_TARGET) => {
        const id = zikirId ?? get().selectedZikirId;
        if (!id) return defaultTarget;
        return get().zikirTargets?.[id] ?? defaultTarget;
      },

      setZikirTarget: (target, zikirId) => {
        const id = zikirId ?? get().selectedZikirId;
        if (!id) return;
        const num = Number(target);
        if (!Number.isFinite(num) || num <= 0) return;
        set((state) => ({
          zikirTargets: { ...(state.zikirTargets || {}), [id]: num },
        }));
      },

      setSelectedZikirId: (id) => {
        set({ selectedZikirId: id });
      },

      setCustomZikirs: (updater) =>
        set((state) => ({
          customZikirs: typeof updater === 'function' ? updater(state.customZikirs) : updater,
        })),

      setFavoriteZikirs: (updater) =>
        set((state) => ({
          favoriteZikirs: typeof updater === 'function' ? updater(state.favoriteZikirs) : updater,
        })),

      /* ================================================================
         Zekât Actions
         ================================================================ */
      setZekatAssetData: (key, value) =>
        set((state) => ({
          zekatAssetData: { ...state.zekatAssetData, [key]: value },
        })),
      setZekatPrices: (prices) =>
        set((state) => ({
          zekatPrices: { ...state.zekatPrices, ...prices },
        })),
      resetZekatData: () => set({ zekatAssetData: DEFAULT_ZEKAT_ASSET_DATA }),

      /* ================================================================
         Konum
         ================================================================ */
      setSelectedLocation: (location) => {
        const normalized = normalizeLocation(location);
        const prev = get().selectedLocation;
        const changed =
          prev.latitude !== normalized.latitude ||
          prev.longitude !== normalized.longitude;
        set({ selectedLocation: normalized });
        if (changed) cancelPrayerNotifications().catch(() => {});
      },

      /* ================================================================
         Onboarding & Intro
         ================================================================ */
      completeOnboarding: (locationData, isSimpleModeChoice) => {
        set({
          isFirstLaunch: false,
          selectedLocation: normalizeLocation(locationData),
          isSimpleMode: Boolean(isSimpleModeChoice),
        });
        cancelPrayerNotifications().catch(() => {});
      },

      markIntroShown: () => {
        if (get().hasShownIntro) return;
        set({ hasShownIntro: true });
      },

      /* ================================================================
         Ana ekran widget ayarları
         ================================================================ */
      toggleWidget: (key) => {
        if (!(key in DEFAULT_WIDGETS_CONFIG)) return;
        set((state) => ({
          widgetsConfig: {
            ...state.widgetsConfig,
            [key]: !state.widgetsConfig[key],
          },
        }));
      },

      setWidget: (key, value) => {
        if (!(key in DEFAULT_WIDGETS_CONFIG)) return;
        set((state) => ({
          widgetsConfig: {
            ...state.widgetsConfig,
            [key]: value,
          },
        }));
      },

      resetWidgets: () => set({ widgetsConfig: DEFAULT_WIDGETS_CONFIG }),

      setReminderBeforeMinutes: (minutes) => {
        const clamped = Math.min(120, Math.max(0, Number(minutes) || 0));
        set((state) => ({
          widgetsConfig: {
            ...state.widgetsConfig,
            reminderBeforeMinutes: clamped,
          },
        }));
      },

      /* ================================================================
         Android home-screen widget tercihleri
         ================================================================ */
      setWidgetPref: (key, value) => {
        if (!(key in DEFAULT_WIDGET_PREFS)) return;
        if (key === 'themeMode' && !isValidWidgetTheme(value)) return;
        if (key === 'layoutVariant' && !isValidWidgetLayout(value)) return;
        set((state) => ({
          widgetPrefs: { ...state.widgetPrefs, [key]: value },
        }));
      },

      toggleWidgetPref: (key) => {
        if (!(key in DEFAULT_WIDGET_PREFS)) return;
        if (key === 'themeMode') return;
        if (key === 'layoutVariant') return;
        set((state) => ({
          widgetPrefs: { ...state.widgetPrefs, [key]: !state.widgetPrefs[key] },
        }));
      },

      resetWidgetPrefs: () => set({ widgetPrefs: DEFAULT_WIDGET_PREFS }),

      /* ================================================================
         Namaz vakit ayarları
         ================================================================ */
      setPrayerMethod: (method) => {
        const num = Number(method);
        if (!Number.isFinite(num)) return;
        set({ prayerMethod: num });
      },

      setTuneMinutes: (minutes) => {
        const clamped = Math.max(-30, Math.min(30, Number(minutes) || 0));
        set({ tuneMinutes: clamped });
      },

      setPrayerDataSource: (source) => {
        if (!isValidDataSource(source)) return;
        set({ prayerDataSource: source });
      },

      /* ================================================================
         Kur'an okuyucu kaynağı
         ================================================================ */
      setQuranSource: (source) => {
        if (!isValidQuranSource(source)) {
          if (__DEV__) console.warn("[Store] Geçersiz Kur'an kaynağı:", source);
          return;
        }
        set({ quranSource: source });
      },

      /* ================================================================
         Diyanet Kur'an API anahtarı (Beta)
         ================================================================ */
      setDiyanetKuranApiKey: (key) => {
        set({ diyanetKuranApiKey: normalizeApiKey(key) });
      },

      clearDiyanetKuranApiKey: () => {
        set({ diyanetKuranApiKey: DEFAULT_DIYANET_KURAN_API_KEY });
      },

      hasDiyanetKuranApiKey: () => {
        const key = get().diyanetKuranApiKey;
        return typeof key === 'string' && key.length >= 10;
      },

      /* ================================================================
         Fabrika ayarlarına sıfırla
         ================================================================ */
      resetAll: async () => {
        cancelPrayerNotifications().catch(() => {});
        try {
          await resetAppData();
        } catch (e) {
          console.warn('[Store] Veri sıfırlama hatası:', e?.message);
        }

        set({
          isFirstLaunch: true,
          hasShownIntro: false,
          selectedLocation: DEFAULT_LOCATION,
          themeMode: DEFAULT_THEME_MODE,
          accentColor: DEFAULT_ACCENT,
          homeLayoutTheme: DEFAULT_HOME_LAYOUT_THEME,
          highContrast: false,
          reduceMotion: false,
          largeTouchTargets: false,
          dyslexiaFont: false,
          isSimpleMode: false,
          showArabic: DEFAULT_SHOW_ARABIC,
          mealEdition: DEFAULT_MEAL_EDITION,
          readingMode: DEFAULT_READING_MODE,
          readingFontScale: DEFAULT_READING_FONT_SCALE,
          homePrefs: DEFAULT_HOME_PREFS,
          tesbihatAutoAdvance: DEFAULT_TESBIHAT_AUTO_ADVANCE,
          globalHaptic: DEFAULT_GLOBAL_HAPTIC,
          favoriteDuas: [],
          widgetsConfig: DEFAULT_WIDGETS_CONFIG,
          widgetPrefs: DEFAULT_WIDGET_PREFS,
          prayerMethod: DEFAULT_PRAYER_METHOD,
          tuneMinutes: DEFAULT_TUNE_MINUTES,
          prayerDataSource: DEFAULT_PRAYER_DATA_SOURCE,
          quranSource: DEFAULT_QURAN_SOURCE,
          diyanetKuranApiKey: DEFAULT_DIYANET_KURAN_API_KEY,
          zikirCounts: {},
          zikirTargets: {},
          selectedZikirId: DEFAULT_SELECTED_ZIKIR_ID,
          customZikirs: [],
          favoriteZikirs: [],
          zekatAssetData: DEFAULT_ZEKAT_ASSET_DATA,
          zekatPrices: DEFAULT_PRICES,
        });
      },
    }),
    {
      name: 'nida-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      version: 22,

      partialize: (state) => {
        const out = {};
        for (const key of PERSISTED_KEYS) {
          if (key in state) out[key] = state[key];
        }
        return out;
      },

      migrate: (persistedState, version) => {
        if (!persistedState) return persistedState;

        const savedPrefs = persistedState.widgetPrefs || {};
        const savedConfig = persistedState.widgetsConfig || {};
        const savedHomePrefs = persistedState.homePrefs || {};
        const persistedKey = persistedState.diyanetKuranApiKey;

        const persistedSource = persistedState.quranSource;
        const validPersistedSource =
          persistedSource === 'offline' || isValidQuranSource(persistedSource);

        const savedLayoutVariant = savedPrefs.layoutVariant;
        const migratedLayoutVariant = isValidWidgetLayout(savedLayoutVariant)
          ? savedLayoutVariant
          : savedPrefs.showAllPrayers === true
            ? 'timeline'
            : 'hero-list';

        const { showAllPrayers: _legacyShowAll, ...cleanPrefs } = savedPrefs;

        const persistedThemeMode = persistedState.themeMode;
        const safeThemeMode = isValidThemeMode(persistedThemeMode)
          ? persistedThemeMode
          : DEFAULT_THEME_MODE;

        const persistedAccent = persistedState.accentColor;
        let safeAccentColor;
        if (!isValidAccent(persistedAccent)) {
          safeAccentColor = DEFAULT_ACCENT;
        } else if (!isAccentCompatibleWithTheme(safeThemeMode, persistedAccent)) {
          safeAccentColor = resolveAccentForTheme(safeThemeMode, persistedAccent);
        } else {
          safeAccentColor = persistedAccent;
        }

        const safeHomeLayoutTheme = isValidHomeLayoutTheme(persistedState.homeLayoutTheme)
          ? persistedState.homeLayoutTheme
          : DEFAULT_HOME_LAYOUT_THEME;

        const persistedWidgetTheme = cleanPrefs.themeMode;
        const safeWidgetTheme = isValidWidgetTheme(persistedWidgetTheme)
          ? persistedWidgetTheme
          : 'auto';

        const readingMode = isValidReadingMode(persistedState.readingMode)
          ? persistedState.readingMode
          : DEFAULT_READING_MODE;

        const readingFontScale = isValidReadingFontScale(persistedState.readingFontScale)
          ? Number(persistedState.readingFontScale)
          : DEFAULT_READING_FONT_SCALE;

        const safeSelectedZikirId =
          typeof persistedState.selectedZikirId === 'string'
            ? persistedState.selectedZikirId
            : DEFAULT_SELECTED_ZIKIR_ID;

        return {
          ...persistedState,

          selectedLocation: normalizeLocation(persistedState.selectedLocation),

          themeMode: safeThemeMode,
          accentColor: safeAccentColor,
          homeLayoutTheme: safeHomeLayoutTheme,
          highContrast: Boolean(persistedState.highContrast),
          reduceMotion: Boolean(persistedState.reduceMotion),
          largeTouchTargets: Boolean(persistedState.largeTouchTargets),
          dyslexiaFont: Boolean(persistedState.dyslexiaFont),

          readingMode,
          readingFontScale,

          homePrefs: {
            ...DEFAULT_HOME_PREFS,
            ...savedHomePrefs,
          },

          tesbihatAutoAdvance: persistedState.tesbihatAutoAdvance !== false,
          globalHaptic: persistedState.globalHaptic !== false,

          widgetPrefs: {
            ...DEFAULT_WIDGET_PREFS,
            ...cleanPrefs,
            themeMode: safeWidgetTheme,
            layoutVariant: migratedLayoutVariant,
          },

          widgetsConfig: { ...DEFAULT_WIDGETS_CONFIG, ...savedConfig },

          prayerDataSource: isValidDataSource(persistedState.prayerDataSource)
            ? persistedState.prayerDataSource
            : DEFAULT_PRAYER_DATA_SOURCE,

          quranSource: validPersistedSource
            ? persistedSource
            : DEFAULT_QURAN_SOURCE,

          diyanetKuranApiKey:
            typeof persistedKey === 'string'
              ? persistedKey.trim()
              : DEFAULT_DIYANET_KURAN_API_KEY,

          hasShownIntro: Boolean(persistedState.hasShownIntro),

          zikirCounts: {},
          zikirTargets: {},

          selectedZikirId: safeSelectedZikirId,
          customZikirs: persistedState.customZikirs ?? [],
          favoriteZikirs: persistedState.favoriteZikirs ?? [],

          zekatAssetData: {
            ...DEFAULT_ZEKAT_ASSET_DATA,
            ...(persistedState.zekatAssetData || {}),
          },
          zekatPrices: persistedState.zekatPrices ?? DEFAULT_PRICES,
        };
      },
    },
  ),
);

/* ================================================================
   Selectors — Dinamik modda her 5 dakikada bir kademeli ton güncellenir
   ================================================================ */

let themeCache = null;
let themeCacheKey = null;

export function useTheme() {
  const themeMode = useAppStore((s) => s.themeMode);
  const accentColor = useAppStore((s) => s.accentColor);
  const getTheme = useAppStore((s) => s.getTheme);

  const now = new Date();
  const timeBucket =
    themeMode === 'dynamic'
      ? `${now.getHours()}-${Math.floor(now.getMinutes() / 5)}`
      : 'static';

  const key = `${themeMode}:${accentColor}:${timeBucket}`;
  if (key !== themeCacheKey) {
    themeCache = getTheme(now);
    themeCacheKey = key;
  }
  return themeCache;
}

export function useHomeLayoutTheme() {
  return useAppStore((s) => s.homeLayoutTheme) ?? DEFAULT_HOME_LAYOUT_THEME;
}

export function useWidgetsConfig() {
  return useAppStore((s) => s.widgetsConfig) || DEFAULT_WIDGETS_CONFIG;
}

export function useWidgetPrefs() {
  return useAppStore((s) => s.widgetPrefs) || DEFAULT_WIDGET_PREFS;
}

export function useHomePrefs() {
  return useAppStore((s) => s.homePrefs) || DEFAULT_HOME_PREFS;
}

export function useQuranSource() {
  return useAppStore((s) => s.quranSource) ?? DEFAULT_QURAN_SOURCE;
}

export function useDiyanetKuranApiKey() {
  return useAppStore((s) => s.diyanetKuranApiKey) ?? '';
}

export function useHasDiyanetKuranApiKey() {
  const key = useAppStore((s) => s.diyanetKuranApiKey);
  return typeof key === 'string' && key.length >= 10;
}

export function useReadingMode() {
  return useAppStore((s) => s.readingMode) ?? DEFAULT_READING_MODE;
}

export function useReadingFontScale() {
  return useAppStore((s) => s.readingFontScale) ?? DEFAULT_READING_FONT_SCALE;
}

export function useTesbihatAutoAdvance() {
  return useAppStore((s) => s.tesbihatAutoAdvance) ?? DEFAULT_TESBIHAT_AUTO_ADVANCE;
}

export function useGlobalHaptic() {
  return useAppStore((s) => s.globalHaptic) ?? DEFAULT_GLOBAL_HAPTIC;
}

/* ================================================================
   Zikirmatik selector'ları — zikir bazlı sayaç
   ================================================================ */

export function useZikirCount(zikirId) {
  return useAppStore((s) => {
    const id = zikirId ?? s.selectedZikirId;
    if (!id) return 0;
    const counts = s.zikirCounts;
    if (!counts || typeof counts !== 'object') return 0;
    const val = Number(counts[id]);
    return Number.isFinite(val) && val > 0 ? val : 0;
  });
}

export function useZikirTarget(zikirId, defaultTarget = DEFAULT_ZIKIR_TARGET) {
  return useAppStore((s) => {
    const id = zikirId ?? s.selectedZikirId;
    return s.zikirTargets?.[id] ?? defaultTarget;
  });
}

/* ================================================================
   Tema-Renk yardımcıları (dışa aktarıldı)
   ================================================================ */

export function getThemeAccentCompatibility(themeMode) {
  return THEME_ACCENT_COMPAT[themeMode] ?? null;
}

export function isThemeAccentValid(themeMode, accentId) {
  return isAccentCompatibleWithTheme(themeMode, accentId);
}

export { THEME_ACCENT_COMPAT };