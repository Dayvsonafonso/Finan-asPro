import { useState } from 'react';
import { 
  LayoutDashboard, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  PlusCircle, 
  Settings, 
  Menu, 
  X,
  LogOut,
  User as UserIcon,
  ChevronRight,
  FileText,
  Sun,
  Moon,
  Target,
  Smartphone,
  ShieldCheck,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { useFinance } from './hooks/useFinance';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { FaturasView } from './components/FaturasView';
import { TransactionForm } from './components/TransactionForm';
import { BudgetView } from './components/BudgetView';
import { InstallView } from './components/InstallView';
import { GoalsView } from './components/GoalsView';
import { AdminPanel } from './components/AdminPanel';
import { Auth } from './components/Auth';
import { Modal } from './components/ui/Modal';
import { Button } from './components/ui/Button';
import { Transaction } from './types';
import { cn } from './lib/utils';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import { useActivityTracker } from './hooks/useActivityTracker';
import { supabase } from './lib/supabase';

type View = 'dashboard' | 'transactions' | 'faturas' | 'admin' | 'budget' | 'goals' | 'install';

export default function App() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  useActivityTracker();
  const { 
    transactions, 
    categories, 
    totals, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    updateCategory
  } = useFinance();

  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  const handleOpenModal = (transaction?: Transaction) => {
    if (transaction) setEditingTransaction(transaction);
    else setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleTransactionSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
        toast.success('Lançamento atualizado com sucesso!');
      } else {
        await addTransaction(data);
        toast.success('Lançamento adicionado com sucesso!');
      }
      handleCloseModal();
    } catch (error: any) {
      console.error('Submit error:', error);
      if (error?.message?.includes('relation "transactions" does not exist')) {
        toast.error('Erro: A tabela "transactions" não existe no seu banco de dados Supabase.');
      } else {
        toast.error('Erro ao salvar lançamento: ' + (error?.message || 'Erro desconhecido'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success('Lançamento excluído com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + (error?.message || 'Erro desconhecido'));
    }
  };

  const handleTogglePaid = async (t: Transaction) => {
    try {
      if (t.totalInstallments && t.currentInstallment) {
        if (t.currentInstallment < t.totalInstallments) {
          const nextInstallment = t.currentInstallment + 1;
          await updateTransaction(t.id, { 
            currentInstallment: nextInstallment,
            isPaid: false 
          });
          toast.success(`Parcela ${t.currentInstallment} paga! Avançou para ${nextInstallment}/${t.totalInstallments}`);
        } else {
          // Last installment
          await updateTransaction(t.id, { 
            isPaid: true 
          });
          toast.success('Última parcela paga! Fatura concluída.');
        }
      } else {
        await updateTransaction(t.id, { isPaid: !t.isPaid });
        toast.success(t.isPaid ? 'Fatura marcada como pendente' : 'Fatura marcada como paga');
      }
    } catch (error) {
      toast.error('Erro ao atualizar status da fatura');
    }
  };

  const isAdmin = user?.email === 'dayvsonafonsoo@gmail.com' || user?.email === 'dayvsonafonsodd@gmail.com' || user?.email === 'afonso.william@gmail.com';

  // Redirect if not admin and trying to access admin panel
  if (currentView === 'admin' && !isAdmin) {
    setCurrentView('dashboard');
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Usuário';
  const avatarUrl = user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'default')}`;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Lançamentos', icon: ArrowUpCircle },
    { id: 'faturas', label: 'Faturas', icon: FileText },
    { id: 'budget', label: 'Orçamentos', icon: Target },
    { id: 'goals', label: 'Minhas Metas', icon: Trophy },
    { id: 'install', label: 'Como Instalar', icon: Smartphone },
    ...(isAdmin ? [{ id: 'admin', label: 'ADM', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      <Toaster position="top-right" richColors theme={theme} />
      
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-6 sticky top-0 h-screen transition-colors duration-300">
        <div className="flex items-center justify-between mb-6 lg:mb-10 px-2">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity active:scale-[0.98] text-left border-none bg-transparent p-0 outline-none"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Meu<span className="text-indigo-600">Bolso</span></h1>
          </button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                currentView === item.id 
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold" 
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5",
                currentView === item.id ? "text-indigo-600 dark:text-indigo-400" : "text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
              )} />
              <span>{item.label}</span>
              {currentView === item.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-3 px-2 mb-6">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
              <img 
                src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'default')}`} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Plano Gratuito</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
            onClick={() => signOut()}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sair da conta
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 z-40 transition-colors duration-300">
        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity active:scale-[0.98] border-none bg-transparent p-0 outline-none"
        >
          <PlusCircle className="w-6 h-6 text-indigo-600" />
          <span className="font-bold text-lg dark:text-white">MeuBolso</span>
        </button>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5 text-gray-600" /> : <Sun className="w-5 h-5 text-amber-400" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6 dark:text-gray-300" />
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-900 z-50 p-6 flex flex-col lg:hidden shadow-2xl transition-colors duration-300"
            >
              <div className="flex items-center justify-between mb-6 lg:mb-10">
                <button
                  onClick={() => {
                    setCurrentView('dashboard');
                    setIsSidebarOpen(false);
                  }}
                  className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity active:scale-[0.98] border-none bg-transparent p-0 outline-none"
                >
                  <PlusCircle className="w-6 h-6 text-indigo-600" />
                  <span className="font-bold text-lg dark:text-white">MeuBolso</span>
                </button>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                  <X className="w-6 h-6 dark:text-gray-300" />
                </Button>
              </div>
              <nav className="flex-1 space-y-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id as View);
                      setIsSidebarOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all",
                      currentView === item.id 
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-semibold" 
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    )}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </nav>

              <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3 px-2 mb-6">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 overflow-hidden border-2 border-white dark:border-gray-800 shadow-sm">
                    <img 
                      src={user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.email || 'default')}`} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                      {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Plano Gratuito</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sair da conta
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-24 lg:pt-10 px-4 lg:px-10 pb-10 max-w-7xl mx-auto w-full">
        <header className="flex flex-row items-center justify-between mb-6 lg:mb-10 gap-4">
          {currentView === 'dashboard' ? (
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-500 dark:border-gray-400 shadow-sm flex-shrink-0">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col">
                <h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                  Olá, {displayName}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-lg lg:text-xl font-medium">
                  {getGreeting()}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                {currentView === 'transactions' && 'Meus Lançamentos'}
                {currentView === 'faturas' && 'Minhas Faturas'}
                {currentView === 'budget' && 'Orçamento Mensal'}
                {currentView === 'goals' && 'Minhas Metas'}
                {currentView === 'admin' && 'Painel ADM'}
                {currentView === 'install' && 'Instalar Aplicativo'}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm lg:text-base">
                {currentView === 'transactions' && 'Gerencie suas entradas e saídas detalhadamente.'}
                {currentView === 'faturas' && 'Acompanhe suas parcelas e pagamentos pendentes.'}
                {currentView === 'budget' && 'Distribua sua renda e defina limites de gastos por categoria.'}
                {currentView === 'goals' && 'Guarde dinheiro de forma focada para realizar seus sonhos.'}
                {currentView === 'admin' && 'Gerencie e monitore os usuários da plataforma.'}
              </p>
            </div>
          )}
          <div className="flex items-center space-x-3">
            {['dashboard', 'transactions', 'faturas', 'budget'].includes(currentView) && (
              <Button onClick={() => handleOpenModal()} className="w-14 h-14 rounded-full p-0 flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 flex-shrink-0">
                <PlusCircle className="w-7 h-7" />
              </Button>
            )}
            {currentView === 'goals' && (
              <Button 
                onClick={() => window.dispatchEvent(new CustomEvent('open-new-goal-modal'))} 
                className="w-14 h-14 rounded-full p-0 flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white border-none"
              >
                <PlusCircle className="w-7 h-7" />
              </Button>
            )}
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {currentView === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              categories={categories} 
              totals={totals} 
            />
          )}
          {currentView === 'transactions' && (
            <TransactionList 
              transactions={transactions} 
              categories={categories} 
              onDelete={handleDeleteTransaction}
              onEdit={handleOpenModal}
              onTogglePaid={handleTogglePaid}
            />
          )}

          {currentView === 'faturas' && (
            <FaturasView 
              transactions={transactions} 
              categories={categories} 
              onDelete={handleDeleteTransaction}
              onEdit={handleOpenModal}
              onTogglePaid={handleTogglePaid}
            />
          )}
          {currentView === 'budget' && (
            <BudgetView 
              categories={categories}
              transactions={transactions}
              onUpdateCategory={updateCategory}
            />
          )}
          {currentView === 'goals' && (
            <GoalsView />
          )}
          {currentView === 'install' && (
            <InstallView />
          )}
          {currentView === 'admin' && (
            <AdminPanel />
          )}
        </div>
      </main>

      {/* Transaction Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
      >
        <div className={cn(isSubmitting && "opacity-50 pointer-events-none transition-opacity")}>
          <TransactionForm 
            onSubmit={handleTransactionSubmit}
            initialData={editingTransaction || undefined}
            categories={categories}
            onCancel={handleCloseModal}
          />
        </div>
      </Modal>
    </div>
  );
}
