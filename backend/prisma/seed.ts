import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const defaultCoachEmployeeNumber = 'E0001';
  const existing = await prisma.user.findUnique({
    where: { employeeNumber: defaultCoachEmployeeNumber },
  });

  if (!existing) {
    const hashed = await bcrypt.hash('password123', 10);
    await prisma.user.create({
      data: {
        employeeNumber: defaultCoachEmployeeNumber,
        name: 'Demo Coach',
        email: 'coach@example.com',
        role: UserRole.coach,
        status: UserStatus.active,
        passwordHash: hashed,
      },
    });
    console.log('Seeded default coach (E0001 / password123)');
  } else {
    console.log('Seed skipped: default coach already exists.');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

