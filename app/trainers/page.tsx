"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

// Mock data for sample trainers
// In a real app, this would come from an API call
const MOCK_TRAINERS = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    specialization: "Web Development",
    availability: true,
    assignedBatches: 1
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    specialization: "Data Science",
    availability: true,
    assignedBatches: 1
  },
  {
    id: "3",
    name: "Robert Johnson",
    email: "robert.j@example.com",
    specialization: "Cloud Computing",
    availability: false,
    assignedBatches: 2
  },
  {
    id: "4",
    name: "Emily Chen",
    email: "emily.chen@example.com",
    specialization: "Cybersecurity",
    availability: true,
    assignedBatches: 0
  }
];

export default function TrainersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trainers, setTrainers] = useState(MOCK_TRAINERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check if user has permission to view trainers
  const canViewTrainers = session?.user?.role === "OPERATIONS";

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

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh] bg-white">
        <div className="text-xl text-gray-700">Loading...</div>
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
        <Button onClick={() => router.push("/trainers/invite")}>
          Invite New Trainer
        </Button>
      </div>

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
            {filteredTrainers.map((trainer) => (
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
                      onClick={() => router.push(`/trainers/${trainer.id}`)}
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
            ))}
            {filteredTrainers.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-10 text-center text-sm text-gray-700"
                >
                  No trainers found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 