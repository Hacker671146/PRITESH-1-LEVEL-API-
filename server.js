// server.js
const express = require('express');
const axios = require('axios');
const math = require('math'); // Optional: for advanced math, or use native Math

// --- CONFIGURATION ---
const NAME = "PRITESH QUANTUM AI 30";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
const PORT = process.env.PORT || 3000;

class QuantumDeepAI {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.prediction = null;
        this.numbers = [];
        // Weights for Deep Learning Logic
        this.weights = new Array(10).fill(0.1);
        this.bias = 0.5;
        this.lastProcessedIssue = null;
    }

    async fetchAPI() {
        try {
            const url = `${API_URL}?ts=${Date.now()}`;
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 10000
            });
            
            if (response.status === 200) {
                const js = response.data;
                return js?.data?.list || js?.list || [];
            }
        } catch (error) {
            console.error("API Fetch Error:", error.message);
        }
        return [];
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    deepQuantumPredict(data) {
        /**
         * 1. Deep Learning: Neural Weight Calculation
         * 2. Quantum Logic: Probability Wave Analysis  
         * 3. Opposite Pick: Your Strategy
         */
        if (!data || data.length < 10) {
            return { category: "WAITING", pick: [1, 6] };
        }

        // Extract last 10 numbers as input features
        const inputs = data.slice(0, 10).map(x => {
            const num = parseInt(x.number || 0);
            return num >= 5 ? 1 : 0;
        });
        
        // Simple Deep Learning Feed-Forward
        const dotProduct = inputs.reduce((sum, input, idx) => {
            return sum + (input * this.weights[idx]);
        }, this.bias);
        
        const prob = this.sigmoid(dotProduct);

        // Quantum Opposite Logic: Trend ke ulta predict karna (Quantum Drift)
        const category = prob < 0.5 ? "BIG" : "SMALL";

        // Opposite Number Pick Strategy (2-8, 1-6, 7-3)
        const lastNum = parseInt(data[0]?.number || 0);
        const oppMap = {
            0: [5, 8], 1: [6, 9], 2: [8, 0], 3: [7, 1], 4: [6, 2],
            5: [0, 3], 6: [1, 4], 7: [2, 5], 8: [3, 6], 9: [4, 7]
        };
        const pick = oppMap[lastNum] || [2, 8];
        
        return { category, pick };
    }

    tracker(num, issue) {
        const actCat = parseInt(num) >= 5 ? "BIG" : "SMALL";
        const win = (this.prediction === actCat) || this.numbers.includes(parseInt(num));
        
        this.total += 1;
        if (win) this.wins += 1;
        
        // Simple Backpropagation: Update weights based on result
        const expected = actCat === "BIG" ? 1 : 0;
        const predicted = this.prediction === "BIG" ? 1 : 0;
        const error = expected - predicted;
        
        for (let i = 0; i < this.weights.length; i++) {
            this.weights[i] += 0.01 * error;
        }

        const acc = (this.wins / this.total) * 100;
        
        console.log(`\n${'='.repeat(45)}`);
        console.log(` ${NAME} | QUANTUM STATUS`);
        console.log(`${'='.repeat(45)}`);
        console.log(`PERIOD    : ${issue}`);
        console.log(`PREDICT   : ${this.prediction} | PICK: [${this.numbers.join(', ')}]`);
        console.log(`ACTUAL    : ${num} (${actCat})`);
        console.log(`RESULT    : ${win ? '✅ WIN' : '❌ LOSS'}`);
        console.log(`ACCURACY  : ${acc.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log(`${'='.repeat(45)}\n`);
        
        return { win, acc: acc.toFixed(2), total: this.total };
    }

    async run() {
        console.log(`🚀 ${NAME} ACTIVATED`);
        console.log("Deep Learning Weights Initialized...");
        
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

                // Track result if we predicted this issue
                if (this.targetIssue === issue && this.lastProcessedIssue !== issue) {
                    this.tracker(num, issue);
                    this.lastProcessedIssue = issue;
                    this.targetIssue = null;
                }

                // Predict next issue
                const nextP = (parseInt(issue) + 1).toString();
                
                if (this.targetIssue !== nextP) {
                    const result = this.deepQuantumPredict(data);
                    this.prediction = result.category;
                    this.numbers = result.pick;
                    this.targetIssue = nextP;
                    
                    const t = new Date().toLocaleTimeString('en-GB');
                    process.stdout.write(`[${t}] NEXT: ${nextP} | AI: ${this.prediction} | PICK: [${this.numbers.join(', ')}]\r`);
                }

                await this.sleep(3000);
                
            } catch (error) {
                console.error("Runtime Error:", error.message);
                await this.sleep(5000);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// --- EXPRESS SERVER SETUP (For Render) ---
const app = express();
let botInstance = null;

// Health check endpoint for Render
app.get('/', (req, res) => {
    res.json({ 
        status: "🟢 ONLINE", 
        name: NAME,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Stats endpoint
app.get('/stats', (req, res) => {
    if (botInstance) {
        const acc = botInstance.total > 0 ? (botInstance.wins / botInstance.total * 100) : 0;
        res.json({
            name: NAME,
            total: botInstance.total,
            wins: botInstance.wins,
            accuracy: acc.toFixed(2) + '%',
            currentPrediction: botInstance.prediction,
            currentPick: botInstance.numbers,
            targetIssue: botInstance.targetIssue
        });
    } else {
        res.json({ status: "Bot not initialized" });
    }
});

// Manual prediction trigger (optional)
app.post('/predict', express.json(), async (req, res) => {
    if (!botInstance) {
        return res.status(503).json({ error: "Bot not ready" });
    }
    
    const data = await botInstance.fetchAPI();
    const result = botInstance.deepQuantumPredict(data);
    
    res.json({
        nextIssue: (parseInt(data[0]?.issue || data[0]?.issueNumber || 0) + 1).toString(),
        prediction: result.category,
        pick: result.pick,
        timestamp: new Date().toISOString()
    });
});

// Start the bot in background
function startBot() {
    if (!botInstance) {
        botInstance = new QuantumDeepAI();
        // Run bot without blocking Express server
        setImmediate(() => botInstance.run());
        console.log("🤖 Quantum AI Bot started in background...");
    }
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🌐 Server running on port ${PORT}`);
    console.log(`🔗 Health: http://localhost:${PORT}/`);
    console.log(`📊 Stats:  http://localhost:${PORT}/stats`);
    
    // Start the prediction bot
    startBot();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});
