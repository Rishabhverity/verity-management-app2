const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create the admin user (or update if exists)
    const admin = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        password: hashedPassword
      },
      create: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log('Admin user created/updated successfully:');
    console.log({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 