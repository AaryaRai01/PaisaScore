"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, LoanApplication, calcEMI } from "@/lib/api";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default function UserApplicationsPage() {
  const [applicantId, setApplicantId] = useState<number | null>(null);

  useEffect(() => {
    const s = getSession();
    if (s?.applicantId) setApplicantId(s.applicantId);
  }, []);

  const { data: loans = [], isLoading } = useQuery<LoanApplication[]>({
    queryKey: ["my-loans", applicantId],
    queryFn: async () => (await api.get(`/loan-applications/by-applicant/${applicantId}`)).data,
    enabled: !!applicantId,
    refetchInterval: 10_000,
  });

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-slate-900">My Applications</h2>
          <p className="text-slate-500 mt-1">All loan applications linked to your account · auto-refreshes</p>
        </div>
        <Link href="/user/apply">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-sm shadow-md shadow-[var(--color-primary)]/20 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_card</span>
            New Application
          </button>
        </Link>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400 p-8">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>Loading…
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">description</span>
          <p className="font-semibold text-slate-600 mb-2">No applications yet.</p>
          <Link href="/user/apply">
            <button className="mt-3 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold">Apply Now →</button>
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {loans.map((loan) => {
            const emi = calcEMI(loan.loanAmount, loan.loanType?.interestRate ?? 10, loan.tenureMonths);
            return (
              <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Loan icon */}
                  <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {loan.loanType?.loanTypeName?.includes("Home") ? "home" : loan.loanType?.loanTypeName?.includes("Car") ? "directions_car" : loan.loanType?.loanTypeName?.includes("Education") ? "school" : "payments"}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Loan Type</p>
                      <p className="font-bold text-slate-900">{loan.loanType?.loanTypeName}</p>
                      <p className="text-xs text-slate-400">{loan.loanType?.interestRate}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Amount</p>
                      <p className="font-bold text-slate-900">₹{loan.loanAmount.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{loan.tenureMonths} months</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Monthly EMI</p>
                      <p className="font-bold text-[var(--color-primary)]">₹{emi.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Total: ₹{(emi * loan.tenureMonths).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Applied On</p>
                      <p className="font-semibold text-slate-800">{new Date(loan.applicationDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                      loan.loanStatus === "Approved" ? "bg-green-100 text-green-800" :
                      loan.loanStatus === "Rejected" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {loan.loanStatus}
                    </span>
                  </div>
                </div>

                {/* Decision reason */}
                {loan.approvalDecision && (
                  <div className={`mt-5 p-4 rounded-xl border text-sm flex items-start gap-3 ${
                    loan.approvalDecision.decisionStatus === "Approved"
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}>
                    <span className={`material-symbols-outlined text-xl flex-shrink-0 ${loan.approvalDecision.decisionStatus === "Approved" ? "text-green-600" : "text-red-600"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      {loan.approvalDecision.decisionStatus === "Approved" ? "check_circle" : "cancel"}
                    </span>
                    <div>
                      <p className={`font-bold text-sm ${loan.approvalDecision.decisionStatus === "Approved" ? "text-green-800" : "text-red-800"}`}>
                        Officer Decision: {loan.approvalDecision.decisionStatus}
                      </p>
                      <p className={`text-xs mt-0.5 ${loan.approvalDecision.decisionStatus === "Approved" ? "text-green-700" : "text-red-700"}`}>
                        {loan.approvalDecision.decisionReason}
                      </p>
                    </div>
                  </div>
                )}

                {loan.loanStatus === "Pending" && (
                  <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-xs text-yellow-800 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">hourglass_empty</span>
                    Your application is under review by a loan officer.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
