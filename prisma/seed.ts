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
    { key: 'audit.view', description: 'Visualizar logs de auditoria' },
    { key: 'audit.export', description: 'Exportar logs de auditoria para Excel' },
    { key: 'workload.manage', description: 'Gerenciar jornadas de trabalho dos colaboradores' },
    { key: 'bank_hours.view', description: 'Visualizar saldo e histórico do banco de horas' },
    { key: 'bank_hours.manage', description: 'Gerenciar lançamentos e ajustes no banco de horas' },
    { key: 'overtime.view', description: 'Visualizar relatórios de horas extras' },
    { key: 'overtime.manage', description: 'Gerenciar e aprovar pagamento de horas extras' },
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
  const colaboradorPermKeys = ['clock.register', 'clock.view', 'bank_hours.view'];
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

  const passwordHash = await bcrypt.hash('admin123', 10);
  const adminUser = await prisma.user.upsert({
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

  const adminSchedule = await prisma.workSchedule.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      weeklyHours: 40,
      expectedDailyHours: 8,
      mondayEnabled: true,
      tuesdayEnabled: true,
      wednesdayEnabled: true,
      thursdayEnabled: true,
      fridayEnabled: true,
      saturdayEnabled: false,
      sundayEnabled: false,
      extraHoursMode: 'BANK_HOURS',
      startTime: '08:00',
      endTime: '17:00',
      expectedDailyMinutes: 480,
      weeklyMinutes: 2400,
      timezone: 'America/Sao_Paulo',
      flexibleSchedule: false,
    },
  });

  // Seed per-day schedules
  console.log('Seeding WorkScheduleDays...');
  for (let day = 0; day < 7; day++) {
    const isWorking = day >= 1 && day <= 5;
    await prisma.workScheduleDay.upsert({
      where: {
        workScheduleId_dayOfWeek: {
          workScheduleId: adminSchedule.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        workScheduleId: adminSchedule.id,
        dayOfWeek: day,
        enabled: isWorking,
        startTime: isWorking ? '08:00' : null,
        endTime: isWorking ? '17:00' : null,
        expectedDailyMinutes: isWorking ? 480 : 0,
      },
    });
  }

  // Seed breaks for Mon-Fri
  console.log('Seeding WorkScheduleBreaks...');
  const existingBreaks = await prisma.workScheduleBreak.findMany({
    where: { workScheduleId: adminSchedule.id },
  });
  if (existingBreaks.length === 0) {
    for (let day = 1; day <= 5; day++) {
      await prisma.workScheduleBreak.create({
        data: {
          workScheduleId: adminSchedule.id,
          dayOfWeek: day,
          name: 'Almoço',
          startTime: '12:00',
          endTime: '13:00',
          paid: false,
        },
      });
    }
  }

  await prisma.bankHoursBalance.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      currentBalanceMinutes: 0,
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
