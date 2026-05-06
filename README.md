# PaisaScore 🚀

PaisaScore is a comprehensive **Credit Risk Assessment and Loan Management Platform** designed to streamline the loan application process. It uses a data-driven approach to evaluate applicant risk and manage the entire loan lifecycle from application to repayment.

## 🌟 Key Features

- **Automated Credit Scoring**: Evaluates applicants based on income, employment, and credit history.
- **Loan Management**: Dashboard for Bank Officers to review, approve, or reject loan applications.
- **Risk Categorization**: Automatically tags applications as Low, Medium, or High risk.
- **Applicant Portal**: Allows users to submit loan requests and track their status.
- **Repayment Tracking**: Monitor payment schedules and remaining balances.
- **Historical Data Analysis**: Stores and analyzes past credit performance.

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Fetching**: [React Query](https://tanstack.com/query/latest) & [Axios](https://axios-http.com/)
- **UI Components**: Radix UI / Custom components

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
- MySQL Server
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
- Create a `.env` file based on `.env.example`:
```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/PaisaScore"
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=PaisaScore
```
- Initialize the database:
```bash
npx prisma migrate dev
# Or import the SQL dump
npm run db:schema
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

---

## 📂 Project Structure

```text
PaisaScore/
├── backend/                # Express API & Prisma Schema
│   ├── prisma/            # Database models and migrations
│   ├── src/               # API logic and controllers
│   └── migration_dump.sql # Sample data dump
├── frontend/               # Next.js Application
│   ├── src/app/           # App router pages
│   ├── src/components/    # Reusable UI components
│   └── src/store/         # Zustand state management
└── README.md
```

## 👥 Contributors

- **Aarya Rai**
- **Kushagra Tyagi**

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
