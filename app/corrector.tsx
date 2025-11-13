import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  Platform,
  ActivityIndicator,
  Alert, // <-- Importa Alert
  KeyboardAvoidingView,
} from "react-native";
import {
  Text as PaperText,
  TouchableRipple,
  TextInput as PaperTextInput,
} from "react-native-paper";

import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import EmptyState from "../components/EmptyState";
// Importa o hook do Contexto e o tipo Template do DB
import { useTemplates } from "../context/TemplateContext";
import type { Template } from "../db/database";

// Dados simulados do resultado (mantido)
const correctionResult = { score: "9.0 / 10.0", correct: 9, incorrect: 1 };

// O Componente
export default function CorrectorScreen() {
  const router = useRouter();
  // Puxa os dados e funções do Contexto, incluindo handleDeleteTemplate
  const { templates, handleAddReport, handleDeleteTemplate } = useTemplates();

  // Estados locais (idênticos)
  const [step, setStep] = useState("selectTemplate");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
    null
  );
  const [studentName, setStudentName] = useState("");
  const [studentMatricula, setStudentMatricula] = useState("");
  const [studentTurma, setStudentTurma] = useState("");

  // Efeito do processamento (idêntico, com correção do tipo timer)
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (step === "processing") {
      timer = setTimeout(() => setStep("result"), 2500);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step]);

  // --- FUNÇÕES ---

  // Função para confirmar exclusão
  const confirmDelete = (templateId: string, templateTitle: string) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir o gabarito "${templateTitle}"?\nTodos os resultados associados também serão perdidos.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          // Chama a função handleDeleteTemplate do contexto
          onPress: async () => {
            // Tornamos async para tratar erros potenciais
            try {
              await handleDeleteTemplate(templateId);
              // O estado será atualizado automaticamente pelo contexto
            } catch (error) {
              console.error("Erro na tela ao tentar deletar:", error);
              Alert.alert("Erro", "Não foi possível excluir o gabarito.");
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // startCorrection (idêntico)
  const startCorrection = (template: Template) => {
    setSelectedTemplate(template);
    setStep("camera");
  };

  // handleSaveReport (idêntico)
  const handleSaveReport = async () => {
    // Tornamos async para tratar erros
    if (!studentName) {
      alert("Por favor, insira pelo menos o nome do aluno.");
      return false;
    }
    if (selectedTemplate) {
      try {
        await handleAddReport(
          selectedTemplate,
          correctionResult,
          studentName,
          studentMatricula,
          studentTurma
        );
        setStudentName("");
        setStudentMatricula("");
        setStudentTurma("");
        return true;
      } catch (error) {
        console.error("Erro na tela ao tentar salvar relatório:", error);
        Alert.alert("Erro", "Não foi possível salvar o resultado.");
        return false;
      }
    } else {
      Alert.alert(
        "Erro",
        "Nenhum gabarito selecionado para salvar o resultado."
      );
      return false;
    }
  };

  // handleCorrectNext (adaptado para ser async)
  const handleCorrectNext = async () => {
    const saved = await handleSaveReport();
    if (saved) {
      setStep("camera");
    }
  };

  // handleFinish (adaptado para ser async)
  const handleFinish = async () => {
    const saved = await handleSaveReport();
    if (saved) {
      router.push("/reports");
    }
  };

  // --- RENDERIZAÇÃO (JSX) ---

  // --- PASSO 4: RESULTADO --- (JSX idêntico)
  // Refs fixos (fora do bloco condicional para não quebrar a ordem de hooks)
  const matriculaRef = useRef<any>(null);
  const turmaRef = useRef<any>(null);

  if (step === "result") {
    return (
      <SafeAreaView style={styles.container}>
        {/* ... (código JSX do passo 'result' completo) ... */}
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <View style={styles.headerContainer}>
          <TouchableRipple
            onPress={() => setStep("selectTemplate")}
            style={styles.backButton}
            rippleColor="rgba(255,255,255,0.2)"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#f0f8f8"
            />
          </TouchableRipple>
          <PaperText variant="titleLarge" style={styles.headerTitleResult}>
            Resultado da Correção
          </PaperText>
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "android" ? 80 : 0}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
              <View style={styles.resultHeader}>
                <MaterialCommunityIcons
                  name="check-decagram"
                  size={40}
                  color="#4CAF50"
                />
                <PaperText variant="displayMedium" style={styles.resultScore}>
                  {correctionResult.score}
                </PaperText>
              </View>
              <View style={styles.resultDetails}>
                <PaperText variant="bodyLarge" style={styles.detailText}>
                  Acertos: {correctionResult.correct}
                </PaperText>
                <PaperText variant="bodyLarge" style={styles.detailText}>
                  Erros: {correctionResult.incorrect}
                </PaperText>
              </View>
              <PaperTextInput
                label="Nome do Aluno(a)"
                mode="outlined"
                style={styles.input}
                value={studentName}
                onChangeText={setStudentName}
              />
              <PaperTextInput
                label="Matrícula (Opcional)"
                mode="outlined"
                style={styles.input}
                value={studentMatricula}
                onChangeText={setStudentMatricula}
                keyboardType="numeric"
              />
              <PaperTextInput
                label="Turma (Opcional)"
                mode="outlined"
                style={styles.input}
                value={studentTurma}
                onChangeText={setStudentTurma}
              />
              <TouchableRipple
                style={styles.primaryButton}
                onPress={handleCorrectNext}
                rippleColor="rgba(0, 0, 0, 0.1)"
              >
                <PaperText
                  variant="titleMedium"
                  style={styles.primaryButtonText}
                >
                  Salvar e Corrigir Próxima
                </PaperText>
              </TouchableRipple>
              <TouchableRipple
                style={styles.secondaryButton}
                onPress={handleFinish}
                rippleColor="rgba(0, 0, 0, 0.1)"
              >
                <PaperText
                  variant="labelLarge"
                  style={styles.secondaryButtonText}
                >
                  Salvar e Finalizar Sessão
                </PaperText>
              </TouchableRipple>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- PASSO 'camera' --- (JSX idêntico)
  if (step === "camera") {
    return (
      <View style={styles.cameraContainer}>
        {/* ... (código JSX do passo 'camera' completo) ... */}
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.cameraOverlay}>
          <PaperText variant="titleMedium" style={styles.cameraText}>
            Alinhe a folha de respostas
          </PaperText>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <TouchableRipple
          style={styles.captureButton}
          onPress={() => setStep("processing")}
          rippleColor="rgba(255,255,255,0.3)"
        >
          <View style={styles.captureButtonInner} />
        </TouchableRipple>
      </View>
    );
  }

  // --- PASSO 'processing' --- (JSX idêntico)
  if (step === "processing") {
    return (
      <View style={styles.processingContainer}>
        {/* ... (código JSX do passo 'processing' completo) ... */}
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <ActivityIndicator size="large" color="#a1d5d1" />
        <PaperText variant="titleLarge" style={styles.processingText}>
          Analisando imagem...
        </PaperText>
      </View>
    );
  }

  // --- PASSO 'selectTemplate' (Default) ---
  // (JSX modificado para incluir o botão de deletar)
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#346a74" />
      <View style={styles.headerContainer}>
        <TouchableRipple
          onPress={() => router.back()}
          style={styles.backButton}
          rippleColor="rgba(255,255,255,0.2)"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#f0f8f8" />
        </TouchableRipple>
        <PaperText variant="titleLarge" style={styles.headerTitleResult}>
          Corrigir Provas
        </PaperText>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Usa os templates do contexto */}
        {templates.length === 0 ? (
          <EmptyState
            icon="file-document-outline"
            title="Nenhum Gabarito Encontrado"
            message="Você precisa criar um gabarito antes de poder corrigir uma prova."
            buttonText="Criar meu primeiro gabarito"
            onButtonPress={() => router.push("/createTemplate")}
          />
        ) : (
          <>
            <PaperText variant="headlineMedium" style={styles.welcomeTitle}>
              Selecione o Gabarito
            </PaperText>
            {/* --- LISTA COM BOTÃO DE DELETAR --- */}
            {templates.map((template) => (
              <View key={template.id} style={styles.reportItemContainer}>
                {/* Item clicável */}
                <TouchableRipple
                  style={styles.reportItemTouchable}
                  onPress={() => startCorrection(template)}
                  rippleColor="rgba(0, 0, 0, 0.1)"
                  children={
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <View style={styles.reportItemIcon}>
                        <MaterialCommunityIcons
                          name="file-document-outline"
                          size={24}
                          color="#346a74"
                        />
                      </View>
                      <View style={styles.reportItemTextContent}>
                        <PaperText
                          variant="titleMedium"
                          style={styles.reportItemTitle}
                          numberOfLines={1}
                        >
                          {template.title}
                        </PaperText>
                        <PaperText
                          variant="bodySmall"
                          style={styles.reportItemDate}
                        >
                          Criado em: {template.date}
                        </PaperText>
                      </View>
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={24}
                        color="#ccc"
                        style={styles.reportItemChevron}
                      />
                    </View>
                  }
                />

                {/* Botão de deletar */}
                <TouchableRipple
                  style={styles.deleteButton}
                  onPress={() => confirmDelete(template.id, template.title)} // Chama a confirmação
                  rippleColor="rgba(0, 0, 0, 0.1)"
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={24}
                    color="#F44336"
                  />
                </TouchableRipple>
              </View>
            ))}
            {/* --- FIM DA LISTA --- */}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} // Fim do componente CorrectorScreen

// --- ESTILOS ---
// Inclui os estilos originais + os novos para a lista
const styles = StyleSheet.create({
  // --- Estilos Originais (Copie e cole todos eles aqui) ---
  container: { flex: 1, backgroundColor: "#f0f8f8" },
  scrollContent: { padding: 20, flexGrow: 1 },
  headerContainer: {
    width: "100%",
    backgroundColor: "#346a74",
    paddingTop: Platform.OS === "android" ? 40 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: Platform.OS === "android" ? 45 : 25,
  },
  headerTitleResult: { fontSize: 22, fontWeight: "bold", color: "#f0f8f8" },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 20,
  },
  reportItem: {
    // Este estilo não é mais usado diretamente no map, mas pode ser referência
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
  },
  reportItemIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "#E8F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  reportItemTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  reportItemDate: { fontSize: 14, color: "#888", marginTop: 2 },
  reportItemChevron: { marginLeft: "auto" }, // Ajustado para empurrar para a direita

  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  cameraText: {
    color: "white",
    fontSize: 18,
    position: "absolute",
    top: "15%",
  },
  corner: {
    width: 50,
    height: 50,
    position: "absolute",
    borderColor: "white",
    borderWidth: 4,
  },
  topLeft: {
    top: "25%",
    left: "10%",
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: "25%",
    right: "10%",
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: "25%",
    left: "10%",
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: "25%",
    right: "10%",
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  captureButton: {
    position: "absolute",
    bottom: 50,
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "#000",
  },

  processingContainer: {
    flex: 1,
    backgroundColor: "#346a74",
    justifyContent: "center",
    alignItems: "center",
  },
  processingText: { color: "#f0f8f8", fontSize: 20, marginTop: 20 },

  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  resultHeader: { alignItems: "center", marginBottom: 20 },
  resultScore: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#346a74",
    marginVertical: 10,
  },
  resultDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
  },
  detailText: { fontSize: 16, color: "#333" },

  input: {
    fontSize: 16,
    marginBottom: 20, // Adiciona espaço abaixo
    backgroundColor: "#f7f7f7", // Mantém o fundo
  },

  primaryButton: {
    width: "100%",
    height: 55,
    backgroundColor: "#a1d5d1",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  primaryButtonText: { color: "#346a74", fontSize: 18, fontWeight: "bold" },
  secondaryButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#f0f8f8",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#a1d5d1",
  },
  secondaryButtonText: { color: "#346a74", fontSize: 16, fontWeight: "600" },

  // --- NOVOS ESTILOS PARA A LISTA COM BOTÃO DE DELETAR ---
  reportItemContainer: {
    flexDirection: "row", // Alinha o item e o botão lado a lado
    alignItems: "center", // Centraliza verticalmente
    marginBottom: 15,
    backgroundColor: "#fff", // Fundo do container geral
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  reportItemTouchable: {
    flex: 1, // Faz o item principal ocupar a maior parte do espaço
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15, // Reduzi um pouco o padding vertical
    paddingLeft: 20, // Padding esquerdo
    // Removemos borderRadius e marginBottom daqui
  },
  reportItemTextContent: {
    flex: 1, // Permite que o título encurte (numberOfLines)
    marginRight: 10, // Espaço antes do chevron
  },
  deleteButton: {
    paddingVertical: 20, // Padding vertical para altura
    paddingHorizontal: 15, // Padding horizontal
    justifyContent: "center",
    alignItems: "center",
    // backgroundColor: 'lightblue', // Para debug
  },
});
