import { Text } from '../components/CustomText';
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Animated, TextInput, useColorScheme, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  ClipboardList
} from 'lucide-react-native';
import { Colors } from '../theme/Colors';

const { width } = Dimensions.get('window');

// ── DATOS DE DEMO (MOCK DATA) ────────────────────────────────────────────────
const REGISTROS_DEMO = [
  {
    id: 1,
    categoria: 'Laboratorio',
    titulo: 'Panel Metabólico Completo',
    medico: 'Dra. Ana Silva',
    fecha: '24 Oct 2023',
    lugar: 'Clínica Foianini',
    estado: 'Resultados Finales',
    hash: '0x8f...3e9c',
    icono: <FileText size={20} color="#14B8A6" />,
    colorFondo: '#F0FDF9',
    colorFondoDark: 'rgba(20, 184, 166, 0.1)',
    colorBorde: '#14B8A6',
    accionIcono: <Eye size={16} color="#14B8A6" />,
    accionTexto: 'Ver Documento Original',
  },
  {
    id: 2,
    categoria: 'Receta',
    titulo: 'Amoxicilina 500mg',
    medico: 'Dr. Carlos Mendez',
    fecha: '12 Sep 2023',
    dosis: '1 cap / 8 hrs',
    duracion: '7 Días',
    hash: '0xb4...9e11',
    icono: <Pill size={20} color="#F97316" />,
    colorFondo: '#FFF7ED',
    colorFondoDark: 'rgba(249, 115, 22, 0.1)',
    colorBorde: '#F97316',
    accionIcono: <Download size={16} color="#F97316" />,
    accionTexto: 'Descargar Receta',
  },
  {
    id: 3,
    categoria: 'Imágenes',
    titulo: 'Rayos X de Tórax PA/LAT',
    medico: 'Clínica del Sur',
    fecha: '05 Ago 2023',
    estado: 'Imagen Disponible',
    hash: '0xc7...2d4f',
    icono: <Activity size={20} color="#2D7FF9" />,
    colorFondo: '#EFF6FF',
    colorFondoDark: 'rgba(45, 127, 249, 0.1)',
    colorBorde: '#2D7FF9',
    accionIcono: <Eye size={16} color="#2D7FF9" />,
    accionTexto: 'Ver Imagen Original',
  },
];

const CATEGORIAS = ['Todos', 'Laboratorio', 'Recetas', 'Imágenes'];

export default function HistorialScreen({ navigation }: any) {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Animación Fade-In Up
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current; // Matches PermisosScreen (30 instead of 50)

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500, // Matches PermisosScreen
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

  // Filtrado simple para la demo
  const registrosFiltrados = REGISTROS_DEMO.filter((reg) => {
    const coincideCategoria = categoriaActiva === 'Todos' || reg.categoria === categoriaActiva;
    const coincideBusqueda = reg.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             reg.medico.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* ── HEADER BLANCO LIMPIO (ESTILO PERMISOS) ── */}
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

        {/* ── CONTROLES (Búsqueda y Filtros Fijos al hacer scroll) ── */}
        <View style={[styles.controlsContainer, { backgroundColor: theme.background }]}>
          {/* Barra de búsqueda */}
          <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search size={18} color={theme.textSecondary} />
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
                  categoriaActiva === cat && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => setCategoriaActiva(cat)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.chipText,
                  { color: theme.textSecondary },
                  categoriaActiva === cat && { color: '#FFFFFF', fontWeight: '700' }
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── LISTA DE REGISTROS ── */}
        <View style={styles.listContainer}>
          {registrosFiltrados.map((item, index) => (
            <View key={item.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, borderLeftColor: item.colorBorde, shadowColor: isDark ? '#000' : '#000' }]}>
              
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
              <View style={[styles.detailsBox, { backgroundColor: isDark ? theme.background : '#F8FAFC' }]}>
                {item.lugar && (
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
                )}
                {item.dosis && (
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
                )}
              </View>

              {/* Sello de Blockchain */}
              <View style={styles.blockchainRow}>
                <View style={[styles.blockchainBadge, isDark && { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
                  <Shield size={12} color={isDark ? '#C4B5FD' : '#8B5CF6'} />
                  <Text style={[styles.blockchainText, isDark && { color: '#C4B5FD' }]}> Registro Verificado</Text>
                </View>
                <Text style={styles.hashText}>{item.hash}</Text>
              </View>

              {/* Botón de Acción Principal */}
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: isDark ? 'transparent' : '#FFFFFF', borderColor: item.colorBorde }]} activeOpacity={0.7}>
                {item.accionIcono}
                <Text style={[styles.actionButtonText, { color: item.colorBorde }]}>  {item.accionTexto}</Text>
              </TouchableOpacity>
              
            </View>
          ))}
          
          {registrosFiltrados.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No se encontraron registros médicos para "{busqueda}".</Text>
            </View>
          )}

          <View style={{ height: 60 }} />
        </View>

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header Limpio (Copiado 1:1 de PermisosScreen)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0, // Padding goes into sections to allow sticky header full width
    paddingTop: 10,
    paddingBottom: 40,
  },

  // Título de Pantalla
  titleSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  
  // Controles (Búsqueda y Filtros)
  controlsContainer: {
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '500',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsScroll: {
    paddingLeft: 24,
  },
  chipsContainer: {
    paddingRight: 48, // Para que el último chip no quede pegado al borde derecho
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  
  // Lista de Tarjetas
  listContainer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderLeftWidth: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardDoctor: {
    fontSize: 12,
    fontWeight: '500',
  },
  
  // Detalles específicos
  detailsBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  badgeSuccess: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeSuccessText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  
  // Blockchain Row
  blockchainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  blockchainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  blockchainText: {
    fontSize: 10,
    fontWeight: '700',
  },
  hashText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  // Botón de Acción
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
});
