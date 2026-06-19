import { useProvider } from '@/hooks/useProvider';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFonts } from 'expo-font';
import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React from 'react';

export default function Index() {
  // Static weight files (not the variable font): React Native's font managers
  // do NOT drive a variable font's `wght` axis from `fontWeight` on either
  // platform — a single variable .ttf only ever renders its default (regular)
  // instance, and on Android it falls back to the system font entirely. Each
  // weight is loaded from its own static file and selected by `fontFamily`.
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('../assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-Italic': require('../assets/fonts/PlusJakartaSans-Italic-VariableFont_wght.ttf'),
    ...MaterialIcons.font,
    ...FontAwesome6.font,
  });
  const { keys, status } = useProvider();

  React.useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (!fontsLoaded || status === 'loading') {
    return null;
  }

  if (keys.length > 0) return <Redirect href="/landing" />;
  return <Redirect href="/onboarding" />;
}
