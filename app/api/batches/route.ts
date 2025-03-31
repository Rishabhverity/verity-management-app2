import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Demo data
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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = session?.user?.role;
    const userId = session?.user?.id;

    console.log("API /batches GET - User role:", userRole);
    console.log("API /batches GET - User ID:", userId);
    console.log("API /batches GET - Using mock data as source");
    console.log("API /batches GET - Total batches available:", MOCK_BATCHES.length);

    // For demonstration, simulate retrieving from localStorage first
    let batches = MOCK_BATCHES;

    // If the role is trainer, return all batches for demo purposes
    // This ensures trainers can see student data
    if (userRole === "TRAINER") {
      console.log("API /batches GET - Returning all batches for trainer");
      
      // Store the batches in localStorage for client-side access
      // On the server, set a flag to store in localStorage on the client
      return NextResponse.json({ 
        batches, 
        userId,
        userRole,
        storeInLocalStorage: true 
      });
    }

    // For admins and other roles, return all batches
    return NextResponse.json({ batches });
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
    
    // Store in localStorage (handled on client side)
    return NextResponse.json({ 
      batch: data, 
      storeInLocalStorage: true 
    });
  } catch (error) {
    console.error("Error in batches API:", error);
    return NextResponse.json(
      { error: "Failed to create batch" },
      { status: 500 }
    );
  }
} 