// server.js - PRITESH V5 (FIXED: Immediate Predictions)
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
    this.predictionCat = "BIG"; // ✅ Fixed: Start with default prediction
    this.predictedNums = [5, 7]; // ✅ Fixed: Start with default numbers
    this.lastResult = null;
    this.logs = [];
    this.isInitialized = false; // ✅ Track initialization
  }

  async fetchAPI() {
    try {
      const url = `${API_URL}?ts=${Date.now()}`;
      const headers = { 
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/json",
        "Connection": "keep-alive"
      };
      const response = await axios.get(url, { headers, timeout: 8000 });
      
      if (response.status === 200) {
        const data = response.data;
        // ✅ Handle multiple possible response structures
        let dataList = data?.data?.list || data?.list || data?.records || [];
        return Array.isArray(dataList) ? dataList : [];
      }
    } catch (error) {
      console.error("❌ Fetch error:", error.message);
      return [];
    }
    return [];
  }

  hybridLogic(data) {
    /**
     * ADVANCED LOGIC: Mirror vs Dragon + Weighted Frequency + Pivot Logic
     */
    // ✅ Always return a valid prediction, even with minimal data
    if (!data || data.length < 3) {
      return ["BIG", [5, 7]]; // Default fallback
    }

    // Extract numbers (handle string/number types)
    const numbers = data.slice(0, 10).map(x => {
      const n = parseInt(x?.number ?? x?.num ?? x?.value ?? 0);
      return isNaN(n) ? 0 : n;
    });
    
    const sizes = numbers.map(n => n >= 5 ? "BIG" : "SMALL");

    // --- 1. PATTERN RECOGNITION ---
    const checkPattern = (arr, type) => {
      if (arr.length < 4) return false;
      if (type === 'mirror') {
        return [0,1,2].every(i => arr[i] !== arr[i+1]);
      }
      if (type === 'dragon') {
        return [0,1,2].every(i => arr[i] === arr[i+1]);
      }
      return false;
    };

    const isMirror = checkPattern(sizes, 'mirror');
    const isDragon = checkPattern(sizes, 'dragon');

    let finalCat;
    if (isMirror) {
      finalCat = sizes[0] === "SMALL" ? "BIG" : "SMALL";
    } else if (isDragon) {
      finalCat = sizes[0];
    } else {
      // Weighted frequency: recent rounds count more
      const weightedBig = sizes.reduce((sum, s, i) => 
        sum + (s === "BIG" ? (i < 3 ? 2 : 1) : 0), 0);
      const weightedSmall = sizes.reduce((sum, s, i) => 
        sum + (s === "SMALL" ? (i < 3 ? 2 : 1) : 0), 0);
      finalCat = weightedBig >= weightedSmall ? "BIG" : "SMALL";
    }

    // --- 2. PIVOT NUMBER LOGIC ---
    const lastVal = numbers[0] ?? 0;
    const oppMap = {
      0: [5, 1], 1: [6, 2], 2: [7, 0], 3: [8, 1], 4: [9, 2],
      5: [0, 6], 6: [1, 7], 7: [2, 8], 8: [3, 9], 9: [4, 5]
    };
    
    let finalNums;
    if (lastVal === 0) finalNums = [5, 7];
    else if (lastVal === 5) finalNums = [0, 2];
    else finalNums = oppMap[lastVal] || [2, 8];

    return [finalCat, finalNums];
  }

  tracker(actualNum, issue) {
    const num = parseInt(actualNum);
    const actCat = num >= 5 ? "BIG" : "SMALL";
    
    // ✅ Win condition: Category match OR number match
    const isWin = (this.predictionCat === actCat) || 
                  this.predictedNums.includes(num);
    
    this.total += 1;
    if (isWin) this.wins += 1;
    
    const acc = this.total > 0 ? (this.wins / this.total * 100) : 0;
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
    if (this.logs.length > 50) this.logs.pop();

    // ✅ Clear console output for Render logs
    console.log(`\n${'='.repeat(50)}`);
    console.log(` 🎯 ${NAME} | RESULT`);
    console.log('='.repeat(50));
    console.log(` 📋 PERIOD    : ${issue}`);
    console.log(` 🔮 AI PREDICT: ${this.predictionCat} | NUMS: [${this.predictedNums.join(', ')}]`);
    console.log(` 🎲 ACTUAL    : ${actualNum} (${actCat})`);
    console.log(` ✨ RESULT    : ${isWin ? '✅ WIN 🎉' : '❌ LOSS'}`);
    console.log(` 📊 ACCURACY  : ${acc.toFixed(2)}% | Wins: ${this.wins}/${this.total}`);
    console.log('='.repeat(50) + '\n');

    return result;
  }

  async generatePrediction(data) {
    // ✅ Force prediction generation even on first run
    try {
      [this.predictionCat, this.predictedNums] = this.hybridLogic(data);
      const t = new Date().toLocaleTimeString();
      console.log(`[${t}] 🔄 Updated Prediction → ${this.predictionCat} | [${this.predictedNums.join(', ')}]`);
    } catch (e) {
      console.error("❌ Prediction error:", e.message);
      // Fallback defaults
      this.predictionCat = "BIG";
      this.predictedNums = [5, 7];
    }
  }

  async run() {
    console.log(`\n🚀 ${NAME} STARTING...\n`);
    
    // ✅ Initial fetch and prediction on startup
    try {
      const initData = await this.fetchAPI();
      if (initData.length > 0) {
        await this.generatePrediction(initData);
        this.isInitialized = true;
        const item = initData[0];
        const nextIssue = String(parseInt(item?.issue || item?.issueNumber || 0) + 1);
        this.targetIssue = nextIssue;
        console.log(`✅ Initialized | Next Target: ${nextIssue}\n`);
      }
    } catch (e) {
      console.error("⚠️ Initial fetch failed, using defaults");
    }

    // ✅ Main loop
    while (true) {
      try {
        const data = await this.fetchAPI();
        
        if (!data || data.length === 0) {
          console.log("⏳ Waiting for API data...");
          await new Promise(res => setTimeout(res, 3000));
          continue;
        }
        
        const item = data[0];
        const issue = item?.issue || item?.issueNumber || item?.periodNo;
        const num = item?.number ?? item?.num ?? item?.result;

        if (!issue || num === undefined || num === null) {
          await new Promise(res => setTimeout(res, 1000));
          continue;
        }

        // ✅ Check if current issue result is available
        if (this.targetIssue === issue) {
          this.tracker(num, issue);
          this.targetIssue = null;
        }

        // ✅ Always prepare prediction for NEXT issue
        const nextP = String(parseInt(issue) + 1);
        
        if (this.targetIssue !== nextP || !this.isInitialized) {
          await this.generatePrediction(data);
          this.targetIssue = nextP;
          this.isInitialized = true;
          
          // ✅ Show live status
          const t = new Date().toLocaleTimeString();
          process.stdout.write(`\r[${t}] ⏭ NEXT: ${nextP} | 🔮 ${this.predictionCat} | 🎯 [${this.predictedNums.join(', ')}]   `);
        }

        await new Promise(res => setTimeout(res, 1000));
        
      } catch (error) {
        console.error("❌ Loop error:", error.message);
        await new Promise(res => setTimeout(res, 2000));
      }
    }
  }
}

// Initialize bot
const bot = new PriteshV5();

// --- EXPRESS API ENDPOINTS ---
app.get('/', (req, res) => {
  const accuracy = bot.total > 0 
    ? ((bot.wins / bot.total) * 100).toFixed(2) + '%' 
    : '0%';
    
  res.json({
    status: "🟢 ONLINE",
    bot: NAME,
    prediction: {
      category: bot.predictionCat,  // ✅ Now shows BIG/SMALL immediately
      numbers: bot.predictedNums,
      nextIssue: bot.targetIssue
    },
    stats: {
      total: bot.total,
      wins: bot.wins,
      accuracy: accuracy
    },
    lastResult: bot.lastResult,
    uptime: process.uptime().toFixed(0) + 's'
  });
});

app.get('/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  res.json({ logs: bot.logs.slice(0, limit) });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    bot: NAME,
    prediction: bot.predictionCat,
    timestamp: new Date().toISOString() 
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`🔗 Status: http://localhost:${PORT}/`);
  console.log(`🔍 Health: http://localhost:${PORT}/health\n`);
  
  // Start bot AFTER server is ready
  bot.run();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🔄 Shutting down...');
  server.close(() => process.exit(0));
});

module.exports = { app, bot };
