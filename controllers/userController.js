import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import userModel from "../models/User.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/Doctor.js";
import appointmentModel from "../models/Appointment.js";
import Prescription from "../models/Prescription.js";
import Contact from "../models/ContactUs.js";
import dotenv from "dotenv";
dotenv.config();
import Stripe from "stripe";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { fileURLToPath } from "url";
// Required to handle __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

//API to register user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.json({ success: "false", message: "Missing Details" });
    }
    //Validating email format
    if (!validator.isEmail(email)) {
      return res.json({ success: "false", message: "Invalid Email" });
    }
    //Validating strog password
    if (password.length < 8) {
      return res.json({
        success: "false",
        message: "Password should be at least 8 characters",
      });
    }
    //Hashing password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({ success: "true", token });
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};

//APi for user Login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    return res.status(200).json({ success: true, token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

//Api to get user profile data
const getProfile = async (req, res) => {
  try {
    const { userId } = req.body;
    const userData = await userModel.findById(userId).select("-password");
    res.json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};
//Api to update user profile data
const updateProfile = async (req, res) => {
  try {
    const { userId, name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;
    if (!name || !phone || !dob || !gender) {
      return res.json({ success: false, message: "Data Missing" });
    }
    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });
    if (imageFile) {
      //upload Image to Cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageURL = imageUpload.secure_url;
      await userModel.findByIdAndUpdate(userId, { image: imageURL });
    }
    res.json({ success: true, message: "Profile Updated" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Api to book appointment
const bookAppointment = async (req, res) => {
  try {
    const { userId, docId, slotDate, slotTime } = req.body;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(docId)) {
      return res.json({
        success: false,
        message: "Invalid userId or docId format",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const doctorObjectId = new mongoose.Types.ObjectId(docId);

    // Fetch doctor data
    const docData = await doctorModel
      .findById(doctorObjectId)
      .select("-password");
    if (!docData)
      return res.json({ success: false, message: "Doctor not found" });

    if (!docData.available)
      return res.json({ success: false, message: "Doctor is not available" });

    // Check if slot is already booked
    let slots_booked = docData.slots_booked || {};
    if (slots_booked[slotDate]?.includes(slotTime)) {
      return res.json({ success: false, message: "Slot is not available" });
    }

    // Add the slot if it's available
    slots_booked[slotDate] = slots_booked[slotDate] || [];
    slots_booked[slotDate].push(slotTime);

    // Fetch user data
    const userData = await userModel.findById(userObjectId).select("-password");
    if (!userData)
      return res.json({ success: false, message: "User not found" });

    // Prepare and save appointment
    const newAppointment = new appointmentModel({
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      date: Date.now(),
      illnessDetails: {},
    });

    await newAppointment.save();
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    


    res.json({ success: true, message: "Appointment Booked" });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.json({ success: false, message: error.message });
  }  
};


// Api to get user appointments for frontend my-appointments page
const listAppointment = async (req, res) => {
  try {
    const { userId } = req.query; // Get userId from query

    if (!mongoose.isValidObjectId(userId)) {
      return res.json({ success: false, message: "Invalid userId format" });
    }

    const appointments = await appointmentModel
      .find({ userId })
      .sort({ date: -1 });

    res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.json({ success: false, message: error.message });
  }
};
//Api to cancel  appointment
const cancelAppointment = async (req, res) => {
  try {
    const { userId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    // Verify Appointment user
    if (appointmentData.userId !== userId) {
      return res.json({ success: false, message: "Unauthorized action" });
    }
    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });
    // Releasing doctor slot
    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);
    let slots_booked = doctorData.slots_booked;
    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );
    await doctorModel.findByIdAndUpdate(docId, { slots_booked });
    res.json({ success: true, message: "Appointment Cancelled" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Api to make payment of appointment
const createCheckoutSession = async (req, res) => {
  try {
    const { userId, appointment } = req.body;
    // console.log(appointment);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: appointment.docData.name,
            },
            unit_amount: appointment.amount * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        docName: appointment.docData.name,
        appointmentId: appointment._id,
      },
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
    });
    res.json({ success: true, url: session.url });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) {
      // console.log("❌ No session_id received");
      return res.status(400).json({ error: "Session ID is required" });
    }

    // console.log("🔄 Verifying Payment for Session ID:", session_id);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    const appointmentId = session.metadata?.appointmentId || null;

    // console.log("session: ", session);
    // console.log("appointmentId: ", appointmentId);
    // await appointmentModel.findByIdAndUpdate(
    //   appointmentId,
    //   {
    //     payment: true,
    //   },
    //   { new: true }
    // );

    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      // console.log("❌ Appointment not found");
      return res.status(404).json({ error: "Appointment not found" });
    }

    // Update payment status
    appointment.payment = true;
    await appointment.save();

    // console.log("databses updated successgully");
    res.json({ message: "Payment verified successfully" });
  } catch (err) {
    console.log(err);
  }
};
// API to save illness details
const saveIllnessDetails = async (req, res) => {
  try {
    const { appointmentId, symptoms, history, medications, description } =
      req.body;

    // Validate required fields
    if (
      !appointmentId ||
      !symptoms ||
      !history ||
      !medications ||
      !description
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Find the appointment by ID
    const appointment = await appointmentModel.findById(appointmentId);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Check if the appointment has been paid
    if (!appointment.payment) {
      return res
        .status(400)
        .json({ success: false, message: "Payment not completed yet" });
    }

    // Update the illness details for the appointment
    appointment.illnessDetails = {
      symptoms,
      history,
      medications,
      description,
    };
    await appointment.save();

    res
      .status(200)
      .json({ success: true, message: "Illness details saved successfully" });
  } catch (error) {
    console.error("Error saving illness details:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
// Get Prescription on the appointment page
// userController.js

const getPrescriptionDetails = async (req, res) => {
  try {
    const { appointmentId } = req.params; // Fetch the appointmentId from the URL params

    // Find the prescription based on the appointmentId
    const prescription = await Prescription.findOne({ appointmentId });

    if (!prescription) {
      return res
        .status(404)
        .json({ success: false, message: "Prescription not found" });
    }

    // Return the prescription details
    return res.status(200).json({
      success: true,
      prescription: {
        description: prescription.prescriptionDetails?.description, // Get the description
        medicineDetails: {
          medicine1: prescription.prescriptionDetails?.medicine1,
          medicine2: prescription.prescriptionDetails?.medicine2,
          medicine3: prescription.prescriptionDetails?.medicine3,
        },
        doctorDetails: {
          name: prescription.doctorName,
          age: prescription.doctorAge,
        },
        patientDetails: {
          name: prescription.patientName,
          age: prescription.patientAge,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching prescription details:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const generateReport = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // Fetch the appointment and populate both doctor and patient data
    const appointment = await appointmentModel
      .findById(appointmentId)
      .populate("docData") // Populate doctor details
      .populate("userData"); // Populate patient (user) details

    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Log populated data to verify prescription
    console.log("Doctor Data:", appointment.docData);
    console.log("Patient Data:", appointment.userData);

    const doc = new PDFDocument();
    const fileName = `report-${appointmentId}.pdf`;
    const filePath = path.join(__dirname, `../reports/${fileName}`);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // 📝 Add doctor and patient data to the PDF
    doc.fontSize(18).text("Appointment Report", { align: "center" });
    doc.moveDown();

    // Patient info
    doc
      .fontSize(14)
      .text(`Patient Name: ${appointment.userData?.name || "N/A"}`);
    doc.text(`Doctor Name: ${appointment.docData.name}`);
    doc.text(`Speciality: ${appointment.docData.speciality}`);
    doc.text(`Date: ${appointment.slotDate}`);
    doc.text(`Time: ${appointment.slotTime}`);
    doc.moveDown();

    // Add the prescription information for the doctor
    const prescription =
      appointment.docData.prescription || "This Report is generated as part of our commitment to compassionate, data-driven healthcare.";
    doc.fontSize(14).text(`${prescription}`);
    doc.moveDown();

    doc.text("Thank you for using our service.", { align: "left" });

    doc.end();

    stream.on("finish", () => {
      res.json({
        success: true,
        reportUrl: `${process.env.SERVER_URL}/reports/${fileName}`,
      });
    });
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
// Handle the contact form submission
const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, comment } = req.body;

    // Basic validation
    if (!name || !email || !phone || !comment) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    // Create a new contact entry in the database
    const newContact = new Contact({
      name,
      email,
      phone,
      comment,
    });

    // Save the contact data to the database
    await newContact.save();

    // Return success response
    res.json({
      success: true,
      message: "Your message has been submitted successfully.",
    });
  } catch (err) {
    console.error("Contact form submission error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
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

  const user = await userModel.findOne({ email });
  if (!user) {
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

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reset password" });
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  createCheckoutSession,
  verifyPayment,
  saveIllnessDetails,
  getPrescriptionDetails,
  generateReport,
  submitContactForm,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
};
