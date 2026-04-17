const express = require('express');
const axios = require('axios');

// =========================== CONFIGURATION ===========================
const NAME = "PRITESH QUANTUM AI 3.0";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

class QuantumDeepAI {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.prediction = null;
        this.numbers = [];

        // --- 3-LEVEL MARTINGALE FIX ---
        this.currentLevel = 1;
        this.maxLevels = 3;
        this.multipliers = [1, 3, 9];

        // --- DEEP LEARNING WEIGHTS ---
        this.weights = [0.25, 0.20, 0.15, 0.10, 0.10, 0.05, 0.05, 0.04, 0.03, 0.03];
        this.bias = 0.5;
    }

    // Sigmoid activation function (using built-in Math object)
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    // Fetch lottery data from API
    async fetchAPI() {
        try {
            const url = `${API_URL}?ts=${Date.now()}`;
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 10000
            });
            const json = response.data;
            // Handle different response structures
            return json.data?.list || json.list || [];
        } catch (error) {
            console.error("API fetch error:", error.message);
            return [];
        }
    }

    // Deep Quantum prediction logic
    deepQuantumPredict(data) {
        if (!data || data.length < 10) {
            return { category: "WAITING", numbers: [1, 6] };
        }

        // Neural input: BIG(1) vs SMALL(0)
        const inputs = data.slice(0, 10).map(item => parseInt(item.number) >= 5 ? 1 : 0);
        
        // Weighted sum + bias
        let dotProduct = 0;
        for (let i = 0; i < inputs.length; i++) {
            dotProduct += inputs[i] * this.weights[i];
        }
        dotProduct += this.bias;
        
        const probability = this.sigmoid(dotProduct);
        // Category: opposite trend logic
        const category = probability < 0.5 ? "BIG" : "SMALL";

        // Opposite number mapping based on last result
        const lastNum = parseInt(data[0].number);
        const oppositeMap = {
            0: [5,8], 1: [6,9], 2: [8,0], 3: [7,1], 4: [6,2],
            5: [0,3], 6: [1,4], 7: [2,5], 8: [3,6], 9: [4,7]
        };
        const numbers = oppositeMap[lastNum] || [2, 8];

        return { category, numbers };
    }

    // Track results and update stats
    tracker(actualNum, issue) {
        const actualCategory = parseInt(actualNum) >= 5 ? "BIG" : "SMALL";
        const isWin = (this.prediction === actualCategory) || this.numbers.includes(parseInt(actualNum));
        
        this.total++;
        let status;
        if (isWin) {
            this.wins++;
            status = "✅ WIN";
            this.currentLevel = 1;  // Reset to level 1 on win
        } else {
            status = "❌ LOSS";
            if (this.currentLevel < this.maxLevels) {
                this.currentLevel++;
            } else {
                this.currentLevel = 1;  // Safety reset after level 3
            }
        }

        const accuracy = (this.wins / this.total) * 100;

        // Console output with original design
        console.log(`\n${'='.repeat(45)}`);
        console.log(` ${NAME} | QUANTUM STATUS`);
        console.log(`${'='.repeat(45)}`);
        console.log(`PERIOD    : ${issue}`);
        console.log(`PREDICT   : ${this.prediction} | PICK: ${this.numbers}`);
        console.log(`ACTUAL    : ${actualNum} (${actualCategory})`);
        console.log(`RESULT    : ${status}`);
        console.log(`LEVEL     : ${this.currentLevel} (${this.multipliers[this.currentLevel-1]}x)`);
        console.log(`ACCURACY  : ${accuracy.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log(`${'='.repeat(45)}\n`);
    }

    // Main polling loop
    async run() {
        console.log(`🚀 ${NAME} ACTIVATED`);
        console.log("Deep Learning Logic: 3-Level Fix Enabled\n");

        const poll = async () => {
            const data = await this.fetchAPI();
            if (data.length === 0) {
                setTimeout(poll, 2000);
                return;
            }

            const item = data[0];
            const issue = item.issue || item.issueNumber;
            const num = item.number;

            if (!issue || num === undefined) {
                setTimeout(poll, 2000);
                return;
            }

            // Track result if this is the target issue
            if (this.targetIssue === issue) {
                this.tracker(num, issue);
                this.targetIssue = null;
            }

            // Generate prediction for next issue
            const nextIssue = String(parseInt(issue) + 1);
            if (this.targetIssue !== nextIssue) {
                const { category, numbers } = this.deepQuantumPredict(data);
                this.prediction = category;
                this.numbers = numbers;
                this.targetIssue = nextIssue;

                const timestamp = new Date().toLocaleTimeString();
                process.stdout.write(`[${timestamp}] NEXT: ${nextIssue} | AI: ${this.prediction} | PICK: ${this.numbers}\r`);
            }

            setTimeout(poll, 3000);
        };

        poll();
    }

    // Getters for status endpoint
    getStats() {
        return {
            name: NAME,
            total: this.total,
            wins: this.wins,
            accuracy: this.total ? ((this.wins / this.total) * 100).toFixed(2) : 0,
            currentLevel: this.currentLevel,
            currentMultiplier: this.multipliers[this.currentLevel - 1],
            nextPrediction: this.prediction,
            nextNumbers: this.numbers,
            targetIssue: this.targetIssue
        };
    }
}

// =========================== EXPRESS SERVER ===========================
const app = express();
const PORT = process.env.PORT || 3000;

// Instantiate and start the bot
const bot = new QuantumDeepAI();
bot.run().catch(err => console.error("Bot error:", err));

// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        status: "active",
        message: "PRITESH QUANTUM AI 3.0 is running",
        endpoints: {
            status: "/status",
            health: "/"
        }
    });
});

// Status endpoint to view current bot statistics
app.get('/status', (req, res) => {
    res.json(bot.getStats());
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
    console.log(`📊 Status available at http://localhost:${PORT}/status\n`);
});
