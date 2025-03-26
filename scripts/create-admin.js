const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    const hashedPassword = await hash('admin123', 10);
    
    // First, try to delete any existing admin user
    await prisma.user.deleteMany({
      where: { email: 'admin@example.com' }
    });
    
    // Create operations user with OPERATIONS role
    const operationsUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'OPERATIONS',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Create operations profile
    await prisma.operations.create({
      data: {
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