// server.js - PRITESH QUANTUM AI 30 | FIXED PREDICTION OUTPUT
const express = require('express');
const axios = require('axios');

// --- CONFIGURATION ---
const NAME = "PRITESH QUANTUM AI 30";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
const PORT = process.env.PORT || 3000;

// Martingale Settings (2-3 Level Fix)
const MARTINGALE_CONFIG = {
    maxLevel: 3,
    baseBet: 1,
    multiplier: 2,
    resetOnWin: true
};

class QuantumDeepAI {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.losses = 0;
        this.targetIssue = null;
        this.prediction = null;
        this.lastResult = null;
        this.lastIssue = null;
        
        // Deep Learning
        this.weights = new Array(10).fill(0.1);
        this.bias = 0.5;
        this.learningRate = 0.05;
        
        // Martingale
        this.currentLevel = 1;
        this.consecutiveLosses = 0;
        this.currentBet = MARTINGALE_CONFIG.baseBet;
        
        // History & Cache
        this.history = [];
        this.maxHistory = 50;
        this.lastProcessedIssue = null;
        this.lastApiData = null; // 🔍 Cache for debugging
        
        this.isReady = false;
    }

    async fetchAPI() {
        try {
            const url = `${API_URL}?ts=${Date.now()}`;
            const response = await axios.get(url, {
                headers: { 
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json"
                },
                timeout: 10000
            });
            
            if (response.status === 200 && response.data) {
                const js = response.data;
                const list = js?.data?.list || js?.list || [];
                this.lastApiData = list; // 🔍 Cache for /debug
                return list;
            }
        } catch (error) {
            console.error(`❌ API Error: ${error.message}`);
        }
        return [];
    }

    sigmoid(x) {
        x = Math.max(-500, Math.min(500, x));
        return 1 / (1 + Math.exp(-x));
    }

    // 🔮 Prediction Logic - Returns BIG or SMALL
    deepQuantumPredict(data) {
        if (!data || data.length < 10) {
            console.log(`⏳ Waiting for data... Have: ${data?.length || 0}/10`);
            return "WAITING";
        }

        // Extract: BIG=1, SMALL=0
        const inputs = data.slice(0, 10).map(x => {
            const num = parseInt(x?.number ?? x?.num ?? 0);
            return num >= 5 ? 1 : 0;
        });

        // Update history
        this.history.unshift(inputs[0]);
        if (this.history.length > this.maxHistory) this.history.pop();
        
        // Neural Net Forward Pass
        let dotProduct = this.bias;
        for (let i = 0; i < inputs.length; i++) {
            dotProduct += inputs[i] * this.weights[i];
        }
        
        // Quantum Noise
        const quantumNoise = (Math.random() - 0.5) * 0.1;
        const prob = this.sigmoid(dotProduct + quantumNoise);

        // Pattern Analysis
        const streak = this.analyzeStreak();
        const reversal = this.checkReversalPattern();
        
        let finalProb = prob;
        if (reversal > 0.7) finalProb = 1 - finalProb;
        if (Math.abs(streak.count) >= 3) {
            finalProb += streak.count > 0 ? -0.15 : 0.15;
        }

        // 🔑 FINAL: BIG if prob < 0.5, else SMALL (Quantum Opposite Logic)
        const prediction = finalProb < 0.5 ? "BIG" : "SMALL";
        
        console.log(`🔮 Predict: ${prediction} (prob:${finalProb.toFixed(3)})`);
        return prediction;
    }

    analyzeStreak() {
        if (this.history.length < 3) return { count: 0, type: null };
        let count = 1;
        const first = this.history[0];
        for (let i = 1; i < Math.min(5, this.history.length); i++) {
            if (this.history[i] === first) count++;
            else break;
        }
        return { count: first === 1 ? count : -count, type: first === 1 ? "BIG" : "SMALL" };
    }

    checkReversalPattern() {
        if (this.history.length < 6) return 0;
        const recent = this.history.slice(0, 6);
        const bigCount = recent.filter(x => x === 1).length;
        if (bigCount === 4 || bigCount === 2) return 0.75;
        if (bigCount === 5 || bigCount === 1) return 0.9;
        return 0.3;
    }

    // 🎲 Martingale 2-3 Level Logic
    calculateMartingaleBet(lastResult, currentPrediction) {
        const { maxLevel, baseBet, multiplier, resetOnWin } = MARTINGALE_CONFIG;
        
        if (lastResult === null) {
            this.currentLevel = 1;
            this.consecutiveLosses = 0;
            return baseBet;
        }
        
        const won = (lastResult === currentPrediction);
        
        if (won) {
            if (resetOnWin) {
                this.currentLevel = 1;
                this.consecutiveLosses = 0;
                this.currentBet = baseBet;
            }
            console.log(`🎉 WIN! Reset Martingale to L1`);
        } else {
            this.consecutiveLosses++;
            if (this.currentLevel < maxLevel) {
                this.currentLevel++;
                this.currentBet = baseBet * Math.pow(multiplier, this.currentLevel - 1);
                console.log(`📈 LOSS! Martingale L${this.currentLevel}/3 | Bet: ${this.currentBet}x`);
            } else {
                console.log(`⚠️ Max Level reached. Resetting Martingale.`);
                this.currentLevel = 1;
                this.consecutiveLosses = 0;
                this.currentBet = baseBet;
            }
        }
        return this.currentBet;
    }

    // 🎯 Tracker with Full Logging
    tracker(num, issue) {
        const actualNum = parseInt(num);
        const actCat = actualNum >= 5 ? "BIG" : "SMALL";
        const won = (this.prediction === actCat);
        
        this.total += 1;
        if (won) {
            this.wins += 1;
            this.lastResult = this.prediction;
        } else {
            this.losses += 1;
            this.lastResult = actCat;
        }
        
        // Backpropagation
        const expected = actCat === "BIG" ? 1 : 0;
        const predicted = this.prediction === "BIG" ? 1 : 0;
        const error = expected - predicted;
        
        for (let i = 0; i < this.weights.length; i++) {
            this.weights[i] += this.learningRate * error * 0.1;
            this.weights[i] = Math.max(-1, Math.min(1, this.weights[i]));
        }
        this.bias += this.learningRate * error * 0.05;
        
        const nextBet = this.calculateMartingaleBet(this.lastResult, this.prediction);
        const acc = this.total > 0 ? (this.wins / this.total) * 100 : 0;
        
        // 📋 Console Output
        console.log(`\n${'='.repeat(55)}`);
        console.log(` ${NAME} | ISSUE: ${issue}`);
        console.log(`${'='.repeat(55)}`);
        console.log(` PREDICT : ${this.prediction}`);
        console.log(` ACTUAL  : ${actualNum} → ${actCat}`);
        console.log(` RESULT  : ${won ? '✅ WIN 🎉' : '❌ LOSS'}`);
        console.log(` MARTINGALE : L${this.currentLevel}/3 | Next: ${nextBet}x`);
        console.log(` STATS   : W:${this.wins} L:${this.losses} | ACC: ${acc.toFixed(2)}%`);
        console.log(`${'='.repeat(55)}\n`);
        
        return { won, acc: acc.toFixed(2), total: this.total, nextBet };
    }

    // 🔁 Main Loop - FIXED to ensure prediction triggers
    async run() {
        console.log(`🚀 ${NAME} ACTIVATED`);
        console.log(`🎯 Mode: BIG/SMALL Only | Martingale: 2-3 Levels`);
        console.log(`🔗 API: ${API_URL}\n`);
        
        while (true) {
            try {
                const data = await this.fetchAPI();
                
                if (!data || data.length === 0) {
                    console.log(`⏳ No data yet... Retrying in 2s`);
                    await this.sleep(2000);
                    continue;
                }
                
                // 🔍 Debug: Show first item structure
                if (!this.isReady) {
                    console.log(`📦 API Sample:`, JSON.stringify(data[0]).slice(0, 200));
                    this.isReady = true;
                }
                
                const item = data[0];
                // 🔑 Flexible issue/number parsing
                const issue = item?.issue || item?.issueNumber || item?.period || item?.id;
                const num = item?.number ?? item?.num ?? item?.result;

                if (!issue || num === undefined || num === null) {
                    console.log(`⚠️ Missing issue/number in API response`);
                    await this.sleep(2000);
                    continue;
                }

                // ✅ Track result for PREDICTED issue
                if (this.targetIssue && issue === this.targetIssue && this.lastProcessedIssue !== issue) {
                    console.log(`🎯 Result arrived for Issue: ${issue}`);
                    this.tracker(num, issue);
                    this.lastProcessedIssue = issue;
                    this.targetIssue = null;
                }

                // 🔮 Predict NEXT issue
                const nextIssue = (parseInt(issue) + 1).toString();
                
                if (this.targetIssue !== nextIssue) {
                    console.log(`🔄 New issue detected: ${issue} → Predicting for: ${nextIssue}`);
                    
                    this.prediction = this.deepQuantumPredict(data);
                    this.targetIssue = nextIssue;
                    this.lastIssue = issue;
                    
                    const t = new Date().toLocaleTimeString('en-GB');
                    const martInfo = `L${this.currentLevel}/3 | Bet:${this.currentBet}x`;
                    
                    // Real-time console update
                    process.stdout.write(
                        `[${t}] 🎯 NEXT:${nextIssue} | AI: ${this.prediction} | ${martInfo}\r`
                    );
                }

                await this.sleep(3000);
                
            } catch (error) {
                console.error(`\n❌ Runtime Error: ${error.message}`);
                console.error(error.stack);
                await this.sleep(5000);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 🔍 Get current state for API
    getState() {
        const acc = this.total > 0 ? (this.wins / this.total * 100) : 0;
        return {
            isReady: this.isReady,
            prediction: this.prediction,
            targetIssue: this.targetIssue,
            lastIssue: this.lastIssue,
            lastResult: this.lastResult,
            martingale: {
                level: this.currentLevel,
                bet: this.currentBet,
                losses: this.consecutiveLosses
            },
            stats: {
                total: this.total,
                wins: this.wins,
                losses: this.losses,
                accuracy: acc.toFixed(2) + '%'
            }
        };
    }
}

// --- EXPRESS SERVER ---
const app = express();
app.use(express.json());

let botInstance = null;

// 🟢 Health Check
app.get('/', (req, res) => {
    const state = botInstance?.getState() || {};
    res.json({ 
        status: "🟢 ONLINE", 
        name: NAME,
        mode: "BIG/SMALL + Martingale 2-3 Level",
        prediction: state.prediction || "Loading...",
        targetIssue: state.targetIssue || "Waiting...",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// 📊 Full Stats
app.get('/stats', (req, res) => {
    if (!botInstance) return res.json({ status: "⏳ Initializing..." });
    
    const state = botInstance.getState();
    res.json({
        name: NAME,
        mode: "BIG/SMALL Only",
        botReady: botInstance.isReady,
        martingale: state.martingale,
        stats: state.stats,
        current: {
            prediction: state.prediction,
            targetIssue: state.targetIssue,
            lastIssue: state.lastIssue,
            lastResult: state.lastResult
        },
        weights: botInstance.weights.map(w => w.toFixed(3)),
        bias: botInstance.bias.toFixed(3)
    });
});

// 🎯 LIVE PREDICTION ENDPOINT (FIXED - Returns Actual Prediction)
app.get('/predict', async (req, res) => {
    if (!botInstance) {
        return res.status(503).json({ error: "Bot not initialized" });
    }
    
    // Force fresh fetch
    const data = await botInstance.fetchAPI();
    
    if (!data || data.length < 10) {
        return res.json({
            status: "WAITING",
            message: "Need more data for prediction",
            available: data?.length || 0,
            required: 10
        });
    }
    
    // Generate prediction
    const prediction = botInstance.deepQuantumPredict(data);
    const currentItem = data[0];
    const currentIssue = currentItem?.issue || currentItem?.issueNumber;
    const nextIssue = currentIssue ? (parseInt(currentIssue) + 1).toString() : "N/A";
    
    res.json({
        status: "SUCCESS",
        nextIssue: nextIssue,
        prediction: prediction, // 🔑 "BIG" or "SMALL"
        confidence: "Quantum-Enhanced",
        martingale: {
            level: botInstance.currentLevel,
            bet: botInstance.currentBet,
            advice: botInstance.consecutiveLosses >= 2 ? "⚠️ Consider pause" : "✅ Continue"
        },
        stats: {
            accuracy: botInstance.total > 0 ? (botInstance.wins/botInstance.total*100).toFixed(2) + "%" : "N/A",
            total: botInstance.total
        },
        timestamp: new Date().toISOString()
    });
});

// 🔍 DEBUG: See Raw API Data
app.get('/debug', async (req, res) => {
    if (!botInstance) return res.json({ error: "Bot not ready" });
    
    const rawData = await botInstance.fetchAPI();
    res.json({
        timestamp: new Date().toISOString(),
        api_url: API_URL,
        data_count: rawData?.length || 0,
        sample: rawData?.slice(0, 3) || [],
        bot_state: botInstance.getState(),
        weights: botInstance.weights,
        history_sample: botInstance.history.slice(0, 10)
    });
});

// 🔄 Reset Martingale
app.post('/reset', (req, res) => {
    if (botInstance) {
        botInstance.currentLevel = 1;
        botInstance.consecutiveLosses = 0;
        botInstance.currentBet = MARTINGALE_CONFIG.baseBet;
        res.json({ success: true, message: "Martingale reset to Level 1" });
    } else {
        res.status(503).json({ error: "Bot not ready" });
    }
});

// Start Bot
function startBot() {
    if (!botInstance) {
        botInstance = new QuantumDeepAI();
        console.log("🤖 Starting Quantum AI Bot...");
        // Run async without blocking server
        setImmediate(() => botInstance.run());
    }
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 ${NAME}`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔗 Endpoints:`);
    console.log(`   GET /          → Health + Current Prediction`);
    console.log(`   GET /predict   → 🔑 LIVE PREDICTION (BIG/SMALL)`);
    console.log(`   GET /stats     → Full stats & weights`);
    console.log(`   GET /debug     → Raw API data for troubleshooting`);
    console.log(`   POST /reset    → Reset Martingale`);
    console.log(`\n⏳ Starting bot loop...\n`);
    startBot();
});

// Graceful Shutdown
process.on('SIGTERM', () => { console.log('\n🛑 Shutting down...'); process.exit(0); });
process.on('SIGINT', () => { console.log('\n🛑 Shutting down...'); process.exit(0); });
process.on('unhandledRejection', (err) => console.error('❌ Unhandled:', err));
