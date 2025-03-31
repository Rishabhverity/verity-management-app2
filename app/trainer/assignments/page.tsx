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

// Updated Assignment type
type Assignment = {
  id: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  trainingType: TrainingType;
  meetingLink?: string | null;
  venue?: string | null;
  accommodation?: string | null;
  travel?: string | null;
  status: AssignmentStatus;
  traineeCount: number;
  trainerId?: string;
  trainerName?: string;
};

// For admin notifications
type Notification = {
  id: string;
  batchId: string;
  batchName: string;
  trainerId: string;
  trainerName: string;
  message: string;
  status: "UNREAD" | "READ";
  createdAt: Date;
};

// Mock data for testing if no assignments are found
const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "java-batch-demo",
    batchName: "Java Training",
    startDate: new Date("2025-04-01"),
    endDate: new Date("2025-04-01"),
    trainingType: "OFFLINE",
    venue: "bangalore, building no 5 near satya metro station",
    accommodation: "demo hotel",
    travel: "train no.987700, new delhi station",
    status: "PENDING",
    traineeCount: 10
  },
  {
    id: "backend-dev-demo",
    batchName: "Backend Development",
    startDate: new Date("2025-04-02"),
    endDate: new Date("2025-04-02"),
    trainingType: "ONLINE",
    meetingLink: "https://example.com/meeting",
    status: "PENDING",
    traineeCount: 11
  }
];

export default function TrainerAssignmentsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);
  const [filter, setFilter] = useState<AssignmentStatus | "ALL">("ALL");
  const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

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
    setUseMockData(false); // Reset mock data flag
    
    try {
      console.log("Session user:", session?.user);
      console.log("User ID:", session?.user?.id);
      console.log("User role:", session?.user?.role);

      // Always use mock data first for debugging the UI
      console.log("Setting mock data for UI testing");
      setAssignments(MOCK_ASSIGNMENTS);
      setUseMockData(true);
      setIsLoading(false);
      
      // Fetch batches from API in parallel
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
        
        // Filter batches for this trainer if not already filtered by API
        const userId = session?.user?.id;
        let trainerBatches = batchesFromApi;
        
        if (userId) {
          trainerBatches = batchesFromApi.filter((batch: any) => {
            if (!batch.trainerId) return false;
            return String(batch.trainerId).toLowerCase() === String(userId).toLowerCase();
          });
        }
        
        // Parse dates for the batches from API and ensure PENDING status for unprocessed assignments
        const parsedBatches = trainerBatches.map((batch: any) => ({
          ...batch,
          startDate: new Date(batch.startDate),
          endDate: new Date(batch.endDate),
          startTime: batch.startTime ? new Date(batch.startTime) : null,
          endTime: batch.endTime ? new Date(batch.endTime) : null,
          // Make sure newly assigned batches start with PENDING status if no status exists
          status: batch.status || batch.assignmentStatus || "PENDING",
        }));
        
        if (parsedBatches.length > 0) {
          // Only replace mock data if we found real batches
          setAssignments(parsedBatches);
          setUsingLocalStorage(false);
          setUseMockData(false);
          console.log("Using real data from API");
        } else {
          console.log("No batches found for this trainer, keeping mock data");
        }
      } else {
        console.log("No batches found in API response, keeping mock data");
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      setError("Failed to load your assigned batches. Using demo data for now.");
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
          setAssignments(MOCK_ASSIGNMENTS);
          setUseMockData(true);
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
        
        if (trainerBatches.length > 0) {
          // Parse dates and ensure PENDING status for unprocessed assignments
          const parsedBatches = trainerBatches.map((batch: any) => ({
            ...batch,
            startDate: new Date(batch.startDate),
            endDate: new Date(batch.endDate),
            startTime: batch.startTime ? new Date(batch.startTime) : null,
            endTime: batch.endTime ? new Date(batch.endTime) : null,
            // Make sure newly assigned batches start with PENDING status
            status: batch.status || batch.assignmentStatus || "PENDING",
          }));
          
          setAssignments(parsedBatches);
          setUsingLocalStorage(true);
          setUseMockData(false);
        } else {
          console.log("No batches found for this trainer in localStorage, using mock data for testing");
          setAssignments(MOCK_ASSIGNMENTS);
          setUseMockData(true);
        }
      } else {
        console.log("No batches found in localStorage, using mock data for testing");
        setAssignments(MOCK_ASSIGNMENTS);
        setUseMockData(true);
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      console.log("Using mock data due to error");
      setAssignments(MOCK_ASSIGNMENTS);
      setUseMockData(true);
    }
  }

  // Create a notification for admin when a trainer rejects a batch
  const createNotification = (assignment: Assignment, reason: string = "No reason provided") => {
    try {
      // Create notification object
      const notification: Notification = {
        id: `notification-${Date.now()}`,
        batchId: assignment.id,
        batchName: assignment.batchName,
        trainerId: session?.user?.id || "",
        trainerName: session?.user?.name || "Unknown Trainer",
        message: `Trainer has rejected the batch: ${reason}`,
        status: "UNREAD",
        createdAt: new Date()
      };
      
      console.log("Creating notification for admin:", notification);
      
      // Store in localStorage for this demo
      // In a real app, this would be sent to the server
      const storedNotifications = localStorage.getItem('verity-notifications') || "[]";
      const notifications = JSON.parse(storedNotifications);
      
      notifications.push(notification);
      localStorage.setItem('verity-notifications', JSON.stringify(notifications));
      
      console.log("Notification stored successfully");
      return true;
    } catch (error) {
      console.error("Error creating notification:", error);
      return false;
    }
  };

  const handleStatusChange = (assignmentId: string, newStatus: AssignmentStatus, reason?: string) => {
    console.log(`Changing status of assignment ${assignmentId} to ${newStatus}`);
    
    // Find the assignment being updated
    const assignment = assignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
      console.error(`Assignment with ID ${assignmentId} not found`);
      return;
    }
    
    // Create notification if rejecting
    if (newStatus === "REJECTED" && assignment) {
      const notificationCreated = createNotification(assignment, reason);
      if (notificationCreated) {
        // Show success message
        setShowSuccessMessage("Admin has been notified of your decision.");
        setTimeout(() => setShowSuccessMessage(null), 5000); // Clear after 5 seconds
      } else {
        setShowSuccessMessage("Failed to notify admin. Your decision was recorded.");
        setTimeout(() => setShowSuccessMessage(null), 5000);
      }
    } else if (newStatus === "ACCEPTED") {
      setShowSuccessMessage("You have accepted this training assignment.");
      setTimeout(() => setShowSuccessMessage(null), 5000);
    }
    
    // Update state
    setAssignments(prev => 
      prev.map(assignment => 
        assignment.id === assignmentId ? { ...assignment, status: newStatus } : assignment
      )
    );
    
    // Skip localStorage update for mock data
    if (useMockData) {
      console.log("Using mock data, skipping localStorage update");
      return;
    }
    
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
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusVariant = (status: AssignmentStatus) => {
    switch(status) {
      case "ACCEPTED": return "success";
      case "REJECTED": return "destructive";
      case "COMPLETED": return "default";
      case "PENDING": return "outline";
      default: return "secondary";
    }
  };

  const filteredAssignments = filter === "ALL" 
    ? assignments 
    : assignments.filter(a => a.status === filter);

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Training Assignment Requests</h1>
        <Button onClick={fetchAssignedBatches} variant="outline" className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {showSuccessMessage && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <AlertDescription>{showSuccessMessage}</AlertDescription>
        </Alert>
      )}
      
      {useMockData && (
        <Alert className="bg-amber-50 text-amber-800 border-amber-200">
          <AlertDescription>
            Using demonstration data for testing. In a real environment, you would see your actual assigned batches.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button 
          onClick={() => setFilter("ALL")} 
          variant={filter === "ALL" ? "default" : "outline"}
        >
          All
        </Button>
        <Button 
          onClick={() => setFilter("PENDING")} 
          variant={filter === "PENDING" ? "default" : "outline"}
        >
          Pending
        </Button>
        <Button 
          onClick={() => setFilter("ACCEPTED")} 
          variant={filter === "ACCEPTED" ? "default" : "outline"}
        >
          Accepted
        </Button>
        <Button 
          onClick={() => setFilter("REJECTED")} 
          variant={filter === "REJECTED" ? "default" : "outline"}
        >
          Rejected
        </Button>
        <Button 
          onClick={() => setFilter("COMPLETED")} 
          variant={filter === "COMPLETED" ? "default" : "outline"}
        >
          Completed
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <span className="ml-2 text-lg">Loading assignments...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <h2 className="text-xl font-semibold text-gray-700">No assignments found</h2>
          <p className="text-gray-500 mt-2">
            {filter !== "ALL" 
              ? `You don't have any ${filter.toLowerCase()} assignments.` 
              : "You don't have any training assignments at this time."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{assignment.batchName}</CardTitle>
                  <Badge variant={getStatusVariant(assignment.status)}>
                    {assignment.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {formatDate(assignment.startDate)} - {formatDate(assignment.endDate)}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Type:</span>
                    <span>{assignment.trainingType}</span>
                  </div>
                  
                  {assignment.trainingType === "ONLINE" && assignment.meetingLink && (
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Meeting Link:</span>
                      <a 
                        href={assignment.meetingLink.startsWith("http") ? assignment.meetingLink : "#"} 
                        className="text-blue-600 hover:underline"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        Join Meeting
                      </a>
                    </div>
                  )}
                  
                  {assignment.trainingType === "OFFLINE" && (
                    <>
                      {assignment.venue && (
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Venue:</span>
                          <span>{assignment.venue}</span>
                        </div>
                      )}
                      
                      {assignment.accommodation && (
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Accommodation:</span>
                          <span>{assignment.accommodation}</span>
                        </div>
                      )}
                      
                      {assignment.travel && (
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">Travel:</span>
                          <span>{assignment.travel}</span>
                        </div>
                      )}
                    </>
                  )}
                  
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">Trainees:</span>
                    <span>{assignment.traineeCount}</span>
                  </div>
                </div>
                
                <Separator />
                
                {/* Always show Accept/Decline buttons for PENDING status or for mock data */}
                {(assignment.status === "PENDING" || useMockData) && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleStatusChange(assignment.id, "ACCEPTED")}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button 
                      onClick={() => {
                        const reason = prompt("Please provide a reason for rejecting this class:");
                        if (reason !== null) {
                          handleStatusChange(assignment.id, "REJECTED", reason);
                        }
                      }}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}
                
                {assignment.status === "ACCEPTED" && !useMockData && (
                  <div className="text-center">
                    <div className="text-green-600 font-medium mb-2">You've accepted this training assignment</div>
                    {assignment.trainingType === "ONLINE" && assignment.meetingLink && (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(assignment.meetingLink as string, "_blank")}
                      >
                        Join Meeting
                      </Button>
                    )}
                  </div>
                )}
                
                {assignment.status === "REJECTED" && !useMockData && (
                  <div className="text-center text-gray-500">
                    You've declined this training assignment. 
                    The admin has been notified of your decision.
                  </div>
                )}
                
                {assignment.status === "COMPLETED" && !useMockData && (
                  <div className="text-center text-green-600 font-medium">
                    This training has been completed. Thank you!
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 