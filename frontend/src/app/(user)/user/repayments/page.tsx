"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, LoanApplication, Repayment, calcEMI } from "@/lib/api";
import { getSession } from "@/lib/session";
import { useToast } from "@/components/ui/Toast";

function LoanRepaymentCard({ loan }: { loan: LoanApplication }) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: repayments = [] } = useQuery<Repayment[]>({
    queryKey: ["repayments", loan.id],
    queryFn: async () => (await api.get(`/repayments/by-loan/${loan.id}`)).data,
    refetchInterval: 10_000,
  });

  const emi          = calcEMI(loan.loanAmount, loan.loanType?.interestRate ?? 10, loan.tenureMonths);
  const paidCount    = repayments.filter((r) => r.paymentStatus === "Paid").length;
  const duePayment   = repayments.find((r) => r.paymentStatus === "Due" || r.paymentStatus === "Overdue");
  const totalPaid    = repayments.filter((r) => r.paymentStatus === "Paid").reduce((s, r) => s + r.amountPaid, 0);
  const remaining    = duePayment?.remainingAmount ?? (loan.loanAmount - totalPaid);
  const progress     = Math.min((totalPaid / loan.loanAmount) * 100, 100);

  const payMutation = useMutation({
    mutationFn: () => api.post("/repayments", {
      loanId: loan.id,
      amountPaid: emi,
      remainingAmount: Math.max(0, remaining - emi),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repayments", loan.id] });
      showToast(`Payment of ₹${emi.toLocaleString()} made successfully!`);
    },
    onError: () => showToast("Payment failed. Please try again.", "error"),
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {loan.loanType?.loanTypeName?.includes("Home") ? "home" : loan.loanType?.loanTypeName?.includes("Car") ? "directions_car" : loan.loanType?.loanTypeName?.includes("Education") ? "school" : "payments"}
            </span>
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{loan.loanType?.loanTypeName}</h3>
            <p className="text-xs text-slate-400">₹{loan.loanAmount.toLocaleString()} · {loan.tenureMonths} months · {loan.loanType?.interestRate}% p.a.</p>
          </div>
        </div>
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Active</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 text-center">
        {[
          { label: "Monthly EMI",   value: `₹${emi.toLocaleString()}`, highlight: true },
          { label: "Paid So Far",   value: `₹${totalPaid.toLocaleString()}` },
          { label: "Remaining",     value: `₹${Math.max(0, remaining).toLocaleString()}` },
          { label: "EMIs Paid",     value: `${paidCount} / ${loan.tenureMonths}` },
        ].map(({ label, value, highlight }) => (
          <div key={label} className={`rounded-xl p-3 ${highlight ? "bg-[var(--color-primary)]/8" : "bg-slate-50"}`}>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">{label}</p>
            <p className={`font-bold text-sm ${highlight ? "text-[var(--color-primary)]" : "text-slate-800"}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
          <span>Repayment Progress</span>
          <span>{progress.toFixed(1)}% complete</span>
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Payment history */}
      {repayments.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment History</p>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {repayments.map((r) => (
              <div key={r.id} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${r.paymentStatus === "Paid" ? "bg-green-50" : "bg-yellow-50"}`}>
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${r.paymentStatus === "Paid" ? "text-green-600" : "text-yellow-600"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                    {r.paymentStatus === "Paid" ? "check_circle" : "hourglass_empty"}
                  </span>
                  <span className={`font-semibold ${r.paymentStatus === "Paid" ? "text-green-800" : "text-yellow-800"}`}>
                    ₹{r.amountPaid.toLocaleString()} — {r.paymentStatus}
                  </span>
                </div>
                <span className="text-slate-400">{new Date(r.paymentDate).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pay Now button */}
      {duePayment && (
        <button
          id={`pay-loan-${loan.id}`}
          onClick={() => payMutation.mutate()}
          disabled={payMutation.isPending}
          className="w-full py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-md shadow-[var(--color-primary)]/20"
        >
          {payMutation.isPending ? (
            <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Processing…</>
          ) : (
            <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>Pay EMI — ₹{emi.toLocaleString()}</>
          )}
        </button>
      )}
    </div>
  );
}

export default function UserRepaymentsPage() {
  const [applicantId, setApplicantId] = useState<number | null>(null);

  useEffect(() => {
    const s = getSession();
    if (s?.applicantId) setApplicantId(s.applicantId);
  }, []);

  const { data: loans = [], isLoading } = useQuery<LoanApplication[]>({
    queryKey: ["my-loans", applicantId],
    queryFn: async () => (await api.get(`/loan-applications/by-applicant/${applicantId}`)).data,
    enabled: !!applicantId,
  });

  const approved = loans.filter((l) => l.loanStatus === "Approved");

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
      <header>
        <h2 className="font-headline text-3xl font-extrabold text-slate-900">Repayments</h2>
        <p className="text-slate-500 mt-1">Track EMI payments for your approved loans.</p>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400 p-8">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>Loading…
        </div>
      ) : approved.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">payments</span>
          <p className="font-semibold text-slate-600 mb-2">No active loans.</p>
          <p className="text-slate-400 text-sm mb-6">Apply for a loan and get it approved to see repayments here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {approved.map((loan) => (
            <LoanRepaymentCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}
    </div>
  );
}
