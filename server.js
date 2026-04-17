app.get("/api", async (req, res) => {
    try {
        const response = await axios.get(`${API_URL}?ts=${Date.now()}`, {
            headers: {
                'accept': 'application/json, text/plain, */*',
                'accept-language': 'en-US,en;q=0.9',
                'origin': 'https://draw.ar-lottery01.com',
                'referer': 'https://draw.ar-lottery01.com/',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
            },
            timeout: 8000
        });
        
        // Baki ka logic wahi rahega...
        const data = response.data.data.list || [];
        // ... (Jo logic pehle diya tha)
        res.json({ success: true, data: data }); // Sample response

    } catch (error) {
        // Agar 403 aata hai toh humein user ko batana hoga
        res.status(403).json({ 
            success: false, 
            message: "Cloudflare/Server ne block kiya hai. Refresh karein ya Proxy use karein.",
            error_code: error.response ? error.response.status : "TIMEOUT"
        });
    }
});
