const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // Create a standard password for all users
    const password = await bcrypt.hash('password123', 10);

    // Create a Trainer user
    const trainer = await prisma.user.upsert({
      where: { email: 'trainer@example.com' },
      update: {},
      create: {
        email: 'trainer@example.com',
        name: 'John Smith',
        password,
        role: UserRole.TRAINER,
        trainerProfile: {
          create: {
            specialization: 'Software Development',
            availability: true,
          },
        },
      },
    });

    console.log('Trainer user created:', {
      id: trainer.id,
      name: trainer.name,
      email: trainer.email,
      role: trainer.role
    });

    // Create an Accounts user
    const accounts = await prisma.user.upsert({
      where: { email: 'accounts@example.com' },
      update: {},
      create: {
        email: 'accounts@example.com',
        name: 'Sarah Johnson',
        password,
        role: UserRole.ACCOUNTS,
        accountsProfile: {
          create: {
            department: 'Finance Department',
          },
        },
      },
    });

    console.log('Accounts user created:', {
      id: accounts.id,
      name: accounts.name,
      email: accounts.email,
      role: accounts.role
    });

    console.log('\nLogin credentials for all created users:');
    console.log('Password: password123');

  } catch (error) {
    console.error('Error creating users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 