// server.js - PRITESH V5 (ULTRA-FAST-ADVANCED) Node.js Version
const express = require('express');
const axios = require('axios');
const app = express();

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
    this.predictedNums = [0, 5];
    this.lastResult = null;
    this.logs = [];
  }

  async fetchAPI() {
    try {
      const url = `${API_URL}?ts=${Date.now()}`;
      const headers = { 
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json"
      };
      const response = await axios.get(url, { headers, timeout: 5000 });
      
      if (response.status === 200) {
        const data = response.data;
        let dataList = data?.data?.list || data?.list || [];
        return dataList;
      }
    } catch (error) {
      console.error("Fetch error:", error.message);
      return [];
    }
    return [];
  }

  hybridLogic(data) {
    /**
     * ADVANCED LOGIC UPGRADE:
     * 1. Trend Analysis (Mirror vs Dragon)
     * 2. Recency Weighting (Last 3 rounds matter more)
     * 3. Pivot Number Logic (0 and 5)
     */
    if (!data || data.length < 5) {
      return ["ANALYZING", [1, 6]];
    }

    // Extract last 10 numbers for trend analysis
    const numbers = data.slice(0, 10).map(x => parseInt(x.number) || 0);
    const sizes = numbers.map(n => n >= 5 ? "BIG" : "SMALL");

    // --- 1. PATTERN RECOGNITION (DRAGON vs MIRROR) ---
    // Check for Mirror (B-S-B-S)
    const isMirror = [0, 1, 2].every(i => sizes[i] !== sizes[i + 1]);
    // Check for Dragon (B-B-B-B)
    const isDragon = [0, 1, 2].every(i => sizes[i] === sizes[i + 1]);

    let finalCat;
    if (isMirror) {
      // If mirror, pick the OPPOSITE of the last one
      finalCat = sizes[0] === "SMALL" ? "BIG" : "SMALL";
    } else if (isDragon) {
      // If dragon, follow the trend (Don't break the streak)
      finalCat = sizes[0];
    } else {
      // Weighted Frequency: Last 3 rounds count as double
      const weightedBig = sizes.reduce((sum, s, i) => 
        sum + (s === "BIG" ? (i < 3 ? 2 : 1) : 0), 0);
      const weightedSmall = sizes.reduce((sum, s, i) => 
        sum + (s === "SMALL" ? (i < 3 ? 2 : 1) : 0), 0);
      finalCat = weightedBig >= weightedSmall ? "BIG" : "SMALL";
    }

    // --- 2. ADVANCED NUMBER PICK (PIVOT LOGIC) ---
    const lastVal = numbers[0];
    
    // High Win Mapping based on statistical jumps
    const oppMap = {
      0: [5, 1], 1: [6, 2], 2: [7, 0], 3: [8, 1], 4: [9, 2],
      5: [0, 6], 6: [1, 7], 7: [2, 8], 8: [3, 9], 9: [4, 5]
    };
    
    let finalNums;
    if (lastVal === 0) {
      finalNums = [5, 7]; // 0 usually jumps to Big
    } else if (lastVal === 5) {
      finalNums = [0, 2]; // 5 usually jumps to Small
    } else {
      finalNums = oppMap[lastVal] || [2, 8];
    }

    return [finalCat, finalNums];
  }

  tracker(actualNum, issue) {
    const actCat = parseInt(actualNum) >= 5 ? "BIG" : "SMALL";
    // Check if Category Win OR Specific Number Win
    const isWin = (this.predictionCat === actCat) || 
                  this.predictedNums.includes(parseInt(actualNum));
    
    this.total += 1;
    if (isWin) this.wins += 1;
    
    const acc = (this.wins / this.total) * 100;
    const result = {
      issue,
      predicted: { cat: this.predictionCat, nums: this.predictedNums },
      actual: { num: actualNum, cat: actCat },
      win: isWin,
      accuracy: acc.toFixed(2),
      total: this.total,
      timestamp: new Date().toISOString()
    };

    this.lastResult = result;
    this.logs.unshift(result);
    if (this.logs.length > 50) this.logs.pop(); // Keep last 50 results

    // Console output (for Render logs)
    console.log(`\n${'='.repeat(45)}`);
    console.log(` ${NAME} | RESULT`);
    console.log('='.repeat(45));
    console.log(`PERIOD    : ${issue}`);
    console.log(`AI PREDICT: ${this.predictionCat} | NUMS: ${this.predictedNums}`);
    console.log(`ACTUAL    : ${actualNum} (${actCat})`);
    console.log(`RESULT    : ${isWin ? '✅ WIN' : '❌ LOSS'}`);
    console.log(`ACCURACY  : ${acc.toFixed(2)}% | TOTAL: ${this.total}`);
    console.log('='.repeat(45) + '\n');

    return result;
  }

  async run() {
    console.log(`🚀 ${NAME} STARTING...`);
    
    while (true) {
      try {
        const data = await this.fetchAPI();
        
        if (!data || data.length === 0) {
          console.log("⏳ Data fetching error... retrying");
          await new Promise(res => setTimeout(res, 2000));
          continue;
        }
        
        const item = data[0];
        const issue = item?.issue || item?.issueNumber;
        const num = item?.number;

        if (!issue || num === undefined || num === null) {
          await new Promise(res => setTimeout(res, 1000));
          continue;
        }

        // Check result for tracked issue
        if (this.targetIssue === issue) {
          this.tracker(num, issue);
          this.targetIssue = null;
        }

        // Generate prediction for next issue
        const nextP = String(parseInt(issue) + 1);
        
        if (this.targetIssue !== nextP) {
          [this.predictionCat, this.predictedNums] = this.hybridLogic(data);
          this.targetIssue = nextP;
          
          const t = new Date().toLocaleTimeString();
          console.log(`[${t}] ⏭ NEXT: ${nextP} | 🤖 AI: ${this.predictionCat} | 🎯 PICK: [${this.predictedNums.join(', ')}]`);
        }

        // Faster polling for 30S game
        await new Promise(res => setTimeout(res, 1000));
        
      } catch (error) {
        console.error("❌ Runtime error:", error.message);
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }
}

// Initialize bot instance
const bot = new PriteshV5();

// --- EXPRESS SERVER FOR RENDER ---
app.get('/', (req, res) => {
  res.json({
    status: "🟢 ONLINE",
    bot: NAME,
    current: {
      prediction: bot.predictionCat,
      numbers: bot.predictedNums,
      nextIssue: bot.targetIssue
    },
    stats: {
      total: bot.total,
      wins: bot.wins,
      accuracy: bot.total > 0 ? ((bot.wins / bot.total) * 100).toFixed(2) + '%' : '0%'
    },
    lastResult: bot.lastResult,
    uptime: process.uptime().toFixed(0) + 's'
  });
});

app.get('/logs', (req, res) => {
  res.json({
    logs: bot.logs.slice(0, parseInt(req.query.limit) || 10)
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server running on port ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`📊 Status: http://localhost:${PORT}/`);
  
  // Start the bot after server is ready
  bot.run();
});

// Graceful shutdown for Render
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
    process.exit(0);
  });
});

module.exports = { app, bot };
