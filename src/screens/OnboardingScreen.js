// src/screens/OnboardingScreen.js
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useAppStore } from '../store/useAppStore';
import {
  THEME_MODES,
  ACCENT_COLORS,
  ACCENT_GROUPS,
} from '../theme/colors';

/* ================================================================
   Sabitler
   ================================================================ */
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const DEBOUNCE_MS = 350;
const SEARCH_TIMEOUT_MS = 8000;

const TOTAL_STEPS = 4;

const makePlace = (id, title, country, latitude, longitude, timezone) => ({
  id,
  title,
  subtitle: country,
  city: title,
  district: title,
  country,
  latitude,
  longitude,
  timezone,
});

const POPULAR_PLACES = [
  makePlace('p-istanbul', 'İstanbul', 'Türkiye', 41.0082, 28.9784, 'Europe/Istanbul'),
  makePlace('p-ankara', 'Ankara', 'Türkiye', 39.9334, 32.8597, 'Europe/Istanbul'),
  makePlace('p-izmir', 'İzmir', 'Türkiye', 38.4237, 27.1428, 'Europe/Istanbul'),
  makePlace('p-bursa', 'Bursa', 'Türkiye', 40.1826, 29.0669, 'Europe/Istanbul'),
  makePlace('p-konya', 'Konya', 'Türkiye', 37.8746, 32.4932, 'Europe/Istanbul'),
  makePlace('p-mekke', 'Mekke', 'Suudi Arabistan', 21.3891, 39.8579, 'Asia/Riyadh'),
  makePlace('p-medine', 'Medine', 'Suudi Arabistan', 24.5247, 39.5692, 'Asia/Riyadh'),
  makePlace('p-berlin', 'Berlin', 'Almanya', 52.52, 13.405, 'Europe/Berlin'),
];

// Yalnızca ilk adımda öne çıkan temalar
const FEATURED_THEMES = ['dynamic', 'modernLight', 'dark', 'oled'];

// Erişilebilirlik seviyeleri — isSimpleMode'u otomatik yönetir
const ACCESSIBILITY_LEVELS = [
  {
    id: 'standard',
    label: 'Standart',
    desc: 'Normal yazı, tüm özellikler',
    icon: 'text-outline',
    fontScale: 1.0,
    simpleMode: false,
  },
  {
    id: 'large',
    label: 'Büyük Yazı',
    desc: 'Daha büyük metinler',
    icon: 'text',
    fontScale: 1.15,
    simpleMode: false,
  },
  {
    id: 'extra-large',
    label: 'Çok Büyük',
    desc: 'Basit mod + maksimum boyut',
    icon: 'albums-outline',
    fontScale: 1.3,
    simpleMode: true,
  },
];

/* ================================================================
   Yardımcılar
   ================================================================ */
function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function mapGeocodingResult(item) {
  const name = item.name || '';
  const admin = item.admin1 || item.admin2 || '';
  return {
    id: String(item.id ?? `${item.latitude},${item.longitude}`),
    title: name,
    subtitle: [admin && admin !== name ? admin : null, item.country]
      .filter(Boolean)
      .join(', '),
    city: admin || name,
    district: name,
    country: item.country || '',
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone,
  };
}

const normalize = (s) => String(s || '').toLocaleLowerCase('tr-TR');

/* ================================================================
   Progress Dots
   ================================================================ */
const ProgressDots = memo(function ProgressDots({ step, total, theme }) {
  return (
    <View
      style={styles.progressDots}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: step + 1 }}
      accessibilityLabel={`Adım ${step + 1} / ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => {
        const active = i === step;
        const passed = i < step;
        return (
          <View
            key={i}
            style={[
              styles.progressDot,
              {
                backgroundColor: active
                  ? theme.primary
                  : passed
                    ? `${theme.primary}77`
                    : theme.border,
                width: active ? 24 : 8,
              },
            ]}
          />
        );
      })}
    </View>
  );
});

/* ================================================================
   Adım 0 — Karşılama
   ================================================================ */
const WelcomeStep = memo(function WelcomeStep({ theme, onPrimary }) {
  const fade = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }], flex: 1 }}>
      <View style={styles.welcomeHeader}>
        <View style={[styles.welcomeBismillah, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="star-four-points" size={10} color={theme.primary} />
          <Text style={[styles.welcomeBismillahText, { color: theme.primary }]}>
            بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
          </Text>
        </View>

        <View style={[styles.welcomeLogo, { backgroundColor: theme.primaryGlow, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="star-crescent" size={54} color={theme.primary} />
        </View>

        <Text style={[styles.welcomeTitle, { color: theme.text }]}>NİDA</Text>
        <Text style={[styles.welcomeSubtitle, { color: theme.textDim }]}>
          Hoş geldiniz
        </Text>
        <Text style={[styles.welcomeTagline, { color: theme.textDim }]}>
          Sade, reklamsız, ücretsiz ezan vaktiniz
        </Text>
      </View>

      <View style={styles.welcomeFeatures}>
        {[
          { icon: 'time-outline', title: 'Vakitler', desc: 'Diyanet doğruluk' },
          { icon: 'moon-outline', title: 'Kıble', desc: 'Pusula + harita' },
          { icon: 'book-outline', title: "Kur'an", desc: '5 kaynak · meal' },
          { icon: 'notifications-outline', title: 'Bildirim', desc: 'Akıllı hatırlatma' },
        ].map((f) => (
          <View
            key={f.title}
            style={[styles.welcomeFeature, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            <View style={[styles.welcomeFeatureIcon, { backgroundColor: theme.primaryGlow }]}>
              <Ionicons name={f.icon} size={18} color={theme.primary} />
            </View>
            <Text style={[styles.welcomeFeatureTitle, { color: theme.text }]}>
              {f.title}
            </Text>
            <Text style={[styles.welcomeFeatureDesc, { color: theme.textDim }]}>
              {f.desc}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
});

/* ================================================================
   Adım 1 — Konum
   ================================================================ */
const LocationStep = memo(function LocationStep({
  theme, onPrimary, onSelectLocation, onOpenSearch, detecting, error,
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="location" size={26} color={theme.primary} />
        </View>
        <Text style={[styles.stepTitle, { color: theme.text }]}>
          Nerede yaşıyorsunuz?
        </Text>
        <Text style={[styles.stepDesc, { color: theme.textDim }]}>
          Namaz vakitleri konumunuza göre otomatik hesaplanır
        </Text>
      </View>

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.4)' }]}>
          <Ionicons name="alert-circle" size={18} color="#EF4444" />
          <Text style={{ color: theme.text, flex: 1, fontSize: 13, lineHeight: 19 }}>
            {error}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.primaryBtn, { backgroundColor: theme.primary }, detecting && { opacity: 0.7 }]}
        onPress={() => onSelectLocation('gps')}
        disabled={detecting}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Konumumu otomatik bul"
        accessibilityState={{ busy: detecting }}
      >
        {detecting ? (
          <>
            <ActivityIndicator color={onPrimary} />
            <Text style={[styles.primaryBtnText, { color: onPrimary }]}>
              Konum aranıyor…
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="navigate" size={20} color={onPrimary} />
            <Text style={[styles.primaryBtnText, { color: onPrimary }]}>
              Konumumu otomatik bul
            </Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.secondaryBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={onOpenSearch}
        disabled={detecting}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Şehir ara"
      >
        <Ionicons name="search" size={18} color={theme.textDim} />
        <Text style={[styles.secondaryBtnText, { color: theme.text }]}>
          Şehir veya ülke ara
        </Text>
      </TouchableOpacity>

      <View style={styles.locationMeta}>
        <Ionicons name="shield-checkmark-outline" size={13} color={theme.textMuted} />
        <Text style={[styles.locationMetaText, { color: theme.textMuted }]}>
          Konumunuz cihazınızdan dışarı çıkmaz
        </Text>
      </View>

      <View style={styles.spacer} />

      <View style={[styles.locationHint, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MaterialCommunityIcons name="information-outline" size={16} color={theme.primary} />
        <Text style={[styles.locationHintText, { color: theme.textDim }]}>
          Yaklaşık 18.000 şehir ve ilçe destekleniyor
        </Text>
      </View>
    </View>
  );
});

/* ================================================================
   Adım 2 — Tema
   ================================================================ */
const ThemeStep = memo(function ThemeStep({
  theme, themeMode, accentColor, onSelectTheme, onSelectAccent, availableAccentIds,
}) {
  const featuredThemes = useMemo(
    () => THEME_MODES.filter((t) => FEATURED_THEMES.includes(t.id)),
    [],
  );

  const visibleAccentGroups = useMemo(() => {
    return ACCENT_GROUPS
      .map((g) => ({ ...g, ids: g.ids.filter((id) => availableAccentIds.has(id)) }))
      .filter((g) => g.ids.length > 0);
  }, [availableAccentIds]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="color-palette" size={26} color={theme.primary} />
        </View>
        <Text style={[styles.stepTitle, { color: theme.text }]}>
          Görünümünüzü seçin
        </Text>
        <Text style={[styles.stepDesc, { color: theme.textDim }]}>
          Sonradan ayarlardan değiştirebilirsiniz
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <Text style={[styles.pickerLabel, { color: theme.textDim }]}>TEMA</Text>
        <View style={styles.themeGrid}>
          {featuredThemes.map((t) => {
            const sel = themeMode === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                onPress={() => onSelectTheme(t.id)}
                activeOpacity={0.75}
                style={[
                  styles.themeTile,
                  {
                    backgroundColor: theme.surface,
                    borderColor: sel ? theme.primary : theme.border,
                    borderWidth: sel ? 2 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: sel }}
                accessibilityLabel={`${t.name}. ${t.desc || ''}${sel ? ' Seçili.' : ''}`}
              >
                <View style={[styles.themePreviewWrap, { backgroundColor: theme.background }]}>
                  <View style={[styles.themePreviewBar, { backgroundColor: theme.surface }]} />
                  <View style={[styles.themePreviewBar, { backgroundColor: theme.border }]} />
                  <View style={[styles.themePreviewBar, { backgroundColor: theme.primary, width: '55%' }]} />
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name={t.icon} size={14} color={sel ? theme.primary : theme.textDim} />
                  <Text style={[styles.themeTileName, { color: sel ? theme.primary : theme.text }]} numberOfLines={1}>
                    {t.name}
                  </Text>
                </View>
                {t.desc ? (
                  <Text style={[styles.themeTileDesc, { color: theme.textDim }]} numberOfLines={1}>
                    {t.desc}
                  </Text>
                ) : null}
                {sel ? (
                  <View style={[styles.themeCheck, { backgroundColor: theme.primary }]}>
                    <Ionicons name="checkmark" size={11} color="#FFF" />
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.pickerLabel, { color: theme.textDim, marginTop: 22 }]}>
          VURGU RENGİ
        </Text>
        {visibleAccentGroups.slice(0, 3).map((group) => (
          <View key={group.name} style={{ marginBottom: 14 }}>
            <Text style={[styles.accentGroupName, { color: theme.textMuted }]}>
              {group.name.toLocaleUpperCase('tr-TR')}
            </Text>
            <View style={styles.accentRow}>
              {group.ids.map((id) => {
                const color = ACCENT_COLORS[id];
                if (!color) return null;
                const sel = accentColor === id;
                return (
                  <TouchableOpacity
                    key={id}
                    onPress={() => onSelectAccent(id)}
                    activeOpacity={0.8}
                    style={[
                      styles.accentCircle,
                      {
                        backgroundColor: color.primary,
                        borderColor: sel ? theme.text : 'transparent',
                        borderWidth: sel ? 3 : 2,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`${color.name}${sel ? ' · seçili' : ''}`}
                    accessibilityState={{ selected: sel }}
                  >
                    {sel ? <Ionicons name="checkmark" size={18} color="#FFF" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

/* ================================================================
   Adım 3 — Erişilebilirlik + Bildirim
   ================================================================ */
const PreferencesStep = memo(function PreferencesStep({
  theme, onPrimary, accessibilityLevel, onSelectAccessibility,
  notificationsEnabled, onToggleNotifications,
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.stepHeader}>
        <View style={[styles.stepIconCircle, { backgroundColor: theme.primaryGlow }]}>
          <Ionicons name="options" size={26} color={theme.primary} />
        </View>
        <Text style={[styles.stepTitle, { color: theme.text }]}>
          Son adım
        </Text>
        <Text style={[styles.stepDesc, { color: theme.textDim }]}>
          Size en uygun deneyimi seçin
        </Text>
      </View>

      <Text style={[styles.pickerLabel, { color: theme.textDim }]}>
        YAZI BOYUTU
      </Text>
      <View style={{ gap: 10, marginBottom: 24 }}>
        {ACCESSIBILITY_LEVELS.map((level) => {
          const sel = accessibilityLevel === level.id;
          return (
            <TouchableOpacity
              key={level.id}
              onPress={() => onSelectAccessibility(level.id)}
              activeOpacity={0.75}
              style={[
                styles.prefRow,
                {
                  backgroundColor: sel ? theme.primaryGlow : theme.surface,
                  borderColor: sel ? theme.primary : theme.border,
                  borderWidth: sel ? 2 : 1,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: sel }}
              accessibilityLabel={`${level.label}. ${level.desc}${sel ? ' Seçili.' : ''}`}
            >
              <View style={[
                styles.prefIcon,
                { backgroundColor: sel ? theme.primary : theme.surfaceElevated },
              ]}>
                <Ionicons name={level.icon} size={20} color={sel ? onPrimary : theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.prefTitle, { color: theme.text }]}>
                  {level.label}
                </Text>
                <Text style={[styles.prefDesc, { color: theme.textDim }]}>
                  {level.desc}
                </Text>
              </View>
              <View style={[
                styles.radioCircle,
                {
                  borderColor: sel ? theme.primary : theme.border,
                  backgroundColor: sel ? theme.primary : 'transparent',
                },
              ]}>
                {sel ? <Ionicons name="checkmark" size={14} color="#FFF" /> : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.pickerLabel, { color: theme.textDim }]}>
        BİLDİRİMLER
      </Text>
      <View style={[
        styles.prefRow,
        {
          backgroundColor: notificationsEnabled ? theme.primaryGlow : theme.surface,
          borderColor: notificationsEnabled ? theme.primary : theme.border,
          borderWidth: notificationsEnabled ? 2 : 1,
        },
      ]}>
        <View style={[
          styles.prefIcon,
          { backgroundColor: notificationsEnabled ? theme.primary : theme.surfaceElevated },
        ]}>
          <Ionicons
            name={notificationsEnabled ? 'notifications' : 'notifications-off'}
            size={20}
            color={notificationsEnabled ? onPrimary : theme.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.prefTitle, { color: theme.text }]}>
            Vakit Hatırlatmaları
          </Text>
          <Text style={[styles.prefDesc, { color: theme.textDim }]}>
            {notificationsEnabled
              ? 'Ezan vaktinden önce bildirim alacaksınız'
              : 'İstediğiniz zaman ayarlardan açabilirsiniz'}
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={onToggleNotifications}
          trackColor={{ false: theme.border, true: theme.primary }}
          thumbColor="#FFF"
          accessibilityLabel="Vakit hatırlatmaları"
        />
      </View>
    </View>
  );
});

/* ================================================================
   Ana Bileşen
   ================================================================ */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  /* Store */
  const getTheme = useAppStore((s) => s.getTheme);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const themeMode = useAppStore((s) => s.themeMode);
  const accentColor = useAppStore((s) => s.accentColor);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const setAccentColor = useAppStore((s) => s.setAccentColor);
  const setReadingFontScale = useAppStore((s) => s.setReadingFontScale);
  const setSimpleMode = useAppStore((s) => s.setSimpleMode);
  const setWidget = useAppStore((s) => s.setWidget);

  const theme = getTheme();
  const onPrimary = theme.onPrimary || '#FFFFFF';

  /* State */
  const [step, setStep] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [accessibilityLevel, setAccessibilityLevel] = useState('standard');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState({ status: 'idle', results: [] });

  const mounted = useRef(true);
  const completing = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  /* ---------- Tema uyumlu renkler ---------- */
  const availableAccentIds = useMemo(() => {
    try {
      const store = useAppStore.getState();
      if (typeof store.getAvailableAccents === 'function') {
        const list = store.getAvailableAccents(themeMode);
        if (Array.isArray(list) && list.length > 0) return new Set(list);
      }
    } catch {}
    return new Set(Object.keys(ACCENT_COLORS));
  }, [themeMode]);

  /* ---------- Konum seçimi ---------- */
  const handleGPS = useCallback(async () => {
    if (detecting || completing.current) return;
    setDetecting(true);
    setLocationError(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationError('Konum servisi kapalı. Açabilir ya da şehri arayarak seçebilirsiniz.');
        return;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== 'granted') {
        setLocationError('Konum izni verilmedi. Dilerseniz şehri arayarak seçebilirsiniz.');
        return;
      }

      const position = (await Location.getLastKnownPositionAsync({ maxAge: 15 * 60 * 1000 })) ||
        (await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 15000));

      const { latitude, longitude } = position.coords;

      let place = null;
      try {
        const [geo] = await withTimeout(Location.reverseGeocodeAsync({ latitude, longitude }), 8000);
        place = geo || null;
      } catch { place = null; }

      const city = place?.region || place?.city || place?.subregion || 'Konumum';
      const districtCandidate = place?.subregion || place?.city || place?.district;
      const district = districtCandidate && districtCandidate !== city ? districtCandidate : city;

      setSelectedLocation({
        city, district, country: place?.country || '',
        latitude, longitude, isAutoGPS: true,
      });
    } catch {
      setLocationError('Konumunuz alınamadı. Tekrar deneyin ya da şehri arayarak seçin.');
    } finally {
      if (mounted.current) setDetecting(false);
    }
  }, [detecting]);

  /* ---------- Şehir arama ---------- */
  useEffect(() => {
    if (!modalVisible) return;
    const q = query.trim();
    if (q.length < 2) { setSearch({ status: 'idle', results: [] }); return; }

    setSearch((prev) => ({ ...prev, status: 'loading' }));

    const controller = new AbortController();
    let timedOut = false;
    let timeoutId;

    const debounceId = setTimeout(async () => {
      timeoutId = setTimeout(() => { timedOut = true; controller.abort(); }, SEARCH_TIMEOUT_MS);

      try {
        const res = await fetch(
          `${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=10&language=tr&format=json`,
          { signal: controller.signal },
        );
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
      } finally {
        clearTimeout(timeoutId);
      }
    }, DEBOUNCE_MS);

    return () => { clearTimeout(debounceId); clearTimeout(timeoutId); controller.abort(); };
  }, [query, retryKey, modalVisible]);

  const handleSelectPlace = useCallback((item) => {
    setSelectedLocation({
      city: item.city, district: item.district, country: item.country,
      timezone: item.timezone, latitude: item.latitude, longitude: item.longitude,
      isAutoGPS: false,
    });
    setModalVisible(false);
    setQuery('');
    setStep(2);
  }, []);

  /* ---------- Erişilebilirlik ---------- */
  const handleAccessibilitySelect = useCallback((levelId) => {
    setAccessibilityLevel(levelId);
    const level = ACCESSIBILITY_LEVELS.find((l) => l.id === levelId);
    if (level) {
      setReadingFontScale(level.fontScale);
      setSimpleMode(level.simpleMode);
    }
  }, [setReadingFontScale, setSimpleMode]);

  /* ---------- Adım navigasyonu ---------- */
  const canGoNext = useMemo(() => {
    if (step === 1) return !!selectedLocation;
    return true;
  }, [step, selectedLocation]);

  const goNext = useCallback(() => {
    if (step === 1 && !selectedLocation) {
      setLocationError('Devam etmek için bir konum seçmelisiniz');
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      // Son adım — onboarding tamamla
      handleComplete();
    }
  }, [step, selectedLocation]);

  const goBack = useCallback(() => {
    if (step > 0) setStep(step - 1);
  }, [step]);

  const handleSkip = useCallback(() => {
    // Konum adımını atla — varsayılan konumla devam
    if (step === 1) {
      setSelectedLocation({
        city: 'Kocaeli', district: 'Darıca', country: 'Türkiye',
        latitude: 40.7739, longitude: 29.4003, timezone: 'Europe/Istanbul',
        isAutoGPS: false,
      });
      setStep(2);
    } else if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    }
  }, [step]);

  /* ---------- Tamamla ---------- */
  const handleComplete = useCallback(async () => {
    if (completing.current) return;
    completing.current = true;
    try {
      const location = selectedLocation || {
        city: 'Kocaeli', district: 'Darıca', country: 'Türkiye',
        latitude: 40.7739, longitude: 29.4003, timezone: 'Europe/Istanbul',
        isAutoGPS: false,
      };

      // Bildirim tercihini store'a yaz
      setWidget('notificationsEnabled', notificationsEnabled);

      // Onboarding'i tamamla
      await completeOnboarding(location, accessibilityLevel === 'extra-large');
    } catch (e) {
      if (mounted.current) {
        setLocationError('Ayarlar kaydedilemedi. Lütfen tekrar deneyin.');
      }
    } finally {
      completing.current = false;
    }
  }, [selectedLocation, notificationsEnabled, accessibilityLevel, completeOnboarding, setWidget]);

  /* ---------- Status bar ---------- */
  const statusBarStyle = theme.mode === 'light' || theme.mode === 'modernLight' || theme.mode === 'sepia' || theme.mode === 'sand'
    ? 'dark-content' : 'light-content';

  /* ---------- Skip metni ---------- */
  const skipLabel = step === 1 ? 'Varsayılan' : 'Atla';
  const showSkip = step > 0 && step < TOTAL_STEPS - 1;

  /* ---------- Render ---------- */
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={statusBarStyle} />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View style={{ width: 60 }}>
          {step > 0 ? (
            <TouchableOpacity
              onPress={goBack}
              style={[styles.backBtn, { borderColor: theme.border, backgroundColor: theme.surface }]}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons name="arrow-back" size={18} color={theme.text} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ProgressDots step={step} total={TOTAL_STEPS} theme={theme} />

        <View style={{ width: 60, alignItems: 'flex-end' }}>
          {showSkip ? (
            <TouchableOpacity
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel={skipLabel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.skipText, { color: theme.textDim }]}>
                {skipLabel}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ADIM İÇERİĞİ */}
      <View style={styles.stepContent}>
        {step === 0 ? (
          <WelcomeStep theme={theme} onPrimary={onPrimary} />
        ) : step === 1 ? (
          <LocationStep
            theme={theme}
            onPrimary={onPrimary}
            onSelectLocation={handleGPS}
            onOpenSearch={() => { setLocationError(null); setModalVisible(true); }}
            detecting={detecting}
            error={locationError}
          />
        ) : step === 2 ? (
          <ThemeStep
            theme={theme}
            themeMode={themeMode}
            accentColor={accentColor}
            onSelectTheme={setThemeMode}
            onSelectAccent={setAccentColor}
            availableAccentIds={availableAccentIds}
          />
        ) : (
          <PreferencesStep
            theme={theme}
            onPrimary={onPrimary}
            accessibilityLevel={accessibilityLevel}
            onSelectAccessibility={handleAccessibilitySelect}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={setNotificationsEnabled}
          />
        )}
      </View>

      {/* BOTTOM BAR */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(16, insets.bottom) }]}>
        {step === 0 ? (
          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.85}
            style={[styles.ctaBtn, { backgroundColor: theme.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Başla"
          >
            <Text style={[styles.ctaBtnText, { color: onPrimary }]}>
              Başla
            </Text>
            <Ionicons name="arrow-forward" size={20} color={onPrimary} />
          </TouchableOpacity>
        ) : step === TOTAL_STEPS - 1 ? (
          <TouchableOpacity
            onPress={handleComplete}
            activeOpacity={0.85}
            style={[styles.ctaBtn, { backgroundColor: theme.primary }]}
            accessibilityRole="button"
            accessibilityLabel="Kurulumu tamamla"
          >
            <Ionicons name="checkmark-circle" size={20} color={onPrimary} />
            <Text style={[styles.ctaBtnText, { color: onPrimary }]}>
              Kurulumu tamamla
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.85}
            disabled={!canGoNext}
            style={[styles.ctaBtn, { backgroundColor: theme.primary, opacity: canGoNext ? 1 : 0.5 }]}
            accessibilityRole="button"
            accessibilityLabel="Devam et"
            accessibilityState={{ disabled: !canGoNext }}
          >
            <Text style={[styles.ctaBtnText, { color: onPrimary }]}>
              Devam et
            </Text>
            <Ionicons name="arrow-forward" size={20} color={onPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* ŞEHİR ARAMA MODALI */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
            accessibilityLabel="Kapat"
          />

          <View style={[styles.modalContent, {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 16),
          }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Şehir ara
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Kapat"
              >
                <Ionicons name="close" size={24} color={theme.textDim} />
              </TouchableOpacity>
            </View>

            <View style={[styles.searchBox, {
              backgroundColor: theme.surfaceElevated,
              borderColor: theme.border,
            }]}>
              <Ionicons name="search" size={18} color={theme.textDim} />
              <TextInput
                placeholder="Örn. Gebze, Berlin, Londra"
                placeholderTextColor={theme.textMuted}
                style={[styles.searchInput, { color: theme.text }]}
                value={query}
                onChangeText={setQuery}
                autoFocus
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
                accessibilityLabel="Şehir ara"
              />
              {search.status === 'loading' && query.trim().length >= 2 ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : null}
            </View>

            <FlatList
              data={query.trim().length < 2 ? POPULAR_PLACES : search.results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isPopular = query.trim().length < 2;
                return (
                  <TouchableOpacity
                    style={[styles.cityRow, { borderBottomColor: theme.border }]}
                    onPress={() => handleSelectPlace(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}${item.subtitle ? ', ' + item.subtitle : ''}`}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.cityIconBox, { backgroundColor: theme.primaryGlow }]}>
                      <Ionicons
                        name={isPopular ? 'star' : 'location-outline'}
                        size={18}
                        color={theme.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cityTitle, { color: theme.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.subtitle ? (
                        <Text style={[styles.citySubtitle, { color: theme.textDim }]} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                query.trim().length < 2 ? (
                  <Text style={[styles.listHeader, { color: theme.textDim }]}>
                    POPÜLER KONUMLAR
                  </Text>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  {search.status === 'loading' && (
                    <>
                      <ActivityIndicator color={theme.primary} />
                      <Text style={[styles.emptyText, { color: theme.textMuted }]}>Aranıyor…</Text>
                    </>
                  )}
                  {search.status === 'error' && (
                    <>
                      <Ionicons name="cloud-offline-outline" size={32} color={theme.textDim} />
                      <Text style={[styles.emptyText, { color: theme.textDim }]}>
                        Arama yapılamadı. İnternet bağlantınızı kontrol edin.
                      </Text>
                      <TouchableOpacity
                        onPress={() => setRetryKey((k) => k + 1)}
                        style={[styles.retryBtn, { borderColor: theme.border }]}
                        accessibilityRole="button"
                      >
                        <Text style={{ color: theme.primary, fontWeight: '700', fontSize: 13 }}>
                          Tekrar dene
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {search.status === 'done' && query.trim().length >= 2 && (
                    <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                      "{query.trim()}" için sonuç bulunamadı.
                    </Text>
                  )}
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Top bar */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 52,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  skipText: { fontSize: 13.5, fontWeight: '700', letterSpacing: 0.2 },

  /* Progress */
  progressDots: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  progressDot: {
    height: 6,
    borderRadius: 3,
  },

  /* Step content */
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
  },

  /* Welcome step */
  welcomeHeader: { alignItems: 'center', marginBottom: 24 },
  welcomeBismillah: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  welcomeBismillahText: {
    fontSize: 14, fontWeight: '600',
    writingDirection: 'rtl', letterSpacing: 0.3,
  },
  welcomeLogo: {
    width: 88, height: 88, borderRadius: 26, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  welcomeTitle: {
    fontSize: 36, fontWeight: '900', letterSpacing: 6,
  },
  welcomeSubtitle: {
    fontSize: 15, fontWeight: '700', letterSpacing: 0.5,
    marginTop: 8,
  },
  welcomeTagline: {
    fontSize: 13, marginTop: 6, fontWeight: '500',
    textAlign: 'center', lineHeight: 19,
  },
  welcomeFeatures: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8,
  },
  welcomeFeature: {
    width: '48%', padding: 14, borderRadius: 16, borderWidth: 1, gap: 6,
  },
  welcomeFeatureIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  welcomeFeatureTitle: {
    fontSize: 13.5, fontWeight: '800', marginTop: 4,
  },
  welcomeFeatureDesc: {
    fontSize: 11.5, fontWeight: '500', lineHeight: 16,
  },

  /* Common step header */
  stepHeader: {
    alignItems: 'center', marginBottom: 28, gap: 6,
  },
  stepIconCircle: {
    width: 62, height: 62, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  stepTitle: {
    fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: -0.2,
  },
  stepDesc: {
    fontSize: 13.5, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8,
  },

  /* Error banner */
  errorBanner: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14,
  },

  /* Buttons */
  primaryBtn: {
    flexDirection: 'row', height: 52, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center', gap: 10,
    marginBottom: 10,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.2 },
  secondaryBtn: {
    flexDirection: 'row', height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: '700' },

  locationMeta: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5, marginTop: 14,
  },
  locationMetaText: { fontSize: 11.5, fontWeight: '500' },
  spacer: { flex: 1, minHeight: 16 },
  locationHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  locationHintText: { fontSize: 12, fontWeight: '500', flex: 1, lineHeight: 17 },

  /* Theme picker */
  pickerLabel: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 12,
  },
  themeGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  themeTile: {
    width: '48%', borderRadius: 14, padding: 10,
    position: 'relative',
  },
  themePreviewWrap: {
    borderRadius: 8, padding: 8, gap: 4, marginBottom: 8,
  },
  themePreviewBar: {
    height: 4, borderRadius: 2, width: '100%',
  },
  themeTileName: { fontSize: 12.5, fontWeight: '800' },
  themeTileDesc: { fontSize: 10.5, fontWeight: '500', marginTop: 2 },
  themeCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  accentGroupName: {
    fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8, marginBottom: 8,
  },
  accentRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
  },
  accentCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Preferences */
  prefRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 14,
  },
  prefIcon: {
    width: 42, height: 42, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  prefTitle: { fontSize: 14.5, fontWeight: '800' },
  prefDesc: { fontSize: 11.5, marginTop: 3, fontWeight: '500', lineHeight: 16 },
  radioCircle: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Bottom bar */
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaBtnText: {
    fontSize: 15.5, fontWeight: '900', letterSpacing: 0.3,
  },

  /* Modal */
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    borderWidth: 1, padding: 20, paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16,
  },
  modalTitle: { fontSize: 19, fontWeight: '900', letterSpacing: 0.2 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, height: 50, borderRadius: 14,
    borderWidth: 1, marginBottom: 12, gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, height: '100%' },
  listHeader: {
    fontSize: 11, fontWeight: '800', letterSpacing: 1.2,
    marginTop: 4, marginBottom: 6,
  },
  cityRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, gap: 12,
  },
  cityIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cityTitle: { fontSize: 15, fontWeight: '700' },
  citySubtitle: { fontSize: 12, marginTop: 2 },
  emptyBox: { padding: 32, alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  retryBtn: {
    marginTop: 6, paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 12, borderWidth: 1,
  },
});