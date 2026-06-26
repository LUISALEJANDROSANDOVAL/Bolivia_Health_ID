import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, Calendar, Settings } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../theme/Colors';

// ── SCREENS ──────────────────────────────────────────────────────────────────
import LoginScreen from '../screens/LoginScreen';
import SplashScreen from '../screens/SplashScreen';
import HomeScreen from '../screens/HomeScreen';
import SolicitarFichaScreen from '../screens/SolicitarFichaScreen';
import DoctorProfileScreen from '../screens/DoctorProfileScreen';
import MisCitasScreen from '../screens/MisCitasScreen';
import FichaActivaScreen from '../screens/FichaActivaScreen';
import HealthIDScreen from '../screens/HealthIDScreen';
import HistorialScreen from '../screens/HistorialScreen';
import PermisosScreen from '../screens/PermisosScreen';
import ConfiguracionScreen from '../screens/ConfiguracionScreen';

// ── TIPOS ────────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  MainTabs: undefined; // El contenedor de las pestañas
  SolicitarFicha: undefined;
  DoctorProfile: {
    doctor: any;
  };
  FichaActiva: {
    hospital: any;
    especialidad: any;
  };
  Permisos: undefined;
  Historial: undefined;
  Configuracion: undefined;
};

export type TabParamList = {
  Home: undefined;
  MisCitas: undefined;
  Configuracion: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// ── TAB NAVIGATOR (Global Bottom Bar) ───────────────────────────────────────
function MainTabNavigator() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopWidth: 1,
          borderTopColor: theme.border,
          height: 65, // Un poco más alto para dar respiro
          paddingBottom: 10,
          paddingTop: 10,
          elevation: 20, // Sombra para Android
          shadowColor: '#000', // Sombra para iOS
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: isDark ? 0.2 : 0.05,
          shadowRadius: 10,
        },
        tabBarActiveTintColor: theme.tabBarActive,
        tabBarInactiveTintColor: theme.tabBarInactive,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color, size }) => <Home color={color} size={24} />
        }}
      />
      <Tab.Screen 
        name="MisCitas" 
        component={MisCitasScreen} 
        options={{
          tabBarLabel: 'Mis Citas',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={24} />
        }}
      />
      <Tab.Screen 
        name="Configuracion" 
        component={ConfiguracionScreen} 
        options={{
          tabBarLabel: 'Ajustes',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={24} />
        }}
      />
    </Tab.Navigator>
  );
}

// ── ROOT STACK NAVIGATOR ─────────────────────────────────────────────────────
export default function AppNavigator() {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        {/* Pantalla Inicial (Autenticación) */}
        <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'fade' }} />

        {/* Las 4 pantallas principales con su barra inferior global */}
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />

        {/* ── PANTALLAS PROFUNDAS (Sin barra inferior) ── */}
        <Stack.Screen
          name="SolicitarFicha"
          component={SolicitarFichaScreen}
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen name="DoctorProfile" component={DoctorProfileScreen} />
        <Stack.Screen name="FichaActiva" component={FichaActivaScreen} />
        <Stack.Screen name="Permisos" component={PermisosScreen} />
        <Stack.Screen name="Historial" component={HistorialScreen} />
        <Stack.Screen name="Configuracion" component={ConfiguracionScreen} options={{ animation: 'slide_from_right' }} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
