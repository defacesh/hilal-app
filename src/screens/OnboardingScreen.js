// src/screens/OnboardingScreen.js
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
} from "react";
import {
  StyleSheet,
  View,
  Text as RNText,
  Image,
  TouchableOpacity,
  Pressable,
  StatusBar,
  ActivityIndicator,
  Switch,
  Modal,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import {
  AppText as Text,
  AppTextInput as TextInput,
} from "../components/AppText";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useAppStore } from "../store/useAppStore";
import { detectIsTurkey, TURKEY_CITIES } from "../data/turkeyLocations";

const APP_LOGO = require("../../assets/icon.png");

/* ================================================================
   Sabitler
   ================================================================ */
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";
const DEBOUNCE_MS = 320;
const SEARCH_TIMEOUT_MS = 8000;
const TOTAL_STEPS = 3;

const APPEARANCE_OPTIONS = [
  {
    id: "auto",
    label: "Otomatik",
    desc: "Gündüz aydınlık, gece koyu",
    icon: "contrast-outline",
    themeId: "dynamic",
  },
  {
    id: "light",
    label: "Fildişi",
    desc: "Göz yormayan sıcak aydınlık",
    icon: "sunny-outline",
    themeId: "light",
  },
  {
    id: "dark",
    label: "Grafen",
    desc: "Derin ve sakin gece modu",
    icon: "moon-outline",
    themeId: "obsidian",
  },
];

const LIGHT_THEME_IDS = new Set(["modernLight", "light", "sepia", "sand"]);

const getChoiceFromMode = (themeMode) => {
  if (themeMode === "dynamic") return "auto";
  if (LIGHT_THEME_IDS.has(themeMode)) return "light";
  return "dark";
};

const THEME_PREVIEW_MAP = {
  light: {
    bg: "#F7F3E8",
    surface: "#FFFDF7",
    text: "#172B23",
    dim: "#5C6F66",
    primary: "#059669",
    border: "#E6DFCE",
  },
  obsidian: {
    bg: "#0B0D11",
    surface: "#151820",
    text: "#F4F4F5",
    dim: "#9CA3AF",
    primary: "#10B981",
    border: "#232733",
  },
};

const getThemePreview = (themeId) =>
  THEME_PREVIEW_MAP[themeId] || THEME_PREVIEW_MAP.light;

const makePlace = (id, title, country, latitude, longitude, timezone) => ({
  id,
  title,
  subtitle: country,
  city: title,
  district: title,
  country,
  latitude,
  longitude,
  timezone,
});

const POPULAR_PLACES = [
  makePlace("p-mekke", "Mekke", "Suudi Arabistan", 21.3891, 39.8579, "Asia/Riyadh"),
  makePlace("p-medine", "Medine", "Suudi Arabistan", 24.5247, 39.5692, "Asia/Riyadh"),
  makePlace("p-berlin", "Berlin", "Almanya", 52.52, 13.405, "Europe/Berlin"),
  makePlace("p-londra", "Londra", "Birleşik Krallık", 51.5074, -0.1278, "Europe/London"),
  makePlace("p-paris", "Paris", "Fransa", 48.8566, 2.3522, "Europe/Paris"),
  makePlace("p-baku", "Bakü", "Azerbaycan", 40.4093, 49.8671, "Asia/Baku"),
];

const FONT_SCALE_OPTIONS = [
  { value: 1.0, label: "Normal", desc: "%100" },
  { value: 1.15, label: "Büyük", desc: "%115" },
  { value: 1.3, label: "Çok Büyük", desc: "%130" },
];

const PILLARS = [
  { icon: "time-outline", label: "Çevrimdışı Vakit" },
  { icon: "compass-outline", label: "Hassas Kıble" },
  { icon: "book-outline", label: "Kur'an & Meal" },
];

/* ================================================================
   Yardımcılar
   ================================================================ */
const normalizeTr = (str = "") =>
  str
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function mapGeocodingResult(item) {
  const name = item.name || "";
  const admin = item.admin1 || item.admin2 || "";
  return {
    id: String(item.id ?? `${item.latitude},${item.longitude}`),
    title: name,
    subtitle: [admin && admin !== name ? admin : null, item.country]
      .filter(Boolean)
      .join(", "),
    city: admin || name,
    district: name,
    country: item.country || "",
    latitude: item.latitude,
    longitude: item.longitude,
    timezone: item.timezone,
  };
}

/* ================================================================
   Animasyonlu İlerleme Çubuğu
   ================================================================ */
const StepBar = memo(function StepBar({ step, total, theme }) {
  return (
    <View
      style={styles.stepBarTrack}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: total, now: step + 1 }}
    >
      {Array.from({ length: total }).map((_, i) => {
        const active = i === step;
        const done = i < step;
        return (
          <View
            key={i}
            style={[
              styles.stepBarSeg,
              {
                backgroundColor: active || done ? theme.primary : theme.border,
                opacity: active ? 1 : done ? 0.55 : 0.3,
              },
            ]}
          />
        );
      })}
    </View>
  );
});

/* ================================================================
   Astrolab Yörüngeli Logo Sahnesi (60 FPS Native Driver)
   ================================================================ */
const CelestialLogoStage = memo(function CelestialLogoStage({
  theme,
  reduceMotion,
}) {
  const outerSpin = useRef(new Animated.Value(0)).current;
  const innerSpin = useRef(new Animated.Value(0)).current;
  const auraPulse = useRef(new Animated.Value(0)).current;
  const logoSpring = useRef(new Animated.Value(reduceMotion ? 1 : 0.7)).current;

  useEffect(() => {
    if (reduceMotion) return;

    Animated.spring(logoSpring, {
      toValue: 1,
      friction: 6,
      tension: 50,
      useNativeDriver: true,
    }).start();

    const outerLoop = Animated.loop(
      Animated.timing(outerSpin, {
        toValue: 1,
        duration: 26000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const innerLoop = Animated.loop(
      Animated.timing(innerSpin, {
        toValue: 1,
        duration: 18000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(auraPulse, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(auraPulse, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    outerLoop.start();
    innerLoop.start();
    pulseLoop.start();

    return () => {
      outerLoop.stop();
      innerLoop.stop();
      pulseLoop.stop();
    };
  }, [outerSpin, innerSpin, auraPulse, logoSpring, reduceMotion]);

  const outerRotate = outerSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const innerRotate = innerSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ["360deg", "0deg"],
  });

  const auraScale = auraPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.08],
  });

  const auraOpacity = auraPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.75],
  });

  return (
    <View style={styles.celestialStage}>
      {/* Nefes alan arka plan ışık halesi */}
      <Animated.View
        style={[
          styles.auraGlow,
          {
            backgroundColor: theme.primaryGlow,
            transform: [{ scale: reduceMotion ? 1 : auraScale }],
            opacity: reduceMotion ? 0.5 : auraOpacity,
          },
        ]}
      />

      {/* Dış Astrolab Yörüngesi */}
      <Animated.View
        style={[
          styles.orbitOuter,
          {
            borderColor: `${theme.primary}28`,
            transform: [{ rotate: reduceMotion ? "0deg" : outerRotate }],
          },
        ]}
      >
        <View
          style={[styles.orbitStarDot, { backgroundColor: theme.primary }]}
        />
      </Animated.View>

      {/* İç Ters Yörünge */}
      <Animated.View
        style={[
          styles.orbitInner,
          {
            borderColor: `${theme.primary}45`,
            transform: [{ rotate: reduceMotion ? "0deg" : innerRotate }],
          },
        ]}
      >
        <View
          style={[
            styles.orbitStarDotSmall,
            { backgroundColor: theme.primary },
          ]}
        />
      </Animated.View>

      {/* Merkez Uygulama Logosu */}
      <Animated.View
        style={[
          styles.logoCore,
          {
            backgroundColor: theme.surface,
            borderColor: `${theme.primary}50`,
            shadowColor: theme.primary,
            transform: [{ scale: logoSpring }],
          },
        ]}
      >
        <Image
          source={APP_LOGO}
          style={styles.logoImg}
          resizeMode="cover"
          accessibilityLabel="HİLAL logosu"
        />
      </Animated.View>
    </View>
  );
});

/* ================================================================
   Adım 0 — Koreografili Yenilikçi Karşılama
   ================================================================ */
const WelcomeStep = memo(function WelcomeStep({
  theme,
  reduceMotion,
  hasActiveA11y,
  uiScale,
  highContrast,
  largeTouchTargets,
  onOpenHelp,
}) {
  // 4 kademeli sahne giriş animasyonu
  const anims = useRef([
    new Animated.Value(reduceMotion ? 1 : 0),
    new Animated.Value(reduceMotion ? 1 : 0),
    new Animated.Value(reduceMotion ? 1 : 0),
    new Animated.Value(reduceMotion ? 1 : 0),
  ]).current;

  useEffect(() => {
    if (reduceMotion) return;
    const sequence = anims.map((val, index) =>
      Animated.timing(val, {
        toValue: 1,
        duration: 440,
        delay: index * 95,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    Animated.parallel(sequence).start();
  }, [anims, reduceMotion]);

  const stageStyle = (idx) => ({
    opacity: anims[idx],
    transform: [
      {
        translateY: anims[idx].interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.welcomeScroll}
    >
      <View style={styles.welcomeInner}>
        {/* 1. Sahne: Besmele */}
        <Animated.View style={[styles.bismillahHeader, stageStyle(0)]}>
          <View
            style={[
              styles.bismillahGlass,
              {
                backgroundColor: theme.surface,
                borderColor: `${theme.primary}35`,
              },
            ]}
          >
            <RNText
              style={[
                styles.bismillahText,
                {
                  color: theme.primary,
                  fontSize: 18 * uiScale,
                },
              ]}
              accessibilityLabel="Bismillahirrahmanirrahim"
            >
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </RNText>
          </View>
        </Animated.View>

        {/* 2. Sahne: Yörüngeli Logo & Tipografi */}
        <Animated.View style={[styles.heroBlock, stageStyle(1)]}>
          <CelestialLogoStage theme={theme} reduceMotion={reduceMotion} />

          <Text
            style={[
              styles.brandTitle,
              { color: theme.text, fontSize: 34 * uiScale },
            ]}
          >
            HİLAL
          </Text>

          <Text
            style={[
              styles.brandTagline,
              {
                color: highContrast ? theme.text : theme.textDim,
                fontSize: 14.5 * uiScale,
                lineHeight: 21 * uiScale,
              },
            ]}
          >
            Vakit, kıble ve Kur’an yolculuğunuz için{"\n"}huzurlu ve reklamsız bir
            başlangıç.
          </Text>
        </Animated.View>

        {/* 3. Sahne: Zarif Kapsül Özellik Şeridi */}
        <Animated.View style={[styles.pillarsRow, stageStyle(2)]}>
          {PILLARS.map((p) => (
            <View
              key={p.label}
              style={[
                styles.pillarChip,
                {
                  backgroundColor: theme.surface,
                  borderColor: highContrast ? theme.textDim : theme.border,
                },
              ]}
            >
              <Ionicons name={p.icon} size={16} color={theme.primary} />
              <Text
                style={[
                  styles.pillarLabel,
                  { color: theme.text, fontSize: 11.5 * uiScale },
                ]}
                numberOfLines={1}
              >
                {p.label}
              </Text>
            </View>
          ))}
        </Animated.View>

        {/* 4. Sahne: Yardıma İhtiyacınız Mı Var? Açılır Butonu */}
        <Animated.View style={stageStyle(3)}>
          <TouchableOpacity
            onPress={onOpenHelp}
            activeOpacity={0.78}
            style={[
              styles.helpPillBtn,
              {
                backgroundColor: hasActiveA11y
                  ? theme.primaryGlow
                  : theme.surface,
                borderColor: hasActiveA11y ? theme.primary : theme.border,
                minHeight: largeTouchTargets ? 60 : 50,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Yardıma ihtiyacınız mı var? Yazı boyutu ve erişilebilirlik ayarlarını aç"
          >
            <View
              style={[
                styles.helpBadgeIcon,
                { backgroundColor: theme.primaryGlow },
              ]}
            >
              <Ionicons
                name="accessibility-outline"
                size={17}
                color={theme.primary}
              />
            </View>
            <Text
              style={[
                styles.helpPillText,
                { color: theme.text, fontSize: 13.5 * uiScale },
              ]}
            >
              {hasActiveA11y
                ? "Kolay kullanım aktif • Düzenle"
                : "Yardıma ihtiyacınız mı var?"}
            </Text>
            <Ionicons name="chevron-up" size={16} color={theme.primary} />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
});

/* ================================================================
   Adım 1 — Konum (Varsayılan Otomatik GPS + Türkiye İl/İlçe)
   ================================================================ */
const LocationStep = memo(function LocationStep({
  theme,
  onPrimary,
  uiScale,
  highContrast,
  largeTouchTargets,
  selectedLocation,
  onSelectGPS,
  onPickLocation,
  onOpenGlobalSearch,
  detecting,
  error,
}) {
  const isTurkeyDevice = useMemo(() => detectIsTurkey(), []);
  const [mode, setMode] = useState(isTurkeyDevice ? "turkey" : "global");
  const [trQuery, setTrQuery] = useState("");
  const [activeCity, setActiveCity] = useState(null);
  const autoTriggered = useRef(false);

  useEffect(() => {
    if (!autoTriggered.current && !selectedLocation) {
      autoTriggered.current = true;
      onSelectGPS();
    }
  }, [selectedLocation, onSelectGPS]);

  const filteredTurkeyList = useMemo(() => {
    const q = normalizeTr(trQuery.trim());
    if (activeCity) {
      if (!q) return activeCity.districts;
      return activeCity.districts.filter((d) =>
        normalizeTr(d.name).includes(q),
      );
    }
    if (!q) return TURKEY_CITIES;
    return TURKEY_CITIES.filter((c) => normalizeTr(c.city).includes(q));
  }, [trQuery, activeCity]);

  const handleDistrictSelect = useCallback(
    (cityObj, districtObj) => {
      onPickLocation({
        city: cityObj.city,
        district: districtObj.name,
        country: "Türkiye",
        latitude: districtObj.lat,
        longitude: districtObj.lon,
        timezone: "Europe/Istanbul",
        isAutoGPS: false,
      });
    },
    [onPickLocation],
  );

  const renderTurkeyItem = useCallback(
    ({ item }) => {
      const rowPadding = largeTouchTargets ? 15 : 12;
      if (!activeCity) {
        return (
          <TouchableOpacity
            onPress={() => {
              setActiveCity(item);
              setTrQuery("");
            }}
            style={[
              styles.cityRow,
              {
                borderBottomColor: theme.border,
                paddingVertical: rowPadding,
              },
            ]}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.plateBadge,
                { backgroundColor: theme.primaryGlow },
              ]}
            >
              <Text
                style={{
                  color: theme.primary,
                  fontSize: 12 * uiScale,
                  fontWeight: "800",
                }}
              >
                {String(item.plate).padStart(2, "0")}
              </Text>
            </View>
            <Text
              style={[
                styles.cityTitle,
                { color: theme.text, flex: 1, fontSize: 15 * uiScale },
              ]}
            >
              {item.city}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        );
      }

      const isSelected =
        selectedLocation?.city === activeCity.city &&
        selectedLocation?.district === item.name;

      return (
        <TouchableOpacity
          onPress={() => handleDistrictSelect(activeCity, item)}
          style={[
            styles.cityRow,
            {
              borderBottomColor: theme.border,
              paddingVertical: rowPadding,
            },
          ]}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isSelected ? "checkmark-circle" : "location-outline"}
            size={19}
            color={isSelected ? theme.primary : theme.textDim}
          />
          <Text
            style={[
              styles.cityTitle,
              {
                color: isSelected ? theme.primary : theme.text,
                flex: 1,
                fontSize: 15 * uiScale,
              },
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    },
    [
      activeCity,
      selectedLocation,
      theme,
      uiScale,
      largeTouchTargets,
      handleDistrictSelect,
    ],
  );

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.stepHeader}>
        <Text
          style={[
            styles.stepKicker,
            { color: theme.primary, fontSize: 11 * uiScale },
          ]}
        >
          KONUM AYARI
        </Text>
        <Text
          style={[
            styles.stepTitle,
            { color: theme.text, fontSize: 23 * uiScale },
          ]}
        >
          Nerede yaşıyorsunuz?
        </Text>
        <Text
          style={[
            styles.stepDesc,
            {
              color: highContrast ? theme.text : theme.textDim,
              fontSize: 13.5 * uiScale,
            },
          ]}
        >
          Konumunuz otomatik bulunur; isterseniz listeden seçebilirsiniz
        </Text>
      </View>

      {detecting ? (
        <View
          style={[
            styles.statusLocationCard,
            { backgroundColor: theme.surface, borderColor: theme.primary },
          ]}
        >
          <ActivityIndicator size="small" color={theme.primary} />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.text,
                fontWeight: "800",
                fontSize: 14 * uiScale,
              }}
            >
              Konumunuz otomatik algılanıyor…
            </Text>
            <Text style={{ color: theme.textDim, fontSize: 12 * uiScale }}>
              İzin penceresi açılırsa onaylayın
            </Text>
          </View>
        </View>
      ) : selectedLocation ? (
        <View
          style={[
            styles.statusLocationCard,
            { backgroundColor: theme.primaryGlow, borderColor: theme.primary },
          ]}
        >
          <View style={[styles.checkCircle, { backgroundColor: theme.primary }]}>
            <Ionicons name="checkmark" size={16} color={onPrimary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: theme.text,
                fontWeight: "800",
                fontSize: 15 * uiScale,
              }}
              numberOfLines={1}
            >
              {selectedLocation.district}
              {selectedLocation.city &&
              selectedLocation.city !== selectedLocation.district
                ? `, ${selectedLocation.city}`
                : ""}
            </Text>
            <Text style={{ color: theme.textDim, fontSize: 12 * uiScale }}>
              {selectedLocation.country || "Konum doğrulandı"}
              {selectedLocation.isAutoGPS ? " • GPS ile bulundu" : " • Seçildi"}
            </Text>
          </View>
        </View>
      ) : null}

      {error ? (
        <View
          style={[
            styles.errorBanner,
            {
              backgroundColor: "rgba(239,68,68,0.08)",
              borderColor: "rgba(239,68,68,0.35)",
            },
          ]}
        >
          <Ionicons name="alert-circle" size={18} color="#EF4444" />
          <Text
            style={{
              color: theme.text,
              flex: 1,
              fontSize: 13 * uiScale,
              lineHeight: 18 * uiScale,
            }}
          >
            {error}
          </Text>
        </View>
      ) : null}

      <View style={styles.locationToolbar}>
        <View
          style={[
            styles.modeSwitchBox,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              setMode("turkey");
              setActiveCity(null);
              setTrQuery("");
            }}
            style={[
              styles.modeSwitchBtn,
              mode === "turkey" && { backgroundColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.modeSwitchText,
                {
                  color: mode === "turkey" ? onPrimary : theme.textDim,
                  fontSize: 12.5 * uiScale,
                },
              ]}
            >
              Türkiye
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMode("global")}
            style={[
              styles.modeSwitchBtn,
              mode === "global" && { backgroundColor: theme.primary },
            ]}
          >
            <Text
              style={[
                styles.modeSwitchText,
                {
                  color: mode === "global" ? onPrimary : theme.textDim,
                  fontSize: 12.5 * uiScale,
                },
              ]}
            >
              Yurt Dışı
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={onSelectGPS}
          disabled={detecting}
          activeOpacity={0.8}
          style={[
            styles.gpsCompactBtn,
            {
              backgroundColor: selectedLocation?.isAutoGPS
                ? theme.primaryGlow
                : theme.surface,
              borderColor: selectedLocation?.isAutoGPS
                ? theme.primary
                : theme.border,
            },
          ]}
        >
          <Ionicons name="navigate" size={16} color={theme.primary} />
          <Text
            style={{
              color: theme.text,
              fontSize: 12.5 * uiScale,
              fontWeight: "700",
            }}
          >
            GPS Bul
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "turkey" ? (
        <View style={{ flex: 1 }}>
          {activeCity ? (
            <TouchableOpacity
              onPress={() => {
                setActiveCity(null);
                setTrQuery("");
              }}
              style={styles.cityBackBar}
            >
              <Ionicons name="arrow-back" size={16} color={theme.primary} />
              <Text
                style={{
                  color: theme.primary,
                  fontWeight: "800",
                  fontSize: 13 * uiScale,
                }}
              >
                Tüm İller · {activeCity.city} İlçeleri
              </Text>
            </TouchableOpacity>
          ) : null}

          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                height: largeTouchTargets ? 52 : 44,
              },
            ]}
          >
            <Ionicons name="search" size={16} color={theme.textDim} />
            <TextInput
              value={trQuery}
              onChangeText={setTrQuery}
              placeholder={
                activeCity
                  ? `${activeCity.city} içinde ilçe ara…`
                  : "İl ara (örn. Kocaeli, İstanbul)…"
              }
              placeholderTextColor={theme.textMuted}
              style={[
                styles.searchInput,
                { color: theme.text, fontSize: 14 * uiScale },
              ]}
              autoCorrect={false}
            />
            {trQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setTrQuery("")}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={theme.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <FlatList
            data={filteredTurkeyList}
            keyExtractor={(item) =>
              activeCity
                ? `${activeCity.plate}-${item.name}`
                : String(item.plate)
            }
            renderItem={renderTurkeyItem}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={14}
            maxToRenderPerBatch={14}
            windowSize={7}
            removeClippedSubviews
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text
                  style={[
                    styles.emptyText,
                    { color: theme.textMuted, fontSize: 13 * uiScale },
                  ]}
                >
                  “{trQuery.trim()}” için eşleşme bulunamadı.
                </Text>
              </View>
            }
          />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={[
              styles.secondaryBtn,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                height: largeTouchTargets ? 58 : 50,
              },
            ]}
            onPress={onOpenGlobalSearch}
            activeOpacity={0.75}
          >
            <Ionicons name="globe-outline" size={18} color={theme.primary} />
            <Text
              style={[
                styles.secondaryBtnText,
                { color: theme.text, fontSize: 14 * uiScale },
              ]}
            >
              Dünya genelinde şehir veya ülke ara
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

/* ================================================================
   Adım 2 — Yay Animasyonlu Canlı Tema Sahnesi
   ================================================================ */
const ThemeStep = memo(function ThemeStep({
  theme,
  onPrimary,
  uiScale,
  highContrast,
  largeTouchTargets,
  reduceMotion,
  themeMode,
  onSelectTheme,
}) {
  const currentChoice = useMemo(() => getChoiceFromMode(themeMode), [themeMode]);
  const cardBounce = useRef(new Animated.Value(1)).current;

  const handleSelect = useCallback(
    (themeId) => {
      onSelectTheme(themeId);
      if (reduceMotion) return;
      cardBounce.setValue(0.96);
      Animated.spring(cardBounce, {
        toValue: 1,
        friction: 5,
        tension: 120,
        useNativeDriver: true,
      }).start();
    },
    [onSelectTheme, cardBounce, reduceMotion],
  );

  const activePreview = useMemo(() => {
    if (currentChoice === "light") return getThemePreview("light");
    if (currentChoice === "dark") return getThemePreview("obsidian");
    return {
      bg: theme.background,
      surface: theme.surface,
      text: theme.text,
      dim: theme.textDim,
      primary: theme.primary,
      border: theme.border,
    };
  }, [currentChoice, theme]);

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.stepHeader}>
        <Text
          style={[
            styles.stepKicker,
            { color: theme.primary, fontSize: 11 * uiScale },
          ]}
        >
          SON ADIM
        </Text>
        <Text
          style={[
            styles.stepTitle,
            { color: theme.text, fontSize: 23 * uiScale },
          ]}
        >
          Görünümünüzü seçin
        </Text>
        <Text
          style={[
            styles.stepDesc,
            {
              color: highContrast ? theme.text : theme.textDim,
              fontSize: 13.5 * uiScale,
            },
          ]}
        >
          Günün saatine göre değişen veya sabit bir tema belirleyin
        </Text>
      </View>

      {/* Yay Animasyonlu Canlı Önizleme Kartı */}
      <Animated.View
        style={[
          styles.themeStage,
          {
            backgroundColor: activePreview.bg,
            borderColor: activePreview.border,
            transform: [{ scale: cardBounce }],
          },
        ]}
      >
        <View
          style={[
            styles.mockCard,
            {
              backgroundColor: activePreview.surface,
              borderColor: activePreview.border,
            },
          ]}
        >
          <View style={styles.mockCardTop}>
            <View>
              <Text
                style={[
                  styles.mockLabel,
                  { color: activePreview.dim, fontSize: 10 * uiScale },
                ]}
              >
                SONRAKİ VAKİT
              </Text>
              <Text
                style={[
                  styles.mockPrayer,
                  { color: activePreview.text, fontSize: 17 * uiScale },
                ]}
              >
                İkindi • 15:48
              </Text>
            </View>
            <View
              style={[
                styles.mockBadge,
                { backgroundColor: `${activePreview.primary}20` },
              ]}
            >
              <Text
                style={[
                  styles.mockBadgeText,
                  { color: activePreview.primary, fontSize: 12 * uiScale },
                ]}
              >
                01:24:10
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>

      <View style={{ gap: 10, marginTop: 14 }}>
        {APPEARANCE_OPTIONS.map((opt) => {
          const selected = currentChoice === opt.id;
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => handleSelect(opt.themeId)}
              activeOpacity={0.85}
              style={[
                styles.themeOptionRow,
                {
                  backgroundColor: selected ? theme.primaryGlow : theme.surface,
                  borderColor: selected ? theme.primary : theme.border,
                  borderWidth: selected || highContrast ? 2 : 1,
                  paddingVertical: largeTouchTargets ? 16 : 13,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <View
                style={[
                  styles.themeOptionIcon,
                  {
                    backgroundColor: selected
                      ? theme.primary
                      : theme.surfaceElevated,
                  },
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={18}
                  color={selected ? onPrimary : theme.text}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.themeOptionTitle,
                    { color: theme.text, fontSize: 15 * uiScale },
                  ]}
                >
                  {opt.label}
                </Text>
                <Text
                  style={[
                    styles.themeOptionDesc,
                    {
                      color: highContrast ? theme.text : theme.textDim,
                      fontSize: 12 * uiScale,
                    },
                  ]}
                >
                  {opt.desc}
                </Text>
              </View>
              <View
                style={[
                  styles.radioCircle,
                  {
                    borderColor: selected ? theme.primary : theme.border,
                    backgroundColor: selected ? theme.primary : "transparent",
                  },
                ]}
              >
                {selected ? (
                  <Ionicons name="checkmark" size={13} color={onPrimary} />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

/* ================================================================
   Açılır Erişilebilirlik & Yardım Bottom Sheet Modalı
   ================================================================ */
const AccessibilitySheetModal = memo(function AccessibilitySheetModal({
  visible,
  onClose,
  theme,
  onPrimary,
  insets,
  uiScale,
  readingFontScale,
  onFontScaleChange,
  highContrast,
  onHighContrastChange,
  dyslexiaFont,
  onDyslexiaFontChange,
  largeTouchTargets,
  onLargeTouchTargetsChange,
  reduceMotion,
  onReduceMotionChange,
  globalHaptic,
  onGlobalHapticChange,
  isSimpleMode,
  onSimpleModeChange,
  notificationsEnabled,
  onToggleNotifications,
}) {
  const isEasyPresetActive =
    isSimpleMode && largeTouchTargets && readingFontScale >= 1.15;

  const toggleEasyPreset = useCallback(() => {
    const next = !isEasyPresetActive;
    onSimpleModeChange(next);
    onLargeTouchTargetsChange(next);
    onFontScaleChange(next ? 1.3 : 1.0);
    onHighContrastChange(next);
  }, [
    isEasyPresetActive,
    onSimpleModeChange,
    onLargeTouchTargetsChange,
    onFontScaleChange,
    onHighContrastChange,
  ]);

  const items = [
    {
      icon: "accessibility-outline",
      label: "Basit mod",
      desc: "Az düğmeli, büyük ve sade arayüz",
      value: isSimpleMode,
      onToggle: onSimpleModeChange,
    },
    {
      icon: "hand-right-outline",
      label: "Büyük dokunma alanları",
      desc: "Butonlara dokunmayı kolaylaştırır",
      value: largeTouchTargets,
      onToggle: onLargeTouchTargetsChange,
    },
    {
      icon: "contrast-outline",
      label: "Yüksek kontrast",
      desc: "Metin ve arka plan belirginliğini artırır",
      value: highContrast,
      onToggle: onHighContrastChange,
    },
    {
      icon: notificationsEnabled ? "notifications" : "notifications-off",
      label: "Vakit hatırlatmaları",
      desc: "Ezan vaktinden önce sesli bildirim",
      value: notificationsEnabled,
      onToggle: onToggleNotifications,
    },
    {
      icon: "text-outline",
      label: "Okuma dostu yazı tipi",
      desc: "Disleksi için OpenDyslexic fontu",
      value: dyslexiaFont,
      onToggle: onDyslexiaFontChange,
    },
    {
      icon: "flash-off-outline",
      label: "Animasyonları azalt",
      desc: "Ekran geçiş efektlerini sınırlar",
      value: reduceMotion,
      onToggle: onReduceMotionChange,
    },
    {
      icon: "hand-left-outline",
      label: "Titreşimli geri bildirim",
      desc: "Dokunuşlarda hafif titreşim",
      value: globalHaptic,
      onToggle: onGlobalHapticChange,
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.modalContent,
            {
              height: "85%",
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <View
            style={[styles.modalHandle, { backgroundColor: theme.border }]}
          />

          <View style={styles.modalHeader}>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.text, fontSize: 18 * uiScale },
                ]}
              >
                Erişilebilirlik & Yardım
              </Text>
              <Text
                style={{
                  color: theme.textDim,
                  fontSize: 12 * uiScale,
                  marginTop: 2,
                }}
              >
                Seçimleriniz ekrana anında uygulanır
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeCircle,
                { backgroundColor: theme.surfaceElevated },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <Ionicons name="close" size={18} color={theme.textDim} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <Pressable
              onPress={toggleEasyPreset}
              style={[
                styles.easyPresetCard,
                {
                  backgroundColor: isEasyPresetActive
                    ? theme.primaryGlow
                    : theme.background,
                  borderColor: isEasyPresetActive
                    ? theme.primary
                    : theme.border,
                },
              ]}
            >
              <View
                style={[
                  styles.easyPresetIcon,
                  { backgroundColor: theme.primary },
                ]}
              >
                <Ionicons name="sparkles" size={18} color={onPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: theme.text,
                    fontSize: 14.5 * uiScale,
                    fontWeight: "900",
                  }}
                >
                  Tek Dokunuşla Kolay Kullanım
                </Text>
                <Text
                  style={{
                    color: theme.textDim,
                    fontSize: 12 * uiScale,
                    marginTop: 2,
                    lineHeight: 16 * uiScale,
                  }}
                >
                  Çok büyük yazı, basit mod ve yüksek kontrastı aynı anda açar
                </Text>
              </View>
              <Switch
                value={isEasyPresetActive}
                onValueChange={toggleEasyPreset}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor="#FFF"
              />
            </Pressable>

            <Text
              style={[
                styles.sectionCaption,
                { color: theme.textDim, fontSize: 11 * uiScale },
              ]}
            >
              YAZI BOYUTU
            </Text>
            <View
              style={[
                styles.segmentedBar,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              {FONT_SCALE_OPTIONS.map((opt) => {
                const selected = Math.abs(readingFontScale - opt.value) < 0.01;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onFontScaleChange(opt.value)}
                    style={[
                      styles.segmentedItem,
                      selected && { backgroundColor: theme.primary },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: 13 * uiScale,
                        fontWeight: "800",
                        color: selected ? onPrimary : theme.text,
                      }}
                    >
                      {opt.label}
                    </Text>
                    <Text
                      style={{
                        fontSize: 10.5 * uiScale,
                        color: selected ? `${onPrimary}CC` : theme.textDim,
                      }}
                    >
                      {opt.desc}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text
              style={[
                styles.sectionCaption,
                { color: theme.textDim, fontSize: 11 * uiScale },
              ]}
            >
              DETAYLI AYARLAR
            </Text>
            <View
              style={[
                styles.groupedCard,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.border,
                },
              ]}
            >
              {items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  onPress={() => item.onToggle(!item.value)}
                  style={[
                    styles.groupedRow,
                    { minHeight: largeTouchTargets ? 66 : 56 },
                    idx < items.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: theme.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.groupedIcon,
                      {
                        backgroundColor: item.value
                          ? theme.primaryGlow
                          : theme.surface,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={17}
                      color={item.value ? theme.primary : theme.textDim}
                    />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text
                      style={{
                        color: theme.text,
                        fontSize: 14 * uiScale,
                        fontWeight: "700",
                      }}
                    >
                      {item.label}
                    </Text>
                    <Text
                      style={{
                        color: theme.textDim,
                        fontSize: 11.5 * uiScale,
                        marginTop: 1,
                      }}
                    >
                      {item.desc}
                    </Text>
                  </View>
                  <View pointerEvents="none">
                    <Switch
                      value={item.value}
                      onValueChange={() => {}}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor="#FFF"
                    />
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.85}
            style={[
              styles.ctaBtn,
              {
                backgroundColor: theme.primary,
                height: largeTouchTargets ? 62 : 54,
              },
            ]}
          >
            <Text
              style={[
                styles.ctaBtnText,
                { color: onPrimary, fontSize: 15.5 * uiScale },
              ]}
            >
              Tamam
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

/* ================================================================
   Ana Bileşen
   ================================================================ */
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  const getTheme = useAppStore((s) => s.getTheme);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const setWidget = useAppStore((s) => s.setWidget);

  const readingFontScale = useAppStore((s) => s.readingFontScale) ?? 1.0;
  const setReadingFontScale = useAppStore((s) => s.setReadingFontScale);
  const highContrast = useAppStore((s) => s.highContrast) ?? false;
  const setHighContrast = useAppStore((s) => s.setHighContrast);
  const dyslexiaFont = useAppStore((s) => s.dyslexiaFont) ?? false;
  const setDyslexiaFont = useAppStore((s) => s.setDyslexiaFont);
  const largeTouchTargets = useAppStore((s) => s.largeTouchTargets) ?? false;
  const setLargeTouchTargets = useAppStore((s) => s.setLargeTouchTargets);
  const reduceMotion = useAppStore((s) => s.reduceMotion) ?? false;
  const setReduceMotion = useAppStore((s) => s.setReduceMotion);
  const globalHaptic = useAppStore((s) => s.globalHaptic) ?? true;
  const setGlobalHaptic = useAppStore((s) => s.setGlobalHaptic);
  const isSimpleMode = useAppStore((s) => s.isSimpleMode) ?? false;
  const setSimpleMode = useAppStore((s) => s.setSimpleMode);

  const theme = getTheme();
  const onPrimary = theme.onPrimary || "#FFFFFF";

  const uiScale = useMemo(() => {
    if (readingFontScale <= 1.0) return 1.0;
    if (readingFontScale <= 1.15) return 1.1;
    return 1.2;
  }, [readingFontScale]);

  const [step, setStep] = useState(0);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const [modalVisible, setModalVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [search, setSearch] = useState({ status: "idle", results: [] });

  const stepTransition = useRef(new Animated.Value(1)).current;
  const mounted = useRef(true);
  const completing = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const animateStepChange = useCallback(
    (nextStep) => {
      if (reduceMotion) {
        setStep(nextStep);
        return;
      }
      Animated.timing(stepTransition, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }).start(() => {
        setStep(nextStep);
        Animated.spring(stepTransition, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }).start();
      });
    },
    [reduceMotion, stepTransition],
  );

  const hasActiveA11y = useMemo(
    () =>
      isSimpleMode ||
      highContrast ||
      dyslexiaFont ||
      largeTouchTargets ||
      readingFontScale > 1.0,
    [
      isSimpleMode,
      highContrast,
      dyslexiaFont,
      largeTouchTargets,
      readingFontScale,
    ],
  );

  /* ---------- Konum (GPS Varsayılan) ---------- */
  const handleGPS = useCallback(async () => {
    if (detecting || completing.current) return;
    setDetecting(true);
    setLocationError(null);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        setLocationError(
          "Konum servisi kapalı. Aşağıdaki listeden şehrinizi seçebilirsiniz.",
        );
        return;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== "granted") {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== "granted") {
        setLocationError(
          "Konum izni verilmedi. Aşağıdaki listeden şehrinizi seçebilirsiniz.",
        );
        return;
      }

      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 15 * 60 * 1000 })) ||
        (await withTimeout(
          Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          }),
          15000,
        ));

      const { latitude, longitude } = position.coords;

      let place = null;
      try {
        const [geo] = await withTimeout(
          Location.reverseGeocodeAsync({ latitude, longitude }),
          8000,
        );
        place = geo || null;
      } catch {
        place = null;
      }

      const city = place?.region || place?.city || place?.subregion || "Konumum";
      const districtCandidate =
        place?.subregion || place?.city || place?.district;
      const district =
        districtCandidate && districtCandidate !== city
          ? districtCandidate
          : city;

      if (mounted.current) {
        setSelectedLocation({
          city,
          district,
          country: place?.country || "",
          latitude,
          longitude,
          isAutoGPS: true,
        });
      }
    } catch {
      if (mounted.current) {
        setLocationError(
          "Konum otomatik alınamadı. Listeden şehrinizi seçebilirsiniz.",
        );
      }
    } finally {
      if (mounted.current) setDetecting(false);
    }
  }, [detecting]);

  /* ---------- Global Şehir Arama ---------- */
  useEffect(() => {
    if (!modalVisible) return;
    const q = query.trim();
    if (q.length < 2) {
      setSearch({ status: "idle", results: [] });
      return;
    }

    setSearch((prev) => ({ ...prev, status: "loading" }));

    const controller = new AbortController();
    let timedOut = false;
    let timeoutId;

    const debounceId = setTimeout(async () => {
      timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, SEARCH_TIMEOUT_MS);

      try {
        const res = await fetch(
          `${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=10&language=tr&format=json`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const seen = new Set();
        const results = (Array.isArray(data.results) ? data.results : [])
          .filter(
            (item) =>
              Number.isFinite(item.latitude) && Number.isFinite(item.longitude),
          )
          .map(mapGeocodingResult)
          .filter((item) => (seen.has(item.id) ? false : seen.add(item.id)));

        setSearch({ status: "done", results });
      } catch (e) {
        if (e?.name === "AbortError" && !timedOut) return;
        setSearch({ status: "error", results: [] });
      } finally {
        clearTimeout(timeoutId);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(debounceId);
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query, retryKey, modalVisible]);

  const handleSelectPlace = useCallback((item) => {
    setLocationError(null);
    setSelectedLocation({
      city: item.city,
      district: item.district,
      country: item.country,
      timezone: item.timezone,
      latitude: item.latitude,
      longitude: item.longitude,
      isAutoGPS: false,
    });
    setModalVisible(false);
    setQuery("");
  }, []);

  /* ---------- Tamamla & Navigasyon ---------- */
  const handleComplete = useCallback(async () => {
    if (completing.current) return;
    completing.current = true;
    try {
      const location = selectedLocation || {
        city: "Kocaeli",
        district: "Darıca",
        country: "Türkiye",
        latitude: 40.7739,
        longitude: 29.4003,
        timezone: "Europe/Istanbul",
        isAutoGPS: false,
      };

      setWidget("notificationsEnabled", notificationsEnabled);
      await completeOnboarding(location, isSimpleMode);
    } catch {
      if (mounted.current) {
        setLocationError("Ayarlar kaydedilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      completing.current = false;
    }
  }, [
    selectedLocation,
    notificationsEnabled,
    isSimpleMode,
    completeOnboarding,
    setWidget,
  ]);

  const canGoNext = useMemo(() => {
    if (step === 1) return !!selectedLocation && !detecting;
    return true;
  }, [step, selectedLocation, detecting]);

  const goNext = useCallback(() => {
    if (step === 1 && !selectedLocation) {
      setLocationError("Devam etmek için konum izni verin veya bir şehir seçin");
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      animateStepChange(step + 1);
    } else {
      handleComplete();
    }
  }, [step, selectedLocation, animateStepChange, handleComplete]);

  const goBack = useCallback(() => {
    if (step > 0) animateStepChange(step - 1);
  }, [step, animateStepChange]);

  const handleSkip = useCallback(() => {
    if (step === 1) {
      setSelectedLocation({
        city: "Kocaeli",
        district: "Darıca",
        country: "Türkiye",
        latitude: 40.7739,
        longitude: 29.4003,
        timezone: "Europe/Istanbul",
        isAutoGPS: false,
      });
      animateStepChange(2);
    }
  }, [step, animateStepChange]);

  const statusBarStyle = useMemo(() => {
    if (
      theme.mode === "light" ||
      theme.mode === "modernLight" ||
      theme.mode === "sepia" ||
      theme.mode === "sand" ||
      theme.mode === "ivory"
    ) {
      return "dark-content";
    }
    return "light-content";
  }, [theme.mode]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar barStyle={statusBarStyle} />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        <View style={{ width: 68 }}>
          {step > 0 ? (
            <TouchableOpacity
              onPress={goBack}
              style={[
                styles.backBtn,
                { borderColor: theme.border, backgroundColor: theme.surface },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </TouchableOpacity>
          ) : null}
        </View>

        <StepBar step={step} total={TOTAL_STEPS} theme={theme} />

        <View style={{ width: 68, alignItems: "flex-end" }}>
          {step === 1 ? (
            <TouchableOpacity
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel="Varsayılan"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text
                style={[
                  styles.skipText,
                  { color: theme.textDim, fontSize: 13.5 * uiScale },
                ]}
              >
                Varsayılan
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* ADIM İÇERİĞİ (Yay geçişli) */}
      <Animated.View
        style={[
          styles.stepContent,
          {
            opacity: stepTransition,
            transform: [
              {
                translateY: stepTransition.interpolate({
                  inputRange: [0, 1],
                  outputRange: [8, 0],
                }),
              },
            ],
          },
        ]}
      >
        {step === 0 ? (
          <WelcomeStep
            theme={theme}
            reduceMotion={reduceMotion}
            hasActiveA11y={hasActiveA11y}
            uiScale={uiScale}
            highContrast={highContrast}
            largeTouchTargets={largeTouchTargets}
            onOpenHelp={() => setHelpModalVisible(true)}
          />
        ) : step === 1 ? (
          <LocationStep
            theme={theme}
            onPrimary={onPrimary}
            uiScale={uiScale}
            highContrast={highContrast}
            largeTouchTargets={largeTouchTargets}
            selectedLocation={selectedLocation}
            onSelectGPS={handleGPS}
            onPickLocation={(loc) => {
              setLocationError(null);
              setSelectedLocation(loc);
            }}
            onOpenGlobalSearch={() => {
              setLocationError(null);
              setModalVisible(true);
            }}
            detecting={detecting}
            error={locationError}
          />
        ) : (
          <ThemeStep
            theme={theme}
            onPrimary={onPrimary}
            uiScale={uiScale}
            highContrast={highContrast}
            largeTouchTargets={largeTouchTargets}
            reduceMotion={reduceMotion}
            themeMode={themeMode}
            onSelectTheme={setThemeMode}
          />
        )}
      </Animated.View>

      {/* BOTTOM BAR */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: Math.max(16, insets.bottom) },
        ]}
      >
        <TouchableOpacity
          onPress={goNext}
          activeOpacity={0.85}
          disabled={!canGoNext}
          style={[
            styles.ctaBtn,
            {
              backgroundColor: theme.primary,
              opacity: canGoNext ? 1 : 0.45,
              height: largeTouchTargets ? 62 : 54,
            },
          ]}
          accessibilityRole="button"
        >
          <Text
            style={[
              styles.ctaBtnText,
              { color: onPrimary, fontSize: 15.5 * uiScale },
            ]}
          >
            {step === 0
              ? "Başla"
              : step === TOTAL_STEPS - 1
                ? "Kurulumu Tamamla"
                : "Devam Et"}
          </Text>
          <Ionicons
            name={step === TOTAL_STEPS - 1 ? "checkmark-circle" : "arrow-forward"}
            size={20}
            color={onPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* ERİŞİLEBİLİRLİK & YARDIM AÇILIR PENCERESİ */}
      <AccessibilitySheetModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
        theme={theme}
        onPrimary={onPrimary}
        insets={insets}
        uiScale={uiScale}
        readingFontScale={readingFontScale}
        onFontScaleChange={setReadingFontScale}
        highContrast={highContrast}
        onHighContrastChange={setHighContrast}
        dyslexiaFont={dyslexiaFont}
        onDyslexiaFontChange={setDyslexiaFont}
        largeTouchTargets={largeTouchTargets}
        onLargeTouchTargetsChange={setLargeTouchTargets}
        reduceMotion={reduceMotion}
        onReduceMotionChange={setReduceMotion}
        globalHaptic={globalHaptic}
        onGlobalHapticChange={setGlobalHaptic}
        isSimpleMode={isSimpleMode}
        onSimpleModeChange={setSimpleMode}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={setNotificationsEnabled}
      />

      {/* GLOBAL ŞEHİR ARAMA MODALI */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setModalVisible(false)}
          />

          <View
            style={[
              styles.modalContent,
              {
                height: "80%",
                backgroundColor: theme.surface,
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: theme.border }]}
            />

            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: theme.text, fontSize: 18 * uiScale },
                ]}
              >
                Şehir ara
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={[
                  styles.closeCircle,
                  { backgroundColor: theme.surfaceElevated },
                ]}
              >
                <Ionicons name="close" size={18} color={theme.textDim} />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: theme.surfaceElevated,
                  borderColor: theme.border,
                  height: largeTouchTargets ? 54 : 48,
                  marginBottom: 12,
                },
              ]}
            >
              <Ionicons name="search" size={18} color={theme.textDim} />
              <TextInput
                placeholder="Örn. Berlin, Londra, Mekke"
                placeholderTextColor={theme.textMuted}
                style={[
                  styles.searchInput,
                  { color: theme.text, fontSize: 14 * uiScale },
                ]}
                value={query}
                onChangeText={setQuery}
                autoFocus
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
              />
              {search.status === "loading" && query.trim().length >= 2 ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : null}
            </View>

            <FlatList
              data={query.trim().length < 2 ? POPULAR_PLACES : search.results}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isPopular = query.trim().length < 2;
                return (
                  <TouchableOpacity
                    style={[
                      styles.cityRow,
                      {
                        borderBottomColor: theme.border,
                        paddingVertical: largeTouchTargets ? 15 : 12,
                      },
                    ]}
                    onPress={() => handleSelectPlace(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.cityIconBox,
                        { backgroundColor: theme.primaryGlow },
                      ]}
                    >
                      <Ionicons
                        name={isPopular ? "star" : "location-outline"}
                        size={17}
                        color={theme.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.cityTitle,
                          { color: theme.text, fontSize: 15 * uiScale },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {item.subtitle ? (
                        <Text
                          style={[
                            styles.citySubtitle,
                            { color: theme.textDim, fontSize: 12 * uiScale },
                          ]}
                          numberOfLines={1}
                        >
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={theme.textMuted}
                    />
                  </TouchableOpacity>
                );
              }}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                query.trim().length < 2 ? (
                  <Text
                    style={[
                      styles.sectionCaption,
                      { color: theme.textDim, fontSize: 11 * uiScale },
                    ]}
                  >
                    POPÜLER KONUMLAR
                  </Text>
                ) : null
              }
              ListEmptyComponent={
                <View style={styles.emptyBox}>
                  {search.status === "loading" && (
                    <>
                      <ActivityIndicator color={theme.primary} />
                      <Text
                        style={[
                          styles.emptyText,
                          { color: theme.textMuted, fontSize: 13 * uiScale },
                        ]}
                      >
                        Aranıyor…
                      </Text>
                    </>
                  )}
                  {search.status === "error" && (
                    <>
                      <Ionicons
                        name="cloud-offline-outline"
                        size={30}
                        color={theme.textDim}
                      />
                      <Text
                        style={[
                          styles.emptyText,
                          { color: theme.textDim, fontSize: 13 * uiScale },
                        ]}
                      >
                        Arama yapılamadı. İnternet bağlantınızı kontrol edin.
                      </Text>
                      <TouchableOpacity
                        onPress={() => setRetryKey((k) => k + 1)}
                        style={[styles.retryBtn, { borderColor: theme.border }]}
                      >
                        <Text
                          style={{
                            color: theme.primary,
                            fontWeight: "700",
                            fontSize: 13 * uiScale,
                          }}
                        >
                          Tekrar dene
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {search.status === "done" && query.trim().length >= 2 && (
                    <Text
                      style={[
                        styles.emptyText,
                        { color: theme.textMuted, fontSize: 13 * uiScale },
                      ]}
                    >
                      "{query.trim()}" için sonuç bulunamadı.
                    </Text>
                  )}
                </View>
              }
              showsVerticalScrollIndicator={false}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Top bar */
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    minHeight: 50,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  skipText: { fontSize: 13.5, fontWeight: "700" },

  stepBarTrack: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    maxWidth: 120,
  },
  stepBarSeg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },

  stepContent: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 8,
  },

  /* Adım 0: Koreografili Karşılama */
  welcomeScroll: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  welcomeInner: {
    flex: 1,
    justifyContent: "space-between",
    gap: 16,
  },
  bismillahHeader: {
    alignItems: "center",
  },
  bismillahGlass: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  bismillahText: {
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 0.3,
  },

  /* Astrolab Yörüngeli Logo Sahnesi */
  heroBlock: {
    alignItems: "center",
  },
  celestialStage: {
    width: 176,
    height: 176,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  auraGlow: {
    position: "absolute",
    width: 148,
    height: 148,
    borderRadius: 74,
  },
  orbitOuter: {
    position: "absolute",
    width: 168,
    height: 168,
    borderRadius: 84,
    borderWidth: 1,
    alignItems: "center",
  },
  orbitStarDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: -4,
  },
  orbitInner: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderStyle: "dashed",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  orbitStarDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginBottom: -3,
  },
  logoCore: {
    width: 94,
    height: 94,
    borderRadius: 28,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 8,
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  brandTitle: {
    fontWeight: "900",
    letterSpacing: 8,
  },
  brandTagline: {
    textAlign: "center",
    marginTop: 8,
    fontWeight: "500",
    paddingHorizontal: 10,
  },

  /* 3'lü Kapsül Özellik Şeridi */
  pillarsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  pillarChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  pillarLabel: {
    fontWeight: "700",
    textAlign: "center",
  },

  /* Yardım Açılır Buton */
  helpPillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  helpBadgeIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  helpPillText: {
    flex: 1,
    fontWeight: "700",
  },

  /* Common step header */
  stepHeader: {
    marginBottom: 14,
    gap: 4,
  },
  stepKicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  stepTitle: {
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  stepDesc: {
    fontSize: 13.5,
    lineHeight: 19,
  },

  /* Location Step */
  statusLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 15,
    borderWidth: 1.5,
    marginBottom: 12,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  locationToolbar: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 10,
  },
  modeSwitchBox: {
    flex: 1,
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
  },
  modeSwitchBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  modeSwitchText: {
    fontSize: 12.5,
    fontWeight: "800",
  },
  gpsCompactBtn: {
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  cityBackBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
    paddingVertical: 4,
  },
  plateBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBanner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  secondaryBtn: {
    flexDirection: "row",
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: { fontSize: 14, fontWeight: "700" },

  /* Görünüm Adımı */
  themeStage: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
  },
  mockCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  mockCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mockLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  mockPrayer: {
    fontSize: 17,
    fontWeight: "900",
    marginTop: 2,
  },
  mockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  mockBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  themeOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 16,
  },
  themeOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  themeOptionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  themeOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Bottom Sheet / Modal */
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.65)",
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 20,
    paddingTop: 10,
  },
  modalHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  closeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  easyPresetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  easyPresetIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionCaption: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginTop: 18,
    marginBottom: 8,
  },
  segmentedBar: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 13,
    borderWidth: 1,
    gap: 4,
  },
  segmentedItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  groupedCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  groupedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    minHeight: 56,
  },
  groupedIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Search & List */
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 13,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, height: "100%" },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  cityIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cityTitle: { fontSize: 15, fontWeight: "700" },
  citySubtitle: { fontSize: 12, marginTop: 2 },
  emptyBox: { padding: 28, alignItems: "center", gap: 10 },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },

  /* Bottom bar */
  bottomBar: {
    paddingHorizontal: 22,
    paddingTop: 10,
  },
  ctaBtn: {
    flexDirection: "row",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ctaBtnText: {
    fontSize: 15.5,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});