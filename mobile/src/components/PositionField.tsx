import React from 'react';
import { View, Text, Pressable, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FocusRing, useFocusRing } from './FocusRing';
import { useTheme, Radii, Spacing, Typography } from '../theme';

interface PositionFieldProps {
  label: string;
  value: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  expanded?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Recipient position field.
 *
 * A single read-only field that opens the grouped picker - the mobile
 * counterpart of the web form's grouped <select>. The same focus/error ring is
 * used so a validation failure looks identical everywhere in the app.
 */
export const PositionField: React.FC<PositionFieldProps> = ({
  label,
  value,
  placeholder = 'Select position',
  error,
  required = false,
  expanded = false,
  onPress,
  accessibilityLabel,
  testID,
}) => {
  const theme = useTheme();
  const hasError = Boolean(error);
  const ringProgress = useFocusRing({ focused: expanded, hasError });

  const borderColor = hasError ? theme.error : expanded ? theme.accent : theme.border;
  const displayValue = value || placeholder;
  const isPlaceholder = !value;

  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={[styles.asterisk, { color: theme.error }]}> *</Text>}
      </Text>

      <View style={styles.wrapper}>
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [
            styles.control,
            { borderColor, backgroundColor: theme.inputBg },
            pressed && styles.controlPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? `${label}, required`}
          accessibilityHint="Opens the recipient position picker"
          accessibilityState={{ expanded }}
          testID={testID}
        >
          <Feather name="briefcase" size={20} color={hasError ? theme.error : theme.subtext} style={styles.icon} />
          <Text
            style={[
              styles.value,
              {
                color: isPlaceholder ? theme.placeholder : theme.ink,
                fontFamily: isPlaceholder ? Typography.fontFamily : Typography.fontFamilySemiBold,
              },
            ]}
            numberOfLines={1}
          >
            {displayValue}
          </Text>
          <Feather name="chevron-down" size={20} color={theme.subtext} />
        </Pressable>

        <FocusRing progress={ringProgress} hasError={hasError} radius={Radii.input} />
      </View>

      {hasError && <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamilySemiBold,
    marginBottom: Spacing.xs,
  } as TextStyle,
  asterisk: {
    marginLeft: 2,
  },
  wrapper: {
    position: 'relative',
  },
  control: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radii.input,
    minHeight: 52,
    paddingHorizontal: 14,
  } as ViewStyle,
  controlPressed: {
    opacity: 0.85,
  },
  icon: {
    width: 20,
    marginRight: 10,
  },
  value: {
    flex: 1,
    minWidth: 0,
    fontSize: Typography.fontSize.md,
    marginRight: Spacing.sm,
  } as TextStyle,
  errorText: {
    marginTop: Spacing.xs,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamilyMedium,
  } as TextStyle,
});

export default PositionField;
