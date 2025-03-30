"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

type TrainingType = "ONLINE" | "OFFLINE";

interface Material {
  id: string;
  name: string;
  url: string;
  description: string;
  uploadDate: Date;
  batchId?: string;
}

interface Batch {
  id: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  startTime?: Date | null;
  endTime?: Date | null;
  trainingType: TrainingType;
  meetingLink?: string | null;
  venue?: string | null;
  accommodation?: string | null;
  travel?: string | null;
  status: "UPCOMING" | "ONGOING" | "COMPLETED" | "CANCELLED";
  traineeCount: number;
  trainerId?: string;
  trainerName?: string;
  materials?: Material[];
}

// Mock materials
const INITIAL_MATERIALS = [
  {
    id: "1",
    name: "Introduction to React",
    url: "https://example.com/materials/react-intro.pdf",
    description: "Basic overview of React concepts and components",
    uploadDate: new Date(2023, 8, 10),
    batchId: "1"
  },
  {
    id: "2",
    name: "JavaScript Advanced Topics",
    url: "https://example.com/materials/js-advanced.pdf",
    description: "Deep dive into JavaScript closures, promises, and async/await",
    uploadDate: new Date(2023, 8, 12),
    batchId: "2"
  },
  {
    id: "3",
    name: "CSS Flexbox and Grid",
    url: "https://example.com/materials/css-layout.pdf",
    description: "Modern CSS layout techniques with flexbox and grid",
    uploadDate: new Date(2023, 8, 15),
    batchId: "1"
  }
];

export default function TrainerMaterialsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batchId");
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(batchId);
  const [newMaterial, setNewMaterial] = useState({ name: "", url: "", description: "" });
  const [showAddForm, setShowAddForm] = useState(false);
  const [usingLocalStorage, setUsingLocalStorage] = useState(false);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    fetchTrainerBatches();
  }, [sessionStatus, session, router]);

  async function fetchTrainerBatches() {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Session user:", session?.user);
      console.log("User ID:", session?.user?.id);

      // Fetch batches from API
      const response = await fetch('/api/batches');
      
      if (!response.ok) {
        console.error("API response not OK:", response.status, response.statusText);
        throw new Error(`Failed to fetch batches: ${response.status} ${response.statusText}`);
      }
      
      const batchesFromApi = await response.json();
      
      if (batchesFromApi && batchesFromApi.length > 0) {
        console.log(`Found ${batchesFromApi.length} batches from API`);
        
        // Parse dates for the batches from API
        const parsedBatches = batchesFromApi.map((batch: any) => ({
          ...batch,
          startDate: new Date(batch.startDate),
          endDate: new Date(batch.endDate),
          startTime: batch.startTime ? new Date(batch.startTime) : null,
          endTime: batch.endTime ? new Date(batch.endTime) : null,
          materials: batch.materials || []
        }));
        
        // Initialize materials from batches if they have any
        const allMaterials: Material[] = [];
        parsedBatches.forEach((batch: Batch) => {
          if (batch.materials && batch.materials.length > 0) {
            batch.materials.forEach(material => {
              allMaterials.push({
                ...material,
                batchId: batch.id,
                uploadDate: new Date(material.uploadDate)
              });
            });
          }
        });

        if (allMaterials.length === 0) {
          // If no materials found in batches, use initial materials
          parsedBatches.forEach((batch: Batch) => {
            const batchMaterials = INITIAL_MATERIALS.filter(m => m.batchId === batch.id);
            if (batchMaterials.length > 0) {
              batch.materials = batchMaterials;
            }
          });
          setMaterials(INITIAL_MATERIALS);
        } else {
          setMaterials(allMaterials);
        }
        
        setBatches(parsedBatches);
        setUsingLocalStorage(false);
      } else {
        fallbackToLocalStorage();
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      fallbackToLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }

  function fallbackToLocalStorage() {
    try {
      console.log("Using localStorage as fallback for batches");
      const storedBatches = localStorage.getItem('verity-batches');
      
      if (storedBatches) {
        const allBatches = JSON.parse(storedBatches);
        console.log("Batches from localStorage:", allBatches);
        
        const userId = session?.user?.id;
        
        // Filter batches assigned to this trainer
        const trainerBatches = allBatches.filter((batch: any) => {
          if (!batch.trainerId || !userId) return false;
          
          const batchTrainerId = String(batch.trainerId).toLowerCase();
          const sessionUserId = String(userId).toLowerCase();
          
          return batchTrainerId === sessionUserId;
        });
        
        // Parse dates
        const parsedBatches = trainerBatches.map((batch: any) => ({
          ...batch,
          startDate: new Date(batch.startDate),
          endDate: new Date(batch.endDate),
          startTime: batch.startTime ? new Date(batch.startTime) : null,
          endTime: batch.endTime ? new Date(batch.endTime) : null,
          materials: batch.materials || []
        }));
        
        // Initialize materials from batches if they have any
        const allMaterials: Material[] = [];
        parsedBatches.forEach((batch: Batch) => {
          if (batch.materials && batch.materials.length > 0) {
            batch.materials.forEach(material => {
              allMaterials.push({
                ...material,
                batchId: batch.id,
                uploadDate: new Date(material.uploadDate)
              });
            });
          }
        });

        if (allMaterials.length === 0) {
          // If no materials found in batches, use initial materials
          parsedBatches.forEach((batch: Batch) => {
            const batchMaterials = INITIAL_MATERIALS.filter(m => m.batchId === batch.id);
            if (batchMaterials.length > 0) {
              batch.materials = batchMaterials;
            }
          });
          setMaterials(INITIAL_MATERIALS);
        } else {
          setMaterials(allMaterials);
        }
        
        setBatches(parsedBatches);
        setUsingLocalStorage(true);
      } else {
        console.log("No batches found in localStorage");
        setBatches([]);
        // Still show demo materials
        setMaterials(INITIAL_MATERIALS);
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      setBatches([]);
      setMaterials(INITIAL_MATERIALS);
    }
  }

  const handleAddMaterial = () => {
    if (!newMaterial.name || !newMaterial.url) {
      alert("Material name and URL are required");
      return;
    }
    
    const material: Material = {
      id: `material-${Date.now()}`,
      name: newMaterial.name,
      url: newMaterial.url,
      description: newMaterial.description,
      uploadDate: new Date(),
      batchId: selectedBatchId || undefined
    };
    
    // Add to state
    setMaterials([...materials, material]);
    
    // Save to localStorage
    if (selectedBatchId) {
      const storedBatches = localStorage.getItem('verity-batches');
      
      if (storedBatches) {
        const parsedBatches = JSON.parse(storedBatches);
        const updatedBatches = parsedBatches.map((batch: any) => {
          if (batch.id === selectedBatchId) {
            return {
              ...batch,
              materials: [...(batch.materials || []), material]
            };
          }
          return batch;
        });
        
        localStorage.setItem('verity-batches', JSON.stringify(updatedBatches));
        console.log("Added material to batch in localStorage");
      }
    }
    
    // Reset form
    setNewMaterial({ name: "", url: "", description: "" });
    setShowAddForm(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get materials for the selected batch or all if none selected
  const displayedMaterials = selectedBatchId 
    ? materials.filter(m => m.batchId === selectedBatchId)
    : materials;

  // Get the selected batch details
  const selectedBatch = selectedBatchId
    ? batches.find(b => b.id === selectedBatchId)
    : null;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <span className="ml-2 text-lg">Loading training materials...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Training Materials</h1>
        
        {batches.length > 0 && (
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={showAddForm}
          >
            Add New Material
          </Button>
        )}
      </div>
      
      {usingLocalStorage && (
        <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
          <AlertDescription>
            Using locally stored data. Connection to server unavailable.
          </AlertDescription>
        </Alert>
      )}

      {batches.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-md">
          <h2 className="text-lg font-semibold text-gray-600">No training batches assigned</h2>
          <p className="text-gray-500 mt-2">
            You don't have any training batches assigned to you yet.
          </p>
        </div>
      ) : (
        <>
          {/* Batch Selection */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={!selectedBatchId ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedBatchId(null)}
            >
              All Materials
            </Button>

            {batches.map(batch => (
              <Button
                key={batch.id}
                variant={selectedBatchId === batch.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedBatchId(batch.id)}
              >
                {batch.batchName}
              </Button>
            ))}
          </div>

          {/* Add Material Form */}
          {showAddForm && (
            <Card className="mb-6 border-2 border-blue-200">
              <CardHeader>
                <CardTitle>Add New Training Material</CardTitle>
                <CardDescription>
                  Provide the details of the training material to add to {selectedBatch ? selectedBatch.batchName : "your materials"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
                    <input
                      type="text"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      placeholder="e.g., Introduction to React"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL *</label>
                    <input
                      type="url"
                      value={newMaterial.url}
                      onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      placeholder="https://example.com/material.pdf"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newMaterial.description}
                      onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      rows={3}
                      placeholder="Brief description of the material"
                    />
                  </div>
                  
                  {batches.length > 1 && !selectedBatchId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Batch</label>
                      <select
                        onChange={(e) => setSelectedBatchId(e.target.value)}
                        className="w-full p-2 border rounded-md"
                        defaultValue=""
                      >
                        <option value="" disabled>Select a batch</option>
                        {batches.map(batch => (
                          <option key={batch.id} value={batch.id}>
                            {batch.batchName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddMaterial}
                      disabled={!newMaterial.name || !newMaterial.url}
                    >
                      Add Material
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Batch Details */}
          {selectedBatch && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle>{selectedBatch.batchName}</CardTitle>
                <div className="text-sm text-gray-500">
                  {formatDate(selectedBatch.startDate)} - {formatDate(selectedBatch.endDate)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Training Mode</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedBatch.trainingType}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Participants</h3>
                    <p className="mt-1 text-sm text-gray-900">{selectedBatch.traineeCount} trainees</p>
                  </div>
                  
                  {selectedBatch.trainingType === "ONLINE" && selectedBatch.meetingLink && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Meeting Link</h3>
                      <p className="mt-1 text-sm">
                        <a href={selectedBatch.meetingLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {selectedBatch.meetingLink}
                        </a>
                      </p>
                    </div>
                  )}
                  
                  {selectedBatch.trainingType === "OFFLINE" && selectedBatch.venue && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Venue</h3>
                      <p className="mt-1 text-sm text-gray-900">{selectedBatch.venue}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Materials List */}
          <h2 className="text-xl font-semibold mt-8 mb-4">
            {selectedBatch 
              ? `Materials for ${selectedBatch.batchName}` 
              : "All Training Materials"}
          </h2>

          {displayedMaterials.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-md">
              <h3 className="text-lg font-semibold text-gray-600">No materials available</h3>
              <p className="text-gray-500 mt-2">
                {selectedBatchId 
                  ? "No materials have been added to this batch yet." 
                  : "No materials have been added to any of your batches yet."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayedMaterials.map((material) => (
                <Card key={material.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{material.name}</CardTitle>
                    <div className="text-sm text-gray-500">
                      Added on {formatDate(new Date(material.uploadDate))}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 mb-4">{material.description}</p>
                    
                    {material.batchId && !selectedBatchId && (
                      <div className="mb-4">
                        <Badge>
                          {batches.find(b => b.id === material.batchId)?.batchName || "Unknown Batch"}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="mt-4">
                      <Button
                        className="w-full"
                        onClick={() => window.open(material.url, "_blank")}
                      >
                        Access Material
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 