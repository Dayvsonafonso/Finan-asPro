import { useState, useEffect, useMemo, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import {
  Users,
  UserPlus,
  Activity,
  Search,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  Calendar,
  Clock,
  Zap,
  Shield,
} from 'lucide-react';
import { motion } from 'motion/react';

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  last_sign_in_at: string | null;
  last_active_at: string | null;
  provider: string;
}

type SortField = 'full_name' | 'email' | 'created_at' | 'last_active_at';
type SortDirection = 'asc' | 'desc';

export function AdminPanel() {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('last_active_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Re-renderiza a cada 60s para manter os tempos relativos atualizados (sem chamar o banco)
  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchUsers = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Busca todos os usuários de autenticação via RPC seguro (função SECURITY DEFINER)
      const { data: rpcUsers, error } = await supabase.rpc('get_all_users');
      if (error) throw error;

      // 2. Busca dados de atividade
      const { data: activityData } = await supabase
        .from('user_activity')
        .select('user_id, last_active_at');

      const activityMap = new Map<string, string>();
      (activityData || []).forEach((a: any) => {
        activityMap.set(a.user_id, a.last_active_at);
      });

      // 3. Mescla os dados
      const mapped: AuthUser[] = (rpcUsers || []).map((u: any) => ({
        id: u.id,
        email: u.email || 'Sem email',
        full_name:
          u.raw_user_meta_data?.full_name ||
          u.raw_user_meta_data?.name ||
          u.email?.split('@')[0] ||
          'Sem nome',
        avatar_url:
          u.raw_user_meta_data?.avatar_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.email || 'default')}`,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        last_active_at: activityMap.get(u.id) || null,
        provider: u.raw_user_meta_data?.iss?.includes('google') ? 'google' : 'email',
      }));

      setUsers(mapped);
    } catch (err: any) {
      console.error('Error fetching users:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    // OTIMIZAÇÃO: Intervalo aumentado de 15s para 60s.
    // Além disso, o polling é pausado quando a aba está em segundo plano,
    // evitando chamadas desnecessárias ao banco enquanto o admin não está olhando.
    const startPolling = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        fetchUsers(true);
      }, 5 * 60 * 1000);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUsers(true); // Atualiza imediatamente ao voltar
        startPolling();
      } else {
        stopPolling();
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    let result = [...users];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let valA: string = '';
      let valB: string = '';

      if (sortField === 'last_active_at') {
        // Para last_active_at, usa last_sign_in_at como alternativa se não houver atividade registrada
        valA = a.last_active_at || a.last_sign_in_at || '';
        valB = b.last_active_at || b.last_sign_in_at || '';
      } else {
        valA = a[sortField] || '';
        valB = b[sortField] || '';
      }

      if (sortField === 'created_at' || sortField === 'last_active_at') {
        const dateA = valA ? new Date(valA).getTime() : 0;
        const dateB = valB ? new Date(valB).getTime() : 0;
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      }

      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [users, searchQuery, sortField, sortDirection]);

  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newThisMonth = users.filter(
      (u) => new Date(u.created_at) >= startOfMonth
    ).length;

    const activeRecently = users.filter((u) => {
      const lastUse = u.last_active_at || u.last_sign_in_at;
      return lastUse && new Date(lastUse) >= sevenDaysAgo;
    }).length;

    return {
      total: users.length,
      newThisMonth,
      activeRecently,
    };
  }, [users]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
  };

  const formatTimeDiff = (diff: number) => {
    if (diff < 0) return 'Online agora';
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (totalMinutes < 2) return 'Online agora';
    if (totalMinutes < 60) return `${totalMinutes}min atrás`;
    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}min atrás` : `${hours}h atrás`;
    }
    if (days < 30) {
      return remainingHours > 0 ? `${days}d ${remainingHours}h atrás` : `${days}d atrás`;
    }
    return `${Math.floor(days / 30)} meses atrás`;
  };

  const getTimeSince = (dateStr: string | null) => {
    if (!dateStr) return null;
    const diff = Date.now() - new Date(dateStr).getTime();
    return formatTimeDiff(diff);
  };

  const getActivityStatus = (user: AuthUser) => {
    let lastUseStr = user.last_sign_in_at;
    if (user.last_active_at) {
      if (!lastUseStr || new Date(user.last_active_at) > new Date(lastUseStr)) {
        lastUseStr = user.last_active_at;
      }
    }
    
    if (!lastUseStr) return { label: 'Nunca usou', color: 'text-gray-400', dot: 'bg-gray-300 dark:bg-gray-600' };

    const diff = Math.max(0, Date.now() - new Date(lastUseStr).getTime());
    const totalMinutes = Math.floor(diff / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const days = Math.floor(hours / 24);
    const label = formatTimeDiff(diff);

    if (totalMinutes < 2) return { label, color: 'text-green-500', dot: 'bg-green-500 animate-pulse' };
    if (totalMinutes < 60) return { label, color: 'text-green-500', dot: 'bg-green-500' };
    if (hours < 24) return { label, color: 'text-amber-500', dot: 'bg-amber-500' };
    if (days < 7) return { label, color: 'text-orange-500', dot: 'bg-orange-500' };
    if (days < 30) return { label, color: 'text-gray-500', dot: 'bg-gray-400' };
    return { label, color: 'text-gray-400', dot: 'bg-gray-300 dark:bg-gray-600' };
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown className="w-3.5 h-3.5 opacity-30" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-indigo-500" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card className="p-5 lg:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total de Usuários
                </p>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {loading ? '...' : stats.total}
                </h3>
              </div>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5 lg:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 dark:bg-green-500/10 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Novos este Mês
                </p>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {loading ? '...' : stats.newThisMonth}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="p-5 lg:p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 dark:bg-amber-500/10 rounded-full -mr-8 -mt-8" />
            <div className="flex items-center justify-between relative">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ativos (7 dias)
                </p>
                <h3 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white mt-1">
                  {loading ? '...' : stats.activeRecently}
                </h3>
              </div>
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
                <Activity className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Tabela de Usuários */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card className="overflow-hidden">
          {/* Cabeçalho da Tabela */}
          <div className="p-4 lg:p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base lg:text-lg font-bold text-gray-900 dark:text-white">
                    Usuários Cadastrados
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {filteredUsers.length} de {users.length} usuários
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar usuário..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={fetchUsers}
                  disabled={loading}
                  className="h-10 w-10 rounded-xl"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 dark:text-gray-400">Carregando usuários...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Tabela para Desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-gray-800/50">
                      <th className="text-left px-6 py-3.5">
                        <button
                          onClick={() => handleSort('full_name')}
                          className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          <span>Usuário</span>
                          <SortIcon field="full_name" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3.5">
                        <button
                          onClick={() => handleSort('email')}
                          className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          <span>Email</span>
                          <SortIcon field="email" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3.5">
                        <button
                          onClick={() => handleSort('created_at')}
                          className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          <span>Cadastro</span>
                          <SortIcon field="created_at" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3.5">
                        <button
                          onClick={() => handleSort('last_active_at')}
                          className="flex items-center space-x-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        >
                          <span>Último Uso</span>
                          <SortIcon field="last_active_at" />
                        </button>
                      </th>
                      <th className="text-left px-6 py-3.5">
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Provedor
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredUsers.map((user, index) => {
                      const activity = getActivityStatus(user);
                      let lastUse = user.last_sign_in_at;
                      if (user.last_active_at && (!lastUse || new Date(user.last_active_at) > new Date(lastUse))) {
                        lastUse = user.last_active_at;
                      }
                      return (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative flex-shrink-0">
                                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                                  <img
                                    src={user.avatar_url}
                                    alt={user.full_name}
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${activity.dot}`} />
                              </div>
                              <span className="font-semibold text-sm text-gray-900 dark:text-white truncate max-w-[180px]">
                                {user.full_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {formatDate(user.created_at)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-2">
                                <Zap className={`w-3.5 h-3.5 flex-shrink-0 ${activity.color}`} />
                                <span className={`text-sm font-medium ${activity.color}`}>
                                  {activity.label}
                                </span>
                              </div>
                              {lastUse && (
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 ml-[22px] mt-0.5">
                                  {formatDateTime(lastUse)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider ${
                                user.provider === 'google'
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {user.provider}
                            </span>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Cards para Dispositivos Móveis */}
              <div className="lg:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((user, index) => {
                  const activity = getActivityStatus(user);
                  let lastUse = user.last_sign_in_at;
                  if (user.last_active_at && (!lastUse || new Date(user.last_active_at) > new Date(lastUse))) {
                    lastUse = user.last_active_at;
                  }
                  return (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative flex-shrink-0 mt-0.5">
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                            <img
                              src={user.avatar_url}
                              alt={user.full_name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${activity.dot}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                              {user.full_name}
                            </h4>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider flex-shrink-0 ml-2 ${
                                user.provider === 'google'
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {user.provider}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {user.email}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-1.5">
                              <Calendar className="w-3 h-3 text-gray-400" />
                              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                {formatDate(user.created_at)}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <Zap className={`w-3 h-3 ${activity.color}`} />
                              <span className={`text-[11px] font-medium ${activity.color}`}>
                                {activity.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'Nenhum usuário encontrado para esta busca.' : 'Nenhum usuário cadastrado.'}
                  </p>
                </div>
              )}
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
