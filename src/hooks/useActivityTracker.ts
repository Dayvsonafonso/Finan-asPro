import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

/**
 * Rastreia a atividade do usuário atualizando a tabela `user_activity` no Supabase.
 * Projetado para funcionar de forma confiável em navegadores móveis onde o setInterval
 * é limitado ou pausado quando a aba/app está em segundo plano.
 */
export function useActivityTracker() {
  const { user } = useAuth();
  const lastUpdateRef = useRef<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateActivity = useCallback(async (force = false) => {
    if (!user) return;

    // Limitação (Throttle): não atualiza mais do que uma vez a cada 3 minutos, a menos que seja forçado
    const now = Date.now();
    if (!force && now - lastUpdateRef.current < 180000) return;
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
        // Exibe o erro na tela para ajudar a debugar no celular
        if (force) {
           import('sonner').then(({ toast }) => {
             toast.error(`Erro no Supabase (Aviso para o ADM): ${error.message}`);
           });
        }
      }
    } catch (err: any) {
      console.warn('Activity tracker exception:', err);
      if (force) {
         import('sonner').then(({ toast }) => {
           toast.error(`Erro de conexão: ${err.message}`);
         });
      }
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    // Atualiza imediatamente na montagem do componente
    updateActivity();

    // Atualiza a cada 5 minutos (intervalo confiável)
    intervalRef.current = setInterval(updateActivity, 5 * 60 * 1000);

    // Quando o usuário retorna para a aba/app (crítico para dispositivos móveis!)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reseta a limitação para atualizar imediatamente no retorno
        lastUpdateRef.current = 0;
        updateActivity();
      }
    };

    // Quando a janela recupera o foco
    const handleFocus = () => {
      lastUpdateRef.current = 0;
      updateActivity();
    };

    // Em qualquer interação de toque/clique (limitado pela própria função updateActivity)
    const handleInteraction = () => {
      updateActivity();
    };

    // Dispositivos móveis: quando a página está prestes a ser ocultada, tenta uma última atualização
    const handlePageHide = async () => {
      if (!user) return;
      // Usa o token da sessão autenticada para a devida aplicação do RLS
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      if (!accessToken) return;

      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const anonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !anonKey) return;

      const url = `${supabaseUrl}/rest/v1/user_activity?on_conflict=user_id`;
      const body = JSON.stringify({
        user_id: user.id,
        last_active_at: new Date().toISOString(),
      });
      const headers = {
        'Content-Type': 'application/json',
        'apikey': anonKey,
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'resolution=merge-duplicates',
      };
      // sendBeacon não suporta cabeçalhos personalizados, então usa fetch com keepalive
      try {
        fetch(url, {
          method: 'POST',
          headers,
          body,
          keepalive: true,
        }).catch(() => {});
      } catch {
        // Falha silenciosamente - melhor esforço
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
