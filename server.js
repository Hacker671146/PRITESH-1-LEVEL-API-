const express = require("express");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
const NAME = "PRITESH V6-ULTRA (HEAVY)";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

// --- GLOBAL TRACKING ---
let stats = {
    total: 0,
    wins: 0,
    last_period: null,
    last_prediction_cat: "ANALYZING",
    last_predicted_nums: [1, 6],
    accuracy: "0.00%"
};

// --- HEAVY LOGIC (PYTHON PORT) ---
const heavyLogic = (data) => {
    if (!data || data.length < 2) return { cat: "BIG", nums: [2, 8] };

    let bigWeight = 0;
    let smallWeight = 0;

    // 1. Weighted Analysis (Last 15 rounds)
    data.slice(0, 15).forEach((item, i) => {
        const num = parseInt(item.number);
        const weight = i < 5 ? 2.5 : 1.0;
        if (num >= 5) bigWeight += weight;
        else smallWeight += weight;
    });

    // 2. Trend Detection & Reversal
    let predCat = "";
    if (bigWeight > 12) predCat = "SMALL";
    else if (smallWeight > 12) predCat = "BIG";
    else predCat = bigWeight >= smallWeight ? "BIG" : "SMALL";

    // 3. Opposite Number Mapping Strategy
    const lastNum = parseInt(data[0].number);
    const oppMap = {
        0: [5, 8], 1: [6, 9], 2: [8, 0], 3: [7, 1], 4: [6, 2],
        5: [0, 3], 6: [1, 4], 7: [2, 5], 8: [3, 6], 9: [4, 7]
    };
    const picks = oppMap[lastNum] || [1, 6];

    return { cat: predCat, nums: picks };
};

// --- API ENDPOINT ---
app.get("/api", async (req, res) => {
    try {
        const response = await axios.get(`${API_URL}?ts=${Date.now()}`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            timeout: 5000
        });
        
        const data = response.data.data.list || response.data.list || [];
        if (data.length === 0) throw new Error("No data found");

        const latestItem = data[0];
        const currentIssue = latestItem.issue || latestItem.issueNumber;
        const actualNum = parseInt(latestItem.number);
        const actualCat = actualNum >= 5 ? "BIG" : "SMALL";

        // --- REAL TIME WIN/LOSS TRACKER ---
        if (stats.last_period === currentIssue) {
            const isWin = (stats.last_prediction_cat === actualCat) || (stats.last_predicted_nums.includes(actualNum));
            
            stats.total += 1;
            if (isWin) stats.wins += 1;
            
            stats.accuracy = ((stats.wins / stats.total) * 100).toFixed(2) + "%";
            stats.last_period = null; // Prevent double counting
        }

        // --- GENERATE NEXT PREDICTION ---
        const prediction = heavyLogic(data);
        const nextPeriod = (parseInt(currentIssue) + 1).toString();

        // Save state for next check
        if (stats.last_period !== nextPeriod) {
            stats.last_period = nextPeriod;
            stats.last_prediction_cat = prediction.cat;
            stats.last_predicted_nums = prediction.nums;
        }

        // --- JSON RESPONSE ---
        res.json({
            bot_name: NAME,
            success: true,
            next_bet: {
                period: nextPeriod,
                category: prediction.cat,
                numbers: prediction.nums
            },
            tracking: {
                total_played: stats.total,
                wins: stats.wins,
                accuracy: stats.accuracy
            },
            last_result: {
                period: currentIssue,
                number: actualNum,
                category: actualCat
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Default Route
app.get("/", (req, res) => {
    res.send(`<h1>${NAME} API is Live</h1><p>Use <b>/api</b> for predictions.</p>`);
});

app.listen(PORT, () => {
    console.log(`${NAME} server running on port ${PORT}`);
});
