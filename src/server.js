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
    res.json({ message: "Server is running" })
})

app.post("/users", authenticateUser, async (req, res) => {
    const { id, first_name, last_name, major, bio, graduation_year, date_of_birth, email } = req.body;

    if (!id || !first_name || !last_name) {
        return res.status(400).json({ error: "Missing required fields (id or name)" });
    }

    try {
        const { data, error } = await supabase
        .from("users")
        .insert([{
            id: id,
            first_name: first_name,
            last_name: last_name,
            user_profiles: {
                major: major,
                bio: bio,
                date_of_birth: date_of_birth,
                graduation_year: graduation_year,
                email: email,
            }
        }])
        .select();

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw error;
        }

        res.status(201).json(data[0]);

    } catch (e) {
        console.error("ORM Query error:", e);
        res.status(500).json({ error: "Failed to post new user" });
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
                    major,
                    email
                )
            `);

        if (error) {
            console.log("Supabase Query error:", error)
            throw error;
        }

        res.status(200).json(data);
    } catch (e) {
        console.error("ORM Query error:", e);
        res.status(500).json({ error: "Failed to fetch user profiles" });
    }
})

app.get("/users/:id", async (req, res) => {
    const { id } = req.params
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
                    major,
                    email
                )
            `)
            .eq("id", id);

        if (error) {
            console.log("Supabase Query error:", error)
            throw error;
        }

        if (!data || data.length === 0)
            return res.status(404).json({ error: "User not found" });
        return res.status(200).json(data[0]);

    } catch (e) {
        console.error("Query error:", e);
        return res.status(500).json({ error: "Failed to fetch users" });
    }
})


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server is running on Port", PORT);
});

export default app;