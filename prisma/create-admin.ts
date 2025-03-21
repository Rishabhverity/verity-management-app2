import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create admin user
    const hashedPassword = await hash('admin123', 10);
    
    // Create operations user
    const operationsUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'OPERATIONS',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create operations profile
    await prisma.operations.upsert({
      where: { userId: operationsUser.id },
      update: {},
      create: {
        userId: operationsUser.id,
        department: 'Operations',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('Admin user created successfully:');
    console.log(`Email: admin@example.com`);
    console.log(`Password: admin123`);
    console.log(`Role: OPERATIONS`);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 