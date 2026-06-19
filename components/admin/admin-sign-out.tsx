"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminSignOut() {
  const router = useRouter();

  const handleSignOut = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5 text-xs">
      <LogOut className="size-3.5" />
      Sign out
    </Button>
  );
}
