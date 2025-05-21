"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "@/lib/params-helper";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Batch {
  id: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  trainingType: string;
  status: string;
  trainerId?: string;
}

interface TrainerProfile {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  specializations: string[];
  bio: string;
}

export default function TrainerAdminProfilePage({ params }: { params: any }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<TrainerProfile | null>(null);
  const [assignedBatches, setAssignedBatches] = useState<Batch[]>([]);
  const [newSpecialization, setNewSpecialization] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  // Unwrap params using our helper function
  const { trainerId } = useParams<{ trainerId: string }>(params);

  // Check if user has admin permissions
  const userRole = session?.user?.role ? String(session.user.role).toUpperCase() : "";
  const isAdmin = userRole === "ADMIN" || userRole === "OPERATIONS";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load profile data
  useEffect(() => {
    if (status === "authenticated") {
      loadProfile();
      loadAssignedBatches();
    }
  }, [status, trainerId]);

  const loadProfile = () => {
    setLoading(true);

    // In a real app, fetch from API
    // For demo, initialize with localStorage or default data
    try {
      const savedProfile = localStorage.getItem(`trainer-profile-${trainerId}`);
      
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
      } else {
        // Try to get trainer data from trainers API
        fetch("/api/trainers")
          .then(res => res.json())
          .then(trainers => {
            const trainer = trainers.find((t: any) => t.id === trainerId);
            
            if (trainer) {
              // Create profile from trainer data
              const defaultProfile: TrainerProfile = {
                id: trainer.id,
                name: trainer.name,
                email: trainer.email,
                photoUrl: "/placeholder-profile.jpg",
                specializations: [trainer.specialization],
                bio: "Experienced trainer with expertise in various technologies."
              };
              
              setProfile(defaultProfile);
              localStorage.setItem(`trainer-profile-${trainer.id}`, JSON.stringify(defaultProfile));
            } else {
              // No trainer found, create generic profile
              const defaultProfile: TrainerProfile = {
                id: trainerId,
                name: "Trainer",
                email: "",
                photoUrl: "/placeholder-profile.jpg",
                specializations: ["Web Development"],
                bio: "Experienced trainer with expertise in various technologies."
              };
              
              setProfile(defaultProfile);
            }
          })
          .catch(err => {
            console.error("Error fetching trainer data:", err);
            // Create generic profile on error
            const defaultProfile: TrainerProfile = {
              id: trainerId,
              name: "Trainer",
              email: "",
              photoUrl: "/placeholder-profile.jpg",
              specializations: ["Web Development"],
              bio: "Experienced trainer with expertise in various technologies."
            };
            
            setProfile(defaultProfile);
          });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
    
    setLoading(false);
  };

  const loadAssignedBatches = async () => {
    try {
      // Get all batches
      const response = await fetch("/api/batches");
      const data = await response.json();
      
      // Filter for batches assigned to this trainer
      const trainerBatches = data.batches.filter((batch: Batch) => 
        batch.trainerId === trainerId
      );
      
      setAssignedBatches(trainerBatches);
    } catch (error) {
      console.error("Error loading batches:", error);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddSpecialization = () => {
    if (!newSpecialization.trim() || !profile) return;
    
    const updatedProfile = {
      ...profile,
      specializations: [...profile.specializations, newSpecialization.trim()]
    };
    
    setProfile(updatedProfile);
    setNewSpecialization("");
    
    // Save to localStorage
    localStorage.setItem(`trainer-profile-${trainerId}`, JSON.stringify(updatedProfile));
  };

  const handleRemoveSpecialization = (index: number) => {
    if (!profile) return;
    
    const updatedSpecializations = [...profile.specializations];
    updatedSpecializations.splice(index, 1);
    
    const updatedProfile = {
      ...profile,
      specializations: updatedSpecializations
    };
    
    setProfile(updatedProfile);
    
    // Save to localStorage
    localStorage.setItem(`trainer-profile-${trainerId}`, JSON.stringify(updatedProfile));
  };

  const handleSaveProfile = () => {
    if (!profile) return;
    
    // In a real app, send to API
    // For demo, save to localStorage
    
    // If there's a new photo, update the URL (in a real app, upload to server)
    if (photoPreview) {
      const updatedProfile = {
        ...profile,
        photoUrl: photoPreview
      };
      
      setProfile(updatedProfile);
      localStorage.setItem(`trainer-profile-${trainerId}`, JSON.stringify(updatedProfile));
    }
    
    setEditMode(false);
  };

  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!profile) return;
    
    setProfile({
      ...profile,
      bio: e.target.value
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Trainer Profile</h1>
        <div className="text-center py-10">Loading profile...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <div className="bg-red-100 p-4 rounded mb-4">
          You need admin permissions to view this page
        </div>
        <Button onClick={() => router.push("/dashboard")}>Back to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Trainer Profile</h1>
        <Button variant="outline" onClick={() => router.push("/trainers")}>
          Back to Trainers
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Details */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                <span>Profile Information</span>
                <Button 
                  onClick={() => setEditMode(!editMode)}
                  variant={editMode ? "outline" : "default"}
                >
                  {editMode ? "Cancel Edit" : "Edit Profile"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profile && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 items-start">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-2 border-gray-200">
                      <Image 
                        src={photoPreview || profile.photoUrl || "/placeholder-profile.jpg"} 
                        alt={profile.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {editMode && (
                      <div className="space-y-2 flex-1">
                        <Label htmlFor="photo">Profile Photo</Label>
                        <Input 
                          id="photo" 
                          type="file" 
                          accept="image/*"
                          onChange={handlePhotoChange}
                        />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label>Name</Label>
                    <div className="text-lg font-medium">{profile.name}</div>
                  </div>
                  
                  <div>
                    <Label>Email</Label>
                    <div className="text-gray-700">{profile.email}</div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label>Bio</Label>
                    {editMode ? (
                      <Textarea 
                        value={profile.bio}
                        onChange={handleBioChange}
                        className="mt-1"
                        rows={4}
                      />
                    ) : (
                      <div className="text-gray-700 mt-1">{profile.bio}</div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Specializations</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {profile.specializations.map((spec, index) => (
                        <div 
                          key={index}
                          className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center"
                        >
                          {spec}
                          {editMode && (
                            <button 
                              onClick={() => handleRemoveSpecialization(index)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {editMode && (
                      <div className="flex gap-2 mt-2">
                        <Input 
                          value={newSpecialization}
                          onChange={(e) => setNewSpecialization(e.target.value)}
                          placeholder="Add specialization"
                          className="flex-1"
                        />
                        <Button onClick={handleAddSpecialization}>Add</Button>
                      </div>
                    )}
                  </div>
                  
                  {editMode && (
                    <div className="mt-4">
                      <Button onClick={handleSaveProfile}>Save Profile</Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Class Schedule */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Training Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {assignedBatches.length === 0 ? (
                <div className="text-center text-gray-500 py-4">
                  No scheduled trainings yet
                </div>
              ) : (
                <div className="space-y-4">
                  {assignedBatches.map((batch) => (
                    <div key={batch.id} className="border rounded-lg p-3">
                      <h3 className="font-medium">{batch.batchName}</h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <div>
                          <span className="font-medium">Type:</span> {batch.trainingType}
                        </div>
                        <div>
                          <span className="font-medium">Start:</span>{" "}
                          {new Date(batch.startDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">End:</span>{" "}
                          {new Date(batch.endDate).toLocaleDateString()}
                        </div>
                        <div className="mt-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            batch.status === "ACTIVE" 
                              ? "bg-green-100 text-green-800" 
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {batch.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-4">
            <Button 
              className="w-full"
              variant="outline"
              onClick={() => router.push(`/trainers/${trainerId}/assign-batch`)}
            >
              Assign to Batch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 