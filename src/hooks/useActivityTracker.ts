import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Tracks user activity by updating a `user_activity` table in Supabase.
 * Updates on mount and then every 1 minute while the user is active.
 * Also updates on window focus (e.g., user returns to the tab).
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateActivity = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_activity')
        .upsert(
          {
            user_id: user.id,
            last_active_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Supabase upsert error:', error);
        toast.error(`Erro no rastreamento: ${error.message}`);
      }
    } catch (err) {
      console.warn('Activity tracker exception:', err);
    }
  };

  useEffect(() => {
    if (!user) return;

    // Update immediately on mount
    updateActivity();

    // Update every 1 minute
    intervalRef.current = setInterval(updateActivity, 1 * 60 * 1000);

    // Update when user returns to the tab
    const handleFocus = () => updateActivity();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateActivity();
      }
    };

    // Update on interaction (throttled to once per minute)
    let lastInteraction = Date.now();
    const handleInteraction = () => {
      const now = Date.now();
      if (now - lastInteraction > 60 * 1000) {
        lastInteraction = now;
        updateActivity();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction, { passive: true });

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
    };
  }, [user]);
}
