// src/screens/RamazanScreen.js
import React, {
  useState, useEffect, useMemo, useCallback, useRef, memo,
} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppStore } from '../store/useAppStore';
import {
  getRamazanInfo, formatDateTR, formatDateShort,
  getWeekdayShort, pad, RELIGIOUS_DAYS, parseISOLocal, daysBetween,
  getEventTypeColor,
} from '../data/ramazanData';
import * as RamazanService from '../services/ramazanService';

/* ================================================================
   Modül-seviyesi erken teşhis
   ================================================================ */
if (__DEV__) {
  if (typeof RamazanService.fetchRamazanImsakiye !== 'function') {
    console.error(
      '[Ramazan] ❌ fetchRamazanImsakiye yüklenemedi. ' +
      'ramazanService.js export kontrol edin.',
    );
  }
  // eslint-disable-next-line global-require
  try {
    const diyanetApi = require('../services/diyanetApi');
    if (typeof diyanetApi.fetchDiyanetMonthlyTimes !== 'function') {
      console.error(
        '[Ramazan] ❌ fetchDiyanetMonthlyTimes diyanetApi.js içinde yok. ' +
        'Aylık imsakiye fonksiyonu eklenmemiş.',
      );
    }
  } catch (e) {
    console.error('[Ramazan] diyanetApi.js yüklenemedi:', e?.message);
  }
}

/* ================================================================
   Haptics — defansif
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}

const hapticImpact = (style = 'light') => {
  try {
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return;
    const map = Haptics.ImpactFeedbackStyle ?? {};
    const arg =
      style === 'medium' ? map.Medium
      : style === 'heavy' ? map.Heavy
      : map.Light;
    if (arg === undefined) Haptics.impactAsync();
    else Haptics.impactAsync(arg);
  } catch {}
};

/* ================================================================
   Yardımcı: bugünün sıradaki olayı
   ================================================================ */
function getNextRamazanEvent(now, times) {
  if (!times) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entries = [
    ['İmsak', times.imsak],
    ['İftar', times.aksam],
  ];
  for (const [name, t] of entries) {
    const m = String(t ?? '').match(/^(\d{1,2}):(\d{2})$/);
    if (!m) continue;
    const d = new Date(today);
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    if (d > now) return { name, date: d, time: t };
  }
  return null;
}

/* ================================================================
   Geri sayım (Glassmorphism Stili)
   ================================================================ */
const EventCountdown = memo(function EventCountdown({ targetDate, label, fontScale = 1.0 }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const diff = targetDate ? Math.max(0, targetDate.getTime() - now) : 0;
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={targetDate ? `${label}: ${pad(h)} saat ${pad(m)} dakika` : ''}
      style={styles.countdownRow}
    >
      <View style={styles.countdownGlassPill}>
        <Text style={[styles.countdownValue, { fontSize: Math.round(20 * fontScale) }]}>{pad(h)}</Text>
      </View>
      <Text style={[styles.countdownSep, { fontSize: Math.round(18 * fontScale) }]}>:</Text>
      <View style={styles.countdownGlassPill}>
        <Text style={[styles.countdownValue, { fontSize: Math.round(20 * fontScale) }]}>{pad(m)}</Text>
      </View>
      <Text style={[styles.countdownSep, { fontSize: Math.round(18 * fontScale) }]}>:</Text>
      <View style={styles.countdownGlassPill}>
        <Text style={[styles.countdownValue, { fontSize: Math.round(20 * fontScale) }]}>{pad(s)}</Text>
      </View>
    </View>
  );
});

/* ================================================================
   İmsakiye satırı
   ================================================================ */
const ImsakiyeRow = memo(function ImsakiyeRow({ row, theme, isOdd, fontScale = 1.0 }) {
  if (!row) return null;

  const bg = row.isToday
    ? (theme.primaryGlow || 'rgba(212,175,55,0.15)')
    : (isOdd ? theme.surface : theme.surfaceElevated);

  let dateObj = null;
  try { dateObj = parseISOLocal(row.iso); } catch {}

  const subtextColor = theme.mode === 'oled' || theme.mode === 'cyber' ? theme.text : theme.textDim;

  return (
    <View style={[styles.tableRow, { backgroundColor: bg }]}>
      <View style={styles.colDay}>
        <Text style={[styles.dayNum, { color: row.isToday ? theme.primary : theme.text, fontSize: Math.round(12.5 * fontScale) }]}>
          {row.dayNumber ?? '—'}
        </Text>
      </View>
      <View style={styles.colDate}>
        <Text style={[styles.dateText, { color: row.isToday ? theme.primary : theme.text, fontSize: Math.round(12.5 * fontScale) }]}>
          {dateObj ? formatDateShort(dateObj) : '—'}
        </Text>
        <Text style={[styles.weekdayText, { color: subtextColor, fontSize: Math.round(9.5 * fontScale) }]}>
          {dateObj ? getWeekdayShort(dateObj) : ''}
        </Text>
      </View>
      <Text style={[styles.colTime, { color: theme.text, fontSize: Math.round(12.5 * fontScale) }]}>{row.imsak ?? '—'}</Text>
      <Text style={[styles.colTime, { color: theme.text, fontSize: Math.round(12.5 * fontScale) }]}>{row.gunes ?? '—'}</Text>
      <Text style={[styles.colTime, { color: theme.text, fontSize: Math.round(12.5 * fontScale) }]}>{row.ogle ?? '—'}</Text>
      <Text style={[styles.colTime, { color: theme.text, fontSize: Math.round(12.5 * fontScale) }]}>{row.ikindi ?? '—'}</Text>
      <Text style={[styles.colTime, { color: theme.text, fontWeight: '900', fontSize: Math.round(12.5 * fontScale) }]}>
        {row.aksam ?? '—'}
      </Text>
      <Text style={[styles.colTime, { color: theme.text, fontSize: Math.round(12.5 * fontScale) }]}>{row.yatsi ?? '—'}</Text>
    </View>
  );
});

/* ================================================================
   İftar ve Sahur Duaları Bileşeni
   ================================================================ */
const RamazanDuasCard = memo(function RamazanDuasCard({ theme, fontScale = 1.0 }) {
  const [activeTab, setActiveTab] = useState('iftar');
  const borderColor = theme.mode === 'oled' || theme.mode === 'cyber' ? theme.text : theme.border;
  const subtextColor = theme.mode === 'oled' || theme.mode === 'cyber' ? theme.text : theme.textDim;

  return (
    <View style={[styles.duaCard, { backgroundColor: theme.surface, borderColor }]}>
      <View style={[styles.duaTabs, { backgroundColor: theme.surfaceElevated }]}>
        <TouchableOpacity
          style={[styles.duaTabBtn, activeTab === 'iftar' && { backgroundColor: theme.primary }]}
          onPress={() => { hapticImpact('light'); setActiveTab('iftar'); }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="food-apple-outline"
            size={16 * fontScale}
            color={activeTab === 'iftar' ? '#FFF' : subtextColor}
          />
          <Text style={[styles.duaTabText, { color: activeTab === 'iftar' ? '#FFF' : subtextColor, fontSize: Math.round(13 * fontScale) }]}>
            İftar Duası
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.duaTabBtn, activeTab === 'sahur' && { backgroundColor: theme.primary }]}
          onPress={() => { hapticImpact('light'); setActiveTab('sahur'); }}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="weather-night"
            size={16 * fontScale}
            color={activeTab === 'sahur' ? '#FFF' : subtextColor}
          />
          <Text style={[styles.duaTabText, { color: activeTab === 'sahur' ? '#FFF' : subtextColor, fontSize: Math.round(13 * fontScale) }]}>
            Sahur / Niyet
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.duaContent}>
        {activeTab === 'iftar' ? (
          <>
            <Text style={[styles.duaArabic, { color: theme.text, fontSize: Math.round(18 * fontScale), lineHeight: Math.round(30 * fontScale) }]}>
              اَللَّهُمَّ لَكَ صُمْتُ وَبِكَ آمَنتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ
            </Text>
            <Text style={[styles.duaMeaning, { color: theme.text, fontSize: Math.round(13.5 * fontScale), lineHeight: Math.round(20 * fontScale) }]}>
              "Allah'ım! Senin rızan için oruç tuttum, Sana inandım ve Senin rızkınla orucumu açtım."
            </Text>
            <Text style={[styles.duaSource, { color: subtextColor, fontSize: Math.round(11 * fontScale) }]}>
              (Ebû Dâvûd, Savm, 22)
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.duaArabic, { color: theme.text, fontSize: Math.round(18 * fontScale), lineHeight: Math.round(30 * fontScale) }]}>
              وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ
            </Text>
            <Text style={[styles.duaMeaning, { color: theme.text, fontSize: Math.round(13.5 * fontScale), lineHeight: Math.round(20 * fontScale) }]}>
              "Niyet ettim yarınki Ramazan orucuna. Allah'ım, farz kıldığın orucumu kabul buyur."
            </Text>
            <Text style={[styles.duaSource, { color: subtextColor, fontSize: Math.round(11 * fontScale) }]}>
              (Sahur niyeti ve bereket duası)
            </Text>
          </>
        )}
      </View>
    </View>
  );
});

/* ================================================================
   Ana ekran
   ================================================================ */
export default function RamazanScreen({ onBack }) {
  const getTheme = useAppStore((s) => s.getTheme);
  const location = useAppStore((s) => s.selectedLocation);
  const prayerMethod = useAppStore((s) => s.prayerMethod) ?? 13;
  const readingFontScale = useAppStore((s) => s.readingFontScale) ?? 1.0;
  const theme = getTheme();
  const insets = useSafeAreaInsets();

  const [now, setNow] = useState(() => new Date());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState(null);
  const [locationLabel, setLocationLabel] = useState(null);

  const mounted = useRef(false);
  const abortRef = useRef(null);

  const highContrastStore = useAppStore((s) => s.highContrast) ?? false;
  const highContrast = highContrastStore;
  const borderColor = highContrast ? theme.text : theme.border;
  const subtextColor = highContrast ? theme.text : theme.textDim;
  const mutedTextColor = highContrast ? theme.text : theme.textMuted;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      try { abortRef.current?.abort?.(); } catch {}
    };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const ramazan = useMemo(() => getRamazanInfo(now), [now]);
  
  // Sadece Ramazan ayındayken veya yaklaşırken (15 gün kala) veri yüklemesi tetiklenir
  const isTableActive = Boolean(ramazan && (ramazan.isActive || ramazan.daysUntilStart <= 15));

  const ramazanStartMs = ramazan?.start ? ramazan.start.getTime() : null;
  const cityKey = location?.city ?? '';
  const districtKey = location?.district ?? '';

/* ================================================================
     Veri Yükleme Kontrolü (Sadece Ramazan ayında veya yaklaşırken çalışır)
     ================================================================ */
  const load = useCallback(async (isRefresh = false) => {
    if (!isTableActive || ramazanStartMs == null) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try { abortRef.current?.abort?.(); } catch {}
    const controller = new AbortController();
    abortRef.current = controller;

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      if (typeof RamazanService.fetchRamazanImsakiye !== 'function') {
        throw new Error(
          'İmsakiye servisi yüklenemedi. ramazanService.js dosyasını kontrol edin.',
        );
      }

      const data = await RamazanService.fetchRamazanImsakiye({
        ramazanStart: new Date(ramazanStartMs),
        location: {
          city: cityKey || undefined,
          district: districtKey || undefined,
        },
        lat: location?.latitude,
        lng: location?.longitude,
        method: prayerMethod,
        signal: controller.signal,
      });

      if (!mounted.current || controller.signal.aborted) return;

      const safeRows = Array.isArray(data) ? data : [];
      setRows(safeRows);
      setSource(safeRows[0]?.source ?? null);
      setLocationLabel(
        cityKey && districtKey ? `${districtKey}, ${cityKey}` : null,
      );

      if (safeRows.length === 0) {
        setError(
          'Ramazan dönemi için imsakiye verisi bulunamadı. Daha sonra tekrar deneyin.',
        );
      }
    } catch (e) {
      if (!mounted.current || controller.signal.aborted) return;
      if (e?.code === 'ABORTED') return;

      const message =
        e?.message && e.message.length < 200
          ? e.message
          : 'İmsakiye yüklenemedi. İnternet bağlantınızı kontrol edin.';
      setError(message);
    } finally {
      if (mounted.current && !controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [
    isTableActive,
    ramazanStartMs,
    cityKey,
    districtKey,
    location?.latitude,
    location?.longitude,
    prayerMethod,
  ]);

  useEffect(() => {
    if (!isTableActive || ramazanStartMs == null) {
      setLoading(false);
      return;
    }
    load(false);
  }, [isTableActive, ramazanStartMs, cityKey, districtKey, load]);
  const todayRow = useMemo(
    () => rows.find((r) => r && r.isToday) || null,
    [rows],
  );

  const nextEvent = useMemo(
    () => getNextRamazanEvent(now, todayRow),
    [now, todayRow],
  );

  const upcomingEvents = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return RELIGIOUS_DAYS
      .map((d) => ({ ...d, dateObj: parseISOLocal(d.date) }))
      .filter((d) => d.dateObj && d.dateObj >= today)
      .sort((a, b) => a.dateObj - b.dateObj)
      .slice(0, 5)
      .map((d) => ({ ...d, daysUntil: daysBetween(today, d.dateObj) }));
  }, [now]);

  const heroAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    heroAnim.setValue(0);
    const anim = Animated.timing(heroAnim, {
      toValue: 1,
      duration: 500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    return () => { try { anim.stop(); } catch {} };
  }, [heroAnim]);

  const sourceLabel = useMemo(() => {
    if (!isTableActive) return '';
    if (source === 'diyanet' || source === 'live' || source === 'aladhan') {
      return 'Vakitler Aladhan API üzerinden hesaplanmıştır.';
    }
    if (source === 'cache') {
      return 'Vakitler güvenli önbellekten alınmıştır (çevrimdışı kayıtlı).';
    }
    return 'Vakit kaynağı yükleniyor…';
  }, [isTableActive, source]);

  const isLight = theme.mode === 'light' || theme.mode === 'sepia' || theme.mode === 'sand' || theme.mode === 'modernLight';
  const heroBg = isLight ? '#134E3A' : '#0B231E';
  const heroBorder = isLight ? '#216E53' : '#1B3D34';
  const shadowColor = isLight ? '#134E3A' : '#000000';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { hapticImpact(); onBack?.(); }}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.headerButton, { backgroundColor: theme.surface, borderColor }]}
        >
          <Ionicons name="arrow-back" size={20 * readingFontScale} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={[styles.headerTitle, { color: theme.text, fontSize: Math.round(20 * readingFontScale) }]}>
          Ramazan İmsakiyesi
        </Text>
        <View style={styles.headerButtonPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(24, insets.bottom + 24) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { hapticImpact(); load(true); }}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        {/* HERO */}
        <Animated.View style={{
          opacity: heroAnim,
          transform: [{
            translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
          }],
        }}>
          <View style={styles.heroShadowContainer}>
            <View style={[styles.hero, {
              backgroundColor: heroBg,
              borderColor: heroBorder,
              shadowColor: shadowColor,
            }]}>
              <MaterialCommunityIcons
                name="moon-waning-crescent" size={48 * readingFontScale} color="#D8C17B"
                style={styles.heroMoon}
              />

              {ramazan?.isActive ? (
                <>
                  <Text style={[styles.heroEyebrow, { fontSize: Math.round(11 * readingFontScale) }]}>RAMAZAN AYI</Text>
                  <Text style={[styles.heroDay, { fontSize: Math.round(30 * readingFontScale) }]}>{ramazan.dayNumber}. Gün</Text>
                  <Text style={[styles.heroSub, { fontSize: Math.round(13 * readingFontScale) }]}>
                    {formatDateTR(ramazan.start)} – {formatDateTR(ramazan.end)}
                  </Text>

                  {nextEvent && (
                    <View style={styles.heroEventBox}>
                      <Text style={[styles.heroEventLabel, { fontSize: Math.round(11 * readingFontScale) }]}>{nextEvent.name}'a kalan</Text>
                      <EventCountdown targetDate={nextEvent.date} label={nextEvent.name} fontScale={readingFontScale} />
                    </View>
                  )}
                </>
              ) : ramazan ? (
                <>
                  <Text style={[styles.heroEyebrow, { fontSize: Math.round(11 * readingFontScale) }]}>RAMAZAN'A KALAN</Text>
                  <Text style={[styles.heroDay, { fontSize: Math.round(30 * readingFontScale) }]}>{ramazan.daysUntilStart} gün</Text>
                  <Text style={[styles.heroSub, { fontSize: Math.round(13 * readingFontScale) }]}>
                    Başlangıç: {formatDateTR(ramazan.start)}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={[styles.heroEyebrow, { fontSize: Math.round(11 * readingFontScale) }]}>RAMAZAN</Text>
                  <Text style={[styles.heroDay, { fontSize: Math.round(30 * readingFontScale) }]}>Yaklaşıyor</Text>
                  <Text style={[styles.heroSub, { fontSize: Math.round(13 * readingFontScale) }]}>Tarih bilgisi hazırlanıyor</Text>
                </>
              )}

              {locationLabel && (
                <View style={styles.heroLocation}>
                  <Ionicons name="location-outline" size={13 * readingFontScale} color="#C5D5CC" />
                  <Text style={[styles.heroLocationText, { fontSize: Math.round(12 * readingFontScale) }]}>{locationLabel}</Text>
                </View>
              )}
            </View>
          </View>
        </Animated.View>

        {/* BUGÜN KARTI */}
        {todayRow && (
          <View style={[styles.todayCard, { backgroundColor: theme.surface, borderColor }]}>
            <View style={styles.todayHeader}>
              <View style={[styles.todayBadge, { backgroundColor: theme.primaryGlow }]}>
                <View style={[styles.todayDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.todayBadgeText, { color: theme.primary, fontSize: Math.round(10.5 * readingFontScale) }]}>BUGÜN</Text>
              </View>
              <Text style={[styles.todayDate, { color: subtextColor, fontSize: Math.round(12 * readingFontScale) }]}>
                {(() => {
                  try {
                    const d = parseISOLocal(todayRow.iso);
                    return d ? formatDateTR(d) : '';
                  } catch {
                    return '';
                  }
                })()}
              </Text>
            </View>
            <View style={styles.todayGrid}>
              {[
                ['İMSAK', todayRow.imsak, subtextColor],
                ['GÜNEŞ', todayRow.gunes, subtextColor],
                ['ÖĞLE', todayRow.ogle, subtextColor],
                ['İKİNDİ', todayRow.ikindi, subtextColor],
                ['AKŞAM', todayRow.aksam, '#E5A93C'],
                ['YATSI', todayRow.yatsi, subtextColor],
              ].map(([label, time, labelColor]) => (
                <View key={label} style={styles.todayCol}>
                  <Text style={[styles.todayLabel, { color: labelColor, fontSize: Math.round(9.5 * readingFontScale) }]}>{label}</Text>
                  <Text style={[
                    styles.todayTime,
                    { color: theme.text, fontWeight: label === 'AKŞAM' ? '900' : '700', fontSize: Math.round(14 * readingFontScale) },
                  ]}>
                    {time ?? '—'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* İFTAR VE SAHUR DUALARI */}
        <RamazanDuasCard theme={theme} fontScale={readingFontScale} />

        {/* İMSAKİYE TABLOSU */}
        {isTableActive ? (
          <>
            <View style={styles.sectionHeading}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.text, fontSize: Math.round(18 * readingFontScale) }]}>
                Aylık İmsakiye
              </Text>
              <Text style={[styles.sectionSub, { color: subtextColor, fontSize: Math.round(12 * readingFontScale) }]}>
                {rows.length > 0 ? `${rows.length} gün` : '30 gün'}
              </Text>
            </View>

            {loading && rows.length === 0 ? (
              <View style={[styles.loadingBox, { backgroundColor: theme.surface, borderColor }]}>
                <ActivityIndicator color={theme.primary} />
                <Text style={[styles.loadingText, { color: subtextColor, fontSize: Math.round(13 * readingFontScale) }]}>
                  İmsakiye verileri alınıyor…
                </Text>
              </View>
            ) : error && rows.length === 0 ? (
              <View style={[styles.errorBox, { backgroundColor: theme.surface, borderColor }]}>
                <Ionicons name="cloud-offline-outline" size={32 * readingFontScale} color={subtextColor} />
                <Text style={[styles.errorText, { color: theme.text, fontSize: Math.round(13.5 * readingFontScale) }]} numberOfLines={4}>
                  {error}
                </Text>
                <TouchableOpacity
                  onPress={() => { hapticImpact(); load(false); }}
                  style={[styles.retryBtn, { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.retryBtnText, { fontSize: Math.round(13.5 * readingFontScale) }]}>Tekrar dene</Text>
                </TouchableOpacity>
              </View>
            ) : rows.length === 0 ? (
              <View style={[styles.errorBox, { backgroundColor: theme.surface, borderColor }]}>
                <Ionicons name="calendar-outline" size={32 * readingFontScale} color={subtextColor} />
                <Text style={[styles.errorText, { color: theme.text, fontSize: Math.round(13.5 * readingFontScale) }]}>
                  İmsakiye verisi hazır değil.
                </Text>
              </View>
            ) : (
              <View style={[styles.table, { borderColor, backgroundColor: theme.surface }]}>
                <View style={[styles.tableHeader, { backgroundColor: theme.surfaceElevated }]}>
                  <Text style={[styles.tableHeaderCell, styles.colDay, { color: subtextColor, fontSize: Math.round(11 * readingFontScale) }]}>#</Text>
                  <Text style={[styles.tableHeaderCell, styles.colDate, { color: subtextColor, fontSize: Math.round(11 * readingFontScale) }]}>Tarih</Text>
                  <Text style={[styles.tableHeaderCell, styles.colTime, { color: subtextColor, fontSize: Math.round(11 * readingFontScale) }]}>İmsak</Text>
                  <Text style={[styles.tableHeaderCell, styles.colTime, { color: subtextColor, fontSize: Math.round(11 * readingFontScale) }]}>Güneş</Text>
                  <Text style={[styles.tableHeaderCell, styles.colTime, { color: subtextColor, fontSize: Math.round(11 * readingFontScale) }]}>Öğle</Text>
                  <Text style={[styles.tableHeaderCell, styles.colTime, { color: subtextColor, fontSize: Math.round(11 * readingFontScale) }]}>İkindi</Text>
                  <Text style={[styles.tableHeaderCell, styles.colTime, { color: subtextColor, fontSize: Math.round(11 * readingFontScale) }]}>Akşam</Text>
                  <Text style={[styles.tableHeaderCell, styles.colTime, { color: subtextColor, fontSize: Math.round(11 * readingFontScale) }]}>Yatsı</Text>
                </View>

                {rows.map((row, index) => (
                  <ImsakiyeRow
                    key={row?.iso ?? `row-${index}`}
                    row={row}
                    theme={theme}
                    isOdd={index % 2 === 1}
                    fontScale={readingFontScale}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={[styles.noticeBox, { backgroundColor: theme.surface, borderColor }]}>
            <View style={[styles.noticeIconWrap, { backgroundColor: theme.primaryGlow }]}>
              <MaterialCommunityIcons name="moon-waning-crescent" size={22 * readingFontScale} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.noticeTitle, { color: theme.text, fontSize: Math.round(15 * readingFontScale) }]}>
                Aylık İmsakiye
              </Text>
              <Text style={[styles.noticeText, { color: subtextColor, fontSize: Math.round(12.5 * readingFontScale) }]}>
                Ramazan ayına yaklaşırken ({ramazan ? `${ramazan.daysUntilStart} gün sonra` : 'yakında'}) otomatik olarak aktifleşecektir.
              </Text>
            </View>
          </View>
        )}

        {/* YAKLAŞAN DİNÎ GÜNLER */}
        {upcomingEvents.length > 0 && (
          <>
            <View style={[styles.sectionHeading, { marginTop: 28 }]}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: theme.text, fontSize: Math.round(18 * readingFontScale) }]}>
                Yaklaşan Günler
              </Text>
            </View>

            <View style={[styles.eventsCard, { backgroundColor: theme.surface, borderColor }]}>
              {upcomingEvents.map((ev, i) => {
                const color = getEventTypeColor(ev.type, theme);
                return (
                  <View
                    key={ev.id}
                    style={[
                      styles.eventRow,
                      i < upcomingEvents.length - 1 && {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: borderColor,
                      },
                    ]}
                  >
                    <View style={[styles.eventIcon, { backgroundColor: `${color}20` }]}>
                      <MaterialCommunityIcons
                        name={ev.type === 'bayram' ? 'party-popper' : 'star-crescent'}
                        size={18 * readingFontScale}
                        color={color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.eventName, { color: theme.text, fontSize: Math.round(15 * readingFontScale) }]}>
                        {ev.name}
                      </Text>
                      <Text style={[styles.eventDate, { color: subtextColor, fontSize: Math.round(12 * readingFontScale) }]}>
                        {ev.dateObj ? formatDateTR(ev.dateObj) : ''}
                      </Text>
                    </View>
                    <View style={[styles.eventBadge, { backgroundColor: `${color}20` }]}>
                      <Text style={[styles.eventBadgeText, { color, fontSize: Math.round(11.5 * readingFontScale) }]}>
                        {ev.daysUntil === 0 ? 'Bugün' : `${ev.daysUntil} gün`}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {sourceLabel ? (
          <Text style={[styles.footnote, { color: mutedTextColor, fontSize: Math.round(11.5 * readingFontScale) }]}>
            {sourceLabel}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: 0.2 },
  headerButton: {
    width: 48, height: 48, borderRadius: 16, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  headerButtonPlaceholder: { width: 48, height: 48 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  /* Hero */
  heroShadowContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  hero: {
    borderRadius: 28, borderWidth: 1, padding: 22,
    overflow: 'hidden', position: 'relative',
  },
  heroMoon: { position: 'absolute', top: 16, right: 18, opacity: 0.12 },
  heroEyebrow: {
    color: '#D8C17B', fontSize: 11, fontWeight: '900', letterSpacing: 1.2,
  },
  heroDay: {
    color: '#FFF9EA', fontSize: 30, fontWeight: '900',
    marginTop: 4, letterSpacing: -0.4,
  },
  heroSub: { color: '#C5D5CC', fontSize: 13, marginTop: 4, fontWeight: '600' },
  heroLocation: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 14, opacity: 0.9,
  },
  heroLocationText: { color: '#C5D5CC', fontSize: 12, fontWeight: '700' },
  heroEventBox: {
    marginTop: 16, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  heroEventLabel: {
    color: '#C5D5CC', fontSize: 11,
    fontWeight: '700', letterSpacing: 0.4, marginBottom: 8,
  },

  /* Countdown */
  countdownRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6, marginTop: 2,
  },
  countdownGlassPill: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(216,193,123,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    minWidth: 44, alignItems: 'center',
  },
  countdownValue: {
    color: '#F9F1D8', fontSize: 20, fontWeight: '900',
    fontVariant: ['tabular-nums'], letterSpacing: 0.5,
  },
  countdownSep: {
    color: '#D8C17B', fontSize: 18, fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },

  /* Today card */
  todayCard: {
    borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  todayHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  todayBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  todayDot: { width: 6, height: 6, borderRadius: 3 },
  todayBadgeText: { fontSize: 10.5, fontWeight: '900', letterSpacing: 0.6 },
  todayDate: { fontSize: 12, fontWeight: '700' },
  todayGrid: {
    flexDirection: 'row', justifyContent: 'space-between', gap: 4,
  },
  todayCol: { alignItems: 'center', flex: 1 },
  todayLabel: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.4 },
  todayTime: {
    fontSize: 14, fontWeight: '800',
    fontVariant: ['tabular-nums'], marginTop: 4,
  },

  /* Dua Card */
  duaCard: {
    borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 24,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  duaTabs: {
    flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 16,
  },
  duaTabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 9, borderRadius: 10, gap: 6,
  },
  duaTabText: {
    fontSize: 13, fontWeight: '800',
  },
  duaContent: {
    alignItems: 'center', paddingHorizontal: 4,
  },
  duaArabic: {
    fontSize: 18, fontWeight: '900', textAlign: 'center',
    lineHeight: 30, marginBottom: 12,
  },
  duaMeaning: {
    fontSize: 13.5, textAlign: 'center', lineHeight: 20, marginBottom: 8, fontStyle: 'italic', fontWeight: '500',
  },
  duaSource: {
    fontSize: 11, fontWeight: '700',
  },

  /* Notice Box */
  noticeBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 24, gap: 16,
  },
  noticeIconWrap: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  noticeTitle: { fontSize: 15, fontWeight: '900', marginBottom: 2 },
  noticeText: { fontSize: 12.5, lineHeight: 18, fontWeight: '600' },

  /* Section */
  sectionHeading: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12, marginLeft: 4,
  },
  sectionTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.2 },
  sectionSub: { fontSize: 12, fontWeight: '700' },

  /* Loading / error */
  loadingBox: {
    borderRadius: 24, borderWidth: 1, padding: 32,
    alignItems: 'center', gap: 12, marginBottom: 24,
  },
  loadingText: { fontSize: 13, fontWeight: '700' },
  errorBox: {
    borderRadius: 24, borderWidth: 1, padding: 26,
    alignItems: 'center', gap: 12, marginBottom: 24,
  },
  errorText: { fontSize: 13.5, textAlign: 'center', lineHeight: 20, fontWeight: '600' },
  retryBtn: {
    marginTop: 6, paddingHorizontal: 22, paddingVertical: 10, borderRadius: 12,
  },
  retryBtnText: { color: '#FFF', fontWeight: '900', fontSize: 13.5 },

  /* Table */
  table: {
    borderRadius: 24, borderWidth: 1, overflow: 'hidden', marginBottom: 12,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 10,
  },
  tableHeaderCell: {
    fontSize: 11, fontWeight: '900',
    letterSpacing: 0.3, textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 11, paddingHorizontal: 10,
  },
  colDay: { width: 28, alignItems: 'center' },
  colDate: { width: 66, alignItems: 'center' },
  colTime: { flex: 1, textAlign: 'center', fontSize: 12.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  dayNum: { fontSize: 12.5, fontWeight: '900' },
  dateText: { fontSize: 12.5, fontWeight: '900' },
  weekdayText: { fontSize: 9.5, fontWeight: '700', marginTop: 1 },

  /* Events */
  eventsCard: {
    borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  eventRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, gap: 14,
  },
  eventIcon: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  eventName: { fontSize: 15, fontWeight: '900' },
  eventDate: { fontSize: 12, marginTop: 3, fontWeight: '600' },
  eventBadge: {
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8,
  },
  eventBadgeText: { fontSize: 11.5, fontWeight: '900' },

  footnote: {
    fontSize: 11.5, textAlign: 'center',
    marginTop: 24, lineHeight: 18, paddingHorizontal: 20, fontWeight: '600',
  },
});