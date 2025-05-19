import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface RequestParams {
  params: {
    id: string;
  };
}

// Get a specific batch
export async function GET(request: Request, { params }: RequestParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const batchId = params.id;
    if (!batchId) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Import batches from the main API to ensure we're using the same data source
    const { MOCK_BATCHES, RECENT_BATCHES, DYNAMIC_BATCHES } = 
      await import('../../batches/route').then(mod => ({ 
        MOCK_BATCHES: mod.MOCK_BATCHES,
        RECENT_BATCHES: mod.RECENT_BATCHES,
        DYNAMIC_BATCHES: mod.DYNAMIC_BATCHES || []
      }));

    // Find the batch in all possible sources
    const allBatches = [...MOCK_BATCHES, ...RECENT_BATCHES, ...DYNAMIC_BATCHES];
    const batch = allBatches.find(b => b.id === batchId);

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    console.log(`API /batches/${batchId} - Found batch with ${batch.trainees?.length || 0} trainees`);

    // For security, check if the user is authorized to view this batch
    const isAdmin = session?.user?.role === "ADMIN";
    const isTrainer = session?.user?.role === "TRAINER" && 
                     (batch.trainerId === session?.user?.id || 
                      batch.trainerId === "trainer-demo" && session?.user?.id === "cm8vdznmy0000logs085del8m");

    if (!isAdmin && !isTrainer) {
      return NextResponse.json({ error: "Not authorized to view this batch" }, { status: 403 });
    }

    return NextResponse.json({ 
      batch,
      success: true 
    });

  } catch (error) {
    console.error("Error fetching batch by ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch batch" },
      { status: 500 }
    );
  }
} 