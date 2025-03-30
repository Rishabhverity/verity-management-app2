const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    // Find the admin user
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });

    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }

    // Update the role to ADMIN
    const updatedUser = await prisma.user.update({
      where: { email: 'admin@example.com' },
      data: {
        role: 'ADMIN',
        updatedAt: new Date(),
      },
    });

    console.log('Admin user role updated successfully:');
    console.log(`Email: ${updatedUser.email}`);
    console.log(`Previous role: OPERATIONS`);
    console.log(`New role: ${updatedUser.role}`);
    
  } catch (error) {
    console.error('Error updating admin user role:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 