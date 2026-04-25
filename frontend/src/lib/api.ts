import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api",
  headers: { "Content-Type": "application/json" },
});

// ── Table Types (matching Prisma schema exactly) ──────────────────────────────

export interface Applicant {
  id: number;
  fullName: string;
  age: number;
  gender: string;
  employmentType: string;
  monthlyIncome: number;
  contactNumber: string;
  address: string;
  createdAt: string;
  creditHistory?: CreditHistory;
  creditScores?: CreditScore[];
  loanApplications?: LoanApplication[];
}

export interface CreditHistory {
  id: number;
  applicantId: number;
  creditLengthYears: number;
  totalLoans: number;
  defaultCount: number;
  lastUpdated: string;
}

export interface CreditScore {
  id: number;
  applicantId: number;
  creditScore: number;
  riskCategory: "Low" | "Medium" | "High";
  scoreDate: string;
}

export interface LoanType {
  id: number;
  loanTypeName: string;
  interestRate: number;
  maxAmount: number;
  maxTenure: number;
}

export interface LoanApplication {
  id: number;
  applicantId: number;
  applicant?: Applicant;
  loanTypeId: number;
  loanType?: LoanType;
  loanAmount: number;
  tenureMonths: number;
  applicationDate: string;
  loanStatus: "Pending" | "Approved" | "Rejected";
  officerId?: number;
  officer?: Officer;
  approvalDecision?: ApprovalDecision;
  repayments?: Repayment[];
}

export interface ApprovalDecision {
  id: number;
  loanId: number;
  decisionStatus: "Approved" | "Rejected";
  decisionReason: string;
  decisionDate: string;
  officerId?: number;
  officer?: Officer;
}

export interface Repayment {
  id: number;
  loanId: number;
  amountPaid: number;
  paymentDate: string;
  remainingAmount: number;
  paymentStatus: "Paid" | "Due" | "Overdue";
}

export interface Officer {
  id: number;
  name: string;
  email: string;
  designation?: string;
  department?: string;
}

export interface OfficerAnalytics {
  totalApplicants: number;
  totalLoans: number;
  pendingQueue: number;
  approvedLoans: number;
  rejectedLoans: number;
  totalPortfolioValue: number;
  approvalRate: number;
  avgCreditScore: number;
  highRiskCount: number;
}

// ── EMI Calculator ─────────────────────────────────────────────────────────────
export function calcEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.round(principal / tenureMonths);
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
}
