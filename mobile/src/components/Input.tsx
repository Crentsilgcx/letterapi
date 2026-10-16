import React, { forwardRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, TextStyle, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FocusRing, useFocusRing } from './FocusRing';
import { useTheme, Radii, Spacing, Typography } from '../theme';

type TextInputPropsWithoutValue = Omit<TextInputProps, 'value' | 'onChangeText' | 'onChange' | 'onFocus' | 'onBlur' | 'editable' | 'style'>;

interface InputProps extends TextInputPropsWithoutValue {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  optional?: boolean;
  iconLeft?: keyof typeof Feather.glyphMap;
  placeholder?: string;
  style?: ViewStyle;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, value, onChangeText, onBlur, error, disabled, required, optional, iconLeft, placeholder, style, ...props }, ref) => {
    const theme = useTheme();
    const hasError = Boolean(error);
    const [isFocused, setIsFocused] = useState(false);
    const ringProgress = useFocusRing({ focused: isFocused, hasError });

    // The error ring replaces the green focus ring rather than layering on it.
    const borderColor = hasError ? theme.error : isFocused ? theme.accent : theme.border;
    const iconColor = hasError ? theme.error : isFocused ? theme.accent : theme.subtext;

    return (
      <View style={[styles.field, style]}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>
            {label}
            {required && <Text style={[styles.asterisk, { color: theme.error }]}> *</Text>}
            {optional && (
              <Text style={[styles.optionalLabel, { color: theme.subtext }]}>Optional</Text>
            )}
          </Text>
        </View>

        <View style={styles.wrapper}>
          <View
            style={[
              styles.inputContainer,
              { borderColor, backgroundColor: theme.inputBg },
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
              onFocus={() => setIsFocused(true)}
              onBlur={() => { setIsFocused(false); onBlur?.(); }}
              editable={!disabled}
              placeholder={placeholder}
              placeholderTextColor={theme.placeholder}
              style={[
                styles.input,
                { color: theme.ink, fontFamily: Typography.fontFamily },
                disabled && styles.inputDisabled,
              ]}
              {...props}
            />
          </View>

          <FocusRing progress={ringProgress} hasError={hasError} radius={Radii.input} />
        </View>

        {hasError && (
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  field: {
    marginBottom: Spacing.lg,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamilySemiBold,
    color: '#17211F',
  } as TextStyle,
  asterisk: {
    marginLeft: 2,
  },
  optionalLabel: {
    marginLeft: Spacing.sm,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamilyMedium,
    opacity: 0.7,
  } as TextStyle,
  wrapper: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radii.input,
    minHeight: 56,
    paddingHorizontal: Spacing.md,
  } as ViewStyle,
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
    fontSize: Typography.fontSize.md,
    minHeight: 56,
  } as TextStyle,
  inputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamilyMedium,
  } as TextStyle,
});
