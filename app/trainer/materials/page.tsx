"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Material {
  id: string;
  title: string;
  description: string;
  batchId: string;
  batchName: string;
  uploadedBy: string;
  uploadedAt: Date;
  fileUrl: string;
  fileType: string;
  fileSize: string;
}

interface Batch {
  id: string;
  batchName: string;
  trainees?: { id: string; name: string; email?: string }[];
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
}

const MOCK_MATERIALS = [
  {
    id: 'material-1',
    title: 'Introduction to Web Development',
    description: 'Basics of HTML, CSS, and JavaScript',
    batchId: 'batch-1743349458328',
    batchName: 'Web Development Fundamentals',
    uploadedBy: 'Admin',
    uploadedAt: new Date('2023-09-01'),
    fileUrl: '/materials/intro-to-web-dev.pdf',
    fileType: 'PDF',
    fileSize: '2.5 MB',
  },
  {
    id: 'material-2',
    title: 'Frontend Frameworks Overview',
    description: 'Introduction to React, Angular, and Vue',
    batchId: 'batch-1743349458328',
    batchName: 'Web Development Fundamentals',
    uploadedBy: 'Admin',
    uploadedAt: new Date('2023-09-10'),
    fileUrl: '/materials/frontend-frameworks.pptx',
    fileType: 'PPTX',
    fileSize: '5.8 MB',
  },
  {
    id: 'material-3',
    title: 'Data Science Course Syllabus',
    description: 'Overview of course materials and schedule',
    batchId: 'batch-1743349464819',
    batchName: 'Data Science Bootcamp',
    uploadedBy: 'Admin',
    uploadedAt: new Date('2023-09-05'),
    fileUrl: '/materials/data-science-syllabus.pdf',
    fileType: 'PDF',
    fileSize: '1.2 MB',
  },
];

const TrainerMaterialsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchBatchesAndMaterials();
    }
  }, [status]);

  const fetchBatchesAndMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simple API call without any localStorage dependency
      const response = await fetch("/api/batches");
      
      if (!response.ok) {
        throw new Error("Failed to fetch batches");
      }
      
      const data = await response.json();
      
      if (Array.isArray(data.batches)) {
        // Get ONLY accepted assignments from localStorage
        const acceptedAssignments = getAcceptedAssignments().filter(a => a.status === 'ACCEPTED');
        const acceptedBatchIds = acceptedAssignments.map(a => a.batchId);
        
        // Filter to show only accepted batches that are assigned to this trainer
        const acceptedBatches = data.batches.filter(batch => 
          acceptedBatchIds.includes(batch.id) && batch.isAssignedToCurrentTrainer
        );
        
        console.log("Displaying accepted batches for materials:", acceptedBatches.length);
        setBatches(acceptedBatches);
        
        // If there are batches, set the first one as selected
        if (acceptedBatches.length > 0 && !selectedBatchId) {
          setSelectedBatchId(acceptedBatches[0].id);
        }
        
        // Filter materials based on user's batches 
        // In a real app, you would fetch these from an API
        const batchIds = acceptedBatches.map(b => b.id);
        const filteredMaterials = MOCK_MATERIALS.filter(m => batchIds.includes(m.batchId));
        setMaterials(filteredMaterials);
      }
    } catch (error) {
      console.error("Error fetching batches and materials:", error);
      setError("Failed to load materials");
    } finally {
      setLoading(false);
    }
  };

  const getAcceptedAssignments = (): AcceptedAssignment[] => {
    try {
      const storedAssignments = localStorage.getItem("trainer-assignments");
      if (storedAssignments) {
        const assignments = JSON.parse(storedAssignments);
        // Filter to only get this trainer's assignments
        return assignments.filter(
          (a: AcceptedAssignment) => a.trainerId === session?.user?.id
        );
      }
    } catch (error) {
      console.error("Error reading accepted assignments:", error);
    }
    return [];
  };

  const filteredMaterials = selectedBatchId 
    ? materials.filter(m => m.batchId === selectedBatchId)
    : materials;

  if (status === "loading" || loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Course Materials</h1>
        <div className="text-center py-10">Loading materials...</div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Course Materials</h1>
        <div className="bg-red-100 p-4 rounded mb-4">
          You need to be logged in to view course materials
        </div>
        <Link href="/login" className="btn btn-primary">
          Login
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Course Materials</h1>
      
      {error && (
        <div className="bg-red-100 p-4 rounded mb-4">{error}</div>
      )}
      
      {batches.length === 0 ? (
        <div className="bg-blue-50 p-6 rounded-lg text-center shadow-sm">
          <h2 className="text-xl font-medium text-blue-800 mb-2">No Accepted Batches</h2>
          <p className="text-blue-600">
            You haven't accepted any batches yet.
          </p>
          <p className="text-blue-600 mt-2">
            Visit the <Link href="/trainer/assignments" className="underline">Assignments</Link> page to view and accept training assignments.
          </p>
        </div>
      ) : (
        <div>
          {/* Batch Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Batch:</label>
            <select
              value={selectedBatchId || ''}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="w-full md:w-1/3 p-2 border rounded-md bg-white"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchName}
                </option>
              ))}
            </select>
          </div>
          
          {/* Materials List */}
          {filteredMaterials.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <h2 className="text-lg font-medium text-gray-700 mb-2">No Materials Available</h2>
              <p className="text-gray-500">
                {selectedBatchId 
                  ? "No materials are available for the selected batch at this time."
                  : "No materials are available for your batches at this time."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map((material) => (
                <div key={material.id} className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-semibold mb-2">{material.title}</h2>
                  <div className="mb-3">
                    <p className="text-gray-600 mb-2">{material.description}</p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Batch:</span>{" "}
                      {material.batchName}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">Uploaded:</span>{" "}
                      {material.uploadedAt.toLocaleDateString()}
                    </p>
                    <p className="text-gray-600 text-sm">
                      <span className="font-medium">File Type:</span>{" "}
                      {material.fileType} ({material.fileSize})
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <a 
                      href={material.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded inline-block"
                    >
                      Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TrainerMaterialsPage; 