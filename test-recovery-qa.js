const path = require('path');
const { PrismaClient } = require(path.join(__dirname, 'backend/node_modules/@prisma/client'));
const bcrypt = require(path.join(__dirname, 'backend/node_modules/bcryptjs'));
const crypto = require('crypto');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:5000/api';

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ [FALHA] ${message}`);
    throw new Error(`Falha no teste: ${message}`);
  }
  passedTests++;
  console.log(`✅ [SUCESSO] ${message}`);
}

async function runQATests() {
  console.log('================================================================');
  console.log('🧪 INICIANDO BATERIA DE TESTES DE QA - RECUPERAÇÃO DE SENHA');
  console.log('================================================================\n');

  const testEmail = 'qa_recovery_user@fluxocaixa.com';
  const originalPassword = 'OldPassword@2026';
  const newPassword = 'NewPassword@SuperSecure2026';

  // SETUP: Garantir usuário limpo para o teste
  await prisma.auditLog.deleteMany({
    where: { targetUser: { email: testEmail } }
  });
  await prisma.userSession.deleteMany({
    where: { user: { email: testEmail } }
  });
  await prisma.loginHistory.deleteMany({
    where: { email: testEmail }
  });
  await prisma.user.deleteMany({
    where: { email: testEmail }
  });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(originalPassword, salt);

  const testUser = await prisma.user.create({
    data: {
      name: 'QA Test User',
      email: testEmail,
      password: passwordHash,
      role: 'USER',
      status: 'ATIVO',
    },
  });

  console.log(`👤 Usuário de teste criado: ID=${testUser.id}, Email=${testUser.email}\n`);

  // -------------------------------------------------------------
  // TESTE 1: Solicitação para e-mail não cadastrado (Prevenção de Enumeração)
  // -------------------------------------------------------------
  console.log('--- Teste 1: Solicitação com e-mail não existente ---');
  const res1 = await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: 'inexistente_9999999@naoexiste.com' }),
  });
  assert(res1.ok, 'Resposta 200 recebida mesmo para e-mail inexistente');
  assert(
    res1.data.message && res1.data.message.includes('Se o e-mail informado estiver cadastrado'),
    'Mensagem genérica retornada sem revelar existência da conta'
  );
  assert(res1.data.resetToken === undefined, 'Código de recuperação NÃO é exposto na resposta da API');
  assert(res1.data.code === undefined, 'Campo code não é exposto na resposta da API');

  // -------------------------------------------------------------
  // TESTE 2: Solicitação para e-mail cadastrado (Segurança do payload e hash no BD)
  // -------------------------------------------------------------
  console.log('\n--- Teste 2: Solicitação com e-mail cadastrado ---');
  const res2 = await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail }),
  });
  assert(res2.ok, 'Resposta 200 recebida para e-mail cadastrado');
  assert(res2.data.resetToken === undefined, 'Código real NUNCA é retornado no JSON');
  assert(res2.data.code === undefined, 'Código real não existe no JSON');

  // Verificar banco de dados
  const userAfterRequest = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(userAfterRequest.resetToken !== null, 'Código foi persistido no banco de dados');
  assert(userAfterRequest.resetToken.length === 64, 'Código foi armazenado como HASH SHA-256 (64 hex caracteres), e não em texto puro');
  assert(!/^\d{6}$/.test(userAfterRequest.resetToken), 'Confirmado: o valor no BD NÃO é o código numérico em texto puro');
  assert(userAfterRequest.resetTokenExpiry > new Date(), 'Data de expiração configurada corretamente no futuro (~10 min)');
  assert(userAfterRequest.resetTokenAttempts === 0, 'Contador de tentativas de código inicializado em 0');

  // -------------------------------------------------------------
  // TESTE 3: Validação de código incorreto e contador de tentativas
  // -------------------------------------------------------------
  console.log('\n--- Teste 3: Validação de código incorreto ---');
  const res3 = await request('/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, code: '000000' }),
  });
  assert(res3.status === 400, 'Código incorreto rejeitado com status 400');
  assert(res3.data.error.includes('Código de verificação incorreto'), 'Mensagem informa que o código está incorreto');
  assert(res3.data.remainingAttempts === 4, 'Tentativas restantes calculadas corretamente (4 restantes)');

  const userAfterFail1 = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(userAfterFail1.resetTokenAttempts === 1, 'Contador resetTokenAttempts incrementado no banco para 1');

  // -------------------------------------------------------------
  // TESTE 4: Proteção contra força bruta (Limite de 5 tentativas)
  // -------------------------------------------------------------
  console.log('\n--- Teste 4: Força bruta (esgotamento de tentativas) ---');
  await request('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify({ email: testEmail, code: '000001' }) });
  await request('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify({ email: testEmail, code: '000002' }) });
  await request('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify({ email: testEmail, code: '000003' }) });
  const res4Final = await request('/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, code: '000004' }),
  });
  assert(res4Final.status === 400 || res4Final.status === 429, '5ª tentativa falha bloqueada');
  assert(res4Final.data.error.includes('Limite') || res4Final.data.error.includes('invalidado'), 'Aviso de limite máximo atingido retornado');

  const userAfterBruteForce = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(userAfterBruteForce.resetToken === null, 'Código foi permanentemente INVALIDADO e apagado do banco de dados após 5 erros');

  // -------------------------------------------------------------
  // TESTE 5: Fluxo Feliz — Geração, Validação Correta e Emissão de Token de Autorização
  // -------------------------------------------------------------
  console.log('\n--- Teste 5: Fluxo correto de validação com código válido ---');
  // Para testar a validação com código exato sem ler logs, geramos um código conhecido e salvamos o hash correspondente
  const knownCode = '742918';
  const knownHash = crypto.createHash('sha256').update(knownCode).digest('hex');
  await prisma.user.update({
    where: { id: testUser.id },
    data: {
      resetToken: knownHash,
      resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
      resetTokenAttempts: 0,
    },
  });

  const res5 = await request('/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, code: knownCode }),
  });
  assert(res5.ok, 'Código válido aceito com sucesso (200 OK)');
  assert(typeof res5.data.resetAuthorizationToken === 'string', 'Token de autorização de redefinição (JWT) emitido com sucesso');

  const authorizationToken = res5.data.resetAuthorizationToken;
  const userAfterVerify = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(userAfterVerify.resetToken.startsWith('AUTHORIZED:'), 'Estado do usuário no BD atualizado para AUTHORIZED com nonce único');

  // -------------------------------------------------------------
  // TESTE 6: Tentativa de revalidar o mesmo código (Impedir reutilização de código)
  // -------------------------------------------------------------
  console.log('\n--- Teste 6: Impedir reutilização do mesmo código ---');
  const res6 = await request('/auth/verify-reset-code', {
    method: 'POST',
    body: JSON.stringify({ email: testEmail, code: knownCode }),
  });
  assert(res6.status === 400, 'Código já validado é rejeitado em tentativas posteriores');

  // -------------------------------------------------------------
  // TESTE 7: Validação de senhas divergentes na redefinição
  // -------------------------------------------------------------
  console.log('\n--- Teste 7: Rejeição de senhas divergentes na redefinição ---');
  const res7 = await request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      resetAuthorizationToken: authorizationToken,
      newPassword: 'PasswordA@123',
      confirmPassword: 'PasswordB@456',
    }),
  });
  assert(res7.status === 400, 'Senhas divergentes rejeitadas com status 400');
  assert(res7.data.error.includes('não coincidem') || res7.data.error.includes('não confere'), 'Mensagem informa divergência nas senhas');

  // -------------------------------------------------------------
  // TESTE 8: Validação de senha curta (< 6 caracteres)
  // -------------------------------------------------------------
  console.log('\n--- Teste 8: Rejeição de senha com menos de 6 caracteres ---');
  const res8 = await request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      resetAuthorizationToken: authorizationToken,
      newPassword: '123',
      confirmPassword: '123',
    }),
  });
  assert(res8.status === 400, 'Senha curta rejeitada com status 400');

  // -------------------------------------------------------------
  // TESTE 9: Validação de autorização forjada ou de outra conta
  // -------------------------------------------------------------
  console.log('\n--- Teste 9: Rejeição de autorização cruzada (outro e-mail) ---');
  const res9 = await request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: 'outro_usuario@fluxocaixa.com',
      resetAuthorizationToken: authorizationToken,
      newPassword: newPassword,
      confirmPassword: newPassword,
    }),
  });
  assert(res9.status === 401, 'Tentativa de aplicar autorização de uma conta em outra conta é rejeitada com 401');

  // -------------------------------------------------------------
  // TESTE 10 & 11: Criação de sessão prévia e Redefinição bem-sucedida da Senha
  // -------------------------------------------------------------
  console.log('\n--- Teste 10: Redefinição efetiva da senha no banco de dados ---');
  // Criar uma sessão ativa para verificar se ela será invalidada
  const testSession = await prisma.userSession.create({
    data: {
      userId: testUser.id,
      token: 'session_token_before_reset_' + Date.now(),
      isActive: true,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const res10 = await request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      resetAuthorizationToken: authorizationToken,
      newPassword: newPassword,
      confirmPassword: newPassword,
    }),
  });
  assert(res10.ok, 'Senha redefinida com sucesso (200 OK)');
  assert(res10.data.message.includes('Senha alterada com sucesso'), 'Mensagem de confirmação recebida');

  // VERIFICAÇÃO CRÍTICA NO BANCO DE DADOS:
  const userAfterReset = await prisma.user.findUnique({ where: { id: testUser.id } });
  assert(userAfterReset.resetToken === null, 'resetToken limpo no banco de dados');
  assert(userAfterReset.resetTokenExpiry === null, 'resetTokenExpiry limpo no banco de dados');
  assert(userAfterReset.lastPasswordChangeAt !== null, 'lastPasswordChangeAt registrado');

  // Verificar se o hash da senha mudou e confere com a nova senha
  const isOldPasswordMatch = await bcrypt.compare(originalPassword, userAfterReset.password);
  const isNewPasswordMatch = await bcrypt.compare(newPassword, userAfterReset.password);
  assert(!isOldPasswordMatch, 'Senha antiga NÃO confere mais com o hash armazenado no banco');
  assert(isNewPasswordMatch, 'Nova senha foi HASHEADA com bcrypt e PERSISTIDA com sucesso no banco de dados');

  // Verificar invalidação de sessões
  const sessionAfterReset = await prisma.userSession.findUnique({ where: { id: testSession.id } });
  assert(sessionAfterReset.isActive === false, 'Sessão ativa prévia foi INVALIDADA (isActive: false) no banco de dados');

  // -------------------------------------------------------------
  // TESTE 12: Tentativa de reutilizar a mesma autorização de redefinição (Single-Use)
  // -------------------------------------------------------------
  console.log('\n--- Teste 11: Replay attack - Reutilização de autorização já consumida ---');
  const res12 = await request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      resetAuthorizationToken: authorizationToken,
      newPassword: 'AnotherPassword@999',
      confirmPassword: 'AnotherPassword@999',
    }),
  });
  assert(res12.status === 401, 'Reutilização da mesma autorização rejeitada com status 401');

  // -------------------------------------------------------------
  // TESTE 13: Login com a NOVA senha
  // -------------------------------------------------------------
  console.log('\n--- Teste 12: Login com a nova senha ---');
  const res13 = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: newPassword,
    }),
  });
  assert(res13.ok, 'Login efetuado com sucesso utilizando a NOVA senha');
  assert(typeof res13.data.token === 'string', 'Token de sessão JWT emitido com sucesso');

  // -------------------------------------------------------------
  // TESTE 14: Login com a SENHA ANTIGA
  // -------------------------------------------------------------
  console.log('\n--- Teste 13: Tentativa de login com a senha ANTIGA ---');
  const res14 = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: testEmail,
      password: originalPassword,
    }),
  });
  assert(res14.status === 400, 'Login com a senha antiga rejeitado com status 400');
  assert(res14.data.error.includes('incorretos'), 'Mensagem de credenciais incorretas retornada');

  // -------------------------------------------------------------
  // TESTE 15: Normalização de Casing no E-mail (Ex: Maiúsculas no Login e Recuperação)
  // -------------------------------------------------------------
  console.log('\n--- Teste 14: Normalização de maiúsculas/minúsculas no e-mail ---');
  const upperEmail = 'QA_RECOVERY_USER@FLUXOCAIXA.COM';
  const res15 = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: upperEmail,
      password: newPassword,
    }),
  });
  assert(res15.ok, 'Login aceita e-mail digitado em letras maiúsculas');

  // -------------------------------------------------------------
  // TESTE 16: Verificação de Audit Log no Banco de Dados
  // -------------------------------------------------------------
  console.log('\n--- Teste 15: Rastreabilidade e Auditoria no Banco ---');
  const auditLogs = await prisma.auditLog.findMany({
    where: { targetUserId: testUser.id, action: 'REDEFINIU_SENHA' },
    orderBy: { createdAt: 'desc' },
  });
  assert(auditLogs.length > 0, 'Log de auditoria imutável REDEFINIU_SENHA registrado no banco de dados');
  assert(auditLogs[0].description.includes(testEmail), 'Log de auditoria descreve a redefinição pelo usuário com sucesso');

  // LIMPEZA FINAL
  await prisma.auditLog.deleteMany({ where: { targetUser: { email: testEmail } } });
  await prisma.userSession.deleteMany({ where: { user: { email: testEmail } } });
  await prisma.loginHistory.deleteMany({ where: { email: testEmail } });
  await prisma.user.deleteMany({ where: { email: testEmail } });

  console.log('\n================================================================');
  console.log(`🎉 TODOS OS ${passedTests}/${totalTests} TESTES DE QA PASSARAM COM 100% DE SUCESSO!`);
  console.log('================================================================');
}

runQATests()
  .catch(err => {
    console.error('\n💥 Erro durante execução dos testes:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
