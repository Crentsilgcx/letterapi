import * as Font from 'expo-font';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

/**
 * Single app theme.
 *
 * The app ships light only (app.json pins userInterfaceStyle to "light"), so
 * there is a single palette rather than two themes that only differ by intent.
 * Colours are the shared Letter Delivery tokens - white surfaces, green accents,
 * dark text - and every component reads them from here instead of hard-coding
 * hex values, so the palette can never drift between screens.
 */
export const AppTheme = {
  bg: '#FFFFFF',
  card: '#FFFFFF',
  ink: '#10231F',
  subtext: '#687873',
  border: '#DCE7E3',
  accent: '#0E5C4E',
  accentStrong: '#084C3F',
  accentText: '#FFFFFF',
  accentTint: '#E3F1EE',
  accentLight: '#3FC1A5',
  error: '#C0392B',
  errorBg: '#FDEDED',
  placeholder: '#8A9A95',
  inputBg: '#FFFFFF',
  inputBorder: '#DCE7E3',
  inputBorderFocused: '#0E5C4E',
  inputBgFocused: '#FFFFFF',
  disabledOpacity: 0.45,
};

export type Theme = typeof AppTheme;

export function useTheme(): Theme {
  return AppTheme;
}

export const Radii = {
  card: 22,
  input: 14,
  chip: 999,
  button: 16,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  xxxl: 48,
  xxxxl: 56,
};

export const Typography = {
  fontFamily: 'PlusJakartaSans_400Regular',
  fontFamilyMedium: 'PlusJakartaSans_500Medium',
  fontFamilySemiBold: 'PlusJakartaSans_600SemiBold',
  fontFamilyBold: 'PlusJakartaSans_700Bold',
  fontFamilyExtraBold: 'PlusJakartaSans_800ExtraBold',
  fontFamilyFallback: 'system-ui',
  fontSize: {
    xs: 11,
    sm: 13,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 26,
    display: 32,
  },
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  lineHeight: {
    tight: 1.2,
    base: 1.5,
    relaxed: 1.6,
  },
  letterSpacing: {
    tight: -0.5,
    normal: 0,
  },
};

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardDark: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const Transition = {
  fast: 150,
  normal: 200,
  slow: 300,
};

export const fontMap = {
  'PlusJakartaSans_400Regular': PlusJakartaSans_400Regular,
  'PlusJakartaSans_500Medium': PlusJakartaSans_500Medium,
  'PlusJakartaSans_600SemiBold': PlusJakartaSans_600SemiBold,
  'PlusJakartaSans_700Bold': PlusJakartaSans_700Bold,
  'PlusJakartaSans_800ExtraBold': PlusJakartaSans_800ExtraBold,
};

export async function loadFontsAsync(): Promise<boolean> {
  try {
    await Font.loadAsync(fontMap);
    return true;
  } catch {
    return false;
  }
}

export function useFontsLoaded(): boolean {
  const [loaded] = useFonts(fontMap);
  return loaded;
}