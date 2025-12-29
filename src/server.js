import express from "express";
import cors from "cors";
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express()

app.use(cors());
app.use(express.json());

// hw 5 stuff
const { DATABASE_URL } = process.env;

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
});

// hw 6 stuff
const { SUPABASE_URL, SUPABASE_API_KEY } = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: "No authorization header provided" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Malformed token" });
  }

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ error: "Internal Server Error during auth" });
  }
};

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

app.get("/users/profiles", authenticateUser, async (req, res) => {
        try {
            const { data, error } = await supabase
            .from("users")
            .select(`
                id,
                first_name,
                last_name,
                user_profiles(
                    date_of_birth,
                    bio,
                    graduation_year,
                    major
                )
            `);

            if (error) {
                console.log("Supabase Query error:", error)
                throw error;
            }

            res.status(200).json(data);
        } catch(e) {
            console.error("ORM Query error:", e);
            res.status(500).json({ error: "Failed to fetch user profiles"  });
        }
    })

app.get("/users/:id", async (req, res) => {
    const { id } = req.params
    try{
        const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
        if (result.rows.length === 0)
            res.status(404).json({ error: "User not found" });
        else if (result.rows.length !== 1)
            res.status(500).json({ error: "Duplicate users with same ID found"})
        res.json(result.rows[0]);
    } catch (e) {
        console.error("Query error:", e);
        res.status(500).json({ error: "Failed to fetch users"  });
    }
})

// app.post("/users/:id", async (req, res) => {
//     const { id } = req.params
//     try{
//         const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
//         if (result.rows.length === 0)
//             res.status(404).json({ error: "User not found" });
//         else if (result.rows.length !== 1)
//             res.status(500).json({ error: "Duplicate servers with same ID found"})
//         res.json(result.rows[0]);
//     } catch (e) {
//         console.error("Query error:", e);
//         res.status(500).json({ error: "Failed to fetch users"  });
//     }
// })
    

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server is running on Port", PORT);
});

export default app;