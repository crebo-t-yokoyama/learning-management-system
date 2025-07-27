"use client";

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  showSiblings?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  showSiblings = 1,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    
    // Always show first page
    pages.push(1);
    
    if (currentPage <= showSiblings + 2) {
      // Show pages from 2 to showSiblings + 3
      for (let i = 2; i <= Math.min(totalPages, showSiblings + 3); i++) {
        pages.push(i);
      }
      if (totalPages > showSiblings + 3) {
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    } else if (currentPage >= totalPages - showSiblings - 1) {
      // Show ellipsis, then pages from totalPages - showSiblings - 2 to totalPages
      if (totalPages > showSiblings + 3) {
        pages.push("ellipsis");
      }
      for (let i = Math.max(2, totalPages - showSiblings - 2); i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show ellipsis, current page with siblings, ellipsis, last page
      pages.push("ellipsis");
      for (let i = currentPage - showSiblings; i <= currentPage + showSiblings; i++) {
        pages.push(i);
      }
      pages.push("ellipsis");
      pages.push(totalPages);
    }
    
    // Remove duplicates and sort
    return [...new Set(pages)].filter((page, index, arr) => {
      if (page === "ellipsis") return true;
      return typeof page === "number" && (index === 0 || arr[index - 1] !== page);
    });
  };

  const pageNumbers = generatePageNumbers();

  return (
    <nav
      role="navigation"
      aria-label="ページネーション"
      className={cn("flex items-center justify-center", className)}
    >
      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="前のページ"
          className="flex items-center gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          前へ
        </Button>

        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => {
            if (page === "ellipsis") {
              return (
                <div
                  key={`ellipsis-${index}`}
                  className="px-3 py-2 text-gray-500"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </div>
              );
            }

            const isCurrentPage = page === currentPage;

            return (
              <Button
                key={page}
                variant={isCurrentPage ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-label={`ページ ${page}`}
                aria-current={isCurrentPage ? "page" : undefined}
                className={cn(
                  "min-w-[2.5rem]",
                  isCurrentPage && "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="次のページ"
          className="flex items-center gap-1"
        >
          次へ
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
}