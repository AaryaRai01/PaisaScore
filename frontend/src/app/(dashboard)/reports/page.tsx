"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, OfficerAnalytics, LoanApplication } from "@/lib/api";
import { getSession } from "@/lib/session";
import { useToast } from "@/components/ui/Toast";

export default function OfficerReportsPage() {
  const { showToast } = useToast();

  const { id: officerId } = getSession() || {};

  const { data: analytics } = useQuery<OfficerAnalytics>({
    queryKey: ["analytics", officerId],
    queryFn: async () => (await api.get("/analytics", { params: { officerId } })).data,
    enabled: !!officerId,
    refetchInterval: 15_000,
  });

  const { data: loans = [] } = useQuery<LoanApplication[]>({
    queryKey: ["loan-applications-reports", officerId],
    queryFn: async () => (await api.get("/loan-applications", { params: { officerId } })).data,
    enabled: !!officerId,
    refetchInterval: 15_000,
  });

  const [mounted, setMounted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  useEffect(() => setMounted(true), []);

  const totalPages = Math.ceil(loans.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLoans = loans.slice(startIndex, startIndex + pageSize);
  const startRange = loans.length > 0 ? startIndex + 1 : 0;
  const endRange = Math.min(startIndex + pageSize, loans.length);

  const handleCSV = () => {
    if (!loans.length) { showToast("No data to export.", "info"); return; }
    const headers = ["Loan ID", "Applicant", "Loan Type", "Amount (INR)", "Tenure (mo)", "Credit Score", "Risk", "Status", "Applied Date", "Decision Reason"];
    const rows = loans.map((l) => [
      l.id,
      `"${l.applicant?.fullName || ""}"`,
      `"${l.loanType?.loanTypeName || ""}"`,
      l.loanAmount,
      l.tenureMonths,
      l.applicant?.creditScores?.[0]?.creditScore ?? "N/A",
      l.applicant?.creditScores?.[0]?.riskCategory ?? "N/A",
      l.loanStatus,
      new Date(l.applicationDate).toLocaleDateString(),
      `"${l.approvalDecision?.decisionReason || (l.loanStatus === "Pending" ? "Awaiting Review" : "N/A")}"`,
    ]);
    
    const csvContent = "\uFEFF" + [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `PaisaScore_Portfolio_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV exported for Google Sheets!");
  };

  // Bar chart data — status breakdown per loan type
  const loanTypes = [...new Set(loans.map((l) => l.loanType?.loanTypeName ?? "Unknown"))];
  const chartData = loanTypes.map((type) => {
    const typLoans = loans.filter((l) => l.loanType?.loanTypeName === type);
    return {
      type,
      approved: typLoans.filter((l) => l.loanStatus === "Approved").length,
      rejected: typLoans.filter((l) => l.loanStatus === "Rejected").length,
      pending:  typLoans.filter((l) => l.loanStatus === "Pending").length,
      total:    typLoans.length,
    };
  });
  const maxBar = Math.max(...chartData.map((d) => d.total), 1);

  return (
    <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div className="flex flex-col gap-1 w-full sm:w-auto">
          <h2 className="font-headline text-lg lg:text-4xl font-extrabold text-slate-900 tracking-tight">Report</h2>
          <p className="text-slate-500 text-[10px] lg:text-base mt-0.5">Live portfolio analytics.</p>
          
          {mounted && (
            <div className="hidden print:grid grid-cols-2 gap-8 mt-6 border-t pt-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prepared By</p>
                <p className="text-sm font-bold text-slate-900">{getSession()?.applicantName || "Authorized Officer"}</p>
                <p className="text-xs text-slate-500">Senior Credit Risk Analyst</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Report Date</p>
                <p className="text-sm font-bold text-slate-900">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                <p className="text-xs text-slate-500">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col xs:flex-row gap-3 w-full sm:w-auto no-print">
          <button onClick={handleCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-200 transition-colors">
            <span className="material-symbols-outlined text-lg">grid_on</span>Export CSV
          </button>
          <button onClick={() => { showToast("Preparing professional report...", "info"); setTimeout(() => window.print(), 500); }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-lg">description</span>PDF Report
          </button>
        </div>
      </header>

      {/* KPI Cards - Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[
          { label: "Portfolio Value",  value: `₹${((analytics?.totalPortfolioValue ?? 0) / 100000).toFixed(1)}L`, icon: "account_balance_wallet", accent: true  },
          { label: "Approval Rate",    value: `${analytics?.approvalRate ?? 0}%`,                                  icon: "trending_up",            accent: false },
          { label: "Avg Credit Score", value: analytics?.avgCreditScore ?? 0,                                       icon: "grade",                  accent: false },
          { label: "High Risk Cases",   value: analytics?.highRiskCount ?? 0,                                       icon: "warning",                accent: false },
        ].map(({ label, value, icon, accent }) => (
          <div key={label} className={`p-6 rounded-xl shadow-sm border ${accent ? "bg-[var(--color-primary)] border-transparent text-white" : "bg-white border-slate-100"}`}>
            <div className="flex justify-between items-start mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${accent ? "text-white/70" : "text-slate-500"}`}>{label}</span>
              <span className={`material-symbols-outlined text-xl ${accent ? "text-white/80" : "text-[var(--color-primary)]"}`} style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
            <span className={`font-headline text-3xl font-extrabold ${accent ? "text-white" : "text-slate-900"}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar chart — by loan type */}
        <div className="lg:col-span-8 bg-white rounded-xl shadow-sm border border-slate-100 p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h4 className="font-headline text-lg font-bold text-slate-900">Applications by Loan Type</h4>
            <div className="flex flex-wrap gap-3 lg:gap-4 text-xs font-bold">
              {[{ c: "bg-[var(--color-primary)]", l: "Approved" }, { c: "bg-red-300", l: "Rejected" }, { c: "bg-yellow-300", l: "Pending" }].map(({ c, l }) => (
                <span key={l} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded-sm ${c}`} />{l}</span>
              ))}
            </div>
          </div>
          {chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data yet.</div>
          ) : (
            <div className="flex items-end gap-2 lg:gap-6 h-48 border-b border-l border-slate-100 pl-2 pb-2 overflow-x-auto overflow-y-hidden">
              {chartData.map((d) => {
                const maxH = 180;
                const aH = (d.approved / maxBar) * maxH;
                const rH = (d.rejected / maxBar) * maxH;
                const pH = (d.pending  / maxBar) * maxH;
                return (
                  <div key={d.type} className="flex-1 min-w-[50px] lg:min-w-0 flex flex-col items-center gap-2 group relative">
                    <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                      <p className="font-bold mb-1">{d.type}</p>
                      <p>✅ Approved: {d.approved}</p>
                      <p>❌ Rejected: {d.rejected}</p>
                      <p>⏳ Pending: {d.pending}</p>
                    </div>
                    <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: `${maxH}px` }}>
                      {pH > 0 && <div className="w-full bg-yellow-300 rounded-t-sm" style={{ height: `${pH}px` }} />}
                      {rH > 0 && <div className="w-full bg-red-300 rounded-t-sm"    style={{ height: `${rH}px` }} />}
                      {aH > 0 && <div className="w-full bg-[var(--color-primary)] rounded-t-sm" style={{ height: `${aH}px` }} />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">{d.type.split(" ")[0]}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status donut */}
        <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
          <h4 className="font-headline text-lg font-bold text-slate-900 mb-4 self-start">Status Mix</h4>
          <div className="relative w-40 h-40">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-surface-container)" strokeWidth="14" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-primary)" strokeWidth="14"
                strokeDasharray="251.3"
                strokeDashoffset={analytics?.totalLoans ? 251.3 - 251.3 * ((analytics.approvedLoans) / analytics.totalLoans) : 251.3}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p className="font-extrabold text-2xl text-[var(--color-primary)] font-headline">{analytics?.approvalRate ?? 0}%</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Approved</p>
            </div>
          </div>
          <div className="w-full mt-5 space-y-2">
            {[
              { label: "Approved", count: analytics?.approvedLoans ?? 0, color: "bg-[var(--color-primary)]" },
              { label: "Pending",  count: analytics?.pendingQueue  ?? 0, color: "bg-yellow-300"            },
              { label: "Rejected", count: analytics?.rejectedLoans ?? 0, color: "bg-red-300"               },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center gap-2 text-xs">
                <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${color}`} />
                <span className="text-slate-600 flex-1">{label}</span>
                <span className="font-bold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full applications data table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden print:break-before-page print:mt-12">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center">
          <div>
            <h4 className="font-headline text-lg font-bold text-slate-900">All Applications</h4>
            <p className="text-xs text-slate-400 mt-0.5">{loans.length} total records</p>
          </div>
          <div className="flex items-center gap-3 no-print">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{startRange}-{endRange} of {loans.length}</span>
            <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-100">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
              >
                <span className="material-symbols-outlined text-base">chevron_left</span>
              </button>
              <div className="w-[1px] bg-slate-200 my-1 mx-0.5" />
              <button 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
              >
                <span className="material-symbols-outlined text-base">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left min-w-[1000px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                {["Applicant", "Loan Type", "Amount", "Tenure", "Credit Score", "Risk", "Status", "Decision Reason", "Date"].map((h) => (
                  <th key={h} className="px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedLoans.map((loan) => {
                const score = loan.applicant?.creditScores?.[0];
                return (
                  <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-900">{loan.applicant?.fullName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{loan.loanType?.loanTypeName}</td>
                    <td className="px-5 py-3.5 font-semibold">₹{loan.loanAmount.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-500">{loan.tenureMonths} mo</td>
                    <td className="px-5 py-3.5 font-bold text-[var(--color-primary)]">{score?.creditScore ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      {score && <span className={`px-2 py-1 rounded-full text-xs font-bold ${score.riskCategory === "Low" ? "bg-green-100 text-green-800" : score.riskCategory === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>{score.riskCategory}</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${loan.loanStatus === "Approved" ? "bg-green-100 text-green-800" : loan.loanStatus === "Rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{loan.loanStatus}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs max-w-xs truncate">{loan.approvalDecision?.decisionReason ?? "Awaiting review"}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{new Date(loan.applicationDate).toLocaleDateString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print Footer */}
      <footer className="hidden print:flex justify-between items-center mt-12 pt-6 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
        <p>© 2026 PaisaScore Financial Technologies Pvt. Ltd. · Internal Report</p>
        <p>Page 1 of 2</p>
      </footer>
    </div>
  );
}
