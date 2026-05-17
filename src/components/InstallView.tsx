import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Smartphone, Chrome, Compass, Share2, Plus, Download, ShieldAlert, Award } from 'lucide-react';

export function InstallView() {
  const [platform, setPlatform] = useState<'android' | 'ios'>('android');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Platform Selector Buttons */}
      <div className="bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex gap-3 transition-colors duration-300">
        <button
          onClick={() => setPlatform('android')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            platform === 'android'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Smartphone className="w-5 h-5" />
          <span>Android (Chrome)</span>
        </button>
        
        <button
          onClick={() => setPlatform('ios')}
          className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
            platform === 'ios'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg dark:shadow-white/10'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          <Smartphone className="w-5 h-5 animate-pulse" />
          <span>iOS / iPhone (Safari)</span>
        </button>
      </div>

      {/* Main Guide Card */}
      <Card className="p-6 sm:p-8 relative overflow-hidden">
        {/* Glow effect in background */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
        
        <div className="flex items-center space-x-4 mb-6">
          <div className={`p-3 rounded-2xl ${platform === 'android' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
            <Download className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Instalar o Meu Bolso</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tenha acesso rápido e em tela cheia direto do celular</p>
          </div>
        </div>

        {platform === 'android' ? (
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                01
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Abra no Google Chrome</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                  Abra o link do site no navegador oficial 
                  <Chrome className="w-4 h-4 text-emerald-500 mx-1.5 inline" /> 
                  Google Chrome.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                02
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Abra o Menu de Opções</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Toque nos <span className="font-black text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">três pontinhos (⋮)</span> localizados no canto superior direito do Chrome.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                03
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Selecione Instalar</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Procure e toque na opção <span className="font-bold text-emerald-600 dark:text-emerald-400">"Adicionar à tela inicial"</span> ou <span className="font-bold text-emerald-600 dark:text-emerald-400">"Instalar aplicativo"</span>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm">
                04
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Prontinho!</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Confirme em <span className="font-bold text-gray-900 dark:text-white">Instalar</span>. O aplicativo agora aparecerá na sua tela inicial com o ícone 3D premium do Meu Bolso!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                01
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Abra no Navegador Safari</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                  Abra o link obrigatoriamente no navegador 
                  <Compass className="w-4 h-4 text-indigo-500 mx-1.5 inline" /> 
                  Safari (o sistema iOS da Apple só permite a instalação via Safari).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                02
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Toque em Compartilhar</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                  Toque no ícone de 
                  <Share2 className="w-4 h-4 text-indigo-500 mx-1.5 inline" /> 
                  <strong>Compartilhar</strong> (o quadrado com uma seta para cima na barra inferior do Safari).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                03
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Adicionar à Tela de Início</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 flex items-center">
                  Desça o menu de opções e clique em 
                  <Plus className="w-4 h-4 text-indigo-500 mx-1.5 inline bg-gray-100 dark:bg-gray-800 rounded" /> 
                  <strong>"Adicionar à Tela de Início"</strong>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm">
                04
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Finalizar</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Toque em <span className="font-bold text-gray-900 dark:text-white">"Adicionar"</span> no canto superior direito. Pronto! O app aparecerá instalado na tela inicial do seu iPhone!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Alert Section */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/60 flex items-start space-x-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl">
          <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-sm text-indigo-900 dark:text-indigo-300">Por que instalar?</h5>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 mt-1 leading-relaxed">
              O aplicativo instalado (PWA) é incrivelmente leve, economiza dados móveis, carrega de forma super veloz e abre em <strong>tela cheia sem as barras do navegador</strong>. A sensação é de estar usando um aplicativo nativo baixado na loja!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
