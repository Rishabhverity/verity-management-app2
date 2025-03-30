const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('operations123', 10);

    // Create the operations user (or update if exists)
    const operations = await prisma.user.upsert({
      where: { email: 'operations@example.com' },
      update: {
        password: hashedPassword
      },
      create: {
        name: 'Operations User',
        email: 'operations@example.com',
        password: hashedPassword,
        role: 'OPERATIONS'
      }
    });

    console.log('Operations user created/updated successfully:');
    console.log({
      id: operations.id,
      name: operations.name,
      email: operations.email,
      role: operations.role
    });
  } catch (error) {
    console.error('Error creating operations user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 