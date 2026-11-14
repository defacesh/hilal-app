// src/screens/QiblaScreen.js
import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  StatusBar,
  useWindowDimensions,
  Modal,
  Vibration,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Magnetometer } from 'expo-sensors';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';

/* ------------------------------------------------------------------ */
/* Sabitler ve yardımcılar                                             */
/* ------------------------------------------------------------------ */

const MECCA_COORDS = { latitude: 21.4225, longitude: 39.8262 };
const DEFAULT_LOCATION = { city: 'İstanbul', district: 'Fatih', latitude: 41.0151, longitude: 28.9795 };
const ALIGN_TOLERANCE = 4; // derece

const toRad = (d) => (d * Math.PI) / 180;
const normalize = (a) => ((a % 360) + 360) % 360;

function angleDiff(a, b) {
  let d = normalize(a - b);
  if (d > 180) d -= 360;
  return d;
}

function computeQiblaBearing(lat, lon) {
  const lat1 = toRad(lat);
  const lat2 = toRad(MECCA_COORDS.latitude);
  const dLon = toRad(MECCA_COORDS.longitude - lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return Math.round(normalize((Math.atan2(y, x) * 180) / Math.PI));
}

function computeDistanceKm(lat, lon) {
  const R = 6371;
  const dLat = toRad(MECCA_COORDS.latitude - lat);
  const dLon = toRad(MECCA_COORDS.longitude - lon);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(MECCA_COORDS.latitude)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const formatKm = (km) => Math.round(km).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* ------------------------------------------------------------------ */
/* Yön (heading) hook'u                                                */
/* ------------------------------------------------------------------ */

function useHeading() {
  const [state, setState] = useState({ heading: null, accuracy: null, source: null, status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    let subscription = null;
    let last = null;

    const push = (raw, accuracy, source) => {
      if (cancelled || raw == null || Number.isNaN(raw)) return;
      const smoothed = last === null ? normalize(raw) : normalize(last + 0.3 * angleDiff(raw, last));
      last = smoothed;
      const rounded = Math.round(smoothed) % 360;
      setState((prev) =>
        prev.status === 'ok' && prev.heading === rounded && prev.accuracy === accuracy
          ? prev
          : { heading: rounded, accuracy, source, status: 'ok' }
      );
    };

    const startMagnetometer = async () => {
      const available = await Magnetometer.isAvailableAsync();
      if (cancelled) return;
      if (!available) {
        setState({ heading: null, accuracy: null, source: null, status: 'unavailable' });
        return;
      }
      Magnetometer.setUpdateInterval(100);
      subscription = Magnetometer.addListener(({ x, y }) => {
        push(normalize((Math.atan2(y, x) * 180) / Math.PI - 90), null, 'magnetometer');
      });
    };

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (status === 'granted') {
          const sub = await Location.watchHeadingAsync((h) => {
            const raw = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
            push(raw, h.accuracy, 'location');
          });
          if (cancelled) {
            sub.remove();
            return;
          }
          subscription = sub;
          return;
        }
      } catch (e) {
        // Yedek sensöre geçiş
      }

      try {
        await startMagnetometer();
      } catch (e) {
        if (!cancelled) setState({ heading: null, accuracy: null, source: null, status: 'unavailable' });
      }
    })();

    return () => {
      cancelled = true;
      if (subscription && typeof subscription.remove === 'function') subscription.remove();
    };
  }, []);

  return state;
}

/* ------------------------------------------------------------------ */
/* Ekran                                                               */
/* ------------------------------------------------------------------ */

export default function QiblaScreen({ onBack }) {
  const [showCalibration, setShowCalibration] = useState(false);
  const { width, height } = useWindowDimensions();

  const getTheme = useAppStore((state) => state.getTheme);
  const storeLocation = useAppStore((state) => state.selectedLocation);
  const readingFontScale = useAppStore((state) => state.readingFontScale) ?? 1.0;
  const highContrast = useAppStore((state) => state.highContrast);
  
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

  const borderColor = theme.border;
  const subtextColor = theme.textDim;

  const location =
    storeLocation && storeLocation.latitude != null && storeLocation.longitude != null
      ? storeLocation
      : DEFAULT_LOCATION;
  const locationLabel = [location.district, location.city].filter(Boolean).join(', ');

  const { latitude, longitude } = location;
  const qiblaAngle = useMemo(() => computeQiblaBearing(latitude, longitude), [latitude, longitude]);
  const distanceKm = useMemo(() => computeDistanceKm(latitude, longitude), [latitude, longitude]);

  const { heading, accuracy, source, status } = useHeading();

  const hasHeading = heading !== null;
  const diff = hasHeading ? angleDiff(qiblaAngle, heading) : 0;
  const isAligned = hasHeading && Math.abs(diff) <= ALIGN_TOLERANCE;
  
  const isLowAccuracy = source === 'location' && accuracy !== null && accuracy <= 1;

  useEffect(() => {
    if (isAligned) {
      try {
        Vibration.vibrate([0, 50, 60, 50]);
      } catch (e) {}
    }
  }, [isAligned]);

  const onPrimary = highContrast ? '#000000' : (theme.onPrimary || '#FFFFFF');
  const glow = theme.primaryGlow || theme.surfaceElevated;

  const discSize = Math.min(width * 0.74, height * 0.38);
  const discRotation = `${-(heading || 0)}deg`;

  let guidanceText = 'Pusula başlatılıyor…';
  let guidanceIcon = 'compass-outline';
  
  if (status === 'unavailable') {
    guidanceText = 'Manyetik sensör kısıtlı / bulunamadı';
    guidanceIcon = 'alert-circle-outline';
  } else if (isLowAccuracy) {
    guidanceText = 'Pusula kalibre edilmeli!';
    guidanceIcon = 'warning-outline';
  } else if (hasHeading) {
    if (isAligned) {
      guidanceText = 'Kıble tam önünüzde!';
      guidanceIcon = 'checkmark-circle';
    } else if (diff > 0) {
      guidanceText = 'Biraz sağa dönün →';
      guidanceIcon = 'arrow-redo-outline';
    } else {
      guidanceText = 'Biraz sola dönün ←';
      guidanceIcon = 'arrow-undo-outline';
    }
  }

  const statusBarStyle = highContrast || theme.mode === 'dark' || theme.mode === 'oled' ? 'light-content' : 'dark-content';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={statusBarStyle} />

      {/* HEADER */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Geri"
            style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor, borderWidth: highContrast ? 2 : 1 }]}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20 * readingFontScale} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}

        <View style={{ alignItems: 'center', flex: 1, paddingHorizontal: 8 }}>
          <Text style={[styles.headerTitle, { color: theme.text, fontSize: Math.round(18 * readingFontScale), fontWeight: highContrast ? '900' : '900' }]}>Kıble Pusulası</Text>
          <View style={styles.locationBadgeRow}>
            <Ionicons name="location-sharp" size={12 * readingFontScale} color={theme.primary} />
            <Text style={{ color: subtextColor, fontSize: Math.round(12 * readingFontScale), fontWeight: highContrast ? '700' : '600' }} numberOfLines={1}>
              {locationLabel}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setShowCalibration(true)}
          accessibilityRole="button"
          accessibilityLabel="Pusula kalibrasyonu"
          style={[
            styles.iconBtn,
            {
              backgroundColor: isLowAccuracy ? 'rgba(234, 179, 8, 0.15)' : theme.surface,
              borderColor: isLowAccuracy ? '#EAB308' : borderColor,
              borderWidth: highContrast ? 2 : 1,
            },
          ]}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name="axis-z-rotate-clockwise"
            size={20 * readingFontScale}
            color={isLowAccuracy ? '#EAB308' : theme.primary}
          />
        </TouchableOpacity>
      </View>

      {/* ANA PUSULA ALANI */}
      <View style={styles.compassContainer}>
        <TouchableOpacity
          activeOpacity={isLowAccuracy ? 0.7 : 1}
          onPress={() => isLowAccuracy && setShowCalibration(true)}
          style={[
            styles.guidanceBanner,
            {
              backgroundColor: isAligned ? glow : isLowAccuracy ? 'rgba(234, 179, 8, 0.12)' : theme.surface,
              borderColor: isAligned ? theme.primary : isLowAccuracy ? '#EAB308' : borderColor,
              borderWidth: highContrast ? 2 : 1,
            },
          ]}
        >
          <Ionicons
            name={guidanceIcon}
            size={18 * readingFontScale}
            color={isAligned ? theme.primary : isLowAccuracy ? '#EAB308' : theme.text}
          />
          <Text
            style={[
              styles.guidanceText,
              { color: isAligned ? theme.primary : isLowAccuracy ? '#CA8A04' : theme.text, fontSize: Math.round(13 * readingFontScale), fontWeight: highContrast ? '900' : '700' },
            ]}
          >
            {isLowAccuracy ? 'Hassasiyet düşük. Kalibre etmek için dokunun →' : guidanceText}
          </Text>
        </TouchableOpacity>

        <View style={{ width: discSize, height: discSize, marginTop: 12 }}>
          <View style={styles.fixedMarker} pointerEvents="none">
            <View style={[styles.markerArrow, { backgroundColor: isAligned ? theme.primary : subtextColor }]} />
          </View>

          <View
            style={[
              styles.compassDisc,
              {
                width: discSize,
                height: discSize,
                borderRadius: discSize / 2,
                backgroundColor: theme.surface,
                borderColor: isAligned ? theme.primary : borderColor,
                borderWidth: highContrast ? 3 : 2,
                transform: [{ rotate: discRotation }],
              },
            ]}
          >
            <Text style={[styles.cardinalText, styles.north, { color: theme.primary, fontSize: Math.round(15 * readingFontScale), fontWeight: highContrast ? '900' : '900' }]}>K</Text>
            <Text style={[styles.cardinalText, styles.east, { color: highContrast ? theme.text : theme.textMuted, fontSize: Math.round(15 * readingFontScale), fontWeight: highContrast ? '900' : '900' }]}>D</Text>
            <Text style={[styles.cardinalText, styles.south, { color: highContrast ? theme.text : theme.textMuted, fontSize: Math.round(15 * readingFontScale), fontWeight: highContrast ? '900' : '900' }]}>G</Text>
            <Text style={[styles.cardinalText, styles.west, { color: highContrast ? theme.text : theme.textMuted, fontSize: Math.round(15 * readingFontScale), fontWeight: highContrast ? '900' : '900' }]}>B</Text>

            <View style={[styles.qiblaPointerContainer, { transform: [{ rotate: `${qiblaAngle}deg` }] }]}>
              <View
                style={[
                  styles.pointerIconWrapper,
                  { backgroundColor: isAligned ? theme.primary : theme.surfaceElevated, borderWidth: highContrast ? 2 : 0, borderColor: theme.border },
                ]}
              >
                <FontAwesome5 name="mosque" size={20 * readingFontScale} color={isAligned ? onPrimary : theme.primary} />
              </View>
              <View style={[styles.pointerLine, { backgroundColor: theme.primary }]} />
            </View>
          </View>
        </View>

        <View style={styles.statusBox}>
          <Text
            style={[styles.angleDegree, { color: isAligned ? theme.primary : theme.text, fontSize: Math.round(38 * readingFontScale), fontWeight: highContrast ? '900' : '900' }]}
            accessibilityLabel={hasHeading ? `Yönünüz ${heading} derece` : 'Yön bilgisi yok'}
          >
            {hasHeading ? `${heading}°` : '--°'}
          </Text>
          <Text style={{ color: subtextColor, fontSize: Math.round(13 * readingFontScale), fontWeight: highContrast ? '700' : '500', marginTop: 2 }}>
            Hedef Kıble Açısı: <Text style={{ fontWeight: '900', color: theme.text }}>{qiblaAngle}°</Text>
          </Text>
        </View>
      </View>

      {/* İSTATİSTİK / BİLGİ ÇUBUĞU */}
      <View style={[styles.statsBar, { backgroundColor: theme.surface, borderColor, borderWidth: highContrast ? 2 : 1 }]}>
        <View style={styles.statItem}>
          <Ionicons name="earth-outline" size={18 * readingFontScale} color={theme.primary} />
          <Text style={[styles.statValue, { color: theme.text, fontSize: Math.round(14 * readingFontScale), fontWeight: highContrast ? '900' : '800' }]}>{formatKm(distanceKm)} km</Text>
          <Text style={[styles.statLabel, { color: subtextColor, fontSize: Math.round(10 * readingFontScale), fontWeight: highContrast ? '700' : '500' }]}>Kâbe Uzaklığı</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: borderColor, width: highContrast ? 2 : 1 }]} />
        <TouchableOpacity
          style={styles.statItem}
          onPress={() => setShowCalibration(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
        >
          <Ionicons
            name={isLowAccuracy ? 'warning-outline' : 'shield-checkmark-outline'}
            size={18 * readingFontScale}
            color={isLowAccuracy ? '#EAB308' : theme.primary}
          />
          <Text style={[styles.statValue, { color: isLowAccuracy ? '#CA8A04' : theme.text, fontSize: Math.round(14 * readingFontScale), fontWeight: highContrast ? '900' : '800' }]}>
            {isLowAccuracy ? 'Kalibrasyon Gerekli' : 'İyi Durumda'}
          </Text>
          <Text style={[styles.statLabel, { color: subtextColor, fontSize: Math.round(10 * readingFontScale), fontWeight: highContrast ? '700' : '500' }]}>Sensör Durumu</Text>
        </TouchableOpacity>
      </View>

      {/* KALİBRASYON MODALI */}
      <Modal
        visible={showCalibration}
        animationType="fade"
        transparent
        statusBarTranslucent
        onRequestClose={() => setShowCalibration(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.calibrationContent, { backgroundColor: theme.surface, borderColor, borderWidth: highContrast ? 2 : 1 }]}>
            <View style={[styles.calibrationIconBox, { backgroundColor: highContrast ? '#000000' : glow, borderWidth: highContrast ? 2 : 0, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="infinity" size={60 * readingFontScale} color={theme.primary} />
            </View>

            <Text style={[styles.calibrationTitle, { color: theme.text, fontSize: Math.round(19 * readingFontScale), fontWeight: highContrast ? '900' : '800' }]}>Pusulayı Kalibre Edin</Text>
            <Text style={[styles.calibrationText, { color: subtextColor, fontSize: Math.round(13 * readingFontScale), lineHeight: Math.round(20 * readingFontScale), fontWeight: highContrast ? '700' : 'normal' }]}>
              Manyetik alanı yenilemek ve doğru yönü bulmak için telefonunuzu elinize alın ve havada{' '}
              <Text style={{ color: theme.primary, fontWeight: '900' }}>“8” (sonsuzluk)</Text> şekli çizecek biçimde birkaç
              kez çevirin.
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.primary, borderWidth: highContrast ? 2 : 0, borderColor: '#000000' }]}
              activeOpacity={0.8}
              onPress={() => setShowCalibration(false)}
              accessibilityRole="button"
            >
              <Text style={[styles.primaryButtonText, { color: onPrimary, fontSize: Math.round(14 * readingFontScale), fontWeight: highContrast ? '900' : '700' }]}>Anladım, Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Stiller                                                             */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '900' },
  locationBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },

  compassContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 20 },
  
  guidanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
  },
  guidanceText: { fontSize: 13, fontWeight: '700' },

  fixedMarker: { position: 'absolute', top: -14, left: 0, right: 0, alignItems: 'center', zIndex: 2 },
  markerArrow: { width: 6, height: 16, borderRadius: 3 },

  compassDisc: { borderWidth: 2, justifyContent: 'center', alignItems: 'center' },

  cardinalText: { position: 'absolute', fontWeight: '900', fontSize: 15 },
  north: { top: 12 },
  south: { bottom: 12 },
  east: { right: 14 },
  west: { left: 14 },

  qiblaPointerContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 26,
  },
  pointerIconWrapper: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', elevation: 3 },
  pointerLine: { width: 2, height: 42, marginTop: 4 },

  statusBox: { alignItems: 'center', marginTop: 22 },
  angleDegree: { fontSize: 38, fontWeight: '900', letterSpacing: -1, fontVariant: ['tabular-nums'] },

  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: '70%' },
  statValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  statLabel: { fontSize: 10, fontWeight: '500' },

  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.75)' },
  calibrationContent: { width: '100%', padding: 24, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  calibrationIconBox: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  calibrationTitle: { fontSize: 19, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  calibrationText: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginBottom: 22 },
  primaryButton: { width: '100%', height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { fontSize: 14, fontWeight: '700' },
});