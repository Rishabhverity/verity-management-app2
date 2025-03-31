import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Demo data - including batches created by admins for various trainers
const MOCK_BATCHES = [
  {
    id: "batch-1743349458328",
    batchName: "Web Development Fundamentals",
    startDate: new Date("2023-08-15"),
    endDate: new Date("2023-11-15"),
    trainerId: "trainer-demo",
    trainingType: "ONLINE",
    traineeCount: 25,
    status: "ACTIVE",
    trainees: [
      { id: "student-1", name: "John Smith", email: "john.smith@example.com" },
      { id: "student-2", name: "Sarah Johnson", email: "sarah.j@example.com" },
      { id: "student-3", name: "Michael Wong", email: "mwong@example.com" },
      { id: "student-4", name: "Priya Patel", email: "p.patel@example.com" },
      { id: "student-5", name: "Diego Rodriguez", email: "d.rodriguez@example.com" }
    ]
  },
  {
    id: "batch-1743349464819",
    batchName: "Data Science Bootcamp",
    startDate: new Date("2023-09-01"),
    endDate: new Date("2023-12-01"),
    trainerId: "trainer-2",
    trainingType: "OFFLINE",
    traineeCount: 15,
    status: "ACTIVE",
    trainees: [
      { id: "student-6", name: "Emma Wilson", email: "ewilson@example.com" },
      { id: "student-7", name: "James Taylor", email: "jtaylor@example.com" },
      { id: "student-8", name: "Aisha Khan", email: "akhan@example.com" }
    ]
  },
  {
    id: "batch-1743354606398",
    batchName: "UI/UX Design Workshop",
    startDate: new Date("2023-10-01"),
    endDate: new Date("2023-11-30"),
    trainerId: "trainer-demo",
    trainingType: "ONLINE",
    traineeCount: 20,
    status: "PENDING",
    trainees: [
      { id: "student-9", name: "Thomas Brown", email: "tbrown@example.com" },
      { id: "student-10", name: "Sophia Garcia", email: "sgarcia@example.com" },
      { id: "student-11", name: "Lucas Kim", email: "lkim@example.com" },
      { id: "student-12", name: "Olivia Chen", email: "ochen@example.com" }
    ]
  }
];

// Add recent batches - these are the ones created by admins through the UI
// In a real app, these would be stored in a database
const RECENT_BATCHES = [
  {
    id: "batch-recent-1",
    batchName: "React Advanced Training",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)),
    trainerId: "cm8vdznmy0000logs085del8m", // This is the trainer-demo ID
    trainingType: "ONLINE",
    traineeCount: 15,
    status: "PENDING",
    trainees: [
      { id: "student-r1", name: "Alice Johnson", email: "alice@example.com" },
      { id: "student-r2", name: "Bob Smith", email: "bob@example.com" },
      { id: "student-r3", name: "Charlie Brown", email: "charlie@example.com" }
    ]
  },
  {
    id: "batch-recent-2",
    batchName: "Node.js Backend Development",
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    trainerId: "cm8vdznmy0000logs085del8m", // This is the trainer-demo ID
    trainingType: "HYBRID",
    traineeCount: 10,
    status: "PENDING",
    trainees: [
      { id: "student-r4", name: "Diana Prince", email: "diana@example.com" },
      { id: "student-r5", name: "Ethan Hunt", email: "ethan@example.com" }
    ]
  }
];

// Storage for newly created batches - server-side only
const DYNAMIC_BATCHES = [];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    console.log("API /batches GET - User role:", userRole);
    console.log("API /batches GET - User ID:", userId);
    
    // Create combined batches list from all sources
    const allBatches = [...MOCK_BATCHES, ...RECENT_BATCHES, ...DYNAMIC_BATCHES];
    console.log("API /batches GET - Found", allBatches.length, "batches for trainer");

    if (userRole === "TRAINER") {
      // For trainers, mark batches that are assigned to them
      const trainerBatches = allBatches.map(batch => ({
        ...batch,
        isAssignedToCurrentTrainer: 
          // Match by exact ID
          batch.trainerId === userId || 
          // Special handling for demo account
          (userId === 'cm8vdznmy0000logs085del8m' && 
           (batch.trainerId === 'trainer-demo' || 
            batch.trainerId === 'cm8vdznmy0000logs085del8m'))
      }));
      
      return NextResponse.json({ 
        batches: trainerBatches,
        userId,
        userRole
      });
    }

    // For admins and other roles, return all batches
    return NextResponse.json({ batches: allBatches });
  } catch (error) {
    console.error("Error in batches API:", error);
    return NextResponse.json(
      { error: "Failed to fetch batches" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    
    // Generate ID if not provided
    if (!data.id) {
      data.id = `batch-${Date.now()}`;
    }
    
    // Ensure status is set to PENDING for new batches
    if (!data.status) {
      data.status = "PENDING";
    }
    
    // Add to our server-side storage
    DYNAMIC_BATCHES.push(data);
    
    // Also add to RECENT_BATCHES for persistence across requests
    RECENT_BATCHES.push(data);
    
    return NextResponse.json({ 
      batch: data,
      message: "Batch created successfully",
      success: true
    });
  } catch (error) {
    console.error("Error in batches API:", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
} 