import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  Animated,
  useColorScheme,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { Text } from '../components/CustomText';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Activity,
  Shield,
  Link as LinkIcon,
  ChevronLeft,
  Save,
  LogOut,
  Copy,
  CheckCircle2
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { Colors } from '../theme/Colors';
import {
  getActiveWallet,
  getPatientData,
  updatePatientData,
  logoutPatient,
  PatientProfile,
  PatientVitals
} from '../services/patientService';

export default function ConfiguracionScreen({ navigation }: any) {
  const isDark = useColorScheme() === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [wallet, setWallet] = useState('');
  const [profile, setProfile] = useState<Partial<PatientProfile>>({});
  const [vitals, setVitals] = useState<Partial<PatientVitals>>({});

  // Local preferences
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);


  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const activeWallet = await getActiveWallet();
      setWallet(activeWallet);
      const data = await getPatientData(activeWallet);
      setProfile(data.profile);
      setVitals(data.vitals || { blood_type: '', allergies: '' });
    } catch (error) {
      console.error('Error loading config data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSaving(true);
      
      const success = await updatePatientData(wallet, profile, vitals);
      
      setSaving(false);
      if (success) {
        Toast.show({ type: 'success', text1: 'Éxito', text2: 'Cambios guardados correctamente' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Toast.show({ type: 'error', text1: 'Error', text2: 'Hubo un problema al guardar los cambios' });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error: any) {
      setSaving(false);
      Toast.show({ type: 'error', text1: 'Error crítico', text2: error.message });
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Cerrar Identidad Médica',
      '¿Estás seguro de que deseas cerrar sesión? Tu identidad se eliminará de este dispositivo.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await logoutPatient();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ]
    );
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(wallet);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Toast.show({ type: 'success', text1: 'Copiado', text2: 'Dirección copiada al portapapeles' });
  };



  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ChevronLeft size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Configuración</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveButton}>
          {saving ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Save size={24} color={theme.primary} />
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          
          {/* Section 1: Mi Perfil */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <User size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Mi Perfil</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Cédula de Identidad (Solo lectura)</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.textSecondary }]}
                  value={profile.cedula_identidad || ''}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Teléfono</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  value={profile.phone || ''}
                  onChangeText={(text) => setProfile({ ...profile, phone: text })}
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.textSecondary}
                  placeholder="Tu número de teléfono"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Dirección</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  value={profile.address || ''}
                  onChangeText={(text) => setProfile({ ...profile, address: text })}
                  placeholderTextColor={theme.textSecondary}
                  placeholder="Tu dirección"
                />
              </View>
            </View>
          </View>

          {/* Section 2: Datos Clínicos */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                <Activity size={20} color="#EF4444" />
              </View>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Datos Clínicos</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Tipo de Sangre</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary }]}
                  value={vitals.blood_type || ''}
                  onChangeText={(text) => setVitals({ ...vitals, blood_type: text })}
                  placeholderTextColor={theme.textSecondary}
                  placeholder="Ej. O+"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Alergias</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.background, borderColor: theme.border, height: 80 }]}>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, height: '100%', textAlignVertical: 'top' }]}
                  value={vitals.allergies || ''}
                  onChangeText={(text) => setVitals({ ...vitals, allergies: text })}
                  multiline
                  placeholderTextColor={theme.textSecondary}
                  placeholder="Lista tus alergias..."
                />
              </View>
            </View>
          </View>

          {/* Section 3: Seguridad y Preferencias */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Shield size={20} color="#10B981" />
              </View>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Seguridad y Preferencias</Text>
            </View>

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.textPrimary }]}>Autenticación FaceID / Huella</Text>
              <Switch
                value={faceIdEnabled}
                onValueChange={(val) => {
                  setFaceIdEnabled(val);
                  Haptics.selectionAsync();
                }}
                trackColor={{ false: '#767577', true: '#3B82F6' }}
              />
            </View>
            
            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: theme.textPrimary }]}>Notificaciones Push</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={(val) => {
                  setNotificationsEnabled(val);
                  Haptics.selectionAsync();
                }}
                trackColor={{ false: '#767577', true: '#3B82F6' }}
              />
            </View>
          </View>

          {/* Section 4: Blockchain e Información */}
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <LinkIcon size={20} color="#8B5CF6" />
              </View>
              <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Blockchain e Información</Text>
            </View>

            <Text style={[styles.label, { color: theme.textSecondary, marginBottom: 8 }]}>Dirección de la Wallet</Text>
            <TouchableOpacity style={[styles.walletContainer, { backgroundColor: theme.background, borderColor: theme.border }]} onPress={copyToClipboard}>
              <Text style={[styles.walletText, { color: theme.textPrimary }]} numberOfLines={1} ellipsizeMode="middle">
                {wallet}
              </Text>
              <Copy size={16} color={theme.textSecondary} />
            </TouchableOpacity>

            <View style={styles.networkInfoRow}>
              <View style={styles.networkDot} />
              <Text style={[styles.networkText, { color: theme.textSecondary }]}>Avalanche Fuji Testnet</Text>
            </View>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.logoutText}>Cerrar Identidad Médica</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  walletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  walletText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  networkInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981', // Green for active network
  },
  networkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 10,
    gap: 10,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  }
});
