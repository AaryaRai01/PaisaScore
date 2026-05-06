"use client";

import { useQuery } from "@tanstack/react-query";
import { api, Applicant } from "@/lib/api";
import Link from "next/link";

const riskStyle: Record<string, string> = {
  Low:    "bg-green-100 text-green-800",
  Medium: "bg-yellow-100 text-yellow-800",
  High:   "bg-red-100 text-red-800",
};

export default function ApplicantDirectoryPage() {
  const { data: applicants = [], isLoading } = useQuery<Applicant[]>({
    queryKey: ["applicants"],
    queryFn: async () => (await api.get("/applicants")).data,
    refetchInterval: 15_000,
  });

  return (
    <div className="p-2 sm:p-4 lg:p-8 space-y-4 lg:space-y-8">
      <header>
        <h2 className="font-headline text-lg lg:text-3xl font-extrabold text-slate-900 tracking-tight">Applicants</h2>
        <p className="text-slate-500 text-[10px] lg:text-sm mt-0.5">{applicants.length} registered</p>
      </header>

      {isLoading ? (
        <div className="flex items-center gap-3 text-slate-400 p-8">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Loading applicants…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {applicants.map((app) => {
            const score = app.creditScores?.[0];
            const history = app.creditHistory;
            const totalLoans = app.loanApplications?.length ?? 0;
            const approvedLoans = app.loanApplications?.filter((l) => l.loanStatus === "Approved").length ?? 0;

            return (
              <div key={app.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-headline font-extrabold text-[var(--color-primary)] text-lg">
                        {app.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{app.fullName}</h3>
                      <p className="text-xs text-slate-400">{app.age} yrs · {app.gender}</p>
                    </div>
                  </div>
                  {score && (
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${riskStyle[score.riskCategory]}`}>
                      {score.riskCategory} Risk
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {[
                    { label: "Employment",   value: app.employmentType },
                    { label: "Monthly Inc.", value: `₹${(app.monthlyIncome).toLocaleString()}` },
                    { label: "Credit Score", value: score?.creditScore ?? "—" },
                    { label: "Credit Age",   value: history ? `${history.creditLengthYears} yrs` : "—" },
                    { label: "Defaults",     value: history?.defaultCount ?? 0, danger: (history?.defaultCount ?? 0) > 0 },
                    { label: "Applications", value: `${approvedLoans}/${totalLoans} Approved` },
                  ].map(({ label, value, danger }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                      <p className={`font-semibold ${danger ? "text-red-500" : "text-slate-800"}`}>{String(value)}</p>
                    </div>
                  ))}
                </div>

                {/* Address */}
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {app.address}
                </p>

                {/* Action */}
                <Link href={`/officer/applicants/${app.id}`} className="mt-auto">
                  <button className="w-full py-2.5 border border-[var(--color-primary)] text-[var(--color-primary)] rounded-lg text-xs font-bold hover:bg-[var(--color-primary)]/5 transition-colors flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-sm">person_search</span>
                    View Full Profile
                  </button>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
