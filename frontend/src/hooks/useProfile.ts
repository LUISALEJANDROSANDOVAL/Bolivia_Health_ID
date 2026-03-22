import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProfileData {
  id?: string;
  wallet_address?: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  occupation: string;
  blood_type: string;
  allergies: string;
}

const DEFAULT_PROFILE: ProfileData = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  occupation: '',
  blood_type: '',
  allergies: ''
};

export function useProfile(walletAddress: string | null) {
  const [profile, setProfile] = useState<ProfileData>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProfile() {
      if (!walletAddress) {
        if (mounted) {
          setProfile(DEFAULT_PROFILE);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch base profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw new Error('Error al cargar perfil de usuario');
        }

        // Fetch vitals
        let vitalsData = null;
        if (profileData?.id) {
          const { data: vData, error: vError } = await supabase
            .from('patient_vitals')
            .select('*')
            .eq('patient_id', profileData.id)
            .single();

          if (vError && vError.code !== 'PGRST116') {
             console.error('Error fetching vitals:', vError);
          }
          vitalsData = vData;
        }

        if (mounted) {
          setProfile({
            id: profileData?.id,
            wallet_address: profileData?.wallet_address,
            full_name: profileData?.full_name || '',
            email: profileData?.email || '',
            phone: profileData?.phone || '',
            address: profileData?.address || '',
            occupation: profileData?.occupation || '',
            blood_type: vitalsData?.blood_type || '',
            allergies: vitalsData?.allergies || ''
          });
        }
      } catch (err: any) {
        if (mounted) setError(err.message || 'Error desconocido');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchProfile();

    return () => {
      mounted = false;
    };
  }, [walletAddress]);

  const updateProfile = async (dataToUpdate: Partial<ProfileData>) => {
    if (!profile.id || !walletAddress) throw new Error('Usuario no conectado o sin perfil.');
    
    // Separar datos de profile y vitals
    const profilePayload = {
      full_name: dataToUpdate.full_name,
      email: dataToUpdate.email,
      phone: dataToUpdate.phone,
      address: dataToUpdate.address,
      occupation: dataToUpdate.occupation,
    };

    const vitalsPayload = {
      patient_id: profile.id,
      blood_type: dataToUpdate.blood_type,
      allergies: dataToUpdate.allergies,
      updated_at: new Date().toISOString()
    };

    try {
      // 1. Upsert Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', profile.id);

      if (profileError) throw profileError;

      // 2. Upsert Vitals (upsert porque podría no tener vitals previos)
      const { error: vitalsError } = await supabase
        .from('patient_vitals')
        .upsert(vitalsPayload, { onConflict: 'patient_id' });

      if (vitalsError) throw vitalsError;

      setProfile(prev => ({ ...prev, ...dataToUpdate }));
      return true;
    } catch (err: any) {
      console.error('Error actualizando perfil:', err);
      throw new Error('Fallo al actualizar el perfil en base de datos.');
    }
  };

  return { profile, loading, error, updateProfile };
}
