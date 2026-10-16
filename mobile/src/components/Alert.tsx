import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useTheme, Radii, Spacing, Typography } from '../theme';

type AlertType = 'success' | 'error';

interface AlertProps {
  type: AlertType;
  message: string;
  style?: ViewStyle;
}

export const Alert: React.FC<AlertProps> = ({ type, message, style }) => {
  const theme = useTheme();
  const isSuccess = type === 'success';

  return (
    <View style={[
      styles.alert,
      isSuccess ? styles.alertSuccess : styles.alertError,
      { backgroundColor: isSuccess ? theme.accentTint : theme.errorBg, borderColor: isSuccess ? theme.accent : theme.error },
      style,
    ]}>
      <Text style={[
        styles.alertText,
        { color: isSuccess ? theme.accent : theme.error, fontFamily: Typography.fontFamily },
      ]}>
        {message}
      </Text>
    </View>
  );
};

interface StatusIndicatorProps {
  status: 'DELIVERED' | 'RECEIVED' | 'PENDING' | 'FAILED';
  style?: ViewStyle;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, style }) => {
  const theme = useTheme();
  const statusStyles = {
    DELIVERED: { background: theme.accentTint, color: theme.accent, border: theme.accent },
    RECEIVED: { background: theme.accentTint, color: theme.accentStrong, border: theme.accent },
    PENDING: { background: theme.accentTint, color: theme.subtext, border: theme.border },
    FAILED: { background: theme.errorBg, color: theme.error, border: theme.error },
  };

  const s = statusStyles[status];

  return (
    <View style={[
      styles.statusIndicator,
      { backgroundColor: s.background, borderColor: s.border },
      style,
    ]}>
      <Text style={[styles.statusText, { color: s.color, fontFamily: Typography.fontFamily }]}>
        Latest delivery status: <Text style={{ fontWeight: Typography.fontWeight.bold, fontFamily: Typography.fontFamily }}>{status}</Text>
        {status === 'RECEIVED' && <Text style={{ color: s.color, fontFamily: Typography.fontFamily }}> ✓</Text>}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  alert: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.input,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  } as ViewStyle,
  alertSuccess: {} as ViewStyle,
  alertError: {} as ViewStyle,
  alertText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  } as TextStyle,
  alertTextSuccess: {} as TextStyle,
  alertTextError: {} as TextStyle,
  statusIndicator: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.input,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    alignItems: 'center',
  } as ViewStyle,
  statusText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
    textAlign: 'center',
  } as TextStyle,
});