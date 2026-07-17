import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

import aiRoutes from "./routes/ai.js";
import storiesRoutes from "./routes/stories.js";
import quizRoutes from "./routes/quiz.js";
import quranRoutes from "./routes/quran.js";
import adminRoutes from "./routes/admin.js";
import reviewsRoutes from "./routes/reviews.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

app.get("/", (req, res) => {
  res.send("🚀 NoorKids AI Server Running");
});

// Configure Rate Limiters (Security Feature: Category 7)
// We use a simple in-memory limiter here, but Redis is recommended for multi-instance deployments.
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 AI requests per windowMs
  message: { error: "Too many AI requests from this IP, please try again after 15 minutes." }
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { error: "Too many admin requests from this IP, please try again after 15 minutes." }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15000,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});

app.use("/api/ai", aiLimiter, aiRoutes);
app.use("/api/stories", generalLimiter, storiesRoutes);
app.use("/api/quiz", generalLimiter, quizRoutes);
app.use("/api/quran", generalLimiter, quranRoutes);
app.use("/api/admin", adminLimiter, adminRoutes);
app.use("/api/reviews", generalLimiter, reviewsRoutes);

const PORT = 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

