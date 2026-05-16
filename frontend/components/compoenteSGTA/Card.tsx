import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'elevated' | 'filled' | 'outlined' | 'lot';
  style?: ViewStyle;
}

export function Card({ children, variant = 'elevated', style }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const variantStyles: Record<string, ViewStyle> = {
    elevated: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.ambient,
    },
    filled: {
      backgroundColor: colors.surfaceContainerLow,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
    },
    outlined: {
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: colors.outlineVariant,
    },
    lot: {
      backgroundColor: colors.surfaceContainerLowest,
      borderRadius: BorderRadius.lg,
      paddingLeft: Spacing.lg,
      paddingRight: Spacing.md,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.lg,
      ...Shadows.ambient,
    },
  };

  return (
    <View style={[variantStyles[variant], style]}>
      {children}
    </View>
  );
}

export function CardHeader({
  title,
  subtitle,
  style,
}: {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={[{ marginBottom: Spacing.md }, style]}>
      <View style={{ fontSize: 20, fontWeight: '700', color: colors.onSurface }}>
        {/* Usar Text component en la app real */}
      </View>
      {subtitle && (
        <View style={{ fontSize: 14, color: colors.onSurfaceVariant, marginTop: 4 }}>
          {/* Usar Text component en la app real */}
        </View>
      )}
    </View>
  );
}

export function CardContent({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[{ marginVertical: Spacing.md }, style]}>{children}</View>;
}

export function CardFooter({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          marginTop: Spacing.lg,
          paddingTop: Spacing.md,
          borderTopWidth: 0,
          gap: Spacing.md,
          flexDirection: 'row',
        },
        style,
      ]}>
      {children}
    </View>
  );
}
