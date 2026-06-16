import { Transaction, MONTHS_PT } from '../types';

const escapeHtml = (value: any): string => {
  const s = value === null || value === undefined ? '' : String(value);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/'/g, '&#039;');
};

const pad2 = (n: number) => String(n).padStart(2, '0');

const formatPtBrDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const d = timestamp?.toDate?.() || new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(d);
};

const formatAmountPtBr = (amount: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

const getMonthLabel = (month: number, year: number): string => {
  const name = MONTHS_PT[month] ?? String(month + 1);
  return `${name} de ${year}`;
};

export const transactionsToMonthlyPdf = (args: {
  transactions: Transaction[];
  month: number;
  year: number;
}): { html: string; filename: string } => {
  const { transactions, month, year } = args;

  const sorted = [...transactions].sort((a, b) => {
    const dateA = a.createdAt?.toDate?.() || new Date(0);
    const dateB = b.createdAt?.toDate?.() || new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  const totalIncome = sorted.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = sorted.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const monthLabel = getMonthLabel(month, year);

  const rowsHtml = sorted
    .map((t) => {
      const isIncome = t.type === 'income';
      const sign = isIncome ? '+' : '-';
      const typeLabel = isIncome ? 'Receita' : 'Despesa';
      const amountLabel = `${sign} ${formatAmountPtBr(t.amount)}`;
      const amountColor = isIncome ? '#10b981' : '#ef4444';
      const recurringLabel = t.recurring === true ? 'Sim' : 'Não';

      return `
        <tr>
          <td class="td">${escapeHtml(formatPtBrDate(t.createdAt))}</td>
          <td class="td"><span class="pill ${isIncome ? 'income' : 'expense'}">${escapeHtml(typeLabel)}</span></td>
          <td class="td">${escapeHtml(t.category ?? '')}</td>
          <td class="td desc">${escapeHtml(t.description ?? '')}</td>
          <td class="td right" style="color:${amountColor}; font-weight:700;">${escapeHtml(amountLabel)}</td>
          <td class="td">${escapeHtml(recurringLabel)}</td>
        </tr>
      `;
    })
    .join('');

  const filename = `relatorio-transacoes-${year}-${pad2(month + 1)}.pdf`;

  const html = `
  <!doctype html>
  <html lang="pt-BR">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Relatório - ${escapeHtml(monthLabel)}</title>
      <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background: #f6f7fb; }
        .page { padding: 28px; }
        .header {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: #fff;
          padding: 22px 22px;
          border-radius: 18px;
          position: relative;
          overflow: hidden;
        }
        .header:after {
          content: '';
          position: absolute;
          right: -80px;
          top: -80px;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
        }
        .title { font-size: 20px; font-weight: 800; margin: 0 0 6px 0; position: relative; }
        .subtitle { margin: 0; font-size: 13px; opacity: 0.95; position: relative; }

        .summary { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top: 16px; }
        .card {
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.05);
          border: 1px solid rgba(0,0,0,0.03);
        }
        .card .label { font-size: 12px; color: #6b7280; font-weight: 700; margin-bottom: 6px; }
        .card .value { font-size: 15px; font-weight: 900; }
        .value.income { color: #10b981; }
        .value.expense { color: #ef4444; }
        .value.balance { color: ${balance >= 0 ? '#10b981' : '#ef4444'}; }

        .tableWrap { margin-top: 16px; background: #fff; border-radius: 18px; padding: 0; overflow: hidden; border: 1px solid rgba(0,0,0,0.03); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 12px 12px; font-size: 12px; }
        th { background: #f3f4f6; color: #374151; text-align: left; font-weight: 800; }
        tr:nth-child(even) td { background: #fafafa; }
        td.desc { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        td.right { text-align: right; }
        .pill { display: inline-block; padding: 5px 10px; border-radius: 999px; font-weight: 800; font-size: 11px; color: #111827; background: #e5e7eb; }
        .pill.income { background: rgba(16,185,129,0.14); color: #059669; }
        .pill.expense { background: rgba(239,68,68,0.14); color: #dc2626; }

        .footer { margin-top: 14px; color: #6b7280; font-size: 11px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <p class="title">Relatório mensal</p>
          <p class="subtitle">${escapeHtml(monthLabel)} • ${sorted.length} transações</p>
        </div>

        <div class="summary">
          <div class="card">
            <div class="label">Receitas</div>
            <div class="value income">${escapeHtml(formatAmountPtBr(totalIncome))}</div>
          </div>
          <div class="card">
            <div class="label">Despesas</div>
            <div class="value expense">${escapeHtml(formatAmountPtBr(totalExpense))}</div>
          </div>
          <div class="card">
            <div class="label">Saldo (Receitas - Despesas)</div>
            <div class="value balance">${escapeHtml(formatAmountPtBr(balance))}</div>
          </div>
        </div>

        <div class="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descrição</th>
                <th style="text-align:right;">Valor</th>
                <th>Recorrente</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <div class="footer">Gerado pelo Cashwise • ${new Date().toLocaleDateString('pt-BR')}</div>
      </div>
    </body>
  </html>
  `;

  return { html, filename };
};

