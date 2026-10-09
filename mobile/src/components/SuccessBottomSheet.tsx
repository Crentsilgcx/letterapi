import React from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ViewStyle, TextStyle, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, Radii, Spacing, Typography, Shadows } from '../theme';

interface SuccessBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  position?: string;
  trackingNumber?: string | null;
  testID?: string;
}

/**
 * Success state after a delivery is accepted.
 *
 * The backend generates the reference / tracking code, so it is surfaced here as
 * the single identifier for the letter. `selectable` keeps it copyable on a
 * device without adding a clipboard native module.
 */
export const SuccessBottomSheet: React.FC<SuccessBottomSheetProps> = ({
  visible,
  onClose,
  position,
  trackingNumber,
  testID,
}) => {
  const theme = useTheme();

  React.useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);

  const handleClose = () => {
    Haptics.selectionAsync();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      animationType="slide"
      transparent
      visible
      onRequestClose={handleClose}
      testID={testID}
    >
      <Pressable
        style={styles.overlay}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Close success dialog"
      >
        <View
          style={[
            styles.sheet,
            { backgroundColor: theme.card },
            Platform.OS === 'android' ? Shadows.cardDark : Shadows.card,
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>

          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: theme.accentTint }]}>
              <Feather name="check" size={28} color={theme.accent} />
            </View>
          </View>

          <Text style={[styles.title, { color: theme.ink, fontFamily: Typography.fontFamilyBold }]}>
            Letter delivered successfully
          </Text>

          <Text style={[styles.message, { color: theme.subtext, fontFamily: Typography.fontFamily }]}>
            {position
              ? `Logged for the ${position}. Keep the code below for the recipient.`
              : 'Keep the code below for the recipient.'}
          </Text>

          {trackingNumber ? (
            <View
              style={[styles.trackingContainer, { backgroundColor: theme.accentTint, borderColor: theme.accent }]}
            >
              <Text
                style={[styles.trackingLabel, { color: theme.accentStrong, fontFamily: Typography.fontFamilyMedium }]}
              >
                Reference / Tracking Code
              </Text>
              <Text
                style={[styles.trackingNumber, { color: theme.accentStrong }]}
                selectable
                accessibilityLabel={`Reference code ${trackingNumber}`}
                testID="reference-code"
              >
                {trackingNumber}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[styles.button, { backgroundColor: theme.accent }]}
            onPress={handleClose}
            android_ripple={{ color: theme.accentText, borderless: false }}
            accessibilityRole="button"
            accessibilityLabel="Log another delivery"
            testID="log-another-button"
          >
            <Text style={[styles.buttonText, { color: theme.accentText, fontFamily: Typography.fontFamilyBold }]}>
              OK
            </Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radii.card,
    borderTopRightRadius: Radii.card,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xl,
    textAlign: 'center',
    marginBottom: Spacing.xs,
    letterSpacing: Typography.letterSpacing.tight,
  } as TextStyle,
  message: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily,
    textAlign: 'center',
    lineHeight: Math.round(Typography.fontSize.md * Typography.lineHeight.relaxed),
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  } as TextStyle,
  trackingContainer: {
    borderRadius: Radii.input,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  } as ViewStyle,
  trackingLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  } as TextStyle,
  trackingNumber: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamilyExtraBold,
    letterSpacing: 1,
    textAlign: 'center',
  } as TextStyle,
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radii.button,
    minHeight: 56,
  },
  buttonText: {
    fontSize: Typography.fontSize.md,
  } as TextStyle,
});
