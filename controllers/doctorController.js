import doctorModel from "../models/Doctor.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import appointmentModel from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import nodemailer from "nodemailer";
import crypto from "crypto";
dotenv.config();

const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;
    const docData = await doctorModel.findById(docId);
    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });
    res.json({ success: true, message: "Availablity Changed" });
  } catch (error) {
    console.log(error);
    // res.json({ success: "false", message: error.message });
  }
};
const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};
// Api for Doctor Login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });
    if (!doctor) {
      return res.json({ success: false, message: "Invalid Credentials " });
    }
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: "Invalid Credentials " });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};
//Api to get Doctor Appointments for Doctor Panel
const appointmentsDoctors = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });
    res.json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};
//Api to mark appointment completed for doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: "true",
      });
      return res.json({ success: true, message: "Appointment Completed" });
    } else {
      return res.json({ success: false, message: "Appointment Mark Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};
//Api to cancel appointment  for doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: "true",
      });
      return res.json({ success: true, message: "Appointment Cancelled" });
    } else {
      return res.json({ success: false, message: "Cancellation Failed" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};
//Api to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });
    let earnings = 0;
    appointments.map((item) => {
      if (item.isCompleted || item.payment) {
        earnings += item.amount;
      }
    });
    let patients = [];
    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });
     // Count completed appointments
    const totalCompletedAppointments = appointments.filter(item => item.isCompleted).length;

    // Count cancelled appointments
    const totalCancelledAppointments = appointments.filter(item => item.cancelled).length;
    const dashData = {
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      totalCompletedAppointments,  // Add completed appointments count
      totalCancelledAppointments,  // Add cancelled appointments count
      latestAppointments: appointments.reverse().slice(0, 5),
    };
    res.json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};
//Api to get doctor profile for Doctor panel
const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await doctorModel.findById(docId).select("-password");
    res.json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};
//Api to update doctor Profile for Doctor panel
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, fees, address, available } = req.body;
    await doctorModel.findByIdAndUpdate(docId, { fees, address, available });
    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};
// API to get illness details for a specific appointment
const getIllnessDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params; // Fetch the appointmentId from the URL params

    // Find the appointment by ID
    const appointment = await appointmentModel.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Return the illness details of the found appointment
    return res.status(200).json({
      success: true,
      appointment: {
        illnessDetails: appointment.illnessDetails,  // Return only the illness details
      }
    });
  } catch (error) {
    console.error("Error fetching illness details:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
// Api to post prescription details for specfic appointment
const savePrescriptionDetails = async (req, res) => {
  try {
    const { appointmentId, patientDetails, doctorDetails, prescriptionDetails } = req.body;

    // Validate required fields
    if (
      !appointmentId ||
      !patientDetails ||
      !doctorDetails ||
      !prescriptionDetails ||
      !patientDetails.name ||
      !patientDetails.age ||
      !doctorDetails.name ||
      !doctorDetails.age ||
      !prescriptionDetails.medicine1 ||
      !prescriptionDetails.medicine2 ||
      !prescriptionDetails.medicine3 ||
      !prescriptionDetails.description
    ) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Find the appointment by ID to ensure it exists
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: "Appointment not found" });
    }

    // Create a new prescription object
    const newPrescription = new Prescription({
      appointmentId,
      patientName: patientDetails.name,
      patientAge: patientDetails.age,
      doctorName: doctorDetails.name,
      doctorAge: doctorDetails.age,
      prescriptionDetails: {
        medicine1: prescriptionDetails.medicine1,
        medicine2: prescriptionDetails.medicine2,
        medicine3: prescriptionDetails.medicine3,
        description: prescriptionDetails.description,
      },
    });

    // Save the prescription to the database
    await newPrescription.save();

    // Return success response
    res.status(200).json({ success: true, message: "Prescription details saved successfully" });
  } catch (error) {
    console.error("Error saving prescription details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
const forgotOtpStore = new Map();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "muzammilarif367@gmail.com",
    pass: "gdea linf scvk zhll",
  },
});

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const doctor = await doctorModel.findOne({ email });
  if (!doctor) {
    return res.status(404).json({ message: "Email not registered" });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  forgotOtpStore.set(email, otp);
  setTimeout(() => forgotOtpStore.delete(email), 5 * 60 * 1000);

  const mailOptions = {
    from: "muzammilarif367@gmail.com",
    to: email,
    subject: "Reset Your Password - DPMS",
    html: `<p>Your OTP is <strong>${otp}</strong></p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send email", error });
  }
};

const verifyForgotOtp = async (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = forgotOtpStore.get(email);
  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  forgotOtpStore.delete(email);
  res.status(200).json({ message: "OTP verified" });
};

const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    const doctor = await doctorModel.findOne({ email });
    if (!doctor) return res.status(404).json({ message: "doctor not found" });

    const hashedPassword = await bcrypt.hash(password, 10);
    doctor.password = hashedPassword;
    await doctor.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password" });
  }
};



export {
  changeAvailability,
  doctorList,
  loginDoctor,
  appointmentsDoctors,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  getIllnessDetails,
  savePrescriptionDetails,
  forgotPassword,
    verifyForgotOtp,
    resetPassword,
};
