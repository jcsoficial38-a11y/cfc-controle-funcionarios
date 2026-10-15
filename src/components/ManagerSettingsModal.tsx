import React, { useState, useEffect } from 'react';
import { Employee, ManagerProfile } from '../types';
import {
  X,
  ShieldCheck,
  KeyRound,
  Check,
  AlertCircle,
  Palette,
  Sun,
  Moon,
  Fingerprint,
  Scan,
  User,
  Lock,
  HelpCircle,
  Share2,
  Cloud,
  RefreshCw,
  LogOut,
  Database,
  CheckCircle2,
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { registerBiometricPasskey, clearBiometricPasskey } from '../utils/security';
import {
  auth,
  loginWithGoogle,
  logoutFirebase,
  onAuthUserChanged,
  syncDataToCloud,
  fetchDataFromCloud,
} from '../utils/firebase';
import { User as FirebaseUser } from 'firebase/auth';

interface ManagerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerProfile | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdateManager: (updated: ManagerProfile) => void;
  employees?: Employee[];
  onRestoreFromCloud?: (cloudEmployees: Employee[], cloudManager?: ManagerProfile | null) => void;
}

const PRESET_SECURITY_QUESTIONS = [
  'Qual o nome da sua primeira escola?',
  'Qual o nome do seu primeiro animal de estimação?',
  'Em qual cidade seus pais se conheceram?',
  'Qual é o nome de solteira da sua mãe?',
  'Qual foi o seu primeiro emprego?',
  'Outra (personalizada)',
];

export const ManagerSettingsModal: React.FC<ManagerSettingsModalProps> = ({
  isOpen,
  onClose,
  manager,
  darkMode,
  onToggleDarkMode,
  onUpdateManager,
  employees,
  onRestoreFromCloud,
}) => {
  const [nome, setNome] = useState(manager?.nome || '');
  const [usuario, setUsuario] = useState(manager?.usuario || 'admin');
  const [cargo, setCargo] = useState(manager?.cargo || 'Gestor de Pessoal / RH');

  // PIN de 4 dígitos
  const [pin, setPin] = useState(manager?.pin || '');
  const [confirmPin, setConfirmPin] = useState(manager?.pin || '');

  // Pergunta e Resposta de Segurança
  const [selectedQuestion, setSelectedQuestion] = useState(() => {
    if (!manager?.perguntaSeguranca) return PRESET_SECURITY_QUESTIONS[0];
    if (PRESET_SECURITY_QUESTIONS.includes(manager.perguntaSeguranca)) {
      return manager.perguntaSeguranca;
    }
    return 'Outra (personalizada)';
  });
  const [customQuestion, setCustomQuestion] = useState(() => {
    if (manager?.perguntaSeguranca && !PRESET_SECURITY_QUESTIONS.includes(manager.perguntaSeguranca)) {
      return manager.perguntaSeguranca;
    }
    return '';
  });
  const [respostaSeguranca, setRespostaSeguranca] = useState(manager?.respostaSeguranca || '');

  const [tipoBiometria, setTipoBiometria] = useState<'touch_id' | 'face_id'>(
    manager?.tipoBiometria || 'touch_id'
  );
  const [biometriaAtiva, setBiometriaAtiva] = useState<boolean>(manager?.biometriaAtiva ?? false);
  const [biometriaCadastrada, setBiometriaCadastrada] = useState<boolean>(
    manager?.biometriaCadastrada ?? false
  );
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState<boolean>(false);
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);

  const [accentColor, setAccentColor] = useState<
    'indigo' | 'emerald' | 'blue' | 'amber' | 'violet' | 'rose'
  >(manager?.accentColor || 'indigo');
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    if (manager) {
      setNome(manager.nome);
      setUsuario(manager.usuario);
      setCargo(manager.cargo);
      setPin(manager.pin || '');
      setConfirmPin(manager.pin || '');
      if (manager.perguntaSeguranca) {
        if (PRESET_SECURITY_QUESTIONS.includes(manager.perguntaSeguranca)) {
          setSelectedQuestion(manager.perguntaSeguranca);
          setCustomQuestion('');
        } else {
          setSelectedQuestion('Outra (personalizada)');
          setCustomQuestion(manager.perguntaSeguranca);
        }
      }
      setRespostaSeguranca(manager.respostaSeguranca || '');
      setTipoBiometria(manager.tipoBiometria || 'touch_id');
      setBiometriaAtiva(manager.biometriaAtiva ?? false);
      setBiometriaCadastrada(manager.biometriaCadastrada ?? false);
      setAccentColor(manager.accentColor || 'indigo');
    }
  }, [manager, isOpen]);

  // Função para Cadastrar / Ativar Biometria (executada UMA ÚNICA VEZ)
  const handleCadastrarBiometria = async () => {
    setIsRegisteringBiometric(true);
    setBiometricFeedback(null);
    try {
      const result = await registerBiometricPasskey(
        usuario || 'gestor',
        nome || 'Gestor Responsável'
      );
      setIsRegisteringBiometric(false);

      if (result.success) {
        setBiometriaCadastrada(true);
        setBiometriaAtiva(true);
        setBiometricFeedback('Biometria cadastrada e ativada com sucesso!');

        // Salva imediatamente no perfil para persistir a chave
        if (manager) {
          const updatedManager: ManagerProfile = {
            ...manager,
            biometriaAtiva: true,
            biometriaCadastrada: true,
            credencialBiometricaId: result.credentialId,
            tipoBiometria,
          };
          onUpdateManager(updatedManager);
        } else {
          const newManager: ManagerProfile = {
            nome: nome.trim() || 'Gestor Responsável',
            usuario: usuario.trim() || 'gestor',
            cargo: cargo.trim() || 'Diretor de Gente & Gestão',
            senha: pin || '1234',
            pin: pin || '1234',
            perguntaSeguranca: selectedQuestion || 'Qual o nome da sua primeira escola?',
            respostaSeguranca: respostaSeguranca || '',
            biometriaAtiva: true,
            biometriaCadastrada: true,
            credencialBiometricaId: result.credentialId,
            tipoBiometria,
            accentColor,
          };
          onUpdateManager(newManager);
        }
      } else {
        setBiometricFeedback(result.error || 'Não foi possível cadastrar a biometria.');
      }
    } catch {
      setIsRegisteringBiometric(false);
      setBiometricFeedback('Erro ao comunicar com o sensor biométrico.');
    }
  };

  // Função para Desativar Biometria
  const handleDesativarBiometria = () => {
    setBiometriaAtiva(false);
    clearBiometricPasskey();
    setBiometriaCadastrada(false);
    setBiometricFeedback('Biometria desativada. O acesso agora exigirá apenas o PIN de 4 dígitos.');
    if (manager) {
      const updatedManager: ManagerProfile = {
        ...manager,
        biometriaAtiva: false,
        biometriaCadastrada: false,
        credencialBiometricaId: undefined,
      };
      onUpdateManager(updatedManager);
    }
  };

  // Estados e Funções do Banco de Dados na Nuvem (Firebase)
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(() => auth.currentUser);
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const [cloudFeedback, setCloudFeedback] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => {
    try {
      return localStorage.getItem('cfc_last_cloud_sync_time');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const unsub = onAuthUserChanged((user) => {
      setAuthUser(user);
      if (user) {
        const stored = localStorage.getItem('cfc_last_cloud_sync_time');
        if (stored) setLastSyncTime(stored);
      }
    });
    return () => unsub();
  }, []);

  const handleConnectGoogle = async () => {
    setIsCloudSyncing(true);
    setCloudFeedback(null);
    try {
      const user = await loginWithGoogle();
      setAuthUser(user);
      setCloudFeedback('Conectado ao Google com sucesso! Sincronizando registros com o Firestore...');
      if (employees) {
        const res = await syncDataToCloud(employees, manager);
        if (res.success) {
          setLastSyncTime(res.timestamp);
          try {
            localStorage.setItem('cfc_last_cloud_sync_time', res.timestamp);
          } catch {
            // ignore
          }
          setCloudFeedback(`Sincronizado Online! (${res.timestamp}) - ${res.count} colaboradores salvos.`);
        }
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('popup-closed-by-user')) {
        setCloudFeedback('Conexão cancelada pelo usuário.');
      } else {
        setCloudFeedback('Não foi possível conectar com Google. Verifique sua conexão.');
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    if (!authUser || !employees) return;
    setIsCloudSyncing(true);
    setCloudFeedback('Sincronizando com Firestore Database...');
    try {
      const res = await syncDataToCloud(employees, manager);
      if (res.success) {
        setLastSyncTime(res.timestamp);
        try {
          localStorage.setItem('cfc_last_cloud_sync_time', res.timestamp);
        } catch {
          // ignore
        }
        setCloudFeedback(`Sincronizado Online com sucesso! (${res.timestamp})`);
      }
    } catch (err) {
      console.error(err);
      setCloudFeedback('Erro ao sincronizar com Firestore.');
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (confirm('Deseja desconectar sua conta Google? Seus dados locais permanecerão salvos.')) {
      try {
        await logoutFirebase();
        setAuthUser(null);
        setCloudFeedback('Desconectado do Firebase.');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRestoreFromCloud = async () => {
    if (!authUser || !onRestoreFromCloud) return;
    if (confirm('Deseja restaurar os colaboradores e dados salvos no Firestore deste usuário?')) {
      setIsCloudSyncing(true);
      setCloudFeedback('Baixando dados do Firestore...');
      try {
        const result = await fetchDataFromCloud();
        if (result.employees && result.employees.length > 0) {
          onRestoreFromCloud(result.employees, result.manager);
          setCloudFeedback(`${result.employees.length} colaborador(es) restaurados da nuvem!`);
        } else {
          setCloudFeedback('Nenhum registro anterior encontrado nesta conta do Firestore.');
        }
      } catch (err) {
        console.error(err);
        setCloudFeedback('Erro ao baixar dados do Firestore.');
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  if (!isOpen) return null;

  // Compartilhar aplicativo via WhatsApp
  const handleShareWhatsApp = () => {
    const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://cfc-app.vercel.app';
    const message = `Olá! Conheça o CFC (Controle Funcionário Completo), o aplicativo ideal para gestão de equipe, prazos de experiência e controle de férias CLT:\n\n${appUrl}`;
    const shareUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!nome.trim() || !usuario.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Informe seu Nome e Nome de Usuário.' });
      return;
    }

    // Validação do PIN de 4 dígitos
    const cleanPin = pin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanPin) {
      setFeedback({ tipo: 'erro', texto: 'Defina um PIN de 4 dígitos para segurança do gestor.' });
      return;
    }

    if (!/^\d{4}$/.test(cleanPin)) {
      setFeedback({ tipo: 'erro', texto: 'O PIN deve conter exatamente 4 dígitos numéricos (ex: 1234).' });
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setFeedback({ tipo: 'erro', texto: 'A confirmação do PIN não confere com o PIN digitado.' });
      return;
    }

    // Pergunta e Resposta de Segurança
    const finalQuestion =
      selectedQuestion === 'Outra (personalizada)'
        ? customQuestion.trim()
        : selectedQuestion.trim();

    if (!finalQuestion) {
      setFeedback({ tipo: 'erro', texto: 'Defina uma Pergunta de Segurança para recuperação de senha.' });
      return;
    }

    if (!respostaSeguranca.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Defina a Resposta de Segurança para poder recuperar seu PIN.' });
      return;
    }

    const updated: ManagerProfile = {
      nome: nome.trim(),
      usuario: usuario.trim().toLowerCase(),
      cargo: cargo.trim() || 'Gestor RH',
      senha: cleanPin, // retrocompatibilidade com senha
      pin: cleanPin,
      perguntaSeguranca: finalQuestion,
      respostaSeguranca: respostaSeguranca.trim(),
      biometriaAtiva,
      biometriaCadastrada,
      credencialBiometricaId: manager?.credencialBiometricaId,
      tipoBiometria,
      accentColor,
    };

    onUpdateManager(updated);
    setFeedback({ tipo: 'sucesso', texto: 'PIN, Pergunta de Segurança e Perfil salvos com sucesso!' });
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Cabeçalho */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                Perfil do Gestor & Segurança
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                PIN de 4 dígitos, Pergunta de Recuperação e Compartilhamento
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Botão de Compartilhar no Topo do Perfil */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block truncate">
                Compartilhar Aplicativo
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block leading-tight">
                Envie o link do CFC para outros gestores ou colegas via WhatsApp
              </span>
            </div>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span>Compartilhar</span>
            </button>
          </div>

          {/* CARD DE BANCO DE DADOS NA NUVEM (FIREBASE) */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-sky-50/60 to-slate-50 dark:from-indigo-950/40 dark:via-sky-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>Banco de Dados na Nuvem</span>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                      Firebase Firestore
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Backup contínuo e sincronização online de colaboradores e férias
                  </p>
                </div>
              </div>

              {authUser ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/80 dark:border-emerald-700/80 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Firestore Conectado</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400 shrink-0">
                  <Cloud className="w-3 h-3" />
                  <span>Offline / Local</span>
                </div>
              )}
            </div>

            {authUser ? (
              <div className="space-y-3 pt-1">
                {/* Informações do Usuário Conectado */}
                <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {authUser.photoURL ? (
                      <img
                        src={authUser.photoURL}
                        alt={authUser.displayName || 'Usuário'}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/80 text-indigo-700 dark:text-indigo-200 font-bold text-xs flex items-center justify-center shrink-0">
                        {(authUser.displayName || authUser.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block tracking-wider">
                        Conectado como:
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block truncate">
                        {authUser.displayName || 'Gestor Google'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                        {authUser.email}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Sincronizado Online</span>
                    </span>
                    {lastSyncTime && (
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Último sync: {lastSyncTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões de Ação da Nuvem */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSyncNow}
                    disabled={isCloudSyncing}
                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    <span>{isCloudSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}</span>
                  </button>

                  {onRestoreFromCloud && (
                    <button
                      type="button"
                      onClick={handleRestoreFromCloud}
                      disabled={isCloudSyncing}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Cloud className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Restaurar da Nuvem</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="ml-auto px-2.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Desconectar</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Conecte sua conta Google para salvar automaticamente os dados de colaboradores e férias no Firestore Database na nuvem, permitindo acessar em qualquer celular ou computador.
                </p>

                <button
                  type="button"
                  onClick={handleConnectGoogle}
                  disabled={isCloudSyncing}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>{isCloudSyncing ? 'Conectando...' : 'Conectar com Google (Ativar Nuvem)'}</span>
                </button>
              </div>
            )}

            {cloudFeedback && (
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 bg-indigo-100/70 dark:bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 font-medium flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 shrink-0" />
                <span>{cloudFeedback}</span>
              </div>
            )}
          </div>

          {/* Dados Pessoais */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo do Gestor *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Carlos Eduardo Silveira"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome de Usuário *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cargo / Departamento
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="Ex: Gestor de RH"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>
          </div>

          {/* 1. SEÇÃO DE SEGURANÇA: CRIAÇÃO DE PIN (4 DÍGITOS) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200">
              <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Senha de Acesso: PIN Numérico (4 Dígitos)</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              O PIN será exigido na tela de bloqueio sempre que você recarregar a página ou abrir o aplicativo.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Criar PIN (4 dígitos) *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full px-3 py-2 text-center text-base tracking-widest font-mono font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirmar PIN *
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                  required
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  className="w-full px-3 py-2 text-center text-base tracking-widest font-mono font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 2. SEÇÃO DE RECUPERAÇÃO: PERGUNTA E RESPOSTA DE SEGURANÇA */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-200">
              <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Recuperação de Acesso ("Esqueci minha senha")</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
              Caso você esqueça o seu PIN, esta pergunta e resposta permitirão desbloquear ou redefinir seu acesso.
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Pergunta de Segurança *
              </label>
              <select
                value={selectedQuestion}
                onChange={(e) => setSelectedQuestion(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              >
                {PRESET_SECURITY_QUESTIONS.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>

            {selectedQuestion === 'Outra (personalizada)' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Digite sua pergunta personalizada *
                </label>
                <input
                  type="text"
                  required
                  value={customQuestion}
                  onChange={(e) => setCustomQuestion(e.target.value)}
                  placeholder="Ex: Qual o apelido do meu irmão?"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Resposta de Segurança *
              </label>
              <input
                type="text"
                required
                value={respostaSeguranca}
                onChange={(e) => setRespostaSeguranca(e.target.value)}
                placeholder="Ex: Colégio Santos Dumont"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Dica: Resposta não diferencia maiúsculas de minúsculas ao recuperar.
              </span>
            </div>
          </div>

          {/* 3. CADASTRO ÚNICO DE BIOMETRIA (CONFIGURAÇÕES) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Cadastrar/Ativar Biometria (Passkey / WebAuthn)
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Criação única da chave de acesso no dispositivo. Após cadastrada, a tela de bloqueio apenas verifica sua digital sem solicitar nova criação de chave.
                </p>
              </div>

              {/* Status Badge */}
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                  biometriaCadastrada && biometriaAtiva
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {biometriaCadastrada && biometriaAtiva ? 'Cadastrada & Ativa' : 'Desativada'}
              </span>
            </div>

            {/* Ação de Cadastro Único ou Gerenciamento */}
            {!biometriaCadastrada || !biometriaAtiva ? (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleCadastrarBiometria}
                  disabled={isRegisteringBiometric}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {tipoBiometria === 'face_id' ? (
                    <Scan className="w-4 h-4" />
                  ) : (
                    <Fingerprint className="w-4 h-4" />
                  )}
                  <span>
                    {isRegisteringBiometric
                      ? 'Criando chave de acesso no sensor...'
                      : 'Cadastrar/Ativar Biometria'}
                  </span>
                </button>
                <span className="text-[10px] text-slate-400 mt-1.5 block text-center">
                  * Executado uma única vez para registrar seu Touch ID, Face ID ou biometria nativa.
                </span>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-semibold">
                      Chave biométrica registrada com sucesso neste dispositivo.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDesativarBiometria}
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold cursor-pointer shrink-0 ml-2"
                  >
                    Desativar
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTipoBiometria('touch_id')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer ${
                      tipoBiometria === 'touch_id'
                        ? 'border-indigo-600 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>TouchID / Digital</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoBiometria('face_id')}
                    className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer ${
                      tipoBiometria === 'face_id'
                        ? 'border-indigo-600 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-semibold shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-900'
                    }`}
                  >
                    <Scan className="w-4 h-4" />
                    <span>FaceID / Facial</span>
                  </button>
                </div>
              </div>
            )}

            {biometricFeedback && (
              <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/60 dark:bg-indigo-950/40 p-2 rounded-lg border border-indigo-200/60 dark:border-indigo-900/40">
                {biometricFeedback}
              </div>
            )}
          </div>

          {/* 4. PERSONALIZAÇÃO DE CORES */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-slate-400" />
                <span>Personalizar Cor Principal do CFC</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 capitalize">{accentColor}</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'indigo', name: 'Índigo', bg: 'bg-indigo-600' },
                { id: 'blue', name: 'Azul', bg: 'bg-blue-600' },
                { id: 'emerald', name: 'Esmeralda', bg: 'bg-emerald-600' },
                { id: 'amber', name: 'Âmbar', bg: 'bg-amber-600' },
                { id: 'violet', name: 'Violeta', bg: 'bg-violet-600' },
                { id: 'rose', name: 'Rosa', bg: 'bg-rose-600' },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setAccentColor(c.id as typeof accentColor)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    accentColor === c.id
                      ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800 font-semibold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${c.bg} flex items-center justify-center`}>
                    {accentColor === c.id && <Check className="w-3 h-3 text-white stroke-[3]" />}
                  </div>
                  <span className="text-[10px] text-slate-600 dark:text-slate-300">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. MODO CLARO / ESCURO */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Tema Visual
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Alternar entre Modo Claro e Escuro
              </span>
            </div>
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {darkMode ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Modo Escuro</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Modo Claro</span>
                </>
              )}
            </button>
          </div>

          {/* Mensagem de Feedback */}
          {feedback && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-center gap-1.5 ${
                feedback.tipo === 'sucesso'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              {feedback.tipo === 'sucesso' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{feedback.texto}</span>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Perfil e PIN</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
