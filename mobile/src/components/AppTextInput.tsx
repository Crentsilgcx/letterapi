import React, { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleSheet,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from './AppText';
import { FocusRing, useFocusRing } from './FocusRing';
import { useTheme, Radii, Spacing, Typography } from '../theme';

type TextInputPropsWithoutHandlers = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onChange' | 'onFocus' | 'onBlur' | 'editable' | 'style' | 'placeholder'
>;

interface AppTextInputProps extends TextInputPropsWithoutHandlers {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  iconLeft?: keyof typeof Feather.glyphMap;
  placeholder?: string;
  inputStyle?: StyleProp<TextStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Text input for overlay surfaces (the position picker's search field).
 *
 * Uses the same focus/error ring as the Delivery form, so the two never drift
 * apart visually.
 */
export const AppTextInput = React.forwardRef<TextInput, AppTextInputProps>(
  (
    {
      label,
      value,
      onChangeText,
      onBlur,
      error,
      disabled = false,
      iconLeft,
      placeholder,
      inputStyle,
      wrapperStyle,
      accessibilityLabel,
      testID,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const hasError = Boolean(error);
    const [isFocused, setIsFocused] = useState(false);
    const ringProgress = useFocusRing({ focused: isFocused, hasError });

    const borderColor = hasError ? theme.error : isFocused ? theme.accent : theme.border;

    return (
      <View style={wrapperStyle}>
        {label && (
          <AppText variant="xs" weight="semibold" color={theme.subtext} style={styles.label}>
            {label}
          </AppText>
        )}

        <View style={styles.wrapper}>
          <View
            style={[
              styles.container,
              { borderColor, backgroundColor: theme.inputBg },
              disabled && styles.containerDisabled,
            ]}
          >
            {iconLeft && (
              <View style={styles.iconLeft}>
                <Feather name={iconLeft} size={20} color={hasError ? theme.error : theme.subtext} />
              </View>
            )}
            <TextInput
              ref={ref}
              value={value}
              onChangeText={onChangeText}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                onBlur?.();
              }}
              editable={!disabled}
              placeholder={placeholder}
              placeholderTextColor={theme.placeholder}
              accessibilityLabel={accessibilityLabel ?? label}
              testID={testID}
              underlineColorAndroid="transparent"
              selectionColor={theme.accent}
              style={[styles.input, { color: theme.ink, fontFamily: Typography.fontFamily }, inputStyle]}
              {...props}
            />
          </View>

          <FocusRing progress={ringProgress} hasError={hasError} radius={Radii.input} />
        </View>

        {hasError && (
          <AppText variant="xs" weight="medium" color={theme.error} style={styles.errorText}>
            {error}
          </AppText>
        )}
      </View>
    );
  }
);

AppTextInput.displayName = 'AppTextInput';

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  wrapper: {
    position: 'relative',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radii.input,
    minHeight: 52,
  } as ViewStyle,
  containerDisabled: {
    opacity: 0.6,
  },
  iconLeft: {
    width: 20,
    marginRight: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
    minHeight: 52,
  } as TextStyle,
  errorText: {
    marginTop: Spacing.xs,
  } as TextStyle,
});

export default AppTextInput;
