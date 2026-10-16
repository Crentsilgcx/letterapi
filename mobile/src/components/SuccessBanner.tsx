import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme, Radii, Spacing, Typography } from '../theme';

interface SuccessBannerProps {
  name: string;
  testID?: string;
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({ name, testID }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.tint, borderColor: theme.accent }]} testID={testID}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: theme.accentTint }]}>
          <Feather name="check" size={20} color={theme.accent} />
        </View>
        <AppText variant="md" weight="medium" color={theme.ink} style={styles.message}>
          {name} delivered a letter.
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: Radii.input,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  message: {
    lineHeight: Math.round(Typography.fontSize.md * Typography.lineHeight.base),
  },
});

export default SuccessBanner;