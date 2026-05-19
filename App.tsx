import i18n from './src/services/i18n';
import { enableScreens } from 'react-native-screens';
enableScreens();

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { I18nextProvider } from 'react-i18next';
import RootNavigator from './src/navigation/RootNavigator';
import { initTheme } from './src/store/useThemeStore';
import { useTheme } from './src/hooks/useTheme';

function AppContent() {
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </>
  );
}

export default function App() {
  useEffect(() => {
    initTheme();
  }, []);

  return (
    <I18nextProvider i18n={i18n}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <NavigationContainer>
            <AppContent />
          </NavigationContainer>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </I18nextProvider>
  );
}
