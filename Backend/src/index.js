import express from 'express';
import "dotenv/config";
import { clerkMiddleware } from "@clerk/clerk-sdk-node";
import cors from 'cors';
import User from "./models/user.model.js";
import { connectDB } from "./lib/db.js";

const app = express(); 
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(express.json());
app.use(cors({ origin : FRONTEND_URL ,credentials:true}));
app.use(clerkMiddleware());

app.get('/health', (req,res) => {
    
    res.status(200).json({ok: true});
});

app.listen(PORT, async () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
});