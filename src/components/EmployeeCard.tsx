import React from 'react';
import { Employee } from '../types';
import { AvatarIllustration } from './AvatarIllustration';
import {
  calculateVacationSummary,
  calculateCompanyTenure,
  formatBRDate,
  formatWhatsAppUrl,
} from '../utils/vacationCalculator';
import { MessageCircle, Clock, AlertTriangle, AlertOctagon, CheckCircle2, ChevronRight, Briefcase } from 'lucide-react';

interface EmployeeCardProps {
  employee: Employee;
  onOpenDetails: (employee: Employee) => void;
  onEdit: (employee: Employee, e: React.MouseEvent) => void;
  onOpenVacationLaunch: (employee: Employee, periodIndex: number, e: React.MouseEvent) => void;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({
  employee,
  onOpenDetails,
  onEdit,
  onOpenVacationLaunch,
}) => {
  const isDemitido = Boolean(employee.dataDemissao);
  const vacationSummary = calculateVacationSummary(employee);
  const tenure = calculateCompanyTenure(employee.dataAdmissao, employee.dataDemissao);

  // Período mais urgente para férias
  const periodoUrgente = vacationSummary.periodos.find(
    (p) => !p.isPeriodoAtualAquisitivo && p.saldoRestante > 0
  );

  const getVacationStatusBadge = () => {
    if (isDemitido) {
      return (
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Contrato Rescindido
        </span>
      );
    }

    if (vacationSummary.temFériasVencidas) {
      const diasVencido = periodoUrgente ? Math.abs(periodoUrgente.diasParaVencer) : 0;
      return (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
          <AlertOctagon className="w-3.5 h-3.5 shrink-0" />
          <span>Férias Vencidas ({diasVencido}d de atraso)</span>
        </div>
      );
    }

    if (vacationSummary.temFériasAlerta) {
      const diasRestantes = periodoUrgente ? periodoUrgente.diasParaVencer : 0;
      return (
        <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Vence em {diasRestantes} {diasRestantes === 1 ? 'dia' : 'dias'}!</span>
        </div>
      );
    }

    if (vacationSummary.statusGeral === 'em_andamento') {
      return (
        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>1º Período em Aquisição</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>Férias em Dia</span>
      </div>
    );
  };

  // Borda de alerta visual e estilo folha de fichário
  const getCardBorder = () => {
    if (isDemitido) return 'border-dashed border-slate-300 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 opacity-75';
    if (vacationSummary.temFériasVencidas) return 'border-rose-400 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/20 shadow-sm';
    if (vacationSummary.temFériasAlerta) return 'border-amber-400 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 shadow-sm';
    return 'border-amber-900/15 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs';
  };

  const whatsappLink = formatWhatsAppUrl(employee.telefone, employee.apelido || employee.nome);

  return (
    <div
      onClick={() => onOpenDetails(employee)}
      className={`relative rounded-xl p-4.5 border transition-all duration-300 hover:-translate-y-1 hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden ${getCardBorder()}`}
    >
      {/* ETIQUETA POST-IT DESTACADA NO TOPO (Para férias a vencer nos próximos 60 dias ou vencidas) */}
      {!isDemitido && vacationSummary.temFériasAlerta && (
        <div className="absolute -top-1 right-3 z-10 postit-yellow px-2.5 py-1 rounded-sm text-[11px] font-bold flex items-center gap-1 shadow-md border-t-2 border-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-800 shrink-0" />
          <span>Vence em {periodoUrgente?.diasParaVencer} dias!</span>
        </div>
      )}

      {!isDemitido && vacationSummary.temFériasVencidas && (
        <div className="absolute -top-1 right-3 z-10 postit-rose px-2.5 py-1 rounded-sm text-[11px] font-bold flex items-center gap-1 shadow-md border-t-2 border-rose-300">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-900 shrink-0" />
          <span>Vencidas ({periodoUrgente ? Math.abs(periodoUrgente.diasParaVencer) : 0}d)!</span>
        </div>
      )}

      <div>
        {/* Topo do card: Avatar + Info Básica + Status */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-start gap-3">
            <AvatarIllustration
              genero={employee.genero}
              fotoUrl={employee.fotoUrl}
              nome={employee.nome}
              size="md"
            />
            <div>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  {employee.nome}
                </h3>
                {employee.apelido && (
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    &ldquo;{employee.apelido}&rdquo;
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Briefcase className="w-3 h-3 text-slate-400" />
                <span>{employee.cargo || 'Funcionário'}</span>
                {employee.departamento && (
                  <>
                    <span aria-hidden="true">&middot;</span>
                    <span>{employee.departamento}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Status Ativo/Demitido */}
          <div className="shrink-0 text-right">
            {isDemitido ? (
              <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40">
                Demitido
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40">
                Ativo
              </span>
            )}
          </div>
        </div>

        {/* Linha de Metadados: Admissão e Tempo de Casa */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Admissão: {formatBRDate(employee.dataAdmissao)}</span>
          <span className="font-mono tabular-nums">{tenure}</span>
        </div>

        {/* Bloco de Férias */}
        <div className="mt-3 p-2.5 rounded-lg bg-amber-50/50 dark:bg-slate-800/60 border border-amber-900/10 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">
              Controle de Férias CLT
            </span>
            {getVacationStatusBadge()}
          </div>

          {periodoUrgente && !isDemitido && (
            <div className="mt-2 text-xs">
              <div className="flex justify-between text-slate-700 dark:text-slate-300">
                <span>Saldo a gozar:</span>
                <span className="font-mono tabular-nums font-bold text-amber-700 dark:text-amber-400">
                  {periodoUrgente.saldoRestante} / 30 dias
                </span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                <span>Data limite legal:</span>
                <span className="font-mono tabular-nums">
                  {formatBRDate(periodoUrgente.periodoConcessivoLimite)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé com Ações Rápidas */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        {/* Botão WhatsApp */}
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          title={`Abrir WhatsApp com ${employee.apelido || employee.nome}`}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-2xs"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span className="font-mono tabular-nums">{employee.telefone}</span>
        </a>

        <div className="flex items-center gap-1.5">
          {periodoUrgente && !isDemitido && (
            <button
              type="button"
              onClick={(e) => onOpenVacationLaunch(employee, periodoUrgente.periodIndex, e)}
              className="px-2 py-1 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-100/50 dark:hover:bg-amber-950/40 rounded transition-colors font-medium cursor-pointer"
            >
              Lançar
            </button>
          )}

          <button
            type="button"
            onClick={(e) => onEdit(employee, e)}
            className="px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded transition-colors cursor-pointer"
          >
            Editar
          </button>

          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>
    </div>
  );
};
