import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// ── PANTALLAS EXISTENTES ─────────────────────────────────────────────────────
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import SolicitarFichaScreen from '../screens/SolicitarFichaScreen';
import FichaActivaScreen from '../screens/FichaActivaScreen';
import QRAdmisionScreen from '../screens/QRAdmisionScreen';

// ── PANTALLAS PENDIENTES (se agregarán conforme se desarrollen) ───────────────
import HealthIDScreen from '../screens/HealthIDScreen';
import HistorialScreen from '../screens/HistorialScreen';
import PermisosScreen from '../screens/PermisosScreen';

// ── TIPOS DE RUTAS ────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  SolicitarFicha: undefined;
  FichaActiva: {
    hospital: { id: number; nombre: string; ciudad: string; tiempo: string };
    especialidad: { id: number; nombre: string; icono: string };
  };
  QRAdmision: {
    turno: number;
    hospital: string;
    especialidad: string;
  };
  // Próximas pantallas:
  HealthID: undefined;
  Historial: undefined;
  Permisos: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,        // Cada pantalla maneja su propio header
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: '#F4F7FC' },
        }}
      >
        {/* ── AUTENTICACIÓN ── */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* ── PANTALLA PRINCIPAL ── */}
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* ── FLUJO DE FICHAS (3 pasos) ── */}
        <Stack.Screen
          name="SolicitarFicha"
          component={SolicitarFichaScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="FichaActiva" component={FichaActivaScreen} />
        <Stack.Screen
          name="QRAdmision"
          component={QRAdmisionScreen}
          options={{ animation: 'slide_from_bottom' }}
        />

        {/* ── PRÓXIMAS PANTALLAS (descomentar cuando estén listas) ── */}
        <Stack.Screen name="HealthID" component={HealthIDScreen} />
        <Stack.Screen name="Historial" component={HistorialScreen} />
        <Stack.Screen name="Permisos" component={PermisosScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
