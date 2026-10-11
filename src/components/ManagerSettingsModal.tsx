import React, { useState, useEffect } from 'react';
import { ManagerProfile } from '../types';
import { X, ShieldCheck, KeyRound, Check, AlertCircle, Palette, Sun, Moon, Fingerprint, Scan, User, Lock, Sparkles } from 'lucide-react';

interface ManagerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerProfile | null;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onUpdateManager: (updated: ManagerProfile) => void;
}

export const ManagerSettingsModal: React.FC<ManagerSettingsModalProps> = ({
  isOpen,
  onClose,
  manager,
  darkMode,
  onToggleDarkMode,
  onUpdateManager,
}) => {
  const [nome, setNome] = useState(manager?.nome || '');
  const [usuario, setUsuario] = useState(manager?.usuario || 'admin');
  const [cargo, setCargo] = useState(manager?.cargo || 'Gestor de Pessoal / RH');
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [tipoBiometria, setTipoBiometria] = useState<'touch_id' | 'face_id'>(manager?.tipoBiometria || 'touch_id');
  const [biometriaAtiva, setBiometriaAtiva] = useState<boolean>(manager?.biometriaAtiva ?? true);
  const [accentColor, setAccentColor] = useState<'indigo' | 'emerald' | 'blue' | 'amber' | 'violet' | 'rose'>(
    manager?.accentColor || 'indigo'
  );
  const [feedback, setFeedback] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    if (manager) {
      setNome(manager.nome);
      setUsuario(manager.usuario);
      setCargo(manager.cargo);
      setTipoBiometria(manager.tipoBiometria || 'touch_id');
      setBiometriaAtiva(manager.biometriaAtiva ?? true);
      setAccentColor(manager.accentColor || 'indigo');
    }
  }, [manager, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!nome.trim() || !usuario.trim()) {
      setFeedback({ tipo: 'erro', texto: 'Informe seu Nome e Nome de Usuário.' });
      return;
    }

    // Se for primeiro cadastro do gestor
    if (!manager) {
      if (!novaSenha.trim()) {
        setFeedback({ tipo: 'erro', texto: 'Defina uma senha de acesso para o gestor.' });
        return;
      }
    } else {
      // Se já existia e está alterando a senha
      if (novaSenha.trim()) {
        if (senhaAtual !== manager.senha && manager.senha) {
          setFeedback({ tipo: 'erro', texto: 'A senha atual informada está incorreta.' });
          return;
        }
        if (novaSenha.trim().length < 3) {
          setFeedback({ tipo: 'erro', texto: 'A nova senha deve ter pelo menos 3 caracteres.' });
          return;
        }
      }
    }

    const updated: ManagerProfile = {
      nome: nome.trim(),
      usuario: usuario.trim().toLowerCase(),
      cargo: cargo.trim() || 'Gestor RH',
      senha: novaSenha.trim() ? novaSenha.trim() : (manager?.senha || '123'),
      biometriaAtiva,
      tipoBiometria,
      accentColor,
    };

    onUpdateManager(updated);
    setFeedback({ tipo: 'sucesso', texto: 'Perfil e configurações salvos com sucesso!' });
    setTimeout(() => {
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Cabeçalho */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {manager ? 'Perfil do Gestor & Configurações' : 'Cadastro de Perfil do Gestor'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalização de cores, tema, senha e biometria
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

          {/* Troca / Definição de Senha */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>{manager ? 'Alteração de Senha (Opcional)' : 'Definição de Senha de Acesso *'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {manager && (
                <div>
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Confirme a atual"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              )}

              <div className={!manager ? 'col-span-2' : ''}>
                <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                  {manager ? 'Nova Senha' : 'Senha de Acesso *'}
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder={manager ? 'Deixe em branco p/ manter' : 'Digite a senha'}
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Biometria de Segurança */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                  Biometria de Segurança
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Ativar ou alternar o método biométrico simulado
                </span>
              </div>
              <button
                type="button"
                onClick={() => setBiometriaAtiva(!biometriaAtiva)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  biometriaAtiva
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}
              >
                {biometriaAtiva ? 'Ativada' : 'Desativada'}
              </button>
            </div>

            {biometriaAtiva && (
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
                  <span>TouchID (Digital)</span>
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
                  <span>FaceID (Facial)</span>
                </button>
              </div>
            )}
          </div>

          {/* Personalizar Cores Principais do Aplicativo */}
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

          {/* Alternar Modo Claro e Escuro */}
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

          {/* Botões */}
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
              <span>Salvar Perfil e Configurações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
