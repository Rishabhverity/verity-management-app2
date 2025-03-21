"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { POStatus, UserRole } from "@prisma/client";

// Mock data for sample purchase orders 
// In a real app, this would come from an API call
const MOCK_PURCHASE_ORDERS = [
  {
    id: "1",
    poNumber: "PO-2023-001",
    clientName: "ABC Corp",
    amount: 5000,
    status: "PENDING" as POStatus,
    uploadedAt: new Date(2023, 5, 15).toISOString(),
    fileUrl: null
  },
  {
    id: "2",
    poNumber: "PO-2023-002",
    clientName: "XYZ Ltd",
    amount: 3500,
    status: "PROCESSED" as POStatus,
    uploadedAt: new Date(2023, 6, 10).toISOString(),
    fileUrl: "/mock-po.pdf"
  },
  {
    id: "3",
    poNumber: "PO-2023-003",
    clientName: "Tech Solutions",
    amount: 7500,
    status: "INVOICED" as POStatus,
    uploadedAt: new Date(2023, 7, 5).toISOString(),
    fileUrl: "/mock-po.pdf"
  }
];

export default function PurchaseOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState(MOCK_PURCHASE_ORDERS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    poNumber: "",
    clientName: "",
    amount: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check if user has permissions to upload POs
  const canUploadPO = session?.user?.role === "OPERATIONS";
  // Check if user can view and/or process POs
  const canViewPO = ["OPERATIONS", "ACCOUNTS"].includes(session?.user?.role as string);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // In a real app, here we would upload the file and create the PO in the database
    setTimeout(() => {
      // Mock adding a new PO to the list
      const newPO = {
        id: (purchaseOrders.length + 1).toString(),
        poNumber: formData.poNumber,
        clientName: formData.clientName,
        amount: parseFloat(formData.amount),
        status: "PENDING" as POStatus,
        uploadedAt: new Date().toISOString(),
        fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : null
      };

      setPurchaseOrders((prev) => [newPO, ...prev]);
      setIsFormOpen(false);
      setFormData({ poNumber: "", clientName: "", amount: "" });
      setSelectedFile(null);
      setIsLoading(false);
    }, 1000);
  };

  if (status === "loading") {
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
                  Amount
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PO Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Accepted formats: PDF, DOC, DOCX
                </p>
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
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uploaded
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              {session?.user?.role === "ACCOUNTS" && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchaseOrders.map((po) => (
              <tr key={po.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {po.poNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {po.clientName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${po.amount.toFixed(2)}
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
                    "No document"
                  )}
                </td>
                {session?.user?.role === "ACCOUNTS" && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {po.status === "PROCESSED" && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600"
                        onClick={() => router.push(`/invoices/new?poId=${po.id}`)}
                      >
                        Generate Invoice
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {purchaseOrders.length === 0 && (
              <tr>
                <td 
                  colSpan={session?.user?.role === "ACCOUNTS" ? 7 : 6} 
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No purchase orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 