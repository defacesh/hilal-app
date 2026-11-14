// src/components/ThemedSwitch.js
import React from 'react';
import { Switch, Platform } from 'react-native';
import { useTheme, useGlobalHaptic } from '../store/useAppStore';
import * as Haptics from 'expo-haptics';

export function ThemedSwitch({
  value,
  onValueChange,
  disabled = false,
  ...props
}) {
  const theme = useTheme();
  const hapticEnabled = useGlobalHaptic();

  const handleChange = (nextValue) => {
    if (disabled) return;
    if (hapticEnabled) {
      Haptics.selectionAsync().catch(() => {});
    }
    onValueChange?.(nextValue);
  };

  return (
    <Switch
      value={Boolean(value)}
      onValueChange={handleChange}
      disabled={disabled}
      trackColor={{
        false: theme.border,
        true: theme.primary,
      }}
      thumbColor={
        Platform.OS === 'android'
          ? value
            ? '#FFFFFF'
            : theme.textMuted
          : '#FFFFFF'
      }
      ios_backgroundColor={theme.border}
      {...props}
    />
  );
}