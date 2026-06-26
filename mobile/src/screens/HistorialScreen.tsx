import { Text } from '../components/CustomText';
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Animated, TextInput, useColorScheme, Platform, ActivityIndicator, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import {
  ArrowLeft,
  Search,
  Filter,
  FileText,
  Pill,
  Activity,
  Shield,
  Eye,
  Download,
  Building,
  Clock,
  ClipboardList,
  SearchX
} from 'lucide-react-native';
import { Colors } from '../theme/Colors';
import { supabase } from '../services/supabase';
import { getActiveWallet, getPatientData } from '../services/patientService';

const { width } = Dimensions.get('window');

const CATEGORIAS = ['Todos', 'Laboratorio', 'Recetas', 'Imágenes'];

const AnimatedCard = ({ children, delay }: { children: React.ReactNode, delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 40,
      friction: 7,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0]
        })
      }]
    }}>
      {children}
    </Animated.View>
  );
};

export default function HistorialScreen({ navigation }: any) {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Animación Fade-In Up global
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current; 

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const mapRecordToDemo = (dbItem: any) => {
    let colorBorde = '#3B82F6';
    let colorFondo = '#EFF6FF';
    let colorFondoDark = 'rgba(59, 130, 246, 0.1)';
    let icono = <Activity size={22} color="#3B82F6" />;
    let accionIcono = <Eye size={16} color="#3B82F6" />;
    let accionTexto = 'Ver Documento Original';

    if (dbItem.category === 'Laboratorio') {
      colorBorde = '#14B8A6';
      colorFondo = '#F0FDF9';
      colorFondoDark = 'rgba(20, 184, 166, 0.15)';
      icono = <FileText size={22} color="#14B8A6" />;
      accionIcono = <Eye size={16} color="#14B8A6" />;
      accionTexto = 'Ver Documento Original';
    } else if (dbItem.category === 'Recetas') {
      colorBorde = '#F97316';
      colorFondo = '#FFF7ED';
      colorFondoDark = 'rgba(249, 115, 22, 0.15)';
      icono = <Pill size={22} color="#F97316" />;
      accionIcono = <Download size={16} color="#F97316" />;
      accionTexto = 'Descargar Receta';
    }

    const doctorName = dbItem.doctor?.full_name || 'Médico General';
    const dateFormatted = dbItem.created_at ? new Date(dbItem.created_at).toLocaleDateString('es-BO', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Reciente';

    return {
      id: dbItem.id,
      categoria: dbItem.category,
      titulo: dbItem.title,
      medico: doctorName,
      fecha: dateFormatted,
      lugar: dbItem.category === 'Recetas' ? '' : 'Clínica del Sur',
      estado: 'Resultados Finales',
      dosis: dbItem.dosage || null,
      duracion: dbItem.frequency || null,
      hash: dbItem.tx_hash ? dbItem.tx_hash.slice(0, 6) + '...' + dbItem.tx_hash.slice(-4) : 'Sin firma',
      icono,
      colorFondo,
      colorFondoDark,
      colorBorde,
      accionIcono,
      accionTexto,
      file_url: dbItem.file_url,
    };
  };

  async function fetchHistory() {
    try {
      setIsLoading(true);
      const wallet = await getActiveWallet();
      const patientData = await getPatientData(wallet);
      const patientId = patientData.profile?.id;

      if (!patientId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('health_records')
        .select(`
          *,
          doctor:profiles!health_records_doctor_id_fkey(full_name)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching health records:', error.message);
      } else if (data) {
        setRecords(data.map(mapRecordToDemo));
      } else {
        setRecords([]);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const handleOpenDocument = async (url: string | null) => {
    if (!url) {
      Alert.alert('Documento no disponible', 'No hay un documento adjunto para este registro médico.');
      return;
    }
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'No se puede abrir este tipo de documento en el dispositivo.');
      }
    } catch (error) {
      Alert.alert('Error', 'Hubo un problema al intentar abrir el documento.');
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchHistory();
    });
    fetchHistory();
    return unsubscribe;
  }, [navigation]);

  const registrosFiltrados = records.filter((reg) => {
    const coincideCategoria = categoriaActiva === 'Todos' || reg.categoria === categoriaActiva;
    const coincideBusqueda = reg.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             reg.medico.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textSecondary, fontWeight: '500', marginTop: 12 }}>Cargando historial clínico...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* ── HEADER BLANCO LIMPIO ── */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ClipboardList size={18} color={theme.primary} />
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Historial Clínico</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={[styles.scroll, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        
        {/* ── TÍTULO DE LA PANTALLA ── */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Expedientes Clínicos</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            Tu historial médico verificado y seguro
          </Text>
        </View>

        {/* ── CONTROLES (Búsqueda y Filtros) ── */}
        <View style={[styles.controlsContainer, { backgroundColor: theme.background }]}>
          {/* Barra de búsqueda Premium */}
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }, isDark && styles.glassSearchDark]}>
            <Search size={20} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Buscar diagnóstico, laboratorio..."
              placeholderTextColor={theme.textSecondary}
              value={busqueda}
              onChangeText={setBusqueda}
            />
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Chips de Categorías */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContainer}>
            {CATEGORIAS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.chip,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  categoriaActiva === cat && { backgroundColor: theme.primary, borderColor: theme.primary, shadowColor: theme.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }
                ]}
                onPress={() => setCategoriaActiva(cat)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.chipText,
                  { color: theme.textSecondary },
                  categoriaActiva === cat && { color: '#FFFFFF', fontWeight: '800' }
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── LISTA DE REGISTROS (STAGGERED) ── */}
        <View style={styles.listContainer}>
          {registrosFiltrados.map((item, index) => (
            <AnimatedCard key={`${item.id}-${categoriaActiva}`} delay={index * 100}>
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, borderLeftColor: item.colorBorde, borderLeftWidth: 4 }, isDark && styles.glassCardDark]}>
                
                {/* Encabezado: Título y Médico */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: isDark ? item.colorFondoDark : item.colorFondo }]}>
                    {item.icono}
                  </View>
                  <View style={styles.headerInfo}>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.titulo}</Text>
                    <Text style={[styles.cardDoctor, { color: theme.textSecondary }]}>{item.medico} • {item.fecha}</Text>
                  </View>
                </View>
  
                {/* Detalles específicos según el tipo */}
                <View style={[styles.detailsBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : '#F8FAFC' }]}>
                  {item.lugar ? (
                    <>
                      <View style={styles.detailCol}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>CENTRO MÉDICO</Text>
                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{item.lugar}</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>ESTADO</Text>
                        <View style={[styles.badgeSuccess, isDark && { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                          <Text style={[styles.badgeSuccessText, isDark && { color: '#34D399' }]}>{item.estado}</Text>
                        </View>
                      </View>
                    </>
                  ) : null}
                  {item.dosis ? (
                    <>
                      <View style={styles.detailCol}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>DOSIS</Text>
                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{item.dosis}</Text>
                      </View>
                      <View style={styles.detailCol}>
                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>DURACIÓN</Text>
                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{item.duracion}</Text>
                      </View>
                    </>
                  ) : null}
                </View>
  
                {/* Sello de Blockchain Glowing */}
                <View style={styles.blockchainRow}>
                  <LinearGradient
                    colors={isDark ? ['rgba(139, 92, 246, 0.3)', 'rgba(139, 92, 246, 0.1)'] : ['rgba(139, 92, 246, 0.15)', 'rgba(139, 92, 246, 0.05)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.blockchainBadgeGlow}
                  >
                    <Shield size={14} color={isDark ? '#C4B5FD' : '#8B5CF6'} />
                    <Text style={[styles.blockchainText, { color: isDark ? '#C4B5FD' : '#8B5CF6' }]}> Registro Verificado</Text>
                  </LinearGradient>
                  <Text style={styles.hashText}>{item.hash}</Text>
                </View>
  
                {/* Botón de Acción Principal */}
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF', borderColor: item.colorBorde }]} 
                  activeOpacity={0.7}
                  onPress={() => handleOpenDocument(item.file_url)}
                >
                  {item.accionIcono}
                  <Text style={[styles.actionButtonText, { color: item.colorBorde }]}>  {item.accionTexto}</Text>
                </TouchableOpacity>
                
              </View>
            </AnimatedCard>
          ))}
          
          {registrosFiltrados.length === 0 && (
            <AnimatedCard delay={100}>
              <View style={[styles.emptyStateCard, { backgroundColor: theme.surface, borderColor: theme.border }, isDark && styles.glassCardDark]}>
                <View style={[styles.emptyIconCircle, isDark && { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <SearchX size={48} color={isDark ? '#60A5FA' : '#3B82F6'} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>Sin resultados</Text>
                <Text style={styles.emptyStateDesc}>
                  No pudimos encontrar registros médicos que coincidan con tu búsqueda.
                </Text>
              </View>
            </AnimatedCard>
          )}

          <View style={{ height: 60 }} />
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header Limpio
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },

  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 0, 
    paddingTop: 10,
    paddingBottom: 40,
  },

  // Título de Pantalla
  titleSection: { paddingHorizontal: 24, marginBottom: 24 },
  pageTitle: { fontSize: 30, fontWeight: '900', letterSpacing: -1, marginBottom: 8 },
  pageSubtitle: { fontSize: 15, fontWeight: '500', lineHeight: 22 },
  
  // Controles
  controlsContainer: { paddingBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 24, marginBottom: 16,
    borderRadius: 20, paddingHorizontal: 16, height: 56,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 3,
  },
  glassSearchDark: { backgroundColor: 'rgba(30, 41, 59, 0.6)', borderColor: 'rgba(255, 255, 255, 0.05)' },
  searchInput: { flex: 1, marginLeft: 12, fontSize: 16, fontWeight: '500' },
  filterButton: { padding: 4 },
  
  chipsScroll: { paddingHorizontal: 24 },
  chipsContainer: { paddingRight: 48, gap: 10 },
  chip: {
    paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  chipText: { fontSize: 14, fontWeight: '600' },

  // Lista
  listContainer: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20 },
  card: {
    borderRadius: 24, padding: 22, marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  glassCardDark: { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(255, 255, 255, 0.05)' },
  
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 14 },
  iconBox: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  cardDoctor: { fontSize: 13, fontWeight: '500' },

  detailsBox: {
    flexDirection: 'row', borderRadius: 16, padding: 16,
    marginBottom: 20, gap: 16,
  },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 6 },
  detailValue: { fontSize: 14, fontWeight: '700' },
  badgeSuccess: {
    backgroundColor: '#DCFCE7', alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  badgeSuccessText: { color: '#166534', fontSize: 11, fontWeight: '800' },

  blockchainRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20,
  },
  blockchainBadgeGlow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  blockchainText: { fontSize: 11, fontWeight: '800', marginLeft: 4 },
  hashText: { fontSize: 12, color: '#94A3B8', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },

  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 16, borderWidth: 1,
  },
  actionButtonText: { fontSize: 14, fontWeight: '800' },

  emptyStateCard: {
    padding: 32, alignItems: 'center', borderRadius: 28, borderWidth: 1, marginTop: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5,
  },
  emptyIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyStateTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  emptyStateDesc: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22 },
});
