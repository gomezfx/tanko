"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const scanLibrary = async () => {
    setIsScanning(true);
    setStatus(null);

    try {
      const response = await fetch("/api/library/scan", { method: "POST" });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = typeof body.message === "string" ? body.message : "Failed to scan library.";
        throw new Error(message);
      }

      const body = await response.json();
      setStatus(`Found ${body.found} files, created ${body.created} volumes, updated ${body.updatedThumbs} thumbnails.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to scan library.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to the admin dashboard. Use the sidebar to navigate between sections.
      </p>

      <div className="space-y-2 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Library Scanner</h2>
            <p className="text-sm text-muted-foreground">Scan library paths for new or updated volumes.</p>
          </div>
          <Button onClick={scanLibrary} disabled={isScanning}>
            {isScanning ? "Scanning..." : "Scan Now"}
          </Button>
        </div>
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
      </div>
    </div>
  );
}
