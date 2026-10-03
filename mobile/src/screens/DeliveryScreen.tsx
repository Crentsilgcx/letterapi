import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  RefreshControl,
  View,
  Text,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useDeliveryForm } from '../hooks/useDeliveryForm';
import { usePositions } from '../hooks/usePositions';
import { useRecentPositions } from '../hooks/useRecentPositions';
import { api } from '../services/api';
import { API_BASE_URL, IS_EMULATOR_LOOPBACK } from '../config/api';
import {
  Input,
  Button,
  Card,
  CardHeader,
  AirmailStripe,
  APIErrorBanner,
  SuccessBottomSheet,
  PositionField,
  PositionPicker,
} from '../components';
import { useTheme, Radii, Spacing, Typography } from '../theme';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

// The form is centred and capped so it stays readable on a tablet instead of
// stretching across the full width.
const MAX_CONTENT_WIDTH = 680;
const TABLET_MIN_WIDTH = 600;

export const DeliveryScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans_400Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans_500Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans_600SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans_700Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans_800ExtraBold': PlusJakartaSans_800ExtraBold,
  });

  if (__DEV__ && IS_EMULATOR_LOOPBACK) {
    console.warn('[Delivery] Using the Android emulator loopback - unreachable from a physical device.');
  }
  if (__DEV__ && !API_BASE_URL) {
    console.warn('[Delivery] No API base URL configured.');
  }

  // Local-first: the predefined positions are on screen from the first frame and
  // are only ever widened by the background sync.
  const { positions, isSyncing, syncNow } = usePositions();
  const { recentPositions, rememberPosition } = useRecentPositions();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastReference, setLastReference] = useState<string | null>(null);
  const [lastSubmittedPosition, setLastSubmittedPosition] = useState('');

  const handleFormSubmit = useCallback(
    async (payload: Parameters<typeof api.createDelivery>[0]) => {
      const response = await api.createDelivery(payload);
      setLastReference(response.trackingNumber);
      setLastSubmittedPosition(payload.recipientPosition);
      setShowSuccess(true);
    },
    []
  );

  const {
    values,
    errors,
    touched,
    isSubmitting,
    submitMessage,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setSubmitMessage,
  } = useDeliveryForm(handleFormSubmit);

  const handleSelectPosition = useCallback(
    (value: string) => {
      handleChange('recipientPosition', value);
      handleBlur('recipientPosition');
      rememberPosition(value);
    },
    [handleBlur, handleChange, rememberPosition]
  );

  const handleStartNewDelivery = useCallback(() => {
    setShowSuccess(false);
    setLastReference(null);
    setLastSubmittedPosition('');
    resetForm();
  }, [resetForm]);

  const handleRefresh = useCallback(() => {
    syncNow(true);
  }, [syncNow]);

  // Only the in-flight state disables the button, so an incomplete form still
  // surfaces its validation errors instead of silently ignoring the tap.
  // Re-entrancy is prevented separately by the form hook.
  const canSubmit = !isSubmitting;

  const contentWidth = isTablet
    ? Math.min(width - Spacing.xl * 2, MAX_CONTENT_WIDTH)
    : width - Spacing.lg * 2;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {
        // Nothing to hide when the splash screen is not installed.
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
      keyboardVerticalOffset={insets.top}
    >
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingHorizontal: isTablet ? Spacing.xl : Spacing.lg,
              paddingBottom: Spacing.xl + 96 + insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isSyncing}
              onRefresh={handleRefresh}
              colors={[theme.accent]}
              tintColor={theme.accent}
              accessibilityLabel="Refresh recipient positions"
            />
          }
          testID="delivery-scroll-view"
        >
          <View style={[styles.pageHeader, { width: contentWidth }]}>
            <View style={styles.headerText}>
              <Text
                style={[
                  styles.pageTitle,
                  {
                    color: theme.ink,
                    fontFamily: Typography.fontFamilyExtraBold,
                    fontSize: Typography.fontSize.xxxl,
                    letterSpacing: Typography.letterSpacing.tight,
                  },
                ]}
              >
                Letter Delivery
              </Text>
              <Text
                style={[
                  styles.pageSubtitle,
                  { color: theme.subtext, fontFamily: Typography.fontFamily, fontSize: Typography.fontSize.md },
                ]}
              >
                Log a new delivery
              </Text>
            </View>

            <Pressable
              style={[
                styles.settingsButton,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              onPress={handleRefresh}
              accessibilityRole="button"
              accessibilityLabel="Refresh recipient positions"
              accessibilityHint="Checks the server for recipient positions added since the last sync"
              android_ripple={{ color: theme.accent, borderless: true }}
              testID="settings-button"
            >
              <Feather name="refresh-cw" size={20} color={theme.ink} />
            </Pressable>
          </View>

          <View style={[styles.formCardWrapper, { width: contentWidth }]}>
            <Card style={styles.formCard} padding="none" testID="delivery-form-card">
              <AirmailStripe />
              <CardHeader title="Delivery person" subtitle="Who is dropping off the letter?" />

              <View style={styles.cardBody}>
                {submitMessage?.type === 'error' && (
                  <APIErrorBanner
                    message={submitMessage.text}
                    onDismiss={() => setSubmitMessage(null)}
                    testID="delivery-error-banner"
                  />
                )}

                <Input
                  label="Delivery person name"
                  value={values.fullName}
                  onChangeText={(text) => handleChange('fullName', text)}
                  onBlur={() => handleBlur('fullName')}
                  error={touched.fullName ? errors.fullName : undefined}
                  required
                  placeholder="e.g. Kwame Mensah"
                  maxLength={160}
                  autoCapitalize="words"
                  iconLeft="user"
                  accessibilityLabel="Delivery person name, required"
                  testID="fullName-input"
                />

                <Input
                  label="Phone"
                  value={values.phone}
                  onChangeText={(text) => handleChange('phone', text)}
                  onBlur={() => handleBlur('phone')}
                  error={touched.phone ? errors.phone : undefined}
                  placeholder="024 000 0000"
                  keyboardType="phone-pad"
                  maxLength={60}
                  iconLeft="phone"
                  optional
                  accessibilityLabel="Phone number, optional"
                  testID="phone-input"
                />

                <Input
                  label="Email"
                  value={values.email}
                  onChangeText={(text) => handleChange('email', text)}
                  onBlur={() => handleBlur('email')}
                  error={touched.email ? errors.email : undefined}
                  placeholder="name@mail.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={180}
                  iconLeft="mail"
                  optional
                  accessibilityLabel="Email address, optional"
                  testID="email-input"
                />

                <PositionField
                  label="Recipient position"
                  value={values.recipientPosition}
                  placeholder="Select position"
                  error={touched.recipientPosition ? errors.recipientPosition : undefined}
                  required
                  expanded={isPickerOpen}
                  onPress={() => setIsPickerOpen(true)}
                  accessibilityLabel="Recipient position, required"
                  testID="recipientPosition-field"
                />
              </View>
            </Card>
          </View>
        </ScrollView>

        <View
          style={[
            styles.bottomActionBar,
            {
              backgroundColor: theme.bg,
              borderTopColor: theme.border,
              paddingBottom: Spacing.lg + insets.bottom,
            },
          ]}
        >
          <View style={[styles.bottomActionContent, { width: contentWidth }]}>
            <Button
              title={isSubmitting ? 'Submitting...' : 'Deliver letter'}
              onPress={handleSubmit}
              disabled={!canSubmit}
              variant="full"
              loading={isSubmitting}
              iconLeft="send"
              accessibilityLabel="Deliver letter"
              accessibilityHint="Logs this letter and shows its reference code"
              testID="submit-button"
            />
          </View>
        </View>
      </SafeAreaView>

      <PositionPicker
        visible={isPickerOpen}
        value={values.recipientPosition}
        positions={positions}
        recentPositions={recentPositions}
        onSelect={handleSelectPosition}
        onClose={() => setIsPickerOpen(false)}
        testID="position-picker"
      />

      <SuccessBottomSheet
        visible={showSuccess}
        onClose={handleStartNewDelivery}
        position={lastSubmittedPosition}
        trackingNumber={lastReference}
        testID="success-bottom-sheet"
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Spacing.lg,
    alignItems: 'center',
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  pageTitle: {
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {},
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: Radii.input,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCardWrapper: {
    alignSelf: 'center',
  },
  formCard: {
    width: '100%',
  },
  cardBody: {
    paddingHorizontal: 18,
    paddingBottom: Spacing.lg,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  bottomActionContent: {
    alignSelf: 'center',
  },
});