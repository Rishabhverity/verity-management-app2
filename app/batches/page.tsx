"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TrainingType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import BatchForm from "@/components/forms/BatchForm";

// Define types
type BatchStatus = "UPCOMING" | "ONGOING" | "COMPLETED";

interface Trainee {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  startTime?: Date;
  endTime?: Date;
  trainingType: TrainingType;
  status: BatchStatus;
  traineeCount: number;
  trainerId?: string;
  trainerName?: string;
  trainees?: Trainee[];
}

export default function BatchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State for batches, form visibility and loading states
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<BatchStatus | "ALL">("ALL");

  // Check if user can view and manage batches
  const canViewBatches = session?.user?.role === "OPERATIONS";

  // Mock data initialization
  useEffect(() => {
    if (status === "authenticated" && canViewBatches) {
      // In a real app, fetch batches from API
      const mockBatches: Batch[] = [
        {
          id: "1",
          batchName: "Web Development Fundamentals",
          startDate: new Date(2025, 3, 1),
          endDate: new Date(2025, 3, 30),
          trainingType: "ONLINE",
          status: "UPCOMING",
          traineeCount: 15
        },
        {
          id: "2",
          batchName: "Data Science Bootcamp",
          startDate: new Date(2025, 2, 15),
          endDate: new Date(2025, 5, 15),
          trainingType: "OFFLINE",
          status: "ONGOING",
          traineeCount: 12
        },
        {
          id: "3",
          batchName: "AI Fundamentals",
          startDate: new Date(2025, 1, 10),
          endDate: new Date(2025, 2, 10),
          trainingType: "ONLINE",
          status: "COMPLETED",
          traineeCount: 20
        }
      ];
      setBatches(mockBatches);
    }
  }, [status, canViewBatches]);

  // Handle creating or updating a batch
  const handleSubmitBatch = (data: any) => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      if (editingBatch) {
        // Update existing batch
        setBatches(batches.map(batch => 
          batch.id === editingBatch.id 
            ? {
                ...batch,
                ...data,
                status: getStatus(data.startDate, data.endDate),
                trainerId: data.trainerId || null,
                startTime: data.startTime || null,
                endTime: data.endTime || null,
              } 
            : batch
        ));
      } else {
        // Create new batch
        const newBatch: Batch = {
          id: `${batches.length + 1}`,
          ...data,
          status: getStatus(data.startDate, data.endDate),
          traineeCount: data.trainees?.length || 0,
          trainerId: data.trainerId || null,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
        };
        setBatches([newBatch, ...batches]);
      }

      // Reset form state
      setIsLoading(false);
      setIsFormOpen(false);
      setEditingBatch(null);
    }, 1000);
  };

  // Helper to determine batch status based on dates
  const getStatus = (startDate: Date, endDate: Date): BatchStatus => {
    const now = new Date();
    if (now < startDate) return "UPCOMING";
    if (now > endDate) return "COMPLETED";
    return "ONGOING";
  };

  // Filter batches based on status
  const filteredBatches = filterStatus === "ALL"
    ? batches
    : batches.filter(batch => batch.status === filterStatus);

  // Handle editing a batch
  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setIsFormOpen(true);
  };

  // Handle deleting a batch
  const handleDeleteBatch = (batchId: string) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      // In a real app, make API call to delete
      setBatches(batches.filter(batch => batch.id !== batchId));
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  // Format time for display
  const formatTime = (time: Date) => {
    if (!time) return "";
    return new Date(time).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Render loading state
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  // Render access denied for unauthorized users
  if (!canViewBatches) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Training Batches</h1>
        <Button onClick={() => {
          setEditingBatch(null);
          setIsFormOpen(true);
        }}>
          Create New Batch
        </Button>
      </div>

      {/* Form for creating/editing batches */}
      {isFormOpen && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">
            {editingBatch ? "Edit Training Batch" : "Create New Training Batch"}
          </h2>
          <BatchForm
            initialData={editingBatch ? {
              batchName: editingBatch.batchName,
              startDate: editingBatch.startDate,
              endDate: editingBatch.endDate,
              startTime: editingBatch.startTime || new Date(new Date().setHours(9, 0, 0, 0)),
              endTime: editingBatch.endTime || new Date(new Date().setHours(17, 0, 0, 0)),
              trainingType: editingBatch.trainingType,
              trainerId: editingBatch.trainerId || "",
            } : undefined}
            onSubmit={handleSubmitBatch}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingBatch(null);
            }}
            isLoading={isLoading}
          />
        </div>
      )}

      {/* Status filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status:</label>
        <div className="flex space-x-2">
          <button 
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-md text-sm ${
              filterStatus === "ALL" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button 
            onClick={() => setFilterStatus("UPCOMING")}
            className={`px-4 py-2 rounded-md text-sm ${
              filterStatus === "UPCOMING" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Upcoming
          </button>
          <button 
            onClick={() => setFilterStatus("ONGOING")}
            className={`px-4 py-2 rounded-md text-sm ${
              filterStatus === "ONGOING" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Ongoing
          </button>
          <button 
            onClick={() => setFilterStatus("COMPLETED")}
            className={`px-4 py-2 rounded-md text-sm ${
              filterStatus === "COMPLETED" 
                ? "bg-blue-600 text-white" 
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Batch table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Batch Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Trainees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Trainer
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBatches.map((batch) => (
              <tr key={batch.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {batch.batchName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                  {batch.startTime && batch.endTime && (
                    <div className="text-xs text-gray-500 mt-1">
                      Class time: {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {batch.trainingType}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
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
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {batch.traineeCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {batch.trainerName || (batch.trainerId ? "Assigned" : "Not Assigned")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBatch(batch)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/batches/${batch.id}/assign`)}
                    >
                      Assign Trainer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600"
                      onClick={() => handleDeleteBatch(batch.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredBatches.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-10 text-center text-sm text-gray-700"
                >
                  No batches found for the selected filter
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 