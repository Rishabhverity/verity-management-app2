"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";

// Define types
interface Trainer {
  id: string;
  name: string;
  specialization: string;
  availability: boolean;
}

interface Batch {
  id: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  trainingType: "ONLINE" | "OFFLINE";
}

interface AssignmentFormData {
  trainerId: string;
  meetingLink?: string;
  venue?: string;
  accommodation?: string;
  travel?: string;
}

export default function AssignTrainerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;

  // State for trainers, selected batch, form data and loading states
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [formData, setFormData] = useState<AssignmentFormData>({
    trainerId: "",
    meetingLink: "",
    venue: "",
    accommodation: "",
    travel: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Check if user can assign trainers
  const canAssignTrainers = session?.user?.role === "OPERATIONS";

  // Load trainers and batch data
  useEffect(() => {
    if (status === "authenticated" && canAssignTrainers) {
      setIsLoading(true);
      
      // In a real app, fetch trainers and batch data from API
      // Mock batch data based on batchId
      const mockBatch: Batch = {
        id: batchId,
        batchName: "Web Development Fundamentals",
        startDate: new Date(2025, 3, 1),
        endDate: new Date(2025, 3, 30),
        trainingType: "ONLINE",
      };

      // Mock trainers data
      const mockTrainers: Trainer[] = [
        {
          id: "1",
          name: "John Doe",
          specialization: "Web Development",
          availability: true,
        },
        {
          id: "2",
          name: "Jane Smith",
          specialization: "Data Science",
          availability: true,
        },
        {
          id: "3",
          name: "Robert Johnson",
          specialization: "Mobile Development",
          availability: false,
        },
      ];

      setBatch(mockBatch);
      setTrainers(mockTrainers);
      setIsLoading(false);
    }
  }, [status, canAssignTrainers, batchId]);

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle trainer assignment
  const handleAssignTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.trainerId) return;

    setIsAssigning(true);

    // In a real app, make API call to assign trainer to batch
    setTimeout(() => {
      // Success! Redirect back to batches page
      setIsAssigning(false);
      router.push("/batches");
    }, 1000);
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Render loading state
  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  // Render access denied for unauthorized users
  if (!canAssignTrainers) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  // Render not found for invalid batch
  if (!batch) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Batch Not Found</h1>
          <p className="text-gray-500">The batch you are looking for does not exist.</p>
          <Button
            className="mt-4"
            onClick={() => router.push("/batches")}
          >
            Back to Batches
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/batches")}
          className="mb-4"
        >
          &larr; Back to Batches
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Assign Trainer to Batch</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Batch Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Batch Name</p>
            <p className="font-medium">{batch.batchName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Duration</p>
            <p className="font-medium">
              {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Training Type</p>
            <p className="font-medium">{batch.trainingType}</p>
          </div>
        </div>

        <form onSubmit={handleAssignTrainer}>
          <h3 className="text-md font-semibold mb-4">Trainer Assignment</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Trainer*
            </label>
            <select
              name="trainerId"
              value={formData.trainerId}
              onChange={handleFormChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a trainer</option>
              {trainers.map((trainer) => (
                <option 
                  key={trainer.id} 
                  value={trainer.id}
                  disabled={!trainer.availability}
                >
                  {trainer.name} - {trainer.specialization} {!trainer.availability && "(Unavailable)"}
                </option>
              ))}
            </select>
          </div>

          {batch.trainingType === "ONLINE" && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Link
              </label>
              <input
                type="url"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleFormChange}
                placeholder="https://zoom.us/meeting/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Add a meeting link for online training sessions
              </p>
            </div>
          )}

          {batch.trainingType === "OFFLINE" && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue
                </label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleFormChange}
                  placeholder="Training center address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Accommodation Details
                </label>
                <textarea
                  name="accommodation"
                  value={formData.accommodation}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Hotel name, address, booking reference..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Travel Arrangements
                </label>
                <textarea
                  name="travel"
                  value={formData.travel}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Flight details, transport arrangements..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          <div className="flex justify-end mt-6 space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/batches")}
              disabled={isAssigning}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isAssigning || !formData.trainerId}>
              {isAssigning ? "Assigning..." : "Assign Trainer"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 