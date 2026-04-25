import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Syncing PaisaScore core data (Officers & Loan Types)...");

  // ── TABLE 8: Officers (Upsert to preserve ID 1 and 2) ────────────────────────
  const priyaOfficer = await prisma.officer.upsert({
    where: { email: "priya@paisascore.in" },
    update: {},
    create: {
      name: "Priya Nair",
      email: "priya@paisascore.in",
      password: "password123",
      designation: "Senior Credit Analyst",
      department: "Credit Risk"
    }
  });

  const rahulOfficer = await prisma.officer.upsert({
    where: { email: "rahul@paisascore.in" },
    update: {},
    create: {
      name: "Rahul Sharma",
      email: "rahul@paisascore.in",
      password: "password123",
      designation: "Junior Credit Analyst",
      department: "Retail Lending"
    }
  });

  // ── TABLE 4: Loan Types ───────────────────────────────────────────────────
  await prisma.loanType.upsert({ where: { id: 1 }, update: {}, create: { id: 1, loanTypeName: "Home Loan",      interestRate: 7.45,  maxAmount: 5000000, maxTenure: 240 } });
  await prisma.loanType.upsert({ where: { id: 2 }, update: {}, create: { id: 2, loanTypeName: "Personal Loan",  interestRate: 11.50, maxAmount: 1500000, maxTenure: 60  } });
  await prisma.loanType.upsert({ where: { id: 3 }, update: {}, create: { id: 3, loanTypeName: "Education Loan", interestRate: 9.75,  maxAmount: 2000000, maxTenure: 84  } });
  await prisma.loanType.upsert({ where: { id: 4 }, update: {}, create: { id: 4, loanTypeName: "Car Loan",       interestRate: 8.50,  maxAmount: 250000,  maxTenure: 84  } });

  console.log("✅ Core data synced. Existing users and loans preserved!");
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
