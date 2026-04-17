const axios = require('axios');
const http = require('http');

const NAME = "PRITESH QUANTUM AI 3.0";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

class QuantumDeepAI {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.prediction = null;
        this.numbers = [];
        
        // 3-LEVEL MARTINGALE FIX
        this.currentLevel = 1;
        this.maxLevels = 3;
        this.multipliers = [1, 3, 9];
        
        // DEEP LEARNING WEIGHTS
        this.weights = [0.25, 0.20, 0.15, 0.10, 0.10, 0.05, 0.05, 0.04, 0.03, 0.03];
        this.bias = 0.5;
    }

    async fetchAPI() {
        try {
            const url = `${API_URL}?ts=${Date.now()}`;
            const res = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 10000
            });
            const js = res.data;
            return js.data?.list || js.list || [];
        } catch (e) {
            return [];
        }
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    deepQuantumPredict(data) {
        if (!data || data.length < 10) {
            return ["WAITING", [1, 6]];
        }

        // Neural Input: Big (1) vs Small (0)
        const inputs = data.slice(0, 10).map(x => {
            const num = parseInt(x.number, 10);
            return num >= 5 ? 1 : 0;
        });

        // Activation Calculation
        const dotProduct = inputs.reduce((sum, val, idx) => sum + val * this.weights[idx], 0) + this.bias;
        const prob = this.sigmoid(dotProduct);
        const cat = prob < 0.5 ? "BIG" : "SMALL";

        // 2 NUMBER PICK (OPPOSITE STRATEGY)
        const lastNum = parseInt(data[0].number, 10);
        const oppMap = {
            0:[5,8], 1:[6,9], 2:[8,0], 3:[7,1], 4:[6,2],
            5:[0,3], 6:[1,4], 7:[2,5], 8:[3,6], 9:[4,7]
        };
        const pick = oppMap[lastNum] || [2, 8];

        return [cat, pick];
    }

    tracker(num, issue) {
        const actCat = parseInt(num, 10) >= 5 ? "BIG" : "SMALL";
        const win = (this.prediction === actCat) || this.numbers.includes(parseInt(num, 10));

        this.total++;
        let status;
        if (win) {
            this.wins++;
            status = "✅ WIN";
            this.currentLevel = 1; // Reset to Level 1
        } else {
            status = "❌ LOSS";
            if (this.currentLevel < this.maxLevels) {
                this.currentLevel++;
            } else {
                this.currentLevel = 1; // Safety Reset after L3
            }
        }

        const acc = (this.wins / this.total) * 100;

        console.log(`\n${"=".repeat(45)}`);
        console.log(` ${NAME} | QUANTUM STATUS `);
        console.log(`${"=".repeat(45)}`);
        console.log(`PERIOD    : ${issue}`);
        console.log(`PREDICT   : ${this.prediction} | PICK: [${this.numbers}]`);
        console.log(`ACTUAL    : ${num} (${actCat})`);
        console.log(`RESULT    : ${status}`);
        console.log(`LEVEL     : ${this.currentLevel} (${this.multipliers[this.currentLevel - 1]}x)`);
        console.log(`ACCURACY  : ${acc.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log(`${"=".repeat(45)}\n`);
    }

    async run() {
        console.clear();
        console.log(`🚀 ${NAME} ACTIVATED`);
        console.log("Deep Learning Logic: 3-Level Fix Enabled");

        while (true) {
            const data = await this.fetchAPI();
            if (!data || data.length === 0) {
                await new Promise(res => setTimeout(res, 2000));
                continue;
            }

            const item = data[0];
            const issue = item.issue || item.issueNumber;
            const num = item.number;

            if (!issue || num === undefined || num === null) continue;

            // If result of target issue is out, track it
            if (this.targetIssue === issue) {
                this.tracker(num, issue);
                this.targetIssue = null;
            }

            // Generate next prediction
            const nextP = String(parseInt(issue, 10) + 1);
            if (this.targetIssue !== nextP) {
                [this.prediction, this.numbers] = this.deepQuantumPredict(data);
                this.targetIssue = nextP;

                const t = new Date().toLocaleTimeString('en-GB');
                process.stdout.write(`\r[${t}] NEXT: ${nextP} | AI: ${this.prediction} | PICK: [${this.numbers}]`);
            }

            await new Promise(res => setTimeout(res, 3000));
        }
    }
}

// Initialize & Run Bot
const bot = new QuantumDeepAI();
bot.run();

// 🌐 KEEP RENDER ALIVE: HTTP Server to prevent free-tier spin-down
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('PRITESH QUANTUM AI 3.0 is running');
}).listen(PORT, () => {
    console.log(`🌐 Web Server listening on port ${PORT} (Render Keep-Alive)`);
});
