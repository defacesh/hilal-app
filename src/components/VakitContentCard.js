// src/components/VakitContentCard.js
import React, { useState, useEffect, memo, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Clipboard,
  Alert,
  Platform,
} from 'react-native';
// ─── YENİ: AppText — disleksi desteği ───
import { AppText as Text } from './AppText';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  fetchVakitAyah,
  fetchVakitDua,
  fetchVakitEsma,
  getNextAyahRef,
} from '../services/ummahContentApi';
import { getVakitBaslik, DEFAULT_MEAL_EDITION } from '../data/vakitContent';
import { formatVerseReference, buildVerseReference } from '../utils/quranReferences';

function safeRender(value) {
  if (value == null) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return null;
  if (Array.isArray(value)) {
    const joined = value.map(safeRender).filter(Boolean).join(' ');
    return joined || null;
  }
  if (typeof value === 'object') {
    const v =
      value.tr ??
      value.turkish ??
      value.en ??
      value.english ??
      value.text ??
      value.value ??
      value.meaning ??
      value.description;
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') return safeRender(v);
    return null;
  }
  return null;
}

const VakitContentCard = memo(function VakitContentCard({
  kind,
  prayerId,
  seed,
  theme,
  fontScale,
  mealEdition = DEFAULT_MEAL_EDITION,
  showArabic = true,
  initialData = null,
}) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [ayahIndex, setAyahIndex] = useState(0);
  const [refreshTick, setRefreshTick] = useState(0);

  const baslik = getVakitBaslik(prayerId);

  const loadContent = useCallback(
    async (isRefresh = false) => {
      setLoading(true);
      try {
        let res;
        if (kind === 'ayet') {
          res = await fetchVakitAyah(
            prayerId,
            isRefresh ? seed + refreshTick : seed,
            mealEdition,
          );
          if (res && !isRefresh) setAyahIndex(0);
        } else if (kind === 'dua') {
          res = await fetchVakitDua(prayerId, seed + refreshTick);
        } else {
          res = await fetchVakitEsma(prayerId, seed + refreshTick);
        }
        setData(res);
      } catch (err) {
        console.warn(`VakitContentCard ${kind} hata:`, err?.message);
        setData(null);
      } finally {
        setLoading(false);
      }
    },
    [kind, prayerId, seed, refreshTick, mealEdition],
  );

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }
    loadContent();
  }, [initialData, loadContent]);

  const onRefresh = async () => {
    if (kind === 'ayet') {
      const next = getNextAyahRef(prayerId, ayahIndex);
      if (!next) {
        setRefreshTick((v) => v + 1);
        return;
      }
      setLoading(true);
      const res = await fetchVakitAyah(
        prayerId,
        next.index,
        mealEdition,
      );
      setData(res);
      setAyahIndex(next.index);
      setLoading(false);
    } else {
      setRefreshTick((v) => v + 1);
    }
  };

  const text = safeRender(data?.text);
  const arabic = safeRender(data?.arabic);
  const rawKaynak = safeRender(data?.kaynak);
  const esmaName = safeRender(data?.name);
  const esmaMeaning = safeRender(data?.meaning);

  // Ayet referansını İngilizce'den Türkçe'ye çevirerek güvenli biçimde oluştur
  const verseRefFormatted = useMemo(() => {
    if (!data || kind !== 'ayet') return null;

    const built = buildVerseReference({
      surahNumber: data?.surah?.number ?? data?.surahNumber ?? data?.surah_number,
      ayahNumber: data?.numberInSurah ?? data?.ayahNumber ?? data?.ayah_number,
      englishName: data?.surah?.englishName ?? data?.surahName,
    });

    if (built) return built;

    const fallbackRaw = data?.reference || rawKaynak;
    return fallbackRaw ? formatVerseReference(fallbackRaw) : null;
  }, [data, kind, rawKaynak]);

  const kaynak = useMemo(() => {
    if (kind === 'ayet') return verseRefFormatted;
    return rawKaynak ? formatVerseReference(rawKaynak) : null;
  }, [kind, verseRefFormatted, rawKaynak]);

  const handleShare = async () => {
    try {
      const contentString = [
        arabic,
        text || esmaMeaning,
        kaynak
          ? `(${kaynak})`
          : esmaName
          ? `(${esmaName})`
          : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      await Share.share({
        message: contentString,
      });
    } catch (error) {
      console.warn('Paylaşım hatası:', error);
    }
  };

  const handleCopy = () => {
    const copyText = [arabic, text || esmaMeaning, kaynak]
      .filter(Boolean)
      .join('\n');
    Clipboard.setString(copyText);
    Alert.alert('Kopyalandı', 'İçerik panoya kopyalandı.');
  };

  const baslikUpper = baslik.toLocaleUpperCase('tr-TR');
  const headerLabel =
    kind === 'ayet'
      ? `${baslikUpper} AYETİ`
      : kind === 'dua'
      ? `${baslikUpper} DUASI`
      : `ESMAÜL HÜSNA · ${baslikUpper}`;

  const showArabicBlock = showArabic !== false;
  const noTurkishWarning =
    !loading &&
    data &&
    !text &&
    !showArabicBlock &&
    !(kind === 'esma' && esmaMeaning);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {/* ÜST BAŞLIK VE KONTROL BUTONLARI */}
      <View style={styles.header}>
        <View style={styles.titleLine}>
          {kind === 'ayet' && (
            <Ionicons
              name="book-outline"
              size={17}
              color={theme.primary}
            />
          )}
          {kind === 'dua' && (
            <MaterialCommunityIcons
              name="hands-pray"
              size={18}
              color={theme.primary}
            />
          )}
          {kind === 'esma' && (
            <MaterialCommunityIcons
              name="star-crescent"
              size={18}
              color={theme.primary}
            />
          )}
          <Text
            style={{
              color: theme.primary,
              fontWeight: '800',
              fontSize: 11 * fontScale,
            }}
          >
            {headerLabel}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {data && !loading && (
            <>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="İçeriği kopyala"
                onPress={handleCopy}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.actionIconBtn}
              >
                <Ionicons
                  name="copy-outline"
                  size={16}
                  color={theme.textDim}
                />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="İçeriği paylaş"
                onPress={handleShare}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.actionIconBtn}
              >
                <Ionicons
                  name="share-social-outline"
                  size={16}
                  color={theme.textDim}
                />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Başka içerik göster"
            onPress={onRefresh}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={styles.actionIconBtn}
          >
            <Ionicons
              name="refresh-outline"
              size={17}
              color={theme.textDim}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      {/* YÜKLENİYOR DURUMU */}
      {loading && (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color={theme.primary} />
          <Text
            style={{
              color: theme.textDim,
              fontSize: 11,
              marginTop: 8,
            }}
          >
            Manevi içerik yükleniyor...
          </Text>
        </View>
      )}

      {/* HATA / VERİ YOK DURUMU */}
      {!loading && !data && (
        <View style={styles.errorBox}>
          <Ionicons
            name="cloud-offline-outline"
            size={24}
            color={theme.textDim}
          />
          <Text
            style={{
              color: theme.textDim,
              fontSize: 12,
              marginTop: 6,
              textAlign: 'center',
            }}
          >
            İçerik yüklenemedi.
          </Text>
          <TouchableOpacity
            onPress={() => loadContent(true)}
            style={[styles.retryButton, { borderColor: theme.primary }]}
          >
            <Text
              style={{
                color: theme.primary,
                fontSize: 11,
                fontWeight: '700',
              }}
            >
              Tekrar Dene
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {noTurkishWarning && (
        <Text
          style={{
            color: '#D8A14F',
            fontSize: 11 * fontScale,
            marginTop: 10,
            fontStyle: 'italic',
          }}
        >
          ⓘ Bu içerik için Türkçe çeviri yok. Arapça metni görmek için
          ayarlardan "Arapça Metni Göster" seçeneğini açın.
        </Text>
      )}

      {/* AYET İÇERİĞİ */}
      {!loading && data && kind === 'ayet' && (
        <>
          {showArabicBlock && arabic ? (
            <Text
              style={{
                color: theme.text,
                fontSize: 22 * fontScale,
                textAlign: 'right',
                marginTop: 6,
                lineHeight: 34 * fontScale,
                writingDirection: 'rtl',
                // ⚠️ Arapça için ÖZEL font — AppText korur (containsArabic + fontFamily)
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Traditional Arabic'
                    : 'sans-serif',
              }}
            >
              {arabic}
            </Text>
          ) : null}

          {text ? (
            <Text
              style={{
                color: theme.text,
                fontSize: 14 * fontScale,
                lineHeight: 23 * fontScale,
                marginTop: showArabicBlock && arabic ? 12 : 6,
              }}
            >
              {text}
            </Text>
          ) : null}

          {kaynak ? (
            <View style={styles.sourceBadge}>
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 11 * fontScale,
                  fontWeight: '700',
                }}
              >
                {kaynak}
              </Text>
            </View>
          ) : null}
        </>
      )}

      {/* DUA İÇERİĞİ */}
      {!loading && data && kind === 'dua' && (
        <>
          {showArabicBlock && arabic ? (
            <Text
              style={{
                color: theme.text,
                fontSize: 20 * fontScale,
                textAlign: 'right',
                marginTop: 6,
                lineHeight: 30 * fontScale,
                writingDirection: 'rtl',
                // Arapça fontu — AppText `writingDirection` + içerikten Arapça tespit eder
                // ama ek güvence için explicit set
                fontFamily:
                  Platform.OS === 'ios' ? 'Geeza Pro' : 'sans-serif',
              }}
            >
              {arabic}
            </Text>
          ) : null}

          {text ? (
            <Text
              style={{
                color: theme.text,
                fontSize: 14 * fontScale,
                lineHeight: 23 * fontScale,
                marginTop: showArabicBlock && arabic ? 12 : 6,
              }}
            >
              {text}
            </Text>
          ) : null}

          {kaynak ? (
            <View style={styles.sourceBadge}>
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 11 * fontScale,
                  fontWeight: '700',
                }}
              >
                {kaynak}
              </Text>
            </View>
          ) : null}
        </>
      )}

      {/* ESMAÜL HÜSNA İÇERİĞİ */}
      {!loading && data && kind === 'esma' && (
        <>
          {showArabicBlock && arabic ? (
            <Text
              style={{
                color: theme.text,
                fontSize: 26 * fontScale,
                textAlign: 'right',
                marginTop: 6,
                writingDirection: 'rtl',
                // Arapça için özel font — AppText korur
                fontFamily:
                  Platform.OS === 'ios'
                    ? 'Traditional Arabic'
                    : 'sans-serif',
              }}
            >
              {arabic}
            </Text>
          ) : null}

          {esmaName ? (
            <Text
              style={{
                color: theme.text,
                fontSize: 17 * fontScale,
                fontWeight: '800',
                marginTop: showArabicBlock && arabic ? 6 : 4,
              }}
            >
              {esmaName}
            </Text>
          ) : null}

          {esmaMeaning ? (
            <Text
              style={{
                color: theme.textDim,
                fontSize: 13 * fontScale,
                lineHeight: 20 * fontScale,
                marginTop: 4,
              }}
            >
              {esmaMeaning}
            </Text>
          ) : null}
        </>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  titleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionIconBtn: {
    padding: 4,
  },
  divider: {
    height: 1,
    width: '100%',
    opacity: 0.6,
    marginBottom: 10,
  },
  centerBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  sourceBadge: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
});

export default VakitContentCard;