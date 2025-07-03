import mongoose from "mongoose";

const appointmentSchema  = new mongoose.Schema({
  userId : {type: String, required: 'true'},
  docId : {type: String, required: 'true'},
  slotDate : {type: String, required: 'true'},
  slotTime : {type: String, required: 'true'},
  userData : {type: Object, required:'true'},
  docData : {type: Object, required:'true'},
  amount : {type: Number, required: 'true'},
  date : {type: Number, required: 'true'},
  cancelled : {type: Boolean, default:'false'},
  payment : {type: Boolean, default:'false'},
  isCompleted : {type: Boolean, default:'false'},
  illnessDetails: {
    symptoms: { type: String, required: false },
    history: { type: String, required: false },
    medications: { type: String, required: false },
    description: { type: String, required: false },
  },
  // prescriptionDetails: {
  //   patientDetails: {
  //     name: { type: String, required: true },
  //     age: { type: Number, required: true }
  //   },
  //   doctorDetails: {
  //     name: { type: String, required: true },
  //     age: { type: Number, required: true }
  //   },
  //   medicineDetails: {
  //     medicine1: { type: String, required: true },
  //     medicine2: { type: String, required: true },
  //     medicine3: { type: String, required: true }
  //   },
  //   description: { type: String, required: true }
  // }
})

const appointmentModel = mongoose.models.appointment || mongoose.model('appointment',appointmentSchema)

export default appointmentModel