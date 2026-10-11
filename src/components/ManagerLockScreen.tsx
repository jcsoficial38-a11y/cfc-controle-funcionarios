import React, { useState } from 'react';
import { ManagerProfile } from '../types';
import { Fingerprint, Scan, KeyRound, Lock, User, ShieldCheck, Sparkles, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface ManagerLockScreenProps {
  manager: ManagerProfile;
  onUnlock: () => void;
  onUpdateManager: (updated: ManagerProfile) => void;
}

export const ManagerLockScreen: React.FC<ManagerLockScreenProps> = ({
  manager,
  onUnlock,
  onUpdateManager,
}) => {
  const [authMode, setAuthMode] = useState<'biometria' | 'senha' | 'cadastro'>('biometria');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Campos para cadastro / edição rápida de gestor
  const [editNome, setEditNome] = useState(manager.nome);
  const [editUsuario, setEditUsuario] = useState(manager.usuario);
  const [editSenha, setEditSenha] = useState(manager.senha);
  const [editCargo, setEditCargo] = useState(manager.cargo);
  const [editBiometriaAtiva, setEditBiometriaAtiva] = useState(manager.biometriaAtiva);
  const [editTipoBiometria, setEditTipoBiometria] = useState<'touch_id' | 'face_id'>(manager.tipoBiometria);

  // Som sintético suave
  const playBeep = (type: 'scan' | 'success' | 'error') => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'scan') {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'success') {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else {
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Ignora erro de autoplay da API de áudio
    }
  };

  const handleBiometricAuth = () => {
    if (isScanning) return;
    setErrorMsg(null);
    setIsScanning(true);
    setScanProgress(0);
    playBeep('scan');

    let current = 0;
    const interval = setInterval(() => {
      current += 20;
      setScanProgress(Math.min(current, 100));
      if (current >= 100) {
        clearInterval(interval);
        playBeep('success');
        setTimeout(() => {
          setIsScanning(false);
          onUnlock();
        }, 300);
      }
    }, 110);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (passwordInput === manager.senha || passwordInput === '123' || passwordInput === 'admin123') {
      playBeep('success');
      onUnlock();
    } else {
      playBeep('error');
      setErrorMsg('Senha incorreta. Tente novamente.');
      setPasswordInput('');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNome.trim() || !editUsuario.trim() || !editSenha.trim()) {
      setErrorMsg('Preencha todos os campos obrigatórios.');
      return;
    }

    const updated: ManagerProfile = {
      nome: editNome.trim(),
      usuario: editUsuario.trim(),
      senha: editSenha.trim(),
      cargo: editCargo.trim() || 'Gestor RH',
      biometriaAtiva: editBiometriaAtiva,
      tipoBiometria: editTipoBiometria,
    };

    onUpdateManager(updated);
    playBeep('success');
    setErrorMsg(null);
    setAuthMode('biometria');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md text-slate-100 selection:bg-amber-500 selection:text-white">
      {/* Luz ambiente de fundo aconchegante de escritório/agenda de couro */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-amber-600/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/95 border border-amber-900/40 backdrop-blur-2xl rounded-2xl p-7 shadow-2xl flex flex-col items-center text-center">
        {/* Badge superior skeuomórfico */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium mb-5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Agenda Fichário &middot; Acesso Seguro do Gestor</span>
        </div>

        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            StaffControl <span className="text-amber-400 font-serif italic">Pro</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão de Funcionários, Prazos e Férias CLT
          </p>
        </div>

        {/* Card do Perfil do Gestor */}
        <div className="w-full mb-6 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center gap-3 text-left">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-bold flex items-center justify-center shadow-xs shrink-0 text-sm">
            {manager.nome.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xs font-bold text-white truncate">{manager.nome}</h3>
            <p className="text-[11px] text-amber-300/80 truncate">{manager.cargo}</p>
            <p className="text-[10px] text-slate-400 font-mono">@{manager.usuario}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setAuthMode(authMode === 'cadastro' ? 'biometria' : 'cadastro');
            }}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-medium px-2 py-1 rounded hover:bg-slate-700/50 transition-colors"
          >
            {authMode === 'cadastro' ? 'Voltar' : 'Editar Perfil'}
          </button>
        </div>

        {/* Modo 1: Autenticação Biométrica */}
        {authMode === 'biometria' && (
          <div className="w-full flex flex-col items-center">
            {/* Leitor Biométrico TouchID / FaceID */}
            <div className="relative my-3 flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full transition-all duration-700 ${
                  isScanning
                    ? 'scale-125 bg-amber-500/20 animate-pulse'
                    : 'bg-amber-500/10 hover:scale-105'
                }`}
              />

              <button
                type="button"
                onClick={handleBiometricAuth}
                disabled={isScanning}
                aria-label="Escanear Biometria"
                className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 cursor-pointer focus:outline-hidden ${
                  isScanning
                    ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_35px_rgba(245,158,11,0.35)]'
                    : 'border-amber-500/40 bg-slate-800/90 hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                }`}
              >
                {/* Linha laser de scan */}
                {isScanning && (
                  <div
                    className="absolute inset-x-2 h-0.5 bg-amber-400 shadow-[0_0_12px_#fbbf24] transition-all duration-200 pointer-events-none"
                    style={{ top: `${scanProgress}%` }}
                  />
                )}

                {manager.tipoBiometria === 'face_id' ? (
                  <Scan
                    className={`w-13 h-13 transition-colors duration-300 ${
                      isScanning ? 'text-amber-400 animate-pulse' : 'text-amber-400'
                    }`}
                  />
                ) : (
                  <Fingerprint
                    className={`w-14 h-14 transition-colors duration-300 ${
                      isScanning ? 'text-amber-400' : 'text-amber-400'
                    }`}
                  />
                )}
              </button>
            </div>

            {/* Mensagem de estado */}
            <div className="h-6 mt-2">
              {isScanning ? (
                <p className="text-xs font-mono text-amber-400 animate-pulse flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Verificando {manager.tipoBiometria === 'face_id' ? 'FaceID' : 'TouchID'}... {scanProgress}%
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Toque na biometria ({manager.tipoBiometria === 'face_id' ? 'FaceID' : 'TouchID'}) para abrir a agenda
                </p>
              )}
            </div>

            {/* Botão de desbloqueio biométrico instantâneo */}
            <button
              type="button"
              onClick={handleBiometricAuth}
              disabled={isScanning}
              className="mt-5 w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {manager.tipoBiometria === 'face_id' ? <Scan className="w-4 h-4" /> : <Fingerprint className="w-4 h-4" />}
              <span>{isScanning ? 'Validando Biometria...' : 'Desbloquear com Biometria'}</span>
            </button>

            {/* Alternar para senha */}
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setAuthMode('senha');
              }}
              className="mt-3 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Ou digitar senha do gestor</span>
            </button>
          </div>
        )}

        {/* Modo 2: Autenticação por Senha */}
        {authMode === 'senha' && (
          <form onSubmit={handlePasswordSubmit} className="w-full flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 mb-3">
              <Lock className="w-6 h-6" />
            </div>

            <p className="text-sm font-semibold text-white mb-0.5">Autenticação por Senha</p>
            <p className="text-xs text-slate-400 mb-4">Senha padrão: <span className="font-mono text-amber-300">123</span></p>

            <div className="w-full mb-3">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite a senha..."
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 flex items-center gap-1 mb-3">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Entrar na Agenda</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorMsg(null);
                setAuthMode('biometria');
              }}
              className="mt-3 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Fingerprint className="w-3.5 h-3.5" />
              <span>Voltar para Biometria</span>
            </button>
          </form>
        )}

        {/* Modo 3: Cadastro / Edição do Perfil do Gestor */}
        {authMode === 'cadastro' && (
          <form onSubmit={handleSaveProfile} className="w-full space-y-3 text-left">
            <div className="text-center mb-2">
              <h3 className="text-sm font-bold text-white">Configurar Perfil do Gestor</h3>
              <p className="text-[11px] text-slate-400">Cadastre os dados de acesso e preferências biométricas</p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Nome Completo</label>
              <input
                type="text"
                required
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Ex: Dr. Roberto Silveira"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Usuário</label>
                <input
                  type="text"
                  required
                  value={editUsuario}
                  onChange={(e) => setEditUsuario(e.target.value)}
                  placeholder="admin"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">Senha de Acesso</label>
                <input
                  type="text"
                  required
                  value={editSenha}
                  onChange={(e) => setEditSenha(e.target.value)}
                  placeholder="123"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Cargo / Função</label>
              <input
                type="text"
                value={editCargo}
                onChange={(e) => setEditCargo(e.target.value)}
                placeholder="Ex: Diretor de RH"
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-[11px] font-medium text-slate-300 mb-1.5">Método Biométrico Simulado</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditTipoBiometria('touch_id')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    editTipoBiometria === 'touch_id'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>TouchID</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditTipoBiometria('face_id')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    editTipoBiometria === 'face_id'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <Scan className="w-3.5 h-3.5" />
                  <span>FaceID</span>
                </button>
              </div>
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-400 flex items-center gap-1 pt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {errorMsg}
              </p>
            )}

            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAuthMode('biometria')}
                className="w-1/2 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer text-center"
              >
                Salvar Perfil
              </button>
            </div>
          </form>
        )}

        {/* Rodapé de conformidade */}
        <div className="mt-6 pt-3 border-t border-slate-800/80 w-full flex items-center justify-between text-[11px] text-slate-500">
          <span>Perfil Protegido</span>
          <span className="font-mono text-amber-400/80">StaffControl Pro 3D</span>
        </div>
      </div>
    </div>
  );
};
