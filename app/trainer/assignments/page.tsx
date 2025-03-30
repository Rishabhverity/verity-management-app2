"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, X, RefreshCcw } from "lucide-react";

type TrainingType = "ONLINE" | "OFFLINE";
type AssignmentStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "COMPLETED";

type Assignment = {
  id: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  trainingType: TrainingType;
  meetingLink: string | null;
  venue: string | null;
  accommodation: string | null;
  travel: string | null;
  status: AssignmentStatus;
  traineeCount: number;
  trainerId?: string;
};

export default function TrainerAssignmentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);
  const [filter, setFilter] = useState<AssignmentStatus | "ALL">("ALL");

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      setError("You must be logged in to view your assignments");
      setIsLoading(false);
      return;
    }

    fetchAssignedBatches();
  }, [session, sessionStatus]);

  async function fetchAssignedBatches() {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Session user:", session?.user);
      console.log("User ID:", session?.user?.id);
      console.log("User role:", session?.user?.role);

      // Fetch batches from API
      console.log("Fetching batches from API...");
      const response = await fetch('/api/batches');
      
      if (!response.ok) {
        console.error("API response not OK:", response.status, response.statusText);
        throw new Error(`Failed to fetch batches: ${response.status} ${response.statusText}`);
      }
      
      const batchesFromApi = await response.json();
      console.log("Batches fetched from API:", batchesFromApi);
      
      if (batchesFromApi && batchesFromApi.length > 0) {
        console.log(`Found ${batchesFromApi.length} batches from API`);
        
        // Parse dates for the batches from API
        const parsedBatches = batchesFromApi.map((batch: any) => ({
          ...batch,
          startDate: new Date(batch.startDate),
          endDate: new Date(batch.endDate),
          startTime: batch.startTime ? new Date(batch.startTime) : null,
          endTime: batch.endTime ? new Date(batch.endTime) : null,
          status: batch.status || "PENDING",
        }));
        
        setAssignments(parsedBatches);
        setUsingLocalStorage(false);
      } else {
        console.log("No batches found in API response, checking localStorage");
        // Fallback to localStorage if no batches from API
        fallbackToLocalStorage();
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      setError("Failed to load your assigned batches. Using local data as fallback.");
      // Fallback to localStorage in case of API error
      fallbackToLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }

  function fallbackToLocalStorage() {
    try {
      console.log("Attempting to use localStorage as fallback");
      const storedBatches = localStorage.getItem('verity-batches');
      
      if (storedBatches) {
        const allBatches = JSON.parse(storedBatches);
        console.log("All batches from localStorage:", allBatches);
        
        const userId = session?.user?.id;
        console.log("Current user ID for filtering:", userId);
        
        if (!userId) {
          console.error("No user ID found in session");
          setAssignments([]);
          return;
        }
        
        // Filter batches assigned to this trainer
        const trainerBatches = allBatches.filter((batch: any) => {
          if (!batch.trainerId) {
            console.log(`Batch ${batch.id} has no trainerId, skipping`);
            return false;
          }
          
          const batchTrainerId = String(batch.trainerId).toLowerCase();
          const sessionUserId = String(userId).toLowerCase();
          
          console.log(`Comparing batch.trainerId (${batchTrainerId}) with userId (${sessionUserId})`);
          const isMatch = batchTrainerId === sessionUserId;
          console.log(`Match for batch ${batch.id}: ${isMatch}`);
          
          return isMatch;
        });
        
        console.log(`Found ${trainerBatches.length} batches assigned to trainer in localStorage`);
        
        // Parse dates
        const parsedBatches = trainerBatches.map((batch: any) => ({
          ...batch,
          startDate: new Date(batch.startDate),
          endDate: new Date(batch.endDate),
          startTime: batch.startTime ? new Date(batch.startTime) : null,
          endTime: batch.endTime ? new Date(batch.endTime) : null,
          status: batch.status || "PENDING",
        }));
        
        setAssignments(parsedBatches);
        setUsingLocalStorage(true);
      } else {
        console.log("No batches found in localStorage");
        setAssignments([]);
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      setAssignments([]);
    }
  }

  const handleStatusChange = (assignmentId: string, newStatus: AssignmentStatus) => {
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === assignmentId ? { ...assignment, status: newStatus } : assignment
      )
    );
    
    // In a real app, you would also update this status via an API call
    try {
      // Also update localStorage to persist between page refreshes
      const storedBatches = localStorage.getItem('verity-batches');
      if (storedBatches) {
        const batches = JSON.parse(storedBatches);
        const updatedBatches = batches.map((batch: any) => 
          batch.id === assignmentId ? { ...batch, status: newStatus } : batch
        );
        localStorage.setItem('verity-batches', JSON.stringify(updatedBatches));
        console.log(`Updated status of batch ${assignmentId} to ${newStatus} in localStorage`);
      }
    } catch (error) {
      console.error("Error updating localStorage:", error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Filter assignments based on selected status
  const filteredAssignments = filter === "ALL" 
    ? assignments 
    : assignments.filter(assignment => assignment.status === filter);

  const getStatusVariant = (status: AssignmentStatus) => {
    switch (status) {
      case "PENDING": return "default";
      case "ACCEPTED": return "success";
      case "REJECTED": return "destructive";
      case "COMPLETED": return "outline";
      default: return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-2 text-lg">Loading your assignments...</span>
      </div>
    );
  }

  if (error && assignments.length === 0) {
    return (
      <Alert className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Training Assignment Requests</h1>
        <Button onClick={() => fetchAssignedBatches()} variant="outline" size="sm">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {usingLocalStorage && (
        <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
          <AlertDescription>
            Using locally stored data. Connection to server unavailable.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-wrap gap-2 mb-4">
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

      {filteredAssignments.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold text-gray-600">No assignments found</h2>
          <p className="text-gray-500 mt-2">
            {filter === "ALL" 
              ? "You don't have any training assignments yet."
              : `You don't have any ${filter.toLowerCase()} assignments.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{assignment.batchName}</CardTitle>
                  <Badge variant={getStatusVariant(assignment.status)}>
                    {assignment.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div>
                    <strong>Type:</strong> {assignment.trainingType}
                  </div>
                  {assignment.trainingType === "ONLINE" && assignment.meetingLink && (
                    <div>
                      <strong>Meeting Link:</strong>{" "}
                      <a href={assignment.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Join Meeting
                      </a>
                    </div>
                  )}
                  {assignment.trainingType === "OFFLINE" && (
                    <>
                      {assignment.venue && (
                        <div>
                          <strong>Venue:</strong> {assignment.venue}
                        </div>
                      )}
                      {assignment.accommodation && (
                        <div>
                          <strong>Accommodation:</strong> {assignment.accommodation}
                        </div>
                      )}
                      {assignment.travel && (
                        <div>
                          <strong>Travel:</strong> {assignment.travel}
                        </div>
                      )}
                    </>
                  )}
                  <div>
                    <strong>Trainees:</strong> {assignment.traineeCount}
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="space-y-2">
                  {assignment.status === "PENDING" && (
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleStatusChange(assignment.id, "ACCEPTED")}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        onClick={() => handleStatusChange(assignment.id, "REJECTED")}
                        variant="destructive"
                        className="flex-1"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  )}
                  
                  {assignment.status === "ACCEPTED" && (
                    <Button 
                      onClick={() => handleStatusChange(assignment.id, "COMPLETED")}
                      className="w-full"
                    >
                      Mark as Completed
                    </Button>
                  )}
                  
                  {assignment.status === "REJECTED" && (
                    <Button 
                      onClick={() => handleStatusChange(assignment.id, "PENDING")}
                      variant="outline"
                      className="w-full"
                    >
                      Reconsider
                    </Button>
                  )}
                  
                  {assignment.status === "COMPLETED" && (
                    <div className="text-center text-sm text-gray-500 italic">
                      This training assignment has been completed
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 