// widget-task-handler.js
// Android ana ekran widget'ı — 3 farklı boyutta modern İslami widget desteği
// (Small: 2x2, Medium: 4x2, Large: 4x4)
// Bu dosya index.js'ten bir kez yüklenir (require).
// Expo Go'da native modül olmadığı için sessizce atlanır.

import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchDiyanetTimes } from './src/services/diyanetApi';
import { getVakitCardContent } from './src/data/widgetContentData';
import { formatRemainingFriendly } from './src/utils/widgetTimeUtils';

const STORE_KEY = 'nida-app-storage';

/* ================================================================
   Native widget modülü — güvenli yükleme
   ================================================================ */
let RN_WIDGET = null;
let NidaSmallWidget = null;
let NidaMediumWidget = null;
let NidaLargeWidget = null;
let NidaWidget = null;
let nativeModuleAvailable = false;

try {
  // eslint-disable-next-line global-require
  RN_WIDGET = require('react-native-android-widget');
  nativeModuleAvailable =
    typeof RN_WIDGET?.registerWidgetTaskHandler === 'function' &&
    typeof RN_WIDGET?.FlexWidget === 'function' &&
    typeof RN_WIDGET?.TextWidget === 'function';

  // eslint-disable-next-line global-require
  const widgetModule = require('./src/widgets/NidaWidget');
  NidaSmallWidget = widgetModule?.NidaSmallWidget ?? null;
  NidaMediumWidget = widgetModule?.NidaMediumWidget ?? null;
  NidaLargeWidget = widgetModule?.NidaLargeWidget ?? null;
  NidaWidget = widgetModule?.NidaWidget ?? null;

  if (!NidaWidget) {
    console.warn('[Widget] NidaWidget bileşenleri yüklenemedi');
  }
} catch (e) {
  console.warn('[Widget] Modül yükleme hatası:', e?.message);
  nativeModuleAvailable = false;
}

/* ================================================================
   Sabitler & Yardımcılar
   ================================================================ */
const PRAYER_ORDER = ['imsak', 'dhuhr', 'asr', 'maghrib', 'isha'];

const PRAYER_NAMES = {
  imsak: 'İmsak',
  sunrise: 'Güneş',
  dhuhr: 'Öğle',
  asr: 'İkindi',
  maghrib: 'Akşam',
  isha: 'Yatsı',
};

const TR_WEEKDAYS = [
  'Pazar', 'Pazartesi', 'Salı', 'Çarşamba',
  'Perşembe', 'Cuma', 'Cumartesi',
];

function pad(n) {
  return String(n).padStart(2, '0');
}

function safeString(value, fallback = '') {
  if (value == null) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function toDate(time, base = new Date(), offset = 0) {
  try {
    const match = String(time ?? '').match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

    const date = new Date(base);
    date.setDate(date.getDate() + offset);
    date.setHours(hours, minutes, 0, 0);
    return date;
  } catch {
    return null;
  }
}

function formatRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(
    Math.floor((total % 3600) / 60),
  )}:${pad(total % 60)}`;
}

function findNextPrayer(times, tomorrowImsak) {
  if (!times) return null;
  try {
    const now = new Date();
    const list = PRAYER_ORDER
      .map((id) => ({ id, name: PRAYER_NAMES[id], time: times[id] }))
      .filter((p) => Boolean(p.time));

    const upcoming = list
      .map((p) => ({ ...p, date: toDate(p.time, now, 0), tomorrow: false }))
      .filter((p) => p.date && p.date > now)
      .sort((a, b) => a.date - b.date);

    if (upcoming.length > 0) return upcoming[0];

    const nextImsak = toDate(tomorrowImsak, now, 1);
    if (nextImsak) {
      return {
        id: 'imsak',
        name: PRAYER_NAMES.imsak,
        time: tomorrowImsak,
        date: nextImsak,
        tomorrow: true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function buildAllPrayers(times, now, nextPrayer) {
  if (!times) return [];
  try {
    const list = [
      { id: 'imsak', name: PRAYER_NAMES.imsak, time: times.imsak },
      { id: 'sunrise', name: PRAYER_NAMES.sunrise, time: times.sunrise },
      { id: 'dhuhr', name: PRAYER_NAMES.dhuhr, time: times.dhuhr },
      { id: 'asr', name: PRAYER_NAMES.asr, time: times.asr },
      { id: 'maghrib', name: PRAYER_NAMES.maghrib, time: times.maghrib },
      { id: 'isha', name: PRAYER_NAMES.isha, time: times.isha },
    ];

    const nextId = nextPrayer?.tomorrow ? null : nextPrayer?.id;

    return list
      .filter((p) => Boolean(p.time))
      .map((p) => {
        const date = toDate(p.time, now, 0);
        return {
          ...p,
          isPast: date ? date <= now : false,
          isNext: p.id === nextId,
        };
      });
  } catch {
    return [];
  }
}

async function readWidgetContext() {
  try {
    const raw = await AsyncStorage.getItem(STORE_KEY);
    if (!raw) return { location: null, themeMode: 'dark' };
    const parsed = JSON.parse(raw);
    const state = parsed?.state ?? null;
    return {
      location: state?.selectedLocation ?? null,
      themeMode: state?.widgetPrefs?.themeMode ?? 'dark',
    };
  } catch {
    return { location: null, themeMode: 'dark' };
  }
}

/**
 * Widget adına veya boyutuna göre boyutu (small, medium, large) belirler.
 */
function resolveWidgetSize(widgetInfo) {
  const name = widgetInfo?.widgetName || '';
  if (name.includes('Small') || name === 'NidaSmallWidget') return 'small';
  if (name.includes('Large') || name === 'NidaLargeWidget') return 'large';
  if (name.includes('Medium') || name === 'NidaMediumWidget') return 'medium';

  // Boyut hücresine göre (DP / 70)
  const CELL = 70;
  const rawWidth = Number(widgetInfo?.width) || 0;
  const rawHeight = Number(widgetInfo?.height) || 0;
  const colCells = rawWidth > 0 ? Math.round(rawWidth / CELL) : 4;
  const rowCells = rawHeight > 0 ? Math.round(rawHeight / CELL) : 2;

  if (colCells <= 2 && rowCells <= 2) return 'small';
  if (rowCells >= 3) return 'large';
  return 'medium';
}

/**
 * Hata veya boş veri durumunda widget'ı render eder
 */
function renderFallback(renderWidget, size, themeMode) {
  if (typeof renderWidget !== 'function') return;
  try {
    const Component = size === 'small' ? NidaSmallWidget : size === 'large' ? NidaLargeWidget : NidaMediumWidget;
    renderWidget(<Component isError themeMode={themeMode} />);
  } catch (e) {
    console.warn('[Widget] Fallback render hatası:', e?.message);
  }
}

/* ================================================================
   Ana Render Fonksiyonu
   ================================================================ */
export async function renderCurrentWidget(renderWidget, widgetInfo = null) {
  if (typeof renderWidget !== 'function') return;

  const size = resolveWidgetSize(widgetInfo);
  let themeMode = 'dark';
  let location = null;

  try {
    const ctx = await readWidgetContext();
    themeMode = ctx.themeMode || 'dark';
    location = ctx.location;
  } catch (e) {
    console.warn('[Widget] Context okunamadı:', e?.message);
  }

  if (!location?.city) {
    renderFallback(renderWidget, size, themeMode);
    return;
  }

  try {
    const data = await fetchDiyanetTimes(location.city, location.district);
    if (!data?.times) {
      renderFallback(renderWidget, size, themeMode);
      return;
    }

    const next = findNextPrayer(data.times, data.tomorrowImsak);
    if (!next) {
      renderFallback(renderWidget, size, themeMode);
      return;
    }

    const remaining = formatRemainingFriendly(next.date.getTime() - Date.now());
    const allPrayers = buildAllPrayers(data.times, new Date(), next);
    const hijriText = data.hijri ? safeString(data.hijri).split(' ').slice(0, 2).join(' ') : '';
    const weekdayLabel = TR_WEEKDAYS[next.date.getDay()] || '';
    const isTomorrow = Boolean(next.tomorrow);
    const locationName = location.district || location.city || 'Hilal';

    // Vaktin Ayeti / Hadisi / Duası
    const vakitContent = getVakitCardContent(next.id);

    const widgetProps = {
      nextPrayerName: safeString(next.name, '—'),
      nextPrayerTime: safeString(next.time, '--:--'),
      remaining,
      allPrayers,
      hijriDate: hijriText,
      weekdayLabel,
      isTomorrow,
      locationName,
      vakitContent,
      themeMode,
    };

    if (size === 'small' && NidaSmallWidget) {
      renderWidget(<NidaSmallWidget {...widgetProps} />);
    } else if (size === 'large' && NidaLargeWidget) {
      renderWidget(<NidaLargeWidget {...widgetProps} />);
    } else if (NidaMediumWidget) {
      renderWidget(<NidaMediumWidget {...widgetProps} />);
    } else if (NidaWidget) {
      renderWidget(<NidaWidget size={size} {...widgetProps} />);
    }
  } catch (e) {
    console.warn('[Widget] Render hatası:', e?.message);
    renderFallback(renderWidget, size, themeMode);
  }
}

/* ================================================================
   Handler - Arka plan veya widget eylem tetikleyicisi
   ================================================================ */
async function handleWidgetAction(widgetAction, renderWidget, widgetInfo) {
  try {
    switch (widgetAction) {
      case 'WIDGET_ADDED':
      case 'WIDGET_UPDATE':
      case 'WIDGET_RESIZED':
      case 'WIDGET_CLICK':
        await renderCurrentWidget(renderWidget, widgetInfo);
        break;
      case 'WIDGET_DELETED':
        break;
      default:
        await renderCurrentWidget(renderWidget, widgetInfo);
    }
  } catch (e) {
    console.warn('[Widget] Handler içi hata:', e?.message);
  }
}

if (nativeModuleAvailable && RN_WIDGET?.registerWidgetTaskHandler) {
  try {
    RN_WIDGET.registerWidgetTaskHandler((props) => {
      try {
        const { widgetAction, renderWidget, widgetInfo } = props || {};
        handleWidgetAction(widgetAction, renderWidget, widgetInfo).catch((e) => {
          console.warn('[Widget] Async handler hatası:', e?.message);
        });
      } catch (e) {
        console.warn('[Widget] Callback içi hata:', e?.message);
      }
    });
    console.log('[Widget] Hilal Widget Handler başarıyla kaydedildi');
  } catch (e) {
    console.warn('[Widget] Handler kaydı başarısız:', e?.message);
  }
} else {
  console.log('[Widget] Native modül yok — Expo Go veya ortamda widget simülasyonu');
}
