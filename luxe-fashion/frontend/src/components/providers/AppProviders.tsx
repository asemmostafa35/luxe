"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { QueryProvider } from "./QueryProvider";
import { AuthProvider } from "./AuthProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <QueryProvider>
        <AuthProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: "font-sans text-sm",
              style: { borderRadius: 0, border: "1px solid #e0d9d0" },
              duration: 3000,
            }}
          />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
