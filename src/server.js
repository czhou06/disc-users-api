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
const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = process.env;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
    const id = req.user.id
    const { first_name, last_name, major, bio, graduation_year, date_of_birth, email } = req.body;

    if (!id || !first_name || !last_name) {
        return res.status(400).json({ error: "Missing required fields (id or name)" });
    }

    try {
        const { data: userData, error: userError } = await supabaseAdmin
            .from("users")
            .insert([{ id, first_name, last_name }])
            .select()
            .single();

        if (userError) throw userError;

        const { data: profileData, error: profileError } = await supabaseAdmin
            .from("user_profiles")
            .insert([{
                id: id, 
                major,
                bio,
                graduation_year,
                date_of_birth,
                email
            }])
            .select()
            .single();

        if (profileError) throw profileError;

        return res.status(201).json({
            ...userData,
            user_profiles: profileData
        });

    } catch (e) {
        console.error("ORM Query error:", e);
        res.status(500).json({ error: "Failed to post new user" });
    }
});

app.delete("/users/me", authenticateUser, async (req, res) => {
    try {
        const ID = req.user.id;

        const { error } = await supabaseAdmin
            .from("users")
            .delete()
            .eq("id", ID)

        if (error) {
            console.log("Supabase Query error:", error)
            return res.status(500).json({ error: "Could not delete user information." });
        }

        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(ID);

        if (authError) {
            console.error("Auth Delete Error:", authError);
            return res.status(500).json({ error: "User info deleted but could not remove account." });
        }

        res.status(200).json({ message: "Account successfully deleted" });
    } catch (e) {
        console.error("Deletion error:", e);
        res.status(500).json({ error: "Failed to delete account" });
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