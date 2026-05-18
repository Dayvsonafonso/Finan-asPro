import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Transaction, Category } from '../types';
import { formatCurrency } from '../lib/utils';
import { Wallet, Target, TrendingUp, AlertCircle, Edit2, Check, X, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface BudgetItemProps {
  key?: React.Key;
  cat: Category;
  spent: number;
  currentMonthTransactions: Transaction[];
  editingId: string | null;
  editValue: string;
  setEditValue: React.Dispatch<React.SetStateAction<string>>;
  expandedId: string | null;
  toggleExpand: (id: string) => void;
  handleSave: (id: string) => Promise<void> | void;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
  handleEdit: (category: Category) => void;
}

function BudgetItem({
  cat,
  spent,
  currentMonthTransactions,
  editingId,
  editValue,
  setEditValue,
  expandedId,
  toggleExpand,
  handleSave,
  setEditingId,
  handleEdit,
}: BudgetItemProps) {
  const dragControls = useDragControls();
  const budget = Number(cat.budget) || 0;
  const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const isOverBudget = budget > 0 && spent > budget;
  const categoryTransactions = currentMonthTransactions.filter(
    t => t.type === 'expense' && t.category === cat.name
  );

  return (
    <Reorder.Item
      key={cat.id}
      value={cat}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
      className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 transition-colors relative group"
    >
      <div
        onPointerDown={(e) => dragControls.start(e)}
        style={{ touchAction: 'none' }}
        className="absolute left-0 top-0 bottom-0 w-10 flex items-center justify-center opacity-40 hover:opacity-100 active:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10 select-none"
      >
        <GripVertical className="w-5 h-5 pointer-events-none" />
      </div>
      <div className="pl-8">
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 cursor-pointer hover:opacity-80 transition-opacity gap-3 sm:gap-0"
          onClick={() => toggleExpand(cat.id)}
        >
          <div className="flex items-center space-x-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${cat.color}20` }}
            >
              <div className="w-5 h-5" style={{ color: cat.color }}>
                <Target className="w-5 h-5" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white truncate">{cat.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                Gasto: {formatCurrency(spent)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto pl-12 sm:pl-0" onClick={(e) => e.stopPropagation()}>
            {editingId === cat.id ? (
              <div className="flex items-center space-x-1 sm:space-x-2 w-full sm:w-auto justify-between sm:justify-end">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={editValue}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, '');
                    if (val) {
                      val = (Number(val) / 100).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      });
                    }
                    setEditValue(val);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSave(cat.id);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      setEditingId(null);
                    }
                  }}
                  className="w-full sm:w-28 h-9 text-sm max-w-[120px] sm:max-w-none"
                  autoFocus
                />
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleSave(cat.id)}
                    className="text-green-500 h-9 w-9 p-0"
                  >
                    <Check className="w-5 h-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                    className="text-red-500 h-9 w-9 p-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-2 sm:space-x-3">
                <div className="text-left sm:text-right flex-1 sm:flex-none min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Orçado: {formatCurrency(budget)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {budget > 0
                      ? `Restante: ${formatCurrency(budget - spent)}`
                      : 'Sem limite definido'}
                  </p>
                </div>
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => handleEdit(cat)} className="h-8 w-8">
                    <Edit2 className="w-4 h-4 text-gray-500" />
                  </Button>
                  <div className="pl-1 sm:pl-2 border-l border-gray-200 dark:border-gray-700 pointer-events-none">
                    {expandedId === cat.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {budget > 0 && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={isOverBudget ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}>
                {percent.toFixed(1)}% utilizado
              </span>
              {isOverBudget && (
                <span className="flex items-center text-red-500 font-medium">
                  <AlertCircle className="w-3 h-3 mr-1" /> Estourou o orçamento
                </span>
              )}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  isOverBudget ? 'bg-red-500' : 'bg-indigo-600 dark:bg-indigo-400'
                }`}
                style={{ width: `${percent}%` }}
              ></div>
            </div>
          </div>
        )}

        <AnimatePresence>
          {expandedId === cat.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-4"
            >
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Lançamentos do Mês ({categoryTransactions.length})
                </p>
                {categoryTransactions.length > 0 ? (
                  categoryTransactions.map(t => (
                    <div
                      key={t.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between text-sm py-2 px-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 gap-2 sm:gap-0"
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {t.description}
                          </span>
                          {t.totalInstallments && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-md">
                              {t.currentInstallment}/{t.totalInstallments}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                        </span>
                      </div>
                      <span className="font-bold text-red-600 dark:text-red-400 sm:text-right">
                        - {formatCurrency(t.amount)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    Nenhuma saída nesta categoria este mês.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Reorder.Item>
  );
}

interface BudgetViewProps {
  categories: Category[];
  transactions: Transaction[];
  onUpdateCategory: (id: string, category: Partial<Category>) => void;
}

export function BudgetView({ categories, transactions, onUpdateCategory }: BudgetViewProps) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const currentMonthTransactions = useMemo(() => {
    return transactions.filter(t => {
      try {
        const date = parseISO(t.date);
        return isWithinInterval(date, { start: monthStart, end: monthEnd });
      } catch (e) {
        return false;
      }
    });
  }, [transactions, monthStart, monthEnd]);

  const totalIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const spentByCategory = useMemo(() => {
    const acc: Record<string, number> = {};
    currentMonthTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
      });
    return acc;
  }, [currentMonthTransactions]);

  const [categoryOrder, setCategoryOrder] = useLocalStorage<string[]>('budget_category_order', []);

  const expenseCategories = useMemo(() => {
    const filtered = categories.filter(c => c.name !== 'Salário' && c.name !== 'Renda Extra');
    
    const smartSorted = [...filtered].sort((a, b) => {
      if (a.name === 'Alimentação') return -1;
      if (b.name === 'Alimentação') return 1;
      const aBudget = Number(a.budget) || 0;
      const bBudget = Number(b.budget) || 0;
      if (aBudget > 0 && bBudget === 0) return -1;
      if (bBudget > 0 && aBudget === 0) return 1;
      return a.name.localeCompare(b.name);
    });

    if (!Array.isArray(categoryOrder) || categoryOrder.length === 0) return smartSorted;

    return [...filtered].sort((a, b) => {
      const indexA = categoryOrder.indexOf(a.id);
      const indexB = categoryOrder.indexOf(b.id);
      
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      return smartSorted.indexOf(a) - smartSorted.indexOf(b);
    });
  }, [categories, categoryOrder]);

  const [localCategories, setLocalCategories] = useState(expenseCategories);

  React.useEffect(() => {
    setLocalCategories(expenseCategories);
  }, [expenseCategories]);

  const handleReorder = (newOrder: Category[]) => {
    setLocalCategories(newOrder);
    setCategoryOrder(newOrder.map(c => c.id));
  };

  const totalBudgeted = expenseCategories.reduce((sum, cat) => sum + (Number(cat.budget) || 0), 0);
  const remainingToBudget = totalIncome - totalBudgeted;

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setEditValue(category.budget ? category.budget.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
  };

  const handleSave = async (id: string) => {
    const numericValue = Number(editValue.replace(/\./g, '').replace(',', '.'));
    try {
      await onUpdateCategory(id, { budget: isNaN(numericValue) ? 0 : numericValue });
      setEditingId(null);
      toast.success('Orçamento salvo!');
    } catch (error: any) {
      console.error(error);
      toast.error('Erro ao salvar. Verifique se você atualizou o Banco de Dados!');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        <Card className="dark:bg-gray-900 flex flex-col justify-between p-4 sm:p-5">
          <div className="mb-3 lg:mb-4">
            <div className="inline-flex p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate mb-1">
              {formatCurrency(totalIncome)}
            </h2>
            <div className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm truncate">
              Renda Mensal
            </div>
          </div>
        </Card>

        <Card className="dark:bg-gray-900 flex flex-col justify-between p-4 sm:p-5">
          <div className="mb-3 lg:mb-4">
            <div className="inline-flex p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Target className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate mb-1">
              {formatCurrency(totalBudgeted)}
            </h2>
            <div className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm truncate">
              Total Orçado
            </div>
          </div>
        </Card>

        <Card className="dark:bg-gray-900 flex flex-col justify-between p-4 sm:p-5 col-span-2 lg:col-span-1">
          <div className="mb-3 lg:mb-4">
            <div className="inline-flex p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <Wallet className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
          <div>
            <h2 className={`text-xl lg:text-2xl font-bold truncate mb-1 ${remainingToBudget < 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
              {formatCurrency(remainingToBudget)}
            </h2>
            <div className="text-blue-600 dark:text-blue-400 text-xs sm:text-sm truncate">
              Disponível para Alocar
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Orçamento por Categoria</h3>
        <Reorder.Group axis="y" values={localCategories} onReorder={handleReorder} className="space-y-6">
          {localCategories.map(cat => (
            <BudgetItem
              key={cat.id}
              cat={cat}
              spent={spentByCategory[cat.name] || 0}
              currentMonthTransactions={currentMonthTransactions}
              editingId={editingId}
              editValue={editValue}
              setEditValue={setEditValue}
              expandedId={expandedId}
              toggleExpand={toggleExpand}
              handleSave={handleSave}
              setEditingId={setEditingId}
              handleEdit={handleEdit}
            />
          ))}
        </Reorder.Group>
      </Card>
    </div>
  );
}
