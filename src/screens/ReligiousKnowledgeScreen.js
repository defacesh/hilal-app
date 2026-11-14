// src/screens/ReligiousKnowledgeScreen.js
// Temel Dinî Bilgiler — kompakt liste + sayfalı okuma modalı.
// Yeni konularla gelen çoklu bölümler için sticky bölüm navigator.
// Erişilebilirlik uyumu: highContrast, readingFontScale, isSimpleMode,
// largeTouchTargets, reduceMotion, globalHaptic, dyslexiaFont (AppText).
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  memo,
} from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  FlatList,
  Share,
  useWindowDimensions,
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  useAppStore,
  useReadingFontScale,
} from '../store/useAppStore';
import {
  TOPICS,
  EXPLANATIONS,
  FALLBACK_EXPLANATION,
} from '../data/ReligiousKnowledgeData';

/* ================================================================
   Haptics
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}

const hapticLight = () => {
  try {
    if (useAppStore.getState().globalHaptic === false) return;
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return;
    const map = Haptics.ImpactFeedbackStyle ?? {};
    Haptics.impactAsync(map.Light);
  } catch {}
};

/* ================================================================
   Sabitler
   ================================================================ */
const TOUCH = Object.freeze({
  small: 40,
  smallBig: 48,
  rowMin: 56,
  rowMinBig: 68,
  readerBtn: 48,
  readerBtnBig: 56,
  chip: 36,
  chipBig: 44,
});

/* ================================================================
   Bölüm navigator (sticky)
   ----------------------------------------------------------------
   Grup sayısı 2'den fazlaysa gösterilir. Scroll ile aktif bölüm
   otomatik güncellenir. Aktif chip her zaman görünür alana
   otomatik kaydırılır (uzun bölüm listeleri için).
   ================================================================ */
const ChipNav = memo(function ChipNav({
  groups,
  activeIndex,
  onPress,
  theme,
  highContrast,
  largeTouchTargets,
  reduceMotion,
  fs,
  onLayout,
}) {
  const chipSize = largeTouchTargets ? TOUCH.chipBig : TOUCH.chip;
  const scrollRef = useRef(null);
  const itemWidth = chipSize + 6; // chip genişliği + gap

  /* Aktif chip'i görünür alana otomatik kaydır */
  useEffect(() => {
    if (!scrollRef.current) return;
    const targetX = Math.max(0, activeIndex * itemWidth - itemWidth * 2);
    try {
      scrollRef.current.scrollTo({
        x: targetX,
        animated: !reduceMotion,
      });
    } catch {}
  }, [activeIndex, itemWidth, reduceMotion]);

  return (
    <View
      onLayout={onLayout}
      style={[
        styles.chipNav,
        {
          backgroundColor: theme.background,
          borderBottomColor: highContrast ? '#FFFFFF' : theme.border,
          borderBottomWidth: highContrast ? 2 : StyleSheet.hairlineWidth,
        },
      ]}
    >
      <View style={styles.chipNavInner}>
        <Text
          style={[
            styles.chipNavLabel,
            {
              color: highContrast ? '#FFFFFF' : theme.textMuted,
              fontSize: fs(10),
              fontWeight: '900',
            },
          ]}
        >
          BÖLÜM
        </Text>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={styles.chipNavContent}
        >
          {groups.map((g, i) => {
            const isActive = i === activeIndex;
            return (
              <TouchableOpacity
                key={`${g.group?.title ?? 'g'}-${i}`}
                onPress={() => onPress(i)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel={`Bölüm ${i + 1}: ${g.group?.title ?? ''}${isActive ? ', aktif' : ''}`}
                accessibilityState={{ selected: isActive }}
                style={[
                  styles.chipNavChip,
                  {
                    width: chipSize,
                    height: chipSize,
                    backgroundColor: isActive ? theme.primary : theme.surface,
                    borderColor: isActive ? theme.primary : theme.border,
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipNavChipText,
                    {
                      color: isActive
                        ? (highContrast ? '#000000' : '#FFFFFF')
                        : theme.text,
                      fontSize: fs(13),
                      fontWeight: '900',
                    },
                  ]}
                >
                  {i + 1}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
});

/* ================================================================
   Liste satırı
   ================================================================ */
const ItemRow = memo(function ItemRow({
  item,
  onPress,
  theme,
  highContrast,
  largeTouchTargets,
  fs,
}) {
  const badgeSize = largeTouchTargets ? 40 : 34;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.itemRow,
        {
          backgroundColor: highContrast ? '#121212' : theme.surface,
          borderColor: highContrast ? '#FFFFFF' : theme.border,
          borderWidth: highContrast ? 2 : 1,
          paddingVertical: largeTouchTargets ? 16 : 12,
          minHeight: largeTouchTargets ? TOUCH.rowMinBig : TOUCH.rowMin,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.groupTitle}, ${item.groupItemIndex + 1} / ${item.groupItemCount}. Aç.`}
      accessibilityHint="Okuma görünümünde açar"
    >
      <View
        style={[
          styles.itemRowBadge,
          {
            backgroundColor: highContrast
              ? '#000000'
              : (theme.primaryGlow || theme.surfaceElevated),
            borderColor: highContrast ? '#FFFFFF' : 'transparent',
            borderWidth: highContrast ? 2 : 0,
            width: badgeSize,
            height: badgeSize,
            borderRadius: Math.round(badgeSize * 0.32),
          },
        ]}
      >
        <Text
          style={[
            styles.itemRowBadgeText,
            {
              color: theme.primary,
              fontSize: fs(13),
              fontWeight: '900',
            },
          ]}
        >
          {item.groupItemIndex + 1}
        </Text>
      </View>

      <Text
        style={[
          styles.itemRowTitle,
          {
            color: theme.text,
            fontSize: fs(14),
            lineHeight: fs(20),
            fontWeight: highContrast ? '900' : '700',
          },
        ]}
        numberOfLines={2}
      >
        {item.title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={fs(18)}
        color={highContrast ? '#FFFFFF' : theme.textMuted}
      />
    </TouchableOpacity>
  );
});

/* ================================================================
   Reader tek sayfa
   ================================================================ */
const ReaderPage = memo(function ReaderPage({
  item,
  theme,
  highContrast,
  width,
  fs,
}) {
  return (
    <View style={{ width }}>
      <ScrollView
        contentContainerStyle={styles.readerPageContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.readerEyebrowRow}>
          <View
            style={[
              styles.readerEyebrowPill,
              { backgroundColor: theme.primaryGlow || theme.surfaceElevated },
            ]}
          >
            <Text
              style={[
                styles.readerEyebrowText,
                {
                  color: theme.primary,
                  fontSize: fs(10),
                  fontWeight: highContrast ? '900' : '800',
                },
              ]}
              numberOfLines={1}
            >
              {item.groupTitle}
            </Text>
          </View>
          <Text
            style={[
              styles.readerEyebrowMeta,
              {
                color: highContrast ? '#E0E0E0' : theme.textMuted,
                fontSize: fs(11),
                fontWeight: highContrast ? '700' : '600',
              },
            ]}
          >
            {item.groupItemIndex + 1} / {item.groupItemCount}
          </Text>
        </View>

        <Text
          style={[
            styles.readerTitle,
            {
              color: theme.text,
              fontSize: fs(26),
              lineHeight: fs(34),
              fontWeight: '900',
            },
          ]}
        >
          {item.title}
        </Text>

        <View
          style={[
            styles.readerDivider,
            { backgroundColor: highContrast ? '#FFFFFF' : theme.border },
          ]}
        />

        <Text
          style={[
            styles.readerBody,
            {
              color: theme.text,
              fontSize: fs(16),
              lineHeight: fs(27),
              fontWeight: highContrast ? '700' : '500',
            },
          ]}
        >
          {item.explanation}
        </Text>
      </ScrollView>
    </View>
  );
});

/* ================================================================
   Reader modal
   ================================================================ */
function ItemReaderModal({
  items,
  initialIndex,
  onClose,
  theme,
  highContrast,
  largeTouchTargets,
  reduceMotion,
  fs,
  topicTitle,
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef(null);

  const safeStartIndex = Math.min(
    Math.max(initialIndex, 0),
    Math.max(items.length - 1, 0),
  );

  const [index, setIndex] = useState(safeStartIndex);

  const currentItem = items[index];

  /* Modal açıldığında doğru sayfaya atla — initialScrollIndex
     başarısız olursa scrollToOffset ile tekrar dene */
  useEffect(() => {
    let raf = null;
    const t = setTimeout(() => {
      try {
        listRef.current?.scrollToOffset({
          offset: safeStartIndex * width,
          animated: false,
        });
        raf = requestAnimationFrame(() => {
          try {
            listRef.current?.scrollToIndex({
              index: safeStartIndex,
              animated: false,
            });
          } catch {}
        });
      } catch {}
    }, 40);
    return () => {
      clearTimeout(t);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [safeStartIndex, width]);

  const goTo = useCallback(
    (target) => {
      if (target < 0 || target >= items.length) return;
      hapticLight();
      listRef.current?.scrollToIndex({ index: target, animated: !reduceMotion });
      setIndex(target);
    },
    [items.length, reduceMotion],
  );

  const onMomentumScrollEnd = useCallback(
    (e) => {
      const next = Math.round(e.nativeEvent.contentOffset.x / width);
      if (next !== index && next >= 0 && next < items.length) {
        hapticLight();
        setIndex(next);
      }
    },
    [index, items.length, width],
  );

  const handleScrollToIndexFailed = useCallback(
    (info) => {
      try {
        listRef.current?.scrollToOffset({
          offset: info.index * width,
          animated: false,
        });
      } catch {}
      setTimeout(() => {
        try {
          listRef.current?.scrollToIndex({
            index: info.index,
            animated: false,
          });
        } catch {}
      }, 100);
    },
    [width],
  );

  const handleShare = useCallback(async () => {
    if (!currentItem) return;
    hapticLight();
    try {
      await Share.share({
        message:
          `${topicTitle ? topicTitle + '\n' : ''}` +
          `${currentItem.groupTitle}\n` +
          `${currentItem.groupItemIndex + 1}. ${currentItem.title}\n\n` +
          `${currentItem.explanation}\n\n` +
          '— Hilal · Temel Dinî Bilgiler',
      });
    } catch {}
  }, [currentItem, topicTitle]);

  const getItemLayout = useCallback(
    (_, i) => ({ length: width, offset: width * i, index: i }),
    [width],
  );

  if (!currentItem) return null;

  const isFirst = index <= 0;
  const isLast = index >= items.length - 1;
  const navBtnSize = largeTouchTargets ? TOUCH.readerBtnBig : TOUCH.readerBtn;
  const iconBtnSize = largeTouchTargets ? TOUCH.smallBig : TOUCH.small;

  return (
    <Modal
      animationType={reduceMotion ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={[styles.readerRoot, { backgroundColor: theme.background }]}>
        {/* ÜST BAR — topic title + group title */}
        <View
          style={[
            styles.readerTopBar,
            {
              paddingTop: Math.max(insets.top, 12),
              backgroundColor: theme.surface,
              borderBottomColor: highContrast ? '#FFFFFF' : theme.border,
              borderBottomWidth: highContrast ? 2 : StyleSheet.hairlineWidth,
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => { hapticLight(); onClose(); }}
            style={[
              styles.readerIconBtn,
              {
                width: iconBtnSize,
                height: iconBtnSize,
                backgroundColor: theme.background,
                borderColor: highContrast ? '#FFFFFF' : theme.border,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Okuyucuyu kapat"
            hitSlop={8}
          >
            <Ionicons name="close" size={fs(22)} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.readerTopCenter}>
            <Text
              style={[
                styles.readerTopTitle,
                {
                  color: theme.text,
                  fontSize: fs(14),
                  fontWeight: highContrast ? '900' : '800',
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              {topicTitle || currentItem.groupTitle}
            </Text>
            {topicTitle ? (
              <Text
                style={[
                  styles.readerTopSubtitle,
                  {
                    color: highContrast ? '#E0E0E0' : theme.textMuted,
                    fontSize: fs(11),
                    fontWeight: highContrast ? '700' : '600',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
              >
                {currentItem.groupTitle}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={handleShare}
            style={[
              styles.readerIconBtn,
              {
                width: iconBtnSize,
                height: iconBtnSize,
                backgroundColor: theme.background,
                borderColor: highContrast ? '#FFFFFF' : theme.border,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Maddeyi paylaş"
            hitSlop={8}
          >
            <Ionicons name="share-outline" size={fs(20)} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* SAYFALAR */}
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={(it) => it.key}
          renderItem={({ item }) => (
            <ReaderPage
              item={item}
              theme={theme}
              highContrast={highContrast}
              width={width}
              fs={fs}
            />
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={safeStartIndex}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={onMomentumScrollEnd}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          initialNumToRender={1}
          maxToRenderPerBatch={3}
          windowSize={3}
          style={styles.readerList}
        />

        {/* ALT BAR */}
        <View
          style={[
            styles.readerBottomBar,
            {
              backgroundColor: theme.surface,
              borderTopColor: highContrast ? '#FFFFFF' : theme.border,
              borderTopWidth: highContrast ? 2 : StyleSheet.hairlineWidth,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => goTo(index - 1)}
            disabled={isFirst}
            style={[
              styles.readerNavBtn,
              {
                width: navBtnSize,
                height: navBtnSize,
                backgroundColor: theme.background,
                borderColor: highContrast ? '#FFFFFF' : theme.border,
                borderWidth: highContrast ? 2 : 1,
                opacity: isFirst ? 0.35 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Önceki madde"
            accessibilityState={{ disabled: isFirst }}
          >
            <Ionicons name="chevron-back" size={fs(20)} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.readerCounterWrap}>
            <Text
              style={[
                styles.readerCounterText,
                {
                  color: theme.text,
                  fontSize: fs(15),
                  fontWeight: '900',
                },
              ]}
            >
              {index + 1}
              <Text
                style={{
                  color: highContrast ? '#E0E0E0' : theme.textMuted,
                  fontSize: fs(13),
                  fontWeight: highContrast ? '700' : '600',
                }}
              >
                {' / '}{items.length}
              </Text>
            </Text>
            <Text
              style={[
                styles.readerCounterHint,
                {
                  color: highContrast ? '#E0E0E0' : theme.textMuted,
                  fontSize: fs(10),
                  fontWeight: highContrast ? '700' : '600',
                },
              ]}
              numberOfLines={1}
            >
              {reduceMotion ? '‹ › ile gezin' : 'Kaydırarak gezin'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => goTo(index + 1)}
            disabled={isLast}
            style={[
              styles.readerNavBtn,
              {
                width: navBtnSize,
                height: navBtnSize,
                backgroundColor: theme.background,
                borderColor: highContrast ? '#FFFFFF' : theme.border,
                borderWidth: highContrast ? 2 : 1,
                opacity: isLast ? 0.35 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Sonraki madde"
            accessibilityState={{ disabled: isLast }}
          >
            <Ionicons name="chevron-forward" size={fs(20)} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ================================================================
   Ana ekran
   ================================================================ */
export default function ReligiousKnowledgeScreen({ topicId, onBack }) {
  const getTheme = useAppStore((state) => state.getTheme);
  const rawTheme = getTheme();

  const highContrast = useAppStore((s) => s.highContrast);
  const largeTouchTargets = useAppStore((s) => s.largeTouchTargets) ?? false;
  const reduceMotion = useAppStore((s) => s.reduceMotion) ?? false;
  const isSimpleMode = useAppStore((s) => s.isSimpleMode) ?? false;
  const readingFontScale = useReadingFontScale() ?? 1.0;

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

  const fs = useCallback(
    (n) => Math.round(n * readingFontScale * (isSimpleMode ? 1.1 : 1)),
    [readingFontScale, isSimpleMode],
  );

  const topic = TOPICS[topicId];

  const [query, setQuery] = useState('');
  const [readingIndex, setReadingIndex] = useState(null);

  /* --- Sticky bölüm navigator state --- */
  const scrollRef = useRef(null);
  const groupPositionsRef = useRef({});
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [chipNavHeight, setChipNavHeight] = useState(0);

  useEffect(() => {
    setQuery('');
    setReadingIndex(null);
    groupPositionsRef.current = {};
    setActiveGroupIndex(0);
  }, [topicId]);

  const borderColor = highContrast ? '#FFFFFF' : theme.border;
  const subtextColor = highContrast ? '#E0E0E0' : theme.textDim;
  const mutedTextColor = highContrast ? '#CCCCCC' : theme.textMuted;

  /* --- Tüm maddeler (arama filtresi ile) --- */
  const displayItems = useMemo(() => {
    if (!topic) return [];
    const q = query.trim().toLocaleLowerCase('tr-TR');
    const out = [];
    topic.groups.forEach((group, gi) => {
      group.items.forEach((rawItem, ii) => {
        const explanation = EXPLANATIONS[rawItem] || FALLBACK_EXPLANATION;
        if (q) {
          const haystack = `${rawItem} ${explanation}`.toLocaleLowerCase('tr-TR');
          if (!haystack.includes(q)) return;
        }
        out.push({
          key: `${topicId}-${gi}-${ii}`,
          title: rawItem,
          groupTitle: group.title,
          groupItemIndex: ii,
          groupItemCount: group.items.length,
          explanation,
        });
      });
    });
    return out;
  }, [topic, topicId, query]);

  const totalItems = useMemo(() => {
    if (!topic) return 0;
    return topic.groups.reduce((sum, g) => sum + g.items.length, 0);
  }, [topic]);

  const isFiltering = query.trim().length > 0;
  const hasResults = displayItems.length > 0;

  const visibleGroups = useMemo(() => {
    if (!topic) return [];
    return topic.groups
      .map((group, gi) => {
        const items = displayItems.filter((it) => it.groupTitle === group.title);
        return { group, gi, items };
      })
      .filter((g) => g.items.length > 0);
  }, [topic, displayItems]);

  /* Arama değişince pozisyonları sıfırla */
  useEffect(() => {
    groupPositionsRef.current = {};
    setActiveGroupIndex(0);
    try {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    } catch {}
  }, [query]);

  /* --- Bölüm navigator handlers --- */
  const handleGroupLayout = useCallback(
    (idx) => (e) => {
      groupPositionsRef.current[idx] = e.nativeEvent.layout.y;
    },
    [],
  );

  const handleChipLayout = useCallback((e) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && h !== chipNavHeight) setChipNavHeight(h);
  }, [chipNavHeight]);

  const handleScroll = useCallback(
    (e) => {
      if (visibleGroups.length <= 1) return;
      const y = e.nativeEvent.contentOffset.y + chipNavHeight + 24;
      let nextIdx = 0;
      for (let i = visibleGroups.length - 1; i >= 0; i -= 1) {
        const pos = groupPositionsRef.current[i];
        if (typeof pos === 'number' && y >= pos) {
          nextIdx = i;
          break;
        }
      }
      if (nextIdx !== activeGroupIndex) setActiveGroupIndex(nextIdx);
    },
    [visibleGroups.length, chipNavHeight, activeGroupIndex],
  );

  const scrollToGroup = useCallback(
    (idx) => {
      const pos = groupPositionsRef.current[idx];
      if (typeof pos !== 'number') return;
      hapticLight();
      scrollRef.current?.scrollTo({
        y: Math.max(0, pos - chipNavHeight - 12),
        animated: !reduceMotion,
      });
      setActiveGroupIndex(idx);
    },
    [chipNavHeight, reduceMotion],
  );

  const openReader = useCallback(
    (key) => {
      hapticLight();
      const idx = displayItems.findIndex((it) => it.key === key);
      if (idx >= 0) setReadingIndex(idx);
    },
    [displayItems],
  );

  const closeReader = useCallback(() => setReadingIndex(null), []);

  const clearQuery = useCallback(() => {
    hapticLight();
    setQuery('');
  }, []);

  /* ---------------- Bulunamadı ---------------- */
  if (!topic) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top', 'left', 'right']}
      >
        <View style={styles.notFound}>
          <Ionicons name="book-outline" size={fs(42)} color={theme.primary} />
          <Text
            style={[
              styles.title,
              { color: theme.text, fontSize: fs(21), fontWeight: '900' },
            ]}
          >
            Konu bulunamadı
          </Text>
          <Text
            style={[
              styles.detailText,
              {
                color: subtextColor,
                fontSize: fs(13),
                fontWeight: highContrast ? '700' : 'normal',
              },
            ]}
          >
            Açmak istediğin dinî bilgi başlığı tanımlı değil.
          </Text>
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.primaryButton,
              {
                backgroundColor: theme.primary,
                borderWidth: highContrast ? 2 : 0,
                borderColor: '#000000',
                paddingVertical: largeTouchTargets ? 16 : 12,
                paddingHorizontal: largeTouchTargets ? 28 : 22,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
          >
            <Text
              style={[
                styles.primaryButtonText,
                {
                  fontSize: fs(13),
                  color: highContrast ? '#000000' : '#FFFFFF',
                  fontWeight: highContrast ? '900' : '800',
                },
              ]}
            >
              Geri dön
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const statusBarStyle =
    highContrast || rawTheme.mode === 'dark' || rawTheme.mode === 'oled'
      ? 'light-content'
      : 'dark-content';

  const backBtnSize = largeTouchTargets ? TOUCH.smallBig : 44;
  const showChipNav = !isFiltering && visibleGroups.length > 1;

  /* Grup başlığı, tek elemanlı grupta item başlığıyla aynıysa
     redundant olduğundan gizle. Örn: namaz-vakitleri →
     "Kerahat vakitleri" başlığı + aynı başlıklı tek item. */
  const shouldShowGroupTitle = useCallback((group, items) => {
    if (!group?.title) return false;
    if (
      items.length === 1 &&
      items[0]?.title &&
      items[0].title.trim() === group.title.trim()
    ) {
      return false;
    }
    return true;
  }, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={statusBarStyle} backgroundColor={theme.background} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.backButton,
            {
              width: backBtnSize,
              height: backBtnSize,
              backgroundColor: highContrast ? '#1E1E1E' : theme.surface,
              borderColor,
              borderWidth: highContrast ? 2 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
        >
          <Ionicons name="arrow-back" size={fs(22)} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <Text
            style={[
              styles.eyebrow,
              { color: theme.primary, fontSize: fs(9), fontWeight: '900' },
            ]}
          >
            NİDA · DİNÎ BİLGİLER
          </Text>
          <Text
            style={[
              styles.title,
              { color: theme.text, fontSize: fs(21), fontWeight: '900' },
            ]}
            numberOfLines={2}
          >
            {topic.title}
          </Text>
        </View>
      </View>

      {/* ANA SCROLL — stickyHeaderIndices sabit: [0]=hero [1]=search [2]=chips(sticky) [3]=content */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={[2]}
      >
        {/* === 0. HERO === */}
        <View key="hero">
          <View
            style={[
              styles.hero,
              {
                backgroundColor: theme.surface,
                borderColor,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
          >
            <View style={styles.heroHeader}>
              <View
                style={[
                  styles.heroIcon,
                  {
                    backgroundColor: highContrast
                      ? '#000000'
                      : (theme.primaryGlow || theme.surfaceElevated),
                    borderColor,
                    borderWidth: highContrast ? 2 : 0,
                  },
                ]}
              >
                <Ionicons name="book-outline" size={fs(26)} color={theme.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[
                    styles.heroHeading,
                    { color: theme.text, fontSize: fs(16), fontWeight: '900' },
                  ]}
                  numberOfLines={isSimpleMode ? 2 : undefined}
                >
                  {topic.heroTitle || topic.title}
                </Text>
                <Text
                  style={[
                    styles.heroMeta,
                    {
                      color: subtextColor,
                      fontSize: fs(12),
                      fontWeight: highContrast ? '700' : 'normal',
                    },
                  ]}
                >
                  {totalItems} madde · {topic.groups.length} bölüm
                </Text>
              </View>
            </View>

            {!isSimpleMode && topic.intro ? (
              <Text
                style={[
                  styles.intro,
                  {
                    color: subtextColor,
                    fontSize: fs(13),
                    lineHeight: fs(20),
                    fontWeight: highContrast ? '700' : '500',
                  },
                ]}
              >
                {topic.intro}
              </Text>
            ) : null}
          </View>
        </View>

        {/* === 1. ARAMA === */}
        <View key="search">
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: highContrast ? '#121212' : theme.surface,
                borderColor,
                borderWidth: highContrast ? 2 : 1,
                height: largeTouchTargets ? 56 : 48,
              },
            ]}
          >
            <Ionicons name="search" size={fs(18)} color={subtextColor} />
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: theme.text,
                  fontSize: fs(14),
                  fontWeight: highContrast ? '700' : 'normal',
                },
              ]}
              placeholder="Madde veya açıklamada ara…"
              placeholderTextColor={mutedTextColor}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              clearButtonMode="while-editing"
              accessibilityLabel="Aramada filtrele"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={clearQuery}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Aramayı temizle"
              >
                <Ionicons name="close-circle" size={fs(18)} color={mutedTextColor} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* === 2. CHIPS (STICKY) === */}
        <View key="chips">
          {showChipNav ? (
            <ChipNav
              groups={visibleGroups}
              activeIndex={activeGroupIndex}
              onPress={scrollToGroup}
              theme={theme}
              highContrast={highContrast}
              largeTouchTargets={largeTouchTargets}
              reduceMotion={reduceMotion}
              fs={fs}
              onLayout={handleChipLayout}
            />
          ) : null}
        </View>

        {/* === 3. İÇERİK === */}
        <View key="content">
          {/* Arama özeti */}
          {isFiltering ? (
            <View style={styles.searchResultRow}>
              <Text
                style={{
                  color: subtextColor,
                  fontSize: fs(12),
                  fontWeight: highContrast ? '700' : 'normal',
                }}
                accessibilityLiveRegion="polite"
              >
                {hasResults ? `${displayItems.length} sonuç` : 'Sonuç bulunamadı'}
              </Text>
              <TouchableOpacity
                onPress={clearQuery}
                style={styles.clearFiltersBtn}
                accessibilityRole="button"
                accessibilityLabel="Aramayı temizle"
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: fs(12),
                    fontWeight: highContrast ? '900' : '800',
                  }}
                >
                  Temizle
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Boş sonuç */}
          {isFiltering && !hasResults ? (
            <View style={styles.emptyResults}>
              <Ionicons name="search-outline" size={fs(38)} color={mutedTextColor} />
              <Text
                style={{
                  color: subtextColor,
                  fontSize: fs(13),
                  textAlign: 'center',
                  marginTop: 10,
                  fontWeight: highContrast ? '700' : 'normal',
                }}
              >
                Arama kriterlerine uyan madde bulunamadı.
              </Text>
              <TouchableOpacity
                onPress={clearQuery}
                style={[
                  styles.retryBtn,
                  {
                    borderColor,
                    borderWidth: highContrast ? 2 : 1,
                    marginTop: 12,
                    paddingVertical: largeTouchTargets ? 14 : 8,
                    paddingHorizontal: largeTouchTargets ? 20 : 16,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Aramayı temizle"
              >
                <Text
                  style={{
                    color: theme.primary,
                    fontSize: fs(12),
                    fontWeight: highContrast ? '900' : '800',
                  }}
                >
                  Aramayı temizle
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Gruplu liste */}
          {visibleGroups.map(({ group, gi, items }, idx) => {
            const showTitle = shouldShowGroupTitle(group, items);
            return (
              <View
                key={`${topicId}-${gi}`}
                onLayout={handleGroupLayout(idx)}
                style={styles.group}
              >
                {showTitle ? (
                  <View style={styles.groupHeaderRow}>
                    <Text
                      style={[
                        styles.groupTitle,
                        {
                          color: theme.text,
                          fontSize: fs(16),
                          fontWeight: '900',
                          flex: 1,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {group.title}
                    </Text>
                    <View
                      style={[
                        styles.groupCountBadge,
                        {
                          backgroundColor: highContrast
                            ? '#000000'
                            : (theme.primaryGlow || theme.surfaceElevated),
                          borderWidth: highContrast ? 2 : 0,
                          borderColor,
                        },
                      ]}
                      accessibilityLabel={`${items.length} madde`}
                    >
                      <Text
                        style={[
                          styles.groupCountText,
                          {
                            color: theme.primary,
                            fontSize: fs(11),
                            fontWeight: '900',
                          },
                        ]}
                      >
                        {items.length}
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View style={{ gap: 8 }}>
                  {items.map((it) => (
                    <ItemRow
                      key={it.key}
                      item={it}
                      onPress={() => openReader(it.key)}
                      theme={theme}
                      highContrast={highContrast}
                      largeTouchTargets={largeTouchTargets}
                      fs={fs}
                    />
                  ))}
                </View>
              </View>
            );
          })}

          {/* Not */}
          {!isSimpleMode && topic.note ? (
            <View
              style={[
                styles.noteCard,
                {
                  backgroundColor: highContrast ? '#121212' : theme.surface,
                  borderColor,
                  borderWidth: highContrast ? 2 : 1,
                },
              ]}
            >
              <Ionicons
                name="information-circle-outline"
                size={fs(20)}
                color={theme.primary}
              />
              <Text
                style={[
                  styles.noteText,
                  {
                    color: subtextColor,
                    fontSize: fs(12),
                    lineHeight: fs(18),
                    fontWeight: highContrast ? '700' : 'normal',
                  },
                ]}
              >
                {topic.note}
              </Text>
            </View>
          ) : null}

          {/* Disclaimer */}
          {!isSimpleMode ? (
            <Text
              style={[
                styles.disclaimer,
                {
                  color: subtextColor,
                  fontSize: fs(11),
                  lineHeight: fs(17),
                  fontWeight: highContrast ? '700' : 'normal',
                },
              ]}
            >
              Bu ekran genel bilgilendirme amaçlıdır. Fıkhî ayrıntılar
              mezhebe ve kaynağa göre değişebilir. Özel durumlar için
              güvenilir bir ilmihal veya yetkin bir din görevlisine
              danışabilirsin.
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* OKUMA MODAL */}
      {readingIndex !== null && displayItems[readingIndex] ? (
        <ItemReaderModal
          key={readingIndex}
          items={displayItems}
          initialIndex={readingIndex}
          onClose={closeReader}
          theme={theme}
          highContrast={highContrast}
          largeTouchTargets={largeTouchTargets}
          reduceMotion={reduceMotion}
          fs={fs}
          topicTitle={topic.title}
        />
      ) : null}
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  backButton: {
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  eyebrow: { letterSpacing: 1.5 },
  title: { marginTop: 3 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },

  /* HERO */
  hero: {
    padding: 17,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroHeading: {},
  heroMeta: { marginTop: 3 },
  intro: { fontWeight: '500' },

  /* ARAMA */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: { flex: 1, height: '100%' },
  searchResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 12,
  },
  clearFiltersBtn: { padding: 6 },
  emptyResults: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 4,
  },
  retryBtn: {
    borderRadius: 10,
    borderWidth: 1,
  },

  /* BÖLÜM NAVIGATOR */
  chipNav: {
    paddingVertical: 10,
    marginBottom: 4,
  },
  chipNavInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chipNavLabel: {
    letterSpacing: 1,
  },
  chipNavContent: {
    gap: 6,
    paddingRight: 4,
    alignItems: 'center',
  },
  chipNavChip: {
    paddingHorizontal: 8,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipNavChipText: {},

  /* GRUP */
  group: { marginBottom: 20 },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  groupTitle: {},
  groupCountBadge: {
    minWidth: 26,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupCountText: {},

  /* LİSTE SATIRI */
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  itemRowBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRowBadgeText: {},
  itemRowTitle: { flex: 1 },

  /* NOT */
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 15,
    borderWidth: 1,
    marginTop: 3,
    marginBottom: 14,
  },
  noteText: { flex: 1 },
  disclaimer: { marginTop: 4, marginBottom: 20 },

  /* NOT FOUND */
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 14,
  },
  primaryButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  primaryButtonText: { color: '#FFFFFF' },

  /* READER MODAL */
  readerRoot: { flex: 1 },
  readerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  readerIconBtn: {
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerTopCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  readerTopTitle: { textAlign: 'center' },
  readerTopSubtitle: { marginTop: 2, textAlign: 'center' },
  readerList: { flex: 1 },
  readerPageContent: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 40,
  },
  readerEyebrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  readerEyebrowPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: '75%',
  },
  readerEyebrowText: { letterSpacing: 0.3 },
  readerEyebrowMeta: {},
  readerTitle: { letterSpacing: -0.2, marginBottom: 18 },
  readerDivider: {
    height: 1,
    opacity: 0.5,
    marginBottom: 18,
  },
  readerBody: { letterSpacing: 0.1 },
  readerBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  readerNavBtn: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  readerCounterWrap: { flex: 1, alignItems: 'center' },
  readerCounterText: {},
  readerCounterHint: { marginTop: 2 },
});