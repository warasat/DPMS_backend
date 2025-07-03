import express from "express";
import {
  addDoctor,
  allDcotors,
  loginAdmin,
  allAppointments,
  appointmentCancel,
  adminDashboard,
  getAllContactForms,
  blockDoctor,
} from "../controllers/adminController.js";
import upload from "../middlewares/multer.js";
import authAdmin from "../middlewares/authAdmin.js";
import { changeAvailability } from "../controllers/doctorController.js";
const adminRouter = express.Router();

adminRouter.post("/add-doctor", authAdmin, upload.single("image"), addDoctor);

adminRouter.post("/login", loginAdmin);
adminRouter.post("/all-doctors", authAdmin, allDcotors);
adminRouter.post("/change-availability", authAdmin, changeAvailability);
adminRouter.get("/appointments" , authAdmin , allAppointments);
adminRouter.post("/cancel-appointment" , authAdmin , appointmentCancel);
adminRouter.get("/dashboard" ,authAdmin , adminDashboard);
adminRouter.get("/contact-forms",authAdmin, getAllContactForms)
adminRouter.put("/block-doctor/:doctorId", authAdmin, blockDoctor);
export default adminRouter;
