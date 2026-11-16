/**
 * src/services/prayerNotifications.js
 *
 * Local prayer-time notifications for Expo / React Native.
 * Existing public exports are preserved.
 */

import { Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';

const PRAYER_NOTIFICATION_TYPE = 'prayer_reminder';

// Android notification channel settings are immutable after channel creation.
// v4 creates fresh channels so sound/vibration combinations take effect
// for users who previously had the v2 channel installed.
const PRAYER_CHANNEL_IDS = {
  soundAndVibration: 'prayer-reminders-v4-sound-vibration',
  soundOnly: 'prayer-reminders-v4-sound-only',
  vibrationOnly: 'prayer-reminders-v4-vibration-only',
  silent: 'prayer-reminders-v4-silent',
};

const PRAYER_VIBRATION_PATTERN = [0, 250, 250, 250];

let Notifications = null;
let notificationsLoadPromise = null;
let notificationsUnavailable = false;
let unavailableReason = null;
let notificationHandlerConfigured = false;
let channelsConfigured = false;

// Serialize schedule/cancel operations so two fast settings changes cannot
// cancel each other's notifications or leave duplicate reminders behind.
let operationQueue = Promise.resolve();
let lastPrayerTimes = null;
let lastScheduleOptions = {};
let lastPreferenceSnapshot = null;
let preferenceSubscription = null;
let scheduleCacheHydrated = false;

function logWarning(message, error) {
  if (__DEV__) {
    console.warn(message, error?.message ?? error ?? 'Bilinmeyen hata');
  }
}

function getNotificationPreferences(stateOverride) {
  try {
    const state = stateOverride ?? useAppStore.getState();
    const config = state?.widgetsConfig ?? {};

    return {
      soundEnabled: config.notificationSound !== false,
      vibrationEnabled: config.notificationVibrate !== false,
      notificationsEnabled: config.notificationsEnabled !== false,
      reminderBeforeMinutes: Number.isFinite(
        Number(config.reminderBeforeMinutes)
      )
        ? Math.min(
            120,
            Math.max(0, Math.floor(Number(config.reminderBeforeMinutes)))
          )
        : 15,
    };
  } catch (error) {
    logWarning('[Hilal] Bildirim tercihleri okunamadı:', error);

    return {
      soundEnabled: true,
      vibrationEnabled: true,
      notificationsEnabled: true,
      reminderBeforeMinutes: 15,
    };
  }
}

function getNotificationSoundEnabled() {
  return getNotificationPreferences().soundEnabled;
}

function getAndroidChannelId(preferences) {
  if (preferences.soundEnabled && preferences.vibrationEnabled) {
    return PRAYER_CHANNEL_IDS.soundAndVibration;
  }

  if (preferences.soundEnabled) {
    return PRAYER_CHANNEL_IDS.soundOnly;
  }

  if (preferences.vibrationEnabled) {
    return PRAYER_CHANNEL_IDS.vibrationOnly;
  }

  return PRAYER_CHANNEL_IDS.silent;
}

function installPreferenceWatcher() {
  if (
    preferenceSubscription ||
    typeof useAppStore?.subscribe !== 'function'
  ) {
    return;
  }

  lastPreferenceSnapshot = getNotificationPreferences();

  preferenceSubscription = useAppStore.subscribe((state) => {
    const next = getNotificationPreferences(state);
    const previous = lastPreferenceSnapshot;

    if (!previous) {
      lastPreferenceSnapshot = next;
      return;
    }

    lastPreferenceSnapshot = next;

    const notificationStateChanged =
      previous.notificationsEnabled !== next.notificationsEnabled;

    const alertStyleChanged =
      previous.soundEnabled !== next.soundEnabled ||
      previous.vibrationEnabled !== next.vibrationEnabled;

    const reminderOffsetChanged =
      previous.reminderBeforeMinutes !== next.reminderBeforeMinutes;

    if (
      !notificationStateChanged &&
      !alertStyleChanged &&
      !reminderOffsetChanged
    ) {
      return;
    }

    if (!next.notificationsEnabled) {
      cancelPrayerNotifications();
      return;
    }

    // Rebuild already-scheduled reminders when the user's sound/vibration
    // preference changes. The cached dates are refreshed on every schedule run.
    if (lastPrayerTimes?.length) {
      schedulePrayerNotifications(lastPrayerTimes, lastScheduleOptions);
    }
  });
}

async function hydrateScheduledPrayerCache(module) {
  if (scheduleCacheHydrated) return;

  scheduleCacheHydrated = true;

  if (
    typeof module?.getAllScheduledNotificationsAsync !== 'function'
  ) {
    installPreferenceWatcher();
    return;
  }

  try {
    const scheduled = await module.getAllScheduledNotificationsAsync();

    const recovered = (scheduled ?? [])
      .filter(
        (notification) =>
          notification?.content?.data?.type === PRAYER_NOTIFICATION_TYPE
      )
      .map((notification) => {
        const data = notification?.content?.data ?? {};
        const offsetMinutes = Math.max(
          0,
          Number(data.offsetMinutes) || 0
        );

        // Newer reminders carry the original prayer timestamp. For reminders
        // created by the previous service version, reconstruct it from the
        // scheduled trigger time plus the stored lead-time offset.
        const explicitTimestamp = Number(data.prayerTimestamp);

        const triggerValue =
          notification?.trigger?.date ??
          notification?.trigger?.value ??
          notification?.trigger?.timestamp;

        const triggerTimestamp =
          triggerValue == null
            ? NaN
            : new Date(triggerValue).getTime();

        const timestamp = Number.isFinite(explicitTimestamp)
          ? explicitTimestamp
          : Number.isFinite(triggerTimestamp)
            ? triggerTimestamp + offsetMinutes * 60 * 1000
            : NaN;

        if (!data.prayerName || !Number.isFinite(timestamp)) {
          return null;
        }

        return {
          name: String(data.prayerName),
          date: new Date(timestamp),
        };
      })
      .filter(Boolean);

    if (recovered.length > 0) {
      lastPrayerTimes = recovered;

      // Store preferences remain the source of truth for reminder lead time.
      lastScheduleOptions = {};
    }
  } catch (error) {
    logWarning(
      '[Hilal] Önceden planlanan namaz bildirimleri okunamadı:',
      error
    );
  } finally {
    installPreferenceWatcher();
  }
}

function configureNotificationHandler(module) {
  if (notificationHandlerConfigured) return;

  if (typeof module?.setNotificationHandler !== 'function') {
    return;
  }

  try {
    module.setNotificationHandler({
      handleNotification: async (notification) => {
        const isPrayerNotification =
          notification?.request?.content?.data?.type ===
          PRAYER_NOTIFICATION_TYPE;

        // On Android, shouldPlaySound:false can also suppress the foreground
        // banner. The channel itself controls sound there, so keep presentation
        // enabled and let the selected sound/silent channel do its job.
        const shouldPlaySound =
          Platform.OS === 'android'
            ? true
            : !isPrayerNotification || getNotificationSoundEnabled();

        return {
          shouldShowAlert: true, // Backward compatibility with older Expo SDKs.
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound,
          shouldSetBadge: false,
        };
      },
    });

    notificationHandlerConfigured = true;
  } catch (error) {
    logWarning('[Hilal] Bildirim handler kurulamadı:', error);
  }
}

/** Lazily loads expo-notifications so web and unsupported environments survive. */
export async function getNotifications() {
  if (notificationsUnavailable) return null;

  if (Notifications) {
    configureNotificationHandler(Notifications);
    return Notifications;
  }

  if (!notificationsLoadPromise) {
    notificationsLoadPromise = (async () => {
      try {
        const module = await import('expo-notifications');

        const hasRequiredApi =
          typeof module.getPermissionsAsync === 'function' &&
          typeof module.requestPermissionsAsync === 'function' &&
          typeof module.scheduleNotificationAsync === 'function';

        if (!hasRequiredApi) {
          notificationsUnavailable = true;
          unavailableReason = 'native-module-missing';

          logWarning(
            '[Hilal] Bildirim API kullanılamıyor. Development build gerekebilir.'
          );

          return null;
        }

        Notifications = module;

        configureNotificationHandler(module);
        await hydrateScheduledPrayerCache(module);

        return Notifications;
      } catch (error) {
        notificationsUnavailable = true;
        unavailableReason = error?.message ?? 'import-failed';

        logWarning('[Hilal] Bildirim modülü yüklenemedi:', error);

        return null;
      } finally {
        notificationsLoadPromise = null;
      }
    })();
  }

  return notificationsLoadPromise;
}

/**
 * Returns false only after the native module has been confirmed unavailable.
 * A lazy module that has not been loaded yet is treated as not-yet-checked.
 */
export function isNotificationsAvailable() {
  return !notificationsUnavailable;
}

export function getNotificationsUnavailableReason() {
  return unavailableReason;
}

/** Creates separate Android channels for audible and silent reminders. */
async function ensurePrayerNotificationChannels(module) {
  if (Platform.OS !== 'android') return true;
  if (channelsConfigured) return true;

  if (typeof module?.setNotificationChannelAsync !== 'function') {
    logWarning('[Hilal] Android bildirim kanalı API kullanılamıyor.');
    return false;
  }

  try {
    const audioAttributes = {
      usage: module.AndroidAudioUsage?.NOTIFICATION ?? 5,
      contentType:
        module.AndroidAudioContentType?.SONIFICATION ?? 4,
    };

    const channelDefinitions = [
      {
        id: PRAYER_CHANNEL_IDS.soundAndVibration,
        name: 'Namaz hatırlatmaları · Ses ve titreşim',
        sound: 'default',
        vibrationEnabled: true,
      },
      {
        id: PRAYER_CHANNEL_IDS.soundOnly,
        name: 'Namaz hatırlatmaları · Yalnızca ses',
        sound: 'default',
        vibrationEnabled: false,
      },
      {
        id: PRAYER_CHANNEL_IDS.vibrationOnly,
        name: 'Namaz hatırlatmaları · Yalnızca titreşim',
        sound: null,
        vibrationEnabled: true,
      },
      {
        id: PRAYER_CHANNEL_IDS.silent,
        name: 'Namaz hatırlatmaları · Sessiz',
        sound: null,
        vibrationEnabled: false,
      },
    ];

    for (const channel of channelDefinitions) {
      await module.setNotificationChannelAsync(channel.id, {
        name: channel.name,
        importance: module.AndroidImportance?.HIGH ?? 4,
        sound: channel.sound,
        enableVibrate: channel.vibrationEnabled,
        vibrationPattern: channel.vibrationEnabled
          ? PRAYER_VIBRATION_PATTERN
          : null,
        audioAttributes,
      });
    }

    channelsConfigured = true;
    return true;
  } catch (error) {
    logWarning(
      '[Hilal] Android bildirim kanalları oluşturulamadı:',
      error
    );

    return false;
  }
}

function hasNotificationPermission(permission, module) {
  if (permission?.status === 'granted') return true;

  if (Platform.OS === 'ios') {
    const iosStatus = permission?.ios?.status;
    const ios = module?.IosAuthorizationStatus;

    return (
      iosStatus === ios?.AUTHORIZED ||
      iosStatus === ios?.PROVISIONAL ||
      iosStatus === ios?.EPHEMERAL
    );
  }

  return false;
}

/** Requests notification permission after creating the Android channel. */
export async function requestNotificationPermission() {
  try {
    const module = await getNotifications();
    if (!module) return false;

    const channelsReady =
      await ensurePrayerNotificationChannels(module);

    if (!channelsReady) return false;

    const current = await module.getPermissionsAsync();

    if (hasNotificationPermission(current, module)) {
      return true;
    }

    const requested = await module.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });

    return hasNotificationPermission(requested, module);
  } catch (error) {
    logWarning('[Hilal] Bildirim izni alınamadı:', error);
    return false;
  }
}

/** Cancels only notifications created by this service. */
async function cancelScheduledPrayerNotifications(module) {
  if (
    !module ||
    typeof module.getAllScheduledNotificationsAsync !== 'function' ||
    typeof module.cancelScheduledNotificationAsync !== 'function'
  ) {
    return false;
  }

  try {
    const scheduled =
      await module.getAllScheduledNotificationsAsync();

    const prayerNotifications = (scheduled ?? []).filter(
      (notification) =>
        notification?.content?.data?.type ===
        PRAYER_NOTIFICATION_TYPE
    );

    if (prayerNotifications.length === 0) return true;

    const results = await Promise.allSettled(
      prayerNotifications.map((notification) =>
        module.cancelScheduledNotificationAsync(
          notification.identifier
        )
      )
    );

    const failedCount = results.filter(
      (result) => result.status === 'rejected'
    ).length;

    if (failedCount > 0) {
      logWarning(
        `[Hilal] ${failedCount} namaz bildirimi iptal edilemedi.`
      );
    }

    return failedCount === 0;
  } catch (error) {
    logWarning(
      '[Hilal] Planlanmış bildirimler alınamadı:',
      error
    );

    return false;
  }
}

export function cancelPrayerNotifications() {
  return enqueueOperation(async () => {
    try {
      const module = await getNotifications();
      if (!module) return false;

      return await cancelScheduledPrayerNotifications(module);
    } catch (error) {
      logWarning(
        '[Hilal] Namaz bildirimleri iptal edilemedi:',
        error
      );

      return false;
    }
  });
}

function enqueueOperation(operation) {
  const currentOperation = operationQueue.then(
    operation,
    operation
  );

  operationQueue = currentOperation.then(
    () => undefined,
    () => undefined
  );

  return currentOperation;
}

function toValidDate(value) {
  if (value == null) return null;

  const date =
    value instanceof Date
      ? new Date(value.getTime())
      : new Date(value);

  return Number.isFinite(date.getTime()) ? date : null;
}

function getReminderOffset(options) {
  const requestedOffset = Number(
    options?.reminderBeforeMinutes
  );

  if (!Number.isFinite(requestedOffset)) return 0;

  // Prevent accidental multi-day offsets caused by a malformed setting.
  return Math.min(
    24 * 60,
    Math.max(0, Math.floor(requestedOffset))
  );
}

function buildTrigger(module, date, channelId) {
  const dateType =
    module?.SchedulableTriggerInputTypes?.DATE;

  if (dateType) {
    return {
      type: dateType,
      date,
      ...(Platform.OS === 'android' && channelId
        ? { channelId }
        : {}),
    };
  }

  // A Date trigger is supported by older Expo Notifications versions too.
  return date;
}

function createNotificationIdentifier(prayerName, prayerDate) {
  const safeName = String(prayerName)
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32);

  return `prayer-${safeName || 'reminder'}-${prayerDate.getTime()}`;
}

async function scheduleSinglePrayerNotification(
  module,
  prayer,
  options = {}
) {
  if (!module || !prayer?.name || !prayer.date) {
    return false;
  }

  const prayerName = String(prayer.name).trim();
  const prayerDate = toValidDate(prayer.date);

  if (!prayerName || !prayerDate) {
    logWarning(
      `[Hilal] ${prayer?.name ?? 'Namaz'} için geçersiz tarih.`
    );

    return false;
  }

  const offset = getReminderOffset(options);

  const triggerDate = new Date(
    prayerDate.getTime() - offset * 60 * 1000
  );

  if (triggerDate.getTime() <= Date.now()) {
    if (__DEV__) {
      const timeString = prayerDate.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      console.log(
        `[Hilal] ${prayerName} (${timeString}) geçmişte kaldığı için atlandı.`
      );
    }

    return false;
  }

  const preferences = getNotificationPreferences();
  const soundEnabled = preferences.soundEnabled;
  const channelId = getAndroidChannelId(preferences);

  const content = {
    title:
      offset > 0
        ? `${prayerName} vakti yaklaşıyor`
        : `${prayerName} vakti`,

    body:
      offset > 0
        ? `${offset} dakika sonra ${prayerName} vakti girecek.`
        : `${prayerName} vakti girdi. Namazınızı hatırlayın.`,

    data: {
      type: PRAYER_NOTIFICATION_TYPE,
      prayerName,
      offsetMinutes: offset,
      prayerTimestamp: prayerDate.getTime(),
    },
  };

  if (Platform.OS === 'android') {
    // Android 8+: the channel controls sound and vibration.
    // The content value also covers devices below Android 8.
    content.vibrate = preferences.vibrationEnabled
      ? PRAYER_VIBRATION_PATTERN
      : [];
  } else {
    // iOS uses the notification content to choose the system default sound.
    content.sound = soundEnabled ? 'default' : null;
  }

  const identifier = createNotificationIdentifier(
    prayerName,
    prayerDate
  );

  const trigger = buildTrigger(
    module,
    triggerDate,
    channelId
  );

  try {
    await module.scheduleNotificationAsync({
      identifier,
      content,
      trigger,
    });

    return true;
  } catch (firstError) {
    logWarning(
      `[Hilal] ${prayerName} bildirimi ilk denemede planlanamadı:`,
      firstError
    );

    // Compatibility fallback for Expo versions that accept a plain Date but
    // do not expose SchedulableTriggerInputTypes.DATE.
    if (trigger instanceof Date) return false;

    try {
      await module.scheduleNotificationAsync({
        identifier,
        content,
        trigger: triggerDate,
      });

      return true;
    } catch (secondError) {
      logWarning(
        `[Hilal] ${prayerName} bildirimi ikinci denemede de planlanamadı:`,
        secondError
      );

      return false;
    }
  }
}

async function runSchedulePrayerNotifications(
  prayerTimes,
  options
) {
  try {
    const module = await getNotifications();
    if (!module) return 0;

    if (!Array.isArray(prayerTimes)) {
      logWarning(
        '[Hilal] Namaz vakitleri bir dizi olmalıdır.'
      );

      return 0;
    }

    const preferences = getNotificationPreferences();

    const effectiveOptions = {
      ...options,
      reminderBeforeMinutes:
        options?.reminderBeforeMinutes == null
          ? preferences.reminderBeforeMinutes
          : options.reminderBeforeMinutes,
    };

    const validPrayers = prayerTimes
      .map((prayer) => {
        if (
          !prayer ||
          typeof prayer.name !== 'string' ||
          !prayer.name.trim()
        ) {
          return null;
        }

        const date = toValidDate(prayer.date);

        return date
          ? {
              ...prayer,
              name: prayer.name.trim(),
              date,
            }
          : null;
      })
      .filter(Boolean)
      .sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );

    // An empty/invalid list means there is nothing left to remind about.
    // Clear old prayer reminders rather than leaving stale alarms scheduled.
    if (validPrayers.length === 0) {
      lastPrayerTimes = [];
      lastScheduleOptions = { ...options };

      await cancelScheduledPrayerNotifications(module);

      return 0;
    }

    // Keep the last requested list so preference changes can rebuild it.
    lastPrayerTimes = validPrayers.map(
      (prayer) => ({ ...prayer })
    );

    lastScheduleOptions = { ...options };

    installPreferenceWatcher();

    if (!getNotificationPreferences().notificationsEnabled) {
      await cancelScheduledPrayerNotifications(module);
      return 0;
    }

    const permitted = await requestNotificationPermission();

    if (!permitted) {
      if (__DEV__) {
        console.log('[Hilal] Bildirim izni verilmedi.');
      }

      return 0;
    }

    await cancelScheduledPrayerNotifications(module);

    // De-duplicate identical prayer name + timestamp pairs before scheduling.
    const uniquePrayers = Array.from(
      new Map(
        validPrayers.map((prayer) => [
          `${prayer.name}:${prayer.date.getTime()}`,
          prayer,
        ])
      ).values()
    );

    lastPrayerTimes = uniquePrayers.map(
      (prayer) => ({ ...prayer })
    );

    const results = [];

    for (const prayer of uniquePrayers) {
      try {
        results.push(
          await scheduleSinglePrayerNotification(
            module,
            prayer,
            effectiveOptions
          )
        );
      } catch (error) {
        logWarning(
          `[Hilal] ${prayer.name} bildirimi planlanamadı:`,
          error
        );

        results.push(false);
      }
    }

    const scheduledCount = results.filter(Boolean).length;
    const skippedCount =
      uniquePrayers.length - scheduledCount;

    if (__DEV__) {
      console.log(
        `[Hilal] ${scheduledCount}/${uniquePrayers.length} namaz bildirimi planlandı` +
          (skippedCount > 0
            ? ` (${skippedCount} tanesi atlandı veya planlanamadı)`
            : '') +
          '.'
      );
    }

    return scheduledCount;
  } catch (error) {
    logWarning(
      '[Hilal] Namaz bildirimleri planlanamadı:',
      error
    );

    return 0;
  }
}

/**
 * Schedules upcoming prayer reminders.
 *
 * `prayerTimes` keeps the existing shape: [{ name: 'İmsak', date: Date }].
 * `options.reminderBeforeMinutes` is optional; when omitted, the value
 * is read from useAppStore.getState().widgetsConfig.reminderBeforeMinutes.
 * Returns the number of successfully scheduled notifications.
 */
export function schedulePrayerNotifications(
  prayerTimes = [],
  options = {}
) {
  const safePrayerTimes = Array.isArray(prayerTimes)
    ? [...prayerTimes]
    : prayerTimes;

  const safeOptions =
    options && typeof options === 'object'
      ? { ...options }
      : {};

  return enqueueOperation(() =>
    runSchedulePrayerNotifications(
      safePrayerTimes,
      safeOptions
    )
  );
}