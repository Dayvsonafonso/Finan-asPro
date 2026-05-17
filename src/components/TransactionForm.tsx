import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Transaction, Category } from '../types';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';

const schema = z.object({
  description: z.string().min(3, 'Descrição deve ter pelo menos 3 caracteres'),
  amount: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = Number(val.replace(/\./g, '').replace(',', '.'));
      return isNaN(parsed) ? 0 : parsed;
    }
    return val;
  }).refine((val) => val >= 0.01, 'Valor deve ser maior que zero'),
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, 'Selecione uma categoria'),
  otherDescription: z.string().optional(),
  date: z.string().min(1, 'Selecione uma data'),
  isFixed: z.boolean().optional(),
  totalInstallments: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().min(1).optional()),
  currentInstallment: z.preprocess((val) => (val === '' ? undefined : val), z.coerce.number().min(1).optional()),
  isPaid: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

interface TransactionFormProps {
  onSubmit: (data: any) => void;
  initialData?: Partial<Transaction>;
  categories: Category[];
  onCancel: () => void;
}

export function TransactionForm({ onSubmit, initialData, categories, onCancel }: TransactionFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: initialData?.description || '',
      amount: initialData?.amount !== undefined ? initialData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      type: (initialData?.type as 'income' | 'expense') || 'expense',
      category: initialData?.category || '',
      otherDescription: '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
      isFixed: initialData?.isFixed || false,
      totalInstallments: initialData?.totalInstallments || '',
      currentInstallment: initialData?.currentInstallment || '',
      isPaid: initialData?.isPaid || false,
    },
  });

  const selectedCategory = watch('category');

  const handleFormSubmit = (data: any) => {
    const finalData = { ...data };
    if (data.category === 'Outros' && data.otherDescription) {
      finalData.description = `${data.otherDescription} - ${data.description}`;
    }
    
    // Only keep installment info if category is Faturas
    if (data.category !== 'Faturas') {
      delete finalData.totalInstallments;
      delete finalData.currentInstallment;
      delete finalData.isPaid;
    }

    delete finalData.otherDescription;
    onSubmit(finalData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input label="Descrição" {...register('description')} error={errors.description?.message} placeholder="Ex: Aluguel, Salário..." />
        </div>
        
        <Input 
          label="Valor (R$)" 
          type="text" 
          {...register('amount')} 
          onChange={(e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value) {
              e.target.value = (Number(value) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            }
            register('amount').onChange(e);
          }}
          error={errors.amount?.message}
          placeholder="0,00"
        />
        
        <Select 
          label="Tipo" 
          {...register('type')} 
          error={errors.type?.message}
          options={[
            { value: 'expense', label: 'Saída' },
            { value: 'income', label: 'Entrada' },
          ]}
        />

        <Select 
          label="Categoria" 
          {...register('category')} 
          error={errors.category?.message}
          options={[
            { value: '', label: 'Selecione...' },
            ...categories.map(c => ({ value: c.name, label: c.name }))
          ]}
        />

        <Input label="Data" type="date" {...register('date')} error={errors.date?.message} />

        {selectedCategory === 'Outros' && (
          <div className="sm:col-span-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <Input 
              label="Especifique o que foi (Outros)" 
              {...register('otherDescription')} 
              placeholder="Ex: Presente, Reembolso..." 
              error={errors.otherDescription?.message}
            />
          </div>
        )}

        {selectedCategory === 'Faturas' && (
          <div className="sm:col-span-2 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <Input 
              label="Parcela Atual" 
              type="number"
              {...register('currentInstallment')} 
              placeholder="Ex: 1" 
              error={errors.currentInstallment?.message}
            />
            <Input 
              label="Total de Parcelas" 
              type="number"
              {...register('totalInstallments')} 
              placeholder="Ex: 12" 
              error={errors.totalInstallments?.message}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="isFixed" {...register('isFixed')} className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="isFixed" className="text-sm font-medium text-gray-700 dark:text-gray-300">Lançamento fixo mensal</label>
        </div>

        {selectedCategory === 'Faturas' && (
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="isPaid" {...register('isPaid')} className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-indigo-600 focus:ring-indigo-500" />
            <label htmlFor="isPaid" className="text-sm font-medium text-gray-700 dark:text-gray-300">Já está paga?</label>
          </div>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit">Salvar Lançamento</Button>
      </div>
    </form>
  );
}
