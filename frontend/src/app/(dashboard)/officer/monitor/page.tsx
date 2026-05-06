"use client";

import { useQuery } from "@tanstack/react-query";
import { api, LoanApplication, calcEMI } from "@/lib/api";
import Link from "next/link";

export default function LoanMonitorPage() {
  const { data: loans = [], isLoading } = useQuery<LoanApplication[]>({
    queryKey: ["loan-applications"],
    queryFn: async () => (await api.get("/loan-applications")).data,
    refetchInterval: 10_000,
  });

  const approved = loans.filter((l) => l.loanStatus === "Approved");
  const totalPortfolio = approved.reduce((s, l) => s + l.loanAmount, 0);

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8 max-w-[100vw] overflow-hidden">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Loan Monitor</h2>
          <p className="text-slate-500 text-sm mt-1">All approved & active loans — real-time repayment tracking</p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Portfolio</p>
          <p className="font-headline text-2xl lg:text-3xl font-extrabold text-[var(--color-primary)]">₹{totalPortfolio.toLocaleString()}</p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400 p-8">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>Loading…
        </div>
      ) : approved.length === 0 ? (
        <div className="p-12 bg-white rounded-xl text-center text-slate-400">
          <span className="material-symbols-outlined text-5xl mb-3">monitoring</span>
          <p>No approved loans yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approved.map((loan) => {
            const emi = calcEMI(loan.loanAmount, loan.loanType?.interestRate ?? 10, loan.tenureMonths);
            const paidCount = loan.repayments?.filter((r) => r.paymentStatus === "Paid").length ?? 0;
            const dueCount = loan.repayments?.filter((r) => r.paymentStatus === "Due" || r.paymentStatus === "Overdue").length ?? 0;
            const latestRepayment = loan.repayments?.[loan.repayments.length - 1];
            const totalPaid = loan.repayments?.filter((r) => r.paymentStatus === "Paid").reduce((s, r) => s + r.amountPaid, 0) ?? 0;
            const progress = loan.loanAmount > 0 ? (totalPaid / loan.loanAmount) * 100 : 0;

            return (
              <div key={loan.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  {/* Info */}
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Applicant</p>
                      <p className="font-bold text-slate-900">{loan.applicant?.fullName}</p>
                      <p className="text-xs text-slate-400">{loan.loanType?.loanTypeName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Principal</p>
                      <p className="font-bold">₹{loan.loanAmount.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{loan.tenureMonths} months</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Monthly EMI</p>
                      <p className="font-bold text-[var(--color-primary)]">₹{emi.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">{loan.loanType?.interestRate}% p.a.</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">Repayments</p>
                      <p className="font-bold">{paidCount} Paid  · <span className={dueCount > 0 ? "text-red-500" : ""}>{dueCount} Due</span></p>
                      {latestRepayment && (
                        <p className="text-xs text-slate-400">Remaining: ₹{latestRepayment.remainingAmount.toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  {/* View link */}
                  <Link href={`/officer/review/${loan.id}`}>
                    <button className="flex items-center gap-1 text-[var(--color-primary)] text-xs font-bold border border-[var(--color-primary)]/30 px-3 py-2 rounded-lg hover:bg-[var(--color-primary)]/5 transition-colors">
                      <span className="material-symbols-outlined text-sm">open_in_new</span>Details
                    </button>
                  </Link>
                </div>

                {/* Progress bar */}
                <div className="mt-5">
                  <div className="flex justify-between text-[10px] text-slate-400 mb-1.5">
                    <span>Repayment Progress</span>
                    <span>₹{totalPaid.toLocaleString()} paid of ₹{loan.loanAmount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-primary)] rounded-full transition-all"
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Detailed EMI Ledger */}
                {(loan.repayments?.length ?? 0) > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px]">receipt_long</span> EMI Transaction Ledger
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-2 rounded-lg scrollbar-thin scrollbar-thumb-slate-200">
                      {loan.repayments!.map((r) => (
                        <div key={r.id} className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${r.paymentStatus === "Paid" ? "bg-green-50/40 border-green-100" : "bg-yellow-50/40 border-yellow-100"}`}>
                          <div className="flex items-center gap-3">
                            <span className={`material-symbols-outlined text-[16px] ${r.paymentStatus === "Paid" ? "text-green-600" : "text-yellow-600"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                              {r.paymentStatus === "Paid" ? "check_circle" : "error"}
                            </span>
                            <div>
                              <p className={`text-xs font-bold ${r.paymentStatus === "Paid" ? "text-green-800" : "text-yellow-800"}`}>
                                ₹{r.amountPaid.toLocaleString()}
                              </p>
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 bg-white px-1 py-0.5 rounded shadow-sm border border-slate-100">{r.paymentStatus}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[11px] font-semibold text-slate-600">{new Date(r.paymentDate).toLocaleDateString()}</p>
                            <p className="text-[10px] text-slate-400 font-medium">Bal: ₹{r.remainingAmount.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
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
