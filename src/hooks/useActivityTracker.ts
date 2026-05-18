import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Tracks user activity by updating a `user_activity` table in Supabase.
 * Updates on mount and then every 5 minutes while the user is active.
 * Also updates on window focus (e.g., user returns to the tab).
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateActivity = async () => {
    if (!user) return;

    try {
      await supabase
        .from('user_activity')
        .upsert(
          {
            user_id: user.id,
            last_active_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
    } catch (err) {
      // Silently fail — don't break the app if table doesn't exist yet
      console.warn('Activity tracker: could not update', err);
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
    window.addEventListener('focus', handleFocus);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);
}
