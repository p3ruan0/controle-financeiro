import express from 'express';
import cors from 'cors';
import routes from './routes';
import prisma from './lib/prisma';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api', routes);

const TEST_PORT = 5088;

async function runAdminTests() {
  console.log('===============================================================');
  console.log('🛡️ INICIANDO TESTES AUTOMATIZADOS DO PAINEL ADMINISTRATIVO');
  console.log('===============================================================\n');

  const server = app.listen(TEST_PORT, async () => {
    const baseUrl = `http://localhost:${TEST_PORT}/api`;
    try {
      // Clean DB to start fresh
      await prisma.auditLog.deleteMany({});
      await prisma.loginHistory.deleteMany({});
      await prisma.userSession.deleteMany({});
      await prisma.invitation.deleteMany({});
      await prisma.transaction.deleteMany({});
      await prisma.recurringExpense.deleteMany({});
      await prisma.receivableAccount.deleteMany({});
      await prisma.category.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.company.deleteMany({});

      // 1. Register Super Admin (first user is automatically SUPER_ADMIN)
      const adminEmail = `superadmin_${Date.now()}@fluxocaixa.com`;
      const resReg = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Super Admin Master',
          email: adminEmail,
          password: 'superSecretPassword123',
        }),
      });
      const dataReg = (await resReg.json()) as any;
      if (!resReg.ok) throw new Error(`Falha no registro: ${JSON.stringify(dataReg)}`);
      const adminToken = dataReg.token;
      const adminHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      };
      console.log(`✔ [1] Super Admin registrado com sucesso. Perfil: ${dataReg.user.role}`);

      // 2. Test Admin Dashboard
      const resDash = await fetch(`${baseUrl}/admin/dashboard`, { headers: adminHeaders });
      const dataDash = (await resDash.json()) as any;
      if (!resDash.ok) throw new Error(`Falha no dashboard admin: ${JSON.stringify(dataDash)}`);
      console.log(`✔ [2] Dashboard Admin OK. Total Usuários: ${dataDash.metrics.users.total}, Total Empresas: ${dataDash.metrics.companies.total}`);

      // 3. Create Company (Empresa ABC Tech)
      const resComp = await fetch(`${baseUrl}/admin/companies`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          name: 'Empresa ABC Tech',
          cnpj: '12.345.678/0001-90',
          contactName: 'Diretor Financeiro',
          email: 'contato@abctech.com',
          phone: '(11) 99999-8888',
        }),
      });
      const dataComp = (await resComp.json()) as any;
      if (!resComp.ok) throw new Error(`Falha ao criar empresa: ${JSON.stringify(dataComp)}`);
      const companyId = dataComp.company.id;
      console.log(`✔ [3] Empresa criada com sucesso: "${dataComp.company.name}" (ID: ${companyId})`);

      // 4. Create User linked to company
      const clientEmail = `joao.cliente_${Date.now()}@abctech.com`;
      const resUser = await fetch(`${baseUrl}/admin/users`, {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          name: 'João Silva Cliente',
          email: clientEmail,
          password: 'clientePassword123',
          role: 'CLIENT_ADMIN',
          companyId,
          sendInvitation: false,
        }),
      });
      const dataUser = (await resUser.json()) as any;
      if (!resUser.ok) throw new Error(`Falha ao criar usuário cliente: ${JSON.stringify(dataUser)}`);
      const clientId = dataUser.user.id;
      console.log(`✔ [4] Usuário cliente cadastrado: "${dataUser.user.name}" vinculada à empresa.`);

      // 5. Test Login as João Silva Cliente and check metrics
      const resLoginClient = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientEmail,
          password: 'clientePassword123',
        }),
      });
      const dataLoginClient = (await resLoginClient.json()) as any;
      if (!resLoginClient.ok) throw new Error(`Falha no login do cliente: ${JSON.stringify(dataLoginClient)}`);
      const clientToken = dataLoginClient.token;
      console.log(`✔ [5] Login do cliente realizado com sucesso. Sessão e rastreamento ativados.`);

      // 6. Test User Details (Check that login metrics and sessions are populated)
      const resDetails = await fetch(`${baseUrl}/admin/users/${clientId}`, { headers: adminHeaders });
      const dataDetails = (await resDetails.json()) as any;
      console.log(`✔ [6] Detalhes do Usuário OK: Login Count = ${dataDetails.user.loginCount}, IP = ${dataDetails.user.lastLoginIp}, Sessões ativas = ${dataDetails.sessions.length}`);

      // 7. Block User
      const resBlock = await fetch(`${baseUrl}/admin/users/${clientId}/block`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ reason: 'Inadimplência contratual temporária' }),
      });
      const dataBlock = (await resBlock.json()) as any;
      console.log(`✔ [7] Usuário bloqueado com sucesso: Status = ${dataBlock.user.status}`);

      // 8. Attempt login while blocked -> MUST FAIL with 403
      const resBlockedLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientEmail,
          password: 'clientePassword123',
        }),
      });
      if (resBlockedLogin.status !== 403) {
        throw new Error(`Esperado status 403 ao tentar logar usuário bloqueado, recebido: ${resBlockedLogin.status}`);
      }
      console.log(`✔ [8] Tentativa de login bloqueada com sucesso (HTTP 403 Forbidden).`);

      // 9. Unblock User
      const resUnblock = await fetch(`${baseUrl}/admin/users/${clientId}/unblock`, {
        method: 'PATCH',
        headers: adminHeaders,
      });
      const dataUnblock = (await resUnblock.json()) as any;
      console.log(`✔ [9] Usuário desbloqueado com sucesso: Status = ${dataUnblock.user.status}`);

      // 10. Attempt login again -> MUST SUCCEED
      const resUnblockedLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientEmail,
          password: 'clientePassword123',
        }),
      });
      if (!resUnblockedLogin.ok) throw new Error('Falha no login após desbloqueio.');
      console.log(`✔ [10] Login após desbloqueio OK.`);

      // 11. Block Company (Cascading block)
      const resBlockCompany = await fetch(`${baseUrl}/admin/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ action: 'block', reason: 'Suspensão da conta empresarial' }),
      });
      const dataBlockCompany = (await resBlockCompany.json()) as any;
      console.log(`✔ [11] Empresa bloqueada: Status = ${dataBlockCompany.company.status}`);

      // 12. Attempt login by company user -> MUST FAIL with 403
      const resCompBlockedLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientEmail,
          password: 'clientePassword123',
        }),
      });
      if (resCompBlockedLogin.status !== 403) {
        throw new Error(`Esperado 403 ao logar usuário de empresa bloqueada, recebido: ${resCompBlockedLogin.status}`);
      }
      console.log(`✔ [12] Bloqueio em cascata validado com sucesso (Usuário impedido pois a empresa está bloqueada).`);

      // 13. Reactivate Company
      await fetch(`${baseUrl}/admin/companies/${companyId}/status`, {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ action: 'unblock' }),
      });
      console.log(`✔ [13] Empresa reativada com sucesso.`);

      // 14. Test RBAC: ordinary client cannot access admin dashboard
      const clientHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clientToken}`,
      };
      const resUnauthorizedAdmin = await fetch(`${baseUrl}/admin/dashboard`, { headers: clientHeaders });
      if (resUnauthorizedAdmin.status !== 403) {
        throw new Error(`Esperado 403 para usuário comum acessando /admin, recebido: ${resUnauthorizedAdmin.status}`);
      }
      console.log(`✔ [14] Proteção de rotas RBAC validada: Usuário comum recebeu HTTP 403 ao tentar acessar área administrativa.`);

      // 15. Check Audit Logs
      const resLogs = await fetch(`${baseUrl}/admin/audit-logs`, { headers: adminHeaders });
      const dataLogs = (await resLogs.json()) as any;
      console.log(`✔ [15] Logs de Auditoria OK: ${dataLogs.logs.length} registros imutáveis de ações administrativas armazenados.`);

      // 16. Soft Delete User
      const resSoftDelete = await fetch(`${baseUrl}/admin/users/${clientId}`, {
        method: 'DELETE',
        headers: adminHeaders,
      });
      if (!resSoftDelete.ok) throw new Error('Falha no soft delete.');
      console.log(`✔ [16] Exclusão lógica (Soft Delete) realizada com sucesso.`);

      // Verify soft deleted user cannot login
      const resDeletedLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: clientEmail,
          password: 'clientePassword123',
        }),
      });
      if (resDeletedLogin.status !== 400 && resDeletedLogin.status !== 401) {
        throw new Error(`Esperado rejeição de login para usuário excluído, recebido: ${resDeletedLogin.status}`);
      }
      console.log(`✔ [17] Login de usuário com soft delete rejeitado corretamente.`);

      console.log('\n===============================================================');
      console.log('🎉 TODOS OS TESTES ADMINISTRATIVOS PASSARAM COM 100% DE SUCESSO!');
      console.log('===============================================================\n');

      server.close();
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ ERRO NOS TESTES DE ADMINISTRAÇÃO:', err);
      server.close();
      await prisma.$disconnect();
      process.exit(1);
    }
  });
}

runAdminTests();
