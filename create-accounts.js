const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('accounts123', 10);

    // Create the accounts user (or update if exists)
    const accounts = await prisma.user.upsert({
      where: { email: 'accounts@example.com' },
      update: {
        password: hashedPassword
      },
      create: {
        name: 'Accounts User',
        email: 'accounts@example.com',
        password: hashedPassword,
        role: 'ACCOUNTS'
      }
    });

    console.log('Accounts user created/updated successfully:');
    console.log({
      id: accounts.id,
      name: accounts.name,
      email: accounts.email,
      role: accounts.role
    });
  } catch (error) {
    console.error('Error creating accounts user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 