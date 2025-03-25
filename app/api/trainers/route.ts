import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET endpoint to fetch all trainers with their profile information
export async function GET(req: NextRequest) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    
    if (!session || !["OPERATIONS"].includes(session.user.role as string)) {
      return NextResponse.json(
        { message: "You do not have permission to access trainer data" },
        { status: 403 }
      );
    }
    
    // Fetch all users with TRAINER role and their trainer profiles
    const trainers = await prisma.user.findMany({
      where: {
        role: "TRAINER",
        trainerProfile: {
          isNot: null
        }
      },
      include: {
        trainerProfile: true
      }
    });
    
    // Map to a more friendly format and remove sensitive data
    const formattedTrainers = trainers.map(trainer => ({
      id: trainer.id,
      name: trainer.name,
      email: trainer.email,
      specialization: trainer.trainerProfile?.specialization || "",
      availability: trainer.trainerProfile?.availability || false,
      createdAt: trainer.createdAt
    }));
    
    return NextResponse.json(formattedTrainers);
    
  } catch (error) {
    console.error("Error fetching trainers:", error);
    return NextResponse.json(
      { message: "An error occurred while fetching trainers" },
      { status: 500 }
    );
  }
} 