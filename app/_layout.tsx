// app/_layout.tsx - VERSÃO COMPLETA

import { Stack } from "expo-router";
// Importa os Provedores
import { TemplateProvider, useTemplates } from "../context/TemplateContext";
import { PaperProvider } from "react-native-paper"; // Para o Ripple e UI
// Importa componentes
import React, { useState, useEffect } from "react";
import SplashScreen from "../components/SplashScreen"; //
import { ActivityIndicator, View, StyleSheet } from "react-native";

// Componente interno que lida com o estado de carregamento do DB
function AppLayout() {
  const { isLoading } = useTemplates(); // Pega o estado de loading do DB

  // Se o contexto ainda está carregando os dados do SQLite...
  if (isLoading) {
    // ...mostramos um indicador de atividade (spinner)
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#346a74" />
      </View>
    );
  }

  // Se isLoading for false, o DB carregou, então mostramos o app principal
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* O Expo Router renderiza as telas (index, createTemplate, etc.) aqui */}
    </Stack>
  );
}

// O Layout Raiz (RootLayout)
export default function RootLayout() {
  // Estado para o timer da Splash Screen (lógica do App.js original)
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

  // 2. Se o timer acabou, mostre o app (com provedores)
  return (
    // Envolvemos com os provedores
    <PaperProvider>
      <TemplateProvider>
        <AppLayout />
      </TemplateProvider>
    </PaperProvider>
  );
}

// Estilos para o container de loading
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f8f8",
  },
});
