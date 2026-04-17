const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIG ---
const BOT_NAME = "PRITESH AI";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

class PriteshAI {
    constructor() {
        this.targetIssue = null;
        this.prediction = "FETCHING";
        this.wins = 0;
        this.total = 0;
        this.accuracy = 0;
    }

    async fetchAPI() {
        try {
            const res = await axios.get(`${API_URL}?t=${Date.now()}`);
            return res.data?.data?.list || res.data?.list || [];
        } catch (e) { return []; }
    }

    // --- ONLY BIG SMALL LOGIC (3-LEVEL FIX) ---
    getPrediction(data) {
        if (!data.length) return "BIG";
        
        const last = parseInt(data[0].number);
        const secondLast = parseInt(data[1].number);
        const L1 = last >= 5 ? "B" : "S";
        const L2 = secondLast >= 5 ? "B" : "S";

        // Level 2/3 Break Logic
        if (L1 === L2) {
            return L1 === "B" ? "SMALL" : "BIG"; 
        } else {
            return last >= 5 ? "BIG" : "SMALL";
        }
    }

    async start() {
        setInterval(async () => {
            const data = await this.fetchAPI();
            if (!data.length) return;

            const current = data[0];
            const issue = current.issue || current.issueNumber;

            // Result Check
            if (this.targetIssue === issue) {
                const actCat = parseInt(current.number) >= 5 ? "BIG" : "SMALL";
                this.total++;
                if (this.prediction === actCat) this.wins++;
                this.accuracy = (this.wins / this.total) * 100;
                this.targetIssue = null;
            }

            // Immediate Prediction (No Waiting)
            const next = (parseInt(issue) + 1).toString();
            if (this.targetIssue !== next) {
                this.prediction = this.getPrediction(data);
                this.targetIssue = next;
            }
        }, 1000); // 1 sec sync
    }
}

const bot = new PriteshAI();
bot.start();

// --- WHITE NORMAL HTML ---
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>PRITESH AI</title></head>
        <body style="background:white; color:black; font-family:arial; padding:20px;">
            <h1>${BOT_NAME}</h1>
            <p>Status: Active</p>
            <hr>
            <h2>NEXT PERIOD: ${bot.targetIssue || 'Loading...'}</h2>
            <h1 style="font-size:100px; margin:10px 0;">${bot.prediction}</h1>
            <hr>
            <p>Accuracy: ${bot.accuracy.toFixed(2)}%</p>
            <p>Total: ${bot.total} | Wins: ${bot.wins}</p>
            <script>setTimeout(()=>location.reload(), 2000);</script>
        </body>
        </html>
    `);
});

app.listen(PORT);
