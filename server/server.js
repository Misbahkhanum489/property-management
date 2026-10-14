
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);
import propertyRoutes from "./routes/propertyRoutes.js";

import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import connectDB from "./config/db.js";
import Property from "./models/Property.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use("/api/properties", propertyRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Property Management API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({
    server: "running",
    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

async function startServer() {
  try {
    await connectDB();
    await Property.createIndexes();

    console.log("Property schema and indexes ready");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

startServer();
