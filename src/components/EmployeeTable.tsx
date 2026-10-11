import React from 'react';
import { Employee } from '../types';
import { AvatarIllustration } from './AvatarIllustration';
import {
  calculateVacationSummary,
  formatBRDate,
  formatWhatsAppUrl,
} from '../utils/vacationCalculator';
import { MessageCircle, AlertTriangle, AlertOctagon, CheckCircle2, Clock, Edit2, Calendar } from 'lucide-react';

interface EmployeeTableProps {
  employees: Employee[];
  onOpenDetails: (employee: Employee) => void;
  onEdit: (employee: Employee, e: React.MouseEvent) => void;
  onOpenVacationLaunch: (employee: Employee, periodIndex: number, e: React.MouseEvent) => void;
}

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  onOpenDetails,
  onEdit,
  onOpenVacationLaunch,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <th className="py-3 px-4">Funcionário</th>
            <th className="py-3 px-4">Cargo / Setor</th>
            <th className="py-3 px-4">WhatsApp / Tel</th>
            <th className="py-3 px-4">Admissão</th>
            <th className="py-3 px-4">Status CLT</th>
            <th className="py-3 px-4">Situação Férias</th>
            <th className="py-3 px-4 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {employees.map((emp) => {
            const isDemitido = Boolean(emp.dataDemissao);
            const vacSummary = calculateVacationSummary(emp);
            const periodoUrgente = vacSummary.periodos.find(
              (p) => !p.isPeriodoAtualAquisitivo && p.saldoRestante > 0
            );
            const waLink = formatWhatsAppUrl(emp.telefone, emp.apelido || emp.nome);

            return (
              <tr
                key={emp.id}
                onClick={() => onOpenDetails(emp)}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                {/* Coluna 1: Avatar + Nome + Apelido */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <AvatarIllustration
                      genero={emp.genero}
                      fotoUrl={emp.fotoUrl}
                      nome={emp.nome}
                      size="sm"
                    />
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{emp.nome}</span>
                        {emp.apelido && (
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                            ({emp.apelido})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Coluna 2: Cargo / Depto */}
                <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                  <div>{emp.cargo || 'Funcionário'}</div>
                  <div className="text-slate-400 text-[11px]">{emp.departamento || '-'}</div>
                </td>

                {/* Coluna 3: WhatsApp */}
                <td className="py-3 px-4">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-xs font-mono tabular-nums transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{emp.telefone}</span>
                  </a>
                </td>

                {/* Coluna 4: Admissão */}
                <td className="py-3 px-4 text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400">
                  {formatBRDate(emp.dataAdmissao)}
                </td>

                {/* Coluna 5: Status CLT */}
                <td className="py-3 px-4 text-xs font-medium">
                  {isDemitido ? (
                    <span className="text-rose-600 dark:text-rose-400">Demitido</span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">Ativo</span>
                  )}
                </td>

                {/* Coluna 6: Férias */}
                <td className="py-3 px-4 text-xs">
                  {isDemitido ? (
                    <span className="text-slate-400">Rescindido</span>
                  ) : vacSummary.temFériasVencidas ? (
                    <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                      <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
                      <span>Vencidas ({periodoUrgente ? Math.abs(periodoUrgente.diasParaVencer) : 0}d)</span>
                    </div>
                  ) : vacSummary.temFériasAlerta ? (
                    <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Vence em {periodoUrgente?.diasParaVencer}d</span>
                    </div>
                  ) : vacSummary.statusGeral === 'em_andamento' ? (
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Em aquisição</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Férias em Dia</span>
                    </div>
                  )}
                </td>

                {/* Coluna 7: Ações */}
                <td className="py-3 px-4 text-right">
                  <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {periodoUrgente && !isDemitido && (
                      <button
                        type="button"
                        onClick={(e) => onOpenVacationLaunch(emp, periodoUrgente.periodIndex, e)}
                        title="Lançar Férias ou Abono"
                        className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded transition-colors"
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={(e) => onEdit(emp, e)}
                      title="Editar Funcionário"
                      className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
