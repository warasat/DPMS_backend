import express from "express";
import serverless from "serverless-http";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "../../config/db.js";
import connectCloudinary from "../../config/cloudinary.js";
import adminRouter from "../../routes/adminRoute.js";
import doctorRouter from "../../routes/doctorRoute.js";
import userRouter from "../../routes/userRoute.js";
import otpRouter from "../../routes/otpRoute.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env Setup
dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json({ strict: false }));
app.use(cookieParser());

// Routes
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/otp", otpRouter);

// Static files
app.use("/reports", express.static(path.join(__dirname, "../../reports")));

// Default route
app.get("/api", (req, res) => {
  res.send("✅ API is working on Netlify!");
});

// Initialize DB + Cloudinary
const initializeApp = async () => {
  await connectDB();
  connectCloudinary();
};

initializeApp();

export const handler = serverless(app);
