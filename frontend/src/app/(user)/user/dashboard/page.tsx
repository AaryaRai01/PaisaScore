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
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[100vw] overflow-hidden">
      {/* Welcome */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Welcome, {name.split(" ")[0]} 👋
          </h2>
          <p className="text-slate-500 text-sm mt-1">Your financial overview.</p>
        </div>
        <Link href="/user/apply">
          <button className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-sm shadow-md shadow-[var(--color-primary)]/20 hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>add_card</span>
            Apply Now
          </button>
        </Link>
      </header>

      {/* Top row: Score gauge + stats */}
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6">
        {/* Credit Score Card */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center gap-5">
          <h3 className="font-headline font-bold text-slate-900 text-base lg:text-lg self-start uppercase tracking-wider">My Credit Score</h3>
          <div className="relative w-36 h-36 lg:w-44 lg:h-44">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-surface-container)" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="var(--color-primary)" strokeWidth="9"
                strokeDasharray="263.9" strokeDashoffset={gaugeOffset} strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-4xl lg:text-5xl font-extrabold text-slate-900">{score?.creditScore ?? "—"}</span>
              <span className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase tracking-wider">/ 900</span>
            </div>
          </div>
          {score && (
            <div className={`px-4 py-2 rounded-full text-xs lg:text-sm font-bold ${riskColor[score.riskCategory]}`}>
              {score.riskCategory} Risk
            </div>
          )}
        </div>

        {/* Quick stat cards - Stacked on mobile */}
        <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Total Applications", value: loans.length.toString(), icon: "description", sub: "Loan applications filed" },
            { label: "Pending Decisions", value: pending.toString(), icon: "hourglass_empty", sub: "Awaiting officer review" },
            { label: "Total Borrowed", value: `₹${totalBorrowed.toLocaleString()}`, icon: "account_balance_wallet", sub: "Total approved amount" },
            { label: "Credit History", value: `${history?.creditLengthYears ?? 0} yrs`, icon: "history", sub: "Length on record" },
          ].map(({ label, value, icon, sub }) => (
            <div key={label} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{label}</span>
                <span className="material-symbols-outlined text-[var(--color-primary)] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <span className="font-headline text-2xl font-extrabold text-slate-900">{value}</span>
              <span className="text-xs text-slate-400">{sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Applications */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-headline text-lg font-bold text-slate-900">Recent Applications</h3>
          <Link href="/user/applications"><span className="text-xs font-bold text-[var(--color-primary)] hover:underline cursor-pointer uppercase">View All →</span></Link>
        </div>
        {loans.length === 0 ? (
          <div className="p-10 text-center text-slate-400">
            <span className="material-symbols-outlined text-5xl mb-3">inbox</span>
            <p className="mb-4">No applications yet.</p>
            <Link href="/user/apply">
              <button className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-sm font-bold">Apply Now</button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left min-w-[500px]">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>{["Loan Type", "Amount", "Tenure", "EMI", "Status"].map((h) => <th key={h} className="px-5 py-3">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loans.slice(0, 3).map((loan) => {
                  const r = (loan.loanType?.interestRate ?? 10) / 12 / 100;
                  const n = loan.tenureMonths;
                  const emi = r === 0 ? Math.round(loan.loanAmount / n) : Math.round((loan.loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-900">{loan.loanType?.loanTypeName}</td>
                      <td className="px-5 py-4 font-semibold">₹{loan.loanAmount.toLocaleString()}</td>
                      <td className="px-5 py-4 text-slate-500">{loan.tenureMonths} mo</td>
                      <td className="px-5 py-4 font-semibold text-[var(--color-primary)]">₹{emi.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${loan.loanStatus === "Approved" ? "bg-green-100 text-green-800" : loan.loanStatus === "Rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
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
