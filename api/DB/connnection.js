import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const DB_URI = process.env.MONGO_URI; 
<<<<<<< HEAD
=======
    console.log("Mongo URI::::::",DB_URI);
>>>>>>> a4bba92 (Initial commit on Farhan_dev)
    
    if (!DB_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

<<<<<<< HEAD
    await mongoose.connect(DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
=======
    await mongoose.connect(DB_URI);
>>>>>>> a4bba92 (Initial commit on Farhan_dev)

    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;
