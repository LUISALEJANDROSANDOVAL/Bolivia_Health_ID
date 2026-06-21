import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const CURRENT_WALLET_KEY = '@current_patient_wallet';
const PATIENT_PROFILE_CACHE_KEY = '@patient_profile_cache';
// Default patient: Luis Alejandro Sandoval Rodriguez
export const DEFAULT_WALLET = '0x4e475c495f2b76624321480a7ecec6946168e865';

export interface PatientProfile {
  id: string;
  wallet_address: string;
  full_name: string;
  cedula_identidad: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  role: string;
}

export interface PatientVitals {
  blood_type: string | null;
  allergies: string | null;
  blood_pressure: string | null;
  weight: string | null;
  height: string | null;
}

export interface PatientData {
  profile: PatientProfile;
  vitals: PatientVitals | null;
}

/**
 * Gets the currently logged-in wallet address.
 * Defaults to DEFAULT_WALLET if none is found.
 */
export async function getActiveWallet(): Promise<string> {
  try {
    const wallet = await AsyncStorage.getItem(CURRENT_WALLET_KEY);
    if (wallet) return wallet;

    // Set default wallet if none is saved
    await AsyncStorage.setItem(CURRENT_WALLET_KEY, DEFAULT_WALLET);
    return DEFAULT_WALLET;
  } catch (error) {
    console.error('Error reading active wallet:', error);
    return DEFAULT_WALLET;
  }
}

/**
 * Saves the active wallet address.
 */
export async function setActiveWallet(wallet: string): Promise<void> {
  try {
    await AsyncStorage.setItem(CURRENT_WALLET_KEY, wallet.toLowerCase());
  } catch (error) {
    console.error('Error saving active wallet:', error);
  }
}

/**
 * Signs in the patient to Supabase Auth using the deterministic credentials.
 */
export async function loginPatient(walletAddress: string): Promise<boolean> {
  try {
    const wallet = walletAddress.toLowerCase();
    const email = `${wallet}@boliviahealth.com`;
    const password = `${wallet}_boliviahealth_secure_2026!`;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.warn(`Sign in failed for ${wallet}, trying to register:`, error.message);
      // Auto-register if not registered
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        console.error('Failed to sign up deterministic user:', signUpError.message);
        return false;
      }

      const { error: secondSignInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (secondSignInError) {
        console.error('Failed second sign in:', secondSignInError.message);
        return false;
      }
    }

    await setActiveWallet(wallet);
    return true;
  } catch (error) {
    console.error('Error in patient login process:', error);
    return false;
  }
}

/**
 * Fetches the patient profile and vitals.
 * Uses AsyncStorage as a cache: saves on success, reads on failure.
 */
export async function getPatientData(walletAddress: string): Promise<PatientData> {
  const wallet = walletAddress.toLowerCase();
  const cacheKey = `${PATIENT_PROFILE_CACHE_KEY}_${wallet}`;

  // Ensure authenticated session
  const { data: { session } } = await supabase.auth.getSession();

  // If not authenticated or authenticated as a different wallet, perform login
  const expectedEmail = `${wallet}@boliviahealth.com`;
  if (!session || session.user?.email !== expectedEmail) {
    console.log(`Authenticating session for ${wallet}...`);
    await loginPatient(wallet);
  }

  // Query Profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', wallet)
    .single();

  if (profileError) {
    // --- FALLBACK: use cached profile if available ---
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        console.warn(`[PatientService] Supabase error, using cached profile for ${wallet}:`, profileError.message);
        return JSON.parse(cached) as PatientData;
      }
    } catch (cacheErr) {
      console.warn('[PatientService] Cache read failed:', cacheErr);
    }
    throw new Error(`Profile not found in database: ${profileError.message}`);
  }

  // Query Vitals
  const { data: vitals, error: vitalsError } = await supabase
    .from('patient_vitals')
    .select('*')
    .eq('patient_id', profile.id)
    .maybeSingle();

  if (vitalsError) {
    console.warn(`[PatientService] Error querying vitals for ${profile.id}:`, vitalsError.message);
  }

  const result: PatientData = {
    profile: profile as PatientProfile,
    vitals: vitals as PatientVitals | null,
  };

  // --- Save successful result to cache ---
  try {
    await AsyncStorage.setItem(cacheKey, JSON.stringify(result));
  } catch (cacheErr) {
    console.warn('[PatientService] Cache write failed:', cacheErr);
  }

  return result;
}

/**
 * Logs out the current patient and clears all local cache.
 */
export async function logoutPatient(): Promise<void> {
  try {
    // Clear the profile cache for the current wallet before signing out
    const wallet = await getActiveWallet();
    if (wallet) {
      await AsyncStorage.removeItem(`${PATIENT_PROFILE_CACHE_KEY}_${wallet.toLowerCase()}`);
    }
    await supabase.auth.signOut();
    await AsyncStorage.removeItem(CURRENT_WALLET_KEY);
  } catch (error) {
    console.error('Error logging out patient:', error);
  }
}
