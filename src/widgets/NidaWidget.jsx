// src/widgets/NidaWidget.jsx
import React from 'react';
import {
  FlexWidget,
  TextWidget,
} from 'react-native-android-widget';

/* ================================================================
   TÜM WIDGET TEMA PALETLERİ
   SettingsScreen'deki WIDGET_THEME_OPTIONS ile %100 uyumlu tam liste:
   - auto, dark, charcoal, midnight, cyber, oled, modernLight, light, sepia, sand
   ================================================================ */
export const PALETTES = {
  // 1. Standart Koyu (Zümrüt Yeşili Derinlik - Default)
  dark: {
    bgGradient: { from: '#051812', to: '#0B241B', orientation: 'TOP_BOTTOM' },
    bgSolid: '#051812',
    cardBg: '#0F2F23',
    cardBorder: '#23523F',
    accent: '#10B981',
    gold: '#FBBF24',
    goldLight: '#FDE68A',
    goldSoft: 'rgba(251, 191, 36, 0.16)',
    textPrimary: '#FFFFFF',
    textSecondary: '#E2FBEF',
    textMuted: '#A7F3D0',
    textDim: '#709C8B',
    badgeBg: 'rgba(16, 185, 129, 0.22)',
    badgeText: '#34D399',
    badgeBorder: '#059669',
    activeRowBg: '#18533D',
    activeRowBorder: '#34D399',
    inactiveText: '#87AFA1',
  },

  // 2. Modern Açık (Minimalist Beyaz / Yumuşak Gri)
  modernLight: {
    bgGradient: { from: '#F8FAFC', to: '#EDF2F7', orientation: 'TOP_BOTTOM' },
    bgSolid: '#F8FAFC',
    cardBg: '#FFFFFF',
    cardBorder: '#CBD5E1',
    accent: '#0F766E',
    gold: '#B45309',
    goldLight: '#92400E',
    goldSoft: 'rgba(180, 83, 9, 0.12)',
    textPrimary: '#0F172A',
    textSecondary: '#1E293B',
    textMuted: '#334155',
    textDim: '#64748B',
    badgeBg: 'rgba(15, 118, 110, 0.14)',
    badgeText: '#0F766E',
    badgeBorder: '#0D9488',
    activeRowBg: '#E2E8F0',
    activeRowBorder: '#0F766E',
    inactiveText: '#64748B',
  },

  // 3. Fildişi / Açık (Sıcak Fildişi ve Doğal Yeşil)
  light: {
    bgGradient: { from: '#FBF8EF', to: '#EFE9D8', orientation: 'TOP_BOTTOM' },
    bgSolid: '#FBF8EF',
    cardBg: '#FFFFFF',
    cardBorder: '#DCD3BC',
    accent: '#047857',
    gold: '#B45309',
    goldLight: '#92400E',
    goldSoft: 'rgba(180, 83, 9, 0.12)',
    textPrimary: '#042F24',
    textSecondary: '#064E3B',
    textMuted: '#065F46',
    textDim: '#5B6960',
    badgeBg: 'rgba(4, 120, 87, 0.14)',
    badgeText: '#047857',
    badgeBorder: '#059669',
    activeRowBg: '#E7F2EB',
    activeRowBorder: '#047857',
    inactiveText: '#63756A',
  },

  // 4. Titanyum / Charcoal (Nötr Koyu Gri)
  charcoal: {
    bgGradient: { from: '#121212', to: '#1E1E1E', orientation: 'TOP_BOTTOM' },
    bgSolid: '#121212',
    cardBg: '#212121',
    cardBorder: '#383838',
    accent: '#10B981',
    gold: '#FBBF24',
    goldLight: '#FDE68A',
    goldSoft: 'rgba(251, 191, 36, 0.16)',
    textPrimary: '#FFFFFF',
    textSecondary: '#EEEEEE',
    textMuted: '#BDBDBD',
    textDim: '#757575',
    badgeBg: 'rgba(255, 255, 255, 0.12)',
    badgeText: '#E0E0E0',
    badgeBorder: '#616161',
    activeRowBg: '#2E2E2E',
    activeRowBorder: '#FBBF24',
    inactiveText: '#9E9E9E',
  },

  // 5. Gece Yarısı / Midnight (Derin Lacivert)
  midnight: {
    bgGradient: { from: '#060B18', to: '#0F1A36', orientation: 'TOP_BOTTOM' },
    bgSolid: '#060B18',
    cardBg: '#132145',
    cardBorder: '#23376B',
    accent: '#38BDF8',
    gold: '#FBBF24',
    goldLight: '#FDE68A',
    goldSoft: 'rgba(251, 191, 36, 0.16)',
    textPrimary: '#FFFFFF',
    textSecondary: '#E0E7FF',
    textMuted: '#93C5FD',
    textDim: '#64748B',
    badgeBg: 'rgba(56, 189, 248, 0.18)',
    badgeText: '#38BDF8',
    badgeBorder: '#0284C7',
    activeRowBg: '#1E3264',
    activeRowBorder: '#38BDF8',
    inactiveText: '#94A3B8',
  },

  // 6. Siber / Cyber (Derin Gece Moru)
  cyber: {
    bgGradient: { from: '#0D081E', to: '#1E123D', orientation: 'TOP_BOTTOM' },
    bgSolid: '#0D081E',
    cardBg: '#281852',
    cardBorder: '#452A8A',
    accent: '#A855F7',
    gold: '#FBBF24',
    goldLight: '#FDE68A',
    goldSoft: 'rgba(251, 191, 36, 0.16)',
    textPrimary: '#FFFFFF',
    textSecondary: '#F3E8FF',
    textMuted: '#D8B4FE',
    textDim: '#8B7AA8',
    badgeBg: 'rgba(168, 85, 247, 0.2)',
    badgeText: '#C084FC',
    badgeBorder: '#9333EA',
    activeRowBg: '#3B2375',
    activeRowBorder: '#A855F7',
    inactiveText: '#A89CB8',
  },

  // 7. OLED (Saf Siyah)
  oled: {
    bgGradient: { from: '#000000', to: '#080808', orientation: 'TOP_BOTTOM' },
    bgSolid: '#000000',
    cardBg: '#121212',
    cardBorder: '#282828',
    accent: '#10B981',
    gold: '#FBBF24',
    goldLight: '#FDE68A',
    goldSoft: 'rgba(251, 191, 36, 0.16)',
    textPrimary: '#FFFFFF',
    textSecondary: '#EEEEEE',
    textMuted: '#CCCCCC',
    textDim: '#666666',
    badgeBg: 'rgba(255, 255, 255, 0.12)',
    badgeText: '#EEEEEE',
    badgeBorder: '#444444',
    activeRowBg: '#1F1F1F',
    activeRowBorder: '#FBBF24',
    inactiveText: '#888888',
  },

  // 8. Sepya / Sepia (Eski El Yazması Parşömen)
  sepia: {
    bgGradient: { from: '#F3E9D2', to: '#E4D5B7', orientation: 'TOP_BOTTOM' },
    bgSolid: '#F3E9D2',
    cardBg: '#FAF4E8',
    cardBorder: '#CEBC97',
    accent: '#8C5E28',
    gold: '#A16207',
    goldLight: '#78350F',
    goldSoft: 'rgba(161, 98, 7, 0.12)',
    textPrimary: '#3A2818',
    textSecondary: '#4A3522',
    textMuted: '#684E34',
    textDim: '#8A7056',
    badgeBg: 'rgba(140, 94, 40, 0.14)',
    badgeText: '#8C5E28',
    badgeBorder: '#A16207',
    activeRowBg: '#E9DEC3',
    activeRowBorder: '#8C5E28',
    inactiveText: '#7B634B',
  },

  // 9. Kum / Sand (Çöl Sıcaklığı)
  sand: {
    bgGradient: { from: '#EFE6D5', to: '#DFD1B8', orientation: 'TOP_BOTTOM' },
    bgSolid: '#EFE6D5',
    cardBg: '#F8F3E9',
    cardBorder: '#C8B695',
    accent: '#9A6B2F',
    gold: '#A16207',
    goldLight: '#78350F',
    goldSoft: 'rgba(161, 98, 7, 0.12)',
    textPrimary: '#2E2214',
    textSecondary: '#423321',
    textMuted: '#5C4730',
    textDim: '#7A644D',
    badgeBg: 'rgba(154, 107, 47, 0.14)',
    badgeText: '#9A6B2F',
    badgeBorder: '#B45309',
    activeRowBg: '#E5DAC0',
    activeRowBorder: '#9A6B2F',
    inactiveText: '#78624A',
  },
};

export const resolvePalette = (themeMode) => {
  if (!themeMode || themeMode === 'auto') {
    return PALETTES.dark;
  }
  return PALETTES[themeMode] || PALETTES.dark;
};

const safeStr = (val, fb = '') => (val != null && val !== '' ? String(val) : fb);

/* ================================================================
   HATA / VERİ BEKLENİYOR BİLEŞENİ
   ================================================================ */
function ErrorOrEmptyWidget({ message, themeMode = 'dark' }) {
  const p = resolvePalette(themeMode);
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundGradient: p.bgGradient,
        padding: 16,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      clickAction="OPEN_APP"
    >
      <TextWidget
        text="🕌"
        style={{ fontSize: 28, marginBottom: 8 }}
      />
      <TextWidget
        text="Hilal · Namaz Vakitleri"
        style={{
          fontSize: 15,
          fontWeight: 'bold',
          color: p.textPrimary,
          marginBottom: 4,
          textAlign: 'center',
        }}
      />
      <TextWidget
        text={message || 'Vakitleri görüntülemek için dokunun'}
        style={{
          fontSize: 12,
          fontWeight: '500',
          color: p.textMuted,
          textAlign: 'center',
        }}
        maxLines={2}
      />
    </FlexWidget>
  );
}

/* ================================================================
   1. KÜÇÜK BOYUT WIDGET (Compact / 2x2)
   - Android launcher taşmalarını önleyen esnek ve orantılı padding
   ================================================================ */
export function NidaSmallWidget({
  nextPrayerName = 'Öğle',
  nextPrayerTime = '12:56',
  remaining = '2 sa 15 dk',
  isTomorrow = false,
  locationName = 'Hilal',
  themeMode = 'dark',
  isError = false,
}) {
  if (isError) {
    return <ErrorOrEmptyWidget message="Konum ve vakit bilgisi bekleniyor" themeMode={themeMode} />;
  }

  const p = resolvePalette(themeMode);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundGradient: p.bgGradient,
        borderRadius: 20,
        padding: 10,
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
      clickAction="OPEN_APP"
    >
      {/* Üst Bar: Konum ve Rozet */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextWidget
            text="🕌 "
            style={{ fontSize: 12 }}
          />
          <TextWidget
            text={safeStr(locationName, 'Hilal')}
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: p.textMuted,
            }}
            maxLines={1}
          />
        </FlexWidget>

        <FlexWidget
          style={{
            backgroundColor: p.badgeBg,
            borderRadius: 6,
            paddingHorizontal: 5,
            paddingVertical: 1,
            borderWidth: 1,
            borderColor: p.badgeBorder,
          }}
        >
          <TextWidget
            text={isTomorrow ? 'YARIN' : 'SIRADAKİ'}
            style={{
              fontSize: 8,
              fontWeight: 'bold',
              color: p.badgeText,
            }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Orta Bölüm: Vakit Adı ve Saat (Garantili sığdırma) */}
      <FlexWidget
        style={{
          width: 'match_parent',
          alignItems: 'center',
          justifyContent: 'center',
          marginVertical: 2,
        }}
      >
        <TextWidget
          text={safeStr(nextPrayerName, '—')}
          style={{
            fontSize: 13,
            fontWeight: 'bold',
            color: p.textSecondary,
            marginBottom: 1,
            textAlign: 'center',
          }}
        />
        <TextWidget
          text={safeStr(nextPrayerTime, '--:--')}
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            color: p.textPrimary,
            letterSpacing: 0,
            textAlign: 'center',
          }}
          maxLines={1}
        />
      </FlexWidget>

      {/* Alt Kısım: Kalan Vakit */}
      <FlexWidget
        style={{
          width: 'match_parent',
          backgroundColor: p.cardBg,
          borderRadius: 10,
          paddingVertical: 4,
          paddingHorizontal: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: p.cardBorder,
        }}
      >
        <TextWidget
          text="⏳ "
          style={{ fontSize: 10 }}
        />
        <TextWidget
          text={remaining.startsWith('Kalan') || remaining === 'Vakit girdi' ? remaining : `Kalan: ${remaining}`}
          style={{
            fontSize: 11,
            fontWeight: 'bold',
            color: p.gold,
            textAlign: 'center',
          }}
          maxLines={1}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

/* ================================================================
   2. ORTA BOYUT WIDGET (Medium / 4x2)
   ================================================================ */
export function NidaMediumWidget({
  nextPrayerName = 'Öğle',
  nextPrayerTime = '12:56',
  remaining = '2 sa 15 dk',
  isTomorrow = false,
  locationName = 'Hilal',
  vakitContent = null,
  themeMode = 'dark',
  isError = false,
}) {
  if (isError) {
    return <ErrorOrEmptyWidget message="Konum ve vakit bilgisi bekleniyor" themeMode={themeMode} />;
  }

  const p = resolvePalette(themeMode);

  const contentBadge = vakitContent?.badge || 'Vaktin Hatırlatması';
  const contentIcon = vakitContent?.icon || '📖';
  const contentText = vakitContent?.text || 'Bilesiniz ki, kalpler ancak Allah\'ı anmakla huzur ve sükûnet bulur.';
  const contentSource = vakitContent?.source || 'Ra\'d Sûresi, 28';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundGradient: p.bgGradient,
        borderRadius: 22,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
      }}
      clickAction="OPEN_APP"
    >
      {/* Sol Panel: Vakit Bilgisi ve Süre */}
      <FlexWidget
        style={{
          flex: 4,
          height: 'match_parent',
          backgroundColor: p.cardBg,
          borderRadius: 16,
          padding: 10,
          borderWidth: 1,
          borderColor: p.cardBorder,
          justifyContent: 'space-between',
        }}
      >
        {/* Üst Satır */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TextWidget
            text={safeStr(locationName, 'Hilal')}
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: p.textMuted,
            }}
            maxLines={1}
          />
          <FlexWidget
            style={{
              backgroundColor: p.badgeBg,
              borderRadius: 6,
              paddingHorizontal: 5,
              paddingVertical: 1,
            }}
          >
            <TextWidget
              text={isTomorrow ? 'YARIN' : 'SIRADAKİ'}
              style={{
                fontSize: 8,
                fontWeight: 'bold',
                color: p.badgeText,
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* Saat ve Vakit İsmi */}
        <FlexWidget style={{ marginVertical: 2 }}>
          <TextWidget
            text={safeStr(nextPrayerName, '—')}
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: p.textSecondary,
            }}
          />
          <TextWidget
            text={safeStr(nextPrayerTime, '--:--')}
            style={{
              fontSize: 28,
              fontWeight: 'bold',
              color: p.textPrimary,
              letterSpacing: 0,
            }}
            maxLines={1}
          />
        </FlexWidget>

        {/* Kalan Vakit */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: p.goldSoft,
            borderRadius: 8,
            paddingVertical: 4,
            paddingHorizontal: 6,
          }}
        >
          <TextWidget
            text="⏳ "
            style={{ fontSize: 10 }}
          />
          <TextWidget
            text={safeStr(remaining, 'Vakit girdi')}
            style={{
              fontSize: 11,
              fontWeight: 'bold',
              color: p.gold,
            }}
            maxLines={1}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Panel Ayırıcı Boşluk */}
      <FlexWidget style={{ width: 8, height: 'match_parent' }} />

      {/* Sağ Panel: Vaktin Ayeti / Hadisi / Duası */}
      <FlexWidget
        style={{
          flex: 6,
          height: 'match_parent',
          backgroundColor: p.cardBg,
          borderRadius: 16,
          padding: 10,
          borderWidth: 1,
          borderColor: p.cardBorder,
          justifyContent: 'space-between',
        }}
      >
        {/* Başlık & Rozet */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextWidget
              text={`${contentIcon} `}
              style={{ fontSize: 12 }}
            />
            <TextWidget
              text={contentBadge}
              style={{
                fontSize: 11,
                fontWeight: 'bold',
                color: p.gold,
              }}
              maxLines={1}
            />
          </FlexWidget>
        </FlexWidget>

        {/* Ayet / Hadis / Dua Metni */}
        <FlexWidget style={{ flex: 1, justifyContent: 'center' }}>
          <TextWidget
            text={`"${contentText}"`}
            style={{
              fontSize: 12,
              fontWeight: '500',
              color: p.textPrimary,
              lineHeight: 16,
            }}
            maxLines={3}
          />
        </FlexWidget>

        {/* Kaynak Bilgisi */}
        <FlexWidget
          style={{
            width: 'match_parent',
            alignItems: 'flex-end',
            marginTop: 2,
          }}
        >
          <TextWidget
            text={`— ${contentSource}`}
            style={{
              fontSize: 10,
              color: p.textDim,
              fontWeight: 'bold',
            }}
            maxLines={1}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

/* ================================================================
   3. BÜYÜK BOYUT WIDGET (Large / 4x4)
   ================================================================ */
export function NidaLargeWidget({
  nextPrayerName = 'Öğle',
  nextPrayerTime = '12:56',
  remaining = '2 sa 15 dk',
  allPrayers = [],
  hijriDate = '',
  weekdayLabel = '',
  locationName = 'Hilal',
  vakitContent = null,
  themeMode = 'dark',
  isError = false,
}) {
  if (isError) {
    return <ErrorOrEmptyWidget message="Konum ve vakit bilgisi bekleniyor" themeMode={themeMode} />;
  }

  const p = resolvePalette(themeMode);

  const contentBadge = vakitContent?.badge || 'Vaktin Hatırlatması';
  const contentIcon = vakitContent?.icon || '📖';
  const contentText = vakitContent?.text || 'Bilesiniz ki, kalpler ancak Allah\'ı anmakla huzur ve sükûnet bulur.';
  const contentSource = vakitContent?.source || 'Ra\'d Sûresi, 28';

  const defaultPrayers = [
    { id: 'imsak', name: 'İmsak', time: '05:30', isPast: true },
    { id: 'sunrise', name: 'Güneş', time: '06:55', isPast: true },
    { id: 'dhuhr', name: 'Öğle', time: '12:56', isNext: true },
    { id: 'asr', name: 'İkindi', time: '15:45' },
    { id: 'maghrib', name: 'Akşam', time: '18:10' },
    { id: 'isha', name: 'Yatsı', time: '19:32' },
  ];

  const prayers = allPrayers && allPrayers.length >= 5 ? allPrayers : defaultPrayers;

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundGradient: p.bgGradient,
        borderRadius: 24,
        padding: 14,
        justifyContent: 'space-between',
      }}
      clickAction="OPEN_APP"
    >
      {/* 1. KISIM: Üst Kart - Vakit & Kalan Süre Hero */}
      <FlexWidget
        style={{
          width: 'match_parent',
          backgroundColor: p.cardBg,
          borderRadius: 18,
          padding: 12,
          borderWidth: 1,
          borderColor: p.cardBorder,
        }}
      >
        {/* Üst Satır */}
        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextWidget text="🕌 " style={{ fontSize: 14 }} />
            <TextWidget
              text={safeStr(locationName, 'Hilal')}
              style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: p.textPrimary,
              }}
              maxLines={1}
            />
          </FlexWidget>

          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            {hijriDate ? (
              <TextWidget
                text={`${hijriDate} • `}
                style={{ fontSize: 11, fontWeight: 'bold', color: p.textMuted }}
              />
            ) : null}
            <TextWidget
              text={safeStr(weekdayLabel, '')}
              style={{
                fontSize: 11,
                fontWeight: 'bold',
                color: p.textSecondary,
              }}
            />
          </FlexWidget>
        </FlexWidget>

        {/* Saat ve Kalan Süre Rozeti */}
        <FlexWidget
          style={{
            width: 'match_parent',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <FlexWidget>
            <TextWidget
              text={`Sıradaki: ${safeStr(nextPrayerName, '—')}`}
              style={{
                fontSize: 13,
                color: p.textSecondary,
                fontWeight: 'bold',
              }}
            />
            <TextWidget
              text={safeStr(nextPrayerTime, '--:--')}
              style={{
                fontSize: 34,
                fontWeight: 'bold',
                color: p.textPrimary,
              }}
              maxLines={1}
            />
          </FlexWidget>

          {/* Kalan Süre Kutucuğu */}
          <FlexWidget
            style={{
              backgroundColor: p.goldSoft,
              borderRadius: 12,
              paddingVertical: 8,
              paddingHorizontal: 12,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: p.gold,
            }}
          >
            <TextWidget
              text="KALAN VAKİT"
              style={{
                fontSize: 9,
                fontWeight: 'bold',
                color: p.gold,
                marginBottom: 2,
              }}
            />
            <TextWidget
              text={safeStr(remaining, 'Vakit girdi')}
              style={{
                fontSize: 15,
                fontWeight: 'bold',
                color: p.gold,
              }}
              maxLines={1}
            />
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>

      {/* 2. KISIM: 6 Vakitlik Tam Gün İmsakiye Şeridi */}
      <FlexWidget
        style={{
          width: 'match_parent',
          flexDirection: 'row',
          justifyContent: 'space-between',
          backgroundColor: p.cardBg,
          borderRadius: 16,
          padding: 8,
          borderWidth: 1,
          borderColor: p.cardBorder,
        }}
      >
        {prayers.map((prayer) => {
          const isNext = Boolean(prayer.isNext);
          const isPast = Boolean(prayer.isPast);

          return (
            <FlexWidget
              key={prayer.id || prayer.name}
              style={{
                flex: 1,
                alignItems: 'center',
                paddingVertical: 5,
                borderRadius: 10,
                backgroundColor: isNext ? p.activeRowBg : 'transparent',
                borderWidth: isNext ? 1 : 0,
                borderColor: isNext ? p.activeRowBorder : 'transparent',
                marginHorizontal: 1,
              }}
            >
              <TextWidget
                text={safeStr(prayer.name, '—')}
                style={{
                  fontSize: 11,
                  fontWeight: 'bold',
                  color: isNext ? p.gold : isPast ? p.inactiveText : p.textSecondary,
                  marginBottom: 2,
                }}
                maxLines={1}
              />
              <TextWidget
                text={safeStr(prayer.time, '--:--')}
                style={{
                  fontSize: 12,
                  fontWeight: isNext ? 'bold' : '600',
                  color: isNext ? p.textPrimary : isPast ? p.textDim : p.textPrimary,
                }}
                maxLines={1}
              />
            </FlexWidget>
          );
        })}
      </FlexWidget>

      {/* 3. KISIM: Vaktin Ayeti / Hadisi / Duası Kartı */}
      <FlexWidget
        style={{
          width: 'match_parent',
          backgroundColor: p.cardBg,
          borderRadius: 16,
          padding: 12,
          borderWidth: 1,
          borderColor: p.cardBorder,
        }}
      >
        {/* Üst Kart Başlığı */}
        <FlexWidget
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 4,
          }}
        >
          <FlexWidget style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextWidget text={`${contentIcon} `} style={{ fontSize: 13 }} />
            <TextWidget
              text={contentBadge}
              style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: p.gold,
              }}
            />
          </FlexWidget>
          <TextWidget
            text={`— ${contentSource}`}
            style={{
              fontSize: 10,
              color: p.textDim,
              fontWeight: 'bold',
            }}
            maxLines={1}
          />
        </FlexWidget>

        {/* Metin */}
        <TextWidget
          text={`"${contentText}"`}
          style={{
            fontSize: 12,
            fontWeight: '500',
            color: p.textPrimary,
            lineHeight: 17,
          }}
          maxLines={3}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

/* ================================================================
   ANA ÇATI BİLEŞENİ
   ================================================================ */
export function NidaWidget({
  size = 'medium',
  width = 4,
  height = 2,
  ...props
}) {
  let resolvedSize = size;
  if (!size || size === 'auto') {
    if (width <= 2 && height <= 2) {
      resolvedSize = 'small';
    } else if (height >= 3) {
      resolvedSize = 'large';
    } else {
      resolvedSize = 'medium';
    }
  }

  if (resolvedSize === 'small') {
    return <NidaSmallWidget {...props} />;
  }
  if (resolvedSize === 'large') {
    return <NidaLargeWidget {...props} />;
  }
  return <NidaMediumWidget {...props} />;
}
