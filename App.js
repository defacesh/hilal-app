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
  BackHandler,
  Platform,
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

// İlk açılış hızı için kritik ekranlar
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';

// Home arkada canlı kalır; App her state değiştirdiğinde gereksiz yere yeniden çizilmesin
const MemoHome = React.memo(HomeScreen);

/* ================================================================
   Splash kontrolü
   ================================================================ */
SplashScreen.preventAutoHideAsync().catch(() => {});

/* ================================================================
   Font Haritası (Açılışı Yavaşlatmayacak Kritik Set)
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
   Ekran Kimlikleri
   ================================================================ */
const SCREENS = {
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
};

const ROOT_STACK = [SCREENS.home];

/* ================================================================
   ErrorBoundary
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

  render() {
    if (this.state.hasError) {
      const theme = this.props.theme;
      return (
        <SafeAreaView
          style={[
            styles.errorContainer,
            { backgroundColor: theme?.background ?? '#0B1511' },
          ]}
        >
          <Ionicons
            name="alert-circle-outline"
            size={56}
            color={theme?.textDim ?? '#999'}
          />
          <Text style={[styles.errorTitle, { color: theme?.text ?? '#FFFFFF' }]}>
            Bir sorun oluştu
          </Text>
          <Text style={[styles.errorMessage, { color: theme?.textDim ?? '#999' }]} numberOfLines={6}>
            {this.state.error?.message ?? 'Beklenmeyen bir hata oluştu.'}
          </Text>
          <Text style={[styles.errorHint, { color: theme?.textMuted ?? '#666' }]}>
            Uygulamayı yeniden başlatmayı deneyin.
          </Text>
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
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [fade]);

  const isDark = theme.mode === 'dark' || theme.mode === 'oled';

  return (
    <SafeAreaView style={[styles.hydrationContainer, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
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
          <MaterialCommunityIcons name="star-crescent" size={44} color={theme.primary} />
        </View>
        <Text style={[styles.hydrationBrand, { color: theme.text }]}>NİDA</Text>
        <ActivityIndicator size="small" color={theme.primary} style={styles.loadingIndicator} />
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

  /* ---------------- Hızlı Font Yükleme ---------------- */
  const [essentialLoaded] = Font.useFonts(ESSENTIAL_FONTS);

  /* ---------------- Store Hydration ---------------- */
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());

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
    }, 1500);

    return () => {
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, []);

  /* ---------------- Hazır mı? ---------------- */
  const ready = hydrated;

  /* ---------------- Splash Gizle ---------------- */
  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  /* ---------------- Ek fontlar + ekran ısıtma (açılış bittikten sonra) ---------------- */
  useEffect(() => {
    if (!hydrated) return undefined;
    const fontTimer = setTimeout(() => {
      Font.loadAsync(EXTRA_FONTS).catch(() => {});
    }, 1500);
    return () => clearTimeout(fontTimer);
  }, [hydrated]);

  // Ağır ekranların modülleri ilk dokunuşta değil, boşta iken yüklenir
  useEffect(() => {
    if (!hydrated || isFirstLaunch) return undefined;
    const loaders = [
      () => require('./src/screens/ToolsScreen'),
      () => require('./src/screens/SettingsScreen'),
      () => require('./src/screens/QiblaScreen'),
      () => require('./src/screens/DualarScreen'),
      () => require('./src/screens/ZikirmatikScreen'),
      () => require('./src/screens/QuranReaderScreen'),
    ];
    const timers = loaders.map((load, i) => setTimeout(() => {
      try { load(); } catch {}
    }, 2500 + i * 800));
    return () => timers.forEach(clearTimeout);
  }, [hydrated, isFirstLaunch]);

  /* ---------------- Navigasyon ---------------- */
  const [stack, setStack] = useState(ROOT_STACK);
  const currentScreen = stack[stack.length - 1];

  const navigate = useCallback((screen) => {
    if (!screen || typeof screen !== 'string') return;
    setStack((previous) => {
      if (previous[previous.length - 1] === screen) return previous;
      return [...previous, screen];
    });
  }, []);

  const goBack = useCallback(() => {
    setStack((previous) => {
      if (previous.length <= 1) return previous;
      return previous.slice(0, -1);
    });
  }, []);

  const goHome = useCallback(() => {
    setStack((previous) => {
      if (previous.length === 1 && previous[0] === SCREENS.home) {
        return previous;
      }
      return ROOT_STACK;
    });
  }, []);

  // Home için sabit callback'ler
  const homeHandlers = useMemo(() => ({
    onOpenQibla: () => navigate(SCREENS.qibla),
    onOpenSettings: () => navigate(SCREENS.settings),
    onOpenTools: () => navigate(SCREENS.tools),
    onOpenZikir: () => navigate(SCREENS.zikir),
    onOpenDua: () => navigate(SCREENS.dualar),
    onOpenCalendar: () => navigate(SCREENS.takvim),
    onOpenNotificationSettings: () => navigate(SCREENS.settings),
    onOpenQuran: () => navigate(SCREENS.quranReader),
    onOpenLocation: () => navigate(SCREENS.settings),
  }), [navigate]);

  /* ---------------- Dinamik Tema Tick ---------------- */
  const [, setThemeTick] = useState(0);
  useEffect(() => {
    if (themeMode !== 'dynamic') return undefined;
    const interval = setInterval(() => setThemeTick((v) => v + 1), 60 * 1000);
    return () => clearInterval(interval);
  }, [themeMode]);

  /* ---------------- Android Geri Tuşu ---------------- */
  const stackRef = useRef(stack);
  stackRef.current = stack;

  const goBackRef = useRef(goBack);
  goBackRef.current = goBack;

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      const currentStack = stackRef.current;
      if (currentStack.length > 1) {
        goBackRef.current();
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, []);

  /* ---------------- Tema Yardımcıları ---------------- */
  const statusBarStyle =
    theme.mode === 'light' || theme.mode === 'modernLight'
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

  /* ---------------- Ekran Yönlendirici (Lazy Require) ---------------- */
  const renderScreen = () => {
    if (isFirstLaunch) {
      return <OnboardingScreen />;
    }

    switch (currentScreen) {
      case SCREENS.home:
        return null;
      case SCREENS.qibla: {
        const QiblaScreen = require('./src/screens/QiblaScreen').default;
        return <QiblaScreen onBack={goBack} />;
      }
      case SCREENS.settings: {
        const SettingsScreen = require('./src/screens/SettingsScreen').default;
        return (
          <SettingsScreen
            onBack={goBack}
            onOpenDevNotifications={__DEV__ ? () => navigate(SCREENS.devNotifications) : undefined}
          />
        );
      }
      case SCREENS.devNotifications: {
        const NotificationTestScreen = require('./src/screens/NotificationTestScreen').default;
        return <NotificationTestScreen onBack={goBack} />;
      }
      case SCREENS.tools: {
        const ToolsScreen = require('./src/screens/ToolsScreen').default;
        return (
          <ToolsScreen
            onBack={goHome}
            onOpenHome={goHome}
            onOpenZikir={() => navigate(SCREENS.zikir)}
            onOpenDua={() => navigate(SCREENS.dualar)}
            onOpenCalendar={() => navigate(SCREENS.takvim)}
            onOpenQibla={() => navigate(SCREENS.qibla)}
            onOpenSettings={() => navigate(SCREENS.settings)}
            onOpenEsma={() => navigate(SCREENS.esma)}
            onOpenRamazan={() => navigate(SCREENS.ramazan)}
            onOpenZekat={() => navigate(SCREENS.zekat)}
            onOpenNamazRehberi={() => navigate(SCREENS.namazRehberi)}
            onOpenTesbihat={() => navigate(SCREENS.tesbihat)}
            onOpenQuranReader={() => navigate(SCREENS.quranReader)}
            onOpenReligiousTerms={() => navigate(SCREENS.terimler)}
            onOpenReligiousTopic={(topicId) => navigate(topicId)}
            onOpenSiyer={() => navigate(SCREENS.siyer)}
            onOpenVedaHutbesi={() => navigate(SCREENS.vedaHutbesi)}
            onOpenRuyaTabirleri={() => navigate(SCREENS.ruyaTabirleri)}
          />
        );
      }
      case SCREENS.zikir: {
        const ZikirmatikScreen = require('./src/screens/ZikirmatikScreen').default;
        return <ZikirmatikScreen onBack={goBack} />;
      }
      case SCREENS.dualar: {
        const DualarScreen = require('./src/screens/DualarScreen').default;
        return <DualarScreen onBack={goBack} />;
      }
      case SCREENS.quranReader: {
        const QuranReaderScreen = require('./src/screens/QuranReaderScreen').default;
        return <QuranReaderScreen onBack={goBack} />;
      }
      case SCREENS.takvim: {
        const CalendarScreen = require('./src/screens/CalendarScreen').default;
        return <CalendarScreen onBack={goBack} />;
      }
      case SCREENS.esma: {
        const EsmaulHusnaScreen = require('./src/screens/EsmaulHusnaScreen').default;
        return <EsmaulHusnaScreen onBack={goBack} />;
      }
      case SCREENS.ramazan: {
        const RamazanScreen = require('./src/screens/RamazanScreen').default;
        return <RamazanScreen onBack={goBack} />;
      }
      case SCREENS.terimler: {
        const ReligiousTermsScreen = require('./src/screens/ReligiousTermsScreen').default;
        return <ReligiousTermsScreen onBack={goBack} />;
      }
      case SCREENS.namazRehberi: {
        const NamazRehberiScreen = require('./src/screens/NamazRehberiScreen').default;
        return <NamazRehberiScreen onBack={goBack} />;
      }
      case SCREENS.tesbihat: {
        const TesbihatScreen = require('./src/screens/TesbihatScreen').default;
        return <TesbihatScreen onBack={goBack} />;
      }
      case SCREENS.zekat: {
        const ZekatScreen = require('./src/screens/ZekatScreen').default;
        return <ZekatScreen onBack={goBack} />;
      }
      case SCREENS.ruyaTabirleri: {
        const RuyaTabirleriScreen = require('./src/screens/RuyaTabirleriScreen').default;
        return <RuyaTabirleriScreen onBack={goBack} />;
      }
      case SCREENS.vedaHutbesi: {
        const VedaHutbesiScreen = require('./src/screens/VedaHutbesiScreen').default;
        return <VedaHutbesiScreen onBack={goBack} />;
      }
      case SCREENS.siyer: {
        const SiyerScreen = require('./src/screens/SiyerScreen').default;
        return <SiyerScreen onBack={goBack} />;
      }
      default: {
        const ReligiousKnowledgeScreen = require('./src/screens/ReligiousKnowledgeScreen').default;
        return <ReligiousKnowledgeScreen topicId={currentScreen} onBack={goBack} />;
      }
    }
  };

  return (
    <GestureHandlerRootView style={styles.rootView}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={theme.background}
          translucent={false}
        />
        <View style={[styles.appContainer, { backgroundColor: theme.background }]}>
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
            <ErrorBoundary key={isFirstLaunch ? 'onboarding' : currentScreen} theme={theme}>
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
  errorTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 20,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  errorHint: {
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});