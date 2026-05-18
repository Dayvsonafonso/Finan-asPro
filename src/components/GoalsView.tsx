import React, { useState, useMemo } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Trophy, TrendingUp, Plus, Trash2, Edit2, Calendar, Target, PiggyBank, ArrowRightLeft } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export interface Goal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  deadline?: string;
  color: string;
}

const COLORS = [
  { name: 'Verde', hex: '#10b981' },
  { name: 'Índigo', hex: '#6366f1' },
  { name: 'Laranja', hex: '#f97316' },
  { name: 'Vermelho', hex: '#ef4444' },
  { name: 'Ciano', hex: '#06b6d4' },
  { name: 'Roxo', hex: '#a855f7' },
];

export function GoalsView() {
  const [goals, setGoals] = useLocalStorage<Goal[]>('financial_goals', [
    {
      id: '1',
      name: 'Reserva de Emergência',
      targetValue: 10000,
      currentValue: 3500,
      deadline: '2026-12-31',
      color: '#10b981',
    },
    {
      id: '2',
      name: 'Viagem dos Sonhos',
      targetValue: 5000,
      currentValue: 1200,
      deadline: '2026-08-15',
      color: '#6366f1',
    }
  ]);

  // Modals / Modos de Edição
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // State do Formulário
  const [name, setName] = useState('');
  const [targetValue, setTargetValue] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0].hex);

  // Depósito / Retirada Rápida
  const [activeFundGoal, setActiveFundGoal] = useState<Goal | null>(null);
  const [fundAction, setFundAction] = useState<'add' | 'remove'>('add');
  const [fundAmount, setFundAmount] = useState('');

  // Totais
  const totals = useMemo(() => {
    const saved = goals.reduce((sum, g) => sum + g.currentValue, 0);
    const target = goals.reduce((sum, g) => sum + g.targetValue, 0);
    const averagePercent = goals.length > 0 
      ? goals.reduce((sum, g) => sum + Math.min((g.currentValue / g.targetValue) * 100, 100), 0) / goals.length
      : 0;
    return { saved, target, averagePercent };
  }, [goals]);

  const handleOpenNew = () => {
    setEditingGoal(null);
    setName('');
    setTargetValue('');
    setCurrentValue('');
    setDeadline('');
    setSelectedColor(COLORS[0].hex);
    setIsOpenForm(true);
  };

  const handleOpenEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetValue(goal.targetValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setCurrentValue(goal.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setDeadline(goal.deadline || '');
    setSelectedColor(goal.color);
    setIsOpenForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Deseja realmente excluir esta meta?')) {
      setGoals(goals.filter(g => g.id !== id));
      toast.success('Meta excluída com sucesso!');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Preencha o nome da meta.');
    
    const parsedTarget = Number(targetValue.replace(/\./g, '').replace(',', '.'));
    const parsedCurrent = Number(currentValue.replace(/\./g, '').replace(',', '.'));

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      return toast.error('Defina um valor planejado válido.');
    }

    const goalData: Goal = {
      id: editingGoal ? editingGoal.id : crypto.randomUUID(),
      name: name.trim(),
      targetValue: parsedTarget,
      currentValue: isNaN(parsedCurrent) ? 0 : parsedCurrent,
      deadline: deadline || undefined,
      color: selectedColor
    };

    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? goalData : g));
      toast.success('Meta atualizada!');
    } else {
      setGoals([...goals, goalData]);
      toast.success('Meta criada com sucesso!');
    }
    setIsOpenForm(false);
  };

  const handleFundsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFundGoal) return;
    const amount = Number(fundAmount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return toast.error('Digite um valor válido.');

    const newCurrent = fundAction === 'add'
      ? activeFundGoal.currentValue + amount
      : Math.max(0, activeFundGoal.currentValue - amount);

    setGoals(goals.map(g => g.id === activeFundGoal.id ? { ...g, currentValue: newCurrent } : g));
    toast.success(fundAction === 'add' ? 'Valor guardado com sucesso!' : 'Valor retirado com sucesso!');
    setActiveFundGoal(null);
    setFundAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Gerenciamento de Metas</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Guarde dinheiro de forma focada para realizar seus objetivos.</p>
        </div>
        <Button onClick={handleOpenNew} className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-4 shadow-lg shadow-indigo-500/10">
          <Plus className="w-5 h-5" />
          <span>Nova Meta</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        <Card className="bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-100/50 dark:border-emerald-900/20 flex flex-col justify-between py-4">
          <div className="mb-3">
            <div className="inline-flex p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20 dark:shadow-emerald-950/40">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white truncate mb-1">
              {formatCurrency(totals.saved)}
            </h2>
            <div className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold truncate">
              Total Guardado
            </div>
          </div>
        </Card>

        <Card className="bg-indigo-50/30 dark:bg-indigo-950/20 border-indigo-100/50 dark:border-indigo-900/20 flex flex-col justify-between py-4">
          <div className="mb-3">
            <div className="inline-flex p-2.5 bg-indigo-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 dark:shadow-indigo-950/40">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white truncate mb-1">
              {formatCurrency(totals.target)}
            </h2>
            <div className="text-indigo-600 dark:text-indigo-400 text-xs sm:text-sm font-semibold truncate">
              Total Planejado
            </div>
          </div>
        </Card>

        <Card className="bg-orange-50/30 dark:bg-orange-950/20 border-orange-100/50 dark:border-orange-900/20 flex flex-col justify-between py-4">
          <div className="mb-3">
            <div className="inline-flex p-2.5 bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-500/20 dark:shadow-orange-950/40">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white truncate mb-1">
              {totals.averagePercent.toFixed(0)}%
            </h2>
            <div className="text-orange-600 dark:text-orange-400 text-xs sm:text-sm font-semibold truncate">
              Conclusão Média
            </div>
          </div>
        </Card>
      </div>

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map(goal => {
            const percent = goal.targetValue > 0 ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;
            const isCompleted = percent >= 100;
            
            return (
              <motion.div
                layout
                key={goal.id}
                style={{ borderColor: goal.color + '20' }}
                className="relative overflow-hidden p-5 rounded-2xl border bg-white dark:bg-gray-900 transition-colors flex flex-col justify-between h-[230px]"
              >
                {/* Glow circular de fundo */}
                <div 
                  className="absolute -right-6 -top-6 w-28 h-28 rounded-full blur-3xl opacity-[0.08] pointer-events-none" 
                  style={{ backgroundColor: goal.color }}
                />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <div 
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                        style={{ 
                          backgroundColor: goal.color, 
                          boxShadow: `0 8px 16px -3px ${goal.color}30` 
                        }}
                      >
                        <Trophy className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-gray-900 dark:text-white truncate text-base lg:text-lg">{goal.name}</h4>
                        {goal.deadline && (
                          <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            <Calendar className="w-3.5 h-3.5 mr-1" />
                            <span>Até {new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 shrink-0 relative z-10">
                      <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(goal)} className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(goal.id)} className="h-8 w-8 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xl lg:text-2xl font-black text-gray-900 dark:text-white">
                        {formatCurrency(goal.currentValue)}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        meta {formatCurrency(goal.targetValue)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span style={{ color: goal.color }}>
                          {percent.toFixed(1)}% concluído
                        </span>
                        {isCompleted && (
                          <span className="text-emerald-500 flex items-center">
                            Concluído! 🎉
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                        <div
                          className="h-3 rounded-full transition-all duration-700"
                          style={{ 
                            width: `${percent}%`, 
                            backgroundColor: goal.color,
                            boxShadow: `0 0 8px ${goal.color}40` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Add/Remove Buttons */}
                <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60">
                  <Button 
                    className="flex-1 text-xs py-1.5 h-8 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-lg border-none"
                    onClick={() => {
                      setActiveFundGoal(goal);
                      setFundAction('remove');
                    }}
                  >
                    Resgatar
                  </Button>
                  <Button 
                    style={{ backgroundColor: goal.color + '15', color: goal.color }}
                    className="flex-1 text-xs py-1.5 h-8 font-bold rounded-lg hover:brightness-95 border-none"
                    onClick={() => {
                      setActiveFundGoal(goal);
                      setFundAction('add');
                    }}
                  >
                    Guardar
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <Card className="p-10 text-center flex flex-col items-center justify-center space-y-4">
          <Trophy className="w-12 h-12 text-gray-400" />
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white">Nenhuma meta ativa</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Defina seus objetivos e comece a guardar dinheiro agora mesmo!</p>
          </div>
          <Button onClick={handleOpenNew} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 px-5">
            Começar Meta
          </Button>
        </Card>
      )}

      {/* Form Dialog/Modal */}
      <AnimatePresence>
        {isOpenForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpenForm(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100 dark:border-gray-800 z-10 transition-colors"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                {editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
              </h3>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Nome da Meta</label>
                  <Input 
                    placeholder="Ex: Viagem, Carro, Fundo..." 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Meta Desejada (R$)</label>
                    <Input 
                      placeholder="0,00" 
                      value={targetValue}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val) {
                          val = (Number(val) / 100).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          });
                        }
                        setTargetValue(val);
                      }}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Valor Inicial (R$)</label>
                    <Input 
                      placeholder="0,00" 
                      value={currentValue}
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val) {
                          val = (Number(val) / 100).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          });
                        }
                        setCurrentValue(val);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Data Limite (Opcional)</label>
                  <Input 
                    type="date"
                    value={deadline}
                    onChange={e => setDeadline(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Cor Temática</label>
                  <div className="flex items-center space-x-2 mt-1.5">
                    {COLORS.map(c => (
                      <button
                        type="button"
                        key={c.hex}
                        onClick={() => setSelectedColor(c.hex)}
                        style={{ backgroundColor: c.hex }}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          selectedColor === c.hex 
                            ? 'border-gray-900 dark:border-white scale-110 shadow-md' 
                            : 'border-transparent scale-100 hover:scale-105'
                        }`}
                        title={c.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800/80">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => setIsOpenForm(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
                  >
                    Salvar Meta
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fund Modals (Guardar / Resgatar Rápido) */}
      <AnimatePresence>
        {activeFundGoal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveFundGoal(null)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl relative border border-gray-100 dark:border-gray-800 z-10 transition-colors animate-in fade-in zoom-in-95 duration-200"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: activeFundGoal.color }}
                >
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    {fundAction === 'add' ? 'Guardar Dinheiro' : 'Resgatar Dinheiro'}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Meta: {activeFundGoal.name}</p>
                </div>
              </div>

              <form onSubmit={handleFundsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Qual o valor? (R$)</label>
                  <Input 
                    placeholder="0,00" 
                    value={fundAmount}
                    onChange={e => {
                      let val = e.target.value.replace(/\D/g, '');
                      if (val) {
                        val = (Number(val) / 100).toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });
                      }
                      setFundAmount(val);
                    }}
                    autoFocus
                    required
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex justify-between">
                    <span>Guardado atual: {formatCurrency(activeFundGoal.currentValue)}</span>
                    <span>Meta: {formatCurrency(activeFundGoal.targetValue)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800/80">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="flex-1"
                    onClick={() => setActiveFundGoal(null)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit" 
                    style={{ backgroundColor: activeFundGoal.color }}
                    className="flex-1 text-white hover:brightness-95 rounded-xl border-none"
                  >
                    Confirmar
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
