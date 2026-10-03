import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface AirmailStripeProps {
  style?: ViewStyle;
}

export const AirmailStripe: React.FC<AirmailStripeProps> = ({ style }) => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.accent }, style]} />
  );
};

const styles = StyleSheet.create({
  container: {
    height: 4,
  },
});