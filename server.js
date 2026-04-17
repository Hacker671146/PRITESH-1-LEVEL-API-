const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const BOT_NAME = "PRITESH V5 PRO-FIX";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

class PredictionEngine {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.predictionCat = "WAITING..."; 
        this.predictedNums = [];
        this.accuracy = 0;
        this.history = [];
    }

    async fetchApi() {
        try {
            const res = await axios.get(`${API_URL}?t=${Date.now()}`, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 5000
            });
            return res.data?.data?.list || res.data?.list || [];
        } catch (e) { return []; }
    }

    // --- FIX: 2-3 LEVEL PATTERN LOGIC ---
    analyzeLogic(data) {
        if (!data || data.length < 5) return { cat: "BIG", nums: [1, 6] };

        const last5 = data.slice(0, 5).map(item => parseInt(item.number) >= 5 ? 'B' : 'S');
        const lastNum = parseInt(data[0].number);
        
        let pCat = "";
        // Level 2-3 Pattern Detection
        if (last5[0] === last5[1]) {
            // Agar pichle 2 same hain (BB ya SS), toh 3rd level par break pattern logic
            pCat = last5[0] === 'B' ? "SMALL" : "BIG";
        } else {
            // Agar alternate chal raha hai (BS ya SB), toh trend follow logic
            pCat = last5[0] === 'B' ? "BIG" : "SMALL";
        }

        // Optimized Number Mapping
        const numMap = {
            0: [5, 2], 1: [6, 3], 2: [8, 4], 3: [7, 9], 4: [6, 1],
            5: [0, 7], 6: [1, 2], 7: [3, 8], 8: [2, 9], 9: [4, 0]
        };

        return { cat: pCat, nums: numMap[lastNum] || [0, 5] };
    }

    async start() {
        console.log(`🚀 ${BOT_NAME} STARTED...`);
        
        setInterval(async () => {
            const data = await this.fetchApi();
            if (!data || data.length === 0) return;

            const latest = data[0];
            const issue = latest.issue || latest.issueNumber;
            const num = latest.number;

            // Result Tracking
            if (this.targetIssue === issue) {
                const actCat = parseInt(num) >= 5 ? "BIG" : "SMALL";
                const isWin = (this.predictionCat === actCat);
                
                this.total++;
                if (isWin) this.wins++;
                this.accuracy = (this.wins / this.total) * 100;
                this.targetIssue = null;
                console.log(`\n[RESULT] Period: ${issue} | Actual: ${num} | ${isWin ? '✅ WIN' : '❌ LOSS'}`);
            }

            // Next Prediction Generation
            const nextIssue = (parseInt(issue) + 1).toString();
            if (this.targetIssue !== nextIssue) {
                const pred = this.analyzeLogic(data);
                this.predictionCat = pred.cat;
                this.predictedNums = pred.nums;
                this.targetIssue = nextIssue;
                
                process.stdout.write(`\r[LIVE] Next: ${nextIssue} | AI: ${this.predictionCat} | Nums: ${this.predictedNums}   `);
            }
        }, 1500); // Fast interval to remove "Waiting"
    }
}

const bot = new PredictionEngine();
bot.start();

app.get('/', (req, res) => {
    res.send(`
        <body style="background:#0a0a12; color:white; font-family:sans-serif; text-align:center; padding:50px;">
            <h1 style="color:#7C3AED;">${BOT_NAME}</h1>
            <div style="background:#161625; padding:30px; border-radius:20px; display:inline-block; border:1px solid #333;">
                <h2 style="margin:0; color:#bbb;">NEXT PERIOD</h2>
                <div style="font-size:40px; font-weight:bold; margin:15px 0;">${bot.targetIssue || 'LOADING...'}</div>
                <div style="font-size:30px; color:${bot.predictionCat === 'BIG' ? '#EF4444' : '#10B981'}; letter-spacing:5px;">
                    ${bot.predictionCat}
                </div>
                <hr style="border:0; border-top:1px solid #333; margin:20px 0;">
                <p>Accuracy: ${bot.accuracy.toFixed(2)}% | Total: ${bot.total}</p>
                <p style="color:#71717A;">Numbers: ${bot.predictedNums.join(', ')}</p>
            </div>
            <script>setTimeout(() => location.reload(), 5000);</script>
        </body>
    `);
});

app.listen(PORT, () => console.log(`Server on ${PORT}`));
