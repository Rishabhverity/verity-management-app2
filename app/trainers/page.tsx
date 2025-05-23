"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Define the Trainer type for TypeScript
type Trainer = {
  id: string;
  name: string;
  email: string;
  specialization: string;
  availability: boolean;
  assignedBatches?: number;
  createdAt?: string;
};

export default function TrainersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch trainers from the API
  useEffect(() => {
    const fetchTrainers = async () => {
      if (status === "authenticated" && session) {
        try {
          setIsLoading(true);
          
          // Fetch all trainers
          const trainersResponse = await fetch("/api/trainers");
          
          if (!trainersResponse.ok) {
            throw new Error("Failed to fetch trainers");
          }
          
          const trainersData = await trainersResponse.json();
          
          // Fetch all batches to count assignments
          const batchesResponse = await fetch("/api/batches");
          let batchesData = [];
          
          if (batchesResponse.ok) {
            const response = await batchesResponse.json();
            // Ensure batchesData is an array
            batchesData = Array.isArray(response) ? response : [];
          }
          
          // Process each trainer to add the assigned batches count
          const processedTrainers = trainersData.map((trainer: Trainer) => {
            // Count batches assigned to this trainer
            const assignedBatchesCount = batchesData.filter(
              (batch: any) => batch.trainerId === trainer.id
            ).length;
            
            return {
              ...trainer,
              assignedBatches: assignedBatchesCount
            };
          });
          
          setTrainers(processedTrainers);
          setError("");
        } catch (err) {
          console.error("Error fetching trainers:", err);
          setError("Failed to load trainers. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchTrainers();
  }, [session, status]);

  // Check if user has permission to view trainers
  const userRole = session?.user?.role ? String(session.user.role).toUpperCase() : "";
  const canViewTrainers = userRole === "OPERATIONS" || userRole === "ADMIN";

  // Filter trainers based on search query and availability
  const filteredTrainers = trainers.filter((trainer) => {
    const matchesSearch = 
      trainer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAvailability = 
      availabilityFilter === null || trainer.availability === availabilityFilter;
    
    return matchesSearch && matchesAvailability;
  });

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] bg-white">
        <div className="text-xl text-gray-700">Loading trainers...</div>
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

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trainers</h1>
        <Button onClick={() => router.push("/admin/register")}>
          Create New Trainer
        </Button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 p-4 rounded-lg border border-red-200 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search Trainers
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or specialization..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={availabilityFilter === null ? "default" : "outline"}
              size="sm"
              onClick={() => setAvailabilityFilter(null)}
            >
              All
            </Button>
            <Button
              variant={availabilityFilter === true ? "default" : "outline"}
              size="sm"
              onClick={() => setAvailabilityFilter(true)}
            >
              Available
            </Button>
            <Button
              variant={availabilityFilter === false ? "default" : "outline"}
              size="sm"
              onClick={() => setAvailabilityFilter(false)}
            >
              Unavailable
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Trainer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Specialization
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Availability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Assigned Batches
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTrainers.length > 0 ? (
              filteredTrainers.map((trainer) => (
                <tr key={trainer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {trainer.name}
                        </div>
                        <div className="text-sm text-gray-700">
                          {trainer.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {trainer.specialization}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${trainer.availability ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                    >
                      {trainer.availability ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {trainer.assignedBatches}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/trainer/profile/${trainer.id}`)}
                      >
                        View Profile
                      </Button>
                      {trainer.availability && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-blue-600"
                          onClick={() => router.push(`/trainers/${trainer.id}/assign-batch`)}
                        >
                          Assign to Batch
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-700"
                >
                  {searchQuery || availabilityFilter !== null
                    ? "No trainers found matching your filters"
                    : "No trainers available. Create your first trainer!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 