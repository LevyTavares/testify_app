import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, 
  ScrollView, Platform, ActivityIndicator, TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// Importa o EmptyState da pasta 'components'
import EmptyState from '../components/EmptyState';
// Importa o "cérebro" (Contexto)
import { useTemplates, Template } from '../context/TemplateContext';

// Dados simulados do CorrectorScreen.js
const correctionResult = { score: '9.0 / 10.0', correct: 9, incorrect: 1 };

// O Componente
export default function CorrectorScreen() {
  const router = useRouter();

  // "Puxa" os dados do "cérebro" (Contexto)
  const { templates, handleAddReport } = useTemplates();

  // ESTADOS - Copiados do CorrectorScreen.js
  const [step, setStep] = useState('selectTemplate');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentMatricula, setStudentMatricula] = useState('');
  const [studentTurma, setStudentTurma] = useState('');

  // Efeito do processamento - Copiado do CorrectorScreen.js
  useEffect(() => {
    // ===== AQUI ESTÁ A CORREÇÃO =====
    let timer: number | undefined; // O tipo correto é "number", não "NodeJS.Timeout"
    // ================================

    if (step === 'processing') {
      timer = setTimeout(() => setStep('result'), 2500);
    }
    return () => clearTimeout(timer);
  }, [step]);

  // FUNÇÕES - Copiadas e adaptadas
  const startCorrection = (template: Template) => {
    setSelectedTemplate(template);
    setStep('camera');
  };

  // Função que chama o "cérebro" para salvar
  const handleSaveReport = () => {
    if (!studentName) {
      alert('Por favor, insira pelo menos o nome do aluno.');
      return false;
    }
    
    if (selectedTemplate) {
      // Chama a função do cérebro (Context)
      handleAddReport(selectedTemplate, correctionResult, studentName, studentMatricula, studentTurma);
    } else {
      alert("Erro: Nenhum gabarito selecionado.");
      return false;
    }
    
    setStudentName('');
    setStudentMatricula('');
    setStudentTurma('');
    return true;
  };

  const handleCorrectNext = () => {
    const saved = handleSaveReport();
    if (saved) {
      setStep('camera');
    }
  };

  const handleFinish = () => {
    const saved = handleSaveReport();
    if (saved) {
      router.push('/reports');
    }
  };

  // --- RENDERIZAÇÃO (JSX) ---
  
  // --- PASSO 4: RESULTADO (MODIFICADO COM NOVOS CAMPOS) ---
  if (step === 'result') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => setStep('selectTemplate')} style={styles.backButton}>
             <MaterialCommunityIcons name="arrow-left" size={24} color="#f0f8f8" />
          </TouchableOpacity>
          <Text style={styles.headerTitleResult}>Resultado da Correção</Text>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            <View style={styles.resultHeader}>
              <MaterialCommunityIcons name="check-decagram" size={40} color="#4CAF50" />
              <Text style={styles.resultScore}>{correctionResult.score}</Text>
            </View>
            <View style={styles.resultDetails}>
              <Text style={styles.detailText}>Acertos: {correctionResult.correct}</Text>
              <Text style={styles.detailText}>Erros: {correctionResult.incorrect}</Text>
            </View>

            <Text style={styles.label}>Nome do Aluno(a)</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="account" size={22} color="#999" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Digite o nome do aluno" 
                placeholderTextColor="#999" 
                value={studentName}
                onChangeText={setStudentName}
              />
            </View>

            <Text style={styles.label}>Matrícula (Opcional)</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="card-account-details-outline" size={22} color="#999" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Digite a matrícula" 
                placeholderTextColor="#999" 
                value={studentMatricula}
                onChangeText={setStudentMatricula}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.label}>Turma (Opcional)</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="google-classroom" size={22} color="#999" style={styles.inputIcon} />
              <TextInput 
                style={styles.input} 
                placeholder="Digite a turma" 
                placeholderTextColor="#999" 
                value={studentTurma}
                onChangeText={setStudentTurma}
              />
            </View>
            
            <TouchableOpacity style={styles.primaryButton} onPress={handleCorrectNext}>
              <Text style={styles.primaryButtonText}>Salvar e Corrigir Próxima</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleFinish}>
              <Text style={styles.secondaryButtonText}>Salvar e Finalizar Sessão</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }
  
  // --- PASSO 'camera' ---
  if (step === 'camera') {
    return (
      <View style={styles.cameraContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.cameraOverlay}>
          <Text style={styles.cameraText}>Alinhe a folha de respostas</Text>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <TouchableOpacity style={styles.captureButton} onPress={() => setStep('processing')}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    );
  }
  
  // --- PASSO 'processing' ---
  if (step === 'processing') {
    return (
      <View style={styles.processingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#346a74" />
        <ActivityIndicator size="large" color="#a1d5d1" />
        <Text style={styles.processingText}>Analisando imagem...</Text>
      </View>
    );
  }

  // --- PASSO 'selectTemplate' (Default) ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#346a74" />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
           <MaterialCommunityIcons name="arrow-left" size={24} color="#f0f8f8" />
        </TouchableOpacity>
        <Text style={styles.headerTitleResult}>Corrigir Provas</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Agora "templates" vem do cérebro (Contexto) */}
        {templates.length === 0 ? (
          <EmptyState
            icon="file-document-outline"
            title="Nenhum Gabarito Encontrado"
            message="Você precisa criar um gabarito antes de poder corrigir uma prova."
            buttonText="Criar meu primeiro gabarito"
            onButtonPress={() => router.push('/createTemplate')}
          />
        ) : (
          <>
            <Text style={styles.welcomeTitle}>Selecione o Gabarito</Text>
            {templates.map(template => (
              <TouchableOpacity key={template.id} style={styles.reportItem} onPress={() => startCorrection(template)}>
                <View style={styles.reportItemIcon}><MaterialCommunityIcons name="file-document-outline" size={24} color="#346a74" /></View>
                <View>
                  <Text style={styles.reportItemTitle}>{template.title}</Text>
                  <Text style={styles.reportItemDate}>Criado em: {template.date}</Text>
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

// ESTILOS - Copiados 100% do CorrectorScreen.js
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
  reportItem: {
    width: '100%', backgroundColor: '#fff', borderRadius: 12, padding: 20,
    flexDirection: 'row', alignItems: 'center', marginBottom: 15, elevation: 3,
  },
  reportItemIcon: {
    width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E8F5F5',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
  },
  reportItemTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  reportItemDate: { fontSize: 14, color: '#888', marginTop: 2 },
  reportItemChevron: { position: 'absolute', right: 20 },
  
  cameraContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  cameraOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  cameraText: { color: 'white', fontSize: 18, position: 'absolute', top: '15%' },
  corner: {
    width: 50, height: 50, position: 'absolute',
    borderColor: 'white', borderWidth: 4,
  },
  topLeft: { top: '25%', left: '10%', borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: '25%', right: '10%', borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: '25%', left: '10%', borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: '25%', right: '10%', borderLeftWidth: 0, borderTopWidth: 0 },
  captureButton: {
    position: 'absolute', bottom: 50, width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  captureButtonInner: {
    width: 60, height: 60, borderRadius: 30, borderWidth: 3, borderColor: '#000',
  },

  processingContainer: { flex: 1, backgroundColor: '#346a74', justifyContent: 'center', alignItems: 'center' },
  processingText: { color: '#f0f8f8', fontSize: 20, marginTop: 20 },

  card: {
    width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 25,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
  },
  resultHeader: { alignItems: 'center', marginBottom: 20 },
  resultScore: { fontSize: 48, fontWeight: 'bold', color: '#346a74', marginVertical: 10 },
  resultDetails: {
    flexDirection: 'row', justifyContent: 'space-around', width: '100%',
    paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#eee', marginBottom: 20,
  },
  detailText: { fontSize: 16, color: '#333' },
  
  label: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f7f7',
    borderRadius: 10, borderWidth: 1, borderColor: '#eee',
    marginBottom: 20, paddingHorizontal: 15,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 55, fontSize: 16, color: '#333' },

  primaryButton: {
    width: '100%', height: 55, backgroundColor: '#a1d5d1', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  },
  primaryButtonText: { color: '#346a74', fontSize: 18, fontWeight: 'bold' },
  secondaryButton: {
    width: '100%', height: 50, backgroundColor: '#f0f8f8', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#a1d5d1',
  },
  secondaryButtonText: { color: '#346a74', fontSize: 16, fontWeight: '600' },
});