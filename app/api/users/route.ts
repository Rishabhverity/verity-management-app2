import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcrypt";
import { PrismaClient, UserRole } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// Handle POST requests to create a new user
export async function POST(req: NextRequest) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "OPERATIONS") {
      return NextResponse.json(
        { message: "You do not have permission to create users" },
        { status: 403 }
      );
    }
    
    // Get request body
    const body = await req.json();
    const { name, email, password, role, specialization, department } = body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
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
    const hashedPassword = await hash(password, 10);
    
    // Create user based on role
    let newUser;
    
    switch (role) {
      case "TRAINER":
        if (!specialization) {
          return NextResponse.json(
            { message: "Specialization is required for trainers" },
            { status: 400 }
          );
        }
        
        newUser = await prisma.user.create({
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
        });
        break;
        
      case "OPERATIONS":
        if (!department) {
          return NextResponse.json(
            { message: "Department is required for operations users" },
            { status: 400 }
          );
        }
        
        newUser = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: UserRole.OPERATIONS,
            operationsProfile: {
              create: {
                department,
              },
            },
          },
        });
        break;
        
      case "ACCOUNTS":
        if (!department) {
          return NextResponse.json(
            { message: "Department is required for accounts users" },
            { status: 400 }
          );
        }
        
        newUser = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: UserRole.ACCOUNTS,
            accountsProfile: {
              create: {
                department,
              },
            },
          },
        });
        break;
        
      case "TRAINEE":
        newUser = await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: UserRole.TRAINEE,
          },
        });
        break;
        
      default:
        return NextResponse.json(
          { message: "Invalid user role" },
          { status: 400 }
        );
    }
    
    // Return response without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    return NextResponse.json(userWithoutPassword, { status: 201 });
    
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { message: "An error occurred while creating the user" },
      { status: 500 }
    );
  }
} 