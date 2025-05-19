"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { Pagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";

interface Student {
  id: string;
  name: string;
  email?: string | null;
  present?: boolean;
}

interface Batch {
  id: string;
  batchName: string;
  trainees?: Student[];
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
  
  // Email modal states
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [emailMessage, setEmailMessage] = useState("");
  const emailModalRef = useRef<HTMLDivElement>(null);
  
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
        console.log("Found trainees for selected batch:", selectedBatch.trainees);
        
        // Check if trainees have proper data structure
        if (selectedBatch.trainees.length > 0) {
          console.log("First trainee data:", selectedBatch.trainees[0]);
        } else {
          console.log("Trainees array is empty");
        }
        
        // Initialize students with attendance status and ensure all required fields
        const studentsWithAttendance = selectedBatch.trainees.map((student, index) => ({
          id: student.id || `generated-id-${Date.now()}-${index}`,
          name: student.name || `Student ${index + 1}`,
          email: student.email || null,
          present: false
        }));
        
        console.log("Processed student data:", studentsWithAttendance);
        setStudents(studentsWithAttendance);
      } else {
        console.warn("No trainees found for batch:", selectedBatchId);
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
      
      console.log("Fetched all batches:", data.batches);
      
      // Get accepted assignments from localStorage
      const acceptedAssignments = getAcceptedAssignments();
      console.log("Accepted assignments:", acceptedAssignments);
      
      const acceptedBatchIds = acceptedAssignments
        .filter(a => a.status === 'ACCEPTED')
        .map(a => a.batchId);
      
      console.log("Accepted batch IDs:", acceptedBatchIds);
      
      // Also check for saved batches in localStorage (these will have complete data)
      let localBatches: Batch[] = [];
      try {
        const savedBatchesJson = localStorage.getItem('trainer-batches');
        if (savedBatchesJson) {
          localBatches = JSON.parse(savedBatchesJson);
          console.log("Found locally saved batches:", localBatches);
        }
      } catch (e) {
        console.error("Error reading saved batches:", e);
      }
      
      // Filter batches to show only those assigned to this trainer and accepted
      let trainerBatches = data.batches.filter((batch: Batch) => {
        const isAssigned = batch.isAssignedToCurrentTrainer;
        const isAccepted = acceptedBatchIds.includes(batch.id);
        
        console.log(`Batch ${batch.id} - ${batch.batchName}: assigned=${isAssigned}, accepted=${isAccepted}, trainees=${batch.trainees?.length || 0}`);
        
        return isAssigned && isAccepted;
      });
      
      // For each batch in trainerBatches, check if we have more complete data in localBatches
      trainerBatches = trainerBatches.map((apiBatch: Batch) => {
        const localBatch = localBatches.find(lb => lb.id === apiBatch.id);
        if (localBatch && (!apiBatch.trainees || apiBatch.trainees.length === 0) && localBatch.trainees && localBatch.trainees.length > 0) {
          console.log(`Using local data for batch ${apiBatch.id} which has ${localBatch.trainees.length} trainees`);
          return {
            ...apiBatch,
            trainees: localBatch.trainees
          };
        }
        return apiBatch;
      });
      
      // If we're missing any accepted batches in the API response, add them from local storage
      const apiBatchIds = trainerBatches.map((b: Batch) => b.id);
      const missingAcceptedBatches = acceptedBatchIds.filter(id => !apiBatchIds.includes(id));
      
      if (missingAcceptedBatches.length > 0) {
        console.log("Some accepted batches are missing from API response:", missingAcceptedBatches);
        
        missingAcceptedBatches.forEach(missingId => {
          const localBatch = localBatches.find(lb => lb.id === missingId);
          if (localBatch) {
            console.log(`Adding missing batch from local storage: ${localBatch.id} - ${localBatch.batchName}`);
            trainerBatches.push(localBatch);
          }
        });
      }
      
      console.log("Final trainer batches:", trainerBatches);
      
      setBatches(trainerBatches);
      
      // If there's a batch ID in the URL and it's valid, select it
      if (batchIdFromUrl) {
        const validBatchId = trainerBatches.some((batch: Batch) => batch.id === batchIdFromUrl);
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

  const generateAttendanceWorkbook = () => {
    if (!selectedBatchId) return null;
    
    const selectedBatch = batches.find(batch => batch.id === selectedBatchId);
    if (!selectedBatch) return null;
    
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
    
    return {
      workbook,
      fileName: `${selectedBatch.batchName}_Attendance_${attendanceDate}.xlsx`,
      batchName: selectedBatch.batchName
    };
  };
  
  const downloadAttendance = () => {
    try {
      const attendanceData = generateAttendanceWorkbook();
      if (!attendanceData) {
        alert("No batch selected or no data available");
        return;
      }
      
      // Write and download
      XLSX.writeFile(attendanceData.workbook, attendanceData.fileName);
    } catch (error) {
      console.error("Error downloading attendance:", error);
      alert("Failed to download attendance");
    }
  };
  
  const openEmailModal = () => {
    // Default to trainer's email if available
    setEmailAddress(session?.user?.email || "");
    setIsEmailModalOpen(true);
    setEmailStatus('idle');
    setEmailMessage("");
  };
  
  const closeEmailModal = () => {
    setIsEmailModalOpen(false);
  };
  
  // Handle clicks outside the modal to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emailModalRef.current && !emailModalRef.current.contains(event.target as Node)) {
        closeEmailModal();
      }
    };
    
    if (isEmailModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEmailModalOpen]);
  
  const sendAttendanceByEmail = async () => {
    try {
      setEmailStatus('sending');
      
      const attendanceData = generateAttendanceWorkbook();
      if (!attendanceData) {
        setEmailStatus('error');
        setEmailMessage("No batch selected or no data available");
        return;
      }
      
      // Create a form data object to send to the API
      const formData = new FormData();
      
      // Convert the workbook to a blob
      const excelBlob = XLSX.write(attendanceData.workbook, { bookType: 'xlsx', type: 'array' });
      
      // Add the file to the form data
      formData.append('file', new Blob([excelBlob]), attendanceData.fileName);
      formData.append('email', emailAddress);
      formData.append('subject', `Attendance Report for ${attendanceData.batchName}`);
      formData.append('message', `Please find attached the attendance report for ${attendanceData.batchName} on ${attendanceDate}.`);
      
      // Send the email via the API endpoint
      const response = await fetch('/api/send-email', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }
      
      // Show success message
      setEmailStatus('success');
      setEmailMessage(`Attendance report for ${attendanceData.batchName} has been sent to ${emailAddress}`);
      
      // Auto close after success
      setTimeout(() => {
        closeEmailModal();
      }, 3000);
      
    } catch (error) {
      console.error("Error sending email:", error);
      setEmailStatus('error');
      setEmailMessage(typeof error === 'object' && error !== null && 'message' in error ? 
        (error as Error).message : "Failed to send email. Please try again.");
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student => {
    const nameMatch = student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || emailMatch;
  });

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
              batches.map((batch: Batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.batchName} {batch.trainees ? `(${batch.trainees.length} students)` : ''}
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
            
            <button
              onClick={openEmailModal}
              className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded"
            >
              Send via Email
            </button>
          </div>
          
          {/* Email Modal */}
          {isEmailModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div 
                ref={emailModalRef}
                className="bg-white rounded-lg p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-semibold mb-4">Send Attendance Report via Email</h3>
                
                {emailStatus === 'idle' || emailStatus === 'sending' ? (
                  <>
                    <div className="mb-4">
                      <label htmlFor="emailAddress" className="block text-sm font-medium text-gray-700 mb-1">
                        Recipient Email Address
                      </label>
                      <input
                        type="email"
                        id="emailAddress"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter email address"
                        disabled={emailStatus === 'sending'}
                        required
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={closeEmailModal}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                        disabled={emailStatus === 'sending'}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={sendAttendanceByEmail}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                        disabled={!emailAddress || emailStatus === 'sending'}
                      >
                        {emailStatus === 'sending' ? 'Sending...' : 'Send'}
                      </button>
                    </div>
                  </>
                ) : emailStatus === 'success' ? (
                  <div className="text-center">
                    <div className="mb-4 text-green-600 flex flex-col items-center">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                      <p className="mt-2">{emailMessage}</p>
                    </div>
                    <button
                      onClick={closeEmailModal}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                    >
                      Close
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="mb-4 text-red-600 flex flex-col items-center">
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                      <p className="mt-2">{emailMessage}</p>
                    </div>
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={closeEmailModal}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          setEmailStatus('idle');
                          setEmailMessage("");
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
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