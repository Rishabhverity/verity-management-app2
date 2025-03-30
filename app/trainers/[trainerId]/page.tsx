"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Trainer = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  availability: boolean;
  assignedBatches?: number;
  createdAt?: string;
};

type Batch = {
  id: string;
  batchName: string;
  startDate: string;
  endDate: string;
  trainingType: string;
  trainerId?: string;
};

export default function TrainerProfilePage({ params }: { params: { trainerId: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [assignedBatches, setAssignedBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Check if user has permission to view trainers
  const userRole = session?.user?.role ? String(session.user.role).toUpperCase() : "";
  const canViewTrainers = userRole === "OPERATIONS" || userRole === "ADMIN";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch trainer details and assigned batches
  useEffect(() => {
    const fetchTrainerDetails = async () => {
      if (status === "authenticated" && canViewTrainers) {
        try {
          setIsLoading(true);
          // Fetch trainer details
          const trainerResponse = await fetch("/api/trainers");
          
          if (!trainerResponse.ok) {
            throw new Error("Failed to fetch trainer details");
          }
          
          const trainersData = await trainerResponse.json();
          const foundTrainer = trainersData.find((t: Trainer) => t.id === params.trainerId);
          
          if (!foundTrainer) {
            throw new Error("Trainer not found");
          }
          
          setTrainer(foundTrainer);
          
          // Fetch batches to get assigned batches count
          const batchesResponse = await fetch("/api/batches");
          if (batchesResponse.ok) {
            const batchesData = await batchesResponse.json();
            const trainerBatches = batchesData.filter(
              (batch: Batch) => batch.trainerId === params.trainerId
            );
            setAssignedBatches(trainerBatches);
          }
          
          setError("");
        } catch (err) {
          console.error("Error fetching trainer details:", err);
          setError("Failed to load trainer details. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTrainerDetails();
  }, [params.trainerId, status, canViewTrainers]);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] bg-white">
        <div className="text-xl text-gray-700">Loading trainer details...</div>
      </div>
    );
  }

  if (!canViewTrainers) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-700">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (error || !trainer) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trainer Not Found</h1>
          <p className="text-gray-700 mb-6">{error || "The trainer you're looking for doesn't exist or has been removed."}</p>
          <Button onClick={() => router.push("/trainers")}>
            Back to Trainers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/trainers")}>
          Back to Trainers
        </Button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{trainer.name}</h1>
          <div className="text-sm text-gray-500 mb-6">{trainer.email}</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-sm font-medium text-gray-500">Specialization</h2>
              <p className="text-lg text-gray-900">{trainer.specialization}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Status</h2>
              <span
                className={`mt-1 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  trainer.availability
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {trainer.availability ? "Available" : "Unavailable"}
              </span>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Assigned Batches</h2>
              <p className="text-lg text-gray-900">{assignedBatches.length}</p>
            </div>
            <div>
              <h2 className="text-sm font-medium text-gray-500">Member Since</h2>
              <p className="text-lg text-gray-900">
                {trainer.createdAt
                  ? new Date(trainer.createdAt).toLocaleDateString()
                  : "N/A"}
              </p>
            </div>
          </div>

          {assignedBatches.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Assigned Batches</h2>
              <div className="grid grid-cols-1 gap-3">
                {assignedBatches.map((batch) => (
                  <div 
                    key={batch.id} 
                    className="p-3 border border-gray-200 rounded-md bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">{batch.batchName}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {batch.trainingType}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Actions</h2>
              <div className="flex gap-3">
                {trainer.availability && (
                  <Button onClick={() => router.push(`/trainers/${trainer.id}/assign-batch`)}>
                    Assign to Batch
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => {
                    // In a real app, you would implement updating availability
                    alert("Update availability functionality would be implemented here");
                  }}
                >
                  Toggle Availability
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 