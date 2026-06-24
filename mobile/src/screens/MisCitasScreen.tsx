import { Text } from '../components/CustomText';
import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, useColorScheme } from 'react-native';

import {
  ArrowLeft,
  Search,
  Calendar,
  User,
  ChevronDown,
  Ghost,
  Clock,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import { supabase } from '../services/supabase';
import { getActiveWallet, getPatientData } from '../services/patientService';
import { Skeleton } from '../components/Skeleton';

const { width } = Dimensions.get('window');

export default function MisCitasScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para expandir/colapsar las secciones
  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(true);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const wallet = await getActiveWallet();
      const patientData = await getPatientData(wallet);
      const patientId = patientData.profile?.id;

      if (!patientId) {
        setLoading(false);
        return;
      }

      // Query appointments
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (!error && data) {
        const mapped = data.map((apt: any) => {
          const dateStr = apt.appointment_date;
          const timeStr = apt.appointment_time ? apt.appointment_time.slice(0, 5) : '00:00';
          const fullDate = `${dateStr}, ${timeStr}`;

          let statusText = 'Programada';
          if (apt.status === 'confirmed') statusText = 'Confirmada';
          else if (apt.status === 'completed') statusText = 'Completada';
          else if (apt.status === 'cancelled') statusText = 'Cancelada';
          else if (apt.status === 'in_progress') statusText = 'En Consulta';

          return {
            id: apt.id,
            type: apt.type === 'virtual' ? 'Consulta Virtual' : 'Consulta Presencial',
            doctorName: apt.doctor_name || 'Médico General',
            specialty: apt.specialty || 'General',
            date: fullDate,
            status: statusText,
            statusRaw: apt.status,
            image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop',
          };
        });

        const up = mapped.filter((a: any) => ['scheduled', 'confirmed', 'in_progress'].includes(a.statusRaw));
        const comp = mapped.filter((a: any) => ['completed', 'cancelled'].includes(a.statusRaw));

        setUpcoming(up);
        setCompleted(comp);
      }
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAppointments();
    });
    loadAppointments();
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), backgroundColor: theme.background }]}>
      
      {/* ── HEADER BARS ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Search size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Calendar size={20} color={theme.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <User size={20} color={theme.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, padding: 20 }}>
          <Skeleton width="40%" height={24} borderRadius={12} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={120} borderRadius={20} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={120} borderRadius={20} style={{ marginBottom: 32 }} />
          <Skeleton width="40%" height={24} borderRadius={12} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={120} borderRadius={20} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          
          {/* ── PRÓXIMAS CITAS (UPCOMING) ── */}
          <View style={styles.sectionContainer}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setUpcomingExpanded(!upcomingExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.statusDot, { backgroundColor: '#EA580C' }]} />
                <Text style={styles.sectionTitle}>Próximas ({upcoming.length})</Text>
              </View>
              <View style={[styles.chevronContainer, { borderColor: theme.border }]}>
                <ChevronDown 
                  size={16} 
                  color={theme.textSecondary} 
                  style={{ transform: [{ rotate: upcomingExpanded ? '0deg' : '-90deg' }] }}
                />
              </View>
            </TouchableOpacity>
  
            {upcomingExpanded && upcoming.length === 0 && (
              <View style={{ padding: 30, alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 20, marginVertical: 10 }}>
                <Ghost color={theme.textSecondary} size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700' }}>Sin citas próximas</Text>
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 13 }}>No tienes citas programadas por el momento.</Text>
              </View>
            )}
  
            {upcomingExpanded && upcoming.map((apt) => (
              <TouchableOpacity 
                key={apt.id} 
                style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#0F2B3D' }]}
                onPress={() => {
                  navigation.navigate('FichaActiva', {
                    appointmentId: apt.id,
                    hospital: { nombre: 'Clínica Sede Central', ciudad: 'La Paz' },
                    especialidad: { nombre: apt.specialty }
                  });
                }}
              >
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTypeTitle}>{apt.type}</Text>
                  <View style={[styles.pill, isDark ? { backgroundColor: 'rgba(59, 130, 246, 0.15)' } : styles.pillUpcoming]}>
                    <Text style={[styles.pillTextUpcoming, isDark && { color: '#60A5FA' }]}>{apt.status}</Text>
                  </View>
                </View>
  
                <View style={styles.cardBottomRow}>
                  <Image source={{ uri: apt.image }} style={[styles.doctorAvatar, { backgroundColor: theme.border }]} />
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{apt.doctorName}</Text>
                    <Text style={[styles.specialtyText, { color: theme.textSecondary }]}>{apt.specialty}</Text>
                  </View>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>{apt.date}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
  
          {/* ── CITAS COMPLETADAS ── */}
          <View style={[styles.sectionContainer, { marginTop: 10 }]}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => setCompletedExpanded(!completedExpanded)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.sectionTitle}>Completadas ({completed.length})</Text>
              </View>
              <View style={[styles.chevronContainer, { borderColor: theme.border }]}>
                <ChevronDown 
                  size={16} 
                  color={theme.textSecondary} 
                  style={{ transform: [{ rotate: completedExpanded ? '0deg' : '-90deg' }] }}
                />
              </View>
            </TouchableOpacity>
  
            {completedExpanded && completed.length === 0 && (
              <View style={{ padding: 30, alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: 20, marginVertical: 10 }}>
                <Clock color={theme.textSecondary} size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '700' }}>Sin historial</Text>
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 13 }}>No tienes citas archivadas.</Text>
              </View>
            )}
  
            {completedExpanded && completed.map((apt) => (
              <View key={apt.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#0F2B3D' }]}>
                <View style={styles.cardTopRow}>
                  <Text style={styles.cardTypeTitle}>{apt.type}</Text>
                  <View style={[styles.pill, isDark ? { backgroundColor: 'rgba(16, 185, 129, 0.15)' } : styles.pillCompleted]}>
                    <Text style={[styles.pillTextCompleted, isDark && { color: '#34D399' }]}>{apt.status}</Text>
                  </View>
                </View>
  
                <View style={styles.cardBottomRow}>
                  <Image source={{ uri: apt.image }} style={[styles.doctorAvatar, { backgroundColor: theme.border }]} />
                  <View style={styles.doctorInfo}>
                    <Text style={styles.doctorName}>{apt.doctorName}</Text>
                    <Text style={[styles.specialtyText, { color: theme.textSecondary }]}>{apt.specialty}</Text>
                  </View>
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateText}>{apt.date}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  // Section Headers
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  chevronContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },

  // Cards
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  cardTypeTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 10,
    lineHeight: 22,
  },
  
  // Pills
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pillUpcoming: {
    backgroundColor: '#DBEAFE', 
  },
  pillTextUpcoming: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '700',
  },
  pillCompleted: {
    backgroundColor: '#DCFCE7', 
  },
  pillTextCompleted: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '700',
  },

  // Card Bottom Info
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 12,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  specialtyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dateContainer: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 20, 
  },
});
