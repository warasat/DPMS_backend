import mongoose from "mongoose";

const connectDB = async () => {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB Atlas successfully");
    })
    .catch((error) => {
      console.error("Error connecting to MongoDB:", error);
    });
};

export default connectDB;
