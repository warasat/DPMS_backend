import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "../../config/db.js";
import connectCloudinary from "../../config/cloudinary.js"
import adminRouter from "../../routes/adminRoute.js";
import doctorRouter from "../../routes/doctorRoute.js";
import userRouter from "../../routes/userRoute.js";
import path from "path";
import { fileURLToPath } from "url";
import otpRouter from "../../routes/otpRoute.js";
import serverless from "serverless-http";

// ESM setup
const __filename = fileURLToPath(import.meta.url);
const _dirname = path.dirname(_filename);

dotenv.config();
await connectDB();
connectCloudinary();

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
app.use("/reports", express.static(path.join(__dirname, "../reports")));

app.get("/api", (req, res) => {
  res.send("Netlify Express API is working!");
});

// Export as lambda handler
export const handler = serverless(app);