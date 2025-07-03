import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js"; // Database connection file
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes/otpRoute.js";
// ESM setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
connectDB(); // Connect to MongoDB
connectCloudinary();
const app = express();

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"], // Array of allowed origins
    credentials: true, // Allows cookies to be sent with the request
  })
);

app.use(express.json({ strict: false }));
app.use(cookieParser());
// API ENDPOINTS
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});
app.use("/reports", express.static(path.join(__dirname, "reports")));
//
app.use("/api/otp", router);
// Listen on PORT
const PORT = 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
