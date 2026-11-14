// src/screens/ZikirmatikScreen.js
import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Pressable,
  StatusBar,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Animated,
  useWindowDimensions,
  Easing,
} from 'react-native';
import { AppText as Text, AppTextInput as TextInput } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useAppStore,
  useReadingFontScale,
  useGlobalHaptic,
  useZikirCount,
} from '../store/useAppStore';
import { PRESET_ZIKIRS, CATEGORIES, TARGET_OPTIONS, SORT_OPTIONS } from '../data/zikirData';

/* ================================================================
   Haptics
   ================================================================ */
let Haptics = null;
try {
  Haptics = require('expo-haptics');
} catch {}

const hapticFeedback = (style = 'light') => {
  try {
    const enabled = useAppStore.getState().globalHaptic;
    if (enabled === false) return;
    if (!Haptics) return;
    if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (style === 'heavy') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (style === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {}
};

const FONT_SCALES = [1.0, 1.15, 1.3];
const FONT_LABELS = ['Aa', 'Aa+', 'Aa++'];
const FONT_NAMES = ['Normal', 'Büyük', 'Çok Büyük'];
const DEFAULT_TARGET = 33;

const formatCount = (n) => {
  const num = Number(n) || 0;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
};

/* ================================================================
   Dialog — Alert.alert yerine web-uyumlu modal
   ================================================================ */
const AppDialog = memo(function AppDialog({
  dialog,
  onClose,
  theme,
  highContrast,
  fontScale,
}) {
  if (!dialog) return null;
  const {
    type = 'confirm',
    title,
    message,
    confirmText,
    cancelText,
    destructive,
    onConfirm,
  } = dialog;
  const isInfo = type === 'info';

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.dialogOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityLabel="Kapat"
        />
        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: highContrast ? 2 : 1,
            },
          ]}
        >
          <Text
            style={[
              styles.dialogTitle,
              {
                color: theme.text,
                fontSize: Math.round(18 * fontScale),
                fontWeight: '900',
              },
            ]}
          >
            {title}
          </Text>
          {message ? (
            <Text
              style={[
                styles.dialogMessage,
                {
                  color: theme.textDim,
                  fontSize: Math.round(14 * fontScale),
                  fontWeight: highContrast ? '600' : '400',
                },
              ]}
            >
              {message}
            </Text>
          ) : null}
          <View style={styles.dialogActions}>
            {!isInfo ? (
              <TouchableOpacity
                onPress={onClose}
                style={[styles.dialogBtn, { borderColor: theme.border }]}
                accessibilityRole="button"
                accessibilityLabel={cancelText || 'Vazgeç'}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dialogBtnText,
                    {
                      color: theme.text,
                      fontSize: Math.round(14 * fontScale),
                      fontWeight: '700',
                    },
                  ]}
                >
                  {cancelText || 'Vazgeç'}
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={() => {
                const cb = onConfirm;
                onClose();
                setTimeout(() => cb?.(), 0);
              }}
              style={[
                styles.dialogBtn,
                {
                  backgroundColor: destructive ? '#EF4444' : theme.primary,
                  borderColor: destructive ? '#EF4444' : theme.primary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={confirmText || (isInfo ? 'Tamam' : 'Onayla')}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.dialogBtnText,
                  {
                    color: '#FFF',
                    fontSize: Math.round(14 * fontScale),
                    fontWeight: '800',
                  },
                ]}
              >
                {confirmText || (isInfo ? 'Tamam' : 'Onayla')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   Toast
   ================================================================ */
const Toast = memo(function Toast({ message, visible, theme, fontScale, reduceMotion }) {
  const translateY = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      translateY.setValue(visible ? 0 : -20);
      opacity.setValue(visible ? 1 : 0);
      return;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: visible ? 0 : -20,
        duration: visible ? 220 : 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: visible ? 220 : 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, translateY, opacity, reduceMotion]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toast,
        { backgroundColor: theme.primary, opacity, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name="checkmark-circle" size={18 * fontScale} color="#FFF" />
      <Text style={[styles.toastText, { fontSize: Math.round(13.5 * fontScale) }]} numberOfLines={2}>
        {message}
      </Text>
    </Animated.View>
  );
});

/* ================================================================
   BeadCounter — Dairesel Tesbih Görünümü
   ================================================================ */
const BeadCounter = memo(({
  count,
  target,
  isCompleted,
  surfaceElevated,
  theme,
  fontScale,
  onPress,
  pressAnim,
  highContrast,
}) => {
  const { width } = useWindowDimensions();
  const ring = Math.min(260, width - 80);
  const beadCount = Math.min(target, 33);
  const beadSize = beadCount > 20 ? 10 : 16;
  const radius = ring / 2 - 14;
  const accent = isCompleted ? (highContrast ? '#00FF00' : '#24A875') : theme.primary;

  const beads = useMemo(() => Array.from({ length: beadCount }, (_, i) => {
    const angle = (i / beadCount) * Math.PI * 2;
    return {
      i,
      x: ring / 2 + radius * Math.sin(angle),
      y: ring / 2 - radius * Math.cos(angle),
    };
  }), [beadCount, ring, radius]);

  const progressRatio = target > 0 ? count / target : 0;
  const filledBeadsCount = Math.floor(progressRatio * beadCount);

  return (
    <View style={styles.counterSection}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Zikir sayacı ${count} / ${target}. Artırmak için dokun.`}
        accessibilityHint="Her dokunuşta bir zikir eklenir"
        android_ripple={{ color: 'transparent' }}
      >
        <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
          <View style={{ width: ring, height: ring, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                position: 'absolute',
                width: ring - 24,
                height: ring - 24,
                borderRadius: (ring - 24) / 2,
                backgroundColor: highContrast ? '#121212' : surfaceElevated,
                borderWidth: highContrast ? 3 : 2,
                borderColor: highContrast ? '#FFFF00' : `${accent}33`,
              }}
            />
            {beads.map((b) => {
              const isFilled = b.i < filledBeadsCount || isCompleted;
              return (
                <View
                  key={b.i}
                  style={{
                    position: 'absolute',
                    left: b.x - beadSize / 2,
                    top: b.y - beadSize / 2,
                    width: beadSize,
                    height: beadSize,
                    borderRadius: beadSize / 2,
                    backgroundColor: isFilled ? accent : theme.border,
                    borderWidth: isFilled ? (highContrast ? 1 : 0) : 1,
                    borderColor: highContrast ? '#FFFFFF' : theme.border,
                  }}
                />
              );
            })}
            <View style={styles.counterCenter} pointerEvents="none">
              <MaterialCommunityIcons
                name={isCompleted ? 'check-decagram' : 'hands-pray'}
                size={30 * fontScale}
                color={accent}
              />
              <Text
                style={[
                  styles.counterCount,
                  {
                    color: theme.text,
                    fontSize: 52 * fontScale,
                    fontWeight: '900',
                  },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {count}
              </Text>
              <Text
                style={[
                  styles.counterSub,
                  {
                    color: accent,
                    fontSize: 11 * fontScale,
                    fontWeight: '900',
                  },
                ]}
              >
                {isCompleted ? 'TAMAMLANDI' : `/ ${target}`}
              </Text>
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
});

/* ================================================================
   ZikirItem — Kütüphane Liste Elemanı
   ================================================================ */
const ZikirItem = memo(({
  item,
  isSelected,
  isFavorite,
  savedCount,
  theme,
  surfaceElevated,
  fontScale,
  onSelect,
  onToggleFavorite,
  onDelete,
  highContrast,
}) => {
  const hasSavedCount = savedCount > 0;

  return (
    <View
      style={[
        styles.presetTile,
        {
          backgroundColor: isSelected ? (highContrast ? '#1E1E1E' : surfaceElevated) : theme.surface,
          borderColor: isSelected ? theme.primary : theme.border,
          borderWidth: highContrast ? 2 : 1,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.presetMain}
        onPress={() => onSelect(item)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
        accessibilityLabel={`${item.name}. ${item.category}. Hedef ${item.target}.${
          hasSavedCount ? ` Kayıtlı sayaç: ${savedCount}.` : ''
        }${isSelected ? ' Seçili.' : ''}`}
        accessibilityHint={isSelected ? '' : 'Seçmek için dokun · Sayaç korunur'}
      >
        <View
          style={[
            styles.presetIcon,
            {
              backgroundColor: isSelected
                ? (highContrast ? '#000000' : `${theme.primary}20`)
                : theme.background,
              borderWidth: highContrast ? 2 : 0,
              borderColor: theme.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name={item.isCustom ? 'account-edit-outline' : 'hands-pray'}
            size={20 * fontScale}
            color={isSelected ? theme.primary : theme.textDim}
          />
        </View>

        <View style={styles.presetTextContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <Text
              style={[
                styles.presetName,
                {
                  color: isSelected ? theme.primary : theme.text,
                  fontSize: 14 * fontScale,
                  lineHeight: 20 * fontScale,
                  fontWeight: highContrast ? '900' : '700',
                },
              ]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            {hasSavedCount ? (
              <View
                style={[
                  styles.savedCountBadge,
                  {
                    backgroundColor: isSelected ? theme.primary : `${theme.primary}22`,
                    borderColor: isSelected ? theme.primary : `${theme.primary}44`,
                  },
                ]}
              >
                <Ionicons
                  name="bookmark"
                  size={9 * fontScale}
                  color={isSelected ? '#FFF' : theme.primary}
                />
                <Text
                  style={[
                    styles.savedCountText,
                    {
                      color: isSelected ? '#FFF' : theme.primary,
                      fontSize: 10.5 * fontScale,
                      fontWeight: '900',
                    },
                  ]}
                >
                  {formatCount(savedCount)}
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              styles.presetDescription,
              {
                color: theme.textDim,
                fontSize: 11 * fontScale,
                marginTop: 4 * fontScale,
                fontWeight: highContrast ? '700' : 'normal',
              },
            ]}
          >
            {item.category} · Hedef: {item.target}
          </Text>
        </View>

        {isSelected && <Ionicons name="checkmark-circle" size={21 * fontScale} color={theme.primary} />}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onToggleFavorite(item)}
        style={styles.favoriteButton}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
        accessibilityState={{ selected: isFavorite }}
      >
        <Ionicons
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={20 * fontScale}
          color={isFavorite ? '#E45B75' : theme.textDim}
        />
      </TouchableOpacity>

      {item.isCustom && (
        <TouchableOpacity
          onPress={() => onDelete(item)}
          style={styles.deleteButton}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Zikri sil"
        >
          <Ionicons name="trash-outline" size={18 * fontScale} color={theme.textDim} />
        </TouchableOpacity>
      )}
    </View>
  );
});

/* ================================================================
   Ana Ekran Component
   ================================================================ */
export default function ZikirmatikScreen({ onBack }) {
  const flatListRef = useRef(null);
  const pressAnim = useRef(new Animated.Value(1)).current;

  /* ---------- Store State ---------- */
  const selectedZikirId = useAppStore((s) => s.selectedZikirId);
  const customZikirs = useAppStore((s) => s.customZikirs) || [];
  const favorites = useAppStore((s) => s.favoriteZikirs) || [];

  const zikirCounts = useAppStore((s) => s.zikirCounts) || {};
  const count = useZikirCount();
  const targetOverride = useAppStore((s) => s.zikirTargets?.[s.selectedZikirId]);

  const setZikirCount = useAppStore((s) => s.setZikirCount);
  const resetZikirCount = useAppStore((s) => s.resetZikirCount);
  const resetAllZikirCounts = useAppStore((s) => s.resetAllZikirCounts);
  const setZikirTarget = useAppStore((s) => s.setZikirTarget);
  const setSelectedZikirId = useAppStore((s) => s.setSelectedZikirId);
  const setCustomZikirs = useAppStore((s) => s.setCustomZikirs);
  const setFavorites = useAppStore((s) => s.setFavoriteZikirs);

  /* ---------- Ayarlar Entegrasyonu ---------- */
  const readingFontScale = useReadingFontScale();
  const globalHaptic = useGlobalHaptic();
  const setReadingFontScale = useAppStore((s) => s.setReadingFontScale);
  const setGlobalHaptic = useAppStore((s) => s.setGlobalHaptic);
  const highContrast = useAppStore((s) => s.highContrast);
  const reduceMotion = useAppStore((s) => s.reduceMotion) ?? false;

  const fontScale = readingFontScale || 1;
  const fontIdx = useMemo(() => {
    const idx = FONT_SCALES.findIndex((v) => Math.abs(v - fontScale) < 0.01);
    return idx >= 0 ? idx : 0;
  }, [fontScale]);

  /* ---------- Local State ---------- */
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [selectedSort, setSelectedSort] = useState('default');
  const [searchText, setSearchText] = useState('');

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newZikirName, setNewZikirName] = useState('');
  const [newZikirTarget, setNewZikirTarget] = useState(String(DEFAULT_TARGET));
  const [newZikirCategory, setNewZikirCategory] = useState('Kişisel');

  const [libraryYPosition, setLibraryYPosition] = useState(0);

  /* ---------- Dialog State ---------- */
  const [dialog, setDialog] = useState(null);
  const closeDialog = useCallback(() => setDialog(null), []);

  /* ---------- Toast Feedback ---------- */
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message: msg, visible: true });
    toastTimerRef.current = setTimeout(() => {
      setToast((p) => ({ ...p, visible: false }));
    }, 2400);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  /* ---------- Tema Kurulumu ---------- */
  const getTheme = useAppStore((state) => state.getTheme);
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

  /* ---------- Türetilen Değerler ---------- */
  const allZikirs = useMemo(() => [...PRESET_ZIKIRS, ...customZikirs], [customZikirs]);
  const selectedZikir = useMemo(
    () => allZikirs.find((item) => item.id === selectedZikirId),
    [allZikirs, selectedZikirId],
  );

  const target = targetOverride != null
    ? targetOverride
    : (selectedZikir?.target ?? DEFAULT_TARGET);

  const activeCounterCount = useMemo(() => {
    return Object.values(zikirCounts).filter((c) => Number(c) > 0).length;
  }, [zikirCounts]);

  const filteredZikirs = useMemo(() => {
    let list = allZikirs.filter((item) => {
      const matchesCategory = selectedCategory === 'Tümü' ||
        (selectedCategory === 'Favoriler'
          ? favorites.includes(item.id)
          : item.category === selectedCategory);
      const normalizedName = item.name.toLocaleLowerCase('tr-TR');
      const normalizedSearch = searchText.trim().toLocaleLowerCase('tr-TR');
      return matchesCategory && normalizedName.includes(normalizedSearch);
    });

    if (selectedSort === 'alpha') {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
    } else if (selectedSort === 'target-asc') {
      list = [...list].sort((a, b) => a.target - b.target);
    } else if (selectedSort === 'target-desc') {
      list = [...list].sort((a, b) => b.target - a.target);
    }

    return list;
  }, [allZikirs, selectedCategory, favorites, searchText, selectedSort]);

  const statusBarStyle = highContrast || rawTheme.mode === 'dark' || rawTheme.mode === 'oled'
    ? 'light-content' : 'dark-content';

  const progress = target > 0 ? Math.min(count / target, 1) : 0;
  const remaining = Math.max(target - count, 0);
  const isCompleted = count >= target && target > 0;
  const surfaceElevated = theme.surfaceElevated || theme.surface;

  useEffect(() => {
    if (isCompleted && count === target && globalHaptic !== false) {
      hapticFeedback('success');
    }
  }, [count, target, isCompleted, globalHaptic]);

  /* ---------- Animasyonlar ---------- */
  const animatePressIn = useCallback(() => {
    if (reduceMotion) return;
    Animated.spring(pressAnim, {
      toValue: 0.95, useNativeDriver: true, speed: 60, bounciness: 6,
    }).start();
  }, [pressAnim, reduceMotion]);

  const animatePressOut = useCallback(() => {
    if (reduceMotion) return;
    Animated.spring(pressAnim, {
      toValue: 1, useNativeDriver: true, speed: 60, bounciness: 6,
    }).start();
  }, [pressAnim, reduceMotion]);

  /* ---------- İşleyiciler ---------- */
  const handleIncrement = useCallback(() => {
    hapticFeedback('light');
    animatePressIn();
    setTimeout(animatePressOut, 50);
    setZikirCount((prev) => (Number(prev) || 0) + 1, selectedZikirId);
  }, [animatePressIn, animatePressOut, setZikirCount, selectedZikirId]);

  const handleUndo = useCallback(() => {
    hapticFeedback('medium');
    setZikirCount((prev) => Math.max(0, (Number(prev) || 0) - 1), selectedZikirId);
  }, [setZikirCount, selectedZikirId]);

  const handleReset = useCallback(() => {
    hapticFeedback('warning');
    const zikirName = selectedZikir?.name ?? 'Bu zikir';
    setDialog({
      type: 'confirm',
      title: 'Sayacı sıfırla',
      message: `"${zikirName}" için ${count} zikir sıfırlanacak. Bu işlem geri alınamaz.`,
      confirmText: 'Sıfırla',
      cancelText: 'Vazgeç',
      destructive: true,
      onConfirm: () => {
        try {
          resetZikirCount(selectedZikirId);
          hapticFeedback('success');
          showToast('Sayaç sıfırlandı');
        } catch {
          showToast('Sıfırlama başarısız oldu');
        }
      },
    });
  }, [count, selectedZikir, resetZikirCount, selectedZikirId, showToast]);

  const handleResetAll = useCallback(() => {
    hapticFeedback('warning');
    const totalCount = Object.values(zikirCounts).reduce(
      (sum, c) => sum + (Number(c) || 0),
      0,
    );
    setDialog({
      type: 'confirm',
      title: 'Tüm sayaçları sıfırla',
      message: `${activeCounterCount} zikirde toplam ${totalCount} sayaç değeri silinecek. Bu işlem geri alınamaz.`,
      confirmText: 'Tümünü Sıfırla',
      cancelText: 'Vazgeç',
      destructive: true,
      onConfirm: () => {
        resetAllZikirCounts();
        hapticFeedback('success');
        showToast('Tüm sayaçlar sıfırlandı');
      },
    });
  }, [activeCounterCount, zikirCounts, resetAllZikirCounts, showToast]);

  const handleSelectZikir = useCallback((item) => {
    if (item.id === selectedZikirId) return;

    hapticFeedback('light');
    const newSavedCount = Number(zikirCounts[item.id]) || 0;
    const prevSavedCount = Number(zikirCounts[selectedZikirId]) || 0;

    setSelectedZikirId(item.id);

    if (newSavedCount > 0) {
      showToast(`"${item.name}" · ${newSavedCount} zikir korundu`);
    } else if (prevSavedCount > 0) {
      showToast(`"${selectedZikir?.name ?? 'Önceki zikir'}" sayacı saklandı · ${prevSavedCount}`);
    }
  }, [selectedZikirId, zikirCounts, selectedZikir, setSelectedZikirId, showToast]);

  const handleSelectTarget = useCallback((newTarget) => {
    hapticFeedback('light');
    setZikirTarget(newTarget, selectedZikirId);
    showToast(`Hedef: ${newTarget}`);
  }, [setZikirTarget, selectedZikirId, showToast]);

  const handleToggleFavorite = useCallback((item) => {
    hapticFeedback('light');
    setFavorites((prev) =>
      prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
    );
  }, [setFavorites]);

  const handleDeleteCustomZikir = useCallback((item) => {
    setDialog({
      type: 'confirm',
      title: 'Zikri sil',
      message: `"${item.name}" kişisel zikir listesinden silinsin mi? Sayacı da sıfırlanır.`,
      confirmText: 'Sil',
      cancelText: 'Vazgeç',
      destructive: true,
      onConfirm: () => {
        setZikirCount(0, item.id);
        setCustomZikirs((prev) => prev.filter((z) => z.id !== item.id));
        setFavorites((prev) => prev.filter((id) => id !== item.id));
        if (selectedZikirId === item.id) {
          const fallback = PRESET_ZIKIRS[0]?.id ?? 'z1';
          setSelectedZikirId(fallback);
        }
        hapticFeedback('success');
        showToast('Zikir silindi');
      },
    });
  }, [selectedZikirId, setZikirCount, setCustomZikirs, setFavorites, setSelectedZikirId, showToast]);

  const handleAddCustomZikir = useCallback(() => {
    const name = newZikirName.trim();
    const parsedTarget = Number(newZikirTarget);

    if (!name) {
      setDialog({
        type: 'info',
        title: 'Zikir adı gerekli',
        message: 'Lütfen bir zikir adı girin.',
        confirmText: 'Tamam',
      });
      return;
    }
    if (!Number.isInteger(parsedTarget) || parsedTarget < 1 || parsedTarget > 1000000) {
      setDialog({
        type: 'info',
        title: 'Geçersiz hedef',
        message: 'Hedef 1 ile 1.000.000 arasında bir tam sayı olmalıdır.',
        confirmText: 'Tamam',
      });
      return;
    }

    const newItem = {
      id: `custom-${Date.now()}`,
      name,
      target: parsedTarget,
      category: newZikirCategory,
      isCustom: true,
    };

    setCustomZikirs((prev) => [newItem, ...prev]);
    setSelectedZikirId(newItem.id);
    setSelectedCategory(newZikirCategory);
    setSearchText('');
    setZikirCount(0, newItem.id);

    setNewZikirName('');
    setNewZikirTarget(String(DEFAULT_TARGET));
    setNewZikirCategory('Kişisel');
    setAddModalVisible(false);

    hapticFeedback('success');
    showToast(`"${name}" eklendi · Hedef ${parsedTarget}`);
  }, [
    newZikirName,
    newZikirTarget,
    newZikirCategory,
    setCustomZikirs,
    setSelectedZikirId,
    setZikirCount,
    showToast,
  ]);

  const handleCycleFont = useCallback(() => {
    hapticFeedback('light');
    const nextIdx = (fontIdx + 1) % FONT_SCALES.length;
    setReadingFontScale(FONT_SCALES[nextIdx]);
  }, [fontIdx, setReadingFontScale]);

  const handleToggleVibration = useCallback(() => {
    hapticFeedback('medium');
    setGlobalHaptic(!globalHaptic);
  }, [globalHaptic, setGlobalHaptic]);

  const handleScrollToLibrary = useCallback(() => {
    hapticFeedback('light');
    if (flatListRef.current && libraryYPosition > 0) {
      flatListRef.current.scrollToOffset({ offset: libraryYPosition, animated: true });
    }
  }, [libraryYPosition]);

  /* ---------- Header Renderer ---------- */
  const renderHeader = () => (
    <>
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: highContrast ? 2 : 1,
          },
        ]}
      >
        <View style={styles.infoLeft}>
          <MaterialCommunityIcons name="target" size={23 * fontScale} color={theme.primary} />
          <View style={styles.infoTextContainer}>
            <Text
              style={[
                styles.infoLabel,
                {
                  color: theme.textDim,
                  fontSize: 11 * fontScale,
                  fontWeight: highContrast ? '700' : 'normal',
                },
              ]}
            >
              MEVCUT HEDEF
            </Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color: theme.text,
                  fontSize: 15 * fontScale,
                  fontWeight: highContrast ? '900' : '800',
                },
              ]}
            >
              {target} zikir
            </Text>
          </View>
        </View>
        <View style={styles.infoRight}>
          <Text
            style={[
              styles.remainingText,
              {
                color: isCompleted ? (highContrast ? '#00FF00' : '#24A875') : theme.textDim,
                fontSize: 12 * fontScale,
                fontWeight: highContrast ? '900' : '800',
              },
            ]}
          >
            {isCompleted ? 'Hedef tamamlandı!' : `${remaining} kaldı`}
          </Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: theme.border,
              height: highContrast ? 8 : 6,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: isCompleted
                  ? (highContrast ? '#00FF00' : '#24A875')
                  : theme.primary,
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>
        <Text
          style={[
            styles.progressLabel,
            {
              color: theme.textDim,
              fontSize: 11 * fontScale,
              fontWeight: highContrast ? '700' : 'normal',
            },
          ]}
        >
          %{Math.round(progress * 100)} tamamlandı
        </Text>
      </View>

      <BeadCounter
        count={count}
        target={target}
        isCompleted={isCompleted}
        surfaceElevated={surfaceElevated}
        theme={theme}
        fontScale={fontScale}
        onPress={handleIncrement}
        pressAnim={pressAnim}
        highContrast={highContrast}
      />

      <View style={styles.actionRow}>
        <TouchableOpacity
          onPress={handleUndo}
          disabled={count === 0}
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: highContrast ? 2 : 1,
              opacity: count === 0 ? 0.45 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Son zikri geri al"
          accessibilityState={{ disabled: count === 0 }}
        >
          <Ionicons name="arrow-undo" size={18 * fontScale} color={theme.primary} />
          <Text
            style={[
              styles.actionText,
              {
                color: theme.text,
                fontSize: 13 * fontScale,
                fontWeight: highContrast ? '900' : '700',
              },
            ]}
          >
            Geri al
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleReset}
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: highContrast ? 2 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Bu zikri sıfırla${count > 0 ? ` (${count} zikir)` : ''}`}
        >
          <Ionicons name="refresh" size={18 * fontScale} color={theme.primary} />
          <Text
            style={[
              styles.actionText,
              {
                color: theme.text,
                fontSize: 13 * fontScale,
                fontWeight: highContrast ? '900' : '700',
              },
            ]}
          >
            Sıfırla
          </Text>
        </TouchableOpacity>
      </View>

      {activeCounterCount > 1 ? (
        <TouchableOpacity
          onPress={handleResetAll}
          style={[
            styles.resetAllBtn,
            {
              backgroundColor: 'transparent',
              borderColor: `${theme.textDim}44`,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Tüm ${activeCounterCount} sayacı sıfırla`}
        >
          <Ionicons name="trash-bin-outline" size={14 * fontScale} color={theme.textDim} />
          <Text
            style={[
              styles.resetAllText,
              {
                color: theme.textDim,
                fontSize: 12 * fontScale,
                fontWeight: highContrast ? '900' : '700',
              },
            ]}
          >
            Tüm sayaçları sıfırla ({activeCounterCount})
          </Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        onPress={handleScrollToLibrary}
        style={[
          styles.libraryJumpBtn,
          {
            backgroundColor: theme.surface,
            borderColor: theme.primary,
            borderWidth: highContrast ? 3 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Zikir kütüphanesine git"
      >
        <Ionicons name="library" size={20 * fontScale} color={theme.primary} />
        <Text
          style={[
            styles.libraryJumpBtnText,
            {
              color: theme.primary,
              fontSize: 14 * fontScale,
              fontWeight: highContrast ? '900' : '800',
            },
          ]}
        >
          Zikir Kütüphanesini Aç
        </Text>
      </TouchableOpacity>

      <Text
        style={[
          styles.sectionTitle,
          {
            color: theme.primary,
            fontSize: 11 * fontScale,
            fontWeight: '900',
          },
        ]}
      >
        ZİKİR HEDEFİ {targetOverride != null ? '· özel' : ''}
      </Text>
      <View style={styles.targetRow}>
        {TARGET_OPTIONS.map((option) => {
          const selected = target === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => handleSelectTarget(option)}
              style={[
                styles.targetChip,
                {
                  backgroundColor: selected ? surfaceElevated : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                  borderWidth: highContrast ? 2 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Hedef ${option}`}
              accessibilityState={{ selected }}
            >
              <Text
                style={[
                  styles.targetChipText,
                  {
                    color: selected ? theme.primary : theme.text,
                    fontSize: 13 * fontScale,
                    fontWeight: highContrast ? '900' : '800',
                  },
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View
        onLayout={(e) => setLibraryYPosition(e.nativeEvent.layout.y)}
        style={styles.libraryHeaderContainer}
      >
        <View style={styles.libraryHeader}>
          <View style={styles.libraryTitleContainer}>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.primary,
                  fontSize: 11 * fontScale,
                  marginTop: 0,
                  fontWeight: '900',
                },
              ]}
            >
              ZİKİR KÜTÜPHANESİ
            </Text>
            <Text
              style={[
                styles.librarySubtitle,
                {
                  color: theme.textDim,
                  fontSize: 12 * fontScale,
                  fontWeight: highContrast ? '700' : 'normal',
                },
              ]}
            >
              {filteredZikirs.length} zikir ·{' '}
              {activeCounterCount > 0 ? `${activeCounterCount} aktif sayaç` : 'Listeleniyor'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setAddModalVisible(true)}
            style={[
              styles.addZikirButton,
              {
                backgroundColor: theme.primary,
                borderWidth: highContrast ? 2 : 0,
                borderColor: '#000000',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Yeni zikir ekle"
          >
            <Ionicons name="add" size={20 * fontScale} color={highContrast ? '#000000' : '#FFFFFF'} />
            <Text
              style={[
                styles.addZikirButtonText,
                {
                  fontSize: 12 * fontScale,
                  color: highContrast ? '#000000' : '#FFFFFF',
                  fontWeight: highContrast ? '900' : '800',
                },
              ]}
            >
              Zikir ekle
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              borderWidth: highContrast ? 2 : 1,
            },
          ]}
        >
          <Ionicons name="search" size={19 * fontScale} color={theme.textDim} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Zikir ara..."
            placeholderTextColor={theme.textDim}
            style={[
              styles.searchInput,
              {
                color: theme.text,
                fontSize: 14 * fontScale,
                fontWeight: highContrast ? '700' : 'normal',
              },
            ]}
            returnKeyType="search"
            accessibilityLabel="Zikir ara"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchText('')}
              accessibilityRole="button"
              accessibilityLabel="Aramayı temizle"
            >
              <Ionicons name="close-circle" size={19 * fontScale} color={theme.textDim} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoryRow, { marginBottom: 8 }]}
        >
          {SORT_OPTIONS.map((s) => {
            const selected = selectedSort === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => {
                  hapticFeedback('light');
                  setSelectedSort(s.id);
                }}
                style={[
                  styles.sortChip,
                  {
                    backgroundColor: selected
                      ? (highContrast ? '#000000' : `${theme.primary}20`)
                      : theme.surface,
                    borderColor: selected ? theme.primary : theme.border,
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Sırala: ${s.label}`}
                accessibilityState={{ selected }}
              >
                <Text
                  style={[
                    styles.sortText,
                    {
                      color: selected ? theme.primary : theme.textDim,
                      fontSize: 11 * fontScale,
                      fontWeight: highContrast ? '900' : '800',
                    },
                  ]}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          {CATEGORIES.map((category) => {
            const selected = selectedCategory === category;
            return (
              <TouchableOpacity
                key={category}
                onPress={() => {
                  hapticFeedback('light');
                  setSelectedCategory(category);
                }}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selected ? theme.primary : theme.surface,
                    borderColor: selected ? theme.primary : theme.border,
                    borderWidth: highContrast ? 2 : 1,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Kategori: ${category}`}
                accessibilityState={{ selected }}
              >
                {category === 'Favoriler' && (
                  <Ionicons
                    name="heart"
                    size={13 * fontScale}
                    color={selected ? (highContrast ? '#000000' : '#FFFFFF') : '#E45B75'}
                    style={styles.categoryIcon}
                  />
                )}
                <Text
                  style={[
                    styles.categoryText,
                    {
                      color: selected ? (highContrast ? '#000000' : '#FFFFFF') : theme.text,
                      fontSize: 12 * fontScale,
                      fontWeight: highContrast ? '900' : '700',
                    },
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </>
  );

  const renderEmpty = () => (
    <View
      style={[
        styles.emptyCard,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: highContrast ? 2 : 1,
        },
      ]}
    >
      <Ionicons
        name={selectedCategory === 'Favoriler' ? 'heart-outline' : 'search-outline'}
        size={28 * fontScale}
        color={theme.textDim}
      />
      <Text
        style={[
          styles.emptyTitle,
          {
            color: theme.text,
            fontSize: 15 * fontScale,
            fontWeight: highContrast ? '900' : '800',
          },
        ]}
      >
        Zikir bulunamadı
      </Text>
      <Text
        style={[
          styles.emptyText,
          {
            color: theme.textDim,
            fontSize: 12 * fontScale,
            fontWeight: highContrast ? '700' : 'normal',
          },
        ]}
      >
        Aramanı değiştirebilir veya kendi zikrini ekleyebilirsin.
      </Text>
      <TouchableOpacity
        onPress={() => setAddModalVisible(true)}
        style={[
          styles.emptyAddButton,
          {
            backgroundColor: theme.primary,
            borderWidth: highContrast ? 2 : 0,
            borderColor: '#000000',
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Yeni zikir ekle"
      >
        <Text
          style={[
            styles.emptyAddButtonText,
            {
              fontSize: 13 * fontScale,
              color: highContrast ? '#000000' : '#FFFFFF',
              fontWeight: highContrast ? '900' : '800',
            },
          ]}
        >
          Zikir ekle
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => {
    const savedCount = Number(zikirCounts[item.id]) || 0;
    return (
      <ZikirItem
        item={item}
        isSelected={selectedZikirId === item.id}
        isFavorite={favorites.includes(item.id)}
        savedCount={savedCount}
        theme={theme}
        surfaceElevated={surfaceElevated}
        fontScale={fontScale}
        onSelect={handleSelectZikir}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteCustomZikir}
        highContrast={highContrast}
      />
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={statusBarStyle} />

      {/* ÜST BAR */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={[
              styles.iconBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerPlaceholder} />
        )}

        <View style={styles.headerCenter}>
          <Text
            style={[
              styles.headerTitle,
              {
                color: theme.text,
                fontSize: 20 * (fontScale > 1.1 ? 1.1 : fontScale),
                fontWeight: '900',
              },
            ]}
          >
            Zikirmatik
          </Text>
          <Text
            style={[
              styles.headerSubtitle,
              {
                color: theme.textDim,
                fontSize: 12 * fontScale,
                fontWeight: highContrast ? '700' : '500',
              },
            ]}
            numberOfLines={1}
          >
            {selectedZikir?.name || 'Zikir seç'}
            {count > 0 ? ` · ${count}/${target}` : ''}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            onPress={handleCycleFont}
            accessibilityRole="button"
            accessibilityLabel={`Yazı boyutu: ${FONT_NAMES[fontIdx]}. Değiştirmek için dokun.`}
            style={[
              styles.iconBtn,
              {
                backgroundColor: fontIdx > 0
                  ? (highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`))
                  : theme.surface,
                borderColor: fontIdx > 0 ? theme.primary : theme.border,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
          >
            <Text
              style={{
                fontWeight: '900',
                color: fontIdx > 0 ? theme.primary : theme.text,
                fontSize: 11 + fontIdx * 1.5,
              }}
            >
              {FONT_LABELS[fontIdx]}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleVibration}
            accessibilityRole="switch"
            accessibilityLabel={globalHaptic ? 'Titreşimi kapat' : 'Titreşimi aç'}
            accessibilityState={{ checked: globalHaptic }}
            style={[
              styles.iconBtn,
              {
                backgroundColor: globalHaptic
                  ? (highContrast ? '#000000' : (theme.primaryGlow || `${theme.primary}18`))
                  : theme.surface,
                borderColor: globalHaptic ? theme.primary : theme.border,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
          >
            <Ionicons
              name={globalHaptic ? 'phone-portrait' : 'phone-portrait-outline'}
              size={19}
              color={globalHaptic ? theme.primary : theme.textDim}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Toast
        message={toast.message}
        visible={toast.visible}
        theme={theme}
        fontScale={fontScale}
        reduceMotion={reduceMotion}
      />

      <FlatList
        ref={flatListRef}
        data={filteredZikirs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={
          filteredZikirs.length > 0 ? (
            <Text
              style={[
                styles.footerNote,
                {
                  color: theme.textDim,
                  fontSize: 12 * fontScale,
                  fontWeight: highContrast ? '700' : 'normal',
                },
              ]}
            >
              Zikir değiştirince sayaçlar bu oturumda korunur. Uygulamayı kapatınca sıfırlanır.
            </Text>
          ) : null
        }
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
      />

      {/* YENİ ZİKİR EKLEME MODALI */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: highContrast ? 2 : 1,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={[styles.modalTitle, { color: theme.text, fontWeight: '900' }]}>
                  Kendi zikrini ekle
                </Text>
                <Text
                  style={[
                    styles.modalSubtitle,
                    {
                      color: theme.textDim,
                      fontWeight: highContrast ? '700' : 'normal',
                    },
                  ]}
                >
                  Kendi hedefini ve kategorini belirle.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setAddModalVisible(false)}
                style={styles.modalCloseButton}
                accessibilityRole="button"
                accessibilityLabel="Kapat"
              >
                <Ionicons name="close" size={23} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.inputLabel,
                { color: theme.textDim, fontWeight: highContrast ? '900' : '800' },
              ]}
            >
              Zikir adı
            </Text>
            <TextInput
              value={newZikirName}
              onChangeText={setNewZikirName}
              placeholder="Örn. Kendi zikrim"
              placeholderTextColor={theme.textDim}
              style={[
                styles.formInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  borderWidth: highContrast ? 2 : 1,
                  fontWeight: highContrast ? '700' : 'normal',
                },
              ]}
              maxLength={120}
              autoCorrect={false}
              returnKeyType="next"
              accessibilityLabel="Zikir adı"
            />

            <Text
              style={[
                styles.inputLabel,
                { color: theme.textDim, fontWeight: highContrast ? '900' : '800' },
              ]}
            >
              Hedef sayısı
            </Text>
            <TextInput
              value={newZikirTarget}
              onChangeText={setNewZikirTarget}
              keyboardType="number-pad"
              placeholder="33"
              placeholderTextColor={theme.textDim}
              style={[
                styles.formInput,
                {
                  color: theme.text,
                  borderColor: theme.border,
                  backgroundColor: theme.background,
                  borderWidth: highContrast ? 2 : 1,
                  fontWeight: highContrast ? '700' : 'normal',
                },
              ]}
              maxLength={7}
              accessibilityLabel="Hedef sayısı"
            />

            <Text
              style={[
                styles.inputLabel,
                { color: theme.textDim, fontWeight: highContrast ? '900' : '800' },
              ]}
            >
              Kategori
            </Text>
            <View style={styles.formCategoryRow}>
              {['Kişisel', 'Günlük', 'Şükür', 'İstiğfar', 'Salavat', 'Tevhid', 'Dua'].map((category) => {
                const selected = newZikirCategory === category;
                return (
                  <TouchableOpacity
                    key={category}
                    onPress={() => setNewZikirCategory(category)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: selected ? theme.primary : theme.surface,
                        borderColor: selected ? theme.primary : theme.border,
                        borderWidth: highContrast ? 2 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Kategori: ${category}`}
                    accessibilityState={{ selected }}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        {
                          color: selected ? (highContrast ? '#000000' : '#FFFFFF') : theme.text,
                          fontWeight: highContrast ? '900' : '700',
                        },
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleAddCustomZikir}
              style={[
                styles.saveZikirButton,
                {
                  backgroundColor: theme.primary,
                  borderWidth: highContrast ? 2 : 0,
                  borderColor: '#000000',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Zikri kaydet"
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color={highContrast ? '#000000' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.saveZikirButtonText,
                  {
                    color: highContrast ? '#000000' : '#FFFFFF',
                    fontWeight: '900',
                  },
                ]}
              >
                Zikri kaydet
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setAddModalVisible(false)}
              style={styles.cancelModalButton}
              accessibilityRole="button"
              accessibilityLabel="İptal"
            >
              <Text
                style={[
                  styles.cancelModalText,
                  {
                    color: theme.textDim,
                    fontWeight: highContrast ? '900' : '800',
                  },
                ]}
              >
                Vazgeç
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ÖZEL DIALOG UYARILARI */}
      <AppDialog
        dialog={dialog}
        onClose={closeDialog}
        theme={theme}
        highContrast={highContrast}
        fontScale={fontScale}
      />
    </SafeAreaView>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  headerTitle: { fontWeight: '900' },
  headerSubtitle: { fontWeight: '500', marginTop: 2 },
  headerPlaceholder: { width: 40, height: 40 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: { padding: 20, paddingBottom: 40 },

  /* Dialog Stilleri */
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 22,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  dialogTitle: { letterSpacing: -0.2 },
  dialogMessage: { lineHeight: 20, marginTop: 4 },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  dialogBtn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogBtnText: {},

  /* Toast Stilleri */
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    top: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    zIndex: 100,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  toastText: { color: '#FFF', fontWeight: '700', flex: 1 },

  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  infoTextContainer: { flexShrink: 1 },
  infoRight: { alignItems: 'flex-end', flexShrink: 1, marginLeft: 8 },
  infoLabel: { marginBottom: 3 },
  infoValue: { fontWeight: '800' },
  remainingText: { fontWeight: '800', textAlign: 'right' },

  progressSection: { marginBottom: 12 },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  progressLabel: { textAlign: 'right', marginTop: 6 },

  counterSection: { alignItems: 'center', justifyContent: 'center', marginVertical: 18 },
  counterCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterCount: { fontWeight: '900', letterSpacing: -1 },
  counterSub: { fontWeight: '900', letterSpacing: 1, marginTop: 2 },

  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  actionText: { fontWeight: '700' },

  resetAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 14,
  },
  resetAllText: { fontWeight: '700' },

  libraryJumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 52,
    borderRadius: 14,
    marginBottom: 16,
  },
  libraryJumpBtnText: { fontWeight: '800' },

  sectionTitle: { fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
  targetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  targetChip: {
    minWidth: 54,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  targetChipText: { fontWeight: '800' },

  libraryHeaderContainer: { marginTop: 32 },
  libraryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 4,
  },
  libraryTitleContainer: { flex: 1 },
  librarySubtitle: { marginBottom: 12 },
  addZikirButton: {
    minHeight: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 10,
  },
  addZikirButtonText: { color: '#FFFFFF', fontWeight: '800' },

  searchContainer: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 13,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, minHeight: 46, paddingVertical: 8 },

  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  categoryIcon: { marginRight: 1 },
  categoryText: { fontWeight: '700' },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortText: { fontWeight: '800' },

  presetTile: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 72,
  },
  presetMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    paddingVertical: 10,
    gap: 10,
  },
  presetIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetTextContainer: { flex: 1 },
  presetName: { fontWeight: '700' },
  presetDescription: {},

  savedCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  savedCountText: { fontWeight: '900', letterSpacing: 0.2 },

  favoriteButton: {
    width: 38,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 34,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: { fontWeight: '800' },
  emptyText: { lineHeight: 18, textAlign: 'center' },
  emptyAddButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyAddButtonText: { color: '#FFFFFF', fontWeight: '800' },

  footerNote: {
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 8,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.48)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: { borderRadius: 22, padding: 20, maxHeight: '90%' },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitleContainer: { flex: 1, paddingRight: 12 },
  modalTitle: { fontSize: 19, fontWeight: '900' },
  modalSubtitle: { fontSize: 12, marginTop: 5 },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 12,
    marginBottom: 6,
  },
  formInput: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  formCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  saveZikirButton: {
    minHeight: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 22,
  },
  saveZikirButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  cancelModalButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelModalText: { fontSize: 13, fontWeight: '800' },
});