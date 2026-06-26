import { Text } from '../components/CustomText';
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, useColorScheme, Animated, ActivityIndicator } from 'react-native';

import {
  ArrowLeft,
  Search,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  Ghost,
  Clock,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import { supabase } from '../services/supabase';
import { getActiveWallet, getPatientData } from '../services/patientService';
import { Skeleton } from '../components/Skeleton';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const AnimatedCard = ({ children, delay }: { children: React.ReactNode, delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 40,
      friction: 7,
      delay,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [50, 0]
        })
      }]
    }}>
      {children}
    </Animated.View>
  );
};

export default function MisCitasScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [completed, setCompleted] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getInitials = (name: string) => {
    if (!name || name === 'Médico General') return 'MG';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const renderSmartAvatar = (name: string) => {
    const initials = getInitials(name);
    return (
      <LinearGradient
        colors={isDark ? ['#1E40AF', '#3B82F6'] : ['#2563EB', '#60A5FA']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.doctorAvatarGradient}
      >
        <Text style={styles.doctorAvatarInitials}>{initials}</Text>
      </LinearGradient>
    );
  };

  const getPillStyle = (statusRaw: string) => {
    if (statusRaw === 'in_progress') {
      return {
        bg: isDark ? 'rgba(234, 88, 12, 0.15)' : '#FFEDD5',
        text: isDark ? '#FB923C' : '#C2410C'
      };
    }
    if (statusRaw === 'completed') {
      return {
        bg: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
        text: isDark ? '#34D399' : '#166534'
      };
    }
    if (statusRaw === 'cancelled') {
      return {
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
        text: isDark ? '#F87171' : '#B91C1C'
      };
    }
    return {
      bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
      text: isDark ? '#60A5FA' : '#1E40AF'
    };
  };

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
          <Skeleton width="100%" height={140} borderRadius={24} style={{ marginBottom: 12 }} />
          <Skeleton width="100%" height={140} borderRadius={24} style={{ marginBottom: 32 }} />
          <Skeleton width="40%" height={24} borderRadius={12} style={{ marginBottom: 16 }} />
          <Skeleton width="100%" height={140} borderRadius={24} />
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
                <View style={[styles.statusDot, { backgroundColor: '#3B82F6' }]} />
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Próximas ({upcoming.length})</Text>
              </View>
              <View style={[styles.chevronContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <ChevronDown 
                  size={16} 
                  color={theme.textSecondary} 
                  style={{ transform: [{ rotate: upcomingExpanded ? '0deg' : '-90deg' }] }}
                />
              </View>
            </TouchableOpacity>
  
            {upcomingExpanded && upcoming.length === 0 && (
              <View style={[styles.emptyStateCard, isDark && styles.glassEmptyState]}>
                <Ghost color={theme.textSecondary} size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '800' }}>Sin citas próximas</Text>
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 13 }}>No tienes citas programadas por el momento.</Text>
              </View>
            )}
  
            {upcomingExpanded && upcoming.map((apt, idx) => {
              const pill = getPillStyle(apt.statusRaw);
              return (
                <AnimatedCard key={apt.id} delay={idx * 100}>
                  <TouchableOpacity 
                    style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, isDark && styles.glassCardDark]}
                    activeOpacity={0.7}
                    onPress={() => {
                      navigation.navigate('FichaActiva', {
                        appointmentId: apt.id,
                        hospital: { nombre: 'Clínica Sede Central', ciudad: 'La Paz' },
                        especialidad: { nombre: apt.specialty }
                      });
                    }}
                  >
                    <View style={styles.cardTopRow}>
                      <Text style={[styles.cardTypeTitle, { color: theme.textPrimary }]}>{apt.type}</Text>
                      <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                        <Text style={[styles.pillText, { color: pill.text }]}>{apt.status}</Text>
                      </View>
                    </View>
      
                    <View style={styles.cardBottomRow}>
                      {renderSmartAvatar(apt.doctorName)}
                      <View style={styles.doctorInfo}>
                        <Text style={[styles.doctorName, { color: theme.textPrimary }]}>{apt.doctorName}</Text>
                        <Text style={[styles.specialtyText, { color: theme.textSecondary }]}>{apt.specialty}</Text>
                      </View>
                      <ChevronRight size={20} color={theme.border} />
                    </View>
                    
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    
                    <View style={styles.cardFooter}>
                      <Calendar size={14} color={theme.textSecondary} />
                      <Text style={[styles.dateText, { color: theme.textSecondary }]}>{apt.date}</Text>
                    </View>
                  </TouchableOpacity>
                </AnimatedCard>
              );
            })}
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
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Completadas ({completed.length})</Text>
              </View>
              <View style={[styles.chevronContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
                <ChevronDown 
                  size={16} 
                  color={theme.textSecondary} 
                  style={{ transform: [{ rotate: completedExpanded ? '0deg' : '-90deg' }] }}
                />
              </View>
            </TouchableOpacity>
  
            {completedExpanded && completed.length === 0 && (
              <View style={[styles.emptyStateCard, isDark && styles.glassEmptyState]}>
                <Clock color={theme.textSecondary} size={48} style={{ marginBottom: 12, opacity: 0.5 }} />
                <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '800' }}>Sin historial</Text>
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 4, fontSize: 13 }}>No tienes citas archivadas.</Text>
              </View>
            )}
  
            {completedExpanded && completed.map((apt, idx) => {
              const pill = getPillStyle(apt.statusRaw);
              return (
                <AnimatedCard key={apt.id} delay={(upcoming.length * 100) + (idx * 100)}>
                  <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }, isDark && styles.glassCardDark]}>
                    <View style={styles.cardTopRow}>
                      <Text style={[styles.cardTypeTitle, { color: theme.textPrimary }]}>{apt.type}</Text>
                      <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                        <Text style={[styles.pillText, { color: pill.text }]}>{apt.status}</Text>
                      </View>
                    </View>
      
                    <View style={styles.cardBottomRow}>
                      {renderSmartAvatar(apt.doctorName)}
                      <View style={styles.doctorInfo}>
                        <Text style={[styles.doctorName, { color: theme.textPrimary }]}>{apt.doctorName}</Text>
                        <Text style={[styles.specialtyText, { color: theme.textSecondary }]}>{apt.specialty}</Text>
                      </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    
                    <View style={styles.cardFooter}>
                      <Calendar size={14} color={theme.textSecondary} />
                      <Text style={[styles.dateText, { color: theme.textSecondary }]}>{apt.date}</Text>
                    </View>
                  </View>
                </AnimatedCard>
              );
            })}
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
    marginBottom: 20,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  emptyStateCard: {
    padding: 30, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderRadius: 24, marginVertical: 10,
  },
  glassEmptyState: {
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  // Cards
  card: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  glassCardDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)', borderColor: 'rgba(255, 255, 255, 0.05)'
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTypeTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
    marginRight: 10,
  },
  
  // Pills
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Card Middle Info
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatarGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doctorAvatarInitials: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '500',
  },

  // Divider
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
    opacity: 0.5,
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
