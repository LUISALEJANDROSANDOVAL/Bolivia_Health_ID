import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface AppointmentData {
  id: string;
  doctor_name: string;
  doctor_id?: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  location: string;
  type: 'presencial' | 'virtual';
  status: 'scheduled' | 'completed' | 'cancelled';
}

export function useAppointments(walletAddress: string | null) {
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchAppointments() {
      if (!walletAddress) {
        if (mounted) {
          setAppointments([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('wallet_address', walletAddress.toLowerCase())
          .single();

        if (profile) {
          const { data, error } = await supabase
            .from('appointments')
            .select(`*`)
            .eq('patient_id', profile.id)
            .in('status', ['scheduled'])
            .order('appointment_date', { ascending: true })
            .limit(5);

          if (error) throw error;
          
          if (mounted) {
             // Formateamos en base al arreglo
             setAppointments((data || []) as AppointmentData[]);
          }
        }
      } catch (err) {
        console.error('Error fetching appointments:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchAppointments();

    return () => {
      mounted = false;
    };
  }, [walletAddress]);

  return { appointments, loading };
}
