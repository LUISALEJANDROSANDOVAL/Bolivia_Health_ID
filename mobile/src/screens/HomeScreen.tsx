import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Shield,
  FileText,
  ChevronRight,
  CheckCircle,
  Lock,
  LayoutDashboard,
  Ticket,
  User,
  ClipboardList,
  Wifi,
  Droplets,
  Heart,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ─── DATOS DE DEMO (en la app real vendrían de Supabase) ──────────────────────
const PACIENTE_DEMO = {
  nombre: 'Valeria Rojas',
  cedula: 'CL: 8.472.910 LP',
  grupoSanguineo: 'O+',
  seguro: 'SUS & CNS',
  walletId: '0x8d2a...AF1C',
  foto: null, // URL de imagen real en producción
  turnoActivo: {
    numero: 18,
    actual: 15,
    hospital: 'Hospital de Clínicas',
    especialidad: 'Medicina General',
  },
  historialCount: 3,
};

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function HomeScreen({ navigation }: any) {
  const [tabActivo, setTabActivo] = useState('home');
  const insets = useSafeAreaInsets();

  // Animación de respiración (breathing) para la tarjeta Health ID
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Avatar del paciente */}
          <View style={styles.avatar}>
            <User size={20} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerAppName}>Bolivia Health ID</Text>
            <View style={styles.badgeRegistrado}>
              <Text style={styles.badgeRegistradoText}>PACIENTE REGISTRADO</Text>
            </View>
          </View>
        </View>
        {/* Ícono de seguridad */}
        <View style={styles.headerShield}>
          <Shield size={20} color="#14B8A6" strokeWidth={2} />
        </View>
      </View>

      {/* ── BADGE BLOCKCHAIN ───────────────────────────────────────── */}
      <View style={styles.blockchainBadgeContainer}>
        <View style={styles.blockchainBadge}>
          <Wifi size={12} color="#2D7FF9" />
          <Text style={styles.blockchainBadgeText}>  Identidad Protegida por Blockchain</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── TARJETA DE IDENTIDAD HOLOGRÁFICA ────────────────────── */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.identityCard}
            activeOpacity={0.9}
            onPress={() => navigation?.navigate('HealthID')}
          >
            {/* Efecto de Marca de Agua (Fondo) */}
            <View style={styles.watermarkContainer}>
              <Shield size={120} color="rgba(255,255,255,0.03)" strokeWidth={1} />
            </View>

            {/* Nombre y verificación */}
            <View style={styles.identityNameRow}>
              <Text style={styles.identityName}>{PACIENTE_DEMO.nombre}</Text>
              <CheckCircle size={18} color="#14B8A6" fill="#14B8A6" />
            </View>

            <View style={styles.identitySubRow}>
              <Text style={styles.identityCedula}>{PACIENTE_DEMO.cedula}</Text>
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ VERIFIED</Text>
              </View>
            </View>

            {/* Datos médicos básicos */}
            <View style={styles.identityStatsRow}>
              <View style={styles.identityStat}>
                <Droplets size={14} color="#64748B" />
                <View>
                  <Text style={styles.identityStatLabel}>GRUPO SANGUÍNEO</Text>
                  <Text style={styles.identityStatValue}>{PACIENTE_DEMO.grupoSanguineo}</Text>
                </View>
              </View>
              <View style={styles.identityDivider} />
              <View style={styles.identityStat}>
                <Heart size={14} color="#64748B" />
                <View>
                  <Text style={styles.identityStatLabel}>SEGURO ACTIVO</Text>
                  <Text style={styles.identityStatValue}>{PACIENTE_DEMO.seguro}</Text>
                </View>
              </View>
            </View>

            {/* QR Wallet */}
            <View style={styles.qrContainer}>
              {/* 
              TODO: Reemplazar este bloque por <QRCode value={walletId} size={90} />
              después de instalar: npm install react-native-qrcode-svg react-native-svg
            */}
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>QR</Text>
              </View>
              <Text style={styles.walletIdText}>
                WALLET ID: {PACIENTE_DEMO.walletId}
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* ── SECCIÓN: CITA ACTIVA ──────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

        <TouchableOpacity
          style={styles.cardCitaActiva}
          activeOpacity={0.8}
          onPress={() => navigation?.navigate('SolicitarFicha')}
        >
          <View style={styles.cardLeft}>
            <View style={styles.cardIconContainer}>
              <Ticket size={22} color="#2D7FF9" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Cita Activa</Text>
              <Text style={styles.cardSubtitle}>
                Ver mi turno actual en la fila virtual
              </Text>
            </View>
          </View>
          <View style={styles.turnoContainer}>
            <Text style={styles.turnoLabel}>TURNO</Text>
            <Text style={styles.turnoNumber}>{PACIENTE_DEMO.turnoActivo.numero}</Text>
          </View>
        </TouchableOpacity>

        {/* ── SECCIÓN: HISTORIAL CLÍNICO ────────────────────────────── */}
        <TouchableOpacity
          style={styles.cardGeneric}
          activeOpacity={0.8}
          onPress={() => navigation?.navigate('Historial')}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#EFF6FF' }]}>
              <ClipboardList size={22} color="#2D7FF9" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Historial Clínico</Text>
              <Text style={styles.cardSubtitle}>
                {PACIENTE_DEMO.historialCount} nuevos registros de Lab.
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* ── SECCIÓN: AUTORIZAR MÉDICO ─────────────────────────────── */}
        <TouchableOpacity
          style={[styles.cardGeneric, styles.cardMedico]}
          activeOpacity={0.8}
          onPress={() => navigation?.navigate('Permisos')}
        >
          <View style={styles.cardLeft}>
            <View style={[styles.cardIconContainer, { backgroundColor: '#FFF7ED' }]}>
              <Lock size={22} color="#F97316" />
            </View>
            <View>
              <Text style={styles.cardTitle}>Autorizar Médico</Text>
              <Text style={styles.cardSubtitle}>
                Gestionar acceso a tu historial clínico
              </Text>
            </View>
          </View>
          <ChevronRight size={20} color="#94A3B8" />
        </TouchableOpacity>

      </ScrollView>

      {/* ── TAB BAR INFERIOR ────────── */}
      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setTabActivo('home')}
        >
          <LayoutDashboard
            size={22}
            color={tabActivo === 'home' ? '#2D7FF9' : '#94A3B8'}
            strokeWidth={tabActivo === 'home' ? 2.5 : 1.5}
          />
          <Text style={[styles.tabLabel, tabActivo === 'home' && styles.tabLabelActive]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setTabActivo('records')}
        >
          <FileText
            size={22}
            color={tabActivo === 'records' ? '#2D7FF9' : '#94A3B8'}
            strokeWidth={tabActivo === 'records' ? 2.5 : 1.5}
          />
          <Text style={[styles.tabLabel, tabActivo === 'records' && styles.tabLabelActive]}>
            Records
          </Text>
        </TouchableOpacity>

        {/* CORRECCIÓN UX: Era "Scanner" (función de médico). Ahora es "Mi Turno" (función de paciente) */}
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setTabActivo('turno')}
        >
          <Ticket
            size={22}
            color={tabActivo === 'turno' ? '#2D7FF9' : '#94A3B8'}
            strokeWidth={tabActivo === 'turno' ? 2.5 : 1.5}
          />
          <Text style={[styles.tabLabel, tabActivo === 'turno' && styles.tabLabelActive]}>
            Mi Turno
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setTabActivo('profile')}
        >
          <User
            size={22}
            color={tabActivo === 'profile' ? '#2D7FF9' : '#94A3B8'}
            strokeWidth={tabActivo === 'profile' ? 2.5 : 1.5}
          />
          <Text style={[styles.tabLabel, tabActivo === 'profile' && styles.tabLabelActive]}>
            Profile
          </Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

// ─── ESTILOS ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F2B3D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAppName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F2B3D',
  },
  badgeRegistrado: {
    backgroundColor: '#EFF6FF',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgeRegistradoText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2D7FF9',
    letterSpacing: 0.5,
  },
  headerShield: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Badge blockchain
  blockchainBadgeContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
  },
  blockchainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  blockchainBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D7FF9',
  },

  // Scroll
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 24, gap: 12 },

  // Tarjeta de identidad
  identityCard: {
    backgroundColor: '#0F2B3D',
    borderRadius: 20,
    padding: 24,
    marginBottom: 4,
    shadowColor: '#0F2B3D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.2)', // Borde turquesa sutil (Glass effect)
    overflow: 'hidden',
  },
  watermarkContainer: {
    position: 'absolute',
    right: -20,
    top: -20,
    transform: [{ rotate: '-15deg' }],
  },
  identityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  identityName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  identitySubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  identityCedula: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  verifiedBadge: {
    backgroundColor: 'rgba(20, 184, 166, 0.15)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(20, 184, 166, 0.3)',
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#14B8A6',
    letterSpacing: 0.5,
  },
  identityStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  identityStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  identityDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  identityStatLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  identityStatValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // QR
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  qrPlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  qrPlaceholderText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F2B3D',
  },
  walletIdText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  // Section title
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 4,
  },

  // Tarjeta Cita Activa
  cardCitaActiva: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2D7FF9',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F2B3D',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  turnoContainer: {
    backgroundColor: '#2D7FF9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 54,
  },
  turnoLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  turnoNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },

  // Tarjetas genéricas
  cardGeneric: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardMedico: {
    borderLeftWidth: 4,
    borderLeftColor: '#F97316',
  },

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#2D7FF9',
    fontWeight: '700',
  },
});
