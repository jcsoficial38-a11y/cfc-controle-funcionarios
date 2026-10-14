import React from 'react';
import { ManagerProfile } from '../types';
import { Plus, Sun, Moon, Lock, Settings, Cloud } from 'lucide-react';

interface CFCHeaderProps {
  manager: ManagerProfile | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLock: () => void;
  onOpenNewEmployee: () => void;
  onOpenManagerSettings: () => void;
  isCloudConnected?: boolean;
}

export const CFCHeader: React.FC<CFCHeaderProps> = ({
  manager,
  darkMode,
  onToggleDarkMode,
  onLock,
  onOpenNewEmployee,
  onOpenManagerSettings,
  isCloudConnected,
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
        {/* Canto Superior Esquerdo: Logotipo/Sigla estilizada "CFC" e bloco de texto limpo */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
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

        {/* Canto Superior Direito: Botão Adicionar Funcionário e Acesso ao Painel do Perfil/Configurações do Gestor */}
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          {/* Alternar Tema */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            aria-label="Alternar Tema Claro/Escuro"
            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Bloquear com Segurança (Opcional/Discreto) */}
          <button
            type="button"
            onClick={onLock}
            title="Bloquear Acesso"
            aria-label="Bloquear Acesso"
            className="p-1.5 sm:p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Lock className="w-4 h-4 text-slate-500 dark:text-slate-400" />
          </button>

          {/* Indicador de Nuvem / Firestore Conectado */}
          {isCloudConnected && (
            <button
              type="button"
              onClick={onOpenManagerSettings}
              title="Banco de Dados Firestore Conectado & Sincronizado Online"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Nuvem Ativa</span>
            </button>
          )}

          {/* Botão de Perfil / Configurações do Gestor */}
          <button
            type="button"
            onClick={onOpenManagerSettings}
            title="Perfil do Gestor & Configurações"
            aria-label="Perfil do Gestor e Configurações"
            className="flex items-center gap-1.5 p-1 sm:py-1.5 sm:px-2.5 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer text-left"
          >
            <div className="w-6 h-6 rounded-md sm:rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] sm:text-[11px] font-bold flex items-center justify-center shrink-0">
              {manager ? manager.nome.slice(0, 2).toUpperCase() : 'G'}
            </div>
            <div className="hidden md:block leading-tight">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[110px]">
                {manager ? manager.nome.split(' ')[0] : 'Gestor'}
              </div>
              <div className="text-[10px] text-slate-400 leading-none">
                Configurações
              </div>
            </div>
            <Settings className="w-3.5 h-3.5 text-slate-400 ml-0.5 hidden sm:block" />
          </button>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-0.5" />

          {/* Botão para Cadastrar Novo Funcionário (Compacto com ícone + no celular) */}
          <button
            type="button"
            onClick={onOpenNewEmployee}
            title="Cadastrar Novo Funcionário"
            aria-label="Cadastrar Novo Funcionário"
            className={`w-8 h-8 sm:w-auto sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold text-white ${getAccentBtn()} shadow-xs transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0`}
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">+ Adicionar Funcionário</span>
          </button>
        </div>
      </div>
    </header>
  );
};
