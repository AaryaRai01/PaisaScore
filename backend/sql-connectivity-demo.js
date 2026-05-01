require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());

// ── DATABASE CONFIGURATION ───────────────────────────────────────────────────
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'PaisaScore'
});

// ── CONNECT TO MYSQL ────────────────────────────────────────────────────────
db.connect((err) => {
    if (err) {
        console.error("❌ MySQL Connection Error:", err.message);
        return;
    }
    console.log("✅ PaisaScore MySQL Database Connected Successfully");
    console.log("   Ready to show SQL connectivity for your presentation.");
});

// ── API ROUTES (RAW SQL) ─────────────────────────────────────────────────────

// 1. SELECT: Fetch all Applicants
app.get('/api/sql/applicants', (req, res) => {
    console.log("🔍 Executing: SELECT * FROM Applicant");
    db.query("SELECT id, fullName, email, monthlyIncome FROM Applicant", (err, results) => {
        if (err) {
            console.error("❌ Fetch Error:", err.message);
            return res.status(500).send("Error fetching data");
        }
        res.json(results);
    });
});

// 2. INSERT: Add a new Applicant
app.post('/api/sql/add', (req, res) => {
    const { fullName, email, age, gender, employmentType, monthlyIncome, contactNumber, address, password } = req.body;

    console.log("📥 Executing: INSERT INTO Applicant...");

    const query = `
        INSERT INTO Applicant 
        (fullName, email, age, gender, employmentType, monthlyIncome, contactNumber, address, password) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        query,
        [fullName, email, age, gender, employmentType, monthlyIncome, contactNumber, address, password || 'password123'],
        (err, result) => {
            if (err) {
                console.error("❌ Insert Error:", err.message);
                return res.status(500).send("Error inserting data");
            }
            console.log("✅ New Applicant Added via Raw SQL");
            res.json({ message: "Student/Applicant Added Successfully", id: result.insertId });
        }
    );
});

// 3. DELETE: Remove an Applicant
app.delete('/api/sql/delete/:id', (req, res) => {
    console.log(`🗑️ Executing: DELETE FROM Applicant WHERE id = ${req.params.id}`);
    db.query(
        "DELETE FROM Applicant WHERE id=?",
        [req.params.id],
        (err, result) => {
            if (err) {
                console.error("❌ Delete Error:", err.message);
                return res.status(500).send("Error deleting data");
            }
            res.send("Applicant Deleted via SQL");
        }
    );
});

// ── SERVER START ─────────────────────────────────────────────────────────────
const PORT = 5005;
app.listen(PORT, () => {
    console.log("---------------------------------------------------------");
    console.log(`🚀 SQL Connectivity Demo running at http://localhost:${PORT}`);
    console.log(`   - GET    http://localhost:${PORT}/api/sql/applicants`);
    console.log(`   - POST   http://localhost:${PORT}/api/sql/add`);
    console.log(`   - DELETE http://localhost:${PORT}/api/sql/delete/1`);
    console.log("---------------------------------------------------------");
});
