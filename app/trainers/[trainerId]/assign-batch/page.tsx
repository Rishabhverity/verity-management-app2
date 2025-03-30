"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { TrainingType } from "@prisma/client";

// Define types
type Batch = {
  id: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  trainingType: TrainingType;
  trainerId?: string;
  status: string;
  traineeCount: number;
  trainerName?: string;
};

type Trainer = {
  id: string;
  name: string;
  email: string;
  specialization: string;
};

export default function AssignBatchPage() {
  const params = useParams();
  const trainerId = params.trainerId as string;
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [availableBatches, setAvailableBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Check if user has permission
  const canAssignTrainers = session?.user?.role === "ADMIN" || session?.user?.role === "OPERATIONS";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (!canAssignTrainers) {
      router.push("/unauthorized");
      return;
    }

    if (status === "authenticated" && trainerId) {
      fetchTrainerAndBatches();
    }
  }, [trainerId, status, canAssignTrainers, router]);

  const fetchTrainerAndBatches = async () => {
    setIsLoading(true);
    try {
      // In a real app, fetch trainer from API
      // Mock data for demo
      const mockTrainer = {
        id: trainerId,
        name: trainerId === "trainer-demo" ? "Demo Trainer" : 
              trainerId === "trainer-2" ? "Jane Smith" : 
              "Trainer " + trainerId,
        email: "trainer@example.com",
        specialization: "Web Development"
      };
      setTrainer(mockTrainer);

      // Get available batches from localStorage
      const storedBatches = localStorage.getItem('verity-batches');
      if (storedBatches) {
        const parsedBatches = JSON.parse(storedBatches, (key, value) => {
          // Convert date strings back to Date objects
          if (key === 'startDate' || key === 'endDate') {
            return value ? new Date(value) : null;
          }
          return value;
        });
        setAvailableBatches(parsedBatches);
      } else {
        setAvailableBatches([]);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load trainer or batches");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignBatch = async (batchId: string) => {
    if (!trainer) return;
    
    try {
      setIsAssigning(true);
      setSuccess("");
      setError("");
      
      console.log(`Assigning batch ${batchId} to trainer ${trainerId}`);
      
      // In a real application, you would make an API call to assign the trainer to the batch
      // For now, let's simulate a successful API call with a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update localStorage to persist the assignment between page refreshes
      try {
        // Get existing batches from localStorage
        const storedBatches = localStorage.getItem('verity-batches');
        let batches = [];
        
        if (storedBatches) {
          batches = JSON.parse(storedBatches);
          
          console.log("Before update - all batches:", batches);
          
          // Find the batch to update
          const batchToUpdate = batches.find((batch: Batch) => batch.id === batchId);
          if (batchToUpdate) {
            console.log("Before update - selected batch:", batchToUpdate);
            
            // Update the batch with the trainer ID and name
            batchToUpdate.trainerId = trainerId;
            batchToUpdate.trainerName = trainer.name;
            
            console.log("After update - selected batch:", batchToUpdate);
          }
          
          // Save the updated batches back to localStorage
          localStorage.setItem('verity-batches', JSON.stringify(batches));
          console.log("Updated batches saved to localStorage");
        }
      } catch (error) {
        console.error("Error updating localStorage:", error);
      }
      
      setSuccess(`Successfully assigned ${trainer.name} to the batch!`);
      
      // Update the UI to show the batch is now assigned
      setAvailableBatches(prev => 
        prev.map(batch => 
          batch.id === batchId ? { ...batch, trainerId: trainerId, trainerName: trainer.name } : batch
        )
      );

      // Redirect to the trainer profile page after 1.5 seconds
      setTimeout(() => {
        router.push(`/trainers/${trainerId}`);
      }, 1500);
      
    } catch (err) {
      console.error("Error assigning batch:", err);
      setError("Failed to assign the trainer to the batch. Please try again.");
    } finally {
      setIsAssigning(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!trainer) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trainer Not Found</h1>
          <p className="text-gray-500 mb-6">Unable to find the specified trainer.</p>
          <Button onClick={() => router.push("/trainers")}>
            Back to Trainers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push(`/trainers/${trainerId}`)}>
          Back to Trainer Profile
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Assign Batch to {trainer.name}
      </h1>
      <p className="text-gray-600 mb-6">
        Select a batch to assign to this trainer.
      </p>

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 p-4 rounded-lg border border-green-200 text-green-700">
          {success}
        </div>
      )}

      {availableBatches.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Batches Available</h3>
          <p className="text-gray-600 mb-4">There are no training batches available to assign.</p>
          <Button onClick={() => router.push("/batches")}>Create New Batch</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {availableBatches.map((batch) => (
            <div
              key={batch.id}
              className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {batch.batchName}
                    </h2>
                    <p className="mt-1 text-sm text-gray-700">
                      {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        batch.status === "UPCOMING"
                          ? "bg-blue-100 text-blue-800"
                          : batch.status === "ONGOING"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                  >
                    {batch.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Training Type</h3>
                    <p className="mt-1 text-sm text-gray-900">{batch.trainingType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Number of Trainees</h3>
                    <p className="mt-1 text-sm text-gray-900">{batch.traineeCount}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Current Trainer</h3>
                    <p className="mt-1 text-sm text-gray-900">
                      {batch.trainerId 
                        ? (batch.trainerId === trainerId 
                            ? "Already assigned to this trainer" 
                            : "Assigned to another trainer")
                        : "No trainer assigned"}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    disabled={isAssigning || batch.trainerId === trainerId}
                    onClick={() => handleAssignBatch(batch.id)}
                  >
                    {batch.trainerId === trainerId
                      ? "Already Assigned"
                      : isAssigning
                      ? "Assigning..."
                      : "Assign Batch"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 