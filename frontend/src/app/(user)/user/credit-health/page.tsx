"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, Applicant } from "@/lib/api";
import { getSession } from "@/lib/session";

const riskConfig: Record<string, { label: string; color: string; gauge: string; tip: string }> = {
  Low:    { label: "Excellent",  color: "text-green-600",  gauge: "var(--color-primary)", tip: "Your credit is in great shape. You qualify for the best rates." },
  Medium: { label: "Fair",       color: "text-yellow-600", gauge: "#f59e0b",               tip: "Moderate risk. Reducing loan obligations can improve your score."  },
  High:   { label: "Needs Work", color: "text-red-600",    gauge: "#ef4444",               tip: "High risk flag. Pay existing loans on time to rebuild credit."     },
};

export default function UserCreditHealthPage() {
  const [applicantId, setApplicantId] = useState<number | null>(null);

  useEffect(() => {
    const s = getSession();
    if (s?.applicantId) setApplicantId(s.applicantId);
  }, []);

  const { data: applicant } = useQuery<Applicant>({
    queryKey: ["applicant", applicantId],
    queryFn: async () => (await api.get(`/applicants/${applicantId}`)).data,
    enabled: !!applicantId,
  });

  const score   = applicant?.creditScores?.[0];
  const history = applicant?.creditHistory;
  const cfg     = score ? riskConfig[score.riskCategory] : riskConfig.Low;
  const gaugeOffset = score ? 263.9 - 263.9 * (score.creditScore / 900) : 263.9;

  // Real historical trend from DB
  const historicScores = [...(applicant?.creditScores || [])].reverse(); // Oldest to newest
  const oldestScore = historicScores.length > 0 ? historicScores[0].creditScore : 750;

  // Pad to 12 data points to keep the chart full (using the oldest known score)
  const allScores = historicScores.map(s => s.creditScore);
  while (allScores.length < 12) {
    allScores.unshift(oldestScore);
  }
  const trend = allScores.slice(-12); // Keep only the latest 12 events
  
  // Dynamic months for X-axis (ending in current month)
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
    return d.toLocaleString('en-US', { month: 'short' });
  });

  const minT = Math.min(...trend, 500), maxT = Math.max(...trend, 900);
  const norm = (v: number) => ((v - minT) / Math.max(maxT - minT, 1)) * 150 + 20;

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-start">
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-slate-900">Credit Health</h2>
          <p className="text-slate-500 mt-1">Your real-time credit profile from our scoring system.</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-colors">
          <span className="material-symbols-outlined text-base">download</span>Download Report
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Score Gauge */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center gap-6">
          <div className="relative w-52 h-52">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-surface-container)" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="42" fill="none" strokeWidth="9"
                stroke={score ? cfg.gauge : "var(--color-primary)"}
                strokeDasharray="263.9" strokeDashoffset={gaugeOffset} strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-6xl font-extrabold text-slate-900">{score?.creditScore ?? "—"}</span>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">/ 900</span>
            </div>
          </div>
          <div className="text-center">
            <p className={`font-headline text-2xl font-extrabold ${cfg.color}`}>{cfg.label}</p>
            <p className="text-xs text-slate-400 mt-1">{score?.riskCategory ?? "—"} Risk · Updated {score ? new Date(score.scoreDate).toLocaleDateString() : "—"}</p>
          </div>
          <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-xs text-slate-600 text-center leading-relaxed">{cfg.tip}</p>
          </div>
        </div>

        {/* Credit Factors */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { icon: "history",          label: "Credit Age",         value: history ? `${history.creditLengthYears} years` : "—",   sub: "Length of your credit history" },
            { icon: "description",      label: "Total Loans Taken",  value: history ? `${history.totalLoans} loans` : "—",          sub: "Across your credit lifetime"    },
            { icon: "warning",          label: "Defaults",           value: history ? `${history.defaultCount}` : "—",              sub: "Missed payments on record", danger: (history?.defaultCount ?? 0) > 0 },
            { icon: "calendar_today",   label: "Last Updated",       value: history ? new Date(history.lastUpdated).toLocaleDateString() : "—", sub: "Credit profile refresh date" },
            { icon: "speed",            label: "Risk Category",      value: score?.riskCategory ?? "—",                              sub: "Based on your latest score"    },
            { icon: "grade",            label: "Score Band",         value: score ? (score.creditScore >= 800 ? "750–900 Excellent" : score.creditScore >= 700 ? "700–749 Good" : score.creditScore >= 600 ? "600–699 Fair" : "Below 600 Poor") : "—", sub: "Where you stand on the scale" },
          ].map(({ icon, label, value, sub, danger }) => (
            <div key={label} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${danger ? "border-red-400" : "border-[var(--color-primary)]"} border border-slate-100`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${danger ? "bg-red-100" : "bg-[var(--color-primary)]/10"}`}>
                  <span className={`material-symbols-outlined text-sm ${danger ? "text-red-500" : "text-[var(--color-primary)]"}`}>{icon}</span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
              </div>
              <p className={`text-xl font-bold font-headline ${danger ? "text-red-500" : "text-slate-900"}`}>{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* EMI Payment History Ledger */}
        <div className="lg:col-span-12 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-headline text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)]">receipt_long</span> 
            EMI Payment History
          </h3>
          
          {(() => {
            const allRepayments = applicant?.loanApplications
              ?.flatMap(loan => loan.repayments?.map(r => ({ ...r, loanName: loan.loanType?.loanTypeName })) || [])
              .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()) || [];

            if (allRepayments.length === 0) {
              return (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">history_edu</span>
                  <p className="text-slate-500 font-medium">No payment history yet.</p>
                  <p className="text-xs text-slate-400">Pay your upcoming EMIs to build your credit ledger.</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <div className="grid grid-cols-4 px-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <div>Transaction Date</div>
                  <div>Loan Account</div>
                  <div>Amount</div>
                  <div className="text-right">Status</div>
                </div>
                
                <div className="space-y-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {allRepayments.map((r, idx) => (
                    <div key={idx} className="grid grid-cols-4 items-center bg-slate-50 hover:bg-slate-100 transition-colors px-4 py-3 rounded-xl border border-slate-100 text-sm">
                      <div className="font-medium text-slate-600">
                        {new Date(r.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <span className="text-[10px] text-slate-400 block mt-0.5">{new Date(r.paymentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="font-bold text-slate-800 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[var(--color-primary)] text-[14px]">
                            {r.loanName?.includes("Home") ? "home" : r.loanName?.includes("Car") ? "directions_car" : "payments"}
                          </span>
                        </div>
                        {r.loanName}
                      </div>
                      <div className="font-bold text-slate-900">
                        ₹{r.amountPaid.toLocaleString()}
                      </div>
                      <div className="text-right flex items-center justify-end gap-1.5">
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md ${r.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {r.paymentStatus}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
