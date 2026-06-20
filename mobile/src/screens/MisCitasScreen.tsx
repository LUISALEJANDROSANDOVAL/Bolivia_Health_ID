import { Text } from '../components/CustomText';
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, useColorScheme } from 'react-native';

import {
  ArrowLeft,
  Search,
  Calendar,
  User,
  ChevronDown,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';

const { width } = Dimensions.get('window');

// ── DATOS MOCK ───────────────────────────────────────────────────────────────
const UPCOMING_APPOINTMENTS = [
  {
    id: '1',
    type: 'Consulta General',
    doctorName: 'Dr. Jorge Ayala',
    specialty: 'Medicina General',
    date: '15 Nov 2026, 10:30',
    status: 'Faltan 2 días',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop',
  },
];

const COMPLETED_APPOINTMENTS = [
  {
    id: '2',
    type: 'Cardiología',
    doctorName: 'Dra. Camila Vargas',
    specialty: 'Cardióloga',
    date: '02 Nov 2026, 14:00',
    status: 'Completada',
    image: 'https://images.unsplash.com/photo-1594824436998-dd40e4f20f01?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: '3',
    type: 'Odontología',
    doctorName: 'Dr. Roberto Siles',
    specialty: 'Odontólogo',
    date: '15 Oct 2026, 09:15',
    status: 'Completada',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?q=80&w=200&auto=format&fit=crop',
  },
];

export default function MisCitasScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Estados para expandir/colapsar las secciones
  const [upcomingExpanded, setUpcomingExpanded] = useState(true);
  const [completedExpanded, setCompletedExpanded] = useState(true);

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
              <Text style={styles.sectionTitle}>Próximas ({UPCOMING_APPOINTMENTS.length})</Text>
            </View>
            <View style={[styles.chevronContainer, { borderColor: theme.border }]}>
              <ChevronDown 
                size={16} 
                color={theme.textSecondary} 
                style={{ transform: [{ rotate: upcomingExpanded ? '0deg' : '-90deg' }] }}
              />
            </View>
          </TouchableOpacity>

          {upcomingExpanded && UPCOMING_APPOINTMENTS.map((apt) => (
            <TouchableOpacity 
              key={apt.id} 
              style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#0F2B3D' }]}
              onPress={() => {
                navigation.navigate('FichaActiva', {
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
              <Text style={styles.sectionTitle}>Completadas ({COMPLETED_APPOINTMENTS.length})</Text>
            </View>
            <View style={[styles.chevronContainer, { borderColor: theme.border }]}>
              <ChevronDown 
                size={16} 
                color={theme.textSecondary} 
                style={{ transform: [{ rotate: completedExpanded ? '0deg' : '-90deg' }] }}
              />
            </View>
          </TouchableOpacity>

          {completedExpanded && COMPLETED_APPOINTMENTS.map((apt) => (
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
