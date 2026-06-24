import { Text } from '../components/CustomText';
import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, useColorScheme, Platform, ActivityIndicator } from 'react-native';

import {
  ArrowLeft,
  Copy,
  Activity,
  Droplets,
  Shield,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../theme/Colors';
import { getActiveWallet, getPatientData, PatientData } from '../services/patientService';

const { width } = Dimensions.get('window');

export default function HealthIDScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<PatientData | null>(null);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    const loadData = async () => {
      try {
        const wallet = await getActiveWallet();
        const data = await getPatientData(wallet);
        setPatientData(data);
      } catch (error) {
        console.error('Error loading patient data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCopyWallet = async () => {
    if (patientData?.profile.wallet_address) {
      await Clipboard.setStringAsync(patientData.profile.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), backgroundColor: theme.background }]}>
      {/* ── HEADER ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Mi Identidad Médica</Text>
        <View style={{ width: 44 }} /> {/* Spacer */}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2D7FF9" />
          <Text style={{ marginTop: 10, color: theme.textSecondary }}>Cargando Identidad...</Text>
        </View>
      ) : !patientData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>No se pudo cargar la información del paciente.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── TARJETA DIGITAL (APPLE WALLET STYLE) ── */}
        <View style={[styles.cardWrapper, isDark && { shadowColor: '#000', shadowOpacity: 0.5, elevation: 15 }]}>
          <LinearGradient
            colors={isDark ? ['#081720', '#0D2A6E', '#1C4A9E'] : ['#0F2B3D', '#1E40AF', '#2D7FF9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.idCard}
          >
            {/* Header Tarjeta */}
            <View style={styles.cardHeader}>
              <View style={styles.logoContainer}>
                <Shield size={20} color="#FFFFFF" />
                <Text style={styles.logoText}>Bolivia Health ID</Text>
              </View>
              <View style={styles.bloodTypeBadge}>
                <Droplets size={14} color="#EF4444" fill="#EF4444" />
                <Text style={styles.bloodTypeText}>{patientData.vitals?.blood_type || 'N/D'}</Text>
              </View>
            </View>

            {/* Cuerpo Tarjeta */}
            <View style={styles.cardBody}>
              <View style={styles.cardInfo}>
                <Text style={styles.cardLabel}>PACIENTE</Text>
                <Text style={styles.cardName}>{patientData.profile.full_name}</Text>

                <Text style={[styles.cardLabel, { marginTop: 15 }]}>CÉDULA DE IDENTIDAD</Text>
                <Text style={styles.cardData}>{patientData.profile.cedula_identidad || 'N/D'}</Text>

                <Text style={[styles.cardLabel, { marginTop: 15 }]}>SEGURO MÉDICO</Text>
                <Text style={styles.cardData}>Sin Seguro Registrado</Text>
              </View>

              <View style={styles.avatarContainer}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&auto=format&fit=crop' }} style={styles.avatarImage} />
              </View>
            </View>

            {/* Footer Tarjeta (Wallet) */}
            <View style={styles.cardFooter}>
              <View>
                <Text style={styles.walletLabel}>Blockchain Wallet ID</Text>
                <Text style={styles.walletIdText}>
                  {patientData.profile.wallet_address.substring(0, 6)}...{patientData.profile.wallet_address.substring(patientData.profile.wallet_address.length - 4)}
                </Text>
              </View>
              <TouchableOpacity style={styles.copyButton} onPress={handleCopyWallet}>
                <Copy size={16} color="#FFFFFF" />
                {copied && <Text style={styles.copiedPopup}>¡Copiado!</Text>}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* ── CÓDIGO QR DE EMERGENCIA ── */}
        <View style={[styles.qrContainer, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
          <Text style={[styles.qrTitle, { color: theme.textPrimary }]}>Acceso Rápido para Emergencias</Text>
          <Text style={[styles.qrSubtitle, { color: theme.textSecondary }]}>Muestra este código al personal médico para que accedan a tus signos vitales y tipo de sangre.</Text>

          <View style={[styles.qrBox, { backgroundColor: '#FFFFFF', borderColor: theme.border }]}>
            {/* El código QR siempre es blanco de fondo para que funcione */}
            <Image
              source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=HealthID_${patientData.profile.wallet_address}` }}
              style={styles.qrImage}
            />
            <View style={styles.scanLine} />
          </View>
        </View>

        {/* ── ALERGIAS Y CONDICIONES (PILLS) ── */}
        <View style={[styles.medicalAlertsContainer, { backgroundColor: theme.surface, borderColor: theme.border, borderWidth: 1 }]}>
          <View style={styles.alertHeader}>
            <Activity size={20} color="#EF4444" />
            <Text style={[styles.alertTitle, { color: theme.textPrimary }]}>Alertas Médicas</Text>
          </View>

          <View style={styles.pillsWrapper}>
            {patientData.vitals?.allergies ? (
              patientData.vitals.allergies.split(',').map((alergia, index) => (
                <View key={index} style={[styles.pillDanger, isDark && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                  <Text style={[styles.pillDangerText, isDark && { color: '#FCA5A5' }]}>Alergia: {alergia.trim()}</Text>
                </View>
              ))
            ) : (
              <Text style={{ color: theme.textSecondary, fontSize: 13 }}>No hay alergias registradas.</Text>
            )}
            
            {patientData.vitals?.blood_pressure && (
              <View style={[styles.pillWarning, isDark && { backgroundColor: 'rgba(234, 88, 12, 0.15)', borderColor: 'rgba(234, 88, 12, 0.3)' }]}>
                <Text style={[styles.pillWarningText, isDark && { color: '#FDBA74' }]}>Presión: {patientData.vitals.blood_pressure}</Text>
              </View>
            )}
          </View>
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
    alignItems: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },

  // Tarjeta
  cardWrapper: {
    shadowColor: '#2D7FF9',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 30,
  },
  idCard: {
    width: '100%',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bloodTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  bloodTypeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardData: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 15,
  },
  walletLabel: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  walletIdText: {
    fontSize: 12,
    color: '#93C5FD',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  copiedPopup: {
    position: 'absolute',
    top: -25,
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },

  // QR Section
  qrContainer: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  qrSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  qrBox: {
    width: 200,
    height: 200,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#2D7FF9',
    shadowColor: '#2D7FF9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },

  // Alertas Médicas
  medicalAlertsContainer: {
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  pillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pillDanger: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pillDangerText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '700',
  },
  pillWarning: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pillWarningText: {
    color: '#EA580C',
    fontSize: 13,
    fontWeight: '700',
  },
});
