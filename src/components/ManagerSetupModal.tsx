import React, { useState } from 'react';
import { ManagerProfile } from '../types';
import { ShieldCheck, Fingerprint, Scan, Check, User, KeyRound, Lock, Palette } from 'lucide-react';

interface ManagerSetupModalProps {
  onComplete: (manager: ManagerProfile) => void;
  onCancel?: () => void;
}

export const ManagerSetupModal: React.FC<ManagerSetupModalProps> = ({ onComplete, onCancel }) => {
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [cargo, setCargo] = useState('Gestor de Pessoal / RH');
  const [tipoBiometria, setTipoBiometria] = useState<'touch_id' | 'face_id'>('touch_id');
  const [accentColor, setAccentColor] = useState<'indigo' | 'emerald' | 'blue' | 'amber' | 'violet' | 'rose'>('indigo');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !usuario.trim() || !senha.trim()) {
      setError('Por favor, preencha o Nome, Usuário e Senha de acesso.');
      return;
    }

    const newManager: ManagerProfile = {
      nome: nome.trim(),
      usuario: usuario.trim().toLowerCase(),
      senha: senha.trim(),
      cargo: cargo.trim() || 'Gestor RH',
      biometriaAtiva: true,
      tipoBiometria,
      accentColor,
    };

    onComplete(newManager);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md text-slate-900 dark:text-white">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        {/* Topo / Boas-vindas */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg tracking-tighter flex items-center justify-center shadow-md mb-3 select-none">
            CFC
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Primeiro Acesso &middot; Configuração Inicial</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Cadastrar Perfil do Gestor
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
            Para garantir a segurança dos dados dos funcionários, configure sua conta administrativa de acesso.
          </p>
        </div>

        {/* Formulário de Cadastro */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-left">
          {/* Nome */}
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
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Usuário e Senha */}
          <div className="grid grid-cols-2 gap-3">
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
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Senha de Acesso *
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Cargo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Cargo / Departamento
            </label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ex: Gestor de RH"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Biometria Padrão */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Simulação de Biometria Preferida
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoBiometria('touch_id')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
                  tipoBiometria === 'touch_id'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Fingerprint className="w-4 h-4" />
                <span>TouchID (Digital)</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoBiometria('face_id')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
                  tipoBiometria === 'face_id'
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Scan className="w-4 h-4" />
                <span>FaceID (Facial)</span>
              </button>
            </div>
          </div>

          {/* Personalizar Cor Principal do Aplicativo */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span>Cor Principal do Aplicativo</span>
            </label>
            <div className="flex items-center gap-2">
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
                  title={c.name}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-all cursor-pointer flex items-center justify-center ${
                    accentColor === c.id ? 'ring-3 ring-offset-2 ring-slate-400 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {accentColor === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-xs text-rose-500 text-center">{error}</p>}

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Concluir Cadastro e Ativar Sistema</span>
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer text-center"
            >
              Voltar para o início
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
