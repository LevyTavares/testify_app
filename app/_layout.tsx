import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    // Esta é a forma de dizer: "Aplique headerShown: false
    // para TODAS as telas dentro desta Stack"
    <Stack screenOptions={{ headerShown: false }}>

      {/* Você ainda pode ter telas individuais aqui,
          mas elas vão "herdar" a opção de cima. 
          Deixar só a Stack já resolve.
      */}

    </Stack>
  );
}