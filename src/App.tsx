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
import { CleanLockScreen } from './components/CleanLockScreen';
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
  X,
  Undo2,
  ShieldCheck,
} from 'lucide-react';
import {
  loadEmployeesSync,
  saveEmployees,
  loadManagerSync,
  saveManager,
  loadThemeSync,
  saveTheme,
  requestPersistentStorage,
  createSafetyBackup,
  restorePreResetBackup,
  idbGet,
  CFC_KEY_EMPLOYEES,
  CFC_KEY_MANAGER,
} from './utils/storageService';
import {
  auth,
  onAuthUserChanged,
  syncDataToCloud,
  subscribeToCloudData,
  fetchDataFromCloud,
} from './utils/firebase';
import { User as FirebaseUser } from 'firebase/auth';

export default function App() {
  // Controle da tela de abertura: false = Tela Inicial Super Limpa, true = Dentro do Aplicativo
  const [isInApp, setIsInApp] = useState<boolean>(false);

  // Perfil do Gestor (persistido com migração universal e IndexedDB)
  const [manager, setManager] = useState<ManagerProfile | null>(() => {
    return loadManagerSync();
  });

  // Modo claro / escuro
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return loadThemeSync();
  });

  // Lista de funcionários persistida no armazenamento durável
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const { employees: initialEmployees } = loadEmployeesSync();
    return initialEmployees;
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

  // Sincroniza tema dark no HTML e no armazenamento
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveTheme(darkMode);
  }, [darkMode]);

  // Persiste Gestor no armazenamento durável (LocalStorage + IndexedDB + Backup)
  useEffect(() => {
    if (manager) {
      saveManager(manager);
    }
  }, [manager]);

  // Persiste Funcionários no armazenamento durável (LocalStorage + IndexedDB + Snapshots)
  useEffect(() => {
    saveEmployees(employees);
  }, [employees]);

  // Solicita persistência durável ao navegador, recupera do IndexedDB se necessário e sincroniza abas
  useEffect(() => {
    // 1. Solicita armazenamento persistente ao navegador para blindar contra descarte de dados
    requestPersistentStorage();

    // 2. Verificação assíncrona com IndexedDB (proteção de segundo nível se LocalStorage estiver vazio)
    (async () => {
      try {
        const idbEmployees = await idbGet<Employee[]>(CFC_KEY_EMPLOYEES);
        if (idbEmployees && Array.isArray(idbEmployees) && idbEmployees.length > 0) {
          setEmployees((current) => {
            // Se o estado atual tiver sido esvaziado indevidamente
            if (current.length === 0) {
              return idbEmployees;
            }
            return current;
          });
        }

        const idbManager = await idbGet<ManagerProfile>(CFC_KEY_MANAGER);
        if (idbManager && typeof idbManager === 'object') {
          setManager((curr) => curr || idbManager);
        }
      } catch {
        // Silencia
      }
    })();

    // 3. Sincronização multiabas e janelas em tempo real
    const handleStorageSync = (e: StorageEvent) => {
      if ((e.key === CFC_KEY_EMPLOYEES || e.key === 'cfc_employees_v5') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setEmployees(parsed);
          }
        } catch {
          // ignore
        }
      }
      if ((e.key === CFC_KEY_MANAGER || e.key === 'cfc_manager_v5') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setManager(parsed);
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageSync);
    return () => window.removeEventListener('storage', handleStorageSync);
  }, []);

  // Sincroniza funcionário selecionado
  useEffect(() => {
    if (selectedEmployee) {
      const found = employees.find((e) => e.id === selectedEmployee.id);
      if (found) setSelectedEmployee(found);
    }
  }, [employees, selectedEmployee]);

  // Monitoramento do estado de login no Firebase e sincronização automática em tempo real
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [lastCloudSyncTime, setLastCloudSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cfc_last_cloud_sync_time');
    } catch {
      return null;
    }
  });

  // Flag para evitar loops quando a atualização for recebida da nuvem
  const isIncomingCloudUpdateRef = useRef(false);

  // 1. Observador onAuthStateChanged com persistência local ativa ('indexedDBLocalPersistence')
  // Reconecta e sincroniza automaticamente sem exigir novos cliques do usuário
  useEffect(() => {
    const unsub = onAuthUserChanged(async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          setIsCloudSyncing(true);
          // Verifica se já existem dados salvos no Firestore deste usuário
          const cloudData = await fetchDataFromCloud();
          if (cloudData.employees && cloudData.employees.length > 0) {
            isIncomingCloudUpdateRef.current = true;
            setEmployees(cloudData.employees);
            saveEmployees(cloudData.employees);
            if (cloudData.manager) {
              setManager(cloudData.manager);
              saveManager(cloudData.manager);
            }
            const timeStr = cloudData.lastSync
              ? new Date(cloudData.lastSync).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              : new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLastCloudSyncTime(timeStr);
            try {
              localStorage.setItem('cfc_last_cloud_sync_time', timeStr);
            } catch {
              // ignore
            }
          } else if (employees.length > 0) {
            // Se o Firestore estiver vazio e houver registros locais, envia imediatamente
            const res = await syncDataToCloud(employees, manager);
            if (res.success) {
              setLastCloudSyncTime(res.timestamp);
              try {
                localStorage.setItem('cfc_last_cloud_sync_time', res.timestamp);
              } catch {
                // ignore
              }
            }
          }
        } catch (err) {
          console.warn('[Firebase AutoSync] Erro na verificação/sincronização inicial:', err);
        } finally {
          setIsCloudSyncing(false);
          setTimeout(() => {
            isIncomingCloudUpdateRef.current = false;
          }, 600);
        }
      }
    });

    return () => unsub();
  }, []);

  // 2. Escuta de atualizações em tempo real (onSnapshot) do Firestore vinculada ao UID do usuário
  useEffect(() => {
    if (!firebaseUser) return;

    const unsubscribe = subscribeToCloudData((cloudData) => {
      if (cloudData.employees && cloudData.employees.length > 0) {
        isIncomingCloudUpdateRef.current = true;
        setEmployees(cloudData.employees);
        saveEmployees(cloudData.employees);
        if (cloudData.manager) {
          setManager(cloudData.manager);
          saveManager(cloudData.manager);
        }
        const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastCloudSyncTime(nowStr);
        try {
          localStorage.setItem('cfc_last_cloud_sync_time', nowStr);
        } catch {
          // ignore
        }
        setTimeout(() => {
          isIncomingCloudUpdateRef.current = false;
        }, 600);
      }
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // 3. Sincronização automática em segundo plano para o Firestore quando dados mudam localmente
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (firebaseUser && employees.length > 0 && !isIncomingCloudUpdateRef.current) {
      timeoutId = setTimeout(async () => {
        try {
          setIsCloudSyncing(true);
          const res = await syncDataToCloud(employees, manager);
          if (res.success) {
            setLastCloudSyncTime(res.timestamp);
            try {
              localStorage.setItem('cfc_last_cloud_sync_time', res.timestamp);
            } catch {
              // ignore
            }
          }
        } catch (err) {
          console.warn('[Firebase AutoSync] Erro na sincronização contínua:', err);
        } finally {
          setIsCloudSyncing(false);
        }
      }, 1500);
    }
    return () => clearTimeout(timeoutId);
  }, [employees, manager, firebaseUser]);

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
        }
        if (temFeriasAlerta(emp)) {
          alertaFerias++;
        }
      }
    });

    return { ativos, demitidos, alertaFerias, vencidas };
  }, [employees]);

  // Função auxiliar para remover acentos e converter para minúsculas
  const normalizeText = (text: string | null | undefined): string => {
    if (!text) return '';
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Filtragem e busca em tempo real com suporte a filtro de Férias Vencidas e Alerta 60d
  const filteredEmployees = useMemo(() => {
    const rawTerm = searchTerm.trim();
    const term = normalizeText(rawTerm);
    const digitsOnlyTerm = rawTerm.replace(/\D/g, '');

    return employees.filter((emp) => {
      const isDem = Boolean(emp.dataDemissao);

      // Filtros de status por categoria
      if (statusFilter === 'ativos' && isDem) return false;
      if (statusFilter === 'demitidos' && !isDem) return false;
      if (statusFilter === 'alerta' && (isDem || !temFeriasAlerta(emp))) return false;
      if (statusFilter === 'vencidas' && (isDem || !temFeriasVencidas(emp))) return false;

      // Se a barra de pesquisa estiver vazia, retorna todos do filtro ativo
      if (!term && !digitsOnlyTerm) return true;

      const normNome = normalizeText(emp.nome);
      const normApelido = normalizeText(emp.apelido);
      const normCargo = normalizeText(emp.cargo);
      const normDepto = normalizeText(emp.departamento);
      const empPhoneDigits = (emp.telefone || '').replace(/\D/g, '');

      const matchNome = normNome.includes(term);
      const matchApelido = normApelido.includes(term);
      const matchCargo = normCargo.includes(term);
      const matchDepto = normDepto.includes(term);
      const matchTelefone = digitsOnlyTerm ? empPhoneDigits.includes(digitsOnlyTerm) : false;

      return matchNome || matchApelido || matchCargo || matchDepto || matchTelefone;
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
          // Cria backup preventivo automático antes de importar
          createSafetyBackup(employees);
          setEmployees(json);
          alert(`Backup carregado com sucesso! ${json.length} colaboradores restaurados.`);
        } else {
          alert('Arquivo JSON inválido. Certifique-se de que é um arquivo de backup do CFC.');
        }
      } catch {
        alert('Erro ao carregar o arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    if (
      confirm(
        'Deseja carregar a lista de exemplo?\n\nSeus dados atuais serão salvos em um backup de segurança e poderão ser restaurados a qualquer momento.'
      )
    ) {
      createSafetyBackup(employees);
      setEmployees(INITIAL_EMPLOYEES);
      alert('Dados de exemplo carregados. Seus dados anteriores foram guardados em backup de segurança.');
    }
  };

  const handleRestoreBackup = () => {
    const backup = restorePreResetBackup();
    if (backup && Array.isArray(backup) && backup.length > 0) {
      if (confirm(`Restaurar o backup de segurança anterior com ${backup.length} colaborador(es)?`)) {
        setEmployees(backup);
        alert('Backup restaurado com sucesso! Seus colaboradores estão de volta.');
      }
    } else {
      alert('Nenhum backup recente de segurança encontrado neste dispositivo.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* TELA DE BLOQUEIO E AUTENTICAÇÃO OBRIGATÓRIA (PIN de 4 dígitos ou Biometria / Face ID) */}
      {!isInApp ? (
        <CleanLockScreen
          manager={manager}
          onUnlock={() => setIsInApp(true)}
          onUpdateManager={(updated) => setManager(updated)}
          onOpenSettings={() => setIsManagerSettingsOpen(true)}
          isCloudConnected={Boolean(firebaseUser)}
        />
      ) : (
        <>
          {/* CABEÇALHO E LAYOUT PRINCIPAL */}
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
            isCloudConnected={Boolean(firebaseUser)}
            isCloudSyncing={isCloudSyncing}
            lastCloudSyncTime={lastCloudSyncTime}
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
                    ? 'border-rose-500 bg-rose-50/90 dark:bg-rose-950/40 ring-2 ring-rose-500/30 shadow-md scale-[1.01]'
                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-900/50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  <span className={`truncate ${statusFilter === 'alerta' ? 'text-rose-800 dark:text-rose-300 font-bold' : ''}`}>
                    Férias em Alerta
                  </span>
                  <AlertTriangle className={`w-3.5 h-3.5 shrink-0 ml-1 ${statusFilter === 'alerta' ? 'text-rose-600 dark:text-rose-400' : 'text-rose-500'}`} />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                  {counters.alertaFerias}
                </div>
                <div className="text-[10px] sm:text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 flex items-center justify-between">
                  <span className="truncate">Vence em até 60d</span>
                  {statusFilter === 'alerta' && (
                    <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-full shrink-0 ml-1">
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
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nome, apelido ou WhatsApp..."
                  aria-label="Buscar funcionários"
                  className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    title="Limpar pesquisa"
                    aria-label="Limpar pesquisa"
                    className="absolute right-2.5 top-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
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
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                    statusFilter === 'alerta'
                      ? 'bg-rose-600 text-white font-semibold shadow-xs'
                      : 'hover:text-rose-600 dark:hover:text-rose-400'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Férias a Vencer / Alerta 60 Dias ({counters.alertaFerias})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter(statusFilter === 'vencidas' ? 'todos' : 'vencidas')}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 shrink-0 ${
                    statusFilter === 'vencidas'
                      ? 'bg-red-700 text-white font-semibold shadow-xs'
                      : 'hover:text-red-700 dark:hover:text-red-400'
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
                        ? 'bg-red-100 text-red-900 dark:bg-red-950/80 dark:text-red-200 border border-red-300 dark:border-red-900'
                        : statusFilter === 'alerta'
                        ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-200 border border-rose-300 dark:border-rose-900'
                        : statusFilter === 'ativos'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                        : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {statusFilter === 'vencidas' && '🚨 Férias Vencidas (Prazo Limite CLT Expirado e Não Gozadas)'}
                    {statusFilter === 'alerta' && '⚠️ Férias a Vencer / Alerta 60 Dias (Completa 12m aquisitivo ou limite concessivo)'}
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
                  <AlertOctagon className="w-12 h-12 text-red-500 mx-auto mb-3" />
                ) : statusFilter === 'alerta' ? (
                  <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                ) : (
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                )}
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                  {searchTerm.trim()
                    ? 'Nenhum funcionário encontrado'
                    : statusFilter === 'vencidas'
                    ? 'Nenhum funcionário com férias vencidas'
                    : statusFilter === 'alerta'
                    ? 'Nenhum funcionário com férias a vencer em 60 dias'
                    : 'Nenhum funcionário encontrado'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  {searchTerm.trim()
                    ? `Nenhum resultado correspondente a "${searchTerm}". Tente outro nome, apelido, cargo ou WhatsApp.`
                    : statusFilter === 'vencidas'
                    ? 'Excelente! Não há períodos aquisitivos com prazo limite ultrapassado e saldo pendente de gozo.'
                    : statusFilter === 'alerta'
                    ? 'Tudo em dia! Não há colaboradores no prazo crítico dos últimos 60 dias do período concessivo.'
                    : 'Não há funcionários cadastrados nesta categoria.'}
                </p>
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="px-4 py-2 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl transition-colors cursor-pointer"
                    >
                      Limpar Pesquisa
                    </button>
                  )}
                  {statusFilter !== 'todos' && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('todos')}
                      className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      Ver Todos os Funcionários
                    </button>
                  )}
                </div>
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
              <div className="flex items-center gap-2 flex-wrap">
                <span>CFC &middot; Controle Funcionário Completo</span>
                {firebaseUser ? (
                  <>
                    <span aria-hidden="true" className="mx-1">&middot;</span>
                    <span className="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Sincronizado Online (Firestore){lastCloudSyncTime ? ` &bull; ${lastCloudSyncTime}` : ''}</span>
                    </span>
                  </>
                ) : (
                  <>
                    <span aria-hidden="true" className="mx-2">&middot;</span>
                    <span>Clique sobre qualquer nome para ver a ficha completa</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleRestoreBackup}
                  title="Restaurar o backup de segurança automático salvo na memória"
                  className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer text-xs"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span>Restaurar Backup Seguro</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportData}
                  className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportData}
                  className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar JSON</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetData}
                  title="Carrega colaboradores de teste (seus dados reais ficam salvos em backup automático)"
                  className="hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Carregar Exemplos</span>
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

        </>
      )}

      {/* Modal de Perfil & Configurações do Gestor (Acessível de dentro do app e da tela de bloqueio) */}
      <ManagerSettingsModal
        isOpen={isManagerSettingsOpen}
        onClose={() => setIsManagerSettingsOpen(false)}
        manager={manager}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onUpdateManager={(updated) => setManager(updated)}
        employees={employees}
        onRestoreFromCloud={(cloudEmployees, cloudManager) => {
          if (cloudEmployees && cloudEmployees.length > 0) {
            setEmployees(cloudEmployees);
          }
          if (cloudManager) {
            setManager(cloudManager);
          }
        }}
      />

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
