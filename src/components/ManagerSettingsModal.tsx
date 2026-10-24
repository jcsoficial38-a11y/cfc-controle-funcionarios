import React, { useState, useEffect, useRef } from 'react';
import { Employee, ManagerProfile, DeletedItem } from '../types';
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


interface ManagerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerProfile | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdateManager: (updated: ManagerProfile) => void;
  employees?: Employee[];
  trash: DeletedItem[];
  onRestoreFromTrash: (id: string) => void;
  onDeletePermanently: (id: string) => void;
  onClearTrash: () => void;
  onRestoreFromCloud?: (cloudEmployees: Employee[], cloudManager?: ManagerProfile | null) => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onRestoreSafetyBackup?: () => void;
  onResetTotal?: () => void;
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
  trash,
  onRestoreFromTrash,
  onDeletePermanently,
  onClearTrash,
  onRestoreFromCloud,
  onExportData,
  onImportData,
  onRestoreSafetyBackup,
  onResetTotal,
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

  // Controle do Accordion (Lista Expansível): por padrão todas as seções iniciam recolhidas
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pessoais: false,
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



  if (!isOpen) return null;

  // Salvar somente Dados Pessoais
  const handleSavePersonalData = () => {
    setFeedback(null);
    if (!nome.trim() || !usuario.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Informe seu Nome Completo e E-mail / Login.' });
      return;
    }

    const updated: ManagerProfile = {
      ...(manager || {
        senha: pin || undefined,
        pin: pin || undefined,
        perguntaSeguranca: selectedQuestion,
        respostaSeguranca: respostaSeguranca || undefined,
        biometriaAtiva: false,
        tipoBiometria: 'touch_id',
        cargo: 'Gestor RH',
      }),
      nome: nome.trim(),
      usuario: usuario.trim().toLowerCase(),
      cargo: cargo.trim() || 'Gestor RH',
      fotoUrl,
      accentColor,
    };

    onUpdateManager(updated);
    setFeedback({ tipo: 'sucesso', texto: 'Dados pessoais atualizados com sucesso!' });
  };

  // Salvar somente Segurança & Biometria
  const handleSaveSecurity = () => {
    setFeedback(null);
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

    const updated: ManagerProfile = {
      ...(manager || {
        nome: nome || 'Gestor',
        usuario: usuario || 'admin',
        cargo: cargo || 'Gestor RH',
      }),
      senha: cleanPin,
      pin: cleanPin,
      perguntaSeguranca: finalQuestion || manager?.perguntaSeguranca || PRESET_SECURITY_QUESTIONS[0],
      respostaSeguranca: respostaSeguranca.trim() || manager?.respostaSeguranca || 'padrao',
      biometriaAtiva,
      biometriaCadastrada,
      credencialBiometricaId: manager?.credencialBiometricaId,
      tipoBiometria,
    };

    onUpdateManager(updated);
    setFeedback({ tipo: 'sucesso', texto: 'Configurações de segurança e PIN salvas com sucesso!' });
  };

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
                    Nome Completo, E-mail/Login e Foto de Perfil
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

                {/* Botão de Salvar Alterações dentro de Dados Pessoais */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSavePersonalData}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Alterações</span>
                  </button>
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
                    Ativar/Cadastrar Biometria (Digital) e PIN/Senha
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

                {/* Botão de Salvar Alterações dentro de Segurança & Biometria */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveSecurity}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-transform active:scale-95 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar Segurança</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 3. LIXEIRA LOCAL */}
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
                    Lixeira Local
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Visualizar registros e lançamentos excluídos
                  </span>
                </div>
              </div>
              {openSections.lixeira ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.lixeira && (
              <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {trash.length === 0 ? (
                  <div className="py-6 px-4 text-center">
                    <Trash2 className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-1.5" />
                    <p className="text-xs text-slate-500 italic">Nenhum item na lixeira</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {trash.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200/80 dark:border-slate-700/60 rounded-xl flex items-center justify-between gap-3 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                            {item.data.nome || item.data.titulo || 'Registro sem nome'}
                          </span>
                          {(item.data.cargo || item.data.funcao || item.data.departamento) && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">
                              {item.data.cargo || item.data.funcao || item.data.departamento}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Excluído em: {new Date(item.deletedAt).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onRestoreFromTrash(item.id)}
                            title="Restaurar este colaborador/registro"
                            className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restaurar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeletePermanently(item.id)}
                            title="Excluir definitivamente"
                            className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 dark:hover:bg-rose-900/80 text-rose-800 dark:text-rose-300 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Excluir Definitivamente</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {onRestoreSafetyBackup ? (
                    <button
                      type="button"
                      onClick={onRestoreSafetyBackup}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restaurar Backup Global</span>
                    </button>
                  ) : <div />}
                  {trash.length > 0 && (
                    <button
                      type="button"
                      onClick={onClearTrash}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Esvaziar Lixeira</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ======================================================== */}
          {/* 4. BACKUP & DADOS LOCAIS */}
          {/* ======================================================== */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-colors">
            <button
              type="button"
              onClick={() => toggleSection('dados')}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Backup & Dados Locais
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Exportação, importação e reset total do banco de dados
                  </span>
                </div>
              </div>
              {openSections.dados ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>

            {openSections.dados && (
              <div className="p-4 space-y-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={onExportData}
                    className="p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Exportar Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={onImportData}
                    className="p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Importar Backup</span>
                  </button>

                  <button
                    type="button"
                    onClick={onResetTotal}
                    className="p-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex flex-col items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Total</span>
                  </button>
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
                    Alternar entre Tema Claro e Tema Escuro (Modo Noturno)
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
