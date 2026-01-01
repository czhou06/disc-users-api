import "dotenv/config";
import express from "express";
import cors from "cors";
import router from "./routers/router.js"

const app = express()
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: ['https://disc-web-app.web.app', 'https://disc-web-app.firebaseapp.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

app.use(router)

app.listen(PORT, () => {
    console.log("Server is running on Port", PORT);
});

export default app;