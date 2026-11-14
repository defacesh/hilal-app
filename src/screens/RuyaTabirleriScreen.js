// src/screens/ComingSoonScreen.js
import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { AppText as Text } from '../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '../store/useAppStore';

function ComingSoonScreen({
  title,
  description,
  icon = 'construct-outline',
  onBack,
}) {
  const getTheme = useAppStore((s) => s.getTheme);
  const theme = getTheme();
  const isLight = theme.mode === 'light';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />

      {/* HEADER */}
      <View style={styles.header}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            style={[
              styles.iconBtn,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}

        <Text
          style={[styles.headerTitle, { color: theme.text }]}
          numberOfLines={1}
          accessibilityRole="header"
        >
          {title}
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      {/* BODY */}
      <View style={styles.body}>
        {/* İkon Rozeti */}
        <View
          style={[
            styles.badge,
            { backgroundColor: theme.primaryGlow || theme.surfaceElevated },
          ]}
        >
          <Ionicons name={icon} size={44} color={theme.primary} />
        </View>

        {/* Başlık ve Açıklama */}
        <Text style={[styles.title, { color: theme.text }]}>Rüya Tabirleri</Text>
                <Text style={[styles.title, { color: theme.text }]}>Yakında</Text>

        {description ? (
          <Text style={[styles.desc, { color: theme.textDim }]}>
            {description}
          </Text>
        ) : null}

        {/* Geri Dön Butonu */}
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Ana ekrana geri dön"
            style={[
              styles.backButton,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back" size={18} color={theme.primary} />
            <Text style={[styles.backButtonText, { color: theme.primary }]}>
              Geri Dön
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

export default memo(ComingSoonScreen);

/* ================================================================
   Stiller
   ================================================================ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 8,
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 44,
    height: 44,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  badge: {
    width: 92,
    height: 92,
    borderRadius: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  desc: {
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 48,
  },
  backButtonText: {
    fontWeight: '800',
    fontSize: 15,
  },
});