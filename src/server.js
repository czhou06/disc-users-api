import express from "express";
import cors from "cors";
import pkg from 'pg';
const { Pool } = pkg;
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
    res.json({ message: "Server is running"})
})

app.get("/users", async (req, res) => {
    try{
        const result = await pool.query("SELECT * FROM users");
        res.json(result.rows);
    } catch (e) {
        console.error("Query error:", e);
        res.status(500).json({ error: "Failed to fetch users"  });
    }
});

app.get("/users/:id", async (req, res) => {
    const { id } = req.params
    try{
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (result.rows.length === 0)
            res.status(404).json({ error: "User not found" });
        else if (result.rows.length !== 1)
            res.status(500).json({ error: "Duplicate servers with same ID found"})
        res.json(result.rows[0]);
    } catch (e) {
        console.error("Query error:", e);
        res.status(500).json({ error: "Failed to fetch users"  });
    }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server is running on Port", PORT);
});

export default app;