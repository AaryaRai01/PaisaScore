"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, LoanApplication, calcEMI } from "@/lib/api";
import { getSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

const riskStyle: Record<string, string> = {
  Low:    "bg-green-100 text-green-800 border-green-200",
  Medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  High:   "bg-red-100 text-red-800 border-red-200",
};

export default function OfficerReviewPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [decision, setDecision] = useState<"Approved" | "Rejected" | "">("");
  const [reason, setReason] = useState("");

  const { data: loan, isLoading } = useQuery<LoanApplication>({
    queryKey: ["loan", id],
    queryFn: async () => (await api.get(`/loan-applications/${id}`)).data,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const currentOfficerId = getSession()?.id;
      if (!currentOfficerId) throw new Error("No officer session");
      return api.post("/approval-decisions", { 
        loanId: Number(id), 
        decisionStatus: decision, 
        decisionReason: reason,
        officerId: currentOfficerId 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loan-applications"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      showToast(decision === "Approved" ? "✅ Loan Approved & Disbursed!" : "❌ Application Rejected.", decision === "Approved" ? "success" : "error");
      setTimeout(() => router.push("/officer/queue"), 1200);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || "Failed to submit decision.";
      showToast(msg, "error");
    },
  });

  const handleSubmit = () => {
    if (!decision) { showToast("Select Approved or Rejected.", "error"); return; }
    if (reason.trim().length < 10) { showToast("Reason must be at least 10 characters.", "error"); return; }
    mutation.mutate();
  };

  if (isLoading)
    return <div className="p-12 flex items-center gap-3 text-slate-400"><span className="material-symbols-outlined animate-spin">progress_activity</span>Loading application…</div>;

  if (!loan) return <div className="p-12 text-center text-red-500">Application not found.</div>;

  const score = loan.applicant?.creditScores?.[0];
  const history = loan.applicant?.creditHistory;
  const emi = calcEMI(loan.loanAmount, loan.loanType?.interestRate ?? 10, loan.tenureMonths);
  const isSettled = loan.loanStatus === "Approved" || loan.loanStatus === "Rejected";

  return (
    <div className="p-8 max-w-4xl mx-auto pb-16 space-y-8">
      {/* Back + header */}
      <div>
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-5">
          <span className="material-symbols-outlined text-sm">arrow_back</span>Back to Queue
        </button>
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="font-headline text-3xl font-extrabold text-slate-900">{loan.applicant?.fullName}</h1>
            <p className="text-slate-400 text-sm mt-1">Loan Application #{loan.id} · Applied {new Date(loan.applicationDate).toLocaleDateString()}</p>
          </div>
          <span className={`flex-shrink-0 mt-1 px-4 py-1.5 rounded-full text-xs font-bold border ${
            loan.loanStatus === "Approved" ? "bg-green-100 text-green-800 border-green-200" :
            loan.loanStatus === "Rejected" ? "bg-red-100 text-red-800 border-red-200" :
            "bg-yellow-100 text-yellow-800 border-yellow-200"
          }`}>
            {loan.loanStatus}
          </span>
        </div>
      </div>

      {/* Row 1: Applicant profile + Credit Score */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Applicant Info */}
        <div className="md:col-span-7 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-headline font-bold text-slate-900 text-lg mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            Applicant Profile
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Age",             value: `${loan.applicant?.age} years`                  },
              { label: "Gender",          value: loan.applicant?.gender ?? "—"                    },
              { label: "Employment",      value: loan.applicant?.employmentType ?? "—"             },
              { label: "Monthly Income",  value: `₹${loan.applicant?.monthlyIncome.toLocaleString()}` },
              { label: "Contact",         value: loan.applicant?.contactNumber ?? "—"             },
              { label: "Address",         value: loan.applicant?.address ?? "—"                   },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="font-semibold text-slate-800 text-sm">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Credit Score */}
        <div className="md:col-span-5 bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
          <h3 className="font-headline font-bold text-slate-900 text-lg mb-4 self-start">Credit Score</h3>
          <div className="relative w-36 h-36">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-surface-container)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke="var(--color-primary)" strokeWidth="10"
                strokeDasharray="263.9"
                strokeDashoffset={263.9 - 263.9 * ((score?.creditScore ?? 0) / 900)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-headline text-3xl font-extrabold text-slate-900">{score?.creditScore ?? "—"}</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-wider">/ 900</span>
            </div>
          </div>
          {score && (
            <span className={`mt-4 px-4 py-1.5 rounded-full text-xs font-bold border ${riskStyle[score.riskCategory]}`}>
              {score.riskCategory} Risk
            </span>
          )}
          <p className="text-[10px] text-slate-400 mt-2">Last updated {score ? new Date(score.scoreDate).toLocaleDateString() : "—"}</p>
        </div>
      </div>

      {/* Row 2: Credit History + Loan Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Credit History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-headline font-bold text-slate-900 text-lg mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)]">history</span>
            Credit History
          </h3>
          <div className="space-y-4">
            {[
              { label: "Credit Length",  value: `${history?.creditLengthYears ?? 0} years`,  icon: "calendar_today" },
              { label: "Total Loans",    value: `${history?.totalLoans ?? 0} loans`,           icon: "description"    },
              { label: "Default Count",  value: `${history?.defaultCount ?? 0} defaults`,      icon: "warning",       danger: (history?.defaultCount ?? 0) > 0 },
              { label: "Last Updated",   value: history ? new Date(history.lastUpdated).toLocaleDateString() : "—", icon: "update" },
            ].map(({ label, value, icon, danger }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-100" : "bg-[var(--color-primary)]/10"}`}>
                  <span className={`material-symbols-outlined text-sm ${danger ? "text-red-500" : "text-[var(--color-primary)]"}`}>{icon}</span>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{label}</p>
                  <p className={`font-bold text-sm ${danger ? "text-red-500" : "text-slate-800"}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Loan Request */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-headline font-bold text-slate-900 text-lg mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[var(--color-primary)]">payments</span>
            Loan Request
          </h3>
          <div className="space-y-4">
            {[
              { label: "Loan Type",       value: loan.loanType?.loanTypeName ?? "—" },
              { label: "Loan Amount",     value: `₹${loan.loanAmount.toLocaleString()}` },
              { label: "Tenure",          value: `${loan.tenureMonths} months (${Math.floor(loan.tenureMonths / 12)} yrs ${loan.tenureMonths % 12} mo)` },
              { label: "Interest Rate",   value: `${loan.loanType?.interestRate ?? 0}% per annum` },
              { label: "Estimated EMI",   value: `₹${emi.toLocaleString()} / month`, highlight: true },
              { label: "Total Repayment", value: `₹${(emi * loan.tenureMonths).toLocaleString()}` },
            ].map(({ label, value, highlight }) => (
              <div key={label} className={`flex justify-between items-center py-1 ${highlight ? "border-t border-slate-100 pt-3 mt-1" : ""}`}>
                <span className="text-xs font-semibold text-slate-500">{label}</span>
                <span className={`font-bold text-sm ${highlight ? "text-[var(--color-primary)] text-base" : "text-slate-800"}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decision Panel */}
      {isSettled ? (
        <div className={`p-5 rounded-xl border flex items-center gap-4 ${
          loan.loanStatus === "Approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}>
          <span className={`material-symbols-outlined text-3xl ${loan.loanStatus === "Approved" ? "text-green-600" : "text-red-600"}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {loan.loanStatus === "Approved" ? "check_circle" : "cancel"}
          </span>
          <div>
            <p className={`font-bold ${loan.loanStatus === "Approved" ? "text-green-800" : "text-red-800"}`}>
              Application {loan.loanStatus} on {loan.approvalDecision ? new Date(loan.approvalDecision.decisionDate).toLocaleDateString() : "—"}
            </p>
            <p className={`text-sm mt-0.5 ${loan.loanStatus === "Approved" ? "text-green-700" : "text-red-700"}`}>
              Reason: {loan.approvalDecision?.decisionReason ?? "—"}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-5">
          <h3 className="font-headline font-bold text-slate-900 text-lg">Officer Decision</h3>
          <div className="flex gap-4">
            {(["Approved", "Rejected"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDecision(d)}
                className={`flex-1 py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  decision === d
                    ? d === "Approved"
                      ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/25"
                      : "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/25"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {d === "Approved" ? "check_circle" : "cancel"}
                </span>
                {d}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
              Decision Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Good credit score and stable income supports this loan request…"
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">Minimum 10 characters required</p>
          </div>
          <button
            id="submit-decision"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="w-full py-3.5 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary)]/20"
          >
            {mutation.isPending ? (
              <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Processing…</>
            ) : (
              <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>Submit Decision</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
