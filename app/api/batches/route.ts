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
    const userId = session?.user?.id || null;
    const userRole = session?.user?.role || "GUEST";
    
    console.log("API /batches GET - User role:", userRole);
    console.log("API /batches GET - User ID:", userId);
    
    // Create combined batches list from all sources
    const allBatches = [...MOCK_BATCHES, ...RECENT_BATCHES, ...DYNAMIC_BATCHES];
    console.log("API /batches GET - Found", allBatches.length, "total batches");

    if (userRole === "TRAINER") {
      // For trainers, mark batches that are assigned to them
      const trainerBatches = allBatches.map(batch => {
        // Check if this batch should be marked as assigned to the current trainer
        let isAssigned = false;
        
        // Match by exact ID
        if (batch.trainerId === userId) {
          console.log(`Batch ${batch.id} assigned directly to trainer ${userId}`);
          isAssigned = true;
        }
        // Special handling for demo account 
        else if (userId === 'cm8vdznmy0000logs085del8m' && 
                (batch.trainerId === 'trainer-demo')) {
          console.log(`Batch ${batch.id} assigned to demo trainer`);
          isAssigned = true;
        }
        // For testing - mark all batches as assigned if they have no trainer
        else if (!batch.trainerId || batch.trainerId === '') {
          console.log(`Batch ${batch.id} has no trainer assigned, making available to all trainers`);
          isAssigned = true;
        }
        // If trainerId looks like an email, match by user email
        else if (batch.trainerId && batch.trainerId.includes('@') && session?.user?.email === batch.trainerId) {
          console.log(`Batch ${batch.id} assigned to trainer by email ${batch.trainerId}`);
          isAssigned = true;
        }
        
        // Ensure we return the complete batch with trainees data
        return {
          ...batch,
          isAssignedToCurrentTrainer: isAssigned,
          trainees: batch.trainees || []  // Ensure trainees array is always included
        };
      });
      
      // Further filter to ensure no duplicate batches
      const uniqueBatchIds = new Set();
      const filteredBatches = trainerBatches.filter(batch => {
        if (batch.isAssignedToCurrentTrainer) {
          if (uniqueBatchIds.has(batch.id)) {
            // This is a duplicate ID, skip it
            return false;
          }
          // Add this batch ID to our set
          uniqueBatchIds.add(batch.id);
          return true;
        }
        return batch.isAssignedToCurrentTrainer;
      });
      
      // Debug log to check what batches are being returned
      console.log(`API /batches GET - Returning ${filteredBatches.length} batches for trainer ${userId}`);
      filteredBatches.forEach(batch => {
        console.log(`  - Batch: ${batch.id}, ${batch.batchName}, Trainees: ${batch.trainees?.length || 0}`);
      });
      
      return NextResponse.json({ 
        batches: filteredBatches,
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
    console.log("Received batch creation request:", data);
    
    // Generate ID if not provided
    if (!data.id) {
      data.id = `batch-${Date.now()}`;
    }
    
    // Ensure status is set to PENDING for new batches
    if (!data.status) {
      data.status = "PENDING";
    }
    
    // Ensure dates are properly formatted as Date objects
    if (data.startDate && typeof data.startDate === 'string') {
      data.startDate = new Date(data.startDate);
    }
    
    if (data.endDate && typeof data.endDate === 'string') {
      data.endDate = new Date(data.endDate);
    }
    
    // Validate trainer info
    console.log(`Trainer info - ID: ${data.trainerId}, Name: ${data.trainerName}, Email: ${data.trainerEmail || 'Not provided'}`);
    
    // Ensure trainerEmail is stored if available
    if (!data.trainerEmail && data.trainerId) {
      console.log("No trainer email provided, will use ID only for matching");
    }
    
    // Ensure trainees are properly formatted
    if (data.trainees && Array.isArray(data.trainees)) {
      // Make sure each trainee has required fields
      data.trainees = data.trainees.map((trainee: any, index: number) => ({
        id: trainee.id || `student-${Date.now()}-${index}`,
        name: trainee.name || 'Student',
        email: trainee.email || null,
      }));
      
      // Update traineeCount
      data.traineeCount = data.trainees.length;
    } else {
      // Initialize empty trainees array if not present
      data.trainees = [];
      data.traineeCount = 0;
    }
    
    // Add to our server-side storage
    DYNAMIC_BATCHES.push(data);
    
    // Also add to RECENT_BATCHES for persistence across requests
    RECENT_BATCHES.push(data);
    
    console.log(`Created new batch "${data.batchName}" (ID: ${data.id}) with ${data.traineeCount} trainees`);
    console.log(`Assigned to trainer: ${data.trainerId} (${data.trainerName})`);
    
    // Debug info about all batches
    const allBatches = [...MOCK_BATCHES, ...RECENT_BATCHES, ...DYNAMIC_BATCHES];
    console.log(`Total batches in system: ${allBatches.length}`);
    
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