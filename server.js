const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const NAME = "PRITESH V6-ULTRA (HEAVY)";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

// Tracking for Accuracy
let stats = { total: 0, wins: 0, lastIssue: null, lastPredCat: "", lastPredNums: [] };

// --- HEAVY LOGIC (Neural & Opposite Mapping) ---
const calculateLogic = (data) => {
    if (!data || data.length < 2) return { cat: "BIG", nums: [2, 8] };

    let bigWeight = 0;
    let smallWeight = 0;

    // Step 1: Weighted Analysis (Last 15)
    data.slice(0, 15).forEach((item, i) => {
        const num = parseInt(item.number);
        const weight = i < 5 ? 2.5 : 1.0;
        if (num >= 5) bigWeight += weight;
        else smallWeight += weight;
    });

    // Step 2: Trend Detection
    let predCat = "";
    if (bigWeight > 12) predCat = "SMALL";
    else if (smallWeight > 12) predCat = "BIG";
    else predCat = bigWeight >= smallWeight ? "BIG" : "SMALL";

    // Step 3: Opposite Mapping Strategy
    const lastNum = parseInt(data[0].number);
    const oppMap = {
        0: [5, 8], 1: [6, 9], 2: [8, 0], 3: [7, 1], 4: [6, 2],
        5: [0, 3], 6: [1, 4], 7: [2, 5], 8: [3, 6], 9: [4, 7]
    };
    const picks = oppMap[lastNum] || [1, 6];

    return { cat: predCat, nums: picks };
};

// --- ROUTE: /trade (Visual Dashboard) ---
app.get("/trade", async (req, res) => {
    try {
        const response = await axios.get(`${API_URL}?ts=${Date.now()}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
                'Referer': 'https://draw.ar-lottery01.com/'
            },
            timeout: 8000
        });

        const list = response.data.data.list || [];
        if (!list.length) throw new Error("API No Data");

        const latest = list[0];
        const currentIssue = latest.issue;
        const actualNum = parseInt(latest.number);
        const actualCat = actualNum >= 5 ? "BIG" : "SMALL";

        // Tracker Logic
        if (stats.lastIssue === currentIssue) {
            const isWin = (stats.lastPredCat === actualCat) || (stats.lastPredNums.includes(actualNum));
            stats.total++;
            if (isWin) stats.wins++;
            stats.lastIssue = null;
        }

        const prediction = calculateLogic(list);
        const nextP = (parseInt(currentIssue) + 1).toString();

        if (stats.lastIssue !== nextP) {
            stats.lastIssue = nextP;
            stats.lastPredCat = prediction.cat;
            stats.lastPredNums = prediction.nums;
        }

        const acc = stats.total > 0 ? ((stats.wins / stats.total) * 100).toFixed(2) : "0.00";

        // --- HTML UI ---
        res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${NAME}</title>
            <style>
                body { background: #0b0e11; color: #fff; font-family: 'Segoe UI', sans-serif; text-align: center; margin: 0; padding: 20px; }
                .container { max-width: 400px; margin: auto; }
                .card { background: #1e2329; border-radius: 15px; padding: 20px; border: 1px solid #474d57; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
                .title { color: #f0b90b; font-size: 20px; font-weight: bold; margin-bottom: 20px; }
                .period { color: #848e9c; font-size: 14px; }
                .pred { font-size: 50px; font-weight: bold; color: #f0b90b; margin: 10px 0; text-shadow: 0 0 10px rgba(240,185,11,0.3); }
                .nums { font-size: 18px; color: #02c076; letter-spacing: 3px; }
                .stats { display: flex; justify-content: space-around; margin-top: 20px; background: #2b3139; padding: 10px; border-radius: 10px; font-size: 12px; }
                .win { color: #02c076; } .loss { color: #f84960; }
                .footer { font-size: 10px; color: #848e9c; margin-top: 20px; }
            </style>
            <script>setTimeout(() => { location.reload(); }, 5000);</script>
        </head>
        <body>
            <div class="container">
                <div class="title">PRITESH V6 ULTRA AI</div>
                <div class="card">
                    <div class="period">TARGET PERIOD: ${nextP}</div>
                    <div class="pred">${prediction.cat}</div>
                    <div class="nums">PICK: ${prediction.nums.join(", ")}</div>
                    
                    <div class="stats">
                        <div>TOTAL<br>${stats.total}</div>
                        <div>WINS<br><span class="win">${stats.wins}</span></div>
                        <div>ACCURACY<br><span style="color:#f0b90b">${acc}%</span></div>
                    </div>
                </div>
                <div class="footer">LAST: ${currentIssue} | RESULT: ${actualNum} (${actualCat})</div>
            </div>
        </body>
        </html>
        `);
    } catch (err) {
        res.send(`<body style="background:#0b0e11;color:#848e9c;text-align:center;">
            <h3>403: Server Lag / Blocked</h3>
            <p>Retrying in 5 seconds...</p>
            <script>setTimeout(()=>location.reload(), 5000);</script>
        </body>`);
    }
});

// JSON API Route
app.get("/api", async (req, res) => {
    // Same logic as above but returning res.json({...})
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
