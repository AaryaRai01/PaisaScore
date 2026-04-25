"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import UserSidebar from "@/components/layout/UserSidebar";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "user") {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <UserSidebar />
      <div className="flex-1 ml-64 min-h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
