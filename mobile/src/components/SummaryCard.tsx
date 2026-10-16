import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { Card } from './Card';
import { useTheme, Spacing, Typography } from '../theme';

interface SummaryCardProps {
  name: string;
  phone: string;
  email: string;
  recipient: string;
  testID?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ name, phone, email, recipient, testID }) => {
  const theme = useTheme();

  const deliveryBy = name || 'Not entered';
  const phoneValue = phone || 'None';
  const emailValue = email || 'None';
  const recipientValue = recipient || 'None';

  return (
    <Card padding="md" style={styles.card} testID={testID}>
      <AppText variant="cardTitle" weight="bold" color={theme.ink} style={styles.title}>
        Delivery summary
      </AppText>
      <View style={styles.divider} />
      <View style={styles.row}>
        <AppText variant="xs" weight="medium" color={theme.sub} style={styles.label}>
          Delivered by
        </AppText>
        <AppText variant="sm" weight="semibold" color={theme.ink} style={styles.value}>
          {deliveryBy}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="xs" weight="medium" color={theme.sub} style={styles.label}>
          Phone
        </AppText>
        <AppText variant="sm" weight="semibold" color={theme.ink} style={styles.value}>
          {phoneValue}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="xs" weight="medium" color={theme.sub} style={styles.label}>
          Email
        </AppText>
        <AppText variant="sm" weight="semibold" color={theme.ink} style={styles.value}>
          {emailValue}
        </AppText>
      </View>
      <View style={styles.row}>
        <AppText variant="xs" weight="medium" color={theme.sub} style={styles.label}>
          Recipient
        </AppText>
        <AppText variant="sm" weight="semibold" color={theme.ink} style={styles.value}>
          {recipientValue}
        </AppText>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 320,
    flexShrink: 0,
  },
  title: {
    marginBottom: Spacing.md,
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'column',
    marginBottom: Spacing.md,
  },
  label: {
    marginBottom: 2,
  },
  value: {
    lineHeight: Math.round(Typography.fontSize.sm * Typography.lineHeight.base),
  },
});

export default SummaryCard;