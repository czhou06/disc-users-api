import { supabase, supabaseAdmin } from "../config/supabase.js";

export async function getHome(req, res) {
    res.json({ message: "Server is running" });
}

export async function createUser(req, res) {
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
}

export async function deleteUser(req,res) {
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
}

export async function getAllUsers(req, res) {
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
}

export async function getUserByID(req, res) {
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
}
