/**
 * Design System: The Terroir Editorial
 * Premium digital ledger with Organic Brutalism
 * Colors extracted from the coffee lifecycle
 */

import { Platform, ViewStyle } from 'react-native';

// ========================================
// PRIMARY PALETTE: Coffee Lifecycle
// ========================================

// Primary: "Espresso" - Deep roasted brown core
const PRIMARY_LIGHT = '#442a22';
const PRIMARY_DARK = '#d4b5a0';

// Secondary: "Plantation Green" - Vibrant plantation vitality
const SECONDARY_LIGHT = '#3a6843';
const SECONDARY_DARK = '#a8d5a8';

// Tertiary: "Soil" - Earth accent for field-specific data
const TERTIARY_LIGHT = '#412d11';
const TERTIARY_DARK = '#ddb892';

// Surface: "Warm Cream" - Soft, non-fatiguing base
const SURFACE_LIGHT = '#fff8f3';
const SURFACE_DARK = '#1f1b14';

// On-Surface: Text color
const ON_SURFACE_LIGHT = '#1f1b14';
const ON_SURFACE_DARK = '#ebe8e3';

// ========================================
// CONTAINER & DEPTH LAYERS
// ========================================

const PRIMARY_CONTAINER_LIGHT = '#6d4c44';
const PRIMARY_CONTAINER_DARK = '#9d7d72';

const SECONDARY_CONTAINER_LIGHT = '#5a8a63';
const SECONDARY_CONTAINER_DARK = '#7fbf85';

const SURFACE_CONTAINER_LOW_LIGHT = '#f5ede3';
const SURFACE_CONTAINER_LOW_DARK = '#2a2520';

const SURFACE_CONTAINER_LOWEST_LIGHT = '#fffbf7';
const SURFACE_CONTAINER_LOWEST_DARK = '#141110';

const SURFACE_BRIGHT_LIGHT = '#fffbf7';
const SURFACE_BRIGHT_DARK = '#3a3531';

// ========================================
// VARIANT & UTILITY COLORS
// ========================================

const ON_SURFACE_VARIANT_LIGHT = '#52433c';
const ON_SURFACE_VARIANT_DARK = '#d0c5bc';

const OUTLINE_VARIANT_LIGHT = '#9c8f87';
const OUTLINE_VARIANT_DARK = '#6f6960';

// ========================================
// STATE COLORS
// ========================================

const ERROR_LIGHT = '#b3261e';
const ERROR_DARK = '#f9dedc';

const SUCCESS_LIGHT = '#0f7938';
const SUCCESS_DARK = '#b7f5bb';

export const Colors = {
  light: {
    // Primary
    primary: PRIMARY_LIGHT,
    onPrimary: '#ffffff',
    primaryContainer: PRIMARY_CONTAINER_LIGHT,
    onPrimaryContainer: '#ffffff',
    
    // Secondary
    secondary: SECONDARY_LIGHT,
    onSecondary: '#ffffff',
    secondaryContainer: SECONDARY_CONTAINER_LIGHT,
    onSecondaryContainer: '#ffffff',
    
    // Tertiary
    tertiary: TERTIARY_LIGHT,
    onTertiary: '#ffffff',
    
    // Surface
    surface: SURFACE_LIGHT,
    onSurface: ON_SURFACE_LIGHT,
    surfaceContainerLow: SURFACE_CONTAINER_LOW_LIGHT,
    surfaceContainerLowest: SURFACE_CONTAINER_LOWEST_LIGHT,
    surfaceBright: SURFACE_BRIGHT_LIGHT,
    
    // Variants
    onSurfaceVariant: ON_SURFACE_VARIANT_LIGHT,
    outlineVariant: OUTLINE_VARIANT_LIGHT,
    
    // States
    error: ERROR_LIGHT,
    success: SUCCESS_LIGHT,
    
    // Legacy compatibility
    text: ON_SURFACE_LIGHT,
    background: SURFACE_LIGHT,
    tint: PRIMARY_LIGHT,
    icon: ON_SURFACE_VARIANT_LIGHT,
    tabIconDefault: ON_SURFACE_VARIANT_LIGHT,
    tabIconSelected: PRIMARY_LIGHT,
  },
  dark: {
    // Primary
    primary: PRIMARY_DARK,
    onPrimary: '#1f1b14',
    primaryContainer: PRIMARY_CONTAINER_DARK,
    onPrimaryContainer: '#1f1b14',
    
    // Secondary
    secondary: SECONDARY_DARK,
    onSecondary: '#1f1b14',
    secondaryContainer: SECONDARY_CONTAINER_DARK,
    onSecondaryContainer: '#1f1b14',
    
    // Tertiary
    tertiary: TERTIARY_DARK,
    onTertiary: '#1f1b14',
    
    // Surface
    surface: SURFACE_DARK,
    onSurface: ON_SURFACE_DARK,
    surfaceContainerLow: SURFACE_CONTAINER_LOW_DARK,
    surfaceContainerLowest: SURFACE_CONTAINER_LOWEST_DARK,
    surfaceBright: SURFACE_BRIGHT_DARK,
    
    // Variants
    onSurfaceVariant: ON_SURFACE_VARIANT_DARK,
    outlineVariant: OUTLINE_VARIANT_DARK,
    
    // States
    error: ERROR_DARK,
    success: SUCCESS_DARK,
    
    // Legacy compatibility
    text: ON_SURFACE_DARK,
    background: SURFACE_DARK,
    tint: PRIMARY_DARK,
    icon: ON_SURFACE_VARIANT_DARK,
    tabIconDefault: ON_SURFACE_VARIANT_DARK,
    tabIconSelected: PRIMARY_DARK,
  },
};

// ========================================
// TYPOGRAPHY SYSTEM: Editorial Scale
// ========================================
// Manrope: Display & Headlines (geometric, authoritative)
// Public Sans: Body & Labels (neutral, readable)

export const Typography = {
  // Display Large - Plantation titles
  displayLarge: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  // Display Small - Major headers
  displaySmall: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.25,
  },
  // Headline Large - Section headers
  headlineLarge: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  // Headline Medium - Lot numbers, subsections
  headlineMedium: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  // Headline Small
  headlineSmall: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  // Body Large - Field notes, primary body text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  // Body Medium
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  // Label Large - Primary labels
  labelLarge: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  // Label Medium - Secondary labels
  labelMedium: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
  // Label Small - Metadata, tertiary text
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },
} as const;

// ========================================
// SPACING SYSTEM (8px base unit)
// ========================================
export const Spacing = {
  xs: 4,      // Extra small
  sm: 8,      // Small (1 unit)
  md: 16,     // Medium (2 units)
  lg: 24,     // Large (3 units)
  xl: 32,     // Extra Large (4 units)
  xxl: 48,    // 2X Extra Large (6 units)
} as const;

// ========================================
// BORDER RADIUS - Pebble-like feel
// ========================================
export const BorderRadius = {
  sm: 8,      // Small
  md: 12,     // Medium
  lg: 16,     // Large
  xl: 24,     // Extra Large (pebble)
  full: 9999, // Full circle
} as const;

// ========================================
// SHADOWS - Ambient light effect
// ========================================

export const Shadows = {
  ambient: {
    shadowColor: '#1f1b14',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 28,
    elevation: 3,
  } as ViewStyle,
  
  small: {
    shadowColor: '#1f1b14',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  } as ViewStyle,
  
  medium: {
    shadowColor: '#1f1b14',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  } as ViewStyle,
  
  large: {
    shadowColor: '#1f1b14',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 4,
  } as ViewStyle,
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
