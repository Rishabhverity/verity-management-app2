import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await hash('password123', 10);

  // Create Operations User
  const operations = await prisma.user.upsert({
    where: { email: 'operations@example.com' },
    update: {},
    create: {
      email: 'operations@example.com',
      name: 'Operations Admin',
      password,
      role: UserRole.OPERATIONS,
      operationsProfile: {
        create: {
          department: 'Operations Department',
        },
      },
    },
  });

  // Create Accounts User
  const accounts = await prisma.user.upsert({
    where: { email: 'accounts@example.com' },
    update: {},
    create: {
      email: 'accounts@example.com',
      name: 'Accounts Manager',
      password,
      role: UserRole.ACCOUNTS,
      accountsProfile: {
        create: {
          department: 'Accounts Department',
        },
      },
    },
  });

  // Create Trainer Users
  const trainer1 = await prisma.user.upsert({
    where: { email: 'john.doe@example.com' },
    update: {},
    create: {
      email: 'john.doe@example.com',
      name: 'John Doe',
      password,
      role: UserRole.TRAINER,
      trainerProfile: {
        create: {
          specialization: 'Web Development',
          availability: true,
        },
      },
    },
  });

  const trainer2 = await prisma.user.upsert({
    where: { email: 'jane.smith@example.com' },
    update: {},
    create: {
      email: 'jane.smith@example.com',
      name: 'Jane Smith',
      password,
      role: UserRole.TRAINER,
      trainerProfile: {
        create: {
          specialization: 'Data Science',
          availability: true,
        },
      },
    },
  });

  // Create Trainee User
  const trainee = await prisma.user.upsert({
    where: { email: 'trainee@example.com' },
    update: {},
    create: {
      email: 'trainee@example.com',
      name: 'Test Trainee',
      password,
      role: UserRole.TRAINEE,
    },
  });

  console.log({ operations, accounts, trainer1, trainer2, trainee });
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