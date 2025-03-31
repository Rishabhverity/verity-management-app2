import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    
    // Always show first page
    if (currentPage > 3) {
      pages.push(1);
      
      // Add ellipsis if needed
      if (currentPage > 4) {
        pages.push(-1); // -1 as indicator for ellipsis
      }
    }
    
    // Show current page and surrounding pages
    for (
      let i = Math.max(1, currentPage - 1);
      i <= Math.min(totalPages, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      // Add ellipsis if needed
      if (currentPage < totalPages - 3) {
        pages.push(-2); // -2 as another indicator for ellipsis
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-center space-x-1 ${className}`}>
      {/* First page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
        aria-label="First page"
      >
        <ChevronsLeft className="h-4 w-4" />
      </Button>
      
      {/* Previous page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="h-8 w-8 p-0"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {/* Page numbers */}
      {pageNumbers.map((page, index) => {
        if (page < 0) {
          // Render ellipsis
          return (
            <Button
              key={`ellipsis-${index}`}
              variant="ghost"
              disabled
              className="h-8 w-8 p-0"
            >
              ...
            </Button>
          );
        }
        
        return (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            onClick={() => onPageChange(page)}
            className="h-8 w-8 p-0"
            aria-label={`Page ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </Button>
        );
      })}
      
      {/* Next page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      
      {/* Last page */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="h-8 w-8 p-0"
        aria-label="Last page"
      >
        <ChevronsRight className="h-4 w-4" />
      </Button>
    </div>
  );
} 