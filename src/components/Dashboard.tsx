import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Plus, Minus, History, Target } from 'lucide-react';
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

  const getFontSizeClass = (value: number) => {
    const formatted = formatCurrency(value);
    const digits = formatted.replace(/\D/g, '').length;
    if (digits < 7) {
      return 'text-xl lg:text-2xl';
    }
    if (digits >= 9) {
      return 'text-sm sm:text-xl lg:text-2xl';
    }
    return 'text-base sm:text-xl lg:text-2xl';
  };

  const totalBudget = categories.reduce((acc, cat) => acc + (Number(cat.budget) || 0), 0);
  const usedBudget = categories.reduce((acc, cat) => {
    const spent = currentMonthTransactions
      .filter(t => t.type === 'expense' && t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0);
    return acc + spent;
  }, 0);

  const remainingToPay = categories.reduce((acc, cat) => {
    const budget = Number(cat.budget) || 0;
    if (budget === 0) return acc;
    const spent = currentMonthTransactions
      .filter(t => t.type === 'expense' && t.category === cat.name)
      .reduce((sum, t) => sum + t.amount, 0);
    return acc + Math.max(0, budget - spent);
  }, 0);

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
      "Entradas": monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
      "Saídas": monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    };
  });

  const areaData = last6Months.map(({ month, year, label }) => {
    const accumulatedTransactions = transactions.filter(t => {
      const [tYear, tMonth] = t.date.split('-').map(Number);
      if (tYear < year) return true;
      if (tYear === year && (tMonth - 1) <= month) return true;
      return false;
    });

    const income = accumulatedTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = accumulatedTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    return {
      name: label,
      "Saldo": income - expense,
    };
  });

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        <Card className="bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-900/20 py-3 lg:py-5">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 dark:shadow-indigo-950/40 shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white leading-tight">{formatCurrency(totals.balance)}</h2>
              <div className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-semibold truncate mt-1">
                Saldo Total
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <Card className="bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/20 flex flex-col justify-between">
          <div className="mb-3 lg:mb-4">
            <div className="inline-flex p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 dark:shadow-emerald-950/40">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
          <div>
            <h2 className={`font-bold text-gray-900 dark:text-white truncate mb-1 ${getFontSizeClass(currentMonthTotals.income)}`}>
              {formatCurrency(currentMonthTotals.income)}
            </h2>
            <div className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold truncate">
              + Entradas do Mês
            </div>
          </div>
        </Card>

        <Card className="bg-red-50/30 dark:bg-red-950/20 border-red-100/50 dark:border-red-900/20 flex flex-col justify-between">
          <div className="mb-3 lg:mb-4">
            <div className="inline-flex p-2 bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/20 dark:shadow-red-950/40">
              <TrendingDown className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
          <div>
            <h2 className={`font-bold text-gray-900 dark:text-white truncate mb-1 ${getFontSizeClass(currentMonthTotals.expense)}`}>
              {formatCurrency(currentMonthTotals.expense)}
            </h2>
            <div className="text-red-600 dark:text-red-400 text-xs sm:text-sm font-semibold truncate">
              - Saídas do Mês
            </div>
          </div>
        </Card>

        <Card className="bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-900/20 flex flex-col justify-between">
          <div className="mb-3 lg:mb-4">
            <div className="inline-flex p-2 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 dark:shadow-indigo-950/40">
              <History className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
          <div>
            <h2 className={`font-bold text-gray-900 dark:text-white truncate mb-1 ${getFontSizeClass(totals.balance - (currentMonthTotals.income - currentMonthTotals.expense))}`}>
              {formatCurrency(totals.balance - (currentMonthTotals.income - currentMonthTotals.expense))}
            </h2>
            <div className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-semibold truncate">
              Saldo Acumulado
            </div>
          </div>
        </Card>

        <Card className="bg-orange-50/30 dark:bg-orange-950/20 border-orange-100/50 dark:border-orange-900/20 flex flex-col justify-between">
          <div className="mb-3 lg:mb-4">
            <div className="inline-flex p-2 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 dark:shadow-orange-950/40">
              <Target className="w-4 h-4 lg:w-5 lg:h-5" />
            </div>
          </div>
          <div>
            <h2 className={`font-bold text-gray-900 dark:text-white truncate mb-1 ${getFontSizeClass(remainingToPay)}`}>
              {formatCurrency(remainingToPay)}
            </h2>
            <div className="text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-semibold truncate">
              A Pagar
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <Card
          title="Saídas por Categoria"
          subtitle={`Referente a ${now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}`}
        >
          <div style={{ height: '250px' }} className="w-full">
            {expenseByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie
                    data={expenseByCategory}
                    cx="50%"
                    cy="40%"
                    innerRadius={50}
                    outerRadius={70}
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
                  <Legend verticalAlign="bottom" wrapperStyle={{ marginTop: '-20px' }} />
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
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
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
                <Bar dataKey="Entradas" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saídas" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Histórico do Saldo Acumulado */}
        <div className="lg:col-span-2">
          <Card
            title="Evolução do Saldo Acumulado"
            subtitle="Histórico do saldo disponível ao final de cada mês"
          >
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: isDark ? '#9CA3AF' : '#6B7280' }}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
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
                  <Area
                    type="monotone"
                    dataKey="Saldo"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorBalance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
