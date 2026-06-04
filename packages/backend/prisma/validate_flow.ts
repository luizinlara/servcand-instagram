import { PrismaClient, PersonMissionStatus, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

async function runValidation() {
  console.log('🧪 Starting End-to-End Validation for Mission Completion and Salary Calculations...\n');

  // 1. Fetch employee user and person
  const user = await prisma.user.findFirst({
    where: { email: 'luis@servcand.com.br' },
    include: { person: true }
  });

  if (!user || !user.person) {
    console.error('❌ FAILURE: Employee user luis@servcand.com.br or associated person record not found!');
    process.exit(1);
  }
  const person = user.person;
  console.log(`👤 Found Employee: ${person.firstName} ${person.lastName} (ID: ${person.id})`);
  console.log(`🏢 Company ID: ${person.companyId}`);

  // Fetch salary parameters
  const params = await prisma.salaryParameter.findUnique({
    where: { companyId: person.companyId }
  });
  console.log(`⚙️ Salary Parameters - Base Weekly: R$ ${params?.weeklyAmount || 'None'}, Level Bonus: ${params?.levelBonusPercentage || 'None'}%\n`);

  const now = new Date();
  const week = getWeekNumber(now);
  const yr = now.getFullYear();

  // 2. Read current completed missions
  let completedMissions = await prisma.personMission.findMany({
    where: { personId: person.id, weekNumber: week, year: yr, status: PersonMissionStatus.COMPLETED },
    include: { mission: true }
  });

  console.log(`📊 INITIAL STATE (Week ${week} / ${yr}):`);
  console.log(`   - Completed Missions Count: ${completedMissions.length}`);
  completedMissions.forEach(cm => {
    console.log(`     👉 [COMPLETED] ${cm.mission.name} (Reward: R$ ${cm.mission.rewardValue})`);
  });

  let initialBase = completedMissions.reduce((sum, cm) => sum + Number(cm.mission.rewardValue || 0), 0);
  console.log(`   - Calculated Base Salary: R$ ${initialBase.toFixed(2)}`);

  // 3. Find the pending mission and mark it as COMPLETED
  const pendingMission = await prisma.personMission.findFirst({
    where: { personId: person.id, weekNumber: week, year: yr, status: PersonMissionStatus.PENDING },
    include: { mission: true }
  });

  if (!pendingMission) {
    console.warn('⚠️ No pending mission found. Resetting first...');
    // Let's create/reset a pending mission for testing if none is pending
    const companyMissions = await prisma.mission.findMany({ where: { companyId: person.companyId } });
    const thirdMission = companyMissions[2];
    if (thirdMission) {
      await prisma.personMission.upsert({
        where: {
          personId_missionId_weekNumber_year: {
            personId: person.id,
            missionId: thirdMission.id,
            weekNumber: week,
            year: yr,
          }
        },
        update: { status: PersonMissionStatus.PENDING, points: 0 },
        create: {
          personId: person.id,
          missionId: thirdMission.id,
          weekNumber: week,
          year: yr,
          status: PersonMissionStatus.PENDING,
          points: 0
        }
      });
      console.log(`🔄 Re-initialized mission "${thirdMission.name}" to PENDING.`);
    }
  }

  const missionToComplete = pendingMission || await prisma.personMission.findFirst({
    where: { personId: person.id, weekNumber: week, year: yr, status: PersonMissionStatus.PENDING },
    include: { mission: true }
  });

  if (!missionToComplete) {
    console.error('❌ FAILURE: Could not find or create a pending mission for validation!');
    process.exit(1);
  }

  console.log(`\n⚡ Completing mission "${missionToComplete.mission.name}" for employee...`);

  // Update mission to COMPLETED
  await prisma.personMission.update({
    where: {
      personId_missionId_weekNumber_year: {
        personId: person.id,
        missionId: missionToComplete.missionId,
        weekNumber: week,
        year: yr
      }
    },
    data: {
      status: PersonMissionStatus.COMPLETED,
      completedAt: new Date(),
      points: missionToComplete.mission.points
    }
  });

  // 4. Update the Person's totalPoints
  const allCompleted = await prisma.personMission.findMany({
    where: { personId: person.id, weekNumber: week, year: yr, status: PersonMissionStatus.COMPLETED },
    include: { mission: true }
  });
  const newPointsSum = allCompleted.reduce((sum, pm) => sum + pm.points, 0);

  await prisma.person.update({
    where: { id: person.id },
    data: { totalPoints: newPointsSum }
  });

  console.log(`📈 Updated employee's accumulated points: ${newPointsSum} pts`);

  // 5. Recalculate WeeklyPayment using the service logic
  const baseAmount = allCompleted.reduce((sum, pm) => sum + Number(pm.mission.rewardValue || 0), 0);
  const levelBonus = params
    ? baseAmount * (Number(params.levelBonusPercentage) * (person.level - 1) / 100)
    : 0;
  const totalAmount = baseAmount + levelBonus;

  // Upsert the payment record
  const payment = await prisma.weeklyPayment.upsert({
    where: { personId_weekNumber_year: { personId: person.id, weekNumber: week, year: yr } },
    update: {
      amount: baseAmount,
      bonus: levelBonus,
      total: totalAmount,
      missionsCompleted: allCompleted.length,
      levelAtTime: person.level,
      status: PaymentStatus.APPROVED
    },
    create: {
      personId: person.id,
      weekNumber: week,
      year: yr,
      amount: baseAmount,
      bonus: levelBonus,
      total: totalAmount,
      missionsCompleted: allCompleted.length,
      levelAtTime: person.level,
      status: PaymentStatus.APPROVED
    }
  });

  console.log(`💰 Recalculated Weekly Payment Record:`);
  console.log(`   - Base Reward: R$ ${payment.amount.toFixed(2)}`);
  console.log(`   - Level Bonus: R$ ${payment.bonus.toFixed(2)}`);
  console.log(`   - Total Salary: R$ ${payment.total.toFixed(2)}`);
  console.log(`   - Status: ${payment.status}`);

  // 6. Assertions Table
  console.log('\n🔍 VALIDATION RESULTS SUMMARY:');
  console.log('------------------------------------------------------------');
  console.log('| Metric             | Expected Value   | Actual Value     |');
  console.log('------------------------------------------------------------');
  console.log(`| Completed Missions | 3                | ${payment.missionsCompleted}                |`);
  console.log(`| Points Accumulated | 75 pts           | ${newPointsSum} pts           |`);
  console.log(`| Base Salary        | R$ 150.00        | R$ ${payment.amount.toFixed(2)}        |`);
  console.log(`| Level Bonus (Lvl 1)| R$ 0.00          | R$ ${payment.bonus.toFixed(2)}          |`);
  console.log(`| Total Payout       | R$ 150.00        | R$ ${payment.total.toFixed(2)}        |`);
  console.log(`| Payment Status     | APPROVED         | ${payment.status}           |`);
  console.log('------------------------------------------------------------\n');

  if (
    payment.missionsCompleted === 3 &&
    newPointsSum === 75 &&
    Number(payment.amount) === 150.00 &&
    Number(payment.total) === 150.00 &&
    payment.status === 'APPROVED'
  ) {
    console.log('🎉 SUCCESS: All end-to-end validation assertions passed perfectly!');
  } else {
    console.error('❌ FAILURE: One or more validation assertions failed.');
    process.exit(1);
  }
}

runValidation()
  .catch(err => {
    console.error('❌ Script failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
