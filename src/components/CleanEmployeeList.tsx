import React from 'react';
import { Employee } from '../types';
import { AvatarIllustration } from './AvatarIllustration';
import {
  calculateVacationSummary,
  formatWhatsAppUrl,
} from '../utils/vacationCalculator';
import { AlertTriangle, AlertOctagon, ChevronRight, Edit3 } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';

interface CleanEmployeeListProps {
  employees: Employee[];
  onOpenDetails: (employee: Employee) => void;
  onEdit: (employee: Employee, e: React.MouseEvent) => void;
}

export const CleanEmployeeList: React.FC<CleanEmployeeListProps> = ({
  employees,
  onOpenDetails,
  onEdit,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
      {employees.map((emp) => {
        const isDemitido = Boolean(emp.dataDemissao);
        const vacSummary = calculateVacationSummary(emp);
        const periodoUrgente = vacSummary.periodos.find(
          (p) => !p.isPeriodoAtualAquisitivo && p.saldoRestante > 0
        );
        const waLink = formatWhatsAppUrl(emp.telefone, emp.apelido || emp.nome);

        return (
          <div
            key={emp.id}
            onClick={() => onOpenDetails(emp)}
            className="group p-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
          >
            {/* Bloco Superior: Avatar, Nomes e Ações Rápidas no Mobile */}
            <div className="flex items-center justify-between gap-2.5 sm:gap-4 min-w-0 flex-1">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <AvatarIllustration
                  genero={emp.genero}
                  fotoUrl={emp.fotoUrl}
                  nome={emp.nome}
                  size="md"
                  className="shrink-0"
                />

                <div className="min-w-0 flex-1">
                  {/* Nome Clicável Principal */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm sm:text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {emp.nome}
                    </h3>
                    {emp.apelido && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium shrink-0">
                        ({emp.apelido})
                      </span>
                    )}
                  </div>

                  {/* Cargo e Setor Discreto */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    <span className="truncate">{emp.cargo || 'Funcionário'}</span>
                    {emp.departamento && (
                      <>
                        <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>
                        <span className="truncate">{emp.departamento}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações Rápidas Mobile (WhatsApp + Editar) */}
              <div className="flex items-center gap-1 sm:hidden shrink-0" onClick={(e) => e.stopPropagation()}>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`WhatsApp de ${emp.apelido || emp.nome}`}
                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={(e) => onEdit(emp, e)}
                  title="Editar Cadastro"
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </div>
            </div>

            {/* Metadados, Badges de Férias e Status */}
            <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap shrink-0 pl-11 sm:pl-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Alerta de Férias a Vencer nos Próximos 60 Dias (Badge Vermelho Destacado com Ícone de Atenção Obrigatório) */}
                {!isDemitido && vacSummary.temFériasAlerta && (
                  <div
                    title={
                      vacSummary.tipoAlerta === 'aquisitivo'
                        ? `Atenção: Vence em ${vacSummary.diasParaVencerAlerta ?? 60} dias (completa 12 meses do período aquisitivo)`
                        : `Atenção: Vence em ${vacSummary.diasParaVencerAlerta ?? 60} dias (data limite do período concessivo CLT)`
                    }
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] font-bold shadow-xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <span>
                      Atenção: Vence em {vacSummary.diasParaVencerAlerta ?? 60} {vacSummary.diasParaVencerAlerta === 1 ? 'dia' : 'dias'}
                    </span>
                  </div>
                )}

                {/* Férias Vencidas (Prazo Legal CLT Expirado) */}
                {!isDemitido && vacSummary.temFériasVencidas && (
                  <div
                    title="Férias com período concessivo vencido (prazo legal CLT expirado)"
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-700 dark:bg-red-800 border border-red-800 text-white text-[11px] font-black shadow-xs"
                  >
                    <AlertOctagon className="w-3.5 h-3.5 text-white shrink-0" />
                    <span>Férias Vencidas</span>
                  </div>
                )}

                {/* Status Ativo / Demitido */}
                {isDemitido ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    <span>Demitido</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Ativo</span>
                  </span>
                )}
              </div>

              {/* Ações em Telas Maiores (Desktop / Tablet) */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  title={`Conversar no WhatsApp com ${emp.apelido || emp.nome}`}
                  className="p-2 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                >
                  <WhatsAppIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden lg:inline font-mono tabular-nums">{emp.telefone}</span>
                </a>

                <button
                  type="button"
                  onClick={(e) => onEdit(emp, e)}
                  title="Editar Cadastro"
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 transition-colors" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
