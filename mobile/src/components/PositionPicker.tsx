import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  SectionList,
  Modal,
  Animated,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  AccessibilityInfo,
  SectionListData,
  SectionListRenderItem,
  type DimensionValue,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppText } from './AppText';
import { AppTextInput } from './AppTextInput';
import { useTheme, Radii, Spacing, Shadows, Transition } from '../theme';
import { OTHER_GROUP, PositionOption, groupPositions } from '../constants/positions';

type DeviceType = 'phone' | 'tablet';

export const RECENT_GROUP = 'Recently used';

interface PositionPickerProps {
  visible: boolean;
  value: string;
  positions: PositionOption[];
  recentPositions?: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
  testID?: string;
}

const DIALOG_WIDTH = 520;
const PHONE_SHEET_MAX_HEIGHT = 0.85;
const TABLET_DIALOG_MAX_HEIGHT = 0.8;

export const PositionPicker: React.FC<PositionPickerProps> = ({
  visible,
  value,
  positions,
  recentPositions = [],
  onSelect,
  onClose,
  testID,
}) => {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width >= 600;
  const deviceType: DeviceType = isTablet ? 'tablet' : 'phone';

  const [searchQuery, setSearchQuery] = useState('');
  const [reduceMotionRef] = useState({ current: false });

  const recentSet = useMemo(() => new Set(recentPositions), [recentPositions]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        reduceMotionRef.current = enabled;
      })
      .catch(() => {
        reduceMotionRef.current = false;
      });
  }, [reduceMotionRef]);

  // Search first, then recent, then the grouped sections. The `Other` group is
  // always last because groupPositions() preserves the group order.
  const sections = useMemo<SectionListData<PositionOption>[]>(() => {
    const query = searchQuery.trim().toLowerCase();

    if (query) {
      const matches = positions.filter((position) =>
        position.label.toLowerCase().includes(query) || position.value.toLowerCase().includes(query)
      );
      return matches.length > 0 ? [{ title: 'Results', data: matches }] : [];
    }

    const result: SectionListData<PositionOption>[] = [];

    const recent = positions.filter((position) => recentSet.has(position.value));
    if (recent.length > 0) {
      result.push({ title: RECENT_GROUP, data: recent });
    }

    return [...result, ...groupPositions(positions).map(({ group, positions: items }) => ({ title: group, data: items }))];
  }, [positions, recentSet, searchQuery]);

  const hasMatches = sections.length > 0;

  const otherOption = useMemo(
    () => positions.find((position) => position.group === OTHER_GROUP) ?? null,
    [positions]
  );

  const [slideAnim] = useState(() => new Animated.Value(isTablet ? 0 : 1));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const dismiss = useCallback(() => {
    if (reduceMotionRef.current) {
      onClose();
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: Transition.fast, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: isTablet ? 0 : 1, duration: Transition.fast, useNativeDriver: true }),
    ]).start(() => onClose());
  }, [fadeAnim, isTablet, onClose, reduceMotionRef, slideAnim]);

  useEffect(() => {
    if (!visible) return;

    if (reduceMotionRef.current) {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: Transition.fast, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: Transition.normal, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, reduceMotionRef, slideAnim, visible]);

  const handleSelect = useCallback(
    (positionValue: string) => {
      Haptics.selectionAsync();
      onSelect(positionValue);
      dismiss();
    },
    [dismiss, onSelect]
  );

  const handleClearSearch = useCallback(() => setSearchQuery(''), []);

  const renderItem: SectionListRenderItem<PositionOption> = useCallback(
    ({ item }) => {
      const isSelected = value === item.value;
      return (
        <Pressable
          onPress={() => handleSelect(item.value)}
          style={({ pressed }) => [
            styles.row,
            { backgroundColor: isSelected ? theme.accentTint : pressed ? theme.accentTint : 'transparent' },
          ]}
          accessibilityRole="radio"
          accessibilityState={{ selected: isSelected, checked: isSelected }}
          accessibilityLabel={item.label}
          android_ripple={{ color: theme.accentTint }}
          testID={`position-option-${item.value}`}
        >
          <AppText
            variant="md"
            weight={isSelected ? 'semibold' : 'medium'}
            color={isSelected ? theme.accent : theme.ink}
            style={styles.rowText}
          >
            {item.label}
          </AppText>
          {isSelected && <Feather name="check" size={20} color={theme.accent} />}
        </Pressable>
      );
    },
    [handleSelect, theme, value]
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<PositionOption> }) => (
      <View style={[styles.sectionHeader, { backgroundColor: theme.card }]}>
        <AppText variant="xs" weight="semibold" color={theme.subtext} style={styles.sectionTitle}>
          {section.title}
        </AppText>
      </View>
    ),
    [theme]
  );

  if (!visible) {
    return null;
  }

  const body = (
    <>
      <View style={styles.header}>
        {deviceType === 'phone' && (
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />
          </View>
        )}
        <AppText variant="xl" weight="bold" color={theme.ink} style={styles.title}>
          Recipient position
        </AppText>
      </View>

      <AppTextInput
        label="Search positions"
        placeholder="Search positions"
        value={searchQuery}
        onChangeText={setSearchQuery}
        iconLeft="search"
        autoFocus
        returnKeyType="done"
        wrapperStyle={styles.search}
        accessibilityLabel="Search positions"
        testID="position-picker-search"
      />

      {!hasMatches ? (
        <View style={styles.noMatches}>
          <AppText variant="md" weight="semibold" color={theme.ink} align="center">
            No positions match
          </AppText>
          <AppText variant="sm" weight="regular" color={theme.subtext} align="center">
            Use Other to record a position that is not on this list.
          </AppText>
          {otherOption && (
            <Pressable
              onPress={() => handleSelect(otherOption.value)}
              style={[styles.useOtherButton, { borderColor: theme.accent }]}
              accessibilityRole="button"
              accessibilityLabel={`Select ${otherOption.label}`}
              testID="position-picker-use-other"
            >
              <AppText variant="md" weight="semibold" color={theme.accent}>
                Use Other
              </AppText>
            </Pressable>
          )}
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.value}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          stickySectionHeadersEnabled
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            searchQuery ? (
              <Pressable
                onPress={handleClearSearch}
                style={styles.clearSearch}
                accessibilityRole="button"
                accessibilityLabel="Clear position search"
              >
                <AppText variant="sm" weight="semibold" color={theme.accent}>
                  Clear search
                </AppText>
              </Pressable>
            ) : null
          }
        />
      )}
    </>
  );

  if (deviceType === 'phone') {
    return (
      <Modal animationType="none" transparent visible onRequestClose={dismiss} testID={testID}>
        <Animated.View style={[styles.phoneOverlay, { opacity: fadeAnim }]}>
          <Pressable
            style={styles.overlayDismiss}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel="Close position picker"
          />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <Animated.View
              style={[
                styles.phoneSheet,
                {
                  backgroundColor: theme.card,
                  paddingBottom: Math.max(insets.bottom, Spacing.xl),
                  transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, height] }) }],
                },
                Platform.OS === 'android' ? Shadows.cardDark : Shadows.card,
              ]}
            >
              {body}
            </Animated.View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>
    );
  }

  return (
    <Modal animationType="none" transparent visible onRequestClose={dismiss} testID={testID}>
      <Animated.View style={[styles.tabletOverlay, { opacity: fadeAnim }]}>
        <Pressable
          style={styles.overlayDismiss}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="Close position picker"
        />
        <Animated.View
          style={[
            styles.tabletDialog,
            {
              width: Math.min(DIALOG_WIDTH, width - Spacing.xl * 2),
              maxHeight: height * TABLET_DIALOG_MAX_HEIGHT,
              backgroundColor: theme.card,
              transform: [{ scale: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.94] }) }],
            },
            Platform.OS === 'android' ? Shadows.cardDark : Shadows.card,
          ]}
        >
          {body}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  phoneOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  tabletOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  overlayDismiss: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  phoneSheet: {
    maxHeight: `${PHONE_SHEET_MAX_HEIGHT * 100}%` as DimensionValue,
    borderTopLeftRadius: Radii.card,
    borderTopRightRadius: Radii.card,
    overflow: 'hidden',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  tabletDialog: {
    borderRadius: Radii.card,
    overflow: 'hidden',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },

  header: {
    paddingTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  handleContainer: {
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  search: {
    marginBottom: Spacing.md,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: Spacing.md,
  },
  sectionHeader: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 52,
    paddingHorizontal: Spacing.sm,
  },
  rowText: {
    flex: 1,
    marginRight: Spacing.sm,
  },
  noMatches: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  useOtherButton: {
    marginTop: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radii.input,
    borderWidth: 1.5,
    minHeight: 48,
    justifyContent: 'center',
  },
  clearSearch: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    paddingTop: Spacing.sm,
  },
});

export default PositionPicker;
