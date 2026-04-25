"use client";

import { useQuery } from "@tanstack/react-query";
import { api, LoanApplication } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/session";

export default function MyLoansPage() {
  const [applicantId, setApplicantId] = useState<number | null>(null);

  useEffect(() => {
    const session = getSession();
    if (session?.applicantId) setApplicantId(session.applicantId);
  }, []);

  const { data: loans = [], isLoading } = useQuery<LoanApplication[]>({
    queryKey: ["my-loans", applicantId],
    queryFn: async () =>
      (await api.get(`/loan-applications/by-applicant/${applicantId}`)).data,
    enabled: !!applicantId,
    refetchInterval: 10_000,
  });

  const totalApproved = loans
    .filter((l) => l.loanStatus === "Approved")
    .reduce((s, l) => s + l.loanAmount, 0);

  const bestScore =
    loans.length > 0
      ? Math.max(
          ...loans.flatMap((l) =>
            l.applicant?.creditScores?.map((cs) => cs.creditScore) ?? [0]
          )
        )
      : 0;

  const statusStyle = (status: string) => {
    if (status === "Approved") return "bg-green-100 text-green-800";
    if (status === "Rejected") return "bg-red-100 text-red-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="p-8 space-y-8">
      <header>
        <h2 className="font-headline text-3xl font-bold tracking-tight text-[var(--color-on-surface)]">
          My Loans
        </h2>
        <p className="text-[var(--color-on-surface-variant)] mt-1">
          All loan applications linked to your account.
        </p>
      </header>

      {!applicantId ? (
        <div className="bg-[var(--color-secondary-container)] rounded-xl p-8 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--color-on-secondary-container)] mb-3">
            person_off
          </span>
          <p className="text-[var(--color-on-secondary-container)] font-semibold">
            No session found.{" "}
            <a href="/" className="font-bold underline">
              Sign in
            </a>{" "}
            first.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center p-12 text-slate-400 gap-3">
          <span className="material-symbols-outlined animate-spin">
            progress_activity
          </span>
          Loading your loans…
        </div>
      ) : loans.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-outline-variant)]/10 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">
            inbox
          </span>
          <h3 className="font-headline font-bold text-xl mb-2">No loans yet</h3>
          <p className="text-slate-500 mb-6">
            Apply for your first loan to see it here.
          </p>
          <Link href="/user/apply">
            <button className="px-8 py-3 bg-[var(--color-primary)] text-white rounded-xl font-bold shadow-lg shadow-[var(--color-primary)]/20">
              Apply Now →
            </button>
          </Link>
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                label: "Total Applications",
                value: loans.length.toString(),
                icon: "description",
              },
              {
                label: "Total Approved",
                value: `₹${totalApproved.toLocaleString()}`,
                icon: "payments",
              },
              {
                label: "Best Credit Score",
                value: bestScore > 0 ? bestScore.toString() : "—",
                icon: "grade",
              },
            ].map(({ label, value, icon }) => (
              <div
                key={label}
                className="bg-white p-5 rounded-xl shadow-sm border border-[var(--color-outline-variant)]/10 flex gap-4 items-center"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                  <span
                    className="material-symbols-outlined text-[var(--color-primary)]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {icon}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {label}
                  </p>
                  <p className="text-2xl font-bold font-headline text-[var(--color-on-surface)]">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* Loan cards */}
          <section className="space-y-4">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="bg-white rounded-xl shadow-sm border border-[var(--color-outline-variant)]/10 p-6 flex flex-col md:flex-row md:items-center gap-6"
              >
                {/* Loan type badge */}
                <div className="w-14 h-14 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                  <span
                    className="material-symbols-outlined text-2xl text-[var(--color-primary)]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    account_balance_wallet
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Loan Amount
                    </p>
                    <p className="font-bold text-lg">
                      ₹{loan.loanAmount.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Loan Type
                    </p>
                    <p className="font-bold text-sm">
                      {loan.loanType?.loanTypeName ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Tenure
                    </p>
                    <p className="font-semibold text-sm">
                      {loan.tenureMonths} months
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">
                      Applied On
                    </p>
                    <p className="font-semibold text-sm">
                      {new Date(loan.applicationDate).toLocaleDateString(
                        "en-IN"
                      )}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex flex-col items-end gap-3">
                  <span
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${statusStyle(loan.loanStatus)}`}
                  >
                    {loan.loanStatus}
                  </span>
                  {loan.loanStatus === "Approved" && (
                    <p className="text-xs text-[var(--color-primary)] font-semibold">
                      ✓ Funds disbursed
                    </p>
                  )}
                  {loan.approvalDecision?.decisionReason && (
                    <p className="text-[10px] text-slate-400 max-w-[160px] text-right leading-tight">
                      {loan.approvalDecision.decisionReason}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </section>

          <div className="text-center pt-4">
            <Link href="/user/apply">
              <button className="px-8 py-3 border-2 border-[var(--color-primary)] text-[var(--color-primary)] rounded-xl font-bold text-sm hover:bg-[var(--color-primary)] hover:text-white transition-all">
                + Apply for Another Loan
              </button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
