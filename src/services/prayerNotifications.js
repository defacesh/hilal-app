// src/services/prayerNotifications.js
import { Platform } from 'react-native';

const PRAYER_NOTIFICATION_TYPE = 'prayer_reminder';
const PRAYER_CHANNEL_ID = 'prayer-reminders-v2';

let Notifications = null;
let notificationsUnavailable = false;
let unavailableReason = null;
let notificationHandlerConfigured = false;
let channelConfigured = false;

/* ================================================================
   Modül yükleme
   ================================================================ */
export async function getNotifications() {
  if (notificationsUnavailable) return null;
  if (Notifications) return Notifications;

  try {
    const mod = await import('expo-notifications');

    const hasRequiredApi =
      typeof mod.getPermissionsAsync === 'function' &&
      typeof mod.requestPermissionsAsync === 'function' &&
      typeof mod.scheduleNotificationAsync === 'function';

    if (!hasRequiredApi) {
      notificationsUnavailable = true;
      unavailableReason = 'native-module-missing';
      if (__DEV__) {
        console.warn(
          '[Hilal] Bildirim API kullanılamıyor. Development build gerekebilir.',
        );
      }
      return null;
    }

    if (!notificationHandlerConfigured) {
      try {
        if (typeof mod.setNotificationHandler === 'function') {
          mod.setNotificationHandler({
            handleNotification: async () => ({
              shouldShowAlert: true,
              shouldPlaySound: true,
              shouldSetBadge: false,
              shouldShowBanner: true,
              shouldShowList: true,
            }),
          });
        }
        notificationHandlerConfigured = true;
      } catch (error) {
        if (__DEV__) {
          console.warn('[Hilal] Bildirim handler kurulamadı:', error?.message);
        }
      }
    }

    Notifications = mod;
    return Notifications;
  } catch (error) {
    notificationsUnavailable = true;
    unavailableReason = error?.message ?? 'import-failed';
    if (__DEV__) {
      console.warn('[Hilal] Bildirim modülü yüklenemedi:', unavailableReason);
    }
    return null;
  }
}

export function isNotificationsAvailable() {
  return !notificationsUnavailable;
}

export function getNotificationsUnavailableReason() {
  return unavailableReason;
}

/* ================================================================
   Android kanal — sound BELİRTİLMİYOR
   ================================================================
   Android'in sistem varsayılan bildirim sesi "isimsiz"dir.
   `sound: 'default'` yazmak → "custom sound 'default' not found" hatası.
   Alanı hiç vermezsek Android sistem varsayılanını kullanır.
   ================================================================ */
async function ensurePrayerNotificationChannel(module) {
  if (Platform.OS !== 'android') return;
  if (channelConfigured) return;
  if (!module || typeof module.setNotificationChannelAsync !== 'function') return;

  try {
    await module.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
      name: 'Namaz vakti hatırlatmaları',
      importance: module.AndroidImportance?.HIGH ?? 4,
      vibrationPattern: [0, 250, 250, 250],
      enableVibrate: true,
      // sound ALANI YOK — sistem varsayılan sesi kullanılır
    });
    channelConfigured = true;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        '[Hilal] Android bildirim kanalı oluşturulamadı:',
        error?.message,
      );
    }
  }
}

/* ================================================================
   İzin
   ================================================================ */
export async function requestNotificationPermission() {
  try {
    const module = await getNotifications();
    if (!module) return false;

    await ensurePrayerNotificationChannel(module);

    const current = await module.getPermissionsAsync();
    if (current?.status === 'granted') return true;

    const requested = await module.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });

    return requested?.status === 'granted';
  } catch (error) {
    if (__DEV__) {
      console.warn('[Hilal] Bildirim izni alınamadı:', error?.message);
    }
    return false;
  }
}

/* ================================================================
   İptal
   ================================================================ */
async function cancelScheduledPrayerNotifications(module) {
  if (
    !module ||
    typeof module.getAllScheduledNotificationsAsync !== 'function' ||
    typeof module.cancelScheduledNotificationAsync !== 'function'
  ) {
    return false;
  }

  try {
    const scheduled = await module.getAllScheduledNotificationsAsync();
    const prayerNotifications = scheduled.filter(
      (notification) =>
        notification?.content?.data?.type === PRAYER_NOTIFICATION_TYPE,
    );

    if (prayerNotifications.length === 0) return true;

    await Promise.allSettled(
      prayerNotifications.map((notification) =>
        module.cancelScheduledNotificationAsync(notification.identifier),
      ),
    );

    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        '[Hilal] Planlanmış bildirimler alınamadı:',
        error?.message ?? error,
      );
    }
    return false;
  }
}

export async function cancelPrayerNotifications() {
  try {
    const module = await getNotifications();
    if (!module) return false;
    return await cancelScheduledPrayerNotifications(module);
  } catch (error) {
    if (__DEV__) {
      console.warn('[Hilal] Namaz bildirimleri iptal edilemedi:', error?.message);
    }
    return false;
  }
}

/* ================================================================
   Trigger fallback
   ================================================================ */
function buildTrigger(module, date) {
  const types = module?.SchedulableTriggerInputTypes;
  if (types?.DATE) return { type: types.DATE, date };
  if (types?.Date) return { type: types.Date, date };
  return date;
}

/* ================================================================
   Tek bildirim planla
   ================================================================
   ÖNEMLİ: content içine `sound` alanı EKLENMİYOR.
   - Android: channel sesini kullanır (channel seviyesinde ayarlandı)
   - iOS:     ses için content.sound = 'default' gerekli
   ================================================================ */
async function scheduleSinglePrayerNotification(module, prayer, options = {}) {
  if (!module || !prayer?.name || prayer.date == null) return false;

  const prayerDate =
    prayer.date instanceof Date ? prayer.date : new Date(prayer.date);

  if (!Number.isFinite(prayerDate.getTime())) {
    if (__DEV__) {
      console.warn(`[Hilal] ${prayer.name} için geçersiz tarih:`, prayer.date);
    }
    return false;
  }

  const requestedOffset = Number(options.reminderBeforeMinutes);
  const offset = Number.isFinite(requestedOffset)
    ? Math.max(0, Math.floor(requestedOffset))
    : 0;

  const triggerDate = new Date(prayerDate.getTime() - offset * 60 * 1000);

  if (triggerDate.getTime() <= Date.now()) {
    if (__DEV__) {
      const timeStr = prayerDate.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      console.log(
        `[Hilal] ${prayer.name} (${timeStr}) geçmişte kaldığı için atlandı.`,
      );
    }
    return false;
  }

  const content = {
    title:
      offset > 0
        ? `${prayer.name} vakti yaklaşıyor`
        : `${prayer.name} vakti`,
    body:
      offset > 0
        ? `${offset} dakika sonra ${prayer.name} vakti girecek.`
        : `${prayer.name} vakti girdi. Namazınızı hatırlayın.`,
    data: {
      type: PRAYER_NOTIFICATION_TYPE,
      prayerName: prayer.name,
      offsetMinutes: offset,
    },
  };

  // iOS: 'default' natively tanınıyor. Android: channel zaten hallediyor.
  if (Platform.OS === 'ios') {
    content.sound = 'default';
  } else if (Platform.OS === 'android') {
    content.channelId = PRAYER_CHANNEL_ID;
  }

  // 1. deneme
  const trigger = buildTrigger(module, triggerDate);
  try {
    await module.scheduleNotificationAsync({ content, trigger });
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        `[Hilal] ${prayer.name} planlanamadı (1. deneme):`,
        error?.message ?? error,
      );
    }
  }

  // 2. deneme — Date fallback
  try {
    await module.scheduleNotificationAsync({ content, trigger: triggerDate });
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn(
        `[Hilal] ${prayer.name} planlanamadı (2. deneme):`,
        error?.message ?? error,
      );
    }
  }

  return false;
}

/* ================================================================
   Toplu planlama
   ================================================================ */
export async function schedulePrayerNotifications(
  prayerTimes = [],
  options = {},
) {
  try {
    if (!Array.isArray(prayerTimes) || prayerTimes.length === 0) {
      if (__DEV__) console.log('[Hilal] Bildirim için vakit listesi boş.');
      return 0;
    }

    const module = await getNotifications();
    if (!module) return 0;

    const permitted = await requestNotificationPermission();
    if (!permitted) {
      if (__DEV__) console.log('[Hilal] Bildirim izni verilmedi.');
      return 0;
    }

    await ensurePrayerNotificationChannel(module);
    await cancelScheduledPrayerNotifications(module);

    const validPrayers = prayerTimes.filter(
      (p) => p && p.name && p.date != null,
    );

    const results = await Promise.all(
      validPrayers.map(async (prayer) => {
        try {
          return await scheduleSinglePrayerNotification(module, prayer, options);
        } catch (err) {
          if (__DEV__) {
            console.warn(
              `[Hilal] ${prayer?.name ?? 'Namaz'} bildirimi planlanamadı:`,
              err?.message ?? err,
            );
          }
          return false;
        }
      }),
    );

    const scheduledCount = results.filter(Boolean).length;
    const skippedCount = validPrayers.length - scheduledCount;

    if (__DEV__) {
      console.log(
        `[Hilal] ${scheduledCount}/${prayerTimes.length} namaz bildirimi planlandı` +
          (skippedCount > 0
            ? ` (${skippedCount} tanesi geçmişte kaldığı için atlandı)`
            : '') +
          '.',
      );
    }

    return scheduledCount;
  } catch (error) {
    if (__DEV__) {
      console.warn('[Hilal] Namaz bildirimleri planlanamadı:', error?.message);
    }
    return 0;
  }
}