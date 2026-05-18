import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Bell, Send, Trash2, Megaphone, Calendar, X } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';

interface Notification {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

export function NotificationsView() {
  const { user } = useAuth();
  const [rawNotifications, setRawNotifications] = useState<Notification[]>([]);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form fields for Admin
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Check if current user is admin
  const isAdmin = user?.email === 'dayvsonafonsoo@gmail.com' || user?.email === 'dayvsonafonsodd@gmail.com' || user?.email === 'afonso.william@gmail.com';

  useEffect(() => {
    // Carrega avisos descartados localmente
    const saved = localStorage.getItem('dismissed_notifications');
    if (saved) {
      setDismissedIds(JSON.parse(saved));
    }
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes('relation "notifications" does not exist')) {
          setRawNotifications([]);
        } else {
          throw error;
        }
      } else {
        setRawNotifications(data || []);
      }
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      toast.error('Erro ao carregar notificações.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.warning('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setIsSending(true);
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            title: title.trim(),
            message: message.trim(),
            created_by: user?.id,
          }
        ]);

      if (error) {
        if (error.message.includes('relation "notifications" does not exist')) {
          toast.error('Erro: A tabela "notifications" não foi criada no banco de dados. Crie-a no editor SQL do Supabase primeiro!');
        } else {
          throw error;
        }
      } else {
        toast.success('Notificação enviada a todos os usuários!');
        setTitle('');
        setMessage('');
        fetchNotifications();
      }
    } catch (error: any) {
      console.error('Error sending notification:', error);
      toast.error('Erro ao enviar notificação: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  const handleDismissNotification = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem('dismissed_notifications', JSON.stringify(updated));
    toast.success('Notificação removida da sua tela!');
    // Dispara evento para o App.tsx recalcular a bolinha vermelha de novas notificações
    window.dispatchEvent(new Event('notifications-updated'));
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta notificação? Isso a removerá para todos os usuários.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Notificação excluída com sucesso!');
      setRawNotifications(prev => prev.filter(n => n.id !== id));
      window.dispatchEvent(new Event('notifications-updated'));
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao excluir notificação.');
    }
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    return `Há ${diffDays} dias`;
  };

  // Filtra as notificações visíveis (remove as que o usuário excluiu localmente)
  const visibleNotifications = rawNotifications.filter(n => !dismissedIds.includes(n.id));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Admin Panel: Send Notification */}
      {isAdmin && (
        <Card className="p-6 relative overflow-hidden border border-indigo-100 dark:border-indigo-900/50">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl" />
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Enviar Comunicado Geral</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Esta mensagem será exibida na aba de notificações de todos os usuários.</p>
            </div>
          </div>

          <form onSubmit={handleSendNotification} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Título do Comunicado</label>
              <input
                type="text"
                placeholder="Ex: Atualização importante do sistema"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Mensagem</label>
              <textarea
                placeholder="Escreva a mensagem que deseja transmitir aos usuários..."
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm resize-none"
              />
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={isSending}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-5 font-bold h-12 shadow-lg shadow-indigo-500/10 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Send className="w-4 h-4" />
                <span>{isSending ? 'Enviando...' : 'Enviar Comunicado'}</span>
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Notifications List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2 mb-2">
          <Bell className="w-5 h-5 text-indigo-500" />
          <span>Mural de Avisos</span>
          {visibleNotifications.length > 0 && (
            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs px-2 py-0.5 rounded-full font-bold">
              {visibleNotifications.length}
            </span>
          )}
        </h3>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : visibleNotifications.length === 0 ? (
          <Card className="p-8 text-center border border-dashed border-gray-200 dark:border-gray-800/80">
            <div className="mx-auto w-12 h-12 bg-gray-50 dark:bg-gray-900 rounded-full flex items-center justify-center text-gray-400 mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-gray-700 dark:text-gray-300">Nenhum aviso por aqui</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Fique tranquilo! Quando os administradores enviarem comunicados importantes, eles aparecerão neste mural.
            </p>
          </Card>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {visibleNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className="p-5 flex items-start gap-4 border border-gray-100 dark:border-gray-800/60 relative overflow-hidden group">
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex-shrink-0 mt-0.5">
                      <Megaphone className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-gray-900 dark:text-white leading-tight">{notification.title}</h4>
                        <div className="flex items-center space-x-1.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatRelativeTime(notification.created_at)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium whitespace-pre-line">
                        {notification.message}
                      </p>
                    </div>

                    <div className="flex items-center space-x-1 ml-2 self-start flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {/* Ocultar para mim (Apenas para mim, disponível para todos) */}
                      <button
                        onClick={() => handleDismissNotification(notification.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors cursor-pointer"
                        title={isAdmin ? "Ocultar para mim" : "Excluir da minha tela"}
                      >
                        {isAdmin ? <X className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                      </button>

                      {/* Excluir globalmente (Apenas para Admin) */}
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Excluir de TODOS os usuários (Global)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
