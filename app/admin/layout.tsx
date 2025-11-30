import Link from "next/link";
import { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="flex w-64 flex-col gap-6 border-r bg-background p-6">
        <div>
          <p className="text-sm font-semibold text-muted-foreground">Navigation</p>
          <nav className="mt-3 flex flex-col gap-2">
            <Button asChild variant="ghost" className="justify-start">
              <Link href="/admin">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost" className="justify-start">
              <Link href="/admin/settings">Settings</Link>
            </Button>
          </nav>
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
