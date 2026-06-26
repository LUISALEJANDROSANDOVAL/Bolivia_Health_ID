import { Text } from '../components/CustomText';
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, Animated, ActivityIndicator, Platform, SafeAreaView, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';

import {
  ArrowLeft,
  MapPin,
  MessageCircle,
  GraduationCap,
  Languages
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/Colors';
import { supabase } from '../services/supabase';
import { getActiveWallet, getPatientData } from '../services/patientService';

const { width } = Dimensions.get('window');

const generateNext7Days = () => {
  const days = [];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const today = new Date();
  
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

  // Animations
  const animHeader = useRef(new Animated.Value(0)).current;
  const animCards = useRef(new Animated.Value(0)).current;
  const animDates = useRef(new Animated.Value(0)).current;
  const animTimes = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(animHeader, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.spring(animCards, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.spring(animDates, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.spring(animTimes, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  }, []);

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
      Toast.show({ type: 'error', text1: 'Atención', text2: 'Por favor selecciona un horario disponible.' });
      return;
    }
    try {
      setIsBooking(true);
      const wallet = await getActiveWallet();
      const patientData = await getPatientData(wallet);
      const patientId = patientData.profile?.id;

      if (!patientId) {
        Toast.show({ type: 'error', text1: 'Error', text2: 'No se pudo identificar al paciente.' });
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .insert([{
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
        }])
        .select()
        .single();

      if (error) {
        Toast.show({ type: 'error', text1: 'Error al reservar', text2: error.message });
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Toast.show({ type: 'success', text1: '¡Cita Reservada!', text2: 'Tu cita ha sido guardada con éxito.' });
        navigation.navigate('MainTabs', { screen: 'MisCitas' });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Error de conexión.' });
    } finally {
      setIsBooking(false);
    }
  };

  const getAnimatedStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{
      translateY: anim.interpolate({
        inputRange: [0, 1],
        outputRange: [30, 0]
      })
    }]
  });

  const doctorInitials = doctor.name ? doctor.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : 'DR';
  const hasValidImage = doctor.image || doctor.avatar_url;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* ── TOP BAR (FLAT) ── */}
      <View style={[styles.topBar, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : insets.top }]}>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ArrowLeft size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navButton, { backgroundColor: theme.surface, borderColor: theme.border }]} activeOpacity={0.7}>
          <MessageCircle size={20} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* ── AVATAR Y CABECERA ── */}
        <Animated.View style={[styles.profileHeader, getAnimatedStyle(animHeader)]}>
          <View style={styles.avatarContainer}>
            {hasValidImage ? (
              <Image source={{ uri: doctor.image || doctor.avatar_url }} style={styles.avatarImage} />
            ) : (
              <LinearGradient
                colors={isDark ? ['#1E3A8A', '#3B82F6'] : ['#3B82F6', '#60A5FA']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarInitials}>{doctorInitials}</Text>
              </LinearGradient>
            )}
          </View>
          
          <Text style={[styles.doctorName, { color: theme.textPrimary }]}>{doctor.name}</Text>
          <Text style={styles.specialtyText}>{doctor.specialty}</Text>

          <View style={styles.pillsContainer}>
            <View style={[styles.infoPill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <GraduationCap size={14} color={theme.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.infoPillText, { color: theme.textSecondary }]}>{doctor.university || 'Especialista'}</Text>
            </View>
            <View style={[styles.infoPill, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}>
              <Text style={[styles.infoPillText, { color: theme.textSecondary }]}>Bs. 150 /consulta</Text>
            </View>
          </View>
        </Animated.View>

        {/* ── SUMMARY CARDS ── */}
        <Animated.View style={[styles.summaryCardsRow, getAnimatedStyle(animCards)]}>
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: 'rgba(59,130,246,0.1)' }]}>
              <MapPin size={20} color="#3B82F6" />
            </View>
            <Text style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>Sucursal</Text>
            <Text style={[styles.summaryCardValue, { color: theme.textPrimary }]}>{sucursal?.name || doctor.branch}</Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <View style={[styles.summaryIconContainer, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
              <Languages size={20} color="#10B981" />
            </View>
            <Text style={[styles.summaryCardLabel, { color: theme.textSecondary }]}>Idiomas</Text>
            <Text style={[styles.summaryCardValue, { color: theme.textPrimary }]}>{doctor.languages || 'Español'}</Text>
          </View>
        </Animated.View>

        {/* ── DATES SELECTOR ── */}
        <Animated.View style={getAnimatedStyle(animDates)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Selecciona fecha</Text>
            <Text style={[styles.monthText, { color: theme.textSecondary }]}>{DATES_DYNAMIC.find(d => d.fullDate === selectedDate)?.monthName} ▾</Text>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateCarousel}>
            {DATES_DYNAMIC.map((item) => {
              const isSelected = selectedDate === item.fullDate;
              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.8}
                  style={[styles.dateItem, { backgroundColor: isSelected ? 'transparent' : theme.surface, borderColor: isDark ? '#1E293B' : '#E2E8F0', borderWidth: isSelected ? 0 : 1 }]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedDate(item.fullDate);
                  }}
                >
                  {isSelected && <LinearGradient colors={['#F97316', '#EA580C']} style={[StyleSheet.absoluteFillObject, { borderRadius: 20 }]} />}
                  <Text style={[styles.dateDayText, { color: isSelected ? '#FFF' : theme.textPrimary }]}>{item.day}</Text>
                  <Text style={[styles.dateDayNameText, { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.textSecondary }]}>{item.dayName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── TIMES SELECTOR ── */}
        <Animated.View style={getAnimatedStyle(animTimes)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Horarios Disponibles</Text>
          </View>

          {isLoadingSlots ? (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : availableSlots.length === 0 ? (
            <View style={{ paddingVertical: 20, alignItems: 'center', backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderRadius: 16 }}>
              <Text style={{ color: theme.textSecondary, fontSize: 14, fontWeight: '500' }}>No hay turnos disponibles para este día.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeCarousel}>
              {availableSlots.map((time, index) => {
                const isSelected = selectedTime === time;
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    style={[styles.timeItem, { backgroundColor: isSelected ? 'transparent' : theme.surface, borderColor: isDark ? '#1E293B' : '#E2E8F0', borderWidth: isSelected ? 0 : 1 }]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedTime(time);
                    }}
                  >
                    {isSelected && <LinearGradient colors={['#F97316', '#EA580C']} style={[StyleSheet.absoluteFillObject, { borderRadius: 16 }]} />}
                    <Text style={[styles.timeText, { color: isSelected ? '#FFF' : theme.textPrimary }]}>{time}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>

        {/* ── BOTTOM BUTTON (Integrated in ScrollView) ── */}
        <Animated.View style={[styles.buttonWrapper, getAnimatedStyle(animTimes)]}>
          <TouchableOpacity 
            activeOpacity={0.9}
            style={[styles.bookButton, isBooking && { opacity: 0.7 }]}
            disabled={isBooking}
            onPress={handleBookAppointment}
          >
            <LinearGradient
              colors={['#2563EB', '#1D4ED8']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.bookButtonGradient}
            >
              {isBooking ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.bookButtonText}>Confirmar Cita</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  topBar: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10 },
  navButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  
  scrollContent: { padding: 24, paddingBottom: 60 },
  
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { width: 110, height: 110, borderRadius: 55, marginBottom: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  avatarImage: { width: '100%', height: '100%' },
  avatarGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { color: '#FFFFFF', fontSize: 36, fontWeight: '800', letterSpacing: 1 },
  
  doctorName: { fontSize: 26, fontWeight: '800', marginBottom: 4, letterSpacing: -0.5, textAlign: 'center' },
  specialtyText: { fontSize: 15, fontWeight: '700', color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, textAlign: 'center' },
  
  pillsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  infoPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  infoPillText: { fontSize: 13, fontWeight: '700' },
  
  summaryCardsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, marginBottom: 36 },
  summaryCard: { flex: 1, borderRadius: 24, padding: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryIconContainer: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  summaryCardLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  summaryCardValue: { fontSize: 16, fontWeight: '800' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  monthText: { fontSize: 15, fontWeight: '700' },
  
  dateCarousel: { marginBottom: 32 },
  dateItem: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, width: 72, marginRight: 12, borderRadius: 20 },
  dateDayText: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  dateDayNameText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  
  timeCarousel: { marginBottom: 20 },
  timeItem: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16, marginRight: 12 },
  timeText: { fontSize: 15, fontWeight: '800' },
  
  buttonWrapper: { marginTop: 24 },
  bookButton: { borderRadius: 100, overflow: 'hidden', shadowColor: '#2563EB', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10 },
  bookButtonGradient: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  bookButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
});
