import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle, useColorScheme } from 'react-native';
import { Colors } from '../theme/Colors';

interface CustomTextProps extends RNTextProps {
  children: React.ReactNode;
}

export function Text(props: CustomTextProps) {
  const { style, ...rest } = props;
  const isDarkMode = useColorScheme() === 'dark';
  const theme = isDarkMode ? Colors.dark : Colors.light;

  // Extraer el fontWeight de los estilos pasados, o del arreglo de estilos
  let fontWeight: TextStyle['fontWeight'] = '400';
  let passedColor: string | undefined;

  if (style) {
    const flatStyle = StyleSheet.flatten(style) as TextStyle;
    if (flatStyle.fontWeight) {
      fontWeight = flatStyle.fontWeight;
    }
    if (flatStyle.color) {
      passedColor = flatStyle.color as string;
    }
  }

  // Mapear fontWeight a la variante correcta de Inter
  let fontFamily = 'Inter_400Regular';

  switch (fontWeight) {
    case '100': fontFamily = 'Inter_100Thin'; break;
    case '200': fontFamily = 'Inter_200ExtraLight'; break;
    case '300': fontFamily = 'Inter_300Light'; break;
    case 'normal':
    case '400': fontFamily = 'Inter_400Regular'; break;
    case '500': fontFamily = 'Inter_500Medium'; break;
    case '600': fontFamily = 'Inter_600SemiBold'; break;
    case 'bold':
    case '700': fontFamily = 'Inter_700Bold'; break;
    case '800': fontFamily = 'Inter_800ExtraBold'; break;
    case '900': fontFamily = 'Inter_900Black'; break;
    default: fontFamily = 'Inter_400Regular'; break;
  }

  // Fusionamos la familia correcta, omitiendo fontWeight para evitar advertencias nativas
  const flatStyle = StyleSheet.flatten(style) || {};
  const { fontWeight: _, ...styleWithoutWeight } = flatStyle as TextStyle;

  // Si no se pasó un color en los estilos, usar el color primario del tema actual
  const defaultColor = theme.textPrimary;
  
  // Excepción: si el texto explícitamente era "#0F2B3D" (azul corporativo duro) 
  // y estamos en dark mode, debemos invertirlo automáticamente para evitar que desaparezca en fondo oscuro.
  let finalColor = passedColor || defaultColor;
  if (isDarkMode) {
    if (passedColor === '#0F2B3D' || passedColor === '#1E293B' || passedColor === '#000000') {
      finalColor = '#FFFFFF'; // Invertir oscuro a blanco
    } else if (passedColor === '#64748B') {
      finalColor = '#94A3B8'; // Aclarar grises oscuros
    }
  }

  return (
    <RNText style={[{ fontFamily, color: finalColor }, styleWithoutWeight, { color: finalColor }]} {...rest}>
      {props.children}
    </RNText>
  );
}
