import React from 'react';
import { Transaction, Category } from '../types';
import { TransactionList } from './TransactionList';

interface FaturasViewProps {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
  onEdit: (t: Transaction) => void;
  onTogglePaid: (t: Transaction) => void;
}

export function FaturasView({ transactions, categories, onDelete, onEdit, onTogglePaid }: FaturasViewProps) {
  const faturas = transactions.filter(t => t.category === 'Faturas');
  
  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="p-4 sm:p-6 border-b border-gray-50 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-bold text-gray-900 dark:text-white">Lista de Faturas</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Pagas</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-amber-500 rounded-full" />
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">Pendentes</span>
            </div>
          </div>
        </div>
        <div className="p-0">
          <TransactionList 
            transactions={faturas} 
            categories={categories} 
            onDelete={onDelete}
            onEdit={onEdit}
            onTogglePaid={onTogglePaid}
          />
        </div>
      </div>
    </div>
  );
}
