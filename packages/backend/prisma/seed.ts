import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================
  // 1. Create permissions
  // ============================================================
  console.log('📋 Creating permissions...');
  const permissionsData = [
    // Companies
    { name: 'companies:read', description: 'View companies', module: 'companies', action: 'read' },
    { name: 'companies:create', description: 'Create companies', module: 'companies', action: 'create' },
    { name: 'companies:update', description: 'Update companies', module: 'companies', action: 'update' },
    { name: 'companies:delete', description: 'Delete companies', module: 'companies', action: 'delete' },
    { name: 'companies:manage', description: 'Full company management', module: 'companies', action: 'manage' },
    // Users
    { name: 'users:read', description: 'View users', module: 'users', action: 'read' },
    { name: 'users:create', description: 'Create users', module: 'users', action: 'create' },
    { name: 'users:update', description: 'Update users', module: 'users', action: 'update' },
    { name: 'users:delete', description: 'Delete users', module: 'users', action: 'delete' },
    // Persons
    { name: 'persons:read', description: 'View persons', module: 'persons', action: 'read' },
    { name: 'persons:create', description: 'Create persons', module: 'persons', action: 'create' },
    { name: 'persons:update', description: 'Update persons', module: 'persons', action: 'update' },
    { name: 'persons:delete', description: 'Delete persons', module: 'persons', action: 'delete' },
    { name: 'persons:approve', description: 'Approve person registrations', module: 'persons', action: 'approve' },
    // Profiles
    { name: 'profiles:read', description: 'View profiles', module: 'profiles', action: 'read' },
    { name: 'profiles:create', description: 'Create profiles', module: 'profiles', action: 'create' },
    { name: 'profiles:update', description: 'Update profiles', module: 'profiles', action: 'update' },
    { name: 'profiles:delete', description: 'Delete profiles', module: 'profiles', action: 'delete' },
    // Regions & Leadership
    { name: 'regions:read', description: 'View regions', module: 'regions', action: 'read' },
    { name: 'regions:create', description: 'Create regions', module: 'regions', action: 'create' },
    { name: 'regions:update', description: 'Update regions', module: 'regions', action: 'update' },
    { name: 'regions:delete', description: 'Delete regions', module: 'regions', action: 'delete' },
    { name: 'leadership:read', description: 'View leadership', module: 'leadership', action: 'read' },
    { name: 'leadership:create', description: 'Create leadership', module: 'leadership', action: 'create' },
    { name: 'leadership:update', description: 'Update leadership', module: 'leadership', action: 'update' },
    { name: 'leadership:delete', description: 'Delete leadership', module: 'leadership', action: 'delete' },
    // Missions
    { name: 'missions:read', description: 'View missions', module: 'missions', action: 'read' },
    { name: 'missions:create', description: 'Create missions', module: 'missions', action: 'create' },
    { name: 'missions:update', description: 'Update missions', module: 'missions', action: 'update' },
    { name: 'missions:delete', description: 'Delete missions', module: 'missions', action: 'delete' },
    { name: 'missions:validate', description: 'Validate missions', module: 'missions', action: 'validate' },
    // Salary
    { name: 'salary:read', description: 'View salary info', module: 'salary', action: 'read' },
    { name: 'salary:manage', description: 'Manage salary parameters', module: 'salary', action: 'manage' },
    // Parameters
    { name: 'parameters:read', description: 'View parameters', module: 'parameters', action: 'read' },
    { name: 'parameters:update', description: 'Update parameters', module: 'parameters', action: 'update' },
    // Instagram
    { name: 'instagram:read', description: 'View instagram data', module: 'instagram', action: 'read' },
    { name: 'instagram:manage', description: 'Manage instagram integration', module: 'instagram', action: 'manage' },
    // Reports
    { name: 'reports:read', description: 'View reports', module: 'reports', action: 'read' },
    { name: 'reports:export', description: 'Export reports', module: 'reports', action: 'export' },
  ];

  const permissions = await Promise.all(
    permissionsData.map((p) =>
      prisma.permission.upsert({
        where: { name: p.name },
        update: p,
        create: p,
      }),
    ),
  );
  console.log(`✅ ${permissions.length} permissions created`);

  // ============================================================
  // 2. Create Admin Company
  // ============================================================
  console.log('🏢 Creating admin company...');
  const adminCompany = await prisma.company.upsert({
    where: { cnpj: '00.000.000/0001-00' },
    update: {},
    create: {
      name: 'ServcCand Admin',
      cnpj: '00.000.000/0001-00',
      email: 'admin@servcand.com',
      phone: '(00) 0000-0000',
      isAdmin: true,
      isActive: true,
    },
  });
  console.log(`✅ Admin company created: ${adminCompany.name}`);

  // ============================================================
  // 3. Create Super Admin Profile
  // ============================================================
  console.log('👤 Creating super admin profile...');
  const superAdminProfile = await prisma.profile.upsert({
    where: { companyId_name: { companyId: adminCompany.id, name: 'SUPER_ADMIN' } },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Super Administrador - Acesso total ao sistema',
      companyId: adminCompany.id,
      isSystem: true,
    },
  });

  // Grant all permissions to super admin
  const allPermissionIds = permissions.map((p) => p.id);
  for (const permissionId of allPermissionIds) {
    await prisma.profilePermission.upsert({
      where: { profileId_permissionId: { profileId: superAdminProfile.id, permissionId } },
      update: {},
      create: { profileId: superAdminProfile.id, permissionId },
    });
  }
  console.log(`✅ Super admin profile created with ${allPermissionIds.length} permissions`);

  // ============================================================
  // 4. Create Company Admin Profile (for regular companies)
  // ============================================================
  const companyAdminProfile = await prisma.profile.upsert({
    where: { companyId_name: { companyId: adminCompany.id, name: 'COMPANY_ADMIN' } },
    update: {},
    create: {
      name: 'COMPANY_ADMIN',
      description: 'Administrador da Empresa',
      companyId: adminCompany.id,
      isSystem: true,
    },
  });

  const companyAdminPermissions = permissions
    .filter((p) => !['companies:delete', 'companies:manage'].includes(p.name))
    .map((p) => p.id);

  for (const permissionId of companyAdminPermissions) {
    await prisma.profilePermission.upsert({
      where: { profileId_permissionId: { profileId: companyAdminProfile.id, permissionId } },
      update: {},
      create: { profileId: companyAdminProfile.id, permissionId },
    });
  }

  // ============================================================
  // 5. Create Leader Profile
  // ============================================================
  const leaderProfile = await prisma.profile.upsert({
    where: { companyId_name: { companyId: adminCompany.id, name: 'LEADER' } },
    update: {},
    create: {
      name: 'LEADER',
      description: 'Liderança Regional',
      companyId: adminCompany.id,
      isSystem: true,
    },
  });

  const leaderPermissions = permissions
    .filter((p) =>
      ['persons:read', 'persons:create', 'persons:update', 'persons:approve',
       'regions:read', 'leadership:read',
       'missions:read', 'missions:validate',
       'salary:read', 'instagram:read', 'reports:read'].includes(p.name),
    )
    .map((p) => p.id);

  for (const permissionId of leaderPermissions) {
    await prisma.profilePermission.upsert({
      where: { profileId_permissionId: { profileId: leaderProfile.id, permissionId } },
      update: {},
      create: { profileId: leaderProfile.id, permissionId },
    });
  }

  // ============================================================
  // 6. Create Employee Profile
  // ============================================================
  const employeeProfile = await prisma.profile.upsert({
    where: { companyId_name: { companyId: adminCompany.id, name: 'EMPLOYEE' } },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Funcionário',
      companyId: adminCompany.id,
      isSystem: true,
    },
  });

  const employeePermissions = permissions
    .filter((p) =>
      ['missions:read', 'salary:read', 'instagram:read'].includes(p.name),
    )
    .map((p) => p.id);

  for (const permissionId of employeePermissions) {
    await prisma.profilePermission.upsert({
      where: { profileId_permissionId: { profileId: employeeProfile.id, permissionId } },
      update: {},
      create: { profileId: employeeProfile.id, permissionId },
    });
  }
  console.log('✅ All profiles created (SUPER_ADMIN, COMPANY_ADMIN, LEADER, EMPLOYEE)');

  // ============================================================
  // 7. Create Super Admin User
  // ============================================================
  console.log('👤 Creating super admin user...');
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@servcand.com' },
    update: {},
    create: {
      email: 'admin@servcand.com',
      password: hashedPassword,
      companyId: adminCompany.id,
      profileId: superAdminProfile.id,
      isActive: true,
    },
  });
  console.log(`✅ Admin user created: ${adminUser.email}`);

  // ============================================================
  // 8. Create default salary parameters for admin company
  // ============================================================
  await prisma.salaryParameter.upsert({
    where: { companyId: adminCompany.id },
    update: {},
    create: {
      companyId: adminCompany.id,
      monthlyBaseSalary: 1000.00,
      weeklyAmount: 250.00,
      weeksPerMonth: 4,
      levelBonusPercentage: 10.00,
      missionPointsToLevel: 100,
      missionsRequiredPerWeek: 3,
    },
  });

  // ============================================================
  // 9. Create default missions for admin company
  // ============================================================
  const defaultMissions = [
    {
      name: 'Publicar Foto',
      description: 'Publique uma foto no Instagram da empresa',
      type: 'POST_PHOTO',
      points: 25,
      isRequired: true,
      rewardValue: 50.00,
    },
    {
      name: 'Marcar a Empresa',
      description: 'Marque o perfil da empresa na publicação',
      type: 'TAG_COMPANY',
      points: 25,
      isRequired: true,
      rewardValue: 50.00,
    },
    {
      name: 'Comentar na Publicação',
      description: 'Faça um comentário na publicação da empresa',
      type: 'COMMENT_POST',
      points: 25,
      isRequired: true,
      rewardValue: 50.00,
    },
    {
      name: 'Compartilhar Publicação',
      description: 'Compartilhe a publicação da empresa',
      type: 'SHARE_POST',
      points: 25,
      isRequired: false,
      rewardValue: 50.00,
    },
  ];

  for (const mission of defaultMissions) {
    const existing = await prisma.mission.findFirst({
      where: { companyId: adminCompany.id, type: mission.type as any },
    });
    if (!existing) {
      await prisma.mission.create({
        data: {
          companyId: adminCompany.id,
          ...mission,
          type: mission.type as any,
        },
      });
    }
  }
  console.log('✅ Default missions created');

  // ============================================================
  // 10. Create a sample regular company
  // ============================================================
  const sampleCompany = await prisma.company.upsert({
    where: { cnpj: '11.111.111/0001-11' },
    update: {},
    create: {
      name: 'Empresa Exemplo',
      cnpj: '11.111.111/0001-11',
      email: 'contato@empresaexemplo.com',
      phone: '(11) 1111-1111',
      isAdmin: false,
      isActive: true,
    },
  });

  // Create profiles for sample company
  const sampleCompanyAdmin = await prisma.profile.upsert({
    where: { companyId_name: { companyId: sampleCompany.id, name: 'COMPANY_ADMIN' } },
    update: {},
    create: {
      name: 'COMPANY_ADMIN',
      description: 'Administrador da Empresa Exemplo',
      companyId: sampleCompany.id,
      isSystem: true,
    },
  });

  for (const permissionId of companyAdminPermissions) {
    await prisma.profilePermission.upsert({
      where: { profileId_permissionId: { profileId: sampleCompanyAdmin.id, permissionId } },
      update: {},
      create: { profileId: sampleCompanyAdmin.id, permissionId },
    });
  }

  const sampleLeaderProfile = await prisma.profile.upsert({
    where: { companyId_name: { companyId: sampleCompany.id, name: 'LEADER' } },
    update: {},
    create: {
      name: 'LEADER',
      description: 'Liderança Regional',
      companyId: sampleCompany.id,
      isSystem: true,
    },
  });

  for (const permissionId of leaderPermissions) {
    await prisma.profilePermission.upsert({
      where: { profileId_permissionId: { profileId: sampleLeaderProfile.id, permissionId } },
      update: {},
      create: { profileId: sampleLeaderProfile.id, permissionId },
    });
  }

  const sampleEmployeeProfile = await prisma.profile.upsert({
    where: { companyId_name: { companyId: sampleCompany.id, name: 'EMPLOYEE' } },
    update: {},
    create: {
      name: 'EMPLOYEE',
      description: 'Funcionário',
      companyId: sampleCompany.id,
      isSystem: true,
    },
  });

  for (const permissionId of employeePermissions) {
    await prisma.profilePermission.upsert({
      where: { profileId_permissionId: { profileId: sampleEmployeeProfile.id, permissionId } },
      update: {},
      create: { profileId: sampleEmployeeProfile.id, permissionId },
    });
  }

  // Create user for sample company
  const sampleUserPassword = await bcrypt.hash('Empresa@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@empresaexemplo.com' },
    update: {},
    create: {
      email: 'admin@empresaexemplo.com',
      password: sampleUserPassword,
      companyId: sampleCompany.id,
      profileId: sampleCompanyAdmin.id,
      isActive: true,
    },
  });

  // Create salary parameters for sample company
  await prisma.salaryParameter.upsert({
    where: { companyId: sampleCompany.id },
    update: {},
    create: {
      companyId: sampleCompany.id,
      monthlyBaseSalary: 1000.00,
      weeklyAmount: 250.00,
      weeksPerMonth: 4,
      levelBonusPercentage: 10.00,
      missionPointsToLevel: 100,
      missionsRequiredPerWeek: 3,
    },
  });

  // Create sample regions
  const regions = ['Centro', 'Norte', 'Sul', 'Leste', 'Oeste'];
  for (const regionName of regions) {
    await prisma.region.upsert({
      where: { companyId_name: { companyId: sampleCompany.id, name: regionName } },
      update: {},
      create: {
        name: regionName,
        description: `Região ${regionName}`,
        companyId: sampleCompany.id,
      },
    });
  }

  // Create default missions for sample company
  for (const mission of defaultMissions) {
    const existing = await prisma.mission.findFirst({
      where: { companyId: sampleCompany.id, type: mission.type as any },
    });
    if (!existing) {
      await prisma.mission.create({
        data: {
          companyId: sampleCompany.id,
          ...mission,
          type: mission.type as any,
        },
      });
    }
  }

  // Create employee person Luis Lara
  const sampleRegion = await prisma.region.findFirst({
    where: { companyId: sampleCompany.id, name: 'Centro' },
  });


  const luisPerson = await prisma.person.upsert({
    where: { cpf: '05479486110' },
    update: {
      companyId: sampleCompany.id,
      regionId: sampleRegion?.id,
      firstName: 'Luis',
      lastName: 'Lara',
      phone: '65993362396',
      status: 'ACTIVE',
      instagramUsername: 'luizinlara',
      activatedAt: new Date(),
    },
    create: {
      companyId: sampleCompany.id,
      regionId: sampleRegion?.id,
      firstName: 'Luis',
      lastName: 'Lara',
      phone: '65993362396',
      cpf: '05479486110',
      status: 'ACTIVE',
      registrationType: 'INTERNAL',
      instagramUsername: 'luizinlara',
      activatedAt: new Date(),
    },
  });

  const employeePassword = await bcrypt.hash('Luis@123', 12);
  await prisma.user.upsert({
    where: { email: 'luis@servcand.com.br' },
    update: {
      companyId: sampleCompany.id,
      profileId: sampleEmployeeProfile!.id,
      personId: luisPerson.id,
      isActive: true,
    },
    create: {
      email: 'luis@servcand.com.br',
      password: employeePassword,
      companyId: sampleCompany.id,
      profileId: sampleEmployeeProfile!.id,
      personId: luisPerson.id,
      isActive: true,
    },
  });

  // Calculate current week number
  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };
  const now = new Date();
  const weekNum = getWeekNumber(now);
  const yr = now.getFullYear();

  // Create sample weekly payments for Luis Lara to populate history
  const prevWeek = weekNum - 1 === 0 ? 52 : weekNum - 1;
  const prevYear = weekNum - 1 === 0 ? yr - 1 : yr;

  await prisma.weeklyPayment.upsert({
    where: {
      personId_weekNumber_year: {
        personId: luisPerson.id,
        weekNumber: prevWeek,
        year: prevYear,
      },
    },
    update: {},
    create: {
      personId: luisPerson.id,
      weekNumber: prevWeek,
      year: prevYear,
      missionsCompleted: 3,
      amount: 150.00,
      bonus: 0.00,
      total: 150.00,
      status: 'PAID',
      paidAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.weeklyPayment.upsert({
    where: {
      personId_weekNumber_year: {
        personId: luisPerson.id,
        weekNumber: weekNum,
        year: yr,
      },
    },
    update: {},
    create: {
      personId: luisPerson.id,
      weekNumber: weekNum,
      year: yr,
      missionsCompleted: 2,
      amount: 100.00,
      bonus: 0.00,
      total: 100.00,
      status: 'APPROVED',
    },
  });

  // Complete some sample missions for Luis Lara for current week
  const sampleMissions = await prisma.mission.findMany({
    where: { companyId: sampleCompany.id },
  });

  if (sampleMissions.length >= 3) {
    // Mission 1: COMPLETED
    await prisma.personMission.upsert({
      where: {
        personId_missionId_weekNumber_year: {
          personId: luisPerson.id,
          missionId: sampleMissions[0].id,
          weekNumber: weekNum,
          year: yr,
        },
      },
      update: {},
      create: {
        personId: luisPerson.id,
        missionId: sampleMissions[0].id,
        weekNumber: weekNum,
        year: yr,
        status: 'COMPLETED',
        completedAt: now,
        points: sampleMissions[0].points,
      },
    });

    // Mission 2: COMPLETED
    await prisma.personMission.upsert({
      where: {
        personId_missionId_weekNumber_year: {
          personId: luisPerson.id,
          missionId: sampleMissions[1].id,
          weekNumber: weekNum,
          year: yr,
        },
      },
      update: {},
      create: {
        personId: luisPerson.id,
        missionId: sampleMissions[1].id,
        weekNumber: weekNum,
        year: yr,
        status: 'COMPLETED',
        completedAt: now,
        points: sampleMissions[1].points,
      },
    });

    // Mission 3: PENDING
    await prisma.personMission.upsert({
      where: {
        personId_missionId_weekNumber_year: {
          personId: luisPerson.id,
          missionId: sampleMissions[2].id,
          weekNumber: weekNum,
          year: yr,
        },
      },
      update: {},
      create: {
        personId: luisPerson.id,
        missionId: sampleMissions[2].id,
        weekNumber: weekNum,
        year: yr,
        status: 'PENDING',
        points: 0,
      },
    });

    // Update person points
    const pointsSum = sampleMissions[0].points + sampleMissions[1].points;
    await prisma.person.update({
      where: { id: luisPerson.id },
      data: { totalPoints: pointsSum },
    });
  }

  console.log(`... Sample company created: ${sampleCompany.name}`);
  console.log(`✅ Employee user created: luis@servcand.com.br / Luis@123`);

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('📝 Login credentials:');
  console.log('   Super Admin: admin@servcand.com / Admin@123');
  console.log('   Company Admin: admin@empresaexemplo.com / Empresa@123');
  console.log('   Employee: luis@servcand.com.br / Luis@123');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
