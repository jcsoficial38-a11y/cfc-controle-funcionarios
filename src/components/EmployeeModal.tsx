import React, { useState, useEffect } from 'react';
import { Employee, Gender } from '../types';
import { AvatarIllustration } from './AvatarIllustration';
import { formatPhoneNumber } from '../utils/vacationCalculator';
import { X, Trash2, Check, User, Phone, Calendar, Briefcase, Image as ImageIcon } from 'lucide-react';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (employeeData: Omit<Employee, 'id' | 'vacationRecords' | 'criadoEm'>, id?: string) => void;
  onDelete?: (id: string) => void;
  employeeToEdit?: Employee | null;
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  employeeToEdit,
}) => {
  const [nome, setNome] = useState('');
  const [apelido, setApelido] = useState('');
  const [telefone, setTelefone] = useState('');
  const [genero, setGenero] = useState<Gender>('M');
  const [fotoUrl, setFotoUrl] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [dataDemissao, setDataDemissao] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (employeeToEdit) {
      setNome(employeeToEdit.nome);
      setApelido(employeeToEdit.apelido || '');
      setTelefone(employeeToEdit.telefone || '');
      setGenero(employeeToEdit.genero || 'M');
      setFotoUrl(employeeToEdit.fotoUrl || '');
      setCargo(employeeToEdit.cargo || '');
      setDepartamento(employeeToEdit.departamento || '');
      setDataAdmissao(employeeToEdit.dataAdmissao || '');
      setDataDemissao(employeeToEdit.dataDemissao || '');
    } else {
      setNome('');
      setApelido('');
      setTelefone('');
      setGenero('M');
      setFotoUrl('');
      setCargo('');
      setDepartamento('');
      setDataAdmissao(new Date().toISOString().split('T')[0]);
      setDataDemissao('');
    }
    setErrors({});
  }, [employeeToEdit, isOpen]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setTelefone(formatted);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!nome.trim()) newErrors.nome = 'Nome Completo é obrigatório.';
    if (!telefone.trim() || telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = 'Telefone válido com DDD é obrigatório.';
    }
    if (!dataAdmissao) newErrors.dataAdmissao = 'Data de admissão é obrigatória.';

    if (dataDemissao && dataAdmissao && dataDemissao < dataAdmissao) {
      newErrors.dataDemissao = 'Data de demissão não pode ser anterior à admissão.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave(
      {
        nome: nome.trim(),
        apelido: apelido.trim(),
        telefone: telefone.trim(),
        genero,
        fotoUrl: fotoUrl.trim() || undefined,
        cargo: cargo.trim() || 'Colaborador',
        departamento: departamento.trim() || 'Geral',
        dataAdmissao,
        dataDemissao: dataDemissao ? dataDemissao : undefined,
      },
      employeeToEdit?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Cabeçalho */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {employeeToEdit ? 'Editar Cadastro de Funcionário' : 'Novo Cadastro de Funcionário'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preencha os dados cadastrais e as datas contratuais CLT
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Pré-visualização do Avatar */}
          <div className="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-4 pt-5 sm:pt-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center rounded-full overflow-hidden bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 shadow-xs ring-2 ring-slate-100 dark:ring-slate-800">
              <AvatarIllustration
                genero={genero}
                fotoUrl={fotoUrl}
                nome={nome || 'Funcionário'}
                size="lg"
                className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">
                Avatar Automático por Gênero
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {fotoUrl ? 'Foto personalizada carregada com sucesso.' : 'Se não inserir URL de foto, o sistema gera este desenho vetorial correspondente ao gênero selecionado.'}
              </p>
            </div>
          </div>

          {/* Nome e Apelido */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Nome Completo *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Carlos Eduardo Moreira"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              {errors.nome && <p className="text-xs text-rose-500 mt-1">{errors.nome}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Apelido / Preferencial
              </label>
              <input
                type="text"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                placeholder="Ex: Kaká"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Telefone e Gênero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Telefone / WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  value={telefone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 98765-4321"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              {errors.telefone && <p className="text-xs text-rose-500 mt-1">{errors.telefone}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Gênero (Para Avatar Ilustrado) *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGenero('M')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    genero === 'M'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Masculino
                </button>
                <button
                  type="button"
                  onClick={() => setGenero('F')}
                  className={`py-2 px-3 text-xs font-medium rounded-lg border transition-all cursor-pointer ${
                    genero === 'F'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 font-semibold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  Feminino
                </button>
              </div>
            </div>
          </div>

          {/* Cargo e Departamento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Cargo / Função
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  placeholder="Ex: Desenvolvedor, Vendedor..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Departamento / Setor
              </label>
              <input
                type="text"
                value={departamento}
                onChange={(e) => setDepartamento(e.target.value)}
                placeholder="Ex: Comercial, TI, RH, Operações"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* URL da Foto (opcional) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              URL da Foto (Opcional)
            </label>
            <div className="relative">
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="url"
                value={fotoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="https://exemplo.com/foto.jpg"
                className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Seção CLT: Admissão e Demissão */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Vigência Contratual CLT
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data de Admissão *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    required
                    value={dataAdmissao}
                    onChange={(e) => setDataAdmissao(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                {errors.dataAdmissao && (
                  <p className="text-xs text-rose-500 mt-1">{errors.dataAdmissao}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Data de Demissão (Opcional)
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={dataDemissao}
                    onChange={(e) => setDataDemissao(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Se preenchido, o colaborador vira &quot;Demitido&quot; e sai da contagem de ativos.
                </p>
                {errors.dataDemissao && (
                  <p className="text-xs text-rose-500 mt-1">{errors.dataDemissao}</p>
                )}
              </div>
            </div>
          </div>

          {/* Botões do Rodapé */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {employeeToEdit && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Tem certeza que deseja excluir o cadastro de ${employeeToEdit.nome}?`)) {
                    onDelete(employeeToEdit.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Salvar Funcionário</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
