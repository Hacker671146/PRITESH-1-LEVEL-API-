import axios from 'axios';
import colors from 'colors';
import { setTimeout } from 'timers/promises';

const NAME = "PRITESH V5 (ULTRA-FAST-ADVANCED)";

// Try multiple possible API endpoints (common in these games)
const API_BASES = [
    "https://draw.ar-lottery01.com",
    "https://www.ar-lottery01.com",
    "https://ar-lottery01.com"
];

const ENDPOINT = "/WinGo/WinGo_30S/GetHistoryIssuePage.json";

class PriteshV5 {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.predictionCat = "WAITING";
        this.predictedNums = [0, 5];
        this.currentApiUrl = null;
    }

    async fetchApi() {
        for (const base of API_BASES) {
            try {
                const url = `\( {base} \){ENDPOINT}?ts=${Date.now()}`;
                const { data } = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
                    timeout: 8000
                });

                let list = data?.data?.list || data?.list || [];
                if (list.length > 0) {
                    this.currentApiUrl = base;  // Save working base
                    return list;
                }
            } catch (err) {
                // Silent try next base
            }
        }
        return [];
    }

    hybridLogic(data) {
        if (!data || data.length < 5) {
            return ["ANALYZING", [1, 6]];
        }

        const numbers = data.slice(0, 10).map(item => parseInt(item.number || item.Number || 0));
        const sizes = numbers.map(n => n >= 5 ? "BIG" : "SMALL");

        const isMirror = sizes.slice(0, 4).every((s, i, arr) => i < 3 && s !== arr[i + 1]);
        const isDragon = sizes.slice(0, 4).every((s, i, arr) => i < 3 && s === arr[i + 1]);

        let finalCat;
        if (isMirror) {
            finalCat = sizes[0] === "SMALL" ? "BIG" : "SMALL";
        } else if (isDragon) {
            finalCat = sizes[0];
        } else {
            const weightedBig = sizes.reduce((sum, s, i) => sum + (s === "BIG" ? (i < 3 ? 2 : 1) : 0), 0);
            const weightedSmall = sizes.reduce((sum, s, i) => sum + (s === "SMALL" ? (i < 3 ? 2 : 1) : 0), 0);
            finalCat = weightedBig >= weightedSmall ? "BIG" : "SMALL";
        }

        const lastVal = numbers[0];
        const oppMap = {
            0: [5, 1], 1: [6, 2], 2: [7, 0], 3: [8, 1], 4: [9, 2],
            5: [0, 6], 6: [1, 7], 7: [2, 8], 8: [3, 9], 9: [4, 5]
        };

        let finalNums = lastVal === 0 ? [5, 7] : 
                       lastVal === 5 ? [0, 2] : 
                       (oppMap[lastVal] || [2, 8]);

        return [finalCat, finalNums];
    }

    tracker(actualNum, issue) {
        const actCat = parseInt(actualNum) >= 5 ? "BIG" : "SMALL";
        const isWin = (this.predictionCat === actCat) || this.predictedNums.includes(parseInt(actualNum));

        this.total++;
        if (isWin) this.wins++;

        const acc = this.total ? (this.wins / this.total) * 100 : 0;

        console.log("\n" + "=".repeat(55));
        console.log(` ${NAME} | RESULT `.bgCyan.black);
        console.log("=".repeat(55));
        console.log(` PERIOD    : ${issue}`);
        console.log(` AI PREDICT: ${this.predictionCat} | NUMS: ${this.predictedNums}`);
        console.log(` ACTUAL    : \( {actualNum} ( \){actCat})`);
        console.log(` RESULT    : ${isWin ? '✅ WIN'.green : '❌ LOSS'.red}`);
        console.log(` ACCURACY  : ${acc.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log("=".repeat(55) + "\n");
    }

    async run() {
        console.log(`🚀 ${NAME} STARTING...`.cyan.bold);
        console.log("Trying to find working API...".yellow);

        while (true) {
            const data = await this.fetchApi();

            if (!data || data.length === 0) {
                process.stdout.write("❌ API Not Found | Retrying different endpoints...\r".red);
                await setTimeout(3000);
                continue;
            }

            const item = data[0];
            const issue = item.issue || item.issueNumber || item.period;
            const num = item.number || item.Number;

            if (!issue || num === undefined) {
                await setTimeout(1000);
                continue;
            }

            // Check previous prediction result
            if (this.targetIssue === issue) {
                this.tracker(num, issue);
                this.targetIssue = null;
            }

            // Predict for next issue
            const nextIssue = String(Number(issue) + 1);

            if (this.targetIssue !== nextIssue) {
                const [cat, nums] = this.hybridLogic(data);
                this.predictionCat = cat;
                this.predictedNums = nums;
                this.targetIssue = nextIssue;

                const t = new Date().toLocaleTimeString('en-IN', { 
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false 
                });

                process.stdout.write(
                    `[${t}] NEXT: ${nextIssue} | AI: ${cat.padEnd(5)} | PICK: ${nums}     \r`.cyan
                );
            }

            await setTimeout(900);
        }
    }
}

// Start Bot
const bot = new PriteshV5();
bot.run().catch(err => {
    console.error("Bot Error:".red, err.message);
});
