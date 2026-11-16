// src/screens/ToolsScreen.js
import React, {
  memo, useCallback, useState, useMemo, useRef, useEffect,
} from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  FlatList,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useAppStore,
  useReadingFontScale,
} from '../store/useAppStore';
import { TOPICS } from '../data/ReligiousKnowledgeData';

/* ================================================================
   Haptics
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}

const hapticImpact = (style = 'light') => {
  try {
    const enabled = useAppStore.getState().globalHaptic;
    if (enabled === false) return;
    if (!Haptics?.impactAsync) return;
    const map = Haptics.ImpactFeedbackStyle ?? {};
    const arg = style === 'medium' ? map.Medium : style === 'heavy' ? map.Heavy : map.Light;
    Haptics.impactAsync(arg);
  } catch {}
};

/* ================================================================
   Yazı ölçekleme
   ================================================================ */
const FONT_SCALES = [1.0, 1.15, 1.3];
const FONT_LABELS = ['Aa', 'Aa+', 'Aa++'];
const FONT_NAMES = ['Normal', 'Büyük', 'Çok Büyük'];

/* ================================================================
   Navigasyon durumu (module-level)
   ================================================================ */
const NAV_STATE = {
  pendingReligiousReopen: false,
};

/* ================================================================
   Shadow Tokens
   ================================================================ */
const SHADOW_SM = {
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
};
const SHADOW_LG = {
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.11,
  shadowRadius: 20,
  elevation: 8,
};

/* ================================================================
   Sabitler
   ================================================================ */
const FEATURED_TOOLS = [
  { id: 'quran-reader', title: 'Kur’an', subtitle: 'Kelime kelime', icon: 'book-open-page-variant-outline', iconType: 'mci', route: 'quran-reader', accent: '#B8860B', hcAccent: '#FFD700' },
  { id: 'kible', title: 'Kıble', subtitle: 'Kâbe yönü', icon: 'compass-outline', route: 'qibla', accent: '#4788D9', hcAccent: '#00FFFF' },
  { id: 'zikirmatik', title: 'Zikirmatik', subtitle: 'Esma ve zikir', icon: 'finger-print-outline', route: 'zikir', accent: '#24A875', hcAccent: '#00FF7F' },
];

const WORSHIP_TOOLS = [
  { id: 'dualar', title: 'Dualar', subtitle: 'Dualar ve sureler', icon: 'heart-outline', route: 'dualar' },
  { id: 'takvim', title: 'Dini Takvim', subtitle: 'Hicri tarih ve özel günler', icon: 'calendar-outline', route: 'takvim' },
  { id: 'esma', title: 'Esmaül Hüsna', subtitle: 'Allah’ın 99 ismi ve anlamları', icon: 'star-crescent', iconType: 'mci', route: 'esma' },
  { id: 'terimler', title: 'Dini Sözlük', subtitle: 'İlmihal ve temel kavramlar', icon: 'library-outline', route: 'terimler' },
  { id: 'namaz-rehberi', title: 'Namaz Rehberi', subtitle: 'Kılınış, rekâtlar ve dualar', icon: 'book-open-page-variant-outline', iconType: 'mci', route: 'namaz-rehberi' },
  { id: 'tesbihat', title: 'Namaz Tesbihatı', subtitle: 'Adım adım tespih ve zikirler', icon: 'radio-button-on-outline', route: 'tesbihat' },
];

const GUIDE_TOOLS = [
  { id: 'ramazan', title: 'Ramazan İmsakiyesi', subtitle: 'Sahur ve iftar vakitleri', icon: 'weather-night', iconType: 'mci', route: 'ramazan' },
  { id: 'zekat', title: 'Zekât Hesaplayıcı', subtitle: 'Nakit, altın ve ticaret zekâtı', icon: 'calculator-outline', route: 'zekat' },
];

const LIBRARY_TOOLS = [
  { id: 'siyer', title: 'Siyer-i Nebi', subtitle: 'Peygamber Efendimizin Hayatı', icon: 'book-outline', route: 'siyer' },
  { id: 'veda-hutbesi', title: 'Veda Hutbesi', subtitle: 'Peygamberimizin son hutbesi', icon: 'document-text-outline', route: 'veda-hutbesi' },
  { id: 'ruya-tabirleri', title: 'Rüya Tabirleri', subtitle: 'İslami rüya yorumları', icon: 'cloudy-night-outline', route: 'ruya-tabirleri' },
];

/* ================================================================
   TOPIC_META — dini bilgi konularının görsel metadata haritası
   ================================================================ */
const TOPIC_META = {
  '32-farz':            { icon: 'book-open-variant',        iconType: 'mci', category: 'Farzlar' },
  '54-farz':            { icon: 'format-list-checks',       iconType: 'mci', category: 'Farzlar' },
  'iman-sartlari':      { icon: 'heart-outline',                            category: 'İman & İslam' },
  'islamin-sartlari':   { icon: 'moon-waning-crescent',     iconType: 'mci', category: 'İman & İslam' },
  'namaz-farzlari':     { icon: 'mosque',                   iconType: 'mci', category: 'Namaz' },
  'namaz-sunnetleri':   { icon: 'format-list-bulleted',     iconType: 'mci', category: 'Namaz' },
  'namaz-bozanlar':     { icon: 'alert-outline',                            category: 'Namaz' },
  'namaz-vakitleri':    { icon: 'time-outline',                             category: 'Namaz' },
  'namaz-rekatlari':    { icon: 'format-list-numbered',     iconType: 'mci', category: 'Namaz' },
  'sehiv-secdesi':      { icon: 'checkmark-circle-outline',                 category: 'Namaz' },
  'abdest-farzlari':    { icon: 'water-outline',                            category: 'Taharet' },
  'abdest-bozanlar':    { icon: 'water-off',                iconType: 'mci', category: 'Taharet' },
  'gusul-farzlari':     { icon: 'water',                                    category: 'Taharet' },
  'gusul-gerektirenler':{ icon: 'shower',                   iconType: 'mci', category: 'Taharet' },
  'teyemmum-farzlari':  { icon: 'hand-water',               iconType: 'mci', category: 'Taharet' },
  'oruc-turleri':       { icon: 'food-apple',               iconType: 'mci', category: 'Oruç' },
  'oruc-bozanlar':      { icon: 'food-off',                 iconType: 'mci', category: 'Oruç' },
  'zekat-kimlere':      { icon: 'gift-outline',                             category: 'Zekât' },
  'tevhid-iman':        { icon: 'star-four-points',        iconType: 'mci', category: 'İnanç' },
  'meleklere-iman':     { icon: 'creation',                 iconType: 'mci', category: 'İnanç' },
  'peygamberlere-iman': { icon: 'account-voice',            iconType: 'mci', category: 'İnanç' },
  'kutsal-kitaplar':    { icon: 'book',                     iconType: 'mci', category: 'İnanç' },
  'ahiret-inanci':      { icon: 'weather-sunset-up',        iconType: 'mci', category: 'İnanç' },
  'namaz-cesitleri':    { icon: 'format-list-checks',       iconType: 'mci', category: 'Namaz' },
  'hac-ve-umre':        { icon: 'mosque',                   iconType: 'mci', category: 'Hac' },
  'ahlak-esaslari':     { icon: 'heart-multiple-outline',   iconType: 'mci', category: 'Ahlak' },
};

/* ================================================================
   Statik Dini Konular (Modül seviyesinde tek seferlik ön hesaplama)
   ================================================================ */
const RELIGIOUS_TOPICS = Object.entries(TOPICS).map(([id, topic]) => {
  const meta = TOPIC_META[id] || {
    icon: 'book-outline',
    iconType: undefined,
    category: 'Diğer',
  };

  const itemCount = (topic.groups || []).reduce(
    (sum, g) => sum + (g.items?.length || 0),
    0,
  );

  const subtitleParts = [
    topic.heroTitle || null,
    itemCount > 0 ? `${itemCount} madde` : null,
  ].filter(Boolean);

  return {
    id,
    title: topic.title,
    subtitle: subtitleParts.join(' · '),
    icon: meta.icon,
    iconType: meta.iconType,
    category: meta.category,
  };
});

const RELIGIOUS_TOPIC_COUNT = RELIGIOUS_TOPICS.length;
const RELIGIOUS_CATEGORY_COUNT = new Set(RELIGIOUS_TOPICS.map((t) => t.category)).size;

/* ================================================================
   İslami Dekor
   ================================================================ */
const IslamicDecor = memo(function IslamicDecor({ color, reduceMotion }) {
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return undefined;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 3600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim, reduceMotion]);

  const animatedTransform = reduceMotion
    ? [{ rotate: '22.5deg' }]
    : [
        {
          rotate: floatAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['20deg', '25deg'],
          }),
        },
        {
          translateY: floatAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-3, 3],
          }),
        },
      ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={{
          position: 'absolute',
          right: -60,
          top: -40,
          opacity: 0.045,
          transform: animatedTransform,
        }}
      >
        <MaterialCommunityIcons name="star-crescent" size={220} color={color} />
      </Animated.View>
    </View>
  );
});

/* ================================================================
   ToolIcon — güvenli fallback
   ================================================================ */
const ToolIcon = memo(function ToolIcon({ tool, size = 24, color }) {
  const name = tool?.icon || 'book-outline';
  if (tool?.iconType === 'mci') {
    return <MaterialCommunityIcons name={name} size={size} color={color} />;
  }
  return <Ionicons name={name} size={size} color={color} />;
});

/* ================================================================
   PressableScale — Anında ve Yüksek Tepkime
   ================================================================ */
const PressableScale = memo(function PressableScale({
  onPress, children, style, containerStyle, disabled,
  scaleTo = 0.965, accessibilityLabel, accessibilityRole = 'button',
  haptic = 'light', reduceMotion = false,
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: scaleTo,
      useNativeDriver: true,
      speed: 120,
      bounciness: 2,
    }).start();
  }, [scale, scaleTo, reduceMotion]);

  const pressOut = useCallback(() => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 90,
      bounciness: 4,
    }).start();
  }, [scale, reduceMotion]);

  const handlePress = useCallback((e) => {
    if (haptic) hapticImpact(haptic);
    onPress?.(e);
  }, [onPress, haptic]);

  return (
    <Animated.View style={[containerStyle, !reduceMotion && { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.78}
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
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
   Section Header
   ================================================================ */
const SectionHeader = memo(function SectionHeader({ title, icon, iconType, theme, fs, highContrast }) {
  return (
    <View style={styles.sectionHeaderRow}>
      {icon && (
        iconType === 'mci' ? (
          <MaterialCommunityIcons name={icon} size={fs(18)} color={theme.primary} />
        ) : (
          <Ionicons name={icon} size={fs(18)} color={theme.primary} />
        )
      )}
      <Text style={[styles.sectionLabel, { color: theme.text, fontSize: fs(15), fontWeight: '900' }]}>
        {title.toLocaleUpperCase('tr-TR')}
      </Text>
      <View style={[styles.sectionHeaderLine, { backgroundColor: theme.border, height: highContrast ? 2 : 1 }]} />
    </View>
  );
});

/* ================================================================
   Featured Tile
   ================================================================ */
const FeaturedTile = memo(function FeaturedTile({
  tool, theme, onPress, fs, highContrast, animValue, reduceMotion,
}) {
  const accentColor = highContrast ? (tool.hcAccent || '#FFFF00') : tool.accent;

  const entranceStyle = !reduceMotion && animValue
    ? {
        opacity: animValue,
        transform: [
          {
            translateY: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
          {
            scale: animValue.interpolate({
              inputRange: [0, 1],
              outputRange: [0.92, 1],
            }),
          },
        ],
      }
    : undefined;

  return (
    <Animated.View style={[{ flex: 1 }, entranceStyle]}>
      <PressableScale
        onPress={onPress}
        accessibilityLabel={`${tool.title}. ${tool.subtitle}`}
        haptic="medium"
        reduceMotion={reduceMotion}
        containerStyle={{ flex: 1 }}
        style={[
          styles.featuredTile,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: highContrast ? 2 : 1,
            paddingVertical: fs(22),
            shadowColor: theme.text,
          },
        ]}
      >
        <View style={[styles.featuredIcon, {
          backgroundColor: highContrast ? '#000000' : `${accentColor}1A`,
          width: fs(54), height: fs(54), borderRadius: fs(27),
          borderWidth: highContrast ? 2 : 1, borderColor: highContrast ? '#FFFF00' : `${accentColor}33`,
        }]}>
          <ToolIcon tool={tool} size={fs(26)} color={accentColor} />
        </View>

        <Text
          style={[styles.featuredTitle, { color: theme.text, fontSize: fs(15), fontWeight: highContrast ? '900' : '800' }]}
          numberOfLines={2}
        >
          {tool.title}
        </Text>
        <Text
          style={[styles.featuredSubtitle, { color: theme.textDim, fontSize: fs(12), fontWeight: highContrast ? '700' : '500' }]}
          numberOfLines={2}
        >
          {tool.subtitle}
        </Text>
      </PressableScale>
    </Animated.View>
  );
});

/* ================================================================
   Tool Row
   ================================================================ */
const ToolRow = memo(function ToolRow({ tool, theme, onPress, showBadge = true, fs, isLast, highContrast, reduceMotion }) {
  const disabled = Boolean(tool.badge && showBadge);

  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      reduceMotion={reduceMotion}
      accessibilityLabel={`${tool.title}. ${tool.subtitle}`}
      containerStyle={disabled && { opacity: 0.6 }}
      style={[
        styles.listRow,
        !isLast && { borderBottomWidth: highContrast ? 2 : StyleSheet.hairlineWidth, borderBottomColor: theme.border },
      ]}
    >
      <View style={[
        styles.listIcon,
        {
          backgroundColor: highContrast ? '#000000' : (theme.primaryGlow || theme.surfaceElevated || 'transparent'),
          width: fs(46), height: fs(46), borderRadius: fs(14),
          borderWidth: highContrast ? 2 : 1, borderColor: theme.border,
        },
      ]}>
        <ToolIcon tool={tool} color={disabled ? theme.textMuted : theme.primary} size={fs(24)} />
      </View>

      <View style={styles.listTextContainer}>
        <View style={styles.listTitleRow}>
          <Text
            style={[styles.listTitle, { color: theme.text, fontSize: fs(16), fontWeight: highContrast ? '900' : '800' }]}
            numberOfLines={1}
          >
            {tool.title}
          </Text>
          {disabled && tool.badge && (
            <View style={[styles.badgePill, { backgroundColor: theme.surfaceElevated, borderColor: theme.border, borderWidth: highContrast ? 2 : 1 }]}>
              <Text style={[styles.badgePillText, { color: theme.textDim, fontSize: fs(10) }]}>
                {tool.badge}
              </Text>
            </View>
          )}
        </View>
        <Text
          style={[styles.listSubtitle, { color: theme.textDim, fontSize: fs(13.5), fontWeight: highContrast ? '700' : '500' }]}
          numberOfLines={2}
        >
          {tool.subtitle}
        </Text>
      </View>

      <Ionicons
        name={disabled ? 'time-outline' : 'chevron-forward'}
        size={fs(20)}
        color={theme.textDim}
        style={styles.listChevron}
      />
    </PressableScale>
  );
});

const GroupContainer = memo(function GroupContainer({ children, theme, highContrast }) {
  return (
    <View style={[styles.groupContainer, {
      backgroundColor: theme.surface,
      borderColor: theme.border,
      borderWidth: highContrast ? 2 : 1,
      shadowColor: highContrast ? '#FFFFFF' : '#000000',
    }]}>
      {children}
    </View>
  );
});

/* ================================================================
   Kategori Header
   ================================================================ */
const CategoryHeader = memo(function CategoryHeader({
  label,
  count,
  isFirst,
  theme,
  highContrast,
  fs,
}) {
  return (
    <View style={[
      styles.categoryHeader,
      isFirst && { marginTop: 0 },
    ]}>
      <View style={styles.categoryHeaderRow}>
        <View style={[
          styles.categoryDot,
          { backgroundColor: theme.primary },
        ]} />
        <Text
          accessibilityRole="header"
          style={[
            styles.categoryLabel,
            {
              color: theme.text,
              fontSize: fs(13),
              fontWeight: highContrast ? '900' : '800',
            },
          ]}
        >
          {label.toLocaleUpperCase('tr-TR')}
        </Text>
        <View style={[
          styles.categoryCountBadge,
          {
            backgroundColor: highContrast
              ? '#000000'
              : (theme.primaryGlow || theme.surfaceElevated),
            borderColor: highContrast ? '#FFFFFF' : theme.border,
            borderWidth: highContrast ? 2 : 1,
          },
        ]}>
          <Text style={[
            styles.categoryCountText,
            {
              color: theme.primary,
              fontSize: fs(10),
              fontWeight: '900',
            },
          ]}>
            {count}
          </Text>
        </View>
        <View style={[styles.categoryDivider, { backgroundColor: theme.border }]} />
      </View>
    </View>
  );
});

/* ================================================================
   Topic Card
   ================================================================ */
const TopicCard = memo(function TopicCard({
  item,
  onPress,
  theme,
  highContrast,
  largeTouchTargets,
  reduceMotion,
  fs,
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={`${item.title}. ${item.subtitle}`}
      accessibilityHint="Konuyu açar"
      haptic="light"
      reduceMotion={reduceMotion}
      style={[
        styles.topicCard,
        {
          backgroundColor: highContrast ? '#121212' : theme.surface,
          borderColor: highContrast ? '#FFFFFF' : theme.border,
          borderWidth: highContrast ? 2 : 1,
          minHeight: largeTouchTargets ? 76 : 68,
          paddingVertical: largeTouchTargets ? 18 : 14,
        },
      ]}
    >
      <View
        style={[
          styles.topicIcon,
          {
            backgroundColor: highContrast
              ? '#000000'
              : (theme.primaryGlow || theme.surfaceElevated),
            width: fs(42), height: fs(42), borderRadius: fs(14),
            borderWidth: highContrast ? 2 : 1,
            borderColor: theme.border,
          },
        ]}
      >
        <ToolIcon tool={item} size={fs(22)} color={theme.primary} />
      </View>

      <View style={styles.topicTextCol}>
        <Text
          style={[
            styles.topicTitle,
            {
              color: theme.text,
              fontSize: fs(16),
              fontWeight: highContrast ? '900' : '800',
            },
          ]}
          numberOfLines={2}
        >
          {item.title}
        </Text>
        {!!item.subtitle && (
          <Text
            style={[
              styles.topicSubtitle,
              {
                color: theme.textDim,
                fontSize: fs(13),
                fontWeight: highContrast ? '700' : '500',
              },
            ]}
            numberOfLines={2}
          >
            {item.subtitle}
          </Text>
        )}
      </View>

      <Ionicons
        name="chevron-forward"
        size={fs(20)}
        color={highContrast ? '#FFFFFF' : theme.textDim}
      />
    </PressableScale>
  );
});

/* ================================================================
   Modal — Dinî Bilgiler
   ================================================================ */
function ReligiousModal({
  visible,
  onClose,
  onSelectTopic,
  topics,
  theme,
  fs,
  highContrast,
  largeTouchTargets = false,
  reduceMotion = false,
}) {
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      try {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      } catch {}
    }, 15);
    return () => clearTimeout(t);
  }, [query, visible]);

  const grouped = useMemo(() => {
    const order = [];
    const map = {};
    topics.forEach((item) => {
      const cat = item.category || 'Diğer';
      if (!map[cat]) {
        map[cat] = [];
        order.push(cat);
      }
      map[cat].push(item);
    });
    return order.map((cat) => ({ category: cat, data: map[cat] }));
  }, [topics]);

  const flatData = useMemo(() => {
    const q = String(query).toLocaleLowerCase('tr-TR').trim();
    const arr = [];
    grouped.forEach((g, groupIdx) => {
      const matching = !q
        ? g.data
        : g.data.filter(
            (item) =>
              item.title.toLocaleLowerCase('tr-TR').includes(q) ||
              item.subtitle.toLocaleLowerCase('tr-TR').includes(q),
          );
      if (matching.length) {
        arr.push({
          type: 'category',
          id: `cat-${g.category}`,
          label: g.category,
          count: matching.length,
          isFirst: groupIdx === 0 && arr.length === 0,
        });
        matching.forEach((item) => {
          arr.push({
            type: 'topic',
            id: item.id,
            item,
          });
        });
      }
    });
    return arr;
  }, [grouped, query]);

  const resultCount = useMemo(
    () => flatData.filter((it) => it.type === 'topic').length,
    [flatData],
  );

  const isSearching = query.trim().length > 0;

  return (
    <Modal
      visible={visible}
      animationType={reduceMotion ? 'fade' : 'slide'}
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
            styles.modalContent,
            {
              backgroundColor: theme.background,
              borderColor: theme.border,
              borderWidth: highContrast ? 2 : 1,
              paddingBottom: Math.max(24, insets.bottom + 12),
            },
          ]}
        >
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

          {/* HEADER */}
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <Text
                accessibilityRole="header"
                style={[styles.modalTitle, { color: theme.text, fontSize: fs(22), fontWeight: '900' }]}
                numberOfLines={1}
              >
                Temel Dinî Bilgiler
              </Text>
              <Text
                style={{
                  color: theme.textDim,
                  fontSize: fs(13),
                  marginTop: 4,
                  fontWeight: highContrast ? '700' : '600',
                }}
                numberOfLines={1}
              >
                {isSearching
                  ? `${resultCount} sonuç`
                  : `${topics.length} konu · ${grouped.length} kategori`}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => { hapticImpact(); onClose?.(); }}
              style={[
                styles.modalCloseButton,
                {
                  width: largeTouchTargets ? 52 : 44,
                  height: largeTouchTargets ? 52 : 44,
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                  borderWidth: highContrast ? 2 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={fs(22)} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* ARAMA */}
          <View
            style={[
              styles.modalSearch,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: highContrast ? 2 : 1,
                height: largeTouchTargets ? 54 : 50,
              },
            ]}
          >
            <Ionicons name="search" size={fs(20)} color={theme.primary} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Konu ara…"
              placeholderTextColor={theme.textMuted || theme.textDim}
              style={[styles.modalSearchInput, { color: theme.text, fontSize: fs(16) }]}
              returnKeyType="search"
              accessibilityLabel="Konu ara"
            />
            {!!query && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Aramayı temizle"
              >
                <Ionicons name="close-circle" size={fs(20)} color={theme.textDim} />
              </TouchableOpacity>
            )}
          </View>

          {/* LİSTE */}
          <FlatList
            ref={listRef}
            data={flatData}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modalListContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            initialNumToRender={15}
            maxToRenderPerBatch={15}
            windowSize={9}
            removeClippedSubviews={true}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => {
              if (item.type === 'category') {
                return (
                  <CategoryHeader
                    label={item.label}
                    count={item.count}
                    isFirst={item.isFirst}
                    theme={theme}
                    highContrast={highContrast}
                    fs={fs}
                  />
                );
              }
              return (
                <TopicCard
                  item={item.item}
                  onPress={() => onSelectTopic?.(item.item.id)}
                  theme={theme}
                  highContrast={highContrast}
                  largeTouchTargets={largeTouchTargets}
                  reduceMotion={reduceMotion}
                  fs={fs}
                />
              );
            }}
            ListEmptyComponent={
              <View style={styles.modalEmpty}>
                <View style={[
                  styles.modalEmptyIcon,
                  {
                    backgroundColor: highContrast
                      ? '#000000'
                      : (theme.primaryGlow || theme.surfaceElevated),
                    borderColor: theme.border,
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}>
                  <Ionicons
                    name="search-outline"
                    size={fs(32)}
                    color={theme.primary}
                  />
                </View>
                <Text
                  style={[
                    styles.modalEmptyTitle,
                    {
                      color: theme.text,
                      fontSize: fs(16),
                      fontWeight: '900',
                    },
                  ]}
                >
                  Sonuç bulunamadı
                </Text>
                <Text
                  style={[
                    styles.modalEmptyText,
                    {
                      color: theme.textDim,
                      fontSize: fs(14),
                      fontWeight: highContrast ? '700' : '500',
                    },
                  ]}
                  numberOfLines={2}
                >
                  “{query.trim()}” için uygun konu bulunamadı.
                </Text>
                <TouchableOpacity
                  onPress={() => { hapticImpact(); setQuery(''); }}
                  style={[
                    styles.modalEmptyBtn,
                    {
                      borderColor: theme.primary,
                      borderWidth: highContrast ? 2 : 1,
                      minHeight: largeTouchTargets ? 46 : 40,
                      paddingHorizontal: largeTouchTargets ? 24 : 20,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Aramayı temizle"
                >
                  <Text
                    style={{
                      color: theme.primary,
                      fontSize: fs(14),
                      fontWeight: '800',
                    }}
                  >
                    Aramayı temizle
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

/* ================================================================
   Ana ekran
   ================================================================ */
export default function ToolsScreen({
  onOpenZikir, onOpenDua, onOpenCalendar, onOpenQibla,
  onOpenSettings, onOpenHome, onOpenEsma, onOpenRamazan,
  onOpenZekat, onOpenNamazRehberi, onOpenTesbihat, onOpenQuranReader,
  onOpenReligiousTopic, onBack, onOpenReligiousTerms,
  onOpenSiyer, onOpenVedaHutbesi, onOpenRuyaTabirleri
}) {
  const getTheme = useAppStore((state) => state.getTheme);
  const isSimpleMode = useAppStore((state) => state.isSimpleMode);
  const setReadingFontScale = useAppStore((state) => state.setReadingFontScale);

  const readingFontScale = useReadingFontScale();
  const highContrast = useAppStore((s) => s.highContrast);
  const largeTouchTargets = useAppStore((s) => s.largeTouchTargets) ?? false;

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

  const insets = useSafeAreaInsets();
  const scrollRef = useRef(null);

  const [religiousModalVisible, setReligiousModalVisible] = useState(false);
  const [hasOpenedModal, setHasOpenedModal] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollTopAnim = useRef(new Animated.Value(0)).current;
  const showScrollTopRef = useRef(false);

  const openReligiousModal = useCallback(() => {
    setHasOpenedModal(true);
    setReligiousModalVisible(true);
  }, []);

  useEffect(() => {
    if (NAV_STATE.pendingReligiousReopen) {
      NAV_STATE.pendingReligiousReopen = false;
      const t = setTimeout(() => {
        openReligiousModal();
      }, 30);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [openReligiousModal]);

  const navigateLockRef = useRef(false);

  const fontScale = readingFontScale || 1;
  const fontIdx = useMemo(() => {
    const idx = FONT_SCALES.findIndex((v) => Math.abs(v - fontScale) < 0.01);
    return idx >= 0 ? idx : 0;
  }, [fontScale]);

  const fs = useCallback((base) => Math.round(base * fontScale), [fontScale]);

  const cycleFontScale = useCallback(() => {
    hapticImpact('medium');
    const nextIdx = (fontIdx + 1) % FONT_SCALES.length;
    setReadingFontScale(FONT_SCALES[nextIdx]);
  }, [fontIdx, setReadingFontScale]);

  /* ---------------- Üste Çık Butonu Kontrolü ---------------- */
  const handleScroll = useCallback((event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const shouldShow = offsetY > 220;
    if (shouldShow === showScrollTopRef.current) return;

    showScrollTopRef.current = shouldShow;
    setShowScrollTop(shouldShow);

    if (reduceMotion) {
      scrollTopAnim.setValue(shouldShow ? 1 : 0);
      return;
    }

    Animated.spring(scrollTopAnim, {
      toValue: shouldShow ? 1 : 0,
      speed: 28,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, scrollTopAnim]);

  const handleScrollToTop = useCallback(() => {
    hapticImpact('light');
    scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
  }, [reduceMotion]);

  /* ---------------- Katmanlı Açılış Animasyon Değerleri ---------------- */
  const headerAnim = useRef(new Animated.Value(0)).current;
  const heroAnim = useRef(new Animated.Value(0)).current;
  const featuredAnims = useRef(FEATURED_TOOLS.map(() => new Animated.Value(0))).current;
  const sectionAnims = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const bottomBarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => mounted && setReduceMotion(v));
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => { mounted = false; sub?.remove?.(); };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      headerAnim.setValue(1);
      heroAnim.setValue(1);
      featuredAnims.forEach((v) => v.setValue(1));
      sectionAnims.forEach((v) => v.setValue(1));
      bottomBarAnim.setValue(1);
      return undefined;
    }

    const entrance = Animated.stagger(32, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(heroAnim, {
        toValue: 1,
        speed: 24,
        bounciness: 5,
        useNativeDriver: true,
      }),
      ...featuredAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 1,
          speed: 26,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ),
      ...sectionAnims.map((anim) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ),
      Animated.timing(bottomBarAnim, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    entrance.start();
    return () => entrance.stop();
  }, [headerAnim, heroAnim, featuredAnims, sectionAnims, bottomBarAnim, reduceMotion]);

  const makeSlideStyle = (v, offset = 12) => (
    reduceMotion
      ? undefined
      : {
          opacity: v,
          transform: [{
            translateY: v.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }),
          }],
        }
  );

  const heroAnimStyle = reduceMotion
    ? undefined
    : {
        opacity: heroAnim,
        transform: [
          {
            translateY: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
          },
          {
            scale: heroAnim.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }),
          },
        ],
      };

  const bottomBarAnimStyle = reduceMotion
    ? undefined
    : {
        opacity: bottomBarAnim,
        transform: [{
          translateY: bottomBarAnim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
        }],
      };

  const scrollTopAnimStyle = reduceMotion
    ? { opacity: showScrollTop ? 1 : 0 }
    : {
        opacity: scrollTopAnim,
        transform: [
          {
            translateY: scrollTopAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }),
          },
          {
            scale: scrollTopAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
          },
        ],
      };

  const routeHandlers = useMemo(() => ({
    zikir: onOpenZikir,
    dualar: onOpenDua,
    takvim: onOpenCalendar,
    qibla: onOpenQibla,
    esma: onOpenEsma,
    ramazan: onOpenRamazan,
    zekat: onOpenZekat,
    'namaz-rehberi': onOpenNamazRehberi,
    tesbihat: onOpenTesbihat,
    'quran-reader': onOpenQuranReader,
    terimler: onOpenReligiousTerms,
    siyer: onOpenSiyer,
    'veda-hutbesi': onOpenVedaHutbesi,
    'ruya-tabirleri': onOpenRuyaTabirleri,
  }), [
    onOpenZikir, onOpenDua, onOpenCalendar, onOpenQibla,
    onOpenEsma, onOpenRamazan, onOpenZekat, onOpenNamazRehberi,
    onOpenTesbihat, onOpenQuranReader, onOpenReligiousTerms,
    onOpenSiyer, onOpenVedaHutbesi, onOpenRuyaTabirleri
  ]);

  const handlePress = useCallback((tool) => {
    if (tool.badge) return;
    const handler = routeHandlers[tool.route];
    if (typeof handler === 'function') handler();
  }, [routeHandlers]);

  const handleReligiousTopicPress = useCallback((topicId) => {
    if (navigateLockRef.current) return;
    if (typeof onOpenReligiousTopic !== 'function') return;

    navigateLockRef.current = true;
    hapticImpact();
    setReligiousModalVisible(false);

    setTimeout(() => {
      NAV_STATE.pendingReligiousReopen = true;
      navigateLockRef.current = false;
      onOpenReligiousTopic(topicId);
    }, 100);
  }, [onOpenReligiousTopic]);

  const handleHomePress = useCallback(() => {
    hapticImpact();
    if (onOpenHome) onOpenHome();
    else onBack?.();
  }, [onOpenHome, onBack]);

  const isLight = theme.mode === 'light' && !highContrast;
  const heroBg = highContrast ? '#121212' : (isLight ? '#134E3A' : '#0B231E');
  const heroBorder = highContrast ? '#FFFF00' : (isLight ? '#216E53' : '#1B3D34');
  const shadowColor = highContrast ? '#FFFFFF' : (isLight ? '#134E3A' : '#000000');

  const scrollTopBtnSize = largeTouchTargets ? 54 : 48;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar
        barStyle={highContrast || theme.mode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />

      {/* HEADER */}
      <Animated.View style={[styles.header, makeSlideStyle(headerAnim, -8)]}>
        {onBack ? (
          <TouchableOpacity
            onPress={() => { hapticImpact(); onBack(); }}
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.headerButton, {
              width: largeTouchTargets ? 52 : 48,
              height: largeTouchTargets ? 52 : 48,
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: highContrast ? 2 : 1,
            }]}
          >
            <Ionicons name="arrow-back" size={fs(22)} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerButtonPlaceholder} />
        )}

        <View style={styles.headerTitleContainer}>
          <Text
            accessibilityRole="header"
            style={[styles.headerTitle, { color: theme.text, fontSize: fs(22), fontWeight: '900' }]}
          >
            İslami Araçlar
          </Text>
        </View>

        <TouchableOpacity
          onPress={cycleFontScale}
          accessibilityRole="button"
          accessibilityLabel={`Yazı boyutu: ${FONT_NAMES[fontIdx]}. Değiştirmek için dokunun.`}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.fontButton, {
            width: largeTouchTargets ? 52 : 48,
            height: largeTouchTargets ? 52 : 48,
            backgroundColor: fontIdx > 0
              ? (theme.primaryGlow || `${theme.primary}18`)
              : theme.surface,
            borderColor: fontIdx > 0 ? theme.primary : theme.border,
            borderWidth: highContrast ? 2 : 1,
          }]}
        >
          <Text style={[styles.fontButtonText, {
            color: fontIdx > 0 ? theme.primary : theme.text,
            fontSize: fs(13) + fontIdx * 1,
            fontWeight: '900',
          }]}>
            {FONT_LABELS[fontIdx]}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(24, insets.bottom + 90) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        {!isSimpleMode ? (
          <Animated.View style={heroAnimStyle}>
            <View style={styles.heroShadowContainer}>
              <View style={[styles.heroCard, {
                backgroundColor: heroBg,
                borderColor: heroBorder,
                borderWidth: highContrast ? 2 : 1,
                shadowColor: shadowColor,
              }]}>
                <IslamicDecor
                  color={highContrast ? '#FFFF00' : theme.primary}
                  reduceMotion={reduceMotion}
                />
                <View style={[styles.heroIconGlass, {
                  backgroundColor: highContrast ? '#000000' : 'rgba(255,255,255,0.08)',
                  borderColor: highContrast ? '#FFFF00' : 'rgba(255,255,255,0.15)',
                  borderWidth: highContrast ? 2 : 1,
                  width: fs(54), height: fs(54), borderRadius: fs(18),
                }]}>
                  <MaterialCommunityIcons name="compass-rose" size={fs(28)} color={highContrast ? '#FFFF00' : '#F9F1D8'} />
                </View>
                <View style={styles.heroText}>
                  <Text style={[styles.heroTitle, { color: highContrast ? '#FFFF00' : '#FFFFFF', fontSize: fs(19), fontWeight: '900' }]}>
                    İbadet Rehberiniz
                  </Text>
                  <Text style={[styles.heroSubtitle, { color: highContrast ? '#FFFFFF' : '#C5D5CC', fontSize: fs(14), fontWeight: highContrast ? '700' : '600' }]}>
                    İhtiyacınız olan araçlar elinizin altında.
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
        ) : null}

        {/* ÖNE ÇIKANLAR */}
        <Animated.View style={[styles.section, makeSlideStyle(sectionAnims[0], 10)]}>
          <SectionHeader title="Öne Çıkanlar" icon="star" theme={theme} fs={fs} highContrast={highContrast} />
          <View style={styles.featuredGrid}>
            {FEATURED_TOOLS.map((tool, index) => (
              <FeaturedTile
                key={tool.id}
                tool={tool}
                theme={theme}
                fs={fs}
                highContrast={highContrast}
                animValue={featuredAnims[index]}
                reduceMotion={reduceMotion}
                onPress={() => handlePress(tool)}
              />
            ))}
          </View>
        </Animated.View>

        {/* İBADET */}
        <Animated.View style={[styles.section, makeSlideStyle(sectionAnims[1], 14)]}>
          <SectionHeader title="İbadet" icon="heart" theme={theme} fs={fs} highContrast={highContrast} />
          <GroupContainer theme={theme} highContrast={highContrast}>
            {WORSHIP_TOOLS.map((tool, index) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                theme={theme}
                fs={fs}
                highContrast={highContrast}
                reduceMotion={reduceMotion}
                isLast={index === WORSHIP_TOOLS.length - 1}
                onPress={() => handlePress(tool)}
              />
            ))}
          </GroupContainer>
        </Animated.View>

        {/* DİNÎ BİLGİLER */}
        <Animated.View style={[styles.section, makeSlideStyle(sectionAnims[2], 14)]}>
          <SectionHeader title="Dinî Bilgiler" icon="information-circle" theme={theme} fs={fs} highContrast={highContrast} />
          <GroupContainer theme={theme} highContrast={highContrast}>
            <ToolRow
              tool={{
                id: 'religious-hub',
                title: 'Temel Dinî Bilgiler',
                subtitle: `${RELIGIOUS_TOPIC_COUNT} konu · ${RELIGIOUS_CATEGORY_COUNT} kategori`,
                icon: 'book-open-variant',
                iconType: 'mci',
              }}
              theme={theme}
              fs={fs}
              highContrast={highContrast}
              reduceMotion={reduceMotion}
              showBadge={false}
              isLast={true}
              onPress={() => { hapticImpact(); openReligiousModal(); }}
            />
          </GroupContainer>
        </Animated.View>

        {/* REHBER */}
        <Animated.View style={[styles.section, makeSlideStyle(sectionAnims[3], 14)]}>
          <SectionHeader title="Rehber" icon="compass" theme={theme} fs={fs} highContrast={highContrast} />
          <GroupContainer theme={theme} highContrast={highContrast}>
            {GUIDE_TOOLS.map((tool, index) => (
              <ToolRow
                key={tool.id}
                tool={tool}
                theme={theme}
                fs={fs}
                highContrast={highContrast}
                reduceMotion={reduceMotion}
                isLast={index === GUIDE_TOOLS.length - 1}
                onPress={() => handlePress(tool)}
              />
            ))}
          </GroupContainer>
        </Animated.View>

        {/* KÜTÜPHANE & FOOTER */}
        <Animated.View style={makeSlideStyle(sectionAnims[4], 14)}>
          <View style={styles.section}>
            <SectionHeader title="Kütüphane" icon="library" theme={theme} fs={fs} highContrast={highContrast} />
            <GroupContainer theme={theme} highContrast={highContrast}>
              {LIBRARY_TOOLS.map((tool, index) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  theme={theme}
                  fs={fs}
                  highContrast={highContrast}
                  reduceMotion={reduceMotion}
                  isLast={index === LIBRARY_TOOLS.length - 1}
                  onPress={() => handlePress(tool)}
                />
              ))}
            </GroupContainer>
          </View>

          {!isSimpleMode ? (
            <View style={[styles.infoFooter, {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: highContrast ? 2 : 1,
              ...SHADOW_SM,
              shadowColor: highContrast ? '#FFFFFF' : '#000000',
            }]}>
              <View style={[styles.infoFooterIconWrap, {
                backgroundColor: highContrast ? '#000000' : (theme.primaryGlow || theme.surfaceElevated),
                borderWidth: highContrast ? 2 : 0,
                borderColor: theme.border,
              }]}>
                <Ionicons name="shield-checkmark" size={fs(24)} color={theme.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoTitle, { color: theme.text, fontSize: fs(15), fontWeight: '900' }]}>
                  Sade ve Anlaşılır
                </Text>
                <Text style={[styles.infoDescription, { color: theme.textDim, fontSize: fs(13), fontWeight: highContrast ? '700' : '500' }]}>
                  İhtiyacınıza göre yazı boyutunu sağ üstten ayarlayabilirsiniz.
                </Text>
              </View>
            </View>
          ) : null}
        </Animated.View>
      </ScrollView>

      {/* ÜSTE ÇIK YÜZEN BUTON */}
      <Animated.View
        pointerEvents={showScrollTop ? 'auto' : 'none'}
        style={[
          styles.scrollTopWrap,
          scrollTopAnimStyle,
          { bottom: Math.max(82, insets.bottom + 78) },
        ]}
      >
        <PressableScale
          onPress={handleScrollToTop}
          haptic={false}
          reduceMotion={reduceMotion}
          accessibilityRole="button"
          accessibilityLabel="Sayfanın en üstüne çık"
          style={[
            styles.scrollTopBtn,
            {
              width: scrollTopBtnSize,
              height: scrollTopBtnSize,
              borderRadius: scrollTopBtnSize / 2,
              backgroundColor: highContrast ? '#000000' : (theme.surfaceElevated || theme.surface),
              borderColor: highContrast ? '#FFFF00' : theme.border,
              borderWidth: highContrast ? 2 : 1,
              shadowColor: highContrast ? '#FFFF00' : '#000000',
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={fs(22)}
            color={highContrast ? '#FFFF00' : theme.primary}
          />
        </PressableScale>
      </Animated.View>

      {hasOpenedModal ? (
        <ReligiousModal
          visible={religiousModalVisible}
          onClose={() => setReligiousModalVisible(false)}
          onSelectTopic={handleReligiousTopicPress}
          topics={RELIGIOUS_TOPICS}
          theme={theme}
          fs={fs}
          highContrast={highContrast}
          largeTouchTargets={largeTouchTargets}
          reduceMotion={reduceMotion}
        />
      ) : null}

      {/* BOTTOM BAR */}
      <Animated.View style={[styles.bottomBar, bottomBarAnimStyle, {
        backgroundColor: theme.surfaceElevated || theme.surface,
        borderTopColor: theme.border,
        borderTopWidth: highContrast ? 2 : StyleSheet.hairlineWidth,
        paddingBottom: Math.max(8, insets.bottom),
        shadowColor: theme.text,
      }]}>
        <PressableScale
          onPress={handleHomePress}
          accessibilityRole="tab"
          accessibilityLabel="Ana Sayfa"
          containerStyle={{ flex: 1 }}
          style={styles.bottomBarButton}
          reduceMotion={reduceMotion}
        >
          <Ionicons name="home-outline" size={fs(24)} color={theme.textDim} />
          <Text style={[styles.bottomBarText, { color: theme.textDim, fontSize: fs(11), fontWeight: '700' }]}>
            Ana Sayfa
          </Text>
        </PressableScale>

        <View
          style={styles.bottomBarButton}
          accessibilityRole="tab"
          accessibilityLabel="Araçlar"
          accessibilityState={{ selected: true }}
        >
          <View style={[styles.activeTabIcon, {
            backgroundColor: highContrast ? '#000000' : (theme.primaryGlow || theme.surfaceElevated),
            borderWidth: highContrast ? 2 : 0,
            borderColor: theme.border,
            width: fs(46), height: fs(34), borderRadius: fs(14),
          }]}>
            <Ionicons name="grid" size={fs(22)} color={theme.primary} />
          </View>
          <Text style={[styles.bottomBarText, {
            color: theme.primary,
            fontWeight: '900',
            fontSize: fs(11),
          }]}>
            Araçlar
          </Text>
        </View>

        <PressableScale
          onPress={onOpenSettings}
          disabled={!onOpenSettings}
          accessibilityRole="tab"
          accessibilityLabel="Ayarlar"
          containerStyle={{ flex: 1, opacity: onOpenSettings ? 1 : 0.5 }}
          style={styles.bottomBarButton}
          reduceMotion={reduceMotion}
        >
          <Ionicons name="settings-outline" size={fs(24)} color={theme.textDim} />
          <Text style={[styles.bottomBarText, { color: theme.textDim, fontSize: fs(11), fontWeight: '700' }]}>
            Ayarlar
          </Text>
        </PressableScale>
      </Animated.View>
    </SafeAreaView>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16,
  },
  headerButton: {
    width: 48, height: 48, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  headerButtonPlaceholder: { width: 48, height: 48 },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontWeight: '900', letterSpacing: 0.2 },

  fontButton: {
    width: 48, height: 48, borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  fontButtonText: { fontWeight: '900' },

  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  heroShadowContainer: {
    ...SHADOW_LG,
    marginBottom: 26,
  },
  heroCard: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 28, paddingHorizontal: 22, paddingVertical: 26, gap: 18,
    overflow: 'hidden', position: 'relative',
  },
  heroIconGlass: {
    alignItems: 'center', justifyContent: 'center', borderWidth: 1,
  },
  heroText: { flex: 1 },
  heroTitle: { fontWeight: '900', letterSpacing: 0.2 },
  heroSubtitle: { lineHeight: 22, marginTop: 6, fontWeight: '600' },

  section: { marginBottom: 30 },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginLeft: 2, gap: 10,
  },
  sectionLabel: { fontWeight: '900', letterSpacing: 0.5 },
  sectionHeaderLine: { flex: 1, height: 1, opacity: 0.5 },

  featuredGrid: { flexDirection: 'row', gap: 12 },
  featuredTile: {
    paddingHorizontal: 10, paddingVertical: 22,
    borderRadius: 24, borderWidth: 1, alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_SM,
  },
  featuredIcon: {
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  featuredTitle: { fontWeight: '900', textAlign: 'center', width: '100%', flexShrink: 1 },
  featuredSubtitle: { textAlign: 'center', marginTop: 4, fontWeight: '500', flexShrink: 1 },

  groupContainer: {
    borderRadius: 24, borderWidth: 1, overflow: 'hidden',
    ...SHADOW_SM,
  },

  listRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 18, gap: 16,
  },
  listIcon: {
    alignItems: 'center', justifyContent: 'center',
  },
  listTextContainer: { flex: 1, minWidth: 0 },
  listTitleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap',
  },
  listTitle: { fontWeight: '800', flexShrink: 1 },
  listSubtitle: { marginTop: 5, fontWeight: '500', lineHeight: 18 },
  listChevron: { flexShrink: 0 },
  badgePill: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  badgePillText: { fontWeight: '800' },

  infoFooter: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 24, borderWidth: 1, padding: 20, marginTop: 10, gap: 18,
  },
  infoFooterIconWrap: {
    width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
  },
  infoTextContainer: { flex: 1 },
  infoTitle: { fontWeight: '900' },
  infoDescription: { lineHeight: 22, marginTop: 6, fontWeight: '500' },

  /* ÜSTE ÇIK BUTONU */
  scrollTopWrap: {
    position: 'absolute',
    right: 20,
    zIndex: 20,
  },
  scrollTopBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOW_LG,
  },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    paddingTop: 12, paddingHorizontal: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 15,
  },
  bottomBarButton: {
    flex: 1, minHeight: 58, alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  activeTabIcon: {
    alignItems: 'center', justifyContent: 'center',
  },
  bottomBarText: { fontWeight: '700' },

  /* MODAL */
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: {
    maxHeight: '92%',
    borderTopLeftRadius: 36, borderTopRightRadius: 36,
    borderWidth: 1, paddingHorizontal: 20, paddingTop: 14,
  },
  modalHandle: {
    width: 48, height: 5, borderRadius: 3,
    alignSelf: 'center', marginBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16, gap: 12,
  },
  modalTitle: { fontWeight: '900', letterSpacing: -0.2 },
  modalCloseButton: {
    borderRadius: 16, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  modalSearch: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, borderRadius: 18, borderWidth: 1, marginBottom: 12,
  },
  modalSearchInput: { flex: 1, paddingVertical: 0, fontWeight: '500' },
  modalListContent: { paddingBottom: 16 },

  /* Kategori header */
  categoryHeader: {
    marginTop: 20,
    marginBottom: 12,
  },
  categoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryLabel: {
    letterSpacing: 0.8,
  },
  categoryCountBadge: {
    minWidth: 22,
    height: 18,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCountText: {
    letterSpacing: 0.2,
  },
  categoryDivider: {
    flex: 1,
    height: 1,
    opacity: 0.5,
    marginLeft: 4,
  },

  /* Topic card */
  topicCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 18,
    gap: 14,
  },
  topicIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  topicTextCol: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  topicTitle: {
    fontWeight: '800',
    letterSpacing: -0.1,
  },
  topicSubtitle: {
    fontWeight: '500',
  },

  /* Modal boş durum */
  modalEmpty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 10,
  },
  modalEmptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  modalEmptyTitle: {
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  modalEmptyText: {
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
  },
  modalEmptyBtn: {
    marginTop: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});