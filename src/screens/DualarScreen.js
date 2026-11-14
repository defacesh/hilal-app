// src/screens/DualarScreen.js
import React, {
  createContext, memo, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import {
  Animated,
  BackHandler,
  Easing,
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppStore } from '../store/useAppStore';

/* ================================================================
   Opsiyonel modüller (yüklü değilse ekran yine çalışır)
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}
let Clipboard = null;
try { Clipboard = require('expo-clipboard'); } catch {}
let LinearGradient = null;
try { LinearGradient = require('expo-linear-gradient').LinearGradient; } catch {}

const haptic = (style = 'light') => {
  try {
    if (useAppStore.getState().globalHaptic === false) return;
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return;
    const map = Haptics.ImpactFeedbackStyle ?? {};
    const arg = style === 'medium' ? map.Medium : style === 'heavy' ? map.Heavy : map.Light;
    if (arg === undefined) Haptics.impactAsync();
    else Haptics.impactAsync(arg);
  } catch {}
};

/* ================================================================
   Sabitler
   ================================================================ */
const RECENT_KEY = '@nida/duas/recent_reads/v1';
const FONT_KEY = '@nida/duas/font/v1';
const MAX_RECENT = 10;

const OTHER_ID = '__other__';
const OTHER_CAT = { id: OTHER_ID, name: 'Diğer', icon: 'book-outline', color: '#94A3B8', desc: 'Kategorisiz dualar' };
const FALLBACK_CATS = [
  { id: 'gunluk', name: 'Günlük Dualar', icon: 'sunny-outline', color: '#F59E0B', desc: 'Her gün okunan dualar' },
];
const FAV_COLOR = '#E35D6A';

const FONT_SIZES = [
  { id: 'small', label: 'Küçük', scale: 0.88 },
  { id: 'normal', label: 'Normal', scale: 1 },
  { id: 'large', label: 'Büyük', scale: 1.18 },
  { id: 'xlarge', label: 'Çok büyük', scale: 1.38 },
];
const COUNTER_TARGETS = [33, 99, 100, 0];

const SERIF = Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' });

/* ================================================================
   Veri katmanı — tembel yükleme + tek seferlik indeks
   ================================================================ */
const normalizeText = (value) =>
  String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/['’`´‘]/g, '');

const buildIndex = (mod) => {
  const rawList = Array.isArray(mod?.DUA_VERILERI)
    ? mod.DUA_VERILERI
    : Array.isArray(mod?.default) ? mod.default : [];
  const rawCats = Array.isArray(mod?.DUA_KATEGORILERI) && mod.DUA_KATEGORILERI.length > 0
    ? mod.DUA_KATEGORILERI
    : FALLBACK_CATS;

  const catsById = {};
  rawCats.forEach((c) => { catsById[c.id] = c; });

  const list = [];
  const byId = new Map();
  const byCat = {};
  const searchIndex = [];

  rawList.forEach((item) => {
    if (!item || !item.id || byId.has(item.id)) return;
    list.push(item);
    byId.set(item.id, item);

    const key = catsById[item.category] ? item.category : OTHER_ID;
    if (!byCat[key]) byCat[key] = [];
    byCat[key].push(item);

    const cat = catsById[item.category] || OTHER_CAT;
    searchIndex.push({
      item,
      title: normalizeText(item.title),
      cat: normalizeText(cat.name),
      body: normalizeText(
        [item.meaning, item.transliteration, item.source, item.virtue].join(' '),
      ),
    });
  });

  const cats = rawCats.filter((c) => byCat[c.id]?.length > 0);
  if (byCat[OTHER_ID]?.length > 0) {
    cats.push(OTHER_CAT);
    catsById[OTHER_ID] = OTHER_CAT;
  }

  return { list, byId, byCat, catsById, cats, searchIndex };
};

let _cache = null;
let _pending = null;

const ensureDuaData = () => {
  if (_cache) return Promise.resolve(_cache);
  if (!_pending) {
    _pending = new Promise((resolve, reject) => {
      try {
        // inline require: modül ancak bu çağrıda değerlendirilir
        const mod = require('../data/DuaData');
        const idx = buildIndex(mod);
        if (!idx.list || idx.list.length === 0) {
          throw new Error('DuaData boş veya DUA_VERILERI bulunamadı.');
        }
        resolve(idx);
      } catch (e) {
        reject(e);
      }
    })
      .then((idx) => { _cache = idx; return idx; })
      .catch((e) => { _pending = null; throw e; });
  }
  return _pending;
};

/** Uygulama açılışında (ör. App.js) çağrılırsa ekran anında açılır. */
export const prefetchDuaData = () => ensureDuaData().catch(() => null);

/**
 * NOT: Önceki sürümde InteractionManager.runAfterInteractions kullanılıyordu.
 * Bu API yeni RN (Fabric) sürümlerinde güvenilir değil ve skeleton animasyonları
 * callback'i bloke edebiliyor. Bu sürümde doğrudan useEffect içinde yüklüyoruz.
 */
const useDuaData = () => {
  const [state, setState] = useState(() => (
    _cache ? { status: 'ready', data: _cache } : { status: 'loading', data: null }
  ));
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (_cache) {
      setState((s) => (s.status === 'ready' ? s : { status: 'ready', data: _cache }));
      return undefined;
    }

    let cancelled = false;
    setState({ status: 'loading', data: null });

    ensureDuaData()
      .then((data) => {
        if (cancelled) return;
        setState({ status: 'ready', data });
      })
      .catch((err) => {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error('[DualarScreen] Dua verisi yüklenemedi:', err);
        setState({ status: 'error', data: null });
      });

    return () => { cancelled = true; };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, retry };
};

const runSearch = (data, query) => {
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [];
  const out = [];
  for (let i = 0; i < data.searchIndex.length; i += 1) {
    const e = data.searchIndex[i];
    let score = 0;
    let ok = true;
    for (let t = 0; t < tokens.length; t += 1) {
      const tok = tokens[t];
      if (e.title.startsWith(tok)) score += 5;
      else if (e.title.includes(tok)) score += 4;
      else if (e.cat.includes(tok)) score += 2;
      else if (e.body.includes(tok)) score += 1;
      else { ok = false; break; }
    }
    if (ok) out.push({ item: e.item, score });
  }
  out.sort((a, b) => b.score - a.score);
  return out.map((o) => o.item);
};

/* ================================================================
   Yardımcılar
   ================================================================ */
const HEX6 = /^#[0-9a-f]{6}$/i;

const tint = (color, alpha) => {
  if (typeof color === 'string' && HEX6.test(color)) {
    const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255).toString(16).padStart(2, '0');
    return `${color}${a}`;
  }
  return color;
};

const shade = (color, amount) => {
  if (typeof color !== 'string' || !HEX6.test(color)) return color;
  const f = 1 - amount;
  const ch = (i) => Math.round(parseInt(color.slice(i, i + 2), 16) * f)
    .toString(16).padStart(2, '0');
  return `#${ch(1)}${ch(3)}${ch(5)}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return { text: 'Hayırlı sabahlar', catId: 'sabah', hint: 'Güne bereketle başlamak için' };
  if (h >= 11 && h < 17) return { text: 'Hayırlı günler', catId: 'gunluk', hint: 'Gün içinde okunabilecekler' };
  if (h >= 17 && h < 22) return { text: 'Hayırlı akşamlar', catId: 'aksam', hint: 'Günü huzurla kapatmak için' };
  return { text: 'Hayırlı geceler', catId: 'uyku', hint: 'Yatmadan önce okunabilecekler' };
};

const pickDailyIndex = (len) => {
  if (len <= 0) return 0;
  const d = new Date();
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  return (d.getFullYear() * 400 + dayOfYear) % len;
};

const cardShadow = (hc) => (hc ? null : {
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
});

const loadRecentReads = async () => {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === 'string').slice(0, MAX_RECENT)
      : [];
  } catch { return []; }
};
const saveRecentReads = (ids) => {
  AsyncStorage.setItem(RECENT_KEY, JSON.stringify(ids)).catch(() => {});
};

/* ================================================================
   Tema bağlamı (prop drilling yerine)
   ================================================================ */
const UiCtx = createContext({ theme: {}, hc: false, showArabic: true });
const useUi = () => useContext(UiCtx) || { theme: {}, hc: false, showArabic: true };

/* ================================================================
   Temel bileşenler
   ================================================================ */
const PressableScale = memo(function PressableScale({
  onPress, children, style, scaleTo = 0.975, disabled, label, haptics = 'light',
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (v) => Animated.spring(scale, {
    toValue: v, useNativeDriver: true, speed: 60, bounciness: 3,
  }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={(e) => { if (haptics) haptic(haptics); onPress?.(e); }}
        onPressIn={() => to(scaleTo)}
        onPressOut={() => to(1)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={style}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
});

const HeartButton = memo(function HeartButton({
  active, onPress, size = 22, idleColor, activeColor = FAV_COLOR, style,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const handle = () => {
    haptic('light');
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.7, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, speed: 28, bounciness: 14, useNativeDriver: true }),
    ]).start();
    onPress?.();
  };
  return (
    <TouchableOpacity
      onPress={handle}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      style={[styles.heartBtn, style]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons
          name={active ? 'heart' : 'heart-outline'}
          size={size}
          color={active ? activeColor : idleColor}
        />
      </Animated.View>
    </TouchableOpacity>
  );
});

const GradientBox = ({ colors, style, children }) => (
  LinearGradient ? (
    <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={style}>
      {children}
    </LinearGradient>
  ) : (
    <View style={[style, { backgroundColor: colors[0] }]}>{children}</View>
  )
);

const Skeleton = memo(function Skeleton({ style }) {
  const ctx = useUi();
  const theme = ctx?.theme || {};
  const opacity = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.9, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.45, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={[
        {
          backgroundColor: theme.surfaceElevated || theme.surface || '#E5E7EB',
          opacity,
          borderRadius: 16,
        },
        style,
      ]}
    />
  );
});

const HomeSkeleton = memo(function HomeSkeleton() {
  return (
    <View style={styles.homeContent}>
      <Skeleton style={{ height: 230, borderRadius: 28 }} />
      <Skeleton style={{ height: 20, width: 140, marginTop: 28 }} />
      <View style={styles.skelRow}>
        <Skeleton style={{ height: 96, width: 210 }} />
        <Skeleton style={{ height: 96, width: 210 }} />
      </View>
      <Skeleton style={{ height: 20, width: 120, marginTop: 28 }} />
      <View style={styles.tileGrid}>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} style={{ height: 118, width: '48%' }} />
        ))}
      </View>
    </View>
  );
});

const EmptyState = memo(function EmptyState({
  icon = 'search-outline', title, subtitle, actionLabel, onAction,
}) {
  const { theme, hc } = useUi();
  return (
    <View style={styles.emptyBox}>
      <View style={[styles.emptyIcon, {
        backgroundColor: theme.primaryGlow || theme.surfaceElevated,
        borderColor: theme.border,
        borderWidth: hc ? 2 : 0,
      }]}>
        <Ionicons name={icon} size={34} color={theme.primary || '#F59E0B'} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>{title}</Text>
      {!!subtitle && (
        <Text style={[styles.emptyText, { color: theme.textDim }]}>{subtitle}</Text>
      )}
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={() => { haptic(); onAction(); }}
          activeOpacity={0.85}
          style={[styles.emptyBtn, { backgroundColor: theme.primary || '#F59E0B' }]}
        >
          <Text style={[styles.emptyBtnText, { color: hc ? '#000' : '#FFF' }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

/* ================================================================
   Arama çubuğu
   ================================================================ */
const SearchBar = memo(function SearchBar({ value, onChange }) {
  const { theme, hc } = useUi();
  return (
    <View style={[styles.searchBox, {
      backgroundColor: theme.surface,
      borderColor: hc ? theme.text : theme.border,
      borderWidth: hc ? 2 : 1,
    }]}>
      <Ionicons name="search" size={18} color={theme.textDim} />
      <TextInput
        style={[styles.searchInput, { color: theme.text }]}
        placeholder="Dua, anlam veya kaynak ara"
        placeholderTextColor={theme.textDim}
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Dua ara"
      />
      {!!value && (
        <TouchableOpacity
          onPress={() => { haptic(); onChange(''); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Aramayı temizle"
          style={[styles.searchClear, { backgroundColor: theme.surfaceElevated }]}
        >
          <Ionicons name="close" size={14} color={theme.textDim} />
        </TouchableOpacity>
      )}
    </View>
  );
});

/* ================================================================
   Ana sayfa bileşenleri
   ================================================================ */
const SectionTitle = memo(function SectionTitle({ title, hint, actionLabel, onAction }) {
  const { theme } = useUi();
  return (
    <View style={styles.sectionTitleRow}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        {!!hint && <Text style={[styles.sectionHint, { color: theme.textDim }]}>{hint}</Text>}
      </View>
      {actionLabel && onAction ? (
        <TouchableOpacity
          onPress={() => { haptic(); onAction(); }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
        >
          <Text style={[styles.sectionAction, { color: theme.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

const HeroCard = memo(function HeroCard({ item, category, isFavorite, onOpen, onFavorite }) {
  const { theme, hc, showArabic } = useUi();
  const accent = category?.color || theme.primary || '#F59E0B';
  const colors = hc ? ['#121212', '#121212'] : [shade(accent, 0.1), shade(accent, 0.55)];
  return (
    <PressableScale
      onPress={() => onOpen(item)}
      label={`Günün duası: ${item.title}`}
      scaleTo={0.985}
      style={[styles.hero, hc && { borderWidth: 2, borderColor: theme.primary }, cardShadow(hc)]}
    >
      <GradientBox colors={colors} style={styles.heroInner}>
        <MaterialCommunityIcons
          name="hands-pray" size={170} color="#FFFFFF" style={styles.heroWatermark}
        />
        <View style={styles.heroTop}>
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={12} color="#FFFFFF" />
            <Text style={styles.heroBadgeText}>Günün duası</Text>
          </View>
          <HeartButton
            active={isFavorite}
            onPress={() => onFavorite(item)}
            idleColor="rgba(255,255,255,0.8)"
            activeColor="#FFB4BE"
          />
        </View>

        <Text style={styles.heroTitle} numberOfLines={2}>{item.title}</Text>

        {showArabic && !!item.arabic && (
          <Text style={styles.heroArabic} numberOfLines={2}>{item.arabic}</Text>
        )}

        <Text style={styles.heroMeaning} numberOfLines={3}>{item.meaning}</Text>

        <View style={styles.heroFooter}>
          <Text style={styles.heroCat} numberOfLines={1}>{category?.name || 'Dua'}</Text>
          <View style={[styles.heroCta, { backgroundColor: hc ? theme.primary : '#FFFFFF' }]}>
            <Text style={[styles.heroCtaText, { color: hc ? '#000' : shade(accent, 0.35) }]}>Oku</Text>
            <Ionicons name="arrow-forward" size={14} color={hc ? '#000' : shade(accent, 0.35)} />
          </View>
        </View>
      </GradientBox>
    </PressableScale>
  );
});

const NowCard = memo(function NowCard({ item, category, onOpen }) {
  const { theme, hc } = useUi();
  const accent = category?.color || theme.primary || '#F59E0B';
  return (
    <PressableScale
      onPress={() => onOpen(item)}
      label={item.title}
      style={[styles.nowCard, {
        backgroundColor: theme.surface,
        borderColor: hc ? theme.text : tint(accent, 0.35),
        borderWidth: hc ? 2 : 1,
      }]}
    >
      <View style={[styles.nowDot, { backgroundColor: accent }]} />
      <Text style={[styles.nowTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
      <Text style={[styles.nowMeaning, { color: theme.textDim }]} numberOfLines={2}>{item.meaning}</Text>
    </PressableScale>
  );
});

const ShortcutTile = memo(function ShortcutTile({ icon, color, title, sub, onPress }) {
  const { theme, hc } = useUi();
  return (
    <PressableScale
      onPress={onPress}
      label={`${title}, ${sub}`}
      style={[styles.shortcut, {
        backgroundColor: theme.surface,
        borderColor: hc ? theme.text : theme.border,
        borderWidth: hc ? 2 : 1,
      }]}
    >
      <View style={[styles.shortcutIcon, { backgroundColor: tint(color, 0.16) }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.shortcutTitle, { color: theme.text }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.shortcutSub, { color: theme.textDim }]} numberOfLines={1}>{sub}</Text>
      </View>
    </PressableScale>
  );
});

const CategoryTile = memo(function CategoryTile({ category, count, width, onPress }) {
  const { theme, hc } = useUi();
  const accent = category.color || theme.primary || '#F59E0B';
  return (
    <PressableScale
      onPress={() => onPress(category.id)}
      label={`${category.name}, ${count} dua`}
      style={[styles.tile, {
        width,
        backgroundColor: hc ? theme.surface : tint(accent, 0.09),
        borderColor: hc ? theme.text : tint(accent, 0.28),
        borderWidth: hc ? 2 : 1,
      }]}
    >
      <View style={styles.tileTop}>
        <View style={[styles.tileIcon, { backgroundColor: accent }]}>
          <Ionicons name={category.icon || 'book-outline'} size={20} color={hc ? '#000' : '#FFFFFF'} />
        </View>
        <Text style={[styles.tileCount, { color: accent }]}>{count}</Text>
      </View>
      <Text style={[styles.tileName, { color: theme.text }]} numberOfLines={1}>{category.name}</Text>
      {!!category.desc && (
        <Text style={[styles.tileDesc, { color: theme.textDim }]} numberOfLines={2}>{category.desc}</Text>
      )}
    </PressableScale>
  );
});

const RecentCard = memo(function RecentCard({ item, category, onOpen }) {
  const { theme, hc } = useUi();
  const accent = category?.color || theme.primary || '#F59E0B';
  return (
    <TouchableOpacity
      onPress={() => { haptic(); onOpen(item); }}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Son okunan: ${item.title}`}
      style={[styles.recentCard, {
        backgroundColor: theme.surface,
        borderColor: hc ? theme.text : theme.border,
        borderWidth: hc ? 2 : 1,
      }]}
    >
      <View style={[styles.recentBar, { backgroundColor: accent }]} />
      <Text style={[styles.recentTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
      <Text style={[styles.recentSource, { color: theme.textDim }]} numberOfLines={1}>{item.source}</Text>
    </TouchableOpacity>
  );
});

/* ================================================================
   Liste satırı
   ================================================================ */
const DuaRow = memo(function DuaRow({ item, category, favorite, onOpen, onFavorite }) {
  const { theme, hc, showArabic } = useUi();
  const accent = category?.color || theme.primary || '#F59E0B';
  return (
    <PressableScale
      onPress={() => onOpen(item)}
      label={`${item.title}. ${category?.name || ''}`}
      style={[styles.row, {
        backgroundColor: theme.surface,
        borderColor: hc ? theme.text : theme.border,
        borderWidth: hc ? 2 : 1,
      }, cardShadow(hc)]}
    >
      <View style={[styles.rowBar, { backgroundColor: accent }]} />
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.rowTitle, { color: theme.text }]} numberOfLines={2}>{item.title}</Text>
            <View style={styles.rowMeta}>
              <Ionicons name={category?.icon || 'book-outline'} size={12} color={accent} />
              <Text style={[styles.rowMetaText, { color: accent }]} numberOfLines={1}>
                {category?.name || 'Dua'}
              </Text>
              {!!item.source && (
                <Text style={[styles.rowSource, { color: theme.textDim }]} numberOfLines={1}>
                  {item.source}
                </Text>
              )}
            </View>
          </View>
          <HeartButton active={favorite} onPress={() => onFavorite(item)} idleColor={theme.textDim} />
        </View>

        {showArabic && !!item.arabic && (
          <Text style={[styles.rowArabic, { color: theme.text }]} numberOfLines={1}>{item.arabic}</Text>
        )}
        <Text style={[styles.rowMeaning, { color: theme.textDim }]} numberOfLines={2}>{item.meaning}</Text>
      </View>
    </PressableScale>
  );
});

/* ================================================================
   OKUMA EKRANI
   ================================================================ */
const ReaderPage = memo(function ReaderPage({ item, category, width, fontScale, bottomPad }) {
  const { theme, hc, showArabic } = useUi();
  const accent = category?.color || theme.primary || '#F59E0B';
  const f = fontScale;

  return (
    <View style={{ width }}>
      <ScrollView
        contentContainerStyle={[styles.pageContent, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, {
          color: theme.text,
          fontSize: Math.round(26 * f),
          lineHeight: Math.round(33 * f),
        }]}>
          {item.title}
        </Text>

        {showArabic && !!item.arabic && (
          <View style={[styles.arabicCard, {
            backgroundColor: hc ? theme.surface : tint(accent, 0.1),
            borderColor: hc ? theme.text : tint(accent, 0.3),
            borderWidth: hc ? 2 : 1,
          }]}>
            <Text style={[styles.arabicText, {
              color: theme.text,
              fontSize: Math.round(30 * f),
              lineHeight: Math.round(58 * f),
            }]}>
              {item.arabic}
            </Text>
          </View>
        )}

        {!!item.transliteration && (
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Ionicons name="volume-medium-outline" size={16} color={accent} />
              <Text style={[styles.blockLabel, { color: accent }]}>Okunuşu</Text>
            </View>
            <Text style={[styles.blockText, {
              color: theme.text, fontFamily: SERIF, fontStyle: 'italic',
              fontSize: Math.round(17 * f), lineHeight: Math.round(29 * f),
            }]}>
              {item.transliteration}
            </Text>
          </View>
        )}

        {!!item.meaning && (
          <View style={styles.block}>
            <View style={styles.blockHead}>
              <Ionicons name="book-outline" size={16} color={accent} />
              <Text style={[styles.blockLabel, { color: accent }]}>Anlamı</Text>
            </View>
            <Text style={[styles.blockText, {
              color: theme.text, fontFamily: SERIF,
              fontSize: Math.round(17 * f), lineHeight: Math.round(29 * f),
            }]}>
              {item.meaning}
            </Text>
          </View>
        )}

        {!!item.virtue && (
          <View style={[styles.virtue, {
            borderLeftColor: accent,
            backgroundColor: hc ? theme.surface : tint(accent, 0.08),
          }]}>
            <Text style={[styles.blockLabel, { color: accent, marginBottom: 6 }]}>Fazileti</Text>
            <Text style={[styles.virtueText, {
              color: theme.text,
              fontSize: Math.round(15 * f),
              lineHeight: Math.round(24 * f),
            }]}>
              {item.virtue}
            </Text>
          </View>
        )}

        <View style={styles.sourceRow}>
          <Ionicons name="bookmark-outline" size={14} color={theme.textDim} />
          <Text style={[styles.sourceText, { color: theme.textDim }]}>
            {item.source || 'Kaynak belirtilmemiş'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
});

const ReaderBody = memo(function ReaderBody({
  items, startIndex, categoriesById, favoritesSet, onFavorite, onClose, onRead,
  fontScaleId, onFontChange,
}) {
  const { theme, hc } = useUi();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const listRef = useRef(null);
  const toastTimer = useRef(null);
  const toastAnim = useRef(new Animated.Value(0)).current;

  const [index, setIndex] = useState(
    Math.min(Math.max(startIndex, 0), Math.max(items.length - 1, 0)),
  );
  const [panel, setPanel] = useState(null); // null | 'font' | 'counter'
  const [counts, setCounts] = useState({});
  const [targetIdx, setTargetIdx] = useState(0);
  const [toast, setToast] = useState('');

  const current = items[index];
  const fontScale = FONT_SIZES.find((f) => f.id === fontScaleId)?.scale ?? 1;
  const target = COUNTER_TARGETS[targetIdx];
  const count = current ? (counts[current.id] || 0) : 0;
  const accent = (current && categoriesById[current.category]?.color) || theme.primary || '#F59E0B';
  const category = current ? (categoriesById[current.category] || OTHER_CAT) : null;

  const safeTop = Math.max(insets?.top || 0, 12);
  const safeBottom = Math.max(insets?.bottom || 0, 10);

  useEffect(() => {
    if (current) onRead(current.id);
  }, [current?.id, onRead]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastAnim.setValue(0);
    Animated.timing(toastAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    }, 1500);
  }, [toastAnim]);

  const goTo = useCallback((i) => {
    if (i < 0 || i >= items.length) return;
    haptic('light');
    listRef.current?.scrollToIndex({ index: i, animated: true });
    setIndex(i);
  }, [items.length]);

  const onMomentumEnd = useCallback((e) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex((prev) => (i === prev || i < 0 || i >= items.length ? prev : i));
  }, [width, items.length]);

  const getItemLayout = useCallback(
    (_, i) => ({ length: width, offset: width * i, index: i }),
    [width],
  );

  const handleTap = useCallback(() => {
    if (!current) return;
    const n = (counts[current.id] || 0) + 1;
    setCounts((c) => ({ ...c, [current.id]: n }));
    if (target > 0 && n === target) {
      haptic('heavy');
      showToast('Hedefe ulaştın, Allah kabul etsin');
    } else {
      haptic('light');
    }
  }, [counts, current, target, showToast]);

  const handleResetCount = useCallback(() => {
    if (!current) return;
    haptic('medium');
    setCounts((c) => ({ ...c, [current.id]: 0 }));
  }, [current]);

  const handleShare = useCallback(async () => {
    if (!current) return;
    try {
      const parts = [current.title];
      if (current.arabic) parts.push(current.arabic);
      if (current.transliteration) parts.push(current.transliteration);
      if (current.meaning) parts.push(current.meaning);
      if (current.virtue) parts.push(`Fazileti: ${current.virtue}`);
      parts.push(`Kaynak: ${current.source || 'Hilal'}`);
      await Share.share({ message: parts.join('\n\n') });
    } catch {}
  }, [current]);

  const handleCopy = useCallback(async () => {
    if (!current || typeof Clipboard?.setStringAsync !== 'function') return;
    try {
      const parts = [current.title];
      if (current.arabic) parts.push(current.arabic);
      if (current.transliteration) parts.push(`Okunuşu: ${current.transliteration}`);
      if (current.meaning) parts.push(`Anlamı: ${current.meaning}`);
      if (current.virtue) parts.push(`Fazileti: ${current.virtue}`);
      await Clipboard.setStringAsync(parts.join('\n\n'));
      haptic();
      showToast('Panoya kopyalandı');
    } catch {}
  }, [current, showToast]);

  const togglePanel = (name) => {
    haptic();
    setPanel((p) => (p === name ? null : name));
  };

  const renderPage = useCallback(({ item }) => (
    <ReaderPage
      item={item}
      category={categoriesById[item.category] || OTHER_CAT}
      width={width}
      fontScale={fontScale}
      bottomPad={panel ? 340 : 190}
    />
  ), [categoriesById, width, fontScale, panel]);

  if (!current) return null;

  const dockBtn = (icon, label, onPress, active) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
      style={styles.dockBtn}
    >
      <View style={[styles.dockIcon, {
        backgroundColor: active ? accent : (theme.surfaceElevated || theme.surface),
        borderColor: hc ? theme.text : theme.border,
        borderWidth: hc ? 2 : StyleSheet.hairlineWidth,
      }]}>
        <Ionicons name={icon} size={20} color={active ? (hc ? '#000' : '#FFF') : theme.text} />
      </View>
      <Text style={[styles.dockLabel, { color: active ? accent : theme.textDim }]}>{label}</Text>
    </TouchableOpacity>
  );

  const progress = target > 0 ? Math.min(count / target, 1) : 0;

  return (
    <View style={[styles.readerRoot, { backgroundColor: theme.background }]}>
      {/* Üst çubuk */}
      <View style={[styles.readerTop, {
        paddingTop: safeTop,
        borderBottomColor: hc ? theme.text : theme.border,
        borderBottomWidth: hc ? 2 : StyleSheet.hairlineWidth,
        backgroundColor: theme.surface,
      }]}>
        <TouchableOpacity
          onPress={() => { haptic(); onClose(); }}
          accessibilityLabel="Kapat"
          style={[styles.roundBtn, { backgroundColor: theme.surfaceElevated || theme.background }]}
        >
          <Ionicons name="chevron-down" size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.readerCenter}>
          <View style={styles.readerNav}>
            <TouchableOpacity
              onPress={() => goTo(index - 1)}
              disabled={index <= 0}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
              accessibilityLabel="Önceki dua"
              style={{ opacity: index <= 0 ? 0.3 : 1 }}
            >
              <Ionicons name="chevron-back" size={18} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.readerCat, { color: accent }]} numberOfLines={1}>
              {category?.name}
            </Text>
            <TouchableOpacity
              onPress={() => goTo(index + 1)}
              disabled={index >= items.length - 1}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
              accessibilityLabel="Sonraki dua"
              style={{ opacity: index >= items.length - 1 ? 0.3 : 1 }}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.readerIndex, { color: theme.textDim }]}>
            {index + 1} / {items.length}
          </Text>
        </View>

        <HeartButton
          active={favoritesSet.has(current.id)}
          onPress={() => onFavorite(current)}
          idleColor={theme.textDim}
          size={24}
          style={styles.roundBtn}
        />
      </View>

      {/* Sayfalar */}
      <FlatList
        key={`pager-${width}`}
        ref={listRef}
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderPage}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={index}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={onMomentumEnd}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        extraData={`${fontScaleId}-${panel}`}
        style={{ flex: 1 }}
      />

      {/* Toast */}
      <Animated.View
        pointerEvents="none"
        style={[styles.toast, {
          bottom: safeBottom + (panel ? 330 : 120),
          opacity: toastAnim,
          backgroundColor: hc ? theme.primary : '#1F2937',
          transform: [{
            translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
          }],
        }]}
      >
        <Text style={[styles.toastText, { color: hc ? '#000' : '#FFF' }]}>{toast}</Text>
      </Animated.View>

      {/* Alt dock */}
      <View style={[styles.dock, {
        backgroundColor: theme.surface,
        borderTopColor: hc ? theme.text : theme.border,
        borderTopWidth: hc ? 2 : StyleSheet.hairlineWidth,
        paddingBottom: safeBottom + 6,
      }]}>
        {panel === 'font' && (
          <View style={styles.panel}>
            <Text style={[styles.panelTitle, { color: theme.text }]}>Yazı boyutu</Text>
            <View style={[styles.segment, {
              backgroundColor: theme.surfaceElevated || theme.background,
              borderColor: theme.border,
              borderWidth: hc ? 2 : 1,
            }]}>
              {FONT_SIZES.map((f) => {
                const active = f.id === fontScaleId;
                return (
                  <TouchableOpacity
                    key={f.id}
                    onPress={() => { haptic(); onFontChange(f.id); }}
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={`Yazı boyutu ${f.label}`}
                    style={[styles.segmentBtn, active && { backgroundColor: accent }]}
                  >
                    <Text style={[styles.segmentText, {
                      color: active ? (hc ? '#000' : '#FFF') : theme.textDim,
                      fontSize: 11 + FONT_SIZES.indexOf(f) * 2,
                    }]}>
                      Aa
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {panel === 'counter' && (
          <View style={styles.panel}>
            <View style={styles.counterRow}>
              <TouchableOpacity
                onPress={handleTap}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Sayaç ${count}. Artırmak için dokun`}
                style={[styles.counterBtn, {
                  backgroundColor: accent,
                  borderColor: hc ? theme.text : 'transparent',
                  borderWidth: hc ? 2 : 0,
                }]}
              >
                <Text style={[styles.counterNum, { color: hc ? '#000' : '#FFF' }]}>{count}</Text>
              </TouchableOpacity>

              <View style={{ flex: 1, gap: 10 }}>
                <View style={styles.targetRow}>
                  {COUNTER_TARGETS.map((t, i) => {
                    const active = i === targetIdx;
                    return (
                      <TouchableOpacity
                        key={t}
                        onPress={() => { haptic(); setTargetIdx(i); }}
                        accessibilityState={{ selected: active }}
                        style={[styles.targetChip, {
                          backgroundColor: active ? tint(accent, 0.18) : 'transparent',
                          borderColor: active ? accent : theme.border,
                          borderWidth: hc ? 2 : 1,
                        }]}
                      >
                        <Text style={[styles.targetText, { color: active ? accent : theme.textDim }]}>
                          {t === 0 ? 'Sınırsız' : t}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={[styles.progressTrack, {
                  backgroundColor: theme.surfaceElevated || theme.border,
                }]}>
                  <View style={[styles.progressFill, {
                    backgroundColor: accent,
                    width: `${Math.round(progress * 100)}%`,
                  }]} />
                </View>

                <View style={styles.counterMeta}>
                  <Text style={[styles.counterHint, { color: theme.textDim }]}>
                    {target > 0 ? `${count} / ${target}` : 'Dokunarak say'}
                  </Text>
                  <TouchableOpacity
                    onPress={handleResetCount}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Sayacı sıfırla"
                    style={styles.resetBtn}
                  >
                    <Ionicons name="refresh" size={14} color={theme.textDim} />
                    <Text style={[styles.counterHint, { color: theme.textDim }]}>Sıfırla</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={styles.dockRow}>
          {dockBtn('text-outline', 'Yazı', () => togglePanel('font'), panel === 'font')}
          {dockBtn('radio-button-on-outline', 'Sayaç', () => togglePanel('counter'), panel === 'counter')}
          {typeof Clipboard?.setStringAsync === 'function'
            && dockBtn('copy-outline', 'Kopyala', handleCopy, false)}
          {dockBtn('share-social-outline', 'Paylaş', handleShare, false)}
        </View>
      </View>
    </View>
  );
});

/* ================================================================
   ANA EKRAN
   ================================================================ */
export default function DualarScreen({ onBack }) {
  const { width: screenW } = useWindowDimensions();

  const getTheme = useAppStore((s) => s.getTheme);
  const showArabic = useAppStore((s) => s.showArabic);
  const favoriteDuas = useAppStore((s) => s.favoriteDuas);
  const toggleFavoriteDua = useAppStore((s) => s.toggleFavoriteDua);
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
      primaryGlow: 'rgba(255,255,0,0.3)',
    };
  }, [rawTheme, highContrast]);

  const ui = useMemo(
    () => ({ theme, hc: !!highContrast, showArabic: showArabic !== false }),
    [theme, highContrast, showArabic],
  );

  const statusBarStyle =
    highContrast || rawTheme.mode === 'dark' || rawTheme.mode === 'oled'
      ? 'light-content' : 'dark-content';

  /* ---------- Veri ---------- */
  const { status, data, retry } = useDuaData();

  /* ---------- Durum ---------- */
  const [view, setView] = useState({ type: 'home', id: null });
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [recentReads, setRecentReads] = useState([]);
  const [fontScaleId, setFontScaleId] = useState('normal');
  const [reader, setReader] = useState(null);
  const [readerVisible, setReaderVisible] = useState(false);

  useEffect(() => {
    loadRecentReads().then(setRecentReads);
    AsyncStorage.getItem(FONT_KEY)
      .then((v) => { if (v && FONT_SIZES.some((f) => f.id === v)) setFontScaleId(v); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 160);
    return () => clearTimeout(t);
  }, [query]);

  const favoritesSet = useMemo(
    () => new Set(Array.isArray(favoriteDuas) ? favoriteDuas : []),
    [favoriteDuas],
  );

  const isSearching = debounced.length > 0;
  const isHome = view.type === 'home' && !query.trim();

  /* ---------- Türetilmiş veriler ---------- */
  const greeting = useMemo(getGreeting, []);

  const daily = useMemo(() => {
    if (!data || data.list.length === 0) return null;
    return data.list[pickDailyIndex(data.list.length)];
  }, [data]);

  const nowItems = useMemo(() => {
    if (!data) return { cat: null, items: [] };
    const cat = data.catsById[greeting.catId];
    return { cat, items: cat ? (data.byCat[cat.id] || []).slice(0, 6) : [] };
  }, [data, greeting.catId]);

  const favItems = useMemo(() => {
    if (!data || !Array.isArray(favoriteDuas)) return [];
    const out = [];
    for (let i = favoriteDuas.length - 1; i >= 0; i -= 1) {
      const it = data.byId.get(favoriteDuas[i]);
      if (it) out.push(it);
    }
    return out;
  }, [data, favoriteDuas]);

  const recentItems = useMemo(() => {
    if (!data) return [];
    return recentReads.map((id) => data.byId.get(id)).filter(Boolean);
  }, [data, recentReads]);

  const searchResults = useMemo(
    () => (data && isSearching ? runSearch(data, debounced) : []),
    [data, debounced, isSearching],
  );

  const scope = useMemo(() => {
    if (!data) return null;
    if (isSearching || query.trim()) {
      return {
        title: 'Arama sonuçları',
        icon: 'search',
        color: theme.primary,
        items: searchResults,
        desc: '',
      };
    }
    if (view.type === 'cat') {
      const c = data.catsById[view.id];
      return c
        ? { title: c.name, icon: c.icon, color: c.color, items: data.byCat[c.id] || [], desc: c.desc }
        : null;
    }
    if (view.type === 'fav') {
      return {
        title: 'Favorilerim',
        icon: 'heart',
        color: FAV_COLOR,
        items: favItems,
        desc: 'Kalbine dokunan dualar',
      };
    }
    if (view.type === 'recent') {
      return {
        title: 'Son okunanlar',
        icon: 'time',
        color: theme.primary,
        items: recentItems,
        desc: 'En son okuduğun dualar',
      };
    }
    return null;
  }, [data, view, isSearching, query, searchResults, favItems, recentItems, theme.primary]);

  /* ---------- Eylemler ---------- */
  const addToRecent = useCallback((id) => {
    setRecentReads((prev) => {
      if (prev[0] === id) return prev;
      const next = [id, ...prev.filter((x) => x !== id)].slice(0, MAX_RECENT);
      saveRecentReads(next);
      return next;
    });
  }, []);

  const handleFavorite = useCallback((item) => {
    if (item?.id) toggleFavoriteDua(item.id);
  }, [toggleFavoriteDua]);

  const openReader = useCallback((ids, id) => {
    const startIndex = Math.max(ids.indexOf(id), 0);
    setReader({ key: `${Date.now()}-${id}`, ids, startIndex });
    setReaderVisible(true);
  }, []);

  const openFromList = useCallback((item) => {
    const ids = (scope?.items || []).map((x) => x.id);
    openReader(ids.length ? ids : [item.id], item.id);
  }, [scope, openReader]);

  const openDaily = useCallback((item) => {
    const catList = data?.byCat[item.category];
    const ids = catList && catList.length > 0 ? catList.map((x) => x.id) : [item.id];
    openReader(ids, item.id);
  }, [data, openReader]);

  const openFromNow = useCallback((item) => {
    openReader(nowItems.items.map((x) => x.id), item.id);
  }, [nowItems, openReader]);

  const openFromRecent = useCallback((item) => {
    openReader(recentItems.map((x) => x.id), item.id);
  }, [recentItems, openReader]);

  const closeReader = useCallback(() => setReaderVisible(false), []);

  const changeFont = useCallback((id) => {
    setFontScaleId(id);
    AsyncStorage.setItem(FONT_KEY, id).catch(() => {});
  }, []);

  const goCategory = useCallback((id) => {
    setQuery('');
    setView({ type: 'cat', id });
  }, []);
  const goFav = useCallback(() => { setQuery(''); setView({ type: 'fav', id: null }); }, []);
  const goRecent = useCallback(() => { setQuery(''); setView({ type: 'recent', id: null }); }, []);
  const goHome = useCallback(() => { setQuery(''); setView({ type: 'home', id: null }); }, []);

  const handleBack = useCallback(() => {
    haptic();
    if (query.trim()) { setQuery(''); return; }
    if (view.type !== 'home') { goHome(); return; }
    onBack?.();
  }, [query, view.type, goHome, onBack]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (readerVisible) return false;
      if (query.trim()) { setQuery(''); return true; }
      if (view.type !== 'home') { goHome(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [readerVisible, query, view.type, goHome]);

  /* ---------- Render yardımcıları ---------- */
  const tileWidth = Math.floor((screenW - 40 - 12) / 2);

  const renderRow = useCallback(({ item }) => (
    <DuaRow
      item={item}
      category={data?.catsById[item.category] || OTHER_CAT}
      favorite={favoritesSet.has(item.id)}
      onOpen={openFromList}
      onFavorite={handleFavorite}
    />
  ), [data, favoritesSet, openFromList, handleFavorite]);

  const listHeader = useMemo(() => {
    if (!scope) return null;
    return (
      <View style={styles.scopeHeader}>
        <View style={[styles.scopeIcon, { backgroundColor: tint(scope.color, 0.16) }]}>
          <Ionicons name={scope.icon || 'book-outline'} size={22} color={scope.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.scopeTitle, { color: theme.text }]} numberOfLines={1}>
            {scope.title}
          </Text>
          <Text style={[styles.scopeSub, { color: theme.textDim }]} numberOfLines={1}>
            {scope.items.length} dua{scope.desc ? `, ${scope.desc.toLocaleLowerCase('tr-TR')}` : ''}
          </Text>
        </View>
      </View>
    );
  }, [scope, theme]);

  const emptyForScope = useMemo(() => {
    if (query.trim()) {
      return (
        <EmptyState
          icon="search-outline"
          title="Sonuç bulunamadı"
          subtitle={`“${query.trim()}” için dua bulamadık. Daha kısa ya da farklı bir kelime dene.`}
          actionLabel="Aramayı temizle"
          onAction={() => setQuery('')}
        />
      );
    }
    if (view.type === 'fav') {
      return (
        <EmptyState
          icon="heart-outline"
          title="Henüz favorin yok"
          subtitle="Beğendiğin bir duanın kalp simgesine dokun, burada hep elinin altında olsun."
          actionLabel="Dualara göz at"
          onAction={goHome}
        />
      );
    }
    if (view.type === 'recent') {
      return (
        <EmptyState
          icon="time-outline"
          title="Henüz bir dua okumadın"
          subtitle="Okuduğun dualar burada listelenir."
          actionLabel="Dualara göz at"
          onAction={goHome}
        />
      );
    }
    return (
      <EmptyState
        icon="book-outline"
        title="Bu kategoride dua yok"
        actionLabel="Ana sayfaya dön"
        onAction={goHome}
      />
    );
  }, [query, view.type, goHome]);

  const headerTitle = isHome
    ? 'Dualar'
    : (query.trim() ? 'Arama' : scope?.title || 'Dualar');
  const headerSub = isHome
    ? greeting.text
    : (data ? `${data.list.length} dua içinde` : '');

  /* ================================================================
     Render
     ================================================================ */
  return (
    <UiCtx.Provider value={ui}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={statusBarStyle} />

        {/* Başlık */}
        <View style={styles.header}>
          {(onBack || !isHome) ? (
            <TouchableOpacity
              onPress={handleBack}
              activeOpacity={0.7}
              accessibilityLabel="Geri dön"
              style={[styles.headerBtn, {
                backgroundColor: theme.surface,
                borderColor: highContrast ? theme.text : theme.border,
                borderWidth: highContrast ? 2 : 1,
              }]}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </TouchableOpacity>
          ) : null}

          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
              {headerTitle}
            </Text>
            {!!headerSub && (
              <Text style={[styles.headerSub, { color: theme.textDim }]} numberOfLines={1}>
                {headerSub}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => { haptic(); goFav(); }}
            activeOpacity={0.7}
            accessibilityLabel={`Favorilerim, ${favItems.length} dua`}
            style={[styles.headerBtn, {
              backgroundColor: view.type === 'fav' ? tint(FAV_COLOR, 0.15) : theme.surface,
              borderColor: highContrast
                ? theme.text
                : (view.type === 'fav' ? FAV_COLOR : theme.border),
              borderWidth: highContrast ? 2 : 1,
            }]}
          >
            <Ionicons
              name={view.type === 'fav' ? 'heart' : 'heart-outline'}
              size={20}
              color={FAV_COLOR}
            />
            {favItems.length > 0 && (
              <View style={[styles.headerBadge, { backgroundColor: FAV_COLOR }]}>
                <Text style={styles.headerBadgeText}>
                  {favItems.length > 99 ? '99+' : favItems.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar value={query} onChange={setQuery} />
        </View>

        {/* İçerik */}
        {status === 'loading' && <HomeSkeleton />}

        {status === 'error' && (
          <EmptyState
            icon="cloud-offline-outline"
            title="Dualar yüklenemedi"
            subtitle="Dua verisi okunamadı. Lütfen tekrar deneyin."
            actionLabel="Tekrar dene"
            onAction={retry}
          />
        )}

        {status === 'ready' && data && isHome && (
          <ScrollView
            contentContainerStyle={styles.homeContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {daily && (
              <HeroCard
                item={daily}
                category={data.catsById[daily.category] || OTHER_CAT}
                isFavorite={favoritesSet.has(daily.id)}
                onOpen={openDaily}
                onFavorite={handleFavorite}
              />
            )}

            <View style={styles.shortcutRow}>
              <ShortcutTile
                icon="heart"
                color={FAV_COLOR}
                title="Favorilerim"
                sub={favItems.length > 0 ? `${favItems.length} dua` : 'Henüz yok'}
                onPress={goFav}
              />
              <ShortcutTile
                icon="time"
                color={theme.primary}
                title="Son okunanlar"
                sub={recentItems.length > 0 ? `${recentItems.length} dua` : 'Henüz yok'}
                onPress={goRecent}
              />
            </View>

            {nowItems.items.length > 0 && nowItems.cat && (
              <>
                <SectionTitle
                  title={greeting.text}
                  hint={greeting.hint}
                  actionLabel="Tümü"
                  onAction={() => goCategory(nowItems.cat.id)}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hStrip}
                  keyboardShouldPersistTaps="handled"
                >
                  {nowItems.items.map((it) => (
                    <NowCard
                      key={it.id}
                      item={it}
                      category={data.catsById[it.category]}
                      onOpen={openFromNow}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            {recentItems.length > 0 && (
              <>
                <SectionTitle
                  title="Kaldığın yerden devam et"
                  actionLabel={recentItems.length > 3 ? 'Tümü' : null}
                  onAction={goRecent}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.hStrip}
                  keyboardShouldPersistTaps="handled"
                >
                  {recentItems.map((it) => (
                    <RecentCard
                      key={it.id}
                      item={it}
                      category={data.catsById[it.category]}
                      onOpen={openFromRecent}
                    />
                  ))}
                </ScrollView>
              </>
            )}

            <SectionTitle title="Kategoriler" hint="Konuya göre dua bul" />
            <View style={styles.tileGrid}>
              {data.cats.map((c) => (
                <CategoryTile
                  key={c.id}
                  category={c}
                  count={data.byCat[c.id]?.length || 0}
                  width={tileWidth}
                  onPress={goCategory}
                />
              ))}
            </View>
          </ScrollView>
        )}

        {status === 'ready' && data && !isHome && (
          <FlatList
            data={scope?.items || []}
            keyExtractor={(it) => it.id}
            renderItem={renderRow}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={emptyForScope}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            initialNumToRender={10}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={40}
            windowSize={7}
            removeClippedSubviews
            extraData={favoritesSet}
          />
        )}

        {/* Okuma ekranı */}
        <Modal
          visible={readerVisible}
          animationType="slide"
          transparent={false}
          presentationStyle="fullScreen"
          onRequestClose={closeReader}
          statusBarTranslucent
        >
          {reader && data ? (
            <ReaderBody
              key={reader.key}
              items={reader.ids.map((id) => data.byId.get(id)).filter(Boolean)}
              startIndex={reader.startIndex}
              categoriesById={data.catsById}
              favoritesSet={favoritesSet}
              onFavorite={handleFavorite}
              onClose={closeReader}
              onRead={addToRecent}
              fontScaleId={fontScaleId}
              onFontChange={changeFont}
            />
          ) : null}
        </Modal>
      </SafeAreaView>
    </UiCtx.Provider>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Başlık */
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
  },
  headerBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.6 },
  headerSub: { fontSize: 14, fontWeight: '500', marginTop: 1 },
  headerBadge: {
    position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18,
    borderRadius: 9, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  headerBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },

  /* Arama */
  searchWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 50, borderRadius: 25, paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontSize: 15.5, fontWeight: '500', height: '100%' },
  searchClear: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Ana sayfa */
  homeContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 48 },
  skelRow: { flexDirection: 'row', gap: 12, marginTop: 12 },

  sectionTitleRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    marginTop: 30, marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  sectionHint: { fontSize: 13.5, fontWeight: '500', marginTop: 2 },
  sectionAction: { fontSize: 14.5, fontWeight: '700' },

  hStrip: { gap: 12, paddingRight: 20 },

  /* Günün duası */
  hero: { borderRadius: 28, overflow: 'hidden' },
  heroInner: { padding: 22, minHeight: 220 },
  heroWatermark: { position: 'absolute', right: -30, bottom: -30, opacity: 0.1 },
  heroTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14,
  },
  heroBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  heroTitle: {
    color: '#FFFFFF', fontSize: 24, fontWeight: '800',
    letterSpacing: -0.4, marginBottom: 12,
  },
  heroArabic: {
    color: '#FFFFFF', fontSize: 24, fontWeight: '600', textAlign: 'right',
    writingDirection: 'rtl', lineHeight: 42, marginBottom: 12,
  },
  heroMeaning: {
    color: 'rgba(255,255,255,0.88)', fontSize: 15, lineHeight: 22,
    fontFamily: SERIF, marginBottom: 18,
  },
  heroFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
  },
  heroCat: { flex: 1, color: 'rgba(255,255,255,0.8)', fontSize: 13.5, fontWeight: '600' },
  heroCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
  },
  heroCtaText: { fontSize: 14.5, fontWeight: '800' },

  /* Kısayollar */
  shortcutRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  shortcut: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 18,
  },
  shortcutIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  shortcutTitle: { fontSize: 14.5, fontWeight: '700' },
  shortcutSub: { fontSize: 12.5, fontWeight: '500', marginTop: 1 },

  /* Şimdi için */
  nowCard: { width: 232, padding: 16, borderRadius: 20, minHeight: 112 },
  nowDot: { width: 8, height: 8, borderRadius: 4, marginBottom: 10 },
  nowTitle: { fontSize: 16, fontWeight: '700', lineHeight: 21, marginBottom: 6 },
  nowMeaning: { fontSize: 13.5, lineHeight: 19, fontFamily: SERIF },

  /* Son okunanlar */
  recentCard: {
    width: 156, padding: 14, paddingLeft: 18, borderRadius: 16,
    overflow: 'hidden',
  },
  recentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  recentTitle: { fontSize: 14.5, fontWeight: '700', lineHeight: 19, minHeight: 38 },
  recentSource: { fontSize: 12, fontWeight: '500', marginTop: 6 },

  /* Kategori kartları */
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { padding: 14, borderRadius: 22, minHeight: 124 },
  tileTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  tileIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tileCount: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  tileName: { fontSize: 15.5, fontWeight: '700', letterSpacing: -0.2 },
  tileDesc: { fontSize: 12.5, lineHeight: 17, marginTop: 3, fontWeight: '500' },

  /* Liste */
  listContent: { paddingHorizontal: 20, paddingBottom: 48, paddingTop: 4 },
  scopeHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, marginBottom: 6,
  },
  scopeIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  scopeTitle: { fontSize: 21, fontWeight: '800', letterSpacing: -0.3 },
  scopeSub: { fontSize: 13.5, fontWeight: '500', marginTop: 2 },

  row: { borderRadius: 20, marginBottom: 12, overflow: 'hidden' },
  rowBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  rowBody: { paddingVertical: 14, paddingLeft: 20, paddingRight: 10 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  rowTitle: { fontSize: 16.5, fontWeight: '700', letterSpacing: -0.2, lineHeight: 22 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4, flexWrap: 'wrap' },
  rowMetaText: { fontSize: 12.5, fontWeight: '700' },
  rowSource: { fontSize: 12.5, fontWeight: '500', flexShrink: 1 },
  rowArabic: {
    fontSize: 19, textAlign: 'right', writingDirection: 'rtl',
    marginTop: 10, paddingRight: 8, lineHeight: 32, fontWeight: '600',
  },
  rowMeaning: { fontSize: 14, lineHeight: 20, marginTop: 8, paddingRight: 8, fontFamily: SERIF },

  heartBtn: { padding: 6 },

  /* Boş durum */
  emptyBox: { alignItems: 'center', paddingTop: 56, paddingBottom: 30, paddingHorizontal: 28 },
  emptyIcon: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptyText: { fontSize: 14.5, lineHeight: 21, textAlign: 'center' },
  emptyBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 22 },
  emptyBtnText: { fontSize: 14.5, fontWeight: '800' },

  /* Okuma ekranı */
  readerRoot: { flex: 1 },
  readerTop: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingBottom: 10,
  },
  roundBtn: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  readerCenter: { flex: 1, alignItems: 'center' },
  readerNav: { flexDirection: 'row', alignItems: 'center', gap: 10, maxWidth: '100%' },
  readerCat: { fontSize: 15, fontWeight: '800', flexShrink: 1 },
  readerIndex: { fontSize: 12.5, fontWeight: '600', marginTop: 2 },

  pageContent: { paddingHorizontal: 22, paddingTop: 24 },
  pageTitle: { fontWeight: '800', letterSpacing: -0.5, marginBottom: 20 },
  arabicCard: {
    borderRadius: 24, paddingVertical: 24, paddingHorizontal: 20, marginBottom: 26,
  },
  arabicText: { textAlign: 'right', writingDirection: 'rtl', fontWeight: '600' },
  block: { marginBottom: 24 },
  blockHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  blockLabel: { fontSize: 14, fontWeight: '800' },
  blockText: {},
  virtue: { borderLeftWidth: 4, borderRadius: 14, padding: 16, marginBottom: 22 },
  virtueText: { fontWeight: '500' },
  sourceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sourceText: { fontSize: 13.5, fontWeight: '600', fontStyle: 'italic' },

  /* Dock */
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 10 },
  dockRow: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 12 },
  dockBtn: { alignItems: 'center', gap: 4, minWidth: 64, paddingVertical: 2 },
  dockIcon: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  dockLabel: { fontSize: 12, fontWeight: '700' },

  panel: { paddingHorizontal: 20, paddingBottom: 14 },
  panelTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  segment: { flexDirection: 'row', borderRadius: 16, padding: 4, gap: 4 },
  segmentBtn: {
    flex: 1, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  segmentText: { fontWeight: '800' },

  counterRow: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  counterBtn: {
    width: 104, height: 104, borderRadius: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  counterNum: { fontSize: 38, fontWeight: '800', letterSpacing: -1 },
  targetRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  targetChip: {
    paddingHorizontal: 12, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  targetText: { fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  counterMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  counterHint: { fontSize: 13, fontWeight: '600' },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  toast: {
    position: 'absolute', alignSelf: 'center',
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
  },
  toastText: { fontSize: 13.5, fontWeight: '700' },
});