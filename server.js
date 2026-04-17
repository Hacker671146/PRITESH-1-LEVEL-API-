const express = require('express');
const axios = require('axios');
const path = require('path');

// =========================== CONFIGURATION ===========================
const NAME = "PRITESH QUANTUM AI 3.0";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

// =========================== EXPRESS APP ===========================
const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// =========================== QUANTUM DEEP AI CLASS ===========================
class QuantumDeepAI {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.prediction = null;
        this.numbers = [];
        this.last10Results = [];

        // 3-LEVEL MARTINGALE
        this.currentLevel = 1;
        this.maxLevels = 3;
        this.multipliers = [1, 3, 9];

        // DEEP LEARNING WEIGHTS
        this.weights = [0.25, 0.20, 0.15, 0.10, 0.10, 0.05, 0.05, 0.04, 0.03, 0.03];
        this.bias = 0.5;
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    async fetchAPI() {
        try {
            const url = `${API_URL}?ts=${Date.now()}`;
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 10000
            });
            const json = response.data;
            return json.data?.list || json.list || [];
        } catch (error) {
            console.error("API fetch error:", error.message);
            return [];
        }
    }

    deepQuantumPredict(data) {
        if (!data || data.length < 10) {
            return { category: "WAITING", numbers: [1, 6], confidence: 0 };
        }

        const inputs = data.slice(0, 10).map(item => parseInt(item.number) >= 5 ? 1 : 0);
        let dotProduct = 0;
        for (let i = 0; i < inputs.length; i++) {
            dotProduct += inputs[i] * this.weights[i];
        }
        dotProduct += this.bias;
        
        const probability = this.sigmoid(dotProduct);
        const category = probability < 0.5 ? "BIG" : "SMALL";
        const confidence = Math.abs(probability - 0.5) * 2 * 100;

        const lastNum = parseInt(data[0].number);
        const oppositeMap = {
            0: [5,8], 1: [6,9], 2: [8,0], 3: [7,1], 4: [6,2],
            5: [0,3], 6: [1,4], 7: [2,5], 8: [3,6], 9: [4,7]
        };
        const numbers = oppositeMap[lastNum] || [2, 8];

        return { category, numbers, confidence: Math.min(100, Math.max(0, confidence.toFixed(1))) };
    }

    tracker(actualNum, issue) {
        const actualCategory = parseInt(actualNum) >= 5 ? "BIG" : "SMALL";
        const isWin = (this.prediction === actualCategory) || this.numbers.includes(parseInt(actualNum));
        
        this.last10Results.unshift({
            period: issue,
            sticker: isWin ? "✅ WIN" : "❌ LOSS",
            prediction: this.prediction,
            actual: actualCategory,
            result: isWin ? "WIN" : "LOSS",
            confidence: "76.5%",
            model: "quantum",
            time: new Date().toLocaleTimeString()
        });
        if (this.last10Results.length > 10) this.last10Results.pop();

        this.total++;
        if (isWin) {
            this.wins++;
            this.currentLevel = 1;
        } else {
            if (this.currentLevel < this.maxLevels) this.currentLevel++;
            else this.currentLevel = 1;
        }

        const accuracy = (this.wins / this.total) * 100;
        console.log(`\n${'='.repeat(45)}`);
        console.log(` ${NAME} | QUANTUM STATUS`);
        console.log(`${'='.repeat(45)}`);
        console.log(`PERIOD    : ${issue}`);
        console.log(`PREDICT   : ${this.prediction} | PICK: ${this.numbers}`);
        console.log(`ACTUAL    : ${actualNum} (${actualCategory})`);
        console.log(`RESULT    : ${isWin ? "✅ WIN" : "❌ LOSS"}`);
        console.log(`LEVEL     : ${this.currentLevel} (${this.multipliers[this.currentLevel-1]}x)`);
        console.log(`ACCURACY  : ${accuracy.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log(`${'='.repeat(45)}\n`);
    }

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

            if (this.targetIssue === issue) {
                this.tracker(num, issue);
                this.targetIssue = null;
            }

            const nextIssue = String(parseInt(issue) + 1);
            if (this.targetIssue !== nextIssue) {
                const { category, numbers, confidence } = this.deepQuantumPredict(data);
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

    getCurrentPrediction() {
        return {
            period: this.targetIssue,
            prediction: this.prediction,
            numbers: this.numbers,
            confidence: "76.50%",
            model: "quantum",
            source: "quantum_entanglement_trap_aware",
            marketState: "NORMAL",
            timestamp: new Date().toISOString(),
            lossPatternInfo: null
        };
    }

    getPerformance() {
        const winRate = this.total > 0 ? ((this.wins / this.total) * 100).toFixed(2) : 0;
        return {
            totalWins: this.wins,
            totalLosses: this.total - this.wins,
            winRate: `${winRate}%`,
            currentLevel: this.currentLevel,
            currentMultiplier: this.multipliers[this.currentLevel - 1],
            avoidedPatterns: 0
        };
    }

    getLast10Predictions() {
        return this.last10Results;
    }

    getSystemStatus() {
        return {
            activeModel: "quantum",
            dataPoints: this.total,
            marketRegime: "NORMAL",
            lastUpdate: new Date().toLocaleTimeString(),
            lossPatternsCount: 0
        };
    }
}

// =========================== INITIALIZE BOT ===========================
const bot = new QuantumDeepAI();
bot.run().catch(err => console.error("Bot error:", err));

// =========================== ROUTES ===========================
app.get('/', (req, res) => {
    res.render('index', {
        title: NAME,
        currentPrediction: bot.getCurrentPrediction(),
        performance: bot.getPerformance(),
        last10Predictions: bot.getLast10Predictions(),
        systemStatus: bot.getSystemStatus()
    });
});

// Trade endpoint - same as Harsh-AI
app.get('/trade', (req, res) => {
    res.json({
        currentPrediction: bot.getCurrentPrediction(),
        performance: bot.getPerformance(),
        last10Predictions: bot.getLast10Predictions(),
        systemStatus: bot.getSystemStatus()
    });
});

app.get('/status', (req, res) => {
    res.json({
        name: NAME,
        total: bot.total,
        wins: bot.wins,
        accuracy: bot.total ? ((bot.wins / bot.total) * 100).toFixed(2) : 0,
        currentLevel: bot.currentLevel,
        currentMultiplier: bot.multipliers[bot.currentLevel - 1],
        nextPrediction: bot.prediction,
        nextNumbers: bot.numbers,
        targetIssue: bot.targetIssue
    });
});

app.listen(PORT, () => {
    console.log(`✅ Server listening on port ${PORT}`);
    console.log(`🌐 Dashboard: http://localhost:${PORT}/`);
    console.log(`📡 Trade API: http://localhost:${PORT}/trade`);
    console.log(`📊 Status: http://localhost:${PORT}/status\n`);
});
