import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseRealTimeUpdatesProps {
  table: string;
  onUpdate: () => void;
  userId?: string;
}

export const useRealTimeUpdates = ({ table, onUpdate, userId }: UseRealTimeUpdatesProps) => {
  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          ...(userId ? { filter: `user_id=eq.${userId}` } : {})
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, onUpdate, userId]);
};