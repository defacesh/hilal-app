// src/services/widgetNotificationService.js
// NOT: Bu servis ismi tarihsel nedenle "widget" içeriyor ama aslında
// günlük motivasyon/hatırlatma bildirimidir. Ana ekran widget'ı ile
// doğrudan bağlantısı yoktur.

import * as Notifications from 'expo-notifications';
import {
  fetchTodayHijri,
  fetchIslamicNames,
} from './ummahContentApi';

const DAILY_NOTIFICATION_TYPE = 'daily_widget'; // geriye dönük uyumluluk
const DAILY_NOTIFICATION_HOUR = 8;
const DAILY_NOTIFICATION_MINUTE = 30;

/* ================================================================
   Hicri ay isimleri (Türkçe ve İngilizce karşılıkları)
   ================================================================ */
const HIJRI_MONTHS = {
  1:  { tr: 'Muharrem',      en: 'Muharram' },
  2:  { tr: 'Safer',         en: 'Safar' },
  3:  { tr: 'Rebîülevvel',   en: 'Rabi al-awwal' },
  4:  { tr: 'Rebîülâhir',    en: 'Rabi al-thani' },
  5:  { tr: 'Cemâziyelevvel',en: 'Jumada al-awwal' },
  6:  { tr: 'Cemâziyelâhir', en: 'Jumada al-thani' },
  7:  { tr: 'Recep',         en: 'Rajab' },
  8:  { tr: 'Şaban',         en: 'Shaban' },
  9:  { tr: 'Ramazan',       en: 'Ramadan' },
  10: { tr: 'Şevval',        en: 'Shawwal' },
  11: { tr: 'Zilkade',       en: 'Dhu al-Qidah' },
  12: { tr: 'Zilhicce',      en: 'Dhu al-Hijjah' },
};

/* ================================================================
   Özel günler (hicri ay-gün)
   ================================================================ */
const SPECIAL_DAYS = {
  '1-10':   { icon: '🌾', title: 'Aşure Günü',       msg: 'Bugün Aşure Günü. Oruç tutmak sünnettir.' },
  '3-12':   { icon: '🌙', title: 'Mevlid Kandili',   msg: 'Peygamber Efendimizin doğduğu gece. Salavat ile ihya edin.' },
  '7-27':   { icon: '✨', title: 'Mirac Kandili',    msg: 'Mirac gecesi. Teheccüd namazı ve dua ile geçirin.' },
  '8-15':   { icon: '🕯️', title: 'Berat Kandili',    msg: 'Berat gecesi. Af ve mağfiret için dua edin.' },
  '9-1':    { icon: '🌘', title: 'Ramazan Başladı',  msg: 'Ramazan ayı başladı. Allah orucunuzu kabul etsin.' },
  '9-27':   { icon: '🌟', title: 'Kadir Gecesi',     msg: 'Bin aydan hayırlı gece. İbadetle geçirin.' },
  '10-1':   { icon: '🎉', title: 'Ramazan Bayramı',  msg: 'Bayramınız mübarek olsun. Sevgi ve huzur dolu günler.' },
  '12-10':  { icon: '🐑', title: 'Kurban Bayramı',   msg: 'Bayramınız mübarek olsun. Kardeşlik ve paylaşım günleri.' },
};

let notificationHandlerConfigured = false;

/* ================================================================
   Bildirim handler
   ================================================================ */
function configureNotificationHandler() {
  if (notificationHandlerConfigured) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  notificationHandlerConfigured = true;
}

/* ================================================================
   İzin
   ================================================================ */
export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    if (__DEV__) {
      console.warn('[Daily] Bildirim izni kontrol edilemedi:', error);
    }
    return false;
  }
}

/* ================================================================
   Temizlik
   ================================================================ */
async function cancelExistingDailyNotifications() {
  const scheduled =
    await Notifications.getAllScheduledNotificationsAsync();

  const dailyNotifications = scheduled.filter(
    (n) => n.content?.data?.type === DAILY_NOTIFICATION_TYPE,
  );

  await Promise.all(
    dailyNotifications.map((n) =>
      Notifications.cancelScheduledNotificationAsync(n.identifier),
    ),
  );
}

/* ================================================================
   Hicri parse yardımcısı
   ================================================================ */
function parseHijri(hijri) {
  if (!hijri) return { day: null, month: null };

  // 1) Yapısal alanlar varsa (en güvenli)
  const day =
    hijri.day ??
    hijri.h_day ??
    (typeof hijri.date === 'string'
      ? Number(hijri.date.match(/^\d+/)?.[0])
      : null);

  let month = null;
  if (hijri.month && typeof hijri.month === 'object') {
    month = hijri.month.number ?? hijri.month.en ?? hijri.month.ar;
  } else if (typeof hijri.month === 'number') {
    month = hijri.month;
  } else if (typeof hijri.month === 'string') {
    const entry = Object.entries(HIJRI_MONTHS).find(
      ([, v]) =>
        v.tr.toLowerCase() === hijri.month.toLowerCase() ||
        v.en.toLowerCase() === hijri.month.toLowerCase(),
    );
    month = entry ? Number(entry[0]) : null;
  }

  // 2) formatted string'inden çıkarmayı dene
  if ((!day || !month) && typeof hijri.formatted === 'string') {
    const match = hijri.formatted.match(/^(\d+)\s+([^\d]+)/);
    if (match) {
      const d = Number(match[1]);
      const monthName = match[2].trim().toLowerCase();
      const entry = Object.entries(HIJRI_MONTHS).find(
        ([, v]) =>
          v.tr.toLowerCase() === monthName ||
          v.en.toLowerCase() === monthName,
      );
      if (!day) return { day: d, month: entry ? Number(entry[0]) : null };
      if (!month) month = entry ? Number(entry[0]) : null;
    }
  }

  return { day: day || null, month: month || null };
}

/* ================================================================
   Özel gün tespiti
   ================================================================ */
function detectSpecialDay(hijri) {
  const { day, month } = parseHijri(hijri);
  if (!day || !month) return null;
  return SPECIAL_DAYS[`${month}-${day}`] ?? null;
}

function isFriday(date = new Date()) {
  return date.getDay() === 5;
}

function isRamadan(hijri) {
  const { month } = parseHijri(hijri);
  return month === 9;
}

/* ================================================================
   İçerik hazırlama
   ================================================================ */
async function getDailyContent() {
  const [hijriResult, namesResult] = await Promise.allSettled([
    fetchTodayHijri(),
    fetchIslamicNames(1),
  ]);

  const hijri =
    hijriResult.status === 'fulfilled' ? hijriResult.value : null;

  if (hijriResult.status === 'rejected' && __DEV__) {
    console.warn('[Daily] Hicri tarih alınamadı:', hijriResult.reason);
  }

  const hijriText = hijri?.formatted || '';

  // 1. Özel gün kontrolü
  const special = detectSpecialDay(hijri);
  if (special) {
    return {
      title: `${special.icon} ${special.title}`,
      body: `${special.msg}${hijriText ? `\n\n${hijriText}` : ''}`,
    };
  }

  // 2. Cuma kontrolü
  if (isFriday()) {
    return {
      title: '🕌 Cumanız mübarek olsun',
      body:
        'Bugün Cuma. Salavat getirmeyi ve Kehf Suresi okumayı unutmayın.' +
        (hijriText ? `\n\n${hijriText}` : ''),
    };
  }

  // 3. Ramazan ayı kontrolü
  if (isRamadan(hijri)) {
    const islamicName =
      namesResult.status === 'fulfilled' && Array.isArray(namesResult.value)
        ? namesResult.value[0]
        : null;

    return {
      title: '🌘 Ramazan ayındasınız',
      body:
        (islamicName
          ? `Günün İsmi: ${islamicName.name || ''}${
              islamicName.arabic ? ` (${islamicName.arabic})` : ''
            }\n${islamicName.meaning || ''}\n\n`
          : '') +
        'İftar ve sahur vakitlerini takip etmek için uygulamayı açın.' +
        (hijriText ? `\n\n${hijriText}` : ''),
    };
  }

  // 4. Standart gün — günün İsmi
  const islamicName =
    namesResult.status === 'fulfilled' && Array.isArray(namesResult.value)
      ? namesResult.value[0]
      : null;

  if (islamicName) {
    return {
      title: `📖 Hilal · ${hijriText || 'Hayırlı Günler'}`,
      body:
        `Günün İsmi: ${islamicName.name || ''}${
          islamicName.arabic ? ` (${islamicName.arabic})` : ''
        }` + (islamicName.meaning ? `\n${islamicName.meaning}` : ''),
    };
  }

  return {
    title: `📖 Hilal · ${hijriText || 'Hayırlı Günler'}`,
    body: 'Bugün Allah’ı zikretmek ve ibadetleri tazelemek için güzel bir gün. Detaylar için dokun.',
  };
}

/* ================================================================
   Planlama
   ================================================================ */
export async function scheduleDailyWidgetNotification() {
  configureNotificationHandler();

  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) {
    if (__DEV__) console.warn('[Daily] Bildirim izni verilmedi.');
    return false;
  }

  try {
    await cancelExistingDailyNotifications();

    const { title, body } = await getDailyContent();

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: DAILY_NOTIFICATION_TYPE },
        sound: 'default',
        channelId: Platform.OS === 'android' ? 'prayer-reminders-v2' : undefined,
      },
      trigger: {
        hour: DAILY_NOTIFICATION_HOUR,
        minute: DAILY_NOTIFICATION_MINUTE,
        repeats: true,
      },
    });

    if (__DEV__) {
      console.log('[Daily] Günlük bildirim planlandı: 08:30');
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('[Daily] Bildirim planlanamadı:', error);
    }
    return false;
  }
}

export async function cancelDailyWidgetNotification() {
  try {
    await cancelExistingDailyNotifications();
    return true;
  } catch (error) {
    if (__DEV__) {
      console.warn('[Daily] Bildirim iptal edilemedi:', error);
    }
    return false;
  }
}

/* ================================================================
   Opsiyonel: isim temizleme (yeni kullanım için)
   ================================================================ */
export const scheduleDailyNotification = scheduleDailyWidgetNotification;
export const cancelDailyNotification = cancelDailyWidgetNotification;