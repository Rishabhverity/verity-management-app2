const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash("trainer123", 10);

    // Create the trainer user (or update if exists)
    const trainer = await prisma.user.upsert({
      where: { email: "trainer@example.com" },
      update: {
        password: hashedPassword
      },
      create: {
        id: "trainer-demo", // Use the ID that matches our demo trainer ID
        name: "Demo Trainer",
        email: "trainer@example.com",
        password: hashedPassword,
        role: "TRAINER"
      }
    });

    console.log("Trainer user created/updated successfully:");
    console.log({
      id: trainer.id,
      name: trainer.name,
      email: trainer.email,
      role: trainer.role
    });
  } catch (error) {
    console.error("Error creating trainer user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 