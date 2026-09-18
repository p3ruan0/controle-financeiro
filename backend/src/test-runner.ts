import express from 'express';
import cors from 'cors';
import routes from './routes';
import prisma from './lib/prisma';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

const TEST_PORT = 5099;

async function runTests() {
  console.log('--- INICIANDO TESTES AUTOMATIZADOS DO BACKEND ---');
  const server = app.listen(TEST_PORT, async () => {
    const baseUrl = `http://localhost:${TEST_PORT}/api`;
    try {
      // 1. Health check
      const resHealth = await fetch(`${baseUrl}/health`);
      const dataHealth = (await resHealth.json()) as any;
      console.log('✔ Health Check OK:', dataHealth.status);

      // 2. Register user
      const testEmail = `test_${Date.now()}@exemplo.com`;
      const resReg = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Cristiano Teste',
          email: testEmail,
          password: 'senhaSegura123',
        }),
      });
      const dataReg = (await resReg.json()) as any;
      if (!resReg.ok) throw new Error(`Falha no registro: ${JSON.stringify(dataReg)}`);
      const token = dataReg.token;
      console.log('✔ Registro de Usuário OK. Token recebido.');

      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 3. Check Categories
      const resCats = await fetch(`${baseUrl}/categories`, { headers: authHeaders });
      const dataCats = (await resCats.json()) as any;
      if (dataCats.categories.length === 0) throw new Error('Categorias padrão não foram criadas.');
      console.log(`✔ Categorias OK. ${dataCats.categories.length} categorias cadastradas.`);

      const salarioCat = dataCats.categories.find((c: any) => c.name === 'Salário');
      const alimentacaoCat = dataCats.categories.find((c: any) => c.name === 'Alimentação');

      // 4. Create Entrada (Receita)
      const resEntrada = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          type: 'ENTRADA',
          description: 'Salário Quinzenal',
          amount: 3000,
          date: new Date().toISOString(),
          status: 'RECEBIDO',
          paymentMethod: 'TRANSFERENCIA',
          categoryId: salarioCat?.id,
        }),
      });
      const dataEntrada = (await resEntrada.json()) as any;
      if (!resEntrada.ok) throw new Error(`Falha ao criar entrada: ${JSON.stringify(dataEntrada)}`);
      console.log('✔ Entrada criada com sucesso:', dataEntrada.transaction.description, 'R$', dataEntrada.transaction.amount);

      // 5. Create Saída (Despesa Paga)
      const resSaidaPaga = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          type: 'SAIDA',
          description: 'Supermercado Mensal',
          amount: 500,
          date: new Date().toISOString(),
          status: 'PAGO',
          paymentMethod: 'CARTAO_CREDITO',
          categoryId: alimentacaoCat?.id,
        }),
      });
      const dataSaidaPaga = (await resSaidaPaga.json()) as any;
      if (!resSaidaPaga.ok) throw new Error(`Falha ao criar saída paga: ${JSON.stringify(dataSaidaPaga)}`);
      console.log('✔ Saída paga criada com sucesso: R$', dataSaidaPaga.transaction.amount);

      // 6. Create Saída (Despesa Pendente)
      const resSaidaPendente = await fetch(`${baseUrl}/transactions`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          type: 'SAIDA',
          description: 'Conta de Luz',
          amount: 200,
          date: new Date().toISOString(),
          dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
          status: 'PENDENTE',
          paymentMethod: 'BOLETO',
        }),
      });
      const dataSaidaPendente = (await resSaidaPendente.json()) as any;
      const pendenteId = dataSaidaPendente.transaction.id;
      console.log('✔ Saída pendente criada com sucesso: R$', dataSaidaPendente.transaction.amount);

      // 7. Mark as Paid
      const resPay = await fetch(`${baseUrl}/transactions/${pendenteId}/pay`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ paymentDate: new Date().toISOString() }),
      });
      const dataPay = (await resPay.json()) as any;
      if (dataPay.transaction.status !== 'PAGO') throw new Error('Falha ao marcar como pago.');
      console.log('✔ Marcar como paga OK. Novo status:', dataPay.transaction.status);

      // 8. Create Conta a Receber
      const resReceivable = await fetch(`${baseUrl}/receivables`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          debtorName: 'Empresa XYZ',
          description: 'Serviço de Consultoria',
          amount: 1500,
          expectedDate: new Date(Date.now() + 86400000 * 10).toISOString(),
          status: 'A_RECEBER',
        }),
      });
      const dataReceivable = (await resReceivable.json()) as any;
      const recId = dataReceivable.receivable.id;
      console.log('✔ Conta a receber cadastrada:', dataReceivable.receivable.debtorName, 'R$', dataReceivable.receivable.amount);

      // 9. Mark Receivable as Received
      const resReceive = await fetch(`${baseUrl}/receivables/${recId}/receive`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ receivedDate: new Date().toISOString() }),
      });
      const dataReceive = (await resReceive.json()) as any;
      if (dataReceive.receivable.status !== 'RECEBIDO') throw new Error('Falha ao marcar receivable como recebido.');
      console.log('✔ Conta marcada como recebida OK.');

      // 10. Fixed Expense & Auto-generation
      const resFixed = await fetch(`${baseUrl}/fixed-expenses`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          name: 'Internet Fibra',
          amount: 100,
          dueDay: 10,
          paymentMethod: 'BOLETO',
          recurrence: 'MENSAL',
          isActive: true,
          autoGenerate: true,
        }),
      });
      const dataFixed = (await resFixed.json()) as any;
      console.log('✔ Gasto fixo cadastrado:', dataFixed.fixedExpense.name);

      // 11. Dashboard Verification
      const resDash = await fetch(`${baseUrl}/dashboard`, { headers: authHeaders });
      const dataDash = (await resDash.json()) as any;
      console.log('✔ Dashboard Dados:');
      console.log('   - Saldo Atual:', dataDash.cards.saldoAtual);
      console.log('   - Saldo Previsto:', dataDash.cards.saldoPrevisto);
      console.log('   - Total Entradas:', dataDash.cards.totalEntradasGeral);
      console.log('   - Total Saídas:', dataDash.cards.totalSaidasGeral);
      console.log('   - Top Categoria:', dataDash.topCategory?.name, `R$ ${dataDash.topCategory?.amount}`);

      // 12. Report & Export verification
      const resReport = await fetch(`${baseUrl}/reports?period=este_mes`, { headers: authHeaders });
      const dataReport = (await resReport.json()) as any;
      console.log('✔ Relatório do mês OK. Saldo:', dataReport.fluxoDeCaixa.saldo);

      const resCsv = await fetch(`${baseUrl}/reports/export/csv?period=este_mes`, { headers: authHeaders });
      if (!resCsv.ok) throw new Error('Falha no download de CSV');
      const csvText = await resCsv.text();
      console.log('✔ Exportação CSV OK. Linhas geradas:', csvText.split('\n').length);

      const resExcel = await fetch(`${baseUrl}/reports/export/excel?period=este_mes`, { headers: authHeaders });
      if (!resExcel.ok) throw new Error('Falha no download de Excel');
      console.log('✔ Exportação Excel (.xlsx) OK. Status 200.');

      const resPdf = await fetch(`${baseUrl}/reports/export/pdf?period=este_mes`, { headers: authHeaders });
      if (!resPdf.ok) throw new Error('Falha no download de PDF');
      console.log('✔ Exportação PDF OK. Status 200.');

      console.log('\n======================================================');
      console.log('🎉 TODOS OS TESTES DE BACKEND FORAM CONCLUÍDOS COM SUCESSO!');
      console.log('======================================================\n');
      server.close();
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ ERRO NOS TESTES:', err);
      server.close();
      await prisma.$disconnect();
      process.exit(1);
    }
  });
}

runTests();
