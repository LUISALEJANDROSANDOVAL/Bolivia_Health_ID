import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
  ActivityIndicator,
  Modal,
  Linking,
  Platform
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { getActiveWallet, getPatientData, PatientProfile } from '../services/patientService';
import { supabase } from '../services/supabase';
import {
  Stethoscope,
  Pill,
  Ambulance,
  Lock,
  Ticket,
  User,
  Bell,
  Activity,
  MoreVertical,
  Clock,
  Phone,
  X,
  Plus,
  Home,
  FileText,
  MessageSquare,
  Calendar
} from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);

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

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    loadData();
    return unsubscribe;
  }, [navigation]);

  const formatAppointmentDate = (dateStr: string, timeStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      
      const date = new Date(year, month, day);
      const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
      const formattedDate = date.toLocaleDateString('en-US', options);
      const formattedTime = timeStr ? timeStr.slice(0, 5) : '';
      
      // Calculate end time
      let endTimeStr = '';
      if (timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        let endHours = hours;
        let endMinutes = minutes + 30;
        if (endMinutes >= 60) {
          endMinutes -= 60;
          endHours += 1;
        }
        const period = hours >= 12 ? 'PM' : 'AM';
        const endPeriod = endHours >= 12 ? 'PM' : 'AM';
        
        const format12H = (h: number) => {
          if (h === 0) return 12;
          if (h > 12) return h - 12;
          return h;
        };
        
        endTimeStr = `${format12H(hours)}:${minutes.toString().padStart(2, '0')} - ${format12H(endHours)}:${endMinutes.toString().padStart(2, '0')} ${endPeriod}`;
      }

      return `${formattedDate} • ${endTimeStr}`;
    } catch (e) {
      return `${dateStr} • ${timeStr}`;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingCenter}>
        <ActivityIndicator size="large" color="#2D7FF9" />
        <Text style={styles.loadingText}>Sincronizando datos...</Text>
      </View>
    );
  }

  const firstName = patientProfile?.full_name ? patientProfile.full_name.split(' ')[0] : 'Rajesh';

  return (
    <View style={styles.container}>
      
      {/* ─── HEADER GRADIENT BACKGROUND ─── */}
      <View style={styles.gradientHeaderContainer}>
        <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
          <Defs>
            <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor="#0F2B3D" />
              <Stop offset="50%" stopColor="#1E40AF" />
              <Stop offset="100%" stopColor="#3B82F6" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#grad)" />
        </Svg>

        <SafeAreaView style={styles.safeArea}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.avatarImageContainer} onPress={() => navigation?.navigate('HealthID')}>
              <Image 
                source={{uri: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&auto=format&fit=crop'}} 
                style={styles.avatarImage} 
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.bellButton}>
              <Bell size={20} color="#0F2B3D" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Welcome Text & Urgent Care Button */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>¡Hola,</Text>
            <Text style={styles.nameText}>{firstName}!</Text>
            <Text style={styles.subtitleText}>¿Cómo te sientes hoy?</Text>
            
            <TouchableOpacity 
              style={styles.urgentCareBtn}
              onPress={() => setEmergencyModalVisible(true)}
            >
              <Activity size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.urgentCareText}>Atención Urgente</Text>
            </TouchableOpacity>
          </View>

          {/* Doctor Image Overlay */}
          <Image
            source={require('../../assets/doctor_hero_female_cropped.png')}
            style={styles.doctorImage}
            resizeMode="contain"
          />
        </SafeAreaView>
      </View>

      {/* ─── BOTTOM SHEET (WHITE AREA) ─── */}
      <View style={styles.bottomSheet}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Services Section */}
          <Text style={[styles.sectionTitle, { marginBottom: 20 }]}>Servicios Clínicos</Text>
          <View style={styles.servicesGrid}>
            <View style={styles.serviceItem}>
              <TouchableOpacity style={styles.serviceCircle} onPress={() => navigation?.navigate('SolicitarFicha')}>
                <Stethoscope size={28} color="#2D7FF9" strokeWidth={1.5} />
              </TouchableOpacity>
              <Text style={styles.serviceText}>Agendar Cita</Text>
            </View>

            <View style={styles.serviceItem}>
              <TouchableOpacity style={styles.serviceCircle} onPress={() => navigation?.navigate('Historial')}>
                <FileText size={28} color="#2D7FF9" strokeWidth={1.5} />
              </TouchableOpacity>
              <Text style={styles.serviceText}>Historial</Text>
            </View>

            <View style={styles.serviceItem}>
              <TouchableOpacity style={styles.serviceCircle} onPress={() => navigation?.navigate('Permisos')}>
                <Lock size={28} color="#2D7FF9" strokeWidth={1.5} />
              </TouchableOpacity>
              <Text style={styles.serviceText}>Permisos</Text>
            </View>
          </View>

          {/* Appointment Section */}
          <View style={styles.appointmentHeader}>
            <Text style={styles.sectionTitle}>Próxima Cita</Text>
            <TouchableOpacity onPress={() => navigation?.navigate('FichaActiva')}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {activeAppointment ? (
            <View style={styles.appointmentCard}>
              <View style={styles.appointmentDateRow}>
                <View style={styles.dateInfo}>
                  <Clock size={16} color="#000000" strokeWidth={2} />
                  <Text style={styles.dateText}>
                    {formatAppointmentDate(activeAppointment.appointment_date, activeAppointment.appointment_time)}
                  </Text>
                </View>
                <MoreVertical size={20} color="#94A3B8" />
              </View>

              <View style={styles.appointmentDivider} />

              <View style={styles.doctorInfoRow}>
                <View style={styles.doctorAvatarContainer}>
                  <Image 
                    source={require('../../assets/doctor_hero_female_cropped.png')} 
                    style={styles.cardDoctorImage} 
                  />
                  <View style={styles.onlineIndicator} />
                </View>
                <View style={styles.doctorDetails}>
                  <Text style={styles.doctorName}>{activeAppointment.doctor_name || 'Dr. Prem Tiwari'}</Text>
                  <Text style={styles.doctorSpecialty}>{activeAppointment.specialty || 'Orthopedic'}</Text>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.appointmentCard}
              onPress={() => navigation?.navigate('SolicitarFicha')}
            >
              <Text style={styles.dateText}>No tienes citas próximas</Text>
              <Text style={[styles.doctorSpecialty, {marginTop: 4}]}>Toca aquí para agendar una consulta</Text>
            </TouchableOpacity>
          )}
          
          <View style={{height: 130}} />
        </ScrollView>
      </View>

      {/* ─── BOTTOM TAB BAR (CUSTOM NAVBAR) ─── */}
      <View style={[styles.navBar, { paddingBottom: Math.max(insets.bottom, 15) }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Home size={24} color="#2D7FF9" />
          <Text style={[styles.navText, styles.navTextActive]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Historial')}>
          <FileText size={24} color="#94A3B8" />
          <Text style={styles.navText}>Historial</Text>
        </TouchableOpacity>

        <View style={styles.navItemCenter}>
          <TouchableOpacity style={styles.fab} onPress={() => navigation?.navigate('SolicitarFicha')}>
            <Plus size={32} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('FichaActiva')}>
          <Calendar size={24} color="#94A3B8" />
          <Text style={styles.navText}>Mis Citas</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Permisos')}>
          <User size={24} color="#94A3B8" />
          <Text style={styles.navText}>Mi ID</Text>
        </TouchableOpacity>
      </View>

      {/* ─── EMERGENCY MODAL ─── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={emergencyModalVisible}
        onRequestClose={() => setEmergencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setEmergencyModalVisible(false)}
            >
              <X size={20} color="#64748B" />
            </TouchableOpacity>
            
            <View style={styles.modalHeaderIcon}>
              <Activity size={32} color="#EF4444" />
            </View>

            <Text style={styles.modalTitle}>Asistencia de Emergencia</Text>
            <Text style={styles.modalText}>
              Llama a una ambulancia inmediatamente.
            </Text>

            <View style={styles.emergencyPhonesList}>
              <TouchableOpacity 
                style={styles.emergencyPhoneItem}
                onPress={() => Linking.openURL('tel:165')}
              >
                <Phone size={18} color="#FFFFFF" fill="#FFFFFF" />
                <View style={styles.phoneTexts}>
                  <Text style={styles.phoneLabel}>Ambulancia Nacional</Text>
                  <Text style={styles.phoneValue}>165</Text>
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.btnModalClose}
              onPress={() => setEmergencyModalVisible(false)}
            >
              <Text style={styles.btnModalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF'
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#64748B',
  },
  
  // Header Gradient Area
  gradientHeaderContainer: {
    height: height * 0.45,
    width: '100%',
    position: 'relative',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    zIndex: 10,
  },
  avatarImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Welcome Text
  welcomeContainer: {
    marginTop: 20,
    zIndex: 10,
    maxWidth: '52%',
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
  },
  nameText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 38,
  },
  subtitleText: {
    fontSize: 16,
    color: '#E2E8F0',
    marginTop: 8,
  },
  urgentCareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 15,
    gap: 6,
  },
  urgentCareText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Doctor Image Override
  doctorImage: {
    position: 'absolute',
    right: -15,
    bottom: -30, // pushed down to hide perfectly behind the white sheet
    width: width * 0.58,
    height: height * 0.46,
    zIndex: 5,
  },

  // Bottom Sheet White Area
  bottomSheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    zIndex: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 30,
  },

  // Services
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
  },
  servicesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 35,
  },
  serviceItem: {
    alignItems: 'center',
    gap: 10,
  },
  serviceCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  serviceText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },

  // Appointment Section
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D7FF9',
  },
  appointmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2D7FF9',
  },
  appointmentDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  appointmentDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
    marginLeft: 26,
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  doctorAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    position: 'relative',
    overflow: 'hidden',
  },
  cardDoctorImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  doctorDetails: {
    flex: 1,
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  doctorSpecialty: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Bottom Tab Bar (Custom Navbar)
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#2D7FF9',
    fontWeight: '700',
  },
  navItemCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F2B3D',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -35,
    shadowColor: '#0F2B3D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 43, 61, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 18,
    right: 18,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2B3D',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  emergencyPhonesList: {
    width: '100%',
    marginBottom: 16,
  },
  emergencyPhoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    padding: 14,
    borderRadius: 16,
    gap: 12,
  },
  phoneTexts: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
  },
  phoneValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnModalClose: {
    paddingVertical: 12,
  },
  btnModalCloseText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '700',
  },
});
