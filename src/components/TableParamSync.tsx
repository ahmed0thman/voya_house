"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useCartStore, formatTableNumber } from "@/store/useCartStore";

function TableParamReader() {
  const searchParams = useSearchParams();
  const setTableNumber = useCartStore((s) => s.setTableNumber);

  useEffect(() => {
    // 1. Check URL query params for table identifier
    const paramVal =
      searchParams.get("table") ||
      searchParams.get("t") ||
      searchParams.get("tableNumber") ||
      searchParams.get("table_number") ||
      searchParams.get("tbl");

    if (paramVal) {
      const formatted = formatTableNumber(paramVal);
      setTableNumber(formatted);
      try {
        localStorage.setItem("voya_table_number", formatted);
      } catch {
        // Ignore storage errors in restricted contexts
      }
    } else {
      // 2. If no param in URL, restore from localStorage if previously scanned during this visit
      try {
        const saved = localStorage.getItem("voya_table_number");
        if (saved) {
          setTableNumber(saved);
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [searchParams, setTableNumber]);

  return null;
}

export default function TableParamSync() {
  return (
    <Suspense fallback={null}>
      <TableParamReader />
    </Suspense>
  );
}
