import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Export the model as the default export
const Contact = mongoose.model("Contact", contactSchema);

export default Contact;  // Use export default for ES Module compatibility
