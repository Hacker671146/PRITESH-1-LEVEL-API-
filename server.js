/**
 * 🚀 PRITESH V5 (ULTRA-FAST-ADVANCED)
 * Node.js Server - BIG/SMALL Prediction Only
 * Deploy ready for Render
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// --- SETTINGS ---
const NAME = "PRITESH V5 (ULTRA-FAST-ADVANCED)";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
const PORT = process.env.PORT || 3000;

class PriteshV5 {
  constructor() {
    this.total = 0;
    this.wins = 0;
    this.targetIssue = null;
    this.predictionCat = "WAITING";
    this.isRunning = false;
    this.lastResult = null;
  }

  // Fetch API Data
  async fetchAPI() {
    try {
      const url = `${API_URL}?ts=${Date.now()}`;
      const headers = { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" 
      };
      const response = await axios.get(url, { headers, timeout: 5000 });
      
      if (response.status === 200) {
        const data = response.data;
        let dataList = data?.data?.list || data?.list || [];
        return dataList;
      }
    } catch (error) {
      console.error("❌ API Fetch Error:", error.message);
    }
    return [];
  }

  // 🎯 SIMPLIFIED HYBRID LOGIC - BIG/SMALL ONLY
  hybridLogic(data) {
    if (!data || data.length < 5) {
      return "ANALYZING";
    }

    // Extract last 10 numbers
    const numbers = data.slice(0, 10).map(x => parseInt(x.number) || 0);
    const sizes = numbers.map(n => n >= 5 ? "BIG" : "SMALL");

    // --- 1. PATTERN RECOGNITION ---
    // Mirror Pattern: B-S-B-S or S-B-S-B
    const isMirror = [0,1,2].every(i => sizes[i] !== sizes[i+1]);
    
    // Dragon Pattern: B-B-B-B or S-S-S-S
    const isDragon = [0,1,2].every(i => sizes[i] === sizes[i+1]);

    let finalCat;
    
    if (isMirror) {
      // Mirror: Predict OPPOSITE of most recent
      finalCat = sizes[0] === "SMALL" ? "BIG" : "SMALL";
    } 
    else if (isDragon) {
      // Dragon: Follow the streak
      finalCat = sizes[0];
    } 
    else {
      // Weighted Frequency: Last 3 rounds count DOUBLE
      const weightedBig = sizes.reduce((sum, s, i) => {
        return sum + (s === "BIG" ? (i < 3 ? 2 : 1) : 0);
      }, 0);
      
      const weightedSmall = sizes.reduce((sum, s, i) => {
        return sum + (s === "SMALL" ? (i < 3 ? 2 : 1) : 0);
      }, 0);
      
      finalCat = weightedBig >= weightedSmall ? "BIG" : "SMALL";
    }

    return finalCat;
  }

  // Track Results
  tracker(actualNum, issue) {
    const actualCat = parseInt(actualNum) >= 5 ? "BIG" : "SMALL";
    const isWin = this.predictionCat === actualCat;
    
    this.total++;
    if (isWin) this.wins++;
    
    const accuracy = ((this.wins / this.total) * 100).toFixed(2);
    
    this.lastResult = {
      issue,
      predicted: this.predictionCat,
      actual: actualNum,
      actualCat,
      result: isWin ? "✅ WIN" : "❌ LOSS",
      accuracy: `${accuracy}%`,
      total: this.total,
      wins: this.wins
    };

    // Console Output
    console.log(`\n${'='.repeat(45)}`);
    console.log(` ${NAME} | RESULT`);
    console.log(`${'='.repeat(45)}`);
    console.log(`PERIOD    : ${issue}`);
    console.log(`AI PREDICT: ${this.predictionCat}`);
    console.log(`ACTUAL    : ${actualNum} (${actualCat})`);
    console.log(`RESULT    : ${isWin ? '✅ WIN' : '❌ LOSS'}`);
    console.log(`ACCURACY  : ${accuracy}% | TOTAL: ${this.total}`);
    console.log(`${'='.repeat(45)}\n`);
  }

  // Main Bot Loop
  async run() {
    console.log(`🚀 ${NAME} STARTING...`);
    this.isRunning = true;

    while (this.isRunning) {
      try {
        const data = await this.fetchAPI();
        
        if (!data || data.length === 0) {
          console.log("⏳ Data fetching... retrying", end='\r');
          await new Promise(res => setTimeout(res, 2000));
          continue;
        }

        const item = data[0];
        const issue = item.issue || item.issueNumber;
        const num = item.number;

        if (!issue || num === undefined) continue;

        // Check if current issue result is available
        if (this.targetIssue === issue && num !== null) {
          this.tracker(num, issue);
          this.targetIssue = null;
        }

        // Predict for next issue
        const nextIssue = String(parseInt(issue) + 1);
        
        if (this.targetIssue !== nextIssue) {
          this.predictionCat = this.hybridLogic(data);
          this.targetIssue = nextIssue;
          
          const time = new Date().toLocaleTimeString('en-IN');
          process.stdout.write(`[${time}] NEXT: ${nextIssue} | AI: ${this.predictionCat}\r`);
        }

        // 30S game - fast polling
        await new Promise(res => setTimeout(res, 1000));
        
      } catch (err) {
        console.error("❌ Bot Loop Error:", err.message);
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }

  stop() {
    this.isRunning = false;
    console.log("🛑 Bot stopped");
  }

  getStats() {
    const accuracy = this.total > 0 ? ((this.wins / this.total) * 100).toFixed(2) : "0.00";
    return {
      name: NAME,
      status: this.isRunning ? "RUNNING" : "STOPPED",
      prediction: this.predictionCat,
      nextIssue: this.targetIssue,
      accuracy: `${accuracy}%`,
      wins: this.wins,
      total: this.total,
      lastResult: this.lastResult
    };
  }
}

// ============= EXPRESS SERVER =============
const app = express();
const bot = new PriteshV5();

app.use(cors());
app.use(express.json());

// 🏠 Health Check
app.get('/', (req, res) => {
  res.json({
    name: NAME,
    status: "🟢 Online",
    version: "5.0.0",
    endpoints: [
      "GET /api/stats - Get bot statistics",
      "GET /api/prediction - Get current prediction",
      "POST /api/start - Start prediction bot",
      "POST /api/stop - Stop prediction bot"
    ]
  });
});

// 📊 Get Statistics
app.get('/api/stats', (req, res) => {
  res.json(bot.getStats());
});

// 🔮 Get Current Prediction
app.get('/api/prediction', async (req, res) => {
  try {
    const data = await bot.fetchAPI();
    const prediction = data.length >= 5 ? bot.hybridLogic(data) : "ANALYZING";
    
    res.json({
      prediction,
      nextIssue: bot.targetIssue,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: "Prediction failed", message: err.message });
  }
});

// ▶️ Start Bot
app.post('/api/start', (req, res) => {
  if (bot.isRunning) {
    return res.json({ message: "Bot already running", status: "RUNNING" });
  }
  
  bot.run();
  res.json({ message: "🚀 Bot started successfully", status: "RUNNING" });
});

// ⏹️ Stop Bot
app.post('/api/stop', (req, res) => {
  bot.stop();
  res.json({ message: "🛑 Bot stopped", status: "STOPPED" });
});

// 🔄 Manual Refresh Prediction
app.get('/api/refresh', async (req, res) => {
  try {
    const data = await bot.fetchAPI();
    if (data && data.length >= 5) {
      const prediction = bot.hybridLogic(data);
      const item = data[0];
      res.json({
        currentIssue: item.issue || item.issueNumber,
        nextIssue: String(parseInt(item.issue || item.issueNumber) + 1),
        prediction,
        lastNumbers: data.slice(0, 10).map(x => x.number)
      });
    } else {
      res.status(503).json({ error: "Insufficient data for prediction" });
    }
  } catch (err) {
    res.status(500).json({ error: "Refresh failed", message: err.message });
  }
});

// 🌐 Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ ${NAME} Server running on port ${PORT}`);
  console.log(`🌐 Local: http://localhost:${PORT}`);
  console.log(`🌐 Public: https://your-app-name.onrender.com`);
});

// Graceful Shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  bot.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received, shutting down...');
  bot.stop();
  process.exit(0);
});
