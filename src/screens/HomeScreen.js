// src/screens/HomeScreen.js
import React, {
  useState, useEffect, useCallback, useMemo, useRef, memo, forwardRef,
  createContext, useContext,
} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Modal,
  AccessibilityInfo,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Animated,
  Easing,
  Platform,
  Share,
  AppState,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import {
  useAppStore,
  useHomePrefs,
  useReadingFontScale,
  useGlobalHaptic,
  useReadingMode,
} from '../store/useAppStore';
import {
  preloadHomeData, getActiveVakitSlot,
} from '../services/homePreloader';
import {
  schedulePrayerNotifications, isNotificationsAvailable,
} from '../services/prayerNotifications';
import VakitContentCard from '../components/VakitContentCard';
import { getVakitBaslik } from '../data/vakitContent';

/* ================================================================
   GÜVENLİ MODÜL YÜKLEMELERİ & YARDIMCI FONKSİYONLAR
   ================================================================ */
const getModule = (mod) => (mod && mod.default ? mod.default : mod);

let WidgetUpdate = null;
try { WidgetUpdate = getModule(require('react-native-android-widget')); } catch {}

let Haptics = null;
try { Haptics = getModule(require('expo-haptics')); } catch {}

let RNCNetInfo = null;
try { RNCNetInfo = getModule(require('@react-native-community/netinfo')); } catch {}

let Clipboard = null;
try { Clipboard = getModule(require('expo-clipboard')); } catch {}

const hapticImpact = (style = 'light') => {
  try {
    const enabled = useAppStore.getState().globalHaptic;
    if (enabled === false) return;
    const H = getModule(Haptics);
    if (!H || typeof H.impactAsync !== 'function') return;
    const map = H.ImpactFeedbackStyle ?? {};
    const arg = style === 'medium' ? map.Medium
      : style === 'heavy' ? map.Heavy
      : map.Light;
    if (arg !== undefined) H.impactAsync(arg);
  } catch {}
};

const IS_WEB = Platform.OS === 'web';
const USE_NATIVE = !IS_WEB;

const FOCUS_RING = {
  outlineStyle: 'solid', outlineWidth: 2, outlineOffset: 2, outlineColor: '#3B82F6',
};

const TouchableOpacity = memo(forwardRef(function TouchableOpacity({
  activeOpacity = 0.7, style, disabled, hitSlop, children, ...rest
}, ref) {
  return (
    <Pressable
      ref={ref}
      disabled={disabled}
      hitSlop={hitSlop ?? { top: 8, bottom: 8, left: 8, right: 8 }}
      {...rest}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && { opacity: activeOpacity },
        IS_WEB && { cursor: disabled ? 'default' : 'pointer' },
        IS_WEB && state.hovered && !state.pressed && { opacity: 0.94 },
        IS_WEB && state.focused && FOCUS_RING,
      ]}
    >
      {children}
    </Pressable>
  );
}));

function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => { if (alive) setReduce(!!v); })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => setReduce(!!v));
    return () => { alive = false; sub?.remove?.(); };
  }, []);
  return reduce;
}

async function copyText(text) {
  try {
    if (Clipboard?.setStringAsync) {
      await Clipboard.setStringAsync(text);
      return true;
    }
    if (IS_WEB && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {}
  return false;
}

async function shareText(message) {
  if (IS_WEB) {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ text: message });
        return 'shared';
      }
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancelled';
    }
    return (await copyText(message)) ? 'copied' : 'failed';
  }
  try {
    await Share.share({ message });
    return 'shared';
  } catch {
    return 'failed';
  }
}

const SPACING = Object.freeze({ xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 });
const RADIUS = Object.freeze({ sm: 10, md: 14, lg: 18, xl: 22, xxl: 26, hero: 28 });

const DEFAULT_WIDGETS_CONFIG = Object.freeze({
  showVerseCard: true, showDuaCard: true, showEsmaCard: true,
  showProgressTrack: true, showKerahatWarning: true,
  notificationsEnabled: true, reminderBeforeMinutes: 15,
});

const FONT_SCALES = [1.0, 1.15, 1.3];
const FONT_LABELS = ['Aa', 'Aa+', 'Aa++'];
const FONT_NAMES = ['Normal', 'Büyük', 'Çok Büyük'];

const PRAYER_CONFIG = [
  { id: 'imsak',   name: 'İmsak',   icon: 'weather-night',         isSunrise: false },
  { id: 'sunrise', name: 'Güneş',   icon: 'weather-sunset-up',     isSunrise: true  },
  { id: 'dhuhr',   name: 'Öğle',    icon: 'weather-sunny',         isSunrise: false },
  { id: 'asr',     name: 'İkindi', icon: 'weather-partly-cloudy', isSunrise: false },
  { id: 'maghrib', name: 'Akşam',  icon: 'weather-sunset-down',   isSunrise: false },
  { id: 'isha',    name: 'Yatsı',   icon: 'weather-night',         isSunrise: false },
];

const IMSAK_CONFIG = PRAYER_CONFIG.find((p) => p.id === 'imsak');

const QUICK_ACTIONS = [
  { key: 'qibla',    icon: 'compass-outline',      label: 'Kıble',   prop: 'onOpenQibla'    },
  { key: 'zikir',    icon: 'finger-print-outline', label: 'Zikir',   prop: 'onOpenZikir'    },
  { key: 'dualar',   icon: 'heart-outline',        label: 'Dualar',  prop: 'onOpenDua'      },
  { key: 'calendar', icon: 'calendar-outline',     label: 'Takvim',  prop: 'onOpenCalendar' },
];

const APPROACHING_MINUTES = 15;

const SHADOW_SM = Platform.select({
  web: { boxShadow: '0 4px 14px rgba(0,0,0,0.05)' },
  default: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
});
const SHADOW_LG = Platform.select({
  web: { boxShadow: '0 12px 28px rgba(0,0,0,0.12)' },
  default: { shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 9 },
});

const pad = (v) => String(v).padStart(2, '0');

const getLocalDateString = (d = new Date()) =>
  [d.getFullYear(), pad(d.getMonth() + 1), pad(d.getDate())].join('-');

const getLocalDateTimeString = (d) =>
  `${getLocalDateString(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

const toDate = (time, base = new Date(), offset = 0) => {
  if (!time) return null;
  const m = String(time).match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]), mn = Number(m[2]);
  if (h < 0 || h > 23 || mn < 0 || mn > 59) return null;
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  d.setHours(h, mn, 0, 0);
  return d;
};

const formatMinutes = (minutes) => {
  const total = Math.max(0, Math.ceil(minutes));
  if (total >= 60) {
    const h = Math.floor(total / 60), r = total % 60;
    return r === 0 ? `${h} saat` : `${h} saat ${r} dk`;
  }
  if (total <= 1) return '1 dakikadan az';
  return `${total} dakika`;
};

const formatMinutesShort = (minutes) => {
  const total = Math.max(0, Math.ceil(minutes));
  if (total >= 60) {
    const h = Math.floor(total / 60), r = total % 60;
    return r === 0 ? `${h} sa` : `${h} sa ${r} dk`;
  }
  return `${total} dk`;
};

const dateLabel = (d) =>
  d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });

const getSourceLabel = (source) =>
  ({ diyanet: 'Diyanet', aladhan: 'Yedek', cache: 'Diyanet' }[source] ?? 'Vakitler');

const getGreeting = (now) => {
  const h = now.getHours();
  if (h >= 5 && h < 11) return 'Hayırlı Sabahlar';
  if (h >= 11 && h < 17) return 'Hayırlı Günler';
  if (h >= 17 && h < 20) return 'Hayırlı Akşamlar';
  return 'Hayırlı Geceler';
};

const formatCountdown = (targetDate, now) => {
  if (!targetDate) return '--:--';
  const diff = Math.max(0, targetDate.getTime() - now.getTime());
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
};

function getNextPrayer(prayers, now, tomorrowImsak) {
  const candidates = prayers
    .filter((p) => !p.isSunrise)
    .map((p) => ({ ...p, date: toDate(p.time, now) }))
    .filter((p) => p.date && p.date > now)
    .sort((a, b) => a.date - b.date);

  if (candidates.length > 0) return candidates[0];

  const nextImsak = toDate(tomorrowImsak, now, 1);
  if (nextImsak) {
    return {
      id: IMSAK_CONFIG.id,
      name: IMSAK_CONFIG.name,
      icon: IMSAK_CONFIG.icon,
      time: tomorrowImsak,
      date: nextImsak,
      tomorrow: true,
    };
  }
  return null;
}

function getPreviousPrayerDate(prayers, now) {
  const past = prayers
    .filter((p) => !p.isSunrise)
    .map((p) => ({ ...p, date: toDate(p.time, now) }))
    .filter((p) => p.date && p.date <= now)
    .sort((a, b) => b.date - a.date);

  if (past.length > 0) return past[0].date;

  const isha = prayers.find((p) => p.id === 'isha');
  return isha ? toDate(isha.time, now, -1) : null;
}

function getKerahatInfo(prayers, now) {
  const find = (id) => prayers.find((p) => p.id === id);
  const sunrise = toDate(find('sunrise')?.time, now);
  const maghrib = toDate(find('maghrib')?.time, now);
  const dhuhr = toDate(find('dhuhr')?.time, now);
  const zeval = dhuhr ? new Date(dhuhr.getTime() - 15 * 60 * 1000) : null;

  const window = (target, duration, reason) => {
    if (!target) return null;
    const elapsed = now.getTime() - target.getTime();
    const ms = duration * 60 * 1000;
    if (elapsed < 0 || elapsed >= ms) return null;
    const endsAt = new Date(target.getTime() + ms);
    return {
      reason, endsAt,
      remainingMinutes: Math.ceil((endsAt.getTime() - now.getTime()) / 60000),
      progress: Math.min(1, elapsed / ms),
    };
  };

  return (
    window(sunrise, 45, 'Güneş doğuşu çevresinde nafile namaz konusunda dikkatli olun.') ||
    window(zeval, 10, 'Zeval vakti çevresinde namaz vakti konusunda dikkatli olun.') ||
    window(maghrib, 45, 'Güneş batışı çevresinde nafile namaz konusunda dikkatli olun.') ||
    null
  );
}

function buildNotificationPayload(times, tomorrowImsak) {
  if (!times) return [];
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const entries = [
    ['İmsak', times.imsak, today],
    ['Güneş', times.sunrise, today],
    ['Öğle', times.dhuhr, today],
    ['İkindi', times.asr, today],
    ['Akşam', times.maghrib, today],
    ['Yatsı', times.isha, today],
    ['İmsak', tomorrowImsak, tomorrow],
  ];

  return entries
    .filter(([, time, base]) => Boolean(toDate(time, base)))
    .map(([name, time, base]) => ({
      name,
      date: getLocalDateTimeString(toDate(time, base)),
    }));
}

const ActiveContext = createContext(true);

function useAlignedClock(periodMs, active = true) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!active) return undefined;
    let timer = null;
    let stopped = false;
    const schedule = () => {
      clearTimeout(timer);
      const delay = periodMs - (Date.now() % periodMs) + 20;
      timer = setTimeout(() => {
        if (stopped) return;
        setNow(new Date());
        schedule();
      }, delay);
    };
    setNow(new Date());
    schedule();
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') {
        setNow(new Date());
        schedule();
      } else {
        clearTimeout(timer);
      }
    });
    return () => {
      stopped = true;
      clearTimeout(timer);
      sub?.remove?.();
    };
  }, [periodMs, active]);
  return now;
}

function useCurrentTime(active = true) {
  return useAlignedClock(60000, active);
}

function useSecondClock(active = true) {
  return useAlignedClock(1000, active);
}

function useStaggeredEntrance(count, { delay = 0, duration = 400, stagger = 70, start = true } = {}) {
  const values = useRef(
    Array.from({ length: count }, () => new Animated.Value(0)),
  ).current;
  const reduce = useReduceMotion();

  useEffect(() => {
    if (!start) return;
    if (reduce) {
      values.forEach((v) => v.setValue(1));
      return;
    }

    const animations = values.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration,
        delay: delay + i * stagger,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE,
      }),
    );
    Animated.parallel(animations).start();
    return () => animations.forEach((a) => a.stop?.());
  }, [values, delay, duration, stagger, start, reduce]);

  return values.map((v) => ({
    opacity: v,
    transform: [{
      translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
    }],
  }));
}

const PressableScale = memo(function PressableScale({
  onPress, onLongPress, children, style, containerStyle,
  scaleTo = 0.96, disabled, accessibilityLabel, accessibilityHint,
  accessibilityRole = 'button', haptic = 'light',
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = useCallback(() => {
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: USE_NATIVE, speed: 60, bounciness: 5 }).start();
  }, [scale, scaleTo]);
  const pressOut = useCallback(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: USE_NATIVE, speed: 60, bounciness: 5 }).start();
  }, [scale]);
  const handlePress = useCallback((e) => {
    if (haptic) hapticImpact(haptic);
    onPress?.(e);
  }, [onPress, haptic]);
  const handleLongPress = useCallback((e) => {
    if (!onLongPress) return;
    hapticImpact('medium');
    onLongPress(e);
  }, [onLongPress]);

  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        onLongPress={onLongPress ? handleLongPress : undefined}
        delayLongPress={400}
        disabled={disabled}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
});

const Reveal = memo(function Reveal({ animStyle, children, style }) {
  return (
    <Animated.View style={[style, animStyle]}>
      {children}
    </Animated.View>
  );
});

const Section = memo(function Section({
  title, subtitle, rightAction, theme, fontScale, children, style, icon, highContrast,
}) {
  return (
    <View style={[styles.section, style]}>
      {(title || rightAction) ? (
        <View style={styles.sectionHeading}>
          <View style={styles.sectionTitleRow}>
            {icon ? (
              <View style={[styles.sectionIconBox, {
                backgroundColor: highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`),
                borderWidth: highContrast ? 2 : 1,
                borderColor: highContrast ? '#FFFFFF' : `${theme.primary}33`,
              }]}>
                <MaterialCommunityIcons name={icon} size={16} color={theme.primary} />
              </View>
            ) : null}
            <View style={{ flex: 1, minWidth: 0 }}>
              {title ? (
                <Text
                  accessibilityRole="header"
                  style={[styles.sectionTitle, {
                    color: theme.text,
                    fontSize: 17 * fontScale,
                    fontWeight: '900',
                  }]}
                >
                  {title}
                </Text>
              ) : null}
              {subtitle ? (
                <Text
                  style={{
                    color: theme.textDim, fontSize: 12 * fontScale,
                    marginTop: 2,
                    fontWeight: highContrast ? '700' : '500',
                    lineHeight: 16 * fontScale,
                  }}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          </View>
          {rightAction}
        </View>
      ) : null}
      {children}
    </View>
  );
});

const IslamicDecor = memo(function IslamicDecor({ color }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <MaterialCommunityIcons
        name="star-crescent"
        size={260}
        color={color}
        style={{ position: 'absolute', right: -70, top: -50, opacity: 0.05, transform: [{ rotate: '20deg' }] }}
      />
      <MaterialCommunityIcons
        name="moon-waning-crescent"
        size={150}
        color={color}
        style={{ position: 'absolute', left: -35, bottom: -25, opacity: 0.05, transform: [{ rotate: '-20deg' }] }}
      />
    </View>
  );
});

const AnimatedDot = memo(function AnimatedDot({ delay, theme }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(a, { toValue: 1, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
      Animated.timing(a, { toValue: 0, duration: 500, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a, delay]);
  return (
    <Animated.View style={{
      width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary,
      marginHorizontal: 4,
      opacity: a.interpolate({ inputRange: [0, 1], outputRange: [0.25, 1] }),
      transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.15] }) }],
    }} />
  );
});

const RotatingOrnament = memo(function RotatingOrnament({ color }) {
  const rot = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    if (reduce) return undefined;
    const loop = Animated.loop(Animated.timing(rot, {
      toValue: 1, duration: 24000, easing: Easing.linear, useNativeDriver: USE_NATIVE,
    }));
    loop.start();
    return () => loop.stop();
  }, [rot, reduce]);

  const rotate = rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: 200, height: 200, borderRadius: 100,
        borderWidth: 1, borderColor: color, opacity: 0.08,
        transform: [{ rotate }],
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <View style={{
        width: 160, height: 160, borderRadius: 80,
        borderWidth: 1, borderColor: color,
      }} />
      <MaterialCommunityIcons
        name="star-four-points-outline"
        size={22}
        color={color}
        style={{ position: 'absolute', top: 6 }}
      />
    </Animated.View>
  );
});

const LoadingScreen = memo(function LoadingScreen({ theme, subtitle, highContrast }) {
  const fade = useRef(new Animated.Value(0)).current;
  const isDark = theme.mode === 'dark' || theme.mode === 'oled' || highContrast;
  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1, duration: 550, easing: Easing.out(Easing.cubic), useNativeDriver: USE_NATIVE,
    }).start();
  }, [fade]);

  return (
    <SafeAreaView style={[styles.center, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={{
        alignItems: 'center', paddingHorizontal: 32, opacity: fade,
        transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
      }}>
        <View style={{ position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
          <RotatingOrnament color={theme.primary} />
          <View style={[styles.loadingBadge, {
            backgroundColor: highContrast ? '#000000' : (theme.primaryGlow || theme.surfaceElevated),
            borderColor: theme.border,
            borderWidth: highContrast ? 2 : 1,
            shadowColor: theme.primary, ...SHADOW_LG,
          }]}>
            <MaterialCommunityIcons name="star-crescent" size={42} color={theme.primary} />
          </View>
        </View>
        <Text
          accessibilityLabel="Bismillâhirrahmânirrahîm"
          style={[styles.bismillah, { color: theme.primary, fontWeight: highContrast ? '900' : '600' }]}
        >
          بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
        </Text>
        <Text style={[styles.loadingSubtitle, { color: theme.textDim, fontWeight: highContrast ? '700' : '500' }]}>
          Rahman ve Rahîm olan{'\n'}Allah'ın adıyla
        </Text>
        <View style={[styles.loadingDivider, { backgroundColor: theme.border }]} />
        <View style={{ flexDirection: 'row' }}>
          <AnimatedDot delay={0} theme={theme} />
          <AnimatedDot delay={180} theme={theme} />
          <AnimatedDot delay={360} theme={theme} />
        </View>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.loadingStatus, { color: theme.textMuted, fontWeight: highContrast ? '900' : '600' }]}
        >
          {subtitle || 'Hazırlanıyor…'}
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
});

const CountdownSegment = memo(function CountdownSegment({
  value, label, fontSize, theme, active, highContrast,
}) {
  return (
    <View style={styles.countdownBlock}>
      <View style={[
        styles.countdownPill,
        {
          borderRadius: RADIUS.md,
          borderColor: active ? (highContrast ? '#FFFF00' : `${theme.primary}77`) : theme.border,
          borderWidth: highContrast ? 2 : 1,
          backgroundColor: active
            ? (highContrast ? '#000000' : `${theme.primary}18`)
            : theme.surfaceElevated,
        },
      ]}>
        <Text style={[
          styles.countdownValue,
          {
            fontSize,
            color: active ? theme.primary : theme.text,
            fontWeight: '900',
          },
        ]}>
          {value}
        </Text>
      </View>
      <Text style={[
        styles.countdownLabel,
        { color: theme.textDim, fontWeight: highContrast ? '900' : '800' },
      ]}>
        {label}
      </Text>
    </View>
  );
});

const SegmentedCountdown = memo(function SegmentedCountdown({
  targetDate, fontScale, compact, theme, highContrast,
}) {
  const homeActive = useContext(ActiveContext);
  const live = useSecondClock(homeActive && !!targetDate);
  const diff = targetDate ? Math.max(0, targetDate.getTime() - live.getTime()) : 0;
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const valueSize = (compact ? 20 : 24) * fontScale;
  const lastHour = targetDate && diff > 0 && diff < 60 * 60 * 1000;

  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityLabel={
        targetDate
          ? `Kalan süre ${pad(h)} saat ${pad(m)} dakika ${pad(s)} saniye`
          : 'Kalan süre hesaplanıyor'
      }
      style={styles.countdownRow}
    >
      <CountdownSegment value={targetDate ? pad(h) : '--'} label="saat" fontSize={valueSize} theme={theme} highContrast={highContrast} />
      <Text style={[styles.countdownSep, { fontSize: valueSize * 0.85, color: theme.primary, fontWeight: highContrast ? '900' : '800' }]}>:</Text>
      <CountdownSegment value={targetDate ? pad(m) : '--'} label="dk" fontSize={valueSize} theme={theme} active={lastHour} highContrast={highContrast} />
      <Text style={[styles.countdownSep, { fontSize: valueSize * 0.85, color: theme.primary, fontWeight: highContrast ? '900' : '800' }]}>:</Text>
      <CountdownSegment value={targetDate ? pad(s) : '--'} label="sn" fontSize={valueSize} theme={theme} active={lastHour} highContrast={highContrast} />
    </View>
  );
});

const HeroPulse = memo(function HeroPulse({ color }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    if (reduce) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
      Animated.timing(pulse, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse, reduce]);
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', top: -80, right: -80, width: 300, height: 300,
      borderRadius: 150, backgroundColor: color,
      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.03, 0.08] }),
    }} />
  );
});

const NextPrayerIcon = memo(function NextPrayerIcon({
  icon, approaching, theme, size, containerSize, highContrast,
}) {
  const pulse = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();

  useEffect(() => {
    if (!approaching || reduce) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
      Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: USE_NATIVE }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [approaching, pulse, reduce]);

  return (
    <Animated.View style={[
      styles.heroIcon,
      {
        backgroundColor: highContrast ? '#000000' : `${theme.primary}15`,
        borderColor: approaching
          ? (highContrast ? '#FFFF00' : `${theme.primary}77`)
          : (highContrast ? '#FFFFFF' : `${theme.primary}33`),
        borderWidth: highContrast ? 2 : 1,
        width: containerSize, height: containerSize,
        borderRadius: containerSize * 0.32,
        transform: [{
          scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }),
        }],
      },
    ]}>
      <MaterialCommunityIcons name={icon || 'star-crescent'} size={size} color={theme.primary} />
    </Animated.View>
  );
});

const ProgressBar = memo(function ProgressBar({ from, to, now, theme }) {
  const ratio = useMemo(() => {
    if (!from || !to || !now) return 0;
    const total = to.getTime() - from.getTime();
    if (total <= 0) return 1;
    return Math.min(1, Math.max(0, (now.getTime() - from.getTime()) / total));
  }, [from, to, now]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
      style={[styles.progressTrack, { backgroundColor: theme.border }]}
    >
      <View style={[styles.progressFill, { width: `${ratio * 100}%`, backgroundColor: theme.primary }]} />
    </View>
  );
});

/* ================================================================
   BASİT MOD HERO KARTI — Saniye kutuları ve görsel karmaşa olmadan,
   doğrudan sıradaki vakit adı, saati ve okunaklı kalan süre
   ================================================================ */
const SimpleHero = memo(function SimpleHero({
  theme, fontScale, formattedDate, nextPrayer, now,
  refreshing, onRefresh, onShare, onLongPress, highContrast,
}) {
  const minutesLeft = nextPrayer?.date
    ? Math.max(0, (nextPrayer.date.getTime() - now.getTime()) / 60000)
    : null;
  const isApproaching = minutesLeft !== null && minutesLeft > 0 && minutesLeft < APPROACHING_MINUTES;

  return (
    <PressableScale
      onPress={onLongPress}
      onLongPress={onLongPress}
      haptic="light"
      accessibilityRole="button"
      accessibilityLabel={
        nextPrayer
          ? `Sıradaki namaz ${nextPrayer.name}, saat ${nextPrayer.time}, ${formatMinutes(minutesLeft)} kaldı`
          : 'Vakit bilgisi'
      }
      style={[
        styles.simpleHero,
        {
          backgroundColor: theme.surface,
          borderColor: isApproaching ? theme.primary : theme.border,
          borderWidth: highContrast || isApproaching ? 2 : 1,
        },
        SHADOW_SM,
        { shadowColor: highContrast ? '#FFFFFF' : theme.text },
      ]}
    >
      <View style={styles.simpleHeroTop}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <MaterialCommunityIcons
            name={nextPrayer?.icon || 'star-crescent'}
            size={18 * fontScale}
            color={theme.primary}
          />
          <Text style={[styles.simpleHeroEyebrow, { color: theme.primary, fontSize: 12 * fontScale }]}>
            {nextPrayer?.tomorrow ? 'YARIN SIRADAKİ NAMAZ' : 'SIRADAKİ NAMAZ'}
          </Text>
        </View>
        <Text style={[styles.simpleHeroDate, { color: theme.textDim, fontSize: 11.5 * fontScale }]}>
          {formattedDate}
        </Text>
      </View>

      <View style={styles.simpleHeroMain}>
        <Text
          style={[styles.simpleHeroName, { color: theme.text, fontSize: 34 * fontScale }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {nextPrayer?.name ?? '—'}
        </Text>
        <Text
          style={[styles.simpleHeroTime, { color: theme.primary, fontSize: 40 * fontScale }]}
          numberOfLines={1}
        >
          {nextPrayer?.time ?? '--:--'}
        </Text>
      </View>

      {minutesLeft !== null ? (
        <View
          style={[
            styles.simpleHeroRemainingBox,
            {
              backgroundColor: highContrast
                ? '#000000'
                : (isApproaching ? `${theme.primary}22` : `${theme.primary}12`),
              borderColor: isApproaching ? theme.primary : `${theme.primary}30`,
              borderWidth: highContrast ? 2 : 1,
            },
          ]}
        >
          <Ionicons name="time-outline" size={18 * fontScale} color={theme.primary} />
          <Text
            style={[styles.simpleHeroRemainingText, { color: theme.text, fontSize: 15 * fontScale }]}
            numberOfLines={1}
          >
            {formatMinutes(minutesLeft)} kaldı
          </Text>
        </View>
      ) : null}

      <View style={[styles.simpleHeroFooter, { borderTopColor: theme.border }]}>
        <TouchableOpacity
          onPress={onShare}
          accessibilityLabel="Vakitleri paylaş"
          style={[styles.simpleHeroActionBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
        >
          <Ionicons name="share-outline" size={16} color={theme.primary} />
          <Text style={[styles.simpleHeroActionText, { color: theme.text, fontSize: 12 * fontScale }]}>
            Paylaş
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onRefresh}
          disabled={refreshing}
          accessibilityLabel="Vakitleri yenile"
          style={[styles.simpleHeroActionBtn, { borderColor: theme.border, backgroundColor: theme.background }]}
        >
          {refreshing ? (
            <ActivityIndicator color={theme.primary} size="small" />
          ) : (
            <Ionicons name="refresh" size={16} color={theme.primary} />
          )}
          <Text style={[styles.simpleHeroActionText, { color: theme.text, fontSize: 12 * fontScale }]}>
            Yenile
          </Text>
        </TouchableOpacity>
      </View>
    </PressableScale>
  );
});

/* ================================================================
   BASİT MOD VAKİT LİSTESİ — Alt alta, geniş puntolu vakit satırları
   ================================================================ */
const SimplePrayerList = memo(function SimplePrayerList({
  prayers, tomorrowImsak, now, nextPrayer, theme, fontScale, highContrast,
}) {
  const items = useMemo(() => {
    const base = prayers.map((p) => ({ ...p, tomorrow: false }));
    if (tomorrowImsak) {
      base.push({
        id: 'imsak-tomorrow',
        name: 'İmsak (Yarın)',
        icon: 'weather-night',
        time: tomorrowImsak,
        isSunrise: false,
        tomorrow: true,
      });
    }
    return base;
  }, [prayers, tomorrowImsak]);

  if (items.length === 0) return null;

  return (
    <View
      style={[
        styles.simpleListCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: highContrast ? 2 : 1,
        },
        SHADOW_SM,
        { shadowColor: highContrast ? '#FFFFFF' : theme.text },
      ]}
    >
      <Text style={[styles.simpleListHeader, { color: theme.textDim, fontSize: 12 * fontScale }]}>
        GÜNÜN NAMAZ VAKİTLERİ
      </Text>

      {items.map((p, idx) => {
        const date = toDate(p.time, now, p.tomorrow ? 1 : 0);
        const isPassed = !p.tomorrow && date && date <= now;
        const isNext = p.tomorrow
          ? nextPrayer?.tomorrow === true
          : (nextPrayer?.id === p.id && !nextPrayer?.tomorrow);

        const rowBg = isNext
          ? (highContrast ? '#000000' : `${theme.primary}18`)
          : 'transparent';

        return (
          <View
            key={p.id}
            accessibilityLabel={`${p.name}, saat ${p.time}${isNext ? ', sıradaki vakit' : isPassed ? ', geçti' : ''}`}
            style={[
              styles.simpleListRow,
              {
                backgroundColor: rowBg,
                borderTopWidth: idx === 0 ? 0 : StyleSheet.hairlineWidth,
                borderTopColor: theme.border,
                borderColor: isNext ? theme.primary : 'transparent',
                borderWidth: isNext ? (highContrast ? 2 : 1.5) : 0,
                borderRadius: isNext ? RADIUS.md : 0,
              },
            ]}
          >
            <View style={styles.simpleListLeft}>
              <MaterialCommunityIcons
                name={p.icon}
                size={20 * fontScale}
                color={isNext ? theme.primary : (isPassed ? theme.textMuted : theme.textDim)}
              />
              <Text
                style={[
                  styles.simpleListName,
                  {
                    color: isNext ? theme.primary : (isPassed ? theme.textMuted : theme.text),
                    fontSize: 16 * fontScale,
                    fontWeight: isNext ? '900' : '700',
                  },
                ]}
              >
                {p.name}
              </Text>
              {isNext ? (
                <View style={[styles.simpleListNextTag, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.simpleListNextTagText, { color: highContrast ? '#000000' : '#FFFFFF' }]}>
                    SIRADAKİ
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.simpleListRight}>
              <Text
                style={[
                  styles.simpleListTime,
                  {
                    color: isNext ? theme.primary : (isPassed ? theme.textMuted : theme.text),
                    fontSize: 18 * fontScale,
                    fontWeight: isNext ? '900' : '800',
                  },
                ]}
              >
                {p.time}
              </Text>
              {isPassed && !isNext ? (
                <Ionicons name="checkmark-circle" size={16} color={theme.textMuted} />
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
});

const Hero = memo(function Hero({
  theme, compact, fontScale, sourceLabel, formattedDate, hijri,
  nextPrayer, previousPrayerDate, now, refreshing, showProgress,
  showCountdown, onRefresh, onShare, onLongPress, onLayout, highContrast,
}) {
  const minutesUntilNext = nextPrayer?.date
    ? Math.max(0, (nextPrayer.date.getTime() - now.getTime()) / 60000)
    : null;
  const isApproaching = minutesUntilNext !== null
    && minutesUntilNext > 0 && minutesUntilNext < APPROACHING_MINUTES;

  const iconSize = compact ? 26 : 30;
  const containerSize = compact ? 52 : 58;

  return (
    <View onLayout={onLayout} style={[styles.heroShadowContainer, SHADOW_SM, { shadowColor: highContrast ? '#FFFFFF' : theme.text }]}>
      <PressableScale
        onPress={onLongPress}
        onLongPress={onLongPress}
        haptic={null}
        containerStyle={{ borderRadius: RADIUS.hero }}
        style={[styles.hero, {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: highContrast ? 2 : 1,
          borderRadius: RADIUS.hero,
        }]}
      >
        <IslamicDecor color={highContrast ? '#FFFF00' : theme.primary} />
        <HeroPulse color={highContrast ? '#FFFF00' : theme.primary} />

        <View style={styles.heroTop}>
          <View style={[styles.heroBadge, {
            backgroundColor: highContrast ? '#000000' : `${theme.primary}18`,
            borderColor: highContrast ? '#FFFF00' : `${theme.primary}40`,
            borderWidth: highContrast ? 2 : 1,
            borderRadius: 20,
          }]}>
            <View style={[styles.statusDot, { backgroundColor: theme.primary }]} />
            <Text style={[styles.heroBadgeText, {
              color: theme.primary, fontWeight: highContrast ? '900' : '800',
            }]} numberOfLines={1}>
              {sourceLabel}
            </Text>
          </View>
          <Text style={[styles.heroDateBadge, {
            color: theme.textDim, fontWeight: highContrast ? '700' : '700',
          }]} numberOfLines={1}>
            {formattedDate}
          </Text>
        </View>

        <View style={styles.heroCenter}>
          <View style={styles.heroEyebrowRow}>
            <Text style={[styles.heroEyebrow, {
              fontSize: 11 * fontScale, color: theme.primary,
              fontWeight: highContrast ? '900' : '900',
            }]}>
              {nextPrayer
                ? (nextPrayer.tomorrow ? 'YARIN SIRADAKİ' : 'SIRADAKİ NAMAZ')
                : 'VAKİT BİLGİSİ'}
            </Text>
            {isApproaching ? (
              <View style={[styles.approachingBadge, {
                backgroundColor: highContrast ? '#000000' : `${theme.primary}25`,
                borderWidth: highContrast ? 2 : 0,
                borderColor: '#FFFF00',
              }]}>
                <View style={[styles.approachingDot, { backgroundColor: theme.primary }]} />
                <Text style={[styles.approachingText, {
                  color: theme.primary, fontSize: 9 * fontScale,
                  fontWeight: highContrast ? '900' : '900',
                }]}>
                  YAKLAŞIYOR
                </Text>
              </View>
            ) : null}
          </View>

          <View style={styles.heroNameRow}>
            {nextPrayer ? (
              <NextPrayerIcon
                icon={nextPrayer.icon}
                approaching={isApproaching}
                theme={theme}
                size={iconSize}
                containerSize={containerSize}
                highContrast={highContrast}
              />
            ) : null}
            <View style={{ flexShrink: 1, alignItems: 'center' }}>
              <Text
                accessibilityRole="header"
                style={[styles.heroTitle, {
                  fontSize: (compact ? 36 : 42) * fontScale,
                  color: theme.text,
                  fontWeight: '900',
                }]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
              >
                {nextPrayer?.name ?? '—'}
              </Text>
              <Text style={[styles.heroTime, {
                fontSize: 16 * fontScale,
                color: theme.primary,
                fontWeight: highContrast ? '900' : '800',
              }]}>
                {nextPrayer?.time ?? '--:--'}
              </Text>
            </View>
          </View>
        </View>

        {showCountdown ? (
          <SegmentedCountdown
            targetDate={nextPrayer?.date ?? null}
            fontScale={fontScale}
            compact={compact}
            now={now}
            theme={theme}
            highContrast={highContrast}
          />
        ) : null}

        {showProgress && nextPrayer?.date && previousPrayerDate ? (
          <View style={styles.heroProgressWrap}>
            <ProgressBar
              from={previousPrayerDate}
              to={nextPrayer.date}
              now={now}
              theme={theme}
            />
          </View>
        ) : null}

        <View style={[styles.heroFooter, {
          borderTopColor: theme.border,
          borderTopWidth: highContrast ? 2 : StyleSheet.hairlineWidth,
        }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <MaterialCommunityIcons name="moon-waning-crescent" size={14} color={theme.primary} />
            <Text style={[styles.heroFooterHijri, {
              color: theme.textDim, fontWeight: highContrast ? '700' : '700',
            }]} numberOfLines={1}>
              {hijri || 'Hicri tarih'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <PressableScale
              onPress={onShare}
              accessibilityLabel="Vakitleri paylaş"
              haptic="light"
              style={[styles.heroIconBtn, {
                borderColor: theme.border,
                backgroundColor: theme.background,
                borderWidth: highContrast ? 2 : 1,
              }]}
            >
              <Ionicons name="share-outline" size={16} color={theme.primary} />
            </PressableScale>
            <PressableScale
              onPress={onRefresh}
              disabled={refreshing}
              accessibilityLabel="Yenile"
              haptic="medium"
              style={[styles.heroIconBtn, {
                borderColor: theme.border,
                backgroundColor: theme.background,
                borderWidth: highContrast ? 2 : 1,
              }]}
            >
              {refreshing
                ? <ActivityIndicator color={theme.primary} size="small" />
                : <Ionicons name="refresh" size={16} color={theme.primary} />}
            </PressableScale>
          </View>
        </View>
      </PressableScale>
    </View>
  );
});

const StickyMiniHero = memo(function StickyMiniHero({
  anim, nextPrayer, theme, fontScale, onPress, highContrast, topInset = 0, visible = true,
}) {
  const homeActive = useContext(ActiveContext);
  const live = useSecondClock(homeActive && visible && !!nextPrayer?.date);
  const countdown = useMemo(
    () => formatCountdown(nextPrayer?.date, live),
    [nextPrayer?.date, live],
  );

  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, {
    toValue: 0.97, useNativeDriver: USE_NATIVE, speed: 60, bounciness: 4,
  }).start();
  const pressOut = () => Animated.spring(scale, {
    toValue: 1, useNativeDriver: USE_NATIVE, speed: 60, bounciness: 4,
  }).start();

  return (
    <Animated.View
      style={[
        styles.stickyMini,
        {
          backgroundColor: theme.surface,
          borderBottomColor: theme.border,
          borderBottomWidth: highContrast ? 2 : StyleSheet.hairlineWidth,
          paddingTop: topInset,
          opacity: anim,
          transform: [{
            translateY: anim.interpolate({
              inputRange: [0, 1],
              outputRange: [-(110 + topInset), 0],
            }),
          }],
          shadowColor: highContrast ? '#FFFFFF' : theme.text,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={1}
          style={styles.stickyMiniInner}
          accessibilityLabel={`Sıradaki namaz: ${nextPrayer?.name || 'bilinmiyor'}. Başa dönmek için dokun.`}
        >
          <View style={[styles.stickyMiniIcon, {
            backgroundColor: highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`),
            borderWidth: highContrast ? 2 : 1,
            borderColor: highContrast ? '#FFFFFF' : `${theme.primary}33`,
          }]}>
            <MaterialCommunityIcons
              name={nextPrayer?.icon || 'star-crescent'}
              size={18}
              color={theme.primary}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.stickyMiniEyebrow, {
              color: theme.textDim, fontSize: 9.5 * fontScale,
              fontWeight: highContrast ? '900' : '800',
            }]}>
              {nextPrayer?.tomorrow ? 'YARIN' : 'SIRADAKİ'}
            </Text>
            <Text
              style={[styles.stickyMiniName, {
                color: theme.text, fontSize: 14 * fontScale,
                fontWeight: '900',
              }]}
              numberOfLines={1}
            >
              {nextPrayer?.name ?? '—'}
              <Text style={{ color: theme.textDim, fontWeight: highContrast ? '700' : '600' }}>
                {'  ·  '}{nextPrayer?.time ?? '--:--'}
              </Text>
            </Text>
          </View>
          <View style={[styles.stickyMiniCountdownBox, {
            backgroundColor: highContrast ? '#000000' : `${theme.primary}15`,
            borderColor: highContrast ? '#FFFF00' : `${theme.primary}40`,
            borderWidth: highContrast ? 2 : 1,
          }]}>
            <Text style={[styles.stickyMiniCountdown, {
              color: theme.primary, fontSize: 13 * fontScale,
              fontWeight: '900',
            }]}>
              {countdown}
            </Text>
          </View>
          <View style={styles.stickyMiniArrow}>
            <Ionicons name="chevron-up" size={16} color={theme.textDim} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
});

const InfoAlert = memo(function InfoAlert({
  error, kerahatInfo, notice, onDismissNotice, onRetry, theme, fontScale, highContrast,
}) {
  if (error) {
    return (
      <PressableScale
        onPress={onRetry}
        accessibilityLabel={`Hata: ${error}. Yenilemek için dokun.`}
        containerStyle={{ marginBottom: 12 }}
        style={[styles.alert, styles.alertError, highContrast && { borderColor: '#FF4500', backgroundColor: '#1A0000' }]}
      >
        <Ionicons name="alert-circle" size={20} color={highContrast ? '#FF4500' : '#EF4444'} />
        <Text
          style={[styles.alertText, {
            color: theme.text, fontSize: 12.5 * fontScale,
            lineHeight: 18 * fontScale,
            fontWeight: highContrast ? '700' : 'normal',
          }]}
          numberOfLines={2}
        >
          {error}
        </Text>
        <View style={[styles.alertAction, highContrast && { backgroundColor: '#FF4500' }]}>
          <Text style={{
            color: highContrast ? '#000000' : '#EF4444',
            fontSize: 11, fontWeight: '900',
          }}>
            Yenile
          </Text>
        </View>
      </PressableScale>
    );
  }

  if (kerahatInfo) {
    return (
      <View accessibilityLiveRegion="polite" style={[styles.alert, {
        backgroundColor: highContrast ? '#121212' : (theme.primaryGlow || `${theme.primary}18`),
        borderColor: theme.border,
        borderWidth: highContrast ? 2 : 1,
      }]}>
        <MaterialCommunityIcons name="weather-sunset" size={22} color={theme.primary} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 12.5 * fontScale, fontWeight: '900' }}>
            Kerahat · {formatMinutesShort(kerahatInfo.remainingMinutes)} kaldı
          </Text>
          <View style={[styles.kerahatProgressTrack, { backgroundColor: theme.border }]}>
            <View style={[styles.kerahatProgressFill, {
              width: `${kerahatInfo.progress * 100}%`,
              backgroundColor: theme.primary,
            }]} />
          </View>
          <Text style={{
            color: theme.textDim, fontSize: 11.5 * fontScale,
            marginTop: 6, lineHeight: 16 * fontScale,
            fontWeight: highContrast ? '700' : '500',
          }}>
            {kerahatInfo.reason}
          </Text>
        </View>
      </View>
    );
  }

  if (notice) {
    return (
      <View accessibilityLiveRegion="polite" style={[styles.alert, {
        backgroundColor: theme.surfaceElevated,
        borderColor: theme.border,
        borderWidth: highContrast ? 2 : 1,
      }]}>
        <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
        <Text
          style={[styles.alertText, {
            color: theme.text, fontSize: 12.5 * fontScale,
            lineHeight: 18 * fontScale,
            fontWeight: highContrast ? '700' : 'normal',
          }]}
          numberOfLines={2}
        >
          {notice}
        </Text>
        <TouchableOpacity
          onPress={onDismissNotice}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={16} color={theme.textMuted} />
        </TouchableOpacity>
      </View>
    );
  }

  return null;
});

const AnimatedPrayerCard = memo(function AnimatedPrayerCard({ active, children }) {
  const scale = useRef(new Animated.Value(active ? 1.03 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.03 : 1,
      useNativeDriver: USE_NATIVE,
      speed: 40,
      bounciness: 5,
    }).start();
  }, [active, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
});

const PrayerStrip = memo(function PrayerStrip({
  prayers, tomorrowImsak, now, nextPrayer, theme, fontScale, highContrast,
}) {
  const scrollRef = useRef(null);
  const [stripW, setStripW] = useState(0);

  const items = useMemo(() => {
    const base = prayers.map((p) => ({ ...p, tomorrow: false }));
    if (tomorrowImsak) {
      base.push({
        id: 'imsak-tomorrow',
        name: 'İmsak',
        icon: 'weather-night',
        time: tomorrowImsak,
        isSunrise: false,
        tomorrow: true,
      });
    }
    return base;
  }, [prayers, tomorrowImsak]);

  const baseCardWidth = useMemo(
    () => Math.round(72 + (fontScale - 1) * 26),
    [fontScale],
  );
  const STRIP_GAP = 10;
  const fits = stripW > 0 && items.length > 0
    && stripW >= items.length * (baseCardWidth + STRIP_GAP) - STRIP_GAP + 4;
  const cardWidth = fits
    ? Math.floor((stripW - 4 - (items.length - 1) * STRIP_GAP) / items.length)
    : baseCardWidth;

  useEffect(() => {
    if (items.length === 0) return;
    let targetIdx = -1;
    if (nextPrayer?.tomorrow) {
      targetIdx = items.findIndex((p) => p.id === 'imsak-tomorrow');
    } else if (nextPrayer) {
      targetIdx = items.findIndex((p) => p.id === nextPrayer.id);
    }
    if (targetIdx < 0) return;
    const t = setTimeout(() => {
      try {
        scrollRef.current?.scrollTo({
          x: Math.max(0, targetIdx * (cardWidth + 10) - 30),
          animated: true,
        });
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [nextPrayer?.id, nextPrayer?.tomorrow, items.length, cardWidth]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        setStripW((prev) => (prev === w ? prev : w));
      }}
      scrollEnabled={!fits}
      showsHorizontalScrollIndicator={IS_WEB && !fits}
      contentContainerStyle={styles.prayerStripContent}
      nestedScrollEnabled
    >
      {items.map((p) => {
        const date = toDate(p.time, now, p.tomorrow ? 1 : 0);
        const isPassed = !p.tomorrow && date && date <= now;
        const isNext = p.tomorrow
          ? (nextPrayer?.tomorrow === true)
          : (nextPrayer?.id === p.id && !nextPrayer?.tomorrow);
        const active = isNext;

        const cardBg = active ? theme.primary : theme.surface;
        const cardBorder = active ? (highContrast ? '#000000' : theme.primary) : theme.border;
        const iconBg = active
          ? (highContrast ? '#000000' : 'rgba(255,255,255,0.22)')
          : (highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`));
        const iconColor = active ? (highContrast ? '#000000' : '#FFFFFF') : theme.primary;
        const nameColor = active
          ? (highContrast ? '#000000' : 'rgba(255,255,255,0.92)')
          : (isPassed ? theme.textMuted : theme.textDim);
        const timeColor = active
          ? (highContrast ? '#000000' : '#FFFFFF')
          : (isPassed ? theme.textMuted : theme.text);

        return (
          <AnimatedPrayerCard key={p.id} active={active} theme={theme} highContrast={highContrast}>
            <View
              style={[
                styles.prayerCard,
                {
                  width: cardWidth,
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  borderWidth: highContrast ? 2 : 1,
                  borderRadius: RADIUS.lg,
                },
                active && styles.prayerCardActiveShadow,
                active && { shadowColor: highContrast ? '#FFFFFF' : theme.primary },
              ]}
            >
              {p.tomorrow ? (
                <View style={[styles.tomorrowBadgeInline, {
                  backgroundColor: active
                    ? (highContrast ? '#000000' : 'rgba(255,255,255,0.25)')
                    : (highContrast ? '#121212' : `${theme.primary}20`),
                  borderWidth: highContrast ? 1 : 0,
                  borderColor: '#FFFF00',
                }]}>
                  <Text style={{
                    fontSize: 8.5 * fontScale,
                    fontWeight: '900',
                    color: active ? (highContrast ? '#FFFF00' : '#FFF') : theme.primary,
                    letterSpacing: 0.5,
                  }}>
                    YARIN
                  </Text>
                </View>
              ) : null}
              <View style={[styles.prayerCardIcon, {
                backgroundColor: iconBg,
                borderWidth: highContrast ? 1 : 0,
                borderColor: theme.border,
                borderRadius: 10,
              }]}>
                <MaterialCommunityIcons name={p.icon} size={16} color={iconColor} />
              </View>
              <Text
                style={[styles.prayerCardName, {
                  color: nameColor, fontSize: 10.5 * fontScale,
                  fontWeight: highContrast ? '900' : '800',
                }]}
                numberOfLines={1}
              >
                {p.name}
              </Text>
              <Text style={[styles.prayerCardTime, {
                color: timeColor, fontSize: 14 * fontScale,
                fontWeight: '900',
              }]}>
                {p.time}
              </Text>
              {isPassed && !active ? (
                <View style={[styles.prayerCardCheck, { backgroundColor: theme.primary }]}>
                  <Ionicons name="checkmark" size={8} color={highContrast ? '#000000' : '#FFF'} />
                </View>
              ) : null}
              {active ? <View style={[styles.prayerCardActiveDot, {
                backgroundColor: highContrast ? '#000000' : 'rgba(255,255,255,0.9)',
              }]} /> : null}
            </View>
          </AnimatedPrayerCard>
        );
      })}
    </ScrollView>
  );
});

const CompactTimeline = memo(function CompactTimeline({ prayers, now, theme, fontScale, highContrast }) {
  const data = useMemo(() => {
    const items = prayers
      .filter((p) => !p.isSunrise)
      .map((p) => ({ ...p, date: toDate(p.time, now) }))
      .filter((p) => p.date)
      .sort((a, b) => a.date - b.date);
    const passedCount = items.filter((p) => p.date <= now).length;
    const nextItem = items[passedCount] || null;
    const remainingMs = nextItem ? nextItem.date.getTime() - now.getTime() : 0;
    const ratio = items.length > 0 ? passedCount / items.length : 0;
    return { passedCount, total: items.length, nextItem, remainingMs, ratio };
  }, [prayers, now]);

  if (data.total === 0) return null;

  return (
    <View style={[styles.compactTimeline, {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: highContrast ? 2 : 1,
      borderRadius: RADIUS.lg,
    }]}>
      <View style={styles.compactTimelineRow}>
        <View style={[styles.compactTimelineIcon, {
          backgroundColor: highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`),
          borderWidth: highContrast ? 2 : 1,
          borderColor: highContrast ? '#FFFFFF' : `${theme.primary}33`,
          borderRadius: RADIUS.md,
        }]}>
          <MaterialCommunityIcons name="timelapse" size={20} color={theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.compactTimelineLabel, {
            color: theme.textDim, fontSize: 10 * fontScale,
            fontWeight: highContrast ? '900' : '800',
          }]}>
            BUGÜNKÜ İLERLEME
          </Text>
          <Text style={[styles.compactTimelineValue, {
            color: theme.text, fontSize: 15 * fontScale,
            fontWeight: '900',
          }]}>
            {data.passedCount} / {data.total} vakit
            {data.nextItem
              ? ` · ${formatMinutesShort(data.remainingMs / 60000)} kaldı`
              : ' · Tamamlandı'}
          </Text>
        </View>
        <Text style={[styles.compactTimelineNext, {
          color: theme.primary, fontSize: 13 * fontScale,
          fontWeight: '900',
        }]}>
          {data.nextItem ? data.nextItem.name.toUpperCase('tr-TR') : '✓'}
        </Text>
      </View>
      <View style={[styles.compactTimelineBar, { backgroundColor: theme.border }]}>
        <View style={[styles.compactTimelineBarFill, {
          width: `${data.ratio * 100}%`, backgroundColor: theme.primary,
        }]} />
      </View>
    </View>
  );
});

const NotificationsCard = memo(function NotificationsCard({
  enabled, reminderMinutes, onOpenSettings, theme, fontScale, highContrast,
}) {
  const label = enabled
    ? (reminderMinutes === 0 ? 'Vakit girdiğinde hatırlat' : `Vakitten ${reminderMinutes} dk önce hatırlat`)
    : 'Bildirimler kapalı';
  return (
    <PressableScale
      onPress={onOpenSettings}
      accessibilityLabel={`Hatırlatmalar. ${label}. Ayarlara gitmek için dokun.`}
      style={[styles.notifCard, {
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: highContrast ? 2 : 1,
      }]}
    >
      <View style={[styles.notifCardIcon, {
        backgroundColor: highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`),
        borderWidth: highContrast ? 2 : 1,
        borderColor: highContrast ? '#FFFFFF' : `${theme.primary}33`,
      }]}>
        <Ionicons
          name={enabled ? 'notifications' : 'notifications-off'}
          size={20}
          color={enabled ? theme.primary : theme.textMuted}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{
          color: theme.textDim, fontSize: 10 * fontScale,
          fontWeight: highContrast ? '900' : '800', letterSpacing: 0.6,
        }}>
          HATIRLATMALAR
        </Text>
        <Text
          style={{
            color: theme.text, fontSize: 14 * fontScale,
            fontWeight: '900', marginTop: 3,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={theme.textDim} />
    </PressableScale>
  );
});

const QuickAction = memo(function QuickAction({ icon, label, onPress, theme, fontScale, highContrast }) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      containerStyle={{ flex: 1 }}
      style={[styles.quickAction, {
        backgroundColor: theme.surface,
        borderColor: theme.border,
        borderWidth: highContrast ? 2 : 1,
        borderRadius: RADIUS.lg,
        shadowColor: highContrast ? '#FFFFFF' : theme.text,
      }]}
    >
      <View style={[styles.quickActionIcon, {
        backgroundColor: highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`),
        borderWidth: highContrast ? 2 : 1,
        borderColor: highContrast ? '#FFFFFF' : `${theme.primary}33`,
        borderRadius: RADIUS.md,
      }]}>
        <Ionicons name={icon} size={22} color={theme.primary} />
      </View>
      <Text
        numberOfLines={1}
        style={[styles.quickActionLabel, {
          color: theme.text, fontSize: 12 * fontScale,
          fontWeight: highContrast ? '900' : '800',
        }]}
      >
        {label}
      </Text>
    </PressableScale>
  );
});

const QuickActions = memo(function QuickActions({ props, theme, fontScale, highContrast }) {
  const available = QUICK_ACTIONS.filter((a) => typeof props[a.prop] === 'function');
  if (available.length === 0) return null;

  return (
    <View style={styles.quickActionsRow}>
      {available.map((action) => (
        <QuickAction
          key={action.key}
          icon={action.icon}
          label={action.label}
          onPress={props[action.prop]}
          theme={theme}
          fontScale={fontScale}
          highContrast={highContrast}
        />
      ))}
    </View>
  );
});

const NameRow = memo(function NameRow({ item, gender, theme, fontScale, highContrast }) {
  const isFemale = gender === 'female';
  const accentColor = theme.primary;
  const accentBg = highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`);
  const iconName = isFemale ? 'female' : 'male';
  const label = isFemale ? 'KIZ İSMİ' : 'ERKEK İSMİ';
  const placeholder = isFemale ? 'Kız ismi' : 'Erkek ismi';

  return (
    <View style={styles.nameRow}>
      <View style={[styles.nameArabicBox, {
        backgroundColor: accentBg,
        borderColor: highContrast ? '#FFFFFF' : `${theme.primary}33`,
        borderWidth: highContrast ? 2 : 1,
      }]}>
        {item?.arabic ? (
          <Text
            style={[styles.nameArabicText, {
              color: accentColor, fontSize: 24 * fontScale,
              fontWeight: highContrast ? '900' : '800',
            }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.55}
          >
            {item.arabic}
          </Text>
        ) : (
          <MaterialCommunityIcons name="star-crescent" size={26} color={accentColor} />
        )}
      </View>

      <View style={styles.nameInfo}>
        <View style={styles.nameMetaRow}>
          <View style={[styles.genderChip, {
            backgroundColor: accentBg,
            borderWidth: highContrast ? 1 : 0,
            borderColor: theme.border,
          }]}>
            <Ionicons name={iconName} size={10} color={accentColor} />
            <Text style={[styles.genderChipText, {
              color: accentColor, fontSize: 9 * fontScale,
              fontWeight: '900',
            }]}>
              {label}
            </Text>
          </View>
          {item?.origin ? (
            <Text
              style={[styles.nameOrigin, {
                color: theme.textMuted, fontSize: 10.5 * fontScale,
                fontWeight: highContrast ? '700' : '700',
              }]}
              numberOfLines={1}
            >
              · {item.origin}
            </Text>
          ) : null}
        </View>

        <Text
          style={[styles.nameTitle, {
            color: theme.text, fontSize: 18 * fontScale,
            fontWeight: '900',
          }]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {item?.name || placeholder}
        </Text>

        <Text
          style={[styles.nameMeaning, {
            color: theme.textDim, fontSize: 12.5 * fontScale,
            lineHeight: 18 * fontScale,
            fontWeight: highContrast ? '700' : '500',
          }]}
          numberOfLines={3}
        >
          {item?.meaning || 'İsim bilgisi bulunamadı.'}
        </Text>
      </View>
    </View>
  );
});

const DailyNamesCard = memo(function DailyNamesCard({ female, male, theme, fontScale, highContrast }) {
  return (
    <View style={[styles.namesCard, {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: highContrast ? 2 : 1,
      borderRadius: RADIUS.xl,
    }]}>
      <NameRow item={female} gender="female" theme={theme} fontScale={fontScale} highContrast={highContrast} />
      <View style={[styles.namesDivider, {
        backgroundColor: theme.border,
        height: highContrast ? 2 : StyleSheet.hairlineWidth,
      }]} />
      <NameRow item={male} gender="male" theme={theme} fontScale={fontScale} highContrast={highContrast} />
    </View>
  );
});

const HeaderIconButton = memo(function HeaderIconButton({
  icon, badge, badgeColor, onPress, theme, accessibilityLabel, active, highContrast,
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      style={[styles.roundButtonSmall, {
        backgroundColor: active ? (highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`)) : theme.surface,
        borderColor: active ? theme.primary : theme.border,
        borderWidth: highContrast ? 2 : 1,
      }]}
    >
      <Ionicons name={icon} size={20} color={active ? theme.primary : theme.textDim} />
      {badge ? (
        <View style={[
          styles.notifBadge,
          { backgroundColor: badgeColor || theme.primary, borderColor: theme.background },
        ]} />
      ) : null}
    </PressableScale>
  );
});

const BottomBarTab = memo(function BottomBarTab({
  active, icon, activeIcon, label, onPress, theme, fontScale, highContrast, disabled,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => Animated.spring(scale, {
    toValue: 0.92, useNativeDriver: USE_NATIVE, speed: 50, bounciness: 4,
  }).start();
  const pressOut = () => Animated.spring(scale, {
    toValue: 1, useNativeDriver: USE_NATIVE, speed: 50, bounciness: 4,
  }).start();

  const content = (
    <>
      <View style={[styles.activeTabIcon, {
        backgroundColor: active
          ? (highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`))
          : 'transparent',
        borderWidth: highContrast && active ? 2 : 0,
        borderColor: theme.border,
        width: Math.round(48 * fontScale),
        height: Math.round(34 * fontScale),
        borderRadius: RADIUS.md,
      }]}>
        <Ionicons
          name={active ? activeIcon : icon}
          size={Math.round(22 * fontScale)}
          color={active ? theme.primary : theme.textDim}
        />
      </View>
      <Text style={[styles.bottomBarText, {
        color: active ? theme.primary : theme.textDim,
        fontSize: Math.round(11 * fontScale),
        fontWeight: active ? '900' : '700',
      }]}>
        {label}
      </Text>
    </>
  );

  if (active) {
    return (
      <View
        style={styles.bottomBarButton}
        accessibilityRole="tab"
        accessibilityState={{ selected: true }}
        accessibilityLabel={label}
      >
        {content}
      </View>
    );
  }

  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      containerStyle={{ flex: 1 }}
      style={styles.bottomBarButton}
    >
      <Animated.View
        onTouchStart={pressIn}
        onTouchEnd={pressOut}
        style={{ transform: [{ scale }], alignItems: 'center', gap: 6 }}
      >
        {content}
      </Animated.View>
    </PressableScale>
  );
});

const BottomBar = memo(function BottomBar({
  theme, fontScale, onPressHome, onOpenTools, onOpenSettings, activeTab = 'home', highContrast,
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomBar, {
      backgroundColor: theme.surfaceElevated || theme.surface,
      borderTopColor: theme.border,
      borderTopWidth: highContrast ? 2 : StyleSheet.hairlineWidth,
      paddingBottom: Math.max(8, insets.bottom),
      shadowColor: highContrast ? '#FFFFFF' : theme.text,
    }]}>
      <View style={styles.bottomBarInner} accessibilityRole="tablist">
        <BottomBarTab
          active={activeTab === 'home'}
          icon="home-outline"
          activeIcon="home"
          label="Ana Sayfa"
          onPress={onPressHome}
          theme={theme}
          fontScale={fontScale}
          highContrast={highContrast}
        />
        <BottomBarTab
          active={activeTab === 'tools'}
          icon="grid-outline"
          activeIcon="grid"
          label="Araçlar"
          onPress={onOpenTools}
          theme={theme}
          fontScale={fontScale}
          highContrast={highContrast}
          disabled={!onOpenTools}
        />
        <BottomBarTab
          active={activeTab === 'settings'}
          icon="settings-outline"
          activeIcon="settings"
          label="Ayarlar"
          onPress={onOpenSettings}
          theme={theme}
          fontScale={fontScale}
          highContrast={highContrast}
          disabled={!onOpenSettings}
        />
      </View>
    </View>
  );
});

const ActionSheet = memo(function ActionSheet({
  visible, title, message, actions, onClose, theme, highContrast, fontScale, centered,
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={[styles.sheetRoot, { justifyContent: centered ? 'center' : 'flex-end' }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Kapat"
        />
        <View
          accessibilityViewIsModal
          style={[styles.sheet, {
            backgroundColor: theme.surfaceElevated || theme.surface,
            borderColor: theme.border,
            borderWidth: highContrast ? 2 : 1,
            paddingBottom: centered ? 16 : Math.max(16, insets.bottom + 8),
            borderBottomLeftRadius: centered ? RADIUS.xxl : 0,
            borderBottomRightRadius: centered ? RADIUS.xxl : 0,
          }]}
        >
          <Text accessibilityRole="header" style={[styles.sheetTitle, { color: theme.text, fontSize: 17 * fontScale }]}>
            {title}
          </Text>
          {message ? (
            <Text style={[styles.sheetMessage, { color: theme.textDim, fontSize: 13.5 * fontScale }]}>
              {message}
            </Text>
          ) : null}
          <View style={styles.sheetActions}>
            {(actions || []).map((a) => (
              <TouchableOpacity
                key={a.label}
                onPress={() => { onClose(); a.onPress?.(); }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={a.label}
                style={[styles.sheetBtn, {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: highContrast ? 2 : 1,
                }]}
              >
                <Ionicons name={a.icon} size={20} color={theme.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 * fontScale }}>{a.label}</Text>
                  {a.desc ? (
                    <Text style={{ color: theme.textDim, fontSize: 11.5 * fontScale, marginTop: 2 }}>{a.desc}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Vazgeç"
              style={[styles.sheetBtn, styles.sheetCancel]}
            >
              <Text style={{ color: theme.textDim, fontWeight: '800', fontSize: 15 * fontScale }}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   ANA EKRAN BİLEŞENİ (HomeScreen)
   ================================================================ */
export default function HomeScreen({
  hasShownIntro: hasShownIntroProp,
  onOpenQibla, onOpenSettings, onOpenTools, onOpenZikir, onOpenDua,
  onOpenCalendar, onOpenNotificationSettings, onOpenHome, onOpenLocation,
  active = true,
}) {
  const getTheme = useAppStore((s) => s.getTheme);
  const themeModeSel = useAppStore((s) => s.themeMode);
  const accentSel = useAppStore((s) => s.accentColor);

  const storeHasShownIntro = useAppStore((s) => s.hasShownIntro);
  const markIntroShown = useAppStore((s) => s.markIntroShown);
  const storeLocation = useAppStore((s) => s.selectedLocation);
  const isSimpleMode = useAppStore((s) => s.isSimpleMode);
  const storedWidgetsConfig = useAppStore((s) => s.widgetsConfig);
  const prayerMethod = useAppStore((s) => s.prayerMethod) ?? 13;
  const tuneMinutes = useAppStore((s) => s.tuneMinutes) ?? 0;
  const mealEdition = useAppStore((s) => s.mealEdition) ?? 'tr.diyanet';
  const showArabic = useAppStore((s) => s.showArabic) ?? true;
  const setReadingFontScale = useAppStore((s) => s.setReadingFontScale);
  const highContrast = useAppStore((s) => s.highContrast);

  const homePrefs = useHomePrefs();
  const readingFontScale = useReadingFontScale();
  useGlobalHaptic();
  const readingMode = useReadingMode();

  const hasShownIntro = hasShownIntroProp ?? storeHasShownIntro;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingSubtitle, setLoadingSubtitle] = useState('Hazırlanıyor…');
  const [error, setError] = useState(null);
  const [prayerData, setPrayerData] = useState(null);
  const [islamicNames, setIslamicNames] = useState([]);
  const [hijriData, setHijriData] = useState(null);
  const [vakitContent, setVakitContent] = useState(null);
  const [notice, setNotice] = useState('');
  const [dataSource, setDataSource] = useState(null);
  const [isTransitionReady, setIsTransitionReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [heroHeight, setHeroHeight] = useState(260);

  const mounted = useRef(false);
  const requestId = useRef(0);
  const lastWidgetPrayerId = useRef(null);
  const scrollRef = useRef(null);
  const showStickyRef = useRef(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const stickyAnim = useRef(new Animated.Value(0)).current;

  const now = useCurrentTime(active);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const location = useMemo(() => storeLocation || {
    latitude: 41.0082, longitude: 28.9784, city: 'İstanbul', district: 'İstanbul',
  }, [storeLocation]);

  const widgetsConfig = storedWidgetsConfig || DEFAULT_WIDGETS_CONFIG;
  const rawTheme = useMemo(() => getTheme(), [getTheme, themeModeSel, accentSel]);

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

  const compact = width < 360;
  const isMedium = width >= 600;
  const isWide = width >= 960;
  const pageMaxWidth = isWide ? 1080 : isMedium ? 680 : undefined;
  const fontScale = readingFontScale || 1;

  const fontIdx = useMemo(() => {
    const idx = FONT_SCALES.findIndex((v) => Math.abs(v - fontScale) < 0.01);
    return idx >= 0 ? idx : 0;
  }, [fontScale]);

  const cycleFontScale = useCallback(() => {
    hapticImpact('medium');
    const nextIdx = (fontIdx + 1) % FONT_SCALES.length;
    setReadingFontScale(FONT_SCALES[nextIdx]);
  }, [fontIdx, setReadingFontScale]);

  const contentShowArabic = useMemo(() => {
    if (!showArabic) return false;
    return ['full', 'arabic-only', 'arabic-latin'].includes(readingMode);
  }, [showArabic, readingMode]);

  const daySeed = useMemo(
    () => Math.floor(now.getTime() / (24 * 60 * 60 * 1000)),
    [now],
  );

  const [
    group1Anim, group2Anim, group3Anim, group4Anim,
  ] = useStaggeredEntrance(4, { delay: 0, duration: 260, stagger: 40, start: isTransitionReady });

  useEffect(() => {
    mounted.current = true;
    const timer = setTimeout(() => {
      if (mounted.current) setIsTransitionReady(true);
    }, 0);
    return () => {
      mounted.current = false;
      requestId.current += 1;
      clearTimeout(timer);
    };
  }, []);

  const handleScroll = useCallback((e) => {
    const y = e.nativeEvent.contentOffset.y;
    const threshold = Math.max(180, heroHeight - 40);
    const shouldShow = y > threshold;
    if (shouldShow !== showStickyRef.current) {
      showStickyRef.current = shouldShow;
      setStickyVisible(shouldShow);
      Animated.timing(stickyAnim, {
        toValue: shouldShow ? 1 : 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE,
      }).start();
    }
  }, [stickyAnim, heroHeight]);

  const handleHeroLayout = useCallback((e) => {
    const { height } = e.nativeEvent.layout;
    if (height > 0) setHeroHeight(height);
  }, []);

  const scrollToTop = useCallback(() => {
    hapticImpact('light');
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  const scheduleNotifications = useCallback(async (data, isManual = false) => {
    if (!data?.times) return 0;
    if (!isNotificationsAvailable()) return 0;
    if (!widgetsConfig.notificationsEnabled && !isManual) return 0;

    try {
      const payload = buildNotificationPayload(data.times, data.tomorrowImsak);
      if (payload.length === 0) return 0;
      return await schedulePrayerNotifications(payload, {
        reminderBeforeMinutes: widgetsConfig.reminderBeforeMinutes ?? 15,
      });
    } catch {
      return 0;
    }
  }, [widgetsConfig.notificationsEnabled, widgetsConfig.reminderBeforeMinutes]);

  const preloadParams = useMemo(() => ({
    latitude: location.latitude, longitude: location.longitude,
    location: { city: location.city, district: location.district },
    method: prayerMethod, tuneMinutes, mealEdition,
  }), [location.latitude, location.longitude, location.city, location.district, prayerMethod, tuneMinutes, mealEdition]);

  const applyPreloadResult = useCallback(async (result) => {
    if (!result || !mounted.current) return;
    if (result.prayerData) {
      setPrayerData(result.prayerData);
      setDataSource(result.source ?? result.prayerData.source ?? null);

      let isActuallyOffline = false;
      if (RNCNetInfo && typeof RNCNetInfo.fetch === 'function') {
        try {
          const netState = await RNCNetInfo.fetch();
          isActuallyOffline = netState?.isConnected === false || netState?.isInternetReachable === false;
        } catch {}
      }

      if (result.prayerData.source === 'cache' && isActuallyOffline) {
        setNotice('Çevrimdışısınız. Kayıtlı vakitler gösteriliyor.');
      } else {
        setNotice(result.prayerData.warning || '');
      }

      scheduleNotifications(result.prayerData).catch(() => {});
    }
    if (Array.isArray(result.islamicNames)) setIslamicNames(result.islamicNames);
    if (result.hijriData) setHijriData(result.hijriData);
    if (result.vakitContent) setVakitContent(result.vakitContent);
    if (result.errors?.length && !result.prayerData) {
      setError(result.errors[0] || 'Namaz vakitleri yüklenemedi.');
    } else {
      setError(null);
    }
  }, [scheduleNotifications]);

  const introRef = useRef({ shown: hasShownIntro, mark: markIntroShown });
  introRef.current = { shown: hasShownIntro, mark: markIntroShown };
  const hasDataRef = useRef(false);
  hasDataRef.current = Boolean(prayerData);

  const loadDayRef = useRef(getLocalDateString());
  const [reloadTick, setReloadTick] = useState(0);
  const dayKey = getLocalDateString(now);

  useEffect(() => {
    if (active && loadDayRef.current !== dayKey) {
      loadDayRef.current = dayKey;
      setReloadTick((t) => t + 1);
      setNotice('Yeni gün başladı, vakitler güncelleniyor.');
      setTimeout(() => { if (mounted.current) setNotice(''); }, 3500);
    }
  }, [dayKey, active]);

  useEffect(() => {
    let cancelled = false;
    const currentRequest = ++requestId.current;
    const isCurrent = () => !cancelled && mounted.current && currentRequest === requestId.current;

    const applyPartial = (partial) => {
      if (!isCurrent() || !partial) return;
      if (partial.prayerData) {
        setPrayerData(partial.prayerData);
        setDataSource(partial.source ?? 'cache');
        setLoading(false);
        setLoadingSubtitle('İçerikler hazırlanıyor…');
      }
      if (Array.isArray(partial.islamicNames) && partial.islamicNames.length > 0) {
        setIslamicNames(partial.islamicNames);
      }
      if (partial.hijriData) setHijriData(partial.hijriData);
      if (partial.vakitContent) setVakitContent(partial.vakitContent);
    };

    (async () => {
      if (!hasDataRef.current) {
        setLoadingSubtitle(
          preloadParams.location?.city
            ? 'Vakitler alınıyor…'
            : 'Konum hazırlanıyor…'
        );
      }
      try {
        const result = await preloadHomeData({
          ...preloadParams,
          force: reloadTick > 0,
          onPartial: applyPartial,
        });
        if (!isCurrent()) return;
        applyPartial(result);
        if (result?.prayerData) setError(null);
        else if (result?.errors?.length && !hasDataRef.current) setError(result.errors[0]);
      } catch (e) {
        if (isCurrent() && !hasDataRef.current) setError('Vakitler güncellenemedi.');
      } finally {
        if (isCurrent()) {
          loadDayRef.current = getLocalDateString();
          setLoading(false);
          if (!introRef.current.shown) introRef.current.mark?.();
        }
      }
    })();

    return () => { cancelled = true; };
  }, [preloadParams, reloadTick]);

  const handleRefresh = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setRefreshing(true);
    setError(null);
    hapticImpact();
    try {
      const result = await preloadHomeData({ ...preloadParams, force: true });
      if (!mounted.current || currentRequest !== requestId.current) return;
      applyPreloadResult(result);
    } catch (e) {
      if (mounted.current && currentRequest === requestId.current) {
        setError(e?.message || 'Veriler yenilenemedi.');
      }
    } finally {
      if (mounted.current && currentRequest === requestId.current) setRefreshing(false);
    }
  }, [preloadParams, applyPreloadResult]);

  const prayers = useMemo(() => {
    if (!prayerData?.times) return [];
    return PRAYER_CONFIG
      .map((cfg) => ({ ...cfg, time: prayerData.times[cfg.id] }))
      .filter((p) => Boolean(p.time));
  }, [prayerData]);

  const nextPrayer = useMemo(
    () => getNextPrayer(prayers, now, prayerData?.tomorrowImsak),
    [prayers, now, prayerData?.tomorrowImsak],
  );

  const previousPrayerDate = useMemo(
    () => (nextPrayer ? getPreviousPrayerDate(prayers, now) : null),
    [prayers, now, nextPrayer],
  );

  const kerahatInfo = useMemo(
    () => (widgetsConfig.showKerahatWarning ? getKerahatInfo(prayers, now) : null),
    [prayers, now, widgetsConfig.showKerahatWarning],
  );

  const activePrayerId = useMemo(() => getActiveVakitSlot(now), [now]);
  const vakitSeed = useMemo(() => Math.floor(now.getTime() / (60 * 60 * 1000)), [now]);

  useEffect(() => {
    const currentNextId = nextPrayer?.id ?? null;
    if (lastWidgetPrayerId.current !== null && lastWidgetPrayerId.current !== currentNextId) {
      if (typeof WidgetUpdate?.requestWidgetUpdate === 'function') {
        WidgetUpdate.requestWidgetUpdate({
          widgetName: 'NidaWidget',
          renderWidget: () => null,
        }).catch(() => {});
      }
    }
    lastWidgetPrayerId.current = currentNextId;
  }, [nextPrayer?.id]);

  const hijri = hijriData?.formatted || prayerData?.hijri || '';
  const sourceLabel = getSourceLabel(prayerData?.source === 'cache' ? 'cache' : dataSource);
  const formattedDate = useMemo(() => dateLabel(now), [now]);
  const dailyFemale = useMemo(() => islamicNames.find((i) => i.gender === 'Kız') || null, [islamicNames]);
  const dailyMale = useMemo(() => islamicNames.find((i) => i.gender === 'Erkek') || null, [islamicNames]);

  const handleNotificationPress = useCallback(() => {
    hapticImpact();
    if (onOpenNotificationSettings) return onOpenNotificationSettings();
    if (onOpenSettings) return onOpenSettings();
    scheduleNotifications(prayerData, true);
  }, [onOpenNotificationSettings, onOpenSettings, scheduleNotifications, prayerData]);

  const flashNotice = useCallback((text) => {
    setNotice(text);
    setTimeout(() => { if (mounted.current) setNotice(''); }, 3200);
  }, []);

  const handleShare = useCallback(async () => {
    if (!prayers.length) return;
    hapticImpact('medium');
    const lines = [
      `🕌 ${location.district} — ${dateLabel(now)}`,
      '',
      ...prayers.map((p) => `${p.name.padEnd(8, ' ')}   ${p.time}`),
    ];
    if (hijri) lines.push('', `📅 ${hijri}`);
    lines.push('', '— Hilal ile paylaşıldı');
    const result = await shareText(lines.join('\n'));
    if (result === 'copied') flashNotice('Vakit bilgileri panoya kopyalandı.');
  }, [prayers, location, now, hijri, flashNotice]);

  const handleCopy = useCallback(async () => {
    if (!prayers.length) return;
    hapticImpact('medium');
    const text = prayers.map((p) => `${p.name}: ${p.time}`).join('\n');
    const ok = await copyText(text);
    if (ok) flashNotice('Vakit bilgileri panoya kopyalandı.');
    else await handleShare();
  }, [prayers, handleShare, flashNotice]);

  const handleHeroLongPress = useCallback(() => {
    if (!prayers.length) return;
    setSheetOpen(true);
  }, [prayers.length]);

  const closeSheet = useCallback(() => setSheetOpen(false), []);
  const sheetActions = useMemo(() => ([
    { label: 'Paylaş', icon: 'share-outline', onPress: handleShare },
    { label: 'Kopyala', icon: 'copy-outline', onPress: handleCopy },
  ]), [handleShare, handleCopy]);

  const handleLocationPress = useCallback(() => {
    hapticImpact('light');
    if (onOpenLocation) onOpenLocation();
    else if (onOpenSettings) onOpenSettings();
  }, [onOpenLocation, onOpenSettings]);

  const bottomBarPadding = 90 + insets.bottom;
  const greeting = getGreeting(now);
  const notificationsOn = widgetsConfig.notificationsEnabled;

  // ✅ Basit modda da vaktin ayet, dua ve esma içerikleri açık kalır
  const showContentSection =
    homePrefs.showManeviContent !== false && (
      (widgetsConfig.showVerseCard ?? true) ||
      (widgetsConfig.showDuaCard ?? true) ||
      (widgetsConfig.showEsmaCard ?? true) ||
      homePrefs.showDailyVerse
    );

  const renderManeviSection = () => {
    if (!showContentSection) return null;
    return (
      <Section
        title={getVakitBaslik(activePrayerId)}
        subtitle={contentShowArabic ? 'Arapça + Türkçe' : 'Türkçe'}
        theme={theme}
        fontScale={fontScale}
        icon="hands-pray"
        highContrast={highContrast}
      >
        {homePrefs.showDailyVerse ? (
          <VakitContentCard
            kind="ayet"
            prayerId={activePrayerId}
            seed={daySeed}
            theme={theme}
            fontScale={fontScale}
            mealEdition={mealEdition}
            showArabic={contentShowArabic}
            readingMode={readingMode}
            initialData={null}
          />
        ) : null}

        {widgetsConfig.showVerseCard !== false ? (
          <VakitContentCard
            kind="ayet"
            prayerId={activePrayerId}
            seed={vakitSeed}
            theme={theme}
            fontScale={fontScale}
            mealEdition={mealEdition}
            showArabic={contentShowArabic}
            readingMode={readingMode}
            initialData={vakitContent?.ayet ?? null}
          />
        ) : null}

        {widgetsConfig.showDuaCard !== false ? (
          <VakitContentCard
            kind="dua"
            prayerId={activePrayerId}
            seed={vakitSeed}
            theme={theme}
            fontScale={fontScale}
            mealEdition={mealEdition}
            showArabic={contentShowArabic}
            readingMode={readingMode}
            initialData={vakitContent?.dua ?? null}
          />
        ) : null}

        {widgetsConfig.showEsmaCard !== false ? (
          <VakitContentCard
            kind="esma"
            prayerId={activePrayerId}
            seed={vakitSeed}
            theme={theme}
            fontScale={fontScale}
            mealEdition={mealEdition}
            showArabic={contentShowArabic}
            readingMode={readingMode}
            initialData={vakitContent?.esma ?? null}
          />
        ) : null}
      </Section>
    );
  };

  if (!isTransitionReady || (loading && !prayerData)) {
    return <LoadingScreen theme={theme} subtitle={loadingSubtitle} highContrast={highContrast} />;
  }

  return (
    <ActiveContext.Provider value={active}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top', 'left', 'right']}
      >
        {active ? (
          <StatusBar barStyle={highContrast || theme.mode === 'dark' || theme.mode === 'oled' ? 'light-content' : 'dark-content'} />
        ) : null}

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: 8 },
            { paddingBottom: bottomBarPadding },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={isSimpleMode ? undefined : handleScroll}
          scrollEventThrottle={32}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
              progressBackgroundColor={theme.surface}
            />
          }
        >
          {/* ================================================================
              BASİT MOD GÖRÜNÜMÜ (Sade Tasarım + Tüm İçerikler Korunur)
              ================================================================ */}
          {isSimpleMode ? (
            <View style={[styles.page, pageMaxWidth ? { maxWidth: pageMaxWidth } : null]}>
              <View style={styles.header}>
                <View style={styles.headerText}>
                  <TouchableOpacity
                    onPress={handleLocationPress}
                    activeOpacity={0.7}
                    style={styles.locationRow}
                    accessibilityRole="button"
                    accessibilityLabel={`Konum: ${location.district}. Değiştirmek için dokun.`}
                  >
                    <Ionicons name="location-sharp" size={20} color={theme.primary} style={{ marginRight: 6 }} />
                    <Text
                      accessibilityRole="header"
                      style={[styles.brand, { color: theme.text, fontSize: 26 * fontScale, fontWeight: '900' }]}
                      numberOfLines={1}
                    >
                      {location.district}
                    </Text>
                    <Ionicons name="chevron-down" size={16} color={theme.textDim} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                  {hijri ? (
                    <Text
                      style={[styles.hijriSubtitle, { color: theme.textDim, fontSize: 12.5 * fontScale }]}
                      numberOfLines={1}
                    >
                      {hijri}
                    </Text>
                  ) : null}
                </View>

                <PressableScale
                  onPress={cycleFontScale}
                  accessibilityLabel={`Yazı boyutu: ${FONT_NAMES[fontIdx]}. Değiştirmek için dokun.`}
                  style={[styles.roundButtonSmall, {
                    width: 48,
                    height: 48,
                    backgroundColor: fontIdx > 0 ? `${theme.primary}18` : theme.surface,
                    borderColor: fontIdx > 0 ? theme.primary : theme.border,
                    borderWidth: highContrast ? 2 : 1,
                  }]}
                >
                  <Text style={{
                    color: fontIdx > 0 ? theme.primary : theme.text,
                    fontWeight: '900',
                    fontSize: 12 + fontIdx * 1.5,
                  }}>
                    {FONT_LABELS[fontIdx]}
                  </Text>
                </PressableScale>
              </View>

              <InfoAlert
                error={error}
                kerahatInfo={kerahatInfo}
                notice={notice}
                onDismissNotice={() => setNotice('')}
                onRetry={handleRefresh}
                theme={theme}
                fontScale={fontScale}
                highContrast={highContrast}
              />

              {/* Sadeleştirilmiş Sıradaki Vakit Kartı */}
              <SimpleHero
                theme={theme}
                fontScale={fontScale}
                formattedDate={formattedDate}
                nextPrayer={nextPrayer}
                now={now}
                refreshing={refreshing}
                onRefresh={handleRefresh}
                onShare={handleShare}
                onLongPress={handleHeroLongPress}
                highContrast={highContrast}
              />

              {/* Alt Alta Tek Bakışta Vakit Listesi */}
              <SimplePrayerList
                prayers={prayers}
                tomorrowImsak={prayerData?.tomorrowImsak}
                now={now}
                nextPrayer={nextPrayer}
                theme={theme}
                fontScale={fontScale}
                highContrast={highContrast}
              />

              {/* Hızlı Erişimler */}
              <Section
                title="Hızlı Erişim"
                theme={theme}
                fontScale={fontScale}
                highContrast={highContrast}
              >
                <QuickActions
                  props={{ onOpenQibla, onOpenZikir, onOpenDua, onOpenCalendar }}
                  theme={theme}
                  fontScale={fontScale}
                  highContrast={highContrast}
                />
              </Section>

              {/* Günün İsimleri */}
              {islamicNames.length > 0 && homePrefs.showDailyNames !== false ? (
                <Section
                  title="Günün İsimleri"
                  subtitle="Günlük seçki"
                  theme={theme}
                  fontScale={fontScale}
                  icon="book-open-variant"
                  highContrast={highContrast}
                >
                  <DailyNamesCard
                    female={dailyFemale}
                    male={dailyMale}
                    theme={theme}
                    fontScale={fontScale}
                    highContrast={highContrast}
                  />
                </Section>
              ) : null}

              {/* Vaktin Ayet, Dua ve Esma İçerikleri */}
              {renderManeviSection()}
            </View>
          ) : (
            /* ================================================================
               STANDART MOD GÖRÜNÜMÜ
               ================================================================ */
            <View style={[
              styles.page,
              pageMaxWidth ? { maxWidth: pageMaxWidth } : null,
              isWide ? styles.pageRow : null,
            ]}>
              {/* HEADER BÖLÜMÜ */}
              <View style={isWide ? styles.colLeft : styles.colFull}>
                <Reveal animStyle={group1Anim}>
                  <View style={styles.header}>
                    <View style={styles.headerText}>
                      <Text
                        style={[styles.greetingText, {
                          color: theme.textDim, fontSize: 13 * fontScale,
                          fontWeight: highContrast ? '700' : '600',
                        }]}
                        numberOfLines={1}
                      >
                        {greeting},
                      </Text>

                      <TouchableOpacity
                        onPress={handleLocationPress}
                        activeOpacity={0.7}
                        style={styles.locationRow}
                        accessibilityRole="button"
                        accessibilityLabel={`Konum: ${location.district}. Değiştirmek için dokun.`}
                      >
                        <Ionicons name="location-sharp" size={17} color={theme.primary} style={{ marginRight: 4 }} />
                        <Text
                          accessibilityRole="header"
                          style={[styles.brand, {
                            color: theme.text, fontSize: 24 * fontScale,
                            fontWeight: '900',
                          }]}
                          numberOfLines={1}
                        >
                          {location.district}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color={theme.textDim} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>

                      {homePrefs.showHijriInHeader !== false && hijri ? (
                        <Text
                          style={[styles.hijriSubtitle, {
                            color: theme.textDim, fontSize: 11.5 * fontScale,
                            fontWeight: highContrast ? '700' : '600',
                          }]}
                          numberOfLines={1}
                        >
                          {hijri}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.headerActions}>
                      <PressableScale
                        onPress={cycleFontScale}
                        accessibilityLabel={`Yazı boyutu: ${FONT_NAMES[fontIdx]}. Değiştirmek için dokun.`}
                        style={[styles.roundButtonSmall, {
                          backgroundColor: fontIdx > 0
                            ? (highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`))
                            : theme.surface,
                          borderColor: fontIdx > 0 ? theme.primary : theme.border,
                          borderWidth: highContrast ? 2 : 1,
                        }]}
                      >
                        <Text style={{
                          color: fontIdx > 0 ? theme.primary : theme.text,
                          fontWeight: '900',
                          fontSize: 11 + fontIdx * 1.5,
                        }}>
                          {FONT_LABELS[fontIdx]}
                        </Text>
                      </PressableScale>

                      <HeaderIconButton
                        icon={notificationsOn ? 'notifications-outline' : 'notifications-off-outline'}
                        badge={notificationsOn}
                        badgeColor={theme.primary}
                        onPress={handleNotificationPress}
                        theme={theme}
                        active={notificationsOn}
                        highContrast={highContrast}
                        accessibilityLabel={`Bildirimler ${notificationsOn ? 'açık' : 'kapalı'}`}
                      />
                    </View>
                  </View>

                  <InfoAlert
                    error={error}
                    kerahatInfo={kerahatInfo}
                    notice={notice}
                    onDismissNotice={() => setNotice('')}
                    onRetry={handleRefresh}
                    theme={theme}
                    fontScale={fontScale}
                    highContrast={highContrast}
                  />
                </Reveal>

                {/* HERO KARTI */}
                <Reveal animStyle={group1Anim}>
                  <View style={{ marginBottom: 16 }}>
                    <Hero
                      theme={theme}
                      compact={compact}
                      fontScale={fontScale}
                      sourceLabel={sourceLabel}
                      formattedDate={formattedDate}
                      hijri={hijri}
                      nextPrayer={nextPrayer}
                      previousPrayerDate={previousPrayerDate}
                      now={now}
                      refreshing={refreshing}
                      showProgress={widgetsConfig.showProgressTrack && nextPrayer?.date && previousPrayerDate}
                      showCountdown={homePrefs.showCountdown !== false}
                      onRefresh={handleRefresh}
                      onShare={handleShare}
                      onLongPress={handleHeroLongPress}
                      onLayout={handleHeroLayout}
                      highContrast={highContrast}
                    />
                  </View>
                </Reveal>

                {/* VAKİT ÇİZGİSİ & İLERLEME & BİLDİRİM KARTI */}
                <Reveal animStyle={group2Anim}>
                  {prayers.length > 0 && homePrefs.showPrayerStrip !== false ? (
                    <View style={{ marginBottom: 14 }}>
                      <PrayerStrip
                        prayers={prayers}
                        tomorrowImsak={prayerData?.tomorrowImsak}
                        now={now}
                        nextPrayer={nextPrayer}
                        theme={theme}
                        fontScale={fontScale}
                        highContrast={highContrast}
                      />
                    </View>
                  ) : null}

                  {homePrefs.showDailyProgress !== false ? (
                    <CompactTimeline
                      prayers={prayers}
                      now={now}
                      theme={theme}
                      fontScale={fontScale}
                      highContrast={highContrast}
                    />
                  ) : null}

                  {homePrefs.showNotificationsCard !== false ? (
                    <NotificationsCard
                      enabled={notificationsOn}
                      reminderMinutes={widgetsConfig.reminderBeforeMinutes ?? 15}
                      onOpenSettings={handleNotificationPress}
                      theme={theme}
                      fontScale={fontScale}
                      highContrast={highContrast}
                    />
                  ) : null}
                </Reveal>
              </View>

              <View style={isWide ? styles.colRight : styles.colFull}>
                {/* HIZLI KISAYOLLAR */}
                <Reveal animStyle={group3Anim}>
                  {homePrefs.showQuickActions !== false ? (
                    <Section
                      title="Keşfet"
                      theme={theme}
                      fontScale={fontScale}
                      icon="compass-rose"
                      highContrast={highContrast}
                    >
                      <QuickActions
                        props={{ onOpenQibla, onOpenZikir, onOpenDua, onOpenCalendar }}
                        theme={theme}
                        fontScale={fontScale}
                        highContrast={highContrast}
                      />
                    </Section>
                  ) : null}
                </Reveal>

                {/* GÜNÜN İSİMLERİ */}
                <Reveal animStyle={group3Anim}>
                  {islamicNames.length > 0 && homePrefs.showDailyNames !== false ? (
                    <Section
                      title="Günün İsimleri"
                      subtitle="Günlük seçki"
                      theme={theme}
                      fontScale={fontScale}
                      icon="book-open-variant"
                      highContrast={highContrast}
                    >
                      <DailyNamesCard
                        female={dailyFemale}
                        male={dailyMale}
                        theme={theme}
                        fontScale={fontScale}
                        highContrast={highContrast}
                      />
                    </Section>
                  ) : null}
                </Reveal>

                {/* MANEVİ İÇERİKLER */}
                <Reveal animStyle={group4Anim}>
                  {renderManeviSection()}
                </Reveal>
              </View>
            </View>
          )}
        </ScrollView>

        <ActionSheet
          visible={sheetOpen}
          title="Vakit Bilgileri"
          message="Ne yapmak istersiniz?"
          actions={sheetActions}
          onClose={closeSheet}
          theme={theme}
          highContrast={highContrast}
          fontScale={fontScale}
          centered={isMedium}
        />

        {!isSimpleMode && prayerData && homePrefs.showStickyHero !== false ? (
          <StickyMiniHero
            anim={stickyAnim}
            nextPrayer={nextPrayer}
            visible={stickyVisible}
            theme={theme}
            fontScale={fontScale}
            onPress={scrollToTop}
            highContrast={highContrast}
            topInset={insets.top}
          />
        ) : null}

        <BottomBar
          theme={theme}
          fontScale={fontScale}
          onPressHome={onOpenHome || scrollToTop}
          onOpenTools={onOpenTools}
          onOpenSettings={onOpenSettings}
          activeTab="home"
          highContrast={highContrast}
        />
      </SafeAreaView>
    </ActiveContext.Provider>
  );
}

/* ================================================================
   STİLLER
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: SPACING.lg + 2, paddingTop: SPACING.sm, alignItems: 'center' },
  page: { width: '100%', alignSelf: 'center' },
  pageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xxl },
  colFull: { width: '100%' },
  colLeft: { flex: 1.05, minWidth: 0 },
  colRight: { flex: 1, minWidth: 0, paddingTop: SPACING.sm },

  loadingBadge: {
    width: 96, height: 96, borderRadius: 48, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  bismillah: {
    fontSize: 24, fontWeight: '600', textAlign: 'center',
    writingDirection: 'rtl', marginTop: 32, lineHeight: 40,
  },
  loadingSubtitle: {
    fontSize: 14, fontWeight: '500', textAlign: 'center',
    marginTop: 12, lineHeight: 22, letterSpacing: 0.3,
  },
  loadingDivider: { width: 44, height: 1, marginVertical: 24 },
  loadingStatus: {
    fontSize: 12, marginTop: 16, letterSpacing: 0.4, fontWeight: '600',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 4,
    paddingTop: 8,
    gap: 10,
  },
  headerText: { flex: 1, minWidth: 0 },
  greetingText: { fontWeight: '600', letterSpacing: 0.2, marginBottom: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  brand: { fontWeight: '900', letterSpacing: 0.2 },
  hijriSubtitle: {
    marginTop: 3, fontWeight: '600',
    letterSpacing: 0.1, lineHeight: 16,
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  roundButtonSmall: {
    width: 42, height: 42, borderRadius: RADIUS.md, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 6, right: 6,
    width: 8, height: 8, borderRadius: 4,
    borderWidth: 1.5,
  },

  alert: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderWidth: 1, borderRadius: RADIUS.lg, marginBottom: 14,
  },
  alertText: { flex: 1 },
  alertError: {
    backgroundColor: 'rgba(239,68,68,0.10)',
    borderColor: 'rgba(239,68,68,0.4)',
  },
  alertAction: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(239,68,68,0.15)',
  },
  kerahatProgressTrack: {
    height: 4, borderRadius: 2, marginTop: 8, overflow: 'hidden',
  },
  kerahatProgressFill: { height: '100%', borderRadius: 2 },

  /* ---------------- BASİT MOD STİLLERİ ---------------- */
  simpleHero: {
    borderRadius: RADIUS.xxl,
    padding: 20,
    marginBottom: 16,
  },
  simpleHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  simpleHeroEyebrow: {
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  simpleHeroDate: {
    fontWeight: '600',
    textTransform: 'capitalize',
    flexShrink: 1,
  },
  simpleHeroMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 14,
    gap: 12,
  },
  simpleHeroName: {
    fontWeight: '900',
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  simpleHeroTime: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  simpleHeroRemainingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
  },
  simpleHeroRemainingText: {
    fontWeight: '800',
  },
  simpleHeroFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  simpleHeroActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  simpleHeroActionText: {
    fontWeight: '800',
  },

  simpleListCard: {
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 20,
  },
  simpleListHeader: {
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  simpleListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    minHeight: 50,
  },
  simpleListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  simpleListName: {
    letterSpacing: 0.1,
  },
  simpleListNextTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  simpleListNextTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  simpleListRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simpleListTime: {
    fontVariant: ['tabular-nums'],
  },

  /* ---------------- STANDART MOD STİLLERİ ---------------- */
  heroShadowContainer: {},
  hero: {
    padding: 20,
    overflow: 'hidden', position: 'relative',
  },
  heroTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 8,
  },
  heroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 5,
    maxWidth: '55%', borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  heroBadgeText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4 },
  heroDateBadge: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'capitalize', flexShrink: 1,
  },
  heroCenter: { alignItems: 'center', marginTop: 18 },
  heroEyebrowRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', marginBottom: 10,
  },
  heroEyebrow: {
    fontWeight: '900', letterSpacing: 1.4, textAlign: 'center',
  },
  approachingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
  },
  approachingDot: { width: 5, height: 5, borderRadius: 2.5 },
  approachingText: {
    fontWeight: '900', letterSpacing: 0.6,
  },
  heroNameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    justifyContent: 'center',
  },
  heroIcon: {
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitle: { fontWeight: '900', letterSpacing: -0.5 },
  heroTime: {
    fontWeight: '800', letterSpacing: 1,
    marginTop: 2, fontVariant: ['tabular-nums'],
  },
  heroProgressWrap: { marginTop: 16 },
  heroFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth, marginTop: 16, paddingTop: 14,
    gap: 8,
  },
  heroFooterHijri: { fontSize: 12, fontWeight: '700' },
  heroIconBtn: {
    width: 32, height: 32, borderRadius: RADIUS.sm, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },

  countdownRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    justifyContent: 'center', gap: 6, marginTop: 18,
  },
  countdownBlock: { alignItems: 'center', flex: 1, maxWidth: 74 },
  countdownPill: {
    paddingHorizontal: 8, paddingVertical: 8,
    width: '100%', alignItems: 'center',
  },
  countdownValue: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'], letterSpacing: 0.5,
  },
  countdownLabel: {
    fontSize: 9.5, fontWeight: '800',
    letterSpacing: 1.2, marginTop: 5, textTransform: 'uppercase',
  },
  countdownSep: {
    fontWeight: '800', marginTop: 6, fontVariant: ['tabular-nums'],
  },

  stickyMini: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 100,
    ...SHADOW_SM,
  },
  stickyMiniInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 56,
  },
  stickyMiniIcon: {
    width: 36, height: 36, borderRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
  },
  stickyMiniEyebrow: {
    fontWeight: '800', letterSpacing: 1, marginBottom: 2,
  },
  stickyMiniName: {
    fontWeight: '900', letterSpacing: -0.2,
  },
  stickyMiniCountdownBox: {
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: RADIUS.sm, borderWidth: 1,
    minWidth: 68, alignItems: 'center',
  },
  stickyMiniCountdown: {
    fontWeight: '900',
    fontVariant: ['tabular-nums'], letterSpacing: 0.4,
  },
  stickyMiniArrow: {
    width: 24, height: 24, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  compactTimeline: {
    padding: 14, marginBottom: 20,
  },
  compactTimelineRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
  },
  compactTimelineIcon: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  compactTimelineLabel: { fontWeight: '800', letterSpacing: 1 },
  compactTimelineValue: { fontWeight: '900', marginTop: 3 },
  compactTimelineNext: { fontWeight: '900', letterSpacing: 0.5 },
  compactTimelineBar: { height: 5, borderRadius: 3, overflow: 'hidden' },
  compactTimelineBarFill: { height: '100%', borderRadius: 3 },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    marginBottom: 20,
  },
  notifCardIcon: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  prayerStripContent: { gap: 10, paddingHorizontal: 2, paddingVertical: 4 },
  prayerCard: {
    alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8,
    gap: 6, position: 'relative',
  },
  prayerCardActiveShadow: Platform.select({
    web: { boxShadow: '0 4px 12px rgba(0,0,0,0.22)' },
    default: {
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.28, shadowRadius: 10, elevation: 4,
    },
  }),
  prayerCardIcon: {
    width: 30, height: 30,
    alignItems: 'center', justifyContent: 'center',
  },
  prayerCardName: { fontWeight: '800', letterSpacing: 0.3 },
  prayerCardTime: { fontWeight: '900', fontVariant: ['tabular-nums'] },
  prayerCardCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 14, height: 14, borderRadius: 7,
    alignItems: 'center', justifyContent: 'center',
  },
  prayerCardActiveDot: {
    position: 'absolute', bottom: 4, left: '50%',
    marginLeft: -3, width: 6, height: 6, borderRadius: 3,
  },
  tomorrowBadgeInline: {
    position: 'absolute',
    top: 4, right: 4,
    paddingHorizontal: 5, paddingVertical: 1,
    borderRadius: 4,
  },

  section: { marginBottom: 22 },
  sectionHeading: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', gap: 10, marginBottom: 12, paddingHorizontal: 2,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  sectionIconBox: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontWeight: '900', letterSpacing: 0.2, flexShrink: 1 },

  quickActionsRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    gap: 10,
  },
  quickAction: {
    flex: 1, alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 4,
  },
  quickActionIcon: {
    width: 46, height: 46,
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: { fontWeight: '800' },

  namesCard: { overflow: 'hidden' },
  nameRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  nameArabicBox: {
    width: 72, height: 72, borderRadius: RADIUS.lg, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  nameArabicText: { fontWeight: '800', textAlign: 'center', writingDirection: 'rtl' },
  nameInfo: { flex: 1, minWidth: 0, gap: 4 },
  nameMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  genderChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
  genderChipText: { fontWeight: '900', letterSpacing: 0.5 },
  nameOrigin: { fontStyle: 'italic', fontWeight: '700', flexShrink: 1 },
  nameTitle: { fontWeight: '900', letterSpacing: 0.2, marginTop: 2 },
  nameMeaning: { marginTop: 2, fontWeight: '500' },
  namesDivider: { height: StyleSheet.hairlineWidth },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: 12, paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    ...Platform.select({
      web: { boxShadow: '0 -6px 12px rgba(0,0,0,0.07)' },
      default: {
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.06, shadowRadius: 12, elevation: 15,
      },
    }),
  },
  bottomBarButton: {
    flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  activeTabIcon: {
    alignItems: 'center', justifyContent: 'center',
  },
  bottomBarText: { fontWeight: '700' },
  bottomBarInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    width: '100%', maxWidth: 560, alignSelf: 'center',
  },

  sheetRoot: {
    flex: 1, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.lg,
  },
  sheet: {
    width: '100%', maxWidth: 420,
    borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl,
  },
  sheetTitle: { fontWeight: '900', textAlign: 'center' },
  sheetMessage: { textAlign: 'center', marginTop: 6, fontWeight: '500' },
  sheetActions: { gap: 10, marginTop: SPACING.xl },
  sheetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    minHeight: 52, borderRadius: RADIUS.lg, paddingHorizontal: 14,
  },
  sheetCancel: { backgroundColor: 'transparent' },
});