"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, OfficerAnalytics, LoanApplication } from "@/lib/api";
import { getSession } from "@/lib/session";
import Link from "next/link";

const riskColor: Record<string, string> = {
  Low:    "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High:   "bg-red-100 text-red-800",
};

export default function OfficerDashboard() {
  const [officerId, setOfficerId] = useState<number | null>(null);
  const [officerName, setOfficerName] = useState("Officer");

  useEffect(() => {
    const s = getSession();
    if (s?.id) setOfficerId(s.id);
    if (s?.applicantName) setOfficerName(s.applicantName.split(" ")[0]);
  }, []);

  const { data: analytics } = useQuery<OfficerAnalytics>({
    queryKey: ["analytics", officerId],
    queryFn: async () => (await api.get("/analytics", { params: { officerId } })).data,
    enabled: !!officerId,
    refetchInterval: 10_000,
  });

  const { data: loans = [] } = useQuery<LoanApplication[]>({
    queryKey: ["loan-applications-dashboard", officerId],
    queryFn: async () => {
      // Fetch both my loans and unassigned ones for the dashboard highlights
      const [myLoans, unassignedLoans] = await Promise.all([
        api.get("/loan-applications", { params: { officerId } }),
        api.get("/loan-applications", { params: { unassigned: "true" } })
      ]);
      
      // Combine and filter for pending
      const combined = [...myLoans.data, ...unassignedLoans.data];
      // De-duplicate by ID (just in case)
      const unique = Array.from(new Map(combined.map(l => [l.id, l])).values());
      return unique;
    },
    enabled: !!officerId,
    refetchInterval: 10_000,
  });

  const pending = loans.filter((l) => l.loanStatus === "Pending");

  const stats = [
    { label: "Total Applicants",  value: analytics?.totalApplicants ?? 0,         icon: "people",               accent: false },
    { label: "Pending Queue",     value: analytics?.pendingQueue ?? 0,             icon: "hourglass_empty",      accent: true  },
    { label: "Loans Approved",    value: analytics?.approvedLoans ?? 0,            icon: "check_circle",         accent: false },
    { label: "Portfolio Value",   value: `₹${(( analytics?.totalPortfolioValue ?? 0) / 100000).toFixed(1)}L`, icon: "account_balance_wallet", accent: false },
    { label: "Approval Rate",     value: `${analytics?.approvalRate ?? 0}%`,       icon: "trending_up",          accent: false },
    { label: "Avg Credit Score",  value: analytics?.avgCreditScore ?? 0,           icon: "grade",                accent: false },
    { label: "High Risk Cases",   value: analytics?.highRiskCount ?? 0,            icon: "warning",              accent: false },
    { label: "Total Loans",       value: analytics?.totalLoans ?? 0,               icon: "description",          accent: false },
  ];

  return (
    <div className="p-2 sm:p-4 lg:p-8 space-y-4 lg:space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-headline text-lg lg:text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h2>
          <p className="text-slate-500 text-[10px] lg:text-sm mt-0.5">Welcome, {officerName}. Portfolio overview.</p>
        </div>
        <Link href="/officer/queue" className="w-full sm:w-auto">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-xs shadow-md shadow-[var(--color-primary)]/20 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
            Review ({analytics?.pendingQueue ?? 0})
          </button>
        </Link>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {stats.map(({ label, value, icon, accent }) => (
          <div key={label} className={`p-4 sm:p-5 rounded-xl shadow-sm border flex items-center justify-between sm:flex-col sm:items-start sm:gap-2 ${accent ? "bg-[var(--color-primary)] border-transparent text-white shadow-[var(--color-primary)]/20" : "bg-white border-slate-100"}`}>
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-lg sm:text-xl opacity-70 ${accent ? "text-white/80" : "text-[var(--color-primary)]"}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              <span className={`text-xs font-bold uppercase tracking-wider ${accent ? "text-white/70" : "text-slate-500"}`}>{label}</span>
            </div>
            <span className={`font-headline text-2xl sm:text-3xl font-extrabold ${accent ? "text-white" : "text-slate-900"}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Pending applications table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-headline text-lg font-bold text-slate-900">Pending Decisions</h3>
          <Link href="/officer/queue"><span className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer">View All →</span></Link>
        </div>
        {pending.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-2">done_all</span>
            <p>Queue is clear. No pending applications.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <table className="hidden md:table w-full text-sm text-left min-w-[600px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  {["Applicant", "Loan Type", "Amount", "Credit Score", "Risk", "Action"].map((h) => (
                    <th key={h} className="px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pending.slice(0, 5).map((loan) => {
                  const score = loan.applicant?.creditScores?.[0];
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">{loan.applicant?.fullName}</div>
                        <div className="text-xs text-slate-400">{loan.applicant?.employmentType}</div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">{loan.loanType?.loanTypeName}</td>
                      <td className="px-5 py-4 font-semibold">₹{loan.loanAmount.toLocaleString()}</td>
                      <td className="px-5 py-4 font-bold text-[var(--color-primary)]">{score?.creditScore ?? "—"}</td>
                      <td className="px-5 py-4">
                        {score && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${riskColor[score.riskCategory]}`}>
                            {score.riskCategory}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 flex gap-2">
                        {loan.officerId === officerId || !loan.officerId ? (
                          <Link href={`/officer/review/${loan.id}`}>
                            <button className="flex items-center gap-1 text-[var(--color-primary)] font-bold text-xs hover:underline">
                              <span className="material-symbols-outlined text-sm">open_in_new</span>Review
                            </button>
                          </Link>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">ASSIGNED</span>
                        )}
                        
                        {!loan.officerId && (
                          <button 
                            onClick={async () => {
                              try {
                                await api.patch(`/loan-applications/${loan.id}/assign`, { officerId });
                                window.location.reload();
                              } catch (e) {
                                alert("Claim failed.");
                              }
                            }}
                            className="text-[10px] font-bold text-white bg-[var(--color-primary)] px-2 py-1 rounded-lg hover:opacity-90 active:scale-95 transition-all"
                          >
                            CLAIM
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden flex flex-col divide-y divide-slate-100">
              {pending.slice(0, 5).map((loan) => {
                const score = loan.applicant?.creditScores?.[0];
                return (
                  <div key={loan.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold text-slate-900 text-base">{loan.applicant?.fullName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{loan.applicant?.employmentType} • {loan.loanType?.loanTypeName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 text-base">₹{loan.loanAmount.toLocaleString()}</div>
                        {score && <div className={`text-[10px] font-bold uppercase mt-1 ${riskColor[score.riskCategory]}`}>{score.riskCategory}</div>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                      <div className="text-xs font-bold text-slate-500">
                        Score: <span className="text-[var(--color-primary)]">{score?.creditScore ?? "—"}</span>
                      </div>
                      <div className="flex gap-2">
                        {loan.officerId === officerId || !loan.officerId ? (
                          <Link href={`/officer/review/${loan.id}`}>
                            <button className="flex items-center gap-1 text-[var(--color-primary)] font-bold text-xs bg-[var(--color-primary)]/10 px-3 py-1.5 rounded-lg">
                              Review
                            </button>
                          </Link>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">ASSIGNED</span>
                        )}
                        
                        {!loan.officerId && (
                          <button 
                            onClick={async () => {
                              try {
                                await api.patch(`/loan-applications/${loan.id}/assign`, { officerId });
                                window.location.reload();
                              } catch (e) {
                                alert("Claim failed.");
                              }
                            }}
                            className="text-[10px] font-bold text-white bg-[var(--color-primary)] px-3 py-1.5 rounded-lg hover:opacity-90"
                          >
                            CLAIM
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
      )}
    </div>
  </div>
);
}
