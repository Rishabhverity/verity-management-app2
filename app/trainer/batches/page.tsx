"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Batch {
  id: string;
  batchName: string;
  trainees?: { id: string; name: string; email?: string }[];
  startDate: Date;
  endDate: Date;
  trainerId: string;
  trainingType: string;
  status: string;
  isAssignedToCurrentTrainer?: boolean;
}

interface AcceptedAssignment {
  batchId: string;
  trainerId: string;
  trainerName: string;
  status: 'ACCEPTED' | 'DECLINED';
  timestamp: number;
}

const TrainerBatchesPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchBatches();
    }
  }, [status]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simple API call without any localStorage dependency
      const response = await fetch("/api/batches");
      
      if (!response.ok) {
        throw new Error("Failed to fetch batches");
      }
      
      const data = await response.json();
      
      if (Array.isArray(data.batches)) {
        // Get accepted assignments from localStorage
        const acceptedAssignments = getAcceptedAssignments();
        const acceptedBatchIds = acceptedAssignments
          .filter(a => a.status === 'ACCEPTED')
          .map(a => a.batchId);
        
        console.log("Accepted batch IDs:", acceptedBatchIds);
        
        // Filter to show only accepted batches that are assigned to this trainer
        const acceptedBatches = data.batches.filter(batch => 
          acceptedBatchIds.includes(batch.id) && batch.isAssignedToCurrentTrainer
        );
        
        console.log("Displaying accepted batches:", acceptedBatches.length);
        setBatches(acceptedBatches);
      } else {
        console.error("Invalid batches data format:", data);
        setBatches([]);
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      setError("Failed to fetch accepted batches");
    } finally {
      setLoading(false);
    }
  };

  const getAcceptedAssignments = (): AcceptedAssignment[] => {
    try {
      const storedAssignments = localStorage.getItem("trainer-assignments");
      if (storedAssignments) {
        const assignments = JSON.parse(storedAssignments);
        // Filter to only get this trainer's assignments
        return assignments.filter(
          (a: AcceptedAssignment) => a.trainerId === session?.user?.id
        );
      }
    } catch (error) {
      console.error("Error reading accepted assignments:", error);
    }
    return [];
  };

  if (status === "loading" || loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">My Batches</h1>
        <div className="text-center py-10">Loading batches...</div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">My Batches</h1>
        <div className="bg-red-100 p-4 rounded mb-4">
          You need to be logged in to view your batches
        </div>
        <Link href="/login" className="btn btn-primary">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Batches</h1>
      
      {error && (
        <div className="bg-red-100 p-4 rounded mb-4">{error}</div>
      )}
      
      {batches.length === 0 ? (
        <div className="bg-blue-50 p-6 rounded-lg text-center shadow-sm">
          <h2 className="text-xl font-medium text-blue-800 mb-2">No Accepted Batches</h2>
          <p className="text-blue-600">
            You haven't accepted any batches yet.
          </p>
          <p className="text-blue-600 mt-2">
            Visit the <Link href="/trainer/assignments" className="underline">Assignments</Link> page to view and accept training assignments.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch) => (
            <div key={batch.id} className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-xl font-semibold mb-2">{batch.batchName}</h2>
              <div className="mb-3">
                <p className="text-gray-600">
                  <span className="font-medium">Training Type:</span>{" "}
                  {batch.trainingType}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Start Date:</span>{" "}
                  {new Date(batch.startDate).toLocaleDateString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">End Date:</span>{" "}
                  {new Date(batch.endDate).toLocaleDateString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Students:</span>{" "}
                  {batch.trainees?.length || 0}
                </p>
              </div>
              
              <div className="mt-4">
                <Link 
                  href={`/trainer/students?batchId=${batch.id}`}
                  className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-block"
                >
                  View Students
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrainerBatchesPage; 