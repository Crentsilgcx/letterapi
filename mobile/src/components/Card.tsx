import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme, Radii, Spacing, Typography, Shadows } from '../theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  testID?: string;
}

const paddingMap = {
  none: {},
  sm: { paddingBottom: Spacing.sm },
  md: { paddingBottom: Spacing.md },
  lg: { paddingBottom: Spacing.lg },
  xl: { paddingBottom: Spacing.xl },
};

export const Card: React.FC<CardProps> = ({ children, style, padding = 'xl', testID }) => {
  const theme = useTheme();

  const basePadding = {
    paddingTop: 20,
    paddingHorizontal: 18,
  };

  const contentPadding = {
    ...basePadding,
    ...paddingMap[padding],
  };

  return (
    <View style={[
      styles.card,
      { backgroundColor: theme.card, borderColor: theme.border },
      Platform.OS === 'android' ? Shadows.cardDark : Shadows.card,
      contentPadding,
      style,
    ]} testID={testID}>
      {children}
    </View>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, style }) => {
  const theme = useTheme();

  return (
    <View style={[styles.cardHeader, style]}>
      <View style={styles.cardHeaderContent}>
        <View style={styles.iconContainer}>
          <View style={[
            styles.iconBackground,
            { backgroundColor: theme.accentTint },
          ]}>
            <Feather name="mail" size={20} color={theme.accent} />
          </View>
        </View>
        <View style={styles.textContainer}>
          <Text style={[
            styles.cardTitle,
            { color: theme.ink, fontFamily: Typography.fontFamily },
          ]}>
            {title}
          </Text>
          {subtitle && <Text style={[
            styles.cardSubtitle,
            { color: theme.subtext, fontFamily: Typography.fontFamily },
          ]}>
            {subtitle}
          </Text>}
        </View>
      </View>
    </View>
  );
};

interface SectionTitleProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, style }) => {
  const theme = useTheme();

  return (
    <Text style={[
      styles.sectionTitle,
      { color: theme.ink, fontFamily: Typography.fontFamily },
      style,
    ]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radii.card,
    overflow: 'hidden',
  } as ViewStyle,
  cardHeader: {
    marginBottom: Spacing.lg,
  } as ViewStyle,
  cardHeaderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
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
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  } as TextStyle,
  cardSubtitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.regular,
  } as TextStyle,
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 2,
  } as TextStyle,
});