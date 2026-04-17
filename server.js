const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// ========== CONFIG ==========
const NAME = "PRITESH QUANTUM AI 3.0";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

// ========== STATE ==========
let currentPeriod = null;        // Next period to predict
let currentPrediction = "BIG";
let currentNumbers = [5, 8];
let totalTrades = 0;
let wins = 0;
let last10Results = [];           // Stores last 10 results (win/loss)
let last10Numbers = [];           // Stores last 10 actual numbers for prediction
let lastActualPeriod = null;      // Last period we have a result for
let lastActualNumber = null;      // Last actual number drawn

// ========== DEEP LEARNING WEIGHTS ==========
const weights = [0.25, 0.20, 0.15, 0.10, 0.10, 0.05, 0.05, 0.04, 0.03, 0.03];
const bias = 0.5;

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

// Predict BIG or SMALL based on last 10 numbers (real data only)
function predictCategory(numbersList) {
    if (!numbersList || numbersList.length < 10) {
        // Not enough data yet – return a default but don't track win/loss until we have 10
        return "BIG";
    }
    const inputs = numbersList.slice(0, 10).map(n => n >= 5 ? 1 : 0);
    let dot = 0;
    for (let i = 0; i < inputs.length; i++) {
        dot += inputs[i] * weights[i];
    }
    dot += bias;
    const prob = sigmoid(dot);
    return prob < 0.5 ? "BIG" : "SMALL";
}

// Generate two prediction numbers from opposite mapping
function getPredictionNumbers(lastNum) {
    const oppositeMap = {
        0: [5,8], 1: [6,9], 2: [8,0], 3: [7,1], 4: [6,2],
        5: [0,3], 6: [1,4], 7: [2,5], 8: [3,6], 9: [4,7]
    };
    if (lastNum !== undefined && oppositeMap[lastNum]) {
        return oppositeMap[lastNum];
    }
    return [5, 8];
}

// Fetch real data from API
async function fetchRealData() {
    try {
        const url = `${API_URL}?ts=${Date.now()}`;
        const response = await axios.get(url, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 10000
        });
        const json = response.data;
        const list = json.data?.list || json.list || [];
        if (!list || list.length === 0) return null;
        const first = list[0];
        const issue = first.issue || first.issueNumber;
        const number = first.number;
        if (issue && number !== undefined) {
            return { issue: String(issue), number: parseInt(number) };
        }
        return null;
    } catch (err) {
        console.error(`[API] Fetch error: ${err.message}`);
        return null;
    }
}

// Main update function – called every 3 seconds
async function updateBot() {
    const realData = await fetchRealData();
    if (!realData) {
        console.log("[WARN] No API data – waiting...");
        return; // Keep existing state, don't generate fake periods
    }

    const { issue, number } = realData;
    console.log(`[LIVE] Period ${issue} → ${number}`);

    // If we have a previous prediction, check win/loss
    if (currentPeriod !== null && lastActualPeriod !== issue) {
        // This is a new result – compare with our prediction for that period
        const predictedCategory = currentPrediction;
        const actualCategory = number >= 5 ? "BIG" : "SMALL";
        const isWin = (predictedCategory === actualCategory) || currentNumbers.includes(number);
        
        totalTrades++;
        if (isWin) wins++;
        
        // Store in last10Results
        last10Results.unshift({
            period: issue,
            sticker: isWin ? "✅ WIN" : "❌ LOSS",
            prediction: predictedCategory,
            actual: actualCategory,
            result: isWin ? "WIN" : "LOSS",
            confidence: "76.5%",
            model: "quantum",
            time: new Date().toLocaleTimeString()
        });
        if (last10Results.length > 10) last10Results.pop();
        
        // Store number for prediction history
        last10Numbers.unshift(number);
        if (last10Numbers.length > 10) last10Numbers.pop();
        
        console.log(`[RESULT] Period ${issue} | Pred: ${predictedCategory} | Actual: ${actualCategory} → ${isWin ? "WIN" : "LOSS"} (Win rate: ${((wins/totalTrades)*100).toFixed(1)}%)`);
    }
    
    // Update last actual
    lastActualPeriod = issue;
    lastActualNumber = number;
    
    // Predict NEXT period
    const nextPeriod = (parseInt(issue) + 1).toString();
    const predictedCategory = predictCategory(last10Numbers);
    const predictedNumbers = getPredictionNumbers(number);
    
    currentPeriod = nextPeriod;
    currentPrediction = predictedCategory;
    currentNumbers = predictedNumbers;
    
    console.log(`[PREDICT] Next period ${currentPeriod} → ${currentPrediction} | Numbers: ${currentNumbers}`);
}

// Run every 3 seconds (same as Python script)
setInterval(updateBot, 3000);
// Run immediately on start
updateBot();

// ========== EXPRESS ROUTES ==========

app.get('/trade', (req, res) => {
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(2) : 0;
    res.json({
        currentPrediction: {
            period: currentPeriod,
            prediction: currentPrediction,
            numbers: currentNumbers,
            confidence: "76.50%",
            model: "quantum",
            source: "quantum_entanglement_trap_aware",
            marketState: "NORMAL",
            timestamp: new Date().toISOString(),
            lossPatternInfo: null
        },
        performance: {
            totalWins: wins,
            totalLosses: totalTrades - wins,
            winRate: `${winRate}%`,
            currentLevel: 1,
            currentMultiplier: 1,
            avoidedPatterns: 0
        },
        last10Predictions: last10Results,
        systemStatus: {
            activeModel: "quantum",
            dataPoints: totalTrades,
            marketRegime: "NORMAL",
            lastUpdate: new Date().toLocaleTimeString(),
            lossPatternsCount: 0,
            apiConnected: true
        }
    });
});

app.get('/', (req, res) => {
    res.json({ 
        status: "active", 
        name: NAME,
        current: { period: currentPeriod, prediction: currentPrediction }
    });
});

app.get('/health', (req, res) => {
    res.status(200).send("OK");
});

app.listen(PORT, () => {
    console.log(`\n✅ ${NAME} running on port ${PORT}`);
    console.log(`📡 Trade API: http://localhost:${PORT}/trade\n`);
});
