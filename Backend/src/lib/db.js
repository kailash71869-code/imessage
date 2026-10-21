import mongoose from "mongoose";

export async function connectDB() {
    try {
    const db_url = process.env.MONGODB_URL;

    if(!db_url) {
        throw new Error("MONGODB_URL is not defined in environment variables");
    }
    const connection = await mongoose.connect(db_url);
    console.log("MongoDB connected:", connection.connection.host);
} catch(error) {
    console.error("Error connecting to MongoDB:", error.message);
}
}