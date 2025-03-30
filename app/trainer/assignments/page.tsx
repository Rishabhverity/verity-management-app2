"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TrainingType, AssignmentStatus } from "@prisma/client";

// Mock data for sample assignments
// In a real app, this would come from an API call
const MOCK_ASSIGNMENTS = [
  {
    id: "1",
    batchName: "React Fundamentals Batch",
    startDate: new Date(2023, 8, 15),
    endDate: new Date(2023, 9, 15),
    trainingType: "ONLINE" as TrainingType,
    meetingLink: "https://meet.google.com/abc-defg-hij",
    venue: null,
    accommodation: null,
    travel: null,
    status: "ACCEPTED" as AssignmentStatus,
    traineeCount: 12
  },
  {
    id: "2",
    batchName: "Advanced JavaScript",
    startDate: new Date(2023, 10, 1),
    endDate: new Date(2023, 11, 1),
    trainingType: "OFFLINE" as TrainingType,
    meetingLink: null,
    venue: "TechHub, Floor 3, Building 2",
    accommodation: "Hotel Grand, Room 405",
    travel: "Flight tickets confirmed",
    status: "PENDING" as AssignmentStatus,
    traineeCount: 8
  },
  {
    id: "3",
    batchName: "Web Security Workshop",
    startDate: new Date(2024, 0, 10),
    endDate: new Date(2024, 0, 15),
    trainingType: "ONLINE" as TrainingType,
    meetingLink: "https://zoom.us/j/123456789",
    venue: null,
    accommodation: null,
    travel: null,
    status: "PENDING" as AssignmentStatus,
    traineeCount: 20
  }
];

export default function TrainerAssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState(MOCK_ASSIGNMENTS);
  const [filter, setFilter] = useState<AssignmentStatus | "ALL">("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check if user is a trainer
  const isTrainer = session?.user?.role === "TRAINER";

  // Fetch assigned batches when the component mounts
  useEffect(() => {
    function getAssignedBatches() {
      if (status === "authenticated" && isTrainer) {
        setLoading(true);
        try {
          // Get batches from localStorage instead of API
          const storedBatches = localStorage.getItem('verity-batches');
          
          if (storedBatches) {
            // Parse the JSON string
            const parsedBatches = JSON.parse(storedBatches, (key, value) => {
              // Convert date strings back to Date objects
              if (key === 'startDate' || key === 'endDate' || key === 'startTime' || key === 'endTime') {
                return value ? new Date(value) : null;
              }
              return value;
            });
            
            // For demo purposes, filter batches where trainerId matches "trainer-demo" 
            // OR where trainerId equals the session user id (if available)
            const trainerBatches = parsedBatches.filter(
              (batch: any) => 
                batch.trainerId === "trainer-demo" || 
                (session.user.id && batch.trainerId === session.user.id)
            );

            // Convert batches to assignment format
            const trainerAssignments = trainerBatches.map((batch: any) => ({
              id: batch.id,
              batchName: batch.batchName,
              startDate: new Date(batch.startDate),
              endDate: new Date(batch.endDate),
              trainingType: batch.trainingType,
              meetingLink: batch.meetingLink || null,
              venue: batch.venue || null,
              accommodation: batch.accommodation || null,
              travel: batch.travel || null,
              status: batch.assignmentStatus || "PENDING",
              traineeCount: batch.traineeCount || 0
            }));

            if (trainerAssignments.length > 0) {
              setAssignments(trainerAssignments);
            } else {
              // No assignments found in localStorage, use mock data
              setAssignments(MOCK_ASSIGNMENTS);
            }
          } else {
            // No batches in localStorage, use mock data
            setAssignments(MOCK_ASSIGNMENTS);
          }
        } catch (error) {
          console.error("Error fetching assigned batches:", error);
          // Fall back to mock data on error
          setAssignments(MOCK_ASSIGNMENTS);
        } finally {
          setLoading(false);
        }
      }
    }

    getAssignedBatches();
  }, [status, isTrainer, session]);

  const handleStatusChange = (assignmentId: string, newStatus: AssignmentStatus) => {
    setAssignments((prev) =>
      prev.map((assignment) =>
        assignment.id === assignmentId
          ? { ...assignment, status: newStatus }
          : assignment
      )
    );
  };

  const filteredAssignments =
    filter === "ALL"
      ? assignments
      : assignments.filter((assignment) => assignment.status === filter);

  if (status === "loading" || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] bg-white">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  if (!isTrainer) {
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
        <h1 className="text-2xl font-bold text-gray-900">My Training Assignments</h1>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ALL")}
          >
            All
          </Button>
          <Button
            variant={filter === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("PENDING")}
          >
            Pending
          </Button>
          <Button
            variant={filter === "ACCEPTED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ACCEPTED")}
          >
            Accepted
          </Button>
          <Button
            variant={filter === "REJECTED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("REJECTED")}
          >
            Rejected
          </Button>
          <Button
            variant={filter === "COMPLETED" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("COMPLETED")}
          >
            Completed
          </Button>
        </div>
      </div>

      {filteredAssignments.length === 0 ? (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-700 mb-4">No assignments found for the selected filter.</p>
          {filter !== "ALL" ? (
            <Button onClick={() => setFilter("ALL")}>Show All Assignments</Button>
          ) : (
            <div className="text-gray-700 mt-4">
              <p>You don't have any assigned batches yet.</p>
              <p className="mt-2">Check back later or contact the operations team if you believe this is an error.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAssignments.map((assignment) => (
            <div
              key={assignment.id}
              className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {assignment.batchName}
                    </h2>
                    <p className="mt-1 text-sm text-gray-700">
                      {assignment.startDate.toLocaleDateString()} - {assignment.endDate.toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        assignment.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : assignment.status === "ACCEPTED"
                          ? "bg-green-100 text-green-800"
                          : assignment.status === "REJECTED"
                          ? "bg-red-100 text-red-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                  >
                    {assignment.status}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Training Type</h3>
                    <p className="mt-1 text-sm text-gray-900">{assignment.trainingType}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Number of Trainees</h3>
                    <p className="mt-1 text-sm text-gray-900">{assignment.traineeCount}</p>
                  </div>
                  {assignment.trainingType === "ONLINE" && assignment.meetingLink && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Meeting Link</h3>
                      <p className="mt-1 text-sm text-blue-600 hover:underline">
                        <a href={assignment.meetingLink} target="_blank" rel="noreferrer">
                          {assignment.meetingLink}
                        </a>
                      </p>
                    </div>
                  )}
                  {assignment.trainingType === "OFFLINE" && (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Venue</h3>
                        <p className="mt-1 text-sm text-gray-900">{assignment.venue}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Accommodation</h3>
                        <p className="mt-1 text-sm text-gray-900">{assignment.accommodation}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700">Travel Arrangements</h3>
                        <p className="mt-1 text-sm text-gray-900">{assignment.travel}</p>
                      </div>
                    </>
                  )}
                </div>

                {assignment.status === "PENDING" && (
                  <div className="mt-6 flex justify-end space-x-3">
                    <Button
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleStatusChange(assignment.id, "REJECTED")}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleStatusChange(assignment.id, "ACCEPTED")}
                    >
                      Accept
                    </Button>
                  </div>
                )}

                {assignment.status === "ACCEPTED" && (
                  <div className="mt-6 flex justify-end">
                    <Button
                      onClick={() => router.push(`/trainer/materials?batchId=${assignment.id}`)}
                    >
                      Manage Materials
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 