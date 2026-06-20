import { Text } from '../components/CustomText';
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Animated,
  useColorScheme
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArrowLeft,
  ShieldCheck,
  CheckSquare,
  Square,
  Lock,
  MapPin,
  Clock,
  UserCircle,
} from 'lucide-react-native';
import { Colors } from '../theme/Colors';

const { width, height } = Dimensions.get('window');

// ── DATOS MOCK DEL DOCTOR ──────────────────────────────────────────────────
const DOCTOR_DEMO = {
  nombre: 'Dr. Jose Mamani',
  especialidad: 'Cardiología',
  hospital: 'Clínica del Sur',
};

const DURACIONES = ['Solo hoy', '24 horas', '7 días', 'Persistente'];

const CATEGORIAS_DATOS = [
  { id: 'historial', label: 'Mis diagnósticos y consultas' },
  { id: 'signos', label: 'Mis signos vitales actuales' },
  { id: 'recetas', label: 'Mis recetas médicas activas' },
  { id: 'laboratorios', label: 'Mis resultados de laboratorio' },
];

export default function PermisosScreen({ navigation }: any) {
  const [duracionSeleccionada, setDuracionSeleccionada] = useState('Solo hoy');
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<string[]>([
    'historial',
    'signos',
  ]);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Animaciones Premium
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const toggleCategoria = (id: string) => {
    if (categoriasSeleccionadas.includes(id)) {
      setCategoriasSeleccionadas(categoriasSeleccionadas.filter((c) => c !== id));
    } else {
      setCategoriasSeleccionadas([...categoriasSeleccionadas, id]);
    }
  };

  const handleAutorizar = () => {
    alert('Acceso autorizado y registrado de forma segura.');
    navigation?.goBack();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── HEADER BLANCO LIMPIO ── */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.surface, borderColor: theme.border }]} 
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={20} color={theme.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <ShieldCheck size={18} color="#14B8A6" />
          <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Centro de Privacidad</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={[styles.scroll, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* ── TÍTULO DE LA PANTALLA ── */}
        <View style={styles.titleSection}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>Compartir Mis Datos</Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            Estás a punto de otorgar acceso temporal a tu información médica verificada. Tú tienes el control total.
          </Text>
        </View>

        {/* ── BANNER DE SEGURIDAD ── */}
        <View style={[styles.securityBanner, isDark && { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: 'rgba(139, 92, 246, 0.3)' }]}>
          <Lock size={14} color="#8B5CF6" />
          <Text style={[styles.securityBannerText, isDark && { color: '#C4B5FD' }]}>
            Acceso protegido con seguridad avanzada
          </Text>
        </View>

        {/* ── SECCIÓN 1: ¿CON QUIÉN COMPARTES? ── */}
        <Text style={styles.sectionTitle}>¿CON QUIÉN COMPARTES?</Text>
        <View style={[styles.doctorCard, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#000' }]}>
          <View style={[styles.doctorAvatarContainer, { backgroundColor: isDark ? theme.background : '#F8FAFC', borderColor: theme.border }]}>
            <UserCircle size={48} color={theme.textSecondary} strokeWidth={1} />
          </View>
          <View style={styles.doctorInfo}>
            <Text style={[styles.doctorName, { color: theme.textPrimary }]}>{DOCTOR_DEMO.nombre}</Text>
            <Text style={[styles.doctorSpecialty, isDark && { color: '#60A5FA' }]}>{DOCTOR_DEMO.especialidad}</Text>
            <View style={styles.doctorHospitalRow}>
              <MapPin size={12} color={theme.textSecondary} />
              <Text style={[styles.doctorHospitalText, { color: theme.textSecondary }]}>{DOCTOR_DEMO.hospital}</Text>
            </View>
          </View>
        </View>

        {/* ── SECCIÓN 2: TIEMPO DE ACCESO ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>DURACIÓN DEL ACCESO</Text>
          <Clock size={14} color={theme.textSecondary} />
        </View>
        <View style={styles.duracionGrid}>
          {DURACIONES.map((duracion) => {
            const isSelected = duracionSeleccionada === duracion;
            return (
              <TouchableOpacity
                key={duracion}
                style={[
                  styles.duracionBtn,
                  { backgroundColor: theme.surface, borderColor: theme.border },
                  isSelected && [styles.duracionBtnActivo, { backgroundColor: theme.primary, borderColor: theme.primary }]
                ]}
                onPress={() => setDuracionSeleccionada(duracion)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.duracionBtnText,
                  { color: theme.textSecondary },
                  isSelected && styles.duracionBtnTextActivo
                ]}>
                  {duracion}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── SECCIÓN 3: ¿QUÉ INFORMACIÓN COMPARTIR? ── */}
        <Text style={styles.sectionTitle}>¿QUÉ DATOS DESEAS COMPARTIR?</Text>
        <View style={[styles.categoriasContainer, { backgroundColor: theme.surface, borderColor: theme.border, shadowColor: isDark ? '#000' : '#000' }]}>
          {CATEGORIAS_DATOS.map((cat, index) => {
            const isSelected = categoriasSeleccionadas.includes(cat.id);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoriaRow,
                  index !== CATEGORIAS_DATOS.length - 1 && [styles.categoriaBorderBottom, { borderBottomColor: theme.border }],
                ]}
                onPress={() => toggleCategoria(cat.id)}
                activeOpacity={0.7}
              >
                <View style={styles.categoriaLeft}>
                  <Text style={[
                    styles.categoriaLabel,
                    { color: theme.textSecondary },
                    isSelected && [styles.categoriaLabelActivo, { color: theme.textPrimary }]
                  ]}>
                    {cat.label}
                  </Text>
                </View>
                <View style={styles.checkboxContainer}>
                  {isSelected ? (
                    <CheckSquare size={24} color={theme.primary} fill={isDark ? theme.primary : '#EFF6FF'} />
                  ) : (
                    <Square size={24} color={theme.border} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 20 }} />

        {/* ── BOTONES DE ACCIÓN ── */}
        <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: theme.primary, shadowColor: theme.primary }]} onPress={handleAutorizar} activeOpacity={0.85}>
          <Lock size={18} color="#FFFFFF" />
          <Text style={styles.btnPrimaryText}> Autorizar Acceso Seguro</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondary} onPress={() => navigation?.goBack()} activeOpacity={0.7}>
          <Text style={[styles.btnSecondaryText, { color: theme.textSecondary }]}>Cancelar</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header Limpio
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Título de Pantalla
  titleSection: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },

  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 40,
  },
  
  // Banner Seguridad
  securityBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F5F3FF',
    borderRadius: 14,
    paddingVertical: 12,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: '#EDE9FE',
  },
  securityBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  
  // Títulos de Sección
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  
  // Tarjeta de Doctor
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: 20,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 3,
  },
  doctorAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  doctorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  doctorSpecialty: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D7FF9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  doctorHospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorHospitalText: {
    fontSize: 13,
    fontWeight: '500',
  },
  
  // Grid de Duración
  duracionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 32,
  },
  duracionBtn: {
    width: '48%',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  duracionBtnActivo: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  duracionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  duracionBtnTextActivo: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  
  // Categorías de Datos (Checkboxes)
  categoriasContainer: {
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 32,
    overflow: 'hidden',
  },
  categoriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  categoriaBorderBottom: {
    borderBottomWidth: 1,
  },
  categoriaLeft: {
    flex: 1,
    paddingRight: 16,
  },
  categoriaLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoriaLabelActivo: {
    fontWeight: '800',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Botones de Acción
  btnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    paddingVertical: 18,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 16,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnSecondary: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  btnSecondaryText: {
    fontSize: 15,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
