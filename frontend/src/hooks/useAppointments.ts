import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useWallet } from '@/contexts/wallet-context';

export interface AppointmentData {
  id: string;
  doctor_name: string;
  doctor_id?: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  end_time?: string;
  location: string;
  type: 'presencial' | 'virtual';
  reason?: string;
  notes?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export function useAppointments(walletAddress: string | null) {
  const { isDbConnected } = useWallet();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchAppointments() {
      if (!walletAddress || !isDbConnected) {
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
            .select(`
              *,
              doctor:profiles!doctor_id (
                full_name,
                specialty
              )
            `)
            .eq('patient_id', profile.id)
            .in('status', ['scheduled'])
            .order('appointment_date', { ascending: true })
            .limit(5);

          if (error) throw error;
          
          if (mounted && data) {
             const mapped = data.map((apt: any) => ({
               ...apt,
               doctor_name: apt.doctor?.full_name || apt.doctor_name || 'Médico',
               specialty: apt.doctor?.specialty || apt.specialty || 'Especialista'
             }))
             setAppointments(mapped as AppointmentData[]);
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
  }, [walletAddress, isDbConnected]);

  return { appointments, loading };
}
