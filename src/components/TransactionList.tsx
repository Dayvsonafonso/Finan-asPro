import { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Edit2, 
  CheckCircle2,
  Circle,
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar, 
  ArrowUpDown, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, Category } from '../types';
import { formatCurrency, formatDate, cn } from '../lib/utils';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card } from './ui/Card';
import { CategoryIcon } from './ui/CategoryIcon';

interface TransactionListProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onTogglePaid?: (transaction: Transaction) => void;
}

type SortField = 'date' | 'amount' | 'description';
type SortOrder = 'asc' | 'desc';

export function TransactionList({ transactions, categories, onDelete, onEdit, onTogglePaid }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => {
        const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             t.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        
        const transactionDate = new Date(t.date);
        const matchesStartDate = !startDate || transactionDate >= new Date(startDate);
        const matchesEndDate = !endDate || transactionDate <= new Date(endDate);

        return matchesSearch && matchesType && matchesStartDate && matchesEndDate;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'date') {
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortField === 'amount') {
          comparison = a.amount - b.amount;
        } else if (sortField === 'description') {
          comparison = a.description.localeCompare(b.description);
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [transactions, searchTerm, filterType, startDate, endDate, sortField, sortOrder]);

  const filteredTotals = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      acc.balance = acc.income - acc.expense;
      return acc;
    }, { income: 0, expense: 0, balance: 0 });
  }, [filteredTransactions]);

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setStartDate('');
    setEndDate('');
  };

  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    
    filteredTransactions.forEach(t => {
      const date = t.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(t);
    });

    return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
  }, [filteredTransactions]);

  const getDayLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateStr === today) return 'Hoje';
    if (dateStr === yesterday) return 'Ontem';
    
    return new Date(dateStr).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Resumo Filtrado */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 p-4 lg:p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100/50 dark:bg-emerald-800/20 rounded-full blur-2xl group-hover:bg-emerald-200/50 transition-colors duration-500" />
          <div className="relative flex items-center space-x-4">
            <div className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Entradas</p>
              <p className="text-xl lg:text-2xl font-black text-emerald-900 dark:text-emerald-50">{formatCurrency(filteredTotals.income)}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 p-4 lg:p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-red-100/50 dark:bg-red-800/20 rounded-full blur-2xl group-hover:bg-red-200/50 transition-colors duration-500" />
          <div className="relative flex items-center space-x-4">
            <div className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-100 dark:shadow-red-900/20">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">Saídas</p>
              <p className="text-xl lg:text-2xl font-black text-red-900 dark:text-red-50">{formatCurrency(filteredTotals.expense)}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-indigo-600 border-none p-4 lg:p-5 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors duration-500" />
          <div className="relative flex items-center space-x-4">
            <div className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-md">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-indigo-100 uppercase tracking-widest">Saldo Líquido</p>
              <p className="text-xl lg:text-2xl font-black text-white">{formatCurrency(filteredTotals.balance)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white dark:bg-gray-900 p-3 lg:p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 transition-colors duration-300">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input 
              type="text"
              placeholder="Buscar por descrição ou categoria..." 
              className="w-full pl-12 pr-4 h-10 lg:h-12 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm dark:text-gray-200 dark:placeholder-gray-500" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex bg-gray-50 dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700">
            <button 
              className={cn(
                "px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                filterType === 'all' ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              )}
              onClick={() => setFilterType('all')}
            >
              Todos
            </button>
            <button 
              className={cn(
                "px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                filterType === 'income' ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
              )}
              onClick={() => setFilterType('income')}
            >
              Entradas
            </button>
            <button 
              className={cn(
                "px-6 py-2 text-xs font-bold uppercase tracking-widest rounded-xl transition-all",
                filterType === 'expense' ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm" : "text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-900/10"
              )}
              onClick={() => setFilterType('expense')}
            >
              Saídas
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-50 dark:border-gray-800">
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Calendar className="w-4 h-4" />
            <span>Período:</span>
          </div>
          <input 
            type="date" 
            className="bg-transparent border-none text-sm font-medium text-gray-600 dark:text-gray-300 focus:ring-0 p-0 [color-scheme:light] dark:[color-scheme:dark]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span className="text-gray-300 dark:text-gray-600">até</span>
          <input 
            type="date" 
            className="bg-transparent border-none text-sm font-medium text-gray-600 dark:text-gray-300 focus:ring-0 p-0 [color-scheme:light] dark:[color-scheme:dark]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          
          {(searchTerm || filterType !== 'all' || startDate || endDate) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl">
              <XCircle className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Transações Agrupadas por Data */}
      <div className="space-y-6 lg:space-y-10">
        <AnimatePresence mode="popLayout">
          {groupedTransactions.length > 0 ? (
            groupedTransactions.map(([date, dayTransactions]) => (
              <div key={date} className="space-y-4">
                <div className="flex items-center space-x-4 px-2">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-[0.2em]">
                    {getDayLabel(date)}
                  </h3>
                  <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                    {dayTransactions.length} {dayTransactions.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>

                <div className="grid gap-3">
                  {dayTransactions.map((t) => {
                    const category = categories.find(c => c.name === t.category);
                    return (
                      <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="group relative bg-white dark:bg-gray-900 p-3 lg:p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 dark:hover:border-indigo-900/50 transition-all duration-300"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4">
                            <div className={cn(
                              "w-9 h-9 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 mt-0.5 sm:mt-0",
                              t.type === 'income' ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                            )}>
                              {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5 sm:w-7 sm:h-7" /> : <ArrowDownCircle className="w-5 h-5 sm:w-7 sm:h-7" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <p className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate text-sm sm:text-base max-w-[150px] xs:max-w-none">{t.description}</p>
                                {t.isFixed && (
                                  <span className="text-[8px] sm:text-[9px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-full font-black uppercase tracking-widest">
                                    Fixo
                                  </span>
                                )}
                                {t.category === 'Faturas' && (
                                  <span className={cn(
                                    "text-[8px] sm:text-[10px] px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-lg font-black uppercase tracking-widest shadow-sm",
                                    t.isPaid ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                                  )}>
                                    {t.isPaid ? 'Pago' : 'Pendente'}
                                  </span>
                                )}
                              </div>
                              
                              {t.category === 'Faturas' && t.totalInstallments && (
                                <div className="mt-3 space-y-2.5 w-full bg-gray-50/50 dark:bg-gray-800/50 p-2.5 sm:p-4 rounded-2xl border border-gray-100/50 dark:border-gray-700/50">
                                  <div className="flex flex-col xs:flex-row xs:items-center justify-between text-[9px] sm:text-[11px] font-black uppercase tracking-widest gap-1.5">
                                    <div className="flex items-center justify-between xs:justify-start xs:space-x-3 w-full xs:w-auto">
                                      <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md whitespace-nowrap">{t.currentInstallment}/{t.totalInstallments} parcelas</span>
                                      {onTogglePaid && !t.isPaid && (
                                        <button 
                                          onClick={(e) => { e.stopPropagation(); onTogglePaid(t); }}
                                          className="flex items-center space-x-1 text-[8px] sm:text-[9px] bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white px-2 py-0.5 rounded-md transition-all font-black uppercase tracking-widest shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                                        >
                                          <span>Marcar parcela como paga</span>
                                        </button>
                                      )}
                                      <span className={cn(
                                        "font-black transition-colors duration-500",
                                        t.isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-400 dark:text-indigo-500"
                                      )}>
                                        {Math.round(Math.min((((t.currentInstallment || 1) - 1 + (t.isPaid ? 1 : 0)) / t.totalInstallments) * 100, 100))}%
                                      </span>
                                    </div>
                                    <span className="text-gray-500 dark:text-gray-400 font-black text-right xs:text-left">Faltam {Math.max(t.totalInstallments - ((t.currentInstallment || 1) - 1 + (t.isPaid ? 1 : 0)), 0)}</span>
                                  </div>
                                  <div className="w-full h-2 sm:h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden p-0.5 border border-gray-100 dark:border-gray-700 shadow-inner">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min((((t.currentInstallment || 1) - 1 + (t.isPaid ? 1 : 0)) / t.totalInstallments) * 100, 100)}%` }}
                                      className={cn(
                                        "h-full rounded-full transition-all duration-1000 ease-out relative",
                                        t.isPaid 
                                          ? "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]" 
                                          : "bg-gradient-to-r from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]"
                                      )}
                                    >
                                      {/* Efeito de brilho */}
                                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-50" />
                                    </motion.div>
                                  </div>
                                </div>
                              )}

                              {t.category !== 'Faturas' && t.totalInstallments && (
                                <div className="mt-2 space-y-1.5">
                                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-pink-600 dark:text-pink-400">Parcela {t.currentInstallment} de {t.totalInstallments}</span>
                                      <span className="bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 px-1.5 py-0.5 rounded-md text-[8px]">
                                        {Math.round(((t.currentInstallment || 0) / (t.totalInstallments || 1)) * 100)}%
                                      </span>
                                    </div>
                                    <span className="text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Faltam {t.totalInstallments - (t.currentInstallment || 0)}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${((t.currentInstallment || 0) / (t.totalInstallments || 1)) * 100}%` }}
                                      className="h-full bg-pink-500 rounded-full shadow-[0_0_8px_rgba(236,72,153,0.4)]"
                                    />
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center mt-2 space-x-3">
                                <div className="flex items-center">
                                  <div 
                                    className="w-5 h-5 rounded-md flex items-center justify-center mr-1.5"
                                    style={{ backgroundColor: `${category?.color}15` }}
                                  >
                                    <CategoryIcon name={category?.icon || ''} className="w-3 h-3" color={category?.color} />
                                  </div>
                                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t.category}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end sm:space-x-6 w-full sm:w-auto mt-1 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50 dark:border-gray-800">
                            <div className="flex items-center space-x-3">
                              {onTogglePaid && t.category === 'Faturas' && !t.totalInstallments && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => onTogglePaid(t)}
                                  className={cn(
                                    "w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-all duration-300",
                                    t.isPaid 
                                      ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40" 
                                      : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                  )}
                                >
                                  {t.isPaid ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Circle className="w-4 h-4 sm:w-5 sm:h-5" />}
                                </Button>
                              )}
                              <div className={cn(
                                "font-black text-sm sm:text-lg tracking-tight",
                                t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 sm:translate-x-2 sm:group-hover:translate-x-0">
                              <Button variant="ghost" size="icon" onClick={() => onEdit(t)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400">
                                <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => onDelete(t.id)} className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400">
                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800 transition-colors duration-300"
            >
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nenhum lançamento encontrado</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-xs text-center">
                Tente ajustar seus filtros ou termos de busca para encontrar o que procura.
              </p>
              {(searchTerm || filterType !== 'all' || startDate || endDate) && (
                <Button variant="outline" onClick={clearFilters} className="mt-6 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                  Limpar todos os filtros
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
