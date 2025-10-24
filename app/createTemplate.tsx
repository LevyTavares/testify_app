import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, 
  ScrollView, SafeAreaView, StatusBar, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
// 1. Verifique este import
import { useTemplates } from '../context/TemplateContext';

// Constantes copiadas
const GABARITO_SIMULADO_URL = 'https://i.imgur.com/g0n8h3b.png';
const CHOICES = ['A', 'B', 'C', 'D', 'E'];

export default function CreateTemplateScreen() {
  const router = useRouter(); 
  // 2. Verifique se você está "puxando" a função do cérebro
  const { handleAddTemplate } = useTemplates(); 

  // Estados locais (copiados)
  const [step, setStep] = useState(1);
  const [tituloProva, setTituloProva] = useState('');
  const [numQuestoes, setNumQuestoes] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState<{[key: number]: string | null}>({});

  // Funções locais (copiadas)
  const handleNextStep = () => {
    if (!tituloProva || !numQuestoes || parseInt(numQuestoes, 10) <= 0) {
      alert('Por favor, preencha todos os campos com valores válidos.');
      return;
    }
    const initialAnswers: {[key: number]: string | null} = {};
    for (let i = 1; i <= parseInt(numQuestoes, 10); i++) {
      initialAnswers[i] = null;
    }
    setCorrectAnswers(initialAnswers);
    setStep(2);
  };

  const handleSelectAnswer = (questionNumber: number, answer: string) => {
    setCorrectAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionNumber]: answer,
    }));
  };
  
  const handleReset = () => {
    setTituloProva('');
    setNumQuestoes('');
    setCorrectAnswers({});
    setStep(1);
  };

  // 3. Verifique esta função (handleSaveTemplate)
  // Esta é a função que salva no "cérebro"
  const handleSaveTemplate = () => {
    const allAnswered = Object.values(correctAnswers).every(ans => ans !== null);
    if (!allAnswered) {
      alert('Por favor, selecione a resposta correta para todas as questões.');
      return;
    }
    
    // Lógica para formatar as respostas (copiada)
    const answersArray = Object.keys(correctAnswers)
                             .sort((a, b) => parseInt(a) - parseInt(b))
                             .map(key => correctAnswers[parseInt(key, 10)]!);
                             
    // A CHAMADA MAIS IMPORTANTE:
    handleAddTemplate(tituloProva, numQuestoes, answersArray); //
    
    setStep(3);
  };

  // --- O resto do seu JSX (visual) continua o mesmo ---
  // (Ele é idêntico ao que te passei antes, então vou omitir por brevidade)
  // ... (Cole o JSX dos 3 Passos aqui)
  // --- PASSO 3 ---
  if (step === 3) {
     return (
       <SafeAreaView style={styles.container}>
         <StatusBar barStyle="light-content" backgroundColor="#346a74" />
         <View style={styles.headerContainer}>
           <TouchableOpacity onPress={() => router.back()} style={styles.backButton}> 
             <MaterialCommunityIcons name="arrow-left" size={24} color="#f0f8f8" />
           </TouchableOpacity>
           <Text style={styles.headerTitleResult}>Gabarito Salvo</Text>
         </View>
         <ScrollView contentContainerStyle={styles.scrollContent}>
           <View style={styles.card}>
             <View style={styles.formHeader}>
               <View style={[styles.formHeaderIconContainer, { backgroundColor: '#d4edda'}]}>
                 <MaterialCommunityIcons name="check-circle-outline" size={32} color="#155724" />
               </View>
               <Text style={styles.formHeaderTitle}>Gabarito Salvo com Sucesso!</Text>
               <Text style={styles.infoText}>
                 O gabarito "{tituloProva}" foi salvo. Abaixo está uma prévia da folha de respostas gerada.
               </Text>
             </View>
             <Image 
               source={{ uri: GABARITO_SIMULADO_URL }} 
               style={styles.gabaritoImage} 
               resizeMode="contain" 
             />
             <TouchableOpacity 
               style={[styles.secondaryButton, { marginTop: 20 }]}
               onPress={() => alert('Simulando download da imagem do gabarito em branco...')}
             >
               <Text style={styles.secondaryButtonText}>Baixar Gabarito (PNG)</Text>
             </TouchableOpacity>
             <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/corrector')}>
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
  // --- PASSO 2 ---
  if (step === 2) {
     return (
       <SafeAreaView style={styles.container}>
       <StatusBar barStyle="light-content" backgroundColor="#346a74" />
       <View style={styles.headerContainer}>
         <TouchableOpacity onPress={() => setStep(1)} style={styles.backButton}>
           <MaterialCommunityIcons name="arrow-left" size={24} color="#f0f8f8" />
         </TouchableOpacity>
         <Text style={styles.headerTitleResult}>Definir Respostas</Text>
       </View>
       <ScrollView contentContainerStyle={styles.scrollContent}>
         <View style={styles.card}>
           <Text style={styles.formHeaderTitle}>Respostas Corretas</Text>
           <Text style={styles.infoText}>Selecione a alternativa correta para cada questão.</Text>
           {Object.keys(correctAnswers).map((questionNumberStr) => {
             const questionNumber = parseInt(questionNumberStr, 10);
             return (
               <View key={questionNumber} style={styles.answerRow}>
                 <Text style={styles.questionNumber}>{questionNumberStr.padStart(2, '0')}.</Text>
                 <View style={styles.choicesContainer}>
                   {CHOICES.map(choice => (
                     <TouchableOpacity 
                       key={choice}
                       style={[
                         styles.choiceButton, 
                         correctAnswers[questionNumber] === choice && styles.choiceButtonSelected
                       ]}
                       onPress={() => handleSelectAnswer(questionNumber, choice)}
                     >
                       <Text 
                         style={[
                           styles.choiceButtonText,
                           correctAnswers[questionNumber] === choice && styles.choiceButtonTextSelected
                         ]}
                       >
                         {choice}
                       </Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               </View>
             )
           })}
           <TouchableOpacity style={styles.gradientButtonContainer} onPress={handleSaveTemplate}>
             <LinearGradient colors={['#a1d5d1', '#5e9c98']} style={styles.gradientButton}>
               <Text style={styles.gradientButtonText}>Salvar Gabarito Completo</Text>
             </LinearGradient>
           </TouchableOpacity>
         </View>
       </ScrollView>
     </SafeAreaView>
     );
  }
  // --- PASSO 1 ---
  if (step === 1) {
      return (
     <SafeAreaView style={styles.container}>
       <StatusBar barStyle="light-content" backgroundColor="#346a74" />
       <View style={styles.headerContainer}>
         <TouchableOpacity onPress={() => router.back()} style={styles.backButton}> 
           <MaterialCommunityIcons name="arrow-left" size={24} color="#f0f8f8" />
         </TouchableOpacity>
         <Text style={styles.headerTitleResult}>Criar Gabarito</Text>
       </View>
       <ScrollView contentContainerStyle={styles.scrollContent}>
         <View style={styles.card}>
           <View style={styles.formHeader}>
             <View style={styles.formHeaderIconContainer}>
               <MaterialCommunityIcons name="file-document-plus-outline" size={32} color="#346a74" />
             </View>
             <Text style={styles.formHeaderTitle}>Detalhes da Avaliação</Text>
           </View>
           <View style={styles.inputContainer}>
             <MaterialCommunityIcons name="format-title" size={22} color="#999" style={styles.inputIcon} />
             <TextInput style={styles.input} placeholder="Título da Prova" placeholderTextColor="#999" value={tituloProva} onChangeText={setTituloProva} />
           </View>
           <View style={styles.inputContainer}>
             <MaterialCommunityIcons name="pound" size={22} color="#999" style={styles.inputIcon} />
             <TextInput style={styles.input} placeholder="Número de Questões" placeholderTextColor="#999" value={numQuestoes} onChangeText={setNumQuestoes} keyboardType="numeric" />
           </View>
           <TouchableOpacity style={styles.gradientButtonContainer} onPress={handleNextStep}>
             <LinearGradient colors={['#a1d5d1', '#5e9c98']} style={styles.gradientButton}>
               <Text style={styles.gradientButtonText}>Próximo: Definir Respostas</Text>
             </LinearGradient>
           </TouchableOpacity>
         </View>
       </ScrollView>
     </SafeAreaView>
   );
  }
}

// Estilos (copiados 100% do CreateTemplateScreen.js)
const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: '#f0f8f8' },
  scrollContent: { padding: 20, alignItems: 'center', paddingBottom: 40 }, 
  headerContainer: {
    width: '100%', backgroundColor: '#346a74', paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center',
  },
  backButton: { position: 'absolute', left: 20, top: Platform.OS === 'android' ? 45 : 25 },
  headerTitleResult: { fontSize: 22, fontWeight: 'bold', color: '#f0f8f8' },
  card: {
    width: '100%', backgroundColor: '#fff', borderRadius: 16, padding: 25,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  formHeader: { alignItems: 'center', marginBottom: 30 },
  formHeaderIconContainer: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#E8F5F5',
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
  },
  formHeaderTitle: { fontSize: 20, fontWeight: '600', color: '#333', textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f7f7f7',
    borderRadius: 10, borderWidth: 1, borderColor: '#eee',
    marginBottom: 20, paddingHorizontal: 15,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, height: 55, fontSize: 16, color: '#333' },
  gradientButtonContainer: {
    borderRadius: 12, marginTop: 15, elevation: 4,
    shadowColor: '#5e9c98', shadowOpacity: 0.4, shadowRadius: 6,
  },
  gradientButton: { borderRadius: 12, height: 55, justifyContent: 'center', alignItems: 'center' },
  gradientButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  gabaritoImage: {
    width: '100%', 
    aspectRatio: 1 / Math.sqrt(2), 
    height: undefined, 
    marginBottom: 25, 
    borderRadius: 8,
    borderWidth: 1, 
    borderColor: '#ccc',
  },
  infoText: { textAlign: 'center', marginVertical: 15, color: '#666', fontSize: 14, lineHeight: 20 },
  secondaryButton: {
    width: '100%', height: 50, backgroundColor: '#f0f8f8', borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginTop: 10,
    borderWidth: 1, borderColor: '#a1d5d1',
  },
  secondaryButtonText: { color: '#346a74', fontSize: 16, fontWeight: '600' },
  textButton: { marginTop: 20, alignSelf: 'center' },
  textButtonText: { color: '#346a74', fontSize: 16, textDecorationLine: 'underline' },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 5,
  },
  questionNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    width: 40,
  },
  choicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
  },
  choiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  choiceButtonSelected: {
    backgroundColor: '#346a74',
    borderColor: '#346a74',
  },
  choiceButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
  },
  choiceButtonTextSelected: {
    color: '#fff',
  },
});