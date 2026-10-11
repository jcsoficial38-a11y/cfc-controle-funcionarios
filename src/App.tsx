import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Employee, VacationTakeRecord, ManagerProfile } from './types';
import { INITIAL_EMPLOYEES } from './utils/defaultData';
import {
  calculateVacationSummary,
  temFeriasVencidas,
  temFeriasAlerta,
} from './utils/vacationCalculator';
import { CleanWelcomeScreen } from './components/CleanWelcomeScreen';
import { CFCHeader } from './components/CFCHeader';
import { CleanEmployeeList } from './components/CleanEmployeeList';
import { ManagerSettingsModal } from './components/ManagerSettingsModal';
import { EmployeeModal } from './components/EmployeeModal';
import { EmployeeDetailModal } from './components/EmployeeDetailModal';
import { VacationLaunchModal } from './components/VacationLaunchModal';
import {
  Search,
  Users,
  AlertTriangle,
  UserCheck,
  UserX,
  AlertOctagon,
  Download,
  Upload,
  RotateCcw,
} from 'lucide-react';

const STORAGE_KEY_EMPLOYEES = 'cfc_employees_v5';
const STORAGE_KEY_THEME = 'cfc_theme_v5';
const STORAGE_KEY_MANAGER = 'cfc_manager_v5';

export default function App() {
  // Controle da tela de abertura: false = Tela Inicial Super Limpa, true = Dentro do Aplicativo
  const [isInApp, setIsInApp] = useState<boolean>(false);

  // Perfil do Gestor (definido ou editado dentro do aplicativo)
  const [manager, setManager] = useState<ManagerProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MANAGER);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignora erro
    }
    return null;
  });

  // Modo claro / escuro
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Lista de funcionários persistida no LocalStorage
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Fallback
    }
    return INITIAL_EMPLOYEES;
  });

  // Busca e Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ativos' | 'demitidos' | 'alerta' | 'vencidas'>('todos');

  // Modais de Funcionários e Gestor
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [isManagerSettingsOpen, setIsManagerSettingsOpen] = useState(false);

  const [vacationLaunchState, setVacationLaunchState] = useState<{
    isOpen: boolean;
    employee: Employee | null;
    periodIndex: number;
  }>({
    isOpen: false,
    employee: null,
    periodIndex: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincroniza tema dark no HTML
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [darkMode]);

  // Persiste Gestor no LocalStorage
  useEffect(() => {
    if (manager) {
      localStorage.setItem(STORAGE_KEY_MANAGER, JSON.stringify(manager));
    }
  }, [manager]);

  // Persiste Funcionários no LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
  }, [employees]);

  // Sincroniza funcionário selecionado
  useEffect(() => {
    if (selectedEmployee) {
      const found = employees.find((e) => e.id === selectedEmployee.id);
      if (found) setSelectedEmployee(found);
    }
  }, [employees, selectedEmployee]);

  // Contadores dinâmicos (Cálculo automático de funcionários ativos, demitidos e alertas CLT)
  const counters = useMemo(() => {
    let ativos = 0;
    let demitidos = 0;
    let alertaFerias = 0;
    let vencidas = 0;

    employees.forEach((emp) => {
      const isDem = Boolean(emp.dataDemissao);
      if (isDem) {
        demitidos++;
      } else {
        ativos++;
        if (temFeriasVencidas(emp)) {
          vencidas++;
        } else if (temFeriasAlerta(emp)) {
          alertaFerias++;
        }
      }
    });

    return { ativos, demitidos, alertaFerias, vencidas };
  }, [employees]);

  // Filtragem e busca em tempo real com suporte a filtro de Férias Vencidas
  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return employees.filter((emp) => {
      const isDem = Boolean(emp.dataDemissao);

      // Filtros de status por categoria
      if (statusFilter === 'ativos' && isDem) return false;
      if (statusFilter === 'demitidos' && !isDem) return false;
      if (statusFilter === 'alerta' && (isDem || !temFeriasAlerta(emp))) return false;
      if (statusFilter === 'vencidas') {
        // Exibe apenas aqueles cujas férias estão vencidas (data limite expirou e não foram gozadas)
        if (!temFeriasVencidas(emp)) return false;
      }

      if (!term) return true;

      const matchNome = emp.nome.toLowerCase().includes(term);
      const matchApelido = emp.apelido?.toLowerCase().includes(term);
      const matchTelefone = emp.telefone.replace(/\D/g, '').includes(term.replace(/\D/g, ''));
      const matchCargo = emp.cargo?.toLowerCase().includes(term);

      return matchNome || matchApelido || matchTelefone || matchCargo;
    });
  }, [employees, searchTerm, statusFilter]);

  // Cores de destaque dinâmicas
  const getAccentBadge = () => {
    switch (manager?.accentColor) {
      case 'emerald':
        return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500';
      case 'blue':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-500';
      case 'amber':
        return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-500';
      case 'violet':
        return 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 border-violet-500';
      case 'rose':
        return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-500';
      default:
        return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500';
    }
  };

  // Handlers CRUD
  const handleSaveEmployee = (
    data: Omit<Employee, 'id' | 'vacationRecords' | 'criadoEm'>,
    id?: string
  ) => {
    if (id) {
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === id ? { ...emp, ...data } : emp))
      );
    } else {
      const newEmp: Employee = {
        id: 'emp-' + Date.now(),
        ...data,
        vacationRecords: [],
        criadoEm: new Date().toISOString(),
      };
      setEmployees((prev) => [newEmp, ...prev]);
    }
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    if (selectedEmployee?.id === id) {
      setIsDetailModalOpen(false);
      setSelectedEmployee(null);
    }
  };

  const handleSaveVacationRecord = (employeeId: string, record: VacationTakeRecord) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        const currentRecords = emp.vacationRecords || [];
        return {
          ...emp,
          vacationRecords: [...currentRecords, record],
        };
      })
    );
  };

  const handleDeleteVacationRecord = (employeeId: string, recordId: string) => {
    setEmployees((prev) =>
      prev.map((emp) => {
        if (emp.id !== employeeId) return emp;
        return {
          ...emp,
          vacationRecords: (emp.vacationRecords || []).filter((r) => r.id !== recordId),
        };
      })
    );
  };

  // Backup e reset
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(employees, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `cfc_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleImportData = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          setEmployees(json);
          alert('Dados carregados com sucesso!');
        } else {
          alert('Arquivo JSON inválido.');
        }
      } catch {
        alert('Erro ao carregar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    if (confirm('Deseja recarregar a lista padrão de funcionários?')) {
      setEmployees(INITIAL_EMPLOYEES);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 1. TELA INICIAL SUPER LIMPA (Sem telas de login obrigatórias na entrada) */}
      {!isInApp ? (
        <CleanWelcomeScreen
          onEnter={() => setIsInApp(true)}
          hasManager={Boolean(manager)}
          managerName={manager ? manager.nome : undefined}
          accentColor={manager?.accentColor}
        />
      ) : (
        <>
          {/* 2. CABEÇALHO E LAYOUT PRINCIPAL */}
          <CFCHeader
            manager={manager}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onLock={() => setIsInApp(false)}
            onOpenNewEmployee={() => {
              setEmployeeToEdit(null);
              setIsEmployeeModalOpen(true);
            }}
            onOpenManagerSettings={() => setIsManagerSettingsOpen(true)}
          />

          {/* Conteúdo Principal da Aplicação */}
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
            {/* Painel de Métricas e Contadores de Funcionários */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              {/* Ativos */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'ativos' ? 'todos' : 'ativos')}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border text-left transition-all cursor-pointer ${
                  statusFilter === 'ativos'
                    ? `${getAccentBadge()} ring-2 ring-indigo-500/20 shadow-xs`
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span className="truncate">Funcionários Ativos</span>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 ml-1" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {counters.ativos}
                </div>
                <div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                  Em atividade
                </div>
              </button>

              {/* Demitidos */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'demitidos' ? 'todos' : 'demitidos')}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border text-left transition-all cursor-pointer ${
                  statusFilter === 'demitidos'
                    ? 'border-slate-500 ring-2 ring-slate-500/20 shadow-xs'
                    : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span className="truncate">Demitidos</span>
                  <UserX className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-1" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-500 dark:text-slate-400">
                  {counters.demitidos}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 truncate">
                  Contratos encerrados
                </div>
              </button>

              {/* Férias em Alerta (≤ 60 dias) */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'alerta' ? 'todos' : 'alerta')}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer relative ${
                  statusFilter === 'alerta'
                    ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 ring-2 ring-amber-500/30 shadow-md scale-[1.01]'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span className={`truncate ${statusFilter === 'alerta' ? 'text-amber-800 dark:text-amber-300 font-bold' : ''}`}>
                    Férias em Alerta
                  </span>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 ml-1" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {counters.alertaFerias}
                </div>
                <div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 flex items-center justify-between">
                  <span className="truncate">Vence em até 60d</span>
                  {statusFilter === 'alerta' && (
                    <span className="text-[9px] bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0 ml-1">
                      Filtrado
                    </span>
                  )}
                </div>
              </button>

              {/* Férias Vencidas */}
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'vencidas' ? 'todos' : 'vencidas')}
                className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer relative ${
                  statusFilter === 'vencidas'
                    ? 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/40 ring-2 ring-rose-500/30 shadow-md scale-[1.01]'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900/50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span className={`truncate ${statusFilter === 'vencidas' ? 'text-rose-800 dark:text-rose-300 font-bold' : ''}`}>
                    Férias Vencidas
                  </span>
                  <AlertOctagon className={`w-3.5 h-3.5 shrink-0 ml-1 ${statusFilter === 'vencidas' ? 'text-rose-600 dark:text-rose-400' : 'text-rose-500'}`} />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  {counters.vencidas}
                </div>
                <div className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 flex items-center justify-between">
                  <span className="truncate">Atrasadas (CLT)</span>
                  {statusFilter === 'vencidas' && (
                    <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0 ml-1">
                      Filtrado
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Barra de Pesquisa e Filtros Rápidos */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
              {/* Campo de Busca Rápida por Nome, Apelido ou WhatsApp */}
              <div className="relative flex-1 max-w-md w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, apelido ou WhatsApp..."
                  className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                />
              </div>

              {/* Filtros em Abas Discretas (Rolagem suave oculta no celular) */}
              <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200/60 dark:border-slate-800 w-full sm:w-auto overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden text-[11px] sm:text-xs font-medium text-slate-600 dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => setStatusFilter('todos')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'todos'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Todos ({employees.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'ativos' ? 'todos' : 'ativos')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'ativos'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Ativos ({counters.ativos})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'alerta' ? 'todos' : 'alerta')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'alerta'
                      ? 'bg-amber-500 text-white font-semibold shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Alerta 60d ({counters.alertaFerias})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'vencidas' ? 'todos' : 'vencidas')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                    statusFilter === 'vencidas'
                      ? 'bg-rose-600 text-white font-semibold shadow-xs'
                      : 'hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  <AlertOctagon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Vencidas ({counters.vencidas})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'demitidos' ? 'todos' : 'demitidos')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    statusFilter === 'demitidos'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold shadow-xs'
                      : 'hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Demitidos ({counters.demitidos})
                </button>
              </div>
            </div>

            {/* Banner Indicador de Filtro Ativo */}
            {statusFilter !== 'todos' && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Filtro aplicado:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      statusFilter === 'vencidas'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        : statusFilter === 'alerta'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        : statusFilter === 'ativos'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {statusFilter === 'vencidas' && '⚠️ Férias Vencidas (Prazo Limite Expirado e Não Gozadas)'}
                    {statusFilter === 'alerta' && '⏰ Férias em Alerta (≤ 60 dias para vencer)'}
                    {statusFilter === 'ativos' && '✓ Funcionários Ativos'}
                    {statusFilter === 'demitidos' && '✗ Contratos Rescindidos'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    &bull; {filteredEmployees.length} {filteredEmployees.length === 1 ? 'colaborador encontrado' : 'colaboradores encontrados'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusFilter('todos')}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                >
                  Limpar filtro (mostrar todos)
                </button>
              </div>
            )}

            {/* 3. LISTAGEM DE NOMES (ESTILO AGENDA LIMPA) */}
            {filteredEmployees.length === 0 ? (
              <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6">
                {statusFilter === 'vencidas' ? (
                  <AlertOctagon className="w-12 h-12 text-rose-400 mx-auto mb-3" />
                ) : (
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                )}
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  {statusFilter === 'vencidas'
                    ? 'Nenhum funcionário com férias vencidas'
                    : 'Nenhum funcionário encontrado'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {statusFilter === 'vencidas'
                    ? 'Excelente! Não há períodos aquisitivos com prazo limite ultrapassado e saldo pendente de gozo.'
                    : searchTerm
                    ? 'Tente buscar com outros termos de nome, apelido ou telefone.'
                    : 'Não há funcionários cadastrados nesta categoria.'}
                </p>
                {statusFilter !== 'todos' && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter('todos')}
                    className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Ver Todos os Funcionários
                  </button>
                )}
              </div>
            ) : (
              <CleanEmployeeList
                employees={filteredEmployees}
                onOpenDetails={(emp) => {
                  setSelectedEmployee(emp);
                  setIsDetailModalOpen(true);
                }}
                onEdit={(emp, e) => {
                  e.stopPropagation();
                  setEmployeeToEdit(emp);
                  setIsEmployeeModalOpen(true);
                }}
              />
            )}

            {/* Rodapé Discreto com Utilidades de Backup */}
            <div className="pt-6 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                <span>CFC &middot; Controle Funcionário Completo</span>
                <span aria-hidden="true" className="mx-2">&middot;</span>
                <span>Clique sobre qualquer nome para ver a ficha completa</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Backup</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportData}
                  className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetData}
                  className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Dados Exemplo</span>
                </button>
              </div>
            </div>
          </main>

          {/* Modal de Cadastro / Edição de Funcionário */}
          <EmployeeModal
            isOpen={isEmployeeModalOpen}
            onClose={() => setIsEmployeeModalOpen(false)}
            onSave={handleSaveEmployee}
            onDelete={handleDeleteEmployee}
            employeeToEdit={employeeToEdit}
          />

          {/* Modal Detalhado (AO CLICAR EM CIMA DO NOME DO FUNCIONÁRIO) */}
          <EmployeeDetailModal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            employee={selectedEmployee}
            onEdit={(emp) => {
              setIsDetailModalOpen(false);
              setEmployeeToEdit(emp);
              setIsEmployeeModalOpen(true);
            }}
            onOpenVacationLaunch={(emp, pIdx) => {
              setVacationLaunchState({
                isOpen: true,
                employee: emp,
                periodIndex: pIdx,
              });
            }}
            onDeleteRecord={handleDeleteVacationRecord}
          />

          {/* Modal de Lançamento de Férias e Abono */}
          {vacationLaunchState.isOpen && vacationLaunchState.employee && (
            <VacationLaunchModal
              isOpen={vacationLaunchState.isOpen}
              onClose={() =>
                setVacationLaunchState({ isOpen: false, employee: null, periodIndex: 0 })
              }
              employee={vacationLaunchState.employee}
              period={
                calculateVacationSummary(vacationLaunchState.employee).periodos[
                  vacationLaunchState.periodIndex
                ]
              }
              onSaveRecord={handleSaveVacationRecord}
            />
          )}

          {/* Modal de Perfil & Configurações do Gestor (Área interna) */}
          <ManagerSettingsModal
            isOpen={isManagerSettingsOpen}
            onClose={() => setIsManagerSettingsOpen(false)}
            manager={manager}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            onUpdateManager={(updated) => setManager(updated)}
          />
        </>
      )}

      {/* Input invisível para restauração de Backup */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
    </div>
  );
}
