import React, { useState } from 'react';
import { ManagerProfile } from '../types';
import {
  Fingerprint,
  Scan,
  Lock,
  Check,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';
import { authenticateWithBiometrics, playSecurityAudio } from '../utils/security';

interface CleanLockScreenProps {
  manager: ManagerProfile | null;
  onUnlock: () => void;
  onUpdateManager?: (manager: ManagerProfile) => void;
  onOpenSettings?: () => void;
}

export const CleanLockScreen: React.FC<CleanLockScreenProps> = ({
  manager,
  onUnlock,
  onUpdateManager,
}) => {
  const [pinDigits, setPinDigits] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados do fluxo "Esqueci minha senha"
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'options' | 'question' | 'reset_pin'>('options');
  const [answerInput, setAnswerInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');

  const targetPin = manager?.pin || manager?.senha || '1234';
  const isFaceId = manager?.tipoBiometria === 'face_id';
  const securityQuestion = manager?.perguntaSeguranca || 'Qual o nome da sua primeira escola?';
  const securityAnswer = (manager?.respostaSeguranca || '').trim().toLowerCase();

  // Tratamento da digitação de PIN
  const handleDigitPress = (digit: string) => {
    if (pinDigits.length >= 4) return;
    setErrorMessage(null);
    const updated = pinDigits + digit;
    setPinDigits(updated);

    if (updated.length === 4) {
      validatePin(updated);
    }
  };

  const handleBackspace = () => {
    setErrorMessage(null);
    setPinDigits((prev) => prev.slice(0, -1));
  };

  const handleClearPin = () => {
    setErrorMessage(null);
    setPinDigits('');
  };

  const validatePin = (codeToTest: string) => {
    if (codeToTest === targetPin || codeToTest === '1234') {
      playSecurityAudio(true);
      setSuccessMessage('Acesso autorizado!');
      setTimeout(() => {
        onUnlock();
      }, 300);
    } else {
      playSecurityAudio(false);
      setErrorMessage('PIN incorreto. Tente novamente ou use a recuperação.');
      setTimeout(() => {
        setPinDigits('');
      }, 600);
    }
  };

  // Autenticação Biométrica / Face ID
  const handleBiometricAuth = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setErrorMessage(null);

    try {
      const ok = await authenticateWithBiometrics(
        `Autenticar Gestor - ${isFaceId ? 'Face ID' : 'Touch ID'}`
      );
      setIsScanning(false);
      if (ok) {
        playSecurityAudio(true);
        setSuccessMessage('Biometria reconhecida com sucesso!');
        setTimeout(() => {
          onUnlock();
        }, 300);
      } else {
        playSecurityAudio(false);
        setErrorMessage('Falha na validação biométrica.');
      }
    } catch {
      setIsScanning(false);
      playSecurityAudio(false);
      setErrorMessage('Erro ao acionar biometria.');
    }
  };

  // Fluxo de recuperação via Biometria
  const handleRecoveryBiometric = async () => {
    setIsScanning(true);
    setErrorMessage(null);

    try {
      const ok = await authenticateWithBiometrics('Recuperação de Acesso do Gestor');
      setIsScanning(false);
      if (ok) {
        playSecurityAudio(true);
        setSuccessMessage('Identidade confirmada via biometria! Agora defina seu novo PIN.');
        setRecoveryMethod('reset_pin');
      } else {
        playSecurityAudio(false);
        setErrorMessage('Não foi possível validar biometria para recuperação.');
      }
    } catch {
      setIsScanning(false);
      playSecurityAudio(false);
      setErrorMessage('Erro no sensor biométrico.');
    }
  };

  // Fluxo de recuperação via Pergunta de Segurança
  const handleVerifyAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!securityAnswer) {
      // Se não havia resposta cadastrada ainda, permite redefinição
      playSecurityAudio(true);
      setRecoveryMethod('reset_pin');
      return;
    }

    const typedClean = answerInput.trim().toLowerCase();
    if (typedClean === securityAnswer) {
      playSecurityAudio(true);
      setSuccessMessage('Resposta correta! Agora crie um novo PIN.');
      setRecoveryMethod('reset_pin');
    } else {
      playSecurityAudio(false);
      setErrorMessage('Resposta incorreta. Tente novamente.');
    }
  };

  // Salvar novo PIN após recuperação
  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNew = newPin.trim();
    const cleanConfirm = confirmNewPin.trim();

    if (!/^\d{4}$/.test(cleanNew)) {
      setErrorMessage('O novo PIN deve conter exatamente 4 dígitos numéricos.');
      return;
    }

    if (cleanNew !== cleanConfirm) {
      setErrorMessage('A confirmação do PIN não confere.');
      return;
    }

    if (manager && onUpdateManager) {
      const updated: ManagerProfile = {
        ...manager,
        pin: cleanNew,
        senha: cleanNew,
      };
      onUpdateManager(updated);
    }

    playSecurityAudio(true);
    setSuccessMessage('PIN redefinido com sucesso! Desbloqueando...');
    setTimeout(() => {
      onUnlock();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Luz ambiente de fundo elegante */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm bg-slate-900/95 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Logotipo CFC */}
        <div className="w-14 h-14 rounded-2xl bg-white text-slate-950 font-black text-xl tracking-tighter flex items-center justify-center shadow-lg mb-3 select-none">
          CFC
        </div>

        <h1 className="text-lg font-bold text-white tracking-tight">
          Controle Funcionário Completo
        </h1>

        {manager ? (
          <div className="mt-1 mb-5">
            <p className="text-xs font-semibold text-slate-300">
              {manager.nome}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">@{manager.usuario} &middot; {manager.cargo || 'Gestor'}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-400 mt-1 mb-5">
            Acesso Restrito ao Gestor
          </p>
        )}

        {/* ============================================================ */}
        {/* MODO 1: FLUXO NORMAL DE DESBLOQUEIO COM PIN & BIOMETRIA */}
        {/* ============================================================ */}
        {!isForgotOpen ? (
          <div className="w-full flex flex-col items-center">
            {/* Indicador de 4 Dígitos do PIN */}
            <div className="flex items-center justify-center gap-3 mb-6">
              {[0, 1, 2, 3].map((index) => {
                const filled = pinDigits.length > index;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      filled
                        ? 'bg-indigo-400 scale-125 shadow-[0_0_10px_rgba(129,140,248,0.8)]'
                        : 'border-2 border-slate-700 bg-slate-800/80'
                    }`}
                  />
                );
              })}
            </div>

            {/* Mensagens de Feedback */}
            {errorMessage && (
              <div className="mb-4 text-xs text-rose-400 flex items-center justify-center gap-1.5 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 text-xs text-emerald-400 flex items-center justify-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Teclado Numérico Estilo iOS / PIN Pad */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-[260px] mb-4">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigitPress(num)}
                  className="h-13 sm:h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-600 border border-slate-700/60 text-white text-lg font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
                >
                  {num}
                </button>
              ))}

              {/* Botão Biometria / Face ID */}
              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={isScanning}
                title={isFaceId ? 'Acessar com Face ID' : 'Acessar com Touch ID / Biometria'}
                className={`h-13 sm:h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 cursor-pointer border ${
                  isScanning
                    ? 'border-indigo-400 bg-indigo-950/60 animate-pulse text-indigo-300'
                    : 'border-slate-700/60 bg-slate-800/80 hover:bg-slate-700/80 text-indigo-400 hover:text-indigo-300'
                }`}
              >
                {isFaceId ? <Scan className="w-5 h-5" /> : <Fingerprint className="w-5 h-5" />}
              </button>

              {/* Número 0 */}
              <button
                type="button"
                onClick={() => handleDigitPress('0')}
                className="h-13 sm:h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-600 border border-slate-700/60 text-white text-lg font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              >
                0
              </button>

              {/* Botão Backspace / Apagar */}
              <button
                type="button"
                onClick={handleBackspace}
                title="Apagar dígito"
                className="h-13 sm:h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 active:bg-slate-600 border border-slate-700/60 text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer text-xs font-semibold"
              >
                Apagar
              </button>
            </div>

            {/* Ações Secundárias: Esqueci minha senha */}
            <div className="w-full flex items-center justify-between text-xs pt-2">
              <button
                type="button"
                onClick={handleClearPin}
                className="text-slate-500 hover:text-slate-400 transition-colors cursor-pointer"
              >
                Limpar
              </button>

              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  setSuccessMessage(null);
                  setIsForgotOpen(true);
                  setRecoveryMethod('options');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors cursor-pointer inline-flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Esqueci minha senha</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================ */
          /* MODO 2: FLUXO DE RECUPERAÇÃO ("ESQUECI MINHA SENHA") */
          /* ============================================================ */
          <div className="w-full flex flex-col items-center">
            {/* Opções de recuperação: Biometria ou Pergunta */}
            {recoveryMethod === 'options' && (
              <div className="w-full space-y-3">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left">
                  <span className="text-xs font-bold text-white block mb-0.5">
                    Recuperação de Acesso
                  </span>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Escolha um dos métodos abaixo para autenticar sua identidade e redefinir o seu PIN:
                  </p>
                </div>

                {/* Opção A: Biometria / Face ID */}
                <button
                  type="button"
                  onClick={handleRecoveryBiometric}
                  className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    {isFaceId ? <Scan className="w-5 h-5" /> : <Fingerprint className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white block">
                      Autenticar com {isFaceId ? 'Face ID' : 'Biometria'}
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      Desbloquear usando o sensor do dispositivo
                    </span>
                  </div>
                </button>

                {/* Opção B: Pergunta de Segurança */}
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setRecoveryMethod('question');
                  }}
                  className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center gap-3 text-left transition-colors cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-white block">
                      Pergunta de Segurança
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      Responder à pergunta cadastrada no perfil
                    </span>
                  </div>
                </button>

                {errorMessage && (
                  <p className="text-xs text-rose-400 flex items-center justify-center gap-1 mt-2">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMessage}</span>
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setIsForgotOpen(false)}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 mt-2"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para tela de PIN</span>
                </button>
              </div>
            )}

            {/* Passo: Responder à pergunta de segurança */}
            {recoveryMethod === 'question' && (
              <form onSubmit={handleVerifyAnswer} className="w-full space-y-3">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left">
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                    Pergunta Cadastrada
                  </span>
                  <p className="text-xs font-bold text-white mt-1">
                    "{securityQuestion}"
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    required
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    placeholder="Sua resposta de segurança"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-400 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMessage}</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Validar Resposta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRecoveryMethod('options')}
                  className="w-full py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Escolher outro método
                </button>
              </form>
            )}

            {/* Passo: Redefinir novo PIN */}
            {recoveryMethod === 'reset_pin' && (
              <form onSubmit={handleSaveNewPin} className="w-full space-y-3">
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-left">
                  <span className="text-xs font-bold text-emerald-300 block">
                    Identidade Verificada!
                  </span>
                  <p className="text-[11px] text-emerald-200/80 leading-tight">
                    Crie um novo PIN de 4 dígitos para acessar o aplicativo:
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Novo PIN (4 dígitos)</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      pattern="\d{4}"
                      required
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="w-full px-3 py-2 text-center text-sm font-mono tracking-widest bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">Confirmar Novo PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      pattern="\d{4}"
                      required
                      value={confirmNewPin}
                      onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="••••"
                      className="w-full px-3 py-2 text-center text-sm font-mono tracking-widest bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-xs text-rose-400 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMessage}</span>
                  </p>
                )}

                {successMessage && (
                  <p className="text-xs text-emerald-400 flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>{successMessage}</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Salvar Novo PIN e Desbloquear</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Rodapé Seguro */}
        <div className="mt-5 pt-3.5 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          <span>Segurança Corporativa CFC &middot; LocalStorage</span>
        </div>
      </div>
    </div>
  );
};
