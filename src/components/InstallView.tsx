import React, { useState } from 'react';
import { Card } from './ui/Card';
import { Smartphone, Download, Award } from 'lucide-react';

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
        
        <div className="flex items-center space-x-4 mb-8">
          <div className={`p-3 rounded-2xl ${platform === 'android' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
            <Download className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Instalar o Carteira Fácil</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tenha acesso rápido e em tela cheia direto do celular</p>
          </div>
        </div>

        {platform === 'android' ? (
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm mt-0.5">
                01
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Abra no Google Chrome</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Abra o link do aplicativo utilizando o navegador oficial <strong>Google Chrome</strong> no seu aparelho Android.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm mt-0.5">
                02
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Abra o Menu de Opções</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Toque no ícone de <strong>três pontinhos (⋮)</strong> localizado no canto superior direito do seu navegador.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm mt-0.5">
                03
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Selecione Instalar</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Procure na lista e toque na opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm mt-0.5">
                04
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Confirmar</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Toque em <strong>"Instalar"</strong> na janela que aparecer. O app <strong>Carteira Fácil</strong> será adicionado à sua tela inicial de aplicativos instantaneamente!
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm mt-0.5">
                01
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Abra no Navegador Safari</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Abra o link obrigatoriamente no navegador <strong>Safari</strong> do iPhone (o sistema iOS da Apple só permite instalar novos aplicativos se abertos pelo Safari).
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm mt-0.5">
                02
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Toque em Compartilhar</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Na barra inferior do Safari, toque no botão de <strong>Compartilhar</strong> (o ícone com o desenho de um quadrado com uma seta apontando para cima).
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm mt-0.5">
                03
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Adicionar à Tela de Início</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Role a lista de opções para baixo e clique em <strong>"Adicionar à Tela de Início"</strong> (identificado com um sinal de mais <strong>+</strong>).
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm mt-0.5">
                04
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-800 dark:text-gray-200">Confirmar e Concluir</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  Toque em <strong>"Adicionar"</strong> no canto superior direito da tela. Pronto! O app aparecerá instalado na tela inicial do seu iPhone!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Alert Section */}
        <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800/60 flex items-start space-x-3 bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-2xl">
          <Award className="w-6 h-6 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-sm text-indigo-900 dark:text-indigo-300">Por que instalar?</h5>
            <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 mt-1 leading-relaxed">
              O aplicativo instalado (PWA) é extremamente leve, economiza internet, carrega de forma instantânea e abre em <strong>tela cheia sem as barras do navegador</strong>. A sensação é de estar usando um aplicativo nativo baixado na App Store ou Google Play!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
