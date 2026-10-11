import React, { useState } from 'react';
import { ManagerProfile } from '../types';
import { X, ShieldCheck, Fingerprint, Scan, KeyRound, Check, AlertCircle } from 'lucide-react';

interface ManagerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: ManagerProfile;
  onUpdateManager: (updated: ManagerProfile) => void;
}

export const ManagerProfileModal: React.FC<ManagerProfileModalProps> = ({
  isOpen,
  onClose,
  manager,
  onUpdateManager,
}) => {
  const [nome, setNome] = useState(manager.nome);
  const [usuario, setUsuario] = useState(manager.usuario);
  const [cargo, setCargo] = useState(manager.cargo);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [tipoBiometria, setTipoBiometria] = useState<'touch_id' | 'face_id'>(manager.tipoBiometria);
  const [biometriaAtiva, setBiometriaAtiva] = useState(manager.biometriaAtiva);
  const [mensagem, setMensagem] = useState<{ tipo: 'erro' | 'sucesso'; texto: string } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMensagem(null);

    // Se informou nova senha, exige confirmação da senha atual
    if (novaSenha.trim()) {
      if (senhaAtual !== manager.senha) {
        setMensagem({ tipo: 'erro', texto: 'Senha atual incorreta para realizar alteração.' });
        return;
      }
    }

    const updated: ManagerProfile = {
      ...manager,
      nome: nome.trim(),
      usuario: usuario.trim(),
      cargo: cargo.trim(),
      senha: novaSenha.trim() ? novaSenha.trim() : manager.senha,
      tipoBiometria,
      biometriaAtiva,
    };

    onUpdateManager(updated);
    setMensagem({ tipo: 'sucesso', texto: 'Perfil do gestor atualizado com sucesso!' });
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-amber-900/30 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Perfil do Gestor Responsável
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ajustes de segurança, credenciais e biometria
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo do Gestor
            </label>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome de Usuário
              </label>
              <input
                type="text"
                required
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cargo / Departamento
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
          </div>

          {/* Seção de Troca de Senha */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>Alteração de Senha (Opcional)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={senhaAtual}
                  onChange={(e) => setSenhaAtual(e.target.value)}
                  placeholder="Confirme para alterar"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 dark:text-slate-400 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  placeholder="Deixe em branco se não mudar"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Configuração de Biometria */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tipo de Biometria Padrão
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoBiometria('touch_id')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  tipoBiometria === 'touch_id'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Fingerprint className="w-5 h-5 text-amber-600" />
                <div className="text-left text-xs">
                  <div>TouchID / Digital</div>
                  <div className="text-[10px] text-slate-400 font-normal">Impressão dactilar</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTipoBiometria('face_id')}
                className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                  tipoBiometria === 'face_id'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <Scan className="w-5 h-5 text-amber-600" />
                <div className="text-left text-xs">
                  <div>FaceID / Reconhecimento</div>
                  <div className="text-[10px] text-slate-400 font-normal">Scanner facial</div>
                </div>
              </button>
            </div>
          </div>

          {/* Mensagem de Feedback */}
          {mensagem && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-1.5 ${
                mensagem.tipo === 'sucesso'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
              }`}
            >
              {mensagem.tipo === 'sucesso' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{mensagem.texto}</span>
            </div>
          )}

          {/* Botões */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
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
