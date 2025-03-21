"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InvoiceStatus } from "@prisma/client";

// Mock data for sample invoices
// In a real app, this would come from an API call
const MOCK_INVOICES = [
  {
    id: "1",
    invoiceNumber: "INV-2023-001",
    poNumber: "PO-2023-002",
    clientName: "XYZ Ltd",
    amount: 3500,
    status: "PENDING" as InvoiceStatus,
    generatedAt: new Date(2023, 6, 15).toISOString(),
    fileUrl: "/mock-invoice.pdf"
  },
  {
    id: "2",
    invoiceNumber: "INV-2023-002",
    poNumber: "PO-2023-003",
    clientName: "Tech Solutions",
    amount: 7500,
    status: "PAID" as InvoiceStatus,
    generatedAt: new Date(2023, 7, 10).toISOString(),
    fileUrl: "/mock-invoice.pdf"
  },
  {
    id: "3",
    invoiceNumber: "INV-2023-003",
    poNumber: "PO-2023-001",
    clientName: "ABC Corp",
    amount: 5000,
    status: "OVERDUE" as InvoiceStatus,
    generatedAt: new Date(2023, 5, 20).toISOString(),
    fileUrl: "/mock-invoice.pdf"
  }
];

export default function InvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [invoices, setInvoices] = useState(MOCK_INVOICES);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check if user has permission to view invoices
  const canViewInvoices = session?.user?.role === "ACCOUNTS";

  const handleStatusUpdate = (invoiceId: string, newStatus: InvoiceStatus) => {
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, status: newStatus } : invoice
      )
    );
  };

  const filteredInvoices = filter === "ALL" 
    ? invoices 
    : invoices.filter(invoice => invoice.status === filter);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!canViewInvoices) {
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
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Button
          onClick={() => router.push("/purchase-orders")}
        >
          View Purchase Orders
        </Button>
      </div>

      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ALL")}
          >
            All
          </Button>
          <Button
            variant={filter === "PENDING" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("PENDING")}
          >
            Pending
          </Button>
          <Button
            variant={filter === "PAID" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("PAID")}
          >
            Paid
          </Button>
          <Button
            variant={filter === "OVERDUE" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("OVERDUE")}
          >
            Overdue
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                PO #
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
                Generated
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.poNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.clientName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${invoice.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${invoice.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : 
                      invoice.status === "PAID" ? "bg-green-100 text-green-800" : 
                      "bg-red-100 text-red-800"}`}
                  >
                    {invoice.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(invoice.generatedAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {invoice.fileUrl && (
                    <a 
                      href={invoice.fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View
                    </a>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {invoice.status === "PENDING" && (
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-green-600"
                        onClick={() => handleStatusUpdate(invoice.id, "PAID")}
                      >
                        Mark Paid
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleStatusUpdate(invoice.id, "OVERDUE")}
                      >
                        Mark Overdue
                      </Button>
                    </div>
                  )}
                  {invoice.status === "OVERDUE" && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-green-600"
                      onClick={() => handleStatusUpdate(invoice.id, "PAID")}
                    >
                      Mark Paid
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {filteredInvoices.length === 0 && (
              <tr>
                <td 
                  colSpan={8} 
                  className="px-6 py-10 text-center text-sm text-gray-500"
                >
                  No invoices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 