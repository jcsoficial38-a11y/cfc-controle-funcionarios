import { Employee, CalculatedVacationPeriod, EmployeeVacationSummary, VacationStatus } from '../types';

/**
 * Normaliza data string YYYY-MM-DD em objeto Date zerado no horário local.
 */
export function parseISODate(dateStr: string): Date {
  const parts = dateStr.split('-');
  return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
}

/**
 * Formata Date para YYYY-MM-DD.
 */
export function formatISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formata data no formato brasileiro DD/MM/AAAA.
 */
export function formatBRDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Adiciona anos a uma data respeitando anos bissextos.
 */
function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

/**
 * Adiciona dias a uma data.
 */
export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Calcula diferença em dias inteiros entre duas datas (dataB - dataA).
 */
export function diffInDays(dateA: Date, dateB: Date): number {
  const msA = Date.UTC(dateA.getFullYear(), dateA.getMonth(), dateA.getDate());
  const msB = Date.UTC(dateB.getFullYear(), dateB.getMonth(), dateB.getDate());
  return Math.round((msB - msA) / (1000 * 60 * 60 * 24));
}

/**
 * Calcula o tempo de casa em formato amigável (ex: "2 anos e 3 meses").
 */
export function calculateCompanyTenure(admissaoStr: string, demissaoStr?: string, refDate: Date = new Date()): string {
  const start = parseISODate(admissaoStr);
  const end = demissaoStr ? parseISODate(demissaoStr) : refDate;

  if (end < start) return '0 dias';

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'ano' : 'anos'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mês' : 'meses'}`);
  if (days > 0 || parts.length === 0) parts.push(`${days} ${days === 1 ? 'dia' : 'dias'}`);

  return parts.join(' e ');
}

/**
 * Calcula o status do contrato de experiência (45 e 90 dias CLT).
 */
export function calculateProbationStatus(admissaoStr: string, refDate: Date = new Date()): {
  data45Dias: string;
  data90Dias: string;
  diasPara45: number;
  diasPara90: number;
  fase: '1a_experiencia' | '2a_experiencia' | 'efetivado';
  descricao: string;
} {
  const start = parseISODate(admissaoStr);
  const date45 = addDays(start, 45);
  const date90 = addDays(start, 90);

  const diasPara45 = diffInDays(refDate, date45);
  const diasPara90 = diffInDays(refDate, date90);

  if (diasPara45 >= 0) {
    return {
      data45Dias: formatISODate(date45),
      data90Dias: formatISODate(date90),
      diasPara45,
      diasPara90,
      fase: '1a_experiencia',
      descricao: `1º Período de Experiência (${diasPara45} ${diasPara45 === 1 ? 'dia restante' : 'dias restantes'})`,
    };
  } else if (diasPara90 >= 0) {
    return {
      data45Dias: formatISODate(date45),
      data90Dias: formatISODate(date90),
      diasPara45,
      diasPara90,
      fase: '2a_experiencia',
      descricao: `2º Período de Experiência (${diasPara90} ${diasPara90 === 1 ? 'dia restante' : 'dias restantes'})`,
    };
  } else {
    return {
      data45Dias: formatISODate(date45),
      data90Dias: formatISODate(date90),
      diasPara45,
      diasPara90,
      fase: 'efetivado',
      descricao: 'Contrato Efetivado (+90 dias)',
    };
  }
}

/**
 * Calcula todos os períodos aquisitivos de férias de um funcionário segundo a CLT.
 */
export function calculateVacationSummary(employee: Employee, refDate: Date = new Date()): EmployeeVacationSummary {
  const admissao = parseISODate(employee.dataAdmissao);
  const demissao = employee.dataDemissao ? parseISODate(employee.dataDemissao) : null;
  const cutoffDate = demissao && demissao < refDate ? demissao : refDate;

  const periodos: CalculatedVacationPeriod[] = [];
  let periodIndex = 0;

  // Geramos períodos a partir da admissão até alcançar ou ultrapassar a data de corte
  while (true) {
    const inicioAquisitivo = addYears(admissao, periodIndex);
    if (inicioAquisitivo > cutoffDate && periodIndex > 0) {
      break;
    }

    const fimAquisitivo = addDays(addYears(admissao, periodIndex + 1), -1);
    const inicioConcessivo = addYears(admissao, periodIndex + 1);
    const limiteConcessivo = addDays(addYears(admissao, periodIndex + 2), -1);

    const isPeriodoAtualAquisitivo = cutoffDate <= fimAquisitivo;

    // Registros específicos desse período
    const records = (employee.vacationRecords || []).filter(r => r.periodIndex === periodIndex);
    const diasGozados = records.reduce((sum, r) => sum + (r.diasGozados || 0), 0);
    const diasVendidos = records.reduce((sum, r) => sum + (r.diasVendidos || 0), 0);
    const totalUtilizado = diasGozados + diasVendidos;
    const saldoRestante = Math.max(0, 30 - totalUtilizado);

    const diasParaVencer = diffInDays(refDate, limiteConcessivo);

    let status: VacationStatus;
    if (saldoRestante === 0) {
      status = 'quitado';
    } else if (isPeriodoAtualAquisitivo) {
      status = 'em_andamento';
    } else if (diasParaVencer <= 0) {
      status = 'vencido';
    } else if (diasParaVencer <= 60) {
      status = 'alerta';
    } else {
      status = 'em_dia';
    }

    periodos.push({
      periodIndex,
      periodoAquisitivoInicio: formatISODate(inicioAquisitivo),
      periodoAquisitivoFim: formatISODate(fimAquisitivo),
      periodoConcessivoInicio: formatISODate(inicioConcessivo),
      periodoConcessivoLimite: formatISODate(limiteConcessivo),
      diasDireitoTotal: 30,
      diasGozados,
      diasVendidos,
      saldoRestante,
      diasParaVencer,
      status,
      isPeriodoAtualAquisitivo,
      records,
    });

    periodIndex++;

    // Evita loops infinitos em datas erradas
    if (periodIndex > 30) break;
  }

  // Identifica períodos pendentes (com direito já adquirido e saldo > 0)
  const periodosPendentes = periodos.filter(p => !p.isPeriodoAtualAquisitivo && p.saldoRestante > 0);
  
  // Férias vencidas: qualquer período cujo prazo limite do concessivo já expirou (diasParaVencer <= 0)
  const temFériasVencidas = periodosPendentes.some(p => p.status === 'vencido' || p.diasParaVencer <= 0);
  
  // Férias em alerta (<= 60 dias): período cujo prazo limite vence em 60 dias ou menos (e ainda não venceu)
  const periodosEmAlerta = periodosPendentes.filter(p => p.status === 'alerta' || (p.diasParaVencer > 0 && p.diasParaVencer <= 60));
  const temFériasAlerta = periodosEmAlerta.length > 0;

  // Período de alerta mais urgente (com menor diasParaVencer > 0)
  const periodoAlertaMaisUrgente = periodosEmAlerta.length > 0
    ? [...periodosEmAlerta].sort((a, b) => a.diasParaVencer - b.diasParaVencer)[0]
    : undefined;
  const diasParaVencerAlerta = periodoAlertaMaisUrgente ? periodoAlertaMaisUrgente.diasParaVencer : null;

  let menorDiasParaVencer: number | null = null;
  if (periodosPendentes.length > 0) {
    const ordenados = [...periodosPendentes].sort((a, b) => a.diasParaVencer - b.diasParaVencer);
    menorDiasParaVencer = ordenados[0].diasParaVencer;
  }

  let statusGeral: VacationStatus = 'quitado';
  if (temFériasVencidas) {
    statusGeral = 'vencido';
  } else if (temFériasAlerta) {
    statusGeral = 'alerta';
  } else if (periodosPendentes.length > 0) {
    statusGeral = 'em_dia';
  } else if (periodos.some(p => p.isPeriodoAtualAquisitivo)) {
    statusGeral = 'em_andamento';
  }

  return {
    periodos,
    temFériasVencidas,
    temFériasAlerta,
    menorDiasParaVencer,
    diasParaVencerAlerta,
    periodoAlertaMaisUrgente,
    statusGeral,
  };
}

/**
 * Verifica se um período individual de férias está vencido:
 * A data limite do período concessivo já expirou (passou) e o saldo de férias não foi totalmente gozado (não tirou).
 */
export function isVacationPeriodOverdue(period: CalculatedVacationPeriod, refDate: Date = new Date()): boolean {
  if (period.isPeriodoAtualAquisitivo) return false;
  if (period.saldoRestante <= 0) return false;
  const limiteDate = parseISODate(period.periodoConcessivoLimite);
  return period.diasParaVencer <= 0 || limiteDate < refDate || period.status === 'vencido';
}

/**
 * Função direta para verificar se o funcionário possui férias vencidas:
 * onde a data limite de férias já passou e o status de gozo de férias indica que não foram tiradas.
 */
export function temFeriasVencidas(employee: Employee, refDate: Date = new Date()): boolean {
  if (!employee.dataAdmissao) return false;
  const summary = calculateVacationSummary(employee, refDate);
  return summary.temFériasVencidas;
}

/**
 * Função direta para verificar se o funcionário possui férias em alerta:
 * onde o período está dentro dos próximos 60 dias para vencer e ainda há saldo não gozado.
 */
export function temFeriasAlerta(employee: Employee, refDate: Date = new Date()): boolean {
  if (!employee.dataAdmissao) return false;
  const summary = calculateVacationSummary(employee, refDate);
  return summary.temFériasAlerta;
}

/**
 * Converte o telefone para formato limpo internacional do WhatsApp (ex: 5511999998888).
 */
export function formatWhatsAppUrl(telefone: string, nomeOuApelido: string): string {
  const digitsOnly = telefone.replace(/\D/g, '');
  if (!digitsOnly) return '#';
  const cleanNumber = digitsOnly.startsWith('55') ? digitsOnly : `55${digitsOnly}`;
  const text = `Olá ${nomeOuApelido}, tudo bem? Gostaria de conversar com você sobre sua escala e férias no CFC (Controle Funcionário Completo).`;
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

/**
 * Formata telefone brasileiro para exibição amigável (XX) XXXXX-XXXX ou (XX) XXXX-XXXX.
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}
