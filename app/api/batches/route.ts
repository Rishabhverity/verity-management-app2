import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
    trainerId: "trainer-demo",
    trainerName: "Demo Trainer",
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
    trainerName: "Jane Smith",
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
    trainerId: "trainer-demo",
    trainerName: "Demo Trainer",
    meetingLink: "https://teams.microsoft.com/l/meetup-join/123",
    status: "COMPLETED",
    traineeCount: 20
  }
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log("API /batches GET - No session found, returning 401");
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Determine what batches to return based on user role
    const userRole = String(session.user.role || "").toUpperCase();
    const userId = String(session.user.id || "");
    
    console.log("API /batches GET - User role:", userRole);
    console.log("API /batches GET - User ID:", userId);
    
    // First check if there are batches in localStorage, and use those if available
    let batchesFromStorage = [];
    
    try {
      // In a real app we'd fetch from the database here
      // For this demo, we're only using mockBatches
      console.log("API /batches GET - Using mock data as source");
      
      // Also check if we have batches in localStorage - in production we wouldn't do this
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('verity-batches');
        if (stored) {
          batchesFromStorage = JSON.parse(stored);
          console.log("API /batches GET - Found batches in localStorage:", batchesFromStorage.length);
        }
      }
    } catch (error) {
      console.error("API /batches GET - Error accessing batch data:", error);
    }

    // Get all batches from either mock data or storage
    // In a real app, this would be from the database
    let allBatches = batchesFromStorage.length > 0 ? batchesFromStorage : mockBatches;
    console.log("API /batches GET - Total batches available:", allBatches.length);

    if (userRole === "TRAINER") {
      // Trainers can only see batches assigned to them
      console.log("API /batches GET - Filtering batches for trainer with ID:", userId);
      
      console.log("API /batches GET - All batches before filtering:", allBatches.length);
      
      const trainerBatches = allBatches.filter(batch => {
        if (!batch.trainerId) {
          console.log(`API /batches GET - Batch ${batch.id} has no trainerId, skipping`);
          return false;
        }
        
        const batchTrainerId = String(batch.trainerId || "").toLowerCase();
        const sessionUserId = String(userId || "").toLowerCase();
        
        console.log(`API /batches GET - Comparing batch.trainerId (${batchTrainerId}) with userId (${sessionUserId})`);
        const isMatch = batchTrainerId === sessionUserId;
        console.log(`API /batches GET - Match for batch ${batch.id}: ${isMatch}`);
        
        return isMatch;
      });
      
      console.log(`API /batches GET - Found ${trainerBatches.length} batches for trainer`);
      
      // Ensure trainer batches have a status (default to PENDING if none)
      const batchesWithStatus = trainerBatches.map(batch => ({
        ...batch,
        status: batch.assignmentStatus || batch.status || "PENDING"
      }));
      
      // Return the filtered batches
      return NextResponse.json(batchesWithStatus);
    } else if (userRole === "ADMIN" || userRole === "OPERATIONS") {
      // Admin and Operations users can see all batches
      console.log("API /batches GET - Returning all batches for admin/operations");
      return NextResponse.json(allBatches);
    } else {
      // Other roles don't have access
      console.log("API /batches GET - User role not authorized:", userRole);
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
    
    // Normalize role to uppercase
    const userRole = session?.user?.role ? String(session.user.role).toUpperCase() : "";
    
    if (!session || userRole !== "ADMIN") {
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
    // For demo, we need to save to both local storage and our mock data
    const newBatch = {
      id: `batch-${Date.now()}`,
      ...body,
      status: body.status || "UPCOMING",
      // For trainer assignment status tracking
      assignmentStatus: body.trainerId ? "PENDING" : null,
      traineeCount: body.trainees?.length || 0,
    };

    console.log("API /batches POST - Creating new batch:", newBatch);

    // For demo purposes, add to our mock data
    mockBatches.push(newBatch);

    // Return the created batch
    return NextResponse.json(newBatch, { status: 201 });
  } catch (error) {
    console.error("[BATCHES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 