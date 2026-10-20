import React, { useState, useEffect, useRef } from 'react';
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
  Cloud,
  RefreshCw,
  LogOut,
  Database,
  ChevronDown,
  ChevronUp,
  Trash2,
  RotateCcw,
  Upload,
  Download,
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
  onExportData?: () => void;
  onImportData?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRestoreSafetyBackup?: () => void;
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
  onExportData,
  onRestoreSafetyBackup,
}) => {
  // Estados do Perfil
  const [nome, setNome] = useState(manager?.nome || '');
  const [usuario, setUsuario] = useState(manager?.usuario || 'admin');
  const [cargo, setCargo] = useState(manager?.cargo || 'Gestor de Pessoal / RH');
  const [fotoUrl, setFotoUrl] = useState<string | undefined>(manager?.fotoUrl);

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

  // Biometria
  const [tipoBiometria, setTipoBiometria] = useState<'touch_id' | 'face_id'>(
    manager?.tipoBiometria || 'touch_id'
  );
  const [biometriaAtiva, setBiometriaAtiva] = useState<boolean>(manager?.biometriaAtiva ?? false);
  const [biometriaCadastrada, setBiometriaCadastrada] = useState<boolean>(
    manager?.biometriaCadastrada ?? false
  );
  const [isRegisteringBiometric, setIsRegisteringBiometric] = useState<boolean>(false);
  const [biometricFeedback, setBiometricFeedback] = useState<string | null>(null);

  // Aparência & Tema
  const [accentColor, setAccentColor] = useState<
    'indigo' | 'emerald' | 'blue' | 'amber' | 'violet' | 'rose'
  >(manager?.accentColor || 'indigo');

  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Controle do Accordion (Lista Expansível): por padrão abrimos Dados Pessoais
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pessoais: true,
    seguranca: false,
    lixeira: false,
    dados: false,
    aparencia: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const fileInputPhotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (manager) {
      setNome(manager.nome);
      setUsuario(manager.usuario);
      setCargo(manager.cargo);
      setFotoUrl(manager.fotoUrl);
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

  // Upload de Foto de Perfil
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFotoUrl(result);
        setFeedback({ tipo: 'sucesso', texto: 'Foto carregada! Clique em "Salvar Alterações" para aplicar.' });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setFotoUrl(undefined);
    setFeedback({ tipo: 'sucesso', texto: 'Foto removida. Clique em "Salvar Alterações".' });
  };

  // Biometria
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

        if (manager) {
          const updatedManager: ManagerProfile = {
            ...manager,
            biometriaAtiva: true,
            biometriaCadastrada: true,
            credencialBiometricaId: result.credentialId,
            tipoBiometria,
          };
          onUpdateManager(updatedManager);
        }
      } else {
        setBiometricFeedback(result.error || 'Não foi possível cadastrar a biometria.');
      }
    } catch {
      setIsRegisteringBiometric(false);
      setBiometricFeedback('Erro ao comunicar com o sensor biométrico.');
    }
  };

  const handleDesativarBiometria = () => {
    setBiometriaAtiva(false);
    clearBiometricPasskey();
    setBiometriaCadastrada(false);
    setBiometricFeedback('Biometria desativada.');
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

  // Firebase Cloud Database
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
      setCloudFeedback('Conectado ao Google com sucesso! Sincronizando com Firestore...');
      if (employees) {
        const res = await syncDataToCloud(employees, manager);
        if (res.success) {
          setLastSyncTime(res.timestamp);
          try {
            localStorage.setItem('cfc_last_cloud_sync_time', res.timestamp);
          } catch {
            // ignore
          }
          setCloudFeedback(`Sincronizado Online! (${res.timestamp}) - ${res.count} colaboradores.`);
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('popup-closed-by-user')) {
        setCloudFeedback('Conexão cancelada pelo usuário.');
      } else {
        setCloudFeedback('Não foi possível conectar com Google.');
      }
    } finally {
      setIsCloudSyncing(false);
    }
  };

  const handleSyncNow = async () => {
    if (!authUser || !employees) return;
    setIsCloudSyncing(true);
    setCloudFeedback('Sincronizando com Firestore...');
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
    } catch {
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

  const handleRestoreFromCloudAction = async () => {
    if (!authUser || !onRestoreFromCloud) return;
    if (confirm('Deseja restaurar os colaboradores salvos no Firestore deste usuário?')) {
      setIsCloudSyncing(true);
      setCloudFeedback('Baixando dados do Firestore...');
      try {
        const result = await fetchDataFromCloud();
        if (result.employees && result.employees.length > 0) {
          onRestoreFromCloud(result.employees, result.manager);
          setCloudFeedback(`${result.employees.length} colaborador(es) restaurados da nuvem!`);
        } else {
          setCloudFeedback('Nenhum registro encontrado nesta conta do Firestore.');
        }
      } catch {
        setCloudFeedback('Erro ao baixar dados do Firestore.');
      } finally {
        setIsCloudSyncing(false);
      }
    }
  };

  if (!isOpen) return null;

  // Submit Geral
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!nome.trim() || !usuario.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Informe seu Nome e Nome de Usuário.' });
      return;
    }

    const cleanPin = pin.trim();
    const cleanConfirm = confirmPin.trim();

    if (!cleanPin || !/^\d{4}$/.test(cleanPin)) {
      setFeedback({ tipo: 'erro', texto: 'O PIN deve conter exatamente 4 dígitos numéricos (ex: 1234).' });
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setFeedback({ tipo: 'erro', texto: 'A confirmação do PIN não confere com o PIN digitado.' });
      return;
    }

    const finalQuestion =
      selectedQuestion === 'Outra (personalizada)'
        ? customQuestion.trim()
        : selectedQuestion.trim();

    if (!finalQuestion || !respostaSeguranca.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Preencha a Pergunta e Resposta de Segurança.' });
      return;
    }

    const updated: ManagerProfile = {
      nome: nome.trim(),
      usuario: usuario.trim().toLowerCase(),
      cargo: cargo.trim() || 'Gestor RH',
      senha: cleanPin,
      pin: cleanPin,
      perguntaSeguranca: finalQuestion,
      respostaSeguranca: respostaSeguranca.trim(),
      biometriaAtiva,
      biometriaCadastrada,
      credencialBiometricaId: manager?.credencialBiometricaId,
      tipoBiometria,
      fotoUrl,
      accentColor,
    };

    onUpdateManager(updated);
    setFeedback({ tipo: 'sucesso', texto: 'Perfil, PIN e Configurações salvos com sucesso!' });
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
                Perfil do Gestor & Configurações
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Menu expansível de gerenciamento e segurança
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

        {/* Formulário com Accordion em Lista Expansível */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 max-h-[80vh] overflow-y-auto">
          
          {/* ======================================================== */}
          {/* 1. DADOS PESSOAIS */}
          {/* ======================================================== */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
            <button
              type="button"
              onClick={() => toggleSection('pessoais')}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Dados Pessoais
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Nome, usuário, cargo e foto de perfil
                  </span>
                </div>
              </div>
              {openSections.pessoais ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.pessoais && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* Foto de Perfil */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt="Foto do Gestor"
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-sm"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 font-bold text-lg flex items-center justify-center border-2 border-indigo-500/30 shadow-sm">
                        {nome ? nome.slice(0, 2).toUpperCase() : 'G'}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputPhotoRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputPhotoRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Enviar Foto</span>
                    </button>

                    {fotoUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/40 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remover</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo do Gestor *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo Silveira"
                    className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail / Login *
                    </label>
                    <input
                      type="text"
                      required
                      value={usuario}
                      onChange={(e) => setUsuario(e.target.value)}
                      placeholder="admin"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Cargo / Departamento
                    </label>
                    <input
                      type="text"
                      value={cargo}
                      onChange={(e) => setCargo(e.target.value)}
                      placeholder="Ex: Gestor de Pessoal / RH"
                      className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 2. SEGURANÇA & BIOMETRIA */}
          {/* ======================================================== */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
            <button
              type="button"
              onClick={() => toggleSection('seguranca')}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Segurança & Biometria
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    PIN numérico, pergunta de recuperação e biometria digital
                  </span>
                </div>
              </div>
              {openSections.seguranca ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.seguranca && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* PIN */}
                <div className="p-3 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>PIN Numérico (4 Dígitos)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Novo PIN (4 dígitos) *</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        pattern="\d{4}"
                        required
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="w-full px-3 py-1.5 text-center text-sm font-mono font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Confirmar PIN *</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={4}
                        pattern="\d{4}"
                        required
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="••••"
                        className="w-full px-3 py-1.5 text-center text-sm font-mono font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Pergunta de Segurança */}
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 dark:text-amber-200">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Recuperação de Acesso</span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Pergunta de Segurança *</label>
                    <select
                      value={selectedQuestion}
                      onChange={(e) => setSelectedQuestion(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                    >
                      {PRESET_SECURITY_QUESTIONS.map((q) => (
                        <option key={q} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  {selectedQuestion === 'Outra (personalizada)' && (
                    <div>
                      <input
                        type="text"
                        required
                        value={customQuestion}
                        onChange={(e) => setCustomQuestion(e.target.value)}
                        placeholder="Digite sua pergunta personalizada"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] text-slate-600 dark:text-slate-400 mb-1">Resposta de Segurança *</label>
                    <input
                      type="text"
                      required
                      value={respostaSeguranca}
                      onChange={(e) => setRespostaSeguranca(e.target.value)}
                      placeholder="Sua resposta secreta"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Biometria / Passkey */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Ativar / Cadastrar Biometria (Digital)
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        Uso do sensor nativo do dispositivo
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${biometriaCadastrada && biometriaAtiva ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'}`}>
                      {biometriaCadastrada && biometriaAtiva ? 'Ativa' : 'Desativada'}
                    </span>
                  </div>

                  {!biometriaCadastrada || !biometriaAtiva ? (
                    <button
                      type="button"
                      onClick={handleCadastrarBiometria}
                      disabled={isRegisteringBiometric}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>{isRegisteringBiometric ? 'Cadastrando...' : 'Cadastrar Biometria'}</span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-300">
                        <span className="flex items-center gap-1 font-medium">
                          <Check className="w-3.5 h-3.5" /> Biometria ativa
                        </span>
                        <button
                          type="button"
                          onClick={handleDesativarBiometria}
                          className="text-[11px] text-rose-600 hover:underline font-semibold cursor-pointer"
                        >
                          Desativar
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTipoBiometria('touch_id')}
                          className={`py-1.5 px-2 rounded-lg border text-xs cursor-pointer ${tipoBiometria === 'touch_id' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                        >
                          Touch ID
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoBiometria('face_id')}
                          className={`py-1.5 px-2 rounded-lg border text-xs cursor-pointer ${tipoBiometria === 'face_id' ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}
                        >
                          Face ID
                        </button>
                      </div>
                    </div>
                  )}

                  {biometricFeedback && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                      {biometricFeedback}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 3. LIXEIRA LOCAL & HISTÓRICO */}
          {/* ======================================================== */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
            <button
              type="button"
              onClick={() => toggleSection('lixeira')}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Lixeira Local & Backups
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Visualizar registros anteriores e restaurar backups
                  </span>
                </div>
              </div>
              {openSections.lixeira ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.lixeira && (
              <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  O aplicativo mantém um backup automático preventivo de segurança antes de cada alteração em lote, importação ou reset.
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {onRestoreSafetyBackup && (
                    <button
                      type="button"
                      onClick={onRestoreSafetyBackup}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Backup de Segurança</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Deseja limpar o histórico de backups temporários locais?')) {
                        try {
                          localStorage.removeItem('cfc_employees_pre_reset_backup');
                          alert('Lixeira local esvaziada com sucesso.');
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    <span>Esvaziar Lixeira / Histórico</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 4. DADOS E SINCRONIZAÇÃO (FIREBASE) */}
          {/* ======================================================== */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
            <button
              type="button"
              onClick={() => toggleSection('dados')}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Dados e Sincronização (Firebase)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Status da nuvem, exportação de relatórios e backup JSON
                  </span>
                </div>
              </div>
              {openSections.dados ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.dados && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* Cloud Status Card */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-sky-50/40 to-slate-50 dark:from-indigo-950/40 dark:via-sky-950/30 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Banco de Dados na Nuvem</span>
                    </span>
                    {authUser ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Firestore Conectado
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        Offline / Local
                      </span>
                    )}
                  </div>

                  {authUser ? (
                    <div className="space-y-2.5 pt-1">
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] text-slate-400 block">Conectado como:</span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate block">
                            {authUser.displayName || authUser.email}
                          </span>
                        </div>
                        {lastSyncTime && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            Sync: {lastSyncTime}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSyncNow}
                          disabled={isCloudSyncing}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                          <span>Sincronizar Agora</span>
                        </button>
                        {onRestoreFromCloud && (
                          <button
                            type="button"
                            onClick={handleRestoreFromCloudAction}
                            disabled={isCloudSyncing}
                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <Cloud className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Restaurar da Nuvem</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleDisconnect}
                          className="ml-auto px-2 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Desconectar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 pt-1">
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Conecte sua conta Google para sincronizar os dados na nuvem e acessá-los em qualquer dispositivo.
                      </p>
                      <button
                        type="button"
                        onClick={handleConnectGoogle}
                        disabled={isCloudSyncing}
                        className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-xs"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                        </svg>
                        <span>{isCloudSyncing ? 'Conectando...' : 'Conectar com Google (Ativar Nuvem)'}</span>
                      </button>
                    </div>
                  )}

                  {cloudFeedback && (
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
                      {cloudFeedback}
                    </p>
                  )}
                </div>

                {/* Export JSON */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Backup & Relatório JSON
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Exportar arquivo de dados do CFC
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 5. APARÊNCIA & TEMA */}
          {/* ======================================================== */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
            <button
              type="button"
              onClick={() => toggleSection('aparencia')}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Aparência & Tema
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Modo claro/escuro e cor de destaque
                  </span>
                </div>
              </div>
              {openSections.aparencia ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.aparencia && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {/* Tema claro / escuro */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                      Modo Noturno (Dark Mode)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Alternar visualização clara e escura
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleDarkMode}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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

                {/* Cor principal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                    <span>Cor de Destaque do App</span>
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
              </div>
            )}
          </div>

          {/* Compartilhamento via WhatsApp */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 block truncate">
                Compartilhar Aplicativo
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block leading-tight">
                Envie o link do CFC via WhatsApp
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const appUrl = typeof window !== 'undefined' ? window.location.href : 'https://cfc-app.vercel.app';
                const message = `Olá! Conheça o CFC (Controle Funcionário Completo), o aplicativo ideal para gestão de equipe e férias CLT:\n\n${appUrl}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
              }}
              className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
            >
              <WhatsAppIcon className="w-4 h-4 fill-white" />
              <span>Compartilhar</span>
            </button>
          </div>

          {/* Feedback */}
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

          {/* Botões Finais de Ação */}
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
              <span>Salvar Alterações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
