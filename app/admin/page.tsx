import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to the admin dashboard. Use the sidebar to navigate between sections.
      </p>
      <div>
        <Button asChild>
          <Link href="/admin/setup">Run Setup Wizard</Link>
        </Button>
      </div>
    </div>
  );
}
