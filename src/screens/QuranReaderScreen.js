// src/screens/QuranReaderScreen.js
import React, {
  memo, useCallback, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Share,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
  Animated,
  ScrollView,
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useAppStore } from '../store/useAppStore';
import { QURAN_SURAHS, getSurahByNumber } from '../data/quranSurahs';
import {
  fetchSurahVerses,
  getSourceInfo,
} from '../services/quranReaderService';
import { saveLastPosition } from '../services/quranWordByWordApi';
import { addRecentSurah, getRecentSurahs } from '../services/quranRecent';

/* ================================================================
   Güvenli modül yüklemeleri
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}
let Clipboard = null;
try { Clipboard = require('expo-clipboard'); } catch {}

const haptic = (style = 'light') => {
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
   Sabitler
   ================================================================ */
const DISPLAY_MODES = [
  { id: 'arabic',      label: 'AR',    fullLabel: 'Arapça',              icon: 'text-outline' },
  { id: 'arabic_meal', label: 'AR+TR', fullLabel: 'Arapça + Meal',         icon: 'book-outline' },
  { id: 'arabic_full', label: 'TAM',   fullLabel: 'Tam Metin',            icon: 'reader-outline' },
  { id: 'meal_only',   label: 'TR',    fullLabel: 'Sadece Türkçe',        icon: 'language-outline' },
  { id: 'wbw',         label: 'KEL',   fullLabel: 'Kelime Kelime',        icon: 'grid-outline' },
];

const LAYOUT_MODES = [
  { id: 'scroll',      label: 'Liste',  icon: 'list-outline' },
  { id: 'page',        label: 'Sayfa',  icon: 'book-outline' },
  { id: 'single_ayah', label: 'Ayet',   icon: 'document-text-outline' },
];

const FONT_SIZES = [
  { id: 'small',    label: 'A-',    scale: 0.9,  arabic: 22 },
  { id: 'normal',   label: 'A',     scale: 1.0,  arabic: 26 },
  { id: 'large',    label: 'A+',    scale: 1.15, arabic: 30 },
  { id: 'xlarge',   label: 'A++',   scale: 1.35, arabic: 34 },
  { id: 'xxlarge',  label: 'A+++',  scale: 1.6,  arabic: 41 },
];

const FONT_LABELS = {
  small: 'Küçük',
  normal: 'Normal',
  large: 'Büyük',
  xlarge: 'Çok Büyük',
  xxlarge: 'En Büyük',
};

const MIN_PINCH_SCALE = 0.8;
const MAX_PINCH_SCALE = 1.7;

/* ================================================================
   Sure Seçici — filtre & sıralama & renk yardımcıları
   ================================================================ */
const SURAH_FILTERS = [
  { id: 'all',     label: 'Tümü' },
  { id: 'short',   label: 'Kısa' },
  { id: 'medium',  label: 'Orta' },
  { id: 'long',    label: 'Uzun' },
  { id: 'meccan',  label: 'Mekki' },
  { id: 'medinan', label: 'Medeni' },
];

const SURAH_SORTS = [
  { id: 'mushaf',       label: 'Mushaf sırası' },
  { id: 'length_desc', label: 'Uzun → Kısa' },
  { id: 'length_asc',  label: 'Kısa → Uzun' },
];

const getLengthColor = (ayahCount, highContrast) => {
  if (highContrast) return '#FFFF00';
  if (ayahCount <= 20) return '#22C55E';
  if (ayahCount <= 80) return '#F59E0B';
  return '#EF4444';
};

/* ================================================================
   Standart Madani Mushaf — sure başlangıç sayfaları
   ================================================================ */
const SURAH_START_PAGE = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
  10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267,
  17: 282, 18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342,
  24: 350, 25: 359, 26: 367, 27: 377, 28: 385, 29: 396, 30: 404,
  31: 411, 32: 415, 33: 418, 34: 428, 35: 434, 36: 440, 37: 446,
  38: 453, 39: 458, 40: 467, 41: 477, 42: 483, 43: 489, 44: 496,
  45: 499, 46: 502, 47: 507, 48: 511, 49: 515, 50: 518, 51: 520,
  52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537, 58: 542,
  59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
  66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 572,
  73: 574, 74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583,
  80: 585, 81: 586, 82: 587, 83: 587, 84: 589, 85: 590, 86: 591,
  87: 591, 88: 592, 89: 593, 90: 594, 91: 595, 92: 595, 93: 596,
  94: 596, 95: 597, 96: 597, 97: 598, 98: 598, 99: 599, 100: 599,
  101: 600, 102: 600, 103: 601, 104: 601, 105: 601, 106: 602,
  107: 602, 108: 602, 109: 603, 110: 603, 111: 603, 112: 604,
  113: 604, 114: 604,
};

/* ================================================================
   PressableScale
   ================================================================ */
const PressableScale = memo(function PressableScale({
  onPress, onLongPress, children, style, scaleTo = 0.97, disabled,
  accessibilityLabel, accessibilityRole = 'button', h = 'light',
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    Animated.spring(scale, {
      toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 4,
    }).start();
  };
  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4,
    }).start();
  };
  const handlePress = (e) => {
    if (h) haptic(h);
    onPress?.(e);
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onLongPress={onLongPress}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
});

/* ================================================================
   WordChip
   ================================================================ */
const WordChip = memo(function WordChip({
  word, theme, arabicSize, showTranslation, isActive, onPress, highContrast,
}) {
  return (
    <PressableScale
      onPress={() => onPress(word)}
      h="light"
      accessibilityLabel={`Kelime ${word.position}${word.translationTR ? `, ${word.translationTR}` : ''}`}
      style={[
        styles.wordChip,
        showTranslation && styles.wordChipWide,
        {
          backgroundColor: isActive ? theme.primaryGlow : (highContrast ? '#1E1E1E' : 'transparent'),
          borderColor: isActive ? theme.primary : (highContrast ? '#FFFFFF' : 'transparent'),
          borderWidth: highContrast ? 2 : (isActive ? 1 : 0),
        },
      ]}
    >
      <Text
        style={[
          styles.wordArabic,
          {
            color: isActive ? theme.primary : theme.text,
            fontSize: arabicSize,
            lineHeight: arabicSize * 1.7,
            fontWeight: highContrast ? '900' : (isActive ? '700' : '500'),
          },
        ]}
      >
        {word.arabic}
      </Text>
      {showTranslation && word.translationTR ? (
        <Text
          style={[styles.wordTrans, {
            color: isActive ? theme.primary : theme.textDim,
            fontWeight: highContrast ? '900' : (isActive ? '800' : '600'),
          }]}
          numberOfLines={3}
        >
          {word.translationTR}
        </Text>
      ) : null}
    </PressableScale>
  );
});

/* ================================================================
   Sadece Meal kartı
   ================================================================ */
const MealOnlyVerse = memo(function MealOnlyVerse({
  verse, theme, fontScale, isLast, surahNumber, onVersePress, highContrast,
}) {
  const handleShareVerse = useCallback(() => {
    haptic('medium');
    const parts = [`${verse.verseKey}\n\n${verse.translation}`];
    Share.share({ message: parts.join('\n') }).catch(() => {});
  }, [verse]);

  const handlePress = useCallback(() => {
    haptic();
    onVersePress?.(verse);
  }, [onVersePress, verse]);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      onLongPress={handleShareVerse}
      delayLongPress={400}
      style={[styles.mealOnlyCard, {
        backgroundColor: highContrast ? '#121212' : theme.surface,
        borderColor: highContrast ? '#FFFFFF' : theme.border,
        borderWidth: highContrast ? 2 : 1,
        marginBottom: isLast ? 0 : 14,
      }]}
    >
      <View style={styles.mealOnlyHeader}>
        <View style={[styles.verseNumBadge, { backgroundColor: highContrast ? '#000000' : theme.primaryGlow, borderColor: highContrast ? '#FFFFFF' : 'transparent', borderWidth: highContrast ? 2 : 0 }]}>
          <Text style={[styles.verseNum, { color: theme.primary, fontWeight: highContrast ? '900' : '900' }]}>
            {verse.number}
          </Text>
        </View>
        <Text style={[styles.verseKey, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : '700' }]}>
          {surahNumber}:{verse.number}
        </Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={handleShareVerse}
          hitSlop={10}
          accessibilityLabel="Ayeti paylaş"
        >
          <Ionicons name="share-outline" size={16} color={highContrast ? '#FFFFFF' : theme.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.mealOnlyText, {
        color: theme.text,
        fontSize: 16 * fontScale,
        lineHeight: 26 * fontScale,
        fontWeight: highContrast ? '700' : '400',
      }]}>
        {verse.translation || '—'}
      </Text>
    </TouchableOpacity>
  );
}, (prev, next) => (
  prev.verse.id === next.verse.id &&
  prev.fontScale === next.fontScale &&
  prev.isLast === next.isLast &&
  prev.surahNumber === next.surahNumber &&
  prev.highContrast === next.highContrast &&
  prev.theme === next.theme
));

/* ================================================================
   Klasik Ayet kartı
   ================================================================ */
const VerseCard = memo(function VerseCard({
  verse, theme, displayMode, fontScale, arabicSize,
  activeWordId, onWordPress, isLast, surahNumber, onVersePress, highContrast,
}) {
  const showArabic = displayMode !== 'meal_only';
  const showTranslit = displayMode === 'arabic_full';
  const showMeal = displayMode === 'arabic_meal' || displayMode === 'arabic_full';
  const wbw = displayMode === 'wbw';

  const handleShareVerse = useCallback(() => {
    haptic('medium');
    const parts = [`${verse.verseKey}\n`];
    if (verse.arabic) parts.push(verse.arabic);
    if (verse.latin) parts.push(`\n${verse.latin}`);
    if (verse.translation) parts.push(`\n${verse.translation}`);
    Share.share({ message: parts.join('\n') }).catch(() => {});
  }, [verse]);

  const handlePress = useCallback(() => {
    haptic();
    onVersePress?.(verse);
  }, [onVersePress, verse]);

  const latinText =
    verse.latin ||
    (Array.isArray(verse.words)
      ? verse.words.map((w) => w.transliteration).filter(Boolean).join(' ')
      : '') ||
    '—';

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      onLongPress={handleShareVerse}
      delayLongPress={400}
      style={[styles.verseCard, {
        backgroundColor: highContrast ? '#121212' : theme.surface,
        borderColor: highContrast ? '#FFFFFF' : theme.border,
        borderWidth: highContrast ? 2 : 1,
        marginBottom: isLast ? 0 : 12,
      }]}
    >
      <View style={styles.verseHeader}>
        <View style={[styles.verseNumBadge, { backgroundColor: highContrast ? '#000000' : theme.primaryGlow, borderColor: highContrast ? '#FFFFFF' : 'transparent', borderWidth: highContrast ? 2 : 0 }]}>
          <Text style={[styles.verseNum, { color: theme.primary, fontWeight: highContrast ? '900' : '900' }]}>
            {verse.number}
          </Text>
        </View>
        <Text style={[styles.verseKey, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : '700' }]}>
          {surahNumber}:{verse.number}
        </Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={handleShareVerse}
          hitSlop={10}
          accessibilityLabel="Ayeti paylaş"
        >
          <Ionicons name="share-outline" size={16} color={highContrast ? '#FFFFFF' : theme.textMuted} />
        </TouchableOpacity>
      </View>

      {showArabic && (
        <View style={styles.wordsRow}>
          {verse.words && verse.words.length > 0 ? (
            verse.words.map((w) => (
              <WordChip
                key={w.id}
                word={w}
                theme={theme}
                arabicSize={arabicSize}
                showTranslation={wbw}
                isActive={activeWordId === w.id}
                onPress={(word) => onWordPress(word, verse)}
                highContrast={highContrast}
              />
            ))
          ) : (
            <Text style={[styles.arabicPlain, {
              color: theme.text,
              fontSize: arabicSize,
              lineHeight: arabicSize * 1.7,
              fontWeight: highContrast ? '900' : 'normal',
            }]}>
              {verse.arabic}
            </Text>
          )}
        </View>
      )}

      {showTranslit && (
        <Text style={[styles.translit, { color: highContrast ? '#FFFF00' : theme.textDim, fontWeight: highContrast ? '700' : 'normal' }]}>
          {latinText}
        </Text>
      )}

      {showMeal && (
        <View style={[styles.mealBox, { borderTopColor: highContrast ? '#FFFFFF' : theme.border, borderTopWidth: highContrast ? 2 : 1 }]}>
          <View style={styles.mealHeader}>
            <Text style={[styles.mealLabel, { color: theme.primary, fontWeight: highContrast ? '900' : '900' }]}>MEAL</Text>
          </View>
          <Text style={[styles.mealText, {
            color: theme.text,
            fontSize: 14 * fontScale,
            lineHeight: 22 * fontScale,
            fontWeight: highContrast ? '700' : '400',
          }]}>
            {verse.translation || '—'}
          </Text>

          {Array.isArray(verse.footnotes) && verse.footnotes.length > 0 && (
            <View style={[styles.footnotesBox, { borderTopColor: highContrast ? '#FFFFFF' : theme.border, borderTopWidth: highContrast ? 2 : StyleSheet.hairlineWidth }]}>
              {verse.footnotes.map((fn) => (
                <Text
                  key={fn.id}
                  style={[styles.footnoteText, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : 'normal' }]}
                >
                  <Text style={{ color: theme.primary, fontWeight: '900' }}>
                    [{fn.number}]
                  </Text>{' '}
                  {fn.text}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}, (prev, next) => (
  prev.verse.id === next.verse.id &&
  prev.displayMode === next.displayMode &&
  prev.fontScale === next.fontScale &&
  prev.arabicSize === next.arabicSize &&
  prev.activeWordId === next.activeWordId &&
  prev.isLast === next.isLast &&
  prev.surahNumber === next.surahNumber &&
  prev.highContrast === next.highContrast &&
  prev.theme === next.theme
));

/* ================================================================
   Yazı Boyutu Bottom Sheet
   ================================================================ */
const FontSizeSheet = memo(function FontSizeSheet({
  visible, theme, currentId, onSelect, onClose, highContrast,
}) {
  const insets = useSafeAreaInsets();
  const currentConfig =
    FONT_SIZES.find((f) => f.id === currentId) || FONT_SIZES[1];

  const previewArabic = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
  const previewSize = currentConfig.arabic;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Kapat"
        />
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: highContrast ? '#121212' : theme.surface,
              borderColor: highContrast ? '#FFFFFF' : theme.border,
              borderWidth: highContrast ? 2 : 1,
              paddingBottom: Math.max(16, insets.bottom + 16),
            },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: highContrast ? '#FFFFFF' : theme.border }]} />

          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text
                accessibilityRole="header"
                style={[styles.modalTitle, { color: theme.text, fontWeight: highContrast ? '900' : '900' }]}
              >
                Yazı Boyutu
              </Text>
              <Text style={{ color: highContrast ? '#E0E0E0' : theme.textMuted, fontSize: 11, marginTop: 2, fontWeight: highContrast ? '700' : 'normal' }}>
                {Math.round(currentConfig.scale * 100)}% · {FONT_LABELS[currentId]}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { haptic(); onClose?.(); }}
              hitSlop={12}
              accessibilityLabel="Kapat"
            >
              <Ionicons name="close" size={24} color={highContrast ? '#FFFFFF' : theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.fontPreviewBox,
              { backgroundColor: highContrast ? '#000000' : theme.background, borderColor: highContrast ? '#FFFFFF' : theme.border, borderWidth: highContrast ? 2 : 1 },
            ]}
          >
            <Text
              style={[
                styles.fontPreviewArabic,
                {
                  color: theme.text,
                  fontSize: previewSize,
                  lineHeight: previewSize * 1.8,
                  fontWeight: highContrast ? '900' : '500',
                },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {previewArabic}
            </Text>
          </View>

          <View style={{ gap: 6, marginBottom: 12 }}>
            {FONT_SIZES.map((f) => {
              const isActive = f.id === currentId;
              return (
                <TouchableOpacity
                  key={f.id}
                  onPress={() => { haptic(); onSelect(f.id); }}
                  activeOpacity={0.7}
                  style={[
                    styles.fontOptionRow,
                    {
                      backgroundColor: isActive
                        ? theme.primary
                        : (highContrast ? '#000000' : theme.background),
                      borderColor: isActive ? theme.primary : (highContrast ? '#FFFFFF' : theme.border),
                      borderWidth: highContrast ? 2 : (isActive ? 2 : 1),
                    },
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={`${FONT_LABELS[f.id]} · ${Math.round(f.scale * 100)}%`}
                >
                  <View
                    style={[
                      styles.fontOptionRadio,
                      {
                        borderColor: isActive ? (highContrast ? '#000000' : theme.primary) : (highContrast ? '#FFFFFF' : theme.textMuted),
                        backgroundColor: isActive ? (highContrast ? '#000000' : theme.primary) : 'transparent',
                        borderWidth: highContrast ? 2 : 2,
                      },
                    ]}
                  >
                    {isActive && (
                      <Ionicons name="checkmark" size={10} color={highContrast ? '#FFFF00' : '#FFF'} />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.fontOptionLabel,
                      {
                        color: isActive ? (highContrast ? '#000000' : theme.primary) : theme.text,
                        fontSize: 12 + (f.scale - 0.9) * 6,
                        fontWeight: highContrast ? '900' : '900',
                      },
                    ]}
                  >
                    {f.label}
                  </Text>

                  <Text
                    style={[
                      styles.fontOptionDesc,
                      { color: isActive ? (highContrast ? '#000000' : theme.primary) : (highContrast ? '#E0E0E0' : theme.textDim), fontWeight: highContrast ? '900' : '700' },
                    ]}
                  >
                    {FONT_LABELS[f.id]}
                  </Text>

                  <Text
                    style={[
                      styles.fontOptionPercent,
                      { color: isActive ? (highContrast ? '#000000' : theme.textMuted) : (highContrast ? '#CCCCCC' : theme.textMuted), fontWeight: highContrast ? '900' : '700' },
                    ]}
                  >
                    {Math.round(f.scale * 100)}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View
            style={[
              styles.fontHintBox,
              { backgroundColor: highContrast ? '#000000' : theme.background, borderColor: highContrast ? '#FFFFFF' : theme.border, borderWidth: highContrast ? 2 : 1 },
            ]}
          >
            <Ionicons name="information-circle-outline" size={13} color={highContrast ? '#FFFFFF' : theme.textMuted} />
            <Text style={{ color: highContrast ? '#E0E0E0' : theme.textMuted, fontSize: 10, flex: 1, lineHeight: 14, fontWeight: highContrast ? '700' : 'normal' }}>
              İpucu: Okuyucuda iki parmağınızla da yakınlaştırabilirsiniz.
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => { haptic(); onClose?.(); }}
            style={[styles.fontDoneBtn, { backgroundColor: theme.primary, borderColor: highContrast ? '#000000' : 'transparent', borderWidth: highContrast ? 2 : 0 }]}
            accessibilityRole="button"
            accessibilityLabel="Tamam"
          >
            <Text style={[styles.fontDoneBtnText, { color: highContrast ? '#000000' : (theme.onPrimary || '#FFF'), fontWeight: highContrast ? '900' : '900' }]}>
              Tamam
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   Ayet Detay Modalı
   ================================================================ */
const VerseDetailModal = memo(function VerseDetailModal({
  visible, verse, theme, surahNumber, onClose, highContrast,
}) {
  const insets = useSafeAreaInsets();
  const [fontScale, setFontScale] = useState(1.2);

  useEffect(() => {
    if (visible) setFontScale(1.2);
  }, [visible]);

  const handleShare = useCallback(async () => {
    if (!verse) return;
    haptic('medium');
    const parts = [`${verse.verseKey}\n`];
    if (verse.arabic) parts.push(verse.arabic);
    if (verse.latin) parts.push(`\n${verse.latin}`);
    if (verse.translation) parts.push(`\n${verse.translation}`);
    try {
      await Share.share({ message: parts.join('\n') });
    } catch {}
  }, [verse]);

  const handleCopy = useCallback(async () => {
    if (!verse || !Clipboard?.setStringAsync) return;
    try {
      const parts = [`${verse.verseKey}`];
      if (verse.arabic) parts.push(verse.arabic);
      if (verse.latin) parts.push(verse.latin);
      if (verse.translation) parts.push(`\n${verse.translation}`);
      await Clipboard.setStringAsync(parts.join('\n\n'));
      haptic();
    } catch {}
  }, [verse]);

  const increaseFont = useCallback(() => {
    haptic();
    setFontScale((s) => Math.min(2.2, Number((s + 0.15).toFixed(2))));
  }, []);

  const decreaseFont = useCallback(() => {
    haptic();
    setFontScale((s) => Math.max(0.75, Number((s - 0.15).toFixed(2))));
  }, []);

  if (!verse) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.detailOverlay}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <View style={[styles.detailContainer, { backgroundColor: highContrast ? '#000000' : theme.background }]}>
            <View style={[styles.detailHeader, { borderBottomColor: highContrast ? '#FFFFFF' : theme.border, borderBottomWidth: highContrast ? 2 : StyleSheet.hairlineWidth }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={[styles.detailBadge, { backgroundColor: highContrast ? '#121212' : theme.primaryGlow, borderColor: highContrast ? '#FFFFFF' : 'transparent', borderWidth: highContrast ? 2 : 0 }]}>
                  <Text style={[styles.detailBadgeText, { color: theme.primary, fontWeight: highContrast ? '900' : '900' }]}>
                    {surahNumber}:{verse.number}
                  </Text>
                </View>
                {Number.isFinite(verse.page) && verse.page > 0 && (
                  <Text style={[styles.detailPageText, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : 'normal' }]}>
                    Sayfa {verse.page}
                  </Text>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {typeof Clipboard?.setStringAsync === 'function' && (
                  <TouchableOpacity
                    onPress={handleCopy}
                    style={[styles.detailIconBtn, {
                      backgroundColor: highContrast ? '#121212' : theme.surface,
                      borderColor: highContrast ? '#FFFFFF' : theme.border,
                      borderWidth: highContrast ? 2 : 1,
                    }]}
                    hitSlop={6}
                    accessibilityLabel="Kopyala"
                  >
                    <Ionicons name="copy-outline" size={18} color={theme.text} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleShare}
                  style={[styles.detailIconBtn, {
                    backgroundColor: highContrast ? '#121212' : theme.surface,
                    borderColor: highContrast ? '#FFFFFF' : theme.border,
                    borderWidth: highContrast ? 2 : 1,
                  }]}
                  hitSlop={6}
                  accessibilityLabel="Paylaş"
                >
                  <Ionicons name="share-outline" size={18} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { haptic(); onClose?.(); }}
                  style={[styles.detailIconBtn, {
                    backgroundColor: highContrast ? '#121212' : theme.surface,
                    borderColor: highContrast ? '#FFFFFF' : theme.border,
                    borderWidth: highContrast ? 2 : 1,
                  }]}
                  hitSlop={6}
                  accessibilityLabel="Kapat"
                >
                  <Ionicons name="close" size={20} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.detailContent,
                { paddingBottom: 24 },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {!!verse.arabic && (
                <Text
                  style={[styles.detailArabic, {
                    color: theme.text,
                    fontSize: 28 * fontScale,
                    lineHeight: 50 * fontScale,
                    fontWeight: highContrast ? '900' : '500',
                  }]}
                >
                  {verse.arabic}
                </Text>
              )}

              {!!verse.latin && (
                <Text
                  style={[styles.detailLatin, {
                    color: theme.primary,
                    fontSize: 13 * fontScale,
                    lineHeight: 20 * fontScale,
                    fontWeight: highContrast ? '700' : '600',
                  }]}
                >
                  {verse.latin}
                </Text>
              )}

              {!!verse.translation && (
                <View
                  style={[styles.detailTranslationBox, {
                    backgroundColor: highContrast ? '#121212' : theme.surface,
                    borderColor: highContrast ? '#FFFFFF' : theme.border,
                    borderWidth: highContrast ? 2 : 1,
                  }]}
                >
                  <Text style={[styles.detailTranslationLabel, { color: theme.primary, fontWeight: highContrast ? '900' : '900' }]}>
                    MEAL
                  </Text>
                  <Text
                    style={[styles.detailTranslation, {
                      color: theme.text,
                      fontSize: 15 * fontScale,
                      lineHeight: 24 * fontScale,
                      fontWeight: highContrast ? '700' : '400',
                    }]}
                  >
                    {verse.translation}
                  </Text>
                </View>
              )}

              {Array.isArray(verse.footnotes) && verse.footnotes.length > 0 && (
                <View
                  style={[styles.detailFootnotesBox, {
                    backgroundColor: highContrast ? '#121212' : theme.surface,
                    borderColor: highContrast ? '#FFFFFF' : theme.border,
                    borderWidth: highContrast ? 2 : 1,
                  }]}
                >
                  <Text style={[styles.detailFootnotesLabel, { color: theme.primary, fontWeight: highContrast ? '900' : '900' }]}>
                    DİPNOTLAR
                  </Text>
                  {verse.footnotes.map((fn) => (
                    <Text
                      key={fn.id}
                      style={[styles.detailFootnote, {
                        color: highContrast ? '#E0E0E0' : theme.textDim,
                        fontSize: 11 * Math.min(fontScale, 1.4),
                        lineHeight: 16 * Math.min(fontScale, 1.4),
                        fontWeight: highContrast ? '700' : 'normal',
                      }]}
                    >
                      <Text style={{ color: theme.primary, fontWeight: '900' }}>
                        [{fn.number}]
                      </Text>{' '}
                      {fn.text}
                    </Text>
                  ))}
                </View>
              )}
            </ScrollView>

            <View
              style={[
                styles.detailToolbar,
                {
                  backgroundColor: highContrast ? '#121212' : theme.surface,
                  borderTopColor: highContrast ? '#FFFFFF' : theme.border,
                  borderTopWidth: highContrast ? 2 : StyleSheet.hairlineWidth,
                  paddingBottom: Math.max(12, insets.bottom + 4),
                },
              ]}
            >
              <View style={styles.detailFontControls}>
                <TouchableOpacity
                  onPress={decreaseFont}
                  disabled={fontScale <= 0.8}
                  style={[
                    styles.detailFontBtn,
                    {
                      backgroundColor: highContrast ? '#000000' : theme.background,
                      borderColor: highContrast ? '#FFFFFF' : theme.border,
                      borderWidth: highContrast ? 2 : 1,
                      opacity: fontScale <= 0.8 ? 0.4 : 1,
                    },
                  ]}
                  accessibilityLabel="Yazıyı küçült"
                >
                  <MaterialCommunityIcons
                    name="format-font-size-decrease"
                    size={20}
                    color={theme.primary}
                  />
                </TouchableOpacity>

                <Text style={[styles.detailFontValue, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '900' : '800' }]}>
                  {Math.round(fontScale * 100)}%
                </Text>

                <TouchableOpacity
                  onPress={increaseFont}
                  disabled={fontScale >= 2.2}
                  style={[
                    styles.detailFontBtn,
                    {
                      backgroundColor: highContrast ? '#000000' : theme.background,
                      borderColor: highContrast ? '#FFFFFF' : theme.border,
                      borderWidth: highContrast ? 2 : 1,
                      opacity: fontScale >= 2.2 ? 0.4 : 1,
                    },
                  ]}
                  accessibilityLabel="Yazıyı büyüt"
                >
                  <MaterialCommunityIcons
                    name="format-font-size-increase"
                    size={20}
                    color={theme.primary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleShare}
                style={[styles.detailPrimaryBtn, { backgroundColor: theme.primary, borderColor: highContrast ? '#000000' : 'transparent', borderWidth: highContrast ? 2 : 0 }]}
                accessibilityRole="button"
                accessibilityLabel="Paylaş"
              >
                <Ionicons name="share" size={16} color={highContrast ? '#000000' : (theme.onPrimary || '#FFF')} />
                <Text style={[styles.detailPrimaryBtnText, { color: highContrast ? '#000000' : (theme.onPrimary || '#FFF'), fontWeight: highContrast ? '900' : '900' }]}>
                  Paylaş
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
});

/* ================================================================
   Sayfa Mushaf Görünümü
   ================================================================ */
const PageMushafView = memo(function PageMushafView({
  verses, theme, fontScale, showMeal, showLatin, pageNumber, highContrast,
}) {
  const insets = useSafeAreaInsets();

  const arabicFontSize = Math.round(26 * fontScale);
  const arabicLineHeight = Math.round(arabicFontSize * 2.1);

  const arabicText = useMemo(
    () =>
      verses
        .map((v) => `${v.arabic} ۝${v.number}`)
        .join(' '),
    [verses],
  );

  return (
    <ScrollView
      contentContainerStyle={[
        styles.mushafContent,
        { paddingBottom: Math.max(28, insets.bottom + 24) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.mushafPageTop}>
        <View style={[styles.mushafPageBadge, {
          backgroundColor: highContrast ? '#121212' : theme.surface,
          borderColor: highContrast ? '#FFFFFF' : theme.border,
          borderWidth: highContrast ? 2 : 1,
        }]}>
          <Text style={[styles.mushafPageNum, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '900' : '900' }]}>
            SAYFA {pageNumber}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.mushafBox,
          {
            backgroundColor: highContrast ? '#121212' : theme.surface,
            borderColor: highContrast ? '#FFFFFF' : theme.border,
            borderWidth: highContrast ? 2 : 1,
          },
        ]}
      >
        <Text
          style={[
            styles.mushafArabic,
            {
              color: theme.text,
              fontSize: arabicFontSize,
              lineHeight: arabicLineHeight,
              fontWeight: highContrast ? '900' : '400',
            },
          ]}
        >
          {arabicText}
        </Text>
      </View>

      {(showMeal || showLatin) && (
        <View style={styles.mushafMealSection}>
          {verses.map((v) => (
            <View key={`meal-${v.id}`} style={styles.mushafMealRow}>
              <View
                style={[
                  styles.mushafMealNumBadge,
                  { backgroundColor: highContrast ? '#000000' : theme.primaryGlow, borderColor: highContrast ? '#FFFFFF' : 'transparent', borderWidth: highContrast ? 2 : 0 },
                ]}
              >
                <Text
                  style={[
                    styles.mushafMealNumText,
                    { color: theme.primary, fontWeight: highContrast ? '900' : '900' },
                  ]}
                >
                  {v.number}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                {showLatin && !!v.latin && (
                  <Text
                    style={[
                      styles.mushafLatin,
                      {
                        color: highContrast ? '#FFFF00' : theme.textDim,
                        fontSize: 11 * fontScale,
                        lineHeight: 15 * fontScale,
                        fontWeight: highContrast ? '700' : '600',
                      },
                    ]}
                  >
                    {v.latin}
                  </Text>
                )}
                {showMeal && !!v.translation && (
                  <Text
                    style={[
                      styles.mushafMealText,
                      {
                        color: theme.text,
                        fontSize: 13 * fontScale,
                        lineHeight: 20 * fontScale,
                        fontWeight: highContrast ? '700' : '400',
                      },
                    ]}
                  >
                    {v.translation}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
});

/* ================================================================
   Tek Ayet Okuma Görünümü
   ================================================================ */
const SingleAyahView = memo(function SingleAyahView({
  verse, theme, displayMode, fontScale, arabicSize,
  activeWordId, onWordPress, surahNumber, onVersePress, highContrast,
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      contentContainerStyle={[
        styles.singleAyahContainer,
        { paddingBottom: Math.max(120, insets.bottom + 90) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {displayMode === 'meal_only' ? (
        <MealOnlyVerse
          verse={verse}
          theme={theme}
          fontScale={fontScale}
          isLast={true}
          surahNumber={surahNumber}
          onVersePress={onVersePress}
          highContrast={highContrast}
        />
      ) : (
        <VerseCard
          verse={verse}
          theme={theme}
          displayMode={displayMode}
          fontScale={fontScale}
          arabicSize={arabicSize}
          activeWordId={activeWordId}
          onWordPress={onWordPress}
          isLast={true}
          surahNumber={surahNumber}
          onVersePress={onVersePress}
          highContrast={highContrast}
        />
      )}
    </ScrollView>
  );
});

/* ================================================================
   Tek Ayet Alt Navigasyon Barı
   ================================================================ */
const SingleAyahNavigation = memo(function SingleAyahNavigation({
  currentAyahIndex, totalAyahs, theme, insets, onPrev, onNext, isRTL, highContrast,
}) {
  if (totalAyahs <= 1) return null;

  const isFirst = currentAyahIndex <= 0;
  const isLast = currentAyahIndex >= totalAyahs - 1;

  const leftBtn = isRTL
    ? { label: 'Sonraki', icon: 'chevron-back', onPress: onNext, disabled: isLast }
    : { label: 'Önceki', icon: 'chevron-back', onPress: onPrev, disabled: isFirst };

  const rightBtn = isRTL
    ? { label: 'Önceki', icon: 'chevron-forward', onPress: onPrev, disabled: isFirst }
    : { label: 'Sonraki', icon: 'chevron-forward', onPress: onNext, disabled: isLast };

  return (
    <View style={[styles.pageNav, {
      backgroundColor: highContrast ? '#121212' : theme.surface,
      borderTopColor: highContrast ? '#FFFFFF' : theme.border,
      borderTopWidth: highContrast ? 2 : 1,
      paddingBottom: Math.max(12, insets.bottom + 4),
    }]}>
      <TouchableOpacity
        onPress={leftBtn.onPress}
        disabled={leftBtn.disabled}
        activeOpacity={0.7}
        style={[styles.pageNavBtn, { opacity: leftBtn.disabled ? 0.35 : 1 }]}
      >
        <Ionicons name={leftBtn.icon} size={22} color={theme.primary} />
        <Text style={[styles.pageNavBtnText, { color: theme.primary, fontWeight: highContrast ? '900' : '800' }]}>
          {leftBtn.label}
        </Text>
      </TouchableOpacity>

      <View style={styles.pageNavCenter}>
        <Text style={[styles.pageNavNum, { color: theme.text, fontWeight: highContrast ? '900' : '900' }]}>
          Ayet {currentAyahIndex + 1}
        </Text>
        <Text style={[styles.pageNavMeta, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : 'normal' }]}>
          {currentAyahIndex + 1} / {totalAyahs}
        </Text>
        <View style={styles.swipeHint}>
          <Ionicons name="swap-horizontal" size={10} color={highContrast ? '#E0E0E0' : theme.textMuted} />
          <Text style={[styles.swipeHintText, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : '600' }]}>
            {isRTL ? 'sağa kaydır = sonraki' : 'sola kaydır = sonraki'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={rightBtn.onPress}
        disabled={rightBtn.disabled}
        activeOpacity={0.7}
        style={[styles.pageNavBtn, styles.pageNavBtnRight, {
          opacity: rightBtn.disabled ? 0.35 : 1,
        }]}
      >
        <Text style={[styles.pageNavBtnText, { color: theme.primary, fontWeight: highContrast ? '900' : '800' }]}>
          {rightBtn.label}
        </Text>
        <Ionicons name={rightBtn.icon} size={22} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
});

/* ================================================================
   Aktif kelime paneli
   ================================================================ */
const ActiveWordPanel = memo(function ActiveWordPanel({ word, theme, onClose, highContrast }) {
  if (!word) return null;

  const verse = word.verse;
  const verseTranslation = verse?.translation;

  const handleCopy = async () => {
    try {
      if (Clipboard?.setStringAsync) {
        const parts = [word.arabic];
        if (word.transliteration) parts.push(word.transliteration);
        if (word.translationTR) parts.push(word.translationTR);
        if (verseTranslation) parts.push(`\n"${verseTranslation}"`);
        await Clipboard.setStringAsync(parts.join('\n'));
        haptic();
      }
    } catch {}
  };

  return (
    <View style={[styles.activePanel, {
      backgroundColor: highContrast ? '#121212' : theme.surface,
      borderTopColor: highContrast ? '#FFFFFF' : theme.border,
      borderTopWidth: highContrast ? 2 : 1,
    }]}>
      <View style={styles.activePanelRow}>
        <Text style={[styles.activeArabic, { color: theme.text, fontWeight: highContrast ? '900' : '600' }]}>
          {word.arabic}
        </Text>
        <View style={{ flex: 1, marginLeft: 14 }}>
          {!!word.transliteration && (
            <Text style={[styles.activeTranslit, { color: theme.primary, fontWeight: highContrast ? '900' : '700' }]}>
              {word.transliteration}
            </Text>
          )}
          {!!word.translationTR && (
            <Text style={[styles.activeTranslation, { color: theme.text, fontWeight: highContrast ? '700' : '600' }]}>
              {word.translationTR}
            </Text>
          )}
        </View>
        {typeof Clipboard?.setStringAsync === 'function' && (
          <TouchableOpacity
            onPress={handleCopy}
            hitSlop={10}
            style={{ marginRight: 8 }}
            accessibilityLabel="Kopyala"
          >
            <Ionicons name="copy-outline" size={20} color={highContrast ? '#FFFFFF' : theme.textMuted} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => { haptic(); onClose(); }}
          hitSlop={10}
          accessibilityLabel="Kapat"
        >
          <Ionicons name="close-circle" size={22} color={highContrast ? '#FFFFFF' : theme.textMuted} />
        </TouchableOpacity>
      </View>

      {!!verseTranslation && (
        <View style={[styles.activeVerseContext, { borderTopColor: highContrast ? '#FFFFFF' : theme.border, borderTopWidth: highContrast ? 2 : StyleSheet.hairlineWidth }]}>
          <Text style={[styles.activeVerseLabel, { color: theme.primary, fontWeight: highContrast ? '900' : '900' }]}>
            {verse?.verseKey ? `${verse.verseKey} · AYET MEALİ` : 'AYET MEALİ'}
          </Text>
          <Text
            style={[styles.activeVerseText, { color: highContrast ? '#E0E0E0' : theme.textDim, fontWeight: highContrast ? '700' : 'normal' }]}
            numberOfLines={4}
          >
            {verseTranslation}
          </Text>
        </View>
      )}
    </View>
  );
});

/* ================================================================
   Sayfa Navigasyonu
   ================================================================ */
const PageNavigation = memo(function PageNavigation({
  currentPageIndex, totalPages, pageNumber, theme, insets, onPrev, onNext, isRTL, highContrast,
}) {
  if (totalPages <= 1) return null;

  const isFirst = currentPageIndex <= 0;
  const isLast = currentPageIndex >= totalPages - 1;

  const leftBtn = isRTL
    ? {
        label: 'Sonraki',
        icon: 'chevron-back',
        onPress: onNext,
        disabled: isLast,
        hint: 'Sağa kaydırarak da geçebilirsiniz',
      }
    : {
        label: 'Önceki',
        icon: 'chevron-back',
        onPress: onPrev,
        disabled: isFirst,
        hint: 'Sağa kaydırarak da geçebilirsiniz',
      };

  const rightBtn = isRTL
    ? {
        label: 'Önceki',
        icon: 'chevron-forward',
        onPress: onPrev,
        disabled: isFirst,
        hint: 'Sola kaydırarak da geçebilirsiniz',
      }
    : {
        label: 'Sonraki',
        icon: 'chevron-forward',
        onPress: onNext,
        disabled: isLast,
        hint: 'Sola kaydırarak da geçebilirsiniz',
      };

  return (
    <View style={[styles.pageNav, {
      backgroundColor: highContrast ? '#121212' : theme.surface,
      borderTopColor: highContrast ? '#FFFFFF' : theme.border,
      borderTopWidth: highContrast ? 2 : 1,
      paddingBottom: Math.max(12, insets.bottom + 4),
    }]}>
      <TouchableOpacity
        onPress={leftBtn.onPress}
        disabled={leftBtn.disabled}
        activeOpacity={0.7}
        style={[styles.pageNavBtn, { opacity: leftBtn.disabled ? 0.35 : 1 }]}
        accessibilityLabel={`${leftBtn.label} sayfa`}
        accessibilityHint={leftBtn.hint}
        accessibilityState={{ disabled: leftBtn.disabled }}
      >
        <Ionicons name={leftBtn.icon} size={22} color={theme.primary} />
        <Text style={[styles.pageNavBtnText, { color: theme.primary, fontWeight: highContrast ? '900' : '800' }]}>
          {leftBtn.label}
        </Text>
      </TouchableOpacity>

      <View style={styles.pageNavCenter}>
        <Text style={[styles.pageNavNum, { color: theme.text, fontWeight: highContrast ? '900' : '900' }]}>
          Sayfa {pageNumber}
        </Text>
        <Text style={[styles.pageNavMeta, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : 'normal' }]}>
          {currentPageIndex + 1} / {totalPages}
        </Text>
        <View style={styles.swipeHint}>
          <Ionicons name="swap-horizontal" size={10} color={highContrast ? '#E0E0E0' : theme.textMuted} />
          <Text style={[styles.swipeHintText, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : '600' }]}>
            {isRTL ? 'sağa kaydır = sonraki' : 'sola kaydır = sonraki'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={rightBtn.onPress}
        disabled={rightBtn.disabled}
        activeOpacity={0.7}
        style={[styles.pageNavBtn, styles.pageNavBtnRight, {
          opacity: rightBtn.disabled ? 0.35 : 1,
        }]}
        accessibilityLabel={`${rightBtn.label} sayfa`}
        accessibilityHint={rightBtn.hint}
        accessibilityState={{ disabled: rightBtn.disabled }}
      >
        <Text style={[styles.pageNavBtnText, { color: theme.primary, fontWeight: highContrast ? '900' : '800' }]}>
          {rightBtn.label}
        </Text>
        <Ionicons name={rightBtn.icon} size={22} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
});

/* ================================================================
   Pinch Zoom göstergesi
   ================================================================ */
const PinchIndicator = memo(function PinchIndicator({ scale, theme, highContrast }) {
  if (scale === null) return null;
  const percent = Math.round(scale * 100);
  return (
    <View style={styles.pinchOverlay} pointerEvents="none">
      <View style={[styles.pinchBubble, {
        backgroundColor: highContrast ? '#121212' : theme.surface,
        borderColor: highContrast ? '#FFFFFF' : theme.border,
        borderWidth: highContrast ? 2 : 1,
      }]}>
        <MaterialCommunityIcons
          name="format-font-size-increase"
          size={18}
          color={theme.primary}
        />
        <Text style={[styles.pinchBubbleText, { color: theme.text, fontWeight: highContrast ? '900' : '900' }]}>
          {percent}%
        </Text>
      </View>
    </View>
  );
});

/* ================================================================
   Kaynak küçük çipi
   ================================================================ */
const SourceMiniChip = memo(function SourceMiniChip({ sourceInfo, theme, highContrast }) {
  if (highContrast) {
    return (
      <View style={[styles.miniChip, { backgroundColor: '#1E1E1E', borderColor: '#FFFFFF', borderWidth: 1 }]}>
        <View style={[styles.miniChipDot, { backgroundColor: '#FFFF00' }]} />
        <Text style={[styles.miniChipText, { color: '#FFFF00', fontWeight: '900' }]}>ÇEVRİMDIŞI</Text>
      </View>
    );
  }
  if (sourceInfo.id === 'offline') {
    return (
      <View style={[styles.miniChip, { backgroundColor: 'rgba(34,197,94,0.15)' }]}>
        <View style={[styles.miniChipDot, { backgroundColor: '#16A34A' }]} />
        <Text style={[styles.miniChipText, { color: '#16A34A' }]}>ÇEVRİMDIŞI</Text>
      </View>
    );
  }
  if (sourceInfo.id === 'diyanet') {
    return (
      <View style={[styles.miniChip, { backgroundColor: 'rgba(234,179,8,0.15)' }]}>
        <View style={[styles.miniChipDot, { backgroundColor: '#CA8A04' }]} />
        <Text style={[styles.miniChipText, { color: '#CA8A04' }]}>BETA</Text>
      </View>
    );
  }
  if (sourceInfo.id === 'acikkuran') {
    return (
      <View style={[styles.miniChip, { backgroundColor: 'rgba(139,127,212,0.15)' }]}>
        <View style={[styles.miniChipDot, { backgroundColor: '#8B7FD4' }]} />
        <Text style={[styles.miniChipText, { color: '#8B7FD4' }]}>AÇIK</Text>
      </View>
    );
  }
  if (sourceInfo.id === 'apacik') {
    return (
      <View style={[styles.miniChip, { backgroundColor: 'rgba(107,114,128,0.15)' }]}>
        <View style={[styles.miniChipDot, { backgroundColor: theme.textMuted }]} />
        <Text style={[styles.miniChipText, { color: theme.textMuted }]}>APAÇIK</Text>
      </View>
    );
  }
  return (
    <View style={[styles.miniChip, { backgroundColor: 'rgba(59,130,246,0.15)' }]}>
      <View style={[styles.miniChipDot, { backgroundColor: '#3B82F6' }]} />
      <Text style={[styles.miniChipText, { color: '#3B82F6' }]}>İNTERNETLİ</Text>
    </View>
  );
});

/* ================================================================
   Sure seçici modal
   ================================================================ */
const SurahPickerModal = memo(function SurahPickerModal({
  visible, theme, currentSurah, onSelect, onClose, highContrast,
}) {
  const [query, setQuery] = useState('');
  const [filterId, setFilterId] = useState('all');
  const [sortId, setSortId] = useState('mushaf');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [recentList, setRecentList] = useState([]);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const list = await getRecentSurahs();
      setRecentList(list);
    })();
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setQuery('');
      setFilterId('all');
      setSortId('mushaf');
      setSortMenuVisible(false);
    }
  }, [visible]);

  const recentItems = useMemo(() => {
    if (recentList.length === 0) return [];
    const items = [];
    const seen = new Set();
    for (const r of recentList) {
      if (seen.has(r.n)) continue;
      const info = QURAN_SURAHS.find((s) => s.number === r.n);
      if (info) {
        items.push({ ...info, _lastReadAt: r.t });
        seen.add(r.n);
      }
      if (items.length >= 4) break;
    }
    return items;
  }, [recentList]);

  const processed = useMemo(() => {
    const q = String(query ?? '').trim().toLocaleLowerCase('tr-TR');
    let arr = QURAN_SURAHS;

    if (filterId === 'short') arr = arr.filter((s) => s.ayahCount <= 20);
    else if (filterId === 'medium') arr = arr.filter((s) => s.ayahCount > 20 && s.ayahCount <= 80);
    else if (filterId === 'long') arr = arr.filter((s) => s.ayahCount > 80);
    else if (filterId === 'meccan') arr = arr.filter((s) => s.revelation === 'Mekke');
    else if (filterId === 'medinan') arr = arr.filter((s) => s.revelation === 'Medine');

    if (q) {
      arr = arr.filter(
        (s) =>
          s.name.toLocaleLowerCase('tr-TR').includes(q) ||
          String(s.number) === q ||
          String(s.number).padStart(3, '0') === q,
      );
    }

    if (sortId === 'length_desc') arr = [...arr].sort((a, b) => b.ayahCount - a.ayahCount);
    else if (sortId === 'length_asc') arr = [...arr].sort((a, b) => a.ayahCount - b.ayahCount);

    return arr;
  }, [query, filterId, sortId]);

  const handleFilterPress = useCallback((id) => {
    haptic();
    setFilterId(id);
    setSortMenuVisible(false);
  }, []);

  const handleSortPress = useCallback((id) => {
    haptic();
    setSortId(id);
    setSortMenuVisible(false);
  }, []);

  const showRecentSection =
    recentItems.length > 0 &&
    !query &&
    filterId === 'all' &&
    sortId === 'mushaf';

  const renderSurah = useCallback(
    ({ item }) => {
      const isCurrent = currentSurah === item.number;
      const lenColor = getLengthColor(item.ayahCount, highContrast);
      return (
        <TouchableOpacity
          onPress={() => { haptic(); onSelect(item.number); }}
          style={[
            styles.surahRow,
            { borderBottomColor: highContrast ? '#333333' : theme.border, borderBottomWidth: highContrast ? 1 : StyleSheet.hairlineWidth },
            isCurrent && { backgroundColor: highContrast ? '#1E1E1E' : theme.primaryGlow, borderColor: theme.primary, borderWidth: highContrast ? 2 : 0 },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`${item.name}, ${item.ayahCount} ayet, ${item.revelation}`}
          accessibilityState={{ selected: isCurrent }}
        >
          <View
            style={[
              styles.surahNumBadge,
              {
                backgroundColor: isCurrent ? theme.primary : (highContrast ? '#000000' : `${lenColor}22`),
                borderColor: isCurrent ? (highContrast ? '#000000' : theme.primary) : lenColor,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.surahNumText,
                { color: isCurrent ? (highContrast ? '#000000' : (theme.onPrimary || '#FFF')) : lenColor, fontWeight: highContrast ? '900' : '900' },
              ]}
            >
              {item.number}
            </Text>
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={[styles.surahName, { color: theme.text, fontWeight: highContrast ? '900' : '800' }]} numberOfLines={1}>
                {item.name}
              </Text>
              {isCurrent && (
                <View style={[styles.activePill, { backgroundColor: theme.primaryGlow }]}>
                  <Text style={{ color: theme.primary, fontSize: 9, fontWeight: '900' }}>
                    AKTİF
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.surahMeta, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : '600' }]}>
              {item.ayahCount} ayet · {item.revelation}
            </Text>
          </View>

          <Ionicons
            name={isCurrent ? 'checkmark-circle' : 'chevron-forward'}
            size={isCurrent ? 20 : 16}
            color={isCurrent ? theme.primary : (highContrast ? '#FFFFFF' : theme.textDim)}
          />
        </TouchableOpacity>
      );
    },
    [currentSurah, theme, onSelect, highContrast],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalSheet,
            {
              backgroundColor: highContrast ? '#121212' : theme.surface,
              borderColor: highContrast ? '#FFFFFF' : theme.border,
              borderWidth: highContrast ? 2 : 1,
              paddingBottom: Math.max(16, insets.bottom + 16),
              height: '92%',
            },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: highContrast ? '#FFFFFF' : theme.border }]} />

          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text, flex: 1, fontWeight: highContrast ? '900' : '900' }]}>
              Sure Seç
            </Text>
            <Text style={{ color: highContrast ? '#E0E0E0' : theme.textMuted, fontSize: 12, marginRight: 10, fontWeight: highContrast ? '900' : '700' }}>
              {processed.length}/{QURAN_SURAHS.length}
            </Text>
            <TouchableOpacity
              onPress={() => { haptic(); onClose(); }}
              hitSlop={12}
              accessibilityLabel="Kapat"
            >
              <Ionicons name="close" size={24} color={highContrast ? '#FFFFFF' : theme.textMuted} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.pickerSearchBox,
              { backgroundColor: highContrast ? '#000000' : theme.background, borderColor: highContrast ? '#FFFFFF' : theme.border, borderWidth: highContrast ? 2 : 1, marginBottom: 8 },
            ]}
          >
            <Ionicons name="search" size={16} color={highContrast ? '#FFFFFF' : theme.textMuted} />
            <TextInput
              style={[styles.pickerSearchInput, { color: theme.text, fontWeight: highContrast ? '700' : 'normal' }]}
              placeholder="Sure adı veya numara…"
              placeholderTextColor={highContrast ? '#A0A0A0' : theme.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              returnKeyType="search"
            />
            {!!query && (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={highContrast ? '#FFFFFF' : theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <View style={{ marginBottom: 8 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingRight: 4 }}
            >
              {SURAH_FILTERS.map((f) => {
                const isActive = filterId === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => handleFilterPress(f.id)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isActive ? theme.primary : (highContrast ? '#000000' : theme.background),
                        borderColor: isActive ? theme.primary : (highContrast ? '#FFFFFF' : theme.border),
                        borderWidth: highContrast ? 2 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={{
                      color: isActive ? (highContrast ? '#000000' : (theme.onPrimary || '#FFF')) : (highContrast ? '#FFFFFF' : theme.textDim),
                      fontSize: 11, fontWeight: highContrast ? '900' : '800',
                    }}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => { haptic(); setSortMenuVisible((v) => !v); }}
              style={[styles.sortBtn, { borderColor: highContrast ? '#FFFFFF' : theme.border, backgroundColor: highContrast ? '#000000' : theme.background, borderWidth: highContrast ? 2 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel="Sıralama seçenekleri"
            >
              <Ionicons name="swap-vertical" size={12} color={theme.primary} />
              <Text style={{ color: theme.text, fontSize: 11, fontWeight: highContrast ? '900' : '700', marginLeft: 4 }}>
                {SURAH_SORTS.find((s) => s.id === sortId)?.label || 'Sıralama'}
              </Text>
              <Ionicons
                name={sortMenuVisible ? 'chevron-up' : 'chevron-down'}
                size={12}
                color={highContrast ? '#FFFFFF' : theme.textMuted}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>

          {sortMenuVisible && (
            <View style={[styles.sortMenu, {
              backgroundColor: highContrast ? '#000000' : theme.background, borderColor: highContrast ? '#FFFFFF' : theme.border, borderWidth: highContrast ? 2 : 1,
            }]}>
              {SURAH_SORTS.map((s) => {
                const isActive = sortId === s.id;
                return (
                  <TouchableOpacity
                    key={s.id}
                    onPress={() => handleSortPress(s.id)}
                    style={[
                      styles.sortMenuItem,
                      isActive && { backgroundColor: theme.primaryGlow },
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text style={{
                      color: isActive ? theme.primary : theme.text,
                      fontSize: 12, fontWeight: highContrast ? '900' : (isActive ? '800' : '600'),
                    }}>
                      {s.label}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={14} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {showRecentSection && (
            <View style={{ marginBottom: 10 }}>
              <View style={styles.recentHeader}>
                <Ionicons name="time-outline" size={10} color={highContrast ? '#FFFFFF' : theme.textMuted} />
                <Text style={[styles.recentHeaderText, { color: highContrast ? '#FFFFFF' : theme.textMuted, fontWeight: highContrast ? '900' : '800' }]}>
                  SON OKUNANLAR
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, paddingRight: 20 }}
              >
                {recentItems.map((item) => {
                  const lenColor = getLengthColor(item.ayahCount, highContrast);
                  const isCurrent = currentSurah === item.number;

                  return (
                    <TouchableOpacity
                      key={item.number}
                      onPress={() => { haptic(); onSelect(item.number); }}
                      activeOpacity={0.75}
                      style={[
                        styles.recentChip,
                        {
                          backgroundColor: isCurrent ? theme.primary : (highContrast ? '#000000' : theme.background),
                          borderColor: isCurrent ? theme.primary : (highContrast ? '#FFFFFF' : theme.border),
                          borderWidth: highContrast ? 2 : 1,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name}, ${item.ayahCount} ayet`}
                      accessibilityState={{ selected: isCurrent }}
                    >
                      <View
                        style={[
                          styles.recentChipDot,
                          {
                            backgroundColor: isCurrent
                              ? (highContrast ? '#000000' : 'rgba(255,255,255,0.7)')
                              : lenColor,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.recentChipNum,
                          {
                            color: isCurrent
                              ? (highContrast ? '#000000' : 'rgba(255,255,255,0.75)')
                              : (highContrast ? '#E0E0E0' : theme.textMuted),
                            fontWeight: highContrast ? '900' : '900',
                          },
                        ]}
                      >
                        {item.number}
                      </Text>
                      <Text
                        style={[
                          styles.recentChipName,
                          { color: isCurrent ? (highContrast ? '#000000' : '#FFF') : theme.text, fontWeight: highContrast ? '900' : '800' },
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <FlatList
            data={processed}
            keyExtractor={(s) => String(s.number)}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            windowSize={11}
            renderItem={renderSurah}
            ListEmptyComponent={
              <View style={{ paddingVertical: 40, alignItems: 'center', gap: 10 }}>
                <Ionicons name="search-outline" size={32} color={highContrast ? '#FFFFFF' : theme.textMuted} />
                <Text style={{ color: highContrast ? '#FFFFFF' : theme.textMuted, fontSize: 13, fontWeight: highContrast ? '700' : 'normal' }}>
                  Sonuç bulunamadı
                </Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   Sure / Ayet Bul Modalı
   ================================================================ */
const AyahJumpModal = memo(function AyahJumpModal({
  visible, theme, currentSurah, currentAyah, onJump, onClose, highContrast,
}) {
  const [surahInput, setSurahInput] = useState(String(currentSurah));
  const [ayahInput, setAyahInput] = useState('');
  const ayahInputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setSurahInput(String(currentSurah));
      setAyahInput(String(currentAyah));
    }
  }, [visible, currentSurah, currentAyah]);

  const targetSurahInfo = useMemo(() => {
    const clean = String(surahInput).replace(/[^0-9]/g, '');
    const n = Number(clean);
    if (!clean || !Number.isFinite(n) || n < 1 || n > 114) return null;
    return getSurahByNumber(n);
  }, [surahInput]);

  const handleSurahChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '');
    setSurahInput(clean);
    const num = Number(clean);
    if (clean.length === 3 || (num >= 12 && num <= 114 && clean.length >= 2)) {
      const info = getSurahByNumber(num);
      if (info && Number(ayahInput) > info.ayahCount) {
        setAyahInput('1');
      }
      ayahInputRef.current?.focus?.();
    }
  };

  const handleAyahChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '');
    setAyahInput(clean);
  };

  const handleJump = () => {
    const sNum = Number(String(surahInput).trim());
    const aNum = Number(String(ayahInput).trim() || '1');

    if (!Number.isFinite(sNum) || sNum < 1 || sNum > 114) {
      haptic('heavy');
      Alert.alert('Geçersiz Sure', 'Lütfen 1 ile 114 arasında bir sure numarası girin.');
      return;
    }

    const sInfo = getSurahByNumber(sNum);
    const maxAyah = sInfo?.ayahCount ?? 286;

    if (!Number.isFinite(aNum) || aNum < 1 || aNum > maxAyah) {
      haptic('heavy');
      Alert.alert('Geçersiz Ayet', `${sInfo?.name || 'Bu surede'} 1 ile ${maxAyah} arasında ayet bulunmaktadır.`);
      return;
    }

    haptic('medium');
    onClose();
    onJump(sNum, aNum);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.jumpOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.jumpCard, {
          backgroundColor: highContrast ? '#121212' : theme.surface, borderColor: highContrast ? '#FFFFFF' : theme.border, borderWidth: highContrast ? 2 : 1,
        }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
            <Ionicons name="compass-outline" size={20} color={theme.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.jumpTitle, { color: theme.text, flex: 1, fontWeight: highContrast ? '900' : '900' }]}>
              Sure / Ayet Bul
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={highContrast ? '#FFFFFF' : theme.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.jumpSub, { color: highContrast ? '#E0E0E0' : theme.textDim, marginBottom: 14, fontWeight: highContrast ? '700' : 'normal' }]}>
            Gitmek istediğiniz sure numarasını ve ayeti yazın.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: highContrast ? '#FFFFFF' : theme.textMuted, fontSize: 11, fontWeight: highContrast ? '900' : '700', marginBottom: 4 }}>
                SURE (1-114)
              </Text>
              <TextInput
                style={[styles.jumpInput, {
                  color: theme.text, borderColor: highContrast ? '#FFFFFF' : theme.border,
                  backgroundColor: highContrast ? '#000000' : theme.background,
                  borderWidth: highContrast ? 2 : 1,
                  fontWeight: highContrast ? '900' : '700',
                }]}
                keyboardType="number-pad"
                placeholder="1-114"
                placeholderTextColor={highContrast ? '#A0A0A0' : theme.textMuted}
                value={surahInput}
                onChangeText={handleSurahChange}
                selectTextOnFocus
                maxLength={3}
                returnKeyType="next"
                onSubmitEditing={() => ayahInputRef.current?.focus?.()}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: highContrast ? '#FFFFFF' : theme.textMuted, fontSize: 11, fontWeight: highContrast ? '900' : '700', marginBottom: 4 }}>
                AYET {targetSurahInfo ? `(1-${targetSurahInfo.ayahCount})` : ''}
              </Text>
              <TextInput
                ref={ayahInputRef}
                style={[styles.jumpInput, {
                  color: theme.text, borderColor: highContrast ? '#FFFFFF' : theme.border,
                  backgroundColor: highContrast ? '#000000' : theme.background,
                  borderWidth: highContrast ? 2 : 1,
                  fontWeight: highContrast ? '900' : '700',
                }]}
                keyboardType="number-pad"
                placeholder="Ayet No"
                placeholderTextColor={highContrast ? '#A0A0A0' : theme.textMuted}
                value={ayahInput}
                onChangeText={handleAyahChange}
                selectTextOnFocus
                maxLength={3}
                returnKeyType="go"
                onSubmitEditing={handleJump}
              />
            </View>
          </View>

          {targetSurahInfo ? (
            <View style={[styles.jumpTargetPreview, { backgroundColor: highContrast ? '#000000' : theme.background, borderColor: highContrast ? '#FFFFFF' : theme.border, borderWidth: highContrast ? 2 : 1 }]}>
              <Text style={{ color: theme.primary, fontSize: 12, fontWeight: highContrast ? '900' : '800' }}>
                {targetSurahInfo.number}. {targetSurahInfo.name} ({targetSurahInfo.ayahCount} Ayet)
              </Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={() => { haptic(); setAyahInput('1'); }}
                  style={[styles.jumpEdgeChip, { borderColor: highContrast ? '#FFFFFF' : theme.border }]}
                >
                  <Text style={{ color: theme.textDim, fontSize: 10, fontWeight: '700' }}>İlk Ayet (1)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { haptic(); setAyahInput(String(targetSurahInfo.ayahCount)); }}
                  style={[styles.jumpEdgeChip, { borderColor: highContrast ? '#FFFFFF' : theme.border }]}
                >
                  <Text style={{ color: theme.textDim, fontSize: 10, fontWeight: '700' }}>Son Ayet ({targetSurahInfo.ayahCount})</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={[styles.jumpTargetPreview, { backgroundColor: highContrast ? '#000000' : theme.background, borderColor: '#EF4444', borderWidth: 1 }]}>
              <Text style={{ color: '#EF4444', fontSize: 11, fontWeight: '700' }}>
                1 ile 114 arasında geçerli bir sure numarası girin
              </Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 2 }}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.jumpBtn, { borderColor: highContrast ? '#FFFFFF' : theme.border, borderWidth: highContrast ? 2 : 1, flex: 1, backgroundColor: highContrast ? '#000000' : 'transparent' }]}
            >
              <Text style={{ color: highContrast ? '#FFFFFF' : theme.textDim, fontWeight: highContrast ? '900' : '800' }}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleJump}
              style={[styles.jumpBtn, {
                backgroundColor: theme.primary, borderColor: highContrast ? '#000000' : theme.primary, borderWidth: highContrast ? 2 : 0, flex: 1,
              }]}
            >
              <Text style={{ color: highContrast ? '#000000' : (theme.onPrimary || '#FFF'), fontWeight: highContrast ? '900' : '800' }}>
                Git
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   Ana ekran
   ================================================================ */
export default function QuranReaderScreen({ onBack, initialSurah = 1, initialAyah = 1 }) {
  const getTheme = useAppStore((s) => s.getTheme);
  const quranSource = useAppStore((s) => s.quranSource ?? 'offline');
  const diyanetApiKey = useAppStore((s) => s.diyanetKuranApiKey) ?? '';
  const rawTheme = getTheme();
  const rawHighContrast = useAppStore((s) => s.highContrast);

  const highContrast = Boolean(rawHighContrast);

  const theme = useMemo(() => {
    if (!highContrast) return rawTheme;
    return {
      ...rawTheme,
      background: '#000000',
      surface: '#121212',
      surfaceElevated: '#1E1E1E',
      text: '#FFFFFF',
      textDim: '#E0E0E0',
      textMuted: '#CCCCCC',
      border: '#FFFFFF',
      primary: '#FFFF00',
      primaryGlow: 'rgba(255, 255, 0, 0.3)',
      onPrimary: '#000000',
    };
  }, [rawTheme, highContrast]);

  const insets = useSafeAreaInsets();

  const sourceInfo = useMemo(() => getSourceInfo(quranSource), [quranSource]);

  const [surahNumber, setSurahNumber] = useState(initialSurah);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [jumpVisible, setJumpVisible] = useState(false);
  const [activeWord, setActiveWord] = useState(null);
  const [detailVerse, setDetailVerse] = useState(null);
  const [displayMode, setDisplayMode] = useState('arabic_meal');
  const [layoutMode, setLayoutMode] = useState('scroll'); // 'scroll' | 'page' | 'single_ayah'
  const [fontSizeId, setFontSizeId] = useState('normal');
  const [fontSizeSheetVisible, setFontSizeSheetVisible] = useState(false);
  const [currentAyahVisible, setCurrentAyahVisible] = useState(initialAyah);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [singleAyahIndex, setSingleAyahIndex] = useState(Math.max(0, initialAyah - 1));
  const [listInitialRenderCount, setListInitialRenderCount] = useState(
    initialAyah > 1 ? initialAyah + 3 : 10,
  );

  const [pinchLiveScale, setPinchLiveScale] = useState(null);
  const pinchBaseScaleRef = useRef(1);
  const pinchCurrentScaleRef = useRef(1);

  const flatListRef = useRef(null);
  const abortRef = useRef(null);
  const pendingTargetAyahRef = useRef(initialAyah > 1 ? initialAyah : null);
  const isJumpingRef = useRef(false);
  const jumpUnlockTimerRef = useRef(null);
  const scrollRetryCountRef = useRef(0);

  const surahInfo = useMemo(() => getSurahByNumber(surahNumber), [surahNumber]);

  const fontConfig = useMemo(
    () => FONT_SIZES.find((f) => f.id === fontSizeId) || FONT_SIZES[1],
    [fontSizeId],
  );

  const activeScale = pinchLiveScale !== null ? pinchLiveScale : fontConfig.scale;
  const activeArabicSize = pinchLiveScale !== null
    ? Math.round(fontConfig.arabic * (pinchLiveScale / fontConfig.scale))
    : fontConfig.arabic;

  const fontConfigRef = useRef(fontConfig);
  useEffect(() => { fontConfigRef.current = fontConfig; }, [fontConfig]);

  /* ---------------- Pinch gesture ---------------- */
  const pinchGesture = useMemo(() => {
    return Gesture.Pinch()
      .runOnJS(true)
      .onStart(() => {
        const base = fontConfigRef.current.scale;
        pinchBaseScaleRef.current = base;
        pinchCurrentScaleRef.current = base;
      })
      .onUpdate((e) => {
        const target = pinchBaseScaleRef.current * e.scale;
        const clamped = Math.max(MIN_PINCH_SCALE, Math.min(MAX_PINCH_SCALE, target));
        pinchCurrentScaleRef.current = clamped;
        setPinchLiveScale(clamped);
      })
      .onEnd(() => {
        const final = pinchCurrentScaleRef.current;
        let nearest = FONT_SIZES[0];
        let minDiff = Infinity;
        for (const fs of FONT_SIZES) {
          const diff = Math.abs(fs.scale - final);
          if (diff < minDiff) { minDiff = diff; nearest = fs; }
        }
        setFontSizeId(nearest.id);
        setPinchLiveScale(null);
        haptic('light');
      });
  }, []);

  /* ---------------- Swipe gesture (Sayfa & Tek Ayet Modu) ---------------- */
  const pagesDataLengthRef = useRef(0);
  const versesDataLengthRef = useRef(0);

  useEffect(() => {
    versesDataLengthRef.current = verses.length;
  }, [verses.length]);

  const swipeGesture = useMemo(() => {
    const isHorizontalSwipe = layoutMode === 'page' || layoutMode === 'single_ayah';
    const isRTL = isHorizontalSwipe && displayMode !== 'meal_only';

    return Gesture.Pan()
      .enabled(isHorizontalSwipe)
      .runOnJS(true)
      .activeOffsetX([-15, 15])
      .failOffsetY([-12, 12])
      .onEnd((e) => {
        const { translationX, velocityX } = e;
        const isFast = Math.abs(velocityX) > 400;
        const isLong = Math.abs(translationX) > 55;
        if (!isFast && !isLong) return;

        let goNext = false;
        if (isRTL) {
          goNext = translationX > 0;
        } else {
          goNext = translationX < 0;
        }

        if (layoutMode === 'page') {
          if (goNext) {
            if (currentPageIndex < pagesDataLengthRef.current - 1) {
              haptic('medium');
              setCurrentPageIndex((i) => Math.min(pagesDataLengthRef.current - 1, i + 1));
            } else haptic('light');
          } else {
            if (currentPageIndex > 0) {
              haptic('medium');
              setCurrentPageIndex((i) => Math.max(0, i - 1));
            } else haptic('light');
          }
        } else if (layoutMode === 'single_ayah') {
          if (goNext) {
            if (singleAyahIndex < versesDataLengthRef.current - 1) {
              haptic('medium');
              setSingleAyahIndex((i) => {
                const next = i + 1;
                setCurrentAyahVisible(verses[next]?.number || next + 1);
                saveLastPosition(surahNumber, verses[next]?.number || next + 1);
                return next;
              });
            } else haptic('light');
          } else {
            if (singleAyahIndex > 0) {
              haptic('medium');
              setSingleAyahIndex((i) => {
                const prev = i - 1;
                setCurrentAyahVisible(verses[prev]?.number || prev + 1);
                saveLastPosition(surahNumber, verses[prev]?.number || prev + 1);
                return prev;
              });
            } else haptic('light');
          }
        }
      });
  }, [layoutMode, displayMode, currentPageIndex, singleAyahIndex, verses, surahNumber]);

  const combinedGesture = useMemo(
    () => Gesture.Simultaneous(pinchGesture, swipeGesture),
    [pinchGesture, swipeGesture],
  );

  /* ---------------- Sayfa gruplama ---------------- */
  const pagesData = useMemo(() => {
    if (!Array.isArray(verses) || verses.length === 0) return [];

    const hasRealPageData = verses.some((v) => Number.isFinite(v.page));

    if (hasRealPageData) {
      const map = new Map();
      verses.forEach((v) => {
        const p = Number(v.page) || 1;
        if (!map.has(p)) map.set(p, []);
        map.get(p).push(v);
      });
      return Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([pageNumber, items]) => ({ pageNumber, verses: items }));
    }

    const startPage = SURAH_START_PAGE[surahNumber] || 1;
    const nextStart = SURAH_START_PAGE[surahNumber + 1] || 605;
    const pageSpan = Math.max(1, nextStart - startPage);
    const perPage = Math.ceil(verses.length / pageSpan);
    if (perPage <= 0) return [{ pageNumber: startPage, verses }];

    const pages = [];
    for (let i = 0; i < verses.length; i += perPage) {
      pages.push({
        pageNumber: startPage + Math.floor(i / perPage),
        verses: verses.slice(i, i + perPage),
      });
    }
    return pages;
  }, [verses, surahNumber]);

  useEffect(() => { pagesDataLengthRef.current = pagesData.length; }, [pagesData.length]);

  const currentPage = pagesData[currentPageIndex] || null;
  const currentSingleVerse = verses[singleAyahIndex] || null;

  const displayedVerses = layoutMode === 'page' && currentPage
    ? currentPage.verses
    : verses;

  const availableModes = useMemo(
    () => DISPLAY_MODES.filter((m) => {
      if (m.id === 'wbw') return sourceInfo.wordByWord;
      if (m.id === 'arabic_full') return sourceInfo.latin;
      return true;
    }),
    [sourceInfo.wordByWord, sourceInfo.latin],
  );

  /* ---------------- Yardımcı: Güvenli Ayete Konumlanma ---------------- */
  const lockJumpingTemporarily = useCallback((durationMs = 1500) => {
    isJumpingRef.current = true;
    if (jumpUnlockTimerRef.current) clearTimeout(jumpUnlockTimerRef.current);
    jumpUnlockTimerRef.current = setTimeout(() => {
      isJumpingRef.current = false;
    }, durationMs);
  }, []);

  const navigateToAyahInLoadedVerses = useCallback((
    targetSurah,
    targetAyah,
    loadedVerses,
    loadedPagesData,
    activeLayout,
  ) => {
    if (!Array.isArray(loadedVerses) || loadedVerses.length === 0) return;

    const clampedAyah = Math.max(1, Math.min(loadedVerses.length, targetAyah));
    const idx = loadedVerses.findIndex((v) => v.number === clampedAyah);
    const safeIdx = idx >= 0 ? idx : Math.max(0, clampedAyah - 1);

    lockJumpingTemporarily(1600);
    scrollRetryCountRef.current = 0;
    setCurrentAyahVisible(clampedAyah);
    setSingleAyahIndex(safeIdx);
    saveLastPosition(targetSurah, clampedAyah);

    if (activeLayout === 'page') {
      const pageIdx = loadedPagesData.findIndex((p) =>
        p.verses.some((v) => v.number === clampedAyah),
      );
      if (pageIdx >= 0) setCurrentPageIndex(pageIdx);
      return;
    }

    if (activeLayout === 'single_ayah') {
      return;
    }

    if (clampedAyah <= 1) {
      flatListRef.current?.scrollToOffset?.({ offset: 0, animated: false });
      return;
    }

    flatListRef.current?.scrollToIndex?.({
      index: safeIdx,
      animated: false,
      viewPosition: 0.05,
    });
  }, [lockJumpingTemporarily]);

  /* ---------------- Yükleme ---------------- */
  const load = useCallback(async (surah, targetAyah = 1) => {
    try { abortRef.current?.abort?.(); } catch {}
    const controller = new AbortController();
    abortRef.current = controller;

    pendingTargetAyahRef.current = targetAyah > 1 ? targetAyah : null;
    setListInitialRenderCount(targetAyah > 1 ? targetAyah + 3 : 10);
    lockJumpingTemporarily(1800);
    setLoading(true);
    setError(null);
    setActiveWord(null);
    setCurrentPageIndex(0);
    setSingleAyahIndex(Math.max(0, targetAyah - 1));
    setCurrentAyahVisible(targetAyah);

    if (sourceInfo.requiresApiKey && !diyanetApiKey) {
      setLoading(false);
      setVerses([]);
      setError(
        'Diyanet API anahtarı gerekli.\n\n' +
        'Ayarlar → İbadet → Diyanet API Anahtarı bölümünden anahtarınızı ekleyin.',
      );
      return;
    }

    try {
      const data = await fetchSurahVerses(quranSource, surah, {
        signal: controller.signal,
        apiKey: diyanetApiKey,
      });
      if (controller.signal.aborted) return;

      const resolvedTarget = pendingTargetAyahRef.current ?? targetAyah ?? 1;
      const targetIndex = data.findIndex((v) => v.number === resolvedTarget);
      if (targetIndex >= 0) {
        setSingleAyahIndex(targetIndex);
      }

      setVerses(data);
      setCurrentAyahVisible(resolvedTarget);
      saveLastPosition(surah, resolvedTarget);
      addRecentSurah(surah).catch(() => {});
    } catch (e) {
      if (controller.signal.aborted) return;
      setError(e?.message || 'Kur’an verisi yüklenemedi.');
      setVerses([]);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [quranSource, sourceInfo.requiresApiKey, diyanetApiKey, lockJumpingTemporarily]);

  // Sure değiştiğinde veriyi yükle
  useEffect(() => {
    const target = pendingTargetAyahRef.current ?? 1;
    load(surahNumber, target);
  }, [surahNumber, load]);

  // Veri yüklendikten sonra tek merkezli güvenli konumlanma
  useEffect(() => {
    if (loading || verses.length === 0 || pendingTargetAyahRef.current === null) return;

    const targetAyah = pendingTargetAyahRef.current;
    let timerId = null;

    const rafId = requestAnimationFrame(() => {
      timerId = setTimeout(() => {
        pendingTargetAyahRef.current = null;
        navigateToAyahInLoadedVerses(
          surahNumber,
          targetAyah,
          verses,
          pagesData,
          layoutMode,
        );
      }, 140);
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (timerId) clearTimeout(timerId);
    };
  }, [loading, verses, layoutMode, pagesData, surahNumber, navigateToAyahInLoadedVerses]);

  useEffect(() => {
    const isSupported = availableModes.some((m) => m.id === displayMode);
    if (!isSupported) setDisplayMode('arabic_meal');
  }, [availableModes, displayMode]);

  useEffect(() => {
    if (layoutMode === 'page') {
      flatListRef.current?.scrollToOffset?.({ offset: 0, animated: false });
    }
  }, [currentPageIndex, layoutMode]);

  useEffect(() => {
    return () => {
      try { abortRef.current?.abort?.(); } catch {}
      if (jumpUnlockTimerRef.current) clearTimeout(jumpUnlockTimerRef.current);
    };
  }, []);

  /* ---------------- Handlers ---------------- */
  const handleSelectSurah = useCallback((n) => {
    setPickerVisible(false);
    if (n !== surahNumber) {
      pendingTargetAyahRef.current = null;
      setListInitialRenderCount(10);
      setSurahNumber(n);
    } else {
      navigateToAyahInLoadedVerses(n, 1, verses, pagesData, layoutMode);
    }
  }, [surahNumber, verses, pagesData, layoutMode, navigateToAyahInLoadedVerses]);

  const handleWordPress = useCallback((word, verse) => {
    haptic();
    setActiveWord((prev) => (prev?.id === word.id ? null : { ...word, verse }));
  }, []);

  const handleVersePress = useCallback((verse) => {
    haptic();
    setDetailVerse(verse);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setDetailVerse(null);
  }, []);

  const surahNumberRef = useRef(surahNumber);
  useEffect(() => { surahNumberRef.current = surahNumber; }, [surahNumber]);

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (isJumpingRef.current) return;
    if (!viewableItems || viewableItems.length === 0) return;
    const first = viewableItems[0]?.item;
    if (first?.number) {
      setCurrentAyahVisible(first.number);
      saveLastPosition(surahNumberRef.current, first.number);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const handleJumpToSurahAndAyah = useCallback((targetSurah, targetAyah) => {
    setActiveWord(null);
    if (targetSurah !== surahNumber) {
      pendingTargetAyahRef.current = targetAyah;
      setListInitialRenderCount(targetAyah > 1 ? targetAyah + 3 : 10);
      lockJumpingTemporarily(2000);
      setSurahNumber(targetSurah);
    } else {
      pendingTargetAyahRef.current = null;
      navigateToAyahInLoadedVerses(
        targetSurah,
        targetAyah,
        verses,
        pagesData,
        layoutMode,
      );
    }
  }, [surahNumber, verses, layoutMode, pagesData, lockJumpingTemporarily, navigateToAyahInLoadedVerses]);

  const handleScrollToIndexFailed = useCallback((info) => {
    const attempt = scrollRetryCountRef.current;
    if (attempt >= 8) {
      isJumpingRef.current = false;
      return;
    }
    scrollRetryCountRef.current = attempt + 1;
    lockJumpingTemporarily(1600);

    const avgLen = info.averageItemLength > 0 ? info.averageItemLength : 180;
    const offset = Math.max(0, avgLen * info.index);
    flatListRef.current?.scrollToOffset?.({ offset, animated: false });

    setTimeout(() => {
      flatListRef.current?.scrollToIndex?.({
        index: info.index,
        animated: false,
        viewPosition: 0.05,
      });
    }, 100 + attempt * 50);
  }, [lockJumpingTemporarily]);

  const handlePrevPage = useCallback(() => {
    haptic();
    setCurrentPageIndex((i) => Math.max(0, i - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    haptic();
    setCurrentPageIndex((i) => Math.min(pagesData.length - 1, i + 1));
  }, [pagesData.length]);

  const handlePrevSingleAyah = useCallback(() => {
    if (singleAyahIndex <= 0) return;
    haptic();
    setSingleAyahIndex((i) => {
      const prev = i - 1;
      setCurrentAyahVisible(verses[prev]?.number || prev + 1);
      saveLastPosition(surahNumber, verses[prev]?.number || prev + 1);
      return prev;
    });
  }, [singleAyahIndex, verses, surahNumber]);

  const handleNextSingleAyah = useCallback(() => {
    if (singleAyahIndex >= verses.length - 1) return;
    haptic();
    setSingleAyahIndex((i) => {
      const next = i + 1;
      setCurrentAyahVisible(verses[next]?.number || next + 1);
      saveLastPosition(surahNumber, verses[next]?.number || next + 1);
      return next;
    });
  }, [singleAyahIndex, verses, surahNumber]);

  const toggleLayout = useCallback(() => {
    haptic();
    setLayoutMode((m) => {
      if (m === 'scroll') return 'page';
      if (m === 'page') return 'single_ayah';
      return 'scroll';
    });
  }, []);

  /* ---------------- Render ---------------- */
  const activeVerseId = activeWord?.verse?.id ?? null;
  const activeWordId = activeWord?.id ?? null;

  const renderVerse = useCallback(({ item, index }) => {
    if (displayMode === 'meal_only') {
      return (
        <MealOnlyVerse
          verse={item}
          theme={theme}
          fontScale={activeScale}
          isLast={index === displayedVerses.length - 1}
          surahNumber={surahNumber}
          onVersePress={handleVersePress}
          highContrast={highContrast}
        />
      );
    }
    return (
      <VerseCard
        verse={item}
        theme={theme}
        displayMode={displayMode}
        fontScale={activeScale}
        arabicSize={activeArabicSize}
        activeWordId={activeVerseId === item.id ? activeWordId : null}
        onWordPress={handleWordPress}
        isLast={index === displayedVerses.length - 1}
        surahNumber={surahNumber}
        onVersePress={handleVersePress}
        highContrast={highContrast}
      />
    );
  }, [
    theme, displayMode, activeScale, activeArabicSize,
    activeVerseId, activeWordId, handleWordPress, handleVersePress,
    displayedVerses.length, surahNumber, highContrast,
  ]);

  const progressPercent = useMemo(() => {
    if (!surahInfo?.ayahCount) return 0;
    return Math.min(100, (currentAyahVisible / surahInfo.ayahCount) * 100);
  }, [currentAyahVisible, surahInfo]);

  const showPartialWarning =
    !!sourceInfo.disclaimer &&
    verses.length > 0 &&
    surahInfo &&
    verses.length < surahInfo.ayahCount;

  const isPageMode = layoutMode === 'page';
  const isSingleAyahMode = layoutMode === 'single_ayah';

  const currentLayoutIcon = LAYOUT_MODES.find((m) => m.id === layoutMode)?.icon || 'list-outline';
  const currentLayoutLabel = LAYOUT_MODES.find((m) => m.id === layoutMode)?.label || 'Liste';

  const statusBarStyle = highContrast || rawTheme.mode === 'dark' || rawTheme.mode === 'oled' ? 'light-content' : 'dark-content';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={theme.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { haptic(); onBack?.(); }}
          style={[styles.headerIconBtn, {
            backgroundColor: highContrast ? '#121212' : theme.surface,
            borderColor: highContrast ? '#FFFFFF' : theme.border,
            borderWidth: highContrast ? 2 : 1,
          }]}
          hitSlop={8}
          accessibilityLabel="Geri"
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>

        <PressableScale
          onPress={() => setPickerVisible(true)}
          h="medium"
          scaleTo={0.98}
          accessibilityLabel={`${surahInfo?.name || 'Sure'} seç`}
          accessibilityHint="Tüm sure listesini açar"
          style={styles.headerCenter}
        >
          <View style={styles.headerTitleRow}>
            <Text
              style={[styles.headerTitle, { color: theme.text, fontWeight: highContrast ? '900' : '900' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {surahInfo?.name || '—'}
            </Text>
            <Ionicons name="chevron-down" size={14} color={theme.primary} />
          </View>
          <View style={styles.headerMetaRow}>
            <Text
              style={[styles.headerMeta, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : '600' }]}
              numberOfLines={1}
            >
              {surahInfo?.ayahCount ?? 0} ayet · {surahInfo?.revelation ?? '—'}
            </Text>
            <SourceMiniChip sourceInfo={sourceInfo} theme={theme} highContrast={highContrast} />
          </View>
        </PressableScale>

        <TouchableOpacity
          onPress={() => { haptic(); setFontSizeSheetVisible(true); }}
          style={[styles.headerIconBtn, styles.headerFontBtn, {
            backgroundColor: highContrast ? '#121212' : theme.surface,
            borderColor: highContrast ? '#FFFFFF' : theme.border,
            borderWidth: highContrast ? 2 : 1,
          }]}
          hitSlop={8}
          accessibilityLabel="Yazı boyutu"
          accessibilityHint={`Şu an ${Math.round(fontConfig.scale * 100)}%`}
        >
          <Text style={[styles.headerFontBtnLabel, { color: theme.primary, fontWeight: highContrast ? '900' : '900' }]}>
            {fontConfig.label}
          </Text>
          <View style={styles.headerFontDots}>
            {FONT_SIZES.map((f, i) => {
              const activeIdx = FONT_SIZES.findIndex(
                (x) => x.id === fontSizeId,
              );
              const filled = i <= activeIdx;
              const isCurrent = i === activeIdx;
              return (
                <View
                  key={f.id}
                  style={[
                    styles.headerFontDot,
                    {
                      backgroundColor: filled ? theme.primary : (highContrast ? '#FFFFFF' : theme.border),
                      width: isCurrent ? 6 : 3,
                    },
                  ]}
                />
              );
            })}
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleLayout}
          activeOpacity={0.8}
          style={[styles.headerLayoutBtn, {
            backgroundColor: layoutMode !== 'scroll'
              ? theme.primary
              : (highContrast ? '#121212' : theme.surface),
            borderColor: layoutMode !== 'scroll'
              ? (highContrast ? '#000000' : theme.primary)
              : (highContrast ? '#FFFFFF' : theme.border),
            borderWidth: highContrast ? 2 : 1,
          }]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`Görünüm modu: ${currentLayoutLabel}. Değiştirmek için dokunun`}
        >
          <Ionicons
            name={currentLayoutIcon}
            size={16}
            color={layoutMode !== 'scroll' ? (highContrast ? '#000000' : (theme.onPrimary || '#FFF')) : theme.primary}
          />
          <Text
            style={[
              styles.headerLayoutBtnText,
              {
                color: layoutMode !== 'scroll'
                  ? (highContrast ? '#000000' : (theme.onPrimary || '#FFF'))
                  : theme.text,
                fontWeight: highContrast ? '900' : '800',
              },
            ]}
          >
            {currentLayoutLabel}
          </Text>
        </TouchableOpacity>
      </View>

      {showPartialWarning && (
        <View style={[styles.limitBanner, {
          backgroundColor: highContrast ? '#121212' : 'rgba(234,179,8,0.08)',
          borderColor: highContrast ? '#FFFFFF' : 'rgba(234,179,8,0.35)',
          borderWidth: highContrast ? 2 : 1,
        }]}>
          <Ionicons name="information-circle-outline" size={12} color={highContrast ? '#FFFF00' : '#CA8A04'} />
          <Text style={[styles.limitText, { color: theme.text, fontWeight: highContrast ? '700' : '600' }]} numberOfLines={2}>
            {sourceInfo.disclaimer} ({verses.length}/{surahInfo.ayahCount})
          </Text>
        </View>
      )}

      <View style={styles.modeBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.modeBarContent}
        >
          {availableModes.map((m) => {
            const selected = displayMode === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => { haptic(); setDisplayMode(m.id); }}
                style={[
                  styles.modePill,
                  {
                    backgroundColor: selected ? theme.primary : (highContrast ? '#121212' : theme.surface),
                    borderColor: selected ? theme.primary : (highContrast ? '#FFFFFF' : theme.border),
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={m.fullLabel || m.label}
              >
                <Ionicons
                  name={m.icon}
                  size={12}
                  color={selected ? (highContrast ? '#000000' : (theme.onPrimary || '#FFF')) : (highContrast ? '#E0E0E0' : theme.textDim)}
                />
                <Text style={[styles.modePillText, {
                  color: selected ? (highContrast ? '#000000' : (theme.onPrimary || '#FFF')) : (highContrast ? '#E0E0E0' : theme.textDim),
                  fontWeight: highContrast ? '900' : '800',
                }]}>
                  {m.fullLabel || m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isPageMode && currentPage && pagesData.length > 1 && (
        <View style={styles.pageHeader}>
          <Text style={[styles.pageHeaderText, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '900' : '800' }]}>
            SAYFA {currentPage.pageNumber}
          </Text>
          <View style={[styles.pageHeaderDivider, { backgroundColor: highContrast ? '#FFFFFF' : theme.border, height: highContrast ? 2 : 1 }]} />
        </View>
      )}

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.centerText, { color: highContrast ? '#E0E0E0' : theme.textDim, fontWeight: highContrast ? '700' : 'normal' }]}>
            {surahInfo?.name} Suresi yükleniyor…
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerBox}>
          <Ionicons name="cloud-offline-outline" size={42} color={highContrast ? '#FFFFFF' : theme.textMuted} />
          <Text style={[styles.centerText, { color: theme.text, fontWeight: highContrast ? '700' : 'normal' }]}>{error}</Text>
          <TouchableOpacity
            onPress={() => { haptic(); load(surahNumber, 1); }}
            style={[styles.retryBtn, { backgroundColor: theme.primary, borderColor: highContrast ? '#000000' : 'transparent', borderWidth: highContrast ? 2 : 0 }]}
          >
            <Text style={[styles.retryBtnText, { color: highContrast ? '#000000' : (theme.onPrimary || '#FFF'), fontWeight: highContrast ? '900' : '800' }]}>
              Tekrar dene
            </Text>
          </TouchableOpacity>
        </View>
      ) : isSingleAyahMode && currentSingleVerse ? (
        <GestureDetector gesture={combinedGesture}>
          <View style={{ flex: 1 }}>
            <SingleAyahView
              verse={currentSingleVerse}
              theme={theme}
              displayMode={displayMode}
              fontScale={activeScale}
              arabicSize={activeArabicSize}
              activeWordId={activeWord?.id ?? null}
              onWordPress={handleWordPress}
              surahNumber={surahNumber}
              onVersePress={handleVersePress}
              highContrast={highContrast}
            />
          </View>
        </GestureDetector>
      ) : isPageMode && displayMode !== 'meal_only' && currentPage ? (
        <GestureDetector gesture={combinedGesture}>
          <View style={{ flex: 1 }}>
            <PageMushafView
              verses={currentPage.verses}
              theme={theme}
              fontScale={activeScale}
              showMeal={
                displayMode === 'arabic_meal' ||
                displayMode === 'arabic_full'
              }
              showLatin={displayMode === 'arabic_full'}
              pageNumber={currentPage.pageNumber}
              highContrast={highContrast}
            />
          </View>
        </GestureDetector>
      ) : (
        <GestureDetector gesture={combinedGesture}>
          <View style={{ flex: 1 }}>
            <FlatList
              key={`surah-list-${surahNumber}`}
              ref={flatListRef}
              data={displayedVerses}
              keyExtractor={(v) => String(v.id)}
              renderItem={renderVerse}
              contentContainerStyle={[
                styles.listContent,
                {
                  paddingBottom: isPageMode
                    ? Math.max(140, insets.bottom + 100)
                    : Math.max(180, insets.bottom + (activeWord ? 160 : 40)),
                },
              ]}
              showsVerticalScrollIndicator={false}
              initialNumToRender={listInitialRenderCount}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={50}
              windowSize={5}
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={viewabilityConfig}
              onScrollToIndexFailed={handleScrollToIndexFailed}
              ListFooterComponent={
                verses.length > 0 && !isPageMode ? (
                  <Text style={[styles.attribution, { color: highContrast ? '#E0E0E0' : theme.textMuted, fontWeight: highContrast ? '700' : 'normal' }]}>
                    {sourceInfo.attribution}
                  </Text>
                ) : null
              }
            />
          </View>
        </GestureDetector>
      )}

      <PinchIndicator scale={pinchLiveScale} theme={theme} highContrast={highContrast} />

      {!isPageMode && !isSingleAyahMode && !loading && !error && verses.length > 0 && (
        <View style={[styles.progressPill, {
          backgroundColor: highContrast ? '#121212' : theme.surface,
          borderColor: highContrast ? '#FFFFFF' : theme.border,
          borderWidth: highContrast ? 2 : 1,
          bottom: insets.bottom + (activeWord ? 90 : 20),
        }]}>
          <Text style={[styles.progressText, { color: theme.primary, fontWeight: highContrast ? '900' : '900' }]}>
            {currentAyahVisible}/{surahInfo?.ayahCount ?? 0}
          </Text>
          <View style={[styles.progressBarBg, { backgroundColor: highContrast ? '#333333' : theme.border }]}>
            <View style={[styles.progressBarFill, {
              width: `${progressPercent}%`, backgroundColor: theme.primary,
            }]} />
          </View>
        </View>
      )}

      {/* Sure / Ayet Bul FAB */}
      {!loading && !error && (
        <TouchableOpacity
          onPress={() => { haptic(); setJumpVisible(true); }}
          style={[styles.jumpFab, {
            backgroundColor: theme.primary,
            borderColor: highContrast ? '#000000' : 'transparent',
            borderWidth: highContrast ? 2 : 0,
            bottom: isPageMode
              ? insets.bottom + (pagesData.length > 1 ? 82 : 20)
              : isSingleAyahMode
              ? insets.bottom + 82
              : insets.bottom + (activeWord ? 90 : 20) + 60,
          }]}
          accessibilityLabel="Sure ve Ayet Bul"
        >
          <Ionicons
            name="compass-outline"
            size={22}
            color={highContrast ? '#000000' : (theme.onPrimary || '#FFF')}
          />
        </TouchableOpacity>
      )}

      {isPageMode && !loading && !error && pagesData.length > 0 && (
        <PageNavigation
          currentPageIndex={currentPageIndex}
          totalPages={pagesData.length}
          pageNumber={currentPage?.pageNumber ?? 1}
          theme={theme}
          insets={insets}
          onPrev={handlePrevPage}
          onNext={handleNextPage}
          isRTL={displayMode !== 'meal_only'}
          highContrast={highContrast}
        />
      )}

      {isSingleAyahMode && !loading && !error && verses.length > 0 && (
        <SingleAyahNavigation
          currentAyahIndex={singleAyahIndex}
          totalAyahs={verses.length}
          theme={theme}
          insets={insets}
          onPrev={handlePrevSingleAyah}
          onNext={handleNextSingleAyah}
          isRTL={displayMode !== 'meal_only'}
          highContrast={highContrast}
        />
      )}

      <ActiveWordPanel
        word={activeWord}
        theme={theme}
        onClose={() => setActiveWord(null)}
        highContrast={highContrast}
      />

      <VerseDetailModal
        visible={!!detailVerse}
        verse={detailVerse}
        theme={theme}
        surahNumber={surahNumber}
        onClose={handleCloseDetail}
        highContrast={highContrast}
      />

      <FontSizeSheet
        visible={fontSizeSheetVisible}
        theme={theme}
        currentId={fontSizeId}
        onSelect={(id) => { setFontSizeId(id); }}
        onClose={() => setFontSizeSheetVisible(false)}
        highContrast={highContrast}
      />

      <SurahPickerModal
        visible={pickerVisible}
        theme={theme}
        currentSurah={surahNumber}
        onSelect={handleSelectSurah}
        onClose={() => setPickerVisible(false)}
        highContrast={highContrast}
      />

      <AyahJumpModal
        visible={jumpVisible}
        theme={theme}
        currentSurah={surahNumber}
        currentAyah={currentAyahVisible}
        onJump={handleJumpToSurahAndAyah}
        onClose={() => setJumpVisible(false)}
        highContrast={highContrast}
      />
    </SafeAreaView>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* HEADER */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerFontBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  headerFontBtnLabel: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 12,
  },
  headerFontDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  headerFontDot: {
    height: 3,
    borderRadius: 1.5,
  },
  headerLayoutBtn: {
    height: 38,
    paddingHorizontal: 11,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  headerLayoutBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  headerCenter: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 2,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    fontSize: 16.5,
    fontWeight: '900',
    letterSpacing: -0.3,
    flexShrink: 1,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  headerMeta: {
    fontSize: 10.5,
    fontWeight: '600',
    flexShrink: 1,
  },

  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniChipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  miniChipText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  /* MODE BAR */
  modeBarWrap: {
    paddingBottom: 8,
  },
  modeBarContent: {
    paddingHorizontal: 14,
    gap: 6,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 10,
    borderWidth: 1,
    minHeight: 32,
  },
  modePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.1,
  },

  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  limitText: {
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    lineHeight: 15,
  },

  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  pageHeaderText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pageHeaderDivider: {
    flex: 1,
    height: 1,
  },

  listContent: { paddingHorizontal: 16, paddingTop: 4 },

  singleAyahContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 14,
  },
  centerText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    paddingHorizontal: 22, paddingVertical: 11, borderRadius: 12,
  },
  retryBtnText: { fontSize: 13, fontWeight: '800' },

  verseCard: {
    borderRadius: 18, borderWidth: 1, padding: 14,
  },
  verseHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginBottom: 10,
  },
  verseNumBadge: {
    minWidth: 30, height: 24, borderRadius: 8,
    paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center',
  },
  verseNum: { fontSize: 12, fontWeight: '900' },
  verseKey: { fontSize: 11, fontWeight: '700' },

  wordsRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'flex-start', gap: 6,
  },
  wordChip: {
    paddingHorizontal: 6, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
    alignItems: 'center', minWidth: 24,
  },
  wordChipWide: { minWidth: 70, maxWidth: 110 },
  wordArabic: { textAlign: 'center' },
  wordTrans: { fontSize: 9, marginTop: 3, textAlign: 'center' },
  arabicPlain: { textAlign: 'right', writingDirection: 'rtl' },

  translit: {
    fontSize: 12, lineHeight: 18, marginTop: 10,
    fontStyle: 'italic', textAlign: 'center',
  },
  mealBox: {
    marginTop: 12, paddingTop: 10, borderTopWidth: 1,
  },
  mealHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 6,
  },
  mealLabel: {
    fontSize: 10, fontWeight: '900', letterSpacing: 0.8,
  },
  mealText: { fontWeight: '400' },

  mealOnlyCard: {
    borderRadius: 18, borderWidth: 1, padding: 18,
  },
  mealOnlyHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
  },
  mealOnlyText: { fontWeight: '400', letterSpacing: 0.1 },

  footnotesBox: {
    marginTop: 10, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth, gap: 6,
  },
  footnoteText: { fontSize: 11, lineHeight: 16 },

  attribution: {
    fontSize: 10, textAlign: 'center',
    fontStyle: 'italic', marginTop: 20, marginBottom: 8,
    paddingHorizontal: 20,
  },

  activePanel: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    borderTopWidth: 1, paddingHorizontal: 16,
    paddingTop: 12, paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.14, shadowRadius: 10, elevation: 14,
    maxHeight: '60%',
  },
  activePanelRow: { flexDirection: 'row', alignItems: 'center' },
  activeArabic: {
    fontSize: 26, fontWeight: '600',
    writingDirection: 'rtl', minWidth: 60,
  },
  activeTranslit: { fontSize: 13, fontWeight: '700', fontStyle: 'italic' },
  activeTranslation: { fontSize: 13, marginTop: 3, fontWeight: '600' },
  activeVerseContext: {
    marginTop: 10, paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  activeVerseLabel: {
    fontSize: 9, fontWeight: '900',
    letterSpacing: 0.6, marginBottom: 4,
  },
  activeVerseText: { fontSize: 12, lineHeight: 18 },

  progressPill: {
    position: 'absolute', right: 16,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1,
    minWidth: 90, alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 6,
  },
  progressText: { fontSize: 11, fontWeight: '900' },
  progressBarBg: {
    width: '100%', height: 3, borderRadius: 2,
    marginTop: 4, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 2 },

  jumpFab: {
    position: 'absolute', right: 16,
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 8,
  },

  pageNav: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center',
    paddingTop: 10, paddingHorizontal: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 8,
  },
  pageNavBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 8, minWidth: 90,
  },
  pageNavBtnRight: { justifyContent: 'flex-end' },
  pageNavBtnText: { fontSize: 12, fontWeight: '800', marginHorizontal: 4 },
  pageNavCenter: { flex: 1, alignItems: 'center' },
  pageNavNum: { fontSize: 14, fontWeight: '900' },
  pageNavMeta: { fontSize: 10, marginTop: 1 },

  swipeHint: {
    flexDirection: 'row', alignItems: 'center',
    gap: 3, marginTop: 4, opacity: 0.7,
  },
  swipeHintText: {
    fontSize: 9, fontWeight: '600', fontStyle: 'italic',
  },

  pinchOverlay: {
    position: 'absolute', top: 160,
    left: 0, right: 0, alignItems: 'center', zIndex: 100,
  },
  pinchBubble: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 24, borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 10,
  },
  pinchBubbleText: {
    fontSize: 16, fontWeight: '900',
    marginLeft: 8, fontVariant: ['tabular-nums'],
  },

  /* Yazı Boyutu Sheet Stilleri */
  fontPreviewBox: {
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 22,
    paddingHorizontal: 16,
    marginBottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  fontPreviewArabic: {
    textAlign: 'center',
    writingDirection: 'rtl',
    fontWeight: '500',
  },
  fontOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  fontOptionRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontOptionLabel: {
    fontWeight: '900',
    letterSpacing: -0.2,
    minWidth: 42,
  },
  fontOptionDesc: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
  },
  fontOptionPercent: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  fontHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 12,
  },
  fontDoneBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fontDoneBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.2,
  },

  /* Ayet Detay Modalı */
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  detailContainer: {
    flex: 1,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  detailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  detailBadgeText: {
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  detailPageText: {
    fontSize: 11,
    fontWeight: '600',
  },
  detailIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailArabic: {
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '500',
    marginBottom: 20,
  },
  detailLatin: {
    fontStyle: 'italic',
    fontWeight: '600',
    marginBottom: 16,
    lineHeight: 20,
  },
  detailTranslationBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  detailTranslationLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  detailTranslation: {
    fontWeight: '400',
  },
  detailFootnotesBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  detailFootnotesLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  detailFootnote: {
    lineHeight: 16,
  },
  detailToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  detailFontControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailFontBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailFontValue: {
    fontSize: 11,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  detailPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
  },
  detailPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  /* Sure seçici */
  modalOverlay: {
    flex: 1, justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    maxHeight: '92%',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, paddingHorizontal: 20, paddingTop: 12,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center', marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 12, gap: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '900' },

  pickerSearchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, borderRadius: 12, borderWidth: 1,
    height: 42, marginBottom: 10,
  },
  pickerSearchInput: { flex: 1, fontSize: 13, height: '100%' },

  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1,
    minHeight: 30, justifyContent: 'center',
  },

  sortBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sortMenu: {
    borderRadius: 10, borderWidth: 1,
    paddingVertical: 4, marginBottom: 8,
  },
  sortMenuItem: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 8, marginHorizontal: 4,
  },

  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  recentHeaderText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 28,
  },
  recentChipDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  recentChipNum: {
    fontSize: 9.5,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    minWidth: 12,
  },
  recentChipName: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: -0.1,
    maxWidth: 90,
  },

  surahRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
  surahNumBadge: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  surahNumText: { fontSize: 13, fontWeight: '900' },
  surahName: { fontSize: 15, fontWeight: '800' },
  surahMeta: { fontSize: 11, fontWeight: '600', marginTop: 2 },

  activePill: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
  },

  jumpOverlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)', padding: 24,
  },
  jumpCard: {
    width: '100%', maxWidth: 340,
    borderRadius: 20, borderWidth: 1, padding: 20,
  },
  jumpTitle: { fontSize: 17, fontWeight: '900' },
  jumpSub: { fontSize: 12, marginTop: 3 },
  jumpInput: {
    height: 48, borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, fontSize: 16, fontWeight: '700',
    textAlign: 'center',
  },
  jumpTargetPreview: {
    paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, marginBottom: 14,
    alignItems: 'center',
  },
  jumpEdgeChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1,
  },
  jumpBtn: {
    height: 42, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Mushaf sayfa görünümü */
  mushafContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  mushafPageTop: {
    alignItems: 'center',
    marginBottom: 12,
  },
  mushafPageBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  mushafPageNum: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  mushafBox: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 24,
    paddingHorizontal: 18,
    marginBottom: 18,
  },
  mushafArabic: {
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '400',
  },
  mushafMealSection: {
    gap: 12,
  },
  mushafMealRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 4,
  },
  mushafMealNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  mushafMealNumText: {
    fontSize: 11,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  mushafLatin: {
    fontStyle: 'italic',
    fontWeight: '600',
    marginBottom: 3,
  },
  mushafMealText: {
    fontWeight: '400',
  },
});