const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const BOT_NAME = "PRITESH V5 ULTRA-FAST";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

class PredictionEngine {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.predictionCat = "WAITING";
        this.predictedNums = [0, 5];
        this.accuracy = 0;
        this.lastResult = null;
    }

    async fetchRawData() {
        try {
            const response = await axios.get(`${API_URL}?t=${Date.now()}`, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 6000
            });
            return response.data?.data?.list || response.data?.list || [];
        } catch (err) {
            return [];
        }
    }

    calculateLogic(data) {
        if (!data || data.length < 2) return { cat: "WAITING", nums: [1, 6] };

        // 1. Frequency Analysis (Last 15 rounds)
        const recent = data.slice(0, 15);
        let bigs = 0;
        recent.forEach(item => { if (parseInt(item.number) >= 5) bigs++; });
        
        const finalCat = bigs >= (recent.length / 2) ? "BIG" : "SMALL";

        // 2. Specialized Number Mapping
        const lastNum = parseInt(data[0].number);
        const map = {
            0: [5, 8], 1: [6, 9], 2: [8, 0], 3: [7, 1], 4: [6, 2],
            5: [0, 3], 6: [1, 4], 7: [3, 9], 8: [2, 5], 9: [4, 7]
        };
        
        return { cat: finalCat, nums: map[lastNum] || [2, 8] };
    }

    updateTracker(actual, issue) {
        const actualCat = parseInt(actual) >= 5 ? "BIG" : "SMALL";
        const won = (this.predictionCat === actualCat) || (this.predictedNums.includes(parseInt(actual)));

        this.total++;
        if (won) this.wins++;
        this.accuracy = (this.wins / this.total) * 100;
        
        this.lastResult = {
            issue,
            actual,
            status: won ? "WIN ✅" : "LOSS ❌",
            time: new Date().toLocaleTimeString()
        };

        console.log(`\n[${this.lastResult.time}] PERIOD: ${issue} | ACTUAL: ${actual} | ${this.lastResult.status}`);
        console.log(`ACCURACY: ${this.accuracy.toFixed(2)}% | TOTAL: ${this.total}\n`);
    }

    async run() {
        console.log(`\n🚀 ${BOT_NAME} IS RUNNING...`);
        setInterval(async () => {
            const data = await this.fetchRawData();
            if (!data || data.length === 0) return;

            const latest = data[0];
            const currentIssue = latest.issue || latest.issueNumber;
            const currentNum = latest.number;

            // Check if result matches our prediction
            if (this.targetIssue === currentIssue) {
                this.updateTracker(currentNum, currentIssue);
                this.targetIssue = null;
            }

            // Generate Next Prediction
            const nextIssue = (parseInt(currentIssue) + 1).toString();
            if (this.targetIssue !== nextIssue) {
                const result = this.calculateLogic(data);
                this.predictionCat = result.cat;
                this.predictedNums = result.nums;
                this.targetIssue = nextIssue;
                
                process.stdout.write(`PREDICTING: ${nextIssue} | AI: ${this.predictionCat} | PICK: ${this.predictedNums}\r`);
            }
        }, 2000);
    }
}

const bot = new PredictionEngine();
bot.run();

// --- RENDER WEB INTERFACE ---
app.get('/', (req, res) => {
    res.send(`
        <body style="background:#0f0f1a; color:white; font-family:sans-serif; text-align:center; padding-top:50px;">
            <h1>${BOT_NAME} ACTIVE</h1>
            <div style="font-size:20px; border:1px solid #333; display:inline-block; padding:20px; border-radius:10px;">
                <p>Status: <span style="color:#10B981;">Online</span></p>
                <p>Accuracy: ${bot.accuracy.toFixed(2)}%</p>
                <p>Total Rounds: ${bot.total}</p>
                <p>Next: ${bot.targetIssue} -> <b>${bot.predictionCat}</b></p>
            </div>
        </body>
    `);
});

app.listen(PORT, () => console.log(`Dashboard running on port ${PORT}`));
