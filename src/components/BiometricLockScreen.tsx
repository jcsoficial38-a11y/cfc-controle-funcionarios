import React, { useState } from 'react';
import { Fingerprint, Lock, ShieldCheck, KeyRound, Sparkles, AlertCircle } from 'lucide-react';

interface BiometricLockScreenProps {
  onUnlock: () => void;
}

export const BiometricLockScreen: React.FC<BiometricLockScreenProps> = ({ onUnlock }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [pinMode, setPinMode] = useState(false);
  const [pin, setPin] = useState('');

  // Toca som suave sintético via Web Audio API para feedback háptico/auditivo
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
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.1); // A5
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
      // Audio context may be restricted by browser policy, ignore gracefully
    }
  };

  const handleTriggerBiometric = () => {
    if (isScanning) return;
    setAuthError(null);
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
        }, 350);
      }
    }, 120);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234' || pin.length >= 4) {
      playBeep('success');
      onUnlock();
    } else {
      playBeep('error');
      setAuthError('PIN incorreto. Digite 1234 ou 4 dígitos.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Luz ambiente de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Badge superior */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Acesso Seguro Corporativo</span>
        </div>

        {/* Identidade */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            StaffControl <span className="text-indigo-400 font-semibold">Pro</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestão de Funcionários & Controle de Férias CLT
          </p>
        </div>

        {!pinMode ? (
          <div className="flex flex-col items-center w-full">
            {/* Leitor Biométrico Interativo */}
            <div className="relative my-4 flex items-center justify-center">
              {/* Círculo com pulso */}
              <div
                className={`absolute inset-0 rounded-full transition-all duration-700 ${
                  isScanning
                    ? 'scale-125 bg-emerald-500/20 animate-pulse'
                    : 'bg-indigo-500/10 hover:scale-110'
                }`}
              />

              {/* Botão Biometria */}
              <button
                type="button"
                onClick={handleTriggerBiometric}
                disabled={isScanning}
                aria-label="Escanear Biometria"
                className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center border-2 transition-all duration-300 cursor-pointer focus:outline-hidden focus:ring-4 focus:ring-indigo-500/40 ${
                  isScanning
                    ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_35px_rgba(16,185,129,0.35)]'
                    : 'border-indigo-500/40 bg-slate-800/80 hover:border-indigo-400 hover:bg-slate-800 hover:shadow-[0_0_25px_rgba(99,102,241,0.25)]'
                }`}
              >
                {/* Linha laser de escaneamento em movimento */}
                {isScanning && (
                  <div
                    className="absolute inset-x-2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] transition-all duration-200 pointer-events-none"
                    style={{ top: `${scanProgress}%` }}
                  />
                )}

                <Fingerprint
                  className={`w-14 h-14 transition-colors duration-300 ${
                    isScanning ? 'text-emerald-400' : 'text-indigo-400'
                  }`}
                />
              </button>
            </div>

            {/* Status do escaneamento */}
            <div className="h-6 mt-3">
              {isScanning ? (
                <p className="text-xs font-mono text-emerald-400 animate-pulse flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Verificando credencial biométrica... {scanProgress}%
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Toque ou clique na digital para autenticar
                </p>
              )}
            </div>

            {/* Ação Primária Instantânea */}
            <button
              type="button"
              onClick={handleTriggerBiometric}
              disabled={isScanning}
              className="mt-6 w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Fingerprint className="w-4 h-4" />
              <span>{isScanning ? 'Autenticando...' : 'Desbloquear com Biometria'}</span>
            </button>

            {/* Alternar para PIN */}
            <button
              type="button"
              onClick={() => {
                setPinMode(true);
                setAuthError(null);
              }}
              className="mt-3 text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Ou entrar utilizando código PIN</span>
            </button>
          </div>
        ) : (
          <form onSubmit={handlePinSubmit} className="w-full flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 mb-4">
              <KeyRound className="w-6 h-6" />
            </div>

            <p className="text-sm text-slate-300 font-medium mb-1">Digite o PIN de Segurança</p>
            <p className="text-xs text-slate-400 mb-4">PIN padrão: 1234</p>

            <div className="w-full max-w-xs mb-4">
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                autoFocus
                className="w-full text-center text-2xl tracking-widest py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            {authError && (
              <p className="text-xs text-rose-400 flex items-center gap-1 mb-3">
                <AlertCircle className="w-3.5 h-3.5" />
                {authError}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Lock className="w-4 h-4" />
              <span>Confirmar e Entrar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPinMode(false);
                setAuthError(null);
              }}
              className="mt-3 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Voltar para Autenticação Biométrica
            </button>
          </form>
        )}

        {/* Rodapé de conformidade */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 w-full flex items-center justify-between text-[11px] text-slate-400">
          <span>Sessão Local Protegida</span>
          <span className="font-mono text-slate-300">CLT Compliance</span>
        </div>
      </div>
    </div>
  );
};
