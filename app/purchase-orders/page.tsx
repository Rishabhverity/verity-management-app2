"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { POStatus, UserRole } from "@prisma/client";
import { Pagination } from "@/components/ui/pagination";

// Define the PurchaseOrder type
type PurchaseOrder = {
  id: string;
  poNumber: string;
  clientName: string;
  amount: number;
  status: POStatus;
  uploadedAt: string;
  fileUrl: string | null;
  batchId?: string;
  batchName?: string;
};

// Default mock data for initial setup if no POs in localStorage
const DEFAULT_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "1",
    poNumber: "PO-2023-001",
    clientName: "ABC Corp",
    amount: 5000,
    status: "PENDING" as POStatus,
    uploadedAt: new Date(2023, 5, 15).toISOString(),
    fileUrl: null,
    batchId: "batch-1",
    batchName: "React Fundamentals"
  },
  {
    id: "2",
    poNumber: "PO-2023-002",
    clientName: "XYZ Ltd",
    amount: 3500,
    status: "PROCESSED" as POStatus,
    uploadedAt: new Date(2023, 6, 10).toISOString(),
    fileUrl: "/mock-po.pdf",
    batchId: "batch-2",
    batchName: "Advanced JavaScript"
  },
  {
    id: "3",
    poNumber: "PO-2023-003",
    clientName: "Tech Solutions",
    amount: 7500,
    status: "INVOICED" as POStatus,
    uploadedAt: new Date(2023, 7, 5).toISOString(),
    fileUrl: "/mock-po.pdf",
    batchId: "batch-3",
    batchName: "UI/UX Design Principles"
  }
];

// Define a type for batches
type Batch = {
  id: string;
  batchName: string;
  startDate: Date;
  endDate: Date;
  trainingType: string;
  status: string;
};

export default function PurchaseOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [formData, setFormData] = useState({
    poNumber: "",
    clientName: "",
    amount: "",
    batchId: "",
  });
  
  // Pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<POStatus | "ALL">("ALL");
  const itemsPerPage = 5;

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load purchase orders from localStorage on component mount
  useEffect(() => {
    if (status === "authenticated") {
      try {
        const storedPOs = localStorage.getItem('verity-purchase-orders');
        
        if (storedPOs) {
          setPurchaseOrders(JSON.parse(storedPOs));
        } else {
          // Initialize with default data if no POs in localStorage
          localStorage.setItem('verity-purchase-orders', JSON.stringify(DEFAULT_PURCHASE_ORDERS));
          setPurchaseOrders(DEFAULT_PURCHASE_ORDERS);
        }
      } catch (error) {
        console.error("Error loading purchase orders:", error);
        setPurchaseOrders(DEFAULT_PURCHASE_ORDERS);
      } finally {
        setIsLoading(false);
      }
    }
  }, [status]);
  
  // Load batches from localStorage
  useEffect(() => {
    if (status === "authenticated") {
      try {
        const storedBatches = localStorage.getItem('verity-batches');
        
        if (storedBatches) {
          // Parse the dates properly
          const parsedBatches = JSON.parse(storedBatches, (key, value) => {
            // Convert date strings back to Date objects
            if (key === 'startDate' || key === 'endDate' || key === 'startTime' || key === 'endTime') {
              return value ? new Date(value) : null;
            }
            return value;
          });
          setBatches(parsedBatches);
        }
      } catch (error) {
        console.error('Error parsing stored batches:', error);
        setBatches([]);
      }
    }
  }, [status]);

  // Check if user has permission to upload POs
  const userRole = session?.user?.role ? String(session.user.role).toUpperCase() : "";
  const canUploadPO = userRole === "OPERATIONS" || userRole === "ADMIN";
  // Check if user can view and/or process POs
  const canViewPO = userRole === "OPERATIONS" || userRole === "ACCOUNTS" || userRole === "ADMIN";

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Find the selected batch name
    const selectedBatch = batches.find(batch => batch.id === formData.batchId);
    const batchName = selectedBatch ? selectedBatch.batchName : "";

    // Create a new purchase order
    const newPO: PurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber: formData.poNumber,
      clientName: formData.clientName,
      amount: parseFloat(formData.amount),
      status: "PENDING" as POStatus,
      uploadedAt: new Date().toISOString(),
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : null,
      batchId: formData.batchId,
      batchName: batchName
    };

    // Add to state and localStorage - add new PO at the beginning of the array
    const updatedPOs = [newPO, ...purchaseOrders];
    setPurchaseOrders(updatedPOs);
    localStorage.setItem('verity-purchase-orders', JSON.stringify(updatedPOs));
    
    // Update the batch to indicate it has a purchase order
    updateBatchWithPurchaseOrder(formData.batchId, newPO.id);
    
    // Reset to first page to ensure the new PO is visible
    setCurrentPage(1);
    setSearchTerm("");
    setFilterStatus("ALL");

    // Reset form
    setFormData({
      poNumber: "",
      clientName: "",
      amount: "",
      batchId: "",
    });
    setSelectedFile(null);
    setIsFormOpen(false);
    setIsLoading(false);
  };

  // Function to update a batch with purchase order information
  const updateBatchWithPurchaseOrder = (batchId: string, purchaseOrderId: string) => {
    try {
      // Get current batches from localStorage
      const storedBatches = localStorage.getItem('verity-batches');
      
      if (storedBatches) {
        // Parse the dates properly
        const parsedBatches = JSON.parse(storedBatches, (key, value) => {
          // Convert date strings back to Date objects
          if (key === 'startDate' || key === 'endDate' || key === 'startTime' || key === 'endTime') {
            return value ? new Date(value) : null;
          }
          return value;
        });
        
        // Update the batch with purchase order information
        const updatedBatches = parsedBatches.map((batch: any) => {
          if (batch.id === batchId) {
            return {
              ...batch,
              hasPurchaseOrder: true,
              purchaseOrderId: purchaseOrderId
            };
          }
          return batch;
        });
        
        // Save updated batches back to localStorage
        localStorage.setItem('verity-batches', JSON.stringify(updatedBatches));
      }
    } catch (error) {
      console.error('Error updating batch with purchase order:', error);
    }
  };

  const handleProcessPO = (poId: string) => {
    setIsLoading(true);
    
    // Update the PO status to PROCESSED
    const updatedPOs = purchaseOrders.map(po => 
      po.id === poId ? { ...po, status: "PROCESSED" as POStatus } : po
    );
    
    setPurchaseOrders(updatedPOs);
    localStorage.setItem('verity-purchase-orders', JSON.stringify(updatedPOs));
    setIsLoading(false);
  };

  // Filter purchase orders by search term and status
  const filteredPOs = purchaseOrders.filter(po => {
    // Filter by status
    const statusMatch = 
      filterStatus === "ALL" || 
      po.status === filterStatus;
    
    // Filter by search term (case insensitive)
    const searchTermLower = searchTerm.toLowerCase();
    const searchMatch = 
      searchTerm === "" ||
      po.poNumber.toLowerCase().includes(searchTermLower) ||
      po.clientName.toLowerCase().includes(searchTermLower);
    
    return statusMatch && searchMatch;
  });

  // Paginate the filtered purchase orders
  const totalPages = Math.ceil(filteredPOs.length / itemsPerPage);
  const paginatedPOs = filteredPOs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!canViewPO) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-500">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
        {canUploadPO && (
          <Button onClick={() => setIsFormOpen(true)}>
            Upload New PO
          </Button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Upload Purchase Order</h2>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PO Number
                </label>
                <input
                  type="text"
                  name="poNumber"
                  value={formData.poNumber}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name
                </label>
                <input
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleFormChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Select Batch
                </label>
                <select
                  name="batchId"
                  value={formData.batchId}
                  onChange={handleFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  required
                >
                  <option value="">-- Select a batch --</option>
                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.batchName} ({new Date(batch.startDate).toLocaleDateString()} - {new Date(batch.endDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Upload PO Document (Optional)
                </label>
                <input
                  type="file"
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                  onChange={handleFileChange}
                />
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Uploading..." : "Upload PO"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search and filter controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filterStatus === "ALL" ? "default" : "outline"}
            onClick={() => setFilterStatus("ALL")}
          >
            All
          </Button>
          <Button 
            variant={filterStatus === "PENDING" ? "default" : "outline"}
            onClick={() => setFilterStatus("PENDING")}
          >
            Pending
          </Button>
          <Button 
            variant={filterStatus === "PROCESSED" ? "default" : "outline"}
            onClick={() => setFilterStatus("PROCESSED")}
          >
            Processed
          </Button>
          <Button 
            variant={filterStatus === "INVOICED" ? "default" : "outline"}
            onClick={() => setFilterStatus("INVOICED")}
          >
            Invoiced
          </Button>
        </div>
        
        <div>
          <input
            type="text"
            placeholder="Search by PO number or client name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-96 p-2 border rounded"
          />
        </div>
      </div>

      {filteredPOs.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-700 mb-2">
            {purchaseOrders.length === 0 
              ? "No purchase orders found." 
              : "No purchase orders match your search criteria."}
          </p>
          {canUploadPO && (
            <Button onClick={() => setIsFormOpen(true)}>Upload New PO</Button>
          )}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Associated Batch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                {userRole === "ACCOUNTS" && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPOs.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {po.poNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {po.clientName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{po.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {po.batchName || "Not associated"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${po.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : 
                        po.status === "PROCESSED" ? "bg-blue-100 text-blue-800" : 
                        "bg-green-100 text-green-800"}`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(po.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {po.fileUrl ? (
                      <a 
                        href={po.fileUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-gray-400">No document</span>
                    )}
                  </td>
                  {userRole === "ACCOUNTS" && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {po.status === "PENDING" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleProcessPO(po.id)}
                        >
                          Process
                        </Button>
                      )}
                      {po.status === "PROCESSED" && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => router.push(`/invoices/new?poId=${po.id}`)}
                        >
                          Create Invoice
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      {filteredPOs.length > itemsPerPage && (
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}