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
  Baby,
  HeartPulse,
  Bone,
  Users,
  Microscope,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');

// ── DATOS DE DEMO ────────────────────────────────────────────────────────────
const HOSPITALES = [
  { id: 1, nombre: 'Clínica del Sur (Sede Central)', ciudad: 'La Paz', tiempo: '~10 min espera' },
  { id: 2, nombre: 'Centro Médico Especializado', ciudad: 'La Paz', tiempo: '~15 min espera' },
  { id: 3, nombre: 'Clínica Alemana', ciudad: 'La Paz', tiempo: '~20 min espera' },
  { id: 4, nombre: 'Clínica Los Andes', ciudad: 'La Paz', tiempo: '~5 min espera' },
  { id: 5, nombre: 'Policlínico Privado', ciudad: 'La Paz', tiempo: '~12 min espera' },
];

const ESPECIALIDADES = [
  { id: 1, nombre: 'Medicina General', Icon: Stethoscope },
  { id: 2, nombre: 'Pediatría', Icon: Baby },
  { id: 3, nombre: 'Cardiología', Icon: HeartPulse },
  { id: 4, nombre: 'Traumatología', Icon: Bone },
  { id: 5, nombre: 'Ginecología', Icon: Users },
  { id: 6, nombre: 'Laboratorio', Icon: Microscope },
];

export default function SolicitarFichaScreen({ navigation }: any) {
  const [hospitalSeleccionado, setHospitalSeleccionado] = useState<number | null>(null);
  const [especialidadSeleccionada, setEspecialidadSeleccionada] = useState<number | null>(null);
  const [mostrarHospitales, setMostrarHospitales] = useState(false);
  const [mostrarEspecialidades, setMostrarEspecialidades] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const insets = useSafeAreaInsets();

  const hospitalActual = HOSPITALES.find(h => h.id === hospitalSeleccionado);
  const especialidadActual = ESPECIALIDADES.find(e => e.id === especialidadSeleccionada);
  
  // Evaluación estricta a booleano para evitar crashes
  const formularioCompleto = (hospitalSeleccionado !== null) && (especialidadSeleccionada !== null);

  const handleSolicitar = async () => {
    if (!formularioCompleto || !hospitalActual || !especialidadActual || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      let patientId = await AsyncStorage.getItem('@particle_patient_id');
      
      // Simulación de Particle temporal para el desarrollo del Módulo 4
      if (!patientId) {
        const { data: profile } = await supabase.from('profiles').select('id').eq('role', 'paciente').limit(1).single();
        if (profile) {
          patientId = profile.id;
          await AsyncStorage.setItem('@particle_patient_id', patientId as string);
        }
      }

      if (!patientId) {
        console.warn('No se encontró un perfil de paciente para simular.');
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase.from('appointments').insert({
        patient_id: patientId,
        specialty: especialidadActual.nombre,
        location: hospitalActual.nombre,
        status: 'scheduled',
        type: 'presencial',
      });

      if (error) throw error;

      // Navegamos de vuelta a FichaActiva (se recargará automáticamente)
      navigation?.navigate('FichaActiva');
    } catch (err) {
      console.error('Error insertando cita:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <ArrowLeft size={20} color="#0F2B3D" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Agendar Cita</Text>
          <Text style={styles.headerSubtitle}>Reserva tu atención médica</Text>
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
            Agenda tu cita médica ahora y disfruta de atención preferencial. Te notificaremos cuando sea tu turno.
          </Text>
        </View>

        {/* ── PASO 1: HOSPITAL ── */}
        <Text style={styles.stepLabel}>Paso 1 de 2 · Selecciona la clínica</Text>
        <TouchableOpacity
          style={[styles.selector, hospitalSeleccionado !== null ? styles.selectorActivo : null]}
          activeOpacity={0.8}
          onPress={() => {
            setMostrarHospitales(!mostrarHospitales);
            setMostrarEspecialidades(false);
          }}
        >
          <MapPin size={20} color={hospitalSeleccionado !== null ? '#2D7FF9' : '#94A3B8'} />
          <View style={styles.selectorTexts}>
            <Text style={[styles.selectorPlaceholder, hospitalSeleccionado !== null ? styles.selectorPlaceholderActivo : null]}>
              {hospitalActual ? hospitalActual.nombre : 'Elige una clínica o centro médico'}
            </Text>
            {hospitalActual ? (
              <Text style={styles.selectorMeta}>{hospitalActual.ciudad} · {hospitalActual.tiempo}</Text>
            ) : null}
          </View>
          <ChevronDown size={18} color="#94A3B8" />
        </TouchableOpacity>

        {mostrarHospitales ? (
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
                {hospitalSeleccionado === h.id ? (
                  <View style={styles.checkDot} />
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {/* ── PASO 2: ESPECIALIDAD ── */}
        <Text style={[styles.stepLabel, { marginTop: 20 }]}>Paso 2 de 2 · Selecciona la especialidad</Text>
        <TouchableOpacity
          style={[styles.selector, especialidadSeleccionada !== null ? styles.selectorActivo : null]}
          activeOpacity={0.8}
          onPress={() => {
            setMostrarEspecialidades(!mostrarEspecialidades);
            setMostrarHospitales(false);
          }}
        >
          <Stethoscope size={20} color={especialidadSeleccionada !== null ? '#2D7FF9' : '#94A3B8'} />
          <View style={styles.selectorTexts}>
            {especialidadActual ? (
              <View style={styles.selectedRow}>
                <especialidadActual.Icon size={16} color="#0F2B3D" />
                <Text style={styles.selectorPlaceholderActivo}>{especialidadActual.nombre}</Text>
              </View>
            ) : (
              <Text style={styles.selectorPlaceholder}>Elige la especialidad médica</Text>
            )}
          </View>
          <ChevronDown size={18} color="#94A3B8" />
        </TouchableOpacity>

        {mostrarEspecialidades ? (
          <View style={styles.especialidadGrid}>
            {ESPECIALIDADES.map((e) => {
              const isActive = especialidadSeleccionada === e.id;
              return (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.especialidadItem, isActive ? styles.especialidadItemActivo : null]}
                  onPress={() => {
                    setEspecialidadSeleccionada(e.id);
                    setMostrarEspecialidades(false);
                  }}
                >
                  <View style={styles.iconContainer}>
                    <e.Icon size={28} color={isActive ? '#2D7FF9' : '#0F2B3D'} strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.especialidadNombre, isActive ? styles.especialidadNombreActivo : null]}>
                    {e.nombre}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* ── RESUMEN ── */}
        {formularioCompleto ? (
          <View style={styles.resumenCard}>
            <Text style={styles.resumenTitle}>Resumen de tu solicitud</Text>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Hospital:</Text>
              <Text style={styles.resumenValor}>{hospitalActual?.nombre}</Text>
            </View>
            <View style={styles.resumenRow}>
              <Text style={styles.resumenLabel}>Especialidad:</Text>
              <View style={styles.selectedRow}>
                {especialidadActual && <especialidadActual.Icon size={14} color="#0F2B3D" />}
                <Text style={styles.resumenValor}>{especialidadActual?.nombre}</Text>
              </View>
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
        ) : null}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── BOTÓN FLOTANTE ── */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <TouchableOpacity
          style={[styles.btnSolicitar, (!formularioCompleto || isSubmitting) ? styles.btnSolicitarDeshabilitado : null]}
          activeOpacity={0.85}
          onPress={handleSolicitar}
          disabled={!formularioCompleto || isSubmitting}
        >
          <Ticket size={20} color="#FFFFFF" />
          <Text style={styles.btnSolicitarText}>{isSubmitting ? '  Procesando...' : '  Agendar mi Cita Médica'}</Text>
          <ChevronRight size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', gap: 12,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F2B3D' },
  headerSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  headerRight: {
    marginLeft: 'auto', width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  banner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#EFF6FF',
    borderRadius: 14, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#BFDBFE',
  },
  bannerText: { flex: 1, fontSize: 13, color: '#2D7FF9', fontWeight: '500', lineHeight: 19 },
  stepLabel: {
    fontSize: 11, fontWeight: '700', color: '#64748B', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 10,
  },
  selector: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  selectorActivo: { borderColor: '#2D7FF9', backgroundColor: '#FAFCFF' },
  selectorTexts: { flex: 1 },
  selectorPlaceholder: { fontSize: 14, color: '#94A3B8', fontWeight: '500' },
  selectorPlaceholderActivo: { fontSize: 14, color: '#0F2B3D', fontWeight: '700' },
  selectorMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dropdownList: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 6, borderWidth: 1, borderColor: '#E2E8F0',
    overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5,
  },
  dropdownItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC',
  },
  dropdownItemActivo: { backgroundColor: '#EFF6FF' },
  dropdownItemLeft: { flex: 1 },
  dropdownItemNombre: { fontSize: 14, fontWeight: '600', color: '#0F2B3D' },
  dropdownItemNombreActivo: { color: '#2D7FF9' },
  dropdownItemMeta: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  checkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2D7FF9' },
  especialidadGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 },
  especialidadItem: {
    width: (width - 54) / 2, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  especialidadItemActivo: { borderColor: '#2D7FF9', backgroundColor: '#EFF6FF' },
  iconContainer: { marginBottom: 10, opacity: 0.9 },
  especialidadNombre: { fontSize: 13, fontWeight: '600', color: '#0F2B3D', textAlign: 'center' },
  especialidadNombreActivo: { color: '#2D7FF9' },
  resumenCard: {
    backgroundColor: '#F0FDF9', borderRadius: 14, padding: 16, marginTop: 20,
    borderWidth: 1, borderColor: '#A7F3D0', gap: 8,
  },
  resumenTitle: { fontSize: 13, fontWeight: '700', color: '#065F46', marginBottom: 4 },
  resumenRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resumenLabel: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  resumenValor: { fontSize: 13, color: '#0F2B3D', fontWeight: '700' },
  bottomBar: {
    padding: 20, paddingTop: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9',
  },
  btnSolicitar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2D7FF9',
    borderRadius: 16, paddingVertical: 18, shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  btnSolicitarDeshabilitado: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  btnSolicitarText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});
