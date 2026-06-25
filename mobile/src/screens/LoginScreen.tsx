import { Text } from '../components/CustomText';
import React, { useEffect, useState, useRef } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, Image, ActivityIndicator, Animated, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as LocalAuthentication from 'expo-local-authentication';
import { Fingerprint } from 'lucide-react-native';
import { loginPatient, DEFAULT_WALLET } from '../services/patientService';
import { Colors } from '../theme/Colors';

const { width } = Dimensions.get('window');

const TEST_ACCOUNTS = [
  { name: 'Luis (O+)', wallet: '0x4e475c495f2b76624321480a7ecec6946168e865' },
  { name: 'David (A+)', wallet: '0x7a25c09c279375323f6f77e8334f50160519282e' },
  { name: 'Maciel (B-)', wallet: '0xfa68127255f0f4216f7083f7f1f31a13485bfffe' }
];

export default function LoginScreen({ navigation }: any) {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();

    // Mount Animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const handleBiometricAuth = async () => {
    try {
      setIsAuthenticating(true);
      const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
      if (!savedBiometrics) {
        alert('Biometría no configurada en este dispositivo.');
        return;
      }
      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquea tu Identidad Médica',
        fallbackLabel: 'Usar PIN',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });
      if (biometricAuth.success) {
        const ok = await loginPatient(DEFAULT_WALLET);
        if (ok) {
          navigation?.replace('MainTabs');
        } else {
          alert('Error al iniciar sesión en Supabase.');
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loginDemo = async (wallet: string, name: string) => {
    setIsAuthenticating(true);
    const ok = await loginPatient(wallet);
    setIsAuthenticating(false);
    if (ok) {
      navigation?.replace('MainTabs');
    } else {
      alert(`Error al iniciar sesión para ${name}`);
    }
  };

  // Gradient definitions based on theme
  const backgroundGradient = isDark 
    ? ['#020C1B', '#0A192F', '#112240'] as const
    : ['#FFFFFF', '#F0F4F8', '#E2E8F0'] as const;

  return (
    <LinearGradient colors={backgroundGradient} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <Animated.View style={[styles.contentWrapper, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            
            {/* ── LOGO SUPERIOR ── */}
            <View style={styles.logoSection}>
              <View style={styles.logoGlow}>
                <Image source={require('../../assets/IconoBolivia.png')} style={styles.logoImage} />
              </View>
            </View>

            {/* ── TEXTOS DE BIENVENIDA ── */}
            <View style={styles.welcomeSection}>
              <Text style={[styles.title, { color: theme.textPrimary }]}>Tu Salud, Segura</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Accede a tu expediente clínico digital encriptado con tecnología blockchain.
              </Text>
            </View>

            {/* ── BOTÓN PRINCIPAL ── */}
            <View style={styles.formSection}>
              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity 
                  activeOpacity={0.9}
                  disabled={isAuthenticating}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  onPress={isBiometricSupported ? handleBiometricAuth : () => loginDemo(DEFAULT_WALLET, 'Mi Identidad')}
                >
                  <LinearGradient
                    colors={['#0062FF', '#004BBB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                  >
                    {isAuthenticating ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Fingerprint size={24} color="#FFFFFF" style={{ marginRight: 12 }} />
                        <Text style={styles.primaryButtonText}>
                          {isBiometricSupported ? 'Desbloquear Identidad' : 'Ingresar al Sistema'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
              
              <Text style={[styles.securityText, { color: theme.textSecondary }]}>
                Protegido con encriptación de grado médico
              </Text>
            </View>

          </Animated.View>

          {/* ── CUENTAS DE SIMULADOR (Accesos de Feria) ── */}
          <Animated.View style={[styles.footerSection, { opacity: fadeAnim }]}>
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Modo Demostración (Feria)
            </Text>
            <View style={styles.demoAccountsRow}>
              {TEST_ACCOUNTS.map((acc, idx) => (
                <TouchableOpacity 
                  key={idx}
                  activeOpacity={0.7}
                  onPress={() => loginDemo(acc.wallet, acc.name)}
                  disabled={isAuthenticating}
                  style={[styles.demoPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,98,255,0.08)' }]}
                >
                  <View style={[styles.demoDot, { backgroundColor: idx === 0 ? '#EF4444' : idx === 1 ? '#3B82F6' : '#10B981' }]} />
                  <Text style={[styles.demoAccountLink, { color: isDark ? '#E2E8F0' : '#0062FF' }]}>{acc.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 40,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
  
  // Logo
  logoSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoGlow: {
    shadowColor: '#0062FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    backgroundColor: 'transparent',
  },
  logoImage: {
    width: 160,
    height: 160,
    resizeMode: 'contain',
  },

  // Bienvenida
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    marginBottom: 16,
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
    opacity: 0.9,
  },

  // Formulario / Botón Principal
  formSection: {
    width: '100%',
    alignItems: 'center',
  },
  primaryButton: {
    flexDirection: 'row',
    width: width - 48,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0062FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  securityText: {
    fontSize: 12,
    marginTop: 20,
    fontWeight: '500',
    opacity: 0.7,
  },

  // Footer (Simulador)
  footerSection: {
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.6,
  },
  demoAccountsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  demoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.15)',
  },
  demoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  demoAccountLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
