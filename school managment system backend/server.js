require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./src/app");

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/school_management";

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

// Local dev / traditional hosting: start an HTTP listener.
// On Vercel (serverless), this module is required by the platform and we export
// a handler instead — `require.main === module` is false there, so listen() is skipped.
if (require.main === module) {
  connectToDatabase()
    .then(() => {
      console.log("MongoDB connected");
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch((err) => {
      console.error("MongoDB connection failed:", err.message);
      process.exit(1);
    });
}

// Vercel serverless handler: ensure DB is connected, then delegate to Express.
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
