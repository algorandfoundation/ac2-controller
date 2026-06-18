import React from 'react';
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { theme } from '@/theme';
import { AppText } from './Text';

// ─── Types ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'pill' | 'pillLight' | 'white' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonColor = 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  color?: ButtonColor;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  color = 'primary',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  style,
}: ButtonProps) {
  const colorValue = getColorValue(color);
  const isFilled =
    variant === 'primary' ||
    variant === 'pill' ||
    variant === 'outline' ||
    variant === 'pillLight' ||
    variant === 'white';
  const spinnerColor =
    variant === 'white' ? theme.colors.fg.onLight : isFilled ? theme.colors.fg.inverse : colorValue;

  const textColorMap: Record<ButtonVariant, string> = {
    primary: 'inverse',
    outline: 'inverse',
    ghost: 'muted',
    pill: 'inverse',
    pillLight: 'inverse',
    white: 'neutral',
    link: 'primary',
  };

  const colorStyle = {
    ...(variant === 'primary' || variant === 'pill' || variant === 'pillLight'
      ? { backgroundColor: colorValue }
      : {}),
    ...(variant === 'outline' ? { borderColor: colorValue, backgroundColor: colorValue } : {}),
    ...(variant === 'white' ? { backgroundColor: theme.colors.bg.white } : {}),
    ...(variant === 'link' || variant === 'ghost' ? { backgroundColor: 'transparent' } : {}),
  };

  const variantStyle = styles.variants[variant];
  const sizeStyle = styles.sizes[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      style={[
        styles.base,
        variantStyle,
        sizeStyle,
        colorStyle,
        variant === 'link' && styles.linkReset,
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <>
          {leftIcon}
          <AppText
            variant="label"
            color={textColorMap[variant] as any}
            style={variant === 'white' ? styles.whiteLabel : undefined}
            bold
          >
            {label}
          </AppText>
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getColorValue = (colorName: ButtonColor) => {
  const colorMap: Record<ButtonColor, string> = {
    primary: theme.colors.brand.primary,
    secondary: theme.colors.brand.soft,
    success: theme.colors.state.success,
    error: theme.colors.state.danger,
    info: theme.colors.brand.primary,
    warning: theme.colors.state.warning,
  };
  return colorMap[colorName];
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  variants: {
    primary: {
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.borderRadius.md,
      ...theme.shadows.primary,
    },
    outline: {
      backgroundColor: 'transparent',
      borderRadius: theme.borderRadius.md,
      borderWidth: 1,
      borderColor: theme.colors.border.default,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderRadius: theme.borderRadius.md,
    },
    pill: {
      backgroundColor: theme.colors.brand.primary,
      borderRadius: theme.borderRadius.full,
      ...theme.shadows.md,
    },
    pillLight: {
      backgroundColor: theme.colors.bg.surface,
      borderRadius: theme.borderRadius.full,
      ...theme.shadows.md,
    },
    white: {
      backgroundColor: theme.colors.bg.white,
      borderRadius: theme.borderRadius.full,
    },
    link: {
      backgroundColor: 'transparent',
      borderRadius: 0,
      paddingVertical: 0,
      paddingHorizontal: 0,
    },
  } as Record<ButtonVariant, any>,
  sizes: {
    sm: {
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
    },
    md: {
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.base,
    },
    lg: {
      paddingVertical: theme.spacing.base,
      paddingHorizontal: theme.spacing.xl,
    },
  } as Record<ButtonSize, any>,
  fullWidth: {
    width: '100%',
  },
  linkReset: {
    borderRadius: 0,
    paddingVertical: 0,
  },
  disabled: {
    opacity: 0.5,
  },
  whiteLabel: {
    color: theme.colors.fg.onLight,
  },
});
