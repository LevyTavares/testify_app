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
  ActivityIndicator,
  Alert, // <--- Import Alert
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
// Importa o hook para usar o "cérebro" (Contexto) e o tipo Template do DB
import { useTemplates } from "../context/TemplateContext";
import type { Template } from "../db/database";
// --- IMPORTS PARA DOWNLOAD ---
// Usamos a API "legacy" do expo-file-system (SDK 54+)
// para ter acesso a cacheDirectory, writeAsStringAsync e EncodingType
import * as FileSystem from "expo-file-system/legacy";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
// ----------------------------

// Constantes copiadas do original
const GABARITO_SIMULADO_URL = "https://i.imgur.com/g0n8h3b.png"; // Fallback visual
const CHOICES = ["A", "B", "C", "D", "E"];

export default function CreateTemplateScreen() {
  const router = useRouter();
  const { handleAddTemplate } = useTemplates();

  // Estados locais
  const [step, setStep] = useState(1);
  const [tituloProva, setTituloProva] = useState("");
  const [numQuestoes, setNumQuestoes] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState<{
    [key: number]: string | null;
  }>({});
  const [generatedGabaritoUri, setGeneratedGabaritoUri] = useState<
    string | null
  >(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // --- FUNÇÕES ---

  const handleNextStep = () => {
    // ... (código idêntico)
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

  const handleSelectAnswer = (questionNumber: number, answer: string) => {
    // ... (código idêntico)
    setCorrectAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionNumber]: answer,
    }));
  };

  const handleReset = () => {
    // ... (código idêntico)
    setTituloProva("");
    setNumQuestoes("");
    setCorrectAnswers({});
    setGeneratedGabaritoUri(null);
    setIsGeneratingImage(false);
    setStep(1);
  };

  const handleSaveTemplate = async () => {
    // ... (código idêntico para validação, salvar no DB e chamar o backend)
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

    const templateId = Date.now().toString();
    const newTemplateData: Omit<Template, "results"> = {
      id: templateId,
      title: tituloProva,
      date: new Date().toLocaleDateString("pt-BR"),
      numQuestoes: parseInt(numQuestoes, 10),
      correctAnswers: answersArray,
    };

    try {
      await handleAddTemplate(
        newTemplateData.title,
        newTemplateData.numQuestoes.toString(),
        newTemplateData.correctAnswers
      );
      console.log("Template salvo no DB local antes de gerar imagem.");
    } catch (error) {
      console.error("Erro ao salvar template no DB local:", error);
      alert("Erro ao salvar gabarito localmente.");
      return;
    }

    setIsGeneratingImage(true);
    setGeneratedGabaritoUri(null);
    setStep(3);

    try {
      const backendUrl = "http://192.168.0.8:8000/generate_gabarito"; // SEU IP

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

      // Em alguns ambientes (Android/Expo), response.blob() pode vir sem o MIME correto
      // e gerar "application/octet-stream" no data URL. Vamos converter e normalizar depois.
      const imageBlob = await response.blob();
      console.log("Blob de imagem recebido do backend:", imageBlob);
      // Alguns polyfills não expõem .type; esse log pode vir vazio em Android/Expo
      console.log("Tipo do blob:", (imageBlob as any).type);
      console.log("Tamanho do blob (bytes):", imageBlob.size);

      const reader = new FileReader();
      reader.readAsDataURL(imageBlob);
      reader.onloadend = () => {
        let base64data = reader.result as string;
        // Normaliza para PNG caso o polyfill tenha usado application/octet-stream
        if (base64data.startsWith("data:application/octet-stream;base64,")) {
          base64data = base64data.replace(
            "data:application/octet-stream;base64,",
            "data:image/png;base64,"
          );
        }
        console.log("Base64 gerado (início):", base64data.substring(0, 50));
        setGeneratedGabaritoUri(base64data);
      };
      reader.onerror = (error) => {
        console.error("Erro ao converter blob para base64:", error);
        throw new Error("Erro ao processar a imagem recebida.");
      };
    } catch (error) {
      console.error("Erro ao gerar imagem do gabarito:", error);
      alert(`Erro ao conectar com o servidor para gerar a imagem: ${error}`);
      setGeneratedGabaritoUri(null);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // --- NOVA FUNÇÃO DE DOWNLOAD ---
  const handleDownloadImage = async () => {
    if (!generatedGabaritoUri) {
      Alert.alert(
        "Erro",
        "Nenhuma imagem de gabarito disponível para download."
      );
      return;
    }

    // Verifica/normaliza URI base64: aceita image/* ou application/octet-stream e corrige para PNG
    let uriForSave = generatedGabaritoUri;
    const isDataUrl = uriForSave.startsWith("data:");
    const hasBase64 = uriForSave.includes(";base64,");
    if (!isDataUrl || !hasBase64) {
      Alert.alert(
        "Erro",
        "Formato de imagem inválido para download (não é base64)."
      );
      console.error("URI não é base64:", generatedGabaritoUri);
      return;
    }
    if (uriForSave.startsWith("data:application/octet-stream;base64,")) {
      uriForSave = uriForSave.replace(
        "data:application/octet-stream;base64,",
        "data:image/png;base64,"
      );
    }

    try {
      // 1. Pede permissão para acessar a galeria (parâmetro boolean: writeOnly)
      let mediaGranted = false;
      try {
        const perm = await MediaLibrary.requestPermissionsAsync(true);
        mediaGranted = perm.status === "granted";
      } catch (permErr) {
        console.warn("Falha ao solicitar permissão da MediaLibrary:", permErr);
        mediaGranted = false;
      }

      // 2. Extrai os dados base64
      // Sempre extraímos após 'base64,' independentemente do mime
      const base64Index = uriForSave.indexOf("base64,");
      const base64Code = uriForSave.slice(base64Index + "base64,".length);

      // 3. Define nome e caminho temporário
      const filename = `gabarito_${
        tituloProva.replace(/[^a-zA-Z0-9_-]/g, "_") || Date.now()
      }.png`;
      // Usamos cacheDirectory que é limpo pelo sistema operacional eventualmente
      const fileUri = FileSystem.cacheDirectory + filename;

      // 4. Salva a string base64 como arquivo binário temporário
      await FileSystem.writeAsStringAsync(fileUri, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log("Imagem salva temporariamente em:", fileUri);

      if (mediaGranted) {
        // 5. Cria o asset na galeria a partir do arquivo temporário
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        console.log("Asset criado na galeria:", asset.uri);

        // 6. Tenta criar/usar álbum
        const albumName = "Testify Gabaritos";
        let album = await MediaLibrary.getAlbumAsync(albumName);
        if (album === null) {
          await MediaLibrary.createAlbumAsync(albumName, asset, false);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
        }

        Alert.alert(
          "Sucesso!",
          `Gabarito "${tituloProva}" salvo no álbum "Testify Gabaritos" da sua galeria.`
        );
      } else {
        // Fallback: compartilhar quando a MediaLibrary não está disponível ou sem permissão
        let canShare = false;
        let SharingMod: any = null;
        try {
          SharingMod = await import("expo-sharing");
          canShare = await SharingMod.isAvailableAsync();
        } catch (e) {
          canShare = false;
        }
        if (canShare && SharingMod) {
          await SharingMod.shareAsync(fileUri, {
            mimeType: "image/png",
            dialogTitle: `Salvar/Compartilhar Gabarito "${tituloProva}"`,
            UTI: "public.png",
          });
        } else {
          Alert.alert(
            "Ação necessária",
            "Não foi possível acessar a galeria neste ambiente. Gere um Development Build (EAS) ou use o botão de compartilhar."
          );
        }
      }

      // 7. Limpa o arquivo temporário APÓS garantir que foi salvo na galeria
      // Envolvemos em try/catch caso a exclusão falhe (não crítico)
      try {
        await FileSystem.deleteAsync(fileUri, { idempotent: true }); // idempotent: não dá erro se já não existir
        console.log("Arquivo temporário excluído:", fileUri);
      } catch (deleteError) {
        console.warn(
          "Não foi possível excluir o arquivo temporário:",
          deleteError
        );
      }
    } catch (error) {
      console.error("Erro detalhado ao salvar imagem:", error);
      Alert.alert("Erro", "Não foi possível salvar a imagem na galeria.");
    }
  };
  // --- FIM DA FUNÇÃO DE DOWNLOAD ---

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

            {/* --- BOTÃO DE DOWNLOAD MODIFICADO --- */}
            <TouchableOpacity
              style={[styles.secondaryButton, { marginTop: 20 }]}
              // Chama a nova função de download
              onPress={handleDownloadImage}
              // Desabilita se não houver imagem ou se estiver carregando
              disabled={!generatedGabaritoUri || isGeneratingImage}
            >
              <Text
                style={[
                  styles.secondaryButtonText,
                  // Adiciona opacidade se desabilitado
                  (!generatedGabaritoUri || isGeneratingImage) && {
                    opacity: 0.5,
                  },
                ]}
              >
                Baixar Gabarito (PNG)
              </Text>
            </TouchableOpacity>
            {/* --- FIM DA MODIFICAÇÃO DO BOTÃO --- */}

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
  // (JSX idêntico)
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
  // (JSX idêntico)
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
              <MaterialCommunityIcons
                name="format-title"
                size={22}
                color="#999"
                style={styles.inputIcon} // Aplicado estilo diretamente aqui
              />
              <TextInput
                style={styles.input}
                placeholder="Título da Prova"
                placeholderTextColor="#999"
                value={tituloProva}
                onChangeText={setTituloProva}
              />
            </View>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons
                name="pound"
                size={22}
                color="#999"
                style={styles.inputIcon}
              />
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
// (Estilos idênticos aos anteriores, incluindo os de placeholder/loading/error)
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
    width: 40, // Largura fixa para alinhar
  },
  choicesContainer: {
    flexDirection: "row",
    justifyContent: "space-around", // Espaça igualmente
    flex: 1, // Ocupa o espaço restante
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
