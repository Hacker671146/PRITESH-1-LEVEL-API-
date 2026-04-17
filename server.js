// server.js - FIXED VERSION
const express = require('express');
const axios = require('axios');

// --- CONFIGURATION ---
const NAME = "PRITESH QUANTUM AI 30";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
const PORT = process.env.PORT || 3000;

class QuantumDeepAI {
    constructor() {
        this.total = 0;
        this.wins = 0;
        this.targetIssue = null;
        this.prediction = null;
        this.numbers = [];
        this.weights = new Array(10).fill(0.1);
        this.bias = 0.5;
        this.lastProcessedIssue = null;
        this.lastLogTime = 0;
    }

    async fetchAPI() {
        try {
            const url = `${API_URL}?ts=${Date.now()}`;
            const response = await axios.get(url, {
                headers: { 
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Accept": "application/json",
                    "Referer": "https://draw.ar-lottery01.com"
                },
                timeout: 15000
            });
            
            if (response.status === 200 && response.data) {
                const js = response.data;
                // Try multiple possible response structures
                return js?.data?.list || js?.list || js?.result?.list || [];
            }
        } catch (error) {
            console.error(`❌ API Error: ${error.message}`);
        }
        return [];
    }

    sigmoid(x) {
        // Prevent overflow
        if (x > 500) return 1;
        if (x < -500) return 0;
        return 1 / (1 + Math.exp(-x));
    }

    deepQuantumPredict(data) {
        if (!data || data.length < 10) {
            return { category: "WAITING", pick: [1, 6], confidence: 0 };
        }

        // Extract features from last 10 rounds
        const inputs = data.slice(0, 10).map(x => {
            const num = parseInt(x?.number || x?.num || 0);
            return num >= 5 ? 1 : 0;
        });
        
        // Neural network feed-forward
        let dotProduct = this.bias;
        for (let i = 0; i < 10; i++) {
            dotProduct += inputs[i] * this.weights[i];
        }
        
        const prob = this.sigmoid(dotProduct);
        const confidence = Math.abs(prob - 0.5) * 2; // 0 to 1 scale

        // Quantum Opposite Logic
        const category = prob < 0.5 ? "BIG" : "SMALL";

        // Opposite Number Strategy
        const lastNum = parseInt(data[0]?.number || data[0]?.num || 0);
        const oppMap = {
            0: [5, 8], 1: [6, 9], 2: [8, 0], 3: [7, 1], 4: [6, 2],
            5: [0, 3], 6: [1, 4], 7: [2, 5], 8: [3, 6], 9: [4, 7]
        };
        const pick = oppMap[lastNum] || [2, 8];
        
        return { category, pick, confidence: (confidence * 100).toFixed(1) };
    }

    tracker(num, issue) {
        const numInt = parseInt(num);
        const actCat = numInt >= 5 ? "BIG" : "SMALL";
        const win = (this.prediction === actCat) || this.numbers.includes(numInt);
        
        this.total += 1;
        if (win) this.wins += 1;
        
        // Backpropagation
        const expected = actCat === "BIG" ? 1 : 0;
        const predicted = this.prediction === "BIG" ? 1 : 0;
        const error = expected - predicted;
        
        for (let i = 0; i < this.weights.length; i++) {
            this.weights[i] += 0.01 * error;
            // Clamp weights
            this.weights[i] = Math.max(-1, Math.min(1, this.weights[i]));
        }

        const acc = this.total > 0 ? (this.wins / this.total * 100) : 0;
        
        // Clear formatted output (no \r issues)
        console.log(`\n🔹 ${'═'.repeat(43)}`);
        console.log(`   ${NAME} | RESULT UPDATE`);
        console.log(`🔹 ${'═'.repeat(43)}`);
        console.log(`   📅 PERIOD  : ${issue}`);
        console.log(`   🔮 PREDICT : ${this.prediction} | PICK: [${this.numbers.join(', ')}]`);
        console.log(`   🎯 ACTUAL  : ${num} (${actCat})`);
        console.log(`   ✅ RESULT  : ${win ? '🟢 WIN' : '🔴 LOSS'}`);
        console.log(`   📊 ACC     : ${acc.toFixed(2)}% (${this.wins}/${this.total})`);
        console.log(`🔹 ${'═'.repeat(43)}\n`);
        
        return { win, acc: acc.toFixed(2), total: this.total, issue };
    }

    async run() {
        console.log(`\n🚀 ${NAME} STARTED`);
        console.log(`📡 API: ${API_URL}`);
        console.log(`🧠 Weights: [${this.weights.map(w => w.toFixed(2)).join(', ')}]\n`);
        
        while (true) {
            try {
                const data = await this.fetchAPI();
                
                if (!data || data.length === 0) {
                    console.log("⏳ Waiting for API data...");
                    await this.sleep(3000);
                    continue;
                }
                
                // Debug: Show raw first item structure (first time only)
                if (this.total === 0 && this.lastLogTime === 0) {
                    console.log("🔍 API Sample:", JSON.stringify(data[0]).slice(0, 200) + "...");
                    this.lastLogTime = Date.now();
                }

                const item = data[0];
                // Try multiple field names for issue & number
                const issue = String(item?.issue || item?.issueNumber || item?.period || item?.id || "").trim();
                const num = item?.number ?? item?.num ?? item?.result ?? null;

                if (!issue || num === null || num === undefined) {
                    console.log("⚠️ Missing issue/number in API response");
                    await this.sleep(2000);
                    continue;
                }

                const currentIssueNum = parseInt(issue);
                
                // ✅ TRACK RESULT: If we predicted this issue and haven't processed it yet
                if (this.targetIssue === issue && this.lastProcessedIssue !== issue) {
                    this.tracker(num, issue);
                    this.lastProcessedIssue = issue;
                    this.targetIssue = null; // Reset for next prediction
                }

                // ✅ MAKE NEW PREDICTION: For the NEXT issue
                const nextIssueNum = currentIssueNum + 1;
                const nextIssueStr = String(nextIssueNum);
                
                if (this.targetIssue !== nextIssueStr) {
                    const result = this.deepQuantumPredict(data);
                    this.prediction = result.category;
                    this.numbers = result.pick;
                    this.targetIssue = nextIssueStr;
                    
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit', 
                        second: '2-digit',
                        hour12: false 
                    });
                    
                    // Clear visible prediction log (NO \r - works on Render)
                    console.log(`\n🔮 [${timeStr}] NEW PREDICTION`);
                    console.log(`   📅 NEXT PERIOD: ${nextIssueStr}`);
                    console.log(`   🤖 AI SAY    : ${result.category}`);
                    console.log(`   🎲 PICK NUMS : [${result.pick.join(', ')}]`);
                    console.log(`   💪 CONFIDENCE: ${result.confidence}%\n`);
                }

                // Wait before next check (30 seconds = safer for API limits)
                await this.sleep(30000);
                
            } catch (error) {
                console.error(`💥 Runtime Error: ${error.message}`);
                console.error(error.stack);
                await this.sleep(5000);
            }
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Expose stats for API endpoint
    getStats() {
        const acc = this.total > 0 ? (this.wins / this.total * 100) : 0;
        return {
            total: this.total,
            wins: this.wins,
            accuracy: acc.toFixed(2),
            currentPrediction: this.prediction,
            currentPick: this.numbers,
            targetIssue: this.targetIssue,
            lastProcessed: this.lastProcessedIssue
        };
    }
}

// --- EXPRESS SERVER ---
const app = express();
app.use(express.json());

let botInstance = null;

// 🏠 Home / Health Check
app.get('/', (req, res) => {
    res.json({ 
        status: "🟢 ONLINE", 
        name: NAME,
        uptime: `${Math.floor(process.uptime())}s`,
        timestamp: new Date().toISOString(),
        endpoints: {
            stats: "/stats",
            predict: "/predict (POST)",
            health: "/health"
        }
    });
});

// 📊 Live Stats Endpoint
app.get('/stats', (req, res) => {
    if (botInstance) {
        res.json({
            bot: NAME,
            ...botInstance.getStats(),
            serverTime: new Date().toISOString()
        });
    } else {
        res.status(503).json({ error: "Bot not initialized" });
    }
});

// 🎯 Manual Prediction Endpoint
app.post('/predict', async (req, res) => {
    if (!botInstance) {
        return res.status(503).json({ error: "Bot not ready" });
    }
    
    const data = await botInstance.fetchAPI();
    if (!data || data.length === 0) {
        return res.status(500).json({ error: "No API data available" });
    }
    
    const result = botInstance.deepQuantumPredict(data);
    const currentIssue = data[0]?.issue || data[0]?.issueNumber || "UNKNOWN";
    const nextIssue = (parseInt(currentIssue) + 1).toString();
    
    res.json({
        success: true,
        currentPeriod: currentIssue,
        nextPeriod: nextIssue,
        prediction: result.category,
        pick: result.pick,
        confidence: result.confidence + "%",
        timestamp: new Date().toISOString()
    });
});

// ❤️ Health Check
app.get('/health', (req, res) => {
    res.json({ 
        status: "healthy", 
        uptime: process.uptime(),
        memory: process.memoryUsage().heapUsed / 1024 / 1024 + " MB"
    });
});

// Start bot in background
function startBot() {
    if (!botInstance) {
        botInstance = new QuantumDeepAI();
        setImmediate(() => botInstance.run());
        console.log("🤖 Quantum AI prediction loop started...");
    }
}

// 🚀 Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🌐 ${NAME} SERVER`);
    console.log(`📍 Port: ${PORT}`);
    console.log(`🔗 Local: http://localhost:${PORT}`);
    console.log(`🔗 Stats: http://localhost:${PORT}/stats\n`);
    startBot();
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('\n🛑 SIGTERM received - Shutting down...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\n🛑 SIGINT received - Shutting down...');
    process.exit(0);
});
