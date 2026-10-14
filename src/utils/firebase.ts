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
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  getDocFromServer,
  serverTimestamp,
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
    // 1. Grava metadados do usuário e perfil do gestor
    await setDoc(
      doc(db, 'users', userId),
      {
        userId,
        email: currentUser.email || '',
        displayName: currentUser.displayName || manager?.nome || 'Gestor',
        managerProfile: manager ? { ...manager } : null,
        totalEmployees: employees.length,
        updatedAt: serverTimestamp(),
        lastSyncClientIso: new Date().toISOString(),
      },
      { merge: true }
    );

    // 2. Grava cada colaborador na subcoleção individual
    for (const emp of employees) {
      const empPath = `users/${userId}/employees/${emp.id}`;
      try {
        await setDoc(doc(db, 'users', userId, 'employees', emp.id), {
          ...emp,
          userId,
          updatedAt: serverTimestamp(),
        });
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

    const cloudEmployees: Employee[] = [];
    empDocs.forEach((d) => {
      const item = d.data() as Employee;
      cloudEmployees.push(item);
    });

    return {
      employees: cloudEmployees,
      manager: cloudManager,
      lastSync,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, userDocPath);
  }
}
