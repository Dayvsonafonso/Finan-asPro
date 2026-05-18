import { useState } from 'react';
import { ChevronLeft, Check, Palette, Smile, Shirt, Glasses, User as UserIcon } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface AvatarBuilderProps {
  initialUrl?: string;
  onSave: (url: string) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const TOPS = [
  { id: 'shortRound', label: 'Curto 1' },
  { id: 'shortFlat', label: 'Curto 2' },
  { id: 'shortWaved', label: 'Ondulado' },
  { id: 'dreads01', label: 'Dreads 1' },
  { id: 'dreads02', label: 'Dreads 2' },
  { id: 'frizzle', label: 'Crespo' },
  { id: 'shaggy', label: 'Despenteado' },
  { id: 'longHair', label: 'Longo' },
  { id: 'straight01', label: 'Liso 1' },
  { id: 'straight02', label: 'Liso 2' },
  { id: 'curly', label: 'Cacheado' },
  { id: 'bun', label: 'Coque' },
  { id: 'hat', label: 'Chapéu' },
  { id: 'hijab', label: 'Hijab' },
  { id: 'turban', label: 'Turbante' },
  { id: 'winterHat1', label: 'Touca' },
];

const EYES = [
  { id: 'default', label: 'Normal' },
  { id: 'happy', label: 'Feliz' },
  { id: 'wink', label: 'Piscando' },
  { id: 'surprised', label: 'Surpreso' },
  { id: 'squint', label: 'Semicerrado' },
  { id: 'hearts', label: 'Corações' },
  { id: 'eyeRoll', label: 'Tédio' },
  { id: 'dizzy', label: 'Tonto' },
  { id: 'close', label: 'Fechado' },
  { id: 'cry', label: 'Chorando' },
];

const MOUTHS = [
  { id: 'default', label: 'Normal' },
  { id: 'smile', label: 'Sorriso' },
  { id: 'serious', label: 'Sério' },
  { id: 'sad', label: 'Triste' },
  { id: 'grimace', label: 'Careta' },
  { id: 'eating', label: 'Comendo' },
  { id: 'disbelief', label: 'Descrente' },
  { id: 'screamOpen', label: 'Gritando' },
  { id: 'twang', label: 'Torcida' },
];

const CLOTHES = [
  { id: 'shirtCrewNeck', label: 'Camiseta' },
  { id: 'shirtVNeck', label: 'Gola V' },
  { id: 'shirtScoopNeck', label: 'Gola U' },
  { id: 'hoodie', label: 'Moletom' },
  { id: 'blazerAndShirt', label: 'Terno' },
  { id: 'blazerAndSweater', label: 'Blazer+Suéter' },
  { id: 'collarAndSweater', label: 'Suéter' },
  { id: 'overall', label: 'Macacão' },
  { id: 'graphicShirt', label: 'Estampada' },
];

const ACCESSORIES = [
  { id: '', label: 'Nenhum' },
  { id: 'kurt', label: 'Óculos Kurt' },
  { id: 'prescription01', label: 'Óculos Grau 1' },
  { id: 'prescription02', label: 'Óculos Grau 2' },
  { id: 'round', label: 'Óculos Redondo' },
  { id: 'sunglasses', label: 'Óculos Escuros' },
  { id: 'wayfarers', label: 'Wayfarers' },
];

const FACIAL_HAIR = [
  { id: '', label: 'Nenhum' },
  { id: 'beardMedium', label: 'Barba Média' },
  { id: 'beardLight', label: 'Barba Rala' },
  { id: 'beardMajestic', label: 'Barba Cheia' },
  { id: 'moustacheFancy', label: 'Bigode Fino' },
  { id: 'moustacheMagnum', label: 'Bigode Cheio' },
];

const SKIN_COLORS = [
  { id: 'FFDBB4', color: '#FFDBB4' },
  { id: 'EDB98A', color: '#EDB98A' },
  { id: 'F8D25C', color: '#F8D25C' },
  { id: 'FD9841', color: '#FD9841' },
  { id: 'D08B5B', color: '#D08B5B' },
  { id: 'AE5D29', color: '#AE5D29' },
  { id: '614335', color: '#614335' },
];

const HAIR_COLORS = [
  { id: '262E33', color: '#262E33' },
  { id: '4A3123', color: '#4A3123' },
  { id: '724133', color: '#724133' },
  { id: 'A55728', color: '#A55728' },
  { id: 'B58143', color: '#B58143' },
  { id: 'E6D38B', color: '#E6D38B' },
  { id: 'CA4420', color: '#CA4420' },
  { id: 'ECDCBF', color: '#ECDCBF' },
  { id: 'E8E1E1', color: '#E8E1E1' },
  { id: 'F59797', color: '#F59797' },
];

type Tab = 'appearance' | 'face' | 'clothes' | 'accessories';

export function AvatarBuilder({ onSave, onCancel, isSaving }: AvatarBuilderProps) {
  const [activeTab, setActiveTab] = useState<Tab>('appearance');
  
  // Avatar state
  const [skinColor, setSkinColor] = useState('EDB98A');
  const [top, setTop] = useState('shortRound');
  const [hairColor, setHairColor] = useState('4A3123');
  const [eyes, setEyes] = useState('default');
  const [mouth, setMouth] = useState('smile');
  const [clothes, setClothes] = useState('hoodie');
  const [accessories, setAccessories] = useState('');
  const [facialHair, setFacialHair] = useState('');

  // Generate URL based on current state
  const generateUrl = () => {
    let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=custom&backgroundColor=transparent`;
    url += `&skinColor=${skinColor}`;
    url += `&top=${top}`;
    if (!['hat', 'winterHat1', 'hijab', 'turban'].includes(top)) {
      url += `&hairColor=${hairColor}`;
    }
    url += `&eyes=${eyes}`;
    url += `&mouth=${mouth}`;
    url += `&clothes=${clothes}`;
    if (accessories) url += `&accessories=${accessories}`;
    if (facialHair) {
      url += `&facialHair=${facialHair}&facialHairColor=${hairColor}`;
    }
    return url;
  };

  const previewUrl = generateUrl();

  const handleSave = () => {
    onSave(previewUrl);
  };

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="flex justify-center">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-indigo-50 dark:bg-indigo-900/20 border-4 border-white dark:border-gray-800 shadow-xl overflow-hidden">
          <img src={previewUrl} alt="Preview" className="w-full h-full object-cover transition-all" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('appearance')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
            activeTab === 'appearance' ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Aparência</span>
        </button>
        <button
          onClick={() => setActiveTab('face')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
            activeTab === 'face' ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          <Smile className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Rosto</span>
        </button>
        <button
          onClick={() => setActiveTab('clothes')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
            activeTab === 'clothes' ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          <Shirt className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Roupa</span>
        </button>
        <button
          onClick={() => setActiveTab('accessories')}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all",
            activeTab === 'accessories' ? "bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          )}
        >
          <Glasses className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Acessórios</span>
        </button>
      </div>

      {/* Editor Content */}
      <div className="h-[280px] overflow-y-auto scrollbar-thin pr-2 space-y-6">
        {activeTab === 'appearance' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Skin */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tom de Pele</label>
              <div className="flex flex-wrap gap-2">
                {SKIN_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setSkinColor(color.id)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                      skinColor === color.id ? "border-indigo-600 scale-110 shadow-md" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.color }}
                  />
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cor do Cabelo</label>
              <div className="flex flex-wrap gap-2">
                {HAIR_COLORS.map(color => (
                  <button
                    key={color.id}
                    onClick={() => setHairColor(color.id)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all cursor-pointer",
                      hairColor === color.id ? "border-indigo-600 scale-110 shadow-md" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: color.color }}
                  />
                ))}
              </div>
            </div>

            {/* Hair Style */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cabelo / Cabeça</label>
              <div className="grid grid-cols-2 gap-2">
                {TOPS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setTop(item.id)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg transition-all text-left",
                      top === item.id 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" 
                        : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'face' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Eyes */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Olhos</label>
              <div className="grid grid-cols-2 gap-2">
                {EYES.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setEyes(item.id)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg transition-all text-left",
                      eyes === item.id 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" 
                        : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mouth */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Boca</label>
              <div className="grid grid-cols-2 gap-2">
                {MOUTHS.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setMouth(item.id)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg transition-all text-left",
                      mouth === item.id 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" 
                        : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clothes' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roupas</label>
              <div className="grid grid-cols-2 gap-2">
                {CLOTHES.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setClothes(item.id)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg transition-all text-left",
                      clothes === item.id 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" 
                        : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accessories' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Accessories */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Óculos / Acessórios</label>
              <div className="grid grid-cols-2 gap-2">
                {ACCESSORIES.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setAccessories(item.id)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg transition-all text-left",
                      accessories === item.id 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" 
                        : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Facial Hair */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Barba / Bigode</label>
              <div className="grid grid-cols-2 gap-2">
                {FACIAL_HAIR.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setFacialHair(item.id)}
                    className={cn(
                      "px-3 py-2 text-xs font-medium rounded-lg transition-all text-left",
                      facialHair === item.id 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800" 
                        : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    )}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold"
        >
          {isSaving ? 'Salvando...' : 'Salvar Avatar'}
        </Button>
      </div>
    </div>
  );
}
