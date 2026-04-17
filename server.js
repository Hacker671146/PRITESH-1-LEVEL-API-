import axios from 'axios';
import colors from 'colors';
import { setTimeout } from 'timers/promises';

const NAME = "PRITESH V5 (ULTRA-FAST-ADVANCED)";

class PriteshV5 {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.predictionCat = "WAITING";
        this.predictedNums = [0, 5];
    }

    async fetchApi() {
        const possibleUrls = [
            "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json",
            "https://ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json",
            "https://www.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json"
        ];

        for (const baseUrl of possibleUrls) {
            try {
                const url = `\( {baseUrl}?ts= \){Date.now()}`;
                console.log(`Trying: ${baseUrl}`.yellow); // Debug ke liye

                const { data } = await axios.get(url, {
                    headers: { "User-Agent": "Mozilla/5.0" },
                    timeout: 10000
                });

                const list = data?.data?.list || data?.list || [];
                if (list.length > 0) {
                    console.log(`✅ Working API found: ${baseUrl}`.green);
                    return list;
                }
            } catch (err) {
                // Try next
            }
        }
        return [];
    }

    // hybridLogic, tracker, run() same rakh sakte ho (pehle wale code se copy kar lo)

    hybridLogic(data) {
        if (!data || data.length < 5) {
            return ["ANALYZING", [1, 6]];
        }

        const numbers = data.slice(0, 10).map(item => parseInt(item.number || item.Number || 0));
        const sizes = numbers.map(n => n >= 5 ? "BIG" : "SMALL");

        const isMirror = sizes.slice(0, 4).every((s, i, arr) => i < 3 && s !== arr[i + 1]);
        const isDragon = sizes.slice(0, 4).every((s, i, arr) => i < 3 && s === arr[i + 1]);

        let finalCat = "BIG";
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
        const oppMap = {0:[5,1],1:[6,2],2:[7,0],3:[8,1],4:[9,2],5:[0,6],6:[1,7],7:[2,8],8:[3,9],9:[4,5]};
        let finalNums = lastVal === 0 ? [5,7] : lastVal === 5 ? [0,2] : (oppMap[lastVal] || [2,8]);

        return [finalCat, finalNums];
    }

    tracker(actualNum, issue) {
        const actCat = parseInt(actualNum) >= 5 ? "BIG" : "SMALL";
        const isWin = (this.predictionCat === actCat) || this.predictedNums.includes(parseInt(actualNum));

        this.total++;
        if (isWin) this.wins++;

        const acc = (this.wins / this.total) * 100;

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
        console.log("Searching for working WinGo 30S API...".yellow);

        while (true) {
            const data = await this.fetchApi();

            if (!data || data.length === 0) {
                process.stdout.write("❌ API Not Found - Old endpoint dead. Retrying...\r".red);
                await setTimeout(4000);
                continue;
            }

            const item = data[0];
            const issue = item.issue || item.issueNumber || item.period;
            const num = item.number || item.Number;

            if (!issue || num === undefined) {
                await setTimeout(1000);
                continue;
            }

            if (this.targetIssue === issue) {
                this.tracker(num, issue);
                this.targetIssue = null;
            }

            const nextIssue = String(Number(issue) + 1);

            if (this.targetIssue !== nextIssue) {
                const [cat, nums] = this.hybridLogic(data);
                this.predictionCat = cat;
                this.predictedNums = nums;
                this.targetIssue = nextIssue;

                const t = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                process.stdout.write(`[${t}] NEXT: ${nextIssue} | AI: ${cat} | PICK: ${nums}     \r`.cyan);
            }

            await setTimeout(900);
        }
    }
}

const bot = new PriteshV5();
bot.run().catch(err => console.error("Bot crashed:".red, err.message));
