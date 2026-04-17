const axios = require('axios');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_30S/GetHistoryIssuePage.json";

// AI Logic Class
class RushiAI {
    constructor() {
        this.weights = [0.25, 0.20, 0.15, 0.10, 0.10, 0.05, 0.05, 0.04, 0.03, 0.03];
        this.bias = 0.5;
    }

    sigmoid(x) { return 1 / (1 + Math.exp(-x)); }

    predict(data) {
        if (!data || data.length < 10) return { cat: "WAITING", numbers: ".." };
        const inputs = data.slice(0, 10).map(x => (parseInt(x.number) >= 5 ? 1 : 0));
        let dotProduct = this.bias;
        inputs.forEach((val, i) => dotProduct += val * this.weights[i]);
        
        const prob = this.sigmoid(dotProduct);
        const cat = prob < 0.5 ? "BIG" : "SMALL";
        const lastNum = parseInt(data[0].number);
        const oppMap = { 0:[5,8], 1:[6,9], 2:[8,0], 3:[7,1], 4:[6,2], 5:[0,3], 6:[1,4], 7:[2,5], 8:[3,6], 9:[4,7] };
        
        return { cat, numbers: (oppMap[lastNum] || [2, 8]).join(", ") };
    }
}

const engine = new RushiAI();

app.use(express.static('public'));

// Real-time loop
setInterval(async () => {
    try {
        const res = await axios.get(`${API_URL}?ts=${Date.now()}`);
        const list = res.data.data?.list || [];
        if (list.length > 0) {
            const currentIssue = list[0].issue || list[0].issueNumber;
            const prediction = engine.predict(list);
            io.emit('update', {
                issue: (BigInt(currentIssue) + 1n).toString(),
                prediction: prediction.cat,
                numbers: prediction.numbers,
                lastResult: list[0].number
            });
        }
    } catch (e) { console.log("API Error"); }
}, 3000);

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
