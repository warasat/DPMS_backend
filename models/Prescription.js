import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patientName: { type: String, required: false },
  patientAge: { type: Number, required: false },
  doctorName: { type: String, required: false },
  doctorAge: { type: Number, required: false },
  prescriptionDetails: {
    medicine1: { type: String, required: false },
    medicine2: { type: String, required: false },
    medicine3: { type: String, required: false },
    description: { type: String, required: false },  // Ensure this is required
  },
});

const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;