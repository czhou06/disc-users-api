import { Router } from "express";
import { authenticateUser } from "../middleware/auth.js"
import { getHome, createUser, deleteUser, getAllUsers, getUserByID } from "../controllers/controllers.js"

const router = Router();

router.get("/", getHome);

router.post("/users", authenticateUser, createUser);

router.delete("/users/me", authenticateUser, deleteUser);

router.get("/users/profiles", authenticateUser, getAllUsers);

router.get("/users/:id", authenticateUser, getUserByID);

export default router;