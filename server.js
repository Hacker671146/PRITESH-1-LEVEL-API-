// server.js - PRITESH V5 | Period Displayed Everywhere | No WAITING | Correct Numbers
const express = require('express');
const axios = require('axios');
const app = express();

const NAME = "PRITESH V5 (ULTRA-FAST-ADVANCED)";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
const PORT = process.env.PORT || 3000;

class PriteshV5 {
  constructor() {
    this.total = 0;
    this.wins = 0;
    this.targetIssue = null;
    this.currentPeriod = "INITIALIZING";
    
    // ✅ FIX: Start with BIG/SMALL & proper numbers (NO WAITING, NO [0,5])
    this.predictionCat = "BIG";
    this.predictedNums = [5, 7];
    
    this.lastResult = null;
    this.logs = [];
    this.lastFetchTime = 0;
  }

  async fetchAPI() {
    try {
      const now = Date.now();
      if (now - this.lastFetchTime < 800) await new Promise(r => setTimeout(r, 800));
      this.lastFetchTime = now;

      const res = await axios.get(`${API_URL}?ts=${now}`, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
        timeout: 10000
      });
      
      const data = res.data;
      const list = data?.data?.list || data?.list || data?.records || data?.result || [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      console.error(`❌ API Error: ${e.message}`);
      return [];
    }
  }

  hybridLogic(data) {
    if (!data || !Array.isArray(data) || data.length < 3) return ["BIG", [5, 7]];

    const numbers = data.slice(0, 10).map(x => {
      const n = parseInt(x?.number ?? x?.num ?? x?.result ?? 0);
      return isNaN(n) ? 0 : n;
    });
    const sizes = numbers.map(n => n >= 5 ? "BIG" : "SMALL");

    const isMirror = sizes.length >= 4 && sizes[0] !== sizes[1] && sizes[1] !== sizes[2] && sizes[2] !== sizes[3];
    const isDragon = sizes.length >= 4 && sizes[0] === sizes[1] && sizes[1] === sizes[2] && sizes[2] === sizes[3];

    let finalCat;
    if (isMirror) finalCat = sizes[0] === "SMALL" ? "BIG" : "SMALL";
    else if (isDragon) finalCat = sizes[0];
    else {
      let b = 0, s = 0;
      sizes.forEach((val, i) => { const w = i < 3 ? 2 : 1; val === "BIG" ? b += w : s += w; });
      finalCat = b >= s ? "BIG" : "SMALL";
    }

    const last = numbers[0] ?? 0;
    const map = {0:[5,1],1:[6,2],2:[7,0],3:[8,1],4:[9,2],5:[0,6],6:[1,7],7:[2,8],8:[3,9],9:[4,5]};
    let finalNums = last === 0 ? [5, 7] : last === 5 ? [0, 2] : map[last] || [2, 8];

    return [finalCat, finalNums];
  }

  tracker(num, period) {
    const actCat = parseInt(num) >= 5 ? "BIG" : "SMALL";
    const isWin = (this.predictionCat === actCat) || this.predictedNums.includes(parseInt(num));
    this.total++;
    if (isWin) this.wins++;
    const acc = this.total > 0 ? (this.wins / this.total * 100) : 0;

    this.lastResult = { period, predicted: { cat: this.predictionCat, nums: this.predictedNums }, actual: { num, cat: actCat }, win: isWin, accuracy: acc.toFixed(2) + '%' };
    this.logs.unshift(this.lastResult);
    if (this.logs.length > 50) this.logs.pop();

    console.log(`\n${'═'.repeat(55)}`);
    console.log(` 🎯 ${NAME}`);
    console.log('═'.repeat(55));
    console.log(` 📋 PERIOD    : 🔹 ${period} 🔹`);
    console.log(` 🔮 PREDICT   : ${this.predictionCat} | [${this.predictedNums.join(', ')}]`);
    console.log(` 🎲 ACTUAL    : ${num} (${actCat})`);
    console.log(` ✨ RESULT    : ${isWin ? '✅ WIN' : '❌ LOSS'}`);
    console.log(` 📊 ACCURACY  : ${acc.toFixed(2)}% (${this.wins}/${this.total})`);
    console.log('═'.repeat(55) + '\n');
  }

  async run() {
    console.log(`🚀 ${NAME} STARTED\n`);
    
    // ✅ Force initial prediction
    try {
      const data = await this.fetchAPI();
      if (data.length > 0) {
        const cur = data[0]?.issue || data[0]?.issueNumber || "100001";
        this.currentPeriod = cur;
        const next = String(parseInt(cur) + 1);
        [this.predictionCat, this.predictedNums] = this.hybridLogic(data);
        this.targetIssue = next;
        console.log(`✅ PERIOD: ${cur} | NEXT: ${next} | PREDICT: ${this.predictionCat} [${this.predictedNums}]\n`);
      }
    } catch (e) { console.log("⚠️ Init fallback applied\n"); }

    while (true) {
      try {
        const data = await this.fetchAPI();
        if (!data.length) { await new Promise(r => setTimeout(r, 2000)); continue; }

        const item = data[0];
        const issue = item?.issue || item?.issueNumber || item?.periodNo;
        const number = item?.number ?? item?.num ?? item?.result;

        if (!issue || number === null) continue;
        this.currentPeriod = issue;

        if (this.targetIssue === issue) {
          this.tracker(number, issue);
          this.targetIssue = null;
        }

        const next = String(parseInt(issue) + 1);
        if (this.targetIssue !== next) {
          [this.predictionCat, this.predictedNums] = this.hybridLogic(data);
          this.targetIssue = next;
          process.stdout.write(`\r📋 PERIOD: ${next} | 🔮 ${this.predictionCat} | 🎯 [${this.predictedNums.join(', ')}]   `);
        }
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) { console.error(`❌ ${e.message}`); await new Promise(r => setTimeout(r, 2000)); }
    }
  }
}

const bot = new PriteshV5();

app.get('/', (req, res) => res.json({
  status: "ONLINE",
  bot: NAME,
  period: { current: bot.currentPeriod, next: bot.targetIssue, last: bot.lastResult?.period },
  prediction: { category: bot.predictionCat, numbers: bot.predictedNums, forPeriod: bot.targetIssue },
  stats: { total: bot.total, wins: bot.wins, accuracy: bot.total > 0 ? ((bot.wins/bot.total)*100).toFixed(2)+'%' : '0%' },
  uptime: Math.floor(process.uptime())+'s'
}));

app.get('/logs', (req, res) => res.json({ count: bot.logs.length, logs: bot.logs.slice(0, parseInt(req.query.limit)||10) }));
app.get('/health', (req, res) => res.status(200).json({ status: "healthy", period: bot.currentPeriod }));

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Server: http://localhost:${PORT} | Health: /health | Status: /`);
  bot.run();
});

process.on('SIGTERM', () => { server.close(() => process.exit(0)); });
module.exports = { app, bot };
