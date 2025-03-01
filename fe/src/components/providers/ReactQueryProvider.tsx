"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, ReactNode } from "react";

export default function ReactQueryProvider({ 
  children 
}: { 
  children: ReactNode 
}) {
  // This ensures a new QueryClient is created for each session
  // and not shared between different users or requests
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
} 