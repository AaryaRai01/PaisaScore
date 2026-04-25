"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, Applicant } from "@/lib/api";
import { setSession, getSession } from "@/lib/session";
import PaisaScoreLogo from "@/components/PaisaScoreLogo";

type UserTab    = "signin" | "signup";
type OfficerTab = "signin" | "register";

const INPUT =
  "w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 focus:border-[var(--color-primary)]/50 transition-all placeholder:text-slate-400 shadow-sm";

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
        active
          ? "bg-[var(--color-primary)] text-white shadow-sm"
          : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        className={INPUT + " pr-11"}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">
          {show ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();

  // — User card state
  const [userTab, setUserTab]     = useState<UserTab>("signin");
  const [uEmail, setUEmail]       = useState("");
  const [uPassword, setUPassword] = useState("");
  const [signinError, setSigninError] = useState("");

  const [signupForm, setSignupForm] = useState({
    fullName: "", email: "", age: "", gender: "Male",
    employmentType: "Salaried", monthlyIncome: "",
    contactNumber: "", address: "",
    password: "", confirmPassword: "",
  });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError]     = useState("");

  // — Officer card state
  const [officerTab, setOfficerTab]         = useState<OfficerTab>("signin");
  const [officerLoading, setOfficerLoading] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [officerPassword, setOfficerPassword] = useState("");
  const [officerSigninError, setOfficerSigninError] = useState("");

  const [officerName, setOfficerName] = useState("");
  const [officerDesig, setOfficerDesig] = useState("Senior Credit Analyst");
  const [officerDept, setOfficerDept]   = useState("Credit Risk");
  const [officerRegPass, setOfficerRegPass]     = useState("");
  const [officerRegConfirm, setOfficerRegConfirm] = useState("");
  const [officerRegError, setOfficerRegError]   = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const s = getSession();
    if (s?.role === "officer") router.replace("/officer/dashboard");
    if (s?.role === "user" && s.applicantId) router.replace("/user/dashboard");
  }, [router]);

  // ── User Sign In ────────────────────────────────────────────────────────────
  const handleUserSignIn = async () => {
    setSigninError("");
    if (!uEmail.trim() || !uPassword) {
      setSigninError("Please enter your name/email and password.");
      return;
    }
    try {
      const res = await api.post("/auth/login", {
        nameOrEmail: uEmail.trim(),
        password: uPassword,
      });
      setSession({ 
        role: "user", 
        id: res.data.id,
        applicantId: res.data.id, 
        applicantName: res.data.name 
      });
      router.push("/user/dashboard");
    } catch (e: any) {
      setSigninError(e?.response?.data?.error ?? "Invalid credentials. Please try again.");
    }
  };

  // ── User Sign Up ─────────────────────────────────────────────────────────────
  const handleUserSignUp = async () => {
    const { fullName, email, age, gender, employmentType, monthlyIncome, contactNumber, address, password, confirmPassword } = signupForm;
    setSignupError("");
    if (!fullName || !email || !age || !monthlyIncome || !contactNumber || !address) {
      setSignupError("Please fill all required fields."); return;
    }
    if (isNaN(Number(age)) || Number(age) < 18 || Number(age) > 80) {
      setSignupError("Age must be between 18 and 80."); return;
    }
    if (isNaN(Number(monthlyIncome)) || Number(monthlyIncome) < 5000) {
      setSignupError("Monthly income must be at least ₹5,000."); return;
    }
    if (password.length < 6) {
      setSignupError("Password must be at least 6 characters."); return;
    }
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match."); return;
    }
    setSignupLoading(true);
    try {
      const res = await api.post<Applicant>("/applicants", {
        fullName, email, age: Number(age), gender, employmentType,
        monthlyIncome: Number(monthlyIncome), contactNumber, address,
        password,
      });
      setSession({ role: "user", id: res.data.id, applicantId: res.data.id, applicantName: res.data.fullName });
      router.push("/user/dashboard");
    } catch (e: any) {
      setSignupError(e?.response?.data?.error ?? "Account creation failed. Try again.");
    } finally {
      setSignupLoading(false);
    }
  };

  // ── Officer Sign In ────────────────────────────────────────────────────────
  const handleOfficerSignIn = async () => {
    setOfficerSigninError("");
    if (!selectedOfficer) { setOfficerSigninError("Please enter your officer email."); return; }
    if (!officerPassword)  { setOfficerSigninError("Please enter your password."); return; }
    
    setOfficerLoading(true);
    try {
      const res = await api.post("/auth/officer/login", {
        email: selectedOfficer,
        password: officerPassword,
      });
      setSession({ role: "officer", id: res.data.id, applicantName: res.data.name });
      router.push("/officer/dashboard");
    } catch (e: any) {
      setOfficerSigninError(e?.response?.data?.error ?? "Invalid credentials.");
    } finally {
      setOfficerLoading(false);
    }
  };

  // ── Officer Register ───────────────────────────────────────────────────────
  const handleOfficerRegister = async () => {
    setOfficerRegError("");
    if (!officerName.trim()) { setOfficerRegError("Full name is required."); return; }
    if (!selectedOfficer.trim()) { setOfficerRegError("Email is required."); return; }
    if (officerRegPass.length < 6) { setOfficerRegError("Password must be at least 6 characters."); return; }
    if (officerRegPass !== officerRegConfirm) { setOfficerRegError("Passwords do not match."); return; }
    
    try {
      const res = await api.post("/auth/officer/register", {
        name: officerName.trim(),
        email: selectedOfficer.trim(),
        password: officerRegPass,
        designation: officerDesig,
        department: officerDept,
      });
      setSession({ role: "officer", id: res.data.id, applicantName: res.data.name });
      router.push("/officer/dashboard");
    } catch (e: any) {
      setOfficerRegError(e?.response?.data?.error ?? "Registration failed.");
    }
  };

  const sf = (k: keyof typeof signupForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setSignupForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-16 relative overflow-hidden">
      {/* Dynamic background: purely white around logo, subtle gradient elsewhere */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: "radial-gradient(circle at 50% 20%, white 0%, white 35%, #f8fafc 100%)"
        }}
      />
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] z-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, #475569 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Soft blobs */}
      <div className="absolute top-1/4 -left-24 w-96 h-96 bg-[var(--color-primary)]/5 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-1/4 -right-24 w-96 h-96 bg-indigo-400/5 rounded-full blur-3xl opacity-50" />

      <div className="relative z-10 w-full max-w-5xl space-y-10">
        {/* ── Brand header ── */}
        <div className="text-center space-y-1">
          <div className="flex items-center justify-center mb-0 transition-transform hover:scale-105 duration-500">
            <PaisaScoreLogo height={100} />
          </div>
          <p className="text-lg text-slate-500 font-medium tracking-tight animate-fade-in">
            Simplifying finance through <span className="text-[var(--color-primary)] font-bold">intelligent technology.</span>
          </p>
        </div>

        {/* ── ROLE CARDS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">

          {/* ════ USER CARD ════ */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 shadow-sm flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[var(--color-primary)]/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  person
                </span>
              </div>
              <div>
                <h2 className="font-headline text-xl font-bold text-slate-900">Borrower Portal</h2>
                <p className="text-xs text-slate-400">Apply for loans, track credit &amp; repayments</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-100">
              <Tab active={userTab === "signin"} onClick={() => { setUserTab("signin"); setSignupError(""); setSigninError(""); }}>
                Sign In
              </Tab>
              <Tab active={userTab === "signup"} onClick={() => { setUserTab("signup"); setSigninError(""); setSignupError(""); }}>
                Create Account
              </Tab>
            </div>

            {/* ── Sign In ── */}
            {userTab === "signin" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Full Name / Email
                  </label>
                  <input
                    id="user-name-input"
                    type="text"
                    placeholder="e.g. Arjun Mehta"
                    value={uEmail}
                    onChange={(e) => { setUEmail(e.target.value); setSigninError(""); }}
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Password
                  </label>
                  <PasswordInput
                    id="user-password-input"
                    value={uPassword}
                    onChange={(v) => { setUPassword(v); setSigninError(""); }}
                  />
                </div>
                {signinError && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {signinError}
                  </p>
                )}
                <button
                  id="user-signin-btn"
                  onClick={handleUserSignIn}
                  className="w-full py-3.5 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm shadow-md shadow-[var(--color-primary)]/25 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                  Sign In as Borrower
                </button>
              </div>
            )}

            {/* ── Create Account ── */}
            {userTab === "signup" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                    <input type="text" placeholder="e.g. Arjun Mehta" value={signupForm.fullName} onChange={sf("fullName")} className={INPUT} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                    <input type="email" placeholder="e.g. arjun@example.com" value={signupForm.email} onChange={sf("email")} className={INPUT} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Age *</label>
                    <input type="number" placeholder="e.g. 28" min={18} max={80} value={signupForm.age} onChange={sf("age")} className={INPUT} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gender *</label>
                    <select value={signupForm.gender} onChange={sf("gender")} className={INPUT}>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employment Type *</label>
                    <select value={signupForm.employmentType} onChange={sf("employmentType")} className={INPUT}>
                      <option>Salaried</option>
                      <option>Self-employed</option>
                      <option>Business Owner</option>
                      <option>Freelancer</option>
                      <option>Student</option>
                    </select>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monthly Income (₹) *</label>
                    <input type="number" placeholder="e.g. 55000" min={5000} value={signupForm.monthlyIncome} onChange={sf("monthlyIncome")} className={INPUT} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contact Number *</label>
                    <input type="tel" placeholder="e.g. 9876543210" value={signupForm.contactNumber} onChange={sf("contactNumber")} className={INPUT} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Address *</label>
                    <input type="text" placeholder="e.g. Bandra West, Mumbai" value={signupForm.address} onChange={sf("address")} className={INPUT} />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password *</label>
                    <PasswordInput value={signupForm.password} onChange={(v) => setSignupForm((p) => ({ ...p, password: v }))} placeholder="Min. 6 characters" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm Password *</label>
                    <PasswordInput value={signupForm.confirmPassword} onChange={(v) => setSignupForm((p) => ({ ...p, confirmPassword: v }))} placeholder="Re-enter password" />
                  </div>
                </div>
                {signupError && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>{signupError}
                  </p>
                )}
                <button
                  id="user-signup-btn"
                  onClick={handleUserSignUp}
                  disabled={signupLoading}
                  className="w-full py-3.5 bg-[var(--color-primary)] text-white rounded-xl font-bold text-sm shadow-md shadow-[var(--color-primary)]/25 hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {signupLoading ? (
                    <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Creating account…</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person_add</span>Create Borrower Account</>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  A credit score is auto-generated based on your income &amp; employment.
                </p>
              </div>
            )}
          </div>

          {/* ════ OFFICER CARD ════ */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-7 shadow-sm flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-indigo-600 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  admin_panel_settings
                </span>
              </div>
              <div>
                <h2 className="font-headline text-xl font-bold text-slate-900">Loan Officer Portal</h2>
                <p className="text-xs text-slate-400">Review applications, manage credit decisions</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-100">
              <Tab active={officerTab === "signin"} onClick={() => { setOfficerTab("signin"); setOfficerRegError(""); setOfficerSigninError(""); }}>
                Sign In
              </Tab>
              <Tab active={officerTab === "register"} onClick={() => { setOfficerTab("register"); setOfficerSigninError(""); setOfficerRegError(""); }}>
                Register
              </Tab>
            </div>

            {/* ── Officer Sign In ── */}
            {officerTab === "signin" && (
              <div className="space-y-3">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      Officer Email
                    </label>
                    <input
                      id="officer-email-input"
                      type="email"
                      placeholder="e.g. priya@paisascore.in"
                      value={selectedOfficer}
                      onChange={(e) => { setSelectedOfficer(e.target.value); setOfficerSigninError(""); }}
                      className={INPUT}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Password</label>
                    <PasswordInput
                      id="officer-password-input"
                      value={officerPassword}
                      onChange={(v) => { setOfficerPassword(v); setOfficerSigninError(""); }}
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Officer Access Includes</p>
                  {[
                    "Review loan applications & credit profiles",
                    "Approve or reject with documented reason",
                    "Monitor full active loan portfolio",
                    "Generate analytics reports & CSV exports",
                  ].map((f) => (
                    <div key={f} className="flex items-start gap-2 text-xs text-slate-600">
                      <span
                        className="material-symbols-outlined text-[var(--color-primary)] text-sm mt-px flex-shrink-0"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                      {f}
                    </div>
                  ))}
                </div>

                {officerSigninError && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>
                    {officerSigninError}
                  </p>
                )}

                <button
                  id="officer-signin-btn"
                  onClick={handleOfficerSignIn}
                  disabled={officerLoading}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {officerLoading ? (
                    <><span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>Redirecting…</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>Sign In as Loan Officer</>
                  )}
                </button>
              </div>
            )}

            {/* ── Officer Register ── */}
            {officerTab === "register" && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={officerName}
                    onChange={(e) => { setOfficerName(e.target.value); setOfficerRegError(""); }}
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Designation</label>
                  <select value={officerDesig} onChange={(e) => setOfficerDesig(e.target.value)} className={INPUT}>
                    <option>Senior Credit Analyst</option>
                    <option>Junior Credit Analyst</option>
                    <option>Credit Risk Manager</option>
                    <option>Loan Officer</option>
                    <option>Branch Manager</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    placeholder="e.g. rahul@paisascore.in"
                    value={selectedOfficer}
                    onChange={(e) => { setSelectedOfficer(e.target.value); setOfficerRegError(""); }}
                    className={INPUT}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
                  <select value={officerDept} onChange={(e) => setOfficerDept(e.target.value)} className={INPUT}>
                    <option>Credit Risk</option>
                    <option>Retail Lending</option>
                    <option>Home Loans</option>
                    <option>Vehicle Finance</option>
                    <option>Education Loans</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password *</label>
                  <PasswordInput value={officerRegPass} onChange={(v) => { setOfficerRegPass(v); setOfficerRegError(""); }} placeholder="Min. 6 characters" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm Password *</label>
                  <PasswordInput value={officerRegConfirm} onChange={(v) => { setOfficerRegConfirm(v); setOfficerRegError(""); }} placeholder="Re-enter password" />
                </div>

                {officerRegError && (
                  <p className="text-red-500 text-xs flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">error</span>{officerRegError}
                  </p>
                )}

                <button
                  id="officer-register-btn"
                  onClick={handleOfficerRegister}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>badge</span>
                  Register &amp; Enter Officer Portal
                </button>
                <p className="text-[10px] text-slate-400 text-center">
                  Your credentials are stored locally for this demo session.
                </p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-400 text-xs">
          © 2026 PaisaScore Financial Technologies Pvt. Ltd. · For portfolio &amp; demo purposes only.
        </p>
      </div>
    </div>
  );
}
