const axios = require('axios');
const express = require('express');
const app = express();

// --- CONFIGURATION ---
const NAME = "PRITESH QUANTUM AI 3.0";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
const PORT = process.env.PORT || 3000;

class QuantumDeepAI {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.prediction = null;
        this.numbers = [];
        
        // --- 3-LEVEL MARTINGALE ---
        this.currentLevel = 1;
        this.maxLevels = 3;
        this.multipliers = [1, 3, 9];
        
        // --- DEEP LEARNING WEIGHTS ---
        this.weights = [0.25, 0.20, 0.15, 0.10, 0.10, 0.05, 0.05, 0.04, 0.03, 0.03];
        this.bias = 0.5;
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    async fetchApi() {
        try {
            const url = `${API_URL}?ts=${Date.now()}`;
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 10000
            });
            const data = response.data;
            return data.data?.list || data.list || [];
        } catch (error) {
            return [];
        }
    }

    deepQuantumPredict(data) {
        if (!data || data.length < 10) {
            return { cat: "WAITING", pick: [1, 6] };
        }

        // Neural Input: Big (1) vs Small (0)
        const inputs = data.slice(0, 10).map(x => (parseInt(x.number) >= 5 ? 1 : 0));
        
        // Activation Calculation (Dot Product)
        let dotProduct = this.bias;
        for (let i = 0; i < 10; i++) {
            dotProduct += inputs[i] * this.weights[i];
        }

        const prob = this.sigmoid(dotProduct);

        // Predict Category (Opposite Trend Logic)
        const cat = prob < 0.5 ? "BIG" : "SMALL";

        // --- 2 NUMBER PICK (OPPOSITE STRATEGY) ---
        const lastNum = parseInt(data[0].number);
        const oppMap = {
            0: [5, 8], 1: [6, 9], 2: [8, 0], 3: [7, 1], 4: [6, 2],
            5: [0, 3], 6: [1, 4], 7: [2, 5], 8: [3, 6], 9: [4, 7]
        };
        const pick = oppMap[lastNum] || [2, 8];
        
        return { cat, pick };
    }

    tracker(num, issue) {
        const actCat = parseInt(num) >= 5 ? "BIG" : "SMALL";
        const win = (this.prediction === actCat) || (this.numbers.includes(parseInt(num)));
        
        this.total += 1;
        let status;
        if (win) {
            this.wins += 1;
            status = "✅ WIN";
            this.currentLevel = 1;
        } else {
            status = "❌ LOSS";
            if (this.currentLevel < this.maxLevels) {
                this.currentLevel += 1;
            } else {
                this.currentLevel = 1;
            }
        }

        const acc = (this.wins / this.total) * 100;
        
        console.log(`\n${'='.repeat(45)}`);
        console.log(` ${NAME} | QUANTUM STATUS`);
        console.log(`${'='.repeat(45)}`);
        console.log(`PERIOD    : ${issue}`);
        console.log(`PREDICT   : ${this.prediction} | PICK: ${this.numbers}`);
        console.log(`ACTUAL    : ${num} (${actCat})`);
        console.log(`RESULT    : ${status}`);
        console.log(`LEVEL     : ${this.currentLevel} (${this.multipliers[this.currentLevel-1]}x)`);
        console.log(`ACCURACY  : ${acc.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log(`${'='.repeat(45)}\n`);
    }

    async run() {
        console.log(`🚀 ${NAME} ACTIVATED ON RENDER`);
        
        setInterval(async () => {
            const data = await this.fetchApi();
            if (!data || data.length === 0) return;
            
            const item = data[0];
            const issue = item.issue || item.issueNumber;
            const num = item.number;

            if (!issue || num === undefined) return;

            // Track result if target issue is met
            if (this.targetIssue === issue) {
                this.tracker(num, issue);
                this.targetIssue = null;
            }

            // Generate next prediction
            const nextP = (BigInt(issue) + 1n).toString();
            if (this.targetIssue !== nextP) {
                const result = this.deepQuantumPredict(data);
                this.prediction = result.cat;
                this.numbers = result.pick;
                this.targetIssue = nextP;
                
                const time = new Date().toLocaleTimeString();
                process.stdout.write(`[${time}] NEXT: ${nextP} | AI: ${this.prediction} | PICK: ${this.numbers}\r`);
            }
        }, 3000);
    }
}

// Start the AI
const bot = new QuantumDeepAI();
bot.run();

// Basic Express route to keep Render alive
app.get('/', (req, res) => {
    res.send(`${NAME} is running perfectly.`);
});

app.listen(PORT, () => {
    console.log(`Web Server started on port ${PORT}`);
});
