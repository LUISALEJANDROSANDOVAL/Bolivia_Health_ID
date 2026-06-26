import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, FlatList, Image, Modal, Animated } from 'react-native';
import { Text } from '../components/CustomText';
import { ArrowLeft, Search, MapPin, GraduationCap, MessageCircle, Building2, X, Ghost } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../theme/Colors';
import { useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');
const cardWidth = (width - 40 - 15) / 2;

const Skeleton = ({ width, height, borderRadius = 8, style }: any) => {
  const isDark = useColorScheme() === 'dark';
  return (
    <View style={[{ width, height, borderRadius, backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }, style]} />
  );
};

const DoctorCard = ({ item, index, theme, isDark, onPress }: any) => {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: 1,
      delay: index * 100, // Stagger effect
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, [item.id]);

  const isFeatured = item.featured;
  const initials = item.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('') || 'DR';

  return (
    <Animated.View style={{ 
      opacity: animValue, 
      transform: [{ 
        translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) 
      }] 
    }}>
      <TouchableOpacity 
        style={[
          styles.doctorCard, 
          { backgroundColor: theme.surface, borderColor: theme.border },
          isFeatured && [styles.doctorCardFeatured, isDark && { backgroundColor: 'rgba(56, 189, 248, 0.05)', borderColor: 'rgba(56, 189, 248, 0.2)' }]
        ]}
        onPress={() => onPress(item)}
        activeOpacity={0.9}
      >
        <View style={styles.cardTopRow}>
          <View style={[styles.imageContainer, { backgroundColor: theme.border }]}>
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.doctorImage} />
            ) : (
              <LinearGradient
                colors={isDark ? ['#1E3A8A', '#3B82F6'] : ['#3B82F6', '#60A5FA']}
                style={[StyleSheet.absoluteFillObject, { justifyContent: 'center', alignItems: 'center' }]}
              >
                <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>{initials}</Text>
              </LinearGradient>
            )}
          </View>
          <View style={styles.nameContainer}>
            <Text style={[styles.doctorName, { color: theme.textPrimary }]} numberOfLines={2}>{item.name}</Text>
          </View>
        </View>

        {isFeatured && (
          <View style={[styles.miniFeaturedBadge, isDark && { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <Text style={[styles.miniFeaturedText, isDark && { color: '#38BDF8' }]}>Recomendado</Text>
          </View>
        )}

        <Text style={[styles.specialtyText, { color: theme.textPrimary }]}>{item.specialty}</Text>
        
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
        
        <View style={[styles.branchRow, { borderTopColor: theme.border }]}>
          <MapPin size={12} color={theme.textSecondary} />
          <Text style={[styles.branchText, { color: theme.textSecondary }]}>{item.branch}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};


export default function SolicitarFichaScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [activeFilter, setActiveFilter] = useState('Todos');
  const [selectedBranch, setSelectedBranch] = useState<any>(null);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);

  const [branchModalVisible, setBranchModalVisible] = useState(false);
  const [specialtyModalVisible, setSpecialtyModalVisible] = useState(false);

  const [doctors, setDoctors] = useState<any[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

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
          const sucursalNames = Array.from(new Set(
            doc.doctor_sucursal
              ?.map((ds: any) => ds.sucursales?.name)
              .filter(Boolean) || []
          ));
          const branchName = sucursalNames.join(', ') || 'Sede Central';
          const branchIds = doc.doctor_sucursal?.map((ds: any) => ds.sucursal_id) || [];

          const prefs = doc.preferences || {};
          const image = prefs.image || doc.avatar_url; // Eliminada la foto hardcodeada
          const university = prefs.university || 'UMSA';
          const languages = prefs.languages || 'Español';
          const featured = prefs.featured || false;

          return {
            id: doc.id,
            name: doc.full_name,
            specialty: (doc.specialty || 'Medicina General').trim(),
            university,
            languages,
            rm: doc.license_number || 'S/N',
            branch: branchName,
            branchIds,
            image,
            featured,
          };
        });

        setDoctors(mappedDoctors);
        setFilteredDoctors(mappedDoctors);

        const uniqueSpecs = Array.from(new Set(mappedDoctors.map((d: any) => d.specialty)));
        setSpecialties(uniqueSpecs);

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

  useEffect(() => {
    let result = [...doctors];

    if (activeFilter === 'Recomendados') {
      result = result.filter(d => d.featured);
    } else if (activeFilter === 'Todos') {
      setSelectedBranch(null);
      setSelectedSpecialty(null);
    }

    if (selectedBranch) {
      result = result.filter(d => d.branchIds && d.branchIds.includes(selectedBranch.id));
    }

    if (selectedSpecialty) {
      result = result.filter(d => d.specialty === selectedSpecialty);
    }

    setFilteredDoctors(result);
  }, [activeFilter, selectedBranch, selectedSpecialty, doctors]);

  const handleDoctorPress = (doctor: any) => {
    navigation.navigate('DoctorProfile', { 
      doctor, 
      preselectedBranchId: selectedBranch ? selectedBranch.id : null 
    });
  };

  const handleFilterPillPress = (item: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Directorio Médico</Text>
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
        <View style={{ flex: 1, padding: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Skeleton width="48%" height={220} borderRadius={20} />
            <Skeleton width="48%" height={220} borderRadius={20} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Skeleton width="48%" height={220} borderRadius={20} />
            <Skeleton width="48%" height={220} borderRadius={20} />
          </View>
        </View>
      ) : filteredDoctors.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ghost color={theme.textSecondary} size={64} style={{ marginBottom: 16, opacity: 0.5 }} />
          <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
            No hay especialistas
          </Text>
          <Text style={{ color: theme.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            Intenta cambiar los filtros o buscar en otra clínica.
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
          renderItem={({ item, index }) => (
            <DoctorCard 
              item={item} 
              index={index} 
              theme={theme} 
              isDark={isDark} 
              onPress={handleDoctorPress} 
            />
          )}
        />
      )}

      {/* ── MODAL SUCURSAL ── */}
      <Modal visible={branchModalVisible} transparent animationType="slide" onRequestClose={() => setBranchModalVisible(false)}>
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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      <Modal visible={specialtyModalVisible} transparent animationType="slide" onRequestClose={() => setSpecialtyModalVisible(false)}>
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
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15 },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  backButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 24, fontWeight: '800' },
  searchButton: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  
  filtersContainer: { marginBottom: 20 },
  filtersScrollContent: { paddingHorizontal: 20, gap: 12 },
  filterPill: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  filterPillText: { fontSize: 14, fontWeight: '700' },

  gridContent: { paddingHorizontal: 15, paddingBottom: 40 },
  gridRow: { justifyContent: 'space-between', marginBottom: 15 },

  doctorCard: { width: cardWidth, borderRadius: 24, padding: 16, marginBottom: 15, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 3 },
  doctorCardFeatured: { borderWidth: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  imageContainer: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden' },
  doctorImage: { width: '100%', height: '100%' },
  nameContainer: { flex: 1 },
  doctorName: { fontSize: 14, fontWeight: '800', lineHeight: 18 },
  miniFeaturedBadge: { backgroundColor: '#3B82F6', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginBottom: 12 },
  miniFeaturedText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  specialtyText: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
  credentialRow: { gap: 6, marginBottom: 8 },
  iconTextRow: { flexDirection: 'row', alignItems: 'center' },
  credentialText: { fontSize: 11, fontWeight: '600' },
  rmText: { fontSize: 11, fontWeight: '800', marginBottom: 12 },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, borderTopWidth: 1 },
  branchText: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  modalItem: { paddingVertical: 18, borderBottomWidth: 1 },
});
