import {
  MD3LightTheme,
  MD3DarkTheme,
  configureFonts,
} from "react-native-paper";
import type { MD3Theme } from "react-native-paper";

export const colors = {
  primary: "#00376e",
  primaryDark: "#002549",
  primaryLight: "#335585",
  onPrimary: "#FFFFFF",
  secondary: "#6C757D",
  secondaryLight: "#8E989F",
  onSecondary: "#FFFFFF",
  success: "#00376e",
  successLight: "#335585",
  warning: "#00376e",
  warningLight: "#335585",
  danger: "#00376e",
  dangerLight: "#335585",
  info: "#00376e",
  infoLight: "#335585",
  transito: "#00376e",
  filaDescarga: "#00376e",
  filaCarga: "#00376e",
  patioDescarga: "#00376e",
  patioCarga: "#00376e",
  descargasHoje: "#00376e",
  cargasHoje: "#00376e",
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  background: "#F9FAFB",
  surface: "#FFFFFF",
  surfaceVariant: "#F3F4F6",
  text: "#1F2937",
  textSecondary: "#6B7280",
  textDisabled: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  white: "#FFFFFF",
  black: "#1F2937",
  gray: "#6B7280",
  lightGray: "#F9FAFB",
  orange: "#00376e",
  purple: "#00376e",
  teal: "#00376e",
} as const;

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: "500" as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 24,
    letterSpacing: 0.5,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const filterColors = {
  overlay: "rgba(0, 0, 0, 0.5)",
  chipInactive: "#F0F0F0",
  chipInactiveBorder: "#E0E0E0",
  chipInactiveText: "#1F2937",
  chipActive: "#007AFF",
  chipActiveBorder: "#007AFF",
  chipActiveText: "#FFFFFF",
  modalBackground: "#FFFFFF",
  modalBorder: "#E0E0E0",
  closeButtonText: "#6B7280",
  resetButtonBackground: "#F0F0F0",
  resetButtonText: "#6B7280",
  applyButtonBackground: "#007AFF",
  applyButtonText: "#FFFFFF",
} as const;

const fontConfig = {
  displayLarge: typography.h1,
  displayMedium: typography.h2,
  displaySmall: typography.h3,
  headlineLarge: typography.h2,
  headlineMedium: typography.h3,
  headlineSmall: typography.h4,
  titleLarge: typography.h3,
  titleMedium: typography.h4,
  titleSmall: typography.bodyMedium,
  bodyLarge: typography.body,
  bodyMedium: typography.bodySmall,
  bodySmall: typography.caption,
  labelLarge: typography.button,
  labelMedium: typography.label,
  labelSmall: typography.caption,
};

export const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: colors.primaryLight,
    secondary: colors.secondary,
    secondaryContainer: colors.secondaryLight,
    tertiary: colors.info,
    tertiaryContainer: colors.infoLight,
    surface: colors.surface,
    surfaceVariant: colors.surfaceVariant,
    background: colors.background,
    error: colors.danger,
    errorContainer: colors.dangerLight,
    onPrimary: colors.onPrimary,
    onSecondary: colors.onSecondary,
    onSurface: colors.text,
    onSurfaceVariant: colors.textSecondary,
    onBackground: colors.text,
    outline: colors.border,
    outlineVariant: colors.borderLight,
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: colors.primaryLight,
    primaryContainer: colors.primary,
    secondary: colors.secondaryLight,
    secondaryContainer: colors.secondary,
    surface: colors.neutral[800],
    surfaceVariant: colors.neutral[700],
    background: colors.neutral[900],
    error: colors.dangerLight,
    errorContainer: colors.danger,
  },
  fonts: configureFonts({ config: fontConfig }),
};

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  filterColors,
  light: lightTheme,
  dark: darkTheme,
} as const;

export default theme;
