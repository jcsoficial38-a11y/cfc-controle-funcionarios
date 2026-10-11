import React, { useState } from 'react';
import { Employee, CalculatedVacationPeriod } from '../types';
import { AvatarIllustration } from './AvatarIllustration';
import {
  calculateVacationSummary,
  calculateCompanyTenure,
  calculateProbationStatus,
  formatBRDate,
  formatWhatsAppUrl,
} from '../utils/vacationCalculator';
import {
  X,
  Calendar,
  Clock,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Briefcase,
  Building,
  PlusCircle,
  Trash2,
  ShieldAlert,
  Award,
  Edit2,
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface EmployeeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  onEdit: (employee: Employee) => void;
  onOpenVacationLaunch: (employee: Employee, periodIndex: number) => void;
  onDeleteRecord: (employeeId: string, recordId: string) => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  isOpen,
  onClose,
  employee,
  onEdit,
  onOpenVacationLaunch,
  onDeleteRecord,
}) => {
  const [activeTab, setActiveTab] = useState<'ferias' | 'contrato'>('ferias');

  if (!isOpen || !employee) return null;

  const isDemitido = Boolean(employee.dataDemissao);
  const tenure = calculateCompanyTenure(employee.dataAdmissao, employee.dataDemissao);
  const probation = calculateProbationStatus(employee.dataAdmissao);
  const vacationSummary = calculateVacationSummary(employee);
  const whatsappUrl = formatWhatsAppUrl(employee.telefone, employee.apelido || employee.nome);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Topo / Banner de Perfil */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-white dark:from-slate-800/80 dark:via-indigo-950/20 dark:to-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <AvatarIllustration
              genero={employee.genero}
              fotoUrl={employee.fotoUrl}
              nome={employee.nome}
              size="xl"
            />
            <div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {employee.nome}
                </h2>
                {employee.apelido && (
                  <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                    &ldquo;{employee.apelido}&rdquo;
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {employee.cargo || 'Colaborador'}
                </span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                <span className="flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  {employee.departamento || 'Setor Geral'}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {/* Botão de WhatsApp direto com chat */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-medium transition-colors shadow-xs"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  <span>Conversar no WhatsApp ({employee.telefone})</span>
                </a>

                {/* Status Ativo / Demitido */}
                <span
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                    isDemitido
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}
                >
                  {isDemitido ? 'Contrato Demitido' : 'Colaborador Ativo'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onEdit(employee)}
              title="Editar Dados Cadastrais"
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Abas do Perfil */}
        <div className="px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('ferias')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'ferias'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Gestão & Períodos de Férias CLT
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contrato')}
            className={`pb-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'contrato'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Prazos de Experiência & Contrato
          </button>
        </div>

        {/* Conteúdo rolável */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'ferias' ? (
            <div className="space-y-6">
              {/* Alerta Geral se houver férias pendentes ou vencidas */}
              {vacationSummary.temFériasVencidas && (
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block">Atenção Crítica: Férias Vencidas</span>
                    <p className="mt-0.5 text-rose-700 dark:text-rose-300">
                      O prazo concessivo legal de 1 ano expirou. Pela CLT (art. 137), as férias vencidas devem ser remuneradas em dobro se não regularizadas imediatamente.
                    </p>
                  </div>
                </div>
              )}

              {vacationSummary.temFériasAlerta && !vacationSummary.temFériasVencidas && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-bold block">Alerta de Vencimento Próximo (≤ 60 dias)</span>
                    <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                      Existem férias prestes a vencer o período concessivo nos próximos 60 dias. Agende o gozo com antecedência.
                    </p>
                  </div>
                </div>
              )}

              {/* Lista dos Períodos Aquisitivos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Histórico de Períodos Aquisitivos (Linha do Tempo)
                  </h3>
                  <span className="text-xs text-slate-500 font-mono">
                    Total: {vacationSummary.periodos.length} {vacationSummary.periodos.length === 1 ? 'período' : 'períodos'}
                  </span>
                </div>

                <div className="space-y-4">
                  {vacationSummary.periodos.map((period: CalculatedVacationPeriod) => {
                    const isVencido = period.status === 'vencido';
                    const isAlerta = period.status === 'alerta';
                    const isQuitado = period.status === 'quitado';
                    const isAndamento = period.status === 'em_andamento';

                    return (
                      <div
                        key={period.periodIndex}
                        className={`rounded-xl p-4.5 border transition-all ${
                          isVencido
                            ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10'
                            : isAlerta
                            ? 'border-amber-300 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/10'
                            : isQuitado
                            ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10 dark:bg-emerald-950/10'
                            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40'
                        }`}
                      >
                        {/* Linha superior do período */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {period.periodIndex + 1}º Período Aquisitivo
                              </span>
                              {isAndamento && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                  Em Aquisição
                                </span>
                              )}
                              {isQuitado && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Férias em Dia (Quitado)
                                </span>
                              )}
                              {isAlerta && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> A Vencer em Breve
                                </span>
                              )}
                              {isVencido && (
                                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                                  <AlertOctagon className="w-3 h-3" /> Férias Vencidas
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
                              Aquisitivo: {formatBRDate(period.periodoAquisitivoInicio)} até{' '}
                              {formatBRDate(period.periodoAquisitivoFim)}
                            </p>
                          </div>

                          {/* Contador regressivo dinâmico */}
                          <div className="text-right">
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                              Limite Concessivo: {formatBRDate(period.periodoConcessivoLimite)}
                            </span>
                            {!isQuitado && !isAndamento && (
                              <div
                                className={`text-xs font-mono font-bold mt-0.5 ${
                                  isVencido
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : isAlerta
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }`}
                              >
                                {isVencido
                                  ? `Vencidas há ${Math.abs(period.diasParaVencer)} dias!`
                                  : `Faltam ${period.diasParaVencer} dias para o limite`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Barra de distribuição de dias */}
                        <div className="mt-3 pt-3 border-t border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center gap-3">
                              <span className="text-slate-600 dark:text-slate-300 font-medium">
                                Utilização dos 30 dias:
                              </span>
                              <span className="text-indigo-600 dark:text-indigo-400">
                                {period.diasGozados}d gozo
                              </span>
                              {period.diasVendidos > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                  +{period.diasVendidos}d abono
                                </span>
                              )}
                            </div>

                            <div className="font-mono tabular-nums font-semibold text-slate-700 dark:text-slate-300">
                              Saldo Restante: {period.saldoRestante} dias
                            </div>
                          </div>

                          {/* Barra visual proporcional */}
                          <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${(period.diasGozados / 30) * 100}%` }}
                              className="bg-indigo-600 dark:bg-indigo-500 h-full"
                              title={`${period.diasGozados} dias gozados`}
                            />
                            <div
                              style={{ width: `${(period.diasVendidos / 30) * 100}%` }}
                              className="bg-emerald-500 h-full"
                              title={`${period.diasVendidos} dias vendidos`}
                            />
                          </div>
                        </div>

                        {/* Histórico de lançamentos deste período */}
                        {period.records.length > 0 && (
                          <div className="mt-3 pt-2 space-y-1.5">
                            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                              Lançamentos Efetuados:
                            </span>
                            {period.records.map((rec) => (
                              <div
                                key={rec.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs"
                              >
                                <div>
                                  <span className="font-medium text-slate-800 dark:text-slate-200">
                                    {rec.tipo === 'misto'
                                      ? `${rec.diasGozados} dias de férias + ${rec.diasVendidos} dias de abono`
                                      : rec.tipo === 'abono'
                                      ? `Venda de ${rec.diasVendidos} dias (Abono pecuniário)`
                                      : `${rec.diasGozados} dias de férias`}
                                  </span>
                                  {rec.dataInicioGozo && rec.dataFimGozo && (
                                    <span className="text-slate-500 dark:text-slate-400 font-mono ml-2">
                                      ({formatBRDate(rec.dataInicioGozo)} a {formatBRDate(rec.dataFimGozo)})
                                    </span>
                                  )}
                                  {rec.observacao && (
                                    <p className="text-[11px] text-slate-400 mt-0.5">{rec.observacao}</p>
                                  )}
                                </div>

                                <button
                                  type="button"
                                  onClick={() => onDeleteRecord(employee.id, rec.id)}
                                  title="Remover este lançamento"
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Botão de Lançar se ainda houver saldo */}
                        {period.saldoRestante > 0 && !isDemitido && (
                          <div className="mt-3 pt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => onOpenVacationLaunch(employee, period.periodIndex)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Lançar Férias ou Abono (Saldo: {period.saldoRestante}d)</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Aba de Contrato & Prazos de Experiência */
            <div className="space-y-6">
              {/* Card Prazos de Experiência CLT */}
              <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span>Contrato de Experiência CLT (45 e 90 Dias)</span>
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {probation.descricao}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* 1º Período (45 dias) */}
                  <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      1º Período de Experiência (45 dias)
                    </span>
                    <div className="flex justify-between text-slate-500 font-mono mt-2">
                      <span>Término:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatBRDate(probation.data45Dias)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-mono mt-1">
                      <span>Situação:</span>
                      <span
                        className={`font-semibold ${
                          probation.diasPara45 >= 0
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {probation.diasPara45 >= 0
                          ? `Faltam ${probation.diasPara45} dias`
                          : 'Superado / Aprovado'}
                      </span>
                    </div>
                  </div>

                  {/* 2º Período (90 dias) */}
                  <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      2º Período de Experiência (90 dias)
                    </span>
                    <div className="flex justify-between text-slate-500 font-mono mt-2">
                      <span>Término:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatBRDate(probation.data90Dias)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-mono mt-1">
                      <span>Situação:</span>
                      <span
                        className={`font-semibold ${
                          probation.diasPara90 >= 0
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {probation.diasPara90 >= 0
                          ? `Faltam ${probation.diasPara90} dias`
                          : 'Efetivado (+90 dias)'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Informações Contratuais Gerais */}
              <div className="p-4.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-3">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Dados Contratuais Detalhados
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 block">Data de Admissão:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {formatBRDate(employee.dataAdmissao)}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Tempo Total de Casa:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {tenure}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Status do Contrato:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {isDemitido ? 'Demitido / Rescindido' : 'Ativo e Regular'}
                    </span>
                  </div>

                  {employee.dataDemissao && (
                    <div>
                      <span className="text-slate-400 block">Data de Demissão:</span>
                      <span className="font-mono font-medium text-rose-600 dark:text-rose-400">
                        {formatBRDate(employee.dataDemissao)}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block">Telefone Comercial:</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                      {employee.telefone}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block">Data do Cadastro:</span>
                    <span className="font-mono text-slate-500">
                      {formatBRDate(employee.criadoEm.split('T')[0])}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onEdit(employee)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Cadastro</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
