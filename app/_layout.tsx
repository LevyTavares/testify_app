import { Stack } from 'expo-router';
import { TemplateProvider, useTemplates } from '../context/TemplateContext';
import React, { useState, useEffect } from 'react';
import SplashScreen from '../components/SplashScreen'; //
import { ActivityIndicator, View, StyleSheet } from 'react-native';
// --- ADICIONE ESTA IMPORTAÇÃO ---
import { PaperProvider } from 'react-native-paper';

// Esta função interna lida com o carregamento do DB
function AppLayout() {
  const { isLoading } = useTemplates(); // Estado de carregamento do DB

  // Se estiver carregando do DB, mostra um spinner
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#346a74" />
      </View>
    );
  }

  // Se já carregou, mostra o app
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* O app principal */}
    </Stack>
  );
}

// O Layout Raiz (RootLayout)
export default function RootLayout() {
  // Estado para o timer da Splash Screen
  const [isLoadingSplash, setIsLoadingSplash] = useState(true);

  // Timer de 2.5 segundos da Splash Screen
  useEffect(() => {
    const timer = setTimeout(() => setIsLoadingSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  // 1. Se o timer da splash estiver rodando, mostre a SplashScreen
  if (isLoadingSplash) {
    return <SplashScreen />; //
  }

  // 2. Se o timer acabou, mostre o app principal
  return (
    // --- ENVOLVA COM O PAPERPROVIDER ---
    <PaperProvider>
      <TemplateProvider>
        <AppLayout />
      </TemplateProvider>
    </PaperProvider>
    // --- FIM DA MUDANÇA ---
  );
}

// Estilos para o container de loading
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f8',
  },
});