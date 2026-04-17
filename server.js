const axios = require('axios');
const readline = require('readline');

// --- CONFIGURATION ---
const NAME = "PRITESH QUANTUM AI 3.0 (Node Edition)";
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

    async fetchApi() {
        try {
            const url = `${API_URL}?ts=${Date.now()}`;
            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 10000
            });
            const js = response.data;
            return js.data?.list || js.list || [];
        } catch (error) {
            return [];
        }
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
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
            0:[5,8], 1:[6,9], 2:[8,0], 3:[7,1], 4:[6,2],
            5:[0,3], 6:[1,4], 7:[2,5], 8:[3,6], 9:[4,7]
        };
        const pick = oppMap[lastNum] || [2, 8];
        
        return { cat, pick };
    }

    tracker(num, issue) {
        const actCat = parseInt(num) >= 5 ? "BIG" : "SMALL";
        // Win Condition: Category Hit OR Number Hit
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
        console.log(`PREDICT   : ${this.prediction} | PICK: ${this.numbers.join(',')}`);
        console.log(`ACTUAL    : ${num} (${actCat})`);
        console.log(`RESULT    : ${status}`);
        console.log(`LEVEL     : ${this.currentLevel} (${this.multipliers[this.currentLevel-1]}x)`);
        console.log(`ACCURACY  : ${acc.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log(`${'='.repeat(45)}\n`);
    }

    async run() {
        console.clear();
        console.log(`🚀 ${NAME} ACTIVATED`);
        console.log("Deep Learning Logic: 3-Level Node.js Port");

        while (true) {
            const data = await this.fetchApi();
            if (!data || data.length === 0) {
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            const item = data[0];
            const issue = item.issue || item.issueNumber;
            const num = item.number;

            if (!issue || num === undefined) continue;

            if (this.targetIssue === issue) {
                this.tracker(num, issue);
                this.targetIssue = null;
            }

            const nextP = (BigInt(issue) + 1n).toString();
            if (this.targetIssue !== nextP) {
                const result = this.deepQuantumPredict(data);
                this.prediction = result.cat;
                this.numbers = result.pick;
                this.targetIssue = nextP;
                
                const t = new Date().toLocaleTimeString();
                process.stdout.write(`[${t}] NEXT: ${nextP} | AI: ${this.prediction} | PICK: ${this.numbers} \r`);
            }

            await new Promise(r => setTimeout(r, 3000));
        }
    }
}

const bot = new QuantumDeepAI();
bot.run();
