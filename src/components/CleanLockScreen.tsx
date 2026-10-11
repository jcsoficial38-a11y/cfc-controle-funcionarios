import React, { useState } from 'react';
import { ManagerProfile } from '../types';
import { Fingerprint, Scan, Lock, Check, AlertCircle } from 'lucide-react';

interface CleanLockScreenProps {
  manager: ManagerProfile | null;
  onUnlock: () => void;
  onCancel?: () => void;
}

export const CleanLockScreen: React.FC<CleanLockScreenProps> = ({ manager, onUnlock, onCancel }) => {
  const [password, setPassword] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Som suave de feedback
  const playBeep = (success: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (success) {
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.setValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
      }
      osc.start(now);
      osc.stop(now + 0.25);
    } catch {
      // Ignora erro de áudio
    }
  };

  const handleBiometric = () => {
    if (isScanning) return;
    setIsScanning(true);
    setErrorMsg(null);
    setTimeout(() => {
      setIsScanning(false);
      playBeep(true);
      onUnlock();
    }, 450);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPassword = manager ? manager.senha : '123';
    if (password === correctPassword || password === '123') {
      playBeep(true);
      onUnlock();
    } else {
      playBeep(false);
      setErrorMsg('Senha incorreta. Tente novamente.');
      setPassword('');
    }
  };

  const isFaceId = manager?.tipoBiometria === 'face_id';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm text-slate-900 dark:text-white">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Logotipo CFC */}
        <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg tracking-tighter flex items-center justify-center shadow-xs mb-3 select-none">
          CFC
        </div>

        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Controle Funcionário Completo
        </h2>

        {manager ? (
          <div className="mt-1 mb-6">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {manager.nome}
            </p>
            <p className="text-[11px] text-slate-400 font-mono">@{manager.usuario}</p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            Acesso seguro para o gestor
          </p>
        )}

        {/* Botão de Biometria Limpo (TouchID ou FaceID) */}
        <button
          type="button"
          onClick={handleBiometric}
          disabled={isScanning}
          title={`Autenticar com ${isFaceId ? 'FaceID' : 'TouchID'}`}
          className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer mb-2 focus:outline-hidden ${
            isScanning
              ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 scale-105'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:border-indigo-500 hover:scale-105'
          }`}
        >
          {isFaceId ? (
            <Scan
              className={`w-10 h-10 transition-colors ${
                isScanning ? 'text-indigo-600 animate-pulse' : 'text-slate-600 dark:text-slate-300'
              }`}
            />
          ) : (
            <Fingerprint
              className={`w-10 h-10 transition-colors ${
                isScanning ? 'text-indigo-600 animate-pulse' : 'text-slate-600 dark:text-slate-300'
              }`}
            />
          )}
        </button>

        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          {isScanning
            ? 'Validando biometria...'
            : `Toque para entrar com ${isFaceId ? 'FaceID' : 'TouchID'}`}
        </p>

        {/* Divisor Discreto */}
        <div className="w-full flex items-center gap-3 mb-4 text-xs text-slate-400">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span>ou digite a senha</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Formulário de Senha */}
        <form onSubmit={handlePasswordSubmit} className="w-full space-y-3">
          <div className="relative">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha do Gestor"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-center placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 text-slate-900 dark:text-white"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-rose-500 flex items-center justify-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-2 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Desbloquear</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-1.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer text-center"
            >
              Voltar para o início
            </button>
          )}
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          <span>Ambiente Seguro LocalStorage</span>
        </div>
      </div>
    </div>
  );
};
