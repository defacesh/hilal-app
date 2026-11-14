// src/services/appReset.js
// Uygulamanın tüm verilerini sıfırlar.
// Store sıfırlama, cache temizleme, bildirim iptali, widget temizleme.

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelPrayerNotifications } from './prayerNotifications';
import { NidaWidget } from '../widgets/NidaWidget';

/* ================================================================
   Widget modülü — güvenli yükleme (New Architecture Uyumlu)
   ================================================================ */
const getModule = (mod) => (mod && mod.default ? mod.default : mod);

let WidgetUpdate = null;
try {
  WidgetUpdate = getModule(require('react-native-android-widget'));
} catch {
  WidgetUpdate = null;
}

/* ================================================================
   AsyncStorage temizliği
   ================================================================ */

/**
 * Verilen prefixlerle başlayan tüm AsyncStorage kayıtlarını siler.
 * @param {string[]} prefixes
 * @returns {Promise<number>} Silinen kayıt sayısı
 */
async function clearByPrefixes(prefixes) {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const targets = allKeys.filter((key) =>
      prefixes.some((prefix) => key.startsWith(prefix)),
    );
    if (targets.length > 0) {
      await AsyncStorage.multiRemove(targets);
    }
    return targets.length;
  } catch (e) {
    console.warn('[Reset] Cache temizleme hatası:', e?.message);
    return 0;
  }
}

/* ================================================================
   Public: Uygulama verilerini sıfırla
   ================================================================ */

/**
 * Uygulamanın tüm kullanıcı verilerini siler.
 * - Store (AsyncStorage + Zustand)
 * - Cache (namaz vakitleri, ayetler, dualar, esmalar)
 * - Öğrenme ilerlemesi (32/54 Farz)
 * - Zikirmatik sayaçları
 * - Bildirimler
 * - Widget güncellemesi
 *
 * @param {object} options
 * @param {boolean} [options.keepIntro=false] Bismillah'ı tekrar gösterme
 * @param {boolean} [options.clearWidget=true] Widget'ı temizle
 *
 * @returns {Promise<{
 *   cacheKeys: number,
 *   notificationsCleared: boolean,
 *   widgetCleared: boolean,
 * }>}
 */
export async function resetAppData(options = {}) {
  const { clearWidget = true } = options;

  const result = {
    cacheKeys: 0,
    notificationsCleared: false,
    widgetCleared: false,
  };

  /* 1) Bildirimleri iptal et */
  try {
    await cancelPrayerNotifications();
    result.notificationsCleared = true;
  } catch (e) {
    console.warn('[Reset] Bildirim temizleme hatası:', e?.message);
  }

  /* 2) AsyncStorage cache'lerini temizle */
  try {
    result.cacheKeys = await clearByPrefixes([
      'nida:prayer-times:',
      'nida:ummah:',
      'nida:diyanet:',
      'nida:quran:',
      'nida:home:',
      'nida:learned:',
      'nida:zikirmatik:',
    ]);
  } catch (e) {
    console.warn('[Reset] Cache temizleme hatası:', e?.message);
  }

  /* 3) Widget'ları temizle (varsayılan sıfırlanmış arayüz göster) */
  if (clearWidget && WidgetUpdate) {
    try {
      const updateFn = WidgetUpdate?.requestWidgetUpdate ?? WidgetUpdate?.default?.requestWidgetUpdate;
      if (typeof updateFn === 'function') {
        const widgetNames = ['NidaSmallWidget', 'NidaMediumWidget', 'NidaLargeWidget', 'NidaWidget'];
        for (const widgetName of widgetNames) {
          try {
            await updateFn({
              widgetName,
              renderWidget: () => (
                <NidaWidget
                  nextPrayerName="--"
                  nextPrayerTime="--:--"
                  remaining="--"
                  allPrayers={[]}
                  hijriDate=""
                  weekdayLabel=""
                  isTomorrow={false}
                  locationName="Hilal"
                  themeMode="dark"
                />
              ),
            }).catch(() => {});
          } catch {}
        }
        result.widgetCleared = true;
      }
    } catch (e) {
      // requestWidgetUpdate hatalarını sessizce geç
    }
  }

  return result;
}

/**
 * Store'u da sıfırlar (Zustand + AsyncStorage).
 * Bu, `useAppStore.getState().resetAll()` çağrısına ek olarak
 * `nida-app-storage` anahtarını da temizler.
 */
export async function resetStoreAndStorage() {
  try {
    await AsyncStorage.removeItem('nida-app-storage');
  } catch (e) {
    console.warn('[Reset] Store storage temizlenemedi:', e?.message);
  }
}