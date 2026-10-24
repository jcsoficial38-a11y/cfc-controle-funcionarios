import React from 'react';
import { ManagerProfile } from '../types';
import { Plus, Menu } from 'lucide-react';

interface CFCHeaderProps {
  manager: ManagerProfile | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLock: () => void;
  onOpenNewEmployee: () => void;
  onOpenSidebar: () => void;
  onSaveData: () => void;
}

export const CFCHeader: React.FC<CFCHeaderProps> = ({
  manager,
  onOpenNewEmployee,
  onOpenSidebar,
  onSaveData,
}) => {
  const getAccentBtn = () => {
    switch (manager?.accentColor) {
      case 'emerald':
        return 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700';
      case 'blue':
        return 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700';
      case 'amber':
        return 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700';
      case 'violet':
        return 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700';
      case 'rose':
        return 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700';
      default:
        return 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Esquerda: Botão do Menu Lateral (Hamburger) e Logotipo/Título */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenSidebar}
            title="Abrir Menu Lateral"
            aria-label="Abrir Menu Lateral"
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs sm:text-sm tracking-tighter flex items-center justify-center shadow-xs select-none shrink-0">
            CFC
          </div>
          <div className="min-w-0">
            <span className="font-bold text-xs sm:text-base text-slate-900 dark:text-white tracking-tight block leading-tight truncate">
              Controle Funcionário Completo
            </span>
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 leading-none mt-0.5 hidden sm:block">
              Gestão de Equipe &middot; Agenda e Férias CLT
            </p>
          </div>
        </div>

        {/* Direita: Botão de Salvar Dados e Adicionar Funcionário */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onSaveData}
            title="Salvar dados agora e baixar arquivo de backup inteligente"
            aria-label="Salvar Dados"
            className="h-9 px-2.5 sm:px-3.5 rounded-xl border border-emerald-300 dark:border-emerald-700/80 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold transition-all active:scale-95 cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
          >
            <span className="text-sm">💾</span>
            <span className="hidden sm:inline">Salvar Dados</span>
            <span className="inline sm:hidden">Salvar</span>
          </button>

          <button
            type="button"
            onClick={onOpenNewEmployee}
            title="Cadastrar Novo Funcionário"
            aria-label="Cadastrar Novo Funcionário"
            className={`h-9 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-white ${getAccentBtn()} shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Adicionar Funcionário</span>
            <span className="inline sm:hidden">Novo</span>
          </button>
        </div>
      </div>
    </header>
  );
};
