import React, { forwardRef, useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from './AppText';
import { FocusRing, useFocusRing } from './FocusRing';
import { useTheme, Radii, Spacing, Typography } from '../theme';

type TextInputPropsWithoutHandlers = Omit<
  TextInputProps,
  'value' | 'onChangeText' | 'onChange' | 'onBlur' | 'editable' | 'style' | 'placeholder' | 'placeholderTextColor'
>;

interface InputFieldProps extends TextInputPropsWithoutHandlers {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  optional?: boolean;
  iconLeft?: keyof typeof Feather.glyphMap;
  placeholder?: string;
  accessibilityLabel?: string;
  testID?: string;
  style?: ViewStyle;
}

export const InputField = forwardRef<TextInput, InputFieldProps>(
  (
    {
      label,
      value,
      onChangeText,
      onBlur,
      error,
      disabled = false,
      required = false,
      optional = false,
      iconLeft,
      placeholder,
      accessibilityLabel,
      testID,
      style,
      onFocus,
      ...props
    },
    ref
  ) => {
    const theme = useTheme();
    const hasError = Boolean(error);
    const [isFocused, setIsFocused] = useState(false);
    const ringProgress = useFocusRing({ focused: isFocused, hasError });

    const borderColor = hasError ? theme.error : isFocused ? theme.accent : theme.line;
    const backgroundColor = isFocused ? theme.card : theme.field;
    const iconColor = hasError ? theme.error : isFocused ? theme.accent : theme.sub;

    const inputHeight = Platform.OS === 'ios' ? 52 : 54;

    return (
      <View style={[styles.field, style]}>
        <View style={styles.labelRow}>
          <AppText variant="sm" weight="semibold" color={theme.ink} style={styles.label}>
            {label}
            {required && <AppText variant="sm" weight="semibold" color={theme.error} style={styles.asterisk}> *</AppText>}
            {optional && <AppText variant="xs" weight="medium" color={theme.sub} style={styles.optionalLabel}>Optional</AppText>}
          </AppText>
        </View>

        <View style={styles.wrapper}>
          <View
            style={[
              styles.inputContainer,
              { borderColor, backgroundColor, borderRadius: Radii.input, height: inputHeight },
              disabled && styles.inputContainerDisabled,
            ]}
          >
            {iconLeft && (
              <View style={styles.iconLeft}>
                <Feather name={iconLeft} size={20} color={iconColor} />
              </View>
            )}
            <TextInput
              ref={ref}
              value={value}
              onChangeText={onChangeText}
              onFocus={() => { setIsFocused(true); onFocus?.(); }}
              onBlur={() => { setIsFocused(false); onBlur?.(); }}
              editable={!disabled}
              placeholder={placeholder}
              placeholderTextColor={theme.placeholder}
              accessibilityLabel={accessibilityLabel ?? label}
              testID={testID}
              style={[
                styles.input,
                { color: theme.ink, fontFamily: Typography.fontFamilyMedium, fontSize: Typography.fontSize.lg },
                disabled && styles.inputDisabled,
              ]}
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

InputField.displayName = 'InputField';

const styles = StyleSheet.create({
  field: {
    marginBottom: Spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    flex: 1,
  },
  asterisk: {
    marginLeft: 2,
  },
  optionalLabel: {
    marginLeft: Spacing.sm,
  },
  wrapper: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  inputContainerDisabled: {
    opacity: 0.6,
  },
  iconLeft: {
    width: 20,
    marginRight: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.lg,
    minHeight: 52,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    marginTop: Spacing.xs,
  },
});

export default InputField;