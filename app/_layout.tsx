import { Stack } from 'expo-router';
import { TemplateProvider } from '../context/TemplateContext'; // <-- Verifique esta linha

export default function RootLayout() {
  return (
    // Esta linha é a mais importante
    <TemplateProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* O Stack fica DENTRO */}
      </Stack>
    </TemplateProvider>
  );
}