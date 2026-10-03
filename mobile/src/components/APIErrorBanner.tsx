import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme, Radii, Spacing, Typography } from '../theme';

interface APIErrorBannerProps {
  message: string;
  onDismiss: () => void;
  testID?: string;
}

export const APIErrorBanner: React.FC<APIErrorBannerProps> = ({
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
        <Text style={[
          styles.message,
          { color: theme.error, fontFamily: Typography.fontFamily },
        ]}>
          {message}
        </Text>
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
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily,
    lineHeight: Typography.lineHeight.base * Typography.fontSize.sm,
  },
  dismissButton: {
    padding: Spacing.xs,
    flexShrink: 0,
  },
});