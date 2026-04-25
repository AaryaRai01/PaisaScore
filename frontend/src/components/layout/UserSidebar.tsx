"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getSession } from "@/lib/session";
import { useEffect, useState } from "react";
import PaisaScoreLogo from "@/components/PaisaScoreLogo";

const navLinks = [
  { href: "/user/dashboard",    label: "My Dashboard",    icon: "dashboard"     },
  { href: "/user/apply",        label: "Apply for Loan",  icon: "add_card"      },
  { href: "/user/applications", label: "My Applications", icon: "description"   },
  { href: "/user/credit-health",label: "Credit Health",   icon: "speed"         },
  { href: "/user/repayments",   label: "Repayments",      icon: "payments"      },
];

export default function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [applicantName, setApplicantName] = useState<string>("Account");
  const [creditTier, setCreditTier] = useState<string>("");

  useEffect(() => {
    const s = getSession();
    if (!s || s.role !== "user") { router.push("/"); }
    else { setApplicantName(s.applicantName ?? "Account"); }
  }, [router]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-white border-r border-slate-100 flex flex-col z-50">
      {/* Brand */}
      <div className="px-5 py-6 bg-white border-b border-slate-100">
        <div className="flex flex-col items-start gap-1">
          <PaisaScoreLogo height={60} className="-ml-1" />
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black ml-1">Borrower Portal</p>
        </div>
      </div>

      {/* User welcome badge */}
      <div className="px-5 py-4 border-b border-slate-50">
        <div className="bg-[var(--color-primary)]/8 rounded-xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[var(--color-primary)] text-base">person</span>
          </div>
          <div className="min-w-0">
            <p className="text-slate-900 text-sm font-bold truncate">{applicantName}</p>
            <p className="text-slate-500 text-[10px] font-medium">Borrower Account</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ href, label, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-semibold"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] transition-transform group-hover:translate-x-0.5 ${active ? "text-[var(--color-primary)]" : ""}`}
                style={active ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className="flex-1">{label}</span>
              {active && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-4 py-5 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl text-sm transition-all"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
