"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, Applicant, LoanApplication } from "@/lib/api";
import { getSession } from "@/lib/session";
import Link from "next/link";

export default function UserDashboard() {
  const [applicantId, setApplicantId] = useState<number | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    const s = getSession();
    if (s?.applicantId) { setApplicantId(s.applicantId); setName(s.applicantName ?? ""); }
  }, []);

  const { data: applicant } = useQuery<Applicant>({
    queryKey: ["applicant", applicantId],
    queryFn: async () => (await api.get(`/applicants/${applicantId}`)).data,
    enabled: !!applicantId,
  });

  const { data: loans = [] } = useQuery<LoanApplication[]>({
    queryKey: ["my-loans", applicantId],
    queryFn: async () => (await api.get(`/loan-applications/by-applicant/${applicantId}`)).data,
    enabled: !!applicantId,
    refetchInterval: 10_000,
  });

  const score = applicant?.creditScores?.[0];
  const history = applicant?.creditHistory;
  const pending = loans.filter((l) => l.loanStatus === "Pending").length;
  const approved = loans.filter((l) => l.loanStatus === "Approved");
  const totalBorrowed = approved.reduce((s, l) => s + l.loanAmount, 0);

  const riskColor: Record<string, string> = {
    Low: "text-green-600 bg-green-50",
    Medium: "text-yellow-600 bg-yellow-50",
    High: "text-red-600 bg-red-50",
  };

  const gaugeOffset = score ? 263.9 - 263.9 * (score.creditScore / 900) : 263.9;

  return (
    <div className="p-2 sm:p-4 lg:p-8 space-y-4 lg:space-y-8">
      {/* Welcome */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-headline text-lg lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Welcome, {name.split(" ")[0]} 👋
          </h2>
          <p className="text-slate-500 text-[10px] lg:text-sm mt-0.5">Your financial overview.</p>
        </div>
        <Link href="/user/apply" className="w-full sm:w-auto">
          <button className="w-full flex items-center justify-center gap-2 px-3 py-1.5 lg:px-5 lg:py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-xs lg:text-sm shadow-md shadow-[var(--color-primary)]/20 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_card</span>
            Apply Now
          </button>
        </Link>
      </header>

      {/* Top row: Score gauge + stats */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Credit Score Card */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-100 p-4 lg:p-6 flex flex-col items-center gap-3 lg:gap-5">
          <h3 className="font-headline font-bold text-slate-900 text-sm lg:text-lg self-start uppercase tracking-wider">My Credit Score</h3>
          <div className="relative w-28 h-28 lg:w-44 lg:h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-surface-container)" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="var(--color-primary)" strokeWidth="9"
                strokeDasharray="263.9" strokeDashoffset={gaugeOffset} strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-2xl lg:text-5xl font-extrabold text-slate-900">{score?.creditScore ?? "—"}</span>
              <span className="text-[8px] lg:text-xs text-slate-400 font-bold uppercase tracking-wider">/ 900</span>
            </div>
          </div>
          {score && (
            <div className={`px-2.5 py-1 lg:px-4 lg:py-2 rounded-full text-[10px] lg:text-sm font-bold ${riskColor[score.riskCategory]}`}>
              {score.riskCategory} Risk
            </div>
          )}
        </div>

        {/* Quick stat cards */}
        <div className="lg:col-span-8 grid grid-cols-2 gap-2 lg:gap-4">
          {[
            { label: "Applications", value: loans.length.toString(), icon: "description", sub: "Filed" },
            { label: "Pending", value: pending.toString(), icon: "hourglass_empty", sub: "Review" },
            { label: "Borrowed", value: `₹${(totalBorrowed / 1000).toFixed(0)}k`, icon: "account_balance_wallet", sub: "Total" },
            { label: "History", value: `${history?.creditLengthYears ?? 0}y`, icon: "history", sub: "Length" },
          ].map(({ label, value, icon, sub }) => (
            <div key={label} className="bg-white p-3 lg:p-5 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <span className="text-[8px] lg:text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
                <span className="material-symbols-outlined text-[var(--color-primary)] text-base lg:text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <span className="font-headline text-lg lg:text-2xl font-extrabold text-slate-900">{value}</span>
              <span className="text-[8px] lg:text-xs text-slate-400">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-headline text-sm lg:text-lg font-bold text-slate-900 uppercase tracking-tight">Recent Applications</h3>
          <Link href="/user/applications"><span className="text-[10px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer uppercase">All →</span></Link>
        </div>
        {loans.length === 0 ? (
          <div className="p-6 text-center text-slate-400">
            <span className="material-symbols-outlined text-3xl mb-2">inbox</span>
            <p className="text-xs mb-3">No applications yet.</p>
            <Link href="/user/apply">
              <button className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg text-xs font-bold">Apply Now</button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px] lg:text-sm text-left min-w-[400px]">
              <thead className="bg-slate-50 text-[8px] lg:text-xs uppercase tracking-wider text-slate-500">
                <tr>{["Loan Type", "Amount", "EMI", "Status"].map((h) => <th key={h} className="px-4 py-2">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loans.slice(0, 3).map((loan) => {
                  const r = (loan.loanType?.interestRate ?? 10) / 12 / 100;
                  const n = loan.tenureMonths;
                  const emi = r === 0 ? Math.round(loan.loanAmount / n) : Math.round((loan.loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900 truncate max-w-[100px]">{loan.loanType?.loanTypeName}</td>
                      <td className="px-4 py-3 font-semibold">₹{(loan.loanAmount / 1000).toFixed(0)}k</td>
                      <td className="px-4 py-3 font-semibold text-[var(--color-primary)]">₹{(emi / 1000).toFixed(1)}k</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${loan.loanStatus === "Approved" ? "bg-green-100 text-green-800" : loan.loanStatus === "Rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {loan.loanStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
