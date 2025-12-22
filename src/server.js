import express from "express";
import cors from "cors";
import { Pool, Query } from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express()

app.use(cors());
app.use(express.json());

const { DATABASE_URL } = process.env;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
});

app.get("/", (req, res) => {
    res.json({ message: "Server running"})
})

app.get("/api", (req, res) => {
    res.json({ message: "Server is running"});
});

app.get("/users", async (req, res) => {
    try{
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (e) {
        console.error("Query error:", e);
        res.status(500).json({ error: "Failed to fetch users"  });

    }
});









const PORT = process.env.port || 3000;
app.listen(PORT, () => {
    console.log("Server is running on Port 3005");
});

module.exports = app;