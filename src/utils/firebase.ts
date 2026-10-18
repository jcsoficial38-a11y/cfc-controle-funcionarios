/**
 * Configuração e Utilitários do Firebase para o CFC (Controle Funcionário Completo).
 * Provê:
 * - Autenticação Google via popup
 * - Conexão ao Firestore Database com ID dedicado
 * - Tratamento padronizado de erros Firestore (handleFirestoreError)
 * - Sincronização bidirecional entre dados locais e Nuvem (Firestore)
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { Employee, ManagerProfile } from '../types';
import rawConfig from '../../firebase-applet-config.json';

export const firebaseConfig = {
  apiKey: rawConfig.apiKey || '',
  authDomain: rawConfig.authDomain || '',
  projectId: rawConfig.projectId || '',
  storageBucket: rawConfig.storageBucket || '',
  messagingSenderId: rawConfig.messagingSenderId || '',
  appId: rawConfig.appId || '',
  firestoreDatabaseId: rawConfig.firestoreDatabaseId,
};

// Inicialização segura (evita reinicialização duplicada em re-renders)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Obrigatório especificar o firestoreDatabaseId provido pelo projeto
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);

// 3. Configura o Firebase Auth com persistência local ativa ('indexedDBLocalPersistence')
// para que o usuário permaneça conectado na nuvem mesmo após fechar e reabrir o aplicativo
if (typeof window !== 'undefined') {
  setPersistence(auth, indexedDBLocalPersistence).catch(() => {
    // Fallback caso indexedDB esteja indisponível em modo privado restrito
    setPersistence(auth, browserLocalPersistence).catch((err) => {
      console.warn('[Firebase Auth] Erro ao definir persistência:', err);
    });
  });
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// --- TRATAMENTO PADRONIZADO DE ERROS FIRESTORE ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Teste de conexão inicial
export async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[Firebase] Cliente offline ou aguardando conexão com servidor.');
    }
  }
}

// Dispara teste de conexão em background
if (typeof window !== 'undefined') {
  testConnection().catch(() => {});
}

// --- SERVIÇOS DE AUTENTICAÇÃO GOOGLE ---
export async function loginWithGoogle(): Promise<User> {
  try {
    if (typeof window !== 'undefined') {
      try {
        await setPersistence(auth, indexedDBLocalPersistence);
      } catch {
        await setPersistence(auth, browserLocalPersistence);
      }
    }
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err: unknown) {
    console.error('[Firebase Auth] Erro ao autenticar com Google:', err);
    throw err;
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('[Firebase Auth] Erro ao desconectar:', err);
    throw err;
  }
}

export function onAuthUserChanged(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// --- LIMPEZA E SANITIZAÇÃO DE DADOS PARA O FIRESTORE ---
export function cleanFirestoreData(data: any): any {
  if (data === undefined) return null;
  if (data === null) return null;
  if (typeof data !== 'object') return data;
  if (Array.isArray(data)) {
    return data.map((item) => cleanFirestoreData(item));
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      result[key] = cleanFirestoreData(value);
    }
  }
  return result;
}

// --- SERVIÇOS DE SINCRONIZAÇÃO NUVEM (FIRESTORE) ---

export interface CloudSyncResult {
  success: boolean;
  timestamp: string;
  count: number;
  error?: string;
}

/**
 * Sincroniza a lista de colaboradores e perfil do gestor com o Firestore Database
 * sob a coleção segura /users/{userId}.
 */
export async function syncDataToCloud(
  employees: Employee[],
  manager: ManagerProfile | null
): Promise<CloudSyncResult> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado no Firebase.');
  }

  const userId = currentUser.uid;
  const userDocPath = `users/${userId}`;

  try {
    // 1. Grava metadados do usuário, perfil do gestor e snapshot de backup integral
    await setDoc(
      doc(db, 'users', userId),
      cleanFirestoreData({
        userId,
        email: currentUser.email || '',
        displayName: currentUser.displayName || manager?.nome || 'Gestor',
        managerProfile: manager ? cleanFirestoreData(manager) : null,
        totalEmployees: employees.length,
        employeesSnapshot: employees.map((e) => cleanFirestoreData(e)),
        updatedAt: serverTimestamp(),
        lastSyncClientIso: new Date().toISOString(),
      }),
      { merge: true }
    );

    // 2. Busca e limpa documentos de funcionários deletados localmente
    const empColPath = `users/${userId}/employees`;
    try {
      const existingDocs = await getDocs(collection(db, 'users', userId, 'employees'));
      const localIds = new Set(employees.map((e) => e.id));
      for (const d of existingDocs.docs) {
        if (!localIds.has(d.id)) {
          const deletePath = `users/${userId}/employees/${d.id}`;
          try {
            await deleteDoc(doc(db, 'users', userId, 'employees', d.id));
          } catch (err) {
            handleFirestoreError(err, OperationType.DELETE, deletePath);
          }
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, empColPath);
    }

    // 3. Grava cada colaborador na subcoleção individual (incluindo férias, períodos CLT e prazos)
    for (const emp of employees) {
      const empPath = `users/${userId}/employees/${emp.id}`;
      try {
        await setDoc(
          doc(db, 'users', userId, 'employees', emp.id),
          cleanFirestoreData({
            ...emp,
            userId,
            updatedAt: serverTimestamp(),
          })
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, empPath);
      }
    }

    return {
      success: true,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      count: employees.length,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userDocPath);
  }
}

/**
 * Escuta atualizações do Firestore em tempo real vinculadas ao usuário logado
 */
export function subscribeToCloudData(
  onData: (data: { employees: Employee[]; manager: ManagerProfile | null; source: 'cloud' }) => void
): () => void {
  const currentUser = auth.currentUser;
  if (!currentUser) return () => {};

  const userId = currentUser.uid;
  const empColPath = `users/${userId}/employees`;

  const unsubscribeEmployees = onSnapshot(
    collection(db, 'users', userId, 'employees'),
    async (snapshot) => {
      let cloudEmployees: Employee[] = [];
      snapshot.forEach((docSnap) => {
        cloudEmployees.push(docSnap.data() as Employee);
      });

      let cloudManager: ManagerProfile | null = null;
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const udata = userDoc.data();
          cloudManager = udata?.managerProfile || null;
          // Se a subcoleção estiver vazia mas existir snapshot no documento principal
          if (cloudEmployees.length === 0 && Array.isArray(udata?.employeesSnapshot) && udata.employeesSnapshot.length > 0) {
            cloudEmployees = udata.employeesSnapshot as Employee[];
          }
        }
      } catch {
        // ignore
      }

      onData({
        employees: cloudEmployees,
        manager: cloudManager,
        source: 'cloud',
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, empColPath);
    }
  );

  return () => {
    unsubscribeEmployees();
  };
}

/**
 * Baixa os dados da Nuvem (Firestore) para restaurar no dispositivo atual.
 */
export async function fetchDataFromCloud(): Promise<{
  employees: Employee[];
  manager: ManagerProfile | null;
  lastSync?: string;
}> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Usuário não autenticado no Firebase.');
  }

  const userId = currentUser.uid;
  const userDocPath = `users/${userId}`;

  try {
    // 1. Busca perfil do usuário
    const userDocSnap = await getDoc(doc(db, 'users', userId));
    let cloudManager: ManagerProfile | null = null;
    let lastSync: string | undefined = undefined;

    if (userDocSnap.exists()) {
      const data = userDocSnap.data();
      cloudManager = data.managerProfile || null;
      lastSync = data.lastSyncClientIso;
    }

    // 2. Busca subcoleção de colaboradores
    const empColPath = `users/${userId}/employees`;
    let empDocs;
    try {
      empDocs = await getDocs(collection(db, 'users', userId, 'employees'));
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, empColPath);
    }

    let cloudEmployees: Employee[] = [];
    if (empDocs && !empDocs.empty) {
      empDocs.forEach((d) => {
        const item = d.data() as Employee;
        cloudEmployees.push(item);
      });
    } else if (userDocSnap.exists() && Array.isArray(userDocSnap.data()?.employeesSnapshot)) {
      cloudEmployees = userDocSnap.data()?.employeesSnapshot as Employee[];
    }

    return {
      employees: cloudEmployees,
      manager: cloudManager,
      lastSync,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userDocPath);
  }
}
