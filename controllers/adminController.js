// // API FOR ADDING DOCTORS
// import validator from "validator"
// import bcrypt from "bcryptjs"
// import {v2 as cloudinary} from "cloudinary"
// import doctorModel from "../models/Doctor"

// const addDoctor = async (req, res) => {
//   try {
//     const {
//       name,
//       email,
//       password,
//       image,
//       speciality,
//       degree,
//       experience,
//       about,
//       fees,
//       address,

//     } = req.body;
//     const imageFile = req.file;
//     // console.log(
//     //   {
//     //     name,
//     //     email,
//     //     password,
//     //     image,
//     //     speciality,
//     //     degree,
//     //     experience,
//     //     about,
//     //     available,
//     //     fees,
//     //     address,
//     //     date,
//     //     slots_booked,
//     //   },
//     //   imageFile
//     // );

//     // checking for all data to add doctors
//     if (!name || !email || !password || !image || !speciality || !degree || !experience || !about || !fees || !address){
//       return res.status(400).json({ success: "false",message: "Please fill all the fields" });
//     }
//    // validating email fromat
//    if(!validator.isEmail(email)){
//     res.json({success: "false", message: "please enter a valid email "})
//    }
//    // strong password
//    if(password.length < 8 ){
//     return res.status(400).json({ success: "false",message: "Please enter a strong password"})

//    //hashing doctor password
//    const salt = await bcrypt.genSalt(10)
//    const hashedPassword = await bcrypt.hash(password, salt);

//    // upload image to cloudinary
//    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {resource_type: "image"})
//    const imageUrl  = imageUpload.secure_url

//    const doctorData = {
//     name,
//     email,
//     hashedPassword,
//     speciality,
//     degree,
//     experience,
//     about,
//     fees,
//     address:JSON.parse(address),
//     date:Date.now(),

//    }

//    const newDoctor = new doctorModel (doctorData)
//    await newDoctor.save()
//    res.json({success: "true", message: "Doctor added successfully"})

//   }} catch (error) {
//     console.error(error);
//     res.json({success:"false" , message: error.message})
//   }
// };
// export { addDoctor };

import validator from "validator";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/Doctor.js";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/Appointment.js";
import userModel from "../models/User.js";
import Contact from "../models/ContactUs.js"

const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    // console.log("Request body:", req.body);

    // Checking for all required fields
    if (
      !name ||
      !email ||
      !password ||
      !imageFile ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address
    ) {
      return res
        .status(400)
        .json({ success: "false", message: "Please fill all the fields" });
    }

    // Validating email format
    if (!validator.isEmail(email)) {
      return res.json({
        success: "false",
        message: "Please enter a valid email",
      });
    }

    // Checking for a strong password
    if (password.length < 8) {
      return res
        .status(400)
        .json({ success: "false", message: "Please enter a strong password" });
    }

    // Hashing the doctor password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Upload image to Cloudinary
    if (!imageFile) {
      return res
        .status(400)
        .json({ success: "false", message: "Please upload an image" });
    }
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
      resource_type: "image",
    });
    const imageUrl = imageUpload.secure_url;

    // Handle address - ensure it's either an object or a valid stringified JSON
    let parsedAddress = address;

    // If the address is passed as a stringified JSON, we parse it
    if (typeof address === "string") {
      try {
        parsedAddress = JSON.parse(address); // Parse the stringified address
      } catch (err) {
        return res
          .status(400)
          .json({ success: "false", message: "Invalid address format" });
      }
    }

    // Creating doctor data object
    const doctorData = {
      name,
      email,
      image: imageUrl,
      password: hashedPassword,
      speciality,
      degree,
      experience,
      about,
      fees,
      address: parsedAddress, // Use parsed address
      date: Date.now(),
    };

    // Creating new doctor record
    const newDoctor = new doctorModel(doctorData);
    await newDoctor.save();
    res.json({ success: "true", message: "Doctor added successfully" });
  } catch (error) {
    console.error(error);
    res.json({ success: "false", message: error.message });
  }
};

//Api for Admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      res.json({ success: "true", token });
    } else {
      res.json({ success: "false", message: "Invalid credentials" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};
//API to get all the doctors list from the admin panel
const allDcotors = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select("-password");
    res.json({ success: true, doctors });
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
};

//Api to get all appointments list
const allAppointments = async (req, res) => {
  try {
    const appointments = await (await appointmentModel.find({})).reverse()
    res.json({ success: true, appointments });
    
  } catch (error) {
    console.log(error);
    res.json({ success: "false", message: error.message });
  }
}
//Api to cancel appointment from admin side
const appointmentCancel = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    
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

//Api to get  dasboard data for admin pannel
// const adminDashboard = async (req,res) => {
//   try {
//     const doctors = await doctorModel.find({})
//     const users = await userModel.find({})
//     const appointments = await appointmentModel.find({})

//     const dashData = {
//       doctors: doctors.length,
//       appointments: appointments.length,
//       patient: users.length,
//       latestAppointments: appointments.reverse().slice(0,5)
//     }
//     res.json({success:'true' , dashData})
    
//   } catch (error) {
//     console.log(error);
//     res.json({ success: false, message: error.message });
//   }
// Api to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
  try {
    const doctors = await doctorModel.find({});
    const users = await userModel.find({});
    
    // Fetch all appointments
    const appointments = await appointmentModel.find({});
    
    // Count completed appointments
    const totalCompletedAppointments = await appointmentModel.countDocuments({ isCompleted: true });
    
    // Count cancelled appointments
    const totalCancelledAppointments = await appointmentModel.countDocuments({ cancelled: true });

    const dashData = {
      doctors: doctors.length,
      appointments: appointments.length,
      patient: users.length,
      totalCompletedAppointments,
      totalCancelledAppointments,
      latestAppointments: appointments.reverse().slice(0, 5)
    };
    
    res.json({ success: 'true', dashData });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
// Controller to fetch all contact forms
const getAllContactForms = async (req, res) => {
  try {
    const contactForms = await Contact.find();  // Query to fetch contact forms from the database
    
    if (!contactForms || contactForms.length === 0) {
      return res.status(404).json({ success: false, message: "No contact forms found." });
    }

    res.json({ success: true, contactForms });  // Send the contact forms in the response
  } catch (err) {
    console.error("Error fetching contact forms:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

//block and unblock of doctor 
const blockDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params; // Get the doctorId from the URL params
    const doctor = await doctorModel.findById(doctorId);

    if (!doctor) {
      return res.status(404).json({ success: "false", message: "Doctor not found" });
    }

    // Toggle the blocked status
    doctor.blocked = !doctor.blocked;
    await doctor.save();

    res.json({
      success: "true",
      message: doctor.blocked ? "Doctor blocked successfully" : "Doctor unblocked successfully",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: "false", message: error.message });
  }
};



export { addDoctor, loginAdmin, allDcotors, allAppointments, appointmentCancel, adminDashboard, getAllContactForms, blockDoctor };
