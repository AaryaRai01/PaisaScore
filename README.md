# PaisaScore 🚀

PaisaScore is a full-stack credit risk platform built with **Next.js**, **Express**, and **MySQL/Prisma**, featuring **Tailwind CSS 4** and **TypeScript** for a scalable, type-safe, and high-performance financial management solution.

---

## 🌟 Key Features

- **Automated Credit Scoring**: Evaluates applicants based on income, employment, and credit history using data-driven algorithms.
- **Loan Management Dashboard**: A professional interface for Bank Officers to review, assign, approve, or reject loan applications.
- **Real-time Risk Categorization**: Automatically categorizes applications into **Low**, **Medium**, and **High** risk levels.
- **Applicant Portal**: Secure portal for users to submit loan requests, track status, and manage profile details.
- **Repayment Tracking**: Comprehensive system to monitor payment schedules, remaining balances, and credit score impacts.
- **Analytics & Reporting**: Data visualization for portfolio value, approval rates, and high-risk applicant counts.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [React Query](https://tanstack.com/query/latest) & [Axios](https://axios-http.com/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Runtime**: [Node.js](https://nodejs.org/) with [TypeScript](https://www.typescriptlang.org/)
- **Framework**: [Express.js](https://expressjs.com/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [MySQL](https://www.mysql.com/)
- **Validation**: [Zod](https://zod.dev/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- MySQL Server (Local or Cloud)
- npm or yarn

### 1. Clone the Repository
```bash
git clone https://github.com/AaryaRai01/PaisaScore.git
cd PaisaScore
```

### 2. Backend Setup
```bash
cd backend
npm install
```
- Create a `.env` file based on `.env.example`.
- **Database Initialization**:
```bash
# Push schema to database
npx prisma db push

# (Optional) Seed initial data
npm run seed
```
- **Run Development**:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

## 🌐 Deployment (Cloud)

PaisaScore is deployment-ready and optimized for the following **Free Tier** stack:

| Service | Component | Purpose |
| :--- | :--- | :--- |
| **Aiven** | MySQL Database | Free managed MySQL instance |
| **Render** | Node.js Backend | API hosting with automatic builds |
| **Vercel** | Next.js Frontend | High-performance static & SSR hosting |

### Required Environment Variables

#### Backend (`/backend`)
- `DATABASE_URL`: Your cloud MySQL connection string.
- `FRONTEND_URL`: Your deployed Vercel URL (e.g., `https://paisascore.vercel.app`).
- `PORT`: Auto-set by Render.

#### Frontend (`/frontend`)
- `NEXT_PUBLIC_API_URL`: Your deployed Render API URL (e.g., `https://paisascore-api.onrender.com/api`).

---

## 📂 Project Structure

```text
PaisaScore/
├── backend/                # Express API & Prisma Schema
│   ├── prisma/            # Database models, migrations, and seeds
│   ├── src/               # API logic, controllers, and routes
│   └── migration_mysql.sql # SQL schema dump
├── frontend/               # Next.js Application
│   ├── src/app/           # App router pages and layouts
│   ├── src/components/    # UI components and Radix primitives
│   ├── src/lib/           # API client and utilities
│   └── src/store/         # Zustand state management
└── README.md
```

---

## 👥 Contributors

- **Aarya Rai**
- **Kushagra Tyagi**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
