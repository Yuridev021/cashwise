import { Transaction } from '../types';

const escapeCsvCell = (value: any): string => {
  const s = value === null || value === undefined ? '' : String(value);
  // Excel/Sheets: aspas precisam ser duplicadas; célula vai entre aspas se tiver separador, aspas ou quebra de linha.
  const needsQuotes = /[",\n\r;]/.test(s);
  const escaped = s.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

const formatPtBrDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const d = timestamp.toDate?.() || new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  // Ex.: 31/12/24
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(d);
};

const formatAmountPtBr = (amount: number): string => {
  // Mantém como número, mas com formatação pt-BR (ex: 1.234,56)
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const pad2 = (n: number) => String(n).padStart(2, '0');

export const getMonthLabel = (month: number, year: number): string => {
  // month: 0-11
  return `${pad2(month + 1)}/${year}`;
};

export const transactionsToMonthlyCsv = (args: {
  transactions: Transaction[];
  month: number;
  year: number;
}): { csv: string; filename: string } => {
  const { transactions, month, year } = args;

  // Cabeçalho
  const rows: string[] = [];
  rows.push(
    [
      'Data',
      'Tipo',
      'Categoria',
      'Descrição',
      'Valor (R$)',
      'Recorrente',
    ]
      .map(escapeCsvCell)
      .join(';')
  );

  // Ordena por data desc (mantém consistente com a UI)
  const sorted = [...transactions].sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(0);
    const dateB = b.createdAt?.toDate?.() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  for (const t of sorted) {
    rows.push(
      [
        formatPtBrDate(t.createdAt),
        t.type === 'income' ? 'Receita' : 'Despesa',
        t.category ?? '',
        t.description ?? '',
        formatAmountPtBr(t.amount),
        t.recurring === true ? 'Sim' : 'Não',
      ]
        .map(escapeCsvCell)
        .join(';')
    );
  }

  const filename = `relatorio-transacoes-${year}-${pad2(month + 1)}.csv`;
  return { csv: rows.join('\n'), filename };
};

