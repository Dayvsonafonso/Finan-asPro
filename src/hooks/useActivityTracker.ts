import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Tracks user activity by updating a `user_activity` table in Supabase.
 * Designed to work reliably on mobile browsers where setInterval
 * is throttled or paused when the tab/app is in the background.
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const lastUpdateRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateActivity = useCallback(async (force = false) => {
    if (!user) return;

    // Throttle: don't update more than once every 30 seconds unless forced
    const now = Date.now();
    if (!force && now - lastUpdateRef.current < 30000) return;
    lastUpdateRef.current = now;

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
        console.error('Activity tracker upsert error (possível erro de RLS/Permissão no Supabase):', error.message, error.details);
      }
    } catch (err) {
      console.warn('Activity tracker exception:', err);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Update immediately on mount
    updateActivity();

    // Update every 45 seconds (reliable interval)
    intervalRef.current = setInterval(updateActivity, 45 * 1000);

    // When user returns to the tab/app (critical for mobile!)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reset throttle so it updates immediately on return
        lastUpdateRef.current = 0;
        updateActivity();
      }
    };

    // When window gets focus back
    const handleFocus = () => {
      lastUpdateRef.current = 0;
      updateActivity();
    };

    // On any touch/click interaction (throttled by updateActivity itself)
    const handleInteraction = () => {
      updateActivity();
    };

    // Mobile: when page is about to be hidden, try one last update
    const handlePageHide = () => {
      if (!user) return;
      // Use sendBeacon for reliable delivery when page is closing
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_activity?on_conflict=user_id`;
      const body = JSON.stringify({
        user_id: user.id,
        last_active_at: new Date().toISOString(),
      });
      const headers = {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      };
      // sendBeacon doesn't support custom headers, so use fetch with keepalive
      try {
        fetch(url, {
          method: 'POST',
          headers,
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Silently fail - best effort
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('touchstart', handleInteraction, { passive: true });
    document.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('touchstart', handleInteraction);
      document.removeEventListener('click', handleInteraction);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [user, updateActivity]);

  return { updateActivity };
}
