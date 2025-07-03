import express from "express";
import {
  doctorList,
  loginDoctor,
  appointmentsDoctors,
  appointmentCancel,
  appointmentComplete,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  getIllnessDetails,
  savePrescriptionDetails,
  forgotPassword,
      verifyForgotOtp,
      resetPassword,
} from "../controllers/doctorController.js";
import authDoctor from "../middlewares/authDoctor.js";
const doctorRouter = express.Router();
doctorRouter.get("/list", doctorList);
doctorRouter.post("/login", loginDoctor);
doctorRouter.get("/appointments", authDoctor, appointmentsDoctors);
doctorRouter.post("/complete-appointment" , authDoctor, appointmentComplete)
doctorRouter.post("/cancel-appointment" , authDoctor, appointmentCancel)
doctorRouter.get("/dashboard", authDoctor, doctorDashboard);
doctorRouter.get("/profile", authDoctor, doctorProfile)
doctorRouter.post('/update-profile', authDoctor, updateDoctorProfile)
doctorRouter.get("/appointments/:appointmentId/illness-details", authDoctor, getIllnessDetails);
doctorRouter.post("/save-prescription-details", authDoctor, savePrescriptionDetails);
doctorRouter.post("/forgotPassword", forgotPassword);
doctorRouter.post("/reset-password", resetPassword);

// POST /api/forgot-password/verify - Verify OTP
doctorRouter.post("/forgotPassword/verify", verifyForgotOtp);


export default doctorRouter;
