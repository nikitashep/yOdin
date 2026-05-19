import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/useThemeStore';
import { LightColors, DarkColors, ColorPalette } from '../theme/colors';

export function useTheme(): { colors: ColorPalette; isDark: boolean } {
  const preference = useThemeStore((s) => s.preference);
  const systemScheme = useColorScheme();
  const isDark =
    preference === 'dark' ||
    (preference === 'system' && systemScheme === 'dark');
  return { colors: isDark ? DarkColors : LightColors, isDark };
}
