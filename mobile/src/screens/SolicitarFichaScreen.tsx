import { Text } from '../components/CustomText';
import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, FlatList, useColorScheme } from 'react-native';

import {
  ArrowLeft,
  Search,
  Star,
  MapPin,
  ChevronDown,
  GraduationCap,
  MessageCircle
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - 45) / 2; // 2 columns with spacing

// ── DATOS MOCK PREMIUM ────────────────────────────────────────────────────────
const DOCTORES_MOCK = [
  {
    id: '1',
    name: 'Dr. Jorge Ayala',
    specialty: 'Ginecología',
    university: 'UMSA',
    languages: 'Esp, Inglés',
    rm: '45892',
    branch: 'Sede Sur',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop',
    featured: true,
  },
  {
    id: '2',
    name: 'Dra. Camila Vargas',
    specialty: 'Cardiología',
    university: 'UAGRM',
    languages: 'Español',
    rm: '38194',
    branch: 'Sede Central',
    image: 'https://images.unsplash.com/photo-1594824436951-7f12bcceabc4?q=80&w=200&auto=format&fit=crop',
    featured: false,
  },
  {
    id: '3',
    name: 'Dr. Roberto Flores',
    specialty: 'Pediatría',
    university: 'UMSS',
    languages: 'Esp, Quechua',
    rm: '29384',
    branch: 'Sede Sur',
    image: 'https://images.unsplash.com/photo-1537368910025-702800faa86b?q=80&w=200&auto=format&fit=crop',
    featured: false,
  },
  {
    id: '4',
    name: 'Dra. Andrea Ríos',
    specialty: 'Medicina General',
    university: 'Univalle',
    languages: 'Esp, Inglés',
    rm: '50291',
    branch: 'Sede Central',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=200&auto=format&fit=crop',
    featured: false,
  },
  {
    id: '5',
    name: 'Dr. Diego Mendoza',
    specialty: 'Traumatología',
    university: 'UMSA',
    languages: 'Español',
    rm: '41920',
    branch: 'Sede Central',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
    featured: false,
  },
  {
    id: '6',
    name: 'Dra. Sofía Castro',
    specialty: 'Neurología',
    university: 'Católica',
    languages: 'Esp, Inglés',
    rm: '39482',
    branch: 'Sede Sur',
    image: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?q=80&w=200&auto=format&fit=crop',
    featured: false,
  },
];

export default function SolicitarFichaScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('Todos');

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const handleDoctorPress = (doctor: typeof DOCTORES_MOCK[0]) => {
    navigation.navigate('DoctorProfile', { doctor });
  };

  const renderDoctorCard = ({ item }: { item: typeof DOCTORES_MOCK[0] }) => {
    const isFeatured = item.featured;
    
    return (
      <TouchableOpacity 
        style={[
          styles.doctorCard, 
          { backgroundColor: theme.surface, borderColor: theme.border },
          isFeatured && [styles.doctorCardFeatured, isDark && { backgroundColor: 'rgba(14, 165, 233, 0.05)', borderColor: 'rgba(14, 165, 233, 0.3)' }]
        ]}
        onPress={() => handleDoctorPress(item)}
        activeOpacity={0.9}
      >
        {/* Top Row: Avatar & Name */}
        <View style={styles.cardTopRow}>
          <View style={[styles.imageContainer, { backgroundColor: theme.border }]}>
            <Image source={{ uri: item.image }} style={styles.doctorImage} />
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.doctorName} numberOfLines={2}>{item.name}</Text>
          </View>
        </View>

        {/* Featured Mini Tag */}
        {isFeatured && (
          <View style={[styles.miniFeaturedBadge, isDark && { backgroundColor: 'rgba(14, 165, 233, 0.2)' }]}>
            <Text style={[styles.miniFeaturedText, isDark && { color: '#38BDF8' }]}>Recomendado</Text>
          </View>
        )}

        {/* Middle: Specialty */}
        <Text style={[styles.specialtyText, { color: theme.textPrimary }]}>{item.specialty}</Text>
        
        {/* Credentials Row */}
        <View style={styles.credentialRow}>
          <View style={styles.iconTextRow}>
            <GraduationCap size={12} color={theme.textSecondary} />
            <Text style={[styles.credentialText, { color: theme.textSecondary }]}> {item.university}</Text>
          </View>
          <View style={styles.iconTextRow}>
            <MessageCircle size={12} color={theme.textSecondary} />
            <Text style={[styles.credentialText, { color: theme.textSecondary }]}> {item.languages}</Text>
          </View>
        </View>
        <Text style={[styles.rmText, { color: theme.textSecondary }]}>RM: {item.rm}</Text>
        
        {/* Bottom: Branch */}
        <View style={[styles.branchRow, { borderTopColor: theme.border }]}>
          <MapPin size={12} color={theme.textSecondary} />
          <Text style={[styles.branchText, { color: theme.textSecondary }]}>{item.branch}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: theme.background }]}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={() => navigation?.goBack()}
          >
            <ArrowLeft size={24} color={theme.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Directorio Médico</Text>
        </View>
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Search size={22} color={theme.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* ── FILTROS (PILLS) ── */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
          data={['Todos', 'Sucursal ▾', 'Especialidad ▾', 'Recomendados']}
          keyExtractor={(item) => item}
          renderItem={({ item }) => {
            const isActive = activeFilter === item;
            return (
              <TouchableOpacity 
                style={[
                  styles.filterPill, 
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isActive && { backgroundColor: theme.primary, borderColor: theme.primary }
                ]}
                onPress={() => setActiveFilter(item)}
              >
                <Text style={[
                  styles.filterPillText, 
                  { color: theme.textSecondary },
                  isActive && { color: '#FFFFFF' }
                ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* ── LISTA DE DOCTORES (GRID) ── */}
      <FlatList
        data={DOCTORES_MOCK}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.gridContent}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        renderItem={renderDoctorCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  
  // Filtros
  filtersContainer: {
    marginBottom: 15,
  },
  filtersScrollContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Grid
  gridContent: {
    paddingHorizontal: 15,
    paddingBottom: 40,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  // Tarjeta de Doctor
  doctorCard: {
    width: cardWidth,
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  doctorCardFeatured: {
    borderColor: '#E0F2FE', // Very subtle light blue border
    backgroundColor: '#F8FAFC',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  imageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  doctorImage: {
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    flex: 1,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
  miniFeaturedBadge: {
    backgroundColor: '#0EA5E9',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  miniFeaturedText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  specialtyText: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  credentialRow: {
    gap: 4,
    marginBottom: 6,
  },
  iconTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  credentialText: {
    fontSize: 10,
    fontWeight: '500',
  },
  rmText: {
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 10,
  },
  branchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  branchText: {
    fontSize: 11,
    fontWeight: '600',
  }
});
