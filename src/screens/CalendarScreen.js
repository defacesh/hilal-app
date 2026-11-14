// src/screens/CalendarScreen.js
import React, { useMemo, useState, memo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useAppStore,
  useReadingFontScale,
  useGlobalHaptic,
} from '../store/useAppStore';

if (
  Platform.OS === 'android' &&
  !global.nativeFabricUIManager &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ================================================================
   Haptics — global ayar kontrolü ile
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}

const hapticFeedback = (style = 'light') => {
  try {
    const enabled = useAppStore.getState().globalHaptic;
    if (enabled === false) return;
    if (!Haptics) return;
    if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (style === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
};

/* ================================================================
   Yazı ölçekleme — SettingsScreen ile aynı 3 değer
   ================================================================ */
const FONT_SCALES = [1.0, 1.15, 1.3];
const FONT_LABELS = ['Aa', 'Aa+', 'Aa++'];
const FONT_NAMES = ['Normal', 'Büyük', 'Çok Büyük'];

/* ================================================================
   Sabitler
   ================================================================ */

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

/* ================================================================
   Dini günler
   ================================================================ */

const RELIGIOUS_DAYS = [
  // 2026
  { date: '2026-01-15', title: 'Miraç Kandili', type: 'kandil' },
  { date: '2026-02-02', title: 'Berat Kandili', type: 'kandil' },
  { date: '2026-02-19', title: 'Ramazan Başlangıcı', type: 'ramazan' },
  { date: '2026-03-16', title: 'Kadir Gecesi', type: 'kandil' },
  { date: '2026-03-19', title: 'Ramazan Bayramı Arifesi', type: 'arefe' },
  { date: '2026-03-20', title: 'Ramazan Bayramı 1. Gün', type: 'bayram' },
  { date: '2026-03-21', title: 'Ramazan Bayramı 2. Gün', type: 'bayram' },
  { date: '2026-03-22', title: 'Ramazan Bayramı 3. Gün', type: 'bayram' },
  { date: '2026-05-26', title: 'Kurban Bayramı Arifesi', type: 'arefe' },
  { date: '2026-05-27', title: 'Kurban Bayramı 1. Gün', type: 'bayram' },
  { date: '2026-05-28', title: 'Kurban Bayramı 2. Gün', type: 'bayram' },
  { date: '2026-05-29', title: 'Kurban Bayramı 3. Gün', type: 'bayram' },
  { date: '2026-05-30', title: 'Kurban Bayramı 4. Gün', type: 'bayram' },
  { date: '2026-06-16', title: 'Hicri Yılbaşı', type: 'ozel' },
  { date: '2026-06-25', title: 'Aşure Günü', type: 'ozel' },
  { date: '2026-08-24', title: 'Mevlid Kandili', type: 'kandil' },
  { date: '2026-12-10', title: 'Üç Ayların Başlangıcı', type: 'ozel' },
  { date: '2026-12-10', title: 'Regaib Kandili', type: 'kandil' },

  // 2027
  { date: '2027-01-04', title: 'Miraç Kandili', type: 'kandil' },
  { date: '2027-01-22', title: 'Berat Kandili', type: 'kandil' },
  { date: '2027-02-08', title: 'Ramazan Başlangıcı', type: 'ramazan' },
  { date: '2027-03-05', title: 'Kadir Gecesi', type: 'kandil' },
  { date: '2027-03-08', title: 'Ramazan Bayramı Arifesi', type: 'arefe' },
  { date: '2027-03-09', title: 'Ramazan Bayramı 1. Gün', type: 'bayram' },
  { date: '2027-03-10', title: 'Ramazan Bayramı 2. Gün', type: 'bayram' },
  { date: '2027-03-11', title: 'Ramazan Bayramı 3. Gün', type: 'bayram' },
  { date: '2027-05-15', title: 'Kurban Bayramı Arifesi', type: 'arefe' },
  { date: '2027-05-16', title: 'Kurban Bayramı 1. Gün', type: 'bayram' },
  { date: '2027-05-17', title: 'Kurban Bayramı 2. Gün', type: 'bayram' },
  { date: '2027-05-18', title: 'Kurban Bayramı 3. Gün', type: 'bayram' },
  { date: '2027-05-19', title: 'Kurban Bayramı 4. Gün', type: 'bayram' },
  { date: '2027-06-06', title: 'Hicri Yılbaşı', type: 'ozel' },
  { date: '2027-06-15', title: 'Aşure Günü', type: 'ozel' },
  { date: '2027-08-13', title: 'Mevlid Kandili', type: 'kandil' },
  { date: '2027-11-29', title: 'Üç Ayların Başlangıcı', type: 'ozel' },
  { date: '2027-12-02', title: 'Regaib Kandili', type: 'kandil' },

  // 2028
  { date: '2028-01-13', title: 'Regaib Kandili', type: 'kandil' },
  { date: '2028-02-11', title: 'Miraç Kandili', type: 'kandil' },
  { date: '2028-02-29', title: 'Berat Kandili', type: 'kandil' },
  { date: '2028-02-17', title: 'Ramazan Başlangıcı', type: 'ramazan' },
  { date: '2028-03-13', title: 'Kadir Gecesi', type: 'kandil' },
  { date: '2028-03-17', title: 'Ramazan Bayramı Arifesi', type: 'arefe' },
  { date: '2028-03-18', title: 'Ramazan Bayramı 1. Gün', type: 'bayram' },
  { date: '2028-03-19', title: 'Ramazan Bayramı 2. Gün', type: 'bayram' },
  { date: '2028-03-20', title: 'Ramazan Bayramı 3. Gün', type: 'bayram' },
  { date: '2028-05-05', title: 'Kurban Bayramı Arifesi', type: 'arefe' },
  { date: '2028-05-06', title: 'Kurban Bayramı 1. Gün', type: 'bayram' },
  { date: '2028-05-07', title: 'Kurban Bayramı 2. Gün', type: 'bayram' },
  { date: '2028-05-08', title: 'Kurban Bayramı 3. Gün', type: 'bayram' },
  { date: '2028-05-09', title: 'Kurban Bayramı 4. Gün', type: 'bayram' },
  { date: '2028-06-01', title: 'Mevlid Kandili', type: 'kandil' },
];

/* ================================================================
   Renk paleti & Yüksek Kontrast Desteği
   ================================================================ */

const EVENT_COLORS = {
  kandil: {
    primary: '#F59E0B',
    hcPrimary: '#FFD700',
    light: 'rgba(245, 158, 11, 0.14)',
    hcLight: 'rgba(255, 215, 0, 0.25)',
    border: 'rgba(245, 158, 11, 0.4)',
    hcBorder: '#FFD700',
    label: 'Kandil',
    icon: 'star-crescent',
  },
  bayram: {
    primary: '#10B981',
    hcPrimary: '#00FF7F',
    light: 'rgba(16, 185, 129, 0.14)',
    hcLight: 'rgba(0, 255, 127, 0.25)',
    border: 'rgba(16, 185, 129, 0.4)',
    hcBorder: '#00FF7F',
    label: 'Bayram',
    icon: 'party-popper',
  },
  ramazan: {
    primary: '#8B5CF6',
    hcPrimary: '#DA70D6',
    light: 'rgba(139, 92, 246, 0.14)',
    hcLight: 'rgba(218, 112, 214, 0.25)',
    border: 'rgba(139, 92, 246, 0.4)',
    hcBorder: '#DA70D6',
    label: 'Ramazan',
    icon: 'moon-waning-crescent',
  },
  arefe: {
    primary: '#EF4444',
    hcPrimary: '#FF4500',
    light: 'rgba(239, 68, 68, 0.14)',
    hcLight: 'rgba(255, 69, 0, 0.25)',
    border: 'rgba(239, 68, 68, 0.4)',
    hcBorder: '#FF4500',
    label: 'Arefe',
    icon: 'clock-alert-outline',
  },
  ozel: {
    primary: '#3B82F6',
    hcPrimary: '#1E90FF',
    light: 'rgba(59, 130, 246, 0.14)',
    hcLight: 'rgba(30, 144, 255, 0.25)',
    border: 'rgba(59, 130, 246, 0.4)',
    hcBorder: '#1E90FF',
    label: 'Diğer',
    icon: 'star-four-points',
  },
};

const getEventStyle = (type, highContrast = false) => {
  const ec = EVENT_COLORS[type] || EVENT_COLORS.ozel;
  if (!highContrast) return ec;
  return {
    ...ec,
    primary: ec.hcPrimary,
    light: ec.hcLight,
    border: ec.hcBorder,
  };
};

const pad = (number) => String(number).padStart(2, '0');

const dateKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

function getHijriDate(date, options = {}) {
  try {
    return new Intl.DateTimeFormat('tr-TR-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: options.dayOnly ? undefined : 'long',
      year: options.dayOnly ? undefined : 'numeric',
      timeZone: 'UTC',
    }).format(
      new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())),
    );
  } catch {
    return '—';
  }
}

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) =>
    new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + index,
    ),
  );
}

function daysBetween(targetKey, todayKey) {
  const [ty, tm, td] = targetKey.split('-').map(Number);
  const [ny, nm, nd] = todayKey.split('-').map(Number);
  return Math.round(
    (new Date(ty, tm - 1, td) - new Date(ny, nm - 1, nd)) / 86400000,
  );
}

function formatCountdown(days) {
  if (days === 0) return 'Bugün';
  if (days === 1) return 'Yarın';
  if (days === -1) return 'Dün';
  if (days < 0) return `${Math.abs(days)} gün önce`;
  return `${days} gün kaldı`;
}

const formatEventDate = (key) => {
  const [year, month, day] = key.split('-').map(Number);
  return `${day} ${MONTH_NAMES[month - 1]} ${year}`;
};

/* ================================================================
   Ana Ekran
   ================================================================ */

export default function CalendarScreen({ onBack }) {
  const getTheme = useAppStore((state) => state.getTheme);
  const rawTheme = getTheme();

  const readingFontScale = useReadingFontScale();
  const globalHaptic = useGlobalHaptic();
  const highContrast = useAppStore((s) => s.highContrast);
  const setReadingFontScale = useAppStore((s) => s.setReadingFontScale);
  const isSimpleMode = useAppStore((s) => s.isSimpleMode);

  // Yüksek kontrast renk override mantığı
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

  const fontScale = readingFontScale || 1;
  const fontIdx = useMemo(() => {
    const idx = FONT_SCALES.findIndex((v) => Math.abs(v - fontScale) < 0.01);
    return idx >= 0 ? idx : 0;
  }, [fontScale]);

  const cycleFontScale = useCallback(() => {
    hapticFeedback('light');
    const nextIdx = (fontIdx + 1) % FONT_SCALES.length;
    setReadingFontScale(FONT_SCALES[nextIdx]);
  }, [fontIdx, setReadingFontScale]);

  const styles = useMemo(() => createStyles(theme, fontScale, highContrast), [theme, fontScale, highContrast]);

  /* EventBadge */
  const EventBadge = memo(({ type, title, style }) => {
    const ec = getEventStyle(type, highContrast);
    return (
      <View
        style={[
          styles.eventBadgeContainer,
          { backgroundColor: ec.light, borderColor: ec.border },
          style,
        ]}
      >
        <MaterialCommunityIcons name={ec.icon} size={14 * fontScale} color={ec.primary} />
        <Text style={[styles.eventBadgeText, { color: ec.primary, fontSize: Math.round(12 * fontScale) }]}>{title}</Text>
      </View>
    );
  });

  /* DayCell */
  const DayCell = memo(
    ({ date, keyStr, hijri, isCurrentMonth, isToday, isSelected, dayEvents, primaryColor, onSelect }) => {
      const hasEvent = dayEvents.length > 0;
      const firstEvent = hasEvent ? dayEvents[0] : null;
      const ec = firstEvent ? getEventStyle(firstEvent.type, highContrast) : null;

      return (
        <TouchableOpacity
          onPress={() => onSelect(keyStr)}
          style={[
            styles.dayCell,
            !isCurrentMonth && styles.outsideMonthCell,
            hasEvent && !isSelected && !isToday && { backgroundColor: ec.light },
            (isToday || isSelected) && { backgroundColor: primaryColor },
          ]}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.gregorianDay,
              { fontSize: Math.round(16 * fontScale) },
              !isCurrentMonth && styles.outsideMonthText,
              (isSelected || isToday) && styles.selectedDayText,
              highContrast && (isSelected || isToday) && { color: '#000000', fontWeight: '900' },
            ]}
          >
            {date.getDate()}
          </Text>
          <Text
            style={[
              styles.hijriDay,
              { fontSize: Math.round(10 * fontScale) },
              (isSelected || isToday) && { color: highContrast ? '#000000' : 'rgba(255,255,255,0.9)', fontWeight: '900' },
              hasEvent && !isSelected && !isToday && { color: ec.primary, fontWeight: '900' },
            ]}
            numberOfLines={1}
          >
            {hijri}
          </Text>

          {hasEvent && (
            <View style={styles.eventBarWrap}>
              {dayEvents.slice(0, 3).map((event, i) => (
                <View
                  key={i}
                  style={[
                    styles.eventBar,
                    {
                      backgroundColor:
                        isSelected || isToday ? (highContrast ? '#000000' : '#FFFFFF') : getEventStyle(event.type, highContrast).primary,
                    },
                  ]}
                />
              ))}
            </View>
          )}

          {isToday && (
            <View style={[styles.todayMiniTag, highContrast && { backgroundColor: 'rgba(0,0,0,0.8)', borderWidth: 1, borderColor: '#000000' }]}>
              <Text style={[styles.todayMiniText, { fontSize: Math.round(8 * fontScale) }, highContrast && { color: '#FFFF00' }]}>BUGÜN</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    },
    (prevProps, nextProps) =>
      prevProps.keyStr === nextProps.keyStr &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isToday === nextProps.isToday &&
      prevProps.hijri === nextProps.hijri &&
      prevProps.dayEvents === nextProps.dayEvents &&
      prevProps.primaryColor === nextProps.primaryColor,
  );

  const today = useMemo(() => new Date(), []);
  const todayKey = dateKey(today);

  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const [selectedDate, setSelectedDate] = useState(todayKey);

  const days = useMemo(
    () => getCalendarDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate],
  );

  const daysWithHijri = useMemo(
    () =>
      days.map((date) => ({
        date,
        key: dateKey(date),
        hijri: getHijriDate(date, { dayOnly: true }),
      })),
    [days],
  );

  const eventsByDate = useMemo(() => {
    const map = {};
    RELIGIOUS_DAYS.forEach((event) => {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    });
    return map;
  }, []);

  const selectedEvents = eventsByDate[selectedDate] || [];

  const selectedHijri = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    return getHijriDate(new Date(year, month - 1, day));
  }, [selectedDate]);

  const upcomingEvents = useMemo(() => {
    return RELIGIOUS_DAYS.filter((event) => event.date >= todayKey)
      .sort((a, b) => a.date.localeCompare(b.date))
      .filter(
        (event, index, list) =>
          list.findIndex(
            (item) => item.date === event.date && item.title === event.title,
          ) === index,
      )
      .slice(0, 10)
      .map((event) => ({
        ...event,
        daysLeft: daysBetween(event.date, todayKey),
      }));
  }, [todayKey]);

  const changeMonth = useCallback((offset) => {
    hapticFeedback('light');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setViewDate(
      (current) =>
        new Date(current.getFullYear(), current.getMonth() + offset, 1),
    );
  }, []);

  const goToToday = useCallback(() => {
    hapticFeedback('medium');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(dateKey(now));
  }, []);

  const goToEvent = useCallback((eventKey) => {
    hapticFeedback('medium');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const [year, month] = eventKey.split('-').map(Number);
    setViewDate(new Date(year, month - 1, 1));
    setSelectedDate(eventKey);
  }, []);

  const handleSelectDate = useCallback((keyStr) => {
    hapticFeedback('light');
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedDate(keyStr);
  }, []);

  const selectedCountdown =
    selectedDate === todayKey
      ? 'Bugün'
      : formatCountdown(daysBetween(selectedDate, todayKey));

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={highContrast || theme.mode === 'dark' ? 'light-content' : 'dark-content'}
      />

      {/* HEADER */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
          >
            <Ionicons name="arrow-back" size={21 * fontScale} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButton} />
        )}

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { fontSize: Math.round(19 * fontScale) }]}>Dini Takvim</Text>
          <Text style={[styles.headerSubtitle, { fontSize: Math.round(11 * fontScale) }]}>Hicri tarih · Dini günler</Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={cycleFontScale}
            style={[styles.fontButton, fontIdx > 0 && styles.fontButtonActive]}
            accessibilityRole="button"
            accessibilityLabel={`Yazı boyutu: ${FONT_NAMES[fontIdx]}. Değiştirmek için dokun.`}
          >
            <Text
              style={[
                styles.fontButtonText,
                fontIdx > 0 && styles.fontButtonTextActive,
                { fontSize: Math.round((11 + fontIdx * 1.5) * fontScale) },
              ]}
            >
              {FONT_LABELS[fontIdx]}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goToToday}
            style={styles.todayButton}
            accessibilityRole="button"
            accessibilityLabel="Bugüne dön"
          >
            <MaterialCommunityIcons
              name="calendar-today"
              size={20 * fontScale}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* HERO */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <MaterialCommunityIcons
                name="moon-waning-crescent"
                size={27 * fontScale}
                color={theme.primary}
              />
            </View>

            <View
              style={[
                styles.countdownBadge,
                {
                  backgroundColor:
                    selectedDate === todayKey
                      ? theme.primary
                      : theme.surfaceElevated,
                  borderColor:
                    selectedDate === todayKey ? theme.primary : theme.border,
                },
              ]}
            >
              <Text
                style={{
                  color: selectedDate === todayKey ? (highContrast ? '#000000' : '#FFFFFF') : theme.primary,
                  fontSize: Math.round(11 * fontScale),
                  fontWeight: '900',
                }}
              >
                {selectedCountdown.toLocaleUpperCase('tr-TR')}
              </Text>
            </View>
          </View>

          <Text style={[styles.heroLabel, { fontSize: Math.round(10 * fontScale) }]}>SEÇİLEN GÜNÜN HİCRİ TARİHİ</Text>
          <Text style={[styles.heroDate, { fontSize: Math.round(26 * fontScale) }]}>{selectedHijri}</Text>
          <Text style={[styles.heroGregorian, { fontSize: Math.round(13 * fontScale) }]}>
            {formatEventDate(selectedDate)}
          </Text>

          {selectedEvents.length > 0 && (
            <View style={styles.heroEventRow}>
              {selectedEvents.map((event, index) => (
                <EventBadge
                  key={`${event.title}-${index}`}
                  type={event.type}
                  title={event.title}
                />
              ))}
            </View>
          )}
        </View>

        {/* AY GEZİNME */}
        <View style={styles.monthHeader}>
          <TouchableOpacity
            onPress={() => changeMonth(-1)}
            style={styles.monthArrow}
            accessibilityRole="button"
            accessibilityLabel="Önceki ay"
          >
            <Ionicons name="chevron-back" size={22 * fontScale} color={theme.text} />
          </TouchableOpacity>

          <Text style={[styles.monthTitle, { fontSize: Math.round(19 * fontScale) }]}>
            {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
          </Text>

          <TouchableOpacity
            onPress={() => changeMonth(1)}
            style={styles.monthArrow}
            accessibilityRole="button"
            accessibilityLabel="Sonraki ay"
          >
            <Ionicons name="chevron-forward" size={22 * fontScale} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* HAFTA BAŞLIKLARI */}
        <View style={styles.weekRow}>
          {WEEKDAYS.map((day) => (
            <View key={day} style={styles.weekCell}>
              <Text style={[styles.weekText, { fontSize: Math.round(12 * fontScale) }]}>{day}</Text>
            </View>
          ))}
        </View>

        {/* TAKVİM IZGARASI */}
        <View style={styles.calendarGrid}>
          {daysWithHijri.map(({ date, key, hijri }) => {
            const isCurrentMonth = date.getMonth() === viewDate.getMonth();
            const isToday = key === todayKey;
            const isSelected = key === selectedDate;
            const dayEvents = eventsByDate[key] || [];

            return (
              <DayCell
                key={key}
                date={date}
                keyStr={key}
                hijri={hijri}
                isCurrentMonth={isCurrentMonth}
                isToday={isToday}
                isSelected={isSelected}
                dayEvents={dayEvents}
                primaryColor={theme.primary}
                onSelect={handleSelectDate}
              />
            );
          })}
        </View>

        {/* RENK AÇIKLAMASI */}
        {!isSimpleMode ? (
          <View style={[styles.legendCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.legendTitle, { fontSize: Math.round(10 * fontScale) }]}>ETKİNLİK TÜRLERİ</Text>
            <View style={styles.legendGrid}>
              {Object.entries(EVENT_COLORS).map(([type, ec]) => {
                const resolvedEc = getEventStyle(type, highContrast);
                return (
                  <View key={type} style={styles.legendItem}>
                    <View style={[styles.legendBar, { backgroundColor: resolvedEc.primary }]} />
                    <Text style={[styles.legendText, { fontSize: Math.round(12 * fontScale) }]}>{ec.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* SEÇİLEN GÜN DETAYI */}
        <Text style={[styles.sectionTitle, { fontSize: Math.round(11 * fontScale) }]}>SEÇİLEN GÜN</Text>
        <View style={[styles.detailCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.detailDateIcon}>
            <MaterialCommunityIcons
              name="calendar-star"
              size={23 * fontScale}
              color={theme.primary}
            />
          </View>
          <View style={styles.detailContent}>
            <View style={styles.detailTitleRow}>
              <Text style={[styles.detailDate, { fontSize: Math.round(16 * fontScale) }]}>
                {formatEventDate(selectedDate)}
              </Text>
              {selectedDate === todayKey && (
                <View style={[styles.todayChip, { backgroundColor: theme.primaryGlow }]}>
                  <Text style={{ color: theme.primary, fontSize: Math.round(9 * fontScale), fontWeight: '900' }}>
                    BUGÜN
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.detailHijri, { fontSize: Math.round(12 * fontScale) }]}>{selectedHijri}</Text>

            {selectedEvents.length > 0 ? (
              selectedEvents.map((event, index) => (
                <View key={index} style={styles.eventRow}>
                  <EventBadge type={event.type} title={event.title} />
                </View>
              ))
            ) : (
              <>
                <Text style={[styles.noEventText, { fontSize: Math.round(13 * fontScale) }]}>
                  Bu tarih için kayıtlı bir dini gün bulunmuyor.
                </Text>
                {upcomingEvents.length > 0 && (
                  <TouchableOpacity
                    onPress={() => goToEvent(upcomingEvents[0].date)}
                    style={[styles.nearestEventBtn, { borderColor: theme.border }]}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="arrow-forward" size={14 * fontScale} color={theme.primary} />
                    <Text style={{ color: theme.primary, fontSize: Math.round(12 * fontScale), fontWeight: '800', marginLeft: 4 }}>
                      En yakın: {upcomingEvents[0].title}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* YAKLAŞAN DİNİ GÜNLER */}
        <View style={styles.upcomingHeader}>
          <Text style={[styles.sectionTitle, { fontSize: Math.round(11 * fontScale) }]}>YAKLAŞAN DİNİ GÜNLER</Text>
          <MaterialCommunityIcons
            name="star-four-points"
            size={18 * fontScale}
            color={theme.primary}
          />
        </View>

        {upcomingEvents.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.noEventText, { fontSize: Math.round(13 * fontScale) }]}>Yaklaşan dini gün bulunamadı.</Text>
          </View>
        ) : (
          upcomingEvents.map((event) => {
            const ec = getEventStyle(event.type, highContrast);
            const isToday = event.date === todayKey;

            return (
              <TouchableOpacity
                key={`${event.date}-${event.title}`}
                onPress={() => goToEvent(event.date)}
                style={[
                  styles.upcomingCard,
                  {
                    backgroundColor: theme.surface,
                    borderColor: isToday ? theme.primary : theme.border,
                    borderWidth: isToday ? (highContrast ? 3 : 2) : 1,
                  },
                ]}
                activeOpacity={0.75}
              >
                <View style={[styles.upcomingSideBar, { backgroundColor: ec.primary }]} />
                <View style={[styles.daysLeftBox, { backgroundColor: ec.light }]}>
                  {isToday ? (
                    <Text style={{ color: ec.primary, fontSize: Math.round(10 * fontScale), fontWeight: '900' }}>
                      BUGÜN
                    </Text>
                  ) : (
                    <>
                      <Text style={{ color: ec.primary, fontSize: Math.round(18 * fontScale), fontWeight: '900' }}>
                        {event.daysLeft}
                      </Text>
                      <Text style={{ color: ec.primary, fontSize: Math.round(10 * fontScale), fontWeight: '800' }}>
                        GÜN
                      </Text>
                    </>
                  )}
                </View>

                <View style={styles.upcomingText}>
                  <Text style={[styles.upcomingTitle, { fontSize: Math.round(14 * fontScale) }]}>{event.title}</Text>
                  <Text style={[styles.upcomingDate, { fontSize: Math.round(12 * fontScale) }]}>{formatEventDate(event.date)}</Text>
                </View>

                <Ionicons name="chevron-forward" size={18 * fontScale} color={theme.textDim} />
              </TouchableOpacity>
            );
          })
        )}

        <Text style={[styles.disclaimer, { fontSize: Math.round(10 * fontScale) }]}>
          Hicri tarih hesaplamaları kullanılan takvim yöntemine göre bir gün farklılık gösterebilir.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================================================================
   Stiller — fontScale ve highContrast'a göre dinamik
   ================================================================ */

function createStyles(theme, fontScale = 1, highContrast = false) {
  const f = (size) => Math.round(size * fontScale);
  const dayCellHeight = Math.round(78 * fontScale);
  const daysLeftBoxSize = Math.round(54 * fontScale);

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { minHeight: 68, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
    headerButton: { width: 44, height: 44, borderRadius: 15, borderWidth: highContrast ? 2 : 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },
    headerTitleWrap: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
    headerTitle: { color: theme.text, fontWeight: '900' },
    headerSubtitle: { color: theme.textDim, marginTop: 3 },
    headerActions: { flexDirection: 'row', gap: 6, alignItems: 'center' },
    todayButton: { width: 44, height: 44, borderRadius: 15, borderWidth: highContrast ? 2 : 1, borderColor: theme.border, backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' },

    fontButton: {
      minWidth: 44, height: 44, borderRadius: 15, borderWidth: highContrast ? 2 : 1,
      borderColor: theme.border, backgroundColor: theme.surface,
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
    },
    fontButtonActive: {
      backgroundColor: theme.primaryGlow || `${theme.primary}18`,
      borderColor: theme.primary,
    },
    fontButtonText: {
      color: theme.text,
      fontWeight: '900',
    },
    fontButtonTextActive: {
      color: theme.primary,
    },

    scrollContent: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 36 },

    heroCard: { backgroundColor: theme.surface, borderRadius: 24, borderWidth: highContrast ? 2 : 1, borderColor: theme.border, padding: 20, marginBottom: 20 },
    heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    heroIcon: { width: 52, height: 52, borderRadius: 18, backgroundColor: `${theme.primary}18`, alignItems: 'center', justifyContent: 'center' },
    countdownBadge: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: highContrast ? 2 : 1 },
    heroLabel: { color: theme.textDim, fontWeight: '800', letterSpacing: 1.2 },
    heroDate: { color: theme.text, fontWeight: '900', marginTop: 9 },
    heroGregorian: { color: theme.textDim, marginTop: 6 },
    heroEventRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },

    eventBadgeContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: highContrast ? 2 : 1, gap: 6 },
    eventBadgeText: { fontWeight: '800' },

    monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    monthArrow: { width: 42, height: 42, borderRadius: 14, backgroundColor: theme.surface, borderWidth: highContrast ? 2 : 1, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
    monthTitle: { color: theme.text, fontWeight: '900' },

    weekRow: { flexDirection: 'row', marginBottom: 8 },
    weekCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 6 },
    weekText: { color: theme.primary, fontWeight: '900' },

    calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: theme.surface, borderRadius: 20, borderWidth: highContrast ? 2 : 1, borderColor: theme.border, overflow: 'hidden', padding: 4 },
    dayCell: { width: `${100 / 7}%`, height: dayCellHeight, alignItems: 'center', justifyContent: 'flex-start', borderRadius: 12, paddingTop: 8, paddingBottom: 6, position: 'relative' },
    outsideMonthCell: { opacity: 0.35 },
    gregorianDay: { color: theme.text, fontWeight: '900' },
    hijriDay: { color: theme.textDim, fontWeight: '600', marginTop: 2, maxWidth: '92%', textAlign: 'center' },
    outsideMonthText: { opacity: 0.55 },
    selectedDayText: { color: '#FFFFFF' },

    eventBarWrap: { flexDirection: 'row', gap: 2, marginTop: 4, height: 6, alignItems: 'center' },
    eventBar: { width: 12, height: 5, borderRadius: 3 },
    todayMiniTag: { position: 'absolute', bottom: 3, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
    todayMiniText: { color: '#FFFFFF', fontWeight: '900' },

    legendCard: { borderRadius: 16, borderWidth: highContrast ? 2 : 1, borderColor: theme.border, paddingVertical: 14, paddingHorizontal: 16, marginTop: 16, marginBottom: 6 },
    legendTitle: { color: theme.textDim, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 },
    legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, rowGap: 10 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendBar: { width: 12, height: 6, borderRadius: 3 },
    legendText: { color: theme.text, fontWeight: '700' },

    sectionTitle: { color: theme.primary, fontWeight: '900', letterSpacing: 1, marginTop: 22, marginBottom: 12 },
    detailCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 18, borderWidth: highContrast ? 2 : 1, borderColor: theme.border, padding: 16, gap: 12 },
    detailDateIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: `${theme.primary}18`, alignItems: 'center', justifyContent: 'center' },
    detailContent: { flex: 1 },
    detailTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailDate: { color: theme.text, fontWeight: '900' },
    todayChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
    detailHijri: { color: theme.textDim, marginTop: 5, marginBottom: 10 },
    eventRow: { marginTop: 8 },
    noEventText: { color: theme.textDim, lineHeight: f(19) },
    nearestEventBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9, borderWidth: highContrast ? 2 : 1, borderColor: theme.border },

    upcomingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    upcomingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 10, borderRadius: 16, position: 'relative', overflow: 'hidden' },
    upcomingSideBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
    daysLeftBox: { width: daysLeftBoxSize, height: daysLeftBoxSize, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
    upcomingText: { flex: 1 },
    upcomingTitle: { color: theme.text, fontWeight: '900' },
    upcomingDate: { color: theme.textDim, marginTop: 4 },
    emptyCard: { borderWidth: highContrast ? 2 : 1, borderColor: theme.border, borderRadius: 16, padding: 16 },
    disclaimer: { color: theme.textDim, lineHeight: f(16), textAlign: 'center', marginTop: 22, paddingHorizontal: 6 },
  });
}