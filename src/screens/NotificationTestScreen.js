// src/screens/NotificationTestScreen.js
// SADECE DEVELOPMENT BUILD'DE KULLANILIR.
// Bildirim izin durumu, test planlama, planlanmış bildirim listesi.

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { useAppStore } from '../store/useAppStore';
import {
  getNotifications,
  requestNotificationPermission,
  isNotificationsAvailable,
  getNotificationsUnavailableReason,
  cancelPrayerNotifications,
} from '../services/prayerNotifications';

let Haptics = null;
try { Haptics = require('expo-haptics'); } catch {}

const hapticImpact = (style = 'light') => {
  try {
    if (!Haptics || typeof Haptics.impactAsync !== 'function') return;
    const map = Haptics.ImpactFeedbackStyle ?? {};
    const arg = style === 'medium' ? map.Medium : style === 'heavy' ? map.Heavy : map.Light;
    if (arg === undefined) Haptics.impactAsync();
    else Haptics.impactAsync(arg);
  } catch {}
};

const pad = (v) => String(v).padStart(2, '0');
const timeStr = (ms) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};
const dateTimeStr = (ms) => {
  const d = new Date(ms);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${timeStr(ms)}`;
};

const PRAYER_CHANNEL_ID = 'prayer-reminders-v2';

/* ================================================================
   Test bildirimi planla — dev yardımcı
   ================================================================ */
async function scheduleTest(module, { title, body, delaySec, data }) {
  const triggerDate = new Date(Date.now() + delaySec * 1000);
  const types = module.SchedulableTriggerInputTypes ?? {};
  const trigger = types.DATE
    ? { type: types.DATE, date: triggerDate }
    : triggerDate;

  const content = {
    title,
    body,
    data: data ?? { type: 'dev_test' },
  };
  if (Platform.OS === 'android') content.channelId = PRAYER_CHANNEL_ID;
  if (Platform.OS === 'ios') content.sound = 'default';

  return module.scheduleNotificationAsync({ content, trigger });
}

/* ================================================================
   Log satırı
   ================================================================ */
const LogRow = memo(function LogRow({ log, theme }) {
  const color =
    log.type === 'error' ? '#EF4444'
    : log.type === 'success' ? '#22C55E'
    : theme.text;

  return (
    <View style={styles.logRow}>
      <Text style={[styles.logTime, { color: theme.textMuted }]}>{log.time}</Text>
      <Text style={[styles.logMessage, { color }]} numberOfLines={3}>
        {log.message}
      </Text>
    </View>
  );
});

/* ================================================================
   Aksiyon butonu
   ================================================================ */
const ActionButton = memo(function ActionButton({
  icon, label, subtitle, onPress, theme, loading, variant = 'default', disabled,
}) {
  const isPrimary = variant === 'primary';
  const isDanger = variant === 'danger';
  const bgColor =
    isPrimary ? theme.primary
    : isDanger ? 'rgba(239,68,68,0.12)'
    : theme.surface;
  const fgColor =
    isPrimary ? (theme.onPrimary || '#FFF')
    : isDanger ? '#EF4444'
    : theme.text;

  return (
    <TouchableOpacity
      onPress={disabled || loading ? undefined : onPress}
      activeOpacity={0.75}
      disabled={disabled || loading}
      style={[
        styles.actionBtn,
        {
          backgroundColor: bgColor,
          borderColor: isPrimary ? theme.primary : theme.border,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={subtitle}
    >
      <View style={[
        styles.actionIcon,
        {
          backgroundColor: isPrimary
            ? 'rgba(255,255,255,0.18)'
            : isDanger ? 'rgba(239,68,68,0.18)' : theme.primaryGlow,
        },
      ]}>
        {loading ? (
          <ActivityIndicator size="small" color={fgColor} />
        ) : (
          <Ionicons name={icon} size={18} color={fgColor} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.actionLabel, { color: fgColor }]}>{label}</Text>
        {subtitle ? (
          <Text style={[styles.actionSub, {
            color: isPrimary ? 'rgba(255,255,255,0.8)' : theme.textDim,
          }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

/* ================================================================
   Planlanmış bildirim satırı
   ================================================================ */
const ScheduledRow = memo(function ScheduledRow({ item, theme, onCancel }) {
  const title = item?.content?.title ?? '(başlıksız)';
  const body = item?.content?.body ?? '';
  const trigger = item?.trigger;

  let when = '—';
  if (trigger?.date) {
    const d = new Date(trigger.date);
    if (Number.isFinite(d.getTime())) when = dateTimeStr(d.getTime());
  } else if (trigger?.value) {
    const d = new Date(trigger.value);
    if (Number.isFinite(d.getTime())) when = dateTimeStr(d.getTime());
  } else if (typeof trigger === 'number') {
    when = dateTimeStr(trigger);
  } else if (trigger instanceof Date) {
    when = dateTimeStr(trigger.getTime());
  } else if (trigger?.seconds) {
    when = `${trigger.seconds} sn sonra`;
  }

  const isTest = item?.content?.data?.type === 'dev_test';
  const isPrayer = item?.content?.data?.type === 'prayer_reminder';
  const tag = isTest ? 'TEST' : isPrayer ? 'NAMAZ' : 'DİĞER';
  const tagColor = isTest ? '#8B7FD4' : isPrayer ? theme.primary : theme.textDim;

  return (
    <View style={[styles.scheduledRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={[styles.scheduledTag, { backgroundColor: `${tagColor}22` }]}>
        <Text style={[styles.scheduledTagText, { color: tagColor }]}>{tag}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.scheduledTitle, { color: theme.text }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.scheduledMeta, { color: theme.textDim }]} numberOfLines={1}>
          {body || 'içerik yok'}
        </Text>
        <Text style={[styles.scheduledWhen, { color: theme.primary }]} numberOfLines={1}>
          <Ionicons name="time-outline" size={10} /> {when}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => { hapticImpact(); onCancel?.(item.identifier); }}
        accessibilityLabel="İptal et"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[styles.cancelBtn, { borderColor: theme.border }]}
      >
        <Ionicons name="close" size={16} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );
});

/* ================================================================
   Ana ekran
   ================================================================ */
export default function NotificationTestScreen({ onBack }) {
  const getTheme = useAppStore((s) => s.getTheme);
  const theme = getTheme();
  const insets = useSafeAreaInsets();

  const [permission, setPermission] = useState('unknown');
  const [available, setAvailable] = useState(true);
  const [unavailableReason, setUnavailableReason] = useState(null);
  const [scheduled, setScheduled] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const pushLog = useCallback((type, message) => {
    setLogs((prev) => [
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, time: timeStr(Date.now()), type, message },
      ...prev,
    ].slice(0, 30));
  }, []);

  const withLoading = useCallback(async (key, fn) => {
    setLoading((prev) => ({ ...prev, [key]: true }));
    try {
      const result = await fn();
      return result;
    } finally {
      if (mounted.current) {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    }
  }, []);

  /* ---------------- Yenile ---------------- */
  const refreshAll = useCallback(async () => {
    setAvailable(isNotificationsAvailable());
    setUnavailableReason(getNotificationsUnavailableReason());

    const module = await getNotifications();
    if (!module) {
      pushLog('error', 'expo-notifications modülü yüklenemedi');
      return;
    }

    try {
      const perms = await module.getPermissionsAsync();
      if (mounted.current) setPermission(perms?.status ?? 'unknown');
    } catch (e) {
      pushLog('error', `İzin durumu alınamadı: ${e?.message ?? e}`);
    }

    try {
      const list = await module.getAllScheduledNotificationsAsync();
      if (mounted.current) setScheduled(list ?? []);
    } catch (e) {
      pushLog('error', `Planlanmış bildirimler alınamadı: ${e?.message ?? e}`);
    }
  }, [pushLog]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshAll();
    if (mounted.current) setRefreshing(false);
  }, [refreshAll]);

  /* ---------------- İzin iste ---------------- */
  const requestPermission = useCallback(async () => {
    hapticImpact();
    await withLoading('perm', async () => {
      const granted = await requestNotificationPermission();
      if (granted) {
        pushLog('success', 'İzin verildi');
      } else {
        pushLog('error', 'İzin reddedildi veya verilemedi');
      }
      await refreshAll();
    });
  }, [withLoading, pushLog, refreshAll]);

  /* ---------------- Anlık test ---------------- */
  const sendImmediate = useCallback(async () => {
    hapticImpact();
    await withLoading('immediate', async () => {
      const module = await getNotifications();
      if (!module) { pushLog('error', 'Modül yok'); return; }
      try {
        await scheduleTest(module, {
          title: '🧪 Test bildirimi',
          body: '3 saniye içinde teslim edildi.',
          delaySec: 3,
        });
        pushLog('success', '3 sn sonrasına test planlandı');
        await refreshAll();
      } catch (e) {
        pushLog('error', `Planlanamadı: ${e?.message ?? e}`);
      }
    });
  }, [withLoading, pushLog, refreshAll]);

  /* ---------------- Gecikmeli test ---------------- */
  const sendDelayed = useCallback(async (seconds) => {
    hapticImpact();
    await withLoading(`delay_${seconds}`, async () => {
      const module = await getNotifications();
      if (!module) { pushLog('error', 'Modül yok'); return; }
      try {
        await scheduleTest(module, {
          title: `⏱ ${seconds} sn gecikmeli test`,
          body: 'Gecikmeli test bildirimi teslim edildi.',
          delaySec: seconds,
        });
        pushLog('success', `${seconds} sn sonrasına test planlandı`);
        await refreshAll();
      } catch (e) {
        pushLog('error', `Planlanamadı: ${e?.message ?? e}`);
      }
    });
  }, [withLoading, pushLog, refreshAll]);

  /* ---------------- Namaz bildirim testi ---------------- */
  const testPrayerNotifications = useCallback(async () => {
    hapticImpact();
    await withLoading('prayer', async () => {
      const module = await getNotifications();
      if (!module) { pushLog('error', 'Modül yok'); return; }
      const samples = [
        { name: 'İmsak', delay: 10 },
        { name: 'Öğle', delay: 20 },
        { name: 'Yatsı', delay: 30 },
      ];
      let count = 0;
      for (const s of samples) {
        try {
          await scheduleTest(module, {
            title: `${s.name} vakti (test)`,
            body: `${s.delay} saniye içinde ${s.name.toLowerCase()} hatırlatması.`,
            delaySec: s.delay,
            data: {
              type: 'prayer_reminder',
              prayerName: s.name,
              offsetMinutes: 0,
              isTest: true,
            },
          });
          count += 1;
        } catch (e) {
          pushLog('error', `${s.name}: ${e?.message ?? e}`);
        }
      }
      if (count > 0) pushLog('success', `${count}/3 namaz bildirimi planlandı`);
      await refreshAll();
    });
  }, [withLoading, pushLog, refreshAll]);

  /* ---------------- Tek bildirim iptal ---------------- */
  const cancelOne = useCallback(async (identifier) => {
    const module = await getNotifications();
    if (!module) return;
    try {
      await module.cancelScheduledNotificationAsync(identifier);
      pushLog('success', `İptal edildi: ${identifier.slice(0, 8)}…`);
      await refreshAll();
    } catch (e) {
      pushLog('error', `İptal edilemedi: ${e?.message ?? e}`);
    }
  }, [pushLog, refreshAll]);

  /* ---------------- Namaz bildirimlerini iptal ---------------- */
  const cancelPrayer = useCallback(async () => {
    hapticImpact();
    await withLoading('cancelPrayer', async () => {
      try {
        await cancelPrayerNotifications();
        pushLog('success', 'Namaz bildirimleri iptal edildi');
        await refreshAll();
      } catch (e) {
        pushLog('error', `İptal edilemedi: ${e?.message ?? e}`);
      }
    });
  }, [withLoading, pushLog, refreshAll]);

  /* ---------------- Tümünü iptal ---------------- */
  const cancelAll = useCallback(() => {
    hapticImpact('heavy');
    Alert.alert(
      'Tüm bildirimleri iptal et?',
      'Namaz, test ve diğer tüm planlanmış bildirimler silinecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => withLoading('cancelAll', async () => {
            const module = await getNotifications();
            if (!module) return;
            try {
              await module.cancelAllScheduledNotificationsAsync();
              pushLog('success', 'Tüm bildirimler iptal edildi');
              await refreshAll();
            } catch (e) {
              pushLog('error', `İptal edilemedi: ${e?.message ?? e}`);
            }
          }),
        },
      ],
    );
  }, [withLoading, pushLog, refreshAll]);

  /* ---------------- Render ---------------- */
  const permStatusColor =
    permission === 'granted' ? '#22C55E'
    : permission === 'denied' ? '#EF4444'
    : theme.textMuted;

  const permStatusText =
    permission === 'granted' ? 'İzin verildi'
    : permission === 'denied' ? 'Reddedildi'
    : permission === 'undetermined' ? 'Henüz sorulmadı'
    : 'Bilinmiyor';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.mode === 'light' ? 'dark-content' : 'light-content'} />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { hapticImpact(); onBack?.(); }}
          accessibilityRole="button"
          accessibilityLabel="Geri"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerEyebrow, { color: theme.primary }]}>DEVELOPMENT</Text>
          <Text accessibilityRole="header" style={[styles.headerTitle, { color: theme.text }]}>
            Bildirim Testi
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(24, insets.bottom + 24) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing} onRefresh={onRefresh}
            tintColor={theme.primary} colors={[theme.primary]}
            progressBackgroundColor={theme.surface}
          />
        }
      >
        {/* DURUM KARTI */}
        <View style={[styles.statusCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textDim }]}>Modül</Text>
            <View style={styles.statusValueRow}>
              <View style={[styles.dot, {
                backgroundColor: available ? '#22C55E' : '#EF4444',
              }]} />
              <Text style={[styles.statusValue, { color: theme.text }]}>
                {available ? 'Kullanılabilir' : 'Kullanılamıyor'}
              </Text>
            </View>
          </View>

          {!available && unavailableReason && (
            <Text style={[styles.statusHint, { color: theme.textMuted }]}>
              Sebep: {unavailableReason}
            </Text>
          )}

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textDim }]}>İzin</Text>
            <Text style={[styles.statusValue, { color: permStatusColor }]}>
              {permStatusText}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textDim }]}>Platform</Text>
            <Text style={[styles.statusValue, { color: theme.text }]}>
              {Platform.OS} · Kanal: {PRAYER_CHANNEL_ID}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.statusRow}>
            <Text style={[styles.statusLabel, { color: theme.textDim }]}>Planlanmış</Text>
            <Text style={[styles.statusValue, { color: theme.text }]}>
              {scheduled.length} bildirim
            </Text>
          </View>
        </View>

        {/* AKSİYONLAR */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Aksiyonlar</Text>

        <ActionButton
          icon="shield-checkmark-outline"
          label="İzin iste"
          subtitle="requestPermissionsAsync() çağırır"
          onPress={requestPermission}
          loading={loading.perm}
          theme={theme}
          variant="primary"
          disabled={!available}
        />

        <ActionButton
          icon="flash-outline"
          label="Anlık test bildirimi"
          subtitle="3 saniye sonra gönderilir"
          onPress={sendImmediate}
          loading={loading.immediate}
          theme={theme}
          disabled={!available}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <ActionButton
              icon="time-outline"
              label="30 sn gecikmeli"
              onPress={() => sendDelayed(30)}
              loading={loading.delay_30}
              theme={theme}
              disabled={!available}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ActionButton
              icon="time-outline"
              label="5 dk gecikmeli"
              onPress={() => sendDelayed(300)}
              loading={loading.delay_300}
              theme={theme}
              disabled={!available}
            />
          </View>
        </View>

        <ActionButton
          icon="moon-outline"
          label="Namaz bildirim testi"
          subtitle="3 örnek (İmsak, Öğle, Yatsı) — 10/20/30 sn sonra"
          onPress={testPrayerNotifications}
          loading={loading.prayer}
          theme={theme}
          disabled={!available}
        />

        <ActionButton
          icon="notifications-off-outline"
          label="Namaz bildirimlerini iptal et"
          subtitle="Sadece prayer_reminder tipindekiler"
          onPress={cancelPrayer}
          loading={loading.cancelPrayer}
          theme={theme}
          variant="danger"
        />

        <ActionButton
          icon="trash-outline"
          label="Tüm bildirimleri iptal et"
          subtitle="Test + namaz + diğer hepsi"
          onPress={cancelAll}
          loading={loading.cancelAll}
          theme={theme}
          variant="danger"
        />

        {/* PLANLANMIŞ BİLDİRİMLER */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Planlanmış ({scheduled.length})
          </Text>
          <TouchableOpacity
            onPress={onRefresh}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Yenile"
          >
            <Ionicons name="refresh" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {scheduled.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <MaterialCommunityIcons name="bell-off-outline" size={28} color={theme.textMuted} />
            <Text style={[styles.emptyText, { color: theme.textDim }]}>
              Planlanmış bildirim yok
            </Text>
          </View>
        ) : (
          scheduled.map((item) => (
            <ScheduledRow
              key={item.identifier}
              item={item}
              theme={theme}
              onCancel={cancelOne}
            />
          ))
        )}

        {/* LOG */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Log ({logs.length})
          </Text>
          {logs.length > 0 && (
            <TouchableOpacity
              onPress={() => { hapticImpact(); setLogs([]); }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Logları temizle"
            >
              <Ionicons name="close-circle-outline" size={18} color={theme.textDim} />
            </TouchableOpacity>
          )}
        </View>

        {logs.length === 0 ? (
          <View style={[styles.emptyBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.emptyText, { color: theme.textDim }]}>
              Henüz işlem yapılmadı
            </Text>
          </View>
        ) : (
          <View style={[styles.logBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {logs.map((log) => (
              <LogRow key={log.id} log={log} theme={theme} />
            ))}
          </View>
        )}

        <Text style={[styles.footnote, { color: theme.textMuted }]}>
          Bu ekran yalnızca __DEV__ modda görünür. Production build'de erişilemez.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12, gap: 8,
  },
  headerEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  headerTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.2 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  scrollContent: { paddingHorizontal: 20 },

  /* Status card */
  statusCard: {
    borderRadius: 18, borderWidth: 1, padding: 14, marginBottom: 20,
  },
  statusRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 8, gap: 12,
  },
  statusLabel: { fontSize: 12, fontWeight: '600' },
  statusValueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusValue: { fontSize: 13, fontWeight: '800', flexShrink: 1, textAlign: 'right' },
  statusHint: { fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },

  /* Action buttons */
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 10,
  },
  actionIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  actionLabel: { fontSize: 14, fontWeight: '800' },
  actionSub: { fontSize: 11, marginTop: 2, lineHeight: 15 },

  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },

  /* Section */
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 20, marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '900',
    marginTop: 12, marginBottom: 10, letterSpacing: 0.1,
  },

  /* Scheduled */
  scheduledRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  scheduledTag: {
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
    alignSelf: 'flex-start',
  },
  scheduledTagText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4 },
  scheduledTitle: { fontSize: 13, fontWeight: '800' },
  scheduledMeta: { fontSize: 11, marginTop: 2 },
  scheduledWhen: { fontSize: 11, fontWeight: '700', marginTop: 4 },
  cancelBtn: {
    width: 32, height: 32, borderRadius: 10, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Empty */
  emptyBox: {
    borderRadius: 14, borderWidth: 1, paddingVertical: 24,
    alignItems: 'center', gap: 8,
  },
  emptyText: { fontSize: 12, fontWeight: '600' },

  /* Log */
  logBox: {
    borderRadius: 14, borderWidth: 1, padding: 8,
  },
  logRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    paddingVertical: 4, paddingHorizontal: 6,
  },
  logTime: {
    fontSize: 10, fontVariant: ['tabular-nums'],
    fontWeight: '700', minWidth: 56,
  },
  logMessage: { fontSize: 11, flex: 1, lineHeight: 15 },

  footnote: {
    fontSize: 10, textAlign: 'center',
    marginTop: 24, lineHeight: 15, fontStyle: 'italic',
  },
});