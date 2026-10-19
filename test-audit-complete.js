// Auditoria Completa Automatizada: Ciclo de Validação de CRUD, Integridade, Tratamento de Erros e Sincronização
const BASE_URL = 'http://localhost:5000/api';

async function runAudit() {
  console.log('========================================================================');
  console.log('🔍 INICIANDO AUDITORIA RIGOROSA DO SISTEMA E SINCRONIZAÇÃO DE DADOS');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 0. Autenticação para ambiente isolado de teste
    console.log('--- ETAPA 0: Criar Usuário Isolado de Teste ---');
    const email = `audit_user_${Date.now()}@fluxocaixa.com`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Usuário Auditoria',
        email,
        password: 'SenhaSegura@123',
      }),
    });
    const regData = await regRes.json();
    assert(regRes.ok && regData.token, `Registro do usuário ${email} concluído`);
    const token = regData.token;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 1. AUDITORIA DE CATEGORIAS
    console.log('\n--- ETAPA 1: Auditoria de Categorias (CRUD & Integridade) ---');
    // 1.1 Criar categoria
    const createCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Supermercado Especial',
        type: 'SAIDA',
        color: '#f97316',
        icon: 'ShoppingBag',
      }),
    });
    const createCatData = await createCatRes.json();
    assert(createCatRes.status === 201 && createCatData.category?.id, 'Criação de nova categoria de saída');
    const catId = createCatData.category.id;

    // 1.2 Editar categoria
    const updateCatRes = await fetch(`${BASE_URL}/categories/${catId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: 'Supermercado e Feira Orgânica',
        color: '#10b981',
      }),
    });
    const updateCatData = await updateCatRes.json();
    assert(
      updateCatRes.ok && updateCatData.category?.name === 'Supermercado e Feira Orgânica',
      'Edição de categoria refletida no backend'
    );

    // 1.3 Criar transação vinculada a essa categoria
    const tWithCatRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'SAIDA',
        description: 'Compras Feira Orgânica',
        amount: 150.0,
        date: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        status: 'PAGO',
        categoryId: catId,
      }),
    });
    const tWithCatData = await tWithCatRes.json();
    const tId = tWithCatData.transaction?.id;
    assert(tWithCatData.transaction?.categoryId === catId, 'Transação criada e associada à categoria');

    // 1.4 Excluir categoria utilizada
    const deleteCatRes = await fetch(`${BASE_URL}/categories/${catId}`, {
      method: 'DELETE',
      headers,
    });
    assert(deleteCatRes.ok, 'Exclusão de categoria com transação vinculada executada com sucesso');

    // 1.5 Verificar que a transação não foi apagada, mas teve categoryId limpo para null
    const checkTxRes = await fetch(`${BASE_URL}/transactions/${tId}`, { headers });
    const checkTxData = await checkTxRes.json();
    assert(
      checkTxData.transaction && checkTxData.transaction.categoryId === null,
      'Transação preservada e desvinculada (categoryId = null) sem erro de chave estrangeira'
    );

    // 2. AUDITORIA DE ENTRADAS & SALDO
    console.log('\n--- ETAPA 2: Auditoria de Entradas & Saldo em Tempo Real ---');
    // Saldo inicial deve ser -150 (devido à despesa anterior de 150)
    let dashRes = await fetch(`${BASE_URL}/dashboard`, { headers });
    let dashData = await dashRes.json();
    const saldoAntesEntrada = dashData.cards.saldoAtual;

    // Criar entrada recebida de 1000
    const inRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'ENTRADA',
        description: 'Venda de Consultoria',
        amount: 1000.0,
        date: new Date().toISOString(),
        paymentDate: new Date().toISOString(),
        status: 'RECEBIDO',
      }),
    });
    const inData = await inRes.json();
    const inId = inData.transaction?.id;
    assert(inRes.status === 201 && inData.transaction?.amount === 1000, 'Entrada de R$ 1.000,00 criada');

    // Verificar atualização do saldo no dashboard
    dashRes = await fetch(`${BASE_URL}/dashboard`, { headers });
    dashData = await dashRes.json();
    assert(
      dashData.cards.saldoAtual === saldoAntesEntrada + 1000,
      `Saldo atual no dashboard atualizado (+R$ 1.000): Novo saldo = ${dashData.cards.saldoAtual}`
    );

    // Editar entrada para 1200
    const editInRes = await fetch(`${BASE_URL}/transactions/${inId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        amount: 1200.0,
        description: 'Venda de Consultoria Premium',
      }),
    });
    assert(editInRes.ok, 'Entrada editada para R$ 1.200,00');

    dashRes = await fetch(`${BASE_URL}/dashboard`, { headers });
    dashData = await dashRes.json();
    assert(
      dashData.cards.saldoAtual === saldoAntesEntrada + 1200,
      `Saldo atual recalculado dinamicamente (+R$ 200 adicionais): Novo saldo = ${dashData.cards.saldoAtual}`
    );

    // 3. AUDITORIA DE SAÍDAS E CONTAS A PAGAR
    console.log('\n--- ETAPA 3: Auditoria de Saídas & Liquidação em 1 Clique ---');
    const payRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'SAIDA',
        description: 'Conta de Internet Fibra',
        amount: 200.0,
        date: new Date().toISOString(),
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        status: 'PENDENTE',
      }),
    });
    const payData = await payRes.json();
    const payId = payData.transaction?.id;
    assert(payData.transaction?.status === 'PENDENTE', 'Conta a pagar criada como PENDENTE');

    // Saldo atual não deve mudar com conta pendente, mas total de contas pendentes sim
    dashRes = await fetch(`${BASE_URL}/dashboard`, { headers });
    dashData = await dashRes.json();
    assert(
      dashData.cards.totalContasPendentes >= 200,
      'Total de contas pendentes refletido no dashboard'
    );

    // Liquidar conta em 1 clique
    const payPatchRes = await fetch(`${BASE_URL}/transactions/${payId}/pay`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ paymentDate: new Date().toISOString() }),
    });
    const payPatchData = await payPatchRes.json();
    assert(payPatchData.transaction?.status === 'PAGO', 'Conta marcada como PAGA com sucesso');

    // Agora saldo atual deve subtrair 200
    dashRes = await fetch(`${BASE_URL}/dashboard`, { headers });
    dashData = await dashRes.json();
    assert(
      dashData.cards.saldoAtual === saldoAntesEntrada + 1200 - 200,
      `Saldo atual decrementado após liquidação da conta: ${dashData.cards.saldoAtual}`
    );

    // 4. AUDITORIA DE CONTAS A RECEBER
    console.log('\n--- ETAPA 4: Auditoria de Contas a Receber & Integração de Caixa ---');
    const recRes = await fetch(`${BASE_URL}/receivables`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        debtorName: 'Empresa Parceira Ltda',
        description: 'Serviço de Desenvolvimento Web',
        amount: 3500.0,
        expectedDate: new Date(Date.now() + 86400000 * 7).toISOString(),
        status: 'A_RECEBER',
      }),
    });
    const recData = await recRes.json();
    const recId = recData.receivable?.id;
    assert(recRes.status === 201 && recId, 'Conta a receber de R$ 3.500,00 cadastrada');

    // Confirmar recebimento (gera lançamento de caixa)
    const recPatchRes = await fetch(`${BASE_URL}/receivables/${recId}/receive`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        receivedDate: new Date().toISOString(),
        createTransactionEntry: true,
      }),
    });
    const recPatchData = await recPatchRes.json();
    assert(
      recPatchData.receivable?.status === 'RECEBIDO',
      'Conta a receber marcada como RECEBIDA com entrada gerada no caixa'
    );

    // Verificar que o saldo de caixa subiu em 3500
    dashRes = await fetch(`${BASE_URL}/dashboard`, { headers });
    dashData = await dashRes.json();
    assert(
      dashData.cards.saldoAtual === saldoAntesEntrada + 1200 - 200 + 3500,
      `Saldo atual no dashboard reflete o valor recebido (+R$ 3.500): ${dashData.cards.saldoAtual}`
    );

    // 5. AUDITORIA DE ERROS E CASOS EXTREMOS
    console.log('\n--- ETAPA 5: Auditoria de Resiliência & Tratamento de Erros ---');
    // 5.1 Validação com valor negativo
    const errAmountRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'SAIDA',
        description: 'Teste Inválido',
        amount: -50,
        date: new Date().toISOString(),
      }),
    });
    assert(errAmountRes.status === 400, 'Rejeição correta (HTTP 400) para valor negativo');

    // 5.2 Validação sem descrição obrigatória
    const errDescRes = await fetch(`${BASE_URL}/transactions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'ENTRADA',
        description: '',
        amount: 100,
        date: new Date().toISOString(),
      }),
    });
    assert(errDescRes.status === 400, 'Rejeição correta (HTTP 400) para descrição vazia');

    // 5.3 Registro inexistente (HTTP 404)
    const errNotFoundRes = await fetch(`${BASE_URL}/transactions/id-inexistente-123456`, { headers });
    assert(errNotFoundRes.status === 404, 'Retorno correto HTTP 404 para ID inexistente');

    // 5.4 Categoria duplicada com mesmo nome para mesmo usuário
    const dupCatRes = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Categoria Duplicada Teste',
        type: 'SAIDA',
      }),
    });
    const dupCatRes2 = await fetch(`${BASE_URL}/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Categoria Duplicada Teste',
        type: 'SAIDA',
      }),
    });
    assert(dupCatRes.status === 201 && dupCatRes2.status === 400, 'Prevenção de duplicidade de categorias com mesmo nome');

    // 6. AUDITORIA DE RELATÓRIOS E EXPORTAÇÕES
    console.log('\n--- ETAPA 6: Auditoria de Relatórios e Exportações ---');
    const repRes = await fetch(`${BASE_URL}/reports?period=este_mes`, { headers });
    const repData = await repRes.json();
    assert(repRes.ok && repData.fluxoDeCaixa, 'Cálculo de balanço e fluxo de caixa de relatórios consistente');

    const expXlsx = await fetch(`${BASE_URL}/reports/export/excel?period=este_mes`, { headers });
    assert(expXlsx.status === 200, 'Exportação Excel funcional');

    const expCsv = await fetch(`${BASE_URL}/reports/export/csv?period=este_mes`, { headers });
    assert(expCsv.status === 200, 'Exportação CSV funcional');

    const expPdf = await fetch(`${BASE_URL}/reports/export/pdf?period=este_mes`, { headers });
    assert(expPdf.status === 200, 'Exportação PDF funcional');

    console.log('\n========================================================================');
    console.log(`🎯 RESULTADO DA AUDITORIA: ${passed} PASSOU | ${failed} FALHOU`);
    console.log('========================================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Erro inesperado durante a auditoria:', error);
    process.exit(1);
  }
}

runAudit();
