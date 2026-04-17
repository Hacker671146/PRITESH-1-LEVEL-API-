/**
 * 🎯 PRITESH PREDICTION BOT - SIMPLE
 * Output: Sirf BIG ya SMALL
 */

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());
app.use(express.json());

// 🎯 SIMPLE PREDICTION LOGIC
function getPrediction(data) {
  if (!data || data.length < 5) return "WAIT";

  // Last 10 numbers nikalo
  const numbers = data.slice(0, 10).map(x => parseInt(x.number) || 0);
  const sizes = numbers.map(n => n >= 5 ? "BIG" : "SMALL");

  // Pattern check: Mirror (B-S-B-S) ya Dragon (B-B-B-B)
  const isMirror = [0,1,2].every(i => sizes[i] !== sizes[i+1]);
  const isDragon = [0,1,2].every(i => sizes[i] === sizes[i+1]);

  if (isMirror) {
    // Mirror: Opposite of last
    return sizes[0] === "SMALL" ? "BIG" : "SMALL";
  }
  if (isDragon) {
    // Dragon: Same as trend
    return sizes[0];
  }

  // Default: Weighted count (last 3 zyada important)
  let bigScore = 0, smallScore = 0;
  sizes.forEach((s, i) => {
    const weight = i < 3 ? 2 : 1;
    if (s === "BIG") bigScore += weight;
    else smallScore += weight;
  });

  return bigScore >= smallScore ? "BIG" : "SMALL";
}

// 🔮 PREDICTION ENDPOINT - YEH USE KARO
app.get('/prediction', async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}?ts=${Date.now()}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 5000
    });

    const data = response.data?.data?.list || response.data?.list || [];
    
    if (data.length < 5) {
      return res.json({ 
        error: "Not enough data", 
        prediction: "WAIT" 
      });
    }

    const prediction = getPrediction(data);
    const lastIssue = data[0].issue || data[0].issueNumber;
    const nextIssue = String(parseInt(lastIssue) + 1);
    
    // 🎯 FINAL OUTPUT - Sirf yeh dekho
    res.json({
      next: nextIssue,
      predict: prediction,  // ✅ BIG ya SMALL
      confidence: "HIGH",
      timestamp: new Date().toLocaleString('en-IN')
    });

  } catch (err) {
    res.status(500).json({ 
      error: "Prediction failed", 
      prediction: "ERROR" 
    });
  }
});

// 🧪 Test Page - Browser mein kholo
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>🎯 Pritesh Prediction</title>
      <meta http-equiv="refresh" content="30">
      <style>
        body { font-family: monospace; text-align: center; padding: 40px; background: #1a1a2e; color: #eee; }
        .box { background: #16213e; padding: 30px; border-radius: 15px; display: inline-block; }
        .big { color: #00d4aa; font-size: 3em; font-weight: bold; }
        .small { color: #ff6b6b; font-size: 3em; font-weight: bold; }
        .issue { color: #888; margin: 10px 0; }
        button { padding: 12px 30px; font-size: 1.1em; margin: 10px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>🎯 PRITESH PREDICTION</h1>
        <div id="loading">Loading prediction...</div>
        <div id="result" style="display:none">
          <div class="issue">Next Issue: <span id="issue"></span></div>
          <div id="predict" class="big">BIG</div>
          <div style="margin-top:20px">
            <button onclick="refresh()">🔄 Refresh</button>
            <button onclick="copy()">📋 Copy</button>
          </div>
        </div>
      </div>

      <script>
        async function fetchPrediction() {
          try {
            const r = await fetch('/prediction');
            const data = await r.json();
            
            document.getElementById('loading').style.display = 'none';
            document.getElementById('result').style.display = 'block';
            document.getElementById('issue').textContent = data.next;
            
            const predEl = document.getElementById('predict');
            predEl.textContent = data.predict;
            predEl.className = data.predict === 'BIG' ? 'big' : 'small';
          } catch(e) {
            document.getElementById('loading').textContent = '❌ Error loading';
          }
        }

        function refresh() { fetchPrediction(); }
        function copy() {
          const text = document.getElementById('predict').textContent;
          navigator.clipboard.writeText(text);
          alert('✅ Copied: ' + text);
        }

        // Auto load
        fetchPrediction();
        // Auto refresh every 30 sec
        setInterval(fetchPrediction, 30000);
      </script>
    </body>
    </html>
  `);
});

// 🚀 Server start
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Prediction Bot running on port ${PORT}`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`🎯 Direct Prediction: http://localhost:${PORT}/prediction`);
});
