"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, LoanApplication } from "@/lib/api";
import { getSession } from "@/lib/session";
import Link from "next/link";

const statusStyle: Record<string, string> = {
  Pending:  "bg-yellow-100 text-yellow-800",
  Approved: "bg-green-100 text-green-800",
  Rejected: "bg-red-100 text-red-800",
};

const riskStyle: Record<string, string> = {
  Low:    "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High:   "bg-red-100 text-red-800",
};

export default function OfficerQueuePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { data: loans = [], isLoading, error } = useQuery<LoanApplication[]>({
    queryKey: ["loan-applications"],
    queryFn: async () => (await api.get("/loan-applications")).data,
    refetchInterval: 10_000,
  });

  const pending  = loans.filter((l) => l.loanStatus === "Pending").length;
  const approved = loans.filter((l) => l.loanStatus === "Approved").length;
  const rejected = loans.filter((l) => l.loanStatus === "Rejected").length;

  const totalPages = Math.ceil(loans.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLoans = loans.slice(startIndex, startIndex + pageSize);
  const startRange = loans.length > 0 ? startIndex + 1 : 0;
  const endRange = Math.min(startIndex + pageSize, loans.length);

  return (
    <div className="space-y-0">
      <header className="sticky top-0 bg-white/90 backdrop-blur-xl border-b border-slate-100 px-4 py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-40">
        <div>
          <h2 className="font-headline text-base lg:text-2xl font-bold text-slate-900 tracking-tight">Queue</h2>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-0.5">
            <p className="text-slate-500 text-[9px]">{loans.length} items</p>
            <div className="hidden sm:block h-4 w-[1px] bg-slate-200" />
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{startRange}-{endRange} of {loans.length}</span>
              <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                </button>
                <div className="w-[1px] bg-slate-200 my-1 mx-0.5" />
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                >
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6">
        {/* Stats strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Pending", value: pending,  color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
            { label: "Approved",       value: approved, color: "text-green-700 bg-green-50 border-green-200"   },
            { label: "Rejected",       value: rejected, color: "text-red-600 bg-red-50 border-red-200"         },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl border p-4 flex items-center justify-between md:flex-col md:items-start md:gap-2 ${color}`}>
              <p className="text-xs font-bold uppercase tracking-wider opacity-70">{label}</p>
              <p className="font-headline text-2xl lg:text-4xl font-extrabold">{value}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 w-full overflow-x-auto">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center gap-3 text-slate-400">
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
              Loading queue…
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">
              <span className="material-symbols-outlined text-4xl mb-2">cloud_off</span>
              <p className="font-semibold">Backend unreachable. Is it running on :5000?</p>
            </div>
          ) : loans.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-2">done_all</span>
              <p>No applications yet.</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <table className="hidden md:table w-full text-sm text-left min-w-[800px]">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    {["#", "Applicant", "Loan Type", "Amount", "Tenure", "Score", "Officer", "Status", "Action"].map((h) => (
                      <th key={h} className="px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedLoans.map((loan) => {
                    const score = loan.applicant?.creditScores?.[0];
                    const currentOfficerId = getSession()?.id;
                    
                    const handleClaim = async () => {
                      if (!currentOfficerId) { alert("Please log in first."); return; }
                      try {
                        await api.patch(`/loan-applications/${loan.id}/assign`, { officerId: currentOfficerId });
                        window.location.reload(); // Quick refresh
                      } catch (e) {
                        alert("Assignment failed.");
                      }
                    };

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 text-slate-400 text-xs font-mono">{loan.id}</td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">{loan.applicant?.fullName}</div>
                          <div className="text-xs text-slate-400">{loan.applicant?.employmentType}</div>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">{loan.loanType?.loanTypeName}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">₹{loan.loanAmount.toLocaleString()}</td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium">{loan.tenureMonths}m</td>
                        <td className="px-4 py-3.5">
                          <span className={`font-bold ${score?.creditScore && score.creditScore >= 750 ? "text-green-600" : score?.creditScore && score.creditScore >= 650 ? "text-yellow-600" : "text-red-500"}`}>
                            {score?.creditScore ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {loan.officer ? (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-100 w-fit">
                              <span className="material-symbols-outlined text-xs text-indigo-400" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                              <span className="text-[10px] font-bold text-indigo-700 truncate max-w-[80px]">{loan.officer.name.split(" ")[0]}</span>
                            </div>
                          ) : (
                            <button 
                              onClick={handleClaim}
                              className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-lg hover:bg-[var(--color-primary)]/20 transition-colors"
                            >
                              CLAIM
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyle[loan.loanStatus]}`}>{loan.loanStatus}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <Link href={`/officer/review/${loan.id}`}>
                            <button className="flex items-center gap-1 text-[var(--color-primary)] text-xs font-bold hover:underline">
                              <span className="material-symbols-outlined text-base">arrow_forward</span>
                              Review
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Mobile Card Stack */}
              <div className="grid grid-cols-1 gap-4 p-4 md:hidden bg-slate-50/50">
                {paginatedLoans.map((loan) => {
                  const score = loan.applicant?.creditScores?.[0];
                  const currentOfficerId = getSession()?.id;
                  
                  const handleClaim = async () => {
                    if (!currentOfficerId) { alert("Please log in first."); return; }
                    try {
                      await api.patch(`/loan-applications/${loan.id}/assign`, { officerId: currentOfficerId });
                      window.location.reload();
                    } catch (e) {
                      alert("Assignment failed.");
                    }
                  };

                  return (
                    <div key={loan.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-4">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                        <div>
                          <div className="font-bold text-slate-900 text-base">{loan.applicant?.fullName}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{loan.applicant?.employmentType} • {loan.loanType?.loanTypeName}</div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${statusStyle[loan.loanStatus]}`}>{loan.loanStatus}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Amount</p>
                          <p className="font-bold text-slate-900 text-base">₹{loan.loanAmount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Tenure</p>
                          <p className="font-medium text-slate-700 text-base">{loan.tenureMonths}m</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Score</p>
                          <p className={`font-bold text-base ${score?.creditScore && score.creditScore >= 750 ? "text-green-600" : score?.creditScore && score.creditScore >= 650 ? "text-yellow-600" : "text-red-500"}`}>
                            {score?.creditScore ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Officer</p>
                          <div className="mt-0.5">
                            {loan.officer ? (
                              <span className="text-sm font-bold text-indigo-700">{loan.officer.name.split(" ")[0]}</span>
                            ) : (
                              <button onClick={handleClaim} className="text-[10px] font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2.5 py-1 rounded hover:bg-[var(--color-primary)]/20">CLAIM</button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <Link href={`/officer/review/${loan.id}`} className="w-full block">
                          <button className="w-full flex items-center justify-center gap-2 bg-[var(--color-primary)]/5 hover:bg-[var(--color-primary)]/10 text-[var(--color-primary)] py-2.5 rounded-lg text-sm font-bold transition-colors">
                            <span className="material-symbols-outlined text-base">arrow_forward</span>
                            Review Application
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>

          )}
      </div>
    </div>
    </div>
  );
}
