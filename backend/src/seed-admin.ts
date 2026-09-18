import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_CATEGORIES } from './utils/defaultCategories';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Verificando / Criando Usuário Administrador Master ---');

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@123456', salt);

  // 1. Ensure admin@fluxocaixa.com exists as SUPER_ADMIN
  let admin = await prisma.user.findUnique({
    where: { email: 'admin@fluxocaixa.com' },
  });

  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        password: passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ATIVO',
        blockedAt: null,
        blockedReason: null,
        failedLoginAttempts: 0,
        deletedAt: null,
      },
    });
  } else {
    const newAdmin = await prisma.user.create({
      data: {
        name: 'Administrador Master',
        email: 'admin@fluxocaixa.com',
        password: passwordHash,
        role: 'SUPER_ADMIN',
        status: 'ATIVO',
      },
    });

    await prisma.category.createMany({
      data: DEFAULT_CATEGORIES.map(cat => ({ ...cat, userId: newAdmin.id })),
    });

    admin = newAdmin;
  }


  // 2. Also promote cristian12.gordillo@hotmail.com to SUPER_ADMIN with same password if present
  const userCristian = await prisma.user.findUnique({
    where: { email: 'cristian12.gordillo@hotmail.com' },
  });

  if (userCristian) {
    await prisma.user.update({
      where: { id: userCristian.id },
      data: {
        role: 'SUPER_ADMIN',
        status: 'ATIVO',
        password: passwordHash,
        blockedAt: null,
        failedLoginAttempts: 0,
        deletedAt: null,
      },
    });
    console.log('Conta cristian12.gordillo@hotmail.com atualizada para SUPER_ADMIN!');
  }


  // Also list all users for reference
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  console.log('\n--- Usuários Cadastrados no Banco de Dados ---');
  console.log(JSON.stringify(allUsers, null, 2));

  console.log('\n=============================================');
  console.log('🔑 CREDENCIAIS DO GESTOR / MASTER:');
  console.log(`E-mail: ${admin.email}`);
  console.log(`Senha:  Admin@123456`);
  console.log('=============================================\n');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
