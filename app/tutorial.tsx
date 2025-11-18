import React from "react";
import {
  StyleSheet,
  StatusBar,
  ScrollView,
  View,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Card, Text as PaperText, Button, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";

export default function TutorialScreen() {
  const router = useRouter();
  const theme = useTheme();

  const tutorialTopics = [
    {
      title: "A Impressão (Muito Importante)",
      icon: "printer-alert",
      text: "Ao imprimir, selecione Tamanho Real ou Escala 100%. Nunca use 'Ajustar à Página', pois isso deforma o gabarito e impede a leitura.",
      iconColor: "#c92a2a",
    },
    {
      title: "O Segredo dos Cantos",
      icon: "crop-free",
      text: "O app se guia pelos 4 quadrados pretos. Enquadre a folha de forma que todos os 4 quadrados apareçam, deixando uma pequena margem branca ao redor deles.",
      iconColor: "#2b8a3e",
    },
    {
      title: "Iluminação e Caneta",
      icon: "brightness-6",
      text: "Use caneta Azul ou Preta bem forte. Evite sombras em cima da folha e desligue o flash para não gerar reflexo.",
      iconColor: "#f59f00",
    },
    {
      title: "Nota dos Desenvolvedores (Importante)",
      icon: "school",
      text: "Este é um projeto acadêmico em evolução! Estamos aprendendo e melhorando o sistema. Se a correção falhar na primeira tentativa, por favor, ajuste a posição e tente novamente. Agradecemos a paciência!",
      iconColor: "#5c7cfa",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#346a74" />

      {/* Header */}
      <View style={styles.header}>
        <Button
          icon="arrow-left"
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <PaperText variant="headlineSmall" style={styles.headerTitle}>
          Dicas para uma Correção Perfeita
        </PaperText>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro Text */}
        <View style={styles.introContainer}>
          <PaperText variant="bodyMedium" style={styles.introText}>
            Siga estas dicas para garantir que o app consiga ler seu gabarito
            com perfeição!
          </PaperText>
        </View>

        {/* Tutorial Cards */}
        {tutorialTopics.map((topic, index) => (
          <Card key={index} style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${topic.iconColor}20` },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={topic.icon as any}
                    size={28}
                    color={topic.iconColor}
                  />
                </View>
                <PaperText variant="titleMedium" style={styles.cardTitle}>
                  {topic.title}
                </PaperText>
              </View>

              <PaperText variant="bodyMedium" style={styles.cardText}>
                {topic.text}
              </PaperText>
            </Card.Content>
          </Card>
        ))}

        {/* Extra Spacing */}
        <View style={styles.spacer} />
      </ScrollView>

      {/* Action Button */}
      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => router.push("/")}
          style={styles.actionButton}
          labelStyle={styles.buttonLabel}
        >
          Entendi, vamos lá!
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#346a74",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  backButton: {
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  introContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  introText: {
    color: "#555",
    lineHeight: 22,
    fontStyle: "italic",
  },
  card: {
    marginBottom: 16,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitle: {
    flex: 1,
    fontWeight: "600",
    paddingTop: 4,
  },
  cardText: {
    lineHeight: 22,
    color: "#444",
    marginLeft: 68,
  },
  spacer: {
    height: 20,
  },
  buttonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  actionButton: {
    paddingVertical: 8,
    backgroundColor: "#346a74",
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
});
