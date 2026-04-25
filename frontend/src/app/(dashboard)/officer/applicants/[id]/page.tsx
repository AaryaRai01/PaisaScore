"use client";

import { useQuery } from "@tanstack/react-query";
import { api, Applicant } from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";

const riskStyle: Record<string, { color: string; bg: string }> = {
  Low:    { color: "text-green-600",  bg: "bg-green-100" },
  Medium: { color: "text-yellow-600", bg: "bg-yellow-100" },
  High:   { color: "text-red-600",    bg: "bg-red-100" },
};

export default function ApplicantProfilePage() {
  const { id } = useParams();

  const { data: applicant, isLoading } = useQuery<Applicant>({
    queryKey: ["applicant", id],
    queryFn: async () => (await api.get(`/applicants/${id}`)).data,
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-slate-400">
        <span className="material-symbols-outlined animate-spin">progress_activity</span>
        Loading profile…
      </div>
    );
  }

  if (!applicant) {
    return (
      <div className="p-8 text-slate-500">
        <p>Applicant not found.</p>
        <Link href="/officer/applicants" className="text-[var(--color-primary)] hover:underline mt-2 inline-block">Back to Directory</Link>
      </div>
    );
  }

  const score = applicant.creditScores?.[0];
  const history = applicant.creditHistory;
  const cfg = score ? riskStyle[score.riskCategory] : riskStyle.Low;

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
        <Link href="/officer/applicants">
          <button className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </Link>
        <div>
          <h2 className="font-headline text-3xl font-extrabold text-slate-900">{applicant.fullName}</h2>
          <p className="text-slate-500 text-sm">Full Credit &amp; Application Profile</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4 h-fit">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-2xl font-extrabold font-headline mb-4">
            {applicant.fullName.charAt(0)}
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Personal</p>
              <p className="font-medium text-slate-900">{applicant.age} years old · {applicant.gender}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Employment</p>
              <p className="font-medium text-slate-900">{applicant.employmentType}</p>
              <p className="text-sm text-slate-500">₹{applicant.monthlyIncome.toLocaleString()} / month</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contact</p>
              <p className="text-sm font-medium text-slate-900">{applicant.contactNumber}</p>
              <p className="text-sm text-slate-500">{applicant.address}</p>
            </div>
          </div>
        </div>

        {/* Credit Overview */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border ${score ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Credit Score</p>
              <p className="text-2xl font-headline font-extrabold text-slate-900">{score?.creditScore ?? "N/A"}</p>
              {score && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-2 inline-block ${cfg.bg} ${cfg.color}`}>{score.riskCategory} Risk</span>}
            </div>
            <div className="p-4 rounded-xl border bg-white border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Credit Age</p>
              <p className="text-2xl font-headline font-extrabold text-slate-900">{history?.creditLengthYears ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">years</p>
            </div>
            <div className="p-4 rounded-xl border bg-white border-slate-100 shadow-sm">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Lifetime Loans</p>
              <p className="text-2xl font-headline font-extrabold text-slate-900">{history?.totalLoans ?? 0}</p>
              <p className="text-xs text-slate-500 mt-1">approved</p>
            </div>
            <div className={`p-4 rounded-xl border shadow-sm ${((history?.defaultCount ?? 0) > 0) ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Defaults</p>
              <p className={`text-2xl font-headline font-extrabold ${(history?.defaultCount ?? 0) > 0 ? "text-red-600" : "text-green-600"}`}>
                {history?.defaultCount ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">recorded offenses</p>
            </div>
          </div>

          {/* Historical Loans Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--color-primary)]">history</span>
              <h3 className="font-bold text-slate-900">Loan Applications History</h3>
            </div>
            {applicant.loanApplications && applicant.loanApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="px-5 py-3 rounded-tl-xl">Date</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Principal</th>
                      <th className="px-5 py-3">Tenure</th>
                      <th className="px-5 py-3 rounded-tr-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {applicant.loanApplications.map((loan) => (
                      <tr key={loan.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 text-slate-600">{new Date(loan.applicationDate).toLocaleDateString()}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-900">{loan.loanType?.loanTypeName}</td>
                        <td className="px-5 py-3.5 font-medium">₹{loan.loanAmount.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-slate-500">{loan.tenureMonths} mo</td>
                        <td className="px-5 py-3.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            loan.loanStatus === 'Approved' ? 'bg-green-100 text-green-800' :
                            loan.loanStatus === 'Rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {loan.loanStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                <p>No loan applications found for this user.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
