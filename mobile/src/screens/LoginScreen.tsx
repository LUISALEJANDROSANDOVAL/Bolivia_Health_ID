import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, Fingerprint, Wallet } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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
        alert('¡Autenticado con éxito!');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Círculo decorativo superior */}
      <View style={styles.decorativeCircle} />

      <View style={styles.content}>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Shield size={32} color="#14B8A6" strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>Bolivia Health ID</Text>
          <Text style={styles.subtitle}>
            Tu historial clínico, soberano y protegido criptográficamente.
          </Text>
        </View>

        {/* BIOMETRÍA */}
        <View style={styles.biometricSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleBiometricAuth}
            disabled={isAuthenticating}
            style={styles.biometricTouchable}
          >
            <View style={styles.ringOuter} />
            <View style={styles.ringMiddle} />
            <View style={styles.fingerprintContainer}>
              {isAuthenticating ? (
                <ActivityIndicator size="large" color="#2D7FF9" />
              ) : (
                <Fingerprint size={52} color="#2D7FF9" strokeWidth={1.5} />
              )}
            </View>
          </TouchableOpacity>

          <Text style={styles.scanLabel}>Toca para escanear</Text>
          <Text style={styles.pinFallback}>Usar PIN de respaldo</Text>
        </View>

        {/* BOTONES */}
        <View style={styles.buttonsSection}>
          {/* Botón Google */}
          <TouchableOpacity style={styles.googleButton} activeOpacity={0.7}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

          {/* Botón Web3 */}
          <TouchableOpacity style={styles.web3Button} activeOpacity={0.7}>
            <Wallet size={20} color="#14B8A6" />
            <Text style={styles.web3ButtonText}>  Conectar Billetera Web3</Text>
          </TouchableOpacity>

          {/* Texto legal */}
          <Text style={styles.legalText}>
            Al continuar, aceptas nuestros{' '}
            <Text style={styles.legalLink}>Términos de Servicio</Text> y
            confirmas que has leído nuestra{' '}
            <Text style={styles.legalLink}>Política de Privacidad de Datos Médicos</Text>.
          </Text>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FC',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -128,
    right: -80,
    width: 384,
    height: 384,
    borderRadius: 192,
    backgroundColor: '#2D7FF9',
    opacity: 0.05,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#0F2B3D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F2B3D',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  biometricSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginVertical: 32,
  },
  biometricTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 192,
    height: 192,
  },
  ringOuter: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: '#E8F0FE',
    opacity: 0.5,
  },
  ringMiddle: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#D4E3FD',
    opacity: 0.7,
  },
  fingerprintContainer: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D7FF9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  scanLabel: {
    color: '#2D7FF9',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 32,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  pinFallback: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    textDecorationLine: 'underline',
  },
  buttonsSection: {
    width: '100%',
    gap: 12,
  },
  googleButton: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  googleIcon: {
    fontSize: 20,
    fontWeight: '800',
    color: '#EA4335',
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F2B3D',
  },
  web3Button: {
    width: '100%',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(20, 184, 166, 0.35)',
    marginBottom: 20,
  },
  web3ButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#14B8A6',
  },
  legalText: {
    fontSize: 10,
    textAlign: 'center',
    color: '#94A3B8',
    paddingHorizontal: 16,
    lineHeight: 16,
  },
  legalLink: {
    fontWeight: '700',
    textDecorationLine: 'underline',
    color: '#64748B',
  },
});
