import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outlined' | 'tertiary';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  style,
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Padding por tamaño
  const paddingMap = {
    small: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md },
    medium: { paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg },
    large: { paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl },
  };

  // Font size por tamaño
  const fontSizeMap = {
    small: Typography.labelLarge.fontSize,
    medium: Typography.labelLarge.fontSize,
    large: Typography.headlineMedium.fontSize,
  };

  // Estilos base
  const baseStyle: ViewStyle = {
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    ...paddingMap[size],
    ...(fullWidth && { width: '100%' }),
    ...Shadows.ambient,
  };

  // Estilos por variante
  const variantStyles: Record<string, { bg: string; text: string; borderColor?: string }> = {
    primary: { bg: colors.primary, text: colors.onPrimary },
    secondary: { bg: colors.secondaryContainer, text: colors.onSecondaryContainer },
    tertiary: { bg: colors.tertiary, text: colors.onTertiary },
    outlined: { bg: 'transparent', text: colors.primary, borderColor: colors.outlineVariant },
  };

  const { bg, text, borderColor } = variantStyles[variant];

  const textStyle: TextStyle = {
    fontSize: fontSizeMap[size],
    fontWeight: '700',
    color: text,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        baseStyle,
        {
          backgroundColor: bg,
          ...(borderColor && { borderWidth: 1, borderColor }),
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}>
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
}
