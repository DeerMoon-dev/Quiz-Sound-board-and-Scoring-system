require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());
app.use(express.static(__dirname));

// MongoDB Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Score Schema
const scoreSchema = new mongoose.Schema({
  scores: { type: [Number], default: [0, 0] },
});

const Score = mongoose.model("Score", scoreSchema);

// Helper to get or create the single scores document
async function getScoresDoc() {
  let doc = await Score.findOne();
  if (!doc) {
    doc = new Score({ scores: [0, 0] });
    await doc.save();
  }
  return doc;
}

// API to get scores
app.get("/api/scores", async (req, res) => {
  try {
    const doc = await getScoresDoc();
    res.json({ scores: doc.scores });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch scores" });
  }
});

// API to update scores
app.post("/api/scores", async (req, res) => {
  const { scores } = req.body;
  if (!Array.isArray(scores)) {
    return res.status(400).json({ error: "Invalid scores format" });
  }

  try {
    let doc = await getScoresDoc();
    doc.scores = scores;
    await doc.save();
    res.json({ success: true, scores: doc.scores });
  } catch (err) {
    res.status(500).json({ error: "Could not save scores" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
