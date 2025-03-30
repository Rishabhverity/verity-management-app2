import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Define a consistent trainer ID for demo purposes
const DEMO_TRAINER_ID = "trainer-demo";

// Mock batch data for demo purposes
// In a real app, this would come from the database
const mockBatches = [
  {
    id: "1",
    batchName: "Web Development Fundamentals",
    startDate: new Date(2025, 3, 1),
    endDate: new Date(2025, 3, 30),
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(17, 0, 0, 0)),
    trainingType: "ONLINE",
    trainerId: DEMO_TRAINER_ID,
    meetingLink: "https://zoom.us/j/123456789",
    status: "UPCOMING",
    traineeCount: 15
  },
  {
    id: "2",
    batchName: "Data Science Bootcamp",
    startDate: new Date(2025, 2, 15),
    endDate: new Date(2025, 5, 15),
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(17, 0, 0, 0)),
    trainingType: "OFFLINE",
    trainerId: "trainer-2",
    venue: "Tech Hub, Floor 3, Building 2",
    status: "ONGOING",
    traineeCount: 12
  },
  {
    id: "3",
    batchName: "AI Fundamentals",
    startDate: new Date(2025, 1, 10),
    endDate: new Date(2025, 2, 10),
    startTime: new Date(new Date().setHours(9, 0, 0, 0)),
    endTime: new Date(new Date().setHours(17, 0, 0, 0)),
    trainingType: "ONLINE",
    trainerId: DEMO_TRAINER_ID,
    meetingLink: "https://teams.microsoft.com/l/meetup-join/123",
    status: "COMPLETED",
    traineeCount: 20
  }
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // For demo purposes, use the DEMO_TRAINER_ID for trainer accounts
    const effectiveTrainerId = session.user.role === "TRAINER" ? DEMO_TRAINER_ID : session.user.id;

    // Determine what batches to return based on user role
    if (session.user.role === "TRAINER") {
      // Trainers can only see batches assigned to them
      const trainerBatches = mockBatches.filter(
        batch => batch.trainerId === effectiveTrainerId
      );
      return NextResponse.json(trainerBatches);
    } else if (session.user.role === "OPERATIONS" || session.user.role === "ADMIN") {
      // Operations and admin users can see all batches
      return NextResponse.json(mockBatches);
    } else {
      // Other roles don't have access
      return new NextResponse("Forbidden", { status: 403 });
    }
  } catch (error) {
    console.error("[BATCHES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== "OPERATIONS") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['batchName', 'startDate', 'endDate', 'trainingType'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return new NextResponse(`Missing required field: ${field}`, { status: 400 });
      }
    }

    // In a real app, save to database
    // For demo, just create a mock response
    const newBatch = {
      id: `${mockBatches.length + 1}`,
      ...body,
      status: body.status || "UPCOMING",
      traineeCount: body.trainees?.length || 0,
    };

    // For demo purposes, add to our mock data
    mockBatches.push(newBatch);

    return NextResponse.json(newBatch, { status: 201 });
  } catch (error) {
    console.error("[BATCHES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 