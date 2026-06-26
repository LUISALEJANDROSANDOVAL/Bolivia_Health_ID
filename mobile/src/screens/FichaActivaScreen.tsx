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
import * as Haptics from 'expo-haptics';

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

  // Staggered Animations Refs
  const animHospital = useRef(new Animated.Value(0)).current;
  const animTurno = useRef(new Animated.Value(0)).current;
  const animCards = useRef(new Animated.Value(0)).current;
  const animButtons = useRef(new Animated.Value(0)).current;

  // Animación de pulso del círculo del turno
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const triggerEntryAnimations = () => {
    animHospital.setValue(0);
    animTurno.setValue(0);
    animCards.setValue(0);
    animButtons.setValue(0);

    Animated.stagger(150, [
      Animated.spring(animHospital, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.spring(animTurno, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.spring(animCards, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.spring(animButtons, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  };

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
        if (error.code !== 'PGRST116') { 
          console.error('Supabase error:', error.message);
        }
      } else if (data) {
        setAppointment(data);
        await fetchPatientsAhead(data);
        triggerEntryAnimations();
      }
    } catch (err) {
      console.error('Network/Storage error:', err);
    } finally {
      setIsLoading(false);
    }
  }

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
    const totalCola = patientsAhead + 1;
    const progreso = appointment.status === 'in_progress' ? 1 : 1 - (patientsAhead / totalCola);
    Animated.spring(progressAnim, {
      toValue: progreso || 0.1,
      tension: 40,
      friction: 7,
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        alert('Cita cancelada con éxito.');
        setAppointment(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getAnimatedStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [40, 0]
      })
    }]
  });

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
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Recepción Virtual</Text>
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

            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No tienes turnos</Text>
            <Text style={styles.emptyStateDesc}>
              Descubre nuestra red de clínicas exclusivas. Agenda tu cita y disfruta de una atención médica rápida y preferencial.
            </Text>

            <TouchableOpacity
              style={styles.btnSolicitarEmptyShadowWrapper}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('MainTabs', { screen: 'Home' })}
            >
              <View style={styles.btnSolicitarEmptyInner}>
                <LinearGradient
                  colors={['#2563EB', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnSolicitarEmptyGradient}
                >
                  <Text style={styles.btnSolicitarEmptyText}>Agendar Nueva Cita</Text>
                </LinearGradient>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const hospitalName = appointment?.location || hospital.nombre;
  const especialidadName = appointment?.specialty || especialidad.nombre;
  const appointmentTimeFormatted = appointment?.appointment_time ? appointment.appointment_time.slice(0, 5) : '00:00';

  const totalCola = patientsAhead + 1;
  const porcentajeProgreso = appointment.status === 'in_progress' ? 100 : Math.max(10, Math.round((1 - (patientsAhead / totalCola)) * 100));
  const consultorioText = appointment.notes || 'Consultorio 3';
  const tiempoEsperaEstimado = patientsAhead * 15; 

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>

      {/* ── HEADER ── */}
      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation?.goBack()}>
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Recepción Virtual</Text>
          <Text style={styles.headerSubtitle}>Bolivia Health ID</Text>
        </View>
        <View style={[styles.statusDot, isDark && { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.2)' }]}>
          <View style={styles.statusDotInner} />
          <Text style={styles.statusDotText}>En vivo</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* ── TARJETA DEL HOSPITAL ── */}
        <Animated.View style={[getAnimatedStyle(animHospital)]}>
          <View style={[styles.hospitalCard, { backgroundColor: theme.surface, borderColor: theme.border }, isDark && styles.glassCardDark]}>
            <View style={[styles.hospitalIconBox, isDark && { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Building2 size={24} color={isDark ? '#60A5FA' : '#2563EB'} />
            </View>
            <View style={styles.hospitalInfo}>
              <Text style={[styles.hospitalNombre, { color: theme.textPrimary }]}>{hospitalName}</Text>
              <View style={styles.hospitalMeta}>
                <Stethoscope size={12} color={theme.textSecondary} />
                <Text style={[styles.hospitalMetaText, { color: theme.textSecondary }]}>{especialidadName}</Text>
                <Text style={[styles.hospitalMetaSeparator, { color: theme.border }]}>·</Text>
                <MapPin size={12} color={theme.textSecondary} />
                <Text style={[styles.hospitalMetaText, { color: theme.textSecondary }]}>{consultorioText}</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── CÍRCULO PRINCIPAL DEL TURNO ── */}
        <Animated.View style={[styles.turnoSection, getAnimatedStyle(animTurno)]}>
          <Text style={[styles.turnoSectionLabel, { color: theme.textSecondary }]}>HORA DE CITA</Text>

          <Animated.View style={[styles.turnoCircleContainer, { transform: [{ scale: pulseAnim }] }]}>
            <LinearGradient
              colors={isDark ? ['rgba(59,130,246,0.3)', 'rgba(59,130,246,0.0)'] : ['rgba(37,99,235,0.2)', 'rgba(37,99,235,0.0)']}
              style={styles.turnoPulseGlow}
            />
            <View style={[styles.turnoCircleInner, isDark && { backgroundColor: '#0F172A', shadowColor: '#3B82F6' }]}>
              <LinearGradient
                colors={isDark ? ['#1E293B', '#0F172A'] : ['#1E3A8A', '#0F2B3D']}
                style={[StyleSheet.absoluteFillObject, { borderRadius: 80 }]}
              />
              <Text style={styles.turnoNumero}>{appointmentTimeFormatted}</Text>
              <Text style={styles.turnoFecha}>
                {new Date(appointment.appointment_date).toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </Animated.View>

          {/* Barra de progreso Premium */}
          <View style={[styles.progressBarContainer, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
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
            >
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
          </View>
          <Text style={[styles.progressText, { color: theme.textSecondary }]}>
            {porcentajeProgreso}% completado · {appointment.status === 'in_progress' ? 'Tu turno ha llegado' : `Faltan ${patientsAhead} turnos`}
          </Text>
        </Animated.View>

        {/* ── INFORMACIÓN DEL ESTADO ── */}
        <Animated.View style={[styles.infoRow, getAnimatedStyle(animCards)]}>

          {/* Atendiendo ahora */}
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }, isDark && styles.glassCardDark]}>
            <View style={styles.infoCardHeader}>
              <View style={[styles.infoCardDot, { backgroundColor: appointment.status === 'in_progress' ? '#10B981' : '#F59E0B' }]} />
              <Text style={[styles.infoCardLabel, { color: theme.textSecondary }]}>ESTADO ACTUAL</Text>
            </View>
            <Text style={[styles.infoCardValue, { color: theme.textPrimary }]}>
              {appointment.status === 'in_progress' ? 'En Consulta' : 'En Espera'}
            </Text>
            <View style={[styles.infoCardBadge, isDark && { backgroundColor: 'rgba(20, 184, 166, 0.1)', borderColor: 'rgba(20, 184, 166, 0.2)' }]}>
              <Text style={styles.infoCardBadgeText}>
                {appointment.status === 'in_progress' ? 'Llamando...' : 'En Fila'}
              </Text>
            </View>
          </View>

          {/* Tiempo de espera */}
          <View style={[styles.infoCard, { backgroundColor: theme.surface, borderColor: theme.border }, isDark && styles.glassCardDark]}>
            <View style={styles.infoCardHeader}>
              <Clock size={12} color="#3B82F6" />
              <Text style={[styles.infoCardLabel, { color: theme.textSecondary }]}>ESPERA ESTIMADA</Text>
            </View>
            <Text style={[styles.infoCardValue, { color: theme.textPrimary }]}>
              {appointment.status === 'in_progress' ? '0 min' : `~${tiempoEsperaEstimado} min`}
            </Text>
            <View style={styles.infoCardQueue}>
              <Users size={12} color={theme.textSecondary} />
              <Text style={[styles.infoCardQueueText, { color: theme.textSecondary }]}>
                {appointment.status === 'in_progress' ? 'Es tu turno' : `${patientsAhead} antes que tú`}
              </Text>
            </View>
          </View>

        </Animated.View>

        {/* ── BOTÓN QR DE ADMISIÓN (Ahora dentro del ScrollView) ── */}
        <Animated.View style={[styles.bottomBar, getAnimatedStyle(animButtons)]}>
          <TouchableOpacity
            style={styles.btnQRShadowWrapper}
            activeOpacity={0.85}
            onPress={() => setIsQRModalVisible(true)}
          >
            <View style={styles.btnQRInner}>
              <LinearGradient
                colors={['#2563EB', '#1D4ED8']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.btnQRGradient}
              >
                <QrCode size={22} color="#FFFFFF" />
                <Text style={styles.btnQRText}>  Código QR de Admisión</Text>
              </LinearGradient>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.btnCancelar} 
            activeOpacity={0.7}
            onPress={handleCancelarCita}
          >
            <Text style={styles.btnCancelarText}>Cancelar cita</Text>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>

      {/* ── MODAL QR ADMISIÓN (Premium Glassmorphism) ── */}
      <Modal
        visible={isQRModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsQRModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }, isDark && styles.glassModalDark]}>
            <View style={styles.modalIconTop}>
              <QrCode size={28} color={isDark ? '#60A5FA' : '#2563EB'} />
            </View>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Código de Admisión</Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Muestra este código QR en la recepción de la clínica para realizar tu admisión rápida.
            </Text>

            <View style={[styles.modalQRBox, { borderColor: theme.border }]}>
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
  statusDotInner: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E' },
  statusDotText: { fontSize: 11, fontWeight: '700', color: '#16A34A' },

  glassCardDark: { backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: 'rgba(255, 255, 255, 0.05)' },

  // Tarjeta hospital
  hospitalCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 20, marginTop: 24,
    borderRadius: 24, padding: 20,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  hospitalIconBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  hospitalInfo: { flex: 1 },
  hospitalNombre: { fontSize: 16, fontWeight: '800', marginBottom: 6 },
  hospitalMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  hospitalMetaText: { fontSize: 12, fontWeight: '600' },
  hospitalMetaSeparator: { fontSize: 12 },

  // Sección turno
  turnoSection: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  turnoSectionLabel: {
    fontSize: 12, fontWeight: '800',
    letterSpacing: 4, textTransform: 'uppercase', marginBottom: 30,
  },
  turnoCircleContainer: {
    width: 220, height: 220, 
    alignItems: 'center', justifyContent: 'center',
  },
  turnoPulseGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 110,
  },
  turnoCircleInner: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    shadowColor: '#0F2B3D', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 15,
  },
  turnoNumero: { fontSize: 48, fontWeight: '900', color: '#FFFFFF', letterSpacing: -2, zIndex: 2 },
  turnoFecha: { fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: 4, zIndex: 2, textTransform: 'uppercase', letterSpacing: 1 },

  // Progreso
  progressBarContainer: {
    width: width - 80, height: 8,
    borderRadius: 4, marginTop: 40, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 13, fontWeight: '600', marginTop: 12 },

  // Info cards
  infoRow: {
    flexDirection: 'row', gap: 16,
    paddingHorizontal: 20, marginBottom: 20,
  },
  infoCard: {
    flex: 1, borderRadius: 24, padding: 18,
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 10, elevation: 2,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  infoCardDot: { width: 8, height: 8, borderRadius: 4 },
  infoCardLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  infoCardValue: { fontSize: 22, fontWeight: '900', marginBottom: 8 },
  infoCardBadge: {
    alignSelf: 'flex-start', backgroundColor: '#F0FDF4',
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  infoCardBadgeText: { fontSize: 11, fontWeight: '800', color: '#16A34A' },
  infoCardQueue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoCardQueueText: { fontSize: 12, fontWeight: '600' },

  // Bottom
  bottomBar: {
    padding: 24, paddingBottom: 40,
    gap: 16, marginTop: 10,
  },
  btnQRShadowWrapper: {
    borderRadius: 20, backgroundColor: '#2563EB',
    shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  btnQRInner: {
    borderRadius: 20, overflow: 'hidden',
  },
  btnQRGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18,
  },
  btnQRText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  btnCancelar: { alignItems: 'center', paddingVertical: 10 },
  btnCancelarText: { fontSize: 14, color: '#EF4444', fontWeight: '700' },

  // Empty State Premium
  emptyStateContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  emptyStateCard: { width: '100%', borderRadius: 32, padding: 32, alignItems: 'center', shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 30, elevation: 10, borderWidth: 1 },
  emptyStateIconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 8 },
  emptyStateTitle: { fontSize: 24, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  emptyStateDesc: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  btnSolicitarEmptyShadowWrapper: { width: '100%', borderRadius: 20, backgroundColor: '#2563EB', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 },
  btnSolicitarEmptyInner: { borderRadius: 20, overflow: 'hidden' },
  btnSolicitarEmptyGradient: { paddingVertical: 18, alignItems: 'center' },
  btnSolicitarEmptyText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', borderRadius: 32, padding: 32, alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 15 },
  glassModalDark: { backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)' },
  modalIconTop: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(59,130,246,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 30 },
  modalQRBox: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, marginBottom: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.05, shadowRadius: 15, elevation: 5 },
  modalQRImage: { width: 220, height: 220 },
  modalDetailsText: { fontSize: 13, fontWeight: '700', marginBottom: 32, letterSpacing: 0.5 },
  btnCerrarModal: { width: '100%', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  btnCerrarModalText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
});
