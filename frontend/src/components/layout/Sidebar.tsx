"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getSession } from "@/lib/session";
import { useEffect, useState } from "react";
import PaisaScoreLogo from "@/components/PaisaScoreLogo";

const navLinks = [
  { href: "/officer/dashboard",   label: "Dashboard",             icon: "dashboard"        },
  { href: "/officer/queue",       label: "Application Queue",     icon: "inbox"            },
  { href: "/officer/applicants",  label: "Applicant Directory",   icon: "people"           },
  { href: "/officer/monitor",     label: "Loan Monitor",          icon: "monitoring"       },
  { href: "/reports",             label: "Reports",               icon: "bar_chart"        },
];

export default function OfficerSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [officerName, setOfficerName] = useState("Officer");

  useEffect(() => {
    const s = getSession();
    if (s?.applicantName) setOfficerName(s.applicantName);
  }, []);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  return (
    <aside className={`h-screen w-64 fixed left-0 top-0 bg-slate-900 flex flex-col z-50 border-r border-slate-800 transition-transform duration-300 ${
      isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
    }`}>
      {/* Brand */}
      <div className="px-5 py-6 bg-white border-b border-slate-200 flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <PaisaScoreLogo height={60} className="-ml-1" />
          <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black ml-1">Officer Portal</p>
        </div>
        <button 
          onClick={onClose}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span
                className={`material-symbols-outlined text-xl transition-transform group-hover:translate-x-0.5 ${active ? "text-[var(--color-primary)]" : ""}`}
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

      {/* Officer badge + logout */}
      <div className="px-4 py-4 pb-8 lg:pb-4 border-t border-slate-800 space-y-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-sm font-bold transition-all"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Sign Out
        </button>
        
        <div className="flex items-center gap-3 px-3 py-1 opacity-60">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-slate-400 text-sm">admin_panel_settings</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-[10px] font-bold truncate">{officerName}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
