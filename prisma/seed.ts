import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({
  adapter
});

async function main() {
  const permissionsList = [
    { key: 'admin', description: 'Permissão total no sistema' },
    { key: 'users.view', description: 'Visualizar usuários' },
    { key: 'users.create', description: 'Criar usuários' },
    { key: 'users.update', description: 'Editar usuários' },
    { key: 'users.delete', description: 'Desativar usuários' },
    { key: 'roles.view', description: 'Visualizar cargos' },
    { key: 'roles.create', description: 'Criar cargos' },
    { key: 'roles.update', description: 'Editar cargos' },
    { key: 'roles.delete', description: 'Excluir cargos' },
    { key: 'permissions.view', description: 'Visualizar permissões' },
    { key: 'clock.register', description: 'Registrar ponto' },
    { key: 'clock.view', description: 'Visualizar registros de ponto' },
    { key: 'reports.view', description: 'Visualizar relatórios' },
    { key: 'settings.manage', description: 'Gerenciar configurações' },
    { key: 'users.export', description: 'Exportar colaboradores para Excel' },
    { key: 'reports.export', description: 'Exportar relatórios para Excel' },
    { key: 'clock.export', description: 'Exportar registros de ponto para Excel' },
    { key: 'clock.edit', description: 'Editar registros de ponto' },
  ];

  console.log('Seeding permissions...');
  const createdPermissions = [];
  for (const perm of permissionsList) {
    const dbPerm = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { description: perm.description },
      create: { key: perm.key, description: perm.description },
    });
    createdPermissions.push(dbPerm);
  }

  console.log('Seeding Administrador Role...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrador' },
    update: {
      permissions: {
        set: createdPermissions.map((p) => ({ id: p.id })),
      },
    },
    create: {
      name: 'Administrador',
      description: 'Cargo com acesso total ao sistema',
      permissions: {
        connect: createdPermissions.map((p) => ({ id: p.id })),
      },
    },
  });

  console.log('Seeding Colaborador Role...');
  const colaboradorPermKeys = ['clock.register', 'clock.view'];
  const colaboradorPerms = createdPermissions.filter((p) => colaboradorPermKeys.includes(p.key));
  await prisma.role.upsert({
    where: { name: 'Colaborador' },
    update: {},
    create: {
      name: 'Colaborador',
      description: 'Cargo padrão para colaboradores registrarem ponto',
      permissions: {
        connect: colaboradorPerms.map((p) => ({ id: p.id })),
      },
    },
  });

  console.log('Seeding Admin User...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'sy@sypos.com.br' },
    update: {
      roleId: adminRole.id,
      passwordHash,
      active: true,
    },
    create: {
      name: 'Sy',
      email: 'sy@sypos.com.br',
      passwordHash,
      active: true,
      roleId: adminRole.id,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
