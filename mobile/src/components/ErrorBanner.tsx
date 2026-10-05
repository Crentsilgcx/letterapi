import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme, Radii, Spacing, Typography } from '../theme';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
  testID?: string;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  message,
  onDismiss,
  testID,
}) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.errorBg, borderColor: theme.error }]} testID={testID}>
      <View style={styles.content}>
        <Feather
          name="alert-circle"
          size={20}
          color={theme.error}
          style={styles.icon}
        />
        <AppText variant="sm" weight="medium" color={theme.error} style={styles.message}>
          {message}
        </AppText>
      </View>
      <Pressable
        onPress={onDismiss}
        style={styles.dismissButton}
        accessibilityRole="button"
        accessibilityLabel="Dismiss error"
        android_ripple={{ color: theme.error, borderless: true }}
      >
        <Feather name="x" size={18} color={theme.error} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.input,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.sm,
  },
  icon: {
    flexShrink: 0,
  },
  message: {
    lineHeight: Math.round(Typography.fontSize.sm * Typography.lineHeight.base),
  },
  dismissButton: {
    padding: Spacing.xs,
    flexShrink: 0,
  },
});

export default ErrorBanner;