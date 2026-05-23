import { useEffect, useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Transaction, Category, FinanceState } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Alimentação', icon: 'Utensils', color: '#EF4444' },
  { id: '2', name: 'Transporte', icon: 'Bus', color: '#3B82F6' },
  { id: '3', name: 'Moradia', icon: 'Home', color: '#10B981' },
  { id: '4', name: 'Lazer', icon: 'Gamepad2', color: '#F59E0B' },
  { id: '5', name: 'Salário', icon: 'DollarSign', color: '#8B5CF6' },
  { id: '6', name: 'Cartão de Crédito', icon: 'CreditCard', color: '#6366F1' },
  { id: '8', name: 'Faturas', icon: 'FileText', color: '#EC4899' },
  { id: '7', name: 'Outros', icon: 'MoreHorizontal', color: '#6B7280' },
];

export function useFinance() {
  const { user } = useAuth();
  const [localState, setLocalState] = useLocalStorage<FinanceState>('finance_app_data', {
    transactions: [],
    categories: DEFAULT_CATEGORIES,
  });

  const [state, setState] = useState<FinanceState>(localState);
  const [loading, setLoading] = useState(false);

  // Sincroniza o estado com o localState quando não estiver logado
  useEffect(() => {
    if (!user) {
      setState(localState);
    }
  }, [user, localState]);

  // Busca os dados do Supabase quando estiver logado
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: transactions, error: tError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      const { data: categories, error: cError } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      if (tError || cError) throw tError || cError;

      let fetchedCategories = categories;

      // Cria categorias padrão se o usuário não tiver nenhuma
      if (!categories || categories.length === 0) {
        // Evita inserções duplas simultâneas adicionando um pequeno atraso ou verificando novamente?
        // Não é necessário se apenas removermos as duplicadas abaixo, mas por segurança.
        const categoriesToInsert = DEFAULT_CATEGORIES.map(({ id, ...rest }) => ({
          ...rest,
          user_id: user.id
        }));
        
        const { data: newCategories, error: insertError } = await supabase
          .from('categories')
          .insert(categoriesToInsert)
          .select();
          
        if (!insertError && newCategories) {
          fetchedCategories = newCategories;
        } else {
          fetchedCategories = DEFAULT_CATEGORIES;
        }
      }

      // Remove duplicidade de categorias por nome (corrige o problema de inserção dupla no modo estrito do React)
      const uniqueCategories = [];
      const seenNames = new Set();
      if (fetchedCategories && fetchedCategories.length > 0) {
        for (const cat of fetchedCategories) {
          if (!seenNames.has(cat.name)) {
            seenNames.add(cat.name);
            uniqueCategories.push(cat);
          } else {
            // Exclui duplicadas do Supabase silenciosamente
            supabase.from('categories').delete().eq('id', cat.id).then();
          }
        }
        fetchedCategories = uniqueCategories;
      }

      // Mapeia snake_case do banco de dados para camelCase para o aplicativo
      const mappedTransactions = (transactions || []).map(t => ({
        ...t,
        amount: Number(t.amount),
        isFixed: t.is_fixed,
        totalInstallments: t.total_installments,
        currentInstallment: t.current_installment,
        isPaid: t.is_paid
      }));

      setState({
        transactions: mappedTransactions,
        categories: fetchedCategories && fetchedCategories.length > 0 ? fetchedCategories : DEFAULT_CATEGORIES,
      });
    } catch (err) {
      console.error('Error fetching data from Supabase:', err);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (user) {
      const { isFixed, totalInstallments, currentInstallment, isPaid, ...rest } = transaction;
      const { data, error } = await supabase
        .from('transactions')
        .insert([{ 
          ...rest, 
          is_fixed: isFixed,
          total_installments: totalInstallments,
          current_installment: currentInstallment,
          is_paid: isPaid,
          user_id: user.id 
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding transaction to Supabase:', error);
        throw error;
      }
      
      const mappedData = { 
        ...data, 
        amount: Number(data.amount),
        isFixed: data.is_fixed,
        totalInstallments: data.total_installments,
        currentInstallment: data.current_installment,
        isPaid: data.is_paid
      };
      setState(prev => ({ ...prev, transactions: [mappedData, ...prev.transactions] }));
    } else {
      const newTransaction = { ...transaction, id: crypto.randomUUID() };
      setLocalState((prev) => ({
        ...prev,
        transactions: [newTransaction, ...prev.transactions],
      }));
    }
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    if (user) {
      const { isFixed, totalInstallments, currentInstallment, isPaid, ...rest } = updated;
      const updatePayload: any = { ...rest };
      if (isFixed !== undefined) updatePayload.is_fixed = isFixed;
      if (totalInstallments !== undefined) updatePayload.total_installments = totalInstallments;
      if (currentInstallment !== undefined) updatePayload.current_installment = currentInstallment;
      if (isPaid !== undefined) updatePayload.is_paid = isPaid;

      const { error } = await supabase
        .from('transactions')
        .update(updatePayload)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating transaction in Supabase:', error);
        throw error;
      }
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...updated } : t)),
      }));
    } else {
      setLocalState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...updated } : t)),
      }));
    }
  };

  const deleteTransaction = async (id: string) => {
    if (user) {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting transaction from Supabase:', error);
        throw error;
      }
      setState(prev => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      }));
    } else {
      setLocalState((prev) => ({
        ...prev,
        transactions: prev.transactions.filter((t) => t.id !== id),
      }));
    }
  };

  const addCategory = async (category: Omit<Category, 'id'>) => {
    if (user) {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ ...category, user_id: user.id }])
        .select()
        .single();
      
      if (error) {
        console.error('Error adding category to Supabase:', error);
        return;
      }
      setState(prev => ({ ...prev, categories: [...prev.categories, data] }));
    } else {
      const newCategory = { ...category, id: crypto.randomUUID() };
      setLocalState((prev) => ({
        ...prev,
        categories: [...prev.categories, newCategory],
      }));
    }
  };

  const updateCategory = async (id: string, updated: Partial<Category>) => {
    if (user) {
      const { error } = await supabase
        .from('categories')
        .update(updated)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating category in Supabase:', error);
        throw error;
      }
      setState(prev => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));
    } else {
      setLocalState((prev) => ({
        ...prev,
        categories: prev.categories.map((c) => (c.id === id ? { ...c, ...updated } : c)),
      }));
    }
  };

  const deleteCategory = async (id: string) => {
    if (user) {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting category from Supabase:', error);
        return;
      }
      setState(prev => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
      }));
    } else {
      setLocalState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
      }));
    }
  };

  const totals = state.transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  return {
    ...state,
    totals: {
      ...totals,
      balance: totals.income - totals.expense,
    },
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
