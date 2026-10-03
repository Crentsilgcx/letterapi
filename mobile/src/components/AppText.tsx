import React from 'react';
import { Text, TextStyle, TextProps, StyleProp } from 'react-native';
import { Typography } from '../theme';

type FontWeight = keyof typeof Typography.fontWeight;
type Variant = 'display' | 'xxxl' | 'xxl' | 'xl' | 'lg' | 'md' | 'base' | 'sm' | 'xs';

interface AppTextProps extends TextProps {
  variant?: Variant;
  weight?: FontWeight;
  color?: string;
  align?: 'auto' | 'left' | 'center' | 'right' | 'justify';
  lineHeight?: keyof typeof Typography.lineHeight;
  letterSpacing?: keyof typeof Typography.letterSpacing;
  style?: StyleProp<TextStyle>;
  children?: React.ReactNode;
}

const variantMap: Record<Variant, keyof typeof Typography.fontSize> = {
  display: 'display',
  xxxl: 'xxxl',
  xxl: 'xxl',
  xl: 'xl',
  lg: 'lg',
  md: 'md',
  base: 'base',
  sm: 'sm',
  xs: 'xs',
};

const fontFamilyMap: Record<FontWeight, string> = {
  regular: Typography.fontFamily,
  medium: Typography.fontFamilyMedium,
  semibold: Typography.fontFamilySemiBold,
  bold: Typography.fontFamilyBold,
  extrabold: Typography.fontFamilyExtraBold,
};

export const AppText: React.FC<AppTextProps> = ({
  variant = 'base',
  weight = 'regular',
  color,
  align = 'auto',
  lineHeight = 'base',
  letterSpacing = 'normal',
  style,
  children,
  ...props
}) => {
  const fontSize = Typography.fontSize[variantMap[variant]];
  const textAlign: TextStyle['textAlign'] = align === 'auto' ? undefined : align;

  return (
    <Text
      style={[
        {
          fontSize,
          fontWeight: Typography.fontWeight[weight],
          fontFamily: fontFamilyMap[weight],
          color,
          textAlign,
          lineHeight: Math.round(fontSize * Typography.lineHeight[lineHeight]),
          letterSpacing: Typography.letterSpacing[letterSpacing],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

export default AppText;
