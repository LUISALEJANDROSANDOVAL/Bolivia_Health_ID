import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  MapPin,
  Stethoscope,
  ChevronDown,
  ChevronRight,
  Ticket,
  Clock,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ── DATOS DE DEMO ────────────────────────────────────────────────────────────
const HOSPITALES = [
  { id: 1, nombre: 'Hospital de Clínicas', ciudad: 'La Paz', tiempo: '~20 min espera' },
  { id: 2, nombre: 'Hospital del Norte', ciudad: 'La Paz', tiempo: '~35 min espera' },
  { id: 3, nombre: 'Caja Nacional de Salud', ciudad: 'La Paz', tiempo: '~45 min espera' },
  { id: 4, nombre: 'Hospital Obrero Nº1', ciudad: 'La Paz', tiempo: '~15 min espera' },
  { id: 5, nombre: 'Hospital San Gabriel', ciudad: 'La Paz', tiempo: '~30 min espera' },
];

const ESPECIALIDADES = [
  { id: 1, nombre: 'Medicina General', icono: '🩺' },
  { id: 2, nombre: 'Pediatría', icono: '👶' },
  { id: 3, nombre: 'Cardiología', icono: '❤️' },
  { id: 4, nombre: 'Traumatología', icono: '🦴' },
  { id: 5, nombre: 'Ginecología', icono: '🌸' },
  { id: 6, nombre: 'Laboratorio', icono: '🔬' },
];

export default function SolicitarFichaScreen({ navigation }: any) {
  const [hospitalSeleccionado, setHospitalSeleccionado] = useState<number | null>(null);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState<number | null>(null);
  const [mostrarHospitales, setMostrarHospitales] = useState(false);
  const [mostrarEspecialidades, setMostrarEspecialidades] = useState(false);

  const hospitalActual = HOSPITALES.find(h => h.id === hospitalSeleccionado);
  const especialidadActual = ESPECIALIDADES.find(e => e.id === especialidadSeleccionada);
  const formularioCompleto = hospitalSeleccionado !== null && especialidadSeleccionada !== null;

  const handleSolicitar = () => {
    if (!formularioCompleto || !hospitalActual || !especialidadActual) return;
    // Navegar a la pantalla de ficha activa con los datos seleccionados
    navigation?.navigate('FichaActiva', {
      hospital: hospitalActual,
      especialidad: especialidadActual,
    });
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={20} color="#0F2B3D" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Solicitar Ficha</Text>
          <Text style={styles.headerSubtitle}>Turno digital para hoy</Text>
        </View>
        <View style={styles.headerRight}>
          <Ticket size={22} color="#2D7FF9" />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* ── BANNER INFORMATIVO ── */}
        <View style={styles.banner}>
          <Clock size={18} color="#2D7FF9" />
          <Text style={styles.bannerText}>
            Solicita tu ficha ahora y evita las filas. Recibirás una notificación cuando sea tu turno.
          </Text>
        </View>

        {/* ── PASO 1: HOSPITAL ── */}
        <Text style={styles.stepLabel}>Paso 1 de 2 · Selecciona el hospital</Text>
        <TouchableOpacity
          style={[styles.selector, hospitalSeleccionado ? styles.selectorActivo : null]}
          activeOpacity={0.8}
          onPress={() => {
            setMostrarHospitales(!mostrarHospitales);
            setMostrarEspecialidades(false);
          }}
        >
          <MapPin size={20} color={hospitalSeleccionado ? '#2D7FF9' : '#94A3B8'} />
          <View style={styles.selectorTexts}>
            <Text style={[styles.selectorPlaceholder, hospitalSeleccionado ? styles.selectorPlaceholderActivo : null]}>
              {hospitalActual ? hospitalActual.nombre : 'Elige un hospital o centro de salud'}
            </Text>
            {hospitalActual && (
              <Text style={styles.selectorMeta}>{hospitalActual.ciudad} · {hospitalActual.tiempo}</Text>
            )}
          </View>
          <ChevronDown size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Lista de hospitales */}
        {mostrarHospitales && (
          <View style={styles.dropdownList}>
            {HOSPITALES.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={[styles.dropdownItem, hospitalSeleccionado === h.id ? styles.dropdownItemActivo : null]}
                onPress={() => {
                  setHospitalSeleccionado(h.id);
                  setMostrarHospitales(false);
                }}
              >
                <View style={styles.dropdownItemLeft}>
                  <Text style={[styles.dropdownItemNombre, hospitalSeleccionado === h.id ? styles.dropdownItemNombreActivo : null]}>
                    {h.nombre}
                  </Text>
                  <Text style={styles.dropdownItemMeta}>{h.ciudad} · {h.tiempo}</Text>
                </View>
                {hospitalSeleccionado === h.id && (
                  <View style={styles.checkDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── PASO 2: ESPECIALIDAD ── */}
        <Text style={[styles.stepLabel, { marginTop: 20 }]}>Paso 2 de 2 · Selecciona la especialidad</Text>
        <TouchableOpacity
          style={[styles.selector, especialidadSeleccionada ? styles.selectorActivo : null]}
          activeOpacity={0.8}
          onPress={() => {
            setMostrarEspecialidades(!mostrarEspecialidades);
            setMostrarHospitales(false);
          }}
        >
          <Stethoscope size={20} color={especialidadSeleccionada ? '#2D7FF9' : '#94A3B8'} />
          <View style={styles.selectorTexts}>
            <Text style={[styles.selectorPlaceholder, especialidadSeleccionada ? styles.selectorPlaceholderActivo : null]}>
              {especialidadActual
                ? `${especialidadActual.icono}  ${especialidadActual.nombre}`
                : 'Elige la especialidad médica'}
            </Text>
          </View>
          <ChevronDown size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Grid de especialidades */}
        {mostrarEspecialidades && (
          <View style={styles.especialidadGrid}>
            {ESPECIALIDADES.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={[styles.especialidadItem, especialidadSeleccionada === e.id ? styles.especialidadItemActivo : null]}
                onPress={() => {
                  setEspecialidadSeleccionada(e.id);
                  setMostrarEspecialidades(false);
                }}
              >
                <Text style={styles.especialidadIcono}>{e.icono}</Text>
                <Text style={[styles.especialidadNombre, especialidadSeleccionada === e.id ? styles.especialidadNombreActivo : null]}>
                  {e.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── RESUMEN ── */}
        {formularioCompleto && (
          <View style={styles.resumenCard}>
            <Text style={styles.resumenTitle}>✅ Resumen de tu solicitud</Text>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Hospital:</Text>
              <Text style={styles.resumenValor}>{hospitalActual?.nombre}</Text>
            </View>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Especialidad:</Text>
              <Text style={styles.resumenValor}>{especialidadActual?.icono} {especialidadActual?.nombre}</Text>
            </View>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Fecha:</Text>
              <Text style={styles.resumenValor}>Hoy · {new Date().toLocaleDateString('es-BO')}</Text>
            </View>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Espera aprox.:</Text>
              <Text style={styles.resumenValor}>{hospitalActual?.tiempo}</Text>
            </View>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── BOTÓN FLOTANTE ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.btnSolicitar, !formularioCompleto ? styles.btnSolicitarDeshabilitado : null]}
          activeOpacity={0.85}
          onPress={handleSolicitar}
          disabled={!formularioCompleto}
        >
          <Ticket size={20} color="#FFFFFF" />
          <Text style={styles.btnSolicitarText}>  Solicitar mi Ficha Digital</Text>
          <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F2B3D' },
  headerSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  headerRight: {
    marginLeft: 'auto',
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#EFF6FF', borderRadius: 14,
    padding: 14, marginBottom: 24,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  bannerText: { flex: 1, fontSize: 13, color: '#2D7FF9', fontWeight: '500', lineHeight: 19 },
  stepLabel: {
    fontSize: 11, fontWeight: '700', color: '#64748B',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, borderWidth: 1.5, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  selectorActivo: { borderColor: '#2D7FF9', backgroundColor: '#FAFCFF' },
  selectorTexts: { flex: 1 },
  selectorPlaceholder: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  selectorPlaceholderActivo: { color: '#0F2B3D', fontWeight: '700' },
  selectorMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  dropdownList: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 6,
    borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  dropdownItemActivo: { backgroundColor: '#EFF6FF' },
  dropdownItemLeft: { flex: 1 },
  dropdownItemNombre: { fontSize: 14, fontWeight: '600', color: '#0F2B3D' },
  dropdownItemNombreActivo: { color: '#2D7FF9' },
  dropdownItemMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  checkDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#2D7FF9',
  },
  especialidadGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6,
  },
  especialidadItem: {
    width: (width - 54) / 2,
    backgroundColor: '#FFFFFF', borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  especialidadItemActivo: { borderColor: '#2D7FF9', backgroundColor: '#EFF6FF' },
  especialidadIcono: { fontSize: 24, marginBottom: 6 },
  especialidadNombre: { fontSize: 12, fontWeight: '600', color: '#0F2B3D', textAlign: 'center' },
  especialidadNombreActivo: { color: '#2D7FF9' },
  resumenCard: {
    backgroundColor: '#F0FDF9', borderRadius: 14, padding: 16,
    marginTop: 20, borderWidth: 1, borderColor: '#A7F3D0', gap: 8,
  },
  resumenTitle: { fontSize: 13, fontWeight: '700', color: '#065F46', marginBottom: 4 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between' },
  resumenLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  resumenValor: { fontSize: 13, color: '#0F2B3D', fontWeight: '700' },
  bottomBar: {
    padding: 20, paddingBottom: 32, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  btnSolicitar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2D7FF9', borderRadius: 16, paddingVertical: 18,
    shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  btnSolicitarDeshabilitado: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  btnSolicitarText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
