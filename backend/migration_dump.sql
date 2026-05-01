PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE IF NOT EXISTS "Applicant" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "employmentType" TEXT NOT NULL,
    "monthlyIncome" REAL NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
, "password" TEXT DEFAULT 'password123', "email" TEXT);
INSERT INTO Applicant VALUES(1,'Arjun Mehta',28,'Male','Salaried',55000.0,'9876543210','Bandra West, Mumbai',1776930782932,'password123',NULL);
INSERT INTO Applicant VALUES(2,'Riya Sharma',32,'Female','Self-employed',82000.0,'9822211133','Sector 21, Gurgaon',1776930782934,'password123',NULL);
INSERT INTO Applicant VALUES(3,'Kunal Verma',40,'Male','Salaried',120000.0,'9898989898','HSR Layout, Bengaluru',1776930782935,'password123',NULL);
INSERT INTO Applicant VALUES(4,'Megha Kapoor',26,'Female','Salaried',45000.0,'9001234567','Kothrud, Pune',1776930782936,'password123',NULL);
INSERT INTO Applicant VALUES(5,'Rohan Gupta',35,'Male','Business Owner',95000.0,'9123456789','Koregaon Park, Pune',1776930782937,'password123',NULL);
INSERT INTO Applicant VALUES(6,'Priya Nair',29,'Female','Salaried',68000.0,'9988776655','Andheri West, Mumbai',1776930782938,'password123',NULL);
INSERT INTO Applicant VALUES(7,'Aarya Rai',20,'Male','Salaried',50000.0,'1234567890','123 Main St',1777037818130,'password123','aarya.rai185@gmail.com');
CREATE TABLE IF NOT EXISTS "CreditHistory" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicantId" INTEGER NOT NULL,
    "creditLengthYears" INTEGER NOT NULL,
    "totalLoans" INTEGER NOT NULL,
    "defaultCount" INTEGER NOT NULL,
    "lastUpdated" DATETIME NOT NULL,
    CONSTRAINT "CreditHistory_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO CreditHistory VALUES(1,1,5,2,0,1705017600000);
INSERT INTO CreditHistory VALUES(2,2,7,3,1,1707091200000);
INSERT INTO CreditHistory VALUES(3,3,10,6,0,1777037906589);
INSERT INTO CreditHistory VALUES(4,4,2,0,0,1706486400000);
INSERT INTO CreditHistory VALUES(5,5,8,4,0,1709251200000);
INSERT INTO CreditHistory VALUES(6,6,3,1,0,1709596800000);
INSERT INTO CreditHistory VALUES(7,7,0,0,0,1777037818139);
CREATE TABLE IF NOT EXISTS "CreditScore" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicantId" INTEGER NOT NULL,
    "creditScore" INTEGER NOT NULL,
    "riskCategory" TEXT NOT NULL,
    "scoreDate" DATETIME NOT NULL,
    CONSTRAINT "CreditScore_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO CreditScore VALUES(1,1,760,'Low',1706745600000);
INSERT INTO CreditScore VALUES(2,2,640,'Medium',1707523200000);
INSERT INTO CreditScore VALUES(3,3,810,'Low',1707955200000);
INSERT INTO CreditScore VALUES(4,4,590,'High',1708214400000);
INSERT INTO CreditScore VALUES(5,5,775,'Low',1709337600000);
INSERT INTO CreditScore VALUES(6,6,710,'Low',1709683200000);
INSERT INTO CreditScore VALUES(7,7,680,'Medium',1777037818141);
CREATE TABLE IF NOT EXISTS "LoanType" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "loanTypeName" TEXT NOT NULL,
    "interestRate" REAL NOT NULL,
    "maxAmount" REAL NOT NULL,
    "maxTenure" INTEGER NOT NULL
);
INSERT INTO LoanType VALUES(1,'Home Loan',7.450000000000000177,5000000.0,240);
INSERT INTO LoanType VALUES(2,'Personal Loan',11.5,1500000.0,60);
INSERT INTO LoanType VALUES(3,'Education Loan',9.75,2000000.0,84);
INSERT INTO LoanType VALUES(4,'Car Loan',8.5,250000.0,84);
CREATE TABLE IF NOT EXISTS "Repayment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "loanId" INTEGER NOT NULL,
    "amountPaid" REAL NOT NULL,
    "paymentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remainingAmount" REAL NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    CONSTRAINT "Repayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "LoanApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO Repayment VALUES(1,1,7783.0,1772323200000,292217.0,'Paid');
INSERT INTO Repayment VALUES(2,1,7783.0,1775001600000,284434.0,'Paid');
INSERT INTO Repayment VALUES(3,1,7783.0,1777593600000,276651.0,'Due');
INSERT INTO Repayment VALUES(4,3,5161.0,1772323200000,234839.0,'Paid');
INSERT INTO Repayment VALUES(5,3,5161.0,1775001600000,229678.0,'Paid');
INSERT INTO Repayment VALUES(6,3,5161.0,1777593600000,224517.0,'Due');
CREATE TABLE IF NOT EXISTS "Officer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "designation" TEXT,
    "department" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO Officer VALUES(1,'Priya Nair','priya@paisascore.in','password123','Senior Credit Analyst','Credit Risk',1776930782930);
INSERT INTO Officer VALUES(2,'Rahul Sharma','rahul@paisascore.in','password123','Junior Credit Analyst','Retail Lending',1776930782931);
INSERT INTO Officer VALUES(3,'Nitin Kumar','nitin@paisascore.in','password123','Loan Officer','Credit Risk',1777037854309);
CREATE TABLE IF NOT EXISTS "ApprovalDecision" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "loanId" INTEGER NOT NULL,
    "decisionStatus" TEXT NOT NULL,
    "decisionReason" TEXT NOT NULL,
    "decisionDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "officerId" INTEGER DEFAULT 1,
    CONSTRAINT "ApprovalDecision_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "LoanApplication" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ApprovalDecision_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO ApprovalDecision VALUES(1,1,'Approved','Good credit score of 760 (Low Risk) and stable salaried income.',1770681600000,1);
INSERT INTO ApprovalDecision VALUES(2,3,'Approved','Excellent credit history with 10 years tenure and zero defaults.',1770681600000,2);
INSERT INTO ApprovalDecision VALUES(3,6,'Rejected','Loan amount exceeds permissible limit for credit score of 710.',1774137600000,1);
INSERT INTO ApprovalDecision VALUES(4,7,'Rejected','Automatic test decision for loan 7.',1776930782972,2);
INSERT INTO ApprovalDecision VALUES(5,10,'Approved','Automatic test decision for loan 10.',1776930782978,2);
INSERT INTO ApprovalDecision VALUES(6,15,'Approved','Automatic test decision for loan 15.',1776930782984,1);
INSERT INTO ApprovalDecision VALUES(7,21,'Rejected','Automatic test decision for loan 21.',1776930782992,1);
INSERT INTO ApprovalDecision VALUES(8,25,'Approved','Automatic test decision for loan 25.',1776930782999,2);
INSERT INTO ApprovalDecision VALUES(9,28,'Rejected','Automatic test decision for loan 28.',1776930783004,2);
INSERT INTO ApprovalDecision VALUES(10,30,'Approved','Automatic test decision for loan 30.',1776930783008,1);
INSERT INTO ApprovalDecision VALUES(11,17,'Approved','manual test',1776931076486,1);
INSERT INTO ApprovalDecision VALUES(12,27,'Rejected','Low credit score and high loan amount; low income',1777037886382,3);
INSERT INTO ApprovalDecision VALUES(13,26,'Approved','Good credit score',1777037906587,3);
CREATE TABLE IF NOT EXISTS "LoanApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "applicantId" INTEGER NOT NULL,
    "loanTypeId" INTEGER NOT NULL,
    "loanAmount" REAL NOT NULL,
    "tenureMonths" INTEGER NOT NULL,
    "applicationDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "loanStatus" TEXT NOT NULL DEFAULT 'Pending',
    "officerId" INTEGER,
    CONSTRAINT "LoanApplication_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "Applicant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoanApplication_loanTypeId_fkey" FOREIGN KEY ("loanTypeId") REFERENCES "LoanType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LoanApplication_officerId_fkey" FOREIGN KEY ("officerId") REFERENCES "Officer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO LoanApplication VALUES(1,1,2,300000.0,48,1770595200000,'Approved',1);
INSERT INTO LoanApplication VALUES(2,2,1,4500000.0,180,1770595200000,'Pending',1);
INSERT INTO LoanApplication VALUES(3,3,4,240000.0,60,1770595200000,'Approved',2);
INSERT INTO LoanApplication VALUES(4,4,3,800000.0,72,1770595200000,'Pending',NULL);
INSERT INTO LoanApplication VALUES(5,5,1,3500000.0,240,1773532800000,'Pending',NULL);
INSERT INTO LoanApplication VALUES(6,6,2,500000.0,48,1773964800000,'Rejected',1);
INSERT INTO LoanApplication VALUES(7,2,4,2901728.0,12,1775586600000,'Rejected',2);
INSERT INTO LoanApplication VALUES(8,3,1,529573.0,24,1775673000000,'Pending',NULL);
INSERT INTO LoanApplication VALUES(9,4,2,1217267.0,36,1775759400000,'Pending',1);
INSERT INTO LoanApplication VALUES(10,5,3,613928.0,48,1775845800000,'Approved',2);
INSERT INTO LoanApplication VALUES(11,6,4,4998393.0,60,1775932200000,'Pending',NULL);
INSERT INTO LoanApplication VALUES(12,1,1,3671945.0,120,1776018600000,'Pending',1);
INSERT INTO LoanApplication VALUES(13,2,2,1427242.0,240,1776105000000,'Pending',2);
INSERT INTO LoanApplication VALUES(14,3,3,4666436.0,12,1776191400000,'Rejected',NULL);
INSERT INTO LoanApplication VALUES(15,4,4,2664079.0,24,1776277800000,'Approved',1);
INSERT INTO LoanApplication VALUES(16,5,1,4866627.0,36,1776364200000,'Pending',2);
INSERT INTO LoanApplication VALUES(17,6,2,686458.0,48,1776450600000,'Pending',NULL);
INSERT INTO LoanApplication VALUES(18,1,3,1978837.0,60,1776537000000,'Pending',1);
INSERT INTO LoanApplication VALUES(19,2,4,3654056.0,120,1776623400000,'Pending',2);
INSERT INTO LoanApplication VALUES(20,3,1,3051063.0,240,1776709800000,'Approved',NULL);
INSERT INTO LoanApplication VALUES(21,4,2,114781.0,12,1776796200000,'Rejected',1);
INSERT INTO LoanApplication VALUES(22,5,3,816585.0,24,1776882600000,'Pending',2);
INSERT INTO LoanApplication VALUES(23,6,4,1116389.0,36,1776969000000,'Pending',NULL);
INSERT INTO LoanApplication VALUES(24,1,1,3367599.0,48,1777055400000,'Pending',1);
INSERT INTO LoanApplication VALUES(25,2,2,3515849.0,60,1777141800000,'Approved',2);
INSERT INTO LoanApplication VALUES(26,3,3,1519181.0,120,1777228200000,'Approved',3);
INSERT INTO LoanApplication VALUES(27,4,4,1708372.0,240,1777314600000,'Rejected',3);
INSERT INTO LoanApplication VALUES(28,5,1,1704473.0,12,1774981800000,'Rejected',2);
INSERT INTO LoanApplication VALUES(29,6,2,2886004.0,24,1775068200000,'Pending',NULL);
INSERT INTO LoanApplication VALUES(30,1,3,4779291.0,36,1775154600000,'Approved',1);
INSERT INTO LoanApplication VALUES(31,2,4,3414004.0,48,1775241000000,'Pending',2);
INSERT INTO LoanApplication VALUES(32,3,1,4498739.0,60,1775327400000,'Pending',NULL);
INSERT INTO LoanApplication VALUES(33,4,2,776793.0,120,1775413800000,'Pending',1);
INSERT INTO LoanApplication VALUES(34,5,3,3767157.0,240,1775500200000,'Pending',2);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('Officer',3);
INSERT INTO sqlite_sequence VALUES('Applicant',7);
INSERT INTO sqlite_sequence VALUES('CreditHistory',7);
INSERT INTO sqlite_sequence VALUES('CreditScore',7);
INSERT INTO sqlite_sequence VALUES('LoanType',4);
INSERT INTO sqlite_sequence VALUES('LoanApplication',34);
INSERT INTO sqlite_sequence VALUES('ApprovalDecision',13);
INSERT INTO sqlite_sequence VALUES('Repayment',6);
CREATE UNIQUE INDEX "CreditHistory_applicantId_key" ON "CreditHistory"("applicantId");
CREATE UNIQUE INDEX "Officer_email_key" ON "Officer"("email");
CREATE UNIQUE INDEX "Applicant_email_key" ON "Applicant"("email");
CREATE UNIQUE INDEX "ApprovalDecision_loanId_key" ON "ApprovalDecision"("loanId");
COMMIT;
