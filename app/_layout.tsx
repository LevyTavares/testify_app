import { Stack } from 'expo-router';
// Importamos o Provider E o Hook do nosso contexto
import { TemplateProvider, useTemplates } from '../context/TemplateContext';
import React from 'react';
// Importamos os componentes para mostrar o loading
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Criamos um componente interno que pode usar o hook useTemplates()
// porque ele será renderizado DENTRO do TemplateProvider
function AppLayout() {
  // Pegamos o estado isLoading do nosso contexto
  const { isLoading } = useTemplates();

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
      {/* Aqui o Expo Router vai renderizar as telas (index, createTemplate, etc.) */}
    </Stack>
  );
}

// O layout principal agora só precisa envolver tudo com o Provider
// O AppLayout será renderizado como filho do Provider
export default function RootLayout() {
  return (
    <TemplateProvider>
      <AppLayout />
    </TemplateProvider>
  );
}

// Estilos simples para centralizar o spinner de loading
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8f8', // Mesma cor de fundo do app
  },
});