import React, { useState, useEffect } from 'react';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar, View, ActivityIndicator, StyleSheet } from 'react-native';
import { DeliveryScreen } from './src/screens/DeliveryScreen';
import { loadFontsAsync, useTheme } from './src/theme';

function AppContent() {
  const theme = useTheme();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
        <StatusBar barStyle="dark-content" backgroundColor={theme.bg} />
        <DeliveryScreen />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    loadFontsAsync().then((success) => {
      setFontsLoaded(true);
      if (!success) {
        console.warn('Custom fonts failed to load, falling back to system font');
      }
    });
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0E5C4E" />
      </View>
    );
  }

  return <AppContent />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});