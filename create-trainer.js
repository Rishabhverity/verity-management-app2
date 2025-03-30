const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  try {
    // Create a trainer user
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    const trainer = await prisma.user.upsert({
      where: { email: "trainer@example.com" },
      update: {},
      create: {
        name: "Test Trainer",
        email: "trainer@example.com",
        password: hashedPassword,
        role: "TRAINER",
      },
    });
    
    console.log({ trainer });
    console.log("Trainer created successfully");
  } catch (error) {
    console.error("Error creating trainer:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 