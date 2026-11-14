// src/screens/ZekatScreen.js
import React, {
  useState, useEffect, useMemo, useCallback, useRef, memo
} from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
  Share,
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useAppStore, useReadingFontScale,
} from '../store/useAppStore';
import {
  fetchZekatNisapAndPrices, calculateZekat, NISAP_GRAM_ALTIN,
  DEFAULT_PRICES, GRAM_PER_TROY_OUNCE
} from '../services/zekatApi';
import { ZEKAT_INFO_DATA, ZEKAT_CATEGORIES } from '../data/zekatData';

/* ================================================================
   Haptics
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
   Sabitler
   ================================================================ */
const FONT_SCALES = [1.0, 1.15, 1.3];
const FONT_LABELS = ['Aa', 'Aa+', 'Aa++'];
const SIMPLE_MODE_CATEGORIES = ['temel', 'kimlere', 'nasil', 'sss'];

/* ================================================================
   Yardımcılar
   ================================================================ */
const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(amount || 0);
  } catch {
    return `₺${(Number(amount) || 0).toFixed(2)}`;
  }
};

const formatCompactCurrency = (amount) => {
  const n = Number(amount) || 0;
  if (Math.abs(n) >= 1_000_000) return `₺${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 10_000) return `₺${(n / 1_000).toFixed(1)}K`;
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(n);
  } catch {
    return `₺${n.toFixed(0)}`;
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return '—';
  try {
    const d = new Date(timestamp);
    return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
};

const getSourceBadge = (source) => {
  switch (source) {
    case 'ummah': case 'live': return { label: 'Canlı Piyasa', color: '#10B981', icon: 'cloud-done' };
    case 'fx-only': return { label: 'Kurlar Güncel', color: '#F59E0B', icon: 'cloud-outline' };
    case 'fallback': case 'safe-fixed': return { label: 'Güvenli Sabit', color: '#3B82F6', icon: 'shield-checkmark-outline' };
    case 'manual': return { label: 'Manuel Giriş', color: '#8B5CF6', icon: 'create-outline' };
    case 'cache': return { label: 'Önbellek', color: '#F59E0B', icon: 'save-outline' };
    default: return { label: 'Bilinmiyor', color: '#94A3B8', icon: 'help-outline' };
  }
};

const formatInputDisplay = (val) => {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).replace(/\./g, '');
  const parts = str.split(',');
  let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return parts.length > 1 ? `${integerPart},${parts[1]}` : integerPart;
};

const parseAmountScreen = (val) => {
  if (!val) return 0;
  return Number(String(val).replace(/\./g, '').replace(',', '.')) || 0;
};

const normalizeText = (str) => String(str || '').toLocaleLowerCase('tr-TR');

const SECTION_META = {
  cash: { color: '#10B981', icon: 'cash-multiple', title: 'NAKİT & DÖVİZ' },
  gold: { color: '#F59E0B', icon: 'gold', title: 'ALTIN & GÜMÜŞ' },
  commercial: { color: '#8B5CF6', icon: 'storefront', title: 'TİCARİ MAL & ALACAK' },
  invest: { color: '#06B6D4', icon: 'trending-up', title: 'YATIRIM & DİĞER VARLIKLAR' },
  debts: { color: '#EF4444', icon: 'minus-circle', title: 'DÜŞÜLECEK BORÇLAR' },
};

/* ================================================================
   UI Bileşenleri
   ================================================================ */
const PressableScale = memo(function PressableScale({
  onPress, children, style, disabled, scaleTo = 0.97, reduceMotion,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = useCallback(() => {
    if (reduceMotion) return;
    Animated.spring(scale, { toValue: scaleTo, useNativeDriver: true, speed: 60, bounciness: 4 }).start();
  }, [scale, scaleTo, reduceMotion]);
  const pressOut = useCallback(() => {
    if (reduceMotion) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60, bounciness: 4 }).start();
  }, [scale, reduceMotion]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        disabled={disabled}
        style={style}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
});

const Toast = memo(function Toast({ message, visible, theme, fontScale = 1.0, reduceMotion, styles }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      translateY.setValue(visible ? 0 : -20);
      opacity.setValue(visible ? 1 : 0);
      return;
    }
    Animated.parallel([
      Animated.timing(translateY, { toValue: visible ? 0 : -20, duration: visible ? 220 : 180, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: visible ? 1 : 0, duration: visible ? 220 : 180, useNativeDriver: true }),
    ]).start();
  }, [visible, translateY, opacity, reduceMotion]);
  return (
    <Animated.View pointerEvents="none" style={[styles.toast, { backgroundColor: theme.primary, opacity, transform: [{ translateY }] }]}>
      <Ionicons name="checkmark-circle" size={18 * fontScale} color="#FFF" />
      <Text style={[styles.toastText, { fontSize: Math.round(13.5 * fontScale) }]} numberOfLines={2}>{message}</Text>
    </Animated.View>
  );
});

const SectionLabel = ({ title, icon, theme, highContrast, fontScale = 1.0, styles, subtitle }) => {
  const textColor = highContrast ? theme.text : theme.textMuted;
  return (
    <View style={styles.sectionLabelContainer}>
      {icon ? (
        <View style={[styles.sectionIconBox, { backgroundColor: `${theme.primary}15` }]}>
          <Ionicons name={icon} size={12 * fontScale} color={theme.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionLabel, { color: textColor, fontSize: Math.round(11.5 * fontScale) }]}>
          {title.toLocaleUpperCase('tr-TR')}
        </Text>
        {subtitle ? (
          <Text style={{ color: theme.textMuted, fontSize: Math.round(10.5 * fontScale), marginTop: 2, fontWeight: '500' }}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[styles.sectionLabelLine, { backgroundColor: highContrast ? theme.text : theme.border }]} />
    </View>
  );
};

const GroupContainer = ({ children, theme, highContrast, styles }) => (
  <View style={[styles.groupContainer, {
    backgroundColor: theme.surface,
    borderColor: highContrast ? theme.text : theme.border,
    borderWidth: highContrast ? 2 : 1,
  }]}>
    {children}
  </View>
);

/* ================================================================
   AssetInput — TL için özel görünüm eklendi
   ================================================================ */
const AssetInput = memo(({
  label, value, onChangeText, unit, hint, theme, styles, highContrast,
  largeTouchTargets, placeholder = '0',
}) => {
  // "TL" ise para birimi vurgusu yapalım (daha büyük, letter-spacing)
  const isCurrencyTL = unit === 'TL';
  const isCurrencyForeign = unit === '$' || unit === '€';
  const isGram = unit === 'gr';

  return (
    <View style={styles.inputGroupHalf}>
      <Text style={[styles.label, highContrast && { color: theme.text, fontWeight: '700' }]}>
        {label}
      </Text>
      <View style={[
        styles.inputWrap,
        highContrast && { borderColor: theme.text, borderWidth: 2 },
        largeTouchTargets && { height: 60 },
      ]}>
        <TextInput
          value={formatInputDisplay(value)}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textDim}
          keyboardType="decimal-pad"
          style={styles.inputInner}
          accessibilityLabel={label}
        />
        {value ? (
          <TouchableOpacity
            onPress={() => { hapticFeedback('light'); onChangeText(''); }}
            style={{ padding: 6, marginRight: 4 }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Temizle"
          >
            <Ionicons name="close-circle" size={18} color={theme.textDim} />
          </TouchableOpacity>
        ) : null}
        <View style={[
          styles.inputUnitBadge,
          isCurrencyTL && {
            backgroundColor: `${theme.primary}15`,
            borderColor: `${theme.primary}40`,
          },
          isCurrencyForeign && {
            backgroundColor: `rgba(16, 185, 129, 0.12)`,
            borderColor: `rgba(16, 185, 129, 0.3)`,
          },
          isGram && {
            backgroundColor: `rgba(245, 158, 11, 0.12)`,
            borderColor: `rgba(245, 158, 11, 0.3)`,
          },
        ]}>
          <Text style={[
            styles.inputUnit,
            isCurrencyTL && { color: theme.primary, fontWeight: '900' },
            isCurrencyForeign && { color: '#10B981', fontWeight: '900' },
            isGram && { color: '#F59E0B', fontWeight: '900' },
          ]}>
            {unit}
          </Text>
        </View>
      </View>
      {hint ? <Text style={styles.inputHint}>{hint}</Text> : null}
    </View>
  );
});

/* ================================================================
   Mode Toggle
   ================================================================ */
const ModeToggle = memo(function ModeToggle({ mode, onChange, theme, highContrast, fontScale, styles }) {
  const options = [
    { id: 'simple', label: 'Basit', icon: 'flash', desc: 'Kolay kullanım' },
    { id: 'advanced', label: 'Gelişmiş', icon: 'construct', desc: 'Tüm özellikler' },
  ];
  return (
    <View style={[styles.modeToggleRow, {
      backgroundColor: highContrast ? '#121212' : theme.surface,
      borderColor: highContrast ? theme.text : theme.border,
      borderWidth: highContrast ? 2 : 1,
    }]}>
      {options.map((opt) => {
        const active = mode === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => { hapticFeedback('medium'); onChange(opt.id); }}
            activeOpacity={0.85}
            style={[
              styles.modeToggleBtn,
              active && {
                backgroundColor: highContrast ? '#000' : theme.primary,
                borderColor: theme.primary,
                borderWidth: 1,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${opt.label} mod. ${opt.desc}`}
          >
            <Ionicons
              name={opt.icon}
              size={14 * fontScale}
              color={active ? (highContrast ? '#FFFF00' : '#FFF') : theme.textDim}
            />
            <Text style={[
              styles.modeToggleText,
              {
                color: active ? (highContrast ? '#FFFF00' : '#FFF') : theme.text,
                fontSize: Math.round(13 * fontScale),
              },
            ]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

/* ================================================================
   Expandable Info Card
   ================================================================ */
const ExpandableInfoCard = memo(({ data, theme, styles, highContrast, categoryColor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const animValue = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = useCallback(() => {
    hapticFeedback('light');
    const nextState = !isOpen;
    setIsOpen(nextState);

    Animated.parallel([
      Animated.timing(rotateAnim, { toValue: nextState ? 1 : 0, duration: 250, useNativeDriver: true }),
      Animated.timing(animValue, { toValue: nextState ? 1 : 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [isOpen, animValue, rotateAnim]);

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const maxHeight = animValue.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight || 2000] });
  const opacity = animValue.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.5, 1] });

  const accentColor = categoryColor || theme.primary;

  return (
    <View style={[styles.infoCard, highContrast && { borderColor: theme.text, borderWidth: 2 }]}>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggle}
        style={styles.infoCardHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${data.title}. ${isOpen ? 'Kapat' : 'Detayları göster'}`}
      >
        <View style={[styles.infoIconBox, { backgroundColor: `${accentColor}1A`, borderColor: `${accentColor}33`, borderWidth: 1 }]}>
          <Ionicons name={data.icon || 'book-outline'} size={20} color={accentColor} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.infoCardTitle, highContrast && { fontWeight: '900' }]} numberOfLines={isOpen ? 2 : 1}>
            {data.title}
          </Text>
          {!isOpen ? (
            <Text style={[styles.infoCardPreview, { color: theme.textMuted }]} numberOfLines={2}>
              {String(data.body || '').replace(/\n+/g, ' ').slice(0, 100)}…
            </Text>
          ) : null}
        </View>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="chevron-down" size={20} color={theme.textDim} />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={{ maxHeight, opacity, overflow: 'hidden' }}>
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && h !== contentHeight) setContentHeight(h);
          }}
          style={styles.infoCardBody}
        >
          <Text style={[styles.infoCardText, highContrast && { color: theme.text, fontWeight: '600' }]}>
            {data.body}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
});

/* ================================================================
   Category Chip
   ================================================================ */
const CategoryChip = memo(({ category, count, isActive, onPress, theme, fontScale, styles, highContrast }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[
      styles.catChip,
      {
        backgroundColor: isActive ? (highContrast ? '#000' : theme.primary) : (highContrast ? '#121212' : theme.surface),
        borderColor: isActive ? theme.primary : (highContrast ? theme.text : theme.border),
        borderWidth: highContrast ? 2 : 1,
      },
    ]}
    accessibilityRole="button"
    accessibilityState={{ selected: isActive }}
    accessibilityLabel={`${category.name}, ${count} bilgi kartı${isActive ? ', seçili' : ''}`}
  >
    <Ionicons
      name={category.icon}
      size={14 * fontScale}
      color={isActive ? (highContrast ? '#FFFF00' : '#FFF') : theme.textDim}
    />
    <Text style={[
      styles.catChipText,
      {
        color: isActive ? (highContrast ? '#FFFF00' : '#FFF') : theme.text,
        fontSize: Math.round(12 * fontScale),
      },
    ]} numberOfLines={1}>
      {category.name}
    </Text>
    <View style={[styles.catChipBadge, {
      backgroundColor: isActive ? (highContrast ? '#FFFF0033' : 'rgba(255,255,255,0.25)') : `${theme.primary}20`,
    }]}>
      <Text style={[styles.catChipBadgeText, {
        color: isActive ? (highContrast ? '#FFFF00' : '#FFF') : theme.primary,
        fontSize: Math.round(10 * fontScale),
      }]}>
        {count}
      </Text>
    </View>
  </TouchableOpacity>
));

/* ================================================================
   Fiyat Kartı
   ================================================================ */
const PriceCard = memo(function PriceCard({
  icon, label, value, unit, color, big, theme, highContrast, fontScale,
}) {
  return (
    <View style={{
      flex: 1,
      padding: big ? 16 : 12,
      borderRadius: 14,
      backgroundColor: highContrast ? '#000000' : `${color}10`,
      borderWidth: highContrast ? 2 : 1,
      borderColor: highContrast ? `${color}80` : `${color}30`,
      alignItems: 'center',
    }}>
      <View style={{
        width: big ? 40 : 32,
        height: big ? 40 : 32,
        borderRadius: big ? 12 : 10,
        backgroundColor: `${color}20`,
        borderWidth: 1,
        borderColor: `${color}40`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: big ? 10 : 6,
      }}>
        <Ionicons name={icon} size={big ? 20 : 16} color={color} />
      </View>
      <Text style={{
        color: theme.textDim,
        fontSize: Math.round((big ? 11 : 10) * fontScale),
        fontWeight: '800',
        letterSpacing: 0.3,
        textAlign: 'center',
      }}>
        {label}
      </Text>
      <Text style={{
        color: theme.text,
        fontSize: Math.round((big ? 18 : 15) * fontScale),
        fontWeight: '900',
        marginTop: 4,
        fontVariant: ['tabular-nums'],
        textAlign: 'center',
      }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={{
        color: theme.textMuted,
        fontSize: Math.round((big ? 10 : 9) * fontScale),
        fontWeight: '600',
        marginTop: 2,
      }}>
        {unit}
      </Text>
    </View>
  );
});

/* ================================================================
   Breakdown Card
   ================================================================ */
const BreakdownRow = memo(({ icon, label, value, subValue, color, isLast, theme, highContrast, fontScale }) => (
  <View style={{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 11,
    borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
    borderBottomColor: highContrast ? theme.border : `${theme.border}88`,
  }}>
    <View style={{
      width: 32, height: 32, borderRadius: 10,
      backgroundColor: `${color}18`, borderWidth: 1, borderColor: `${color}33`,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Ionicons name={icon} size={15} color={color} />
    </View>
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={{
        color: theme.text, fontSize: Math.round(13.5 * fontScale),
        fontWeight: highContrast ? '800' : '700',
      }} numberOfLines={1}>
        {label}
      </Text>
      {subValue ? (
        <Text style={{
          color: theme.textDim, fontSize: Math.round(11 * fontScale),
          fontWeight: '500', marginTop: 1,
        }} numberOfLines={1}>
          {subValue}
        </Text>
      ) : null}
    </View>
    <Text style={{
      color: theme.text, fontSize: Math.round(13.5 * fontScale),
      fontWeight: '900', fontVariant: ['tabular-nums'],
    }}>
      {formatCurrency(value)}
    </Text>
  </View>
));

const BreakdownCard = memo(function BreakdownCard({
  items, totalAssets, totalDebts, netAssets, zekatAmount, isEligible,
  theme, highContrast, fontScale, styles,
}) {
  if (items.length === 0 && totalDebts === 0) return null;

  return (
    <View style={[styles.breakdownCard, {
      backgroundColor: theme.surface,
      borderColor: highContrast ? theme.text : theme.border,
      borderWidth: highContrast ? 2 : 1,
    }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <View style={[styles.breakdownIcon, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}33` }]}>
          <Ionicons name="receipt-outline" size={16} color={theme.primary} />
        </View>
        <Text style={[styles.breakdownTitle, {
          color: theme.text, fontSize: Math.round(13 * fontScale), fontWeight: '900',
        }]}>
          HESAP DÖKÜMÜ
        </Text>
        <Text style={{ color: theme.textDim, fontSize: Math.round(11 * fontScale), fontWeight: '600' }}>
          ({items.length} kalem)
        </Text>
      </View>

      {items.map((item, i) => (
        <BreakdownRow
          key={`${item.label}-${i}`}
          icon={item.icon}
          label={item.label}
          value={item.value}
          subValue={item.subValue}
          color={item.color || theme.primary}
          isLast={i === items.length - 1 && totalDebts <= 0}
          theme={theme}
          highContrast={highContrast}
          fontScale={fontScale}
        />
      ))}

      <View style={{
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 11, paddingHorizontal: 2, marginTop: 4,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: highContrast ? theme.text : theme.border,
      }}>
        <Text style={{ color: theme.text, fontSize: Math.round(12 * fontScale), fontWeight: '900', letterSpacing: 0.3 }}>
          BRÜT VARLIK
        </Text>
        <Text style={{ color: theme.text, fontSize: Math.round(13 * fontScale), fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {formatCurrency(totalAssets)}
        </Text>
      </View>

      {totalDebts > 0 ? (
        <View style={{
          flexDirection: 'row', justifyContent: 'space-between',
          paddingVertical: 11, paddingHorizontal: 2,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: highContrast ? theme.text : theme.border,
        }}>
          <Text style={{ color: '#EF4444', fontSize: Math.round(12 * fontScale), fontWeight: '900', letterSpacing: 0.3 }}>
            DÜŞÜLECEK BORÇLAR
          </Text>
          <Text style={{ color: '#EF4444', fontSize: Math.round(13 * fontScale), fontWeight: '900', fontVariant: ['tabular-nums'] }}>
            − {formatCurrency(totalDebts)}
          </Text>
        </View>
      ) : null}

      <View style={{
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: 12, paddingHorizontal: 2, marginTop: 2,
        borderTopWidth: 1, borderTopColor: theme.primary,
      }}>
        <Text style={{ color: theme.text, fontSize: Math.round(12.5 * fontScale), fontWeight: '900', letterSpacing: 0.4 }}>
          NET VARLIK
        </Text>
        <Text style={{ color: theme.text, fontSize: Math.round(14 * fontScale), fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {formatCurrency(netAssets)}
        </Text>
      </View>

      <View style={{
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingVertical: 12, paddingHorizontal: 10, marginTop: 6, borderRadius: 10,
        backgroundColor: isEligible ? `${theme.primary}15` : `${theme.textDim}10`,
        borderWidth: 1,
        borderColor: isEligible ? `${theme.primary}44` : `${theme.textDim}22`,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name={isEligible ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={isEligible ? theme.primary : theme.textDim} />
          <Text style={{ color: isEligible ? theme.primary : theme.textDim, fontSize: Math.round(11.5 * fontScale), fontWeight: '900', letterSpacing: 0.4 }}>
            ZEKÂT (%2.5)
          </Text>
        </View>
        <Text style={{ color: isEligible ? theme.primary : theme.textDim, fontSize: Math.round(15 * fontScale), fontWeight: '900', fontVariant: ['tabular-nums'] }}>
          {formatCurrency(zekatAmount)}
        </Text>
      </View>
    </View>
  );
});

/* ================================================================
   Ana Ekran
   ================================================================ */
export default function ZekatScreen({ onBack }) {
  const insets = useSafeAreaInsets();
  const getTheme = useAppStore((state) => state.getTheme);
  const theme = getTheme();

  const highContrast = useAppStore((s) => s.highContrast) ?? false;
  const reduceMotion = useAppStore((s) => s.reduceMotion) ?? false;
  const largeTouchTargets = useAppStore((s) => s.largeTouchTargets) ?? false;

  const zekatPrices = useAppStore((s) => s.zekatPrices) || {
    ...DEFAULT_PRICES,
    nisapTL: NISAP_GRAM_ALTIN * DEFAULT_PRICES.goldPerGram,
    source: 'fallback',
    sourceLabel: 'Yerel varsayılan',
  };
  
  const assetData = useAppStore((s) => s.zekatAssetData) || {};
  const setZekatAssetData = useAppStore((s) => s.setZekatAssetData);
  const setZekatPrices = useAppStore((s) => s.setZekatPrices);
  const resetZekatData = useAppStore((s) => s.resetZekatData);

  const readingFontScale = useReadingFontScale();
  const setReadingFontScale = useAppStore((s) => s.setReadingFontScale);

  /* ---------- Basit / Gelişmiş mod ---------- */
  const [mode, setMode] = useState('simple');
  const isSimple = mode === 'simple';

  const effectiveFontScale = isSimple ? Math.max(readingFontScale || 1, 1.12) : (readingFontScale || 1);
  const effectiveLargeTouch = largeTouchTargets || isSimple;

  const fontScale = effectiveFontScale;
  const fontIdx = useMemo(() => {
    const idx = FONT_SCALES.findIndex((v) => Math.abs(v - (readingFontScale || 1)) < 0.01);
    return idx >= 0 ? idx : 0;
  }, [readingFontScale]);

  const styles = useMemo(
    () => createStyles(theme, fontScale, effectiveLargeTouch, isSimple),
    [theme, fontScale, effectiveLargeTouch, isSimple],
  );

  const [activeTab, setActiveTab] = useState('calculate');
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [priceFetchInfo, setPriceFetchInfo] = useState(null);

  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimerRef = useRef(null);
  const showToast = useCallback((message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, visible: true });
    toastTimerRef.current = setTimeout(() => { setToast((p) => ({ ...p, visible: false })); }, 2200);
  }, []);
  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const cycleFontScale = useCallback(() => {
    hapticFeedback('medium');
    const nextIdx = (fontIdx + 1) % FONT_SCALES.length;
    setReadingFontScale(FONT_SCALES[nextIdx]);
    showToast(`Yazı boyutu: ${FONT_LABELS[nextIdx]}`);
  }, [fontIdx, setReadingFontScale, showToast]);

  const [customGoldPrice, setCustomGoldPrice] = useState(String(zekatPrices.goldPerGram ?? DEFAULT_PRICES.goldPerGram).replace('.', ','));
  const [customSilverPrice, setCustomSilverPrice] = useState(String(zekatPrices.silverPerGram ?? DEFAULT_PRICES.silverPerGram).replace('.', ','));
  const [customUsdRate, setCustomUsdRate] = useState(String(zekatPrices.usdRate ?? DEFAULT_PRICES.usdRate).replace('.', ','));
  const [customEurRate, setCustomEurRate] = useState(String(zekatPrices.eurRate ?? DEFAULT_PRICES.eurRate).replace('.', ','));

  const [showManualPrice, setShowManualPrice] = useState(false);

  /* ---------- Rehber state ---------- */
  const [selectedCategory, setSelectedCategory] = useState('hepsi');
  const [infoSearchQuery, setInfoSearchQuery] = useState('');

  /* ---------- Rehber filtre ---------- */
  const availableCategories = useMemo(() => {
    if (isSimple) return ZEKAT_CATEGORIES.filter((c) => SIMPLE_MODE_CATEGORIES.includes(c.id));
    return ZEKAT_CATEGORIES;
  }, [isSimple]);

  const filteredInfo = useMemo(() => {
    const q = normalizeText(infoSearchQuery.trim());
    return ZEKAT_INFO_DATA.filter((item) => {
      if (isSimple && !SIMPLE_MODE_CATEGORIES.includes(item.category)) return false;
      const matchesCategory = selectedCategory === 'hepsi' || item.category === selectedCategory;
      if (!q) return matchesCategory;
      const matchesSearch =
        normalizeText(item.title).includes(q) ||
        normalizeText(item.body).includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, infoSearchQuery, isSimple]);

  const groupedInfo = useMemo(() => {
    const groups = {};
    filteredInfo.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return availableCategories
      .filter((cat) => groups[cat.id]?.length > 0)
      .map((cat) => ({ ...cat, items: groups[cat.id] }));
  }, [filteredInfo, availableCategories]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    ZEKAT_INFO_DATA.forEach((item) => {
      if (isSimple && !SIMPLE_MODE_CATEGORIES.includes(item.category)) return;
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [isSimple]);

  const totalInfoCount = useMemo(() => {
    if (isSimple) return ZEKAT_INFO_DATA.filter((i) => SIMPLE_MODE_CATEGORIES.includes(i.category)).length;
    return ZEKAT_INFO_DATA.length;
  }, [isSimple]);

  const searchActive = infoSearchQuery.trim().length > 0;

  /* ---------- Load prices ---------- */
  const loadLivePrices = useCallback(async (forceRefresh = false) => {
    setLoadingPrices(true);
    setPriceFetchInfo(null);
    try {
      const livePrices = await fetchZekatNisapAndPrices({ forceRefresh });
      if (livePrices) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const xagRes = await fetch('https://api.gold-api.com/price/XAG', { signal: controller.signal });
          clearTimeout(timer);
          if (xagRes.ok) {
            const xagData = await xagRes.json();
            if (xagData.price) {
              const silverGramUsd = xagData.price / (GRAM_PER_TROY_OUNCE || 31.1034768);
              livePrices.silverPerGram = Math.round(silverGramUsd * livePrices.usdRate * 100) / 100;
            }
          }
        } catch (e) {}

        setZekatPrices(livePrices);
        setCustomGoldPrice(String(livePrices.goldPerGram).replace('.', ','));
        setCustomSilverPrice(String(livePrices.silverPerGram).replace('.', ','));
        setCustomUsdRate(String(livePrices.usdRate).replace('.', ','));
        setCustomEurRate(String(livePrices.eurRate).replace('.', ','));

        setPriceFetchInfo({
          source: livePrices.source,
          sourceLabel: livePrices.sourceLabel,
          fromCache: Boolean(livePrices.fromCache),
        });
        showToast('Piyasa fiyatları güncellendi');
      }
    } catch (e) {
      if (__DEV__) console.warn('[Zekat] Fiyat yükleme hatası:', e?.message);
      setPriceFetchInfo({ source: 'error', sourceLabel: 'Bağlantı hatası' });
      showToast('Canlı fiyatlar alınamadı');
    } finally {
      setLoadingPrices(false);
    }
  }, [setZekatPrices, showToast]);

  useEffect(() => { loadLivePrices(false); }, [loadLivePrices]);

  /* ---------- Hesaplamalar ---------- */
  const usdEquivalent = parseAmountScreen(assetData.cashUSD) * (zekatPrices.usdRate || 0);
  const eurEquivalent = parseAmountScreen(assetData.cashEUR) * (zekatPrices.eurRate || 0);
  const goldEquivalent = parseAmountScreen(assetData.goldGram) * (zekatPrices.goldPerGram || 0);
  const silverEquivalent = parseAmountScreen(assetData.silverGram) * (zekatPrices.silverPerGram || 0);

  const effectiveAssetData = useMemo(() => {
    const base = parseAmountScreen(assetData.commercialGoods);
    const extras =
      parseAmountScreen(assetData.stocks) +
      parseAmountScreen(assetData.crypto) +
      parseAmountScreen(assetData.rentalIncome) +
      parseAmountScreen(assetData.pension) +
      parseAmountScreen(assetData.otherAssets);

    if (extras <= 0) return assetData;
    return { ...assetData, commercialGoods: String(base + extras) };
  }, [assetData]);

  const calculationResult = useMemo(
    () => calculateZekat(effectiveAssetData, zekatPrices),
    [effectiveAssetData, zekatPrices],
  );

  const isEligible = calculationResult.isEligible;

  const progressRatio = useMemo(() => {
    if (!calculationResult.nisapTL) return 0;
    return Math.min(1, Math.max(0, calculationResult.netAssets / calculationResult.nisapTL));
  }, [calculationResult]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduceMotion) {
      progressAnim.setValue(progressRatio);
      return;
    }
    Animated.timing(progressAnim, { toValue: progressRatio, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [progressRatio, progressAnim, reduceMotion]);

  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  const sourceBadge = getSourceBadge(zekatPrices.source);

  /* ---------- Detaylı döküm ---------- */
  const detailedBreakdown = useMemo(() => {
    const parse = parseAmountScreen;
    const items = [];

    const cashTL = parse(assetData.cashTL);
    if (cashTL > 0) items.push({ icon: 'cash-outline', label: 'Nakit TL', value: cashTL, color: '#10B981' });

    const cashUSD = parse(assetData.cashUSD);
    if (cashUSD > 0) items.push({
      icon: 'logo-usd', label: 'ABD Doları', value: cashUSD * (zekatPrices.usdRate || 0),
      subValue: `$${cashUSD.toLocaleString('tr-TR')} · Kur: ${zekatPrices.usdRate}`, color: '#10B981',
    });

    const cashEUR = parse(assetData.cashEUR);
    if (cashEUR > 0) items.push({
      icon: 'logo-euro', label: 'Euro', value: cashEUR * (zekatPrices.eurRate || 0),
      subValue: `€${cashEUR.toLocaleString('tr-TR')} · Kur: ${zekatPrices.eurRate}`, color: '#10B981',
    });

    const gold = parse(assetData.goldGram);
    if (gold > 0) items.push({
      icon: 'diamond-outline', label: 'Altın', value: gold * (zekatPrices.goldPerGram || 0),
      subValue: `${gold} gr × ${formatCurrency(zekatPrices.goldPerGram)}`, color: '#F59E0B',
    });

    const silver = parse(assetData.silverGram);
    if (silver > 0) items.push({
      icon: 'medal-outline', label: 'Gümüş', value: silver * (zekatPrices.silverPerGram || 0),
      subValue: `${silver} gr × ${formatCurrency(zekatPrices.silverPerGram)}`, color: '#94A3B8',
    });

    const commercial = parse(assetData.commercialGoods);
    if (commercial > 0) items.push({ icon: 'storefront-outline', label: 'Ticari Mal & Stok', value: commercial, color: '#8B5CF6' });

    const stocks = parse(assetData.stocks);
    if (stocks > 0) items.push({ icon: 'trending-up-outline', label: 'Hisse Senetleri', value: stocks, color: '#06B6D4' });

    const crypto = parse(assetData.crypto);
    if (crypto > 0) items.push({ icon: 'logo-bitcoin', label: 'Kripto Para', value: crypto, color: '#F59E0B' });

    const rentalIncome = parse(assetData.rentalIncome);
    if (rentalIncome > 0) items.push({ icon: 'home-outline', label: 'Kira Birikimi', value: rentalIncome, color: '#EC4899' });

    const pension = parse(assetData.pension);
    if (pension > 0) items.push({ icon: 'shield-outline', label: 'BES Birikimi', value: pension, color: '#6366F1' });

    const otherAssets = parse(assetData.otherAssets);
    if (otherAssets > 0) items.push({ icon: 'add-circle-outline', label: 'Diğer Varlıklar', value: otherAssets, color: '#94A3B8' });

    const receivables = parse(assetData.receivables);
    if (receivables > 0) items.push({ icon: 'receipt-outline', label: 'Kesin Alacaklar', value: receivables, color: '#F472B6' });

    const debts = parse(assetData.debts);
    const totalAssets = items.reduce((sum, item) => sum + item.value, 0);

    return { items, debts, totalAssets };
  }, [assetData, zekatPrices]);

  /* ---------- Handlers ---------- */
  const handleChangeAsset = useCallback((field, val) => {
    let cleanVal = val.replace(/\./g, '').replace(/[^0-9,]/g, '');
    const parts = cleanVal.split(',');
    if (parts.length > 2) cleanVal = parts[0] + ',' + parts.slice(1).join('');
    setZekatAssetData(field, cleanVal);
  }, [setZekatAssetData]);

  const handlePriceInput = (setter) => (val) => {
    let cleanVal = val.replace(/\./g, '').replace(/[^0-9,]/g, '');
    const parts = cleanVal.split(',');
    if (parts.length > 2) cleanVal = parts[0] + ',' + parts.slice(1).join('');
    setter(cleanVal);
  };

  const handleReset = useCallback(() => {
    hapticFeedback('medium');
    Alert.alert('Formu Sıfırla', 'Girdiğiniz tüm varlık verileri silinsin mi?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Sıfırla', style: 'destructive', onPress: () => { resetZekatData(); hapticFeedback('heavy'); showToast('Form sıfırlandı'); } },
    ]);
  }, [resetZekatData, showToast]);

  const handleSavePrices = useCallback(() => {
    hapticFeedback('success');
    const parsedGold = parseAmountScreen(customGoldPrice) || DEFAULT_PRICES.goldPerGram;
    const parsedSilver = parseAmountScreen(customSilverPrice) || DEFAULT_PRICES.silverPerGram;
    const parsedUsd = parseAmountScreen(customUsdRate) || DEFAULT_PRICES.usdRate;
    const parsedEur = parseAmountScreen(customEurRate) || DEFAULT_PRICES.eurRate;

    setZekatPrices({
      goldPerGram: parsedGold, silverPerGram: parsedSilver, usdRate: parsedUsd, eurRate: parsedEur,
      nisapTL: NISAP_GRAM_ALTIN * parsedGold, source: 'manual', sourceLabel: 'Manuel', lastUpdated: Date.now(),
    });
    showToast('Manuel fiyatlar uygulandı');
    setShowManualPrice(false);
  }, [customGoldPrice, customSilverPrice, customUsdRate, customEurRate, setZekatPrices, showToast]);

  const handleShareInfo = useCallback(async () => {
    hapticFeedback('medium');
    try {
      const cat = selectedCategory === 'hepsi' ? null : availableCategories.find((c) => c.id === selectedCategory);
      const cards = cat ? filteredInfo : ZEKAT_INFO_DATA.filter((i) => !isSimple || SIMPLE_MODE_CATEGORIES.includes(i.category));
      const text = [
        `📖 Zekât Rehberi${cat ? ` — ${cat.name}` : ''}`,
        '',
        ...cards.map((c) => `• ${c.title}`),
        '',
        '— Hilal ile paylaşıldı',
      ].join('\n');
      await Share.share({ message: text, title: 'Zekât Rehberi' });
    } catch {}
  }, [selectedCategory, filteredInfo, isSimple, availableCategories]);

  const handleShareResult = useCallback(async () => {
    hapticFeedback('medium');
    try {
      const lines = [
        `🕌 Zekât Hesabı`,
        '',
        `Toplam Varlık: ${formatCurrency(calculationResult.totalAssets || 0)}`,
        `Borçlar: ${formatCurrency(parseAmountScreen(assetData.debts))}`,
        `Net Varlık: ${formatCurrency(calculationResult.netAssets)}`,
        `Nisap: ${formatCurrency(calculationResult.nisapTL)}`,
        '',
        isEligible ? `✅ Zekât Mükellefisiniz` : `ℹ️ Nisap miktarının altındasınız`,
        '',
        `Zekât (%2.5): ${formatCurrency(calculationResult.zekatAmount)}`,
        '',
        '— Hilal ile hesaplandı',
      ];
      await Share.share({ message: lines.join('\n'), title: 'Zekât Hesabı' });
    } catch {}
  }, [calculationResult, assetData, isEligible]);

  const getCategoryColor = (categoryId) => {
    switch (categoryId) {
      case 'temel': return '#3B82F6';
      case 'mala': return '#10B981';
      case 'dusulecek': return '#EF4444';
      case 'kimlere': return '#8B5CF6';
      case 'nasil': return '#F59E0B';
      case 'modern': return '#06B6D4';
      case 'sss': return '#EC4899';
      default: return theme.primary;
    }
  };

  /* ================================================================
     HEADER — Her sekme için ikincil buton eklendi
     ================================================================ */
  const renderHeaderAction = () => {
    if (activeTab === 'calculate') {
      return (
        <TouchableOpacity
          onPress={handleReset}
          style={styles.iconBtn}
          accessibilityLabel="Formu sıfırla"
        >
          <Ionicons name="refresh" size={18 * fontScale} color={theme.primary} />
        </TouchableOpacity>
      );
    }
    if (activeTab === 'prices') {
      // YENİ: Fiyatlar sekmesinde canlı fiyat yenile butonu
      return (
        <TouchableOpacity
          onPress={() => loadLivePrices(true)}
          disabled={loadingPrices}
          style={[styles.iconBtn, loadingPrices && { opacity: 0.6 }]}
          accessibilityLabel="Fiyatları yenile"
          accessibilityState={{ busy: loadingPrices }}
        >
          {loadingPrices ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Ionicons name="cloud-download-outline" size={20 * fontScale} color={theme.primary} />
          )}
        </TouchableOpacity>
      );
    }
    if (activeTab === 'info') {
      return (
        <TouchableOpacity
          onPress={handleShareInfo}
          style={styles.iconBtn}
          accessibilityLabel="Rehberi paylaş"
        >
          <Ionicons name="share-outline" size={18 * fontScale} color={theme.primary} />
        </TouchableOpacity>
      );
    }
    return <View style={{ width: 40 }} />;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.mode === 'light' ? 'dark-content' : 'light-content'} />

      {/* HEADER */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn} accessibilityLabel="Geri" hitSlop={8}>
            <Ionicons name="arrow-back" size={24 * fontScale} color={theme.text} />
          </TouchableOpacity>
        ) : <View style={styles.headerPlaceholder} />}

        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text, fontSize: Math.round(20 * fontScale) }, highContrast && { fontWeight: '800' }]}>
            Zekât Hesaplayıcı
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textDim, fontSize: Math.round(11.5 * fontScale) }]} numberOfLines={1}>
            Nisap: {NISAP_GRAM_ALTIN}g Altın · {formatCompactCurrency(calculationResult.nisapTL)}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity onPress={cycleFontScale} style={[styles.fontBtn, fontIdx > 0 && styles.fontBtnActive]}>
            <Text style={[styles.fontBtnText, fontIdx > 0 && styles.fontBtnTextActive, { fontSize: 12 + fontIdx * 1.5 }]}>{FONT_LABELS[fontIdx]}</Text>
          </TouchableOpacity>
          {renderHeaderAction()}
        </View>
      </View>

      {/* MODE TOGGLE */}
      <ModeToggle
        mode={mode}
        onChange={setMode}
        theme={theme}
        highContrast={highContrast}
        fontScale={fontScale}
        styles={styles}
      />

      {/* TABS */}
      <View style={[styles.tabRow, { backgroundColor: theme.surface, borderColor: highContrast ? theme.text : theme.border }]}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'calculate' && { backgroundColor: theme.primary }]} onPress={() => { hapticFeedback('light'); setActiveTab('calculate'); }}>
          <Ionicons name="calculator-outline" size={15 * fontScale} color={activeTab === 'calculate' ? '#FFF' : theme.textDim} style={{ marginRight: 4 }} />
          <Text style={[styles.tabText, activeTab === 'calculate' && styles.tabTextActive, { fontSize: Math.round(12.5 * fontScale) }]}>Hesapla</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'prices' && { backgroundColor: theme.primary }]} onPress={() => { hapticFeedback('light'); setActiveTab('prices'); }}>
          <Ionicons name="pricetags-outline" size={15 * fontScale} color={activeTab === 'prices' ? '#FFF' : theme.textDim} style={{ marginRight: 4 }} />
          <Text style={[styles.tabText, activeTab === 'prices' && styles.tabTextActive, { fontSize: Math.round(12.5 * fontScale) }]}>Fiyatlar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'info' && { backgroundColor: theme.primary }]} onPress={() => { hapticFeedback('light'); setActiveTab('info'); }}>
          <Ionicons name="book-outline" size={15 * fontScale} color={activeTab === 'info' ? '#FFF' : theme.textDim} style={{ marginRight: 4 }} />
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive, { fontSize: Math.round(12.5 * fontScale) }]}>Rehber</Text>
        </TouchableOpacity>
      </View>

      <Toast message={toast.message} visible={toast.visible} theme={theme} fontScale={fontScale} reduceMotion={reduceMotion} styles={styles} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={[styles.scrollContent, activeTab === 'calculate' && { paddingBottom: Math.max(140, insets.bottom + 100) }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {activeTab === 'calculate' && (
            <>
              {/* SONUÇ KARTI */}
              <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: highContrast ? theme.text : theme.border }, isEligible && { borderColor: theme.primary, borderWidth: 2 }]}>
                <View style={styles.resultTopRow}>
                  <Text style={[styles.resultLabel, highContrast && { color: theme.text, fontWeight: '800' }]}>TOPLAM ZEKÂT (%2.5)</Text>
                  <TouchableOpacity onPress={() => { hapticFeedback('light'); setActiveTab('prices'); }} style={[styles.sourceBadge, { backgroundColor: `${sourceBadge.color}1A`, borderColor: `${sourceBadge.color}55` }]}>
                    <Ionicons name={sourceBadge.icon} size={11} color={sourceBadge.color} />
                    <Text style={[styles.sourceBadgeText, { color: sourceBadge.color }]}>{sourceBadge.label}</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.resultValue, isEligible && { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(calculationResult.zekatAmount)}
                </Text>

                <View style={styles.progressWrap}>
                  <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                    <Animated.View style={[styles.progressFill, { backgroundColor: isEligible ? theme.primary : theme.textDim, width: progressWidth }]} />
                  </View>
                  <View style={styles.progressMeta}>
                    <Text style={[styles.progressText, highContrast && { color: theme.text, fontWeight: '700' }]}>Nisap oranı: %{Math.round(progressRatio * 100)}</Text>
                    <Text style={[styles.progressText, highContrast && { color: theme.text, fontWeight: '700' }]}>Net: {formatCompactCurrency(calculationResult.netAssets)}</Text>
                  </View>
                </View>

                <View style={[styles.statusRow, { backgroundColor: isEligible ? `${theme.primary}11` : 'transparent', padding: isEligible ? 8 : 0, borderRadius: 8 }]}>
                  <Ionicons name={isEligible ? 'checkmark-circle' : 'information-circle'} size={18} color={isEligible ? theme.primary : theme.textDim} />
                  <Text style={[styles.statusText, isEligible && { color: theme.primary, fontWeight: '700' }, highContrast && { color: theme.text }]}>
                    {isEligible ? 'Net varlığınız nisap miktarını aşıyor. Zekât mükellefisiniz.' : 'Net varlığınız nisap miktarının altında.'}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  <TouchableOpacity
                    onPress={handleShareResult}
                    style={[styles.actionBtn, {
                      flex: 1,
                      backgroundColor: highContrast ? '#000' : `${theme.primary}10`,
                      borderColor: highContrast ? '#FFFF00' : `${theme.primary}33`,
                      borderWidth: highContrast ? 2 : 1,
                    }]}
                    accessibilityRole="button"
                    accessibilityLabel="Sonucu paylaş"
                  >
                    <Ionicons name="share-outline" size={14 * fontScale} color={theme.primary} />
                    <Text style={[styles.actionBtnText, { color: theme.primary, fontSize: Math.round(12 * fontScale) }]}>Paylaş</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => { hapticFeedback('light'); setActiveTab('info'); }}
                    style={[styles.actionBtn, {
                      flex: 1.4,
                      backgroundColor: highContrast ? '#000' : `${theme.primary}10`,
                      borderColor: highContrast ? '#FFFF00' : `${theme.primary}33`,
                      borderWidth: highContrast ? 2 : 1,
                    }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Zekât rehberini aç. ${totalInfoCount} bilgi kartı`}
                  >
                    <Ionicons name="book-outline" size={14 * fontScale} color={theme.primary} />
                    <Text style={[styles.actionBtnText, { color: theme.primary, fontSize: Math.round(12 * fontScale) }]}>Rehber · {totalInfoCount}</Text>
                    <Ionicons name="chevron-forward" size={14 * fontScale} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* NAKİT & DÖVİZ */}
              <SectionLabel title={SECTION_META.cash.title} icon="cash-outline" theme={theme} highContrast={highContrast} fontScale={fontScale} styles={styles} />
              <GroupContainer theme={theme} highContrast={highContrast} styles={styles}>
                <View style={{ padding: 14 }}>
                  <View style={styles.inputGroupFull}>
                    <AssetInput
                      label={isSimple ? 'Elinizdeki Nakit' : 'Nakit Türk Lirası'}
                      value={assetData.cashTL || ''}
                      onChangeText={(val) => handleChangeAsset('cashTL', val)}
                      unit="TL"
                      placeholder="0,00"
                      theme={theme}
                      styles={styles}
                      highContrast={highContrast}
                      largeTouchTargets={effectiveLargeTouch}
                    />
                  </View>
                  <View style={styles.inputRow}>
                    <AssetInput
                      label="ABD Doları"
                      value={assetData.cashUSD || ''}
                      onChangeText={(val) => handleChangeAsset('cashUSD', val)}
                      unit="$"
                      placeholder="0,00"
                      hint={usdEquivalent > 0 ? `≈ ${formatCompactCurrency(usdEquivalent)}` : null}
                      theme={theme}
                      styles={styles}
                      highContrast={highContrast}
                      largeTouchTargets={effectiveLargeTouch}
                    />
                    <AssetInput
                      label="Euro"
                      value={assetData.cashEUR || ''}
                      onChangeText={(val) => handleChangeAsset('cashEUR', val)}
                      unit="€"
                      placeholder="0,00"
                      hint={eurEquivalent > 0 ? `≈ ${formatCompactCurrency(eurEquivalent)}` : null}
                      theme={theme}
                      styles={styles}
                      highContrast={highContrast}
                      largeTouchTargets={effectiveLargeTouch}
                    />
                  </View>
                </View>
              </GroupContainer>

              {/* ALTIN & GÜMÜŞ */}
              <SectionLabel title={SECTION_META.gold.title} icon="diamond-outline" theme={theme} highContrast={highContrast} fontScale={fontScale} styles={styles} />
              <GroupContainer theme={theme} highContrast={highContrast} styles={styles}>
                <View style={{ padding: 14 }}>
                  <View style={styles.inputRow}>
                    <AssetInput
                      label={isSimple ? 'Altın' : 'Altın (24 Ayar)'}
                      value={assetData.goldGram || ''}
                      onChangeText={(val) => handleChangeAsset('goldGram', val)}
                      unit="gr"
                      placeholder="0"
                      hint={goldEquivalent > 0 ? `≈ ${formatCompactCurrency(goldEquivalent)}` : null}
                      theme={theme}
                      styles={styles}
                      highContrast={highContrast}
                      largeTouchTargets={effectiveLargeTouch}
                    />
                    <AssetInput
                      label="Gümüş"
                      value={assetData.silverGram || ''}
                      onChangeText={(val) => handleChangeAsset('silverGram', val)}
                      unit="gr"
                      placeholder="0"
                      hint={silverEquivalent > 0 ? `≈ ${formatCompactCurrency(silverEquivalent)}` : null}
                      theme={theme}
                      styles={styles}
                      highContrast={highContrast}
                      largeTouchTargets={effectiveLargeTouch}
                    />
                  </View>
                </View>
              </GroupContainer>

              {/* === GELİŞMİŞ MODDA EKSTRA BÖLÜMLER === */}
              {!isSimple && (
                <>
                  {/* TİCARİ MAL & ALACAK */}
                  <SectionLabel title={SECTION_META.commercial.title} icon="storefront-outline" theme={theme} highContrast={highContrast} fontScale={fontScale} styles={styles} />
                  <GroupContainer theme={theme} highContrast={highContrast} styles={styles}>
                    <View style={{ padding: 14 }}>
                      <View style={styles.inputGroupFull}>
                        <AssetInput
                          label="Ticari Mal ve Stok"
                          value={assetData.commercialGoods || ''}
                          onChangeText={(val) => handleChangeAsset('commercialGoods', val)}
                          unit="TL"
                          placeholder="0,00"
                          theme={theme}
                          styles={styles}
                          highContrast={highContrast}
                          largeTouchTargets={effectiveLargeTouch}
                        />
                      </View>
                      <View style={styles.inputGroupFull}>
                        <AssetInput
                          label="Kesin Tahsil Edilebilir Alacak"
                          value={assetData.receivables || ''}
                          onChangeText={(val) => handleChangeAsset('receivables', val)}
                          unit="TL"
                          placeholder="0,00"
                          theme={theme}
                          styles={styles}
                          highContrast={highContrast}
                          largeTouchTargets={effectiveLargeTouch}
                        />
                      </View>
                    </View>
                  </GroupContainer>

                  {/* YATIRIM & DİĞER */}
                  <SectionLabel
                    title={SECTION_META.invest.title}
                    icon="trending-up-outline"
                    theme={theme}
                    highContrast={highContrast}
                    fontScale={fontScale}
                    styles={styles}
                    subtitle="Borsa, kripto, kira, BES ve diğer birikimler"
                  />
                  <GroupContainer theme={theme} highContrast={highContrast} styles={styles}>
                    <View style={{ padding: 14 }}>
                      <View style={styles.inputRow}>
                        <AssetInput
                          label="Hisse Senedi"
                          value={assetData.stocks || ''}
                          onChangeText={(val) => handleChangeAsset('stocks', val)}
                          unit="TL"
                          placeholder="0,00"
                          theme={theme}
                          styles={styles}
                          highContrast={highContrast}
                          largeTouchTargets={effectiveLargeTouch}
                        />
                        <AssetInput
                          label="Kripto Para"
                          value={assetData.crypto || ''}
                          onChangeText={(val) => handleChangeAsset('crypto', val)}
                          unit="TL"
                          placeholder="0,00"
                          theme={theme}
                          styles={styles}
                          highContrast={highContrast}
                          largeTouchTargets={effectiveLargeTouch}
                        />
                      </View>
                      <View style={styles.inputRow}>
                        <AssetInput
                          label="Kira Birikimi"
                          value={assetData.rentalIncome || ''}
                          onChangeText={(val) => handleChangeAsset('rentalIncome', val)}
                          unit="TL"
                          placeholder="0,00"
                          theme={theme}
                          styles={styles}
                          highContrast={highContrast}
                          largeTouchTargets={effectiveLargeTouch}
                        />
                        <AssetInput
                          label="BES Birikimi"
                          value={assetData.pension || ''}
                          onChangeText={(val) => handleChangeAsset('pension', val)}
                          unit="TL"
                          placeholder="0,00"
                          theme={theme}
                          styles={styles}
                          highContrast={highContrast}
                          largeTouchTargets={effectiveLargeTouch}
                        />
                      </View>
                      <View style={styles.inputGroupFull}>
                        <AssetInput
                          label="Diğer Varlıklar"
                          value={assetData.otherAssets || ''}
                          onChangeText={(val) => handleChangeAsset('otherAssets', val)}
                          unit="TL"
                          placeholder="0,00"
                          theme={theme}
                          styles={styles}
                          highContrast={highContrast}
                          largeTouchTargets={effectiveLargeTouch}
                        />
                      </View>
                    </View>
                  </GroupContainer>
                </>
              )}

              {/* BORÇLAR */}
              <SectionLabel title={SECTION_META.debts.title} icon="remove-circle-outline" theme={theme} highContrast={highContrast} fontScale={fontScale} styles={styles} />
              <GroupContainer theme={theme} highContrast={highContrast} styles={styles}>
                <View style={{ padding: 14 }}>
                  <View style={styles.inputGroupFull}>
                    <AssetInput
                      label={isSimple ? 'Ödeyeceğiniz Borçlar' : 'Kısa Vadeli Düşülecek Borçlar'}
                      value={assetData.debts || ''}
                      onChangeText={(val) => handleChangeAsset('debts', val)}
                      unit="TL"
                      placeholder="0,00"
                      theme={theme}
                      styles={styles}
                      highContrast={highContrast}
                      largeTouchTargets={effectiveLargeTouch}
                    />
                  </View>
                </View>
              </GroupContainer>

              {/* DETAYLI DÖKÜM — sadece gelişmiş modda */}
              {!isSimple && detailedBreakdown.items.length > 0 ? (
                <>
                  <SectionLabel
                    title="Hesap Dökümü"
                    icon="list-outline"
                    theme={theme}
                    highContrast={highContrast}
                    fontScale={fontScale}
                    styles={styles}
                    subtitle="Her kalemin TL karşılığı"
                  />
                  <BreakdownCard
                    items={detailedBreakdown.items}
                    totalAssets={detailedBreakdown.totalAssets}
                    totalDebts={detailedBreakdown.debts}
                    netAssets={calculationResult.netAssets}
                    zekatAmount={calculationResult.zekatAmount}
                    isEligible={isEligible}
                    theme={theme}
                    highContrast={highContrast}
                    fontScale={fontScale}
                    styles={styles}
                  />
                </>
              ) : null}
            </>
          )}

          {/* FİYATLAR SEKMESİ */}
          {activeTab === 'prices' && (
            <>
              <SectionLabel
                title="Güncel Piyasa Fiyatları"
                icon="pricetag-outline"
                theme={theme}
                highContrast={highContrast}
                fontScale={fontScale}
                styles={styles}
                subtitle={zekatPrices.lastUpdated ? `Son güncelleme: ${formatDate(zekatPrices.lastUpdated)}` : null}
              />

              {/* 4 büyük fiyat kartı */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                <PriceCard
                  icon="diamond-outline"
                  label="Altın (gr)"
                  value={formatCurrency(zekatPrices.goldPerGram)}
                  unit="TL / gram"
                  color="#F59E0B"
                  big={isSimple}
                  theme={theme}
                  highContrast={highContrast}
                  fontScale={fontScale}
                />
                <PriceCard
                  icon="medal-outline"
                  label="Gümüş (gr)"
                  value={formatCurrency(zekatPrices.silverPerGram)}
                  unit="TL / gram"
                  color="#94A3B8"
                  big={isSimple}
                  theme={theme}
                  highContrast={highContrast}
                  fontScale={fontScale}
                />
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <PriceCard
                  icon="logo-usd"
                  label="Dolar"
                  value={formatCurrency(zekatPrices.usdRate)}
                  unit="TL / $"
                  color="#10B981"
                  big={isSimple}
                  theme={theme}
                  highContrast={highContrast}
                  fontScale={fontScale}
                />
                <PriceCard
                  icon="logo-euro"
                  label="Euro"
                  value={formatCurrency(zekatPrices.eurRate)}
                  unit="TL / €"
                  color="#6366F1"
                  big={isSimple}
                  theme={theme}
                  highContrast={highContrast}
                  fontScale={fontScale}
                />
              </View>

              {/* Kaynak bilgisi + Yenile butonu */}
              <View style={[styles.sourceInfoCard, {
                backgroundColor: theme.surface,
                borderColor: highContrast ? theme.text : theme.border,
                borderWidth: highContrast ? 2 : 1,
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <View style={[styles.sourceBadge, { backgroundColor: `${sourceBadge.color}1A`, borderColor: `${sourceBadge.color}55` }]}>
                    <Ionicons name={sourceBadge.icon} size={11} color={sourceBadge.color} />
                    <Text style={[styles.sourceBadgeText, { color: sourceBadge.color }]}>{sourceBadge.label}</Text>
                  </View>
                  {!isSimple && zekatPrices.lastUpdated ? (
                    <Text style={[styles.lastUpdatedText, { color: theme.textDim, marginBottom: 0, fontSize: Math.round(11 * fontScale) }]}>
                      {formatDate(zekatPrices.lastUpdated)}
                    </Text>
                  ) : null}
                </View>

                <PressableScale
                  onPress={() => loadLivePrices(true)}
                  disabled={loadingPrices}
                  reduceMotion={reduceMotion}
                  style={[
                    styles.refreshPricesBtn,
                    {
                      backgroundColor: theme.primary,
                      borderColor: theme.primary,
                      borderWidth: 1,
                    },
                    effectiveLargeTouch && { height: 56 },
                    loadingPrices && { opacity: 0.7 },
                  ]}
                >
                  {loadingPrices ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="refresh" size={18 * fontScale} color="#FFF" />
                  )}
                  <Text style={[styles.refreshPricesText, { color: '#FFF', fontSize: Math.round(14 * fontScale) }]}>
                    {loadingPrices ? 'Fiyatlar Yenileniyor…' : 'Fiyatları Yenile'}
                  </Text>
                </PressableScale>
              </View>

              {/* Nisap kartı */}
              <SectionLabel title="Nisap Bilgisi" icon="scale-outline" theme={theme} highContrast={highContrast} fontScale={fontScale} styles={styles} />
              <GroupContainer theme={theme} highContrast={highContrast} styles={styles}>
                <View style={{ padding: 16 }}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoRowLabel, highContrast && { color: theme.text, fontWeight: '700' }]}>Altın Nisap Sınırı</Text>
                    <Text style={[styles.infoRowValue, highContrast && { color: theme.text }]}>{NISAP_GRAM_ALTIN} gram altın</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoRowLabel, highContrast && { color: theme.text, fontWeight: '700' }]}>Güncel Nisap (TL)</Text>
                    <Text style={[styles.infoRowValue, highContrast && { color: theme.text }]}>{formatCurrency(calculationResult.nisapTL)}</Text>
                  </View>
                  <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                    <Text style={[styles.infoRowLabel, highContrast && { color: theme.text, fontWeight: '700' }]}>Zekât Oranı</Text>
                    <Text style={[styles.infoRowValue, highContrast && { color: theme.text }]}>%2.5 (1/40)</Text>
                  </View>
                </View>
              </GroupContainer>

              {/* Manuel fiyat — sadece gelişmiş modda */}
              {!isSimple && (
                <View style={{ marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => { hapticFeedback('light'); setShowManualPrice((s) => !s); }}
                    activeOpacity={0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      padding: 12,
                      borderRadius: 12,
                      backgroundColor: theme.surface,
                      borderWidth: 1,
                      borderColor: theme.border,
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: showManualPrice }}
                    accessibilityLabel="Manuel fiyat ayarları"
                  >
                    <Ionicons name="settings-outline" size={16 * fontScale} color={theme.textDim} />
                    <Text style={{ flex: 1, color: theme.textDim, fontSize: Math.round(12 * fontScale), fontWeight: '700' }}>
                      Gelişmiş: Manuel Fiyat Girişi
                    </Text>
                    <Ionicons name={showManualPrice ? 'chevron-up' : 'chevron-down'} size={16 * fontScale} color={theme.textDim} />
                  </TouchableOpacity>

                  {showManualPrice && (
                    <View style={{ marginTop: 8 }}>
                      <GroupContainer theme={theme} highContrast={highContrast} styles={styles}>
                        <View style={{ padding: 14 }}>
                          <View style={styles.inputRow}>
                            <AssetInput label="Gram Altın" value={customGoldPrice} onChangeText={handlePriceInput(setCustomGoldPrice)} unit="TL" placeholder="0,00" theme={theme} styles={styles} highContrast={highContrast} largeTouchTargets={effectiveLargeTouch} />
                            <AssetInput label="Gram Gümüş" value={customSilverPrice} onChangeText={handlePriceInput(setCustomSilverPrice)} unit="TL" placeholder="0,00" theme={theme} styles={styles} highContrast={highContrast} largeTouchTargets={effectiveLargeTouch} />
                          </View>
                          <View style={styles.inputRow}>
                            <AssetInput label="Dolar Kuru" value={customUsdRate} onChangeText={handlePriceInput(setCustomUsdRate)} unit="TL" placeholder="0,00" theme={theme} styles={styles} highContrast={highContrast} largeTouchTargets={effectiveLargeTouch} />
                            <AssetInput label="Euro Kuru" value={customEurRate} onChangeText={handlePriceInput(setCustomEurRate)} unit="TL" placeholder="0,00" theme={theme} styles={styles} highContrast={highContrast} largeTouchTargets={effectiveLargeTouch} />
                          </View>
                          <PressableScale
                            onPress={handleSavePrices}
                            reduceMotion={reduceMotion}
                            style={[styles.saveBtn, { backgroundColor: theme.primary, borderColor: theme.primary, borderWidth: 1 }]}
                          >
                            <Ionicons name="checkmark-circle" size={18 * fontScale} color="#FFF" />
                            <Text style={[styles.saveBtnText, { color: '#FFF', fontSize: Math.round(14 * fontScale) }]}>Manuel Fiyatları Uygula</Text>
                          </PressableScale>
                        </View>
                      </GroupContainer>
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {/* REHBER SEKMESİ */}
          {activeTab === 'info' && (
            <>
              <View style={[styles.infoHeroCard, {
                backgroundColor: highContrast ? '#000000' : theme.surface,
                borderColor: highContrast ? '#FFFF00' : theme.border,
                borderWidth: highContrast ? 2 : 1,
              }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.infoHeroIcon, {
                    backgroundColor: highContrast ? '#1A1A00' : `${theme.primary}15`,
                    borderColor: highContrast ? '#FFFF00' : `${theme.primary}33`,
                  }]}>
                    <Ionicons name="book" size={24 * fontScale} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.infoHeroTitle, { color: theme.text, fontSize: Math.round(17 * fontScale), fontWeight: '900' }]}>
                      Zekât Rehberi
                    </Text>
                    <Text style={[styles.infoHeroSub, { color: theme.textDim, fontSize: Math.round(12.5 * fontScale) }]}>
                      {totalInfoCount} bilgi kartı · {availableCategories.length} kategori
                      {isSimple ? ' · Sade mod' : ''}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={[styles.infoSearchWrap, {
                backgroundColor: theme.surface,
                borderColor: highContrast ? theme.text : theme.border,
                borderWidth: highContrast ? 2 : 1,
              }]}>
                <Ionicons name="search" size={18 * fontScale} color={theme.textDim} />
                <TextInput
                  value={infoSearchQuery}
                  onChangeText={setInfoSearchQuery}
                  placeholder="Rehberde ara…"
                  placeholderTextColor={theme.textMuted}
                  style={[styles.infoSearchInput, { color: theme.text, fontSize: Math.round(14 * fontScale) }]}
                  returnKeyType="search"
                  autoCorrect={false}
                  accessibilityLabel="Rehberde ara"
                />
                {infoSearchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => { hapticFeedback('light'); setInfoSearchQuery(''); }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Aramayı temizle"
                  >
                    <Ionicons name="close-circle" size={18 * fontScale} color={theme.textDim} />
                  </TouchableOpacity>
                )}
              </View>

              {!searchActive && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingHorizontal: 2, paddingBottom: 4 }}
                  style={{ marginTop: 12, marginBottom: 10 }}
                >
                  <CategoryChip
                    category={{ id: 'hepsi', name: 'Tümü', icon: 'apps-outline' }}
                    count={totalInfoCount}
                    isActive={selectedCategory === 'hepsi'}
                    onPress={() => { hapticFeedback('light'); setSelectedCategory('hepsi'); }}
                    theme={theme}
                    fontScale={fontScale}
                    styles={styles}
                    highContrast={highContrast}
                  />
                  {availableCategories.map((cat) => (
                    <CategoryChip
                      key={cat.id}
                      category={cat}
                      count={categoryCounts[cat.id] || 0}
                      isActive={selectedCategory === cat.id}
                      onPress={() => { hapticFeedback('light'); setSelectedCategory(cat.id); }}
                      theme={theme}
                      fontScale={fontScale}
                      styles={styles}
                      highContrast={highContrast}
                    />
                  ))}
                </ScrollView>
              )}

              <View style={{ paddingHorizontal: 4, marginVertical: 8 }}>
                <Text style={{ color: theme.textDim, fontSize: Math.round(12 * fontScale), fontWeight: '700' }}>
                  {filteredInfo.length} kart gösteriliyor
                  {selectedCategory !== 'hepsi' && !searchActive ? ` · ${availableCategories.find((c) => c.id === selectedCategory)?.name}` : ''}
                  {searchActive ? ` · "${infoSearchQuery.trim()}"` : ''}
                </Text>
              </View>

              {filteredInfo.length === 0 ? (
                <View style={[styles.emptyInfoCard, {
                  backgroundColor: theme.surface,
                  borderColor: highContrast ? theme.text : theme.border,
                  borderWidth: highContrast ? 2 : 1,
                }]}>
                  <Ionicons name="search-outline" size={36 * fontScale} color={theme.textMuted} />
                  <Text style={{ color: theme.text, fontSize: Math.round(15 * fontScale), fontWeight: '800', marginTop: 10 }}>
                    Sonuç bulunamadı
                  </Text>
                  <Text style={{
                    color: theme.textDim,
                    fontSize: Math.round(13 * fontScale),
                    textAlign: 'center',
                    marginTop: 6,
                    lineHeight: Math.round(19 * fontScale),
                  }}>
                    "{infoSearchQuery.trim()}" için uygun bilgi kartı yok.{'\n'}Farklı bir kelime deneyin.
                  </Text>
                </View>
              ) : (
                groupedInfo.map((group) => {
                  const catColor = getCategoryColor(group.id);
                  return (
                    <View key={group.id} style={{ marginBottom: 12 }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        paddingHorizontal: 4,
                        marginTop: 14,
                        marginBottom: 10,
                      }}>
                        <View style={{
                          width: 28, height: 28, borderRadius: 9,
                          backgroundColor: `${catColor}20`, borderWidth: 1, borderColor: `${catColor}40`,
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Ionicons name={group.icon} size={14 * fontScale} color={catColor} />
                        </View>
                        <Text style={{
                          color: theme.text, fontSize: Math.round(14.5 * fontScale),
                          fontWeight: '900', letterSpacing: 0.2,
                        }}>
                          {group.name}
                        </Text>
                        <View style={{
                          backgroundColor: `${catColor}20`,
                          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                        }}>
                          <Text style={{
                            color: catColor, fontSize: Math.round(11 * fontScale), fontWeight: '900',
                          }}>
                            {group.items.length}
                          </Text>
                        </View>
                        <View style={{ flex: 1, height: 1, backgroundColor: theme.border, opacity: 0.4 }} />
                      </View>

                      {group.items.map((item) => (
                        <ExpandableInfoCard
                          key={item.id}
                          data={item}
                          theme={theme}
                          styles={styles}
                          highContrast={highContrast}
                          categoryColor={catColor}
                        />
                      ))}
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>

        {/* STICKY BOTTOM */}
        {activeTab === 'calculate' && (
          <View style={[styles.stickyBar, { backgroundColor: theme.surface, borderTopColor: highContrast ? theme.text : theme.border }]}>
            <View style={[styles.stickyProgressTrack, { backgroundColor: theme.border }]}>
              <Animated.View style={[styles.stickyProgressFill, { width: progressWidth, backgroundColor: isEligible ? theme.primary : theme.textDim }]} />
            </View>
            <View style={styles.stickyContent}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.stickyLabel, highContrast && { color: theme.text, fontWeight: '900' }]}>VERİLECEK ZEKÂT</Text>
                <Text style={[styles.stickyAmount, isEligible && { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>
                  {formatCurrency(calculationResult.zekatAmount)}
                </Text>
              </View>
              <View style={styles.stickyRight}>
                <View style={[styles.stickyStatusChip, {
                  backgroundColor: isEligible ? `${theme.primary}1A` : `${theme.textDim}1A`,
                  borderColor: isEligible ? `${theme.primary}55` : `${theme.textDim}33`,
                }]}>
                  <Ionicons name={isEligible ? 'checkmark-circle' : 'ellipse-outline'} size={12} color={isEligible ? theme.primary : theme.textDim} />
                  <Text style={[styles.stickyStatusText, { color: isEligible ? theme.primary : theme.textDim }]}>
                    {isEligible ? 'Mükellef' : 'Nisap Altı'}
                  </Text>
                </View>
                <Text style={[styles.stickyNet, highContrast && { color: theme.text, fontWeight: '800' }]}>
                  Net: {formatCompactCurrency(calculationResult.netAssets)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
function createStyles(theme, fontScale = 1, largeTouchTargets = false, isSimple = false) {
  const f = (size) => Math.round(size * fontScale);

  return StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: f(18), fontWeight: '800', letterSpacing: 0.3 },
    headerSubtitle: { color: theme.textDim, fontSize: f(11.5), marginTop: 2, fontWeight: '600' },
    headerPlaceholder: { width: 40, height: 40 },
    headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center' },
    fontBtn: { minWidth: 44, height: 40, borderRadius: 20, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8 },
    fontBtnActive: { backgroundColor: `${theme.primary}18`, borderColor: theme.primary },
    fontBtnText: { color: theme.text, fontWeight: '900' },
    fontBtnTextActive: { color: theme.primary },

    /* Mode Toggle */
    modeToggleRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 4,
      marginBottom: 8,
      padding: 4,
      borderRadius: 14,
      gap: 4,
    },
    modeToggleBtn: {
      flex: 1,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 10,
      minHeight: 40,
    },
    modeToggleText: { fontWeight: '900', letterSpacing: 0.2 },

    /* Tabs */
    tabRow: { flexDirection: 'row', marginHorizontal: 16, marginVertical: 6, padding: 4, borderRadius: 14, borderWidth: 1 },
    tabBtn: { flex: 1, paddingVertical: largeTouchTargets ? 12 : 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
    tabText: { fontWeight: '800', fontSize: f(12), color: theme.text },
    tabTextActive: { color: '#FFF' },

    scrollContent: { padding: 16, paddingBottom: 40 },

    /* Result */
    resultCard: { padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 16, ...Platform.select({ ios: { shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 3 } }) },
    resultTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    resultLabel: { color: theme.textDim, fontSize: f(11), fontWeight: '800', letterSpacing: 0.5, flex: 1 },
    sourceBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
    sourceBadgeText: { fontSize: f(10), fontWeight: '800' },
    resultValue: { color: theme.text, fontSize: f(32), fontWeight: '900', marginTop: 8 },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 11,
      minHeight: 40,
    },
    actionBtnText: { fontWeight: '800', letterSpacing: 0.2 },
    progressWrap: { marginTop: 14 },
    progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 3 },
    progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    progressText: { fontSize: f(11), fontWeight: '700', color: theme.textDim },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
    statusText: { fontSize: f(12), fontWeight: '600', flex: 1, color: theme.textDim, lineHeight: f(17) },

    /* Section */
    sectionLabelContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 18, marginBottom: 10, marginLeft: 2, gap: 8 },
    sectionIconBox: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
    sectionLabel: { fontSize: f(11.5), fontWeight: '800', letterSpacing: 1 },
    sectionLabelLine: { flex: 1, height: 1, opacity: 0.4, marginLeft: 4 },
    groupContainer: { borderRadius: 18, overflow: 'hidden', marginBottom: 8 },
    sectionTitle: { fontSize: f(12), fontWeight: '900', letterSpacing: 0.5, color: theme.text, flex: 1 },

    /* Inputs */
    inputGroupFull: { marginBottom: 12 },
    inputGroupHalf: { flex: 1 },
    inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    label: {
      fontSize: f(isSimple ? 13.5 : 12),
      fontWeight: '700',
      marginBottom: 6,
      color: theme.textDim,
    },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14,
      borderColor: theme.border, backgroundColor: theme.background,
      paddingLeft: 14, paddingRight: 6,
      height: largeTouchTargets ? 58 : f(50),
    },
    inputInner: {
      flex: 1,
      fontSize: f(isSimple ? 17 : 15),
      fontWeight: '800',
      color: theme.text,
      paddingVertical: 10,
      padding: 0,
    },
    /* YENİ: Badge içinde unit gösterimi */
    inputUnitBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 42,
    },
    inputUnit: {
      fontSize: f(13),
      fontWeight: '900',
      color: theme.textDim,
      letterSpacing: 0.6,
    },
    inputHint: { fontSize: f(11), fontWeight: '700', color: theme.textDim, marginTop: 6, marginLeft: 4 },

    /* Prices */
    sourceInfoCard: { borderRadius: 18, padding: 16, marginBottom: 14 },
    lastUpdatedText: { color: theme.textDim, fontSize: f(11), marginBottom: 12, fontWeight: '600' },
    refreshPricesBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: largeTouchTargets ? 56 : f(50),
      borderRadius: 14,
    },
    refreshPricesText: { fontWeight: '900', fontSize: f(14), letterSpacing: 0.2 },
    infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.3)', marginBottom: 16 },
    infoBannerText: { flex: 1, fontSize: f(12), lineHeight: f(17), color: theme.text, fontWeight: '600' },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: largeTouchTargets ? 56 : f(52),
      borderRadius: 14,
      marginTop: 8,
    },
    saveBtnText: { fontWeight: '900', fontSize: f(14), letterSpacing: 0.2 },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.border },
    infoRowLabel: { color: theme.textDim, fontSize: f(12.5), fontWeight: '600' },
    infoRowValue: { color: theme.text, fontWeight: '800', fontSize: f(12.5) },

    /* Breakdown */
    breakdownCard: { borderRadius: 18, padding: 16, marginBottom: 16 },
    breakdownIcon: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    breakdownTitle: { letterSpacing: 0.4, flex: 1 },

    /* Rehber */
    infoHeroCard: { padding: 18, borderRadius: 18, marginBottom: 14 },
    infoHeroIcon: { width: 52, height: 52, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    infoHeroTitle: { letterSpacing: 0.2 },
    infoHeroSub: { marginTop: 3, fontWeight: '500' },
    infoSearchWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, borderRadius: 12, minHeight: largeTouchTargets ? 56 : 50, marginTop: 4,
    },
    infoSearchInput: { flex: 1, paddingVertical: 12 },
    catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
    catChipText: { fontWeight: '800', letterSpacing: 0.1 },
    catChipBadge: { minWidth: 22, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    catChipBadgeText: { fontWeight: '900', letterSpacing: 0.2 },
    infoCard: { borderRadius: 16, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface, overflow: 'hidden', marginBottom: 10 },
    infoCardHeader: { flexDirection: 'row', alignItems: 'center', padding: largeTouchTargets ? 18 : 16, gap: 12 },
    infoIconBox: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    infoCardTitle: { fontSize: f(15), fontWeight: '800', color: theme.text, letterSpacing: 0.1, lineHeight: f(20) },
    infoCardPreview: { fontSize: f(12.5), fontWeight: '500', marginTop: 4, lineHeight: f(17) },
    infoCardBody: { paddingHorizontal: 18, paddingBottom: 18, paddingTop: 4 },
    infoCardText: { fontSize: f(14), lineHeight: f(23), fontWeight: '500', color: theme.textDim, letterSpacing: 0.1 },
    emptyInfoCard: { padding: 36, borderRadius: 16, alignItems: 'center', marginTop: 12 },

    /* Sticky */
    stickyBar: { borderTopWidth: 1, backgroundColor: theme.surface, ...Platform.select({ ios: { shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 12 } }) },
    stickyProgressTrack: { height: 4 },
    stickyProgressFill: { height: '100%' },
    stickyContent: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, gap: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 14 },
    stickyLabel: { color: theme.textDim, fontSize: f(11), fontWeight: '900', letterSpacing: 0.8 },
    stickyAmount: { color: theme.text, fontSize: f(24), fontWeight: '900', marginTop: 2 },
    stickyRight: { alignItems: 'flex-end', gap: 6 },
    stickyStatusChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
    stickyStatusText: { fontSize: f(10), fontWeight: '900' },
    stickyNet: { fontSize: f(11), fontWeight: '800', color: theme.textDim },

    toast: {
      position: 'absolute', left: 20, right: 20, top: 56,
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 16, paddingVertical: 12, borderRadius: 14,
      zIndex: 100, elevation: 8,
      shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12,
    },
    toastText: { color: '#FFF', fontSize: 13.5, fontWeight: '600', flex: 1 },
  });
}