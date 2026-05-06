# PaisaScore 🚀
### *Simplifying Finance through Intelligent Technology*

PaisaScore is a state-of-the-art **Full-Stack Credit Risk Assessment and Loan Management Platform**. Engineered for the modern financial landscape, it bridges the gap between raw applicant data and actionable credit insights. Built with a focus on scalability, type-safety, and high performance, PaisaScore provides a seamless experience for both borrowers and financial officers.

---

## 🌟 Key Modules & Features

### 👤 Borrower Experience
- **Smart Onboarding**: Dynamic registration with real-time profile creation.
- **Automated Credit Scoring**: Instant score generation based on income, employment, and financial history.
- **Loan Tracking**: Full visibility into application status, repayment schedules, and outstanding balances.
- **Interactive Dashboards**: Personalized KPIs showing credit health and risk categories.

### 🏦 Loan Officer Portal
- **Officer Deep-Dive**: Comprehensive review of applicant profiles and historical credit data.
- **Decision Engine**: Streamlined interface for approving or rejecting loans with documented justifications.
- **Portfolio Analytics**: Real-time monitoring of total portfolio value, approval rates, and high-risk applicant distribution.
- **Automated Risk Tagging**: Visual indicators for **Low**, **Medium**, and **High** risk profiles.

---

## 🛠️ Modern Tech Stack

### **Frontend Infrastructure**
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router & Server Components)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (Next-gen utility-first CSS)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Lightweight, reactive state)
- **Data Fetching**: [TanStack Query (v5)](https://tanstack.com/query/latest) & [Axios](https://axios-http.com/)
- **UI Components**: Radix UI & Custom primitives

### **Backend & Database**
- **Runtime**: [Node.js](https://nodejs.org/) & [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/) (Type-safe database client)
- **Database**: [MySQL](https://www.mysql.com/)
- **Validation**: [Zod](https://zod.dev/) (Schema-first validation)

---

## 🌐 Production Deployment Architecture

PaisaScore utilizes a high-performance, distributed deployment strategy to ensure 24/7 availability and global reach.

| Layer | Technology | Service | Description |
| :--- | :--- | :--- | :--- |
| **Database** | **MySQL** | [Aiven](https://aiven.io/) | Managed, high-availability cloud database. |
| **Backend** | **Express API** | [Render](https://render.com/) | Auto-scaling compute instance with CI/CD. |
| **Frontend** | **Next.js** | [Vercel](https://vercel.com/) | Edge-optimized static and dynamic hosting. |
| **Connectivity** | **REST & TLS** | Cloudflare | Encrypted, secure communication between layers. |

---

## 📂 Project Architecture

```text
PaisaScore/
├── backend/                # Server-Side Infrastructure
│   ├── prisma/            # Database Models & Seed Scripts
│   ├── src/               # Express Controllers, Routes & Business Logic
│   └── dist/              # Compiled Production JavaScript
├── frontend/               # Client-Side Application
│   ├── src/app/           # Next.js App Router (Pages & Layouts)
│   ├── src/components/    # Reusable UI Architecture
│   ├── src/lib/           # API Clients & Utility Functions
│   └── src/store/         # Global State Management
└── README.md               # Documentation & Project Roadmap
```

---

## 🚀 Local Development Guide

### 1. Prerequisites
- Node.js (v18+)
- MySQL Server
- npm or yarn

### 2. Installation
```bash
git clone https://github.com/AaryaRai01/PaisaScore.git
cd PaisaScore
```

### 3. Environment Configuration
Create a `.env` file in the `/backend` directory:
```env
DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DATABASE"
FRONTEND_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
cd backend
npm install
npx prisma db push
npx prisma db seed
```

### 5. Launch the Application
```bash
# Start Backend (Port 5001)
npm run dev

# Start Frontend (Port 3000)
cd ../frontend
npm install
npm run dev
```

---

## 👥 Professional Team

- **Aarya Rai** — Lead Architect & Full-Stack Developer
- **Kushagra Tyagi** — System Designer & Developer

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
