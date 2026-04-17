const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// --- SETTINGS ---
const NAME = "PRITESH V5 (ULTRA-FAST) JS";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

class PriteshV5 {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.target_issue = null;
        this.prediction_cat = "WAITING";
        this.predicted_nums = [0, 5];
        this.accuracy = 0;
    }

    async fetchApi() {
        try {
            const url = `${API_URL}?ts=${Date.now()}`;
            const response = await axios.get(url, { 
                headers: { "User-Agent": "Mozilla/5.0" },
                timeout: 5000 
            });
            
            let dataList = response.data?.data?.list || response.data?.list || [];
            return dataList;
        } catch (error) {
            console.error("API Fetch Error:", error.message);
            return [];
        }
    }

    hybridLogic(data) {
        if (!data || data.length < 2) {
            return { cat: "ANALYZING", nums: [1, 6] };
        }

        // --- BIG/SMALL FREQUENCY (Last 15) ---
        const limit = Math.min(data.length, 15);
        const recentData = data.slice(0, limit);
        
        let bigCount = 0;
        recentData.forEach(item => {
            if (parseInt(item.number) >= 5) bigCount++;
        });
        
        const smallCount = recentData.length - bigCount;
        const finalCat = bigCount >= smallCount ? "BIG" : "SMALL";

        // --- OPPOSITE NUMBER PICK ---
        const lastVal = parseInt(data[0].number);
        const oppMap = {
            0: [5, 8], 1: [6, 9], 2: [8, 0], 3: [7, 1], 4: [6, 2],
            5: [0, 3], 6: [1, 4], 7: [3, 9], 8: [2, 5], 9: [4, 7]
        };
        const finalNums = oppMap[lastVal] || [2, 8];

        return { cat: finalCat, nums: finalNums };
    }

    tracker(actualNum, issue) {
        const actCat = parseInt(actualNum) >= 5 ? "BIG" : "SMALL";
        const isWin = (this.prediction_cat === actCat) || (this.predicted_nums.includes(parseInt(actualNum)));
        
        this.total++;
        if (isWin) this.wins++;
        this.accuracy = (this.wins / this.total) * 100;

        console.log(`\n${'='.repeat(45)}`);
        console.log(` ${NAME} | RESULT`);
        console.log(`${'='.repeat(45)}`);
        console.log(`PERIOD    : ${issue}`);
        console.log(`AI PREDICT: ${this.prediction_cat} | NUMS: ${this.predicted_nums}`);
        console.log(`ACTUAL    : ${actualNum} (${actCat})`);
        console.log(`RESULT    : ${isWin ? '✅ WIN' : '❌ LOSS'}`);
        console.log(`ACCURACY  : ${this.accuracy.toFixed(2)}% | TOTAL: ${this.total}`);
        console.log(`${'='.repeat(45)}\n`);
    }

    async startEngine() {
        console.log(`🚀 ${NAME} ENGINE STARTED...`);
        setInterval(async () => {
            const data = await this.fetchApi();
            if (!data || data.length === 0) return;

            const item = data[0];
            const issue = item.issue || item.issueNumber;
            const num = item.number;

            if (!issue || num === undefined) return;

            // Result Check
            if (this.target_issue === issue) {
                this.tracker(num, issue);
                this.target_issue = null;
            }

            // Next Prediction
            const nextP = (parseInt(issue) + 1).toString();
            if (this.target_issue !== nextP) {
                const logic = this.hybridLogic(data);
                this.prediction_cat = logic.cat;
                this.predicted_nums = logic.nums;
                this.target_issue = nextP;
                
                const timeStr = new Date().toLocaleTimeString();
                process.stdout.write(`[${timeStr}] NEXT: ${nextP} | AI: ${this.prediction_cat} | PICK: ${this.predicted_nums}\r`);
            }
        }, 2000);
    }
}

// Initialize Bot
const bot = new PriteshV5();
bot.startEngine();

// Web interface for Render (Health Check)
app.get('/', (req, res) => {
    res.json({
        status: "Active",
        bot: NAME,
        total_sessions: bot.total,
        accuracy: bot.accuracy.toFixed(2) + "%",
        latest_prediction: bot.prediction_cat
    });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
