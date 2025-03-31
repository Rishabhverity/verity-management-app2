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

interface TrainingType {
  id: string;
  name: string;
}

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
      const response = await fetch("/api/batches");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch batches: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter for batches assigned to this trainer
      const assignedBatches = data.batches.filter(
        (batch: Batch) => batch.isAssignedToCurrentTrainer
      );
      
      console.log("Assigned batches:", assignedBatches);
      
      // Get accepted assignments from localStorage
      const savedAssignments = getAcceptedAssignments();
      console.log("Saved assignments:", savedAssignments);
      
      setBatches(assignedBatches);
    } catch (error) {
      console.error("Error fetching batches:", error);
      toast.error("Failed to load assigned batches");
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
      <h1 className="text-2xl font-bold mb-4">Training Assignments</h1>
      
      {batches.length === 0 ? (
        <div className="bg-gray-50 p-6 rounded-lg text-center">
          <h2 className="text-lg font-medium text-gray-700 mb-2">No Assignments</h2>
          <p className="text-gray-500">
            You don't have any training assignments at this time
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((batch) => {
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