import { Text } from '../components/CustomText';
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, Animated, ActivityIndicator, Modal, Linking, Platform, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Switch, useColorScheme } from 'react-native';

import {
  ArrowLeft,
  MapPin,
  Stethoscope,
  Clock,
  QrCode,
  CheckCircle2,
  Users,
  Building2,
  Ticket,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';
import { getActiveWallet, getPatientData } from '../services/patientService';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/Colors';

const { width } = Dimensions.get('window');


export default function FichaActivaScreen({ route, navigation }: any) {
  const hospital = route?.params?.hospital ?? { nombre: 'Clínica del Sur', tiempo: '~10 min' };
  const especialidad = route?.params?.especialidad ?? { nombre: 'Medicina General' };

  const [appointment, setAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [patientsAhead, setPatientsAhead] = useState(0);
  const [isQRModalVisible, setIsQRModalVisible] = useState(false);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Animación de pulso del círculo del turno
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const fetchPatientsAhead = async (appt: any) => {
    if (!appt) return;
    try {
      const { count, error } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('doctor_id', appt.doctor_id)
        .eq('appointment_date', appt.appointment_date)
        .eq('status', 'scheduled')
        .lt('created_at', appt.created_at);
      
      if (!error && count !== null) {
        setPatientsAhead(count);
      }
    } catch (err) {
      console.warn('Error counting patients ahead:', err);
    }
  };

  async function fetchActiveAppointment() {
    try {
      const wallet = await getActiveWallet();
      const patientData = await getPatientData(wallet);
      const patientId = patientData.profile?.id;

      if (!patientId) {
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('appointments')
        .select('*');

      if (route?.params?.appointmentId) {
        query = query.eq('id', route.params.appointmentId);
      } else {
        query = query.eq('patient_id', patientId)
          .in('status', ['scheduled', 'in_progress', 'confirmed'])
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query.limit(1).maybeSingle();

      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "No rows found"
          console.error('Supabase error:', error.message);
        }
      } else if (data) {
        setAppointment(data);
        await fetchPatientsAhead(data);
      }
    } catch (err) {
      console.error('Network/Storage error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  // Fetch Supabase
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      setIsLoading(true);
      setAppointment(null);
      fetchActiveAppointment();
    });

    fetchActiveAppointment();
    return unsubscribe;
  }, [navigation]);

  // Suscripción Realtime para la cita actual
  useEffect(() => {
    if (!appointment?.id) return;

    const subscription = supabase
      .channel(`appointment-live-${appointment.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `id=eq.${appointment.id}` },
        (payload) => {
          console.log('[Realtime] Cita actualizada:', payload.new);
          setAppointment(payload.new);
          fetchPatientsAhead(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [appointment?.id]);

  // Animación de progreso visual
  useEffect(() => {
    if (!appointment) return;
    // Si ya está en progreso o confirmada y no hay nadie adelante, progreso al 100%. De lo contrario proporcional.
    const totalCola = patientsAhead + 1;
    const progreso = appointment.status === 'in_progress' ? 1 : 1 - (patientsAhead / totalCola);
    Animated.timing(progressAnim, {
      toValue: progreso || 0.1,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [patientsAhead, appointment]);

  const handleCancelarCita = async () => {
    if (!appointment?.id) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointment.id);
      
      if (error) {
        alert('Error al cancelar la cita: ' + error.message);
      } else {
        alert('Cita cancelada con éxito.');
        setAppointment(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ color: theme.textSecondary, fontWeight: '500', marginTop: 12 }}>Buscando turnos activos...</Text>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation?.goBack()}>
            <ArrowLeft size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Recepción Virtual</Text>
            <Text style={styles.headerSubtitle}>Bolivia Health ID</Text>
          </View>
        </View>

        <View style={styles.emptyStateContainer}>
          <View style={[styles.emptyStateCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <LinearGradient
              colors={isDark ? ['#0D2A6E', '#1E40AF', '#3B82F6'] : ['#0F2B3D', '#1E40AF', '#2D7FF9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyStateIconCircle}
            >
              <Ticket size={48} color="#FFFFFF" />
            </LinearGradient>

            <Text style={styles.emptyStateTitle}>No tienes turnos</Text>
            <Text style={styles.emptyStateDesc}>
              Descubre nuestra red de clínicas exclusivas. Agenda tu cita y disfruta de una atención médica rápida y preferencial.
            </Text>

            <TouchableOpacity
              style={styles.btnSolicitarEmpty}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('MainTabs', { screen: 'Home' })}
            >
              <LinearGradient
                colors={['#2D7FF9', '#1E40AF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btnSolicitarEmptyGradient}
              >
                <Text style={styles.btnSolicitarEmptyText}>Agendar Nueva Cita</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const hospitalName = appointment?.location || hospital.nombre;
  const especialidadName = appointment?.specialty || especialidad.nombre;
  const appointmentTimeFormatted = appointment?.appointment_time ? appointment.appointment_time.slice(0, 5) : '00:00';

  // Cálculos dinámicos
  const totalCola = patientsAhead + 1;
  const porcentajeProgreso = appointment.status === 'in_progress' ? 100 : Math.max(10, Math.round((1 - (patientsAhead / totalCola)) * 100));
  const consultorioText = appointment.notes || 'Consultorio 3';
  const tiempoEsperaEstimado = patientsAhead * 15; // Estimamos 15 minutos por paciente en espera

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation?.goBack()}>
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Recepción Virtual</Text>
          <Text style={styles.headerSubtitle}>Bolivia Health ID</Text>
        </View>
        <View style={[styles.statusDot, isDark && { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }]}>
          <View style={styles.statusDotInner} />
          <Text style={styles.statusDotText}>En vivo</Text>
        </View>
      </View>

      {/* ── TARJETA DEL HOSPITAL ── */}
      <View style={[styles.hospitalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={[styles.hospitalIconBox, isDark && { backgroundColor: 'rgba(45, 127, 249, 0.1)' }]}>
          <Building2 size={24} color="#2D7FF9" />
        </View>
        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalNombre}>{hospitalName}</Text>
          <View style={styles.hospitalMeta}>
            <Stethoscope size={12} color={theme.textSecondary} />
            <Text style={[styles.hospitalMetaText, { color: theme.textSecondary }]}>
              {especialidadName}
            </Text>
            <Text style={[styles.hospitalMetaSeparator, { color: theme.border }]}>·</Text>
            <MapPin size={12} color={theme.textSecondary} />
            <Text style={[styles.hospitalMetaText, { color: theme.textSecondary }]}>{consultorioText}</Text>
          </View>
        </View>
      </View>

      {/* ── CÍRCULO PRINCIPAL DEL TURNO ── */}
      <View style={styles.turnoSection}>
        <Text style={[styles.turnoSectionLabel, { color: theme.textSecondary }]}>HORA DE CITA</Text>

        <Animated.View style={[styles.turnoCircleOuter, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.turnoCircleMid}>
            <View style={[styles.turnoCircleInner, isDark && { backgroundColor: '#1E293B', shadowColor: '#000000' }]}>
              <Text style={styles.turnoNumero}>{appointmentTimeFormatted}</Text>
              <Text style={styles.turnoFecha}>
                {new Date(appointment.appointment_date).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Barra de progreso */}
        <View style={[styles.progressBarContainer, { backgroundColor: theme.border }]}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {porcentajeProgreso}% completado · {appointment.status === 'in_progress' ? 'Tu turno ha llegado' : `Faltan ${patientsAhead} turnos`}
        </Text>
      </View>

      {/* ── INFORMACIÓN DEL ESTADO ── */}
      <View style={styles.infoRow}>

        {/* Atendiendo ahora */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoCardDot, { backgroundColor: appointment.status === 'in_progress' ? '#10B981' : '#F59E0B' }]} />
            <Text style={[styles.infoCardLabel, { color: theme.textSecondary }]}>ESTADO ACTUAL</Text>
          </View>
          <Text style={styles.infoCardValue}>
            {appointment.status === 'in_progress' ? 'En Consulta' : 'En Espera'}
          </Text>
          <View style={[styles.infoCardBadge, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.1)', borderColor: 'rgba(20, 184, 166, 0.2)' }]}>
            <Text style={styles.infoCardBadgeText}>
              {appointment.status === 'in_progress' ? 'Llamando...' : 'En Fila'}
            </Text>
          </View>
        </View>

        {/* Tiempo de espera */}
        <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.infoCardHeader}>
            <Clock size={10} color="#2D7FF9" />
            <Text style={[styles.infoCardLabel, { color: theme.textSecondary }]}>ESPERA ESTIMADA</Text>
          </View>
          <Text style={styles.infoCardValue}>
            {appointment.status === 'in_progress' ? '0 min' : `~${tiempoEsperaEstimado} min`}
          </Text>
          <View style={styles.infoCardQueue}>
            <Users size={12} color={theme.textSecondary} />
            <Text style={[styles.infoCardQueueText, { color: theme.textSecondary }]}>
              {appointment.status === 'in_progress' ? 'Es tu turno' : `${patientsAhead} antes que tú`}
            </Text>
          </View>
        </View>

      </View>

      {/* ── BOTÓN QR DE ADMISIÓN ── */}
      <View style={[styles.bottomBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <TouchableOpacity
          style={styles.btnQR}
          activeOpacity={0.85}
          onPress={() => setIsQRModalVisible(true)}
        >
          <QrCode size={22} color="#FFFFFF" />
          <Text style={styles.btnQRText}>  Código QR de Admisión</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.btnCancelar} 
          activeOpacity={0.7}
          onPress={handleCancelarCita}
        >
          <Text style={styles.btnCancelarText}>Cancelar cita</Text>
        </TouchableOpacity>
      </View>

      {/* ── MODAL QR ADMISIÓN (Glassmorphism / Overlay) ── */}
      <Modal
        visible={isQRModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsQRModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Código de Admisión</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Muestra este código QR en la recepción de la clínica para realizar tu admisión y registrar tu llegada.
            </Text>

            <View style={styles.modalQRBox}>
              <Image
                source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${appointment.id}` }}
                style={styles.modalQRImage}
              />
            </View>

            <Text style={[styles.modalDetailsText, { color: theme.textSecondary }]}>
              Cita para las {appointmentTimeFormatted} · {especialidadName}
            </Text>

            <TouchableOpacity
              style={[styles.btnCerrarModal, { backgroundColor: theme.primary }]}
              onPress={() => setIsQRModalVisible(false)}
            >
              <Text style={styles.btnCerrarModalText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  statusDot: {
    marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FDF4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  statusDotInner: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E',
  },
  statusDotText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },

  // Tarjeta hospital
  hospitalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginHorizontal: 20, marginTop: 16,
    borderRadius: 16, padding: 16,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  hospitalIconBox: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  hospitalInfo: { flex: 1 },
  hospitalNombre: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  hospitalMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  hospitalMetaText: { fontSize: 11, fontWeight: '500' },
  hospitalMetaSeparator: { fontSize: 11 },

  // Sección turno
  turnoSection: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  turnoSectionLabel: {
    fontSize: 11, fontWeight: '800',
    letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24,
  },
  turnoCircleOuter: {
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(45, 127, 249, 0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  turnoCircleMid: {
    width: 172, height: 172, borderRadius: 86,
    backgroundColor: 'rgba(45, 127, 249, 0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  turnoCircleInner: {
    width: 144, height: 144, borderRadius: 72,
    backgroundColor: '#0F2B3D',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0F2B3D', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
  },
  turnoNumero: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2 },
  turnoFecha: { fontSize: 10, color: '#64748B', fontWeight: '500', marginTop: 2 },

  // Progreso
  progressBarContainer: {
    width: width - 80, height: 6,
    borderRadius: 3, marginTop: 24, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: '#2D7FF9',
  },
  progressText: { fontSize: 12, fontWeight: '500', marginTop: 10 },

  // Info cards
  infoRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, marginBottom: 8,
  },
  infoCard: {
    flex: 1, borderRadius: 16, padding: 14,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  infoCardDot: { width: 8, height: 8, borderRadius: 4 },
  infoCardLabel: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  infoCardValue: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  infoCardBadge: {
    alignSelf: 'flex-start', backgroundColor: '#F0FDF4',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  infoCardBadgeText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  infoCardQueue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoCardQueueText: { fontSize: 11, fontWeight: '500' },

  // Bottom
  bottomBar: {
    padding: 20, paddingBottom: 32,
    borderTopWidth: 1, gap: 10,
  },
  btnQR: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#2D7FF9', borderRadius: 16, paddingVertical: 18,
    shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  btnQRText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  btnCancelar: { alignItems: 'center', paddingVertical: 6 },
  btnCancelarText: { fontSize: 13, color: '#EF4444', fontWeight: '600', textDecorationLine: 'underline' },

  // Empty State Premium
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyStateCard: {
    width: '100%',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#2D7FF9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
  },
  emptyStateIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#2D7FF9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },
  emptyStateTitle: {
    fontSize: 22, fontWeight: '800', marginBottom: 12, textAlign: 'center',
  },
  emptyStateDesc: {
    fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  btnSolicitarEmpty: {
    width: '100%',
    shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  btnSolicitarEmptyGradient: {
    borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  btnSolicitarEmptyText: {
    fontSize: 16, fontWeight: '800', color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  modalQRBox: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  modalQRImage: {
    width: 200,
    height: 200,
  },
  modalDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 24,
  },
  btnCerrarModal: {
    width: '100%',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnCerrarModalText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
