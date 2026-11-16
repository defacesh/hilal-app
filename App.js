// App.js — Optimize edilmiş ve New Architecture uyumlu
if (__DEV__) {
  const defaultHandler = global.ErrorUtils?.getGlobalHandler?.();
  global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
    console.log('=== GLOBAL HATA ===');
    console.log('Mesaj:', error?.message);
    console.log('Stack:', error?.stack);
    console.log('Fatal:', isFatal);
    if (defaultHandler) defaultHandler(error, isFatal);
  });
}

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';

import {
  AppState,
  BackHandler,
  Platform,
  Pressable,
  StatusBar,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';

import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

import { useAppStore, useTheme } from './src/store/useAppStore';
import { getNotifications } from './src/services/prayerNotifications';

// İlk açılış hızı için kritik ekranlar
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';

const MemoHome = React.memo(HomeScreen);

/* ================================================================
   Splash kontrolü
   ================================================================ */
SplashScreen.preventAutoHideAsync().catch(() => {});

/* ================================================================
   Font Haritası
   ================================================================ */
const ESSENTIAL_FONTS = {
  'Lexend-Regular': require('./assets/fonts/Lexend-Regular.ttf'),
  'Lexend-Bold': require('./assets/fonts/Lexend-Bold.ttf'),
};

const EXTRA_FONTS = {
  'Lexend-Thin': require('./assets/fonts/Lexend-Thin.ttf'),
  'Lexend-ExtraLight': require('./assets/fonts/Lexend-ExtraLight.ttf'),
  'Lexend-Light': require('./assets/fonts/Lexend-Light.ttf'),
  'Lexend-Medium': require('./assets/fonts/Lexend-Medium.ttf'),
  'Lexend-SemiBold': require('./assets/fonts/Lexend-SemiBold.ttf'),
  'Lexend-ExtraBold': require('./assets/fonts/Lexend-ExtraBold.ttf'),
  'Lexend-Black': require('./assets/fonts/Lexend-Black.ttf'),
  'OpenDyslexic-Regular': require('./assets/fonts/OpenDyslexic-Regular.otf'),
  'OpenDyslexic-Bold': require('./assets/fonts/OpenDyslexic-Bold.otf'),
  'OpenDyslexic-Italic': require('./assets/fonts/OpenDyslexic-Italic.otf'),
  'OpenDyslexic-BoldItalic': require('./assets/fonts/OpenDyslexic-BoldItalic.otf'),
};

/* ================================================================
   Ekran Kimlikleri & Tembel (Lazy) Önbellek
   ================================================================ */
const SCREENS = Object.freeze({
  home: 'home',
  qibla: 'qibla',
  settings: 'settings',
  tools: 'tools',
  zikir: 'zikir',
  dualar: 'dualar',
  takvim: 'takvim',
  esma: 'esma',
  ramazan: 'ramazan',
  zekat: 'zekat',
  namazRehberi: 'namazRehberi',
  tesbihat: 'tesbihat',
  devNotifications: 'devNotifications',
  quranReader: 'quranReader',
  terimler: 'terimler',
  ruyaTabirleri: 'ruya-tabirleri',
  vedaHutbesi: 'veda-hutbesi',
  siyer: 'siyer',
});

const ROOT_STACK = Object.freeze([SCREENS.home]);

const SCREEN_LOADERS = {
  [SCREENS.qibla]: () => require('./src/screens/QiblaScreen').default,
  [SCREENS.settings]: () => require('./src/screens/SettingsScreen').default,
  [SCREENS.devNotifications]: () => require('./src/screens/NotificationTestScreen').default,
  [SCREENS.tools]: () => require('./src/screens/ToolsScreen').default,
  [SCREENS.zikir]: () => require('./src/screens/ZikirmatikScreen').default,
  [SCREENS.dualar]: () => require('./src/screens/DualarScreen').default,
  [SCREENS.quranReader]: () => require('./src/screens/QuranReaderScreen').default,
  [SCREENS.takvim]: () => require('./src/screens/CalendarScreen').default,
  [SCREENS.esma]: () => require('./src/screens/EsmaulHusnaScreen').default,
  [SCREENS.ramazan]: () => require('./src/screens/RamazanScreen').default,
  [SCREENS.terimler]: () => require('./src/screens/ReligiousTermsScreen').default,
  [SCREENS.namazRehberi]: () => require('./src/screens/NamazRehberiScreen').default,
  [SCREENS.tesbihat]: () => require('./src/screens/TesbihatScreen').default,
  [SCREENS.zekat]: () => require('./src/screens/ZekatScreen').default,
  [SCREENS.ruyaTabirleri]: () => require('./src/screens/RuyaTabirleriScreen').default,
  [SCREENS.vedaHutbesi]: () => require('./src/screens/VedaHutbesiScreen').default,
  [SCREENS.siyer]: () => require('./src/screens/SiyerScreen').default,
};

const SCREEN_CACHE = new Map();

function getScreenComponent(screenId) {
  if (SCREEN_CACHE.has(screenId)) {
    return SCREEN_CACHE.get(screenId);
  }
  const loader = SCREEN_LOADERS[screenId];
  const Component = loader
    ? loader()
    : require('./src/screens/ReligiousKnowledgeScreen').default;
  SCREEN_CACHE.set(screenId, Component);
  return Component;
}

const scheduleIdleWork = (cb, timeout = 1200) => {
  if (typeof globalThis.requestIdleCallback === 'function') {
    const id = globalThis.requestIdleCallback(cb, { timeout });
    return () => globalThis.cancelIdleCallback?.(id);
  }
  const id = setTimeout(cb, 300);
  return () => clearTimeout(id);
};

const isLightColorScheme = (theme) => Boolean(
  theme?.isLight ||
  theme?.mode === 'light' ||
  theme?.mode === 'modernLight' ||
  theme?.mode === 'sepia' ||
  theme?.mode === 'sand'
);

/* ================================================================
   ErrorBoundary (Kurtarılabilir)
   ================================================================ */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[App ErrorBoundary]', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    this.props.onResetToHome?.();
  };

  render() {
    if (this.state.hasError) {
      const theme = this.props.theme;
      return (
        <SafeAreaView
          style={[
            styles.errorContainer,
            { backgroundColor: theme?.background ?? '#0F1115' },
          ]}
        >
          <View
            style={[
              styles.errorIconBox,
              {
                backgroundColor: theme?.surfaceElevated ?? 'rgba(255,255,255,0.06)',
                borderColor: theme?.border ?? 'rgba(255,255,255,0.12)',
              },
            ]}
          >
            <Ionicons
              name="alert-circle-outline"
              size={44}
              color={theme?.primary ?? '#EF4444'}
            />
          </View>
          <Text style={[styles.errorTitle, { color: theme?.text ?? '#FFFFFF' }]}>
            Bir sorun oluştu
          </Text>
          <Text
            style={[styles.errorMessage, { color: theme?.textDim ?? '#999' }]}
            numberOfLines={5}
          >
            {this.state.error?.message ?? 'Beklenmeyen bir hata oluştu.'}
          </Text>

          <View style={styles.errorActions}>
            <Pressable
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Tekrar dene"
              style={({ pressed }) => [
                styles.errorPrimaryBtn,
                {
                  backgroundColor: theme?.primary ?? '#10B981',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons
                name="refresh"
                size={16}
                color={theme?.onPrimary ?? '#FFFFFF'}
              />
              <Text
                style={[
                  styles.errorPrimaryBtnText,
                  { color: theme?.onPrimary ?? '#FFFFFF' },
                ]}
              >
                Tekrar Dene
              </Text>
            </Pressable>

            {this.props.onResetToHome ? (
              <Pressable
                onPress={this.handleGoHome}
                accessibilityRole="button"
                accessibilityLabel="Ana sayfaya dön"
                style={({ pressed }) => [
                  styles.errorSecondaryBtn,
                  {
                    backgroundColor: theme?.surface ?? 'rgba(255,255,255,0.06)',
                    borderColor: theme?.border ?? 'rgba(255,255,255,0.15)',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.errorSecondaryBtnText,
                    { color: theme?.text ?? '#FFFFFF' },
                  ]}
                >
                  Ana Sayfaya Dön
                </Text>
              </Pressable>
            ) : null}
          </View>
        </SafeAreaView>
      );
    }
    return this.props.children;
  }
}

/* ================================================================
   HydrationScreen
   ================================================================ */
function HydrationScreen({ theme }) {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(fade, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [fade]);

  const isLight = isLightColorScheme(theme);

  return (
    <SafeAreaView
      style={[
        styles.hydrationContainer,
        { backgroundColor: theme.background },
      ]}
    >
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <Animated.View style={{ alignItems: 'center', opacity: fade }}>
        <View
          style={[
            styles.hydrationBadge,
            {
              backgroundColor: theme.primaryGlow || theme.surfaceElevated,
              borderColor: theme.border,
            },
          ]}
        >
          <MaterialCommunityIcons
            name="star-crescent"
            size={44}
            color={theme.primary}
          />
        </View>
        <Text style={[styles.hydrationBrand, { color: theme.text }]}>
          HİLAL
        </Text>
        <ActivityIndicator
          size="small"
          color={theme.primary}
          style={styles.loadingIndicator}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

/* ================================================================
   App Component
   ================================================================ */
export default function App() {
  const isFirstLaunch = useAppStore((s) => s.isFirstLaunch);
  const hasShownIntro = useAppStore((s) => s.hasShownIntro);
  const themeMode = useAppStore((s) => s.themeMode);
  const theme = useTheme();

  /* ---------------- Kritik Font & Store Hydration ---------------- */
  const [essentialFontsReady, setEssentialFontsReady] = useState(false);
  const [hydrated, setHydrated] = useState(() =>
    useAppStore.persist.hasHydrated()
  );

  useEffect(() => {
    let alive = true;
    Font.loadAsync(ESSENTIAL_FONTS)
      .catch(() => {})
      .finally(() => {
        if (alive) setEssentialFontsReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const persist = useAppStore.persist;
    if (persist.hasHydrated()) {
      setHydrated(true);
      return undefined;
    }

    const unsubscribe = persist.onFinishHydration(() => {
      setHydrated(true);
    });

    const timeout = setTimeout(() => {
      setHydrated(true);
    }, 1200);

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  const ready = hydrated && essentialFontsReady;

  /* ---------------- Bildirim altyapısını hazırla ----------------
     İzin istemez; yalnızca native modülü, foreground handler'ı ve
     mevcut planlanmış bildirim önbelleğini hazırlar. */
  useEffect(() => {
    if (!ready || isFirstLaunch) return undefined;

    let active = true;

    getNotifications().catch((error) => {
      if (__DEV__ && active) {
        console.warn(
          '[Hilal] Bildirim altyapısı başlatılamadı:',
          error?.message
        );
      }
    });

    return () => {
      active = false;
    };
  }, [ready, isFirstLaunch]);

  /* ---------------- Splash Gizle ---------------- */
  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  /* ---------------- Ek Fontlar & Arka Plan Ekran Isıtma ---------------- */
  useEffect(() => {
    if (!ready) return undefined;

    let cancelled = false;
    const cleanups = [];

    const cancelIdle = scheduleIdleWork(() => {
      if (cancelled) return;

      const fontTimer = setTimeout(() => {
        if (!cancelled) Font.loadAsync(EXTRA_FONTS).catch(() => {});
      }, 600);
      cleanups.push(() => clearTimeout(fontTimer));

      if (!isFirstLaunch) {
        const warmupTargets = [
          SCREENS.tools,
          SCREENS.settings,
          SCREENS.qibla,
          SCREENS.dualar,
          SCREENS.zikir,
          SCREENS.quranReader,
        ];

        warmupTargets.forEach((screenId, idx) => {
          const t = setTimeout(() => {
            if (cancelled) return;

            const cancelStep = scheduleIdleWork(() => {
              if (cancelled) return;
              try {
                getScreenComponent(screenId);
              } catch {}
            }, 1500);

            cleanups.push(cancelStep);
          }, 1200 + idx * 650);

          cleanups.push(() => clearTimeout(t));
        });
      }
    }, 1500);

    return () => {
      cancelled = true;
      cancelIdle();
      cleanups.forEach((fn) => fn());
    };
  }, [ready, isFirstLaunch]);

  /* ---------------- Navigasyon ---------------- */
  const [stack, setStack] = useState(ROOT_STACK);
  const currentScreen = stack[stack.length - 1];

  const navigate = useCallback((screen) => {
    if (!screen || typeof screen !== 'string') return;

    setStack((previous) => {
      if (previous[previous.length - 1] === screen) return previous;

      const existingIndex = previous.indexOf(screen);
      if (existingIndex !== -1) {
        return previous.slice(0, existingIndex + 1);
      }

      return [...previous, screen];
    });
  }, []);

  const goBack = useCallback(() => {
    setStack((previous) =>
      previous.length <= 1 ? previous : previous.slice(0, -1)
    );
  }, []);

  const goHome = useCallback(() => {
    setStack((previous) =>
      previous.length === 1 && previous[0] === SCREENS.home
        ? previous
        : ROOT_STACK
    );
  }, []);

  const homeHandlers = useMemo(
    () => ({
      onOpenQibla: () => navigate(SCREENS.qibla),
      onOpenSettings: () => navigate(SCREENS.settings),
      onOpenTools: () => navigate(SCREENS.tools),
      onOpenZikir: () => navigate(SCREENS.zikir),
      onOpenDua: () => navigate(SCREENS.dualar),
      onOpenCalendar: () => navigate(SCREENS.takvim),
      onOpenNotificationSettings: () => navigate(SCREENS.settings),
      onOpenQuran: () => navigate(SCREENS.quranReader),
      onOpenLocation: () => navigate(SCREENS.settings),
    }),
    [navigate]
  );

  const toolsHandlers = useMemo(
    () => ({
      onBack: goHome,
      onOpenHome: goHome,
      onOpenZikir: () => navigate(SCREENS.zikir),
      onOpenDua: () => navigate(SCREENS.dualar),
      onOpenCalendar: () => navigate(SCREENS.takvim),
      onOpenQibla: () => navigate(SCREENS.qibla),
      onOpenSettings: () => navigate(SCREENS.settings),
      onOpenEsma: () => navigate(SCREENS.esma),
      onOpenRamazan: () => navigate(SCREENS.ramazan),
      onOpenZekat: () => navigate(SCREENS.zekat),
      onOpenNamazRehberi: () => navigate(SCREENS.namazRehberi),
      onOpenTesbihat: () => navigate(SCREENS.tesbihat),
      onOpenQuranReader: () => navigate(SCREENS.quranReader),
      onOpenReligiousTerms: () => navigate(SCREENS.terimler),
      onOpenReligiousTopic: (topicId) => navigate(topicId),
      onOpenSiyer: () => navigate(SCREENS.siyer),
      onOpenVedaHutbesi: () => navigate(SCREENS.vedaHutbesi),
      onOpenRuyaTabirleri: () => navigate(SCREENS.ruyaTabirleri),
    }),
    [goHome, navigate]
  );

  /* ---------------- Dinamik Tema Canlı Saat & AppState Senkronu ---------------- */
  const [, setThemeTick] = useState(0);

  useEffect(() => {
    if (themeMode !== 'dynamic') return undefined;

    const interval = setInterval(
      () => setThemeTick((v) => v + 1),
      60 * 1000
    );

    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        setThemeTick((v) => v + 1);
      }
    });

    return () => {
      clearInterval(interval);
      appStateSub.remove();
    };
  }, [themeMode]);

  /* ---------------- Android Geri Tuşu ---------------- */
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const isFirstLaunchRef = useRef(isFirstLaunch);
  isFirstLaunchRef.current = isFirstLaunch;

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isFirstLaunchRef.current) return false;

        if (stackRef.current.length > 1) {
          goBack();
          return true;
        }

        return false;
      }
    );

    return () => subscription.remove();
  }, [goBack]);

  /* ---------------- Tema Yardımcıları ---------------- */
  const statusBarStyle = isLightColorScheme(theme)
    ? 'dark-content'
    : 'light-content';

  /* ---------------- Yükleme Ekranı ---------------- */
  if (!ready) {
    return (
      <GestureHandlerRootView style={styles.rootView}>
        <SafeAreaProvider>
          <HydrationScreen theme={theme} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  const homeVisible = !isFirstLaunch && currentScreen === SCREENS.home;

  /* ---------------- Ekran Yönlendirici ---------------- */
  const renderScreen = () => {
    if (isFirstLaunch) {
      return <OnboardingScreen />;
    }

    if (currentScreen === SCREENS.home) {
      return null;
    }

    const ScreenComponent = getScreenComponent(currentScreen);

    if (currentScreen === SCREENS.settings) {
      return (
        <ScreenComponent
          onBack={goBack}
          onOpenDevNotifications={
            __DEV__ ? () => navigate(SCREENS.devNotifications) : undefined
          }
        />
      );
    }

    if (currentScreen === SCREENS.tools) {
      return <ScreenComponent {...toolsHandlers} />;
    }

    if (!SCREEN_LOADERS[currentScreen]) {
      return (
        <ScreenComponent
          topicId={currentScreen}
          onBack={goBack}
        />
      );
    }

    return <ScreenComponent onBack={goBack} />;
  };

  return (
    <GestureHandlerRootView style={styles.rootView}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={theme.background}
          translucent={false}
        />

        <View
          style={[
            styles.appContainer,
            { backgroundColor: theme.background },
          ]}
        >
          {!isFirstLaunch ? (
            <View
              style={homeVisible ? styles.layer : styles.layerHidden}
              pointerEvents={homeVisible ? 'auto' : 'none'}
            >
              <ErrorBoundary theme={theme}>
                <MemoHome
                  hasShownIntro={hasShownIntro}
                  active={homeVisible}
                  {...homeHandlers}
                />
              </ErrorBoundary>
            </View>
          ) : null}

          {!homeVisible ? (
            <ErrorBoundary
              key={isFirstLaunch ? 'onboarding' : currentScreen}
              theme={theme}
              onResetToHome={isFirstLaunch ? undefined : goHome}
            >
              {renderScreen()}
            </ErrorBoundary>
          ) : null}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  rootView: { flex: 1 },
  appContainer: { flex: 1 },
  layer: { flex: 1 },
  layerHidden: { flex: 1, display: 'none' },

  hydrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  hydrationBadge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  hydrationBrand: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: 20,
  },

  loadingIndicator: { marginTop: 24 },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  errorIconBox: {
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 8,
    textAlign: 'center',
  },

  errorMessage: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  errorActions: {
    width: '100%',
    maxWidth: 280,
    gap: 10,
  },

  errorPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 16,
  },

  errorPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },

  errorSecondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
  },

  errorSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
});