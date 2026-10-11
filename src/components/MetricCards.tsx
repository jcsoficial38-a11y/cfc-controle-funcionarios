import React from 'react';
import { Users, UserX, AlertTriangle, AlertOctagon } from 'lucide-react';

interface MetricCardsProps {
  totalAtivos: number;
  totalDemitidos: number;
  totalAlertaFerias: number;
  totalVencidasFerias: number;
  currentFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  totalAtivos,
  totalDemitidos,
  totalAlertaFerias,
  totalVencidasFerias,
  currentFilter,
  onSelectFilter,
}) => {
  const cards = [
    {
      id: 'ativos',
      label: 'Funcionários Ativos',
      value: totalAtivos,
      sublabel: 'Em atividade na empresa',
      icon: Users,
      cardStyle: 'bg-white dark:bg-slate-900 border-amber-900/15 dark:border-slate-800',
      valueColor: 'text-emerald-700 dark:text-emerald-400',
      iconBadge: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
    },
    {
      id: 'alerta',
      label: 'Alertas de Férias (60d)',
      value: totalAlertaFerias,
      sublabel: 'Vencimento próximo',
      icon: AlertTriangle,
      // Post-it amarelo clássico colado
      cardStyle: 'postit-yellow border-t-4 border-amber-400',
      valueColor: 'text-amber-950 font-black',
      iconBadge: 'bg-amber-300/60 text-amber-900',
    },
    {
      id: 'vencidas',
      label: 'Férias Vencidas',
      value: totalVencidasFerias,
      sublabel: 'Atrasadas (Risco CLT)',
      icon: AlertOctagon,
      // Post-it rosa/vermelho de urgência
      cardStyle: 'postit-rose border-t-4 border-rose-400',
      valueColor: 'text-rose-950 font-black',
      iconBadge: 'bg-rose-300/60 text-rose-950',
    },
    {
      id: 'demitidos',
      label: 'Demitidos',
      value: totalDemitidos,
      sublabel: 'Contratos rescindidos',
      icon: UserX,
      cardStyle: 'bg-white dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-800',
      valueColor: 'text-slate-600 dark:text-slate-400',
      iconBadge: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-2">
      {cards.map((c) => {
        const Icon = c.icon;
        const isSelected = currentFilter === c.id;

        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelectFilter(currentFilter === c.id ? 'todos' : c.id)}
            className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer shadow-xs ${
              c.cardStyle
            } ${isSelected ? 'ring-2 ring-amber-500 scale-[1.02]' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold leading-tight line-clamp-1">
                {c.label}
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.iconBadge}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${c.valueColor}`}>
                {c.value}
              </span>
            </div>

            <p className="text-[10px] sm:text-[11px] opacity-75 mt-0.5 line-clamp-1">
              {c.sublabel}
            </p>
          </button>
        );
      })}
    </div>
  );
};
