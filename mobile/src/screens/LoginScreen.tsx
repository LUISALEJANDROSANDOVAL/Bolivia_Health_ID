import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Shield, Fingerprint, Wallet } from 'lucide-react-native';

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
        return alert('Biometría no configurada en este dispositivo.');
      }

      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquea tu Identidad Médica',
        fallbackLabel: 'Usar PIN',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
      });

      if (biometricAuth.success) {
        alert('¡Autenticado con éxito!');
        // Aquí iría la redirección al Dashboard
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F4F7FC]">
      {/* Círculo de profundidad decorativo superior */}
      <View className="absolute -top-32 -right-20 w-96 h-96 bg-[#2D7FF9] rounded-full opacity-5 blur-3xl" />

      <View className="flex-1 px-6 pt-16 pb-10 justify-between">
        
        {/* HEADER: Logo y Título */}
        <View className="items-center mt-8">
          <View className="w-16 h-16 rounded-2xl bg-[#0F2B3D] items-center justify-center shadow-lg mb-6">
            <Shield size={32} color="#14B8A6" strokeWidth={2.5} />
          </View>
          <Text className="text-3xl font-extrabold text-[#0F2B3D] tracking-tight text-center">
            Bolivia Health ID
          </Text>
          <Text className="text-base text-[#64748B] mt-3 text-center px-4 font-medium">
            Tu historial clínico, soberano y protegido criptográficamente.
          </Text>
        </View>

        {/* CENTRO: Biometría Premium */}
        <View className="items-center justify-center flex-1 my-10">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={handleBiometricAuth}
            disabled={isAuthenticating}
            className="items-center justify-center"
          >
            {/* Anillos concéntricos simulando radar/escaner */}
            <View className="w-48 h-48 rounded-full bg-[#E8F0FE] items-center justify-center absolute opacity-50" />
            <View className="w-40 h-40 rounded-full bg-[#D4E3FD] items-center justify-center absolute opacity-70" />
            
            <View className="w-28 h-28 rounded-full bg-white items-center justify-center shadow-xl border border-blue-50/50">
              {isAuthenticating ? (
                <ActivityIndicator size="large" color="#2D7FF9" />
              ) : (
                <Fingerprint size={52} color="#2D7FF9" strokeWidth={1.5} />
              )}
            </View>
          </TouchableOpacity>

          <Text className="text-[#2D7FF9] text-sm font-semibold mt-8 text-center uppercase tracking-widest">
            Toca para escanear
          </Text>
          <Text className="text-[#94A3B8] text-xs font-medium mt-2 text-center underline">
            Usar PIN de respaldo
          </Text>
        </View>

        {/* BOTTOM: Botones de Acción y Legales */}
        <View className="w-full space-y-4">
          
          {/* Botón Principal: Social Login */}
          <TouchableOpacity 
            className="w-full bg-white flex-row items-center justify-center py-4 rounded-2xl shadow-sm border border-gray-100 mb-3"
            activeOpacity={0.7}
          >
            {/* Icono de Google simulado con Lucide para no requerir SVGs externos ahora */}
            <Text className="text-xl font-bold text-[#EA4335] mr-3">G</Text>
            <Text className="text-lg font-bold text-[#0F2B3D]">
              Continuar con Google
            </Text>
          </TouchableOpacity>

          {/* Botón Secundario: Web3 */}
          <TouchableOpacity 
            className="w-full bg-transparent flex-row items-center justify-center py-4 rounded-2xl border-2 border-[#14B8A6]/30 mb-6"
            activeOpacity={0.7}
          >
            <Wallet size={20} color="#14B8A6" className="mr-3" />
            <Text className="text-lg font-bold text-[#14B8A6]">
              Conectar Billetera Web3
            </Text>
          </TouchableOpacity>

          {/* Textos Legales (HIPAA/Privacidad) */}
          <Text className="text-[10px] text-center text-[#94A3B8] px-4 leading-tight">
            Al continuar, aceptas nuestros <Text className="font-bold underline text-[#64748B]">Términos de Servicio</Text> y confirmas que has leído nuestra <Text className="font-bold underline text-[#64748B]">Política de Privacidad de Datos Médicos</Text>.
          </Text>

        </View>
      </View>
    </SafeAreaView>
  );
}
