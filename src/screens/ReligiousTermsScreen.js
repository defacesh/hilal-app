// src/screens/ReligiousTermsScreen.js
import React, {
  useState, useMemo, useCallback, useRef, useEffect, memo,
} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  StatusBar,
  Modal,
  ScrollView,
  Share,
  PanResponder,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { RELIGIOUS_TERMS } from '../data/religiousTerms';

/* ================================================================
   Sabitler & Depolama Anahtarı
   ================================================================ */
const FAVORITES_STORAGE_KEY = '@nida/religious_terms/favorites';
const MIN_FONT_SCALE = 0.85;
const MAX_FONT_SCALE = 2.0;
const FONT_STEP = 0.1;

const BASE_TITLE_SIZE = 26;
const BASE_DEF_SIZE = 17;

/* ================================================================
   Haptics & Ses
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}

const isHapticEnabled = () => {
  try { return useAppStore.getState().globalHaptic !== false; }
  catch { return true; }
};

const hapticLight = (style = 'light') => {
  try {
    if (!isHapticEnabled()) return;
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return;
    const map = Haptics.ImpactFeedbackStyle ?? {};
    const arg = style === 'medium' ? map.Medium : style === 'heavy' ? map.Heavy : map.Light;
    if (arg === undefined) Haptics.impactAsync(); else Haptics.impactAsync(arg);
  } catch {}
};

let Clipboard = null;
try { Clipboard = require('expo-clipboard'); } catch {}

/* ================================================================
   Arama normalize — Türkçe + aksan duyarsız
   ================================================================ */
const normalizeForSearch = (str) => {
  if (!str) return '';
  return String(str)
    .toLocaleLowerCase('tr-TR')
    .replace(/[âàáä]/g, 'a')
    .replace(/[îìíï]/g, 'i')
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

/* ================================================================
   PressableScale — Akıcı Basma Efekti
   ================================================================ */
const PressableScale = memo(function PressableScale({
  onPress, children, style, scaleTo = 0.97, disabled,
  accessibilityLabel, accessibilityRole = 'button', reduceMotion = false,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: scaleTo, useNativeDriver: true, speed: 50, bounciness: 4,
    }).start();
  };
  const pressOut = () => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4,
    }).start();
  };
  const handlePress = (e) => {
    hapticLight('light');
    onPress?.(e);
  };
  return (
    <Animated.View style={[{ width: '100%' }, !reduceMotion && { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
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
   Detay Modalı — Okuma Modu + Pinch Zoom + Favori + Kopyala
   ================================================================ */
const TermDetailModal = memo(function TermDetailModal({
  item,
  visible,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  totalCount,
  theme,
  highContrast,
  globalFontScale = 1.0,
  isFavorite,
  onToggleFavorite,
  largeTouchTargets = false,
  reduceMotion = false,
}) {
  const [fontScale, setFontScale] = useState(1);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const scaleRef = useRef(1);
  const baseScaleRef = useRef(1);
  const pinchStartDistRef = useRef(0);
  const isPinchingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      setFontScale(1);
      scaleRef.current = 1;
      baseScaleRef.current = 1;
      isPinchingRef.current = false;
      pinchStartDistRef.current = 0;
      setScrollEnabled(true);
    }
  }, [visible]);

  const getTouchDistance = (touches) => {
    if (!touches || touches.length < 2) return 0;
    const dx = touches[0].pageX - touches[1].pageX;
    const dy = touches[0].pageY - touches[1].pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length >= 2,
      onStartShouldSetPanResponderCapture: (evt) => evt.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponder: (evt) => evt.nativeEvent.touches.length >= 2,
      onMoveShouldSetPanResponderCapture: (evt) => evt.nativeEvent.touches.length >= 2,

      onPanResponderGrant: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length < 2) return;
        isPinchingRef.current = true;
        baseScaleRef.current = scaleRef.current;
        pinchStartDistRef.current = getTouchDistance(touches);
        setScrollEnabled(false);
      },
      onPanResponderMove: (evt) => {
        const touches = evt.nativeEvent.touches;
        if (touches.length < 2) return;
        const dist = getTouchDistance(touches);
        if (pinchStartDistRef.current <= 0) {
          pinchStartDistRef.current = dist;
          baseScaleRef.current = scaleRef.current;
          return;
        }
        const ratio = dist / pinchStartDistRef.current;
        let next = baseScaleRef.current * ratio;
        if (next < MIN_FONT_SCALE) next = MIN_FONT_SCALE;
        if (next > MAX_FONT_SCALE) next = MAX_FONT_SCALE;
        scaleRef.current = next;
        setFontScale(next);
      },
      onPanResponderRelease: () => {
        isPinchingRef.current = false;
        pinchStartDistRef.current = 0;
        setScrollEnabled(true);
      },
      onPanResponderTerminate: () => {
        isPinchingRef.current = false;
        pinchStartDistRef.current = 0;
        setScrollEnabled(true);
      },
      onPanResponderTerminationRequest: () => !isPinchingRef.current,
    })
  ).current;

  const bumpFont = useCallback((delta) => {
    hapticLight('light');
    let next = scaleRef.current + delta;
    if (next < MIN_FONT_SCALE) next = MIN_FONT_SCALE;
    if (next > MAX_FONT_SCALE) next = MAX_FONT_SCALE;
    scaleRef.current = next;
    setFontScale(next);
  }, []);

  const handleShare = useCallback(async () => {
    if (!item) return;
    try {
      await Share.share({
        message: `${item.term} (${item.category})\n\n${item.definition}\n\nNİDA — Dini Terimler Sözlüğü`,
      });
    } catch {}
  }, [item]);

  const handleCopy = useCallback(async () => {
    if (!item || !Clipboard?.setStringAsync) return;
    try {
      await Clipboard.setStringAsync(`${item.term}: ${item.definition}`);
      hapticLight('medium');
      Alert.alert('Kopyalandı', 'Terim panoya kopyalandı.', [{ text: 'Tamam' }]);
    } catch {}
  }, [item]);

  if (!item) return null;

  const canPrev = currentIndex > 0;
  const canNext = currentIndex >= 0 && currentIndex < totalCount - 1;
  const textMuted = highContrast ? theme.text : (theme.textMuted || theme.textDim);
  const borderColor = highContrast ? theme.text : theme.border;
  const effectiveScale = fontScale * globalFontScale;
  const fav = isFavorite(item.id);

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            { backgroundColor: theme.surface, borderColor, borderWidth: highContrast ? 2 : 1 },
          ]}
        >
          {/* Tutamaç */}
          <View style={[styles.modalHandle, { backgroundColor: borderColor }]} />

          {/* Üst bar */}
          <View style={styles.modalTopBar}>
            <View style={[styles.modalCatBadge, { backgroundColor: theme.primaryGlow || theme.surfaceElevated }]}>
              <Text style={[styles.modalCatText, { color: theme.primary, fontSize: Math.round(11 * globalFontScale), fontWeight: highContrast ? '800' : '700' }]}>
                {item.category}
              </Text>
            </View>

            <View style={styles.modalTopRight}>
              <View style={[styles.modalIndexBadge, { backgroundColor: theme.surfaceElevated }]}>
                <Text style={[styles.modalIndexText, { color: textMuted, fontSize: Math.round(11 * globalFontScale) }]}>
                  {currentIndex >= 0 ? currentIndex + 1 : 1} / {totalCount}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => onToggleFavorite(item.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Favorilere ekle/çıkar"
                style={[styles.modalIconBtn, largeTouchTargets && { width: 40, height: 40 }, { backgroundColor: theme.surfaceElevated }]}
              >
                <Ionicons
                  name={fav ? 'heart' : 'heart-outline'}
                  size={18 * globalFontScale}
                  color={fav ? '#E35D6A' : theme.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCopy}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Terimi kopyala"
                style={[styles.modalIconBtn, largeTouchTargets && { width: 40, height: 40 }, { backgroundColor: theme.surfaceElevated }]}
              >
                <Ionicons name="copy-outline" size={18 * globalFontScale} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Terimi paylaş"
                style={[styles.modalIconBtn, largeTouchTargets && { width: 40, height: 40 }, { backgroundColor: theme.surfaceElevated }]}
              >
                <Ionicons name="share-social-outline" size={18 * globalFontScale} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Pinch alanı */}
          <View style={styles.pinchWrap} {...panResponder.panHandlers}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              scrollEnabled={scrollEnabled}
            >
              <Text
                style={[
                  styles.modalTerm,
                  {
                    color: theme.text,
                    fontSize: Math.round(BASE_TITLE_SIZE * effectiveScale),
                    lineHeight: Math.round(BASE_TITLE_SIZE * effectiveScale * 1.25),
                  },
                  highContrast && { fontWeight: '900' },
                ]}
              >
                {item.term}
              </Text>

              <View style={[styles.modalDivider, { backgroundColor: borderColor }]} />

              <Text
                style={[
                  styles.modalDefinition,
                  {
                    color: highContrast ? theme.text : theme.textDim,
                    fontSize: Math.round(BASE_DEF_SIZE * effectiveScale),
                    lineHeight: Math.round(BASE_DEF_SIZE * effectiveScale * 1.7),
                  },
                  highContrast && { fontWeight: '600' },
                ]}
              >
                {item.definition}
              </Text>

              <View style={{ height: 12 }} />
            </ScrollView>
          </View>

          {/* Font kontrol çubuğu */}
          <View style={[styles.fontBar, { borderTopColor: borderColor }]}>
            <Text style={[styles.fontHint, { color: textMuted, fontSize: Math.round(11 * globalFontScale) }]}>
              İki parmakla yakınlaştır
            </Text>
            <View style={styles.fontControls}>
              <TouchableOpacity
                onPress={() => bumpFont(-FONT_STEP)}
                disabled={fontScale <= MIN_FONT_SCALE + 0.001}
                accessibilityRole="button"
                accessibilityLabel="Yazıyı küçült"
                style={[
                  styles.fontBtn,
                  largeTouchTargets && { width: 38, height: 38 },
                  {
                    borderColor,
                    backgroundColor: theme.surfaceElevated,
                    opacity: fontScale <= MIN_FONT_SCALE + 0.001 ? 0.4 : 1,
                  },
                ]}
              >
                <Ionicons name="remove" size={16 * globalFontScale} color={theme.text} />
              </TouchableOpacity>
              <Text style={[styles.fontPercent, { color: textMuted, fontSize: Math.round(11 * globalFontScale) }]}>
                {Math.round(fontScale * 100)}%
              </Text>
              <TouchableOpacity
                onPress={() => bumpFont(FONT_STEP)}
                disabled={fontScale >= MAX_FONT_SCALE - 0.001}
                accessibilityRole="button"
                accessibilityLabel="Yazıyı büyüt"
                style={[
                  styles.fontBtn,
                  largeTouchTargets && { width: 38, height: 38 },
                  {
                    borderColor,
                    backgroundColor: theme.surfaceElevated,
                    opacity: fontScale >= MAX_FONT_SCALE - 0.001 ? 0.4 : 1,
                  },
                ]}
              >
                <Ionicons name="add" size={16 * globalFontScale} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Alt navigasyon */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={onPrev}
              disabled={!canPrev}
              accessibilityRole="button"
              accessibilityLabel="Önceki terim"
              style={[
                styles.navBtn,
                largeTouchTargets && { height: 52 },
                { backgroundColor: theme.surfaceElevated, opacity: canPrev ? 1 : 0.4 },
              ]}
            >
              <Ionicons name="chevron-back" size={20 * globalFontScale} color={theme.text} />
              <Text style={[styles.navBtnText, { color: theme.text, fontSize: Math.round(13 * globalFontScale) }]}>Önceki</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              accessibilityRole="button"
              style={[styles.closeBtn, largeTouchTargets && { height: 52 }, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.closeBtnText, { fontSize: Math.round(15 * globalFontScale) }]}>Kapat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNext}
              disabled={!canNext}
              accessibilityRole="button"
              accessibilityLabel="Sonraki terim"
              style={[
                styles.navBtn,
                largeTouchTargets && { height: 52 },
                { backgroundColor: theme.surfaceElevated, opacity: canNext ? 1 : 0.4 },
              ]}
            >
              <Text style={[styles.navBtnText, { color: theme.text, fontSize: Math.round(13 * globalFontScale) }]}>Sonraki</Text>
              <Ionicons name="chevron-forward" size={20 * globalFontScale} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   Terim Kartı
   ================================================================ */
const TermCard = memo(function TermCard({ item, theme, highContrast, fontScale = 1.0, onPress, isFavorite, onToggleFavorite, largeTouchTargets = false }) {
  const borderColor = highContrast ? theme.text : theme.border;
  const defColor = highContrast ? theme.text : theme.textDim;
  const arrowColor = highContrast ? theme.text : (theme.textMuted || theme.textDim);
  const fav = isFavorite(item.id);

  return (
    <PressableScale
      onPress={() => onPress?.(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.term}. ${item.category}. Detayları aç`}
    >
      <View
        style={[
          styles.termCard,
          largeTouchTargets && { padding: 20 },
          { backgroundColor: theme.surface, borderColor, borderWidth: highContrast ? 2 : 1 },
        ]}
      >
        <View style={styles.termCardHeader}>
          <Text style={[styles.termTitle, { color: theme.text, fontSize: Math.round(17 * fontScale) }, highContrast && { fontWeight: '800' }]} numberOfLines={1}>
            {item.term}
          </Text>
          <View style={styles.termCardRight}>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                onToggleFavorite(item.id);
              }}
              hitSlop={8}
              style={{ marginRight: 6, padding: 6 }}
              accessibilityLabel={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
            >
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={19 * fontScale}
                color={fav ? '#E35D6A' : arrowColor}
              />
            </TouchableOpacity>
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: theme.primaryGlow || theme.surfaceElevated },
              ]}
            >
              <Text style={[styles.categoryBadgeText, { color: theme.primary, fontSize: Math.round(11 * fontScale) }, highContrast && { fontWeight: '800' }]}>
                {item.category}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16 * fontScale}
              color={arrowColor}
              style={{ marginLeft: 4 }}
            />
          </View>
        </View>
        <Text
          style={[styles.termDefinition, { color: defColor, fontSize: Math.round(14 * fontScale), lineHeight: Math.round(22 * fontScale) }, highContrast && { fontWeight: '600' }]}
          numberOfLines={2}
        >
          {item.definition}
        </Text>
      </View>
    </PressableScale>
  );
}, (prev, next) =>
  prev.item.id === next.item.id &&
  prev.theme.mode === next.theme.mode &&
  prev.highContrast === next.highContrast &&
  prev.fontScale === next.fontScale &&
  prev.largeTouchTargets === next.largeTouchTargets &&
  prev.isFavorite(prev.item.id) === next.isFavorite(next.item.id)
);

/* ================================================================
   Ana Ekran
   ================================================================ */
export default function ReligiousTermsScreen({ onBack }) {
  const getTheme = useAppStore((s) => s.getTheme);
  const readingFontScale = useAppStore((s) => s.readingFontScale) ?? 1.0;
  const highContrastStore = useAppStore((s) => s.highContrast) ?? false;
  const largeTouchTargets = useAppStore((s) => s.largeTouchTargets) ?? false;
  const reduceMotion = useAppStore((s) => s.reduceMotion) ?? false;

  const theme = getTheme();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedItem, setSelectedItem] = useState(null);
  const [favorites, setFavorites] = useState([]);

  // Favorileri yükle
  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_STORAGE_KEY)
      .then((val) => {
        if (val) {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) setFavorites(parsed);
        }
      })
      .catch(() => {});
  }, []);

  const toggleFavorite = useCallback((id) => {
    hapticLight('light');
    setFavorites((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id];
      AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const isFavorite = useCallback((id) => favorites.includes(id), [favorites]);

  const highContrast = highContrastStore;
  const borderColor = highContrast ? theme.text : theme.border;

  /* Kategori listesi + sayılar */
  const categories = useMemo(() => {
    const counts = new Map();
    RELIGIOUS_TERMS.forEach((t) => {
      counts.set(t.category, (counts.get(t.category) || 0) + 1);
    });
    const list = Array.from(counts.keys()).sort((a, b) =>
      a.localeCompare(b, 'tr-TR')
    );
    return [
      { id: 'Tümü', label: 'Tümü', count: RELIGIOUS_TERMS.length },
      { id: 'Favoriler', label: 'Favoriler', count: favorites.length },
      ...list.map((cat) => ({ id: cat, label: cat, count: counts.get(cat) })),
    ];
  }, [favorites.length]);

  /* Filtreleme */
  const filteredTerms = useMemo(() => {
    const q = normalizeForSearch(query);
    return RELIGIOUS_TERMS.filter((item) => {
      const matchesCategory =
        selectedCategory === 'Tümü'
          ? true
          : selectedCategory === 'Favoriler'
          ? favorites.includes(item.id)
          : item.category === selectedCategory;

      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        normalizeForSearch(item.term).includes(q) ||
        normalizeForSearch(item.definition).includes(q)
      );
    });
  }, [query, selectedCategory, favorites]);

  const currentIndex = useMemo(() => {
    if (!selectedItem) return -1;
    return filteredTerms.findIndex((t) => t.id === selectedItem.id);
  }, [selectedItem, filteredTerms]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      hapticLight('light');
      setSelectedItem(filteredTerms[currentIndex - 1]);
    }
  }, [currentIndex, filteredTerms]);

  const handleNext = useCallback(() => {
    if (currentIndex >= 0 && currentIndex < filteredTerms.length - 1) {
      hapticLight('light');
      setSelectedItem(filteredTerms[currentIndex + 1]);
    }
  }, [currentIndex, filteredTerms]);

  const handleCardPress = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  const clearQuery = useCallback(() => setQuery(''), []);

  const renderItem = useCallback(
    ({ item }) => (
      <TermCard
        item={item}
        theme={theme}
        highContrast={highContrast}
        fontScale={readingFontScale}
        onPress={handleCardPress}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        largeTouchTargets={largeTouchTargets}
      />
    ),
    [theme, highContrast, readingFontScale, handleCardPress, isFavorite, toggleFavorite, largeTouchTargets]
  );

  const statusBarStyle =
    theme.mode === 'light' || theme.mode === 'sepia' || theme.mode === 'sand' || theme.mode === 'modernLight'
      ? 'dark-content'
      : 'light-content';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={statusBarStyle} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack}
          style={[
            styles.headerButton,
            largeTouchTargets && { width: 46, height: 46 },
            { backgroundColor: theme.surface, borderColor, borderWidth: highContrast ? 2 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Geri"
        >
          <Ionicons name="arrow-back" size={22 * readingFontScale} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text, fontSize: Math.round(20 * readingFontScale) }, highContrast && { fontWeight: '900' }]}>Dini Terimler</Text>
        <View style={styles.headerCount}>
          <Text style={[styles.headerCountText, { color: theme.primary, fontSize: Math.round(12 * readingFontScale) }]}>
            {filteredTerms.length}
          </Text>
        </View>
      </View>

      {/* Arama */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBox,
            largeTouchTargets && { minHeight: 52 },
            { backgroundColor: theme.surface, borderColor, borderWidth: highContrast ? 2 : 1 },
          ]}
        >
          <Ionicons name="search" size={18 * readingFontScale} color={highContrast ? theme.text : theme.textDim} style={{ marginLeft: 2 }} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Terim veya kelime ara..."
            placeholderTextColor={highContrast ? theme.text : (theme.textMuted || theme.textDim)}
            style={[styles.searchInput, { color: theme.text, fontSize: Math.round(15 * readingFontScale) }]}
            autoCorrect={false}
          />
          {!!query && (
            <TouchableOpacity onPress={clearQuery} hitSlop={10} style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18 * readingFontScale} color={highContrast ? theme.text : theme.textDim} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Kategori chip'leri */}
      <View style={[styles.categoryScrollContainer, largeTouchTargets && { height: 50 }]}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item.id;
            return (
              <TouchableOpacity
                onPress={() => {
                  hapticLight('light');
                  setSelectedCategory(item.id);
                }}
                activeOpacity={0.8}
                style={[
                  styles.categoryChip,
                  largeTouchTargets && { height: 42, paddingHorizontal: 16 },
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : borderColor,
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}
              >
                {item.id === 'Favoriler' && (
                  <Ionicons name="heart" size={12} color={isSelected ? '#FFF' : '#E35D6A'} style={{ marginRight: 2 }} />
                )}
                <Text
                  style={[
                    styles.categoryChipText,
                    { color: isSelected ? '#FFF' : theme.text, fontSize: Math.round(13 * readingFontScale) },
                    highContrast && { fontWeight: '800' },
                  ]}
                >
                  {item.label}
                </Text>
                <View
                  style={[
                    styles.chipCount,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255,255,255,0.25)'
                        : theme.surfaceElevated,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipCountText,
                      { color: isSelected ? '#FFF' : (highContrast ? theme.text : theme.textDim), fontSize: Math.round(10 * readingFontScale) },
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Liste */}
      <FlatList
        data={filteredTerms}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(24, insets.bottom + 20) },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={7}
        keyboardDismissMode="on-drag"
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name={selectedCategory === 'Favoriler' ? 'heart-outline' : 'search-outline'} size={42 * readingFontScale} color={highContrast ? theme.text : theme.textDim} />
            <Text style={[styles.emptyText, { color: theme.text, fontSize: Math.round(14 * readingFontScale) }, highContrast && { fontWeight: '700' }]}>
              {selectedCategory === 'Favoriler'
                ? 'Henüz favori terim eklemediniz.'
                : query
                ? `"${query}" ile eşleşen terim bulunamadı.`
                : 'Bu kategoride terim bulunmuyor.'}
            </Text>
          </View>
        }
      />

      {/* Detay modalı */}
      <TermDetailModal
        item={selectedItem}
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onPrev={handlePrev}
        onNext={handleNext}
        currentIndex={currentIndex}
        totalCount={filteredTerms.length}
        theme={theme}
        highContrast={highContrast}
        globalFontScale={readingFontScale}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
        largeTouchTargets={largeTouchTargets}
        reduceMotion={reduceMotion}
      />
    </SafeAreaView>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.3 },
  headerCount: {
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCountText: { fontSize: 13, fontWeight: '800' },

  /* Arama */
  searchContainer: { paddingHorizontal: 20, marginBottom: 12 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    paddingVertical: Platform.OS === 'android' ? 4 : 0,
  },

  /* Kategori chip'leri */
  categoryScrollContainer: { height: 44, marginBottom: 10 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryChipText: { fontSize: 13, fontWeight: '700' },
  chipCount: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCountText: { fontSize: 10, fontWeight: '800' },

  /* Liste */
  listContent: { paddingHorizontal: 20, gap: 10 },
  termCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  termCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  termTitle: { fontSize: 17, fontWeight: '800', flex: 1, letterSpacing: -0.2 },
  termCardRight: { flexDirection: 'row', alignItems: 'center' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryBadgeText: { fontSize: 11, fontWeight: '800' },
  termDefinition: { fontSize: 14, lineHeight: 21, fontWeight: '500' },

  emptyBox: { padding: 50, alignItems: 'center', gap: 10 },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingTop: 10,
    alignItems: 'center',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
    opacity: 0.4,
  },
  modalTopBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalCatBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  modalCatText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  modalTopRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalIndexBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  modalIndexText: { fontSize: 11, fontWeight: '700' },
  modalIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Pinch alanı */
  pinchWrap: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: 10,
  },
  modalScroll: { width: '100%' },
  modalScrollContent: { paddingBottom: 10 },
  modalTerm: {
    fontWeight: '900',
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  modalDivider: { height: 1, width: '100%', marginBottom: 14 },
  modalDefinition: { fontWeight: '500' },

  /* Font bar */
  fontBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  fontHint: { fontSize: 11, fontWeight: '500' },
  fontControls: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fontBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontPercent: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'center',
  },

  /* Alt navigasyon */
  modalFooter: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    alignItems: 'center',
  },
  navBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  navBtnText: { fontWeight: '700', fontSize: 13 },
  closeBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});