"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import BatchForm from "@/components/forms/BatchForm";
import { Pagination } from "@/components/ui/pagination";

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
  trainingType: "ONLINE" | "OFFLINE" | "HYBRID";
  status: BatchStatus;
  traineeCount: number;
  trainerId?: string;
  trainerName?: string;
  trainees?: Trainee[];
  meetingLink?: string;
  venue?: string;
  accommodation?: string;
  travel?: string;
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
  const [trainers, setTrainers] = useState<{id: string, name: string}[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Check if user can view and manage batches
  const userRole = session?.user?.role ? String(session.user.role).toUpperCase() : "";
  const canViewBatches = userRole === "ADMIN";

  // Fetch trainers data
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const response = await fetch('/api/trainers');
        if (response.ok) {
          const data = await response.json();
          setTrainers(data.map((trainer: any) => ({ 
            id: trainer.id, 
            name: trainer.name 
          })));
        }
      } catch (error) {
        console.error('Error fetching trainers:', error);
      }
    };

    if (status === "authenticated" && canViewBatches) {
      fetchTrainers();
    }
  }, [status, canViewBatches]);

  // Initialize from localStorage or use mock data
  useEffect(() => {
    if (status === "authenticated" && canViewBatches) {
      // Try to get batches from localStorage
      const storedBatches = localStorage.getItem('verity-batches');
      
      if (storedBatches) {
        try {
          // Parse the dates properly
          const parsedBatches = JSON.parse(storedBatches, (key, value) => {
            // Convert date strings back to Date objects
            if (key === 'startDate' || key === 'endDate' || key === 'startTime' || key === 'endTime') {
              return value ? new Date(value) : null;
            }
            return value;
          });
          setBatches(parsedBatches);
        } catch (error) {
          console.error('Error parsing stored batches:', error);
          // Fall back to mock data
          setDefaultBatches();
        }
      } else {
        // No stored batches, use default mock data
        setDefaultBatches();
      }
    }
  }, [status, canViewBatches]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  // Helper function to get trainer name by ID
  const getTrainerName = (trainerId?: string) => {
    if (!trainerId) return "";
    const trainer = trainers.find(t => t.id === trainerId);
    return trainer ? trainer.name : "";
  };

  // Update batch display to include trainer names
  useEffect(() => {
    if (trainers.length > 0 && batches.length > 0) {
      const updatedBatches = batches.map(batch => ({
        ...batch,
        trainerName: getTrainerName(batch.trainerId)
      }));
      setBatches(updatedBatches);
    }
  }, [trainers]);

  // Helper to set default mock batches
  const setDefaultBatches = () => {
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
    // Store in localStorage
    saveBatchesToStorage(mockBatches);
  };

  // Save batches to localStorage for persistence
  const saveBatchesToStorage = (updatedBatches: Batch[]) => {
    try {
      localStorage.setItem('verity-batches', JSON.stringify(updatedBatches));
      console.log("Saved batches to localStorage:", updatedBatches.length);
    } catch (error) {
      console.error("Error saving batches to localStorage:", error);
    }
  };

  // Apply status filter and pagination to batches
  const filteredBatches = batches.filter(batch => 
    filterStatus === "ALL" || batch.status === filterStatus
  );
  
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  const paginatedBatches = filteredBatches.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle pagination page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle creating or updating a batch
  const handleSubmitBatch = async (data: any) => {
    setIsLoading(true);

    try {
      // Convert the data to match the API expectations
      const batchData = {
        ...data,
        status: getStatus(data.startDate, data.endDate),
        traineeCount: data.trainees?.length || 0,
      };

      // Get trainer name if trainerId is provided
      let trainerName = "";
      if (data.trainerId) {
        const trainer = trainers.find(t => t.id === data.trainerId);
        trainerName = trainer ? trainer.name : "";
        console.log("Found trainer for ID:", data.trainerId, "Name:", trainerName);
      }

      let updatedBatches;
      let newBatch;

      if (editingBatch) {
        // Update existing batch
        updatedBatches = batches.map(batch => 
          batch.id === editingBatch.id 
            ? {
                ...batch,
                ...data,
                status: getStatus(data.startDate, data.endDate),
                trainerId: data.trainerId || null,
                trainerName: trainerName || null,
                startTime: data.startTime || null,
                endTime: data.endTime || null,
                meetingLink: data.trainingType === "ONLINE" ? data.meetingLink || null : null,
                venue: data.trainingType === "OFFLINE" ? data.venue || null : null,
                accommodation: data.trainingType === "OFFLINE" ? data.accommodation || null : null,
                travel: data.trainingType === "OFFLINE" ? data.travel || null : null,
              } 
            : batch
        );
      } else {
        // Create new batch
        newBatch = {
          id: `batch-${Date.now()}`, // Use timestamp for unique ID
          ...data,
          status: getStatus(data.startDate, data.endDate),
          traineeCount: data.trainees?.length || 0,
          trainerId: data.trainerId || null,
          trainerName: trainerName || null,
          startTime: data.startTime || null,
          endTime: data.endTime || null,
          meetingLink: data.trainingType === "ONLINE" ? data.meetingLink || null : null,
          venue: data.trainingType === "OFFLINE" ? data.venue || null : null,
          accommodation: data.trainingType === "OFFLINE" ? data.accommodation || null : null,
          travel: data.trainingType === "OFFLINE" ? data.travel || null : null,
        };
        
        console.log("Creating new batch:", newBatch);
        updatedBatches = [newBatch, ...batches];
      }

      // Save to API
      try {
        const apiEndpoint = editingBatch ? `/api/batches/${editingBatch.id}` : "/api/batches";
        const method = editingBatch ? "PUT" : "POST";
        
        const apiResponse = await fetch(apiEndpoint, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(editingBatch ? { ...data, id: editingBatch.id } : data),
        });
        
        if (!apiResponse.ok) {
          console.warn("API save failed, but continuing with localStorage save:", 
            await apiResponse.text());
        } else {
          console.log("Batch saved successfully to API");
        }
      } catch (apiError) {
        console.error("Error saving to API, continuing with localStorage save:", apiError);
      }

      // Update state and localStorage regardless of API success
      setBatches(updatedBatches);
      saveBatchesToStorage(updatedBatches);
      console.log("Updated batches in state and localStorage");

      // Reset form state
      setIsFormOpen(false);
      setEditingBatch(null);
    } catch (error) {
      console.error("Error saving batch:", error);
      // Show error to user
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to determine batch status based on dates
  const getStatus = (startDate: Date, endDate: Date): BatchStatus => {
    const now = new Date();
    if (now < startDate) return "UPCOMING";
    if (now > endDate) return "COMPLETED";
    return "ONGOING";
  };

  // Handle editing a batch
  const handleEditBatch = (batch: Batch) => {
    setEditingBatch(batch);
    setIsFormOpen(true);
  };

  // Handle deleting a batch
  const handleDeleteBatch = (batchId: string) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      const updatedBatches = batches.filter(batch => batch.id !== batchId);
      setBatches(updatedBatches);
      saveBatchesToStorage(updatedBatches);
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
              meetingLink: editingBatch.meetingLink || "",
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
            {paginatedBatches.map((batch) => (
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
                  {batch.trainingType === "ONLINE" && batch.meetingLink && (
                    <div className="text-xs text-blue-600 mt-1">
                      <a href={batch.meetingLink} target="_blank" rel="noopener noreferrer">
                        Meeting Link
                      </a>
                    </div>
                  )}
                  {batch.trainingType === "OFFLINE" && (
                    <div className="text-xs text-gray-500 mt-1">
                      {batch.venue && <div>Venue: {batch.venue}</div>}
                      {batch.accommodation && <div className="mt-1">Accommodation provided</div>}
                      {batch.travel && <div className="mt-1">Travel arranged</div>}
                    </div>
                  )}
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
                  {batch.trainerName || "Not Assigned"}
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
                      className="text-red-600"
                      onClick={() => handleDeleteBatch(batch.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedBatches.length === 0 && (
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

      {/* Pagination */}
      {filteredBatches.length > itemsPerPage && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
} 