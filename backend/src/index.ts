import express from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

app.use(express.json());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  if (req.method === "OPTIONS") { res.sendStatus(200); return; }
  next();
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ═════════════════════════════════════════════════════════════════════════════
// TABLE 1 — APPLICANTS
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/applicants — All applicants with latest credit score (officer view)
app.get("/api/applicants", async (_req, res) => {
  try {
    const applicants = await prisma.applicant.findMany({
      include: {
        creditScores: { orderBy: { scoreDate: "desc" }, take: 1 },
        creditHistory: true,
        loanApplications: { select: { id: true, loanStatus: true } },
      },
      orderBy: { id: "asc" },
    });
    res.json(applicants);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/applicants — Create new applicant (Sign Up)
app.post("/api/applicants", async (req, res) => {
  try {
    const { fullName, email, age, gender, employmentType, monthlyIncome, contactNumber, address, password } = req.body;

    if (!fullName || !email || !age || !gender || !employmentType || !monthlyIncome || !contactNumber || !address || !password) {
      res.status(400).json({ error: "All fields are required." });
      return;
    }

    // Create applicant (TABLE 1)
    const applicant = await prisma.applicant.create({
      data: {
        fullName: String(fullName).trim(),
        email: email && String(email).trim() ? String(email).trim().toLowerCase() : null,
        age: Number(age),
        gender: String(gender),
        employmentType: String(employmentType),
        monthlyIncome: Number(monthlyIncome),
        contactNumber: String(contactNumber).trim(),
        address: String(address).trim(),
        password: String(password),
      },
    });

    // Create initial credit history (TABLE 2)
    await prisma.creditHistory.create({
      data: {
        applicantId: applicant.id,
        creditLengthYears: 0,
        totalLoans: 0,
        defaultCount: 0,
        lastUpdated: new Date(),
      },
    });

    // Calculate initial score based on provided dataset brackets (TABLE 3)
    let initialScore = 600;
    const income = Number(monthlyIncome);

    if (income < 50000) {
      initialScore = 600;
    } else if (income < 100000) {
      initialScore = 650;
    } else if (income < 500000) {
      initialScore = 710;
    } else {
      initialScore = 780;
    }

    // Apply employment type fine-tuning
    if (employmentType === "Salaried")       initialScore += 30;
    if (employmentType === "Business Owner")  initialScore += 15;
    if (employmentType === "Self-employed")   initialScore -= 10;

    // Bounds checking based on dataset min/max for each bracket
    let min = 400, max = 900;
    if (income < 50000)         { min = 450; max = 680; }
    else if (income < 100000)   { min = 500; max = 720; }
    else if (income < 500000)   { min = 600; max = 780; }
    else                        { min = 650; max = 850; }

    initialScore = Math.max(min, Math.min(initialScore, max));
    const riskCategory = initialScore >= 750 ? "Low" : initialScore >= 650 ? "Medium" : "High";

    await prisma.creditScore.create({
      data: {
        applicantId: applicant.id,
        creditScore: initialScore,
        riskCategory,
        scoreDate: new Date(),
      },
    });

    res.status(201).json(applicant);
  } catch (e: any) {
    if (e.code === "P2002") {
      res.status(400).json({ error: "An account with this Name or Email already exists." });
      return;
    }
    console.error("Signup Error:", e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ── Auth Routes ──────────────────────────────────────────────────────────────

// POST /api/auth/login (User)
app.post("/api/auth/login", async (req, res) => {
  try {
    const { nameOrEmail, password } = req.body;
    const user = await prisma.applicant.findFirst({
      where: {
        OR: [
          { fullName: nameOrEmail },
          { email: nameOrEmail.toLowerCase() },
        ],
        password: password,
      },
    });

    if (!user) {
      res.status(401).json({ error: "Invalid name or password." });
      return;
    }

    res.json({ id: user.id, name: user.fullName, role: "user" });
  } catch (e) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/auth/officer/register
app.post("/api/auth/officer/register", async (req, res) => {
  try {
    const { name, email, password, designation, department } = req.body;
    const officer = await prisma.officer.create({
      data: { name, email, password, designation, department },
    });
    res.status(201).json({ id: officer.id, name: officer.name, role: "officer" });
  } catch (e: any) {
    if (e.code === "P2002") {
      res.status(400).json({ error: "Email already exists." });
      return;
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/auth/officer/login
app.post("/api/auth/officer/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const officer = await prisma.officer.findFirst({
      where: { email, password },
    });

    if (!officer) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    res.json({ id: officer.id, name: officer.name, role: "officer" });
  } catch (e) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});



// GET /api/applicants/:id — Full profile (officer deep-dive)
app.get("/api/applicants/:id", async (req, res) => {
  try {
    const applicant = await prisma.applicant.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        creditScores: { orderBy: { scoreDate: "desc" } },
        creditHistory: true,
        loanApplications: {
          include: { loanType: true, approvalDecision: true, repayments: { orderBy: { paymentDate: "desc" } } },
          orderBy: { applicationDate: "desc" },
        },
      },
    });
    if (!applicant) { res.status(404).json({ error: "Not found" }); return; }
    res.json(applicant);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TABLE 4 — LOAN TYPES
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/loan-types
app.get("/api/loan-types", async (_req, res) => {
  try {
    const types = await prisma.loanType.findMany({ orderBy: { id: "asc" } });
    res.json(types);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TABLE 5 — LOAN APPLICATIONS
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/loan-applications — All applications (officer view)  ← MUST be before /:id
app.get("/api/loan-applications", async (req, res) => {
  try {
    const { officerId, unassigned } = req.query;
    
    const where: any = {};
    if (officerId) {
      where.officerId = Number(officerId);
    } else if (unassigned === "true") {
      where.officerId = null;
    }

    const loans = await prisma.loanApplication.findMany({
      where,
      include: {
        applicant: {
          include: {
            creditScores: { orderBy: { scoreDate: "desc" }, take: 1 },
          },
        },
        loanType: true,
        approvalDecision: { include: { officer: true } },
        repayments: { orderBy: { paymentDate: "desc" } },
        officer: true,
      },
      orderBy: { applicationDate: "desc" },
    });
    res.json(loans);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/loan-applications/by-applicant/:applicantId  ← MUST be before /:id
app.get("/api/loan-applications/by-applicant/:applicantId", async (req, res) => {
  try {
    const loans = await prisma.loanApplication.findMany({
      where: { applicantId: Number(req.params.applicantId) },
      include: {
        loanType: true,
        approvalDecision: true,
        repayments: { orderBy: { paymentDate: "desc" } },
      },
      orderBy: { applicationDate: "desc" },
    });
    res.json(loans);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/loan-applications/:id — Detailed view for officer review
app.get("/api/loan-applications/:id", async (req, res) => {
  try {
    const loan = await prisma.loanApplication.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        applicant: {
          include: {
            creditScores: { orderBy: { scoreDate: "desc" }, take: 1 },
            creditHistory: true,
          },
        },
        loanType: true,
        approvalDecision: true,
        repayments: { orderBy: { paymentDate: "asc" } },
      },
    });
    if (!loan) { res.status(404).json({ error: "Not found" }); return; }
    res.json(loan);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/loan-applications — User applies for a loan
const applySchema = z.object({
  applicantId: z.number().int().positive(),
  loanTypeId:  z.number().int().positive(),
  loanAmount:  z.number().positive(),
  tenureMonths:z.number().int().positive(),
});

app.post("/api/loan-applications", async (req, res) => {
  try {
    const data = applySchema.parse(req.body);

    // Validate against loan type limits
    const loanType = await prisma.loanType.findUnique({ where: { id: data.loanTypeId } });
    if (!loanType) { res.status(404).json({ error: "Loan type not found" }); return; }
    
    // Feature request: No limit on loan amount. So we only validate tenure.
    if (data.tenureMonths > loanType.maxTenure) {
      res.status(400).json({ error: `Exceeds max tenure of ${loanType.maxTenure} months` });
      return;
    }

    const loan = await prisma.loanApplication.create({
      data: {
        applicantId: data.applicantId,
        loanTypeId: data.loanTypeId,
        loanAmount: data.loanAmount,
        tenureMonths: data.tenureMonths,
        loanStatus: "Pending",
      },
      include: { loanType: true },
    });
    res.status(201).json(loan);
  } catch (e) {
    if (e instanceof z.ZodError) { res.status(400).json({ error: e.issues }); return; }
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// PATCH /api/loan-applications/:id/assign — Officer claims a loan
app.patch("/api/loan-applications/:id/assign", async (req, res) => {
  try {
    const { officerId } = req.body;
    const loanId = Number(req.params.id);

    if (!officerId) { res.status(400).json({ error: "Officer ID is required" }); return; }

    const loan = await prisma.loanApplication.update({
      where: { id: loanId },
      data: { officerId: Number(officerId) },
      include: { officer: true }
    });

    res.json(loan);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Assignment failed" });
  }
});

// TABLE 6 — APPROVAL DECISIONS
// ═════════════════════════════════════════════════════════════════════════════

// POST /api/approval-decisions — Officer approves or rejects
const decisionSchema = z.object({
  loanId: z.number().int().positive(),
  officerId: z.number().int().positive(),
  decisionStatus: z.enum(["Approved", "Rejected"]),
  decisionReason: z.string().min(5),
});

app.post("/api/approval-decisions", async (req, res) => {
  try {
    console.log("📝 Received decision attempt:", req.body);
    const data = decisionSchema.parse(req.body);
    console.log("✅ Validation passed for loan:", data.loanId);

    const [loan, officer] = await Promise.all([
      prisma.loanApplication.findUnique({ where: { id: data.loanId } }),
      prisma.officer.findUnique({ where: { id: data.officerId } }),
    ]);

    if (!loan) { res.status(404).json({ error: "Loan not found" }); return; }
    if (!officer) { res.status(401).json({ error: "Officer session expired. Please re-login." }); return; }

    // Upsert decision
    const decision = await prisma.approvalDecision.upsert({
      where: { loanId: data.loanId },
      update: { 
        decisionStatus: data.decisionStatus, 
        decisionReason: data.decisionReason, 
        decisionDate: new Date(),
        officerId: data.officerId
      },
      create: { 
        loanId: data.loanId, 
        decisionStatus: data.decisionStatus, 
        decisionReason: data.decisionReason,
        officerId: data.officerId
      },
    });

    // Sync loan status AND ensure it's assigned to this officer if not already
    await prisma.loanApplication.update({
      where: { id: data.loanId },
      data: { 
        loanStatus: data.decisionStatus,
        officerId: data.officerId 
      },
    });

    // If it's advancing to Approved for the first time, increment the CreditHistory totalLoans
    if (data.decisionStatus === "Approved" && loan.loanStatus !== "Approved") {
      await prisma.creditHistory.update({
        where: { applicantId: loan.applicantId },
        data: { totalLoans: { increment: 1 }, lastUpdated: new Date() }
      });
    }

    res.status(201).json(decision);
  } catch (e) {
    console.error("Decision Submission Error:", e);
    if (e instanceof z.ZodError) { res.status(400).json({ error: e.issues }); return; }
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// TABLE 7 — REPAYMENTS
// ═════════════════════════════════════════════════════════════════════════════

// GET /api/repayments/by-loan/:loanId  ← MUST be before /api/repayments/:id
app.get("/api/repayments/by-loan/:loanId", async (req, res) => {
  try {
    const repayments = await prisma.repayment.findMany({
      where: { loanId: Number(req.params.loanId) },
      orderBy: { paymentDate: "asc" },
    });
    res.json(repayments);
  } catch (e) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/repayments — User makes payment
app.post("/api/repayments", async (req, res) => {
  try {
    const { loanId, amountPaid, remainingAmount } = req.body;
    
    // Validate payload
    if (!loanId || typeof amountPaid !== "number" || typeof remainingAmount !== "number") {
      res.status(400).json({ error: "Invalid payment data" });
      return;
    }

    const loan = await prisma.loanApplication.findUnique({
      where: { id: Number(loanId) },
      include: { applicant: true },
    });

    if (!loan) {
      res.status(404).json({ error: "Loan not found" });
      return;
    }

    // Insert the repayment record
    const repayment = await prisma.repayment.create({
      data: {
        loanId: Number(loanId),
        amountPaid: Number(amountPaid),
        remainingAmount: Number(remainingAmount),
        paymentStatus: amountPaid > 0 ? "Paid" : "Overdue",
      },
    });

    // Handle Credit Score Logic
    const latestScore = await prisma.creditScore.findFirst({
      where: { applicantId: loan.applicantId },
      orderBy: { scoreDate: "desc" },
    });

    if (latestScore) {
      let scoreDelta = 0;
      if (repayment.paymentStatus === "Paid") {
        scoreDelta = 5; // +5 points for paying EMI
      } else if (repayment.paymentStatus === "Overdue") {
        scoreDelta = -25; // -25 penalty for missed EMI
        
        // Also increment defaults in credit history
        await prisma.creditHistory.update({
          where: { applicantId: loan.applicantId },
          data: { defaultCount: { increment: 1 }, lastUpdated: new Date() },
        });
      }

      if (scoreDelta !== 0) {
        const newRawScore = latestScore.creditScore + scoreDelta;
        const boundedScore = Math.max(300, Math.min(newRawScore, 900));
        const newRisk = boundedScore >= 750 ? "Low" : boundedScore >= 650 ? "Medium" : "High";

        await prisma.creditScore.create({
          data: {
            applicantId: loan.applicantId,
            creditScore: boundedScore,
            riskCategory: newRisk,
            scoreDate: new Date(),
          },
        });
      }
    }

    res.status(201).json(repayment);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS — Officer Dashboard
// ═════════════════════════════════════════════════════════════════════════════

app.get("/api/analytics", async (req, res) => {
  try {
    const { officerId } = req.query;
    const filter: any = {};
    if (officerId) filter.officerId = Number(officerId);

    const [
      totalApplicants, totalLoans, myPending, unassignedPending, approved, rejected,
      portfolio, avgScore, highRisk
    ] = await Promise.all([
      prisma.applicant.count(),
      prisma.loanApplication.count({ where: filter }),
      prisma.loanApplication.count({ where: { ...filter, loanStatus: "Pending" } }),
      prisma.loanApplication.count({ where: { officerId: null, loanStatus: "Pending" } }),
      prisma.loanApplication.count({ where: { ...filter, loanStatus: "Approved" } }),
      prisma.loanApplication.count({ where: { ...filter, loanStatus: "Rejected" } }),
      prisma.loanApplication.aggregate({ where: { ...filter, loanStatus: "Approved" }, _sum: { loanAmount: true } }),
      prisma.creditScore.aggregate({ _avg: { creditScore: true } }),
      prisma.creditScore.count({ where: { riskCategory: "High" } }),
    ]);

    const approvalRate = totalLoans > 0 ? Number(((approved / totalLoans) * 100).toFixed(1)) : 0;

    res.json({
      totalApplicants,
      totalLoans,
      pendingQueue: myPending + unassignedPending,
      approvedLoans: approved,
      rejectedLoans: rejected,
      totalPortfolioValue: portfolio._sum.loanAmount || 0,
      approvalRate,
      avgCreditScore: Math.round(avgScore._avg.creditScore || 0),
      highRiskCount: highRisk,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 PaisaScore API running at http://localhost:${PORT}`);
});
