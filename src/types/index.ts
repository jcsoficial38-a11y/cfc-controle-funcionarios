export type Gender = 'M' | 'F';

export interface VacationTakeRecord {
  id: string;
  periodIndex: number; // 0 for 1st period, 1 for 2nd, etc.
  tipo: 'gozo' | 'abono' | 'misto'; // gozo = tirou férias, abono = vendeu dias, misto = tirou e vendeu
  diasGozados: number; // Ex: 20
  diasVendidos: number; // Ex: 10 (abono pecuniário)
  dataInicioGozo?: string; // Ex: '2026-11-01'
  dataFimGozo?: string; // Ex: '2026-11-20'
  observacao?: string;
  dataLancamento: string;
}

export interface Employee {
  id: string;
  nome: string;
  apelido: string;
  telefone: string;
  genero: Gender;
  fotoUrl?: string;
  cargo: string;
  departamento: string;
  dataAdmissao: string; // 'YYYY-MM-DD'
  dataDemissao?: string; // 'YYYY-MM-DD' se preenchido vira demitido
  vacationRecords: VacationTakeRecord[];
  criadoEm: string;
}

export type VacationStatus = 'quitado' | 'em_andamento' | 'em_dia' | 'alerta' | 'vencido';

export interface ManagerProfile {
  nome: string;
  usuario: string;
  senha?: string;
  pin?: string; // PIN de 4 dígitos
  perguntaSeguranca?: string; // Pergunta para recuperação
  respostaSeguranca?: string; // Resposta para recuperação
  cargo: string;
  biometriaAtiva: boolean;
  tipoBiometria: 'touch_id' | 'face_id';
  fotoUrl?: string;
  accentColor?: 'indigo' | 'emerald' | 'blue' | 'amber' | 'violet' | 'rose';
}

export interface CalculatedVacationPeriod {
  periodIndex: number;
  periodoAquisitivoInicio: string; // 'YYYY-MM-DD'
  periodoAquisitivoFim: string; // 'YYYY-MM-DD'
  periodoConcessivoInicio?: string; // 'YYYY-MM-DD' (início do período concessivo)
  periodoConcessivoLimite: string; // 'YYYY-MM-DD' (1 ano após o fim do aquisitivo - data limite CLT)
  diasDireitoTotal: number; // 30
  diasGozados: number;
  diasVendidos: number;
  saldoRestante: number;
  diasParaVencer: number; // negativo se vencido
  status: VacationStatus;
  isPeriodoAtualAquisitivo: boolean;
  records: VacationTakeRecord[];
}

export interface EmployeeVacationSummary {
  periodos: CalculatedVacationPeriod[];
  temFériasVencidas: boolean;
  temFériasAlerta: boolean; // vence em <= 60 dias
  menorDiasParaVencer: number | null; // dias restantes para o período mais urgente com saldo pendente
  diasParaVencerAlerta?: number | null; // dias restantes específicos para o período em alerta (<= 60 dias)
  periodoAlertaMaisUrgente?: CalculatedVacationPeriod;
  statusGeral: VacationStatus;
}
