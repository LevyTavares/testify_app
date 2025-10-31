import React from 'react';
import { 
  StyleSheet, SafeAreaView, StatusBar, ScrollView, 
  Platform, Image, View 
} from 'react-native'; // <--- Removemos TouchableOpacity e Text
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
// --- NOVAS IMPORTAÇÕES DO PAPER ---
import { 
  TouchableRipple, // O substituto para TouchableOpacity
  Text as PaperText, // Usamos 'as PaperText' para evitar conflito
  useTheme // Para pegar o borderRadius padrão
} from 'react-native-paper'; 

export default function HomeScreen() {
  const theme = useTheme(); // Pega o tema do Paper

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#346a74" />
      
      {/* Cabeçalho (Header) - Trocamos Text por PaperText */}
      <View style={styles.headerContainer}>
        <Image 
          source={require('../assets/images/testify-icon.png')}
          style={styles.headerIcon}
        />
        <View style={styles.headerTextContainer}>
          <PaperText variant="headlineSmall" style={styles.headerTitle}>Testify</PaperText>
          <PaperText variant="bodyMedium" style={styles.headerSubtitle}>Seu assistente de avaliação</PaperText>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <PaperText variant="headlineMedium" style={styles.welcomeTitle}>Bem-vindo, Professor!</PaperText>

        {/* --- MUDANÇA: TouchableOpacity -> TouchableRipple --- */}
        {/* O Link ainda envolve o componente de toque */}
        <Link href="/createTemplate" asChild>
          {/* Usamos TouchableRipple. O styles.heroButton (que tem o borderRadius) 
              é aplicado diretamente a ele para o efeito "ripple" respeitar as bordas.
          */}
          <TouchableRipple
            style={styles.heroButton}
            onPress={() => {}} // onPress é necessário para o ripple
            rippleColor="rgba(255, 255, 255, 0.3)" // Cor da ondinha (branca)
          >
            {/* O LinearGradient vai dentro do Ripple */}
            <LinearGradient
              colors={['#a1d5d1', '#5e9c98']}
              style={styles.gradient}
            >
              <View style={styles.heroIconContainer}>
                <MaterialCommunityIcons name="file-document-plus-outline" size={32} color="#346a74" />
              </View>
              <View style={styles.heroTextContainer}>
                {/* Usamos PaperText com 'variant' para estilo */}
                <PaperText variant="titleLarge" style={styles.heroButtonText}>Criar um Novo Gabarito</PaperText>
                <PaperText variant="bodyMedium" style={styles.heroButtonSubtext}>Comece a criar sua próxima avaliação</PaperText>
              </View>
            </LinearGradient>
          </TouchableRipple>
        </Link>
        {/* --- FIM DA MUDANÇA --- */}
        
        <PaperText variant="titleMedium" style={styles.sectionTitle}>Ações Rápidas</PaperText>

        <View style={styles.actionsGrid}>
          
          {/* --- MUDANÇA: TouchableOpacity -> TouchableRipple --- */}
          <Link href="/corrector" asChild>
            <TouchableRipple
              style={styles.actionCard} // Aplicamos o estilo do card
              onPress={() => {}}
              rippleColor="rgba(0, 0, 0, 0.1)" // Cor da ondinha (escura)
            >
              {/* O conteúdo do card vai dentro do Ripple */}
              <View style={styles.actionCardContent}>
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons name="camera-iris" size={28} color="#346a74" />
                </View>
                <PaperText variant="titleSmall" style={styles.actionCardText}>Corrigir Provas</PaperText>
              </View>
            </TouchableRipple>
          </Link>

          <Link href="/reports" asChild>
            <TouchableRipple
              style={styles.actionCard} // Aplicamos o estilo do card
              onPress={() => {}}
              rippleColor="rgba(0, 0, 0, 0.1)"
            >
              <View style={styles.actionCardContent}>
                <View style={styles.actionIconContainer}>
                  <MaterialCommunityIcons name="chart-bar" size={28} color="#346a74" />
                </View>
                <PaperText variant="titleSmall" style={styles.actionCardText}>Ver Relatórios</PaperText>
              </View>
            </TouchableRipple>
          </Link>
          {/* --- FIM DA MUDANÇA --- */}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS ATUALIZADOS ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f8f8' },
  scrollContent: { padding: 20 },
  headerContainer: {
    width: '100%',
    backgroundColor: '#346a74',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    marginRight: 15,
  },
  headerTextContainer: {},
  headerTitle: { fontWeight: 'bold', color: '#a1d5d1' }, // PaperText usa 'variant' mas 'style' sobrescreve
  headerSubtitle: { color: '#f0f8f8' },
  welcomeTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 25,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#555',
    marginBottom: 15,
  },
  // Card Principal (Hero)
  heroButton: { // Este é o TouchableRipple
    width: '100%',
    borderRadius: 16, // O Ripple precisa do borderRadius
    marginBottom: 30,
    elevation: 6,
    shadowColor: '#5e9c98',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  gradient: { // O gradiente é o fundo
    borderRadius: 16, // Precisa do borderRadius também
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroButtonText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  heroButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  // Grid de Ações Rápidas
  actionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: { // Este é o TouchableRipple
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12, // Ripple precisa do borderRadius
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#E8F5F5',
  },
  actionCardContent: { // View interna para o conteúdo
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 15,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  actionCardText: {
    fontWeight: '600',
    color: '#346a74',
    textAlign: 'center',
  },
});