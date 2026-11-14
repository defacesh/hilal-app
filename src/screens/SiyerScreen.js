// src/screens/SiyerScreen.js
import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Share,
  Platform,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText as Text } from '../components/AppText';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { useAppFont } from '../hooks/useAppFont';
import { SIYER_INFO, SIYER_PERIODS } from '../data/siyerData';

/* ================================================================
   Güvenli modül yüklemeleri
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}

let AsyncStorage = null;
try {
  const mod = require('@react-native-async-storage/async-storage');
  AsyncStorage = mod?.default ?? mod;
} catch {}

const hapticLight = () => {
  try {
    if (useAppStore.getState().globalHaptic === false) return;
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return;
    const map = Haptics.ImpactFeedbackStyle ?? {};
    Haptics.impactAsync(map.Light);
  } catch {}
};
const hapticMedium = () => {
  try {
    if (useAppStore.getState().globalHaptic === false) return;
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return;
    const map = Haptics.ImpactFeedbackStyle ?? {};
    Haptics.impactAsync(map.Medium);
  } catch {}
};

/* ================================================================
   Sabitler
   ================================================================ */
const SIZE_OPTIONS = [
  { value: 1.0,  label: 'Normal',    preview: 14 },
  { value: 1.15, label: 'Büyük',     preview: 17 },
  { value: 1.3,  label: 'Çok büyük', preview: 21 },
];

const BESMELE = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
const SALAVAT_AR =
  'اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ';
const SALAVAT_TR =
  'Allâhümme salli ve sellim alâ Seyyidinâ Muhammedin ve alâ âlihî ve sahbihî ecmaîn.';

const PROGRESS_KEY = '@nida/siyer_progress_v1';

/* ================================================================
   Düz olay listesi
   ================================================================ */
const ALL_EVENTS = (() => {
  const flat = [];
  SIYER_PERIODS.forEach((period, pIdx) => {
    const events = period.events || [];
    events.forEach((event, eIdx) => {
      flat.push({
        period,
        event,
        chapterIdx: pIdx,
        eventIdx: eIdx,
        isFirstInChapter: eIdx === 0,
        isLastInChapter: eIdx === events.length - 1,
        isFirstOfBook: pIdx === 0 && eIdx === 0,
        isLastOfBook: pIdx === SIYER_PERIODS.length - 1 && eIdx === events.length - 1,
      });
    });
  });
  return flat;
})();

const TOTAL_EVENTS = ALL_EVENTS.length;

const eventKey = (periodId, eventId) => `${periodId}::${eventId}`;

const estimateReadMinutes = (event) => {
  const len = (event?.description || '').length;
  return Math.max(1, Math.ceil(len / 1200));
};

const findChapterStartIndex = (periodId, readEvents) => {
  const chapterEvents = ALL_EVENTS.filter((e) => e.period.id === periodId);
  if (chapterEvents.length === 0) return 0;
  for (const item of chapterEvents) {
    const key = eventKey(item.period.id, item.event.id);
    if (!readEvents[key]) return ALL_EVENTS.indexOf(item);
  }
  return ALL_EVENTS.indexOf(chapterEvents[0]);
};

const findLastPositionIndex = (lastKey) => {
  if (!lastKey) return -1;
  return ALL_EVENTS.findIndex(
    (e) => eventKey(e.period.id, e.event.id) === lastKey
  );
};

const luminance = (hex) => {
  if (typeof hex !== 'string' || hex[0] !== '#') return null;
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length < 6) return null;
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return null;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

const timeAgo = (timestamp) => {
  if (!timestamp) return null;
  const diff = Date.now() - timestamp;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Az önce';
  if (m < 60) return `${m} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} saat önce`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'Dün';
  if (d < 7) return `${d} gün önce`;
  return `${Math.floor(d / 7)} hafta önce`;
};

/* ================================================================
   Stiller Context
   ================================================================ */
const StylerContext = React.createContext(null);
const useStyler = () => React.useContext(StylerContext) || defaultStyles;

/* ================================================================
   Progress hook
   ================================================================ */
function useSiyerProgress() {
  const [state, setState] = useState({ lastKey: null, readEvents: {}, lastReadAt: 0 });
  const [loaded, setLoaded] = useState(!AsyncStorage);

  useEffect(() => {
    if (!AsyncStorage) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PROGRESS_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw);
          setState({
            lastKey: parsed?.lastKey ?? null,
            readEvents: parsed?.readEvents ?? {},
            lastReadAt: parsed?.lastReadAt ?? 0,
          });
        }
      } catch {}
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  const persist = useCallback((next) => {
    if (!AsyncStorage) return;
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const markRead = useCallback((key) => {
    setState((prev) => {
      if (prev.lastKey === key && prev.readEvents[key]) return prev;
      const next = {
        lastKey: key,
        readEvents: { ...prev.readEvents, [key]: true },
        lastReadAt: Date.now(),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetProgress = useCallback(() => {
    const next = { lastKey: null, readEvents: {}, lastReadAt: 0 };
    setState(next);
    persist(next);
  }, [persist]);

  return { progress: state, loaded, markRead, resetProgress };
}

/* ================================================================
   Küçük bileşenler
   ================================================================ */
const RubStar = memo(function RubStar({ size = 12, color, outline = false, strokeWidth = 1, style }) {
  const a = size / Math.SQRT2;
  const base = outline
    ? { borderWidth: strokeWidth, borderColor: color }
    : { backgroundColor: color };
  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <View style={[{ position: 'absolute', width: a, height: a }, base]} />
      <View style={[{ position: 'absolute', width: a, height: a, transform: [{ rotate: '45deg' }] }, base]} />
    </View>
  );
});

const Ornament = memo(function Ornament({ pal, children, style }) {
  const styles = useStyler();
  return (
    <View style={[styles.ornament, style]}>
      <View style={[styles.ornamentLine, { backgroundColor: pal.goldSoft }]} />
      {children || <RubStar size={12} color={pal.gold} />}
      <View style={[styles.ornamentLine, { backgroundColor: pal.goldSoft }]} />
    </View>
  );
});

const ProgressBar = memo(function ProgressBar({
  ratio, height = 4, trackColor, fillColor, radius = 2,
}) {
  const clamped = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ height, borderRadius: radius, overflow: 'hidden', backgroundColor: trackColor }}>
      <View style={{ height, width: `${clamped * 100}%`, backgroundColor: fillColor, borderRadius: radius }} />
    </View>
  );
});

const SizeBar = memo(function SizeBar({
  selectedValue, theme, pal, highContrast, onChange, largeTouchTargets,
}) {
  const styles = useStyler();
  return (
    <View style={[styles.sizeBar, { borderBottomColor: theme.border, backgroundColor: theme.surface }]}>
      {SIZE_OPTIONS.map((opt) => {
        const selected = Math.abs(selectedValue - opt.value) < 0.01;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={`Yazı boyutu: ${opt.label}`}
            style={[
              styles.sizeOption,
              {
                borderColor: selected ? pal.gold : theme.border,
                borderWidth: selected || highContrast ? 2 : 1,
                backgroundColor: selected ? pal.goldSoft : 'transparent',
                minHeight: largeTouchTargets ? 72 : 56,
              },
            ]}
          >
            <Text
              style={{
                fontSize: opt.preview * (largeTouchTargets ? 1.1 : 1),
                color: selected ? pal.gold : theme.text,
                fontWeight: selected ? '700' : '500',
              }}
            >
              Aa
            </Text>
            <Text style={[styles.sizeLabel, { color: selected ? pal.gold : theme.textDim }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
});

/* ================================================================
   KAPAK
   ================================================================ */
const CoverView = memo(function CoverView({
  theme, pal, bookPal, highContrast, progress, bottomInset, largeTouchTargets,
  onStart, onContinue, onToc, onExit,
}) {
  const styles = useStyler();
  const lastIndex = findLastPositionIndex(progress.lastKey);
  const hasProgress = !!progress.lastKey && lastIndex > 0;

  const totalRead = useMemo(() => Object.keys(progress.readEvents).length, [progress.readEvents]);
  const overallRatio = TOTAL_EVENTS > 0 ? totalRead / TOTAL_EVENTS : 0;

  const continueInfo = useMemo(() => {
    if (!hasProgress) return null;
    const item = ALL_EVENTS[lastIndex];
    if (!item) return null;
    return {
      period: item.period,
      event: item.event,
      eventIdx: item.eventIdx,
      chapterTotal: item.period.events.length,
    };
  }, [hasProgress, lastIndex]);

  const lastReadText = useMemo(() => timeAgo(progress.lastReadAt), [progress.lastReadAt]);
  const onPrimary = highContrast ? '#000000' : (theme.onPrimary || '#FFF');

  const iconBtnStyle = [
    styles.iconBtn,
    {
      borderColor: highContrast ? theme.text : theme.border,
      borderWidth: highContrast ? 2 : 1,
      backgroundColor: theme.surface,
      width: largeTouchTargets ? 52 : 44,
      height: largeTouchTargets ? 52 : 44,
      borderRadius: largeTouchTargets ? 26 : 22,
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={[styles.coverScroll, { paddingBottom: Math.max(40, bottomInset + 24) }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.coverTopBar}>
        {onExit ? (
          <Pressable onPress={onExit} accessibilityLabel="Geri dön" style={iconBtnStyle}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </Pressable>
        ) : (
          <View style={{ width: largeTouchTargets ? 52 : 44 }} />
        )}
        <View style={{ flex: 1 }} />
        <Pressable onPress={onToc} accessibilityLabel="İçindekiler" style={iconBtnStyle}>
          <Ionicons name="list" size={22} color={theme.text} />
        </Pressable>
      </View>

      <View style={styles.coverContent}>
        <View
          style={[
            styles.bookCover,
            {
              backgroundColor: bookPal.bg,
              borderColor: bookPal.border,
              ...Platform.select({
                web: {
                  boxShadow: `0 24px 48px ${bookPal.glow}, 0 8px 16px rgba(0,0,0,0.18)`,
                },
                default: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 14 },
                  shadowOpacity: 0.32,
                  shadowRadius: 24,
                  elevation: 14,
                },
              }),
            },
          ]}
        >
          <View style={[styles.bookSpine, { backgroundColor: bookPal.border }]} />
          <View style={styles.bookFrame}>
            <Text style={[styles.bookBesmele, { color: bookPal.text }]}>{BESMELE}</Text>
            <Ornament pal={{ gold: bookPal.accent, goldSoft: bookPal.border }} style={{ marginVertical: 20 }} />
            <Text style={[styles.bookTitle, { color: bookPal.accent }]}>
              {SIYER_INFO.title}
            </Text>
            <Text style={[styles.bookSubtitle, { color: bookPal.text }]}>
              {SIYER_INFO.subtitle}
            </Text>
            <Text style={[styles.bookAuthor, { color: bookPal.text }]}>
              HZ. MUHAMMED (S.A.V.)'İN HAYATI
            </Text>
            <Ornament pal={{ gold: bookPal.accent, goldSoft: bookPal.border }} style={{ marginTop: 20 }} />
            <Text style={[styles.bookMeta, { color: bookPal.text }]}>
              {SIYER_PERIODS.length} Bölüm · {TOTAL_EVENTS} Olay
            </Text>
          </View>
        </View>

        <View style={styles.coverDescription}>
          <Text style={[styles.coverDescText, { color: highContrast ? theme.text : theme.textDim }]}>
            {SIYER_INFO.description}
          </Text>
        </View>

        <View style={styles.coverActions}>
          {hasProgress && continueInfo ? (
            <Pressable
              onPress={onContinue}
              accessibilityRole="button"
              accessibilityLabel={`Kaldığın yerden devam et. ${continueInfo.period.title}, ${continueInfo.eventIdx + 1}. olay${lastReadText ? `. Son okuma ${lastReadText}` : ''}`}
              style={({ pressed }) => [
                styles.ctaPrimary,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.9 : 1,
                  minHeight: largeTouchTargets ? 74 : 66,
                  paddingVertical: 12,
                },
              ]}
            >
              <Ionicons name="bookmark" size={20} color={onPrimary} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={[styles.ctaPrimaryTitle, { color: onPrimary }]}
                  numberOfLines={1}
                >
                  Kaldığın yerden devam et
                </Text>
                <Text
                  style={[styles.ctaPrimarySub, { color: highContrast ? '#000000' : (onPrimary + 'CC') }]}
                  numberOfLines={1}
                >
                  {continueInfo.period.title} · Olay {continueInfo.eventIdx + 1}/{continueInfo.chapterTotal}
                </Text>
                {lastReadText ? (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    marginTop: 4,
                    alignSelf: 'flex-start',
                  }}>
                    <Ionicons name="time-outline" size={11} color={highContrast ? '#000000' : (onPrimary + 'AA')} />
                    <Text style={{
                      color: highContrast ? '#000000' : (onPrimary + 'AA'),
                      fontSize: 10.5,
                      fontWeight: '600',
                    }}>
                      Son: {lastReadText}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Ionicons name="arrow-forward" size={20} color={onPrimary} />
            </Pressable>
          ) : null}

          <Pressable
            onPress={onStart}
            accessibilityRole="button"
            accessibilityLabel={hasProgress ? 'Baştan başla' : 'Okumaya başla'}
            style={({ pressed }) => [
              hasProgress ? styles.ctaSecondary : styles.ctaPrimary,
              hasProgress
                ? {
                    borderColor: highContrast ? theme.text : theme.border,
                    borderWidth: highContrast ? 2 : 1,
                    backgroundColor: theme.surface,
                    opacity: pressed ? 0.9 : 1,
                    minHeight: largeTouchTargets ? 62 : 54,
                  }
                : {
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.9 : 1,
                    minHeight: largeTouchTargets ? 68 : 60,
                  },
            ]}
          >
            <Ionicons
              name={hasProgress ? 'refresh' : 'book'}
              size={20}
              color={hasProgress ? theme.text : onPrimary}
            />
            <Text
              style={[
                styles.ctaPrimaryTitle,
                {
                  color: hasProgress ? theme.text : onPrimary,
                  flex: 1,
                },
              ]}
            >
              {hasProgress ? 'Baştan başla' : 'Okumaya başla'}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={hasProgress ? theme.text : onPrimary}
            />
          </Pressable>

          {hasProgress ? (
            <View style={styles.coverOverallWrap}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[styles.coverOverallLabel, { color: highContrast ? theme.text : theme.textDim }]}>
                  Genel okuma
                </Text>
                <Text style={[styles.coverOverallValue, { color: pal.gold }]}>
                  {totalRead} / {TOTAL_EVENTS} · %{Math.round(overallRatio * 100)}
                </Text>
              </View>
              <ProgressBar ratio={overallRatio} height={4} trackColor={theme.border} fillColor={pal.gold} radius={2} />
            </View>
          ) : null}

          <Pressable
            onPress={onToc}
            accessibilityRole="button"
            accessibilityLabel="İçindekiler"
            style={({ pressed }) => [
              styles.ctaTertiary,
              { opacity: pressed ? 0.6 : 1, minHeight: largeTouchTargets ? 52 : 42 },
            ]}
          >
            <Ionicons name="list" size={16} color={highContrast ? theme.text : theme.textDim} />
            <Text style={[styles.ctaTertiaryText, { color: highContrast ? theme.text : theme.textDim }]}>
              İçindekiler
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
});

/* ================================================================
   İÇİNDEKİLER
   ================================================================ */
const TocView = memo(function TocView({
  theme, pal, highContrast, progress, bottomInset, largeTouchTargets,
  onChapterPress, onBack,
}) {
  const styles = useStyler();
  const totalRead = useMemo(() => Object.keys(progress.readEvents).length, [progress.readEvents]);
  const overallRatio = TOTAL_EVENTS > 0 ? totalRead / TOTAL_EVENTS : 0;
  const lastIndex = findLastPositionIndex(progress.lastKey);
  const lastPeriodId = lastIndex >= 0 ? ALL_EVENTS[lastIndex]?.period?.id : null;

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.tocTopBar}>
        <Pressable
          onPress={onBack}
          accessibilityLabel="Geri dön"
          style={[
            styles.iconBtn,
            {
              borderColor: highContrast ? theme.text : theme.border,
              borderWidth: highContrast ? 2 : 1,
              backgroundColor: theme.surface,
              width: largeTouchTargets ? 52 : 44,
              height: largeTouchTargets ? 52 : 44,
              borderRadius: largeTouchTargets ? 26 : 22,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
          <Text style={[styles.tocTitle, { color: theme.text }]}>İçindekiler</Text>
          <Text style={[styles.tocSubtitle, { color: highContrast ? theme.text : theme.textDim }]}>
            {SIYER_PERIODS.length} bölüm · {TOTAL_EVENTS} olay
          </Text>
        </View>
        <View style={{ width: largeTouchTargets ? 52 : 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.tocScroll, { paddingBottom: Math.max(32, bottomInset + 16) }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.tocProgressCard,
            {
              backgroundColor: theme.surface,
              borderColor: highContrast ? theme.text : theme.border,
              borderWidth: highContrast ? 2 : 1,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <View style={[styles.tocProgressIcon, { backgroundColor: pal.goldSoft }]}>
              <Ionicons name="bookmarks" size={18} color={pal.gold} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.tocProgressLabel, { color: highContrast ? theme.text : theme.textDim }]}>
                GENEL İLERLEME
              </Text>
              <Text style={[styles.tocProgressValue, { color: theme.text }]} numberOfLines={1}>
                {totalRead} / {TOTAL_EVENTS} olay okundu
              </Text>
            </View>
            <Text style={[styles.tocProgressPct, { color: pal.gold }]}>
              %{Math.round(overallRatio * 100)}
            </Text>
          </View>
          <ProgressBar ratio={overallRatio} height={6} trackColor={theme.border} fillColor={pal.gold} radius={3} />
        </View>

        <Text style={[styles.tocSectionLabel, { color: highContrast ? theme.text : theme.textDim }]}>BÖLÜMLER</Text>

        {SIYER_PERIODS.map((period, idx) => {
          const chapterEvents = period.events || [];
          const readCount = chapterEvents.filter(
            (e) => progress.readEvents[eventKey(period.id, e.id)]
          ).length;
          const isComplete = readCount === chapterEvents.length && chapterEvents.length > 0;
          const isCurrent = lastPeriodId === period.id;
          const ratio = chapterEvents.length > 0 ? readCount / chapterEvents.length : 0;
          const totalChapterMins = chapterEvents.reduce((s, e) => s + estimateReadMinutes(e), 0);

          return (
            <Pressable
              key={period.id}
              onPress={() => onChapterPress(period.id)}
              accessibilityRole="button"
              accessibilityLabel={`Bölüm ${idx + 1}: ${period.title}. ${readCount} / ${chapterEvents.length} olay okundu. Yaklaşık ${totalChapterMins} dakika`}
              style={({ pressed }) => [
                styles.tocChapter,
                {
                  backgroundColor: isCurrent ? pal.goldSoft : theme.surface,
                  borderColor: isCurrent ? pal.gold : (highContrast ? theme.text : theme.border),
                  borderWidth: isCurrent || highContrast ? 2 : 1,
                  opacity: pressed ? 0.85 : 1,
                  padding: largeTouchTargets ? 18 : 14,
                },
              ]}
            >
              <View
                style={[
                  styles.tocChapterNum,
                  { backgroundColor: isCurrent ? pal.gold : pal.goldSoft },
                ]}
              >
                <Text
                  style={[
                    styles.tocChapterNumText,
                    { color: isCurrent ? (highContrast ? '#000' : '#FFF') : pal.gold },
                  ]}
                >
                  {idx + 1}
                </Text>
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text
                    style={[styles.tocChapterTitle, { color: theme.text }]}
                    numberOfLines={1}
                  >
                    {period.title}
                  </Text>
                  {isComplete ? (
                    <View style={[styles.tocBadge, { backgroundColor: pal.goldSoft }]}>
                      <Ionicons name="checkmark" size={10} color={pal.gold} />
                      <Text style={[styles.tocBadgeText, { color: pal.gold }]}>Tamam</Text>
                    </View>
                  ) : isCurrent ? (
                    <View style={[styles.tocBadge, { backgroundColor: pal.gold }]}>
                      <Ionicons name="bookmark" size={9} color={highContrast ? '#000' : '#FFF'} />
                      <Text
                        style={[
                          styles.tocBadgeText,
                          { color: highContrast ? '#000' : '#FFF' },
                        ]}
                      >
                        Kaldığın yer
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <Text style={[styles.tocChapterMeta, { color: pal.gold }]}>
                    {period.dateRange}
                  </Text>
                  <Text style={[styles.tocChapterMeta, { color: highContrast ? theme.text : theme.textMuted }]}>·</Text>
                  <Text style={[styles.tocChapterMeta, { color: highContrast ? theme.text : theme.textMuted }]}>
                    {readCount} / {chapterEvents.length}
                  </Text>
                  <Text style={[styles.tocChapterMeta, { color: highContrast ? theme.text : theme.textMuted }]}>·</Text>
                  <Text style={[styles.tocChapterMeta, { color: highContrast ? theme.text : theme.textMuted }]}>
                    ~{totalChapterMins} dk
                  </Text>
                </View>
                <View style={{ marginTop: 8 }}>
                  <ProgressBar ratio={ratio} height={3} trackColor={theme.border} fillColor={pal.gold} radius={2} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={highContrast ? theme.text : theme.textDim} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

/* ================================================================
   OKUYUCU
   ================================================================ */
const ReaderView = memo(function ReaderView({
  index, theme, pal, highContrast, fontScale, readingFontScale,
  showSizeBar, onToggleSizeBar, onFontChange,
  bottomInset, largeTouchTargets,
  onPrev, onNext, onBack, onToc, onShare, onRestart,
}) {
  const styles = useStyler();
  const scrollRef = useRef(null);
  const item = ALL_EVENTS[index];
  if (!item) return null;

  const { period, event, eventIdx, chapterIdx, isFirstInChapter, isLastOfBook } = item;
  const chapterTotal = period.events.length;
  const overallProgress = (index + 1) / TOTAL_EVENTS;
  const primaryColor = highContrast ? '#000000' : (theme.onPrimary || '#FFF');
  const readMins = estimateReadMinutes(event);

  const bodySize = 17 * fontScale;
  const bodyLineHeight = Math.round(bodySize * (fontScale >= 1.3 ? 1.85 : 1.75));
  const titleSize = 26 * fontScale;
  const titleLineHeight = Math.round(titleSize * (fontScale >= 1.3 ? 1.45 : 1.35));

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
  }, [index]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.readerTopBar}>
        <Pressable
          onPress={onBack}
          accessibilityLabel="Kitap kapağına dön"
          style={[
            styles.iconBtn,
            {
              borderColor: highContrast ? theme.text : theme.border,
              borderWidth: highContrast ? 2 : 1,
              backgroundColor: theme.surface,
              width: largeTouchTargets ? 52 : 44,
              height: largeTouchTargets ? 52 : 44,
              borderRadius: largeTouchTargets ? 26 : 22,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
          <Text style={[styles.readerChapterLabel, { color: pal.gold }]} numberOfLines={1}>
            BÖLÜM {chapterIdx + 1} · {eventIdx + 1} / {chapterTotal}
          </Text>
          <Text style={[styles.readerChapterTitle, { color: theme.text }]} numberOfLines={1}>
            {period.title}
          </Text>
        </View>
        <Pressable
          onPress={onToggleSizeBar}
          accessibilityLabel="Yazı boyutunu ayarla"
          accessibilityState={{ expanded: showSizeBar }}
          style={[
            styles.iconBtn,
            {
              borderColor: showSizeBar ? pal.gold : (highContrast ? theme.text : theme.border),
              borderWidth: showSizeBar || highContrast ? 2 : 1,
              backgroundColor: showSizeBar ? pal.goldSoft : theme.surface,
              width: largeTouchTargets ? 52 : 44,
              height: largeTouchTargets ? 52 : 44,
              borderRadius: largeTouchTargets ? 26 : 22,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="format-size"
            size={20}
            color={showSizeBar ? pal.gold : theme.text}
          />
        </Pressable>
      </View>

      <View
        style={[styles.readerProgressTrack, { backgroundColor: pal.goldSoft }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: Math.round(overallProgress * 100) }}
      >
        <View
          style={[
            styles.readerProgressBar,
            { width: `${overallProgress * 100}%`, backgroundColor: pal.gold },
          ]}
        />
      </View>

      {showSizeBar ? (
        <SizeBar
          selectedValue={readingFontScale}
          theme={theme}
          pal={pal}
          highContrast={highContrast}
          onChange={onFontChange}
          largeTouchTargets={largeTouchTargets}
        />
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.readerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.readerContentInner}>
          {isFirstInChapter ? (
            <View style={styles.readerChapterMark}>
              <Text style={[styles.readerChapterMarkLabel, { color: pal.gold }]}>
                BÖLÜM {chapterIdx + 1}
              </Text>
              <Ornament pal={pal} style={{ marginVertical: 14 }} />
              <Text style={[styles.readerChapterMarkTitle, { color: theme.text }]}>
                {period.title}
              </Text>
              <Text style={[styles.readerChapterMarkRange, { color: highContrast ? theme.text : theme.textDim }]}>
                {period.dateRange}
              </Text>
            </View>
          ) : null}

          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 12,
          }}>
            <Text style={[styles.readerDate, { color: pal.gold, marginBottom: 0 }]}>
              {event.date}
            </Text>
            <Text style={{ color: highContrast ? theme.text : theme.textMuted, fontSize: 12, fontWeight: '600' }}>·</Text>
            <Ionicons name="time-outline" size={12} color={highContrast ? theme.text : theme.textMuted} />
            <Text style={{ color: highContrast ? theme.text : theme.textMuted, fontSize: 12, fontWeight: '600' }}>
              ~{readMins} dk
            </Text>
          </View>

          <Text
            accessibilityRole="header"
            style={[
              styles.readerTitle,
              {
                color: theme.text,
                fontSize: titleSize,
                lineHeight: titleLineHeight,
              },
            ]}
          >
            {event.title}
          </Text>

          <Ornament pal={pal} style={{ marginVertical: 18 }} />

          <Text
            selectable
            style={[
              styles.readerBody,
              {
                color: theme.text,
                fontSize: bodySize,
                lineHeight: bodyLineHeight,
              },
            ]}
          >
            {event.description}
          </Text>

          <View style={styles.readerActions}>
            <Pressable
              onPress={() => onShare(event)}
              accessibilityLabel={`${event.title} olayını paylaş`}
              style={({ pressed }) => [
                styles.readerShareBtn,
                {
                  borderColor: highContrast ? theme.text : theme.border,
                  borderWidth: highContrast ? 2 : 1,
                  opacity: pressed ? 0.6 : 1,
                  minHeight: largeTouchTargets ? 48 : 36,
                  paddingHorizontal: largeTouchTargets ? 16 : 12,
                },
              ]}
            >
              <Ionicons name="share-outline" size={16} color={highContrast ? theme.text : theme.textDim} />
              <Text style={[styles.readerShareText, { color: highContrast ? theme.text : theme.textDim }]}>Paylaş</Text>
            </Pressable>
          </View>

          {isLastOfBook ? (
            <View style={styles.readerEndBlock}>
              <Ornament pal={pal} style={{ marginVertical: 26 }} />
              <Text style={[styles.readerEndTitle, { color: pal.gold }]}>— SON —</Text>
              <Text style={[styles.readerEndAr, { color: pal.gold }]}>{SALAVAT_AR}</Text>
              <Text
                style={[
                  styles.readerEndTr,
                  {
                    color: highContrast ? theme.text : theme.textDim,
                    fontSize: 14 * fontScale,
                    lineHeight: Math.round(14 * fontScale * 1.7),
                  },
                ]}
              >
                {SALAVAT_TR}
              </Text>
              <Pressable
                onPress={onRestart}
                accessibilityRole="button"
                accessibilityLabel="Baştan başla"
                style={({ pressed }) => [
                  styles.readerRestartBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed ? 0.9 : 1,
                    minHeight: largeTouchTargets ? 58 : 50,
                  },
                ]}
              >
                <Ionicons name="refresh" size={18} color={primaryColor} />
                <Text style={[styles.readerRestartText, { color: primaryColor }]}>
                  Baştan başla
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View
        style={[
          styles.readerBottomBar,
          {
            borderTopColor: highContrast ? theme.text : theme.border,
            borderTopWidth: highContrast ? 2 : StyleSheet.hairlineWidth,
            backgroundColor: theme.surface,
            paddingBottom: Math.max(12, bottomInset + 4),
          },
        ]}
      >
        <Pressable
          onPress={onPrev}
          disabled={index === 0}
          accessibilityLabel="Önceki olay"
          style={({ pressed }) => [
            styles.readerNavBtn,
            {
              backgroundColor: index === 0 ? 'transparent' : pal.goldSoft,
              borderColor: index > 0 && highContrast ? pal.gold : 'transparent',
              borderWidth: index > 0 && highContrast ? 1.5 : 0,
              opacity: index === 0 ? 0.35 : (pressed ? 0.7 : 1),
              minHeight: largeTouchTargets ? 56 : 46,
            },
          ]}
        >
          <Ionicons name="chevron-back" size={20} color={pal.gold} />
          <Text style={[styles.readerNavText, { color: pal.gold }]}>Önceki</Text>
        </Pressable>

        <Pressable
          onPress={onToc}
          accessibilityLabel="İçindekiler"
          style={({ pressed }) => [
            styles.readerTocBtn,
            {
              borderColor: highContrast ? theme.text : theme.border,
              borderWidth: highContrast ? 2 : 1,
              opacity: pressed ? 0.6 : 1,
              width: largeTouchTargets ? 56 : 46,
              height: largeTouchTargets ? 56 : 46,
            },
          ]}
        >
          <Ionicons name="list" size={18} color={highContrast ? theme.text : theme.textDim} />
        </Pressable>

        <Pressable
          onPress={onNext}
          disabled={index === TOTAL_EVENTS - 1}
          accessibilityLabel="Sonraki olay"
          style={({ pressed }) => [
            styles.readerNavBtn,
            {
              backgroundColor: index === TOTAL_EVENTS - 1 ? 'transparent' : pal.goldSoft,
              borderColor: index < TOTAL_EVENTS - 1 && highContrast ? pal.gold : 'transparent',
              borderWidth: index < TOTAL_EVENTS - 1 && highContrast ? 1.5 : 0,
              opacity: index === TOTAL_EVENTS - 1 ? 0.35 : (pressed ? 0.7 : 1),
              minHeight: largeTouchTargets ? 56 : 46,
            },
          ]}
        >
          <Text style={[styles.readerNavText, { color: pal.gold }]}>Sonraki</Text>
          <Ionicons name="chevron-forward" size={20} color={pal.gold} />
        </Pressable>
      </View>
    </View>
  );
});

/* ================================================================
   ANA EKRAN
   ================================================================ */
export default function SiyerScreen({ onBack }) {
  const getTheme = useAppStore((s) => s.getTheme);
  const highContrast = useAppStore((s) => s.highContrast) ?? false;
  const largeTouchTargets = useAppStore((s) => s.largeTouchTargets) ?? false;
  const readingFontScale = useAppStore((s) => s.readingFontScale) ?? 1.0;
  const setReadingFontScale = useAppStore((s) => s.setReadingFontScale);
  const themeModeSel = useAppStore((s) => s.themeMode);
  const accentSel = useAppStore((s) => s.accentColor);

  const appFont = useAppFont();
  const insets = useSafeAreaInsets();

  const rawTheme = useMemo(
    () => getTheme(),
    [getTheme, themeModeSel, accentSel, highContrast]
  );
  const theme = useMemo(() => {
    if (!highContrast) return rawTheme;
    return {
      ...rawTheme,
      background: '#000000',
      surface: '#121212',
      surfaceElevated: '#1E1E1E',
      text: '#FFFFFF',
      textDim: '#E0E0E0',
      textMuted: '#BDBDBD',
      border: '#FFFFFF',
      primary: '#FFFF00',
      primaryGlow: 'rgba(255, 255, 0, 0.3)',
      onPrimary: '#000000',
    };
  }, [rawTheme, highContrast]);

  // ✅ Varsayılan sistem fontu (disleksi açıksa AppText otomatik OpenDyslexic uygular)
  const styles = useMemo(
    () => makeStyles(appFont, largeTouchTargets),
    [appFont, largeTouchTargets]
  );

  const [view, setView] = useState('cover');
  const [readerIndex, setReaderIndex] = useState(0);
  const [showSizeBar, setShowSizeBar] = useState(false);

  const { progress, loaded, markRead, resetProgress } = useSiyerProgress();

  const fontScale = readingFontScale;

  const pal = useMemo(() => {
    const lum = luminance(theme.background);
    const dark = lum !== null && lum < 0.5;
    return {
      dark,
      gold: highContrast ? '#FFD400' : dark ? '#D9B66F' : '#8A6726',
      goldSoft: highContrast
        ? 'rgba(255,212,0,0.3)'
        : dark
        ? 'rgba(217,182,111,0.25)'
        : 'rgba(138,103,38,0.18)',
    };
  }, [theme.background, highContrast]);

  const bookPal = useMemo(
    () => ({
      bg: highContrast ? '#000000' : pal.dark ? '#1A1410' : '#F4EBD9',
      border: highContrast
        ? '#FFD400'
        : pal.dark
        ? 'rgba(217,182,111,0.4)'
        : 'rgba(138,103,38,0.4)',
      text: highContrast ? '#FFD400' : pal.dark ? '#E8D9B8' : '#3D2E1A',
      accent: highContrast ? '#FFD400' : pal.dark ? '#D9B66F' : '#8A6726',
      glow: highContrast
        ? 'rgba(255,212,0,0.2)'
        : pal.dark
        ? 'rgba(217,182,111,0.15)'
        : 'rgba(138,103,38,0.10)',
    }),
    [pal, highContrast]
  );

  useEffect(() => {
    if (view !== 'reader') return;
    const item = ALL_EVENTS[readerIndex];
    if (!item) return;
    markRead(eventKey(item.period.id, item.event.id));
  }, [view, readerIndex, markRead]);

  useEffect(() => {
    if (Platform.OS === 'web') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'reader') { setView('cover'); return true; }
      if (view === 'toc') { setView('cover'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [view]);

  const handleStart = useCallback(() => {
    hapticMedium();
    resetProgress();
    setReaderIndex(0);
    setView('reader');
  }, [resetProgress]);

  const handleContinue = useCallback(() => {
    hapticMedium();
    const idx = findLastPositionIndex(progress.lastKey);
    setReaderIndex(idx >= 0 ? idx : 0);
    setView('reader');
  }, [progress.lastKey]);

  const handleChapterPress = useCallback((periodId) => {
    hapticMedium();
    setReaderIndex(findChapterStartIndex(periodId, progress.readEvents));
    setView('reader');
  }, [progress.readEvents]);

  const handlePrev = useCallback(() => {
    if (readerIndex <= 0) return;
    hapticLight();
    setReaderIndex((i) => Math.max(0, i - 1));
  }, [readerIndex]);

  const handleNext = useCallback(() => {
    if (readerIndex >= TOTAL_EVENTS - 1) return;
    hapticLight();
    setReaderIndex((i) => Math.min(TOTAL_EVENTS - 1, i + 1));
  }, [readerIndex]);

  const handleRestart = useCallback(() => {
    hapticMedium();
    resetProgress();
    setReaderIndex(0);
  }, [resetProgress]);

  const handleReaderBack = useCallback(() => {
    hapticLight();
    setView('cover');
  }, []);

  const handleReaderToc = useCallback(() => {
    hapticLight();
    setView('toc');
  }, []);

  const handleTocBack = useCallback(() => {
    hapticLight();
    setView('cover');
  }, []);

  const handleCoverExit = useCallback(() => {
    hapticLight();
    onBack?.();
  }, [onBack]);

  const handleShareEvent = useCallback(async (event) => {
    hapticLight();
    try {
      const message = `${event.title} (${event.date})\n\n${event.description}\n\n— Siyer-i Nebi (Hz. Muhammed s.a.v'in Hayatı)`;
      await Share.share({ message });
    } catch {}
  }, []);

  const toggleSizeBar = useCallback(() => {
    hapticLight();
    setShowSizeBar((v) => !v);
  }, []);

  const handleFontChange = useCallback((value) => {
    hapticLight();
    setReadingFontScale(value);
  }, [setReadingFontScale]);

  return (
    <StylerContext.Provider value={styles}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top', 'left', 'right']}
      >
        {!loaded ? (
          <View style={styles.loadingView}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : view === 'cover' ? (
          <CoverView
            theme={theme}
            pal={pal}
            bookPal={bookPal}
            highContrast={highContrast}
            progress={progress}
            bottomInset={insets.bottom}
            largeTouchTargets={largeTouchTargets}
            onStart={handleStart}
            onContinue={handleContinue}
            onToc={handleReaderToc}
            onExit={onBack ? handleCoverExit : undefined}
          />
        ) : view === 'toc' ? (
          <TocView
            theme={theme}
            pal={pal}
            highContrast={highContrast}
            progress={progress}
            bottomInset={insets.bottom}
            largeTouchTargets={largeTouchTargets}
            onChapterPress={handleChapterPress}
            onBack={handleTocBack}
          />
        ) : (
          <ReaderView
            index={readerIndex}
            theme={theme}
            pal={pal}
            highContrast={highContrast}
            fontScale={fontScale}
            readingFontScale={readingFontScale}
            showSizeBar={showSizeBar}
            onToggleSizeBar={toggleSizeBar}
            onFontChange={handleFontChange}
            bottomInset={insets.bottom}
            largeTouchTargets={largeTouchTargets}
            onPrev={handlePrev}
            onNext={handleNext}
            onBack={handleReaderBack}
            onToc={handleReaderToc}
            onShare={handleShareEvent}
            onRestart={handleRestart}
          />
        )}
      </SafeAreaView>
    </StylerContext.Provider>
  );
}

/* ================================================================
   Stil fabrikası
   ================================================================ */
const defaultStyles = StyleSheet.create({
  container: { flex: 1 },
  loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { alignItems: 'center', justifyContent: 'center' },
  ornament: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch' },
  ornamentLine: { flex: 1, height: 1 },
});

function makeStyles(fonts, largeTouchTargets) {
  const touchBase = largeTouchTargets ? 52 : 44;
  const navHeight = largeTouchTargets ? 56 : 46;

  return StyleSheet.create({
    container: { flex: 1 },
    loadingView: { flex: 1, alignItems: 'center', justifyContent: 'center' },

    iconBtn: {
      width: touchBase,
      height: touchBase,
      borderRadius: touchBase / 2,
      borderWidth: StyleSheet.hairlineWidth * 2,
      alignItems: 'center',
      justifyContent: 'center',
    },

    ornament: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch' },
    ornamentLine: { flex: 1, height: 1 },

    /* ===== KAPAK ===== */
    coverScroll: { paddingBottom: 40 },
    coverTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 12,
      gap: 8,
    },
    coverContent: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 12 },

    bookCover: {
      width: '100%',
      maxWidth: 380,
      aspectRatio: 0.72,
      borderRadius: 10,
      borderWidth: 2,
      position: 'relative',
      overflow: 'hidden',
      marginTop: 8,
    },
    bookSpine: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      width: 8,
      opacity: 0.55,
      borderRightWidth: StyleSheet.hairlineWidth,
    },
    bookFrame: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },

    bookBesmele: {
      fontSize: 18,
      lineHeight: 32,
      textAlign: 'center',
      writingDirection: 'rtl',
    },

    bookTitle: {
      fontFamily: fonts.bold,
      fontSize: 38,
      lineHeight: 46,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    bookSubtitle: {
      fontFamily: fonts.italic,
      fontSize: 15,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 4,
      opacity: 0.85,
    },
    bookAuthor: {
      fontFamily: fonts.medium,
      fontSize: 10.5,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 2,
      textAlign: 'center',
      marginTop: 22,
      opacity: 0.7,
    },
    bookMeta: {
      fontFamily: fonts.bold,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textAlign: 'center',
      marginTop: 18,
      opacity: 0.75,
    },

    coverDescription: { marginTop: 26, maxWidth: 480, paddingHorizontal: 8 },
    coverDescText: {
      fontFamily: fonts.regular,
      fontSize: 14.5,
      lineHeight: 23,
      textAlign: 'center',
    },

    coverActions: { marginTop: 28, width: '100%', maxWidth: 420, gap: 10 },
    ctaPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      borderRadius: 18,
    },
    ctaPrimaryTitle: {
      fontFamily: fonts.bold,
      fontSize: 15.5,
      fontWeight: '700',
    },
    ctaPrimarySub: {
      fontFamily: fonts.regular,
      fontSize: 12,
      marginTop: 2,
      fontWeight: '500',
    },
    ctaSecondary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 20,
      borderRadius: 16,
      borderWidth: 1,
    },
    ctaTertiary: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 4,
    },
    ctaTertiaryText: {
      fontFamily: fonts.medium,
      fontSize: 13.5,
      fontWeight: '600',
    },

    coverOverallWrap: { marginTop: 6, padding: 14, borderRadius: 14 },
    coverOverallLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
    },
    coverOverallValue: {
      fontFamily: fonts.bold,
      fontSize: 12,
      fontWeight: '800',
    },

    /* ===== İÇİNDEKİLER ===== */
    tocTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 14,
      gap: 8,
    },
    tocTitle: {
      fontFamily: fonts.bold,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
    },
    tocSubtitle: {
      fontFamily: fonts.regular,
      fontSize: 11,
      marginTop: 2,
      textAlign: 'center',
    },
    tocScroll: { paddingHorizontal: 20, paddingBottom: 40 },
    tocProgressCard: { padding: 16, borderRadius: 16, marginBottom: 20, marginTop: 4 },
    tocProgressIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tocProgressLabel: {
      fontFamily: fonts.medium,
      fontSize: 10.5,
      fontWeight: '700',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    tocProgressValue: {
      fontFamily: fonts.bold,
      fontSize: 15,
      fontWeight: '700',
      marginTop: 3,
    },
    tocProgressPct: {
      fontFamily: fonts.bold,
      fontSize: 20,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    tocSectionLabel: {
      fontFamily: fonts.bold,
      fontSize: 10.5,
      fontWeight: '800',
      letterSpacing: 1.5,
      marginBottom: 10,
      marginLeft: 4,
    },
    tocChapter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      borderRadius: 16,
      marginBottom: 10,
    },
    tocChapterNum: {
      width: 42,
      height: 42,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tocChapterNumText: {
      fontFamily: fonts.bold,
      fontSize: 20,
      fontWeight: '800',
    },
    tocChapterTitle: {
      fontFamily: fonts.bold,
      fontSize: 16.5,
      fontWeight: '700',
      flexShrink: 1,
    },
    tocChapterMeta: {
      fontFamily: fonts.medium,
      fontSize: 11.5,
      fontWeight: '600',
    },
    tocBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    tocBadgeText: {
      fontFamily: fonts.bold,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.2,
    },

    /* ===== OKUYUCU ===== */
    readerTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 10,
      gap: 8,
    },
    readerChapterLabel: {
      fontFamily: fonts.bold,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.2,
      textAlign: 'center',
    },
    readerChapterTitle: {
      fontFamily: fonts.bold,
      fontSize: 15,
      fontWeight: '700',
      marginTop: 2,
      textAlign: 'center',
    },
    readerProgressTrack: { height: 2, overflow: 'hidden' },
    readerProgressBar: { height: 2 },

    readerContent: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 40,
      alignItems: 'center',
    },
    readerContentInner: { width: '100%', maxWidth: 640 },

    readerChapterMark: { alignItems: 'center', marginBottom: 28, paddingBottom: 20 },
    readerChapterMarkLabel: {
      fontFamily: fonts.bold,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    readerChapterMarkTitle: {
      fontFamily: fonts.bold,
      fontSize: 26,
      fontWeight: '700',
      textAlign: 'center',
      lineHeight: 34,
    },
    readerChapterMarkRange: {
      fontFamily: fonts.medium,
      fontSize: 13,
      fontWeight: '600',
      marginTop: 6,
    },

    readerDate: {
      fontFamily: fonts.bold,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.5,
      textAlign: 'center',
      marginBottom: 12,
    },
    readerTitle: {
      fontFamily: fonts.bold,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: -0.3,
    },
    readerBody: {
      fontFamily: fonts.regular,
      fontWeight: '400',
      textAlign: 'left',
      letterSpacing: 0.1,
    },

    readerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 24,
    },
    readerShareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
    },
    readerShareText: {
      fontFamily: fonts.medium,
      fontSize: 13,
      fontWeight: '600',
    },

    readerEndBlock: { marginTop: 24, alignItems: 'center' },
    readerEndTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 4,
      marginVertical: 16,
    },

    readerEndAr: {
      fontSize: 20,
      lineHeight: 36,
      textAlign: 'center',
      writingDirection: 'rtl',
      marginTop: 8,
    },

    readerEndTr: {
      fontFamily: fonts.italic,
      fontStyle: 'italic',
      textAlign: 'center',
      marginTop: 12,
    },
    readerRestartBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 24,
      borderRadius: 22,
      marginTop: 28,
    },
    readerRestartText: {
      fontFamily: fonts.bold,
      fontSize: 14.5,
      fontWeight: '700',
    },

    sizeBar: {
      flexDirection: 'row',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sizeOption: {
      flex: 1,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },
    sizeLabel: {
      fontFamily: fonts.medium,
      fontSize: 11,
      fontWeight: '600',
    },

    readerBottomBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    readerNavBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      borderRadius: 12,
      minHeight: navHeight,
    },
    readerNavText: {
      fontFamily: fonts.bold,
      fontSize: 14,
      fontWeight: '700',
    },
    readerTocBtn: {
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}