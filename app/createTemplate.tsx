import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Platform,
  ActivityIndicator, // Import ActivityIndicator
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
// Importa o hook para usar o "cérebro" (Contexto) e o tipo Template do DB
import { useTemplates } from "../context/TemplateContext";
import type { Template } from "../db/database";

// Constantes copiadas do original
// A URL simulada não será mais usada se o fetch funcionar, mas mantemos como fallback visual
const GABARITO_SIMULADO_URL = "https://i.imgur.com/g0n8h3b.png";
const CHOICES = ["A", "B", "C", "D", "E"];

export default function CreateTemplateScreen() {
  const router = useRouter();
  // Puxa a função para adicionar gabarito do "cérebro"
  const { handleAddTemplate } = useTemplates();

  // Estados locais copiados do original
  const [step, setStep] = useState(1);
  const [tituloProva, setTituloProva] = useState("");
  const [numQuestoes, setNumQuestoes] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState<{
    [key: number]: string | null;
  }>({});

  // Novos estados para lidar com a imagem do backend
  const [generatedGabaritoUri, setGeneratedGabaritoUri] = useState<
    string | null
  >(null); // Guarda a URI (base64) da imagem
  const [isGeneratingImage, setIsGeneratingImage] = useState(false); // Flag de loading

  // --- FUNÇÕES ---

  // handleNextStep: Lógica idêntica ao original
  const handleNextStep = () => {
    if (!tituloProva || !numQuestoes || parseInt(numQuestoes, 10) <= 0) {
      alert("Por favor, preencha todos os campos com valores válidos.");
      return;
    }
    const initialAnswers: { [key: number]: string | null } = {};
    for (let i = 1; i <= parseInt(numQuestoes, 10); i++) {
      initialAnswers[i] = null;
    }
    setCorrectAnswers(initialAnswers);
    setStep(2);
  };

  // handleSelectAnswer: Lógica idêntica ao original
  const handleSelectAnswer = (questionNumber: number, answer: string) => {
    setCorrectAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionNumber]: answer,
    }));
  };

  // handleReset: Lógica idêntica ao original
  const handleReset = () => {
    setTituloProva("");
    setNumQuestoes("");
    setCorrectAnswers({});
    setGeneratedGabaritoUri(null); // Limpa a imagem gerada
    setIsGeneratingImage(false); // Reseta o loading
    setStep(1);
  };

  // handleSaveTemplate: MODIFICADA para chamar o backend
  const handleSaveTemplate = async () => {
    // Função agora é async
    const allAnswered = Object.values(correctAnswers).every(
      (ans) => ans !== null
    );
    if (!allAnswered) {
      alert("Por favor, selecione a resposta correta para todas as questões.");
      return;
    }

    const answersArray = Object.keys(correctAnswers)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map((key) => correctAnswers[parseInt(key, 10)]!);

    // --- PARTE 1: Salvar no SQLite (Opcional antes de chamar API) ---
    // Geramos o ID aqui para usar no DB e na imagem
    const templateId = Date.now().toString();
    const newTemplateData: Omit<Template, "results"> = {
      // Usamos Omit para criar sem results
      id: templateId,
      title: tituloProva,
      date: new Date().toLocaleDateString("pt-BR"),
      numQuestoes: parseInt(numQuestoes, 10),
      correctAnswers: answersArray,
    };

    try {
      // Chamamos a função do contexto para salvar no SQLite
      await handleAddTemplate(
        newTemplateData.title,
        newTemplateData.numQuestoes.toString(),
        newTemplateData.correctAnswers
      );
      console.log("Template salvo no DB local antes de gerar imagem.");
    } catch (error) {
      console.error("Erro ao salvar template no DB local:", error);
      alert("Erro ao salvar gabarito localmente.");
      return; // Não prossegue se o salvamento local falhar
    }

    // --- PARTE 2: Chamar o Backend para Gerar a Imagem ---
    setIsGeneratingImage(true); // Mostra o "carregando"
    setGeneratedGabaritoUri(null); // Limpa imagem anterior
    setStep(3); // VAI PARA A TELA DE "GABARITO SALVO" IMEDIATAMENTE (com loading)

    try {
      // !!! ATENÇÃO: Substitua pelo IP REAL do seu PC e a PORTA (8000) !!!
      const backendUrl = "http://192.168.0.8:8000/generate_gabarito"; // <--- SEU IP AQUI

      console.log(`Chamando backend em ${backendUrl} com dados:`, {
        tituloProva,
        numQuestoes,
      });

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tituloProva: tituloProva,
          numQuestoes: parseInt(numQuestoes, 10),
        }),
      });

      console.log("Resposta do backend recebida. Status:", response.status);

      if (!response.ok) {
        let errorBody = "Erro desconhecido do servidor.";
        try {
          const errorJson = await response.json();
          errorBody = errorJson.detail || JSON.stringify(errorJson);
        } catch (e) {
          /* Ignora */
        }
        throw new Error(`Erro do servidor (${response.status}): ${errorBody}`);
      }

      // Converte a imagem recebida (blob) em uma URI de dados (base64)
      const imageBlob = await response.blob();
      const reader = new FileReader();
      reader.readAsDataURL(imageBlob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        console.log("Imagem recebida e convertida para base64 URI.");
        setGeneratedGabaritoUri(base64data); // Guarda a URI base64
      };
      reader.onerror = (error) => {
        console.error("Erro ao converter blob para base64:", error);
        throw new Error("Erro ao processar a imagem recebida.");
      };
    } catch (error) {
      console.error("Erro ao gerar imagem do gabarito:", error);
      alert(`Erro ao conectar com o servidor para gerar a imagem: ${error}`);
      setGeneratedGabaritoUri(null); // Garante que nenhuma imagem antiga seja mostrada
    } finally {
      setIsGeneratingImage(false); // Esconde o "carregando"
    }
  };

  // --- RENDERIZAÇÃO (JSX) ---

  // --- PASSO 3: GABARITO SALVO ---
  if (step === 3) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#f0f8f8"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitleResult}>Gabarito Salvo</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {/* Seção de informações (formHeader) */}
            <View style={styles.formHeader}>
              <View
                style={[
                  styles.formHeaderIconContainer,
                  { backgroundColor: "#d4edda" },
                ]}
              >
                <MaterialCommunityIcons
                  name="check-circle-outline"
                  size={32}
                  color="#155724"
                />
              </View>
              <Text style={styles.formHeaderTitle}>
                Gabarito Salvo com Sucesso!
              </Text>
              <Text style={styles.infoText}>
                O gabarito "{tituloProva}" foi salvo localmente. Abaixo está a
                prévia gerada pelo servidor.
              </Text>
            </View>

            {/* Exibição Condicional da Imagem */}
            {isGeneratingImage ? (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="large" color="#346a74" />
                <Text style={styles.loadingText}>
                  Gerando prévia do gabarito...
                </Text>
              </View>
            ) : generatedGabaritoUri ? (
              <Image
                source={{ uri: generatedGabaritoUri }}
                style={styles.gabaritoImage}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons
                  name="image-off-outline"
                  size={40}
                  color="#AAAAAA"
                />
                <Text style={styles.errorText}>
                  Não foi possível carregar a prévia.
                </Text>
              </View>
            )}

            {/* Botões */}
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 20 }]}
              onPress={() =>
                alert("Download ainda não implementado com backend.")
              }
            >
              <Text style={styles.secondaryButtonText}>
                Baixar Gabarito (PNG)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push("/corrector")}
            >
              <Text style={styles.secondaryButtonText}>Ir para Correção</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.textButton} onPress={handleReset}>
              <Text style={styles.textButtonText}>Criar Novo Gabarito</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- PASSO 2: DEFINIR RESPOSTAS ---
  // (JSX idêntico ao original/migrado anteriormente)
  if (step === 2) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => setStep(1)}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#f0f8f8"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitleResult}>Definir Respostas</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <Text style={styles.formHeaderTitle}>Respostas Corretas</Text>
            <Text style={styles.infoText}>
              Selecione a alternativa correta para cada questão.
            </Text>
            {Object.keys(correctAnswers).map((questionNumberStr) => {
              const questionNumber = parseInt(questionNumberStr, 10);
              return (
                <View key={questionNumber} style={styles.answerRow}>
                  <Text style={styles.questionNumber}>
                    {questionNumberStr.padStart(2, "0")}.
                  </Text>
                  <View style={styles.choicesContainer}>
                    {CHOICES.map((choice) => (
                      <TouchableOpacity
                        key={choice}
                        style={[
                          styles.choiceButton,
                          correctAnswers[questionNumber] === choice &&
                            styles.choiceButtonSelected,
                        ]}
                        onPress={() =>
                          handleSelectAnswer(questionNumber, choice)
                        }
                      >
                        <Text
                          style={[
                            styles.choiceButtonText,
                            correctAnswers[questionNumber] === choice &&
                              styles.choiceButtonTextSelected,
                          ]}
                        >
                          {choice}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
            <TouchableOpacity
              style={styles.gradientButtonContainer}
              onPress={handleSaveTemplate}
            >
              <LinearGradient
                colors={["#a1d5d1", "#5e9c98"]}
                style={styles.gradientButton}
              >
                <Text style={styles.gradientButtonText}>
                  Salvar Gabarito Completo
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- PASSO 1: DETALHES (Default) ---
  // (JSX idêntico ao original/migrado anteriormente)
  if (step === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#f0f8f8"
            />
          </TouchableOpacity>
          <Text style={styles.headerTitleResult}>Criar Gabarito</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.formHeader}>
              <View style={styles.formHeaderIconContainer}>
                <MaterialCommunityIcons
                  name="file-document-plus-outline"
                  size={32}
                  color="#346a74"
                />
              </View>
              <Text style={styles.formHeaderTitle}>Detalhes da Avaliação</Text>
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <MaterialCommunityIcons
                  name="format-title"
                  size={22}
                  color="#999"
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Título da Prova"
                placeholderTextColor="#999"
                value={tituloProva}
                onChangeText={setTituloProva}
              />
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <MaterialCommunityIcons name="pound" size={22} color="#999" />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Número de Questões"
                placeholderTextColor="#999"
                value={numQuestoes}
                onChangeText={setNumQuestoes}
                keyboardType="numeric"
              />
            </View>
            <TouchableOpacity
              style={styles.gradientButtonContainer}
              onPress={handleNextStep}
            >
              <LinearGradient
                colors={["#a1d5d1", "#5e9c98"]}
                style={styles.gradientButton}
              >
                <Text style={styles.gradientButtonText}>
                  Próximo: Definir Respostas
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
} // Fim do componente CreateTemplateScreen

// --- ESTILOS ---
// Inclui os estilos originais + os novos para a imagem
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f8f8" },
  scrollContent: { padding: 20, alignItems: "center", paddingBottom: 40 },
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
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  formHeader: { alignItems: "center", marginBottom: 30 },
  formHeaderIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E8F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  formHeaderTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 55, fontSize: 16, color: "#333" },
  gradientButtonContainer: {
    borderRadius: 12,
    marginTop: 15,
    elevation: 4,
    shadowColor: "#5e9c98",
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  gradientButton: {
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  gradientButtonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  gabaritoImage: {
    width: "100%",
    aspectRatio: 1 / Math.sqrt(2), // Proporção A4
    height: undefined,
    marginBottom: 25,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  infoText: {
    textAlign: "center",
    marginVertical: 15,
    color: "#666",
    fontSize: 14,
    lineHeight: 20,
  },
  secondaryButton: {
    width: "100%",
    height: 50,
    backgroundColor: "#f0f8f8",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#a1d5d1",
  },
  secondaryButtonText: { color: "#346a74", fontSize: 16, fontWeight: "600" },
  textButton: { marginTop: 20, alignSelf: "center" },
  textButtonText: {
    color: "#346a74",
    fontSize: 16,
    textDecorationLine: "underline",
  },
  answerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginBottom: 5,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    width: 40,
  },
  choicesContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flex: 1,
  },
  choiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  choiceButtonSelected: {
    backgroundColor: "#346a74",
    borderColor: "#346a74",
  },
  choiceButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
  },
  choiceButtonTextSelected: {
    color: "#fff",
  },
  // NOVOS ESTILOS ADICIONADOS
  imagePlaceholder: {
    width: "100%",
    aspectRatio: 1 / Math.sqrt(2),
    height: undefined,
    marginBottom: 25,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    color: "#555555",
    fontSize: 14,
  },
  errorText: {
    marginTop: 10,
    color: "#888888",
    fontSize: 14,
    textAlign: "center",
  },
});
