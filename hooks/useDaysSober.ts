import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { SlipUp } from '@/types/database';

export interface DaysSoberResult {
  daysSober: number;
  journeyStartDate: string | null;
  currentStreakStartDate: string | null;
  hasSlipUps: boolean;
  loading: boolean;
  error: any;
}

export function useDaysSober(userId?: string): DaysSoberResult {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [mostRecentSlipUp, setMostRecentSlipUp] = useState<SlipUp | null>(null);

  const targetUserId = userId || user?.id;
  const targetProfile = userId ? null : profile;

  useEffect(() => {
    async function fetchSlipUps() {
      if (!targetUserId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('slip_ups')
          .select('*')
          .eq('user_id', targetUserId)
          .order('slip_up_date', { ascending: false })
          .limit(1);

        if (fetchError) throw fetchError;

        setMostRecentSlipUp(data && data.length > 0 ? data[0] : null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchSlipUps();
  }, [targetUserId]);

  const result = useMemo(() => {
    return {
      daysSober: 0,
      journeyStartDate: null,
      currentStreakStartDate: null,
      hasSlipUps: mostRecentSlipUp !== null,
      loading,
      error,
    };
  }, [mostRecentSlipUp, loading, error]);

  return result;
}
