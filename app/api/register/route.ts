import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

// Define validation schema for registration
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["TRAINER", "OPERATIONS", "ACCOUNTS", "TRAINEE"]),
  // Additional fields based on role
  specialization: z.string().optional(),
  department: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request data
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }
    
    const { name, email, password, role, specialization, department } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create base user
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
      });

      // Create role-specific profile
      switch (role) {
        case "TRAINER":
          if (!specialization) {
            throw new Error("Specialization is required for trainers");
          }
          await tx.trainer.create({
            data: {
              userId: newUser.id,
              specialization,
              availability: true,
            },
          });
          break;

        case "OPERATIONS":
          if (!department) {
            throw new Error("Department is required for operations staff");
          }
          await tx.operations.create({
            data: {
              userId: newUser.id,
              department,
            },
          });
          break;

        case "ACCOUNTS":
          if (!department) {
            throw new Error("Department is required for accounts staff");
          }
          await tx.accounts.create({
            data: {
              userId: newUser.id,
              department,
            },
          });
          break;

        case "TRAINEE":
          // No additional profile for trainees
          break;

        default:
          break;
      }

      return newUser;
    });

    // Return success response without sensitive data
    return NextResponse.json(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    
    return NextResponse.json(
      { error: "Failed to register user", message: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 