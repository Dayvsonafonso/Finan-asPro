import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Plus, Minus, History } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { Transaction, Category } from '../types';
import { Card } from './ui/Card';
import { useTheme } from '../contexts/ThemeContext';

interface DashboardProps {
  transactions: Transaction[];
  categories: Category[];
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
}

export function Dashboard({ transactions, categories, totals }: DashboardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter transactions for the current month
  const currentMonthTransactions = transactions.filter(t => {
    const [year, month] = t.date.split('-').map(Number);
    return (month - 1) === currentMonth && year === currentYear;
  });

  const currentMonthTotals = currentMonthTransactions.reduce(
    (acc, t) => {
      if (t.type === 'income') acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );

  // Data for Pie Chart (Expenses by Category - Current Month)
  const expenseByCategory = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc: any[], t) => {
      const existing = acc.find(item => item.name === t.category);
      if (existing) {
        existing.value += t.amount;
      } else {
        const category = categories.find(c => c.name === t.category);
        acc.push({ name: t.category, value: t.amount, color: category?.color || '#6B7280' });
      }
      return acc;
    }, []);

  // Data for Bar Chart (Income vs Expense)
  // Group by month for the last 6 months
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1); // Set to 1st of the month to avoid rollover bugs (e.g., Feb 29th)
    d.setMonth(d.getMonth() - i);
    const label = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    return {
      month: d.getMonth(),
      year: d.getFullYear(),
      label: label.charAt(0).toUpperCase() + label.slice(1)
    };
  }).reverse();

  const barData = last6Months.map(({ month, year, label }) => {
    const monthTransactions = transactions.filter(t => {
      const [tYear, tMonth] = t.date.split('-').map(Number);
      return (tMonth - 1) === month && tYear === year;
    });

    return {
      name: label,
      entradas: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      saídas: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    };
  });

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="border-l-4 border-l-indigo-500 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
              <History className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-full">Saldo Anterior</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totals.balance - (currentMonthTotals.income - currentMonthTotals.expense))}
          </h2>
          <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm mt-2">
            <History className="w-4 h-4 mr-1" />
            <span>Acumulado de meses passados</span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">Entradas</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(currentMonthTotals.income)}</h2>
          <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm mt-2">
            <Plus className="w-4 h-4 mr-1" />
            <span>Entradas do mês</span>
          </div>
        </Card>

        <Card className="border-l-4 border-l-red-500 dark:bg-gray-900">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">Saídas</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(currentMonthTotals.expense)}</h2>
          <div className="flex items-center text-red-600 dark:text-red-400 text-sm mt-2">
            <Minus className="w-4 h-4 mr-1" />
            <span>Saídas do mês</span>
          </div>
        </Card>

        <Card className="bg-indigo-600 text-white border-none">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded-full">Saldo Total</span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold">{formatCurrency(totals.balance)}</h2>
          <p className="text-indigo-100 text-sm mt-2">Disponível para uso</p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <Card 
          title="Saídas por Categoria" 
          subtitle={`Referente a ${now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}`}
        >
          <div className="h-[250px] lg:h-[300px] w-full">
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {expenseByCategory.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                      color: isDark ? '#F3F4F6' : '#111827'
                    }}
                    itemStyle={{ color: isDark ? '#F3F4F6' : '#111827' }}
                  />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 italic">
                Nenhuma saída registrada
              </div>
            )}
          </div>
        </Card>

        <Card title="Entradas vs Saídas">
          <div className="h-[250px] lg:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }}
                />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    borderRadius: '12px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                    backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
                    color: isDark ? '#F3F4F6' : '#111827'
                  }}
                  itemStyle={{ color: isDark ? '#F3F4F6' : '#111827' }}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ paddingTop: '20px' }} />
                <Bar dataKey="entradas" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saídas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
