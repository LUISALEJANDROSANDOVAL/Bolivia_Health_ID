import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface StorageStats {
  usedGB: number;
  totalGB: number;
  monthUploads: number;
  trend: string;
  lastUploadDate: string | null;
}

export function useStorageStats(walletAddress: string | null) {
  const [stats, setStats] = useState<StorageStats>({
    usedGB: 0,
    totalGB: 10,
    monthUploads: 0,
    trend: '0%',
    lastUploadDate: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchStats() {
      if (!walletAddress) {
        if (mounted) {
          setStats({ usedGB: 0, totalGB: 10, monthUploads: 0, trend: '0%', lastUploadDate: null });
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
          // Obtener todos los registros del usuario
          const { data, error } = await supabase
            .from('health_records')
            .select('file_size, created_at')
            .eq('patient_id', profile.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          if (mounted && data) {
            let totalBytes = 0;
            let currentMonthUploads = 0;
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            data.forEach((record: any) => {
              // Parsear file_size (asumiendo que viene como "X.XX MB" o "X.XX KB")
              const sizeStr = record.file_size || '';
              const match = sizeStr.match(/([\d.]+)\s*(MB|KB|GB|B)/i);
              if (match) {
                 const val = parseFloat(match[1]);
                 const unit = match[2].toUpperCase();
                 if (unit === 'MB') totalBytes += val * 1024 * 1024;
                 else if (unit === 'KB') totalBytes += val * 1024;
                 else if (unit === 'GB') totalBytes += val * 1024 * 1024 * 1024;
                 else if (unit === 'B') totalBytes += val;
              }

              // Contar uploads del mes
              const recDate = new Date(record.created_at);
              if (recDate.getMonth() === currentMonth && recDate.getFullYear() === currentYear) {
                 currentMonthUploads++;
              }
            });

            const usedGB = totalBytes / (1024 * 1024 * 1024);
            const lastUploadDate = data.length > 0 ? new Date(data[0].created_at).toLocaleDateString() : null;

            setStats({
              usedGB: Number(usedGB.toFixed(2)),
              totalGB: 10,
              monthUploads: currentMonthUploads,
              trend: currentMonthUploads > 0 ? '+ Active' : 'Stable',
              lastUploadDate
            });
          }
        }
      } catch (err) {
        console.error('Error fetching storage stats:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchStats();

    return () => {
      mounted = false;
    };
  }, [walletAddress]);

  return { stats, loading };
}
