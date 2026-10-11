import React, { useState } from 'react';
import { Employee, VacationTakeRecord, CalculatedVacationPeriod } from '../types';
import { formatBRDate, addDays, formatISODate, parseISODate } from '../utils/vacationCalculator';
import { X, Calendar, Check, AlertCircle, Sparkles } from 'lucide-react';

interface VacationLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  period: CalculatedVacationPeriod;
  onSaveRecord: (employeeId: string, record: VacationTakeRecord) => void;
}

export const VacationLaunchModal: React.FC<VacationLaunchModalProps> = ({
  isOpen,
  onClose,
  employee,
  period,
  onSaveRecord,
}) => {
  const maxAvailable = period.saldoRestante;
  const [diasGozados, setDiasGozados] = useState<number>(Math.min(30, maxAvailable));
  const [diasVendidos, setDiasVendidos] = useState<number>(0);
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [observacao, setObservacao] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Atualiza data final automaticamente se houver data de início e dias de gozo
  const handleStartDateChange = (val: string) => {
    setDataInicio(val);
    if (val && diasGozados > 0) {
      const start = parseISODate(val);
      const end = addDays(start, diasGozados - 1);
      setDataFim(formatISODate(end));
    }
  };

  const handleDiasGozadosChange = (val: number) => {
    setDiasGozados(val);
    if (dataInicio && val > 0) {
      const start = parseISODate(dataInicio);
      const end = addDays(start, val - 1);
      setDataFim(formatISODate(end));
    }
  };

  const applyPreset = (gozo: number, abono: number, note: string) => {
    const safeGozo = Math.min(gozo, maxAvailable);
    const safeAbono = Math.min(abono, Math.max(0, maxAvailable - safeGozo));
    setDiasGozados(safeGozo);
    setDiasVendidos(safeAbono);
    setObservacao(note);
    if (dataInicio && safeGozo > 0) {
      const start = parseISODate(dataInicio);
      const end = addDays(start, safeGozo - 1);
      setDataFim(formatISODate(end));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const totalDays = Number(diasGozados) + Number(diasVendidos);
    if (totalDays <= 0) {
      setError('Informe ao menos 1 dia de gozo ou venda de férias.');
      return;
    }

    if (totalDays > maxAvailable) {
      setError(`O total de dias (${totalDays}) excede o saldo restante deste período (${maxAvailable} dias).`);
      return;
    }

    if (diasVendidos > 10) {
      setError('Pela CLT (art. 143), o abono pecuniário (venda) não pode ultrapassar 10 dias (1/3 das férias).');
      return;
    }

    let tipo: 'gozo' | 'abono' | 'misto' = 'gozo';
    if (diasGozados > 0 && diasVendidos > 0) tipo = 'misto';
    else if (diasVendidos > 0) tipo = 'abono';

    const newRecord: VacationTakeRecord = {
      id: 'rec-' + Date.now(),
      periodIndex: period.periodIndex,
      tipo,
      diasGozados: Number(diasGozados),
      diasVendidos: Number(diasVendidos),
      dataInicioGozo: dataInicio || undefined,
      dataFimGozo: dataFim || undefined,
      observacao: observacao.trim() || undefined,
      dataLancamento: new Date().toISOString(),
    };

    onSaveRecord(employee.id, newRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Topo */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Lançamento de Férias & Abono</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {employee.nome} {employee.apelido ? `(${employee.apelido})` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informações do Período */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs">
            <div className="flex justify-between items-center mb-1">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {period.periodIndex + 1}º Período Aquisitivo:
              </span>
              <span className="font-mono text-slate-600 dark:text-slate-300">
                {formatBRDate(period.periodoAquisitivoInicio)} a {formatBRDate(period.periodoAquisitivoFim)}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Limite de Concessão:</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                {formatBRDate(period.periodoConcessivoLimite)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200 dark:border-slate-700 font-medium">
              <span className="text-slate-700 dark:text-slate-300">Saldo Disponível no Período:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                {maxAvailable} / 30 dias
              </span>
            </div>
          </div>

          {/* Atalhos rápidos / Presets CLT */}
          <div>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-2 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Opções Rápidas de Lançamento:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => applyPreset(30, 0, '30 dias integrais de férias')}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">30 dias corridos</div>
                <div className="text-[11px] text-slate-500">Gozo integral</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(20, 10, '20 dias gozados + 10 dias vendidos (abono)')}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">20 dias + 10 vendidos</div>
                <div className="text-[11px] text-slate-500">Abono pecuniário (1/3)</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(15, 0, '1ª fração de 15 dias')}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">15 dias de gozo</div>
                <div className="text-[11px] text-slate-500">1º fracionamento CLT</div>
              </button>

              <button
                type="button"
                onClick={() => applyPreset(0, 10, 'Venda de 10 dias (abono pecuniário)')}
                className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-500 text-left transition-colors cursor-pointer"
              >
                <div className="font-semibold text-slate-800 dark:text-slate-200">Vender 10 dias</div>
                <div className="text-[11px] text-slate-500">Somente abono pecuniário</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campos de dias */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dias Gozados (Descanso)
                </label>
                <input
                  type="number"
                  min="0"
                  max={maxAvailable}
                  value={diasGozados}
                  onChange={(e) => handleDiasGozadosChange(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Dias Vendidos (Abono Max 10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={diasVendidos}
                  onChange={(e) => setDiasVendidos(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono tabular-nums text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Datas do Gozo */}
            {diasGozados > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Início do Gozo
                  </label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fim do Gozo (Calculado)
                  </label>
                  <input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* Observação */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Observações do Lançamento
              </label>
              <input
                type="text"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex: Aprovado pelo gestor em 10/10/2026"
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
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
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar Lançamento</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
