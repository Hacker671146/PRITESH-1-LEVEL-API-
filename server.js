// server.js - PRITESH QUANTUM AI 30 | BIG/SMALL ONLY + MARTINGALE LOGIC
const express = require('express');
const axios = require('axios');

// --- CONFIGURATION ---
const NAME = "PRITESH QUANTUM AI 30";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
const PORT = process.env.PORT || 3000;

// Martingale Settings (2-3 Level Fix)
const MARTINGALE_CONFIG = {
    maxLevel: 3,              // 2-3 levels fix
    baseBet: 1,               // Starting bet unit
    multiplier: 2,            // Double bet on loss (Martingale)
    resetOnWin: true          // Reset to base after win
};

class QuantumDeepAI {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.losses = 0;
        this.targetIssue = null;
        this.prediction = null;
        this.lastResult = null;
        
        // Deep Learning Weights (10 inputs for last 10 rounds)
        this.weights = new Array(10).fill(0.1);
        this.bias = 0.5;
        this.learningRate = 0.05;
        
        // Martingale State
        this.currentLevel = 1;
        this.consecutiveLosses = 0;
        this.currentBet = MARTINGALE_CONFIG.baseBet;
        
        // Pattern Memory
        this.history = [];
        this.maxHistory = 50;
        
        this.lastProcessedIssue = null;
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
                return js?.data?.list || js?.list || [];
            }
        } catch (error) {
            console.error(`❌ API Error: ${error.message}`);
        }
        return [];
    }

    sigmoid(x) {
        // Clamp to avoid overflow
        x = Math.max(-500, Math.min(500, x));
        return 1 / (1 + Math.exp(-x));
    }

    // 🔮 Enhanced Quantum-BigSmall Prediction Logic
    deepQuantumPredict(data) {
        if (!data || data.length < 10) {
            return "WAITING";
        }

        // Extract features: last 10 results as BIG(1)/SMALL(0)
        const inputs = data.slice(0, 10).map(x => {
            const num = parseInt(x?.number || 0);
            return num >= 5 ? 1 : 0; // 1=BIG, 0=SMALL
        });

        // Store in history for pattern analysis
        this.history.unshift(inputs[0]);
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
        
        // 🧠 Deep Learning Feed-Forward with Quantum Drift
        let dotProduct = this.bias;
        for (let i = 0; i < inputs.length; i++) {
            dotProduct += inputs[i] * this.weights[i];
        }
        
        // Add Quantum Noise (simulated probability wave)
        const quantumNoise = (Math.random() - 0.5) * 0.1;
        const prob = this.sigmoid(dotProduct + quantumNoise);

        // 🎯 Pattern Analysis: Check for streaks & reversals
        const streak = this.analyzeStreak();
        const reversalSignal = this.checkReversalPattern();
        
        // Final Decision Logic (Quantum + Pattern + Martingale)
        let finalProb = prob;
        
        // If strong reversal signal, invert probability
        if (reversalSignal > 0.7) {
            finalProb = 1 - finalProb;
        }
        
        // Streak adjustment: after 3+ same, increase chance of opposite
        if (Math.abs(streak.count) >= 3) {
            const drift = streak.count > 0 ? -0.15 : 0.15;
            finalProb += drift;
        }

        // BIG if prob < 0.5 (Quantum Opposite Logic), else SMALL
        const prediction = finalProb < 0.5 ? "BIG" : "SMALL";
        
        return prediction;
    }

    // 📊 Analyze current streak in history
    analyzeStreak() {
        if (this.history.length < 3) return { count: 0, type: null };
        
        let count = 1;
        const first = this.history[0];
        
        for (let i = 1; i < Math.min(5, this.history.length); i++) {
            if (this.history[i] === first) count++;
            else break;
        }
        
        return { 
            count: first === 1 ? count : -count, 
            type: first === 1 ? "BIG" : "SMALL" 
        };
    }

    // 🔄 Check for reversal patterns (Methmetcal Logic)
    checkReversalPattern() {
        if (this.history.length < 6) return 0;
        
        // Look for patterns like: BBBSS → expect B, or SSBBB → expect S
        const recent = this.history.slice(0, 6);
        const bigCount = recent.filter(x => x === 1).length;
        
        // If 4-2 or 2-4 split, high reversal probability
        if (bigCount === 4 || bigCount === 2) {
            return 0.75;
        }
        // If 5-1 or 1-5, very high reversal
        if (bigCount === 5 || bigCount === 1) {
            return 0.9;
        }
        return 0.3;
    }

    // 🎲 Martingale 2-3 Level Betting Logic (Methmetcal Fix)
    calculateMartingaleBet(lastResult, currentPrediction) {
        const { maxLevel, baseBet, multiplier, resetOnWin } = MARTINGALE_CONFIG;
        
        if (lastResult === null) {
            // First bet
            this.currentLevel = 1;
            this.consecutiveLosses = 0;
            return baseBet;
        }
        
        const won = (lastResult === currentPrediction);
        
        if (won) {
            // ✅ WIN: Reset Martingale
            if (resetOnWin) {
                this.currentLevel = 1;
                this.consecutiveLosses = 0;
                this.currentBet = baseBet;
            }
            console.log(`🎉 WIN! Resetting Martingale to Level 1`);
        } else {
            // ❌ LOSS: Increase level (Max 3 levels fix)
            this.consecutiveLosses++;
            
            if (this.currentLevel < maxLevel) {
                this.currentLevel++;
                this.currentBet = baseBet * Math.pow(multiplier, this.currentLevel - 1);
                console.log(`📈 LOSS! Martingale Level ${this.currentLevel}/${maxLevel} | Bet: ${this.currentBet}x`);
            } else {
                // 🔁 Max level reached: Reset to avoid infinite loss
                console.log(`⚠️ Max Martingale Level (${maxLevel}) reached. Resetting...`);
                this.currentLevel = 1;
                this.consecutiveLosses = 0;
                this.currentBet = baseBet;
            }
        }
        
        return this.currentBet;
    }

    // 🎯 Tracker: Update stats + Backpropagation + Martingale
    tracker(num, issue) {
        const actualNum = parseInt(num);
        const actCat = actualNum >= 5 ? "BIG" : "SMALL";
        const won = (this.prediction === actCat);
        
        // Update stats
        this.total += 1;
        if (won) {
            this.wins += 1;
            this.lastResult = this.prediction;
        } else {
            this.losses += 1;
            this.lastResult = actCat; // Store actual for Martingale
        }
        
        // 🧠 Backpropagation: Update weights based on error
        const expected = actCat === "BIG" ? 1 : 0;
        const predicted = this.prediction === "BIG" ? 1 : 0;
        const error = expected - predicted;
        
        // Update weights with learning rate
        for (let i = 0; i < this.weights.length; i++) {
            this.weights[i] += this.learningRate * error * 0.1;
            // Clamp weights to prevent explosion
            this.weights[i] = Math.max(-1, Math.min(1, this.weights[i]));
        }
        
        // Adjust bias slightly
        this.bias += this.learningRate * error * 0.05;
        
        // 🎲 Calculate Martingale bet for next round
        const nextBet = this.calculateMartingaleBet(this.lastResult, this.prediction);
        
        // Calculate accuracy
        const acc = this.total > 0 ? (this.wins / this.total) * 100 : 0;
        
        // 📋 Console Output
        console.log(`\n${'='.repeat(50)}`);
        console.log(` ${NAME} | QUANTUM BIG/SMALL | MARTINGALE L${this.currentLevel}/3`);
        console.log(`${'='.repeat(50)}`);
        console.log(`PERIOD    : ${issue}`);
        console.log(`PREDICT   : ${this.prediction}`);
        console.log(`ACTUAL    : ${actualNum} (${actCat})`);
        console.log(`RESULT    : ${won ? '✅ WIN' : '❌ LOSS'}`);
        console.log(`MARTINGALE: Level ${this.currentLevel}/3 | Next Bet: ${nextBet}x`);
        console.log(`STATS     : W:${this.wins} L:${this.losses} | ACC: ${acc.toFixed(2)}%`);
        console.log(`${'='.repeat(50)}\n`);
        
        return { won, acc: acc.toFixed(2), total: this.total, nextBet };
    }

    async run() {
        console.log(`🚀 ${NAME} ACTIVATED`);
        console.log(`🎯 Mode: BIG/SMALL Only | Martingale: 2-3 Levels Fix`);
        console.log(`🧠 Deep Learning: 10-input Neural Net + Quantum Drift`);
        console.log("⏳ Waiting for API data...\n");
        
        while (true) {
            try {
                const data = await this.fetchAPI();
                
                if (!data || data.length === 0) {
                    await this.sleep(2000);
                    continue;
                }
                
                const item = data[0];
                const issue = item?.issue || item?.issueNumber;
                const num = item?.number;

                if (!issue || num === undefined || num === null) continue;

                // ✅ Track result if we predicted this issue
                if (this.targetIssue === issue && this.lastProcessedIssue !== issue) {
                    this.tracker(num, issue);
                    this.lastProcessedIssue = issue;
                    this.targetIssue = null;
                }

                // 🔮 Predict next issue
                const nextP = (parseInt(issue) + 1).toString();
                
                if (this.targetIssue !== nextP) {
                    this.prediction = this.deepQuantumPredict(data);
                    this.targetIssue = nextP;
                    
                    const t = new Date().toLocaleTimeString('en-GB');
                    const martingaleInfo = `(L${this.currentLevel}/3 | Bet:${this.currentBet}x)`;
                    
                    process.stdout.write(
                        `[${t}] NEXT:${nextP} | AI:${this.prediction} | ${martingaleInfo}\r`
                    );
                }

                await this.sleep(3000);
                
            } catch (error) {
                console.error(`\n❌ Runtime Error: ${error.message}`);
                await this.sleep(5000);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// --- EXPRESS SERVER (Render Compatible) ---
const app = express();
let botInstance = null;

// Health Check
app.get('/', (req, res) => {
    res.json({ 
        status: "🟢 ONLINE", 
        name: NAME,
        mode: "BIG/SMALL + Martingale 2-3 Level",
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Stats Endpoint
app.get('/stats', (req, res) => {
    if (botInstance) {
        const acc = botInstance.total > 0 
            ? (botInstance.wins / botInstance.total * 100) 
            : 0;
        res.json({
            name: NAME,
            mode: "BIG/SMALL Only",
            martingale: {
                currentLevel: botInstance.currentLevel,
                maxLevel: MARTINGALE_CONFIG.maxLevel,
                currentBet: botInstance.currentBet,
                consecutiveLosses: botInstance.consecutiveLosses
            },
            stats: {
                total: botInstance.total,
                wins: botInstance.wins,
                losses: botInstance.losses,
                accuracy: acc.toFixed(2) + '%',
                winRate: botInstance.total > 0 ? (botInstance.wins/botInstance.total).toFixed(3) : 0
            },
            current: {
                prediction: botInstance.prediction,
                targetIssue: botInstance.targetIssue,
                lastResult: botInstance.lastResult
            },
            weights: botInstance.weights.map(w => w.toFixed(3))
        });
    } else {
        res.json({ status: "⏳ Bot initializing..." });
    }
});

// Manual Predict Endpoint
app.post('/predict', express.json(), async (req, res) => {
    if (!botInstance) {
        return res.status(503).json({ error: "Bot not ready" });
    }
    
    const data = await botInstance.fetchAPI();
    const prediction = botInstance.deepQuantumPredict(data);
    const nextIssue = data[0] ? (parseInt(data[0]?.issue || data[0]?.issueNumber || 0) + 1).toString() : "N/A";
    
    res.json({
        nextIssue,
        prediction, // "BIG" or "SMALL"
        martingale: {
            level: botInstance.currentLevel,
            bet: botInstance.currentBet
        },
        confidence: "Quantum-Enhanced",
        timestamp: new Date().toISOString()
    });
});

// Reset Martingale (Manual Override)
app.post('/reset-martingale', (req, res) => {
    if (botInstance) {
        botInstance.currentLevel = 1;
        botInstance.consecutiveLosses = 0;
        botInstance.currentBet = MARTINGALE_CONFIG.baseBet;
        res.json({ success: true, message: "Martingale reset to Level 1" });
    } else {
        res.status(503).json({ error: "Bot not ready" });
    }
});

// Start Bot in Background
function startBot() {
    if (!botInstance) {
        botInstance = new QuantumDeepAI();
        setImmediate(() => botInstance.run());
        console.log("🤖 Quantum AI Bot (BIG/SMALL + Martingale) started...");
    }
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 ${NAME} Server`);
    console.log(`📍 Running on port ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/`);
    console.log(`📊 Stats:  http://localhost:${PORT}/stats`);
    console.log(`⚡ Mode: BIG/SMALL Only | Martingale 2-3 Level Fix\n`);
    startBot();
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// Unhandled Promise Rejection Handler
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});
