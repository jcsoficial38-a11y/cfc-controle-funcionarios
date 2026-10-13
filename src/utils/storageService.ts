/**
 * Serviço de Persistência e Armazenamento Durável para o CFC (Controle Funcionário Completo).
 * 
 * Regras implementadas:
 * 1. ARMAZENAMENTO DURÁVEL:
 *    - Persistência em múltiplas camadas: LocalStorage otimizado + IndexedDB não volátil + Snapshots de backup.
 *    - Solicitação de permissão de armazenamento persistente via navigator.storage.persist().
 *    - Chaves canônicas protegidas contra perda de dados entre deploys e atualizações de código.
 *    - Motor de migração universal retrocompatível que resgata dados de qualquer versão anterior (v1 a v5).
 * 
 * 2. PROTEÇÃO DE DADOS LOCAIS:
 *    - Validação de integridade antes da gravação (nunca sobrescreve com null/undefined/corrompido).
 *    - Snapshots automáticos antes de modificações críticas.
 *    - Espelhamento em tempo real entre LocalStorage e IndexedDB.
 * 
 * 3. PREVENÇÃO DE RESET:
 *    - Diferenciação estrita entre "Primeira execução" e "Lista limpa pelo usuário".
 *    - Proibição de resets automáticos na inicialização: respeita e preserva o histórico preenchido.
 */

import { Employee, ManagerProfile } from '../types';
import { INITIAL_EMPLOYEES, INITIAL_MANAGER } from './defaultData';

// Chaves Canônicas e Definitivas (NUNCA mudar ou versionar para evitar perda de dados em deploys)
export const CFC_KEY_EMPLOYEES = 'cfc_employees_master_data';
export const CFC_KEY_MANAGER = 'cfc_manager_master_data';
export const CFC_KEY_THEME = 'cfc_theme_master_data';
export const CFC_KEY_INIT = 'cfc_app_initialized_status';

// Chaves de Backup e Recuperação
export const CFC_KEY_BACKUP_EMPLOYEES = 'cfc_employees_backup_snapshot';
export const CFC_KEY_PRE_RESET_BACKUP = 'cfc_employees_pre_reset_backup';
export const CFC_KEY_BACKUP_MANAGER = 'cfc_manager_backup_snapshot';

// Lista de chaves legadas para migração automática universal
const LEGACY_EMPLOYEE_KEYS = [
  'cfc_employees_v5',
  'cfc_employees_v4',
  'cfc_employees_v3',
  'cfc_employees_v2',
  'cfc_employees_v1',
  'cfc_employees',
  'employees',
  'cfc_colaboradores',
];

const LEGACY_MANAGER_KEYS = [
  'cfc_manager_v5',
  'cfc_manager_v4',
  'cfc_manager_v3',
  'cfc_manager_v2',
  'cfc_manager_v1',
  'cfc_manager',
  'manager',
  'gestor_profile',
];

const LEGACY_THEME_KEYS = [
  'cfc_theme_v5',
  'cfc_theme',
  'theme',
];

// --- CAMADA DE ARMAZENAMENTO INDEXEDDB (Persistência Durável / Quota Estendida) ---
const IDB_NAME = 'cfc_persistent_db';
const IDB_VERSION = 1;
const IDB_STORE_NAME = 'cfc_data_store';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!dbPromise) {
    dbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(IDB_NAME, IDB_VERSION);

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
            db.createObjectStore(IDB_STORE_NAME);
          }
        };

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          console.warn('[CFC Storage] Erro ao abrir IndexedDB. Operando com LocalStorage.');
          resolve(null);
        };
      } catch (err) {
        console.warn('[CFC Storage] Falha ao inicializar IndexedDB:', err);
        resolve(null);
      }
    });
  }
  return dbPromise;
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getIndexedDB();
    if (!db) return null;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_NAME, 'readonly');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.get(key);

        req.onsuccess = () => {
          resolve((req.result as T) ?? null);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  } catch {
    return null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<boolean> {
  try {
    const db = await getIndexedDB();
    if (!db) return false;

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.put(value, key);

        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  } catch {
    return false;
  }
}

/**
 * Solicita persistência durável ao navegador para evitar que os dados sejam descartados
 * sob pressão de memória ou limpeza de cache automática do SO/navegador.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        console.info('[CFC Storage] Armazenamento persistente ativado com sucesso.');
      }
      return isPersisted;
    }
  } catch {
    // Silencia qualquer restrição do navegador
  }
  return false;
}

// --- FUNÇÕES DE LEITURA SINCRONIZADA E MIGRAÇÃO UNIVERSAL ---

/**
 * Carrega a lista de colaboradores preservando integralmente cadastros reais.
 * Realiza migração transparente de qualquer versão legada (v1 até v5).
 */
export function loadEmployeesSync(): { employees: Employee[]; isInitialized: boolean } {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return { employees: INITIAL_EMPLOYEES, isInitialized: false };
  }

  const isInitialized = localStorage.getItem(CFC_KEY_INIT) === 'true';

  // 1. Tenta carregar da chave mestre canônica
  try {
    const canonicalRaw = localStorage.getItem(CFC_KEY_EMPLOYEES);
    if (canonicalRaw) {
      const parsed = JSON.parse(canonicalRaw);
      if (Array.isArray(parsed)) {
        // Se o array tem dados ou se o usuário explicitamente já inicializou o app, respeitamos a lista!
        if (parsed.length > 0 || isInitialized) {
          return { employees: parsed, isInitialized: true };
        }
      }
    }
  } catch (err) {
    console.warn('[CFC Storage] Falha ao analisar chave canônica de colaboradores:', err);
  }

  // 2. Tenta migrar de versões legadas conhecidas (v5, v4, v3, v2, v1, unversioned)
  for (const legacyKey of LEGACY_EMPLOYEE_KEYS) {
    try {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migra imediatamente para a chave mestre canônica
          localStorage.setItem(CFC_KEY_EMPLOYEES, JSON.stringify(parsed));
          localStorage.setItem(CFC_KEY_INIT, 'true');
          idbSet(CFC_KEY_EMPLOYEES, parsed);
          console.info(`[CFC Storage] Dados migrados com sucesso da chave legada: ${legacyKey}`);
          return { employees: parsed, isInitialized: true };
        }
      }
    } catch {
      // Continua para a próxima chave
    }
  }

  // 3. Tenta recuperar do backup de segurança automático caso a chave principal tenha falhado
  try {
    const backupRaw = localStorage.getItem(CFC_KEY_BACKUP_EMPLOYEES);
    if (backupRaw) {
      const parsed = JSON.parse(backupRaw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        localStorage.setItem(CFC_KEY_EMPLOYEES, JSON.stringify(parsed));
        localStorage.setItem(CFC_KEY_INIT, 'true');
        idbSet(CFC_KEY_EMPLOYEES, parsed);
        return { employees: parsed, isInitialized: true };
      }
    }
  } catch {
    // ignore
  }

  // 4. Se o usuário já havia inicializado e esvaziou a lista propositalmente:
  if (isInitialized) {
    return { employees: [], isInitialized: true };
  }

  // 5. Primeira execução absoluta em dispositivo novo (nunca inicializado):
  // Inicializa com dados padrão de demonstração e grava para não resetar mais
  try {
    localStorage.setItem(CFC_KEY_EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
    localStorage.setItem(CFC_KEY_INIT, 'true');
    idbSet(CFC_KEY_EMPLOYEES, INITIAL_EMPLOYEES);
  } catch {
    // ignore
  }

  return { employees: INITIAL_EMPLOYEES, isInitialized: true };
}

/**
 * Salva a lista de colaboradores com proteção multicamada:
 * - Validação estrita de array
 * - Backup automático do estado anterior
 * - Gravação no LocalStorage canônico + espelhamento nas chaves legadas
 * - Gravação assíncrona no IndexedDB
 */
export function saveEmployees(employees: Employee[]): void {
  if (!Array.isArray(employees)) {
    console.error('[CFC Storage] Tentativa de salvar dados inválidos de colaboradores. Operação cancelada.');
    return;
  }

  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  try {
    // 1. Snapshot de backup automático do estado anterior
    const current = localStorage.getItem(CFC_KEY_EMPLOYEES);
    if (current) {
      localStorage.setItem(CFC_KEY_BACKUP_EMPLOYEES, current);
      idbSet(CFC_KEY_BACKUP_EMPLOYEES, current);
    }

    // 2. Gravação na chave canônica mestre
    const serialized = JSON.stringify(employees);
    localStorage.setItem(CFC_KEY_EMPLOYEES, serialized);
    localStorage.setItem(CFC_KEY_INIT, 'true');

    // 3. Espelhamento retrocompatível para evitar que scripts legados ou extensões fiquem desatualizados
    localStorage.setItem('cfc_employees_v5', serialized);
    localStorage.setItem('cfc_employees', serialized);

    // 4. Persistência durável no IndexedDB
    idbSet(CFC_KEY_EMPLOYEES, employees);
  } catch (err) {
    console.error('[CFC Storage] Erro ao gravar colaboradores no LocalStorage:', err);
    // Tenta gravar pelo menos no IndexedDB caso LocalStorage atinja cota (ex: fotos grandes em base64)
    idbSet(CFC_KEY_EMPLOYEES, employees);
  }
}

/**
 * Carrega perfil do gestor com migração automática universal.
 */
export function loadManagerSync(): ManagerProfile | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }

  // 1. Chave canônica mestre
  try {
    const raw = localStorage.getItem(CFC_KEY_MANAGER);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }

  // 2. Chaves legadas
  for (const legacyKey of LEGACY_MANAGER_KEYS) {
    try {
      const legacyRaw = localStorage.getItem(legacyKey);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (parsed && typeof parsed === 'object') {
          localStorage.setItem(CFC_KEY_MANAGER, JSON.stringify(parsed));
          idbSet(CFC_KEY_MANAGER, parsed);
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }

  // 3. Backup de segurança
  try {
    const backupRaw = localStorage.getItem(CFC_KEY_BACKUP_MANAGER);
    if (backupRaw) {
      const parsed = JSON.parse(backupRaw);
      if (parsed && typeof parsed === 'object') {
        localStorage.setItem(CFC_KEY_MANAGER, JSON.stringify(parsed));
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Salva o perfil do gestor com backup e persistência garantida.
 */
export function saveManager(manager: ManagerProfile | null): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }

  if (!manager) return;

  try {
    const current = localStorage.getItem(CFC_KEY_MANAGER);
    if (current) {
      localStorage.setItem(CFC_KEY_BACKUP_MANAGER, current);
      idbSet(CFC_KEY_BACKUP_MANAGER, current);
    }

    const serialized = JSON.stringify(manager);
    localStorage.setItem(CFC_KEY_MANAGER, serialized);
    localStorage.setItem('cfc_manager_v5', serialized);
    localStorage.setItem('cfc_manager', serialized);

    idbSet(CFC_KEY_MANAGER, manager);
  } catch (err) {
    console.error('[CFC Storage] Erro ao salvar perfil do gestor:', err);
    idbSet(CFC_KEY_MANAGER, manager);
  }
}

/**
 * Carrega a preferência de tema (claro/escuro).
 */
export function loadThemeSync(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }

  const canonical = localStorage.getItem(CFC_KEY_THEME);
  if (canonical) return canonical === 'dark';

  for (const key of LEGACY_THEME_KEYS) {
    const val = localStorage.getItem(key);
    if (val) {
      localStorage.setItem(CFC_KEY_THEME, val);
      return val === 'dark';
    }
  }

  return (
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/**
 * Salva preferência de tema.
 */
export function saveTheme(darkMode: boolean): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return;
  }
  const val = darkMode ? 'dark' : 'light';
  try {
    localStorage.setItem(CFC_KEY_THEME, val);
    localStorage.setItem('cfc_theme_v5', val);
    idbSet(CFC_KEY_THEME, val);
  } catch {
    // ignore
  }
}

/**
 * Cria um snapshot de proteção antes de qualquer operação destrutiva ou recarga.
 */
export function createSafetyBackup(employees: Employee[]): void {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    const serialized = JSON.stringify(employees);
    localStorage.setItem(CFC_KEY_PRE_RESET_BACKUP, serialized);
    idbSet(CFC_KEY_PRE_RESET_BACKUP, employees);
  } catch {
    // ignore
  }
}

/**
 * Restaura o snapshot de proteção anterior.
 */
export function restorePreResetBackup(): Employee[] | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CFC_KEY_PRE_RESET_BACKUP);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Verifica se existe um backup de segurança para recuperação.
 */
export function hasSafetyBackup(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
  return Boolean(
    localStorage.getItem(CFC_KEY_PRE_RESET_BACKUP) ||
    localStorage.getItem(CFC_KEY_BACKUP_EMPLOYEES)
  );
}
