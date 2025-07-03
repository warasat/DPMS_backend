const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  age: Number,
  gender: String,
  medicalHistory: [String],
});

module.exports = mongoose.model("Patient", patientSchema);
