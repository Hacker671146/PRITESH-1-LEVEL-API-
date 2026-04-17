/**
 * 🚀 PRITESH V5 (ULTRA-FAST-ADVANCED) - Node.js Edition
 * WinGo 30S Lottery Prediction Bot
 * Deploy Ready for Render
 */

const axios = require('axios');

// --- SETTINGS ---
const NAME = "PRITESH V5 (ULTRA-FAST-ADVANCED)";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

class PriteshV5 {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.predictionCat = "WAITING";
        this.predictedNums = [0, 5];
    }

    async fetchAPI() {
        try {
            const url = `${API_URL}?ts=${Date.now()}`;
            const headers = { "User-Agent": "Mozilla/5.0" };
            const response = await axios.get(url, { headers, timeout: 5000 });
            
            if (response.status === 200) {
                const js = response.data;
                let dataList = js.data?.list || js.list || [];
                return dataList;
            }
        } catch (error) {
            // Silent fail for retry logic
        }
        return [];
    }

    hybridLogic(data) {
        /**
         * ADVANCED LOGIC UPGRADE:
         * 1. Trend Analysis (Mirror vs Dragon)
         * 2. Recency Weighting (Last 3 rounds matter more)
         * 3. Pivot Number Logic (0 and 5)
         */
        if (!data || data.length < 5) {
            return ["ANALYZING", [1, 6]];
        }

        // Extract last 10 numbers for trend analysis
        const numbers = data.slice(0, 10).map(x => parseInt(x.number || 0));
        const sizes = numbers.map(n => n >= 5 ? "BIG" : "SMALL");

        // --- 1. PATTERN RECOGNITION (DRAGON vs MIRROR) ---
        // Check for Mirror (B-S-B-S pattern in first 4)
        const isMirror = [0, 1, 2].every(i => sizes[i] !== sizes[i + 1]);
        // Check for Dragon (B-B-B-B pattern in first 4)
        const isDragon = [0, 1, 2].every(i => sizes[i] === sizes[i + 1]);

        let finalCat;
        if (isMirror) {
            // If mirror, pick the OPPOSITE of the last one
            finalCat = sizes[0] === "SMALL" ? "BIG" : "SMALL";
        } else if (isDragon) {
            // If dragon, follow the trend (Don't break the streak)
            finalCat = sizes[0];
        } else {
            // Weighted Frequency: Last 3 rounds count as double
            let weightedBig = 0, weightedSmall = 0;
            sizes.forEach((s, i) => {
                const weight = i < 3 ? 2 : 1;
                if (s === "BIG") weightedBig += weight;
                else weightedSmall += weight;
            });
            finalCat = weightedBig >= weightedSmall ? "BIG" : "SMALL";
        }

        // --- 2. ADVANCED NUMBER PICK (PIVOT LOGIC) ---
        const lastVal = numbers[0];
        
        // High Win Mapping based on statistical jumps
        const oppMap = {
            0: [5, 1], 1: [6, 2], 2: [7, 0], 3: [8, 1], 4: [9, 2],
            5: [0, 6], 6: [1, 7], 7: [2, 8], 8: [3, 9], 9: [4, 5]
        };
        
        let finalNums;
        // If 0 or 5 appeared, they usually indicate a trend reversal
        if (lastVal === 0) {
            finalNums = [5, 7]; // 0 usually jumps to Big
        } else if (lastVal === 5) {
            finalNums = [0, 2]; // 5 usually jumps to Small
        } else {
            finalNums = oppMap[lastVal] || [2, 8];
        }

        return [finalCat, finalNums];
    }

    tracker(actualNum, issue) {
        const actCat = parseInt(actualNum) >= 5 ? "BIG" : "SMALL";
        // Check if Category Win OR Specific Number Win
        const isWin = (this.predictionCat === actCat) || 
                      this.predictedNums.includes(parseInt(actualNum));
        
        this.total += 1;
        if (isWin) this.wins += 1;
        
        const acc = (this.wins / this.total) * 100;
        
        console.log(`\n${'='.repeat(45)}`);
        console.log(` ${NAME} | RESULT`);
        console.log(`${'='.repeat(45)}`);
        console.log(`PERIOD    : ${issue}`);
        console.log(`AI PREDICT: ${this.predictionCat} | NUMS: [${this.predictedNums.join(', ')}]`);
        console.log(`ACTUAL    : ${actualNum} (${actCat})`);
        console.log(`RESULT    : ${isWin ? '✅ WIN' : '❌ LOSS'}`);
        console.log(`ACCURACY  : ${acc.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log(`${'='.repeat(45)}\n`);
    }

    async run() {
        console.log(`🚀 ${NAME} STARTING...`);
        
        const poll = async () => {
            const data = await this.fetchAPI();
            
            if (!data || data.length === 0) {
                process.stdout.write("Data fetching error... retrying\r");
                setTimeout(poll, 2000);
                return;
            }
            
            const item = data[0];
            const issue = item.issue || item.issueNumber;
            const num = item.number;

            if (!issue || num === undefined || num === null) {
                setTimeout(poll, 1000);
                return;
            }

            // Check result for tracked issue
            if (this.targetIssue === issue) {
                this.tracker(num, issue);
                this.targetIssue = null;
            }

            // Generate prediction for next issue
            const nextP = String(parseInt(issue) + 1);
            
            if (this.targetIssue !== nextP) {
                [this.predictionCat, this.predictedNums] = this.hybridLogic(data);
                this.targetIssue = nextP;
                
                const t = new Date().toLocaleTimeString('en-GB');
                process.stdout.write(`[${t}] NEXT: ${nextP} | AI: ${this.predictionCat} | PICK: [${this.predictedNums.join(', ')}]\r`);
            }

            // Faster polling for 30S game
            setTimeout(poll, 1000);
        };

        // Start polling loop
        poll();
    }
}

// --- SERVER START ---
if (require.main === module) {
    const bot = new PriteshV5();
    bot.run();
}

// Export for testing/other modules
module.exports = { PriteshV5 };
