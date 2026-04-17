const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

// --- PREDICTION LOGIC ---
const heavyLogic = (data) => {
    const lastNum = parseInt(data[0].number);
    const oppMap = {
        0: [5, 8], 1: [6, 9], 2: [8, 0], 3: [7, 1], 4: [6, 2],
        5: [0, 3], 6: [1, 4], 7: [2, 5], 8: [3, 6], 9: [4, 7]
    };
    const picks = oppMap[lastNum] || [1, 6];
    const predCat = (parseInt(data[0].number) >= 5) ? "SMALL" : "BIG"; // Trend Reversal Logic
    return { cat: predCat, nums: picks };
};

app.get("/api", async (req, res) => {
    try {
        const response = await axios.get(`${API_URL}?ts=${Date.now()}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
                'Referer': 'https://draw.ar-lottery01.com/',
                'X-Requested-With': 'XMLHttpRequest',
                'Connection': 'keep-alive'
            },
            timeout: 10000
        });

        const list = response.data.data.list || response.data.list;
        
        if (!list || list.length === 0) {
            return res.json({ success: false, message: "Data empty. Refreshing..." });
        }

        const prediction = heavyLogic(list);
        
        res.json({
            success: true,
            next_period: (parseInt(list[0].issue) + 1).toString(),
            prediction: prediction.cat,
            numbers: prediction.nums,
            last_number: list[0].number
        });

    } catch (error) {
        console.error("Error detected:", error.message);
        res.status(403).json({ 
            success: false, 
            message: "Access Denied by Server (403). Try Refreshing.",
            suggestion: "Agar bar-bar error aye toh Termux pe run karein." 
        });
    }
});

app.get("/", (req, res) => res.send("Bot is Live. Use /api"));

app.listen(PORT, () => console.log("Server Started!"));
