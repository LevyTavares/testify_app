import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      {/* Isso diz ao Expo Router:
        1. A tela principal é 'app/index.tsx'.
        2. Não mostre o título (header) nessa tela.
      */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}