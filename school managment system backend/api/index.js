// Vercel serverless entry point.
// Reuses the MongoDB connection across warm invocations.
require("dotenv").config();
const mongoose = require("mongoose");
const app = require("../src/app");

const MONGO_URI = process.env.MONGO_URI;

let connectionPromise = null;

function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }
  return connectionPromise;
}

module.exports = async (req, res) => {
  try {
    await connectToDatabase();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    res.status(500).json({ error: "Database connection failed." });
    return;
  }
  return app(req, res);
};
