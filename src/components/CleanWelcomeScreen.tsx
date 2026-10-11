import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface CleanWelcomeScreenProps {
  onEnter: () => void;
  hasManager: boolean;
  managerName?: string;
  accentColor?: string;
}

export const CleanWelcomeScreen: React.FC<CleanWelcomeScreenProps> = ({
  onEnter,
  hasManager,
  managerName,
  accentColor = 'indigo',
}) => {
  const getAccentBtn = () => {
    switch (accentColor) {
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 focus:ring-emerald-500/20';
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 focus:ring-blue-500/20';
      case 'amber':
        return 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 focus:ring-amber-500/20';
      case 'violet':
        return 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700 focus:ring-violet-500/20';
      case 'rose':
        return 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 focus:ring-rose-500/20';
      default:
        return 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 focus:ring-indigo-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white selection:bg-indigo-500 selection:text-white">
      {/* Detalhes sutis de iluminação ambiente */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm flex flex-col items-center text-center">
        {/* Logotipo / Sigla CFC */}
        <div className="w-16 h-16 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black text-2xl tracking-tighter flex items-center justify-center shadow-lg shadow-slate-900/10 dark:shadow-none mb-6 select-none transition-transform hover:scale-105 duration-300">
          CFC
        </div>

        {/* Bloco de Texto Limpo */}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Controle Funcionário Completo
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 mb-8 max-w-xs">
          Gestão de Pessoal, Prazos de Experiência e Controle de Férias CLT
        </p>

        {/* Identificação sutil se já houver gestor cadastrado */}
        {hasManager && managerName && (
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Gestor: <strong>{managerName}</strong></span>
          </div>
        )}

        {/* Botão Central Simples para Entrar no Aplicativo */}
        <button
          type="button"
          onClick={onEnter}
          className={`w-full py-3.5 px-6 rounded-2xl text-white font-semibold text-sm shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 group hover:shadow-lg focus:outline-hidden focus:ring-4 ${getAccentBtn()}`}
        >
          <span>Entrar no Aplicativo</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};
