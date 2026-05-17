export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  user_id?: string;
  budget?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  isFixed?: boolean;
  user_id?: string;
  totalInstallments?: number;
  currentInstallment?: number;
  isPaid?: boolean;
}

export interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
}
