import React from 'react';
import { StyleSheet, Text, TextProps, TextStyle } from 'react-native';
import { theme } from '@/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'label' | 'caption' | 'micro';
type TextColor = 'neutral' | 'muted' | 'inverse' | 'primary' | 'success' | 'danger' | 'warning';

interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: TextColor;
  bold?: boolean;
  children: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppText({
  variant = 'body',
  color = 'neutral',
  bold = false,
  style,
  children,
  ...rest
}: AppTextProps) {
  const variantStyle = variantStyles[variant];
  const colorStyle = colorStyles[color];

  return (
    <Text style={[variantStyle, colorStyle, bold && styles.bold, style]} {...rest}>
      {children}
    </Text>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

// Kept outside StyleSheet.create so they can be indexed dynamically by variant/color name.
// StyleSheet.create only handles flat top-level style objects — nesting records inside it
// would cause numeric IDs to be returned for the nested keys in production builds.
//
// NOTE: weight is carried entirely by `fontFamily` (each weight is a distinct static
// file: -Regular/-Medium/-SemiBold/-Bold) and we deliberately do NOT set `fontWeight`.
// On Android, expo-font registers each typeface under `Typeface.NORMAL` only; a
// `fontWeight >= 700` makes React Native's ReactFontManager resolve `nearestStyle` to
// `Typeface.BOLD`, miss the NORMAL-registered face, and fall back to Roboto. Letting the
// family name carry the weight keeps the lookup on the NORMAL style so the real font is found.
const variantStyles: Record<TextVariant, TextStyle> = {
  h1: {
    fontSize: theme.typography.sizes.xl * 1.22,
    fontFamily: theme.typography.fonts.bold,
    lineHeight: theme.typography.sizes.xl * 1.22 * theme.typography.lineHeights.tight,
    color: theme.colors.fg.default,
  },
  h2: {
    fontSize: theme.typography.sizes.xl,
    fontFamily: theme.typography.fonts.bold,
    lineHeight: theme.typography.sizes.xl * theme.typography.lineHeights.tight,
    color: theme.colors.fg.default,
  },
  h3: {
    fontSize: theme.typography.sizes.lg,
    fontFamily: theme.typography.fonts.semiBold,
    lineHeight: theme.typography.sizes.lg * theme.typography.lineHeights.normal,
    color: theme.colors.fg.default,
  },
  body: {
    fontSize: theme.typography.sizes.base,
    fontFamily: theme.typography.fonts.regular,
    lineHeight: theme.typography.sizes.base * theme.typography.lineHeights.normal,
    color: theme.colors.fg.default,
  },
  label: {
    fontSize: theme.typography.sizes.md,
    fontFamily: theme.typography.fonts.semiBold,
    lineHeight: theme.typography.sizes.md * theme.typography.lineHeights.normal,
    color: theme.colors.fg.default,
  },
  caption: {
    fontSize: theme.typography.sizes.sm,
    fontFamily: theme.typography.fonts.medium,
    lineHeight: theme.typography.sizes.sm * theme.typography.lineHeights.relaxed,
    color: theme.colors.fg.muted,
  },
  micro: {
    fontSize: theme.typography.sizes.xs,
    fontFamily: theme.typography.fonts.medium,
    lineHeight: theme.typography.sizes.xs * theme.typography.lineHeights.relaxed,
    color: theme.colors.fg.muted,
  },
};

const colorStyles: Record<TextColor, TextStyle> = {
  neutral: { color: theme.colors.fg.default },
  muted: { color: theme.colors.fg.muted },
  inverse: { color: theme.colors.fg.inverse },
  primary: { color: theme.colors.fg.primary },
  success: { color: theme.colors.fg.success },
  danger: { color: theme.colors.fg.danger },
  warning: { color: theme.colors.fg.warning },
};

const styles = StyleSheet.create({
  // No `fontWeight` here on purpose — the `-Bold` family file carries the weight.
  // Setting `fontWeight: '700'` makes Android resolve to a BOLD style slot that
  // expo-font never registers, falling back to Roboto. See variantStyles note above.
  bold: {
    fontFamily: theme.typography.fonts.bold,
  },
});
