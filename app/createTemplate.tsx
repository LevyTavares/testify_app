import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  ScrollView,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert, // <--- Import Alert
} from "react-native";
import { TouchableRipple, Text as PaperText } from "react-native-paper";
import { TextInput as PaperTextInput } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
// Importa o hook para usar o "cérebro" (Contexto) e o tipo Template do DB
import { useTemplates } from "../context/TemplateContext";
import type { Template } from "../db/database";
// --- IMPORTS PARA DOWNLOAD ---
// Usamos a API "legacy" do expo-file-system (SDK 54+)
// para ter acesso a cacheDirectory, writeAsStringAsync e EncodingType
// Usar API legacy para evitar warnings e garantir EncodingType/Base64
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

    setIsGeneratingImage(true);
    setGeneratedGabaritoUri(null);
    setStep(3);

    let savedFileUri: string | null = null;
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
      console.log("Tipo do blob:", (imageBlob as any).type);
      console.log("Tamanho do blob (bytes):", imageBlob.size);

      // Converte Blob para data URL (base64)
      const blobToDataURL = (blob: Blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
          reader.readAsDataURL(blob);
        });

      let base64data = await blobToDataURL(imageBlob);
      // Normaliza para PNG caso o polyfill tenha usado application/octet-stream
      if (base64data.startsWith("data:application/octet-stream;base64,")) {
        base64data = base64data.replace(
          "data:application/octet-stream;base64,",
          "data:image/png;base64,"
        );
      }
      console.log("Base64 gerado (início):", base64data.substring(0, 50));

      // Usa a variável com nome explícito e extrai exatamente após 'data:image/png;base64,'
      const imageBase64Data = base64data;
      let base64Code = imageBase64Data.split("data:image/png;base64,")[1];
      if (!base64Code) {
        // fallback seguro caso algum ambiente traga outro mime mas mantenha 'base64,'
        base64Code = imageBase64Data.split("base64,")[1];
      }
      if (!base64Code) {
        throw new Error("Formato de imagem base64 inválido.");
      }
      const filename = `gabarito_img_${Date.now()}.png`;
      const fileUri = (FileSystem.documentDirectory as string) + filename;
      await FileSystem.writeAsStringAsync(fileUri, base64Code, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // Atualiza UI para usar o arquivo local permanente
      setGeneratedGabaritoUri(fileUri);
      savedFileUri = fileUri;
    } catch (error) {
      console.error("Erro ao gerar imagem do gabarito:", error);
      alert(`Erro ao conectar com o servidor para gerar a imagem: ${error}`);
      setGeneratedGabaritoUri(null);
      savedFileUri = null;
    } finally {
      // Salva o template no SQLite, com o caminho permanente (ou null em caso de erro)
      try {
        await handleAddTemplate(
          tituloProva,
          numQuestoes,
          answersArray,
          savedFileUri
        );
        console.log(
          "Template salvo no DB local com caminho da imagem:",
          savedFileUri
        );
      } catch (err) {
        console.error("Erro ao salvar template no DB local:", err);
        // Mantém a navegação, mas informa problema de persistência
      }
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
    // Aceita tanto file:// (já salvo) quanto data URL base64
    let uriForSave = generatedGabaritoUri;
    const isFileUri = uriForSave.startsWith("file://");
    const isDataUrl = uriForSave.startsWith("data:");
    const hasBase64 = uriForSave.includes(";base64,");
    if (!isFileUri && (!isDataUrl || !hasBase64)) {
      Alert.alert(
        "Erro",
        "Formato de imagem inválido (não é base64 nem file://)"
      );
      console.error("URI inválida para salvar:", generatedGabaritoUri);
      return;
    }
    if (
      !isFileUri &&
      uriForSave.startsWith("data:application/octet-stream;base64,")
    ) {
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

      let fileUri: string = uriForSave;
      let needsCleanup = false;
      if (!isFileUri) {
        // 2. Extrai os dados base64 e cria arquivo temporário
        const base64Index = uriForSave.indexOf("base64,");
        const base64Code = uriForSave.slice(base64Index + "base64,".length);
        const filename = `gabarito_${
          tituloProva.replace(/[^a-zA-Z0-9_-]/g, "_") || Date.now()
        }.png`;
        fileUri =
          (FileSystem.cacheDirectory || FileSystem.documentDirectory) +
          filename;
        await FileSystem.writeAsStringAsync(fileUri, base64Code, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log("Imagem salva temporariamente em:", fileUri);
        needsCleanup = true;
      }

      if (mediaGranted) {
        // 5. Cria o asset na galeria a partir do arquivo temporário
        const asset = await MediaLibrary.createAssetAsync(fileUri);
        console.log("Asset criado na galeria:", asset.uri);

        // 6. Tenta criar/usar álbum (somente se tivermos permissão de leitura também)
        let albumMsg = `Gabarito "${tituloProva}" salvo na sua galeria.`;
        try {
          const readPerm = await MediaLibrary.getPermissionsAsync();
          if (readPerm.status === "granted") {
            const albumName = "Testify Gabaritos";
            let album = await MediaLibrary.getAlbumAsync(albumName);
            if (album === null) {
              await MediaLibrary.createAlbumAsync(albumName, asset, false);
            } else {
              await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
            }
            albumMsg = `Gabarito "${tituloProva}" salvo no álbum "Testify Gabaritos" da sua galeria.`;
          } else {
            console.warn(
              "Permissão de leitura da MediaLibrary não concedida; pulando organização em álbum."
            );
          }
        } catch (albumErr) {
          console.warn(
            "Não foi possível organizar no álbum (provável limitação do Expo Go):",
            albumErr
          );
        }

        Alert.alert("Sucesso!", albumMsg);
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

      // 7. Limpa arquivo temporário se criado
      if (needsCleanup) {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
          console.log("Arquivo temporário excluído:", fileUri);
        } catch (deleteError) {
          console.warn(
            "Não foi possível excluir o arquivo temporário:",
            deleteError
          );
        }
      }
    } catch (error) {
      console.error("Erro detalhado ao salvar imagem:", error);
      Alert.alert("Erro", "Não foi possível salvar a imagem na galeria.");
    }
  };
  // --- FIM DA FUNÇÃO DE DOWNLOAD ---

  // --- BOTÃO/FLUXO DE COMPARTILHAMENTO ---
  const handleShareImage = async () => {
    if (!generatedGabaritoUri) {
      Alert.alert("Erro", "Nenhuma imagem para compartilhar.");
      return;
    }
    // Aceita file:// ou base64
    let uriForShare = generatedGabaritoUri;
    const isFileUri = uriForShare.startsWith("file://");
    const isDataUrl = uriForShare.startsWith("data:");
    const hasBase64 = uriForShare.includes(";base64,");
    if (!isFileUri && (!isDataUrl || !hasBase64)) {
      Alert.alert("Erro", "Formato inválido (não é base64 nem file://)");
      return;
    }
    if (
      !isFileUri &&
      uriForShare.startsWith("data:application/octet-stream;base64,")
    ) {
      uriForShare = uriForShare.replace(
        "data:application/octet-stream;base64,",
        "data:image/png;base64,"
      );
    }

    try {
      let fileUri = uriForShare;
      let needsCleanup = false;
      if (!isFileUri) {
        const base64Index = uriForShare.indexOf("base64,");
        const base64Code = uriForShare.slice(base64Index + "base64,".length);
        const filename = `gabarito_${
          tituloProva.replace(/[^a-zA-Z0-9_-]/g, "_") || Date.now()
        }.png`;
        fileUri =
          (FileSystem.cacheDirectory || FileSystem.documentDirectory) +
          filename;
        await FileSystem.writeAsStringAsync(fileUri, base64Code, {
          encoding: FileSystem.EncodingType.Base64,
        });
        needsCleanup = true;
      }

      // Import dinâmico do expo-sharing
      let SharingMod: any = null;
      try {
        SharingMod = await import("expo-sharing");
      } catch (e) {
        SharingMod = null;
      }
      if (SharingMod && (await SharingMod.isAvailableAsync())) {
        await SharingMod.shareAsync(fileUri, {
          mimeType: "image/png",
          dialogTitle: `Compartilhar Gabarito "${tituloProva}"`,
          UTI: "public.png",
        });
      } else {
        Alert.alert(
          "Compartilhar indisponível",
          "O compartilhamento não está disponível neste ambiente."
        );
      }

      // Limpa arquivo temporário se criado
      if (needsCleanup) {
        try {
          await FileSystem.deleteAsync(fileUri, { idempotent: true });
        } catch {}
      }
    } catch (error) {
      console.error("Erro ao compartilhar imagem:", error);
      Alert.alert("Erro", "Não foi possível compartilhar a imagem.");
    }
  };
  // --- FIM DO FLUXO DE COMPARTILHAMENTO ---

  // --- RENDERIZAÇÃO (JSX) ---

  // --- PASSO 3: GABARITO SALVO ---
  if (step === 3) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <View style={styles.headerContainer}>
          <TouchableRipple
            onPress={() => router.back()}
            style={styles.backButton}
            rippleColor="rgba(0, 0, 0, 0.1)"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#f0f8f8"
            />
          </TouchableRipple>
          <PaperText variant="titleLarge" style={styles.headerTitleResult}>
            Gabarito Salvo
          </PaperText>
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
              <PaperText variant="headlineSmall" style={styles.formHeaderTitle}>
                Gabarito Salvo com Sucesso!
              </PaperText>
              <PaperText variant="bodyMedium" style={styles.infoText}>
                O gabarito "{tituloProva}" foi salvo localmente. Abaixo está a
                prévia gerada pelo servidor.
              </PaperText>
            </View>

            {/* Exibição Condicional da Imagem */}
            {isGeneratingImage ? (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="large" color="#346a74" />
                <PaperText style={styles.loadingText}>
                  Gerando prévia do gabarito...
                </PaperText>
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
                <PaperText style={styles.errorText}>
                  Não foi possível carregar a prévia.
                </PaperText>
              </View>
            )}

            {/* --- BOTÃO DE DOWNLOAD MODIFICADO --- */}
            <TouchableRipple
              style={[styles.secondaryButton, { marginTop: 20 }]}
              rippleColor="rgba(0, 0, 0, 0.1)"
              // Chama a nova função de download
              onPress={handleDownloadImage}
              // Desabilita se não houver imagem ou se estiver carregando
              disabled={!generatedGabaritoUri || isGeneratingImage}
            >
              <PaperText
                variant="labelLarge"
                style={[
                  styles.secondaryButtonText,
                  // Adiciona opacidade se desabilitado
                  (!generatedGabaritoUri || isGeneratingImage) && {
                    opacity: 0.5,
                  },
                ]}
              >
                Baixar Gabarito (PNG)
              </PaperText>
            </TouchableRipple>
            {/* --- FIM DA MODIFICAÇÃO DO BOTÃO --- */}

            {/* Botão de Compartilhar PNG (útil no Expo Go) */}
            <TouchableRipple
              style={styles.secondaryButton}
              rippleColor="rgba(0, 0, 0, 0.1)"
              onPress={handleShareImage}
              disabled={!generatedGabaritoUri || isGeneratingImage}
            >
              <PaperText
                variant="labelLarge"
                style={[
                  styles.secondaryButtonText,
                  (!generatedGabaritoUri || isGeneratingImage) && {
                    opacity: 0.5,
                  },
                ]}
              >
                Compartilhar PNG
              </PaperText>
            </TouchableRipple>

            <TouchableRipple
              style={styles.secondaryButton}
              rippleColor="rgba(0, 0, 0, 0.1)"
              onPress={() => router.push("/corrector")}
            >
              <PaperText
                variant="labelLarge"
                style={styles.secondaryButtonText}
              >
                Ir para Correção
              </PaperText>
            </TouchableRipple>
            <TouchableRipple
              style={styles.textButton}
              onPress={handleReset}
              rippleColor="rgba(0, 0, 0, 0.1)"
            >
              <PaperText variant="labelLarge" style={styles.textButtonText}>
                Criar Novo Gabarito
              </PaperText>
            </TouchableRipple>
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
          <TouchableRipple
            onPress={() => setStep(1)}
            style={styles.backButton}
            rippleColor="rgba(0, 0, 0, 0.1)"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#f0f8f8"
            />
          </TouchableRipple>
          <PaperText variant="titleLarge" style={styles.headerTitleResult}>
            Definir Respostas
          </PaperText>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <PaperText variant="headlineSmall" style={styles.formHeaderTitle}>
              Respostas Corretas
            </PaperText>
            <PaperText variant="bodyMedium" style={styles.infoText}>
              Selecione a alternativa correta para cada questão.
            </PaperText>
            {Object.keys(correctAnswers).map((questionNumberStr) => {
              const questionNumber = parseInt(questionNumberStr, 10);
              return (
                <View key={questionNumber} style={styles.answerRow}>
                  <PaperText
                    variant="titleMedium"
                    style={styles.questionNumber}
                  >
                    {questionNumberStr.padStart(2, "0")}.
                  </PaperText>
                  <View style={styles.choicesContainer}>
                    {CHOICES.map((choice) => (
                      <TouchableRipple
                        key={choice}
                        style={[
                          styles.choiceButton,
                          correctAnswers[questionNumber] === choice &&
                            styles.choiceButtonSelected,
                        ]}
                        rippleColor="rgba(0, 0, 0, 0.1)"
                        onPress={() =>
                          handleSelectAnswer(questionNumber, choice)
                        }
                      >
                        <PaperText
                          variant="titleMedium"
                          style={[
                            styles.choiceButtonText,
                            correctAnswers[questionNumber] === choice &&
                              styles.choiceButtonTextSelected,
                          ]}
                        >
                          {choice}
                        </PaperText>
                      </TouchableRipple>
                    ))}
                  </View>
                </View>
              );
            })}
            <TouchableRipple
              style={[
                styles.gradientButtonContainer,
                { borderRadius: 12, overflow: "hidden" },
              ]}
              onPress={handleSaveTemplate}
            >
              <LinearGradient
                colors={["#a1d5d1", "#5e9c98"]}
                style={styles.gradientButton}
              >
                <PaperText
                  variant="titleMedium"
                  style={styles.gradientButtonText}
                >
                  Salvar Gabarito Completo
                </PaperText>
              </LinearGradient>
            </TouchableRipple>
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
          <TouchableRipple
            onPress={() => router.back()}
            style={styles.backButton}
            rippleColor="rgba(0, 0, 0, 0.1)"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color="#f0f8f8"
            />
          </TouchableRipple>
          <PaperText variant="titleLarge" style={styles.headerTitleResult}>
            Criar Gabarito
          </PaperText>
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
              <PaperText variant="headlineSmall" style={styles.formHeaderTitle}>
                Detalhes da Avaliação
              </PaperText>
            </View>
            <PaperTextInput
              label="Título da Prova"
              mode="outlined"
              style={styles.input}
              value={tituloProva}
              onChangeText={setTituloProva}
            />
            <PaperTextInput
              label="Número de Questões"
              mode="outlined"
              style={styles.input}
              value={numQuestoes}
              onChangeText={setNumQuestoes}
              keyboardType="numeric"
            />
            <TouchableRipple
              style={[
                styles.gradientButtonContainer,
                { borderRadius: 12, overflow: "hidden" },
              ]}
              onPress={handleNextStep}
            >
              <LinearGradient
                colors={["#a1d5d1", "#5e9c98"]}
                style={styles.gradientButton}
              >
                <PaperText
                  variant="titleMedium"
                  style={styles.gradientButtonText}
                >
                  Próximo: Definir Respostas
                </PaperText>
              </LinearGradient>
            </TouchableRipple>
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
  input: {
    fontSize: 16,
    marginBottom: 20, // Adiciona espaço abaixo
    backgroundColor: "#f7f7f7", // Mantém o fundo
  },
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
