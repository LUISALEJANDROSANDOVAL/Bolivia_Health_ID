import { Text } from '../components/CustomText';
import React, { useEffect, useState } from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator, SafeAreaView, useColorScheme } from 'react-native';

import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, Fingerprint, Wallet, Mail } from 'lucide-react-native';
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

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
    })();
  }, []);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* ── LOGO SUPERIOR ── */}
        <View style={styles.logoSection}>
          <Shield size={64} color="#2D7FF9" strokeWidth={2} />
          <Text style={styles.logoText}>Bolivia Health ID</Text>
        </View>

        {/* ── TEXTOS DE BIENVENIDA ── */}
        <View style={styles.welcomeSection}>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Bienvenido de nuevo</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Comienza una mejor experiencia accediendo a tu expediente clínico seguro
          </Text>
        </View>

        {/* ── SECCIÓN DE ACCESOS (Adaptado a nuestros métodos en lugar de inputs) ── */}
        <View style={styles.formSection}>
          
          {/* Botón Google (Estilo input / contorno) */}
          <TouchableOpacity 
            style={[styles.outlineButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
            activeOpacity={0.6}
            disabled={isAuthenticating}
            onPress={() => loginDemo(DEFAULT_WALLET, 'Google')}
          >
            <View style={styles.iconCircle}>
              <Text style={styles.googleG}>G</Text>
            </View>
            <Text style={[styles.outlineButtonText, { color: theme.textPrimary }]}>Continuar con Google</Text>
          </TouchableOpacity>

          {/* Botón Email Tradicional (Simulado para que se vea como la imagen) */}
          <TouchableOpacity 
            style={[styles.outlineButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
            activeOpacity={0.6}
            disabled={isAuthenticating}
          >
            <Mail size={20} color={theme.textSecondary} style={{ marginLeft: 6, marginRight: 14 }} />
            <Text style={[styles.outlineButtonText, { color: theme.textSecondary, fontWeight: '400' }]}>Ingresar con Email</Text>
          </TouchableOpacity>

          {/* Enlace "Olvidaste tu contraseña?" simulado en rojo */}
          <View style={styles.forgotPasswordContainer}>
            <TouchableOpacity>
              <Text style={styles.forgotPasswordText}>¿Problemas para ingresar?</Text>
            </TouchableOpacity>
          </View>

          {/* BOTÓN PRINCIPAL AZUL (Como el "Sign in" de la imagen) */}
          <TouchableOpacity 
            style={styles.primaryButton}
            activeOpacity={0.8}
            disabled={isAuthenticating}
            onPress={isBiometricSupported ? handleBiometricAuth : () => loginDemo(DEFAULT_WALLET, 'Mi Identidad')}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isBiometricSupported ? 'Ingresar Seguro (FaceID)' : 'Ingresar'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* ── CUENTAS DE SIMULADOR (En lugar de "Create Account") ── */}
        <View style={styles.footerSection}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            ¿Simular otros pacientes?
          </Text>
          <View style={styles.demoAccountsRow}>
            {TEST_ACCOUNTS.map((acc, idx) => (
              <TouchableOpacity 
                key={idx}
                onPress={() => loginDemo(acc.wallet, acc.name)}
                disabled={isAuthenticating}
              >
                <Text style={styles.demoAccountLink}>{acc.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  
  // Logo superior
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2D7FF9',
    marginTop: 12,
    letterSpacing: -0.5,
  },

  // Bienvenida
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },

  // Formulario / Botones
  formSection: {
    width: '100%',
    marginBottom: 30,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  iconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginLeft: 4,
  },
  googleG: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '900',
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: '#EF4444', // Rojo como en la imagen ("Forgot your password?")
    fontSize: 13,
    fontWeight: '700',
  },

  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#0062FF', // Azul fuerte similar a la imagen
    borderRadius: 28, // Muy redondeado como en la imagen
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0062FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  // Footer (Simulador)
  footerSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    marginBottom: 12,
  },
  demoAccountsRow: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  demoAccountLink: {
    color: '#0062FF', // Azul
    fontSize: 14,
    fontWeight: '700',
  },
});
