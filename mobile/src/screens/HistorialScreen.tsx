import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TextInput,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  Search,
  Filter,
  Activity,
  FileText,
  Pill,
  Shield,
  Eye,
  Download,
  Building,
  Clock,
} from 'lucide-react-native';

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
    colorBorde: '#2D7FF9',
    accionIcono: <Eye size={16} color="#2D7FF9" />,
    accionTexto: 'Ver Imagen Original',
  },
];

const CATEGORIAS = ['Todos', 'Laboratorio', 'Recetas', 'Imágenes'];

export default function HistorialScreen({ navigation }: any) {
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [busqueda, setBusqueda] = useState('');

  // Filtrado simple para la demo
  const registrosFiltrados = REGISTROS_DEMO.filter((reg) => {
    const coincideCategoria = categoriaActiva === 'Todos' || reg.categoria === categoriaActiva;
    const coincideBusqueda = reg.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             reg.medico.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  return (
    <SafeAreaView style={styles.container}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <ArrowLeft size={20} color="#0F2B3D" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerShield}>
            <Shield size={14} color="#14B8A6" strokeWidth={2.5} />
          </View>
          <Text style={styles.headerTitle}>Bolivia Health ID</Text>
        </View>
        <View style={{ width: 38 }} /> {/* Espaciador para centrar el título */}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        
        {/* ── TÍTULO DE SECCIÓN ── */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Expedientes Clínicos</Text>
          <Text style={styles.pageSubtitle}>Tu historial médico verificado y seguro</Text>
        </View>

        {/* ── CONTROLES (Búsqueda y Filtros Fijos al hacer scroll) ── */}
        <View style={styles.controlsContainer}>
          {/* Barra de búsqueda */}
          <View style={styles.searchBar}>
            <Search size={18} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar diagnóstico, laboratorio..."
              placeholderTextColor="#94A3B8"
              value={busqueda}
              onChangeText={setBusqueda}
            />
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Chips de Categorías */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chipsContainer}>
            {CATEGORIAS.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, categoriaActiva === cat && styles.chipActivo]}
                onPress={() => setCategoriaActiva(cat)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, categoriaActiva === cat && styles.chipTextActivo]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── LISTA DE REGISTROS ── */}
        <View style={styles.listContainer}>
          {registrosFiltrados.map((item) => (
            <View key={item.id} style={[styles.card, { borderLeftColor: item.colorBorde }]}>
              
              {/* Encabezado: Título y Médico */}
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: item.colorFondo }]}>
                  {item.icono}
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.cardTitle}>{item.titulo}</Text>
                  <Text style={styles.cardDoctor}>{item.medico} • {item.fecha}</Text>
                </View>
              </View>

              {/* Detalles específicos según el tipo */}
              <View style={styles.detailsBox}>
                {item.lugar && (
                  <>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>CENTRO MÉDICO</Text>
                      <Text style={styles.detailValue}>{item.lugar}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>ESTADO</Text>
                      <View style={styles.badgeSuccess}>
                        <Text style={styles.badgeSuccessText}>{item.estado}</Text>
                      </View>
                    </View>
                  </>
                )}
                {item.dosis && (
                  <>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>DOSIS</Text>
                      <Text style={styles.detailValue}>{item.dosis}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>DURACIÓN</Text>
                      <Text style={styles.detailValue}>{item.duracion}</Text>
                    </View>
                  </>
                )}
              </View>

              {/* Sello de Blockchain */}
              <View style={styles.blockchainRow}>
                <View style={styles.blockchainBadge}>
                  <Shield size={12} color="#8B5CF6" />
                  <Text style={styles.blockchainText}> Registro Verificado</Text>
                </View>
                <Text style={styles.hashText}>{item.hash}</Text>
              </View>

              {/* Botón de Acción Principal */}
              <TouchableOpacity style={[styles.actionButton, { borderColor: item.colorBorde }]} activeOpacity={0.7}>
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

          <View style={{ height: 40 }} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header Minimalista
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerShield: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#0F2B3D', alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 15, fontWeight: '700', color: '#0F2B3D' },
  
  scroll: { flex: 1 },
  
  // Título de Página
  titleSection: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16, backgroundColor: '#F8FAFC' },
  pageTitle: { fontSize: 28, fontWeight: '900', color: '#0F2B3D', letterSpacing: -0.5, marginBottom: 4 },
  pageSubtitle: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  
  // Controles (Búsqueda y Filtros)
  controlsContainer: { backgroundColor: '#F8FAFC', paddingBottom: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 16,
    borderRadius: 16, paddingHorizontal: 16, height: 54,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#0F2B3D', fontWeight: '500' },
  filterButton: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
  },
  chipsScroll: { paddingLeft: 20 },
  chipsContainer: { paddingRight: 40, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: '#FFFFFF', borderRadius: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  chipActivo: { backgroundColor: '#0F2B3D', borderColor: '#0F2B3D' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  chipTextActivo: { color: '#FFFFFF' },
  
  // Lista de Tarjetas
  listContainer: { paddingHorizontal: 20, paddingTop: 8, gap: 20 },
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4,
  },
  cardHeader: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1, justifyContent: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F2B3D', marginBottom: 4 },
  cardDoctor: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  
  // Detalles específicos
  detailsBox: {
    flexDirection: 'row', backgroundColor: '#F8FAFC',
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 9, fontWeight: '800', color: '#94A3B8', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 13, fontWeight: '700', color: '#0F2B3D' },
  badgeSuccess: {
    alignSelf: 'flex-start', backgroundColor: '#ECFDF5',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  badgeSuccessText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
  
  // Blockchain Row
  blockchainRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
  },
  blockchainBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F3FF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#EDE9FE',
  },
  blockchainText: { fontSize: 10, fontWeight: '700', color: '#8B5CF6' },
  hashText: { fontSize: 11, color: '#CBD5E1', fontWeight: '600', fontFamily: 'monospace' },
  
  // Botón de Acción
  actionButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, backgroundColor: '#FFFFFF',
  },
  actionButtonText: { fontSize: 14, fontWeight: '700' },
  
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 22 },
});
