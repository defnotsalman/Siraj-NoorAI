import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import aiRoutes from "./routes/ai.js";
import storiesRoutes from "./routes/stories.js";
import quizRoutes from "./routes/quiz.js";
import quranRoutes from "./routes/quran.js";
import adminRoutes from "./routes/admin.js";

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

app.use("/api/ai", aiRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/quran", quranRoutes);
app.use("/api/admin", adminRoutes);

const PORT = 5000;

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Server running on http://127.0.0.1:${PORT}`);
});

