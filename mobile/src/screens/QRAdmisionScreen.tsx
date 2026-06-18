import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Animated,
  Dimensions,
  Share,
} from 'react-native';
import { ArrowLeft, Share2, Download } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

// ── COMPONENTE QR VISUAL (Mock premium) ─────────────────────────────────────
// TODO: Reemplazar con <QRCode value={...} size={260} /> después de:
// npm install react-native-qrcode-svg react-native-svg
const QRCodeMock = ({ size = 240 }: { size?: number }) => {
  const cell = size / 12;
  const pattern = [
    [1,1,1,1,1,1,1,0,1,0,1,1],
    [1,0,0,0,0,0,1,0,0,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1],
    [1,0,1,1,1,0,1,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,1,1,1,0],
    [1,0,0,0,0,0,1,0,0,0,1,1],
    [1,1,1,1,1,1,1,0,1,0,1,0],
    [0,0,0,0,0,0,0,0,1,1,0,1],
    [1,0,1,1,0,1,0,1,1,0,1,0],
    [0,1,0,0,1,0,0,0,0,1,0,1],
    [1,1,0,1,1,0,1,1,1,0,1,1],
    [0,0,1,0,0,1,1,0,1,1,0,1],
  ];

  return (
    <View style={{ width: size, height: size }}>
      {pattern.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: 'row' }}>
          {row.map((cell_val, colIndex) => (
            <View
              key={colIndex}
              style={{
                width: cell,
                height: cell,
                backgroundColor: cell_val === 1 ? '#0F2B3D' : '#FFFFFF',
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
};

export default function QRAdmisionScreen({ route, navigation }: any) {
  const turno = route?.params?.turno ?? 18;
  const hospital = route?.params?.hospital ?? 'Hospital de Clínicas';
  const especialidad = route?.params?.especialidad ?? 'Medicina General';

  const glowAnim = useRef(new Animated.Value(0.5)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  // Animación de entrada y glow
  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.5, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handleCompartir = async () => {
    try {
      await Share.share({
        message: `Bolivia Health ID\nFicha #${turno}\nHospital: ${hospital}\nEspecialidad: ${especialidad}\nFecha: ${new Date().toLocaleDateString('es-BO')}`,
        title: 'Mi Ficha Bolivia Health ID',
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>

      {/* ── HEADER MINIMALISTA ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <ArrowLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Código QR de Admisión</Text>
        <TouchableOpacity style={styles.shareButton} onPress={handleCompartir}>
          <Share2 size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <View style={styles.mainContent}>

        {/* Instrucción */}
        <Text style={styles.instruccion}>
          Muestra este código al llegar al hospital
        </Text>
        <Text style={styles.instruccionSub}>
          El personal escaneará tu QR para confirmar tu turno
        </Text>

        {/* Tarjeta QR Principal */}
        <Animated.View style={[styles.qrCard, { transform: [{ scale: scaleAnim }] }]}>

          {/* Glow animado detrás */}
          <Animated.View style={[styles.qrGlow, { opacity: glowAnim }]} />

          {/* Marco decorativo con esquinas */}
          <View style={styles.qrFrame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />

            {/* El QR */}
            <View style={styles.qrWrapper}>
              <QRCodeMock size={220} />
            </View>
          </View>

          {/* Info del turno debajo del QR */}
          <View style={styles.qrInfo}>
            <View style={styles.qrTurnoRow}>
              <Text style={styles.qrTurnoLabel}>FICHA</Text>
              <Text style={styles.qrTurnoNumero}>#{turno}</Text>
            </View>
            <View style={styles.qrDivider} />
            <Text style={styles.qrHospital}>{hospital}</Text>
            <Text style={styles.qrEspecialidad}>{especialidad}</Text>
          </View>
        </Animated.View>

        {/* Fecha y validez */}
        <View style={styles.validezRow}>
          <View style={styles.validezDot} />
          <Text style={styles.validezText}>
            Válido hoy · {new Date().toLocaleDateString('es-BO', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </Text>
        </View>

      </View>

      {/* ── BOTÓN DE ACCIÓN INFERIOR ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.btnCompartir} onPress={handleCompartir} activeOpacity={0.85}>
          <Share2 size={18} color="#2D7FF9" />
          <Text style={styles.btnCompartirText}>  Compartir ficha</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F2B3D' },

  // Header oscuro
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  backButton: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  shareButton: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Contenido
  mainContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  instruccion: {
    fontSize: 20, fontWeight: '800', color: '#FFFFFF',
    textAlign: 'center', marginBottom: 6,
  },
  instruccionSub: {
    fontSize: 14, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', marginBottom: 36,
  },

  // Tarjeta QR
  qrCard: { alignItems: 'center', position: 'relative' },
  qrGlow: {
    position: 'absolute',
    width: 280, height: 280,
    borderRadius: 140,
    backgroundColor: '#2D7FF9',
    top: -20,
    shadowColor: '#2D7FF9',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 60,
    elevation: 20,
  },
  qrFrame: {
    backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4, shadowRadius: 24, elevation: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute', width: 20, height: 20,
    borderColor: '#2D7FF9', borderWidth: 3,
  },
  cornerTL: { top: -2, left: -2, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cornerTR: { top: -2, right: -2, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cornerBL: { bottom: -2, left: -2, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: -2, right: -2, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  qrWrapper: { borderRadius: 8, overflow: 'hidden' },

  // Info debajo del QR
  qrInfo: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    paddingHorizontal: 28, paddingVertical: 16,
    marginTop: 12, alignItems: 'center', width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 6,
  },
  qrTurnoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qrTurnoLabel: {
    fontSize: 11, fontWeight: '800', color: '#94A3B8',
    letterSpacing: 2, textTransform: 'uppercase',
  },
  qrTurnoNumero: { fontSize: 36, fontWeight: '900', color: '#0F2B3D' },
  qrDivider: { width: '80%', height: 1, backgroundColor: '#F1F5F9', marginVertical: 8 },
  qrHospital: { fontSize: 14, fontWeight: '700', color: '#0F2B3D', textAlign: 'center' },
  qrEspecialidad: { fontSize: 12, color: '#64748B', fontWeight: '500', marginTop: 2 },

  // Validez
  validezRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24,
  },
  validezDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  validezText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // Bottom
  bottomBar: {
    padding: 20, paddingBottom: 32,
  },
  btnCompartir: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 16, paddingVertical: 16,
  },
  btnCompartirText: { fontSize: 15, fontWeight: '700', color: '#2D7FF9' },
});
