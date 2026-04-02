import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authApiRoutes.js";
import contentRoutes from "./routes/publicRoutes.js";
import memberRoutes from "./routes/memberRoutes.js";
import { connectDB } from "./config/db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api", contentRoutes);
app.use("/api/member", memberRoutes);

const startServer = async () => {
  try {
    const isMongoConnected = await connectDB();
    app.listen(PORT, () => {
      if (!isMongoConnected) {
        console.log("Server is running with in-memory data storage.");
      }
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

startServer();
