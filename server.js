// server.js - Loads logic from server-config.json
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const config = require('./server-config.json');

const app = express();
const PORT = process.env.PORT || config.server.port.replace('${PORT:','').replace('}','');

app.use(cors());
app.use(express.json());

// Simple in-memory store
let stats = { total: 0, wins: 0, history: [] };

// Prediction function using config logic
function getPrediction(data) {
    if (!data || data.length < config.predictionLogic.minDataLength) {
        return { prediction: "WAITING", confidence: 50, numbers: [0, 5] };
    }
    
    const numbers = data.slice(0, config.predictionLogic.analysisWindow).map(x => parseInt(x.number) || 0);
    const sizes = numbers.map(n => n >= 5 ? "BIG" : "SMALL");
    
    // Pattern check
    const isMirror = [0,1,2].every(i => sizes[i] !== sizes[i+1]);
    const isDragon = [0,1,2].every(i => sizes[i] === sizes[i+1]);
    
    let prediction;
    if (isMirror) prediction = sizes[0] === "SMALL" ? "BIG" : "SMALL";
    else if (isDragon) prediction = sizes[0];
    else {
        const wBig = sizes.reduce((a,s,i) => a + (s==="BIG" ? (i<3?2:1):0), 0);
        const wSmall = sizes.reduce((a,s,i) => a + (s==="SMALL" ? (i<3?2:1):0), 0);
        prediction = wBig >= wSmall ? "BIG" : "SMALL";
    }
    
    // Confidence
    const sameCount = sizes.slice(0,4).filter(s => s === sizes[0]).length;
    let conf = sameCount === 4 ? 90 : sameCount === 3 ? 76 : isMirror ? 65 : 50 + Math.abs(sizes.slice(0,6).filter(s=>s==="BIG").length - 3) * 8;
    conf = Math.max(45, Math.min(95, conf));
    
    // Numbers
    const last = numbers[0];
    const nums = last === 0 ? [5,7] : last === 5 ? [0,2] : config.predictionLogic.pivotNumbers.defaultMap[last] || [2,8];
    
    return { prediction, confidence: Math.round(conf*10)/10, numbers: nums };
}

// Fetch API
async function fetchData() {
    try {
        const res = await axios.get(`${config.api.baseUrl}?ts=${Date.now()}`, {
            headers: config.api.headers, timeout: config.api.timeout
        });
        return res.data?.data?.list || res.data?.list || [];
    } catch { return []; }
}

// --- ROUTES ---

// GET /trade - Main prediction endpoint
app.get('/trade', async (req, res) => {
    try {
        const data = await fetchData();
        const latest = data[0];
        if (!latest?.issueNumber) {
            return res.status(503).json({ success: false, error: { code: "API_ERROR", message: "No data available" }});
        }
        
        const result = getPrediction(data);
        res.json({
            success: true,
            data: {
                period: latest.issueNumber,
                ...result,
                timestamp: new Date().toISOString(),
                meta: {
                    pattern: "auto",
                    lastNumber: parseInt(latest.number),
                    trend: result.prediction
                }
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: err.message }});
    }
});

// POST /result - Track accuracy
app.post('/result', (req, res) => {
    const { period, actualNumber } = req.body;
    if (!period || actualNumber === undefined) {
        return res.status(400).json({ success: false, error: { code: "INVALID_INPUT", message: "Missing period or actualNumber" }});
    }
    
    const actualCat = parseInt(actualNumber) >= 5 ? "BIG" : "SMALL";
    // Find last prediction for this period (simplified)
    const lastPred = stats.history.find(h => h.period === period);
    const isWin = lastPred ? (lastPred.prediction === actualCat || lastPred.numbers.includes(parseInt(actualNumber))) : false;
    
    stats.total++;
    if (isWin) stats.wins++;
    
    const entry = { period, actual: actualNumber, result: isWin ? "WIN" : "LOSS", time: new Date().toISOString() };
    stats.history.unshift(entry);
    if (stats.history.length > config.tracking.maxHistory) stats.history.pop();
    
    res.json({
        success: true,
        data: {
            isWin,
            winRate: ((stats.wins / stats.total) * 100).toFixed(2) + "%",
            total: stats.total,
            wins: stats.wins
        }
    });
});

// GET /history
app.get('/history', (req, res) => {
    res.json({ success: true, data: stats.history });
});

// GET /health
app.get('/health', (req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ ${config.server.name} running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => { console.log('🛑 Shutting down'); process.exit(0); });
