import { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import prisma from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

// Helper to determine start and end dates based on period filter
const getPeriodDates = (period: string, customStart?: string, customEnd?: string) => {
  const now = new Date();
  let start: Date;
  let end: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (period) {
    case 'mes_anterior': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    }
    case 'ultimos_3_meses': {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
      break;
    }
    case 'ultimos_6_meses': {
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
      break;
    }
    case 'este_ano': {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      break;
    }
    case 'personalizado': {
      start = customStart ? new Date(customStart) : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = customEnd ? new Date(customEnd) : new Date();
      break;
    }
    case 'este_mes':
    default: {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    }
  }

  return { start, end };
};

export const getFinancialReport = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const period = (req.query.period as string) || 'este_mes';
    const customStart = req.query.startDate as string;
    const customEnd = req.query.endDate as string;

    const { start, end } = getPeriodDates(period, customStart, customEnd);

    // Fetch transactions in period
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
        status: { not: 'CANCELADO' },
      },
      include: { category: true },
      orderBy: { date: 'asc' },
    });

    // 1. Entradas
    const entradasList = transactions.filter(t => t.type === 'ENTRADA');
    const totalEntradas = entradasList.reduce((sum, t) => sum + t.amount, 0);
    const totalEntradasRecebidas = entradasList.filter(t => t.status === 'RECEBIDO').reduce((sum, t) => sum + t.amount, 0);

    const entradasPorCategoriaMap: { [key: string]: { name: string; amount: number; color: string } } = {};
    entradasList.forEach(t => {
      const catName = t.category?.name || 'Outras Entradas';
      const catColor = t.category?.color || '#10b981';
      if (!entradasPorCategoriaMap[catName]) {
        entradasPorCategoriaMap[catName] = { name: catName, amount: 0, color: catColor };
      }
      entradasPorCategoriaMap[catName].amount += t.amount;
    });
    const entradasPorCategoria = Object.values(entradasPorCategoriaMap).sort((a, b) => b.amount - a.amount);

    // 2. Saídas
    const saidasList = transactions.filter(t => t.type === 'SAIDA');
    const totalSaidas = saidasList.reduce((sum, t) => sum + t.amount, 0);
    const totalSaidasPagas = saidasList.filter(t => t.status === 'PAGO').reduce((sum, t) => sum + t.amount, 0);

    const gastosFixos = saidasList.filter(t => t.isFixed).reduce((sum, t) => sum + t.amount, 0);
    const gastosVariaveis = saidasList.filter(t => !t.isFixed).reduce((sum, t) => sum + t.amount, 0);

    const saidasPorCategoriaMap: { [key: string]: { name: string; amount: number; color: string } } = {};
    saidasList.forEach(t => {
      const catName = t.category?.name || 'Outras Saídas';
      const catColor = t.category?.color || '#ef4444';
      if (!saidasPorCategoriaMap[catName]) {
        saidasPorCategoriaMap[catName] = { name: catName, amount: 0, color: catColor };
      }
      saidasPorCategoriaMap[catName].amount += t.amount;
    });
    const saidasPorCategoria = Object.values(saidasPorCategoriaMap).sort((a, b) => b.amount - a.amount);

    // Maior categoria de gasto
    const maiorCategoriaGasto = saidasPorCategoria.length > 0 ? saidasPorCategoria[0] : null;

    // Maior gasto individual
    const maiorGastoIndividual = saidasList.length > 0
      ? [...saidasList].sort((a, b) => b.amount - a.amount)[0]
      : null;

    // 3. Fluxo de Caixa (Entradas - Saídas = Saldo)
    const saldoPeriodo = totalEntradas - totalSaidas;

    // 4. Análise de Gastos e Comparativo com Mês Anterior
    // Calculate previous month equivalent
    const now = new Date();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const prevMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: prevMonthStart, lte: prevMonthEnd },
        status: { not: 'CANCELADO' },
      },
      include: { category: true },
    });

    const prevMonthSaidas = prevMonthTransactions.filter(t => t.type === 'SAIDA').reduce((sum, t) => sum + t.amount, 0);
    const prevMonthEntradas = prevMonthTransactions.filter(t => t.type === 'ENTRADA').reduce((sum, t) => sum + t.amount, 0);

    // Current month for direct comparison
    const currMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const currMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const currMonthTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: currMonthStart, lte: currMonthEnd },
        status: { not: 'CANCELADO' },
      },
      include: { category: true },
    });

    const currMonthSaidas = currMonthTransactions.filter(t => t.type === 'SAIDA').reduce((sum, t) => sum + t.amount, 0);

    // Difference in overall spending
    let diffPercentOverall = 0;
    if (prevMonthSaidas > 0) {
      diffPercentOverall = Math.round(((currMonthSaidas - prevMonthSaidas) / prevMonthSaidas) * 100);
    }

    // Category comparison with previous month
    const insights: string[] = [];

    if (prevMonthSaidas > 0) {
      if (diffPercentOverall > 0) {
        insights.push(`⚠️ Seus gastos gerais aumentaram ${diffPercentOverall}% em relação ao mês anterior.`);
      } else if (diffPercentOverall < 0) {
        insights.push(`👏 Parabéns! Seus gastos gerais reduziram ${Math.abs(diffPercentOverall)}% em relação ao mês anterior.`);
      } else {
        insights.push(`Seus gastos mantiveram-se estáveis em relação ao mês anterior.`);
      }
    }

    // Category-specific comparison
    const currCatMap: { [key: string]: number } = {};
    currMonthTransactions.filter(t => t.type === 'SAIDA').forEach(t => {
      const name = t.category?.name || 'Outros';
      currCatMap[name] = (currCatMap[name] || 0) + t.amount;
    });

    const prevCatMap: { [key: string]: number } = {};
    prevMonthTransactions.filter(t => t.type === 'SAIDA').forEach(t => {
      const name = t.category?.name || 'Outros';
      prevCatMap[name] = (prevCatMap[name] || 0) + t.amount;
    });

    for (const catName in currCatMap) {
      const currAmt = currCatMap[catName];
      const prevAmt = prevCatMap[catName];
      if (prevAmt && prevAmt > 50) {
        const diff = Math.round(((currAmt - prevAmt) / prevAmt) * 100);
        if (diff >= 20) {
          insights.push(`⚠️ Atenção: você gastou ${diff}% a mais com ${catName} este mês comparado ao mês anterior.`);
          break; // Show most critical one
        }
      }
    }

    if (maiorCategoriaGasto && totalSaidas > 0) {
      const pct = Math.round((maiorCategoriaGasto.amount / totalSaidas) * 100);
      insights.push(`🏆 Sua maior categoria de gastos no período foi ${maiorCategoriaGasto.name}, representando ${pct}% das suas despesas.`);
    }

    // Categoria que menos gastou (com gasto > 0)
    const menorCategoriaGasto = saidasPorCategoria.length > 1 ? saidasPorCategoria[saidasPorCategoria.length - 1] : null;

    return res.json({
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      fluxoDeCaixa: {
        totalEntradas,
        totalSaidas,
        saldo: saldoPeriodo,
        totalEntradasRecebidas,
        totalSaidasPagas,
      },
      entradas: {
        total: totalEntradas,
        porCategoria: entradasPorCategoria,
      },
      saidas: {
        total: totalSaidas,
        fixos: gastosFixos,
        variaveis: gastosVariaveis,
        porCategoria: saidasPorCategoria,
        maiorCategoria: maiorCategoriaGasto,
        maiorGastoIndividual,
        menorCategoria: menorCategoriaGasto,
      },
      analiseGastos: {
        insights,
        comparacaoMesAnterior: {
          mesAtual: currMonthSaidas,
          mesAnterior: prevMonthSaidas,
          variacaoPercentual: diffPercentOverall,
        },
      },
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return res.status(500).json({ error: 'Erro ao gerar relatório financeiro.' });
  }
};

// Export to Excel
export const exportExcel = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const period = (req.query.period as string) || 'este_mes';
    const customStart = req.query.startDate as string;
    const customEnd = req.query.endDate as string;

    const { start, end } = getPeriodDates(period, customStart, customEnd);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Fluxo de Caixa Pessoal';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Lançamentos');

    // Title styling
    sheet.mergeCells('A1:H1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `Relatório Financeiro de Lançamentos (${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')})`;
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Headers
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma Pagto', 'Status', 'Gasto Fixo', 'Valor (R$)'];
    sheet.getRow(3).values = headers;
    sheet.getRow(3).font = { name: 'Arial', size: 11, bold: true };
    sheet.getRow(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    sheet.getRow(3).alignment = { vertical: 'middle' };

    let rowIndex = 4;
    let totalEntradas = 0;
    let totalSaidas = 0;

    transactions.forEach(t => {
      const row = sheet.getRow(rowIndex);
      const isEntrada = t.type === 'ENTRADA';
      if (t.status !== 'CANCELADO') {
        if (isEntrada) totalEntradas += t.amount;
        else totalSaidas += t.amount;
      }

      row.values = [
        new Date(t.date).toLocaleDateString('pt-BR'),
        isEntrada ? 'Entrada' : 'Saída',
        t.description,
        t.category?.name || 'Sem categoria',
        t.paymentMethod,
        t.status,
        t.isFixed ? 'Sim' : 'Não',
        t.amount,
      ];

      row.getCell(8).numFmt = 'R$ #,##0.00';
      if (isEntrada) {
        row.getCell(2).font = { color: { argb: 'FF16A34A' }, bold: true };
      } else {
        row.getCell(2).font = { color: { argb: 'FFE11D48' }, bold: true };
      }

      rowIndex++;
    });

    // Summary block
    rowIndex += 1;
    sheet.getCell(`G${rowIndex}`).value = 'Total Entradas:';
    sheet.getCell(`G${rowIndex}`).font = { bold: true };
    sheet.getCell(`H${rowIndex}`).value = totalEntradas;
    sheet.getCell(`H${rowIndex}`).numFmt = 'R$ #,##0.00';
    sheet.getCell(`H${rowIndex}`).font = { bold: true, color: { argb: 'FF16A34A' } };

    rowIndex++;
    sheet.getCell(`G${rowIndex}`).value = 'Total Saídas:';
    sheet.getCell(`G${rowIndex}`).font = { bold: true };
    sheet.getCell(`H${rowIndex}`).value = totalSaidas;
    sheet.getCell(`H${rowIndex}`).numFmt = 'R$ #,##0.00';
    sheet.getCell(`H${rowIndex}`).font = { bold: true, color: { argb: 'FFE11D48' } };

    rowIndex++;
    sheet.getCell(`G${rowIndex}`).value = 'Saldo:';
    sheet.getCell(`G${rowIndex}`).font = { bold: true };
    sheet.getCell(`H${rowIndex}`).value = totalEntradas - totalSaidas;
    sheet.getCell(`H${rowIndex}`).numFmt = 'R$ #,##0.00';
    sheet.getCell(`H${rowIndex}`).font = { bold: true };

    // Column widths
    sheet.columns = [
      { width: 14 },
      { width: 12 },
      { width: 30 },
      { width: 20 },
      { width: 18 },
      { width: 14 },
      { width: 12 },
      { width: 18 },
    ];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-financeiro-${Date.now()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Erro ao exportar Excel:', error);
    return res.status(500).json({ error: 'Erro ao gerar arquivo Excel.' });
  }
};

// Export to CSV
export const exportCsv = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const period = (req.query.period as string) || 'este_mes';
    const customStart = req.query.startDate as string;
    const customEnd = req.query.endDate as string;

    const { start, end } = getPeriodDates(period, customStart, customEnd);

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    // CSV format with semicolon for Brazilian Excel and UTF-8 BOM
    let csv = '\uFEFF';
    csv += 'Data;Tipo;Descricao;Categoria;Forma de Pagamento;Status;Gasto Fixo;Valor (R$)\r\n';

    transactions.forEach(t => {
      const dataStr = new Date(t.date).toLocaleDateString('pt-BR');
      const tipo = t.type === 'ENTRADA' ? 'Entrada' : 'Saída';
      const desc = `"${t.description.replace(/"/g, '""')}"`;
      const cat = `"${(t.category?.name || 'Sem Categoria').replace(/"/g, '""')}"`;
      const forma = t.paymentMethod;
      const status = t.status;
      const fixo = t.isFixed ? 'Sim' : 'Não';
      const valor = t.amount.toFixed(2).replace('.', ',');

      csv += `${dataStr};${tipo};${desc};${cat};${forma};${status};${fixo};${valor}\r\n`;
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="lancamentos-${Date.now()}.csv"`);

    return res.send(csv);
  } catch (error) {
    console.error('Erro ao exportar CSV:', error);
    return res.status(500).json({ error: 'Erro ao gerar arquivo CSV.' });
  }
};

// Export to PDF
export const exportPdf = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const period = (req.query.period as string) || 'este_mes';
    const customStart = req.query.startDate as string;
    const customEnd = req.query.endDate as string;

    const { start, end } = getPeriodDates(period, customStart, customEnd);

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: start, lte: end },
      },
      include: { category: true },
      orderBy: { date: 'asc' },
    });

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="relatorio-financeiro-${Date.now()}.pdf"`);

    doc.pipe(res);

    // Header
    doc.fillColor('#0284c7').fontSize(20).text('FLUXO DE CAIXA & CONTROLE FINANCEIRO', { align: 'center' });
    doc.moveDown(0.3);
    doc.fillColor('#64748b').fontSize(11).text(`Usuário: ${user?.name || ''} (${user?.email || ''})`, { align: 'center' });
    doc.text(`Período: ${start.toLocaleDateString('pt-BR')} até ${end.toLocaleDateString('pt-BR')}`, { align: 'center' });
    doc.moveDown(1);

    // Financial Summary
    let totalEntradas = 0;
    let totalSaidas = 0;
    transactions.forEach(t => {
      if (t.status !== 'CANCELADO') {
        if (t.type === 'ENTRADA') totalEntradas += t.amount;
        else totalSaidas += t.amount;
      }
    });

    const saldo = totalEntradas - totalSaidas;

    doc.rect(40, doc.y, 515, 65).fillAndStroke('#f8fafc', '#e2e8f0');
    doc.font('Helvetica-Bold').fillColor('#0f172a').fontSize(12).text('RESUMO DO PERÍODO', 50, doc.y - 55);
    doc.font('Helvetica');
    
    doc.fontSize(10).fillColor('#16a34a').text(`Total de Entradas: R$ ${totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 50, doc.y - 35);
    doc.fillColor('#e11d48').text(`Total de Saídas: R$ ${totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 220, doc.y - 35);
    doc.fillColor(saldo >= 0 ? '#16a34a' : '#e11d48').text(`Saldo Líquido: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 380, doc.y - 35);

    doc.moveDown(3);

    // Table Header
    doc.fillColor('#0f172a').fontSize(12).text('DETALHAMENTO DOS LANÇAMENTOS', 40, doc.y);
    doc.moveDown(0.5);

    const startY = doc.y;
    doc.rect(40, startY, 515, 20).fill('#0284c7');
    doc.fillColor('#ffffff').fontSize(9).text('Data', 45, startY + 5);
    doc.text('Tipo', 105, startY + 5);
    doc.text('Descrição', 155, startY + 5);
    doc.text('Categoria', 315, startY + 5);
    doc.text('Status', 420, startY + 5);
    doc.text('Valor (R$)', 485, startY + 5);

    let currentY = startY + 22;

    transactions.forEach((t, index) => {
      // New page if near bottom
      if (currentY > 750) {
        doc.addPage();
        currentY = 40;
      }

      if (index % 2 === 0) {
        doc.rect(40, currentY - 2, 515, 16).fill('#f8fafc');
      }

      const isEntrada = t.type === 'ENTRADA';
      doc.fillColor('#334155').fontSize(8.5).text(new Date(t.date).toLocaleDateString('pt-BR'), 45, currentY);
      doc.fillColor(isEntrada ? '#16a34a' : '#e11d48').text(isEntrada ? 'Entrada' : 'Saída', 105, currentY);
      doc.fillColor('#0f172a').text(t.description.slice(0, 26), 155, currentY);
      doc.fillColor('#64748b').text((t.category?.name || 'Sem Cat').slice(0, 18), 315, currentY);
      doc.fillColor('#334155').text(t.status, 420, currentY);
      doc.fillColor(isEntrada ? '#16a34a' : '#e11d48').text(t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }), 485, currentY);

      currentY += 16;
    });

    doc.end();
  } catch (error) {
    console.error('Erro ao exportar PDF:', error);
    return res.status(500).json({ error: 'Erro ao gerar arquivo PDF.' });
  }
};
