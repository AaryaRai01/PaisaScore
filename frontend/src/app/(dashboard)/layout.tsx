"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import Sidebar from "@/components/layout/Sidebar";

export default function OfficerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "officer") {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />
      <div className="flex-1 ml-64 min-h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
