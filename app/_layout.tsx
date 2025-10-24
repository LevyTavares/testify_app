import { Stack } from 'expo-router';
// 1. Importe o Provedor que você acabou de criar
import { TemplateProvider } from '../context/TemplateContext';

export default function RootLayout() {
  return (
    // 2. Envolva todo o aplicativo com o "TemplateProvider"
    <TemplateProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Agora, todas as telas (Stack screens)
          têm acesso aos dados (templates)
        */}
      </Stack>
    </TemplateProvider>
  );
}