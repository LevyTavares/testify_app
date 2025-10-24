import { Stack } from 'expo-router';
// 1. Verifique se este import está correto
import { TemplateProvider } from '../context/TemplateContext';

export default function RootLayout() {
  return (
    // 2. Verifique se o <TemplateProvider> está "abraçando" a <Stack>
    <TemplateProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Todas as telas aqui dentro agora têm acesso ao "cérebro" */}
      </Stack>
    </TemplateProvider>
  );
}