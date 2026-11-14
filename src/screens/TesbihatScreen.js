// src/screens/TesbihatScreen.js
// ToolsScreen tasarım diliyle uyumlu: hero ilerleme kartı, grup kartları,
// 48px düğmeler, Aa yazı boyutu döngüsü, alt sayfa, büyük dokunma alanları.
//
// NOT 1: Tesbihat her açıldığında sıfırdan başlar. Kaldığın yerden devam YOK.
//        Sadece yazı boyutu ve otomatik ilerleme tercihi kalıcıdır.
// NOT 2: Zikir kuralı — aktif adım sayaç ise ve hedef tamamlanmadıysa ileri
//        gitme kilitlidir. Geri gitme her zaman serbesttir. "Bitir" için
//        tüm sayaçlar tamamlanmış olmalıdır.
// NOT 3: Okuma modu Ayarlar'dan veya sure adımlarındaki badge üzerinden
//        değiştirilebilir.
// NOT 4: Vakit seçicide AKTİF vakit her zaman ilk sırada gösterilir.
//        Önerilen vakit farklıysa 2. sıradadır. Böylece açılışta kaydırma
//        gerekmeden aktif vakit görünür.
//
// NOT 5 (Disleksi): Font ailesini ASLA açıkça set etmiyoruz. AppText
//        dyslexiaFont açıksa otomatik olarak OpenDyslexic uygular;
//        Arapça içerik gördüğünde sistem fontuna döner.
import React, {
  useState, useMemo, useCallback, useRef, useEffect, memo,
} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  Alert,
  ActivityIndicator,
  Vibration,
  Modal,
  Switch,
  AccessibilityInfo,
  useWindowDimensions,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppStore } from '../store/useAppStore';
import {
  TESBIHAT_TYPES,
  getTesbihatTypeById,
  getTotalZikirCount,
  getRecommendedTypeId,
} from '../data/tesbihat';

/* ---------- Opsiyonel modüller ---------- */
let useKeepAwake = () => {};
try { useKeepAwake = require('expo-keep-awake').useKeepAwake ?? useKeepAwake; } catch {}

let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}
const hapticImpact = (style = 'light') => {
  try {
    if (!Haptics?.impactAsync) return;
    const m = Haptics.ImpactFeedbackStyle ?? {};
    Haptics.impactAsync(style === 'medium' ? m.Medium : style === 'heavy' ? m.Heavy : m.Light);
  } catch {}
};
const hapticSuccess = () => {
  try { Haptics?.notificationAsync?.(Haptics.NotificationFeedbackType?.Success); } catch {}
};

/* ---------- Sabitler ---------- */
const FONT_SCALES = [1, 1.25, 1.5];
const FONT_LABELS = ['Aa', 'Aa+', 'Aa++'];
const FONT_NAMES = ['Normal', 'Büyük', 'Çok Büyük'];
const FONT_KEY = 'nida-tesbihat-font-idx-v2';
const AUTO_KEY = 'nida-tesbihat-auto-v1';
const AUTO_ADVANCE_MS = 1400;
const DONE = '#24A875';
const DANGER = '#D6453D';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const STEP_META = {
  sure: { icon: 'book-outline', label: 'Sûre' },
  info: { icon: 'heart-outline', label: 'Dua' },
  counter: { icon: 'finger-print-outline', label: 'Zikir' },
};

const READING_MODE_OPTIONS = [
  { id: 'full',           name: 'Tam Metin',        desc: 'Arapça + Okunuş + Meal',          icon: 'book-outline' },
  { id: 'arabic-only',    name: 'Sadece Arapça',    desc: 'Yalnızca orijinal metin',         icon: 'language-outline' },
  { id: 'latin-only',     name: 'Sadece Okunuş',    desc: 'Latin harfli okunuş',             icon: 'text-outline' },
  { id: 'meaning-only',   name: 'Sadece Meal',      desc: 'Türkçe anlam',                    icon: 'document-text-outline' },
  { id: 'latin-meaning',  name: 'Okunuş + Meal',    desc: 'Latin okunuş ve Türkçe anlam',    icon: 'reader-outline' },
  { id: 'arabic-latin',   name: 'Arapça + Okunuş',  desc: 'Orijinal metin ve okunuş',        icon: 'copy-outline' },
];

const partsFromMode = (mode) => ({
  arabic: ['full', 'arabic-only', 'arabic-latin'].includes(mode),
  latin: ['full', 'latin-only', 'latin-meaning', 'arabic-latin'].includes(mode),
  meaning: ['full', 'meaning-only', 'latin-meaning'].includes(mode),
});

/* ================================================================
   Ortak bileşenler
   ================================================================ */
const IslamicDecor = memo(function IslamicDecor({ color }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <MaterialCommunityIcons
        name="star-crescent" size={200} color={color}
        style={{ position: 'absolute', right: -50, top: -50, opacity: 0.05, transform: [{ rotate: '22.5deg' }] }}
      />
    </View>
  );
});

const PressableScale = memo(function PressableScale({
  onPress, onLongPress, children, style, containerStyle, disabled,
  scaleTo = 0.96, accessibilityLabel, accessibilityRole = 'button',
  accessibilityState, haptic = 'light', delayLongPress = 500,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = useCallback(() => {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 60, bounciness: 5 }).start();
  }, [scale, scaleTo]);
  const pressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 5 }).start();
  }, [scale]);
  const handlePress = useCallback((e) => {
    if (haptic) hapticImpact(haptic);
    onPress?.(e);
  }, [onPress, haptic]);
  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handlePress}
        onLongPress={onLongPress}
        delayLongPress={delayLongPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityState={accessibilityState}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
});

const SectionHeader = memo(function SectionHeader({ title, theme, fs }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionLabel, { color: theme.text, fontSize: fs(13) }]}>
        {title.toLocaleUpperCase('tr-TR')}
      </Text>
      <View style={[styles.sectionHeaderLine, { backgroundColor: theme.border }]} />
    </View>
  );
});

const Toast = memo(function Toast({ toast, theme, top, fs, highContrast }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: toast.visible ? 1 : 0, duration: 200, useNativeDriver: true }).start();
  }, [toast.visible, a]);
  const info = toast.kind === 'info';
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, {
        top,
        backgroundColor: highContrast ? '#121212' : (info ? theme.text : theme.primary),
        borderColor: highContrast ? '#FFFF00' : 'transparent',
        borderWidth: highContrast ? 2 : 0,
        opacity: a,
        transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }],
      }]}
    >
      <Ionicons name={info ? 'information-circle' : 'checkmark-circle'} size={fs(18)} color={highContrast ? '#FFFF00' : (info ? theme.background : '#FFF')} />
      <Text style={[styles.toastText, { color: highContrast ? '#FFFF00' : (info ? theme.background : '#FFF'), fontSize: fs(14), fontWeight: highContrast ? '900' : '700' }]} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
});

/* ================================================================
   Öneri Noktası
   ================================================================ */
const PulseDot = memo(function PulseDot({ color }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  return (
    <Animated.View
      style={[styles.recDot, { backgroundColor: color, opacity: pulse }]}
    />
  );
});

/* ================================================================
   Vakit seçici — aktif vakit İLK sırada
   ================================================================ */
const TypeSelector = memo(function TypeSelector({
  theme, types, activeId, recommendedId, onSelect, fs, highContrast,
}) {
  const scrollRef = useRef(null);

  useEffect(() => {
    try {
      scrollRef.current?.scrollTo({ x: 0, animated: true });
    } catch {}
  }, [activeId]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.typeScroll}
      contentContainerStyle={styles.typeContent}
    >
      {types.map((t, i) => {
        const active = t.id === activeId;
        const rec = t.id === recommendedId && !active;
        return (
          <PressableScale
            key={t.id}
            onPress={() => onSelect(t.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${t.name}${rec ? ', şu an için önerilen' : ''}${active ? ', aktif' : ''}${i === 0 ? ', ilk sırada' : ''}`}
            style={[
              styles.typeChip,
              {
                minHeight: fs(active ? 52 : 46),
                backgroundColor: active ? theme.primary : (highContrast ? '#121212' : theme.surface),
                borderColor: active ? theme.primary : theme.border,
                borderWidth: active || highContrast ? 2 : 1,
                paddingHorizontal: active ? 15 : 16,
              },
              active && styles.typeChipActive,
            ]}
          >
            <Ionicons
              name={t.icon}
              size={fs(active ? 18 : 17)}
              color={active ? (highContrast ? '#000000' : '#FFF') : theme.textDim}
            />
            <Text
              style={[
                styles.typeChipText,
                {
                  fontSize: fs(active ? 14.5 : 14),
                  color: active ? (highContrast ? '#000000' : '#FFF') : theme.text,
                  fontWeight: highContrast ? '900' : '800',
                },
              ]}
              numberOfLines={1}
            >
              {t.shortName}
            </Text>
            {active ? (
              <Ionicons name="checkmark-circle" size={fs(14)} color={highContrast ? '#000000' : 'rgba(255,255,255,0.95)'} />
            ) : rec ? (
              <PulseDot color={theme.primary} />
            ) : null}
          </PressableScale>
        );
      })}
    </ScrollView>
  );
});

/* ================================================================
   Hero ilerleme kartı — ADIM BAZLI
   ================================================================ */
const ProgressHero = memo(function ProgressHero({
  theme, type, idx, total, doneSteps, counterSteps, done, totalZikir, onPress, fs, isLight, highContrast,
}) {
  const pct = total > 0 ? (idx + 1) / total : 0;

  let sub;
  if (counterSteps > 0) {
    sub = done > 0
      ? `${doneSteps} / ${counterSteps} sayaç · ${done} zikir`
      : `${doneSteps} / ${counterSteps} sayaç tamamlandı`;
  } else {
    sub = `${total} adım`;
  }

  return (
    <View style={styles.heroShadow}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={`Adım ${idx + 1} / ${total}. ${sub}. Tüm adımları görmek için dokun.`}
        style={[styles.heroCard, {
          backgroundColor: highContrast ? '#121212' : (isLight ? '#134E3A' : '#0B231E'),
          borderColor: theme.primary,
          borderWidth: highContrast ? 2 : 1,
        }]}
        scaleTo={0.98}
      >
        <IslamicDecor color={theme.primary} />
        <View style={styles.heroTop}>
          <View style={[styles.heroIconGlass, {
            width: fs(50), height: fs(50), borderRadius: fs(17),
            backgroundColor: highContrast ? '#000000' : 'rgba(255,255,255,0.08)',
            borderColor: theme.border,
            borderWidth: highContrast ? 2 : 1,
          }]}>
            <Ionicons name={type.icon} size={fs(26)} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { fontSize: fs(18), color: theme.text, fontWeight: highContrast ? '900' : '900' }]}>
              Adım {idx + 1} / {total}
            </Text>
            <Text style={[styles.heroSub, { fontSize: fs(13.5), color: theme.textDim, fontWeight: highContrast ? '700' : '600' }]} numberOfLines={1}>
              {sub}
            </Text>
          </View>
          <View style={[styles.heroAction, { backgroundColor: highContrast ? '#1E1E1E' : 'rgba(255,255,255,0.1)', borderWidth: highContrast ? 2 : 0, borderColor: theme.border }]}>
            <Text style={[styles.heroActionText, { fontSize: fs(12), color: theme.primary, fontWeight: highContrast ? '900' : '800' }]}>Adımlar</Text>
            <Ionicons name="chevron-up" size={fs(16)} color={theme.primary} />
          </View>
        </View>
        <View style={[styles.heroTrack, { backgroundColor: highContrast ? '#1E1E1E' : 'rgba(255,255,255,0.15)', height: highContrast ? 8 : 6 }]}>
          <View style={[styles.heroFill, { width: `${Math.round(clamp(pct, 0, 1) * 100)}%`, backgroundColor: theme.primary }]} />
        </View>
      </PressableScale>
    </View>
  );
});

/* ================================================================
   Okuma modu badge
   ================================================================ */
const ReadingModeBadge = memo(function ReadingModeBadge({ theme, fs, modeId, onPress, highContrast }) {
  const mode = READING_MODE_OPTIONS.find((m) => m.id === modeId) || READING_MODE_OPTIONS[0];
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Okuma modu: ${mode.name}. Değiştirmek için dokun.`}
      style={[styles.readingModeBadge, {
        backgroundColor: highContrast ? '#121212' : `${theme.primary}0D`,
        borderColor: theme.primary,
        borderWidth: highContrast ? 2 : 1,
      }]}
    >
      <Ionicons name={mode.icon} size={fs(13)} color={theme.primary} />
      <Text
        style={[styles.readingModeBadgeText, { color: theme.primary, fontSize: fs(11.5), fontWeight: highContrast ? '900' : '800' }]}
        numberOfLines={1}
      >
        {mode.name}
      </Text>
      <Ionicons name="chevron-down" size={fs(12)} color={theme.primary} />
    </PressableScale>
  );
});

/* ================================================================
   Okuma modu alt sayfası
   ================================================================ */
function ReadingModeSheet({ visible, onClose, theme, fs, currentMode, onSelect, bottomInset, highContrast }) {
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityLabel="Kapat" />
        <View style={[styles.modalContent, {
          backgroundColor: theme.background, borderColor: theme.border, borderWidth: highContrast ? 2 : 1,
          paddingBottom: Math.max(24, bottomInset + 12),
        }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: fs(22), fontWeight: highContrast ? '900' : '900' }]}>
                Okuma Modu
              </Text>
              <Text style={[styles.modalSub, { color: theme.textDim, fontSize: fs(13.5), fontWeight: highContrast ? '700' : '500' }]}>
                Sûrelerin nasıl gösterileceğini seç
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { hapticImpact(); onClose(); }}
              accessibilityLabel="Kapat"
              style={[styles.modalClose, { backgroundColor: highContrast ? '#1E1E1E' : theme.surface, borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}
            >
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}>
              {READING_MODE_OPTIONS.map((m, i) => {
                const selected = m.id === currentMode;
                return (
                  <PressableScale
                    key={m.id}
                    onPress={() => onSelect(m.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={m.name}
                    style={[styles.row, i < READING_MODE_OPTIONS.length - 1 && { borderBottomWidth: highContrast ? 2 : StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
                  >
                    <View style={[styles.rowIcon, {
                      width: fs(44), height: fs(44), borderRadius: fs(14),
                      backgroundColor: selected ? theme.primary : (highContrast ? '#000000' : (theme.surfaceElevated || 'transparent')),
                      borderColor: selected ? theme.primary : theme.border,
                      borderWidth: highContrast ? 2 : 1,
                    }]}>
                      <Ionicons name={m.icon} size={fs(20)} color={selected ? (highContrast ? '#000000' : '#FFF') : theme.textDim} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.rowTitle, { color: selected ? theme.primary : theme.text, fontSize: fs(15.5), fontWeight: highContrast ? '900' : '800' }]}>
                        {m.name}
                      </Text>
                      <Text style={[styles.rowSub, { color: theme.textDim, fontSize: fs(12.5), marginTop: 3, fontWeight: highContrast ? '700' : '500' }]} numberOfLines={1}>
                        {m.desc}
                      </Text>
                    </View>
                    {selected
                      ? <Ionicons name="checkmark-circle" size={fs(22)} color={theme.primary} />
                      : <View style={{ width: fs(22) }} />}
                  </PressableScale>
                );
              })}
            </View>

            <Text style={[styles.footerHint, { color: theme.textDim, fontSize: fs(12), fontWeight: highContrast ? '700' : 'normal' }]}>
              Bu ayar ayrıca <Text style={{ fontWeight: '900', color: theme.text }}>Ayarlar › Erişilebilirlik › Okuma Modu</Text> bölümünde de bulunur.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ================================================================
   Okuma görünümü
   ================================================================ */
const ReadingView = memo(function ReadingView({ step, theme, fs, readingMode, highContrast }) {
  const isSure = step.type === 'sure';
  const parts = partsFromMode(readingMode);

  if (!isSure) {
    return (
      <View style={[styles.innerBox, { backgroundColor: highContrast ? '#121212' : theme.background, borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}>
        <Text style={[styles.infoText, { color: theme.text, fontSize: fs(17), lineHeight: fs(29), fontWeight: highContrast ? '700' : '500' }]}>
          {step.text}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 18 }}>
      {parts.arabic && step.arabic ? (
        <View style={[styles.innerBox, { backgroundColor: highContrast ? '#121212' : theme.background, borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}>
          <Text style={[styles.arabic, { color: theme.text, fontSize: fs(26), lineHeight: fs(54), fontWeight: highContrast ? '900' : '500' }]}>
            {step.arabic}
          </Text>
        </View>
      ) : null}

      {parts.latin && step.latin ? (
        <View>
          <SectionHeader title="Okunuşu" theme={theme} fs={fs} />
          <Text style={[styles.latin, { color: theme.text, fontSize: fs(16), lineHeight: fs(26), fontWeight: highContrast ? '700' : '500' }]}>
            {step.latin}
          </Text>
        </View>
      ) : null}

      {parts.meaning && step.meaning ? (
        <View>
          <SectionHeader title="Anlamı" theme={theme} fs={fs} />
          <Text style={[styles.meaning, { color: theme.textDim, fontSize: fs(15), lineHeight: fs(25), fontWeight: highContrast ? '700' : '500' }]}>
            {step.meaning}
          </Text>
        </View>
      ) : null}

      {step.source ? (
        <View style={styles.sourceWrap}>
          <View style={[styles.sourceBadge, { backgroundColor: highContrast ? '#1E1E1E' : (theme.surfaceElevated || theme.background), borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}>
            <Ionicons name="book-outline" size={fs(13)} color={theme.textDim} />
            <Text style={[styles.sourceText, { color: theme.textDim, fontSize: fs(12), fontWeight: highContrast ? '900' : '700' }]}>
              {step.source}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
});

/* ================================================================
   Tesbih halkası sayaç
   ================================================================ */
const BeadCounter = memo(function BeadCounter({
  theme, step, count, fs, onTap, onUndo, onReset, nextTitle, highContrast,
}) {
  const { width } = useWindowDimensions();
  const ring = Math.min(300, width - 96);
  const complete = count >= step.target;
  const accent = complete ? DONE : theme.primary;
  const bead = step.target > 20 ? 11 : 18;
  const radius = ring / 2 - 14;
  const progress = step.target > 0 ? count / step.target : 0;
  const pulse = useRef(new Animated.Value(1)).current;

  const beads = useMemo(() => Array.from({ length: step.target }, (_, i) => {
    const a = (i / step.target) * Math.PI * 2;
    return { i, x: ring / 2 + radius * Math.sin(a), y: ring / 2 - radius * Math.cos(a) };
  }), [step.target, ring, radius]);

  const tap = () => {
    Animated.sequence([
      Animated.timing(pulse, { toValue: 0.97, duration: 50, useNativeDriver: true }),
      Animated.spring(pulse, { toValue: 1, speed: 40, bounciness: 8, useNativeDriver: true }),
    ]).start();
    onTap();
  };

  return (
    <View style={styles.counterWrap}>
      {step.arabic ? (
        <Text style={[styles.counterArabic, { color: theme.primary, fontSize: fs(28), lineHeight: fs(46), fontWeight: highContrast ? '900' : '700' }]}>
          {step.arabic}
        </Text>
      ) : null}

      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={tap}
          onLongPress={onUndo}
          delayLongPress={500}
          accessibilityRole="button"
          accessibilityLabel={`${step.title}. ${count} / ${step.target}. Dokununca bir artar.`}
          style={{ width: ring, height: ring }}
        >
          <View
            style={{
              position: 'absolute', left: 36, top: 36, right: 36, bottom: 36,
              borderRadius: ring, backgroundColor: accent, opacity: 0.07 + progress * 0.15,
            }}
          />
          {beads.map((b) => {
            const filled = b.i < count;
            const current = b.i === count && !complete;
            const size = current ? bead + 6 : bead;
            return (
              <View
                key={b.i}
                style={{
                  position: 'absolute', left: b.x - size / 2, top: b.y - size / 2,
                  width: size, height: size, borderRadius: size / 2,
                  backgroundColor: filled ? accent : current ? (highContrast ? '#000000' : theme.background) : theme.border,
                  borderWidth: current || highContrast ? 2.5 : 0, borderColor: accent,
                }}
              />
            );
          })}
          <View style={styles.counterCenter} pointerEvents="none">
            <Text style={[styles.counterNumber, { color: accent, fontSize: fs(68), fontWeight: highContrast ? '900' : '900' }]}>
              {count}
            </Text>
            <Text style={[styles.counterTarget, { color: theme.textDim, fontSize: fs(15), fontWeight: highContrast ? '900' : '700' }]}>
              {complete ? 'Tamamlandı' : `/ ${step.target}`}
            </Text>
            {complete ? (
              <Ionicons name="checkmark-circle" size={fs(24)} color={DONE} style={{ marginTop: 6 }} />
            ) : null}
          </View>
        </TouchableOpacity>
      </Animated.View>

      <Text style={[styles.counterHint, { color: theme.textDim, fontSize: fs(13.5), fontWeight: highContrast ? '700' : '600' }]}>
        {complete && nextTitle ? `Sıradaki: ${nextTitle}` : 'Saymak için halkaya dokun'}
      </Text>

      <View style={styles.counterActions}>
        <PressableScale
          onPress={onUndo}
          disabled={count <= 0}
          containerStyle={{ flex: 1, opacity: count <= 0 ? 0.4 : 1 }}
          accessibilityLabel="Bir zikir geri al"
          haptic="medium"
          style={[styles.actionBtn, { minHeight: fs(50), backgroundColor: highContrast ? '#121212' : (theme.surfaceElevated || theme.background), borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}
        >
          <Ionicons name="arrow-undo-outline" size={fs(19)} color={theme.text} />
          <Text style={[styles.actionBtnText, { color: theme.text, fontSize: fs(14), fontWeight: highContrast ? '900' : '800' }]}>Geri al</Text>
        </PressableScale>
        <PressableScale
          onPress={onReset}
          disabled={count <= 0}
          containerStyle={{ flex: 1, opacity: count <= 0 ? 0.4 : 1 }}
          accessibilityLabel="Bu adımı sıfırla"
          style={[styles.actionBtn, { minHeight: fs(50), backgroundColor: highContrast ? '#121212' : (theme.surfaceElevated || theme.background), borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}
        >
          <Ionicons name="refresh-outline" size={fs(19)} color={theme.text} />
          <Text style={[styles.actionBtnText, { color: theme.text, fontSize: fs(14), fontWeight: highContrast ? '900' : '800' }]}>Sıfırla</Text>
        </PressableScale>
      </View>
    </View>
  );
});

/* ================================================================
   Alt sayfa — adımlar ve ayarlar
   ================================================================ */
function StepsSheet({
  visible, onClose, theme, fs, steps, counts, idx, onJump, onResetAll,
  autoAdvance, setAutoAdvance, typeName, bottomInset, canGoTo, highContrast,
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} accessibilityLabel="Kapat" />
        <View style={[styles.modalContent, {
          backgroundColor: theme.background, borderColor: theme.border, borderWidth: highContrast ? 2 : 1,
          paddingBottom: Math.max(24, bottomInset + 12),
        }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.modalTitle, { color: theme.text, fontSize: fs(22), fontWeight: highContrast ? '900' : '900' }]}>Adımlar</Text>
              <Text style={[styles.modalSub, { color: theme.textDim, fontSize: fs(13.5), fontWeight: highContrast ? '700' : '500' }]} numberOfLines={1}>{typeName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => { hapticImpact(); onClose(); }}
              accessibilityLabel="Kapat"
              style={[styles.modalClose, { backgroundColor: highContrast ? '#1E1E1E' : theme.surface, borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}
            >
              <Ionicons name="close" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}>
              {steps.map((st, i) => {
                const c = counts[st.id] || 0;
                const done = st.type === 'counter' && c >= st.target;
                const active = i === idx;
                const locked = !active && !canGoTo?.(i);
                const meta = STEP_META[st.type] || STEP_META.info;
                return (
                  <PressableScale
                    key={st.id}
                    onPress={() => onJump(i)}
                    accessibilityLabel={`Adım ${i + 1}: ${st.title}${locked ? ', önceki adımı tamamla' : ''}`}
                    accessibilityState={{ selected: active }}
                    style={[styles.row, i < steps.length - 1 && { borderBottomWidth: highContrast ? 2 : StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
                  >
                    <View style={[styles.rowIcon, {
                      width: fs(44), height: fs(44), borderRadius: fs(14),
                      backgroundColor: done ? DONE : active ? theme.primary : (highContrast ? '#000000' : (theme.primaryGlow || theme.surfaceElevated || 'transparent')),
                      borderColor: done ? DONE : active ? theme.primary : theme.border,
                      borderWidth: highContrast ? 2 : 1,
                    }]}>
                      {done
                        ? <Ionicons name="checkmark" size={fs(22)} color={highContrast ? '#000000' : '#FFF'} />
                        : <Text style={[styles.rowIconText, { fontSize: fs(15), color: active ? (highContrast ? '#000000' : '#FFF') : theme.text, fontWeight: highContrast ? '900' : '900' }]}>{i + 1}</Text>}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.rowTitle, { color: active ? theme.primary : theme.text, fontSize: fs(15.5), fontWeight: highContrast ? '900' : '800' }]} numberOfLines={1}>
                        {st.title}
                      </Text>
                      <View style={styles.rowSubRow}>
                        <Ionicons name={meta.icon} size={fs(12)} color={theme.textDim} />
                        <Text style={[styles.rowSub, { color: theme.textDim, fontSize: fs(12.5), fontWeight: highContrast ? '700' : '500' }]} numberOfLines={1}>
                          {st.type === 'counter' ? `${c} / ${st.target}` : st.type === 'sure' ? (st.source || 'Sûre') : 'Dua'}
                        </Text>
                      </View>
                    </View>
                    {active ? (
                      <View style={[styles.nowPill, { backgroundColor: theme.primary, borderWidth: highContrast ? 2 : 0, borderColor: '#000000' }]}>
                        <Text style={[styles.nowPillText, { fontSize: fs(11), color: highContrast ? '#000000' : '#FFF', fontWeight: highContrast ? '900' : '800' }]}>Şu an</Text>
                      </View>
                    ) : locked ? (
                      <Ionicons name="lock-closed" size={fs(18)} color={theme.textDim} />
                    ) : (
                      <Ionicons name="chevron-forward" size={fs(20)} color={theme.textDim} />
                    )}
                  </PressableScale>
                );
              })}
            </View>

            <SectionHeader title="Ayarlar" theme={theme} fs={fs} />
            <View style={[styles.group, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}>
              <View style={[styles.row, { borderBottomWidth: highContrast ? 2 : StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: theme.text, fontSize: fs(15.5), fontWeight: highContrast ? '900' : '800' }]}>Otomatik ilerle</Text>
                  <Text style={[styles.rowSub, { color: theme.textDim, fontSize: fs(12.5), marginTop: 3, fontWeight: highContrast ? '700' : '500' }]}>
                    Sayaç dolunca sonraki adıma geç
                  </Text>
                </View>
                <Switch
                  value={autoAdvance}
                  onValueChange={(v) => { hapticImpact(); setAutoAdvance(v); }}
                  trackColor={{ true: theme.primary, false: theme.border }}
                  accessibilityLabel="Otomatik ilerle"
                />
              </View>
              <PressableScale onPress={onResetAll} accessibilityLabel="Tesbihatı sıfırla" style={styles.row}>
                <View style={[styles.rowIcon, {
                  width: fs(44), height: fs(44), borderRadius: fs(14),
                  backgroundColor: `${DANGER}14`, borderColor: `${DANGER}33`,
                  borderWidth: highContrast ? 2 : 1,
                }]}>
                  <Ionicons name="refresh-outline" size={fs(22)} color={DANGER} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: DANGER, fontSize: fs(15.5), fontWeight: highContrast ? '900' : '800' }]}>Tesbihatı sıfırla</Text>
                  <Text style={[styles.rowSub, { color: theme.textDim, fontSize: fs(12.5), marginTop: 3, fontWeight: highContrast ? '700' : '500' }]}>
                    Tüm sayaçlar ve adım başa döner
                  </Text>
                </View>
              </PressableScale>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ================================================================
   Ana ekran
   ================================================================ */
export default function TesbihatScreen({ onBack }) {
  const getTheme = useAppStore((s) => s.getTheme);
  const highContrast = useAppStore((s) => s.highContrast);

  const rawTheme = getTheme();
  const theme = useMemo(() => {
    if (!highContrast) return rawTheme;
    return {
      ...rawTheme,
      background: '#000000',
      surface: '#121212',
      surfaceElevated: '#1E1E1E',
      text: '#FFFFFF',
      textDim: '#E0E0E0',
      border: '#FFFFFF',
      primary: '#FFFF00',
      primaryGlow: 'rgba(255, 255, 0, 0.3)',
    };
  }, [rawTheme, highContrast]);

  const readingMode = useAppStore((st) => st.readingMode) ?? 'full';
  const setReadingMode = useAppStore((st) => st.setReadingMode);
  const insets = useSafeAreaInsets();
  try { useKeepAwake(); } catch {}

  const recommendedId = useMemo(() => getRecommendedTypeId(), []);

  const [data, setData] = useState({ typeId: recommendedId, counts: {}, idx: 0 });
  const [fontIdx, setFontIdx] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [readingModeSheetOpen, setReadingModeSheetOpen] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false, kind: 'success' });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const fontScale = FONT_SCALES[fontIdx];
  const fs = useCallback((b) => Math.round(b * fontScale), [fontScale]);

  const headerAnim = useRef(new Animated.Value(0)).current;
  const bodyAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef(null);
  const toastTimer = useRef(null);
  const advanceTimer = useRef(null);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => mounted && setReduceMotion(v));
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; sub?.remove?.(); };
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return undefined;
    if (reduceMotion) { headerAnim.setValue(1); bodyAnim.setValue(1); return undefined; }
    const seq = Animated.stagger(85, [
      Animated.timing(headerAnim, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(bodyAnim, { toValue: 1, duration: 440, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    seq.start();
    return () => seq.stop();
  }, [settingsLoaded, reduceMotion, headerAnim, bodyAnim]);

  const makeAnim = (v, off = 10) => ({
    opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [off, 0] }) }],
  });

  const typeId = data.typeId;
  const type = useMemo(() => getTesbihatTypeById(typeId), [typeId]);
  const steps = type.steps;
  const counts = data.counts;
  const idx = clamp(data.idx, 0, steps.length - 1);
  const step = steps[idx];
  const count = counts[step?.id] || 0;
  const isCounter = step?.type === 'counter';
  const complete = isCounter && count >= step.target;
  const isLast = idx >= steps.length - 1;
  const nextTitle = !isLast ? steps[idx + 1]?.title : null;
  const totalZikir = useMemo(() => getTotalZikirCount(typeId), [typeId]);

  const canGoNext = !isCounter || complete;

  const sortedTypes = useMemo(() => {
    const active = TESBIHAT_TYPES.find((t) => t.id === typeId);
    if (!active) return TESBIHAT_TYPES;

    const isSameAsRecommended = typeId === recommendedId;
    const rest = TESBIHAT_TYPES.filter((t) => t.id !== typeId);

    if (isSameAsRecommended) return [active, ...rest];

    const recommended = rest.find((t) => t.id === recommendedId);
    const others = rest.filter((t) => t.id !== recommendedId);
    return recommended ? [active, recommended, ...others] : [active, ...rest];
  }, [typeId, recommendedId]);

  const stats = useMemo(() => {
    let done = 0; let doneSteps = 0; let counterSteps = 0;
    steps.forEach((st) => {
      if (st.type !== 'counter') return;
      counterSteps += 1;
      const c = Math.min(counts[st.id] || 0, st.target);
      done += c;
      if (c >= st.target) doneSteps += 1;
    });
    return {
      done,
      doneSteps,
      counterSteps,
      allDone: counterSteps > 0 && doneSteps === counterSteps,
    };
  }, [counts, steps]);

  const showToast = useCallback((message, kind = 'success') => {
    clearTimeout(toastTimer.current);
    setToast({ message, visible: true, kind });
    toastTimer.current = setTimeout(() => setToast((p) => ({ ...p, visible: false })), 1900);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const f = parseInt(await AsyncStorage.getItem(FONT_KEY), 10);
        if (f >= 0 && f < FONT_SCALES.length) setFontIdx(f);
        const a = await AsyncStorage.getItem(AUTO_KEY);
        if (a === '0') setAutoAdvance(false);
      } catch {}
      setSettingsLoaded(true);
    })();
  }, []);

  const cycleFont = useCallback(() => {
    hapticImpact('medium');
    setFontIdx((i) => {
      const n = (i + 1) % FONT_SCALES.length;
      AsyncStorage.setItem(FONT_KEY, String(n)).catch(() => {});
      return n;
    });
  }, []);

  const changeAuto = useCallback((v) => {
    setAutoAdvance(v);
    AsyncStorage.setItem(AUTO_KEY, v ? '1' : '0').catch(() => {});
  }, []);

  const onReadingModeSelect = useCallback((id) => {
    hapticImpact('medium');
    setReadingMode(id);
    setReadingModeSheetOpen(false);
    const m = READING_MODE_OPTIONS.find((x) => x.id === id);
    showToast(`Okuma modu: ${m?.name ?? ''}`);
  }, [setReadingMode, showToast]);

  const selectType = useCallback((id) => {
    if (id === typeId) return;
    clearTimeout(advanceTimer.current);
    setData({ typeId: id, counts: {}, idx: 0 });
  }, [typeId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    if (reduceMotion) { fadeAnim.setValue(1); return; }
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [idx, typeId, fadeAnim, reduceMotion]);

  const goTo = useCallback((i) => {
    if (i < 0 || i >= steps.length) return;

    if (i > idx && isCounter && !complete) {
      hapticImpact('medium');
      showToast(`Önce ${step?.title ?? 'zikri'} tamamla`, 'info');
      return;
    }

    clearTimeout(advanceTimer.current);
    setData((d) => ({ ...d, idx: i }));
  }, [steps.length, idx, isCounter, complete, step?.title, showToast]);

  const next = useCallback(() => { goTo(idx + 1); }, [goTo, idx]);
  const prev = useCallback(() => { hapticImpact(); goTo(idx - 1); }, [goTo, idx]);

  useEffect(() => {
    if (!autoAdvance || !complete || isLast) return undefined;
    advanceTimer.current = setTimeout(() => goTo(idx + 1), AUTO_ADVANCE_MS);
    return () => clearTimeout(advanceTimer.current);
  }, [autoAdvance, complete, isLast, idx, goTo]);

  const setCount = useCallback((id, v) => {
    setData((d) => ({ ...d, counts: { ...d.counts, [id]: v } }));
  }, []);

  const tap = useCallback(() => {
    if (!isCounter) return;
    if (count >= step.target) { hapticImpact(); return; }
    const n = count + 1;
    setCount(step.id, n);
    if (n >= step.target) {
      hapticSuccess();
      try { Vibration.vibrate([0, 80, 40, 80]); } catch {}
      showToast(`${step.title} tamamlandı`);
    } else if (n % 11 === 0 || step.target - n <= 3) {
      hapticImpact('heavy');
    } else {
      hapticImpact();
    }
  }, [isCounter, count, step, setCount, showToast]);

  const undo = useCallback(() => {
    if (!isCounter || count <= 0) return;
    clearTimeout(advanceTimer.current);
    setCount(step.id, count - 1);
    showToast('1 zikir geri alındı', 'info');
  }, [isCounter, count, step, setCount, showToast]);

  const resetStep = useCallback(() => {
    Alert.alert('Bu adımı sıfırla', `${step.title} sayacı 0'a dönecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sıfırla',
        style: 'destructive',
        onPress: () => { clearTimeout(advanceTimer.current); setCount(step.id, 0); showToast('Adım sıfırlandı'); },
      },
    ]);
  }, [step, setCount, showToast]);

  const resetAll = useCallback(() => {
    Alert.alert('Tesbihatı sıfırla', `${type.name} için tüm sayaçlar ve adım başa dönecek.`, [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sıfırla',
        style: 'destructive',
        onPress: () => {
          clearTimeout(advanceTimer.current);
          setSheetOpen(false);
          setData({ typeId, counts: {}, idx: 0 });
          showToast('Tesbihat sıfırlandı');
        },
      },
    ]);
  }, [type.name, typeId, showToast]);

  const finish = useCallback(() => {
    if (isCounter && !complete) {
      hapticImpact('medium');
      showToast(`Önce ${step.title} tamamla`, 'info');
      return;
    }
    if (!stats.allDone) {
      hapticImpact('medium');
      showToast('Tüm zikirler tamamlanmadan bitirilemez', 'info');
      return;
    }
    hapticSuccess();
    showToast('Allah kabul etsin');
    setTimeout(() => onBack?.(), 800);
  }, [isCounter, complete, step, stats.allDone, showToast, onBack]);

  useEffect(() => () => {
    clearTimeout(toastTimer.current);
    clearTimeout(advanceTimer.current);
  }, []);

  const isLight = rawTheme.mode === 'light';
  const barStyle = highContrast || rawTheme.mode === 'dark' || rawTheme.mode === 'oled' ? 'light-content' : 'dark-content';

  if (!settingsLoaded) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
        <StatusBar barStyle={barStyle} backgroundColor={theme.background} />
        <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
      </SafeAreaView>
    );
  }

  const meta = STEP_META[step.type] || STEP_META.info;
  const primaryNext = canGoNext;
  const nextLocked = isLast ? !stats.allDone : !canGoNext;
  const isRecommendedActive = typeId === recommendedId;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={barStyle} backgroundColor={theme.background} />

      {/* HEADER */}
      <Animated.View style={[styles.header, makeAnim(headerAnim, 8)]}>
        {onBack ? (
          <TouchableOpacity
            onPress={() => { hapticImpact(); onBack(); }}
            accessibilityRole="button" accessibilityLabel="Geri dön"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.headerButton, { backgroundColor: highContrast ? '#1E1E1E' : theme.surface, borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}
          >
            <Ionicons name="arrow-back" size={fs(22)} color={theme.text} />
          </TouchableOpacity>
        ) : <View style={styles.headerButton} />}

        <View style={styles.headerTitleContainer}>
          <Text
            accessibilityRole="header"
            style={[styles.headerTitle, { color: theme.text, fontSize: fs(18), fontWeight: highContrast ? '900' : '900' }]}
            numberOfLines={1}
          >
            {type.name}
          </Text>
          {isRecommendedActive ? (
            <View style={[styles.headerActivePill, { backgroundColor: highContrast ? '#000000' : `${theme.primary}1A`, borderColor: theme.primary, borderWidth: highContrast ? 2 : 1 }]}>
              <View style={[styles.headerActiveDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.headerActiveText, { color: theme.primary, fontSize: fs(10.5), fontWeight: highContrast ? '900' : '800' }]}>
                AKTİF
              </Text>
            </View>
          ) : null}
        </View>

        <TouchableOpacity
          onPress={cycleFont}
          accessibilityRole="button"
          accessibilityLabel={`Yazı boyutu: ${FONT_NAMES[fontIdx]}. Değiştirmek için dokunun.`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.headerButton, {
            backgroundColor: fontIdx > 0 ? (highContrast ? '#1E1E1E' : (theme.primaryGlow || `${theme.primary}18`)) : (highContrast ? '#1E1E1E' : theme.surface),
            borderColor: fontIdx > 0 || highContrast ? theme.primary : theme.border,
            borderWidth: highContrast ? 2 : 1,
          }]}
        >
          <Text style={[styles.fontButtonText, { color: fontIdx > 0 || highContrast ? theme.primary : theme.text, fontSize: 13 + fontIdx, fontWeight: highContrast ? '900' : 'bold' }]}>
            {FONT_LABELS[fontIdx]}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <Toast toast={toast} theme={theme} top={insets.top + 76} fs={fs} highContrast={highContrast} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 24 }]}
      >
        <Animated.View style={makeAnim(bodyAnim)}>
          <TypeSelector
            theme={theme}
            types={sortedTypes}
            activeId={typeId}
            recommendedId={recommendedId}
            onSelect={selectType}
            fs={fs}
            highContrast={highContrast}
          />

          <ProgressHero
            theme={theme} type={type} idx={idx} total={steps.length}
            doneSteps={stats.doneSteps} counterSteps={stats.counterSteps}
            done={stats.done} totalZikir={totalZikir}
            fs={fs} isLight={isLight} highContrast={highContrast}
            onPress={() => setSheetOpen(true)}
          />

          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: highContrast ? 2 : 1, shadowColor: theme.text }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: highContrast ? '#000000' : (theme.primaryGlow || theme.surfaceElevated || 'transparent'), borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}>
                  <Ionicons name={meta.icon} size={fs(14)} color={theme.primary} />
                  <Text style={[styles.badgeText, { color: theme.primary, fontSize: fs(12), fontWeight: highContrast ? '900' : '800' }]}>{meta.label}</Text>
                </View>
                <Text style={[styles.cardSubtitle, { color: theme.textDim, fontSize: fs(13), fontWeight: highContrast ? '700' : '600' }]} numberOfLines={1}>
                  {step.subtitle}
                </Text>
              </View>

              <Text style={[styles.stepTitle, { color: theme.text, fontSize: fs(24), lineHeight: fs(31), fontWeight: highContrast ? '900' : '900' }]}>
                {step.title}
              </Text>

              {step.type === 'sure' ? (
                <ReadingModeBadge
                  theme={theme}
                  fs={fs}
                  modeId={readingMode}
                  onPress={() => { hapticImpact(); setReadingModeSheetOpen(true); }}
                  highContrast={highContrast}
                />
              ) : null}

              {isCounter ? (
                <BeadCounter
                  theme={theme} step={step} count={count} fs={fs}
                  onTap={tap} onUndo={undo} onReset={resetStep} nextTitle={nextTitle} highContrast={highContrast}
                />
              ) : (
                <ReadingView step={step} theme={theme} fs={fs} readingMode={readingMode} highContrast={highContrast} />
              )}
            </View>

            {stats.allDone && isLast ? (
              <View style={[styles.doneCard, { backgroundColor: highContrast ? '#121212' : `${DONE}1A`, borderColor: DONE, borderWidth: highContrast ? 2 : 1 }]}>
                <Ionicons name="checkmark-circle" size={fs(28)} color={DONE} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.doneTitle, { color: theme.text, fontSize: fs(16), fontWeight: highContrast ? '900' : '900' }]}>
                    {type.name} tamamlandı
                  </Text>
                  <Text style={[styles.doneDesc, { color: theme.textDim, fontSize: fs(13.5), fontWeight: highContrast ? '700' : '500' }]}>
                    Allah kabul etsin. {totalZikir} zikir, {steps.length} adım tamamlandı.
                  </Text>
                </View>
              </View>
            ) : null}
          </Animated.View>
        </Animated.View>
      </ScrollView>

      {/* ALT EYLEM ÇUBUĞU */}
      <View style={[styles.bottomBar, {
        backgroundColor: highContrast ? '#121212' : (theme.surfaceElevated || theme.surface),
        borderTopColor: theme.border,
        borderTopWidth: highContrast ? 2 : StyleSheet.hairlineWidth,
        paddingBottom: Math.max(10, insets.bottom),
        shadowColor: theme.text,
      }]}>
        <PressableScale
          onPress={prev}
          disabled={idx === 0}
          haptic={null}
          accessibilityLabel="Önceki adım"
          containerStyle={{ opacity: idx === 0 ? 0.35 : 1 }}
          style={[styles.prevBtn, { height: fs(56), width: fs(56), backgroundColor: highContrast ? '#1E1E1E' : theme.surface, borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}
        >
          <Ionicons name="chevron-back" size={fs(24)} color={theme.text} />
        </PressableScale>

        <PressableScale
          onPress={isLast ? finish : next}
          haptic={null}
          accessibilityLabel={
            isLast
              ? (nextLocked ? 'Tüm zikirleri tamamla' : 'Tesbihatı bitir')
              : (nextLocked ? `Önce ${step.title} zikrini tamamla` : `Sonraki adım: ${nextTitle}`)
          }
          accessibilityState={{ disabled: nextLocked }}
          containerStyle={{ flex: 1, opacity: nextLocked ? 0.85 : 1 }}
          style={[styles.nextBtn, {
            minHeight: fs(56),
            backgroundColor: primaryNext ? theme.primary : (highContrast ? '#1E1E1E' : (theme.surfaceElevated || theme.surface)),
            borderColor: primaryNext ? theme.primary : theme.border,
            borderWidth: highContrast ? 2 : 1,
          }]}
        >
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.nextLabel, { color: primaryNext ? (highContrast ? '#000000' : 'rgba(255,255,255,0.8)') : theme.textDim, fontSize: fs(12), fontWeight: highContrast ? '900' : '700' }]}>
              {isLast
                ? (nextLocked ? 'Önce tamamla' : 'Tesbihat')
                : (nextLocked ? 'Kilitli' : 'Sonraki')}
            </Text>
            <Text style={[styles.nextTitle, { color: primaryNext ? (highContrast ? '#000000' : '#FFF') : theme.text, fontSize: fs(16), fontWeight: highContrast ? '900' : '900' }]} numberOfLines={1}>
              {isLast
                ? (nextLocked
                    ? (stats.counterSteps > 0
                        ? `${stats.doneSteps} / ${stats.counterSteps} sayaç`
                        : 'Devam et')
                    : 'Bitir')
                : (nextLocked ? `${count} / ${step.target}` : nextTitle)}
            </Text>
          </View>
          <Ionicons
            name={
              isLast
                ? (nextLocked ? 'lock-closed' : 'checkmark')
                : (nextLocked ? 'lock-closed' : 'chevron-forward')
            }
            size={fs(24)}
            color={primaryNext ? (highContrast ? '#000000' : '#FFF') : (nextLocked ? theme.textDim : theme.text)}
          />
        </PressableScale>
      </View>

      <StepsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        theme={theme} fs={fs} steps={steps} counts={counts} idx={idx}
        onJump={(i) => { setSheetOpen(false); goTo(i); }}
        onResetAll={resetAll}
        autoAdvance={autoAdvance} setAutoAdvance={changeAuto}
        typeName={type.name} bottomInset={insets.bottom}
        canGoTo={(targetIdx) => {
          if (targetIdx <= idx) return true;
          if (isCounter && !complete) return false;
          return true;
        }}
        highContrast={highContrast}
      />

      <ReadingModeSheet
        visible={readingModeSheetOpen}
        onClose={() => setReadingModeSheetOpen(false)}
        theme={theme}
        fs={fs}
        currentMode={readingMode}
        onSelect={onReadingModeSelect}
        bottomInset={insets.bottom}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14,
  },
  headerButton: {
    width: 48, height: 48, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitleContainer: {
    flex: 1, alignItems: 'center',
    paddingHorizontal: 8, gap: 4,
  },
  headerTitle: { fontWeight: '900', letterSpacing: 0.2 },
  headerActivePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 9, paddingVertical: 3,
    borderRadius: 999, borderWidth: 1,
  },
  headerActiveDot: { width: 5, height: 5, borderRadius: 2.5 },
  headerActiveText: { fontWeight: '800', letterSpacing: 0.6 },
  fontButtonText: { fontWeight: '900' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 2 },

  toast: {
    position: 'absolute', left: 20, right: 20, zIndex: 100, elevation: 10,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16, borderWidth: 1,
  },
  toastText: { flex: 1, fontWeight: '700' },

  typeScroll: { marginHorizontal: -20, flexGrow: 0, marginBottom: 18 },
  typeContent: { paddingHorizontal: 20, gap: 10, alignItems: 'center' },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 16,
  },
  typeChipActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  typeChipText: { fontWeight: '800' },
  recDot: { width: 7, height: 7, borderRadius: 4 },

  heroShadow: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 8, marginBottom: 20,
  },
  heroCard: { borderWidth: 1, borderRadius: 28, padding: 18, overflow: 'hidden', gap: 16 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIconGlass: {
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)',
  },
  heroTitle: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 0.2 },
  heroSub: { color: '#C5D5CC', fontWeight: '600', marginTop: 3 },
  heroAction: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  heroActionText: { color: '#F9F1D8', fontWeight: '800' },
  heroTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  heroFill: { height: '100%', borderRadius: 3, backgroundColor: '#F9F1D8' },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginLeft: 4, gap: 12 },
  sectionLabel: { fontWeight: '800', letterSpacing: 0.8 },
  sectionHeaderLine: { flex: 1, height: 1, opacity: 0.6 },

  card: {
    borderRadius: 28, borderWidth: 1, padding: 20,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  badgeText: { fontWeight: '800' },
  cardSubtitle: { flex: 1, textAlign: 'right', fontWeight: '600' },
  stepTitle: { fontWeight: '900', marginBottom: 14 },

  readingModeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 10, borderWidth: 1,
    marginBottom: 14,
  },
  readingModeBadgeText: { fontWeight: '800' },

  innerBox: { borderRadius: 20, borderWidth: 1, paddingVertical: 20, paddingHorizontal: 16 },
  arabic: { textAlign: 'center', writingDirection: 'rtl', fontWeight: '500' },
  latin: { fontStyle: 'italic', marginLeft: 4, fontWeight: '500' },
  meaning: { marginLeft: 4, fontWeight: '500' },
  infoText: { fontWeight: '500' },
  sourceWrap: { alignItems: 'flex-end' },
  sourceBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  sourceText: { fontWeight: '700', letterSpacing: 0.3 },

  counterWrap: { alignItems: 'center', gap: 16 },
  counterArabic: { textAlign: 'center', writingDirection: 'rtl', fontWeight: '700' },
  counterCenter: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  counterNumber: { fontWeight: '900' },
  counterTarget: { fontWeight: '700', marginTop: 2 },
  counterHint: { fontWeight: '600', textAlign: 'center' },
  counterActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 4 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, borderWidth: 1, paddingHorizontal: 12,
  },
  actionBtnText: { fontWeight: '800' },

  doneCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginTop: 16, padding: 18, borderRadius: 24, borderWidth: 1,
  },
  doneTitle: { fontWeight: '900' },
  doneDesc: { fontWeight: '500', marginTop: 3, lineHeight: 20 },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingTop: 12, paddingHorizontal: 16, borderTopWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 15,
  },
  prevBtn: { borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: 16, borderWidth: 1,
  },
  nextLabel: { fontWeight: '700' },
  nextTitle: { fontWeight: '900', marginTop: 1 },

  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: {
    maxHeight: '88%', borderTopLeftRadius: 36, borderTopRightRadius: 36,
    borderWidth: 1, paddingHorizontal: 22, paddingTop: 14,
  },
  modalHandle: { width: 48, height: 5, borderRadius: 3, alignSelf: 'center', marginBottom: 18 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalTitle: { fontWeight: '900', letterSpacing: -0.2 },
  modalSub: { fontWeight: '500', marginTop: 2 },
  modalClose: {
    width: 44, height: 44, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  group: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', marginBottom: 22 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 14 },
  rowIcon: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  rowIconText: { fontWeight: '900' },
  rowTitle: { fontWeight: '800' },
  rowSubRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  rowSub: { fontWeight: '500' },
  nowPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  nowPillText: { color: '#FFF', fontWeight: '800' },
  footerHint: {
    textAlign: 'center', paddingHorizontal: 8,
    lineHeight: 18, marginTop: 4,
  },
});