"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import TraineeList from "@/components/forms/TraineeList";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createNotification } from "@/lib/notifications";

// Types
type TrainerData = {
  id: string;
  name: string;
  email: string;
  expertise: string[];
  rating?: number;
};

type Trainee = {
  id: string;
  name: string;
  email?: string;
};

// Define training types enum for better type safety
type TrainingType = "ONLINE" | "OFFLINE" | "HYBRID";

export default function CreateBatchPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [trainers, setTrainers] = useState<TrainerData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    batchName: "",
    description: "",
    trainingType: "ONLINE" as TrainingType,
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    meetingLink: "",
    venue: "",
    trainerId: "",
    trainees: [] as Trainee[],
    hybridDetails: "",
  });

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchTrainers();
    }
  }, [status, session]);

  const fetchTrainers = async () => {
    try {
      const res = await fetch("/api/trainers");
      if (!res.ok) {
        throw new Error("Failed to fetch trainers");
      }
      const data = await res.json();
      setTrainers(data.trainers || []);
    } catch (err) {
      console.error("Error fetching trainers:", err);
      setError("Failed to load trainers. Please refresh and try again.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (name: string, date: Date) => {
    setFormData((prev) => ({ ...prev, [name]: date }));
  };

  const handleTraineesChange = (trainees: Trainee[]) => {
    setFormData((prev) => ({ ...prev, trainees }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Generate a unique ID for the batch
      const batchId = `batch-${Date.now()}`;
      
      // Find the selected trainer name and email
      const selectedTrainer = trainers.find(trainer => trainer.id === formData.trainerId);
      
      console.log("Creating batch with trainer:", selectedTrainer);
      
      // Ensure trainees have proper IDs and data
      const processedTrainees = formData.trainees.map((trainee, index) => ({
        id: trainee.id || `student-${Date.now()}-${index}`,
        name: trainee.name || `Student ${index + 1}`,
        email: trainee.email || null
      }));
      
      console.log("Processed trainees:", processedTrainees);
      
      // Prepare batch data
      const batchData = {
        id: batchId,
        batchName: formData.batchName,
        description: formData.description,
        trainingType: formData.trainingType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        meetingLink: formData.trainingType === "ONLINE" || formData.trainingType === "HYBRID" 
          ? formData.meetingLink 
          : null,
        venue: formData.trainingType === "OFFLINE" || formData.trainingType === "HYBRID" 
          ? formData.venue 
          : null,
        hybridDetails: formData.trainingType === "HYBRID" 
          ? formData.hybridDetails 
          : null,
        trainerId: formData.trainerId,
        trainerName: selectedTrainer?.name || "Unknown Trainer",
        trainerEmail: selectedTrainer?.email || null, // Store trainer email as well
        status: "PENDING",
        trainees: processedTrainees,
        traineeCount: processedTrainees.length,
        createdAt: new Date(),
        createdBy: session?.user?.id,
      };

      // Log batch data for debugging
      console.log("Submitting batch data:", batchData);

      // Save to API
      const response = await fetch("/api/batches", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(batchData),
      });

      if (!response.ok) {
        throw new Error("Failed to create batch");
      }

      const result = await response.json();
      console.log("API response:", result);
      
      // Create a purchase order notification
      try {
        console.log("Attempting to create PO notification for batch:", batchId);
        const notification = createNotification({
          batchId: batchId,
          batchName: formData.batchName,
          message: `New batch "${formData.batchName}" created. Please create a purchase order.`,
          status: "UNREAD",
          type: "PURCHASE_ORDER"
        });
        console.log("Successfully created notification:", notification);
        
        // Verify the notification was stored
        const storedNotifications = localStorage.getItem('verity-notifications');
        console.log("Current notifications in storage:", storedNotifications);
      } catch (error) {
        console.error("Error creating PO notification:", error);
      }
      
      // Process the clientData to ensure trainers can see this batch
      if (result.clientData) {
        // Make a separate call to register this batch for the trainer
        const notifyResponse = await fetch(`/api/batches?newBatchId=${result.clientData.newBatchId}&newBatchName=${result.clientData.newBatchName}&trainerId=${result.clientData.trainerId}`);
        
        if (!notifyResponse.ok) {
          console.warn("Failed to register batch with trainer, but batch was created");
        }
      }

      setSuccess(true);
      
      // Clear form after successful submission
      setFormData({
        batchName: "",
        description: "",
        trainingType: "ONLINE" as TrainingType,
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        meetingLink: "",
        venue: "",
        trainerId: "",
        trainees: [],
        hybridDetails: "",
      });
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push("/admin/batches");
      }, 2000);
    } catch (error) {
      console.error("Error creating batch:", error);
      setError("Failed to create batch. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (status === "unauthenticated" || session?.user?.role !== "ADMIN") {
    return (
      <div className="p-8">
        <Alert variant="destructive">
          <AlertDescription>
            You don't have permission to access this page. Please log in as an admin.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Training Batch</h1>
      
      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
          <AlertDescription>
            Batch created successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Batch Name */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="batchName">Batch Name</Label>
              <Input
                id="batchName"
                name="batchName"
                value={formData.batchName}
                onChange={handleInputChange}
                required
                placeholder="e.g. Web Development Cohort 2023"
              />
            </div>
            
            {/* Description */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Details about this training batch"
                rows={4}
              />
            </div>
            
            {/* Training Type */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="trainingType">Training Type</Label>
              <Select
                value={formData.trainingType}
                onValueChange={(value: string) => handleSelectChange("trainingType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select training type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="OFFLINE">Offline</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Start Date */}
            <div className="grid w-full items-center gap-1.5">
              <Label>Start Date</Label>
              <DatePicker 
                date={formData.startDate} 
                setDate={(date: Date) => handleDateChange("startDate", date)}
              />
            </div>
            
            {/* End Date */}
            <div className="grid w-full items-center gap-1.5">
              <Label>End Date</Label>
              <DatePicker 
                date={formData.endDate} 
                setDate={(date: Date) => handleDateChange("endDate", date)}
              />
            </div>
            
            {/* Location - conditional based on training type */}
            {(formData.trainingType === "ONLINE" || formData.trainingType === "HYBRID") && (
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="meetingLink">Meeting Link</Label>
                <Input
                  id="meetingLink"
                  name="meetingLink"
                  value={formData.meetingLink}
                  onChange={handleInputChange}
                  placeholder="e.g. https://zoom.us/j/123456789"
                />
              </div>
            )}
            
            {(formData.trainingType === "OFFLINE" || formData.trainingType === "HYBRID") && (
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="venue">Venue</Label>
                <Input
                  id="venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="e.g. Training Center, Room 302"
                />
              </div>
            )}
            
            {formData.trainingType === "HYBRID" && (
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="hybridDetails">Hybrid Training Details</Label>
                <Textarea
                  id="hybridDetails"
                  name="hybridDetails"
                  value={formData.hybridDetails}
                  onChange={handleInputChange}
                  placeholder="Provide details about hybrid setup, schedule for online/offline sessions, etc."
                  rows={3}
                />
              </div>
            )}
            
            {/* Trainer Selection */}
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="trainerId">Assign Trainer</Label>
              <Select
                value={formData.trainerId}
                onValueChange={(value: string) => handleSelectChange("trainerId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a trainer" />
                </SelectTrigger>
                <SelectContent>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.name} ({trainer.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Trainees */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Trainees</CardTitle>
          </CardHeader>
          <CardContent>
            <TraineeList trainees={formData.trainees} onChange={handleTraineesChange} />
          </CardContent>
        </Card>
        
        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Batch"}
          </Button>
        </div>
      </form>
    </div>
  );
} 