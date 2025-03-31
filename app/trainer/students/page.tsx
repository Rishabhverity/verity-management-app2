"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Download } from "lucide-react";

interface Student {
  id: string;
  name: string;
  email?: string;
  status?: "ACTIVE" | "INACTIVE";
  performance?: "EXCELLENT" | "GOOD" | "AVERAGE" | "NEEDS_IMPROVEMENT";
  attendance?: number;
  isPresent?: boolean;
  attendanceHistory?: Record<string, boolean>;
}

interface Batch {
  id: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  trainingType: "ONLINE" | "OFFLINE";
  traineeCount: number;
  status: string;
  trainees?: Array<{id: string; name: string; email?: string}>;
}

export default function TrainerStudentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batchId");
  
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTakingAttendance, setIsTakingAttendance] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check if user is a trainer
  const isTrainer = session?.user?.role === "TRAINER";

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/batches');
      if (!response.ok) {
        throw new Error('Failed to fetch batches');
      }
      
      const data = await response.json();
      console.log("Fetched batches data:", data);
      
      // Store in localStorage if needed
      if (data.storeInLocalStorage) {
        localStorage.setItem('verity-batches', JSON.stringify(data.batches));
      }
      
      // Get accepted assignments from localStorage
      const acceptedAssignments = getAcceptedAssignments();
      console.log("Accepted assignments:", acceptedAssignments);
      
      // Use batches from API response and include accepted assignments
      const allBatches = data.batches || [];
      setBatches(allBatches);
      
      // If a batch is selected, load its students
      if (batchId) {
        const batch = allBatches.find((b: any) => b.id === batchId);
        if (batch) {
          setSelectedBatch(batch);
          loadStudentsForBatch(batch);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching batches:", error);
      
      // Fallback to localStorage
      const storedBatches = localStorage.getItem('verity-batches');
      if (storedBatches) {
        try {
          const parsedBatches = JSON.parse(storedBatches, (key, value) => {
            if (key === 'startDate' || key === 'endDate') {
              return value ? new Date(value) : null;
            }
            return value;
          });
          
          // Get accepted assignments from localStorage
          const acceptedAssignments = getAcceptedAssignments();
          console.log("Accepted assignments from localStorage:", acceptedAssignments);
          
          setBatches(parsedBatches);
          
          if (batchId) {
            const batch = parsedBatches.find((b: any) => b.id === batchId);
            if (batch) {
              setSelectedBatch(batch);
              loadStudentsForBatch(batch);
            }
          }
        } catch (e) {
          console.error("Error parsing stored batches:", e);
        }
      }
      
      setLoading(false);
    }
  };

  // Function to get accepted assignments
  const getAcceptedAssignments = () => {
    try {
      // Get assignments from localStorage
      const storedAssignments = localStorage.getItem('trainer-assignments');
      if (!storedAssignments) return [];
      
      const assignments = JSON.parse(storedAssignments);
      
      // Filter for accepted assignments
      return assignments.filter((assignment: any) => 
        assignment.status === 'ACCEPTED' && 
        String(assignment.trainerId) === String(session?.user?.id)
      );
    } catch (error) {
      console.error("Error getting accepted assignments:", error);
      return [];
    }
  };

  useEffect(() => {
    if (status === "authenticated" && isTrainer) {
      fetchBatches();
    }
  }, [status, isTrainer, batchId, session?.user?.id]);

  const loadStudentsForBatch = (batch: any) => {
    try {
      // Try to load existing attendance data
      const attendanceKey = `attendance-${batch.id}`;
      const storedAttendance = localStorage.getItem(attendanceKey);
      let attendanceData: Record<string, any> = {};
      
      if (storedAttendance) {
        attendanceData = JSON.parse(storedAttendance);
      }
      
      // Use actual trainees from the batch if available
      if (batch.trainees && Array.isArray(batch.trainees) && batch.trainees.length > 0) {
        console.log("Using actual trainees from batch:", batch.trainees);
        
        const studentList = batch.trainees.map((trainee: any, index: number) => {
          // Generate student ID if not available
          const studentId = trainee.id || `student-${index + 1}`;
          
          // Get attendance data for this student
          const studentAttendance = attendanceData[studentId] || {};
          const todayAttendance = studentAttendance[currentDate];
          
          // Calculate attendance percentage
          let attendancePercentage = 0;
          if (Object.keys(studentAttendance).length > 0) {
            const presentDays = Object.values(studentAttendance).filter(x => x === true).length;
            attendancePercentage = Math.round((presentDays / Object.keys(studentAttendance).length) * 100);
          }
            
          return {
            id: studentId,
            name: trainee.name || `Student ${index + 1}`,
            email: trainee.email || `${trainee.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            status: "ACTIVE",
            performance: "GOOD",
            attendance: attendancePercentage,
            isPresent: todayAttendance === undefined ? true : todayAttendance,
            attendanceHistory: studentAttendance
          };
        });
        
        setStudents(studentList);
      } else {
        // Fallback to mock students if no trainees in batch
        const mockStudents: Student[] = [];
        const studentCount = batch.traineeCount || 15;
        
        for (let i = 1; i <= studentCount; i++) {
          const studentId = `student-${i}`;
          const studentAttendance = attendanceData[studentId] || {};
          const todayAttendance = studentAttendance[currentDate];
          
          // Calculate attendance percentage
          let attendancePercentage = 0;
          if (Object.keys(studentAttendance).length > 0) {
            const presentDays = Object.values(studentAttendance).filter(x => x === true).length;
            attendancePercentage = Math.round((presentDays / Object.keys(studentAttendance).length) * 100);
          }
          
          mockStudents.push({
            id: studentId,
            name: `Student ${i}`,
            email: `student${i}@example.com`,
            status: Math.random() > 0.1 ? "ACTIVE" : "INACTIVE",
            performance: ["EXCELLENT", "GOOD", "AVERAGE", "NEEDS_IMPROVEMENT"][Math.floor(Math.random() * 4)],
            attendance: attendancePercentage,
            isPresent: todayAttendance === undefined ? Math.random() > 0.2 : todayAttendance // 80% chance of present for demo
          });
        }
        
        setStudents(mockStudents);
      }
    } catch (error) {
      console.error("Error loading students:", error);
      // Fallback to empty students array
      setStudents([]);
    }
  };

  const toggleAttendance = (studentId: string) => {
    setStudents(currentStudents => 
      currentStudents.map(student => {
        if (student.id === studentId) {
          return {
            ...student,
            isPresent: !student.isPresent
          };
        }
        return student;
      })
    );
  };

  const saveAttendance = () => {
    if (!selectedBatch) return;
    
    try {
      const attendanceKey = `attendance-${selectedBatch.id}`;
      let attendanceData: Record<string, any> = {};
      
      // Try to get existing attendance data
      const storedAttendance = localStorage.getItem(attendanceKey);
      if (storedAttendance) {
        attendanceData = JSON.parse(storedAttendance);
      }
      
      // Update attendance for each student
      students.forEach(student => {
        if (!attendanceData[student.id]) {
          attendanceData[student.id] = {};
        }
        attendanceData[student.id][currentDate] = student.isPresent;
      });
      
      // Save back to localStorage
      localStorage.setItem(attendanceKey, JSON.stringify(attendanceData));
      
      // Update student objects with new attendance percentages
      const updatedStudents = students.map(student => {
        const studentAttendance = attendanceData[student.id] || {};
        let attendancePercentage = 0;
        
        if (Object.keys(studentAttendance).length > 0) {
          const presentDays = Object.values(studentAttendance).filter(x => x === true).length;
          attendancePercentage = Math.round((presentDays / Object.keys(studentAttendance).length) * 100);
        }
        
        return {
          ...student,
          attendance: attendancePercentage
        };
      });
      
      setStudents(updatedStudents);
      setIsTakingAttendance(false);
      
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance. Please try again.");
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentDate(e.target.value);
    // Reload attendance for new date
    if (selectedBatch) {
      loadStudentsForBatch(selectedBatch);
    }
  };

  const downloadAttendanceExcel = () => {
    if (!selectedBatch || !students.length) return;
    
    try {
      // Create CSV content
      let csvContent = "Student ID,Student Name,Email,";
      
      // Get all unique dates from all students
      const allDates = new Set<string>();
      students.forEach(student => {
        if (student.attendanceHistory) {
          Object.keys(student.attendanceHistory).forEach(date => {
            allDates.add(date);
          });
        }
      });
      
      // Sort dates
      const sortedDates = Array.from(allDates).sort();
      
      // Add date headers
      sortedDates.forEach(date => {
        csvContent += `${date},`;
      });
      
      csvContent += "Attendance %\n";
      
      // Add student data
      students.forEach(student => {
        csvContent += `${student.id},${student.name},${student.email || ''},`;
        
        // Add attendance for each date
        sortedDates.forEach(date => {
          const attendanceData = student.attendanceHistory || {};
          const isPresent = attendanceData[date];
          csvContent += `${isPresent ? 'Present' : 'Absent'},`;
        });
        
        // Add attendance percentage
        csvContent += `${student.attendance || 0}%\n`;
      });
      
      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${selectedBatch.batchName}-attendance.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading attendance:", error);
      alert("Failed to download attendance. Please try again.");
    }
  };

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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
        <p className="text-gray-500">View and manage students in your training batches</p>
      </div>

      {!selectedBatch ? (
        // Show list of batches
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.map((batch) => (
            <Card key={batch.id} className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{batch.batchName}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{batch.trainingType}</Badge>
                  <Badge variant="secondary">{batch.traineeCount} Students</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>Start Date: {formatDate(batch.startDate)}</p>
                  <p>End Date: {formatDate(batch.endDate)}</p>
                  <p>Status: {batch.status}</p>
                  {batch.trainees && (
                    <p>Students: {batch.trainees.length}</p>
                  )}
                </div>
                <Button 
                  className="w-full mt-4"
                  onClick={() => {
                    setSelectedBatch(batch);
                    loadStudentsForBatch(batch);
                    router.push(`/trainer/students?batchId=${batch.id}`);
                  }}
                >
                  View Students
                </Button>
              </CardContent>
            </Card>
          ))}
          {batches.length === 0 && (
            <div className="col-span-full text-center py-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Batches Found</h2>
              <p className="text-gray-500 mb-4">You don't have any training batches assigned yet.</p>
              <Button onClick={() => router.push("/trainer/assignments")}>
                View Assignments
              </Button>
            </div>
          )}
        </div>
      ) : (
        // Show students for selected batch
        <div>
          <div className="mb-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedBatch(null);
                setStudents([]);
                router.push("/trainer/students");
              }}
              className="mb-2"
            >
              &larr; Back to Batches
            </Button>
            <h2 className="text-xl font-bold text-gray-900">{selectedBatch.batchName} - Students</h2>
          </div>

          <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              <div>
                <label htmlFor="attendance-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  id="attendance-date"
                  value={currentDate}
                  onChange={handleDateChange}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>
              
              {isTakingAttendance ? (
                <div className="flex gap-2">
                  <Button onClick={saveAttendance} className="mt-6">
                    Save Attendance
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsTakingAttendance(false);
                      if (selectedBatch) {
                        loadStudentsForBatch(selectedBatch);
                      }
                    }} 
                    className="mt-6"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button onClick={() => setIsTakingAttendance(true)} className="mt-6">
                  Take Attendance
                </Button>
              )}
            </div>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2" 
              onClick={downloadAttendanceExcel}
            >
              <Download size={16} />
              Download Attendance
            </Button>
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
                    {isTakingAttendance && (
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance ({currentDate})
                      </th>
                    )}
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
                      {isTakingAttendance && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Button 
                            variant={student.isPresent ? "default" : "destructive"}
                            size="sm"
                            className="flex items-center gap-1"
                            onClick={() => toggleAttendance(student.id)}
                          >
                            {student.isPresent ? (
                              <>
                                <CheckCircle size={16} />
                                Present
                              </>
                            ) : (
                              <>
                                <XCircle size={16} />
                                Absent
                              </>
                            )}
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr key="no-students">
                      <td colSpan={isTakingAttendance ? 6 : 5} className="px-6 py-10 text-center text-sm text-gray-500">
                        No students found for this batch
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 