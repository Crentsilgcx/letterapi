import React, { useEffect, useState } from 'react';
import { Animated, AccessibilityInfo, StyleSheet, ViewStyle } from 'react-native';
import { useTheme, Radii, Transition } from '../theme';

interface UseFocusRingOptions {
  focused: boolean;
  hasError?: boolean;
}

/**
 * Shared focus/error ring animation.
 *
 * A subtle green ring fades in over 150ms while a field is focused. When the
 * field is invalid the same ring turns red and stays on, so the error replaces
 * the focus treatment instead of stacking on top of it. Systems that ask for
 * reduced motion get the final state immediately.
 */
export function useFocusRing({ focused, hasError = false }: UseFocusRingOptions) {
  // A plain state holder rather than a ref: the Animated.Value only needs to
  // exist once for the lifetime of the field.
  const [progress] = useState(() => new Animated.Value(hasError || focused ? 1 : 0));

  useEffect(() => {
    const toValue = hasError || focused ? 1 : 0;

    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduced) => {
        if (cancelled) return;
        if (reduced) {
          progress.setValue(toValue);
          return;
        }
        Animated.timing(progress, {
          toValue,
          duration: Transition.fast,
          useNativeDriver: false,
        }).start();
      })
      .catch(() => {
        Animated.timing(progress, {
          toValue,
          duration: Transition.fast,
          useNativeDriver: false,
        }).start();
      });

    return () => {
      cancelled = true;
    };
  }, [focused, hasError, progress]);

  return progress;
}

interface FocusRingProps {
  progress: Animated.Value | Animated.AnimatedInterpolation<number>;
  hasError?: boolean;
  radius?: number;
}

/**
 * The ring itself. Render it as the last child of a `position: relative`
 * wrapper around the field it decorates.
 */
export const FocusRing: React.FC<FocusRingProps> = ({ progress, hasError = false, radius = Radii.input }) => {
  const theme = useTheme();

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          borderColor: hasError ? theme.error : theme.accent,
          opacity: progress,
          borderRadius: radius + 3,
        },
      ]}
    />
  );
};

FocusRing.displayName = 'FocusRing';

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderWidth: 2,
    borderRadius: Radii.input + 3,
  } as ViewStyle,
});

export default FocusRing;
