const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

// --- PRITESH V6 LOGIC ---
const getPrediction = (data) => {
    const lastNum = parseInt(data[0].number);
    const oppMap = {
        0: [5, 8], 1: [6, 9], 2: [8, 0], 3: [7, 1], 4: [6, 2],
        5: [0, 3], 6: [1, 4], 7: [2, 5], 8: [3, 6], 9: [4, 7]
    };
    const picks = oppMap[lastNum] || [1, 6];
    const predCat = (parseInt(data[0].number) >= 5) ? "SMALL" : "BIG";
    return { cat: predCat, nums: picks };
};

// --- ROUTE: /trade (Ye waisa hi dikhega jaisa aapne pucha) ---
app.get("/trade", async (req, res) => {
    try {
        const response = await axios.get(`${API_URL}?ts=${Date.now()}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
                'Referer': 'https://draw.ar-lottery01.com/'
            }
        });

        const list = response.data.data.list;
        const result = getPrediction(list);
        const nextPeriod = (parseInt(list[0].issue) + 1).toString();

        // --- DASHBOARD UI ---
        const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>PRITESH V6-ULTRA TRADE</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { background: #0d1117; color: white; font-family: sans-serif; text-align: center; padding: 20px; }
                .card { background: #161b22; border: 1px solid #30363d; border-radius: 15px; padding: 25px; max-width: 400px; margin: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
                .period { color: #8b949e; font-size: 14px; }
                .prediction { font-size: 45px; font-weight: bold; color: #f0b90b; margin: 15px 0; }
                .nums { font-size: 20px; color: #58a6ff; letter-spacing: 5px; }
                .status { color: #238636; font-size: 12px; margin-top: 20px; }
                .btn { background: #238636; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 15px; }
            </style>
            <script>setTimeout(() => { location.reload(); }, 5000);</script>
        </head>
        <body>
            <h2>PRITESH V6-ULTRA AI</h2>
            <div class="card">
                <div class="period">NEXT PERIOD: ${nextPeriod}</div>
                <div class="prediction">${result.cat}</div>
                <div class="nums">NUMBERS: ${result.nums.join(", ")}</div>
                <div class="status">● LIVE ANALYZING ACTIVE</div>
                <button class="btn" onclick="location.reload()">REFRESH DATA</button>
            </div>
            <p style="color: #8b949e; font-size: 10px; margin-top: 20px;">LAST RESULT: ${list[0].number} (${parseInt(list[0].number) >= 5 ? 'BIG' : 'SMALL'})</p>
        </body>
        </html>
        `;
        res.send(html);

    } catch (error) {
        res.send("<h1>Server Busy... Refreshing in 3s</h1><script>setTimeout(()=>location.reload(),3000)</script>");
    }
});

// JSON API Route
app.get("/api", async (req, res) => {
    // ... pichla JSON logic yahan reh sakta hai ...
});

app.listen(PORT, () => console.log("Trade Server Live!"));
