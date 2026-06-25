import { Text } from '../components/CustomText';
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, Animated, ActivityIndicator, Modal, Linking, Platform, useColorScheme } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getActiveWallet, getPatientData, PatientProfile } from '../services/patientService';
import { supabase } from '../services/supabase';
import { Colors } from '../theme/Colors';
import { Skeleton } from '../components/Skeleton';
import {
  Stethoscope,
  Lock,
  Bell,
  Activity,
  MoreVertical,
  Clock,
  Phone,
  X,
  FileText,
  Settings
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<PatientProfile & { avatar_url?: string } | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Animations
  const animWelcome = useRef(new Animated.Value(0)).current;
  const animCards = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (!loading) {
      Animated.stagger(150, [
        Animated.spring(animWelcome, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
        Animated.spring(animCards, { toValue: 1, tension: 40, friction: 8, useNativeDriver: true }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
        ])
      ).start();
    }
  }, [loading]);

  const loadData = async () => {
    try {
      setLoading(true);
      const wallet = await getActiveWallet();
      const patientData = await getPatientData(wallet);
      setPatientProfile(patientData.profile);

      if (patientData.profile?.id) {
        const { data, error } = await supabase
          .from('appointments')
          .select('*')
          .eq('patient_id', patientData.profile.id)
          .in('status', ['scheduled', 'confirmed', 'in_progress'])
          .gte('appointment_date', new Date().toISOString().split('T')[0])
          .order('appointment_date', { ascending: true })
          .order('appointment_time', { ascending: true })
          .limit(1);

        if (!error && data && data.length > 0) {
          setActiveAppointment(data[0]);
        } else {
          setActiveAppointment(null);
        }
      }
    } catch (error) {
      console.error('Error al cargar datos en el HomeScreen:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAppointmentDate = (dateStr: string, timeStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
      const formattedDate = date.toLocaleDateString('es-ES', options);
      
      let endTimeStr = '';
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        let endHours = hours;
        let endMinutes = minutes + 30;
        if (endMinutes >= 60) {
          endMinutes -= 60;
          endHours += 1;
        }
        const format12H = (h: number) => h === 0 ? 12 : h > 12 ? h - 12 : h;
        const period = hours >= 12 ? 'PM' : 'AM';
        const endPeriod = endHours >= 12 ? 'PM' : 'AM';
        endTimeStr = `${format12H(hours)}:${minutes.toString().padStart(2, '0')} - ${format12H(endHours)}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
      }
      return `${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)} • ${endTimeStr}`;
    } catch (e) {
      return `${dateStr} • ${timeStr}`;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.gradientHeaderContainer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerRow}>
              <View>
                <Skeleton width={120} height={20} borderRadius={10} style={{ marginBottom: 8 }} />
                <Skeleton width={200} height={32} borderRadius={10} />
              </View>
              <Skeleton width={50} height={50} borderRadius={25} />
            </View>
          </SafeAreaView>
        </View>
        <View style={[styles.bottomSheet, { backgroundColor: theme.surface }]}>
          <View style={{ padding: 24, marginTop: 40 }}>
             <Skeleton width="100%" height={120} borderRadius={20} style={{ marginBottom: 24 }} />
             <Skeleton width="60%" height={24} borderRadius={10} style={{ marginBottom: 16 }} />
             <Skeleton width="100%" height={160} borderRadius={24} style={{ marginBottom: 12 }} />
          </View>
        </View>
      </View>
    );
  }

  const firstName = patientProfile?.full_name ? patientProfile.full_name.split(' ')[0] : 'Paciente';
  const initial = firstName.charAt(0).toUpperCase();

  const getAnimatedStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [40, 0]
      })
    }]
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* ─── PREMIUM GRADIENT HEADER ─── */}
      <LinearGradient 
        colors={isDark ? ['#051024', '#0A1B3F'] : ['#0F2B3D', '#1E40AF']} 
        style={styles.gradientHeaderContainer}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerRow}>
            {/* Smart Avatar */}
            <TouchableOpacity style={styles.avatarContainer} onPress={() => navigation?.navigate('HealthID')} activeOpacity={0.8}>
              {patientProfile?.avatar_url ? (
                <Image source={{ uri: patientProfile.avatar_url }} style={styles.avatarImage} />
              ) : (
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.smartAvatar}>
                  <Text style={styles.smartAvatarText}>{initial}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>

            <View style={styles.headerRightButtons}>
              <TouchableOpacity style={styles.iconButton}>
                <Bell size={20} color="#0F2B3D" strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={() => navigation?.navigate('Configuracion')}>
                <Settings size={20} color="#0F2B3D" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Welcome Text & Urgent Care Button */}
          <Animated.View style={[styles.welcomeContainer, getAnimatedStyle(animWelcome)]}>
            <Text style={styles.welcomeText}>¡Hola, <Text style={styles.nameText}>{firstName}</Text>!</Text>
            <Text style={styles.subtitleText}>¿Cómo te sientes hoy?</Text>
            
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity 
                style={styles.urgentCareBtn}
                onPress={() => setEmergencyModalVisible(true)}
                activeOpacity={0.9}
              >
                <LinearGradient colors={['#EF4444', '#B91C1C']} style={styles.urgentGradient}>
                  <Activity size={20} color="#FFFFFF" strokeWidth={2.5} />
                  <Text style={styles.urgentCareText}>Atención Urgente</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* Decorative Doctor Image Overlay (Bottom right of header) */}
          <Image
            source={require('../../assets/doctor_hero_female_cropped.png')}
            style={styles.doctorImage}
            resizeMode="contain"
          />
        </SafeAreaView>
      </LinearGradient>

      {/* ─── BOTTOM SHEET ─── */}
      <View style={[styles.bottomSheet, { backgroundColor: theme.background }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          <Animated.View style={getAnimatedStyle(animCards)}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Servicios Clínicos</Text>
            <View style={styles.servicesGrid}>
              <TouchableOpacity style={styles.serviceItem} onPress={() => navigation?.navigate('SolicitarFicha')} activeOpacity={0.7}>
                <LinearGradient colors={['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)']} style={styles.serviceCircle}>
                  <Stethoscope size={28} color="#3B82F6" strokeWidth={2} />
                </LinearGradient>
                <Text style={[styles.serviceText, { color: theme.textSecondary }]}>Agendar Cita</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceItem} onPress={() => navigation?.navigate('Historial')} activeOpacity={0.7}>
                <LinearGradient colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']} style={styles.serviceCircle}>
                  <FileText size={28} color="#10B981" strokeWidth={2} />
                </LinearGradient>
                <Text style={[styles.serviceText, { color: theme.textSecondary }]}>Historial</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.serviceItem} onPress={() => navigation?.navigate('Permisos')} activeOpacity={0.7}>
                <LinearGradient colors={['rgba(139,92,246,0.15)', 'rgba(139,92,246,0.05)']} style={styles.serviceCircle}>
                  <Lock size={28} color="#8B5CF6" strokeWidth={2} />
                </LinearGradient>
                <Text style={[styles.serviceText, { color: theme.textSecondary }]}>Permisos</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View style={[getAnimatedStyle(animCards), { marginTop: 30 }]}>
            <View style={styles.appointmentHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 0 }]}>Próxima Cita</Text>
              <TouchableOpacity onPress={() => navigation?.navigate('MisCitas')}>
                <Text style={styles.seeAllText}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {activeAppointment ? (
              <TouchableOpacity 
                activeOpacity={0.9} 
                onPress={() => navigation?.navigate('FichaActiva', { appointmentId: activeAppointment.id })}
                style={[styles.appointmentCard, { backgroundColor: theme.surface, shadowColor: isDark ? '#000' : '#CBD5E1' }]}
              >
                <View style={styles.appointmentDateRow}>
                  <View style={styles.dateInfo}>
                    <Clock size={16} color={theme.textPrimary} strokeWidth={2.5} />
                    <Text style={[styles.dateText, { color: theme.textPrimary }]}>
                      {formatAppointmentDate(activeAppointment.appointment_date, activeAppointment.appointment_time)}
                    </Text>
                  </View>
                  <MoreVertical size={20} color={theme.textSecondary} />
                </View>

                <View style={[styles.appointmentDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]} />

                <View style={styles.doctorInfoRow}>
                  <View style={styles.doctorAvatarContainer}>
                    {/* Hardcoded fallback strictly for the doctor card until dynamic backend supports it */}
                    <Image 
                      source={{ uri: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop' }} 
                      style={styles.cardDoctorImage} 
                    />
                    <View style={styles.onlineIndicator} />
                  </View>
                  <View style={styles.doctorDetails}>
                    <Text style={[styles.doctorName, { color: theme.textPrimary }]}>{activeAppointment.doctor_name || 'Médico Asignado'}</Text>
                    <Text style={[styles.doctorSpecialty, { color: theme.textSecondary }]}>{activeAppointment.specialty || 'Consulta Médica'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.appointmentCard, styles.emptyCard, { backgroundColor: theme.surface, shadowColor: isDark ? '#000' : '#CBD5E1' }]}
                onPress={() => navigation?.navigate('SolicitarFicha')}
                activeOpacity={0.8}
              >
                <View style={styles.emptyCardIcon}>
                  <Clock size={32} color={theme.textSecondary} opacity={0.5} />
                </View>
                <Text style={[styles.dateText, { color: theme.textPrimary }]}>No tienes citas próximas</Text>
                <Text style={[styles.doctorSpecialty, { color: theme.textSecondary, marginTop: 4 }]}>Toca aquí para agendar tu primera consulta médica</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
          
          <View style={{height: 130}} />
        </ScrollView>
      </View>

      {/* ─── EMERGENCY MODAL ─── */}
      <Modal animationType="fade" transparent={true} visible={emergencyModalVisible} onRequestClose={() => setEmergencyModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContent, { backgroundColor: theme.surface, transform: [{ scale: 1 }] }]}>
            <TouchableOpacity style={[styles.modalCloseButton, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]} onPress={() => setEmergencyModalVisible(false)}>
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
            <View style={styles.modalHeaderIcon}>
              <LinearGradient colors={['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.05)']} style={styles.modalIconBg}>
                <Activity size={36} color="#EF4444" strokeWidth={2.5} />
              </LinearGradient>
            </View>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Asistencia Inmediata</Text>
            <Text style={[styles.modalText, { color: theme.textSecondary }]}>
              Comunícate directamente con los servicios de emergencia nacionales.
            </Text>
            <View style={styles.emergencyPhonesList}>
              <TouchableOpacity style={styles.emergencyPhoneItem} onPress={() => Linking.openURL('tel:165')} activeOpacity={0.8}>
                <LinearGradient colors={['#EF4444', '#DC2626']} style={styles.phoneIconBg}>
                  <Phone size={18} color="#FFFFFF" fill="#FFFFFF" />
                </LinearGradient>
                <View style={styles.phoneTexts}>
                  <Text style={[styles.phoneLabel, { color: theme.textPrimary }]}>Ambulancia Nacional</Text>
                  <Text style={styles.phoneValue}>165</Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradientHeaderContainer: { height: height * 0.42, width: '100%', position: 'relative' },
  safeArea: { flex: 1, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? 20 : 0 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, zIndex: 10 },
  
  // Smart Avatar
  avatarContainer: {
    width: 48, height: 48, borderRadius: 24, overflow: 'hidden', borderWidth: 2, borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  avatarImage: { width: '100%', height: '100%' },
  smartAvatar: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  smartAvatarText: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  
  headerRightButtons: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconButton: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3,
  },
  welcomeContainer: { marginTop: 30, zIndex: 10, maxWidth: width * 0.65 },
  welcomeText: { fontSize: 32, color: '#FFFFFF', fontWeight: '400', letterSpacing: -0.5 },
  nameText: { fontWeight: '800' },
  subtitleText: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 8, fontWeight: '500', lineHeight: 22 },
  
  urgentCareBtn: { marginTop: 24, borderRadius: 30, shadowColor: '#EF4444', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, alignSelf: 'flex-start' },
  urgentGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, gap: 10 },
  urgentCareText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  
  doctorImage: { position: 'absolute', bottom: -10, right: -20, width: width * 0.5, height: width * 0.65, opacity: 0.95, zIndex: 1 },
  bottomSheet: { flex: 1, marginTop: -40, borderTopLeftRadius: 36, borderTopRightRadius: 36, overflow: 'hidden' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20, letterSpacing: -0.3 },
  
  servicesGrid: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 },
  serviceItem: { alignItems: 'center', width: (width - 80) / 3 },
  serviceCircle: { width: 64, height: 64, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  serviceText: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
  
  appointmentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  seeAllText: { color: '#3B82F6', fontSize: 14, fontWeight: '700' },
  
  appointmentCard: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'transparent', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 5 },
  emptyCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30 },
  emptyCardIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(150,150,150,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  appointmentDateRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  dateInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateText: { fontSize: 15, fontWeight: '700' },
  appointmentDivider: { height: 1, marginHorizontal: -20, marginBottom: 16 },
  doctorInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  doctorAvatarContainer: { width: 56, height: 56, borderRadius: 28, position: 'relative' },
  cardDoctorImage: { width: '100%', height: '100%', borderRadius: 28 },
  onlineIndicator: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#FFFFFF' },
  doctorDetails: { flex: 1 },
  doctorName: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  doctorSpecialty: { fontSize: 14, fontWeight: '500' },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: width * 0.85, borderRadius: 32, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  modalCloseButton: { position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  modalHeaderIcon: { marginBottom: 20, marginTop: 10 },
  modalIconBg: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  modalText: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  emergencyPhonesList: { width: '100%', gap: 12 },
  emergencyPhoneItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, backgroundColor: 'rgba(150,150,150,0.05)', borderWidth: 1, borderColor: 'rgba(150,150,150,0.1)' },
  phoneIconBg: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  phoneTexts: { flex: 1 },
  phoneLabel: { fontSize: 13, fontWeight: '500', marginBottom: 2 },
  phoneValue: { fontSize: 18, fontWeight: '800', color: '#EF4444' }
});
