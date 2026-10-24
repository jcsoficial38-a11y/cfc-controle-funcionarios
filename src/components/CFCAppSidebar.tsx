import React from 'react';
import { ManagerProfile, DeletedItem } from '../types';
import {
  X,
  Users,
  UserCheck,
  AlertTriangle,
  UserX,
  Settings,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Lock,
  Sun,
  Moon,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface CFCAppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerProfile | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onLock: () => void;
  onOpenSettings: () => void;
  currentFilter: string;
  onSelectFilter: (filter: 'todos' | 'ativos' | 'demitidos' | 'alerta' | 'vencidas') => void;
  trashCount: number;
  onSaveData?: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onResetTotal: () => void;
}

export const CFCAppSidebar: React.FC<CFCAppSidebarProps> = ({
  isOpen,
  onClose,
  manager,
  darkMode,
  onToggleDarkMode,
  onLock,
  onOpenSettings,
  currentFilter,
  onSelectFilter,
  trashCount,
  onSaveData,
  onExportData,
  onImportData,
  onResetTotal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="relative w-80 max-w-[85vw] h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 overflow-y-auto">
        {/* Cabeçalho do Perfil no Menu Lateral */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            {manager?.fotoUrl ? (
              <img
                src={manager.fotoUrl}
                alt={manager.nome}
                className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/40 shadow-sm shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                {manager ? manager.nome.slice(0, 2).toUpperCase() : 'G'}
              </div>
            )}
            <div className="min-w-0">
              <span className="font-bold text-sm text-slate-900 dark:text-white block truncate">
                {manager?.nome || 'Gestor'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate font-mono">
                {manager?.usuario || 'admin@cfc'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegação em Lista com Ícones Contornados */}
        <div className="p-4 space-y-1.5 flex-1">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1">
            Menu Principal
          </div>

          {[
            { id: 'todos', label: 'Visão Geral / Todos', icon: Users },
            { id: 'ativos', label: 'Funcionários Ativos', icon: UserCheck },
            { id: 'alerta', label: 'Férias em Alerta (≤ 60d)', icon: AlertTriangle },
            { id: 'demitidos', label: 'Demitidos / Encerrados', icon: UserX },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = currentFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectFilter(item.id as any);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${isActive ? 'border-white/30 bg-white/10 text-white' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span>{item.label}</span>
                </div>
                <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white/70' : 'text-slate-400'}`} />
              </button>
            );
          })}

          <div className="pt-3 pb-1">
            <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />
          </div>

          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1">
            Configurações & Utilitários
          </div>

          {/* Configurações & Perfil */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                <Settings className="w-3.5 h-3.5" />
              </div>
              <span>Perfil & Configurações</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Lixeira Local Retrátil no Menu */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <span>Lixeira Local</span>
            </div>
            {trashCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                {trashCount}
              </span>
            )}
          </button>

          <div className="pt-3 pb-1">
            <div className="h-px bg-slate-200 dark:bg-slate-800 w-full" />
          </div>

          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1">
            Backup & Dados Locais
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              if (onSaveData) onSaveData();
              else onExportData();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">💾</span>
              <span>Salvar Dados Agora (.json)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onExportData();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Download className="w-3.5 h-3.5" />
              </div>
              <span>Exportar Backup (.json)</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onImportData();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Upload className="w-3.5 h-3.5" />
              </div>
              <span>Importar Backup</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onResetTotal();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
              <span>Reset Total (Zerar App)</span>
            </div>
          </button>
        </div>

        {/* Rodapé do Menu Lateral */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            <span>{darkMode ? 'Modo Claro' : 'Modo Escuro'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onLock();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Bloquear</span>
          </button>
        </div>
      </div>
    </div>
  );
};
