"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";

interface TrainingType {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  batchName: string;
  trainees?: { id: string; name: string; email?: string | null }[];
  startDate: Date;
  endDate: Date;
  trainerId: string;
  trainingType: "ONLINE" | "OFFLINE" | "HYBRID";
  status: string;
  isAssignedToCurrentTrainer?: boolean;
}

interface AcceptedAssignment {
  batchId: string;
  trainerId: string;
  trainerName: string;
  status: 'ACCEPTED' | 'DECLINED';
  timestamp: number;
  declineReason?: string;
}

interface Notification {
  id: string;
  batchId: string;
  batchName: string;
  trainerId: string;
  trainerName: string;
  message: string;
  status: "UNREAD" | "READ";
  createdAt: Date;
}

const TrainerAssignmentsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [declineDialogOpen, setDeclineDialogOpen] = useState<boolean>(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [declineReason, setDeclineReason] = useState<string>("");
  const [acceptedAssignments, setAcceptedAssignments] = useState<AcceptedAssignment[]>([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(6);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Add state for showing debug panel
  const [showDebug, setShowDebug] = useState<boolean>(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      fetchAssignedBatches();
      // Load accepted assignments from localStorage
      const savedAssignments = getAcceptedAssignments();
      setAcceptedAssignments(savedAssignments);
    }
  }, [status, session]);

  const fetchAssignedBatches = async () => {
    setLoading(true);
    try {
      console.log("Fetching assigned batches for trainer:", session?.user?.id);
      
      const response = await fetch("/api/batches");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch batches: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API response data:", data);
      
      // Check if batches array exists
      if (!data.batches || !Array.isArray(data.batches)) {
        console.error("Invalid API response - no batches array:", data);
        setBatches([]);
        setLoading(false);
        return;
      }
      
      // Filter for batches assigned to this trainer
      const assignedBatches = data.batches.filter(
        (batch: Batch) => {
          const isAssigned = batch.isAssignedToCurrentTrainer;
          console.log(`Batch ${batch.id} (${batch.batchName}) assigned to current trainer: ${isAssigned}`);
          return isAssigned;
        }
      );
      
      console.log("Batches assigned to this trainer:", assignedBatches.length);
      assignedBatches.forEach((batch: Batch) => {
        console.log(` - ${batch.id}: ${batch.batchName}, Trainees: ${batch.trainees?.length || 0}`);
      });
      
      // Get accepted assignments from localStorage
      const savedAssignments = getAcceptedAssignments();
      console.log("Saved assignments:", savedAssignments);
      
      // Determine which batches have already been accepted/declined
      assignedBatches.forEach((batch: Batch) => {
        const assignment = savedAssignments.find(a => a.batchId === batch.id);
        if (assignment) {
          console.log(`Batch ${batch.id} already has status: ${assignment.status}`);
        } else {
          console.log(`Batch ${batch.id} has no saved status yet`);
        }
      });
      
      setBatches(assignedBatches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Failed to load assigned batches");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBatches = async () => {
    setLoading(true);
    try {
      console.log("Fetching ALL batches (bypass assignment filter)");
      
      const response = await fetch("/api/batches");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch batches: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API response all batches:", data);
      
      // Check if batches array exists
      if (!data.batches || !Array.isArray(data.batches)) {
        console.error("Invalid API response - no batches array:", data);
        setBatches([]);
        setLoading(false);
        return;
      }
      
      // Show all batches without filtering
      const allBatches = data.batches;
      console.log("Total batches available in system:", allBatches.length);
      allBatches.forEach((batch: Batch) => {
        console.log(` - ${batch.id}: ${batch.batchName}, Trainer: ${batch.trainerId}, Assigned: ${batch.isAssignedToCurrentTrainer}`);
      });
      
      // Set all batches to show them
      setBatches(allBatches);
    } catch (error) {
      console.error("Error fetching all batches:", error);
      toast.error("Failed to load all batches");
    } finally {
      setLoading(false);
    }
  };

  const getAcceptedAssignments = (): AcceptedAssignment[] => {
    try {
      if (typeof window === 'undefined') return [];
      
      const saved = localStorage.getItem('trainer-assignments');
      if (!saved) return [];
      
      const assignments = JSON.parse(saved);
      // Filter for assignments by this trainer
      return assignments.filter(
        (assignment: AcceptedAssignment) => 
          assignment.trainerId === session?.user?.id
      );
    } catch (error) {
      console.error("Error parsing stored assignments:", error);
      return [];
    }
  };

  const handleDeclineClick = (batch: Batch) => {
    setSelectedBatch(batch);
    setDeclineReason("");
    setDeclineDialogOpen(true);
  };

  const handleDeclineCancel = () => {
    setSelectedBatch(null);
    setDeclineReason("");
    setDeclineDialogOpen(false);
  };

  const handleDeclineSubmit = () => {
    if (!selectedBatch) return;
    
    if (!declineReason.trim()) {
      toast.error("Please provide a reason for declining");
      return;
    }
    
    handleStatusChange(selectedBatch, 'DECLINED', declineReason);
    setDeclineDialogOpen(false);
    setDeclineReason("");
    setSelectedBatch(null);
  };

  const handleStatusChange = async (batch: Batch, status: 'ACCEPTED' | 'DECLINED', reason?: string) => {
    try {
      // In a real app, you would call an API to update the status
      // For demo purposes, we'll just update the UI and localStorage
      console.log(`Training ${batch.batchName} ${status.toLowerCase()}`);
      
      // Create a copy of the batches with the updated status
      const updatedBatches = batches.map(b => 
        b.id === batch.id 
          ? { ...b, status: status } 
          : b
      );
      
      setBatches(updatedBatches);
      
      // Save to localStorage
      saveAcceptedAssignment(batch, status, reason);
      
      if (status === 'ACCEPTED') {
        toast.success(`Training "${batch.batchName}" accepted successfully`);
      } else {
        toast.success(`Training "${batch.batchName}" declined successfully`);
        // Create notification for admin
        createNotification(batch, reason || "No reason provided");
      }
    } catch (error) {
      console.error(`Error ${status.toLowerCase()} training:`, error);
      toast.error(`Failed to ${status.toLowerCase()} training`);
    }
  };

  const saveAcceptedAssignment = (batch: Batch, status: 'ACCEPTED' | 'DECLINED', reason?: string) => {
    try {
      // Get existing assignments from localStorage
      const existingData = localStorage.getItem('trainer-assignments') || "[]";
      const assignments: AcceptedAssignment[] = JSON.parse(existingData);
      
      // Create a new assignment
      const assignment: AcceptedAssignment = {
        batchId: batch.id,
        trainerId: session?.user?.id || "",
        trainerName: session?.user?.name || "Trainer",
        status,
        timestamp: Date.now(),
        declineReason: reason
      };
      
      // Remove any existing assignment for this batch
      const filteredAssignments = assignments.filter(
        a => !(a.batchId === batch.id && a.trainerId === session?.user?.id)
      );
      
      // Add the new assignment
      const updatedAssignments = [...filteredAssignments, assignment];
      
      // Save back to localStorage
      localStorage.setItem('trainer-assignments', JSON.stringify(updatedAssignments));
      
      // Update state
      setAcceptedAssignments(updatedAssignments.filter(
        a => a.trainerId === session?.user?.id
      ));
      
      console.log("Updated assignments:", updatedAssignments);
      
      // If ACCEPTED, save batch data to also be accessible from students page
      if (status === 'ACCEPTED') {
        // Save the batch with trainees to localStorage to ensure it's accessible
        const savedBatches = JSON.parse(localStorage.getItem('trainer-batches') || "[]");
        
        // Remove any existing version of this batch
        const filteredBatches = savedBatches.filter((b: any) => b.id !== batch.id);
        
        // Ensure trainee data is preserved correctly
        let traineeData = batch.trainees || [];
        
        // Log the original trainee data for debugging
        console.log("Original trainee data:", traineeData);
        
        // Make sure each trainee has all required fields
        traineeData = traineeData.map((trainee, index) => {
          // Check if the trainee data is complete
          if (!trainee.name || trainee.name === 'Student' || trainee.name.startsWith('Student ')) {
            console.warn(`Found incomplete trainee data at index ${index}:`, trainee);
          }
          
          return {
            id: trainee.id || `student-${Date.now()}-${index}`,
            name: trainee.name || `Student ${index + 1}`,
            email: trainee.email || null
          };
        });
        
        console.log("Processed trainee data for storage:", traineeData);
        
        // Fetch additional trainee data from API if needed
        const fetchCompleteTraineeData = async () => {
          try {
            // If trainees array is empty or names are missing, try to get from API
            if (traineeData.length === 0 || traineeData.some(t => !t.name || t.name === 'Student')) {
              console.log("Trainee data incomplete, fetching from API...");
              
              const response = await fetch(`/api/batches/${batch.id}`);
              if (response.ok) {
                const data = await response.json();
                if (data.batch && data.batch.trainees && data.batch.trainees.length > 0) {
                  console.log("Retrieved complete trainee data from API:", data.batch.trainees);
                  traineeData = data.batch.trainees;
                }
              }
            }
            
            // Add the updated batch with all its data
            filteredBatches.push({
              ...batch,
              trainees: traineeData,
              isAccepted: true,
              acceptedAt: Date.now()
            });
            
            // Save back to localStorage
            localStorage.setItem('trainer-batches', JSON.stringify(filteredBatches));
            console.log("Saved batch details with complete trainee data:", traineeData.length, "trainees");
          } catch (error) {
            console.error("Error fetching complete trainee data:", error);
            
            // Still save what we have even if fetch fails
            filteredBatches.push({
              ...batch,
              trainees: traineeData,
              isAccepted: true,
              acceptedAt: Date.now()
            });
            
            localStorage.setItem('trainer-batches', JSON.stringify(filteredBatches));
          }
        };
        
        // Call the async function
        fetchCompleteTraineeData();
      }
    } catch (error) {
      console.error("Error saving assignment:", error);
    }
  };

  const createNotification = (batch: Batch, reason: string) => {
    try {
      // Create a new notification for the admin
      const notification: Notification = {
        id: `notification-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        batchId: batch.id,
        batchName: batch.batchName,
        trainerId: session?.user?.id || "",
        trainerName: session?.user?.name || "Trainer",
        message: `Training declined. Reason: ${reason}`,
        status: "UNREAD",
        createdAt: new Date()
      };
      
      // Get existing notifications
      const existingData = localStorage.getItem('verity-notifications') || "[]";
      const notifications: Notification[] = JSON.parse(existingData);
      
      // Add the new notification
      const updatedNotifications = [...notifications, notification];
      
      // Save back to localStorage
      localStorage.setItem('verity-notifications', JSON.stringify(updatedNotifications));
      
      console.log("Notification created:", notification);
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  const getBatchStatus = (batch: Batch): string => {
    const assignment = acceptedAssignments.find(
      a => a.batchId === batch.id && a.trainerId === session?.user?.id
    );
    
    if (assignment) {
      return assignment.status;
    }
    
    return "PENDING";
  };

  // Filter batches based on search term if provided
  const filteredBatches = batches.filter(batch => {
    if (!searchTerm.trim()) return true;
    
    const term = searchTerm.toLowerCase();
    return (
      batch.batchName.toLowerCase().includes(term) ||
      batch.trainingType.toLowerCase().includes(term)
    );
  });
  
  // Get current page batches
  const indexOfLastBatch = currentPage * itemsPerPage;
  const indexOfFirstBatch = indexOfLastBatch - itemsPerPage;
  const currentBatches = filteredBatches.slice(indexOfFirstBatch, indexOfLastBatch);
  
  // Calculate total pages
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);
  
  // Change page
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };
  
  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  if (status === "loading" || loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Trainer Assignments</h1>
        <div className="text-center py-10">Loading assignments...</div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Trainer Assignments</h1>
        <div className="bg-red-100 p-4 rounded">
          Please log in to view your assignments
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Training Assignments</h1>
        <div className="flex gap-2">
          <Button
            onClick={fetchAssignedBatches}
            variant="outline"
            className="text-blue-600 border-blue-600"
          >
            View My Assignments
          </Button>
          <Button
            onClick={fetchAllBatches}
            variant="outline"
            className="text-green-600 border-green-600"
          >
            View All Available Batches
          </Button>
        </div>
      </div>
      
      {batches.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <h2 className="text-lg font-medium text-gray-700 mb-2">No Assignments</h2>
          <p className="text-gray-500">
            You don't have any training assignments at this time
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowDebug(!showDebug)}
            className="mt-4 text-gray-500"
          >
            {showDebug ? "Hide Debug Info" : "Show Debug Info"}
          </Button>
          
          {showDebug && (
            <div className="mt-4 p-4 bg-gray-100 border rounded text-left">
              <h3 className="font-medium mb-2 text-gray-700">Debug Information</h3>
              <div className="space-y-1 text-sm text-left">
                <p><span className="font-medium">Trainer ID:</span> {session?.user?.id || 'Not available'}</p>
                <p><span className="font-medium">Email:</span> {session?.user?.email || 'Not available'}</p>
                <p><span className="font-medium">Role:</span> {session?.user?.role || 'Not available'}</p>
                <p><span className="font-medium">Accepted Assignments:</span> {acceptedAssignments.length}</p>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      fetchAllBatches();
                      toast.success("Fetching all available batches...");
                    }}
                  >
                    Show All Batches
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search input */}
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search batches by name or type..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="max-w-md"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentBatches.map((batch) => {
              const batchStatus = getBatchStatus(batch);
              
              return (
                <div
                  key={batch.id}
                  className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <h2 className="font-semibold text-lg">{batch.batchName}</h2>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <p>
                      <span className="font-medium">Start Date:</span>{" "}
                      {new Date(batch.startDate).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">End Date:</span>{" "}
                      {new Date(batch.endDate).toLocaleDateString()}
                    </p>
                    <p>
                      <span className="font-medium">Training Type:</span>{" "}
                      {batch.trainingType}
                    </p>
                    <p>
                      <span className="font-medium">Students:</span>{" "}
                      {batch.trainees?.length || 0}
                    </p>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    {batchStatus === "PENDING" && (
                      <>
                        <Button
                          onClick={() => handleStatusChange(batch, "ACCEPTED")}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Accept Training
                        </Button>
                        
                        <Button
                          onClick={() => handleDeclineClick(batch)}
                          className="w-full bg-red-600 hover:bg-red-700"
                        >
                          Decline Training
                        </Button>
                      </>
                    )}
                    
                    {batchStatus === "ACCEPTED" && (
                      <div className="bg-green-100 p-3 rounded text-green-800 text-center">
                        Training Accepted
                      </div>
                    )}
                    
                    {batchStatus === "DECLINED" && (
                      <div className="bg-red-100 p-3 rounded text-red-800 text-center">
                        Training Declined
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
          
          {/* Show message when no results match search */}
          {filteredBatches.length === 0 && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              No batches match your search term.
            </div>
          )}
        </>
      )}
      
      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Decline Training Assignment</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="declineReason" className="mb-2 block">
              Please provide a reason for declining this training:
            </Label>
            <Textarea
              id="declineReason"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              placeholder="Enter your reason here..."
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleDeclineCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleDeclineSubmit}
              className="bg-red-600 hover:bg-red-700"
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainerAssignmentsPage; 