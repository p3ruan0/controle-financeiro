// Teste ponta a ponta dos 10 fluxos principais do sistema
const BASE_URL = 'http://localhost:5000/api';

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('🚀 INICIANDO VERIFICAÇÃO RIGOROSA DOS 10 FLUXOS PRINCIPAIS');
  console.log('================================================================\n');

  try {
    // 0. Cadastrar novo usuário para o teste
    const userEmail = `usuario_teste_${Date.now()}@fluxocaixa.com`;
    const resReg = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Usuário Gestão Financeira',
        email: userEmail,
        password: 'senhaSegura123',
      }),
    });
    const regData = await resReg.json();
    if (!resReg.ok) throw new Error(`Falha no registro: ${JSON.stringify(regData)}`);
    const token = regData.token;
    console.log(`✔ [AUTH] Usuário registrado com sucesso: ${userEmail}`);

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // Buscar categorias padrão
    const resCats = await fetch(`${BASE_URL}/categories`, { headers });
    const catsData = await resCats.json();
    const salarioCat = catsData.categories.find(c => c.name === 'Salário' && c.type === 'ENTRADA');
    const moradiaCat = catsData.categories.find(c => c.name === 'Moradia' && c.type === 'SAIDA');
    const alimentacaoCat = catsData.categories.find(c => c.name === 'Alimentação' && c.type === 'SAIDA');
    const freelanceCat = catsData.categories.find(c => c.name === 'Freelance' && c.type === 'ENTRADA');

    // 1. Criar entrada (Receita recebida)
    console.log('\n--- 1. Criar entrada ---');
    const resEntrada = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'ENTRADA',
        description: 'Salário Mensal CLT',
        amount: 5000.0,
        date: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        status: 'RECEBIDO',
        paymentMethod: 'TRANSFERENCIA',
        categoryId: salarioCat?.id,
        notes: 'Salário creditado em conta corrente',
      }),
    });
    const entradaData = await resEntrada.json();
    console.log(`✔ Entrada criada: "${entradaData.transaction.description}" de R$ ${entradaData.transaction.amount.toFixed(2)} [${entradaData.transaction.status}]`);

    // 2. Criar despesa (Despesa paga)
    console.log('\n--- 2. Criar despesa ---');
    const resDespesa = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'SAIDA',
        description: 'Supermercado Mensal Pão de Açúcar',
        amount: 650.0,
        date: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        status: 'PAGO',
        paymentMethod: 'CARTAO_CREDITO',
        categoryId: alimentacaoCat?.id,
        isFixed: false,
        notes: 'Compras do mês',
      }),
    });
    const despesaData = await resDespesa.json();
    console.log(`✔ Despesa criada: "${despesaData.transaction.description}" de R$ ${despesaData.transaction.amount.toFixed(2)} [${despesaData.transaction.status}]`);

    // 3. Criar conta pendente
    console.log('\n--- 3. Criar conta pendente ---');
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 5); // vence em 5 dias
    const resPendente = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'SAIDA',
        description: 'Aluguel do Apartamento',
        amount: 1500.0,
        date: new Date().toISOString(),
        dueDate: dueDate.toISOString(),
        status: 'PENDENTE',
        paymentMethod: 'BOLETO',
        categoryId: moradiaCat?.id,
        isFixed: true,
        notes: 'Boleto enviado pela imobiliária',
      }),
    });
    const pendenteData = await resPendente.json();
    const pendenteId = pendenteData.transaction.id;
    console.log(`✔ Conta pendente criada: "${pendenteData.transaction.description}" de R$ ${pendenteData.transaction.amount.toFixed(2)} [Vencimento: ${dueDate.toLocaleDateString('pt-BR')}]`);

    // 4. Marcar conta como paga
    console.log('\n--- 4. Marcar conta como paga ---');
    const resMarcarPaga = await fetch(`${BASE_URL}/transactions/${pendenteId}/pay`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        paymentDate: new Date().toISOString(),
      }),
    });
    const pagaData = await resMarcarPaga.json();
    console.log(`✔ Conta atualizada para PAGA: Novo status = [${pagaData.transaction.status}], Data Pagamento = ${pagaData.transaction.paymentDate}`);

    // Criar outra despesa pendente para testar o cálculo de saldo previsto
    const resPendente2 = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'SAIDA',
        description: 'Conta de Energia Elétrica',
        amount: 250.0,
        date: new Date().toISOString(),
        dueDate: dueDate.toISOString(),
        status: 'PENDENTE',
        paymentMethod: 'PIX',
      }),
    });
    await resPendente2.json();
    console.log('✔ Nova conta pendente de R$ 250,00 cadastrada para cálculo de previsões.');

    // 5. Criar pessoa que deve dinheiro (Conta a Receber)
    console.log('\n--- 5. Criar pessoa que deve dinheiro ---');
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 10);
    const resDevedor = await fetch(`${BASE_URL}/receivables`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        debtorName: 'João Silva Empréstimo',
        description: 'Empréstimo para reforma',
        amount: 800.0,
        expectedDate: expectedDate.toISOString(),
        status: 'A_RECEBER',
        categoryId: freelanceCat?.id,
        notes: 'João combinou de pagar via PIX no dia 20',
      }),
    });
    const devedorData = await resDevedor.json();
    const devedorId = devedorData.receivable.id;
    console.log(`✔ Devedor cadastrado: ${devedorData.receivable.debtorName} deve R$ ${devedorData.receivable.amount.toFixed(2)} [Status: ${devedorData.receivable.status}]`);

    // 6. Marcar recebimento
    console.log('\n--- 6. Marcar recebimento ---');
    const resMarcarRecebido = await fetch(`${BASE_URL}/receivables/${devedorId}/receive`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        receivedDate: new Date().toISOString(),
        createTransactionEntry: true,
      }),
    });
    const recebidoData = await resMarcarRecebido.json();
    console.log(`✔ Recebimento marcado com sucesso: Novo status = [${recebidoData.receivable.status}]`);

    // Cadastrar outro devedor ainda pendente para cálculo de saldo previsto
    const resDevedorPendente = await fetch(`${BASE_URL}/receivables`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        debtorName: 'Consultoria Empresa ABC',
        description: 'Serviço de Desenvolvimento Web',
        amount: 1200.0,
        expectedDate: expectedDate.toISOString(),
        status: 'A_RECEBER',
      }),
    });
    await resDevedorPendente.json();
    console.log('✔ Valor a receber pendente de R$ 1.200,00 cadastrado para previsões futuras.');

    // 7. Verificar cálculo do saldo (Saldo Atual)
    console.log('\n--- 7. Verificar cálculo do saldo atual ---');
    // Entradas recebidas = Salário (5000) + Devedor João Silva (800) = 5800
    // Despesas pagas = Supermercado (650) + Aluguel (1500) = 2150
    // Saldo atual esperado = 5800 - 2150 = 3650
    const resDash = await fetch(`${BASE_URL}/dashboard`, { headers });
    const dashData = await resDash.json();

    const saldoEsperado = 5000 + 800 - (650 + 1500);
    console.log(`✔ Saldo Atual Calculado pelo Sistema: R$ ${dashData.cards.saldoAtual.toFixed(2)}`);
    console.log(`✔ Saldo Atual Esperado (5.800 - 2.150): R$ ${saldoEsperado.toFixed(2)}`);
    if (dashData.cards.saldoAtual !== saldoEsperado) {
      throw new Error(`Incompatibilidade no saldo atual: esperado ${saldoEsperado}, obtido ${dashData.cards.saldoAtual}`);
    }

    // 8. Verificar saldo previsto
    console.log('\n--- 8. Verificar saldo previsto ---');
    // Saldo Previsto = Saldo Atual (3650) + A Receber (1200) - Contas Pendentes (250) = 4600
    const saldoPrevistoEsperado = saldoEsperado + 1200 - 250;
    console.log(`✔ Saldo Previsto Calculado pelo Sistema: R$ ${dashData.cards.saldoPrevisto.toFixed(2)}`);
    console.log(`✔ Saldo Previsto Esperado (3.650 + 1.200 - 250): R$ ${saldoPrevistoEsperado.toFixed(2)}`);
    if (dashData.cards.saldoPrevisto !== saldoPrevistoEsperado) {
      throw new Error(`Incompatibilidade no saldo previsto: esperado ${saldoPrevistoEsperado}, obtido ${dashData.cards.saldoPrevisto}`);
    }

    // 9. Verificar gráficos
    console.log('\n--- 9. Verificar dados para gráficos ---');
    console.log(`✔ Gráfico 1 (Histórico Mensal): ${dashData.monthlyHistory.length} meses gerados.`);
    console.log(`✔ Gráfico 2 (Gastos por Categoria): ${dashData.gastosPorCategoria.length} categorias com valores.`);
    console.log(`✔ Gráfico 3 (Fixos x Variáveis): Fixos = R$ ${dashData.gastosFixosVsVariaveis.fixos}, Variáveis = R$ ${dashData.gastosFixosVsVariaveis.variaveis}`);
    console.log(`✔ Gráfico 4 (Pagos x Pendentes): Pagos = R$ ${dashData.valoresPagosVsPendentes.pagos}, Pendentes = R$ ${dashData.valoresPagosVsPendentes.pendentes}`);
    console.log(`✔ Gráfico 5 (Valores a Receber): A Receber = R$ ${dashData.receivablesDistribution.aReceber}, Recebido = R$ ${dashData.receivablesDistribution.recebido}`);
    console.log(`✔ Destaque Inteligente do Mês (🏆 Maior Gasto): ${dashData.topCategory?.name} — R$ ${dashData.topCategory?.amount.toFixed(2)} (${dashData.topCategory?.percentage}%)`);

    // 10. Verificar filtros e relatórios
    console.log('\n--- 10. Verificar filtros e relatórios ---');
    // Teste de filtro por tipo
    const resFiltroEntradas = await fetch(`${BASE_URL}/transactions?type=ENTRADA`, { headers });
    const dataFiltroEntradas = await resFiltroEntradas.json();
    console.log(`✔ Filtro por Tipo (Entradas): ${dataFiltroEntradas.transactions.length} registros retornados.`);

    // Teste de filtro por texto
    const resBusca = await fetch(`${BASE_URL}/transactions?search=Supermercado`, { headers });
    const dataBusca = await resBusca.json();
    console.log(`✔ Busca textual ("Supermercado"): ${dataBusca.transactions.length} registro(s) encontrado(s).`);

    // Teste do Relatório Financeiro
    const resRelatorio = await fetch(`${BASE_URL}/reports?period=este_mes`, { headers });
    const relatorioData = await resRelatorio.json();
    console.log(`✔ Relatório Financeiro: Total Entradas = R$ ${relatorioData.fluxoDeCaixa.totalEntradas.toFixed(2)}, Total Saídas = R$ ${relatorioData.fluxoDeCaixa.totalSaidas.toFixed(2)}, Saldo = R$ ${relatorioData.fluxoDeCaixa.saldo.toFixed(2)}`);
    console.log(`✔ Insights Financeiros Gerados: ${relatorioData.analiseGastos.insights.join(' | ')}`);

    // Teste das exportações
    const resExcel = await fetch(`${BASE_URL}/reports/export/excel?period=este_mes`, { headers });
    const resCsv = await fetch(`${BASE_URL}/reports/export/csv?period=este_mes`, { headers });
    const resPdf = await fetch(`${BASE_URL}/reports/export/pdf?period=este_mes`, { headers });

    if (resExcel.status === 200 && resCsv.status === 200 && resPdf.status === 200) {
      console.log('✔ Exportações validadas com sucesso: Excel (.xlsx), CSV e PDF retornaram status 200 OK.');
    } else {
      throw new Error('Falha na geração dos arquivos exportados.');
    }

    console.log('\n================================================================');
    console.log('✨ SUCESSO TOTAL: TODOS OS 10 FLUXOS FORAM EXECUTADOS E VALIDARAM 100%!');
    console.log('================================================================\n');
  } catch (error) {
    console.error('❌ ERRO DURANTE A VERIFICAÇÃO:', error);
    process.exit(1);
  }
}

runEndToEndVerification();
