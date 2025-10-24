import { Stack } from 'expo-router';
import { TemplateProvider } from '../context/TemplateContext';
// 1. Importe o React, useState, useEffect
import React, { useState, useEffect } from 'react';
// 2. Importe o seu componente de Splash
import SplashScreen from '../components/SplashScreen';

export default function RootLayout() {
  // 3. Adicione o estado de "loading"
  // Exatamente como seu App.js original
  const [isLoading, setIsLoading] = useState(true);

  // 4. Adicione o timer de 2.5 segundos
  // Exatamente como seu App.js original
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2500); //
    return () => clearTimeout(timer);
  }, []);

  // 5. Se estiver carregando (loading), mostre a SplashScreen
  if (isLoading) {
    return <SplashScreen />; //
  }

  // 6. Se não estiver carregando, mostre o app
  return (
    <TemplateProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* O app principal */}
      </Stack>
    </TemplateProvider>
  );
}