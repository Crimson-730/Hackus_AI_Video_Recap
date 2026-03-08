require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const director = require('./agents/director');

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Serve frontend static files
app.use(express.static(path.join(__dirname)));

// ── Health check ────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        agents: 5,
        model: process.env.ANTHROPIC_API_KEY ? 'claude (live)' : 'demo (no API key)',
        version: '1.0.0'
    });
});

// ── Stage 1: Scene Extraction ───────────────────────────────────
app.post('/api/extract-scenes', async (req, res) => {
    try {
        const { synopsis1, synopsis2, movieName, movieName2, apiKey, model } = req.body;
        const result = await director.run('scene-extractor', {
            synopsis1, synopsis2, movieName, movieName2, apiKey, model
        });
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('[extract-scenes]', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── Stage 2: Script Writing ─────────────────────────────────────
app.post('/api/write-script', async (req, res) => {
    try {
        const { scenes, movieName, movieName2, apiKey, model } = req.body;
        const result = await director.run('script-writer', {
            scenes, movieName, movieName2, apiKey, model
        });
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('[write-script]', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── Stage 3: Storyboard ─────────────────────────────────────────
app.post('/api/storyboard', async (req, res) => {
    try {
        const { scenes, script, movieName, movieName2, apiKey, model } = req.body;
        const result = await director.run('storyboard', {
            scenes, script, movieName, movieName2, apiKey, model
        });
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('[storyboard]', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── Stage 4: Video Planning ─────────────────────────────────────
app.post('/api/video-plan', async (req, res) => {
    try {
        const { panels, script, movieName, movieName2, apiKey, model } = req.body;
        const result = await director.run('video-planner', {
            panels, script, movieName, movieName2, apiKey, model
        });
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('[video-plan]', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── Image Prompts ───────────────────────────────────────────────
app.post('/api/image-prompts', async (req, res) => {
    try {
        const { panels, script, movieName, apiKey, model } = req.body;
        const result = await director.run('image-prompt', {
            panels, script, movieName, apiKey, model
        });
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('[image-prompts]', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── YouTube Scene Extraction (transcript-driven) ─────────────────
app.post('/api/yt-scenes', async (req, res) => {
    try {
        const { title, channelName, transcript, ytScenes, movieName, apiKey, model } = req.body;
        const ytAgent = require('./agents/yt-scene-extractor');
        const result = await ytAgent.run({ title, channelName, transcript, ytScenes, movieName, apiKey, model });
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('[yt-scenes]', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── YouTube Script Generation (scenes-driven) ────────────────────
app.post('/api/yt-script', async (req, res) => {
    try {
        const { title, scenes, apiKey, model } = req.body;
        const ytAgent = require('./agents/yt-scene-extractor');
        const result = await ytAgent.runScript({ title, scenes, apiKey, model });
        res.json({ ok: true, ...result });
    } catch (err) {
        console.error('[yt-script]', err.message);
        res.status(500).json({ ok: false, error: err.message });
    }
});

// ── YouTube oEmbed Proxy (avoids browser CORS block) ────────────────
app.get('/api/yt-meta', async (req, res) => {
    const { videoId } = req.query;
    if (!videoId) return res.status(400).json({ ok: false, error: 'Missing videoId' });
    try {
        const https = require('https');
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`;

        const data = await new Promise((resolve, reject) => {
            https.get(oembedUrl, (resp) => {
                let body = '';
                resp.on('data', chunk => body += chunk);
                resp.on('end', () => {
                    try { resolve(JSON.parse(body)); }
                    catch (e) { reject(new Error('Invalid JSON from oEmbed')); }
                });
            }).on('error', reject);
        });

        res.json({
            ok: true,
            title: data.title || '',
            channelName: data.author_name || '',
            thumbnail: data.thumbnail_url || `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            videoId
        });
    } catch (err) {
        console.error('[yt-meta]', err.message);
        // Fallback: return basic info
        res.json({
            ok: true,
            title: '',
            channelName: '',
            thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
            videoId
        });
    }
});

// SPA fallthrough → serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    const hasKey = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here';
    console.log(`\n🎬 CineGen.ai server running at http://localhost:${PORT}`);
    console.log(`🤖 Agent mode: ${hasKey ? '✅ Claude API (live)' : '⚡ Demo mode (no ANTHROPIC_API_KEY)'}`);
    console.log(`📁 Serving frontend from: ${__dirname}\n`);
});
