import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useDeliveryForm } from '../hooks/useDeliveryForm';
import { api } from '../services/api';
import { API_BASE_URL, IS_EMULATOR_LOOPBACK } from '../config/api';
import {
  InputField,
  Button,
  Card,
  CardHeader,
  SuccessBanner,
  ErrorBanner,
  SummaryCard,
  SuccessBottomSheet,
  AppText,
} from '../components';
import { useTheme, Spacing, Radii } from '../theme';
import { POSITIONS } from '../constants/positions';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Feather } from '@expo/vector-icons';

const MAX_CONTENT_WIDTH = 560;
const LARGE_CONTENT_WIDTH = 980;
const TABLET_MIN_WIDTH = 600;
const LARGE_TABLET_MIN_WIDTH = 960;
const SUMMARY_WIDTH = 320;
const BOTTOM_ACTION_BAR_HEIGHT = 72; // Approximate height of the bottom action bar
const KEYBOARD_GAP = 20; // 16-24px gap between input and keyboard

export const DeliveryScreen: React.FC = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height: screenHeight } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN_WIDTH;
  const isLargeTablet = width >= LARGE_TABLET_MIN_WIDTH;

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans_400Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans_500Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans_600SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans_700Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans_800ExtraBold': PlusJakartaSans_800ExtraBold,
  });

  // Refs for keyboard-aware scrolling
  const scrollViewRef = useRef<ScrollView>(null);
  const fullNameRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);

  const setFullNameRef = useCallback((node: TextInput | null) => {
    fullNameRef.current = node;
  }, []);
  const setPhoneRef = useCallback((node: TextInput | null) => {
    phoneRef.current = node;
  }, []);
  const setEmailRef = useCallback((node: TextInput | null) => {
    emailRef.current = node;
  }, []);

  const positionOptions = useMemo(() => POSITIONS.filter(p => p.value !== 'Other'), []);

  const scrollToInput = useCallback((ref: React.RefObject<TextInput | null>) => {
    if (!scrollViewRef.current || !ref.current) return;

    const availableHeight = screenHeight - insets.bottom - BOTTOM_ACTION_BAR_HEIGHT - KEYBOARD_GAP;

    // Use measureInWindow for accurate position relative to screen
    const node = ref.current as any;
    if (node.measureInWindow) {
      node.measureInWindow((x: number, y: number, width: number, height: number) => {
        const inputBottom = y + height;
        
        if (inputBottom > availableHeight) {
          const scrollY = inputBottom - availableHeight;
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, scrollY),
            animated: true,
          });
        }
      });
    }
  }, [insets.bottom, screenHeight]);

  const handleFullNameFocus = useCallback(() => scrollToInput(fullNameRef), [scrollToInput]);
  const handlePhoneFocus = useCallback(() => scrollToInput(phoneRef), [scrollToInput]);
  const handleEmailFocus = useCallback(() => scrollToInput(emailRef), [scrollToInput]);

  const renderPositionChips = () =>
    React.createElement(
      View,
      { style: styles.positionChipsContainer },
      React.createElement(
        AppText,
        { variant: 'sm', weight: 'semibold', color: theme.ink, style: styles.positionLabel },
        'Recipient'
      ),
      React.createElement(
        View,
        { style: styles.positionChipsWrapper },
        positionOptions.map((option) =>
          React.createElement(
            Pressable,
            {
              key: option.value,
              onPress: () => handleChange('recipient', (prev) => (prev === option.value ? '' : option.value)),
              style: ({ pressed }) => [
                styles.positionChip,
                {
                  backgroundColor: values.recipient === option.value ? theme.tint : theme.field,
                  borderColor: values.recipient === option.value ? theme.accent : theme.line,
                },
                pressed && styles.positionChipPressed,
              ],
              accessibilityRole: 'radio',
              accessibilityState: { selected: values.recipient === option.value },
              accessibilityLabel: option.label,
              testID: `position-chip-${option.value}`,
            },
            React.createElement(
              AppText,
              {
                variant: 'sm',
                weight: values.recipient === option.value ? 'semibold' : 'medium',
                color: values.recipient === option.value ? theme.accent : theme.ink,
              },
              option.label
            )
          )
        )
      ),
      touched.recipient && errors.recipient
        ? React.createElement(
            AppText,
            { variant: 'xs', weight: 'medium', color: theme.error, style: styles.positionError },
            errors.recipient
          )
        : null
    );

  if (__DEV__ && IS_EMULATOR_LOOPBACK) {
    console.warn('[Delivery] Using the Android emulator loopback - unreachable from a physical device.');
  }
  if (__DEV__ && !API_BASE_URL) {
    console.warn('[Delivery] No API base URL configured.');
  }

  const [showSuccess, setShowSuccess] = useState(false);
  const [lastReference, setLastReference] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string>('');

  const handleFormSubmit = useCallback(
    async (payload: Parameters<typeof api.createDelivery>[0]) => {
      const response = await api.createDelivery(payload);
      setLastReference(response.trackingNumber);
      setSubmittedName(payload.fullName);
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

  const handleStartNewDelivery = useCallback(() => {
    setShowSuccess(false);
    setLastReference(null);
    setSubmittedName('');
    resetForm();
  }, [resetForm]);

  const canSubmit = !isSubmitting && values.fullName.trim().length >= 2;

  const horizontalPadding = isTablet ? Spacing.xl : Spacing.md;
  const maxWidth = isLargeTablet ? LARGE_CONTENT_WIDTH : MAX_CONTENT_WIDTH;
  const contentWidth = Math.min(width - horizontalPadding * 2, maxWidth);

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

  const showSuccessBanner = showSuccess && submittedName;

  const renderFormFields = () =>
    React.createElement(
      React.Fragment,
      null,
      React.createElement(InputField, {
        ref: fullNameRef,
        label: 'Full name',
        value: values.fullName,
        onChangeText: (text) => handleChange('fullName', text),
        onBlur: () => handleBlur('fullName'),
        onFocus: handleFullNameFocus,
        error: touched.fullName ? errors.fullName : undefined,
        required: true,
        placeholder: 'e.g. Kwame Mensah',
        maxLength: 160,
        autoCapitalize: 'words',
        iconLeft: 'user',
        accessibilityLabel: 'Delivery person name, required',
        testID: 'fullName-input',
      }),
      isTablet
        ? React.createElement(
            View,
            { style: styles.tabletRow },
            React.createElement(
              View,
              { style: styles.tabletColumn },
              React.createElement(InputField, {
                ref: phoneRef,
                label: 'Phone',
                value: values.phone,
                onChangeText: (text) => handleChange('phone', text),
                onBlur: () => handleBlur('phone'),
                onFocus: handlePhoneFocus,
                error: touched.phone ? errors.phone : undefined,
                optional: true,
                placeholder: '024 000 0000',
                keyboardType: 'phone-pad',
                maxLength: 60,
                iconLeft: 'phone',
                accessibilityLabel: 'Phone number, optional',
                testID: 'phone-input',
              })
            ),
            React.createElement(
              View,
              { style: styles.tabletColumn },
              React.createElement(InputField, {
                ref: emailRef,
                label: 'Email',
                value: values.email,
                onChangeText: (text) => handleChange('email', text),
                onBlur: () => handleBlur('email'),
                onFocus: handleEmailFocus,
                error: touched.email ? errors.email : undefined,
                optional: true,
                placeholder: 'name@mail.com',
                keyboardType: 'email-address',
                autoCapitalize: 'none',
                autoCorrect: false,
                maxLength: 180,
                iconLeft: 'mail',
                accessibilityLabel: 'Email address, optional',
                testID: 'email-input',
              })
            )
          )
        : React.createElement(
            React.Fragment,
            null,
            React.createElement(InputField, {
              ref: phoneRef,
              label: 'Phone',
              value: values.phone,
              onChangeText: (text) => handleChange('phone', text),
              onBlur: () => handleBlur('phone'),
              onFocus: handlePhoneFocus,
              error: touched.phone ? errors.phone : undefined,
              optional: true,
              placeholder: '024 000 0000',
              keyboardType: 'phone-pad',
              maxLength: 60,
              iconLeft: 'phone',
              accessibilityLabel: 'Phone number, optional',
              testID: 'phone-input',
            }),
            React.createElement(InputField, {
              ref: emailRef,
              label: 'Email',
              value: values.email,
              onChangeText: (text) => handleChange('email', text),
              onBlur: () => handleBlur('email'),
              onFocus: handleEmailFocus,
              error: touched.email ? errors.email : undefined,
              optional: true,
              placeholder: 'name@mail.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
              autoCorrect: false,
              maxLength: 180,
              iconLeft: 'mail',
              accessibilityLabel: 'Email address, optional',
              testID: 'email-input',
            })
          ),
      renderPositionChips()
    );

  return React.createElement(
    KeyboardAvoidingView,
    {
      behavior: Platform.OS === 'ios' ? 'padding' : 'height',
      style: [styles.container, { backgroundColor: theme.page }],
      keyboardVerticalOffset: insets.top,
    },
    React.createElement(
      SafeAreaView,
      { style: styles.safeArea, edges: ['top', 'left', 'right'] },
      React.createElement(
        ScrollView,
        {
          ref: scrollViewRef,
          contentContainerStyle: [
            styles.scrollContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + KEYBOARD_GAP + 40,
            },
          ],
          showsVerticalScrollIndicator: false,
          keyboardShouldPersistTaps: 'handled',
          testID: 'delivery-scroll-view',
        },
        React.createElement(
          View,
          { style: [styles.pageHeader, { width: contentWidth }] },
          React.createElement(
            View,
            { style: styles.headerLeft },
            React.createElement(
              View,
              {
                style: [styles.headerIcon, { backgroundColor: theme.tint, width: 40, height: 40, borderRadius: 12 }],
              },
              React.createElement(Feather, { name: 'mail', size: 20, color: theme.accent })
            ),
            React.createElement(
              View,
              { style: styles.headerText },
              React.createElement(
                AppText,
                {
                  variant: isTablet ? 'pageTitleTablet' : 'pageTitlePhone',
                  weight: 'extrabold',
                  color: theme.ink,
                  letterSpacing: 'tightTitle',
                  style: styles.pageTitle,
                },
                'New delivery'
              ),
              React.createElement(
                AppText,
                { variant: 'sm', weight: 'regular', color: theme.sub, style: styles.pageSubtitle },
                'Log a letter dropped off at the desk'
              )
            )
          )
        ),
        isLargeTablet
          ? React.createElement(
              View,
              { style: [styles.largeTabletLayout, { width: contentWidth }] },
              React.createElement(
                View,
                { style: styles.formColumn },
                React.createElement(
                  Card,
                  { style: styles.formCard, padding: 'none', testID: 'delivery-form-card' },
                  React.createElement(CardHeader, {
                    title: 'Delivery person',
                    subtitle: 'Who is dropping off the letter?',
                    icon: 'user',
                  }),
                  React.createElement(
                    View,
                    { style: styles.cardBody },
                    showSuccessBanner
                      ? React.createElement(SuccessBanner, { name: submittedName, testID: 'success-banner' })
                      : null,
                    submitMessage?.type === 'error'
                      ? React.createElement(ErrorBanner, {
                          message: submitMessage.text,
                          onDismiss: () => setSubmitMessage(null),
                          testID: 'delivery-error-banner',
                        })
                      : null,
                    renderFormFields()
                  )
                )
              ),
              React.createElement(
                View,
                { style: styles.summaryColumn },
                React.createElement(SummaryCard, {
                  name: values.fullName,
                  phone: values.phone,
                  email: values.email,
                  recipient: values.recipient,
                  testID: 'summary-card',
                })
              )
            )
          : React.createElement(
              View,
              { style: [styles.formCardWrapper, { width: contentWidth }] },
              React.createElement(
                Card,
                { style: styles.formCard, padding: 'none', testID: 'delivery-form-card' },
                React.createElement(CardHeader, {
                  title: 'Delivery person',
                  subtitle: 'Who is dropping off the letter?',
                  icon: 'user',
                }),
                React.createElement(
                  View,
                  { style: styles.cardBody },
                  showSuccessBanner
                    ? React.createElement(SuccessBanner, { name: submittedName, testID: 'success-banner' })
                    : null,
                  submitMessage?.type === 'error'
                    ? React.createElement(ErrorBanner, {
                        message: submitMessage.text,
                        onDismiss: () => setSubmitMessage(null),
                        testID: 'delivery-error-banner',
                      })
                    : null,
                  renderFormFields()
                )
              )
            )
      ),
      React.createElement(
        View,
        {
          style: [
            styles.bottomActionBar,
            {
              backgroundColor: theme.page,
              paddingBottom: Spacing.md + insets.bottom,
              paddingHorizontal: horizontalPadding,
              paddingTop: Spacing.sm,
              borderTopColor: theme.line,
            },
          ],
        },
        React.createElement(
          View,
          { style: [styles.bottomActionContent, { width: contentWidth }] },
          React.createElement(Button, {
            title: 'Deliver letter',
            onPress: handleSubmit,
            disabled: !canSubmit,
            variant: isTablet ? 'primary' : 'full',
            loading: isSubmitting,
            iconLeft: 'send',
            accessibilityLabel: 'Deliver letter',
            accessibilityHint: 'Logs this letter and shows its reference code',
            testID: 'submit-button',
            style: isTablet ? styles.tabletButton : undefined,
          })
        )
      )
    ),
    React.createElement(SuccessBottomSheet, {
      visible: showSuccess,
      onClose: handleStartNewDelivery,
      position: submittedName,
      trackingNumber: lastReference,
      testID: 'success-bottom-sheet',
    })
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  tabletRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  tabletColumn: {
    flex: 1,
    minWidth: 0,
  },
  largeTabletLayout: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'flex-start',
  },
  formColumn: {
    flex: 1,
    minWidth: 0,
  },
  summaryColumn: {
    width: SUMMARY_WIDTH,
    flexShrink: 0,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  bottomActionContent: {
    alignSelf: 'center',
  },
  tabletButton: {
    minWidth: 260,
    alignSelf: 'flex-end',
  },
  positionChipsContainer: {
    marginBottom: Spacing.lg,
  },
  positionLabel: {
    marginBottom: Spacing.xs,
  },
  positionChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    rowGap: Spacing.xs,
  },
  positionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.input,
    borderWidth: 1.5,
    minHeight: 40,
    justifyContent: 'center',
  },
  positionChipPressed: {
    opacity: 0.85,
  },
  positionError: {
    marginTop: Spacing.xs,
  },
});

export default DeliveryScreen;