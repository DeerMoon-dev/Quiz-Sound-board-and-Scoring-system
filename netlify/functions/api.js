require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const serverless = require('serverless-http');

const app = express();
const MONGODB_URI = process.env.MONGODB_URI;

app.use(express.json());

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb && mongoose.connection.readyState === 1) {
        return cachedDb;
    }
    cachedDb = await mongoose.connect(MONGODB_URI);
    return cachedDb;
}

const scoreSchema = new mongoose.Schema({
    scores: { type: [Number], default: [0, 0] }
});

const Score = mongoose.models.Score || mongoose.model('Score', scoreSchema);

async function getScoresDoc() {
    let doc = await Score.findOne();
    if (!doc) {
        doc = new Score({ scores: [0, 0] });
        await doc.save();
    }
    return doc;
}

// Routes match what frontend expects
app.get('/api/scores', async (req, res) => {
    try {
        await connectToDatabase();
        const doc = await getScoresDoc();
        res.json({ scores: doc.scores });
    } catch (err) {
        res.status(500).json({ error: 'Could not fetch scores' });
    }
});

app.post('/api/scores', async (req, res) => {
    try {
        await connectToDatabase();
        const { scores } = req.body;
        let doc = await getScoresDoc();
        doc.scores = scores;
        await doc.save();
        res.json({ success: true, scores: doc.scores });
    } catch (err) {
        res.status(500).json({ error: 'Could not save scores' });
    }
});

module.exports.handler = serverless(app);
