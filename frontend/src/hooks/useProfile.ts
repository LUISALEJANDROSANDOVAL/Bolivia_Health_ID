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
  cedula_identidad: string;
}

const DEFAULT_PROFILE: ProfileData = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  occupation: '',
  blood_type: '',
  allergies: '',
  cedula_identidad: ''
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
            cedula_identidad: profileData?.cedula_identidad || '',
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
    if (!walletAddress) throw new Error('Conecta tu wallet para guardar cambios.');
    
    // Si no tenemos ID (perfil nuevo), buscamos de nuevo por si acaso se creó en el background
    let currentProfileId = profile.id;
    if (!currentProfileId) {
       const { data: existing } = await supabase
         .from('profiles')
         .select('id')
         .eq('wallet_address', walletAddress.toLowerCase())
         .single();
       if (existing) currentProfileId = existing.id;
    }

    if (!currentProfileId) {
      // Crear perfil directamente — id se auto-genera con gen_random_uuid()
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert([{ 
          wallet_address: walletAddress.toLowerCase(),
          full_name: dataToUpdate.full_name || `Paciente ${walletAddress.slice(0,6)}`,
          email: dataToUpdate.email || '',
          phone: dataToUpdate.phone || '',
          address: dataToUpdate.address || '',
          occupation: dataToUpdate.occupation || '',
          cedula_identidad: dataToUpdate.cedula_identidad || null,
          role: 'paciente'
        }])
        .select()
        .single();
      
      if (createError) throw createError;
      currentProfileId = created.id;
    }
    
    // Preparar payloads
    const profilePayload = {
      full_name: dataToUpdate.full_name,
      email: dataToUpdate.email,
      phone: dataToUpdate.phone,
      address: dataToUpdate.address,
      occupation: dataToUpdate.occupation,
      cedula_identidad: dataToUpdate.cedula_identidad,
      updated_at: new Date().toISOString()
    };

    const vitalsPayload = {
      patient_id: currentProfileId,
      blood_type: dataToUpdate.blood_type,
      allergies: dataToUpdate.allergies,
      updated_at: new Date().toISOString()
    };

    try {
      // 1. Update Profile (base info)
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profilePayload)
        .eq('id', currentProfileId);

      if (profileError) throw profileError;

      // 2. Upsert Vitals (donde van tipo de sangre y alergias)
      // Lo hacemos explícito por si el Constraint ON CONFLICT de la BD falla
      const { data: existingVitals } = await supabase
        .from('patient_vitals')
        .select('id')
        .eq('patient_id', currentProfileId)
        .single();

      if (existingVitals) {
        // Si ya existen, actualizamos
        const { error: vitalsError } = await supabase
          .from('patient_vitals')
          .update({
            blood_type: vitalsPayload.blood_type,
            allergies: vitalsPayload.allergies,
            updated_at: vitalsPayload.updated_at
          })
          .eq('patient_id', currentProfileId);
        
        if (vitalsError) throw vitalsError;
      } else {
        // Si no existen, insertamos
        const { error: vitalsError } = await supabase
          .from('patient_vitals')
          .insert([vitalsPayload]);
        
        if (vitalsError) throw vitalsError;
      }

      setProfile(prev => ({ ...prev, ...dataToUpdate, id: currentProfileId }));
      return true;
    } catch (err: any) {
      console.error('Error actualizando perfil:', err);
      throw new Error(err.message || 'Fallo al actualizar el perfil en base de datos.');
    }
  };

  return { profile, loading, error, updateProfile };
}
