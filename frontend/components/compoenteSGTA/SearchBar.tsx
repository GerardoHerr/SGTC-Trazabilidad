import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, TextInputProps } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface SearchBarProps extends TextInputProps {
  placeholder?: string;
  onChangeText?: (text: string) => void;
  value?: string;
  style?: ViewStyle;
}

export function SearchBar({
  placeholder = 'Search',
  onChangeText,
  value,
  style,
  ...props
}: SearchBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceContainerLow,
          borderRadius: BorderRadius.lg,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
        },
        style,
      ]}>
      <MaterialCommunityIcons
        name="magnify"
        size={20}
        color={colors.onSurfaceVariant}
        style={{ marginRight: Spacing.xs }}
      />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.onSurfaceVariant}
        onChangeText={onChangeText}
        value={value}
        style={{
          flex: 1,
          color: colors.onSurface,
          fontSize: 16,
          fontFamily: 'Public Sans',
        }}
        {...props}
      />
    </View>
  );
}
