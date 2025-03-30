"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Student {
  id: string;
  name: string;
  email?: string;
  status?: "ACTIVE" | "INACTIVE";
  performance?: "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_IMPROVEMENT";
  attendance?: number;
}

export default function TrainerStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batchId");
  
  const [students, setStudents] = useState<Student[]>([]);
  const [batchName, setBatchName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check if user is a trainer
  const isTrainer = session?.user?.role === "TRAINER";

  useEffect(() => {
    if (status === "authenticated" && isTrainer && batchId) {
      setLoading(true);
      
      try {
        // Get batch details from localStorage
        const storedBatches = localStorage.getItem('verity-batches');
        
        if (storedBatches) {
          const parsedBatches = JSON.parse(storedBatches, (key, value) => {
            if (key === 'startDate' || key === 'endDate' || key === 'startTime' || key === 'endTime') {
              return value ? new Date(value) : null;
            }
            return value;
          });
          
          // Find the specific batch
          const batch = parsedBatches.find((b: any) => b.id === batchId);
          
          if (batch) {
            setBatchName(batch.batchName);
            
            // For demo purposes, generate mock students if no trainees
            if (!batch.trainees || batch.trainees.length === 0) {
              const mockStudents: Student[] = [];
              const studentCount = batch.traineeCount || 15;
              
              for (let i = 1; i <= studentCount; i++) {
                mockStudents.push({
                  id: `student-${i}`,
                  name: `Student ${i}`,
                  email: `student${i}@example.com`,
                  status: Math.random() > 0.1 ? "ACTIVE" : "INACTIVE",
                  performance: ["EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"][Math.floor(Math.random() * 4)],
                  attendance: Math.floor(Math.random() * 101)
                });
              }
              
              setStudents(mockStudents);
            } else {
              // Convert batch trainees to student format
              setStudents(batch.trainees.map((trainee: any) => ({
                id: trainee.id,
                name: trainee.name,
                status: "ACTIVE",
                performance: "GOOD",
                attendance: 100
              })));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching batch details:", error);
      } finally {
        setLoading(false);
      }
    }
  }, [status, isTrainer, batchId]);

  const getPerformanceColor = (performance: string | undefined) => {
    switch (performance) {
      case "EXCELLENT": return "text-green-600";
      case "GOOD": return "text-blue-600";
      case "AVERAGE": return "text-yellow-600";
      case "NEEDS_IMPROVEMENT": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getStatusBadgeClass = (studentStatus: string | undefined) => {
    return studentStatus === "ACTIVE" 
      ? "bg-green-100 text-green-800" 
      : "bg-red-100 text-red-800";
  };

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

  if (!batchName) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Batch Not Found</h1>
          <p className="text-gray-700 mb-4">The specified batch could not be found.</p>
          <Button onClick={() => router.push("/trainer/assignments")}>
            Back to Assignments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.push("/trainer/assignments")} className="mb-2">
          &larr; Back to Assignments
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{batchName} - Students</h1>
        <p className="text-gray-500">Manage and track student progress</p>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Attendance %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{student.email || "No email provided"}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(student.status)}`}>
                      {student.status || "UNKNOWN"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${getPerformanceColor(student.performance)}`}>
                      {student.performance?.replace('_', ' ') || "Not evaluated"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.attendance || 0}%</div>
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    No students found for this batch
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 