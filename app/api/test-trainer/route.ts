import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcrypt";

const prisma = new PrismaClient();

// POST endpoint to create a test trainer for debugging
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, specialization } = body;
    
    // Validate required fields
    if (!name || !email || !specialization) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: "Email already in use" },
        { status: 400 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password || "password123", 10);
    
    // Create trainer user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: UserRole.TRAINER,
        trainerProfile: {
          create: {
            specialization,
            availability: true,
          },
        },
      },
      include: {
        trainerProfile: true,
      },
    });
    
    // Return response without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
    
  } catch (error) {
    console.error("Error creating test trainer:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the test trainer" },
      { status: 500 }
    );
  }
} 