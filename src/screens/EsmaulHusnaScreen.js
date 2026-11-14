// src/screens/EsmaulHusnaScreen.js
import React, {
  useState, useMemo, useCallback, memo, useEffect, useRef,
} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  Pressable,
  StatusBar,
  Keyboard,
  Platform,
  Modal,
  ScrollView,
  Share,
  Animated,
  Easing,
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';
import { ESMA_TR_ISIMLER, ESMA_TR_ANLAMLAR, ESMA_ARAPCALAR } from '../data/vakitContent';

/* ================================================================
   Opsiyonel modüller
   ================================================================ */
let Haptics = null;
try { Haptics = require('expo-haptics'); } catch { }
let Clipboard = null;
try { Clipboard = require('expo-clipboard'); } catch { }

const haptic = (style = 'light') => {
  try {
    if (useAppStore.getState().globalHaptic === false) return;
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return;
    const map = Haptics.ImpactFeedbackStyle ?? {};
    const arg = style === 'medium' ? map.Medium : style === 'heavy' ? map.Heavy : map.Light;
    if (arg === undefined) Haptics.impactAsync(); else Haptics.impactAsync(arg);
  } catch { }
};

/* ================================================================
   Design tokens — diğer ekranlarla uyumlu
   ================================================================ */
const RADIUS = Object.freeze({ sm: 10, md: 14, lg: 18, xl: 22, xxl: 26, hero: 28 });
const SPACING = Object.freeze({ xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 });

/* ================================================================
   Data
   ================================================================ */
const FULL_ESMA_LIST = Array.from({ length: 99 }, (_, i) => {
  const index = i + 1;
  return {
    id: index,
    name: ESMA_TR_ISIMLER[index] || '',
    meaning: ESMA_TR_ANLAMLAR[index] || '',
    arabic: ESMA_ARAPCALAR?.[index] || '',
  };
});

const NORMALIZED_LIST = FULL_ESMA_LIST.map((item) => ({
  ...item,
  _searchKey: `${item.name.toLocaleLowerCase('tr-TR')} ${item.meaning.toLocaleLowerCase('tr-TR')}`,
}));

const MIN_FONT_SCALE = 0.8;
const MAX_FONT_SCALE = 2.5;
const FONT_STEP = 0.15;

/* ================================================================
   Yardımcı
   ================================================================ */
const cardShadow = (hc) => (hc ? null : {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
});

/* ================================================================
   PressableScale — diğer ekranlarla tutarlı
   ================================================================ */
const PressableScale = memo(function PressableScale({
  onPress, children, style, scaleTo = 0.975, disabled,
  label, haptics = 'light', reduceMotion = false,
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const pressIn = () => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: scaleTo, useNativeDriver: true, speed: 60, bounciness: 3,
    }).start();
  };
  const pressOut = () => {
    if (reduceMotion) return;
    Animated.spring(scale, {
      toValue: 1, useNativeDriver: true, speed: 60, bounciness: 3,
    }).start();
  };
  const handlePress = (e) => {
    if (haptics) haptic(haptics);
    onPress?.(e);
  };
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={pressIn}
        onPressOut={pressOut}
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

/* ================================================================
   EsmaCard
   ================================================================ */
const EsmaCard = memo(function EsmaCard({
  item, theme, onSelect, highContrast, fontScale, reduceMotion, showArabic, largeTouchTargets,
}) {
  const accent = theme.primary;
  const badgeSize = Math.round((largeTouchTargets ? 46 : 42) * Math.min(fontScale, 1.15));

  return (
    <PressableScale
      onPress={() => onSelect(item)}
      label={`${item.id}. ${item.name}. ${item.meaning}`}
      reduceMotion={reduceMotion}
      style={[styles.card, {
        backgroundColor: theme.surface,
        borderColor: highContrast ? theme.text : theme.border,
        borderWidth: highContrast ? 2 : 1,
        paddingVertical: largeTouchTargets ? 16 : 14,
      }, cardShadow(highContrast)]}
    >
      <View style={[styles.numberBadge, {
        backgroundColor: highContrast ? '#000000' : theme.primaryGlow,
        borderWidth: highContrast ? 2 : 0,
        borderColor: theme.border,
        width: badgeSize,
        height: badgeSize,
        borderRadius: badgeSize / 2,
      }]}>
        <Text style={[styles.numberText, {
          color: accent,
          fontWeight: '900',
          fontSize: Math.round(15 * fontScale),
        }]}>
          {item.id}
        </Text>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text
            style={[styles.name, {
              color: theme.text,
              fontWeight: '800',
              fontSize: Math.round(16 * fontScale),
            }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
          {showArabic && item.arabic ? (
            <Text
              style={[styles.arabicText, {
                color: accent,
                fontWeight: '700',
                fontSize: Math.round(17 * fontScale),
              }]}
              numberOfLines={1}
            >
              {item.arabic}
            </Text>
          ) : null}
        </View>
        <Text
          style={[styles.meaning, {
            color: theme.textDim,
            fontWeight: highContrast ? '700' : '500',
            fontSize: Math.round(12.5 * fontScale),
            lineHeight: Math.round(18 * fontScale),
          }]}
          numberOfLines={2}
        >
          {item.meaning}
        </Text>
      </View>

      <View style={styles.chevron}>
        <Ionicons
          name="chevron-forward"
          size={Math.round(18 * fontScale)}
          color={highContrast ? theme.text : theme.textMuted}
        />
      </View>
    </PressableScale>
  );
}, (prev, next) => (
  prev.item.id === next.item.id &&
  prev.theme.mode === next.theme.mode &&
  prev.theme.primary === next.theme.primary &&
  prev.highContrast === next.highContrast &&
  prev.fontScale === next.fontScale &&
  prev.reduceMotion === next.reduceMotion &&
  prev.showArabic === next.showArabic &&
  prev.largeTouchTargets === next.largeTouchTargets
));

/* ================================================================
   EmptyState — DualarScreen ile uyumlu
   ================================================================ */
const EmptyState = memo(function EmptyState({
  theme, highContrast, fontScale, icon = 'search-outline', title, subtitle,
}) {
  return (
    <View style={styles.emptyBox}>
      <View style={[styles.emptyIcon, {
        backgroundColor: theme.primaryGlow,
        borderColor: theme.border,
        borderWidth: highContrast ? 2 : 0,
      }]}>
        <Ionicons name={icon} size={Math.round(34 * fontScale)} color={theme.primary} />
      </View>
      <Text style={[styles.emptyTitle, {
        color: theme.text,
        fontSize: Math.round(18 * fontScale),
        fontWeight: '800',
      }]}>
        {title}
      </Text>
      {!!subtitle && (
        <Text style={[styles.emptyText, {
          color: theme.textDim,
          fontSize: Math.round(14 * fontScale),
          lineHeight: Math.round(20 * fontScale),
          fontWeight: highContrast ? '700' : '500',
        }]}>
          {subtitle}
        </Text>
      )}
    </View>
  );
});

/* ================================================================
   DetailModal
   ================================================================ */
const DetailModal = memo(function DetailModal({
  item, visible, onClose, onPrev, onNext, theme, totalCount, currentIndex,
  highContrast, showArabic, readingFontScale, reduceMotion,
}) {
  const insets = useSafeAreaInsets();

  const baseFontScale = readingFontScale ?? 1.0;
  const [fontScale, setFontScale] = useState(baseFontScale);

  useEffect(() => {
    if (visible) setFontScale(baseFontScale);
  }, [visible, baseFontScale]);

  if (!item) return null;

  const accent = theme.primary;

  const handleShare = async () => {
    try {
      const parts = [
        `${item.name}${showArabic && item.arabic ? ` (${item.arabic})` : ''}`,
        '',
        `Anlamı: ${item.meaning}`,
        '',
        '— Hilal uygulamasından',
      ];
      await Share.share({ message: parts.join('\n') });
    } catch { }
  };

  const handleCopy = async () => {
    if (typeof Clipboard?.setStringAsync !== 'function') return;
    try {
      const parts = [`${item.id}. ${item.name}`];
      if (showArabic && item.arabic) parts.push(item.arabic);
      parts.push('', `Anlamı: ${item.meaning}`, '', '— Hilal');
      await Clipboard.setStringAsync(parts.join('\n'));
      haptic();
    } catch { }
  };

  const bumpFont = (delta) => {
    setFontScale((prev) => {
      let next = prev + delta;
      if (next < MIN_FONT_SCALE) next = MIN_FONT_SCALE;
      if (next > MAX_FONT_SCALE) next = MAX_FONT_SCALE;
      return Number(next.toFixed(2));
    });
  };

  const resetFont = () => setFontScale(baseFontScale);
  const isDefault = Math.abs(fontScale - baseFontScale) < 0.01;
  const canCopy = typeof Clipboard?.setStringAsync === 'function';

  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduceMotion ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Kapat"
        />

        <View style={[styles.modalCard, {
          backgroundColor: theme.surface,
          borderColor: highContrast ? theme.text : theme.border,
          borderWidth: highContrast ? 2 : 1,
          paddingBottom: Math.max(insets.bottom, 16),
        }]}>
          <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />

          {/* Üst araç çubuğu */}
          <View style={styles.modalHeaderTool}>
            <View style={styles.toolBtnSpacer} />

            <View style={[styles.modalBadge, {
              backgroundColor: highContrast ? '#000000' : theme.primaryGlow,
              borderWidth: highContrast ? 2 : 0,
              borderColor: theme.border,
            }]}>
              <Text style={[styles.modalBadgeText, {
                color: accent,
                fontWeight: '800',
                fontSize: Math.round(12 * baseFontScale),
              }]}>
                {item.id} / 99
              </Text>
            </View>

            <View style={styles.toolBtnGroup}>
              {canCopy && (
                <TouchableOpacity
                  onPress={() => { haptic(); handleCopy(); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={styles.toolBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Kopyala"
                >
                  <Ionicons name="copy-outline" size={22 * baseFontScale} color={theme.textDim} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => { haptic(); handleShare(); }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.toolBtn}
                accessibilityRole="button"
                accessibilityLabel="Paylaş"
              >
                <Ionicons name="share-social-outline" size={22 * baseFontScale} color={theme.textDim} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Font kontrol çubuğu */}
          <View style={[styles.controlBar, {
            backgroundColor: highContrast ? '#121212' : theme.surfaceElevated,
            borderColor: theme.border,
            borderWidth: highContrast ? 2 : 1,
          }]}>
            <View style={styles.controlLeft}>
              <Ionicons name="text-outline" size={16 * baseFontScale} color={accent} />
              <Text style={[styles.controlTitle, {
                color: theme.text,
                fontWeight: highContrast ? '900' : '700',
                fontSize: Math.round(12 * baseFontScale),
              }]}>
                Yazı Boyutu
              </Text>
            </View>

            <View style={styles.fontCtrls}>
              <TouchableOpacity
                onPress={() => { haptic(); bumpFont(-FONT_STEP); }}
                style={[styles.fontBtn, {
                  borderColor: theme.border,
                  backgroundColor: highContrast ? '#1E1E1E' : theme.surface,
                  borderWidth: highContrast ? 2 : 1,
                }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Yazıyı küçült"
              >
                <Ionicons name="remove" size={16} color={theme.text} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { haptic(); resetFont(); }}
                style={styles.fontPctContainer}
                accessibilityRole="button"
                accessibilityLabel="Yazı boyutunu varsayılana döndür"
                accessibilityState={{ disabled: isDefault }}
              >
                <Text style={[styles.fontPct, {
                  color: accent,
                  fontWeight: '800',
                  fontSize: Math.round(12 * baseFontScale),
                }]}>
                  {Math.round(fontScale * 100)}%
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { haptic(); bumpFont(FONT_STEP); }}
                style={[styles.fontBtn, {
                  borderColor: theme.border,
                  backgroundColor: highContrast ? '#1E1E1E' : theme.surface,
                  borderWidth: highContrast ? 2 : 1,
                }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Yazıyı büyüt"
              >
                <Ionicons name="add" size={16} color={theme.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* İçerik */}
          <View style={styles.pinchWrap}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              minimumZoomScale={1}
              maximumZoomScale={3}
              bouncesZoom
            >
              {showArabic && item.arabic ? (
                <Text style={[styles.modalArabic, {
                  color: accent,
                  fontSize: Math.round(38 * fontScale),
                  lineHeight: Math.round(58 * fontScale),
                  fontWeight: highContrast ? '900' : '700',
                }]}>
                  {item.arabic}
                </Text>
              ) : null}

              <Text style={[styles.modalName, {
                color: theme.text,
                fontSize: Math.round(22 * fontScale),
                fontWeight: '900',
              }]}>
                {item.name}
              </Text>

              <View style={[styles.modalDivider, {
                backgroundColor: theme.border,
                height: highContrast ? 2 : 1,
              }]} />

              <Text style={[styles.modalMeaning, {
                color: theme.text,
                fontSize: Math.round(16.5 * fontScale),
                lineHeight: Math.round(26 * fontScale),
                fontWeight: highContrast ? '700' : '500',
              }]}>
                {item.meaning}
              </Text>
            </ScrollView>
          </View>

          {/* Alt navigasyon */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              onPress={() => { haptic(); onPrev(); }}
              disabled={currentIndex <= 0}
              style={[styles.navBtn, {
                backgroundColor: highContrast ? '#1E1E1E' : theme.surfaceElevated,
                borderWidth: highContrast ? 2 : 0,
                borderColor: theme.border,
                opacity: currentIndex <= 0 ? 0.4 : 1,
              }]}
              accessibilityRole="button"
              accessibilityLabel="Önceki isim"
            >
              <Ionicons name="chevron-back" size={20 * baseFontScale} color={theme.text} />
              <Text style={[styles.navBtnText, {
                color: theme.text,
                fontWeight: '700',
                fontSize: Math.round(13 * baseFontScale),
              }]}>
                Önceki
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { haptic(); onClose(); }}
              style={[styles.closeBtn, {
                backgroundColor: accent,
                borderWidth: highContrast ? 2 : 0,
                borderColor: '#000000',
              }]}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <Text style={[styles.closeBtnText, {
                color: highContrast ? '#000000' : '#FFFFFF',
                fontWeight: '800',
                fontSize: Math.round(15 * baseFontScale),
              }]}>
                Tamam
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => { haptic(); onNext(); }}
              disabled={currentIndex >= totalCount - 1}
              style={[styles.navBtn, {
                backgroundColor: highContrast ? '#1E1E1E' : theme.surfaceElevated,
                borderWidth: highContrast ? 2 : 0,
                borderColor: theme.border,
                opacity: currentIndex >= totalCount - 1 ? 0.4 : 1,
              }]}
              accessibilityRole="button"
              accessibilityLabel="Sonraki isim"
            >
              <Text style={[styles.navBtnText, {
                color: theme.text,
                fontWeight: '700',
                fontSize: Math.round(13 * baseFontScale),
              }]}>
                Sonraki
              </Text>
              <Ionicons name="chevron-forward" size={20 * baseFontScale} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   Ana Ekran
   ================================================================ */
export default function EsmaulHusnaScreen({ onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const getTheme = useAppStore((s) => s.getTheme);
  const highContrast = useAppStore((s) => s.highContrast);
  const showArabic = useAppStore((s) => s.showArabic) ?? true;
  const readingFontScale = useAppStore((s) => s.readingFontScale) ?? 1.0;
  const reduceMotion = useAppStore((s) => s.reduceMotion) ?? false;
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

  const statusBarStyle =
    highContrast || rawTheme.mode === 'dark' || rawTheme.mode === 'oled'
      ? 'light-content'
      : 'dark-content';

  const filteredData = useMemo(() => {
    const q = searchQuery.trim().toLocaleLowerCase('tr-TR');
    if (!q) return NORMALIZED_LIST;
    return NORMALIZED_LIST.filter((item) => item._searchKey.includes(q));
  }, [searchQuery]);

  const currentModalIndex = useMemo(() => {
    if (!selectedItem) return -1;
    return filteredData.findIndex((item) => item.id === selectedItem.id);
  }, [selectedItem, filteredData]);

  const handlePrevModal = useCallback(() => {
    if (currentModalIndex > 0) {
      haptic();
      setSelectedItem(filteredData[currentModalIndex - 1]);
    }
  }, [currentModalIndex, filteredData]);

  const handleNextModal = useCallback(() => {
    if (currentModalIndex >= 0 && currentModalIndex < filteredData.length - 1) {
      haptic();
      setSelectedItem(filteredData[currentModalIndex + 1]);
    }
  }, [currentModalIndex, filteredData]);

  const handleSelect = useCallback((item) => {
    haptic();
    setSelectedItem(item);
  }, []);

  const clearSearch = useCallback(() => {
    haptic();
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const handleBack = useCallback(() => {
    haptic();
    onBack?.();
  }, [onBack]);

  const renderItem = useCallback(
    ({ item }) => (
      <EsmaCard
        item={item}
        theme={theme}
        onSelect={handleSelect}
        highContrast={highContrast}
        fontScale={readingFontScale}
        reduceMotion={reduceMotion}
        showArabic={showArabic}
        largeTouchTargets={largeTouchTargets}
      />
    ),
    [theme, highContrast, readingFontScale, reduceMotion, showArabic, largeTouchTargets, handleSelect],
  );

  const isSearching = searchQuery.trim().length > 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={statusBarStyle} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          style={[styles.backBtn, {
            backgroundColor: theme.surface,
            borderColor: highContrast ? theme.text : theme.border,
            borderWidth: highContrast ? 2 : 1,
          }]}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
        >
          <Ionicons name="chevron-back" size={24 * readingFontScale} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text
            style={[styles.headerTitle, {
              color: theme.text,
              fontWeight: '900',
              fontSize: Math.round(20 * readingFontScale),
            }]}
            numberOfLines={1}
          >
            Esmaül Hüsna
          </Text>
          <Text
            style={[styles.headerSub, {
              color: theme.textDim,
              fontWeight: highContrast ? '700' : '600',
              fontSize: Math.round(11.5 * readingFontScale),
            }]}
            numberOfLines={1}
            accessibilityLiveRegion="polite"
          >
            {isSearching
              ? `${filteredData.length} / 99 isim`
              : "Allah'ın 99 ismi"}
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <View style={[styles.searchBox, {
          backgroundColor: highContrast ? '#121212' : theme.surfaceElevated,
          borderColor: isSearchFocused ? theme.primary : theme.border,
          borderWidth: highContrast ? 2 : 1,
          minHeight: largeTouchTargets ? 54 : 48,
        }]}>
          <Ionicons
            name="search"
            size={20 * readingFontScale}
            color={isSearchFocused ? theme.primary : theme.textDim}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, {
              color: theme.text,
              fontWeight: highContrast ? '700' : '500',
              fontSize: Math.round(15 * readingFontScale),
            }]}
            placeholder="İsim veya anlam ara…"
            placeholderTextColor={theme.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Esma ara"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={clearSearch}
              hitSlop={10}
              style={styles.clearBtn}
              accessibilityRole="button"
              accessibilityLabel="Aramayı temizle"
            >
              <Ionicons name="close-circle" size={18 * readingFontScale} color={theme.textDim} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={false}
        ListEmptyComponent={
          <EmptyState
            theme={theme}
            highContrast={highContrast}
            fontScale={readingFontScale}
            icon="search-outline"
            title="Sonuç bulunamadı"
            subtitle={`"${searchQuery.trim()}" için eşleşen isim yok. Farklı bir kelime deneyin.`}
          />
        }
      />

      {/* Detail Modal */}
      <DetailModal
        item={selectedItem}
        visible={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        onPrev={handlePrevModal}
        onNext={handleNextModal}
        currentIndex={currentModalIndex}
        totalCount={filteredData.length}
        theme={theme}
        highContrast={highContrast}
        showArabic={showArabic}
        readingFontScale={readingFontScale}
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
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  headerTitle: { fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  headerSub: { marginTop: 2, textAlign: 'center' },
  headerSpacer: { width: 44, height: 44 },

  /* Search */
  searchWrapper: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.lg },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    height: 48, borderRadius: RADIUS.lg, borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1, height: '100%',
    paddingVertical: Platform.OS === 'android' ? 8 : 0,
  },
  clearBtn: { padding: 4 },

  /* List */
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl + 20,
  },
  card: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  numberBadge: {
    justifyContent: 'center', alignItems: 'center',
    marginRight: SPACING.md,
  },
  numberText: { fontWeight: '900' },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 2, paddingRight: 8,
  },
  name: { fontWeight: '800', flex: 1 },
  arabicText: { fontWeight: '700', marginLeft: 6, flexShrink: 0 },
  meaning: {},
  chevron: { paddingLeft: 4, opacity: 0.5 },

  /* Empty */
  emptyBox: {
    alignItems: 'center', justifyContent: 'center',
    paddingTop: 56, paddingBottom: 30, paddingHorizontal: 28,
  },
  emptyIcon: {
    width: 76, height: 76, borderRadius: 38,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontWeight: '800', marginBottom: 8, textAlign: 'center' },
  emptyText: { textAlign: 'center' },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: RADIUS.hero,
    borderTopRightRadius: RADIUS.hero,
    borderWidth: 1,
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40, height: 5, borderRadius: 3, marginBottom: SPACING.lg,
  },

  modalHeaderTool: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toolBtn: { padding: 4 },
  toolBtnGroup: { flexDirection: 'row', gap: 4 },
  toolBtnSpacer: { width: 30 },
  modalBadge: {
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.sm,
  },
  modalBadgeText: { fontWeight: '800' },

  controlBar: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  controlLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  controlTitle: { fontWeight: '700' },
  fontCtrls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fontBtn: {
    width: 32, height: 32, borderRadius: RADIUS.sm,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  fontPctContainer: {
    paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center',
  },
  fontPct: { fontWeight: '800', minWidth: 38, textAlign: 'center' },

  pinchWrap: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 1,
    marginBottom: SPACING.lg,
  },
  modalScroll: { width: '100%' },
  modalScrollContent: { paddingBottom: 8, alignItems: 'center' },
  modalArabic: {
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: 8,
    writingDirection: 'rtl',
  },
  modalName: { fontWeight: '900', textAlign: 'center' },
  modalDivider: { width: '100%', marginVertical: 14 },
  modalMeaning: {
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  modalFooter: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    alignItems: 'center',
    paddingTop: SPACING.sm,
  },
  navBtn: {
    flex: 1, height: 46, borderRadius: RADIUS.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  navBtnText: { fontWeight: '700' },
  closeBtn: {
    flex: 1.2, height: 46, borderRadius: RADIUS.md,
    justifyContent: 'center', alignItems: 'center',
  },
  closeBtnText: { fontWeight: '800' },
});