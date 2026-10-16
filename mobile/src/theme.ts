import * as Font from 'expo-font';
import { useFonts } from 'expo-font';
import { useColorScheme } from 'react-native';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

const lightTheme = {
  // New theme tokens
  page: '#F6F7F9',
  card: '#FFFFFF',
  ink: '#101828',
  sub: '#667085',
  line: '#E1E5EB',
  field: '#F9FAFB',
  accent: '#34D755',
  accentInk: '#FFFFFF',
  tint: '#E6F2EF',
  error: '#C0352B',
  errorBg: '#FDEDED',
  placeholder: '#8A9A95',
  inputBorder: '#E1E5EB',
  inputBorderFocused: '#34D755',
  disabledOpacity: 0.45,
  // Backward compatibility aliases
  bg: '#FFFFFF',
  subtext: '#667085',
  border: '#E1E5EB',
  accentText: '#FFFFFF',
  accentStrong: '#084C3F',
  accentTint: '#E3F1EE',
  accentLight: '#3FC1A5',
  inputBg: '#FFFFFF',
};

const darkTheme = {
  // New theme tokens
  page: '#0B1220',
  card: '#131C2E',
  ink: '#EDF1F8',
  sub: '#9AA6BC',
  line: '#26324A',
  field: '#0F1829',
  accent: '#3FC1A5',
  accentInk: '#06231D',
  tint: '#14302B',
  error: '#FF8A80',
  errorBg: '#3D1A1A',
  placeholder: '#6B7A9A',
  inputBorder: '#26324A',
  inputBorderFocused: '#3FC1A5',
  disabledOpacity: 0.45,
  // Backward compatibility aliases
  bg: '#131C2E',
  subtext: '#9AA6BC',
  border: '#26324A',
  accentText: '#06231D',
  accentStrong: '#2EC1A5',
  accentTint: '#14302B',
  accentLight: '#3FC1A5',
  inputBg: '#0F1829',
};

export function useTheme() {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? darkTheme : lightTheme;
}

export type Theme = typeof lightTheme;

export const Radii = {
  card: 20,
  input: 14,
  button: 16,
  iconButton: 14,
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
  fontSize: {
    xs: 11,
    sm: 12,
    md: 13,
    base: 14,
    lg: 15,
    xl: 16,
    xxl: 18,
    xxxl: 22,
    display: 26,
    pageTitlePhone: 21,
    pageTitleTablet: 26,
    cardTitle: 16,
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
    tightTitle: -0.4,
  },
};

export const Shadows = {
  card: {
    shadowColor: '#101828',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  // Backward compatibility
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