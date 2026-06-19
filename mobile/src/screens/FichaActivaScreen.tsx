import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
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

const { width } = Dimensions.get('window');

// ── DATOS DE DEMO ────────────────────────────────────────────────────────────
const TURNO_DEMO = {
  miTurno: 18,
  turnoActual: 14,
  totalEnEspera: 4,
  tiempoEspera: 25,
  consultorio: 'Consultorio 4',
};

export default function FichaActivaScreen({ route, navigation }: any) {
  const hospital = route?.params?.hospital ?? { nombre: 'Hospital de Clínicas', tiempo: '~25 min' };
  const especialidad = route?.params?.especialidad ?? { nombre: 'Medicina General' };

  const [turnoActual, setTurnoActual] = useState(TURNO_DEMO.turnoActual);
  const [appointment, setAppointment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Fetch Supabase
  useEffect(() => {
    async function fetchActiveAppointment() {
      try {
        let patientId = await AsyncStorage.getItem('@particle_patient_id');
        
        // Simulación temporal de Particle: Si no hay ID, tomamos uno de Supabase
        if (!patientId) {
          const { data: profile } = await supabase.from('profiles').select('id').eq('role', 'paciente').limit(1).single();
          if (profile) {
            patientId = profile.id;
            await AsyncStorage.setItem('@particle_patient_id', patientId as string);
          }
        }

        if (!patientId) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patientId)
          .in('status', ['scheduled', 'in_progress'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // PGRST116 is "No rows found", which is fine (Empty State)
            console.error('Supabase error:', error.message);
          }
        } else if (data) {
          setAppointment(data);
        }
      } catch (err) {
        console.error('Network/Storage error:', err);
      } finally {
        setIsLoading(false);
      }
    }

    const unsubscribe = navigation.addListener('focus', () => {
      setIsLoading(true);
      setAppointment(null); // Reset before fetch to show loading if needed
      fetchActiveAppointment();
    });

    return unsubscribe;
  }, [navigation]);

  // Animación de progreso visual
  useEffect(() => {
    const progreso = turnoActual / TURNO_DEMO.miTurno;
    Animated.timing(progressAnim, {
      toValue: progreso,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [turnoActual]);

  const faltanTurnos = TURNO_DEMO.miTurno - turnoActual;
  const porcentajeProgreso = Math.round((turnoActual / TURNO_DEMO.miTurno) * 100);

  // Variables dinámicas
  const hospitalName = appointment?.location || hospital.nombre;
  const especialidadName = appointment?.specialty || especialidad.nombre;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{color: '#64748B', fontWeight: '500'}}>Buscando turnos activos...</Text>
      </SafeAreaView>
    );
  }

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
            <ArrowLeft size={20} color="#0F2B3D" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Fila Virtual</Text>
            <Text style={styles.headerSubtitle}>Bolivia Health ID</Text>
          </View>
        </View>
        
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyStateIconCircle}>
            <Ticket size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyStateTitle}>No tienes turnos activos</Text>
          <Text style={styles.emptyStateDesc}>
            Solicita una nueva ficha digital para agendar tu próxima cita médica en cualquier hospital público sin tener que hacer filas desde la madrugada.
          </Text>
          
          <TouchableOpacity
            style={styles.btnSolicitarEmpty}
            activeOpacity={0.8}
            onPress={() => navigation?.navigate('SolicitarFicha')}
          >
            <Text style={styles.btnSolicitarEmptyText}>Solicitar Nueva Ficha</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <ArrowLeft size={20} color="#0F2B3D" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Fila Virtual</Text>
          <Text style={styles.headerSubtitle}>Bolivia Health ID</Text>
        </View>
        <View style={styles.statusDot}>
          <View style={styles.statusDotInner} />
          <Text style={styles.statusDotText}>En vivo</Text>
        </View>
      </View>

      {/* ── TARJETA DEL HOSPITAL ── */}
      <View style={styles.hospitalCard}>
        <View style={styles.hospitalIconBox}>
          <Building2 size={24} color="#2D7FF9" />
        </View>
        <View style={styles.hospitalInfo}>
          <Text style={styles.hospitalNombre}>{hospitalName}</Text>
          <View style={styles.hospitalMeta}>
            <Stethoscope size={12} color="#64748B" />
            <Text style={styles.hospitalMetaText}>
              {especialidadName}
            </Text>
            <Text style={styles.hospitalMetaSeparator}>·</Text>
            <MapPin size={12} color="#64748B" />
            <Text style={styles.hospitalMetaText}>{TURNO_DEMO.consultorio}</Text>
          </View>
        </View>
      </View>

      {/* ── CÍRCULO PRINCIPAL DEL TURNO ── */}
      <View style={styles.turnoSection}>
        <Text style={styles.turnoSectionLabel}>SU TURNO</Text>

        <Animated.View style={[styles.turnoCircleOuter, { transform: [{ scale: pulseAnim }] }]}>
          <View style={styles.turnoCircleMid}>
            <View style={styles.turnoCircleInner}>
              <Text style={styles.turnoNumero}>#{TURNO_DEMO.miTurno}</Text>
              <Text style={styles.turnoFecha}>
                {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short' })}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Barra de progreso */}
        <View style={styles.progressBarContainer}>
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
        <Text style={styles.progressText}>{porcentajeProgreso}% completado · Faltan {faltanTurnos} turnos</Text>
      </View>

      {/* ── INFORMACIÓN DEL ESTADO ── */}
      <View style={styles.infoRow}>

        {/* Atendiendo ahora */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <View style={[styles.infoCardDot, { backgroundColor: '#14B8A6' }]} />
            <Text style={styles.infoCardLabel}>ATENDIENDO AHORA</Text>
          </View>
          <Text style={styles.infoCardValue}>Turno #{turnoActual}</Text>
          <View style={styles.infoCardBadge}>
            <Text style={styles.infoCardBadgeText}>En curso</Text>
          </View>
        </View>

        {/* Tiempo de espera */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardHeader}>
            <Clock size={10} color="#2D7FF9" />
            <Text style={styles.infoCardLabel}>ESPERA ESTIMADA</Text>
          </View>
          <Text style={styles.infoCardValue}>~{TURNO_DEMO.tiempoEspera} min</Text>
          <View style={styles.infoCardQueue}>
            <Users size={12} color="#64748B" />
            <Text style={styles.infoCardQueueText}>{faltanTurnos} antes que tú</Text>
          </View>
        </View>

      </View>

      {/* ── BOTÓN QR DE ADMISIÓN ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.btnQR}
          activeOpacity={0.85}
          onPress={() =>
            navigation?.navigate('QRAdmision', {
              turno: TURNO_DEMO.miTurno,
              hospital: hospitalName,
              especialidad: especialidadName,
            })
          }
        >
          <QrCode size={22} color="#FFFFFF" />
          <Text style={styles.btnQRText}>  Código QR de Admisión</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnCancelar} activeOpacity={0.7}>
          <Text style={styles.btnCancelarText}>Cancelar ficha</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F2B3D' },
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
    backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 16,
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  hospitalIconBox: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center',
  },
  hospitalInfo: { flex: 1 },
  hospitalNombre: { fontSize: 15, fontWeight: '700', color: '#0F2B3D', marginBottom: 4 },
  hospitalMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' },
  hospitalMetaText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  hospitalMetaSeparator: { color: '#CBD5E1', fontSize: 11 },

  // Sección turno
  turnoSection: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  turnoSectionLabel: {
    fontSize: 11, fontWeight: '800', color: '#94A3B8',
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
    width: width - 80, height: 6, backgroundColor: '#E2E8F0',
    borderRadius: 3, marginTop: 24, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: '#2D7FF9',
  },
  progressText: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 10 },

  // Info cards
  infoRow: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, marginBottom: 8,
  },
  infoCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 6 },
  infoCardDot: { width: 8, height: 8, borderRadius: 4 },
  infoCardLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.5 },
  infoCardValue: { fontSize: 20, fontWeight: '800', color: '#0F2B3D', marginBottom: 4 },
  infoCardBadge: {
    alignSelf: 'flex-start', backgroundColor: '#F0FDF4',
    borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: '#BBF7D0',
  },
  infoCardBadgeText: { fontSize: 10, fontWeight: '700', color: '#16A34A' },
  infoCardQueue: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoCardQueueText: { fontSize: 11, color: '#64748B', fontWeight: '500' },

  // Bottom
  bottomBar: {
    padding: 20, paddingBottom: 32, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 10,
  },
  btnQR: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#0F2B3D', borderRadius: 16, paddingVertical: 18,
    shadowColor: '#0F2B3D', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  btnQRText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
  btnCancelar: { alignItems: 'center', paddingVertical: 6 },
  btnCancelarText: { fontSize: 13, color: '#94A3B8', fontWeight: '600', textDecorationLine: 'underline' },

  // Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateIconCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22, fontWeight: '800', color: '#0F2B3D', marginBottom: 12, textAlign: 'center',
  },
  emptyStateDesc: {
    fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  btnSolicitarEmpty: {
    backgroundColor: '#2D7FF9', width: '100%', borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#2D7FF9', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  btnSolicitarEmptyText: {
    fontSize: 16, fontWeight: '700', color: '#FFFFFF',
  },
});
