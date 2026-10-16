import React, { forwardRef, ElementRef } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, View, TextStyle, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme, Radii, Spacing, Typography } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'full';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  iconLeft?: keyof typeof Feather.glyphMap;
}

export const Button = forwardRef<ElementRef<typeof Pressable>, ButtonProps>(
  ({ title, onPress, disabled = false, loading = false, variant = 'primary', style, testID, accessibilityLabel, accessibilityHint, iconLeft }, ref) => {
    const theme = useTheme();
    const isDisabled = disabled || loading;
    const [isPressed, setIsPressed] = React.useState(false);

    const buttonStyle: ViewStyle[] = [
      styles.button,
      styles[variant],
      isPressed && styles.buttonPressed,
      style,
    ].filter(Boolean) as ViewStyle[];

    const textStyle: TextStyle[] = [
      styles.buttonText,
      styles[`buttonText${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles],
    ].filter(Boolean) as TextStyle[];

    const backgroundColor = variant === 'primary' || variant === 'full' ? theme.accent : theme.border;

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (loading ? `${title}, submitting` : title)}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        style={[
          ...buttonStyle,
          { backgroundColor, opacity: isDisabled ? theme.disabledOpacity : 1 },
        ]}
        testID={testID}
        android_ripple={{ color: variant === 'primary' || variant === 'full' ? theme.accentText : theme.subtext, borderless: false }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'primary' || variant === 'full' ? theme.accentText : theme.ink} />
        ) : (
          <View style={styles.buttonContent}>
            {iconLeft && <Feather name={iconLeft} size={20} color={variant === 'primary' || variant === 'full' ? theme.accentText : theme.ink} style={styles.icon} />}
            <Text style={[
              ...textStyle,
              { color: variant === 'primary' || variant === 'full' ? theme.accentText : theme.ink, fontFamily: Typography.fontFamilyBold },
            ]}>
              {title}
            </Text>
          </View>
        )}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.button,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
  } as ViewStyle,
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  primary: {},
  secondary: {
    borderWidth: 1,
  },
  full: {
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  icon: {
    marginRight: Spacing.xs,
  },
  buttonText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  } as TextStyle,
  buttonTextPrimary: {} as TextStyle,
  buttonTextSecondary: {} as TextStyle,
  buttonTextFull: {
    fontSize: Typography.fontSize.lg,
  } as TextStyle,
});