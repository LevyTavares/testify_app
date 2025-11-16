import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import {
  TouchableRipple,
  Text as PaperText,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { API_BASE_URL } from "../constants/ApiConfig";
// 1. Verifique estes imports
import EmptyState from "../components/EmptyState";
import { useTemplates } from "../context/TemplateContext";
import type { Template } from "../db/database";

export default function ReportsScreen() {
  const router = useRouter();

  // 2. VERIFIQUE AQUI!
  // A linha "useState" foi APAGADA
  // Esta linha "puxa" os dados do cérebro
  const { templates } = useTemplates();

  // Estados locais (copiados)
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [viewingResult, setViewingResult] = useState<any | null>(null); // Usamos 'any' por enquanto
  const [gabaritoPreenchido, setGabaritoPreenchido] = useState<string | null>(
    null
  );
  const [loadingImagem, setLoadingImagem] = useState(false);

  // Busca imagem preenchida da API quando um template é selecionado
  useEffect(() => {
    const fetchGabaritoPreenchido = async () => {
      if (!viewingTemplate) {
        setGabaritoPreenchido(null);
        return;
      }

      setLoadingImagem(true);
      try {
        // Monta o array de respostas no formato esperado pela API
        const respostasArray = (viewingTemplate.correctAnswers || []).map(
          (r) => r
        );

        const response = await fetch(`${API_BASE_URL}/generate_gabarito`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tituloProva: viewingTemplate.title,
            numQuestoes: viewingTemplate.numQuestoes,
            respostas: respostasArray, // Envia as respostas para preencher
          }),
        });

        if (!response.ok)
          throw new Error("Falha ao buscar gabarito preenchido");

        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          setGabaritoPreenchido(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error(error);
        setGabaritoPreenchido(null);
      } finally {
        setLoadingImagem(false);
      }
    };

    fetchGabaritoPreenchido();
  }, [viewingTemplate]);

  // Componente StatCard (copiado)
  type StatCardProps = {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
    label: string;
    value: string | number;
    color?: string;
    fullWidth?: boolean;
  };
  const StatCard = ({
    icon,
    label,
    value,
    color,
    fullWidth = false,
  }: StatCardProps) => (
    <View style={[styles.statCard, fullWidth && styles.statCardFullWidth]}>
      <View style={styles.statIconContainer}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color={color || "#346a74"}
        />
      </View>
      <View style={styles.statTextContainer}>
        <PaperText
          variant="titleMedium"
          style={[styles.statValue, !fullWidth && { fontWeight: "bold" }]}
        >
          {value}
        </PaperText>
        <PaperText variant="bodySmall" style={styles.statLabel}>
          {label}
        </PaperText>
      </View>
    </View>
  );

  // --- O resto do seu JSX (visual) continua o mesmo ---
  // (Ele é idêntico ao que te passei antes, então vou omitir por brevidade)
  // ... (Cole o JSX dos 3 Níveis aqui)
  // --- NÍVEL 3 ---
  if (viewingResult && viewingTemplate) {
    const reportDetails = viewingResult;
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <View style={styles.headerContainer}>
          <TouchableRipple
            onPress={() => setViewingResult(null)}
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
            Detalhes da Correção
          </PaperText>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <PaperText variant="headlineMedium" style={styles.reportTitle}>
            {viewingTemplate.title}
          </PaperText>
          <PaperText variant="bodyLarge" style={styles.reportSubtitle}>
            Aluno(a): {reportDetails.studentName}
          </PaperText>
          {viewingTemplate.gabaritoImagePath ? (
            <Image
              source={{ uri: viewingTemplate.gabaritoImagePath }}
              style={styles.gabaritoImagePreview}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons
                name="image-off-outline"
                size={40}
                color="#AAAAAA"
              />
              <PaperText style={{ color: "#888", marginTop: 8 }}>
                Prévia não disponível
              </PaperText>
            </View>
          )}
          <View style={styles.individualStatsContainer}>
            <StatCard
              icon="card-account-details-outline"
              label="Matrícula"
              value={reportDetails.studentMatricula}
              fullWidth
            />
            <StatCard
              icon="google-classroom"
              label="Turma"
              value={reportDetails.studentTurma}
              fullWidth
            />
            <View style={{ height: 10 }} />
            <StatCard
              icon="check-circle-outline"
              label="Acertos"
              value={reportDetails.correct}
              color="#4CAF50"
              fullWidth
            />
            <StatCard
              icon="close-circle-outline"
              label="Erros"
              value={reportDetails.incorrect}
              color="#F44336"
              fullWidth
            />
            <StatCard
              icon="star-circle-outline"
              label="Nota Final"
              value={reportDetails.score}
              fullWidth
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  // --- NÍVEL 2 ---
  if (viewingTemplate) {
    const results = viewingTemplate.results || [];
    const aggregateMetrics = {
      classAverage: (
        results.reduce(
          (sum: number, r: Template["results"][number]) =>
            sum + parseFloat(r.score.split("/")[0]),
          0
        ) / (results.length || 1)
      ).toFixed(1),
      topPerformerName:
        results.length > 0
          ? results.reduce(
              (
                prev: Template["results"][number],
                current: Template["results"][number]
              ) =>
                parseFloat(prev.score.split("/")[0]) >
                parseFloat(current.score.split("/")[0])
                  ? prev
                  : current
            ).studentName
          : "N/A",
      lowPerformerName:
        results.length > 0
          ? results.reduce(
              (
                prev: Template["results"][number],
                current: Template["results"][number]
              ) =>
                parseFloat(prev.score.split("/")[0]) <
                parseFloat(current.score.split("/")[0])
                  ? prev
                  : current
            ).studentName
          : "N/A",
      hardestQuestionNumber:
        Math.floor(Math.random() * (viewingTemplate.numQuestoes || 10)) + 1, // Simulado
    };
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <View style={styles.headerContainer}>
          <TouchableRipple
            onPress={() => setViewingTemplate(null)}
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
            Resultados da Avaliação
          </PaperText>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <PaperText variant="headlineMedium" style={styles.welcomeTitle}>
            {viewingTemplate.title}
          </PaperText>
          {loadingImagem ? (
            <View style={styles.imagePlaceholder}>
              <ActivityIndicator size="large" />
              <PaperText style={styles.errorText}>
                Carregando gabarito preenchido...
              </PaperText>
            </View>
          ) : gabaritoPreenchido ? (
            <Image
              source={{ uri: gabaritoPreenchido }}
              style={styles.gabaritoImagePreview}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <MaterialCommunityIcons
                name="image-off-outline"
                size={30}
                color="#AAAAAA"
              />
              <PaperText style={styles.errorText}>
                Não foi possível carregar a prévia
              </PaperText>
            </View>
          )}
          <PaperText variant="titleLarge" style={styles.sectionTitle}>
            Desempenho da Turma
          </PaperText>
          <View style={styles.statsGrid}>
            <StatCard
              icon="percent-outline"
              label="Média da Turma"
              value={aggregateMetrics.classAverage}
            />
            <StatCard
              icon="arrow-up-bold-circle-outline"
              label="Melhor Aluno"
              value={aggregateMetrics.topPerformerName}
              color="#4CAF50"
            />
            <StatCard
              icon="arrow-down-bold-circle-outline"
              label="Pior Desempenho"
              value={aggregateMetrics.lowPerformerName}
              color="#F44336"
            />
            <StatCard
              icon="help-circle-outline"
              label="Questão Mais Difícil"
              value={`Questão ${aggregateMetrics.hardestQuestionNumber}`}
            />
          </View>
          <PaperText variant="titleLarge" style={styles.sectionTitle}>
            Resultados Individuais
          </PaperText>
          {results.length === 0 ? (
            <EmptyState
              icon="account-search-outline"
              title="Nenhum Aluno Corrigido"
              message="Ainda não há resultados para esta avaliação."
            />
          ) : (
            results.map((result: Template["results"][number]) => (
              <TouchableRipple
                key={result.id}
                style={styles.reportItem}
                onPress={() => setViewingResult(result)}
                rippleColor="rgba(0, 0, 0, 0.1)"
                children={
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.reportItemIcon}>
                      <MaterialCommunityIcons
                        name="account-circle-outline"
                        size={24}
                        color="#346a74"
                      />
                    </View>
                    <View style={styles.reportItemTextContainer}>
                      <PaperText
                        variant="titleMedium"
                        style={styles.reportItemTitle}
                      >
                        {result.studentName}
                      </PaperText>
                      <PaperText
                        variant="bodySmall"
                        style={styles.reportItemDate}
                      >
                        Nota: {result.score}
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
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }
  // --- NÍVEL 1 ---
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
          Relatórios
        </PaperText>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 4. VERIFIQUE AQUI!
              Agora "templates" vem do cérebro.
          */}
        {templates.length === 0 ? (
          <EmptyState
            icon="chart-bar"
            title="Nenhum Relatório Gerado"
            message="Assim que você corrigir uma prova, os relatórios aparecerão aqui."
            buttonText="Corrigir minha primeira prova"
            onButtonPress={() => router.push("/corrector")}
          />
        ) : (
          <>
            <PaperText variant="headlineMedium" style={styles.welcomeTitle}>
              Avaliações Corrigidas
            </PaperText>
            {templates.map((template) => (
              <TouchableRipple
                key={template.id}
                style={styles.reportItem}
                onPress={() => setViewingTemplate(template)}
                rippleColor="rgba(0, 0, 0, 0.1)"
                children={
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <View style={styles.reportItemIcon}>
                      <MaterialCommunityIcons
                        name="file-chart-outline"
                        size={24}
                        color="#346a74"
                      />
                    </View>
                    <View style={styles.reportItemTextContainer}>
                      <PaperText
                        variant="titleMedium"
                        style={styles.reportItemTitle}
                      >
                        {template.title}
                      </PaperText>
                      <PaperText
                        variant="bodySmall"
                        style={styles.reportItemDate}
                      >
                        {(template.results || []).length} correções
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
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos (copiados 100% do ReportsScreen.js)
const styles = StyleSheet.create({
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#555",
    marginBottom: 15,
    marginTop: 10,
  },

  reportItem: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
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
  reportItemTextContainer: { flex: 1 },
  reportItemTitle: { fontSize: 16, fontWeight: "600", color: "#333" },
  reportItemDate: { fontSize: 14, color: "#888", marginTop: 2 },
  reportItemChevron: { marginLeft: 10 },

  reportTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  reportSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 25,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    marginBottom: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    flexDirection: "row",
  },
  statCardFullWidth: {
    width: "100%",
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  statTextContainer: {
    flex: 1,
  },
  statValue: { fontSize: 18, color: "#333" },
  statLabel: { fontSize: 13, color: "#777", marginTop: 2 },

  individualStatsContainer: {
    marginTop: 10,
  },
  gabaritoImagePreview: {
    width: "100%",
    aspectRatio: 1 / Math.sqrt(2), // Proporção A4
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 20,
    backgroundColor: "#EEEEEE",
  },
  imagePlaceholder: {
    width: "100%",
    aspectRatio: 1 / Math.sqrt(2),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    backgroundColor: "#EEEEEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    color: "#888888",
    textAlign: "center",
  },
});
