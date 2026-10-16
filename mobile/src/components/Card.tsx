import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme, Radii, Spacing, Typography, Shadows } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  testID?: string;
}

const paddingMap: Record<string, ViewStyle> = {
  none: {},
  sm: { paddingBottom: Spacing.sm },
  md: { paddingBottom: Spacing.md },
  lg: { paddingBottom: Spacing.lg },
  xl: { paddingBottom: Spacing.xl },
};

export const Card: React.FC<CardProps> = ({ children, style, padding = 'xl', testID }) => {
  const theme = useTheme();

  const basePadding: ViewStyle = {
    paddingTop: 20,
    paddingHorizontal: 18,
  };

  const contentPadding = {
    ...basePadding,
    ...paddingMap[padding],
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.line },
        Platform.OS === 'android' ? Shadows.card : Shadows.card,
        contentPadding,
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
  icon?: keyof typeof Feather.glyphMap;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, style, icon = 'user' }) => {
  const theme = useTheme();

  return (
    <View style={[styles.cardHeader, style]}>
      <View style={styles.cardHeaderContent}>
        <View style={styles.iconContainer}>
          <View style={[
            styles.iconBackground,
            { backgroundColor: theme.tint, borderRadius: 10, width: 36, height: 36 },
          ]}>
            <Feather name={icon} size={20} color={theme.accent} />
          </View>
        </View>
        <View style={styles.textContainer}>
          <AppText variant="cardTitle" weight="bold" color={theme.ink} style={styles.cardTitle}>
            {title}
          </AppText>
          {subtitle && <AppText variant="sm" weight="regular" color={theme.sub} style={styles.cardSubtitle}>
            {subtitle}
          </AppText>}
        </View>
      </View>
      <View style={[styles.divider, { backgroundColor: theme.line }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radii.card,
    overflow: 'hidden',
  },
  cardHeader: {
    marginBottom: 0,
    paddingBottom: 16,
  },
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: 16,
  },
  iconContainer: {
    flexShrink: 0,
  },
  iconBackground: {
    width: 40,
    height: 40,
    borderRadius: Radii.input,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
  cardSubtitle: {
    lineHeight: Math.round(Typography.fontSize.sm * Typography.lineHeight.base),
  },
  divider: {
    height: 1,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 2,
  } as ViewStyle,
});

export default Card;

export const SectionTitle: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  const theme = useTheme();

  return (
    <AppText variant="lg" weight="semibold" color={theme.ink} style={[styles.sectionTitle, style]}>
      {children}
    </AppText>
  );
};