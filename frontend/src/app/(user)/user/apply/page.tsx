"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { api, LoanType, calcEMI } from "@/lib/api";
import { getSession } from "@/lib/session";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";

export default function UserApplyPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [applicantId, setApplicantId] = useState<number | null>(null);
  const [selectedType, setSelectedType] = useState<LoanType | null>(null);
  const [amount, setAmount] = useState("");
  const [tenure, setTenure] = useState("");

  useEffect(() => {
    const s = getSession();
    if (s?.applicantId) setApplicantId(s.applicantId);
  }, []);

  const { data: loanTypes = [] } = useQuery<LoanType[]>({
    queryKey: ["loan-types"],
    queryFn: async () => (await api.get("/loan-types")).data,
  });

  const emi = selectedType && amount && tenure
    ? calcEMI(Number(amount), selectedType.interestRate, Number(tenure))
    : 0;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post("/loan-applications", {
        applicantId,
        loanTypeId: selectedType!.id,
        loanAmount: Number(amount),
        tenureMonths: Number(tenure),
      });
      return res.data;
    },
    onSuccess: () => {
      showToast("Application submitted! Redirecting to your applications…");
      setTimeout(() => router.push("/user/applications"), 1200);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error;
      showToast(typeof msg === "string" ? msg : "Submission failed. Please check your inputs.", "error");
    },
  });

  const handleSubmit = () => {
    if (!selectedType) { showToast("Please select a loan type.", "error"); return; }
    if (!amount || Number(amount) <= 0) { showToast("Enter a valid loan amount.", "error"); return; }
    if (!tenure || Number(tenure) <= 0) { showToast("Enter a valid tenure.", "error"); return; }

    if (Number(tenure) > selectedType.maxTenure) {
      showToast(`Max tenure is ${selectedType.maxTenure} months.`, "error");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-8 lg:space-y-10">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)] text-xs font-bold uppercase tracking-wider mb-4">
          <span className="w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full animate-pulse" />
          Secure Application
        </div>
        <h2 className="font-headline text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">Apply for a Loan</h2>
        <p className="text-slate-500 text-sm lg:text-base mt-2">Select a loan type and fill in the details. Instant credit assessment.</p>
      </header>

      {/* Step 1: Choose Loan Type */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">1</div>
          <h3 className="text-xl font-bold font-headline text-slate-900">Choose Loan Type</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loanTypes.map((lt) => (
            <button
              key={lt.id}
              onClick={() => { setSelectedType(lt); setAmount(""); setTenure(""); }}
              className={`text-left p-5 rounded-xl border-2 transition-all ${
                selectedType?.id === lt.id
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 shadow-md shadow-[var(--color-primary)]/15"
                  : "border-slate-200 hover:border-slate-300 bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`text-base font-bold font-headline ${selectedType?.id === lt.id ? "text-[var(--color-primary)]" : "text-slate-900"}`}>
                  {lt.loanTypeName}
                </span>
                {selectedType?.id === lt.id && (
                  <span className="material-symbols-outlined text-[var(--color-primary)] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {[
                  { label: "Interest", value: `${lt.interestRate}% p.a.` },
                  { label: "Limit", value: "No Limit" },
                  { label: "Max Tenure", value: `${lt.maxTenure} mo` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-lg p-2 text-center">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mb-0.5">{label}</p>
                    <p className="font-bold text-slate-800 text-xs">{value}</p>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: Loan Details */}
      {selectedType && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">2</div>
            <h3 className="text-xl font-bold font-headline text-slate-900">Loan Details</h3>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Loan Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter custom amount"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:bg-white"
                />
                <p className="text-[10px] text-[var(--color-primary)] font-bold bg-[var(--color-primary)]/10 inline-block px-1.5 py-0.5 rounded">No upper limit</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Tenure (months) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                  placeholder={`1 – ${selectedType.maxTenure}`}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400">Max: {selectedType.maxTenure} months ({Math.floor(selectedType.maxTenure / 12)} years)</p>
              </div>
            </div>

            {/* EMI preview */}
            {emi > 0 && (
              <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-0.5">Estimated Monthly EMI</p>
                  <p className="font-headline text-2xl font-extrabold text-[var(--color-primary)]">₹{emi.toLocaleString()}</p>
                </div>
                <div className="text-center sm:text-right text-xs text-slate-500">
                  <p>Total repayment</p>
                  <p className="font-bold text-slate-800">₹{(emi * Number(tenure)).toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Submit */}
      {selectedType && (
        <button
          id="apply-submit"
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full py-4 bg-[var(--color-primary)] text-white rounded-xl font-bold text-base shadow-lg shadow-[var(--color-primary)]/25 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {mutation.isPending ? (
            <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Submitting…</>
          ) : (
            <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>Submit Application</>
          )}
        </button>
      )}

      <p className="text-center text-xs text-slate-400">🔒 Your data is encrypted and RBI compliant.</p>
    </div>
  );
}
