import { Text } from '../components/CustomText';
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Image, Dimensions, useColorScheme, Platform, ActivityIndicator, Animated, Easing } from 'react-native';

import {
  ArrowLeft,
  Copy,
  Activity,
  Droplets,
  Shield,
  HeartPulse,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '../theme/Colors';
import { getActiveWallet, getPatientData, PatientData } from '../services/patientService';

const { width } = Dimensions.get('window');

const AnimatedCard = ({ children, delay }: { children: React.ReactNode, delay: number }) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: 1,
      tension: 50,
      friction: 8,
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
          outputRange: [40, 0]
        })
      }]
    }}>
      {children}
    </Animated.View>
  );
};

export default function HealthIDScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [patientData, setPatientData] = useState<PatientData | null>(null);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const scanLineAnim = useRef(new Animated.Value(0)).current;

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

    // Animación Láser más suave
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 180, 
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleCopyWallet = async () => {
    if (patientData?.profile.wallet_address) {
      await Clipboard.setStringAsync(patientData.profile.wallet_address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'ID';
    const parts = name.trim().split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), backgroundColor: theme.background }]}>
      {/* ── HEADER LIMPIO ── */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={22} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Mi Identidad Médica</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#2D7FF9" />
          <Text style={{ marginTop: 16, color: theme.textSecondary, fontWeight: '600' }}>Cargando Identidad Digital...</Text>
        </View>
      ) : !patientData ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: theme.textSecondary, textAlign: 'center' }}>No se pudo cargar la información del paciente.</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* ── TARJETA DIGITAL (APPLE WALLET STYLE PREMIUM) ── */}
          <AnimatedCard delay={100}>
            <View style={[styles.cardWrapper, { shadowColor: isDark ? '#3B82F6' : '#1E40AF' }]}>
              <LinearGradient
                colors={isDark ? ['#0F172A', '#1E3A8A', '#3B82F6'] : ['#0F2B3D', '#1E40AF', '#3B82F6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.idCard}
              >
                {/* Overlay abstracto sutil */}
                <View style={styles.cardGlowOverlay} />

                {/* Header Tarjeta */}
                <View style={styles.cardHeader}>
                  <View style={styles.logoContainer}>
                    <Image source={require('../../assets/IconoBolivia.png')} style={{ width: 110, height: 35, resizeMode: 'contain' }} />
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
  
                    <Text style={[styles.cardLabel, { marginTop: 20 }]}>CÉDULA DE IDENTIDAD</Text>
                    <Text style={styles.cardData}>{patientData.profile.cedula_identidad || 'N/D'}</Text>
  
                    <Text style={[styles.cardLabel, { marginTop: 20 }]}>SEGURO MÉDICO</Text>
                    <Text style={styles.cardData}>Sin Seguro Registrado</Text>
                  </View>
  
                  {/* Smart Avatar */}
                  <View style={styles.avatarContainer}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.05)']}
                      style={styles.avatarPlaceholder}
                    >
                      <Text style={styles.avatarInitials}>{getInitials(patientData.profile.full_name)}</Text>
                    </LinearGradient>
                  </View>
                </View>
  
                {/* Footer Tarjeta (Wallet) */}
                <View style={styles.cardFooter}>
                  <View>
                    <Text style={styles.walletLabel}>Blockchain Wallet ID</Text>
                    <Text style={styles.walletIdText}>
                      {patientData.profile.wallet_address.substring(0, 8)}...{patientData.profile.wallet_address.substring(patientData.profile.wallet_address.length - 6)}
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.copyButton} onPress={handleCopyWallet} activeOpacity={0.7}>
                    <Copy size={16} color="#FFFFFF" />
                    {copied && <Text style={styles.copiedPopup}>¡Copiado!</Text>}
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </AnimatedCard>
  
          {/* ── CÓDIGO QR DE EMERGENCIA (GLASSMORPHISM) ── */}
          <AnimatedCard delay={200}>
            <View style={[styles.qrContainer, { backgroundColor: theme.surface, borderColor: theme.border }, isDark && styles.glassCardDark]}>
              <Text style={[styles.qrTitle, { color: theme.textPrimary }]}>Acceso Rápido para Emergencias</Text>
              <Text style={[styles.qrSubtitle, { color: theme.textSecondary }]}>
                Muestra este código al personal paramédico para que accedan a tus signos vitales y tipo de sangre en segundos.
              </Text>
  
              <View style={styles.qrBoxWrapper}>
                <LinearGradient
                  colors={isDark ? ['rgba(59,130,246,0.3)', 'transparent'] : ['rgba(37,99,235,0.1)', 'transparent']}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={[styles.qrBox, { borderColor: isDark ? 'rgba(59,130,246,0.5)' : '#3B82F6' }]}>
                  <Image
                    source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=HealthID_${patientData.profile.wallet_address}` }}
                    style={styles.qrImage}
                  />
                  <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineAnim }] }]} />
                </View>
              </View>
            </View>
          </AnimatedCard>
  
          {/* ── ALERGIAS Y CONDICIONES (GLASSMORPHISM PILLS) ── */}
          <AnimatedCard delay={300}>
            <View style={[styles.medicalAlertsContainer, { backgroundColor: theme.surface, borderColor: theme.border }, isDark && styles.glassCardDark]}>
              <View style={styles.alertHeader}>
                <View style={styles.alertIconBox}>
                  <HeartPulse size={20} color="#EF4444" />
                </View>
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
                  <Text style={{ color: theme.textSecondary, fontSize: 13, fontWeight: '500' }}>No hay alergias registradas.</Text>
                )}
                
                {patientData.vitals?.blood_pressure ? (
                  <View style={[styles.pillWarning, isDark && { backgroundColor: 'rgba(234, 88, 12, 0.15)', borderColor: 'rgba(234, 88, 12, 0.3)' }]}>
                    <Text style={[styles.pillWarningText, isDark && { color: '#FDBA74' }]}>Presión: {patientData.vitals.blood_pressure}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </AnimatedCard>
  
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 5, elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  
  glassCardDark: { backgroundColor: 'rgba(30, 41, 59, 0.5)', borderColor: 'rgba(255, 255, 255, 0.05)' },

  // Tarjeta Apple Wallet Premium
  cardWrapper: {
    marginBottom: 24,
    borderRadius: 24,
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 20,
  },
  idCard: {
    borderRadius: 24,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  cardGlowOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
    zIndex: 2,
  },
  logoContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  bloodTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  bloodTypeText: {
    color: '#FCA5A5',
    fontWeight: '800',
    fontSize: 14,
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
    zIndex: 2,
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  cardName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardData: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  avatarContainer: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  avatarPlaceholder: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarInitials: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginHorizontal: -24,
    marginBottom: -24,
    paddingHorizontal: 24,
    paddingVertical: 18,
    zIndex: 2,
  },
  walletLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  walletIdText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  copyButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 12,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  copiedPopup: {
    position: 'absolute',
    top: -30,
    right: -10,
    backgroundColor: '#10B981',
    color: '#FFF',
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
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
  },
  qrSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  qrBoxWrapper: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  qrBox: {
    width: 200,
    height: 200,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderRadius: 8,
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 3,
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },

  // Alertas
  medicalAlertsContainer: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  alertIconBox: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  pillsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pillDanger: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  pillDangerText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '800',
  },
  pillWarning: {
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  pillWarningText: {
    color: '#C2410C',
    fontSize: 13,
    fontWeight: '800',
  },
});
