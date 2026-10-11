import React from 'react';
import { ManagerProfile } from '../types';
import { ShieldCheck, Plus, Sun, Moon, Lock, Download, Upload, RotateCcw, UserCheck } from 'lucide-react';

interface NavbarProps {
  manager: ManagerProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLock: () => void;
  onOpenNewEmployee: () => void;
  onOpenManagerProfile: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  manager,
  darkMode,
  onToggleDarkMode,
  onLock,
  onOpenNewEmployee,
  onOpenManagerProfile,
  onExportData,
  onImportData,
  onResetData,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-amber-900/20 dark:border-slate-800 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zona 1: Marca do Caderno / Agenda */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-amber-700 dark:bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight whitespace-nowrap">
                StaffControl <span className="text-amber-600 dark:text-amber-400 font-serif italic">Pro</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-none hidden sm:block">
              Agenda Executiva &middot; Controle de Funcionários e Férias CLT
            </p>
          </div>
        </div>

        {/* Zona 2: Perfil do Gestor Responsável & Ações */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Card compacto do Gestor clicável */}
          <button
            type="button"
            onClick={onOpenManagerProfile}
            title="Editar Perfil do Gestor e Senha"
            className="hidden sm:flex items-center gap-2 py-1 px-2.5 rounded-lg border border-amber-900/20 dark:border-slate-800 bg-amber-50/60 dark:bg-slate-800/60 hover:border-amber-400 transition-all text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
              {manager.nome.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-[11px] leading-tight">
              <div className="font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                {manager.nome}
              </div>
              <div className="text-[10px] text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <UserCheck className="w-2.5 h-2.5" />
                <span>Gestor</span>
              </div>
            </div>
          </button>

          {/* Exportar JSON */}
          <button
            type="button"
            onClick={onExportData}
            title="Exportar Backup JSON"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Importar JSON */}
          <button
            type="button"
            onClick={onImportData}
            title="Restaurar Backup JSON"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <Upload className="w-4 h-4" />
          </button>

          {/* Resetar dados de demonstração */}
          <button
            type="button"
            onClick={onResetData}
            title="Recarregar Dados Demonstrativos"
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

          {/* Alternador de Tema Claro / Escuro */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            title={darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Bloquear Sistema (Biometria) */}
          <button
            type="button"
            onClick={onLock}
            title="Bloquear Agenda (Acesso Seguro)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-800 rounded-lg border border-amber-900/20 dark:border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden md:inline">Bloquear</span>
          </button>

          {/* Botão Primário: Cadastrar Funcionário */}
          <button
            type="button"
            onClick={onOpenNewEmployee}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Funcionário</span>
          </button>
        </div>
      </div>
    </header>
  );
};
