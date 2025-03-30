"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Clock } from "lucide-react";

type TrainingType = "ONLINE" | "OFFLINE";
type BatchStatus = "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";

type Batch = {
  id: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  startTime?: Date | null;
  endTime?: Date | null;
  trainingType: TrainingType;
  meetingLink?: string | null;
  venue?: string | null;
  status: BatchStatus;
  traineeCount: number;
  trainerId?: string;
  trainerName?: string;
};

export default function TrainerBatchesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<BatchStatus | "ALL">("ALL");
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      setError("You must be logged in to view your batches");
      setIsLoading(false);
      return;
    }

    fetchBatches();
  }, [session, sessionStatus]);

  async function fetchBatches() {
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
        }));
        
        setBatches(parsedBatches);
        setUsingLocalStorage(false);
      } else {
        console.log("No batches found in API response, checking localStorage");
        // Fallback to localStorage if no batches from API
        fallbackToLocalStorage();
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      setError("Failed to load your batches. Using local data as fallback.");
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
        
        // Filter batches assigned to this trainer
        const trainerBatches = allBatches.filter((batch: any) => {
          if (!batch.trainerId || !userId) return false;
          
          const batchTrainerId = String(batch.trainerId).toLowerCase();
          const sessionUserId = String(userId).toLowerCase();
          console.log(`Comparing batch.trainerId (${batchTrainerId}) with userId (${sessionUserId})`);
          
          const isMatch = batchTrainerId === sessionUserId;
          console.log(`Match result: ${isMatch}`);
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
        }));
        
        setBatches(parsedBatches);
        setUsingLocalStorage(true);
      } else {
        console.log("No batches found in localStorage");
        setBatches([]);
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      setBatches([]);
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (time: Date | null | undefined) => {
    if (!time) return 'N/A';
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const getBatchStatusVariant = (status: BatchStatus) => {
    switch (status) {
      case "UPCOMING": return "default";
      case "ONGOING": return "success";
      case "COMPLETED": return "outline";
      case "CANCELLED": return "destructive";
      default: return "default";
    }
  };

  // Filter batches based on selected status
  const filteredBatches = filter === "ALL" 
    ? batches 
    : batches.filter(batch => batch.status === filter);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-2 text-lg">Loading your batches...</span>
      </div>
    );
  }

  if (error && batches.length === 0) {
    return (
      <Alert className="mb-4">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Training Batches</h1>
        <Button onClick={() => fetchBatches()}>Refresh</Button>
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
          variant={filter === "UPCOMING" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("UPCOMING")}
        >
          Upcoming
        </Button>
        <Button
          variant={filter === "ONGOING" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("ONGOING")}
        >
          Ongoing
        </Button>
        <Button
          variant={filter === "COMPLETED" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("COMPLETED")}
        >
          Completed
        </Button>
      </div>

      {filteredBatches.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold text-gray-600">No batches found</h2>
          <p className="text-gray-500 mt-2">
            {filter === "ALL" 
              ? "You don't have any training batches assigned to you yet."
              : `You don't have any ${filter.toLowerCase()} batches.`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map((batch) => (
            <Card key={batch.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{batch.batchName}</CardTitle>
                  <Badge variant={getBatchStatusVariant(batch.status)}>
                    {batch.status}
                  </Badge>
                </div>
                <div className="text-sm text-gray-500 flex items-center mt-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(batch.startDate)} - {formatDate(batch.endDate)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {formatTime(batch.startTime)} - {formatTime(batch.endTime)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Trainees: {batch.traineeCount}</span>
                  </div>
                  
                  <div>
                    <strong>Training Type:</strong> {batch.trainingType}
                  </div>
                  
                  {batch.trainingType === "ONLINE" && batch.meetingLink && (
                    <div>
                      <strong>Meeting Link:</strong>{" "}
                      <a href={batch.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Join Meeting
                      </a>
                    </div>
                  )}
                  
                  {batch.trainingType === "OFFLINE" && batch.venue && (
                    <div>
                      <strong>Venue:</strong> {batch.venue}
                    </div>
                  )}
                  
                  {batch.status === "UPCOMING" && (
                    <Button className="w-full mt-2">
                      Prepare Materials
                    </Button>
                  )}
                  
                  {batch.status === "ONGOING" && (
                    <Button className="w-full mt-2 bg-green-600 hover:bg-green-700">
                      Start Class
                    </Button>
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