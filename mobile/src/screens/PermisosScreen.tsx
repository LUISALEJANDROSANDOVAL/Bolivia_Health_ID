import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Dimensions,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  ShieldCheck,
  CheckSquare,
  Square,
  Lock,
  MapPin,
  Clock,
  UserCircle,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ── DATOS MOCK DEL DOCTOR ──────────────────────────────────────────────────
const DOCTOR_DEMO = {
  nombre: 'Dr. Jose Mamani',
  especialidad: 'Cardiología',
  hospital: 'Hospital de Clínicas',
};

const DURACIONES = ['Solo hoy', '24 horas', '7 días', 'Persistente'];

const CATEGORIAS_DATOS = [
  { id: 'historial', label: 'Mis diagnósticos y consultas' },
  { id: 'signos', label: 'Mis signos vitales actuales' },
  { id: 'recetas', label: 'Mis recetas médicas activas' },
  { id: 'laboratorios', label: 'Mis resultados de laboratorio' },
];

export default function PermisosScreen({ navigation }: any) {
  const [duracionSeleccionada, setDuracionSeleccionada] = useState('Solo hoy');
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([
    'historial',
    'signos',
  ]);

  const toggleCategoria = (id: string) => {
    if (categoriasSeleccionadas.includes(id)) {
      setCategoriasSeleccionadas(categoriasSeleccionadas.filter((c) => c !== id));
    } else {
      setCategoriasSeleccionadas([...categoriasSeleccionadas, id]);
    }
  };

  const handleAutorizar = () => {
    // Aquí iría la lógica de firma en la blockchain
    alert('Acceso autorizado y registrado en la Blockchain exitosamente.');
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <ArrowLeft size={20} color="#0F2B3D" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ShieldCheck size={16} color="#14B8A6" />
          <Text style={styles.headerTitle}>Centro de Privacidad</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── BANNER DE SEGURIDAD ── */}
        <View style={styles.securityBanner}>
          <Lock size={14} color="#8B5CF6" />
          <Text style={styles.securityBannerText}>
            Acceso protegido por Blockchain y Biometría
          </Text>
        </View>

        {/* ── TÍTULO DE LA PANTALLA ── */}
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Compartir Mis Datos</Text>
          <Text style={styles.pageSubtitle}>
            Estás a punto de otorgar acceso temporal a tu información médica verificada. Tú tienes el control total.
          </Text>
        </View>

        {/* ── SECCIÓN 1: ¿CON QUIÉN COMPARTES? ── */}
        <Text style={styles.sectionTitle}>¿CON QUIÉN COMPARTES?</Text>
        <View style={styles.doctorCard}>
          <View style={styles.doctorAvatarContainer}>
            {/* Usamos un ícono genérico ya que no tenemos una URL de imagen real a mano */}
            <UserCircle size={48} color="#94A3B8" strokeWidth={1} />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={styles.doctorName}>{DOCTOR_DEMO.nombre}</Text>
            <Text style={styles.doctorSpecialty}>{DOCTOR_DEMO.especialidad}</Text>
            <View style={styles.doctorHospitalRow}>
              <MapPin size={12} color="#64748B" />
              <Text style={styles.doctorHospitalText}>{DOCTOR_DEMO.hospital}</Text>
            </View>
          </View>
        </View>

        {/* ── SECCIÓN 2: TIEMPO DE ACCESO ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>DURACIÓN DEL ACCESO</Text>
          <Clock size={14} color="#64748B" />
        </View>
        <View style={styles.duracionGrid}>
          {DURACIONES.map((duracion) => {
            const isSelected = duracionSeleccionada === duracion;
            return (
              <TouchableOpacity
                key={duracion}
                style={[styles.duracionBtn, isSelected && styles.duracionBtnActivo]}
                onPress={() => setDuracionSeleccionada(duracion)}
                activeOpacity={0.8}
              >
                <Text style={[styles.duracionBtnText, isSelected && styles.duracionBtnTextActivo]}>
                  {duracion}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── SECCIÓN 3: ¿QUÉ INFORMACIÓN COMPARTIR? ── */}
        <Text style={styles.sectionTitle}>¿QUÉ DATOS DESEAS COMPARTIR?</Text>
        <View style={styles.categoriasContainer}>
          {CATEGORIAS_DATOS.map((cat, index) => {
            const isSelected = categoriasSeleccionadas.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoriaRow,
                  index !== CATEGORIAS_DATOS.length - 1 && styles.categoriaBorderBottom,
                ]}
                onPress={() => toggleCategoria(cat.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoriaLeft}>
                  <Text style={[styles.categoriaLabel, isSelected && styles.categoriaLabelActivo]}>
                    {cat.label}
                  </Text>
                </View>
                <View style={styles.checkboxContainer}>
                  {isSelected ? (
                    <CheckSquare size={24} color="#0F2B3D" fill="#F4F7FC" />
                  ) : (
                    <Square size={24} color="#CBD5E1" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── ESPACIADOR PARA EMPUJAR BOTONES AL FONDO ── */}
        <View style={{ height: 40 }} />

        {/* ── BOTONES DE ACCIÓN ── */}
        <TouchableOpacity style={styles.btnPrimary} onPress={handleAutorizar} activeOpacity={0.85}>
          <Lock size={18} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}> Autorizar Acceso Seguro</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Text style={styles.btnSecondaryText}>Cancelar</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  
  // Header
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
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 14, fontWeight: '700', color: '#0F2B3D' },
  
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  
  // Banner Seguridad
  securityBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#F5F3FF', borderRadius: 12, paddingVertical: 10, marginBottom: 24,
    borderWidth: 1, borderColor: '#EDE9FE',
  },
  securityBannerText: { fontSize: 11, fontWeight: '700', color: '#8B5CF6' },
  
  // Título
  titleSection: { marginBottom: 32 },
  pageTitle: { fontSize: 26, fontWeight: '900', color: '#0F2B3D', letterSpacing: -0.5, marginBottom: 8 },
  pageSubtitle: { fontSize: 14, color: '#64748B', fontWeight: '500', lineHeight: 20 },
  
  // Títulos de Sección
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: '#94A3B8', letterSpacing: 1, marginBottom: 12 },
  
  // Tarjeta de Doctor
  doctorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 32,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  doctorAvatarContainer: {
    width: 60, height: 60, borderRadius: 16,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  doctorInfo: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: 17, fontWeight: '800', color: '#0F2B3D', marginBottom: 4 },
  doctorSpecialty: { fontSize: 11, fontWeight: '700', color: '#2D7FF9', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  doctorHospitalRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  doctorHospitalText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  
  // Grid de Duración
  duracionGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10,
    marginBottom: 32,
  },
  duracionBtn: {
    width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  duracionBtnActivo: {
    backgroundColor: '#0F2B3D', borderColor: '#0F2B3D',
    shadowColor: '#0F2B3D', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  duracionBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  duracionBtnTextActivo: { color: '#FFFFFF', fontWeight: '700' },
  
  // Categorías de Datos (Checkboxes)
  categoriasContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2,
    marginBottom: 32,
  },
  categoriaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, paddingHorizontal: 20,
  },
  categoriaBorderBottom: {
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  categoriaLeft: { flex: 1, paddingRight: 16 },
  categoriaLabel: { fontSize: 15, fontWeight: '500', color: '#64748B' },
  categoriaLabelActivo: { color: '#0F2B3D', fontWeight: '700' },
  checkboxContainer: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  
  // Botones de Acción
  btnPrimary: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0F2B3D', borderRadius: 16, paddingVertical: 18,
    shadowColor: '#0F2B3D', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
    marginBottom: 16,
  },
  btnPrimaryText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  btnSecondary: {
    alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
  },
  btnSecondaryText: { fontSize: 15, fontWeight: '700', color: '#64748B' },
});
