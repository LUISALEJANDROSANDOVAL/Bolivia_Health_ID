import { Text } from '../components/CustomText';
import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, FlatList, useColorScheme, ActivityIndicator, Modal } from 'react-native';

import {
  ArrowLeft,
  Search,
  Star,
  MapPin,
  ChevronDown,
  GraduationCap,
  MessageCircle,
  X
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');
const cardWidth = (width - 45) / 2; // 2 columns with spacing

export default function SolicitarFichaScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros seleccionados
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  // Modales
  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Cargar datos de Supabase
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // 1. Obtener perfiles de médicos con sus sucursales
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            full_name,
            specialty,
            license_number,
            wallet_address,
            preferences,
            doctor_sucursal (
              sucursal_id,
              sucursales (
                id,
                name,
                address
              )
            )
          `)
          .eq('role', 'medico');

        if (profilesError) throw profilesError;

        const mappedDoctors = (profilesData || []).map((doc: any) => {
          const sucursalNames = doc.doctor_sucursal
            ?.map((ds: any) => ds.sucursales?.name)
            .filter(Boolean) || [];
          const branchName = sucursalNames.join(', ') || 'Sede Central';
          const branchId = doc.doctor_sucursal?.[0]?.sucursal_id || null;

          const prefs = doc.preferences || {};
          const image = prefs.image || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=200&auto=format&fit=crop';
          const university = prefs.university || 'UMSA';
          const languages = prefs.languages || 'Español';
          const featured = prefs.featured || false;

          return {
            id: doc.id,
            name: doc.full_name,
            specialty: doc.specialty || 'Medicina General',
            university,
            languages,
            rm: doc.license_number || 'S/N',
            branch: branchName,
            branchId,
            image,
            featured,
          };
        });

        setDoctors(mappedDoctors);
        setFilteredDoctors(mappedDoctors);

        // Extraer especialidades únicas
        const uniqueSpecs = Array.from(new Set(mappedDoctors.map((d: any) => d.specialty)));
        setSpecialties(uniqueSpecs);

        // 2. Obtener sucursales
        const { data: sucursalesData, error: sucursalesError } = await supabase
          .from('sucursales')
          .select('id, name, address');

        if (!sucursalesError && sucursalesData) {
          setBranches(sucursalesData);
        }

      } catch (err) {
        console.error('Error loading doctors directory:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Aplicar filtros cada vez que cambien o se pulse una píldora
  useEffect(() => {
    let result = [...doctors];

    if (activeFilter === 'Recomendados') {
      result = result.filter(d => d.featured);
    } else if (activeFilter === 'Todos') {
      setSelectedBranch(null);
      setSelectedSpecialty(null);
    }

    if (selectedBranch) {
      result = result.filter(d => d.branchId === selectedBranch.id);
    }

    if (selectedSpecialty) {
      result = result.filter(d => d.specialty === selectedSpecialty);
    }

    setFilteredDoctors(result);
  }, [activeFilter, selectedBranch, selectedSpecialty, doctors]);

  const handleDoctorPress = (doctor: any) => {
    navigation.navigate('DoctorProfile', { doctor });
  };

  const handleFilterPillPress = (item: string) => {
    if (item === 'Todos') {
      setActiveFilter('Todos');
      setSelectedBranch(null);
      setSelectedSpecialty(null);
    } else if (item === 'Recomendados') {
      setActiveFilter('Recomendados');
    } else if (item.startsWith('Sucursal')) {
      setBranchModalVisible(true);
    } else if (item.startsWith('Especialidad')) {
      setSpecialtyModalVisible(true);
    }
  };

  const renderDoctorCard = ({ item }: { item: any }) => {
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScrollContent}
        >
          {/* Todos */}
          <TouchableOpacity 
            style={[
              styles.filterPill, 
              { backgroundColor: theme.surface, borderColor: theme.border },
              activeFilter === 'Todos' && { backgroundColor: theme.primary, borderColor: theme.primary }
            ]}
            onPress={() => handleFilterPillPress('Todos')}
          >
            <Text style={[
              styles.filterPillText, 
              { color: theme.textSecondary },
              activeFilter === 'Todos' && { color: '#FFFFFF' }
            ]}>
              Todos
            </Text>
          </TouchableOpacity>

          {/* Sucursal Pill */}
          <TouchableOpacity 
            style={[
              styles.filterPill, 
              { backgroundColor: theme.surface, borderColor: theme.border },
              selectedBranch && { backgroundColor: theme.primary, borderColor: theme.primary }
            ]}
            onPress={() => handleFilterPillPress('Sucursal')}
          >
            <Text style={[
              styles.filterPillText, 
              { color: theme.textSecondary },
              selectedBranch && { color: '#FFFFFF' }
            ]}>
              {selectedBranch ? selectedBranch.name : 'Sucursal ▾'}
            </Text>
          </TouchableOpacity>

          {/* Especialidad Pill */}
          <TouchableOpacity 
            style={[
              styles.filterPill, 
              { backgroundColor: theme.surface, borderColor: theme.border },
              selectedSpecialty && { backgroundColor: theme.primary, borderColor: theme.primary }
            ]}
            onPress={() => handleFilterPillPress('Especialidad')}
          >
            <Text style={[
              styles.filterPillText, 
              { color: theme.textSecondary },
              selectedSpecialty && { color: '#FFFFFF' }
            ]}>
              {selectedSpecialty ? selectedSpecialty : 'Especialidad ▾'}
            </Text>
          </TouchableOpacity>

          {/* Recomendados */}
          <TouchableOpacity 
            style={[
              styles.filterPill, 
              { backgroundColor: theme.surface, borderColor: theme.border },
              activeFilter === 'Recomendados' && { backgroundColor: theme.primary, borderColor: theme.primary }
            ]}
            onPress={() => handleFilterPillPress('Recomendados')}
          >
            <Text style={[
              styles.filterPillText, 
              { color: theme.textSecondary },
              activeFilter === 'Recomendados' && { color: '#FFFFFF' }
            ]}>
              Recomendados
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* ── LISTA DE DOCTORES (GRID) ── */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: theme.textSecondary, fontSize: 16, fontWeight: '600' }}>
            No se encontraron médicos con estos filtros.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredDoctors}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
          renderItem={renderDoctorCard}
        />
      )}

      {/* ── MODAL SUCURSAL ── */}
      <Modal
        visible={branchModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBranchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Seleccionar Sucursal</Text>
              <TouchableOpacity onPress={() => setBranchModalVisible(false)}>
                <X size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity 
                style={[styles.modalItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  setSelectedBranch(null);
                  setBranchModalVisible(false);
                }}
              >
                <Text style={{ color: theme.textPrimary, fontWeight: !selectedBranch ? '700' : '400' }}>Todas las sucursales</Text>
              </TouchableOpacity>
              {branches.map(branch => (
                <TouchableOpacity 
                  key={branch.id}
                  style={[styles.modalItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    setSelectedBranch(branch);
                    setActiveFilter('Filtros');
                    setBranchModalVisible(false);
                  }}
                >
                  <Text style={{ color: theme.textPrimary, fontWeight: selectedBranch?.id === branch.id ? '700' : '400' }}>{branch.name}</Text>
                  <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{branch.address}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── MODAL ESPECIALIDAD ── */}
      <Modal
        visible={specialtyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSpecialtyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Seleccionar Especialidad</Text>
              <TouchableOpacity onPress={() => setSpecialtyModalVisible(false)}>
                <X size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300 }}>
              <TouchableOpacity 
                style={[styles.modalItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  setSelectedSpecialty(null);
                  setSpecialtyModalVisible(false);
                }}
              >
                <Text style={{ color: theme.textPrimary, fontWeight: !selectedSpecialty ? '700' : '400' }}>Todas las especialidades</Text>
              </TouchableOpacity>
              {specialties.map(spec => (
                <TouchableOpacity 
                  key={spec}
                  style={[styles.modalItem, { borderBottomColor: theme.border }]}
                  onPress={() => {
                    setSelectedSpecialty(spec);
                    setActiveFilter('Filtros');
                    setSpecialtyModalVisible(false);
                  }}
                >
                  <Text style={{ color: theme.textPrimary, fontWeight: selectedSpecialty === spec ? '700' : '400' }}>{spec}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  }
});
