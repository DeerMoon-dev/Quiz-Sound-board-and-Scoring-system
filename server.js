require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Connection
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI is not defined in the .env file.");
  process.exit(1);
}

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => {
    console.error("MongoDB connection error details:", err);
    process.exit(1);
  });

// Score Schema
const scoreSchema = new mongoose.Schema({
  scores: { type: [Number], default: [0, 0] },
});

const Score = mongoose.model("Score", scoreSchema);

// Helper to get or create the single scores document
async function getScoresDoc() {
  let doc = await Score.findOne();
  if (!doc) {
    console.log("No score document found, creating one...");
    doc = new Score({ scores: [0, 0] });
    await doc.save();
  }
  return doc;
}

// API Routes
app.get("/api/scores", async (req, res) => {
  try {
    const doc = await getScoresDoc();
    res.json({ scores: doc.scores });
  } catch (err) {
    console.error("GET /api/scores error:", err);
    res.status(500).json({ error: "Could not fetch scores" });
  }
});

app.post("/api/scores", async (req, res) => {
  const { scores } = req.body;
  if (!Array.isArray(scores)) {
    return res.status(400).json({ error: "Invalid scores format" });
  }

  try {
    let doc = await getScoresDoc();
    doc.scores = scores;
    await doc.save();
    console.log("Scores saved:", doc.scores);
    res.json({ success: true, scores: doc.scores });
  } catch (err) {
    console.error("POST /api/scores error:", err);
    res.status(500).json({ error: "Could not save scores" });
  }
});

// Serve the frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
