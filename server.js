import axios from 'axios';
import colors from 'colors';
import { setTimeout } from 'timers/promises';

const NAME = "PRITESH V5 (ULTRA-FAST-ADVANCED)";
const API_BASE = "https://indialotteryapi.com/wp-json/wingo/v1";

class PriteshV5 {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.predictionCat = "WAITING";
        this.predictedNums = [0, 5];
        this.history = [];   // Store recent results
    }

    async fetchApi() {
        try {
            // Get latest history + next prediction
            const [historyRes, predictRes] = await Promise.all([
                axios.get(`${API_BASE}/predict?market=0.5&n=10`, { timeout: 8000 }),
                axios.get(`${API_BASE}/predict?market=0.5`, { timeout: 8000 })
            ]);

            const history = historyRes.data?.history || historyRes.data || [];
            const nextPred = predictRes.data;

            if (history.length > 0) {
                this.history = history;
                return { history, nextPred };
            }
            return null;
        } catch (err) {
            console.log(`❌ API Error: ${err.message}`.red);
            return null;
        }
    }

    hybridLogic(history) {
        if (!history || history.length < 5) {
            return ["ANALYZING", [1, 6]];
        }

        const numbers = history.slice(0, 10).map(item => parseInt(item.number || item.result || 0));
        const sizes = numbers.map(n => n >= 5 ? "BIG" : "SMALL");

        // Pattern detection
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

        // Number selection logic
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

        const acc = this.total > 0 ? (this.wins / this.total) * 100 : 0;

        console.log("\n" + "=".repeat(60));
        console.log(` ${NAME} | RESULT `.bgCyan.black);
        console.log("=".repeat(60));
        console.log(` PERIOD    : ${issue}`);
        console.log(` AI PREDICT: ${this.predictionCat} | NUMS: ${this.predictedNums}`);
        console.log(` ACTUAL    : \( {actualNum} ( \){actCat})`);
        console.log(` RESULT    : ${isWin ? '✅ WIN'.green : '❌ LOSS'.red}`);
        console.log(` ACCURACY  : ${acc.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log("=".repeat(60) + "\n");
    }

    async run() {
        console.log(`🚀 ${NAME} STARTING...`.cyan.bold);
        console.log("Connecting to WinGo 30S Public API...\n".yellow);

        while (true) {
            const apiData = await this.fetchApi();

            if (!apiData) {
                process.stdout.write("❌ API Not Responding | Retrying in 4s...\r".red);
                await setTimeout(4000);
                continue;
            }

            const { history, nextPred } = apiData;
            const latest = history[0];
            const issue = latest?.period || latest?.issue;
            const actualNum = latest?.number || latest?.result;

            if (!issue || actualNum === undefined) {
                await setTimeout(1000);
                continue;
            }

            // Check result for previous prediction
            if (this.targetIssue === issue) {
                this.tracker(actualNum, issue);
                this.targetIssue = null;
            }

            // Make prediction for next period
            const nextIssue = nextPred?.period || String(Number(issue) + 1);

            if (this.targetIssue !== nextIssue) {
                const [cat, nums] = this.hybridLogic(history);
                this.predictionCat = cat;
                this.predictedNums = nums;
                this.targetIssue = nextIssue;

                const t = new Date().toLocaleTimeString('en-IN', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                });

                process.stdout.write(`[${t}] NEXT: ${nextIssue} | AI: ${cat.padEnd(5)} | PICK: ${nums}     \r`.cyan);
            }

            await setTimeout(800);
        }
    }
}

// Start Bot
const bot = new PriteshV5();
bot.run().catch(err => {
    console.error("\n❌ Bot Crashed:".red, err.message);
});
