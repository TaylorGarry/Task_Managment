import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const DB_URI = process.env.MONGO_URI; 
    
    if (!DB_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
