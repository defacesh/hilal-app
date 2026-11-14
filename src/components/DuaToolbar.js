// src/components/DuaToolbar.js
import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FONT_SIZES = [
  { id: 'small', label: 'A-', scale: 0.9 },
  { id: 'normal', label: 'A', scale: 1 },
  { id: 'large', label: 'A+', scale: 1.15 },
];

export const DuaToolbar = memo(function DuaToolbar({
  fontScaleId,
  onFontSizeChange,
  onCopy,
  onShare,
  theme,
  highContrast,
  haptic,
}) {
  return (
    <View style={[
      styles.toolbarContainer,
      {
        backgroundColor: highContrast ? '#1E1E1E' : (theme.surfaceElevated || theme.surface),
        borderColor: theme.border,
        borderWidth: highContrast ? 2 : 1,
      }
    ]}>
      {/* Yazı Boyutu Kontrolleri */}
      <View style={styles.fontGroup}>
        {FONT_SIZES.map((f) => {
          const isSelected = fontScaleId === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => {
                haptic?.();
                onFontSizeChange?.(f.id);
              }}
              style={[
                styles.fontBtn,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : (highContrast ? '#121212' : theme.surface),
                  borderColor: isSelected ? theme.primary : theme.border,
                  borderWidth: highContrast ? 2 : 1,
                },
              ]}
              accessibilityLabel={`Yazı boyutu ${f.label}`}
              accessibilityState={{ selected: isSelected }}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.fontBtnText,
                {
                  color: isSelected
                    ? (highContrast ? '#000000' : (theme.onPrimary || '#FFF'))
                    : theme.text,
                  fontWeight: '900',
                },
              ]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Aksiyon Butonları (Kopyala & Paylaş) */}
      <View style={styles.actionGroup}>
        {typeof onCopy === 'function' && (
          <TouchableOpacity
            onPress={() => {
              haptic?.();
              onCopy();
            }}
            style={[
              styles.actionBtn,
              {
                borderColor: theme.border,
                borderWidth: highContrast ? 2 : 1,
                backgroundColor: highContrast ? '#121212' : theme.surface,
              },
            ]}
            accessibilityLabel="Metni kopyala"
            activeOpacity={0.8}
          >
            <Ionicons name="copy-outline" size={18} color={theme.text} />
          </TouchableOpacity>
        )}

        {typeof onShare === 'function' && (
          <TouchableOpacity
            onPress={() => {
              haptic?.();
              onShare();
            }}
            style={[
              styles.actionBtn,
              {
                borderColor: theme.border,
                borderWidth: highContrast ? 2 : 1,
                backgroundColor: highContrast ? '#121212' : theme.surface,
              },
            ]}
            accessibilityLabel="Paylaş"
            activeOpacity={0.8}
          >
            <Ionicons name="share-outline" size={18} color={theme.text} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 14,
    gap: 12,
  },
  fontGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fontBtn: {
    minWidth: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  fontBtnText: {
    fontSize: 13,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});