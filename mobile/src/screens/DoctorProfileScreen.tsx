import { Text } from '../components/CustomText';
import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, Animated, ActivityIndicator, Modal, Linking, Platform, SafeAreaView, TextInput, FlatList, KeyboardAvoidingView, Switch, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  Video,
  Phone,
  GraduationCap,
  Languages
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/Colors';
import { supabase } from '../services/supabase';
import { getActiveWallet, getPatientData } from '../services/patientService';

const { width, height } = Dimensions.get('window');

const generateNext7Days = () => {
  const days = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const today = new Date(); // Or specify a fixed current date if needed, but new Date() is dynamic
  // Note: the system is in 2026-06-23
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const yearStr = d.getFullYear();
    const fullDate = `${yearStr}-${monthStr}-${dayStr}`;
    
    days.push({
      id: String(i),
      day: dayStr,
      dayName: dayNames[d.getDay()],
      fullDate,
      monthName: monthNames[d.getMonth()]
    });
  }
  return days;
};

const DATES_DYNAMIC = generateNext7Days();

export default function DoctorProfileScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { doctor, preselectedBranchId } = route.params || {};

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [selectedDate, setSelectedDate] = useState(DATES_DYNAMIC[0].fullDate); 
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [sucursal, setSucursal] = useState<any>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Fallback si no hay doctor (por error de navegación)
  if (!doctor) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.textPrimary, margin: 20 }}>Error: Doctor no encontrado.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 20 }}>
          <Text style={{ color: theme.primary }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Cargar sucursal del doctor
  useEffect(() => {
    async function loadDoctorBranch() {
      try {
        let query = supabase
          .from('doctor_sucursal')
          .select('sucursal_id, sucursales(id, name, address)')
          .eq('doctor_id', doctor.id);

        if (preselectedBranchId) {
          query = query.eq('sucursal_id', preselectedBranchId);
        }

        const { data, error } = await query.limit(1).maybeSingle();

        if (!error && data) {
          const rawSuc = data.sucursales;
          const suc = Array.isArray(rawSuc) ? rawSuc[0] : rawSuc;
          setSucursal(suc);
          setSelectedBranchId(suc?.id || null);
        }
      } catch (err) {
        console.error('Error loading doctor branch:', err);
      }
    }
    loadDoctorBranch();
  }, [doctor.id]);

  // Cargar píldoras de turnos libres usando RPC de Supabase (get_available_slots)
  const fetchSlots = async (dateStr: string) => {
    if (!selectedBranchId) return;
    try {
      setIsLoadingSlots(true);
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_doctor_id: doctor.id,
        p_sucursal_id: selectedBranchId,
        p_date: dateStr
      });

      if (!error && data) {
        const formatted = data.map((t: any) => {
          const timeStr = typeof t === 'string' ? t : t.start_time;
          return timeStr ? timeStr.slice(0, 5) : '';
        }).filter(Boolean);
        setAvailableSlots(formatted);
        if (formatted.length > 0) {
          setSelectedTime(formatted[0]);
        } else {
          setSelectedTime('');
        }
      } else {
        setAvailableSlots([]);
        setSelectedTime('');
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedBranchId) {
      fetchSlots(selectedDate);
    }
  }, [selectedBranchId, selectedDate]);

  const handleBookAppointment = async () => {
    if (!selectedTime) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Toast.show({
        type: 'error',
        text1: 'Atención',
        text2: 'Por favor selecciona un horario disponible.'
      });
      return;
    }
    try {
      setIsBooking(true);
      const wallet = await getActiveWallet();
      const patientData = await getPatientData(wallet);
      const patientId = patientData.profile?.id;

      if (!patientData.profile?.id) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'No se pudo identificar al paciente.'
        });
        return;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert([
          {
            patient_id: patientId,
            doctor_id: doctor.id,
            doctor_name: doctor.name,
            specialty: doctor.specialty,
            appointment_date: selectedDate,
            appointment_time: `${selectedTime}:00`,
            location: sucursal?.name || doctor.branch,
            status: 'scheduled',
            type: 'presencial',
            priority: 'normal'
          }
        ])
        .select()
        .single();

      if (error) {
        Toast.show({
          type: 'error',
          text1: 'Error al reservar',
          text2: error.message
        });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({
          type: 'success',
          text1: '¡Cita Reservada!',
          text2: 'Tu cita ha sido guardada con éxito.'
        });
        navigation.navigate('MainTabs', { screen: 'MisCitas' });
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Error de conexión.'
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── HERO IMAGE SECTION ── */}
      <View style={styles.heroContainer}>
        {/* Usamos el gradiente corporativo */}
        <LinearGradient
          colors={isDark ? ['#081720', '#1C4A9E'] : ['#0F2B3D', '#2D7FF9']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <Image 
          source={{ uri: doctor.image }} 
          style={styles.heroImage} 
          resizeMode="cover"
        />

        {/* Top Header Buttons */}
        <SafeAreaView style={styles.heroSafeArea}>
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.glassButtonRound} 
              onPress={() => navigation.goBack()}
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View style={styles.topRightActions}>
              <TouchableOpacity style={styles.glassButtonRound}>
                <MessageCircle size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Glassmorphism Pills overlaid on image */}
          <View style={styles.pillsContainer}>
            <View style={styles.glassPill}>
              <GraduationCap size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.glassPillText}>{doctor.university}</Text>
            </View>
            <View style={styles.glassPill}>
              <Text style={styles.glassPillText}>Bs. 150 /consulta</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* ── BOTTOM SHEET SECTION ── */}
      <View style={[styles.bottomSheet, { backgroundColor: theme.background }]}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* Doctor Info */}
          <View style={styles.headerInfoRow}>
            <View>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.specialtyText}>{doctor.specialty}</Text>
            </View>
          </View>

          {/* Summary Cards */}
          <View style={styles.summaryCardsRow}>
            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: isDark ? theme.background : '#FFFFFF' }]}>
                <MapPin size={20} color={theme.primary} />
              </View>
              <Text style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>Sucursal</Text>
              <Text style={styles.summaryCardValue}>{doctor.branch}</Text>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={[styles.summaryIconContainer, { backgroundColor: isDark ? theme.background : '#FFFFFF' }]}>
                <Languages size={20} color={theme.primary} />
              </View>
              <Text style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>Idiomas</Text>
              <Text style={styles.summaryCardValue}>{doctor.languages}</Text>
            </View>
          </View>

          {/* Date Selector */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Selecciona fecha y hora</Text>
            <Text style={[styles.monthText, { color: theme.textSecondary }]}>{DATES_DYNAMIC.find(d => d.fullDate === selectedDate)?.monthName} ▾</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateCarousel}>
            {DATES_DYNAMIC.map((item) => {
              const isSelected = selectedDate === item.fullDate;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.dateItem,
                    { backgroundColor: theme.surface },
                    isSelected && [styles.dateItemActive, isDark && { backgroundColor: 'rgba(234, 88, 12, 0.15)' }]
                  ]}
                  onPress={() => setSelectedDate(item.fullDate)}
                >
                  <Text style={[styles.dateDayText, isSelected && [styles.dateTextActive, isDark && { color: '#F97316' }]]}>{item.day}</Text>
                  <Text style={[styles.dateDayNameText, { color: theme.textSecondary }, isSelected && [styles.dateTextActive, isDark && { color: '#F97316' }]]}>{item.dayName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Time Selector */}
          {isLoadingSlots ? (
            <View style={{ paddingVertical: 10, paddingLeft: 20 }}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : availableSlots.length === 0 ? (
            <View style={{ paddingVertical: 10, paddingLeft: 20 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>No hay turnos disponibles para este día.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeCarousel}>
              {availableSlots.map((time, index) => {
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.timeItem,
                      { backgroundColor: theme.surface },
                      isSelected && [styles.timeItemActive, isDark && { backgroundColor: 'rgba(234, 88, 12, 0.15)' }]
                    ]}
                    onPress={() => setSelectedTime(time)}
                  >
                    <Text style={[styles.timeText, isSelected && [styles.timeTextActive, isDark && { color: '#F97316' }]]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Spacer for bottom button */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>

      {/* ── BOTTOM FIXED BUTTON ── */}
      <View style={[styles.bottomButtonContainer, { backgroundColor: theme.background, borderTopColor: theme.border, paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={[styles.bookButton, isBooking && { opacity: 0.7 }]}
          disabled={isBooking}
          onPress={handleBookAppointment}
        >
          {isBooking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.bookButtonText}>Confirmar Cita</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroContainer: {
    height: height * 0.45,
    width: '100%',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    opacity: 0.9, 
  },
  heroSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  topRightActions: {
    flexDirection: 'row',
    gap: 10,
  },
  glassButtonRound: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pillsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  glassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  glassPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Bottom Sheet
  bottomSheet: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -30, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  scrollContent: {
    padding: 24,
  },
  headerInfoRow: {
    marginBottom: 24,
  },
  doctorName: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  specialtyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  
  // Summary Cards
  summaryCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  summaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryCardLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryCardValue: {
    fontSize: 16,
    fontWeight: '800',
  },

  // Selectors
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  monthText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Dates
  dateCarousel: {
    marginBottom: 24,
  },
  dateItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 16,
  },
  dateItemActive: {
    backgroundColor: '#FFF7ED', 
  },
  dateDayText: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  dateDayNameText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTextActive: {
    color: '#EA580C', 
  },

  // Times
  timeCarousel: {
    marginBottom: 20,
  },
  timeItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginRight: 12,
  },
  timeItemActive: {
    backgroundColor: '#FFF7ED',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  timeTextActive: {
    color: '#EA580C',
  },

  // Bottom Fixed Button
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  bookButton: {
    backgroundColor: '#2D7FF9',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D7FF9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
});
