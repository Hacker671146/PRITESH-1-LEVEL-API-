const axios = require('axios');

// --- CONFIGURATION ---
const NAME = "RUSHI AI | QUANTUM 3.0"; // Updated per latest project branding
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

class QuantumDeepAI {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.prediction = null;
        this.numbers = [];
        this.currentLevel = 1;
        this.maxLevels = 3;
        this.multipliers = [1, 3, 9];
        this.weights = [0.25, 0.20, 0.15, 0.10, 0.10, 0.05, 0.05, 0.04, 0.03, 0.03];
        this.bias = 0.5;
    }

    async fetchApi() {
        try {
            // Added timestamp to URL to prevent cached results
            const url = `${API_URL}?ts=${Date.now()}`;
            const response = await axios.get(url, {
                headers: { 
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json"
                },
                timeout: 8000
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
        if (!data || data.length < 10) return { cat: "WAITING", pick: [1, 6] };

        // Process inputs: Big (1) vs Small (0)
        const inputs = data.slice(0, 10).map(x => (parseInt(x.number) >= 5 ? 1 : 0));
        
        let dotProduct = this.bias;
        for (let i = 0; i < 10; i++) {
            dotProduct += inputs[i] * this.weights[i];
        }
        
        const prob = this.sigmoid(dotProduct);
        const cat = prob < 0.5 ? "BIG" : "SMALL";

        // Opposite Strategy Number Mapping
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
        const win = (this.prediction === actCat) || (this.numbers.includes(parseInt(num)));
        
        this.total += 1;
        let status;
        if (win) {
            this.wins += 1;
            status = "✅ WIN";
            this.currentLevel = 1;
        } else {
            status = "❌ LOSS";
            this.currentLevel = (this.currentLevel < this.maxLevels) ? this.currentLevel + 1 : 1;
        }

        const acc = (this.wins / this.total) * 100;
        
        console.log(`\n=============================================`);
        console.log(` ${NAME} | STATUS UPDATE`);
        console.log(`=============================================`);
        console.log(`PERIOD    : ${issue}`);
        console.log(`PREDICT   : ${this.prediction} | PICK: ${this.numbers.join(',')}`);
        console.log(`ACTUAL    : ${num} (${actCat})`);
        console.log(`RESULT    : ${status}`);
        console.log(`LEVEL     : L${this.currentLevel} (${this.multipliers[this.currentLevel-1]}x)`);
        console.log(`ACCURACY  : ${acc.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log(`=============================================\n`);
    }

    async run() {
        process.stdout.write(`\x1b[2J\x1b[0;0H`); // Clear screen
        console.log(`🚀 ${NAME} ACTIVATED`);

        while (true) {
            const data = await this.fetchApi();
            if (data && data.length > 0) {
                const item = data[0];
                const issue = (item.issue || item.issueNumber).toString();
                const num = item.number;

                if (this.targetIssue === issue) {
                    this.tracker(num, issue);
                    this.targetIssue = null;
                }

                // FIXED: Using BigInt to safely increment long period IDs
                const nextP = (BigInt(issue) + 1n).toString();
                if (this.targetIssue !== nextP) {
                    const res = this.deepQuantumPredict(data);
                    this.prediction = res.cat;
                    this.numbers = res.pick;
                    this.targetIssue = nextP;
                    
                    const t = new Date().toLocaleTimeString();
                    process.stdout.write(`[${t}] NEXT: ${nextP} | AI: ${this.prediction} | PICK: ${this.numbers}\r`);
                }
            }
            await new Promise(r => setTimeout(r, 3000)); // 3-second delay
        }
    }
}

const bot = new QuantumDeepAI();
bot.run();
