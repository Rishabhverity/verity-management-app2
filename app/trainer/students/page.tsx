"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Pagination } from "@/components/ui/pagination";

interface Student {
  id: string;
  name: string;
  email?: string;
  present?: boolean;
}

interface Batch {
  id: string;
  batchName: string;
  trainees?: Student[];
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
}

interface AttendanceRecord {
  date: string;
  batchId: string;
  batchName: string;
  students: {
    id: string;
    name: string;
    present: boolean;
  }[];
}

export default function TrainerStudentsPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const batchIdFromUrl = searchParams?.get("batchId");
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(batchIdFromUrl || null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [attendanceDate, setAttendanceDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  
  // Search and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (status === "authenticated") {
      fetchBatches();
    }
  }, [status]);

  useEffect(() => {
    // When batches are loaded or selectedBatchId changes, update students
    if (selectedBatchId) {
      const selectedBatch = batches.find(batch => batch.id === selectedBatchId);
      
      if (selectedBatch?.trainees) {
        // Initialize students with attendance status
        const studentsWithAttendance = selectedBatch.trainees.map(student => ({
          ...student,
          present: false
        }));
        
        setStudents(studentsWithAttendance);
      } else {
        setStudents([]);
      }
      
      // Load any existing attendance records for today
      loadExistingAttendance(selectedBatchId, attendanceDate);
    }
  }, [selectedBatchId, batches, attendanceDate]);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedBatchId]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      
      // Fetch batches from API
      const response = await fetch("/api/batches");
      
      if (!response.ok) {
        throw new Error("Failed to fetch batches");
      }
      
      const data = await response.json();
      
      if (!Array.isArray(data.batches)) {
        console.error("Invalid batches data:", data);
        setBatches([]);
        return;
      }
      
      // Get accepted assignments from localStorage
      const acceptedAssignments = getAcceptedAssignments();
      const acceptedBatchIds = acceptedAssignments
        .filter(a => a.status === 'ACCEPTED')
        .map(a => a.batchId);
      
      // Filter batches to show only those assigned to this trainer and accepted
      const trainerBatches = data.batches.filter(batch => 
        batch.isAssignedToCurrentTrainer && acceptedBatchIds.includes(batch.id)
      );
      
      setBatches(trainerBatches);
      
      // If there's a batch ID in the URL and it's valid, select it
      if (batchIdFromUrl) {
        const validBatchId = trainerBatches.some(batch => batch.id === batchIdFromUrl);
        if (validBatchId) {
          setSelectedBatchId(batchIdFromUrl);
        } else if (trainerBatches.length > 0) {
          // Fall back to the first batch if the one in the URL isn't valid
          setSelectedBatchId(trainerBatches[0].id);
        }
      } else if (trainerBatches.length > 0 && !selectedBatchId) {
        // Select the first batch if none is selected
        setSelectedBatchId(trainerBatches[0].id);
      }
      
    } catch (error) {
      console.error("Error fetching batches:", error);
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

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBatchId(e.target.value);
  };

  const handleAttendanceDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setAttendanceDate(newDate);
    
    if (selectedBatchId) {
      loadExistingAttendance(selectedBatchId, newDate);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleAttendanceToggle = (studentId: string) => {
    setStudents(
      students.map(student =>
        student.id === studentId
          ? { ...student, present: !student.present }
          : student
      )
    );
  };

  const loadExistingAttendance = (batchId: string, date: string) => {
    try {
      const storedRecords = localStorage.getItem('attendance-records');
      if (!storedRecords) return;
      
      const records: AttendanceRecord[] = JSON.parse(storedRecords);
      const existingRecord = records.find(
        record => record.batchId === batchId && record.date === date
      );
      
      if (existingRecord) {
        // Update students with the saved attendance data
        setStudents(prevStudents => 
          prevStudents.map(student => {
            const savedStudent = existingRecord.students.find(s => s.id === student.id);
            return savedStudent
              ? { ...student, present: savedStudent.present }
              : student;
          })
        );
      }
      
      setAttendanceRecords(records);
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };

  const saveAttendance = () => {
    try {
      if (!selectedBatchId) return;
      
      const selectedBatch = batches.find(batch => batch.id === selectedBatchId);
      if (!selectedBatch) return;
      
      // Create the attendance record
      const record: AttendanceRecord = {
        date: attendanceDate,
        batchId: selectedBatchId,
        batchName: selectedBatch.batchName,
        students: students.map(student => ({
          id: student.id,
          name: student.name,
          present: student.present || false
        }))
      };
      
      // Get existing records
      const storedRecords = localStorage.getItem('attendance-records') || "[]";
      let records: AttendanceRecord[] = JSON.parse(storedRecords);
      
      // Remove any existing record for this batch and date
      records = records.filter(
        r => !(r.batchId === selectedBatchId && r.date === attendanceDate)
      );
      
      // Add the new record
      records.push(record);
      
      // Save back to localStorage
      localStorage.setItem('attendance-records', JSON.stringify(records));
      
      // Update state
      setAttendanceRecords(records);
      
      alert("Attendance saved successfully!");
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance");
    }
  };

  const downloadAttendance = () => {
    try {
      if (!selectedBatchId) return;
      
      const selectedBatch = batches.find(batch => batch.id === selectedBatchId);
      if (!selectedBatch) return;
      
      // Prepare the data for Excel
      const worksheet = XLSX.utils.json_to_sheet(
        students.map(student => ({
          'Student ID': student.id,
          'Name': student.name,
          'Email': student.email || 'N/A',
          'Attendance': student.present ? 'Present' : 'Absent',
          'Date': attendanceDate
        }))
      );
      
      // Create a workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
      
      // Generate file name
      const fileName = `${selectedBatch.batchName}_Attendance_${attendanceDate}.xlsx`;
      
      // Write and download
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Error downloading attendance:", error);
      alert("Failed to download attendance");
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Paginate the filtered students
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (status === "loading" || loading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Student Attendance</h1>
        <div className="text-center py-10">Loading...</div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Student Attendance</h1>
        <div className="bg-red-100 p-4 rounded mb-4">
          You need to be logged in to access this page
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Student Attendance</h1>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="batchSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Select Batch
          </label>
          <select
            id="batchSelect"
            value={selectedBatchId || ""}
            onChange={handleBatchChange}
            className="w-full p-2 border rounded"
            disabled={batches.length === 0}
          >
            {batches.length === 0 ? (
              <option value="">No accepted batches available</option>
            ) : (
              batches.map(batch => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchName}
                </option>
              ))
            )}
          </select>
        </div>
        
        <div>
          <label htmlFor="attendanceDate" className="block text-sm font-medium text-gray-700 mb-1">
            Attendance Date
          </label>
          <input
            type="date"
            id="attendanceDate"
            value={attendanceDate}
            onChange={handleAttendanceDateChange}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>
      
      {students.length > 0 ? (
        <>
          {/* Search box */}
          <div className="mb-4">
            <label htmlFor="searchStudents" className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </label>
            <input
              type="text"
              id="searchStudents"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Present
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedStudents.map(student => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.email || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={student.present || false}
                        onChange={() => handleAttendanceToggle(student.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                  </tr>
                ))}
                
                {paginatedStudents.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                      No students found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {filteredStudents.length > itemsPerPage && (
            <div className="mb-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
          
          <div className="flex flex-wrap gap-4">
            <button
              onClick={saveAttendance}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
            >
              Save Attendance
            </button>
            
            <button
              onClick={downloadAttendance}
              className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
            >
              Download as Excel
            </button>
          </div>
        </>
      ) : (
        <div className="bg-yellow-50 p-6 rounded-lg text-center">
          <h2 className="text-lg font-medium text-yellow-800 mb-2">No Students Found</h2>
          {selectedBatchId ? (
            <p className="text-yellow-600">
              This batch doesn't have any students assigned to it.
            </p>
          ) : (
            <p className="text-yellow-600">
              Please select a batch to view students.
            </p>
          )}
        </div>
      )}
    </div>
  );
} 