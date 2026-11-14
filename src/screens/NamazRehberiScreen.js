// src/screens/NamazRehberiScreen.js
//
// Namaz Rehberi — güncellenmiş kod (Bug Fix & WCAG AA Uyumu).
import React, {
  useState, useMemo, useCallback, useRef, useEffect, memo,
  createContext, useContext,
} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Share,
  PanResponder,
  Animated,
  Easing,
  useWindowDimensions,
  Linking,
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';

import {
  SECTIONS,
  GENERAL_INFO,
  WUDU_STEPS,
  PRAYER_STEPS,
  PRAYER_CATEGORIES,
  BREAKING_REASONS,
} from '../data/prayerGuide';

/* ================================================================
   Opsiyonel modüller
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}

const hapticLight = () => {
  try {
    if (useAppStore.getState().globalHaptic === false) return;
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Light);
  } catch {}
};

/* ================================================================
   Sabitler & yardımcılar
   ================================================================ */
const arr = (x) => (Array.isArray(x) ? x : []);

const LOCAL_MIN = 0.85;
const LOCAL_MAX = 1.6;
const LOCAL_STEP = 0.15;

const VAKITLER = [
  { id: 'sabah',  label: 'Sabah',  bolumler: ['Sünnet', 'Farz'] },
  { id: 'ogle',   label: 'Öğle',   bolumler: ['İlk Sünnet', 'Farz', 'Son Sünnet'] },
  { id: 'ikindi', label: 'İkindi', bolumler: ['Sünnet', 'Farz'] },
  { id: 'aksam',  label: 'Akşam',  bolumler: ['Farz', 'Son Sünnet'] },
  { id: 'yatsi',  label: 'Yatsı',  bolumler: ['İlk Sünnet', 'Farz', 'Son Sünnet', 'Vitr'] },
];

const KISILER_GRUP = [
  {
    grupKey: 'yetiskin',
    grupBaslik: 'Yetişkin',
    secenekler: [
      { id: 'erkek', label: 'Erkek' },
      { id: 'kadin', label: 'Kadın' },
    ],
  },
  {
    grupKey: 'cocuk',
    grupBaslik: 'Çocuk',
    secenekler: [
      { id: 'erkek_cocuk', label: 'Erkek Çocuk' },
      { id: 'kiz_cocuk', label: 'Kız Çocuk' },
    ],
  },
];

const PRAYER_VIDEOS = {
  erkek:       { sabah: 'pU-x5CYt4Fw', ogle: '2xMTmJQWCDI', ikindi: '_UXr9tfrizA', aksam: '-3v6598LbA4', yatsi: 'Hs-HXG3d44M' },
  kadin:       { sabah: 'RTSu8LU97_A', ogle: 'GVPt-vx35aA', ikindi: '4moVSUJx4yo', aksam: 'RumkyLipX7A', yatsi: 'TZ6PKJnxsc4' },
  erkek_cocuk: { sabah: 'Bu8v8eqbJB4', ogle: 'Ag1jsxewYns', ikindi: '7gQF-0v7NJE', aksam: 'DemueN8b6yo', yatsi: 'vrk6um9Ej6Q' },
  kiz_cocuk:   { sabah: 'gJH2-yHMRZE', ogle: '4LUa_ta2bxU', ikindi: 'LzsJ7aY5tY0', aksam: 'vGjtX9vdRTU', yatsi: 'RqFSeFOCLSs' },
};

const normalizeForSearch = (str) => {
  if (!str) return '';
  return String(str)
    .toLocaleLowerCase('tr-TR')
    .replace(/[âàáä]/g, 'a')
    .replace(/[îíï]/g, 'i')
    .replace(/[ûùúü]/g, 'u')
    .replace(/[êèéë]/g, 'e')
    .replace(/[ôòóö]/g, 'o')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ç/g, 'c')
    .replace(/[’']/g, '')
    .trim();
};

// WCAG AA Kontrast Oranı Sabitlemesi (Minimum 4.5:1 kontrast sağlayan renk seçici)
const readableOn = (bg) => {
  try {
    let h = String(bg || '').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    if (h.length < 6) return '#000000';
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) return '#000000';
    return (r * 299 + g * 587 + b * 114) / 1000 > 140 ? '#111111' : '#FFFFFF';
  } catch {
    return '#000000';
  }
};

/* ================================================================
   Erişilebilirlik / tema bağlamı
   ================================================================ */
const A11yContext = createContext(null);
const useA11y = () => useContext(A11yContext);

function buildA11y(theme, prefs) {
  const { highContrast, reduceMotion, largeTouch, dyslexia, readingScale } = prefs;
  const scale = Math.min(Math.max(Number(readingScale) || 1, 1), 1.5);
  const lineMul = dyslexia ? 1.75 : 1.45;
  
  // WCAG AA standartlarına uygun renk güçlendirmeleri
  const isDarkTheme = theme.mode !== 'light' && theme.mode !== 'sepia' && theme.mode !== 'sand';
  const fallbackDim = isDarkTheme ? '#D1D5DB' : '#4B5563';
  const fallbackMuted = isDarkTheme ? '#9CA3AF' : '#6B7280';

  const textDim = theme.textDim || fallbackDim;
  const textMuted = theme.textMuted || fallbackMuted;

  return {
    theme,
    highContrast,
    reduceMotion,
    largeTouch,
    dyslexia,
    scale,
    border: highContrast ? theme.text : (theme.border || fallbackMuted),
    bw: highContrast ? 2 : 1,
    dim: highContrast ? theme.text : textDim,
    muted: highContrast ? theme.text : textMuted,
    glow: theme.primaryGlow || theme.surfaceElevated,
    onPrimary: readableOn(theme.primary),
    minTouch: largeTouch ? 56 : 48, // WCAG 2.2 AA Minimum 48x48 hedef boyutu güncellendi
    fs: (n, mult = 1) => Math.round(n * scale * mult),
    t: (size, weight = '500', color, mult = 1) => {
      const fontSize = Math.round(size * scale * mult);
      const w = highContrast && Number(weight) < 700 ? '700' : weight;
      return {
        fontSize,
        lineHeight: Math.round(fontSize * lineMul),
        fontWeight: w,
        color: color || theme.text,
        letterSpacing: dyslexia ? 0.5 : 0,
      };
    },
  };
}

/* ================================================================
   Küçük bileşenler (Erişilebilirlik ve WCAG İyileştirmeleriyle)
   ================================================================ */
const Chip = memo(function Chip({ label, active, onPress, icon, style }) {
  const a = useA11y();
  const { theme } = a;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={`${label} ${active ? 'seçili' : ''}`}
      style={[
        styles.chip,
        {
          minHeight: a.minTouch - 4,
          backgroundColor: active ? theme.primary : theme.surface,
          borderColor: active ? theme.primary : a.border,
          borderWidth: a.bw,
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={a.fs(16)} color={active ? a.onPrimary : theme.text} /> : null}
      <Text style={a.t(13, active ? '800' : '600', active ? a.onPrimary : theme.text)} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const Card = memo(function Card({ children, style }) {
  const a = useA11y();
  return (
    <View style={[styles.card, { backgroundColor: a.theme.surface, borderColor: a.border, borderWidth: a.bw }, style]}>
      {children}
    </View>
  );
});

const IconButton = memo(function IconButton({ name, onPress, label }) {
  const a = useA11y();
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Dokunarak işlemi gerçekleştirin"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={[
        styles.iconBtn,
        {
          width: a.minTouch,
          height: a.minTouch,
          backgroundColor: a.theme.surfaceElevated,
          borderColor: a.border,
          borderWidth: a.highContrast ? 2 : 1,
        },
      ]}
    >
      <Ionicons name={name} size={a.fs(20)} color={a.theme.text} />
    </TouchableOpacity>
  );
});

const SectionTitle = memo(function SectionTitle({ children }) {
  const a = useA11y();
  return (
    <Text accessibilityRole="header" style={[a.t(16, '800'), styles.sectionTitle]}>
      {children}
    </Text>
  );
});

const StepRow = memo(function StepRow({ st, onPress }) {
  const a = useA11y();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`Adım ${st.step}: ${st.title}`}
      accessibilityHint="Detayları görmek için dokunun"
      style={[
        styles.stepRow,
        { minHeight: a.minTouch + 12, backgroundColor: a.theme.surface, borderColor: a.border, borderWidth: a.bw },
      ]}
    >
      <View style={[styles.badge, { backgroundColor: a.theme.primary }]}>
        <Text style={a.t(13, '900', a.onPrimary)}>{st.step}</Text>
      </View>
      <View style={styles.flex1}>
        <Text style={a.t(14.5, '800')} numberOfLines={2}>{st.title}</Text>
        <Text style={[a.t(12.5, '500', a.dim), { marginTop: 2 }]} numberOfLines={2}>{st.desc}</Text>
      </View>
      <Ionicons name="chevron-forward" size={a.fs(16)} color={a.muted} />
    </TouchableOpacity>
  );
});

const HeroCard = memo(function HeroCard({ eyebrow, title, desc, onPress }) {
  const a = useA11y();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${desc}`}
      style={[
        styles.hero,
        { minHeight: a.minTouch + 40, backgroundColor: a.glow, borderColor: a.theme.primary, borderWidth: a.highContrast ? 2 : 1.5 },
      ]}
    >
      <View style={styles.flex1}>
        <Text style={a.t(11, '800', a.theme.primary)}>{eyebrow}</Text>
        <Text style={[a.t(19, '900'), { marginTop: 2 }]}>{title}</Text>
        <Text style={[a.t(13, '500', a.dim), { marginTop: 2 }]}>{desc}</Text>
      </View>
      <View style={[styles.playBtn, { backgroundColor: a.theme.primary }]}>
        <Ionicons name="play" size={a.fs(18)} color={a.onPrimary} />
      </View>
    </TouchableOpacity>
  );
});

/* ================================================================
   Özel Uyarı Modalı
   ================================================================ */
const CustomConfirmModal = memo(function CustomConfirmModal({ visible, title, message, onConfirm, onCancel }) {
  const a = useA11y();
  const { theme } = a;

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View style={styles.confirmOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onCancel} accessibilityLabel="Kapat" />
        <View
          style={[
            styles.confirmCard,
            {
              backgroundColor: theme.surface,
              borderColor: a.border,
              borderWidth: a.bw,
            },
          ]}
        >
          <View style={[styles.confirmIconWrap, { backgroundColor: 'rgba(255,0,0,0.1)' }]}>
            <Ionicons name="logo-youtube" size={a.fs(28)} color="#FF0000" />
          </View>
          <Text accessibilityRole="header" style={[a.t(18, '900'), { textAlign: 'center', marginBottom: 6 }]}>{title}</Text>
          <Text style={[a.t(13.5, '500', a.dim), { textAlign: 'center', marginBottom: 20, lineHeight: 20 }]}>{message}</Text>

          <View style={styles.confirmBtnRow}>
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Vazgeç"
              style={[
                styles.confirmBtn,
                {
                  minHeight: a.minTouch,
                  backgroundColor: theme.surfaceElevated,
                  borderColor: a.border,
                  borderWidth: a.bw,
                },
              ]}
            >
              <Text style={a.t(14, '700', a.muted)}>Vazgeç</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Devam Et"
              style={[
                styles.confirmBtn,
                {
                  minHeight: a.minTouch,
                  backgroundColor: theme.primary,
                  borderColor: theme.primary,
                  borderWidth: a.bw,
                },
              ]}
            >
              <Text style={a.t(14, '800', a.onPrimary)}>Devam Et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   Video Kutusu
   ================================================================ */
const VideoBox = memo(function VideoBox({ videoId, onOpenAlert }) {
  const a = useA11y();
  const { theme } = a;

  if (!videoId) return null;

  return (
    <View style={styles.videoWrap}>
      <TouchableOpacity
        onPress={() => { hapticLight(); onOpenAlert(videoId); }}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Anlatım Videosunu İzle. YouTube uygulamasında açılır."
        style={[
          styles.videoButtonCard,
          {
            minHeight: a.minTouch + 8,
            backgroundColor: theme.surfaceElevated,
            borderColor: a.border,
            borderWidth: a.bw,
          },
        ]}
      >
        <View style={styles.youtubeIconWrap}>
          <Ionicons name="logo-youtube" size={a.fs(24)} color="#FF0000" />
        </View>
        <View style={styles.flex1}>
          <Text style={a.t(14, '800')}>Anlatım Videosunu İzle</Text>
          <Text style={[a.t(12, '500', a.dim), { marginTop: 2 }]}>YouTube uygulamasında açılır</Text>
        </View>
        <Ionicons name="open-outline" size={a.fs(18)} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
});

/* ================================================================
   Adım adım rehber modalı
   ================================================================ */
const StepModal = memo(function StepModal({ guide, onClose, onOpenAlert }) {
  const a = useA11y();
  const { theme } = a;
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const steps = arr(guide?.steps);
  const total = steps.length;
  const startIndex = Math.min(Math.max(guide?.initialIndex || 0, 0), Math.max(total - 1, 0));

  const [index, setIndex] = useState(startIndex);
  const [localMult, setLocalMult] = useState(1);

  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);

  const indexRef = useRef(startIndex);
  const totalRef = useRef(total);
  const changeRef = useRef(() => {});
  totalRef.current = total;

  const changeStep = useCallback((next, dir) => {
    if (next < 0 || next >= totalRef.current || next === indexRef.current) return;
    hapticLight();
    indexRef.current = next;
    setIndex(next);
    try { scrollRef.current?.scrollTo({ y: 0, animated: false }); } catch {}
    if (a.reduceMotion) return;
    slide.setValue(dir === 'next' ? 36 : -36);
    fade.setValue(0);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [a.reduceMotion, fade, slide]);
  changeRef.current = changeStep;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 22 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.6,
      onPanResponderRelease: (_, gs) => {
        if (Math.abs(gs.dx) < 60) return;
        if (gs.dx < 0) changeRef.current(indexRef.current + 1, 'next');
        else changeRef.current(indexRef.current - 1, 'prev');
      },
    }),
  ).current;

  const bump = useCallback((d) => {
    hapticLight();
    setLocalMult((m) => Math.min(LOCAL_MAX, Math.max(LOCAL_MIN, Math.round((m + d) * 100) / 100)));
  }, []);

  const onShare = useCallback(async () => {
    const st = steps[index];
    if (!st) return;
    try {
      await Share.share({
        message: `${guide?.title || 'Namaz Rehberi'}\n\nAdım ${st.step}: ${st.title}\n${st.desc}\n\nNİDA — Namaz Rehberi`,
      });
    } catch {}
  }, [steps, index, guide?.title]);

  if (!guide || total === 0) return null;
  const st = steps[index];
  if (!st) return null;

  const isFirst = index === 0;
  const isLast = index === total - 1;
  const cardHeight = Math.min(winH * 0.92, winH - insets.top - 8);
  const atMin = localMult <= LOCAL_MIN + 0.001;
  const atMax = localMult >= LOCAL_MAX - 0.001;

  return (
    <Modal visible transparent animationType={a.reduceMotion ? 'none' : 'slide'} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityLabel="Kapat" />

        <View
          style={[
            styles.sheet,
            {
              height: cardHeight,
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: theme.surface,
              borderColor: a.border,
              borderWidth: a.bw,
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: a.border }]} />

          <View style={styles.sheetTop}>
            <View style={styles.flex1}>
              <Text accessibilityRole="header" style={a.t(17, '900')} numberOfLines={2}>{guide.title}</Text>
              {guide.subtitle ? (
                <Text style={[a.t(12, '600', a.muted), { marginTop: 2 }]} numberOfLines={1}>{guide.subtitle}</Text>
              ) : null}
            </View>
            <IconButton name="share-social-outline" onPress={onShare} label="Paylaş" />
            <IconButton name="close" onPress={onClose} label="Kapat" />
          </View>

          <View style={styles.progressRow}>
            <Text style={a.t(12, '800', theme.primary)}>Adım {index + 1} / {total}</Text>
            <View style={[styles.track, { backgroundColor: a.border, height: a.highContrast ? 8 : 5 }]}>
              <View style={[styles.trackFill, { backgroundColor: theme.primary, width: `${((index + 1) / total) * 100}%` }]} />
            </View>
          </View>

          <View style={styles.flex1} {...panResponder.panHandlers}>
            <ScrollView
              ref={scrollRef}
              style={styles.flex1}
              contentContainerStyle={styles.sheetScroll}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {guide.videoId ? <VideoBox videoId={guide.videoId} onOpenAlert={onOpenAlert} /> : null}

              <Animated.View style={{ opacity: fade, transform: [{ translateX: slide }] }}>
                <View style={[styles.bigBadge, { backgroundColor: a.glow, borderColor: a.border, borderWidth: a.highContrast ? 2 : 0 }]}>
                  <Text style={a.t(20, '900', theme.primary, localMult)}>{st.step}</Text>
                </View>
                <Text style={[a.t(22, '900', theme.text, localMult), { marginBottom: 10 }]}>{st.title}</Text>
                <Text style={a.t(15.5, '500', a.dim, localMult)}>{st.desc}</Text>
              </Animated.View>
            </ScrollView>
          </View>

          {total <= 14 ? (
            <View style={styles.dots}>
              {steps.map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => changeStep(i, i > index ? 'next' : 'prev')}
                  hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Adım ${i + 1}`}
                  style={[styles.dot, { backgroundColor: i === index ? theme.primary : a.border, width: i === index ? 20 : 7 }]}
                />
              ))}
            </View>
          ) : null}

          <View style={[styles.fontBar, { borderTopColor: a.border }]}>
            <Text style={a.t(12, '600', a.muted)}>Yazı boyutu</Text>
            <View style={styles.fontCtl}>
              <TouchableOpacity
                onPress={() => bump(-LOCAL_STEP)} disabled={atMin} accessibilityLabel="Yazıyı küçült"
                style={[styles.fontBtn, { width: a.minTouch - 8, height: a.minTouch - 8, borderColor: a.border, borderWidth: a.bw, backgroundColor: theme.surfaceElevated, opacity: atMin ? 0.4 : 1 }]}
              >
                <Ionicons name="remove" size={a.fs(16)} color={theme.text} />
              </TouchableOpacity>
              <Text style={[a.t(12, '700', a.muted), styles.fontPct]}>{Math.round(localMult * 100)}%</Text>
              <TouchableOpacity
                onPress={() => bump(LOCAL_STEP)} disabled={atMax} accessibilityLabel="Yazıyı büyüt"
                style={[styles.fontBtn, { width: a.minTouch - 8, height: a.minTouch - 8, borderColor: a.border, borderWidth: a.bw, backgroundColor: theme.surfaceElevated, opacity: atMax ? 0.4 : 1 }]}
              >
                <Ionicons name="add" size={a.fs(16)} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.navRow}>
            <TouchableOpacity
              onPress={() => changeStep(index - 1, 'prev')} disabled={isFirst}
              accessibilityRole="button"
              accessibilityLabel="Önceki adım"
              style={[styles.navBtn, { minHeight: a.minTouch + 4, backgroundColor: theme.surfaceElevated, borderColor: a.border, borderWidth: a.bw, opacity: isFirst ? 0.4 : 1 }]}
            >
              <Ionicons name="chevron-back" size={a.fs(20)} color={theme.text} />
              <Text style={a.t(14, '700')}>Önceki</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={isLast ? onClose : () => changeStep(index + 1, 'next')}
              accessibilityRole="button"
              accessibilityLabel={isLast ? 'Bitir' : 'Sonraki adım'}
              style={[styles.navBtn, { minHeight: a.minTouch + 4, backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: a.bw }]}
            >
              <Text style={a.t(14, '800', a.onPrimary)}>{isLast ? 'Bitir' : 'Sonraki'}</Text>
              <Ionicons name={isLast ? 'checkmark' : 'chevron-forward'} size={a.fs(20)} color={a.onPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   Namaz detay modalı
   ================================================================ */
const PrayerDetailModal = memo(function PrayerDetailModal({ item, onClose }) {
  const a = useA11y();
  const { theme } = a;
  const { height: winH } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const onShare = useCallback(async () => {
    if (!item) return;
    try {
      await Share.share({
        message: `${item.name}\n${item.rakats || ''}\n\n${item.details || ''}\n\nVakit: ${item.vakit || '-'}\n\nNİDA — Namaz Rehberi`,
      });
    } catch {}
  }, [item]);

  if (!item) return null;

  const blocks = [
    { label: 'Kılınışı', text: item.details, icon: 'footsteps-outline' },
    { label: 'Okunan Dualar', text: item.duas, icon: 'book-outline' },
    { label: 'Vakit', text: item.vakit, icon: 'time-outline' },
  ].filter((b) => !!b.text);

  return (
    <Modal visible transparent animationType={a.reduceMotion ? 'none' : 'slide'} onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityLabel="Kapat" />
        <View
          style={[
            styles.sheet,
            { maxHeight: Math.min(winH * 0.88, winH - insets.top - 8), paddingBottom: Math.max(insets.bottom, 12), backgroundColor: theme.surface, borderColor: a.border, borderWidth: a.bw },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: a.border }]} />
          <View style={styles.sheetTop}>
            <View style={styles.flex1}>
              <Text accessibilityRole="header" style={a.t(19, '900')} numberOfLines={2}>{item.name}</Text>
              {item.rakats ? <Text style={[a.t(13, '700', theme.primary), { marginTop: 2 }]}>{item.rakats}</Text> : null}
            </View>
            <IconButton name="share-social-outline" onPress={onShare} label="Paylaş" />
            <IconButton name="close" onPress={onClose} label="Kapat" />
          </View>

          <ScrollView style={styles.detailScroll} contentContainerStyle={styles.detailContent} showsVerticalScrollIndicator>
            {blocks.length === 0 ? (
              <Text style={a.t(14, '500', a.dim)}>Bu namaz için ayrıntılı bilgi bulunamadı.</Text>
            ) : blocks.map((b) => (
              <View key={b.label} style={[styles.detailBox, { backgroundColor: theme.surfaceElevated, borderColor: a.border, borderWidth: a.bw }]}>
                <View style={styles.detailLabelRow}>
                  <Ionicons name={b.icon} size={a.fs(15)} color={theme.primary} />
                  <Text style={a.t(12, '800', theme.primary)}>{b.label.toUpperCase()}</Text>
                </View>
                <Text style={a.t(14.5, '500')}>{b.text}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   Genel bilgi — akordeon kartı
   ================================================================ */
const InfoCard = memo(function InfoCard({ data, isOpen, onToggle }) {
  const a = useA11y();
  const { theme } = a;
  const bullets = arr(data?.bullets);

  return (
    <Card>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${data?.title} bilgisi. ${isOpen ? 'Açık, kapatmak için dokunun' : 'Kapalı, açmak için dokunun'}`}
        style={[styles.infoHead, { minHeight: a.minTouch }]}
      >
        <View style={[styles.infoIcon, { backgroundColor: a.glow, borderColor: a.border, borderWidth: a.highContrast ? 2 : 0 }]}>
          <Ionicons name={data?.icon || 'book-outline'} size={a.fs(20)} color={theme.primary} />
        </View>
        <View style={styles.flex1}>
          <Text style={a.t(15, '800')}>{data?.title}</Text>
          {!isOpen && bullets.length > 0 ? (
            <Text style={[a.t(12, '600', a.muted), { marginTop: 2 }]}>{bullets.length} madde</Text>
          ) : null}
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={a.fs(18)} color={a.muted} />
      </TouchableOpacity>

      {data?.body ? (
        <Text style={[a.t(13.5, '500', a.dim), { marginTop: 8 }]} numberOfLines={isOpen ? undefined : 2}>
          {data.body}
        </Text>
      ) : null}

      {isOpen && bullets.length > 0 ? (
        <View style={styles.bullets}>
          {bullets.map((b, i) => (
            <View key={`${b.label}-${i}`} style={[styles.bulletRow, { backgroundColor: theme.surfaceElevated, borderColor: a.border, borderWidth: a.highContrast ? 1 : 0 }]}>
              <View style={[styles.badgeSm, { backgroundColor: theme.primary }]}>
                <Text style={a.t(11, '900', a.onPrimary)}>{i + 1}</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={a.t(13.5, '800')}>{b.label}</Text>
                <Text style={[a.t(12.5, '500', a.dim), { marginTop: 1 }]}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
});

/* ================================================================
   Kılınış adımlarını kişi / vakte göre üret
   ================================================================ */
function buildKilinisSteps(person, vakitId, bolumAdi) {
  const vakitObj = VAKITLER.find((v) => v.id === vakitId) || VAKITLER[0];
  const isFemale = person === 'kadin' || person === 'kiz_cocuk';
  const isChild = person === 'erkek_cocuk' || person === 'kiz_cocuk';

  // Bölüm adının son harfine ve sesli uyumuna göre doğru ek (-ine, -ne, -na vb.) seçilir
  const getBolumSuffix = (bolum) => {
    const b = bolum.toLowerCase();
    if (b.includes('sünnet')) return 'sünnetini';
    if (b.includes('farz')) return 'farzını';
    if (b.includes('vitr')) return 'vitrini';
    return `${bolum}ni`;
  };

  return arr(PRAYER_STEPS).map((base) => {
    let desc = base.desc;

    if (base.step === 1) {
      const ekliBolum = getBolumSuffix(bolumAdi);
      desc = `Kalpten niyet edilir: "Niyet ettim Allah rızası için ${vakitObj.label} namazının ${ekliBolum} kılmaya."`;
    }

    if (base.step === 2) {
      desc = isFemale
        ? 'Eller omuz hizasına kaldırılır, avuç içleri kıbleye bakar. "Allahu Ekber" denir ve eller göğüs üzerinde bağlanır.'
        : 'Eller kulak hizasına kaldırılır, başparmaklar kulak yumuşağına değer, avuç içleri kıbleye bakar. "Allahu Ekber" denir ve eller göbek altında bağlanır.';
    }

    if (base.step === 5) {
      desc = isFemale
        ? 'Hafifçe eğilinir; erkekler kadar düz eğilmez. Eller dizlerin üzerine konur, parmaklar bitişik tutulur. 3 kere "Sübhâne Rabbiye\'l-Azîm" denir.'
        : 'Sırt ve baş yere paralel olacak şekilde eğilinir. Eller diz kapaklarını kavrar, parmaklar açıktır. 3 kere "Sübhâne Rabbiye\'l-Azîm" denir.';
    }

    if (base.step === 6) {
      desc = isFemale
        ? '"Semi\'allahu limen hamideh, Rabbenâ leke\'l-hamd" denilerek doğrulunur. "Allahu Ekber" ile secdeye varılır; kollar vücuda bitişik, karın uyluklara yakındır. Alın, burun, avuç içi, dizler ve ayak parmakları yere değer. 3 kere "Sübhâne Rabbiye\'l-A\'lâ" denir.'
        : '"Semi\'allahu limen hamideh, Rabbenâ leke\'l-hamd" denilerek doğrulunur. "Allahu Ekber" ile secdeye varılır; dirsekler yere değmez, yanlara açık tutulur. Alın, burun, avuç içi, dizler ve ayak parmakları yere değer. 3 kere "Sübhâne Rabbiye\'l-A\'lâ" denir.';
    }

    if (isChild) {
      desc += ' Çocuklar için not: Acele etmeden, her hareketi güzelce yapmaya çalış. Allah seni sevgiyle izliyor.';
    }

    return { ...base, desc };
  });
}

/* ================================================================
   Ana ekran
   ================================================================ */
export default function NamazRehberiScreen({ onBack }) {
  const getTheme = useAppStore((s) => s.getTheme);
  const themeMode = useAppStore((s) => s.themeMode);
  const accentColor = useAppStore((s) => s.accentColor);
  const highContrast = useAppStore((s) => s.highContrast) ?? false;
  const reduceMotion = useAppStore((s) => s.reduceMotion) ?? false;
  const largeTouch = useAppStore((s) => s.largeTouchTargets) ?? false;
  const dyslexia = useAppStore((s) => s.dyslexiaFont) ?? false;
  const isSimpleMode = useAppStore((s) => s.isSimpleMode) ?? false;
  const readingScale = useAppStore((s) => s.readingFontScale) ?? 1;

  const theme = useMemo(() => getTheme(), [getTheme, themeMode, accentColor]); // eslint-disable-line react-hooks/exhaustive-deps

  const a11y = useMemo(
    () => buildA11y(theme, { highContrast, reduceMotion, largeTouch, dyslexia, readingScale }),
    [theme, highContrast, reduceMotion, largeTouch, dyslexia, readingScale],
  );

  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const isWide = winW >= 700;

  const lightModes = ['light', 'modernLight', 'sepia', 'sand'];
  const statusBarStyle = lightModes.includes(theme.mode) ? 'dark-content' : 'light-content';

  const [activeTab, setActiveTab] = useState(SECTIONS?.[0]?.id || 'bilgi');
  const [openInfoId, setOpenInfoId] = useState(arr(GENERAL_INFO)[0]?.id ?? null);
  const [prayerDetail, setPrayerDetail] = useState(null);
  const [guide, setGuide] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFab, setShowFab] = useState(false);
  const [person, setPerson] = useState('erkek');
  const [vakitId, setVakitId] = useState('sabah');
  const [bolumAdi, setBolumAdi] = useState('Farz');

  const [confirmModalData, setConfirmModalData] = useState(null);

  const scrollRef = useRef(null);
  const tabScrollRef = useRef(null);
  const tabX = useRef({});
  const guideKey = useRef(0);

  const sections = useMemo(() => arr(SECTIONS), []);

  const handleTabChange = useCallback((id) => {
    if (id === activeTab) return;
    hapticLight();
    setActiveTab(id);
    setSearchQuery('');
    try { scrollRef.current?.scrollTo({ y: 0, animated: false }); } catch {}
  }, [activeTab]);

  useEffect(() => {
    const x = tabX.current[activeTab];
    if (typeof x === 'number') {
      try { tabScrollRef.current?.scrollTo({ x: Math.max(x - 20, 0), animated: !reduceMotion }); } catch {}
    }
  }, [activeTab, reduceMotion]);

  const handleVakitChange = useCallback((newVakitId) => {
    hapticLight();
    setVakitId(newVakitId);
    const vObj = VAKITLER.find((v) => v.id === newVakitId);
    if (vObj && vObj.bolumler?.length > 0) {
      setBolumAdi(vObj.bolumler[0]);
    }
  }, []);

  const vakitObj = useMemo(() => VAKITLER.find((v) => v.id === vakitId) || VAKITLER[0], [vakitId]);

  const kilinisSteps = useMemo(() => buildKilinisSteps(person, vakitId, bolumAdi), [person, vakitId, bolumAdi]);
  const wuduSteps = useMemo(() => arr(WUDU_STEPS), []);

  const filteredCategories = useMemo(() => {
    const q = normalizeForSearch(searchQuery);
    const cats = arr(PRAYER_CATEGORIES);
    if (!q) return cats;
    return cats
      .map((cat) => ({
        ...cat,
        items: arr(cat.items).filter((it) =>
          normalizeForSearch(it.name).includes(q) ||
          normalizeForSearch(it.rakats).includes(q) ||
          normalizeForSearch(it.details).includes(q) ||
          normalizeForSearch(it.duas).includes(q) ||
          normalizeForSearch(it.vakit).includes(q)),
      }))
      .filter((cat) => cat.items.length > 0);
  }, [searchQuery]);

  const openGuide = useCallback((payload) => {
    if (!payload || arr(payload.steps).length === 0) return;
    hapticLight();
    guideKey.current += 1;
    setGuide({ ...payload, key: guideKey.current });
  }, [guideKey]);

  const openWudu = useCallback((initialIndex = 0) => {
    openGuide({
      title: 'Abdest Alınışı',
      subtitle: `${wuduSteps.length} adımda abdest`,
      steps: wuduSteps,
      videoId: null,
      initialIndex,
    });
  }, [openGuide, wuduSteps]);

  const openKilinis = useCallback((initialIndex = 0) => {
    const tumKategoriler = KISILER_GRUP.flatMap((g) => g.secenekler);
    const secilenKisiObj = tumKategoriler.find((k) => k.id === person);
    const kisiLabel = secilenKisiObj ? secilenKisiObj.label : '';
    openGuide({
      title: `${vakitObj.label} Namazı (${bolumAdi}) — ${kisiLabel}`,
      subtitle: `${kilinisSteps.length} adımda kılınış`,
      steps: kilinisSteps,
      videoId: PRAYER_VIDEOS[person]?.[vakitId] || null,
      initialIndex,
    });
  }, [openGuide, person, vakitObj, bolumAdi, kilinisSteps, vakitId]);

  const handleOpenAlert = useCallback((videoId) => {
    setConfirmModalData({
      title: 'Uygulamadan Ayrılıyorsunuz',
      message: 'Anlatım videosunu izlemek için YouTube uygulamasına veya tarayıcınıza yönlendirileceksiniz. Devam etmek istiyor musunuz?',
      onConfirm: () => {
        setConfirmModalData(null);
        Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`).catch(() => {});
      },
    });
  }, []);

  const handleScroll = useCallback((e) => {
    const show = e.nativeEvent.contentOffset.y > 400;
    setShowFab((prev) => (prev === show ? prev : show));
  }, []);

  const scrollToTop = useCallback(() => {
    hapticLight();
    try { scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion }); } catch {}
  }, [reduceMotion]);

  const renderBilgi = () => (
    <View style={styles.stack}>
      {arr(GENERAL_INFO).map((item) => (
        <InfoCard
          key={item.id}
          data={item}
          isOpen={openInfoId === item.id}
          onToggle={() => { hapticLight(); setOpenInfoId((p) => (p === item.id ? null : item.id)); }}
        />
      ))}
    </View>
  );

  const renderAbdest = () => (
    <View style={styles.stack}>
      <HeroCard
        eyebrow="ADIM ADIM REHBER"
        title="Abdest Alınışı"
        desc={`${wuduSteps.length} adım — dokun ve başla`}
        onPress={() => openWudu(0)}
      />
      {!isSimpleMode ? <SectionTitle>Adımlar</SectionTitle> : null}
      {wuduSteps.map((st, i) => (
        <StepRow key={st.step} st={st} onPress={() => openWudu(i)} />
      ))}
    </View>
  );

  const renderKilinis = () => {
    const tumKategoriler = KISILER_GRUP.flatMap((g) => g.secenekler);
    const secilenKisiObj = tumKategoriler.find((k) => k.id === person);
    const kisiLabel = secilenKisiObj ? secilenKisiObj.label : '';

    return (
      <View style={styles.stack}>
        <Card style={styles.pickerCard}>
          <Text style={[a11y.t(12, '800', a11y.muted), styles.pickerLabel]}>KİM İÇİN</Text>
          
          <View style={styles.kisiGruplariContainer}>
            {KISILER_GRUP.map((grup) => (
              <View key={grup.grupKey} style={styles.grupBox}>
                <Text style={[a11y.t(12, '700', theme.primary), styles.grupBaslik]}>{grup.grupBaslik}</Text>
                <View style={styles.grupSeceneklerRow}>
                  {grup.secenekler.map((item) => (
                    <Chip
                      key={item.id}
                      label={item.label}
                      active={person === item.id}
                      onPress={() => { hapticLight(); setPerson(item.id); }}
                      style={styles.flexItem}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>

          <Text style={[a11y.t(12, '800', a11y.muted), styles.pickerLabel, { marginTop: 14 }]}>NAMAZ VAKTİ</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.vakitScrollContent}
          >
            {VAKITLER.map((v) => (
              <Chip
                key={v.id}
                label={v.label}
                active={vakitId === v.id}
                onPress={() => handleVakitChange(v.id)}
              />
            ))}
          </ScrollView>

          {/* Vaktin bölümleri: İki satıra sığabilmesi için flexWrap kullanıldı */}
          {vakitObj.bolumler && vakitObj.bolumler.length > 1 ? (
            <>
              <Text style={[a11y.t(12, '800', a11y.muted), styles.pickerLabel, { marginTop: 14 }]}>KILINACAK BÖLÜM</Text>
              <View style={styles.wrapContainer}>
                {vakitObj.bolumler.map((bolum) => (
                  <Chip
                    key={bolum}
                    label={bolum}
                    active={bolumAdi === bolum}
                    onPress={() => { hapticLight(); setBolumAdi(bolum); }}
                    style={styles.wrapChip}
                  />
                ))}
              </View>
            </>
          ) : null}
        </Card>

        <HeroCard
          eyebrow={`${vakitObj.label.toUpperCase()} · ${bolumAdi.toUpperCase()}`}
          title={`${kisiLabel} Kılınışı`}
          desc={`${kilinisSteps.length} adım${PRAYER_VIDEOS[person]?.[vakitId] ? ' + anlatım videosu' : ''}`}
          onPress={() => openKilinis(0)}
        />

        <SectionTitle>Adımlar</SectionTitle>
        {kilinisSteps.map((st, i) => (
          <StepRow key={st.step} st={st} onPress={() => openKilinis(i)} />
        ))}
      </View>
    );
  };

  const renderNamazlar = () => (
    <View style={styles.stack}>
      <View style={[styles.searchBox, { minHeight: a11y.minTouch, backgroundColor: theme.surface, borderColor: a11y.border, borderWidth: a11y.bw }]}>
        <Ionicons name="search" size={a11y.fs(18)} color={a11y.muted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Namaz ara (ör. vitir, 2 rekât)"
          placeholderTextColor={a11y.muted}
          style={[styles.searchInput, a11y.t(14, '500'), { lineHeight: undefined }]}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          accessibilityLabel="Namaz ara"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Aramayı temizle">
            <Ionicons name="close-circle" size={a11y.fs(18)} color={a11y.muted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {filteredCategories.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="search-outline" size={a11y.fs(40)} color={a11y.muted} />
          <Text style={[a11y.t(13.5, '600', a11y.dim), { textAlign: 'center' }]}>
            "{searchQuery}" ile eşleşen namaz bulunamadı.
          </Text>
        </View>
      ) : filteredCategories.map((cat) => (
        <View key={cat.title} style={styles.catBlock}>
          <View style={styles.catHead}>
            <Text accessibilityRole="header" style={a11y.t(16, '900')}>{cat.title}</Text>
            {cat.description && !isSimpleMode ? (
              <Text style={[a11y.t(12, '500', a11y.dim), { marginTop: 2 }]}>{cat.description}</Text>
            ) : null}
          </View>
          {arr(cat.items).map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => { hapticLight(); setPrayerDetail(item); }}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}. ${item.rakats || ''}`}
              style={[styles.prayerRow, { minHeight: a11y.minTouch + 12, backgroundColor: theme.surface, borderColor: a11y.border, borderWidth: a11y.bw }]}
            >
              <View style={styles.flex1}>
                <Text style={a11y.t(15, '800', theme.primary)} numberOfLines={2}>{item.name}</Text>
                {item.rakats ? <Text style={[a11y.t(12.5, '500', a11y.dim), { marginTop: 2 }]} numberOfLines={2}>{item.rakats}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={a11y.fs(18)} color={a11y.muted} />
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );

  const renderBozanlar = () => (
    <View style={styles.stack}>
      <View style={[styles.warning, { backgroundColor: highContrast ? theme.surface : 'rgba(229,57,53,0.08)', borderColor: '#E53935', borderWidth: a11y.bw }]}>
        <Ionicons name="warning" size={a11y.fs(22)} color="#E53935" />
        <Text style={[a11y.t(13, '600'), styles.flex1]}>
          Aşağıdaki durumlardan biri gerçekleştiğinde namaz bozulur ve yeniden kılınması gerekir.
        </Text>
      </View>
      {arr(BREAKING_REASONS).map((r, i) => (
        <Card key={`${r.title}-${i}`} style={styles.reasonCard}>
          <Ionicons name="close-circle" size={a11y.fs(22)} color="#E53935" style={styles.reasonIcon} />
          <View style={styles.flex1}>
            <Text style={a11y.t(14.5, '800')}>{r.title}</Text>
            <Text style={[a11y.t(13, '500', a11y.dim), { marginTop: 2 }]}>{r.desc}</Text>
          </View>
        </Card>
      ))}
    </View>
  );

  const content = {
    bilgi: renderBilgi,
    abdest: renderAbdest,
    kilinis: renderKilinis,
    namazlar: renderNamazlar,
    bozanlar: renderBozanlar,
  }[activeTab];

  return (
    <A11yContext.Provider value={a11y}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={statusBarStyle} />

        <View style={styles.header}>
          {onBack ? (
            <IconButton name="arrow-back" onPress={onBack} label="Geri" />
          ) : (
            <View style={{ width: a11y.minTouch }} />
          )}
          <Text accessibilityRole="header" style={[a11y.t(20, '900'), styles.headerTitle]} numberOfLines={1}>
            Namaz Rehberi
          </Text>
          <View style={{ width: a11y.minTouch }} />
        </View>

        <View style={styles.tabsWrap}>
          <ScrollView
            ref={tabScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {sections.map((sec) => (
              <View
                key={sec.id}
                onLayout={(e) => { tabX.current[sec.id] = e.nativeEvent.layout.x; }}
              >
                <Chip
                  label={sec.title}
                  icon={sec.icon}
                  active={activeTab === sec.id}
                  onPress={() => handleTabChange(sec.id)}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.flex1}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 12) + 40 },
            isWide && styles.scrollContentWide,
          ]}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={64}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {content ? content() : null}
        </ScrollView>

        {showFab ? (
          <TouchableOpacity
            onPress={scrollToTop}
            accessibilityRole="button"
            accessibilityLabel="Yukarı çık"
            style={[
              styles.fab,
              { bottom: Math.max(insets.bottom, 12) + 16, width: a11y.minTouch + 6, height: a11y.minTouch + 6, borderRadius: (a11y.minTouch + 6) / 2, backgroundColor: theme.primary, borderColor: highContrast ? theme.text : 'transparent', borderWidth: highContrast ? 2 : 0 },
            ]}
          >
            <Ionicons name="arrow-up" size={a11y.fs(22)} color={a11y.onPrimary} />
          </TouchableOpacity>
        ) : null}

        {guide ? <StepModal key={guide.key} guide={guide} onClose={() => setGuide(null)} onOpenAlert={handleOpenAlert} /> : null}
        {prayerDetail ? <PrayerDetailModal item={prayerDetail} onClose={() => setPrayerDetail(null)} /> : null}

        <CustomConfirmModal
          visible={!!confirmModalData}
          title={confirmModalData?.title}
          message={confirmModalData?.message}
          onConfirm={confirmModalData?.onConfirm}
          onCancel={() => setConfirmModalData(null)}
        />
      </SafeAreaView>
    </A11yContext.Provider>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  flex1: { flex: 1 },
  stack: { gap: 12 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 8 },
  headerTitle: { flex: 1, textAlign: 'center' },
  iconBtn: { borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },

  tabsWrap: { marginBottom: 10 },
  tabsContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },

  chip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14 },
  rowWrap: { flexDirection: 'row', gap: 6 },
  flexItem: { flex: 1 },
  pickerCard: { padding: 14 },

  wrapContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  wrapChip: { width: '48%' },

  kisiGruplariContainer: { gap: 10 },
  grupBox: { gap: 6 },
  grupBaslik: { marginBottom: 2 },
  grupSeceneklerRow: { flexDirection: 'row', gap: 6 },

  vakitScrollContent: { gap: 6, alignItems: 'center' },
  pickerLabel: { marginBottom: 8, letterSpacing: 0.6 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },
  scrollContentWide: { width: '100%', maxWidth: 720, alignSelf: 'center' },

  card: { borderRadius: 18, padding: 14 },
  sectionTitle: { marginLeft: 4, marginTop: 6 },

  infoHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  bullets: { marginTop: 12, gap: 8 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 10, borderRadius: 12 },
  badgeSm: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 1 },

  hero: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, gap: 12 },
  playBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },

  stepRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, gap: 12 },
  badge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: 14 },
  searchInput: { flex: 1, paddingVertical: 8 },
  empty: { alignItems: 'center', padding: 36, gap: 12 },
  catBlock: { gap: 8, marginTop: 4 },
  catHead: { marginLeft: 4, marginBottom: 2 },
  prayerRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, gap: 10 },

  warning: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 16 },
  reasonCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  reasonIcon: { marginTop: 1 },

  fab: { position: 'absolute', right: 20, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { width: '100%', alignSelf: 'center', maxWidth: 720, borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 18, paddingTop: 10 },
  handle: { width: 40, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 10 },
  sheetTop: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  track: { flex: 1, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3 },
  sheetScroll: { paddingVertical: 10, flexGrow: 1 },
  bigBadge: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  dot: { height: 7, borderRadius: 4 },
  fontBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, marginBottom: 8 },
  fontCtl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fontBtn: { borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fontPct: { minWidth: 44, textAlign: 'center' },
  navRow: { flexDirection: 'row', gap: 10 },
  navBtn: { flex: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 },

  videoWrap: { marginBottom: 14 },
  videoButtonCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  youtubeIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,0,0,0.1)', alignItems: 'center', justifyContent: 'center' },

  confirmOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmCard: { width: '100%', maxWidth: 380, borderRadius: 24, padding: 22, alignItems: 'center' },
  confirmIconWrap: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  confirmBtnRow: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  confirmBtn: { flex: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },

  detailScroll: { flexShrink: 1 },
  detailContent: { paddingVertical: 8, gap: 12 },
  detailBox: { borderRadius: 14, padding: 14, gap: 6 },
  detailLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});