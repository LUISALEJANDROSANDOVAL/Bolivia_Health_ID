import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  ArrowLeft,
  Shield,
  QrCode,
  CheckCircle,
  Droplets,
  Heart,
  ChevronRight,
  Copy,
  Activity,
  FileText,
  Pill,
  Stethoscope,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

// ── DATOS DE DEMO (MOCK DATA) ────────────────────────────────────────────────
const PACIENTE_DEMO = {
  nombre: 'Valeria Rojas',
  cedula: 'CL: 8.472.910 LP',
  grupoSanguineo: 'O Positivo',
  seguro: 'SUS & CNS',
  walletId: '0x8d2a4f1b3c9e7a2d5f8b1e4c7a0d3f6b9c2e5a8d1f4c7b0e3a6d9f2c5b8e1a4',
};

const HISTORIAL_DEMO = [
  {
    id: 1,
    tipo: 'Diagnóstico',
    icono: <Activity size={16} color="#2D7FF9" />,
    descripcion: 'Hipertensión arterial leve',
    medico: 'Dr. Carlos Mendoza',
    fecha: '12 Jun 2026',
    hash: '0xQmT7...f3k9',
    colorFondo: '#EFF6FF',
    colorBorde: '#2D7FF9',
  },
  {
    id: 2,
    tipo: 'Laboratorio',
    icono: <FileText size={16} color="#14B8A6" />,
    descripcion: 'Hemograma completo - Normal',
    medico: 'Dra. Ana Flores',
    fecha: '05 Jun 2026',
    hash: '0xQmR2...a1b4',
    colorFondo: '#F0FDF9',
    colorBorde: '#14B8A6',
  },
  {
    id: 3,
    tipo: 'Receta',
    icono: <Pill size={16} color="#F97316" />,
    descripcion: 'Enalapril 10mg - 1 vez al día',
    medico: 'Dr. Carlos Mendoza',
    fecha: '12 Jun 2026',
    hash: '0xQmW8...z2c7',
    colorFondo: '#FFF7ED',
    colorBorde: '#F97316',
  },
];

export default function HealthIDScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.container}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <ArrowLeft size={20} color="#0F2B3D" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Mi Health ID</Text>
          <Text style={styles.headerSubtitle}>Identidad Médica Digital</Text>
        </View>
        <View style={styles.headerShield}>
          <Shield size={20} color="#14B8A6" strokeWidth={2} />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TARJETA DE IDENTIDAD PRINCIPAL ── */}
        <View style={styles.idCard}>
          {/* Logo y Badge de Blockchain */}
          <View style={styles.idCardTop}>
            <View style={styles.idCardLogo}>
              <Shield size={18} color="#14B8A6" strokeWidth={2.5} />
            </View>
            <View style={styles.idCardBadge}>
              <View style={styles.idCardBadgeDot} />
              <Text style={styles.idCardBadgeText}>VERIFICADO EN AVALANCHE</Text>
            </View>
          </View>

          {/* Nombre y Cédula */}
          <View style={styles.idCardNameRow}>
            <Text style={styles.idCardName}>{PACIENTE_DEMO.nombre}</Text>
            <CheckCircle size={20} color="#14B8A6" fill="#14B8A6" />
          </View>
          <Text style={styles.idCardCedula}>{PACIENTE_DEMO.cedula}</Text>

          {/* Información Médica Rápida */}
          <View style={styles.idCardStats}>
            <View style={styles.idCardStat}>
              <Droplets size={14} color="rgba(255,255,255,0.6)" />
              <View>
                <Text style={styles.idCardStatLabel}>GRUPO SANGUÍNEO</Text>
                <Text style={styles.idCardStatValue}>{PACIENTE_DEMO.grupoSanguineo}</Text>
              </View>
            </View>
            <View style={styles.idCardDivider} />
            <View style={styles.idCardStat}>
              <Heart size={14} color="rgba(255,255,255,0.6)" />
              <View>
                <Text style={styles.idCardStatLabel}>SEGURO ACTIVO</Text>
                <Text style={styles.idCardStatValue}>{PACIENTE_DEMO.seguro}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── SECCIÓN: QR DE IDENTIDAD ── */}
        <Text style={styles.sectionTitle}>Código QR de Acceso</Text>
        <View style={styles.qrSection}>
          <Text style={styles.qrInstruction}>
            Muestra este QR al personal médico para concederles acceso temporal a tu historial clínico.
          </Text>

          {/* Contenedor del QR (Placeholder para react-native-qrcode-svg) */}
          <View style={styles.qrBox}>
            <QrCode size={120} color="#0F2B3D" strokeWidth={1} />
          </View>

          {/* Dirección de Wallet Abajo */}
          <TouchableOpacity style={styles.walletRow} activeOpacity={0.7}>
            <Text style={styles.walletText} numberOfLines={1}>
              {PACIENTE_DEMO.walletId}
            </Text>
            <Copy size={16} color="#2D7FF9" />
          </TouchableOpacity>
        </View>

        {/* ── SECCIÓN: HISTORIAL CLÍNICO ── */}
        <View style={styles.historialHeaderContainer}>
          <Text style={styles.sectionTitle}>Registros Clínicos Recientes</Text>
          <TouchableOpacity>
            <Text style={styles.verTodoText}>Ver todo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.historialList}>
          {HISTORIAL_DEMO.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.historialCard, { borderLeftColor: item.colorBorde }]}
              activeOpacity={0.8}
            >
              {/* Encabezado del registro */}
              <View style={[styles.historialItemHeader, { backgroundColor: item.colorFondo }]}>
                <View style={styles.historialTipoWrapper}>
                  {item.icono}
                  <Text style={[styles.historialTipo, { color: item.colorBorde }]}>{item.tipo}</Text>
                </View>
                <Text style={styles.historialFecha}>{item.fecha}</Text>
              </View>

              {/* Cuerpo del registro */}
              <View style={styles.historialBody}>
                <Text style={styles.historialDesc}>{item.descripcion}</Text>
                <View style={styles.medicoRow}>
                  <Stethoscope size={14} color="#64748B" />
                  <Text style={styles.historialMedico}>{item.medico}</Text>
                </View>

                {/* Sello de Blockchain */}
                <View style={styles.historialHashRow}>
                  <Shield size={12} color="#14B8A6" />
                  <Text style={styles.historialHash}> Hash: {item.hash}</Text>
                  <Text style={styles.historialHashLabel}> • Inmutable</Text>
                </View>
              </View>
              
              <ChevronRight size={18} color="#CBD5E1" style={styles.historialArrow} />
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FC' },
  
  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#0F2B3D' },
  headerSubtitle: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  headerShield: {
    marginLeft: 'auto', width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#F0FDF9', alignItems: 'center', justifyContent: 'center',
  },
  
  scroll: { flex: 1 },
  scrollContent: { padding: 20 },
  
  // Tarjeta de Identidad
  idCard: {
    backgroundColor: '#0F2B3D', borderRadius: 24, padding: 24,
    shadowColor: '#0F2B3D', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35, shadowRadius: 20, elevation: 12,
    marginBottom: 24,
  },
  idCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  idCardLogo: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(20,184,166,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  idCardBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(20,184,166,0.15)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(20,184,166,0.3)',
  },
  idCardBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#14B8A6' },
  idCardBadgeText: { fontSize: 9, fontWeight: '800', color: '#14B8A6', letterSpacing: 0.5 },
  idCardNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  idCardName: { fontSize: 28, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.5 },
  idCardCedula: { fontSize: 14, color: '#94A3B8', fontWeight: '500', marginBottom: 24 },
  idCardStats: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  idCardStat: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  idCardDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.1)' },
  idCardStatLabel: { fontSize: 9, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  idCardStatValue: { fontSize: 14, color: '#FFFFFF', fontWeight: '700' },
  
  // Títulos de sección
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  
  // Sección QR
  qrSection: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#F1F5F9',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
    marginBottom: 28,
  },
  qrInstruction: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 20, fontWeight: '500', lineHeight: 18 },
  qrBox: {
    width: 180, height: 180, borderRadius: 20, backgroundColor: '#F8FAFC',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#E2E8F0', marginBottom: 20,
  },
  walletRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EFF6FF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
    width: '100%',
  },
  walletText: { fontSize: 12, color: '#2D7FF9', fontWeight: '600', flex: 1, fontFamily: 'monospace' },
  
  // Historial
  historialHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verTodoText: { fontSize: 13, fontWeight: '600', color: '#2D7FF9', marginBottom: 12 },
  historialList: { gap: 12 },
  historialCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    borderLeftWidth: 4, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  historialItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  historialTipoWrapper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historialTipo: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  historialFecha: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  historialBody: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 12, gap: 6 },
  historialDesc: { fontSize: 15, fontWeight: '800', color: '#0F2B3D' },
  medicoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historialMedico: { fontSize: 13, color: '#64748B', fontWeight: '500' },
  historialHashRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 },
  historialHash: { fontSize: 11, color: '#64748B', fontWeight: '700', fontFamily: 'monospace' },
  historialHashLabel: { fontSize: 11, color: '#14B8A6', fontWeight: '700' },
  historialArrow: { position: 'absolute', right: 16, top: '50%', transform: [{ translateY: -9 }] },
});
