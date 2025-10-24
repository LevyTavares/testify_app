// 1. IMPORTAÇÕES - Copiadas do ReportsScreen.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import EmptyState from '../components/EmptyState'; // <--- MUDANÇA: Importamos nosso componente
import { useRouter } from 'expo-router'; // <--- MUDANÇA: Para navegação

// 2. MUDANÇA: Definimos os tipos de dados que esperamos
// Baseado nos arquivos App.js, CorrectorScreen.js, ReportsScreen.js
type ReportResult = {
  id: string;
  studentName: string;
  studentMatricula: string;
  studentTurma: string;
  score: string;
  correct: number;
  incorrect: number;
};

type Template = {
  id: string;
  title: string;
  numQuestoes: number;
  results: ReportResult[];
};

// 3. O COMPONENTE - Adaptado para TSX
export default function ReportsScreen() {
  const router = useRouter();

  // 4. ESTADOS - Copiados do ReportsScreen.js
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [viewingResult, setViewingResult] = useState<ReportResult | null>(null);

  // MUDANÇA: Dados simulados, já que ainda não temos o Contexto
  // O original recebia "templates" via props
  const [templates, setTemplates] = useState<Template[]>([]); // Começa vazio

  // 5. O COMPONENTE StatCard - Copiado 100% do ReportsScreen.js
  // (Adicionamos os tipos das props)
  type StatCardProps = {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    label: string;
    value: string | number;
    color?: string;
    fullWidth?: boolean;
  };

  const StatCard = ({ icon, label, value, color, fullWidth = false }: StatCardProps) => (
    <View style={[styles.statCard, fullWidth && styles.statCardFullWidth]}>
      <View style={styles.statIconContainer}>
        <MaterialCommunityIcons name={icon} size={24} color={color || '#346a74'} />
      </View>
      <View style={styles.statTextContainer}>
        <Text style={[styles.statValue, !fullWidth && { fontWeight: 'bold'}]}>{value}</Text> 
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  // 6. RENDERIZAÇÃO (JSX)
  // O JSX abaixo é 99% copiado do ReportsScreen.js
  // As únicas mudanças são nos botões de navegação
  
  // --- NÍVEL 3: DETALHES DO RESULTADO (ALUNO) ---
  if (viewingResult && viewingTemplate) { // MUDANÇA: Garantimos que viewingTemplate não é nulo
    const reportDetails = viewingResult;
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <View style={styles.headerContainer}>
          {/* MUDANÇA: Navegação interna */}
          <TouchableOpacity onPress={() => setViewingResult(null)} style={styles.backButton}> 
             <MaterialCommunityIcons name="arrow-left" size={24} color="#f0f8f8" />
          </TouchableOpacity>
          <Text style={styles.headerTitleResult}>Detalhes da Correção</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* ... (Todo o JSX dos detalhes é idêntico) ... */}
          <Text style={styles.reportTitle}>{viewingTemplate.title}</Text>
          <Text style={styles.reportSubtitle}>Aluno(a): {reportDetails.studentName}</Text>
          
          <View style={styles.individualStatsContainer}>
            <StatCard icon="card-account-details-outline" label="Matrícula" value={reportDetails.studentMatricula} fullWidth />
            <StatCard icon="google-classroom" label="Turma" value={reportDetails.studentTurma} fullWidth />
            <View style={{height: 10}}/>
            <StatCard icon="check-circle-outline" label="Acertos" value={reportDetails.correct} color="#4CAF50" fullWidth />
            <StatCard icon="close-circle-outline" label="Erros" value={reportDetails.incorrect} color="#F44336" fullWidth />
            <StatCard icon="star-circle-outline" label="Nota Final" value={reportDetails.score} fullWidth />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- NÍVEL 2: LISTA DE ALUNOS E MÉTRICAS DA AVALIAÇÃO ---
  if (viewingTemplate) {
    // A lógica de cálculo de métricas é 100% copiada
    const results = viewingTemplate.results || [];
    const aggregateMetrics = {
      classAverage: (results.reduce((sum, r) => sum + parseFloat(r.score.split('/')[0]), 0) / (results.length || 1)).toFixed(1),
      topPerformerName: results.length > 0 ? results.reduce((prev, current) => (parseFloat(prev.score.split('/')[0]) > parseFloat(current.score.split('/')[0])) ? prev : current).studentName : 'N/A',
      lowPerformerName: results.length > 0 ? results.reduce((prev, current) => (parseFloat(prev.score.split('/')[0]) < parseFloat(current.score.split('/')[0])) ? prev : current).studentName : 'N/A',
      hardestQuestionNumber: Math.floor(Math.random() * (viewingTemplate.numQuestoes || 10)) + 1, // Simulado
    };
    
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <View style={styles.headerContainer}>
          {/* MUDANÇA: Navegação interna */}
          <TouchableOpacity onPress={() => setViewingTemplate(null)} style={styles.backButton}>
             <MaterialCommunityIcons name="arrow-left" size={24} color="#f0f8f8" />
          </TouchableOpacity>
          <Text style={styles.headerTitleResult}>Resultados da Avaliação</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* ... (Todo o JSX de estatísticas e lista de alunos é idêntico) ... */}
          <Text style={styles.welcomeTitle}>{viewingTemplate.title}</Text>
          <Text style={styles.sectionTitle}>Desempenho da Turma</Text>
          <View style={styles.statsGrid}>
            <StatCard icon="percent-outline" label="Média da Turma" value={aggregateMetrics.classAverage} />
            <StatCard icon="arrow-up-bold-circle-outline" label="Melhor Aluno" value={aggregateMetrics.topPerformerName} color="#4CAF50" />
            <StatCard icon="arrow-down-bold-circle-outline" label="Pior Desempenho" value={aggregateMetrics.lowPerformerName} color="#F44336" />
            <StatCard icon="help-circle-outline" label="Questão Mais Difícil" value={`Questão ${aggregateMetrics.hardestQuestionNumber}`} />
          </View>
          <Text style={styles.sectionTitle}>Resultados Individuais</Text>
          {results.length === 0 ? (
            <EmptyState
              icon="account-search-outline"
              title="Nenhum Aluno Corrigido"
              message="Ainda não há resultados para esta avaliação."
            />
          ) : (
            results.map(result => (
              <TouchableOpacity key={result.id} style={styles.reportItem} onPress={() => setViewingResult(result)}>
                <View style={styles.reportItemIcon}><MaterialCommunityIcons name="account-circle-outline" size={24} color="#346a74" /></View>
                <View style={styles.reportItemTextContainer}>
                  <Text style={styles.reportItemTitle}>{result.studentName}</Text>
                  <Text style={styles.reportItemDate}>Nota: {result.score}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" style={styles.reportItemChevron} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // --- NÍVEL 1: LISTA DE AVALIAÇÕES (Default) ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#346a74" />
      <View style={styles.headerContainer}>
        {/* MUDANÇA: Navegação para a Home */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <MaterialCommunityIcons name="arrow-left" size={24} color="#f0f8f8" />
        </TouchableOpacity>
        <Text style={styles.headerTitleResult}>Relatórios</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {templates.length === 0 ? (
          <EmptyState
            icon="chart-bar"
            title="Nenhum Relatório Gerado"
            message="Assim que você corrigir uma prova, os relatórios aparecerão aqui."
            buttonText="Corrigir minha primeira prova"
            onButtonPress={() => router.push('/corrector')} // MUDANÇA: Navegação
          />
        ) : (
          <>
            <Text style={styles.welcomeTitle}>Avaliações Corrigidas</Text>
            {templates.map(template => (
              <TouchableOpacity key={template.id} style={styles.reportItem} onPress={() => setViewingTemplate(template)}>
                <View style={styles.reportItemIcon}>
                  <MaterialCommunityIcons name="file-chart-outline" size={24} color="#346a74" />
                </View>
                <View style={styles.reportItemTextContainer}>
                  <Text style={styles.reportItemTitle}>{template.title}</Text>
                  <Text style={styles.reportItemDate}>{(template.results || []).length} correções</Text> 
                </View>
                <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" style={styles.reportItemChevron} />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// 7. ESTILOS - Copiados 100% do ReportsScreen.js
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f8f8' },
  scrollContent: { padding: 20, flexGrow: 1 },
  headerContainer: {
    width: '100%', backgroundColor: '#346a74', paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  backButton: { position: 'absolute', left: 20, top: Platform.OS === 'android' ? 45 : 25 },
  headerTitleResult: { fontSize: 22, fontWeight: 'bold', color: '#f0f8f8' },
  welcomeTitle: { fontSize: 24, fontWeight: '600', color: '#333', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#555', marginBottom: 15, marginTop: 10 },

  // Estilos da Lista (Nível 1 e 2)
  reportItem: {
    width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 15,
    flexDirection: 'row', alignItems: 'center', marginBottom: 15,
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8,
  },
  reportItemIcon: {
    width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E8F5F5',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  reportItemTextContainer: { flex: 1 },
  reportItemTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  reportItemDate: { fontSize: 14, color: '#888', marginTop: 2 },
  reportItemChevron: { marginLeft: 10 },

  // Estilos da Tela de Detalhes (Nível 3)
  reportTitle: { fontSize: 24, fontWeight: '600', color: '#333', textAlign: 'center' },
  reportSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 25 }, 
  
  // Estilos das Métricas Agregadas (Nível 2)
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20,
  },
  statCard: {
    width: '48%', 
    backgroundColor: '#fff', borderRadius: 12, padding: 15,
    alignItems: 'center', marginBottom: 15, elevation: 3, shadowColor: '#000',
    shadowOpacity: 0.08, shadowRadius: 8, flexDirection: 'row',
  },
  statCardFullWidth: { 
    width: '100%',
  },
  statIconContainer: { 
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#E8F5F5',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  statTextContainer: { 
    flex: 1,
  },
  statValue: { fontSize: 18, color: '#333' }, 
  statLabel: { fontSize: 13, color: '#777', marginTop: 2 }, 

  // Estilos das Métricas Individuais (Nível 3)
  individualStatsContainer: {
    marginTop: 10,
  }
});