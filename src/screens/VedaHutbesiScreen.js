// src/screens/VedaHutbesiScreen.js
import React, {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  memo,
} from 'react';
import {
  Alert,
  Linking,
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
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { useAppFont } from '../hooks/useAppFont';
import {
  PEYGAMBERIMIZI_ANMA,
  VEDA_HUTBESI_INFO,
  VEDA_HUTBESI_REFERENCES,
  VEDA_HUTBESI_TEXT,
  VEDA_HUTBESI_THEMES,
} from '../data/vedaHutbesiData';

/* ================================================================
   Güvenli modül yüklemeleri
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}

let Clipboard = null;
try { Clipboard = require('expo-clipboard'); } catch {}

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

const PROGRESS_KEY = '@nida/veda_hutbesi_progress_v1';

const TOTAL_SECTIONS = VEDA_HUTBESI_TEXT.length;

const safeLower = (value) =>
  String(value ?? '').toLocaleLowerCase('tr-TR');

const estimateReadMinutes = (section) => {
  const len = (section?.content || '').length + (section?.keyMessage || '').length;
  return Math.max(1, Math.ceil(len / 1200));
};

const findSectionIndex = (sectionId) => {
  if (!sectionId) return -1;
  return VEDA_HUTBESI_TEXT.findIndex((s) => s.id === sectionId);
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

const sectionShareText = (section) =>
  `${section.title}\n\n${section.content}\n\nHatırda Kalsın: ${section.keyMessage}\n\n— Veda Hutbesi (NİDA)`;

/* ================================================================
   Stiller Context
   ================================================================ */
const StylerContext = React.createContext(null);
const useStyler = () => React.useContext(StylerContext) || defaultStyles;

/* ================================================================
   Progress hook
   ================================================================ */
function useHutbeProgress() {
  const [state, setState] = useState({ lastId: null, readSections: {}, lastReadAt: 0 });
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
            lastId: parsed?.lastId ?? null,
            readSections: parsed?.readSections ?? {},
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

  const markRead = useCallback((id) => {
    setState((prev) => {
      if (prev.lastId === id && prev.readSections[id]) return prev;
      const next = {
        lastId: id,
        readSections: { ...prev.readSections, [id]: true },
        lastReadAt: Date.now(),
      };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetProgress = useCallback(() => {
    const next = { lastId: null, readSections: {}, lastReadAt: 0 };
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
   KAPAK (CoverView)
   ================================================================ */
const CoverView = memo(function CoverView({
  theme, pal, bookPal, highContrast, isSimpleMode, progress, bottomInset, largeTouchTargets,
  onStart, onContinue, onToc, onShareAll, onExit,
}) {
  const styles = useStyler();
  const lastIndex = findSectionIndex(progress.lastId);
  const hasProgress = !!progress.lastId && lastIndex > 0;

  const totalRead = useMemo(() => Object.keys(progress.readSections).length, [progress.readSections]);
  const overallRatio = TOTAL_SECTIONS > 0 ? totalRead / TOTAL_SECTIONS : 0;

  const continueInfo = useMemo(() => {
    if (!hasProgress) return null;
    const section = VEDA_HUTBESI_TEXT[lastIndex];
    if (!section) return null;
    return {
      section,
      index: lastIndex,
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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={onShareAll}
            accessibilityLabel="Veda Hutbesi metninin tamamını paylaş"
            style={iconBtnStyle}
          >
            <Ionicons name="share-outline" size={20} color={theme.text} />
          </Pressable>
          <Pressable onPress={onToc} accessibilityLabel="İçindekiler ve ilkeler" style={iconBtnStyle}>
            <Ionicons name="list" size={22} color={theme.text} />
          </Pressable>
        </View>
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
            <Ornament pal={{ gold: bookPal.accent, goldSoft: bookPal.border }} style={{ marginVertical: 18 }} />
            <Text style={[styles.bookTitle, { color: bookPal.accent }]}>
              {VEDA_HUTBESI_INFO.title}
            </Text>
            <Text style={[styles.bookSubtitle, { color: bookPal.text }]}>
              Son Nasihatler, Kalıcı İlkeler
            </Text>
            <Text style={[styles.bookAuthor, { color: bookPal.text }]}>
              {VEDA_HUTBESI_INFO.date} · {VEDA_HUTBESI_INFO.location}
            </Text>
            <Ornament pal={{ gold: bookPal.accent, goldSoft: bookPal.border }} style={{ marginTop: 18 }} />
            <Text style={[styles.bookMeta, { color: bookPal.text }]}>
              {TOTAL_SECTIONS} Başlık · {VEDA_HUTBESI_THEMES.length} Temel İlke
            </Text>
          </View>
        </View>

        <View style={styles.coverDescription}>
          <Text style={[styles.coverDescText, { color: highContrast ? theme.text : theme.textDim }]}>
            {VEDA_HUTBESI_INFO.description}
          </Text>

          {!isSimpleMode && VEDA_HUTBESI_INFO.editorialNote ? (
            <View
              style={[
                styles.editorialNoteCard,
                {
                  backgroundColor: pal.goldSoft,
                  borderLeftColor: pal.gold,
                },
              ]}
            >
              <Ionicons name="information-circle-outline" size={16} color={pal.gold} />
              <Text style={[styles.editorialNoteText, { color: theme.text }]}>
                {VEDA_HUTBESI_INFO.editorialNote}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.coverActions}>
          {hasProgress && continueInfo ? (
            <Pressable
              onPress={onContinue}
              accessibilityRole="button"
              accessibilityLabel={`Kaldığın yerden devam et. ${continueInfo.section.title}, ${continueInfo.index + 1}. başlık${lastReadText ? `. Son okuma ${lastReadText}` : ''}`}
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
                  {continueInfo.section.title} · {continueInfo.index + 1}/{TOTAL_SECTIONS}
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
                  {totalRead} / {TOTAL_SECTIONS} · %{Math.round(overallRatio * 100)}
                </Text>
              </View>
              <ProgressBar ratio={overallRatio} height={4} trackColor={theme.border} fillColor={pal.gold} radius={2} />
            </View>
          ) : null}

          <Pressable
            onPress={onToc}
            accessibilityRole="button"
            accessibilityLabel="İçindekiler ve temel ilkeler"
            style={({ pressed }) => [
              styles.ctaTertiary,
              { opacity: pressed ? 0.6 : 1, minHeight: largeTouchTargets ? 52 : 42 },
            ]}
          >
            <Ionicons name="list" size={16} color={highContrast ? theme.text : theme.textDim} />
            <Text style={[styles.ctaTertiaryText, { color: highContrast ? theme.text : theme.textDim }]}>
              İçindekiler ve İlkeler
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
});

/* ================================================================
   İÇİNDEKİLER & İLKELER (TocView)
   ================================================================ */
const TocView = memo(function TocView({
  theme, pal, highContrast, isSimpleMode, progress, bottomInset, largeTouchTargets,
  onSectionPress, onOpenReference, onBack,
}) {
  const styles = useStyler();
  const [searchText, setSearchText] = useState('');

  const totalRead = useMemo(() => Object.keys(progress.readSections).length, [progress.readSections]);
  const overallRatio = TOTAL_SECTIONS > 0 ? totalRead / TOTAL_SECTIONS : 0;

  const filteredSections = useMemo(() => {
    const query = safeLower(searchText.trim());
    if (!query) return VEDA_HUTBESI_TEXT;
    return VEDA_HUTBESI_TEXT.filter((section) => {
      const searchable = [
        section.title,
        section.category,
        section.content,
        section.keyMessage,
        ...(section.keywords || []),
      ]
        .map(safeLower)
        .join(' ');
      return searchable.includes(query);
    });
  }, [searchText]);

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
            {TOTAL_SECTIONS} başlık · {VEDA_HUTBESI_THEMES.length} ilke
          </Text>
        </View>
        <View style={{ width: largeTouchTargets ? 52 : 44 }} />
      </View>

      <View
        style={[
          styles.searchBox,
          {
            minHeight: largeTouchTargets ? 54 : 46,
            backgroundColor: theme.surface,
            borderColor: highContrast ? theme.text : theme.border,
            borderWidth: highContrast ? 2 : 1,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={highContrast ? theme.text : theme.textDim} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Hutbede ara: adalet, emanet, kardeşlik..."
          placeholderTextColor={theme.textDim}
          selectionColor={pal.gold}
          returnKeyType="search"
          accessibilityLabel="Veda Hutbesi içinde ara"
          style={[styles.searchInput, { color: theme.text }]}
        />
        {searchText.length > 0 && (
          <Pressable
            onPress={() => setSearchText('')}
            accessibilityLabel="Aramayı temizle"
            style={{ padding: 4 }}
          >
            <Ionicons name="close-circle" size={19} color={highContrast ? theme.text : theme.textDim} />
          </Pressable>
        )}
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.tocScroll, { paddingBottom: Math.max(32, bottomInset + 16) }]}
        showsVerticalScrollIndicator={false}
      >
        {!searchText.trim() && (
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
                  {totalRead} / {TOTAL_SECTIONS} başlık okundu
                </Text>
              </View>
              <Text style={[styles.tocProgressPct, { color: pal.gold }]}>
                %{Math.round(overallRatio * 100)}
              </Text>
            </View>
            <ProgressBar ratio={overallRatio} height={6} trackColor={theme.border} fillColor={pal.gold} radius={3} />
          </View>
        )}

        <Text style={[styles.tocSectionLabel, { color: highContrast ? theme.text : theme.textDim }]}>
          {searchText.trim() ? `ARAMA SONUÇLARI (${filteredSections.length})` : 'HUTBENİN MESAJLARI'}
        </Text>

        {filteredSections.length === 0 ? (
          <View
            style={[
              styles.emptyState,
              {
                backgroundColor: theme.surface,
                borderColor: highContrast ? theme.text : theme.border,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
          >
            <Ionicons name="search-outline" size={28} color={highContrast ? theme.text : theme.textDim} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
              Eşleşen başlık bulunamadı
            </Text>
            <Text style={[styles.emptyDesc, { color: highContrast ? theme.text : theme.textDim }]}>
              Farklı bir kelime deneyebilir veya aramayı temizleyebilirsin.
            </Text>
          </View>
        ) : (
          filteredSections.map((section) => {
            const originalIdx = VEDA_HUTBESI_TEXT.findIndex((s) => s.id === section.id);
            const isRead = Boolean(progress.readSections[section.id]);
            const isCurrent = progress.lastId === section.id;
            const mins = estimateReadMinutes(section);

            return (
              <Pressable
                key={section.id}
                onPress={() => onSectionPress(originalIdx)}
                accessibilityRole="button"
                accessibilityLabel={`Başlık ${originalIdx + 1}: ${section.title}. Yaklaşık ${mins} dakika`}
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
                    {String(originalIdx + 1).padStart(2, '0')}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={[styles.tocChapterTitle, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {section.title}
                    </Text>
                    {isCurrent ? (
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
                    ) : isRead ? (
                      <View style={[styles.tocBadge, { backgroundColor: pal.goldSoft }]}>
                        <Ionicons name="checkmark" size={10} color={pal.gold} />
                        <Text style={[styles.tocBadgeText, { color: pal.gold }]}>Okundu</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                    <Text style={[styles.tocChapterMeta, { color: pal.gold }]}>
                      {section.category}
                    </Text>
                    <Text style={[styles.tocChapterMeta, { color: highContrast ? theme.text : theme.textMuted }]}>·</Text>
                    <Text style={[styles.tocChapterMeta, { color: highContrast ? theme.text : theme.textMuted }]}>
                      ~{mins} dk
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={highContrast ? theme.text : theme.textDim} />
              </Pressable>
            );
          })
        )}

        {!isSimpleMode && !searchText.trim() && (
          <View style={{ marginTop: 18 }}>
            <Text style={[styles.tocSectionLabel, { color: highContrast ? theme.text : theme.textDim }]}>
              HUTBENİN ANA İLKELERİ
            </Text>
            <View style={styles.themeGrid}>
              {VEDA_HUTBESI_THEMES.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.themeCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: highContrast ? theme.text : theme.border,
                      borderWidth: highContrast ? 2 : 1,
                    },
                  ]}
                >
                  <View style={[styles.themeIcon, { backgroundColor: pal.goldSoft }]}>
                    <Ionicons name={item.icon} size={18} color={pal.gold} />
                  </View>
                  <Text style={[styles.themeTitle, { color: theme.text }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.themeDescription, { color: highContrast ? theme.text : theme.textDim }]}>
                    {item.description}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {!searchText.trim() && (
          <View style={{ marginTop: 22 }}>
            <Text style={[styles.tocSectionLabel, { color: highContrast ? theme.text : theme.textDim }]}>
              KAYNAK VE OKUMA NOTU
            </Text>
            <View
              style={[
                styles.referencesCard,
                {
                  backgroundColor: theme.surface,
                  borderColor: highContrast ? theme.text : theme.border,
                  borderWidth: highContrast ? 2 : 1,
                },
              ]}
            >
              {VEDA_HUTBESI_REFERENCES.map((reference, index) => {
                const canOpen = Boolean(reference.url);
                return (
                  <Pressable
                    key={reference.id}
                    disabled={!canOpen}
                    onPress={() => onOpenReference(reference)}
                    accessibilityRole={canOpen ? 'link' : 'text'}
                    accessibilityLabel={canOpen ? `${reference.title} kaynağını aç` : reference.title}
                    style={({ pressed }) => [
                      styles.referenceRow,
                      index < VEDA_HUTBESI_REFERENCES.length - 1 && {
                        borderBottomColor: theme.border,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                      { opacity: pressed && canOpen ? 0.7 : 1 },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.referenceTitle, { color: theme.text }]}>
                        {reference.title}
                      </Text>
                      <Text style={[styles.referenceDetail, { color: highContrast ? theme.text : theme.textDim }]}>
                        {reference.detail}
                      </Text>
                    </View>
                    <Ionicons
                      name={canOpen ? 'open-outline' : 'book-outline'}
                      size={17}
                      color={canOpen ? pal.gold : (highContrast ? theme.text : theme.textDim)}
                    />
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
});

/* ================================================================
   OKUYUCU (ReaderView)
   ================================================================ */
const ReaderView = memo(function ReaderView({
  index, theme, pal, highContrast, fontScale, readingFontScale,
  showSizeBar, onToggleSizeBar, onFontChange,
  bottomInset, largeTouchTargets,
  onPrev, onNext, onBack, onToc, onShare, onCopy, onRestart, onExit,
}) {
  const styles = useStyler();
  const scrollRef = useRef(null);
  const section = VEDA_HUTBESI_TEXT[index];
  if (!section) return null;

  const isLastSection = index === TOTAL_SECTIONS - 1;
  const overallProgress = (index + 1) / TOTAL_SECTIONS;
  const primaryColor = highContrast ? '#000000' : (theme.onPrimary || '#FFF');
  const readMins = estimateReadMinutes(section);

  const bodySize = 17 * fontScale;
  const bodyLineHeight = Math.round(bodySize * (fontScale >= 1.3 ? 1.85 : 1.75));
  const titleSize = 26 * fontScale;
  const titleLineHeight = Math.round(titleSize * (fontScale >= 1.3 ? 1.45 : 1.35));

  useEffect(() => {
    scrollRef.current?.scrollTo?.({ y: 0, animated: false });
  }, [index]);

  return (
    <View style={{ flex: 1 }}>
      {/* Üst Bar */}
      <View style={styles.readerTopBar}>
        <Pressable
          onPress={onBack}
          accessibilityLabel="Kapağa dön"
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
            BAŞLIK {index + 1} / {TOTAL_SECTIONS}
          </Text>
          <Text style={[styles.readerChapterTitle, { color: theme.text }]} numberOfLines={1}>
            {section.category}
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

      {/* İlerleme Çizgisi */}
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

      {/* İçerik Alanı */}
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={styles.readerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.readerContentInner}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginBottom: 12,
          }}>
            <Text style={[styles.readerDate, { color: pal.gold, marginBottom: 0 }]}>
              {section.category.toUpperCase()}
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
            {section.title}
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
            {section.content}
          </Text>

          {section.keyMessage ? (
            <View
              style={[
                styles.keyMessageBox,
                {
                  backgroundColor: pal.goldSoft,
                  borderLeftColor: pal.gold,
                },
              ]}
            >
              <Text style={[styles.keyMessageLabel, { color: pal.gold }]}>
                HATIRDA KALSIN
              </Text>
              <Text
                style={[
                  styles.keyMessageText,
                  {
                    color: theme.text,
                    fontSize: 14.5 * fontScale,
                    lineHeight: Math.round(14.5 * fontScale * 1.6),
                  },
                ]}
              >
                {section.keyMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.readerActions}>
            <Pressable
              onPress={() => onCopy(sectionShareText(section))}
              accessibilityLabel={`${section.title} bölümünü kopyala`}
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
              <Ionicons name="copy-outline" size={16} color={highContrast ? theme.text : theme.textDim} />
              <Text style={[styles.readerShareText, { color: highContrast ? theme.text : theme.textDim }]}>Kopyala</Text>
            </Pressable>

            <Pressable
              onPress={() => onShare(section)}
              accessibilityLabel={`${section.title} bölümünü paylaş`}
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

          {/* Hutbe Sonu */}
          {isLastSection ? (
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
                {PEYGAMBERIMIZI_ANMA.salawatLatin}
              </Text>
              <Text
                style={[
                  styles.readerEndMeaning,
                  {
                    color: highContrast ? theme.text : theme.textDim,
                    fontSize: 13 * fontScale,
                    lineHeight: Math.round(13 * fontScale * 1.6),
                  },
                ]}
              >
                {PEYGAMBERIMIZI_ANMA.salawatMeaning}
              </Text>

              <View
                style={[
                  styles.endCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: highContrast ? theme.text : theme.border,
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}
              >
                <Text style={[styles.endCardHeading, { color: theme.text }]}>
                  Onu anmayı davranışlarımızda yaşatalım
                </Text>
                {PEYGAMBERIMIZI_ANMA.practices.map((practice, pIdx) => (
                  <View
                    key={practice.id}
                    style={[
                      styles.practiceRow,
                      pIdx < PEYGAMBERIMIZI_ANMA.practices.length - 1 && {
                        borderBottomColor: theme.border,
                        borderBottomWidth: StyleSheet.hairlineWidth,
                      },
                    ]}
                  >
                    <View style={[styles.practiceIcon, { backgroundColor: pal.goldSoft }]}>
                      <Ionicons name={practice.icon} size={17} color={pal.gold} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.practiceTitle, { color: theme.text }]}>
                        {practice.title}
                      </Text>
                      <Text style={[styles.practiceDesc, { color: highContrast ? theme.text : theme.textDim }]}>
                        {practice.description}
                      </Text>
                    </View>
                  </View>
                ))}

                <View style={[styles.duaSection, { borderTopColor: theme.border }]}>
                  <Text style={[styles.duaLabel, { color: pal.gold }]}>BİR DUA</Text>
                  <Text
                    style={[
                      styles.duaText,
                      {
                        color: theme.text,
                        fontSize: 14 * fontScale,
                        lineHeight: Math.round(14 * fontScale * 1.65),
                      },
                    ]}
                  >
                    {PEYGAMBERIMIZI_ANMA.dua}
                  </Text>
                  <Pressable
                    onPress={() => onCopy(PEYGAMBERIMIZI_ANMA.dua)}
                    accessibilityLabel="Dua metnini kopyala"
                    style={({ pressed }) => [
                      styles.readerShareBtn,
                      {
                        alignSelf: 'flex-start',
                        marginTop: 10,
                        borderColor: highContrast ? theme.text : theme.border,
                        borderWidth: highContrast ? 2 : 1,
                        opacity: pressed ? 0.6 : 1,
                        minHeight: largeTouchTargets ? 44 : 34,
                        paddingHorizontal: 12,
                      },
                    ]}
                  >
                    <Ionicons name="copy-outline" size={14} color={highContrast ? theme.text : theme.textDim} />
                    <Text style={[styles.readerShareText, { color: highContrast ? theme.text : theme.textDim, fontSize: 12 }]}>
                      Duayı kopyala
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Sayfa Sonu Aksiyonları: Kapat & Baştan Başla */}
              <View style={styles.endActionsWrap}>
                {onExit ? (
                  <Pressable
                    onPress={onExit}
                    accessibilityRole="button"
                    accessibilityLabel="Okumayı tamamla ve sayfayı kapat"
                    style={({ pressed }) => [
                      styles.readerRestartBtn,
                      {
                        backgroundColor: theme.primary,
                        opacity: pressed ? 0.9 : 1,
                        minHeight: largeTouchTargets ? 58 : 50,
                      },
                    ]}
                  >
                    <Ionicons name="checkmark-circle-outline" size={20} color={primaryColor} />
                    <Text style={[styles.readerRestartText, { color: primaryColor }]}>
                      Sayfayı kapat
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  onPress={onRestart}
                  accessibilityRole="button"
                  accessibilityLabel="Baştan başla"
                  style={({ pressed }) => [
                    onExit ? styles.readerSecondaryRestartBtn : styles.readerRestartBtn,
                    onExit
                      ? {
                          borderColor: highContrast ? theme.text : theme.border,
                          borderWidth: highContrast ? 2 : 1,
                          backgroundColor: theme.surface,
                          opacity: pressed ? 0.85 : 1,
                          minHeight: largeTouchTargets ? 54 : 46,
                        }
                      : {
                          backgroundColor: theme.primary,
                          opacity: pressed ? 0.9 : 1,
                          minHeight: largeTouchTargets ? 58 : 50,
                        },
                  ]}
                >
                  <Ionicons
                    name="refresh"
                    size={18}
                    color={onExit ? theme.text : primaryColor}
                  />
                  <Text
                    style={[
                      styles.readerRestartText,
                      { color: onExit ? theme.text : primaryColor },
                    ]}
                  >
                    Baştan başla
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Alt Navigasyon Barı */}
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
          accessibilityLabel="Önceki başlık"
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

        {isLastSection && onExit ? (
          <Pressable
            onPress={onExit}
            accessibilityRole="button"
            accessibilityLabel="Bitir ve sayfayı kapat"
            style={({ pressed }) => [
              styles.readerNavBtn,
              {
                backgroundColor: theme.primary,
                opacity: pressed ? 0.85 : 1,
                minHeight: largeTouchTargets ? 56 : 46,
              },
            ]}
          >
            <Text style={[styles.readerNavText, { color: primaryColor }]}>Bitir</Text>
            <Ionicons name="checkmark" size={20} color={primaryColor} />
          </Pressable>
        ) : (
          <Pressable
            onPress={onNext}
            disabled={isLastSection}
            accessibilityLabel="Sonraki başlık"
            style={({ pressed }) => [
              styles.readerNavBtn,
              {
                backgroundColor: isLastSection ? 'transparent' : pal.goldSoft,
                borderColor: !isLastSection && highContrast ? pal.gold : 'transparent',
                borderWidth: !isLastSection && highContrast ? 1.5 : 0,
                opacity: isLastSection ? 0.35 : (pressed ? 0.7 : 1),
                minHeight: largeTouchTargets ? 56 : 46,
              },
            ]}
          >
            <Text style={[styles.readerNavText, { color: pal.gold }]}>Sonraki</Text>
            <Ionicons name="chevron-forward" size={20} color={pal.gold} />
          </Pressable>
        )}
      </View>
    </View>
  );
});

/* ================================================================
   ANA EKRAN
   ================================================================ */
export default function VedaHutbesiScreen({ onBack }) {
  const getTheme = useAppStore((s) => s.getTheme);
  const highContrast = useAppStore((s) => s.highContrast) ?? false;
  const largeTouchTargets = useAppStore((s) => s.largeTouchTargets) ?? false;
  const isSimpleMode = useAppStore((s) => s.isSimpleMode) ?? false;
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

  const styles = useMemo(
    () => makeStyles(appFont, largeTouchTargets),
    [appFont, largeTouchTargets]
  );

  const [view, setView] = useState('cover');
  const [readerIndex, setReaderIndex] = useState(0);
  const [showSizeBar, setShowSizeBar] = useState(false);

  const { progress, loaded, markRead, resetProgress } = useHutbeProgress();

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
    const section = VEDA_HUTBESI_TEXT[readerIndex];
    if (!section) return;
    markRead(section.id);
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
    const idx = findSectionIndex(progress.lastId);
    setReaderIndex(idx >= 0 ? idx : 0);
    setView('reader');
  }, [progress.lastId]);

  const handleSectionPress = useCallback((idx) => {
    hapticMedium();
    setReaderIndex(idx >= 0 ? idx : 0);
    setView('reader');
  }, []);

  const handlePrev = useCallback(() => {
    if (readerIndex <= 0) return;
    hapticLight();
    setReaderIndex((i) => Math.max(0, i - 1));
  }, [readerIndex]);

  const handleNext = useCallback(() => {
    if (readerIndex >= TOTAL_SECTIONS - 1) return;
    hapticLight();
    setReaderIndex((i) => Math.min(TOTAL_SECTIONS - 1, i + 1));
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

  const handleOpenToc = useCallback(() => {
    hapticLight();
    setView('toc');
  }, []);

  const handleTocBack = useCallback(() => {
    hapticLight();
    setView('cover');
  }, []);

  const handleExitScreen = useCallback(() => {
    hapticMedium();
    onBack?.();
  }, [onBack]);

  const handleShareAll = useCallback(async () => {
    hapticLight();
    try {
      const sections = VEDA_HUTBESI_TEXT.map(
        (section, idx) => `${idx + 1}. ${section.title}\n${section.content}`
      ).join('\n\n');

      const message = [
        VEDA_HUTBESI_INFO.title,
        `${VEDA_HUTBESI_INFO.date} · ${VEDA_HUTBESI_INFO.location}`,
        VEDA_HUTBESI_INFO.description,
        '',
        sections,
        '',
        PEYGAMBERIMIZI_ANMA.salawatLatin,
        '',
        'NİDA – İslami Rehber',
      ].join('\n');

      await Share.share({ message, title: VEDA_HUTBESI_INFO.title });
    } catch {}
  }, []);

  const handleShareSection = useCallback(async (section) => {
    hapticLight();
    try {
      await Share.share({
        message: sectionShareText(section),
        title: section.title,
      });
    } catch {}
  }, []);

  const handleCopyText = useCallback(async (value) => {
    hapticLight();
    try {
      if (Clipboard?.setStringAsync) {
        await Clipboard.setStringAsync(value);
        Alert.alert('Kopyalandı', 'Metin panoya kopyalandı.');
        return;
      }
      await Share.share({ message: value, title: 'Metni paylaş' });
    } catch {}
  }, []);

  const handleOpenReference = useCallback(async (reference) => {
    if (!reference?.url) return;
    hapticLight();
    try {
      await Linking.openURL(reference.url);
    } catch {
      Alert.alert('Bağlantı açılamadı', 'Kaynağa şu anda ulaşılamıyor.');
    }
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
            isSimpleMode={isSimpleMode}
            progress={progress}
            bottomInset={insets.bottom}
            largeTouchTargets={largeTouchTargets}
            onStart={handleStart}
            onContinue={handleContinue}
            onToc={handleOpenToc}
            onShareAll={handleShareAll}
            onExit={onBack ? handleExitScreen : undefined}
          />
        ) : view === 'toc' ? (
          <TocView
            theme={theme}
            pal={pal}
            highContrast={highContrast}
            isSimpleMode={isSimpleMode}
            progress={progress}
            bottomInset={insets.bottom}
            largeTouchTargets={largeTouchTargets}
            onSectionPress={handleSectionPress}
            onOpenReference={handleOpenReference}
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
            onToc={handleOpenToc}
            onShare={handleShareSection}
            onCopy={handleCopyText}
            onRestart={handleRestart}
            onExit={onBack ? handleExitScreen : undefined}
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
      fontSize: 34,
      lineHeight: 42,
      fontWeight: '700',
      textAlign: 'center',
      letterSpacing: 0.5,
    },
    bookSubtitle: {
      fontFamily: fonts.italic,
      fontSize: 14.5,
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
      letterSpacing: 1.8,
      textAlign: 'center',
      marginTop: 20,
      opacity: 0.75,
    },
    bookMeta: {
      fontFamily: fonts.bold,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textAlign: 'center',
      marginTop: 16,
      opacity: 0.75,
    },

    coverDescription: { marginTop: 24, maxWidth: 480, paddingHorizontal: 8, width: '100%' },
    coverDescText: {
      fontFamily: fonts.regular,
      fontSize: 14.5,
      lineHeight: 23,
      textAlign: 'center',
    },
    editorialNoteCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      padding: 12,
      borderRadius: 12,
      borderLeftWidth: 3,
      marginTop: 14,
    },
    editorialNoteText: {
      flex: 1,
      fontFamily: fonts.regular,
      fontSize: 12.5,
      lineHeight: 19,
    },

    coverActions: { marginTop: 24, width: '100%', maxWidth: 420, gap: 10 },
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
      paddingBottom: 12,
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
    searchBox: {
      marginHorizontal: 20,
      marginBottom: 12,
      borderRadius: 14,
      paddingHorizontal: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },
    searchInput: {
      flex: 1,
      minHeight: 40,
      fontSize: 14,
      paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    },
    tocScroll: { paddingHorizontal: 20, paddingBottom: 40 },
    tocProgressCard: { padding: 16, borderRadius: 16, marginBottom: 20, marginTop: 2 },
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
      fontSize: 18,
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    tocChapterTitle: {
      fontFamily: fonts.bold,
      fontSize: 16,
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
    emptyState: {
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 12,
    },
    emptyTitle: {
      fontFamily: fonts.bold,
      fontSize: 15,
      fontWeight: '700',
      marginTop: 10,
    },
    emptyDesc: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      textAlign: 'center',
      marginTop: 4,
      lineHeight: 18,
    },
    themeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    themeCard: {
      flexBasis: '47%',
      flexGrow: 1,
      minWidth: 140,
      borderRadius: 16,
      padding: 14,
    },
    themeIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    themeTitle: {
      fontFamily: fonts.bold,
      fontSize: 13.5,
      fontWeight: '700',
      marginBottom: 4,
    },
    themeDescription: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 17,
    },
    referencesCard: {
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 6,
    },
    referenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      gap: 10,
    },
    referenceTitle: {
      fontFamily: fonts.bold,
      fontSize: 13,
      fontWeight: '700',
    },
    referenceDetail: {
      fontFamily: fonts.regular,
      fontSize: 11.5,
      lineHeight: 16,
      marginTop: 2,
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

    readerDate: {
      fontFamily: fonts.bold,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.8,
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

    keyMessageBox: {
      borderLeftWidth: 3,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 22,
    },
    keyMessageLabel: {
      fontFamily: fonts.bold,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 4,
    },
    keyMessageText: {
      fontFamily: fonts.medium,
      fontWeight: '600',
    },

    readerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
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
    readerEndMeaning: {
      fontFamily: fonts.regular,
      textAlign: 'center',
      marginTop: 6,
    },

    endCard: {
      width: '100%',
      borderRadius: 18,
      padding: 16,
      marginTop: 24,
    },
    endCardHeading: {
      fontFamily: fonts.bold,
      fontSize: 15.5,
      fontWeight: '700',
      marginBottom: 8,
    },
    practiceRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 11,
    },
    practiceIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    practiceTitle: {
      fontFamily: fonts.bold,
      fontSize: 13.5,
      fontWeight: '700',
      marginBottom: 2,
    },
    practiceDesc: {
      fontFamily: fonts.regular,
      fontSize: 12.5,
      lineHeight: 18,
    },
    duaSection: {
      borderTopWidth: StyleSheet.hairlineWidth,
      marginTop: 8,
      paddingTop: 14,
    },
    duaLabel: {
      fontFamily: fonts.bold,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 6,
    },
    duaText: {
      fontFamily: fonts.medium,
      fontWeight: '500',
    },

    endActionsWrap: {
      width: '100%',
      alignItems: 'center',
      gap: 10,
      marginTop: 28,
    },
    readerRestartBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 28,
      borderRadius: 22,
      minWidth: 210,
    },
    readerSecondaryRestartBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 24,
      borderRadius: 22,
      minWidth: 210,
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