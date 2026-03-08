// ══════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ══════════════════════════════════════════════════════════════════
window.MOVIE_NAME = '';
window.MOVIE_NAME_2 = '';
let SCENES_DATA = [], SCRIPT_DATA = [], PANELS_DATA = [], SHOTS_DATA = [], AI_PROMPTS_DATA = [];
const FS = {};
let ACTIVE_FS_SLUG = '';

// ══════════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════════
function toast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('visible');
    clearTimeout(t._tid);
    t._tid = setTimeout(() => t.classList.remove('visible'), 2800);
}
function setNode(id, state) {
    const n = document.getElementById(id);
    if (!n) return;
    n.classList.remove('active', 'done');
    if (state) n.classList.add(state);
}
function showPanel(id) {
    const el = document.getElementById(id);
    el.classList.add('visible');
    setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
}
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }
function toSlug(n) { return (n || '').trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '_') || 'film'; }
function getSlug() { return toSlug(window.MOVIE_NAME || 'film'); }
function getSlug2() { return toSlug(window.MOVIE_NAME_2 || ''); }
function switchTab(tab, btn) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-synopsis').style.display = tab === 'synopsis' ? '' : 'none';
    document.getElementById('tab-youtube').style.display = tab === 'youtube' ? '' : 'none';
}
function switchSbTab(tab, btn) {
    document.querySelectorAll('.sb-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    ['panels', 'drawstory', 'aiprompts'].forEach(t =>
        document.getElementById(`sb-tab-${t}`).style.display = t === tab ? '' : 'none'
    );
}
function toggleVideoPlay(btn) { btn.textContent = btn.textContent === '▶' ? '⏸' : '▶'; }
function dlBlob(content, filename, type) {
    const b = new Blob([content], { type });
    const u = URL.createObjectURL(b);
    const a = document.createElement('a'); a.href = u; a.download = filename; a.click();
    URL.revokeObjectURL(u);
}

// ══════════════════════════════════════════════════════════════════
// TITLE AUTO-DETECTION
// ══════════════════════════════════════════════════════════════════
const YT_NOISE = ['full movie', 'official', 'trailer', 'teaser', 'hd', '4k', 'dubbed', 'subtitled', 'part 1', 'part 2', '2020', '2021', '2022', '2023', '2024', '2025', 'malayalam', 'hindi', 'tamil', 'telugu', 'english'];
function cleanTitle(raw) {
    if (!raw) return '';
    let s = raw.toLowerCase();
    YT_NOISE.forEach(w => { s = s.replace(new RegExp('\\b' + w.replace(/\s+/g, '\\s+') + '\\b', 'gi'), ''); });
    return s.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
        .split(' ').filter(Boolean).map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
}
function extractTitleFromSynopsis(text) {
    if (!text) return '';
    const m = text.split('\n')[0].match(/^([A-Z][^(:\n]{1,45?}?)\s*(?:\(\d{4}\))?\s*(?:is\b|follows\b|tells\b|centres|revolves|begins)/i);
    return m ? m[1].trim() : '';
}
function resolveMovieNames() {
    const isSyn = document.getElementById('tab-synopsis').style.display !== 'none';
    if (isSyn) {
        const t1 = document.getElementById('title1').value.trim(), t2 = document.getElementById('title2').value.trim();
        const s1 = document.getElementById('synopsis1').value.trim(), s2 = document.getElementById('synopsis2').value.trim();
        window.MOVIE_NAME = t1 || cleanTitle(extractTitleFromSynopsis(s1)) || 'Film';
        window.MOVIE_NAME_2 = t2 || (s2 ? cleanTitle(extractTitleFromSynopsis(s2)) || 'Film 2' : '');
    } else {
        const yt1 = document.getElementById('yttitle1').value.trim(), yt2 = document.getElementById('yttitle2').value.trim();
        window.MOVIE_NAME = yt1 ? cleanTitle(yt1) : 'Film';
        window.MOVIE_NAME_2 = yt2 ? cleanTitle(yt2) : '';
    }
    updateNameBadge();
}
function updateNameBadge() {
    const badge = document.getElementById('movie-name-badge');
    if (!window.MOVIE_NAME) { badge.innerHTML = ''; return; }
    const label = window.MOVIE_NAME_2
        ? `🎬 <strong style="color:var(--text)">${window.MOVIE_NAME}</strong> &nbsp;+&nbsp; <strong style="color:var(--text)">${window.MOVIE_NAME_2}</strong>`
        : `🎬 <strong style="color:var(--text)">${window.MOVIE_NAME}</strong>`;
    badge.innerHTML = `DETECTED: ${label} &nbsp;·&nbsp; <span style="color:#22d3ee">outputs/${getSlug()}/</span>`;
}

// ══════════════════════════════════════════════════════════════════
// DEMO LOAD
// ══════════════════════════════════════════════════════════════════
function loadDemo() {
    document.getElementById('tab-btn-synopsis').click();
    document.getElementById('title1').value = '';
    document.getElementById('title2').value = '';
    document.getElementById('synopsis1').value = DEMO_S1;
    document.getElementById('synopsis2').value = DEMO_S2;
    toast('✓ Demo data loaded — click Generate Recap to begin');
}

// ══════════════════════════════════════════════════════════════════
// VIRTUAL FILE SYSTEM
// ══════════════════════════════════════════════════════════════════
function fsRegister(slug, data) {
    if (!FS[slug]) FS[slug] = { slug, displayName: '', displayName2: '', slug2: '', synopsis1: '', synopsis2: '', scenes: [], script: [], panels: [], shots: [], populated: {}, createdAt: new Date().toLocaleTimeString() };
    Object.assign(FS[slug], data);
    ACTIVE_FS_SLUG = slug;
}
function fsPopulate(slug, folder, filename) {
    if (!FS[slug]) return;
    if (!FS[slug].populated[folder]) FS[slug].populated[folder] = new Set();
    FS[slug].populated[folder].add(filename);
}
function fsIsPopulated(slug, folder, filename) {
    return !!(FS[slug]?.populated?.[folder]?.has(filename));
}
function toggleFolder(id) { document.getElementById(id).classList.toggle('open'); }
function switchActiveMovie(slug) { ACTIVE_FS_SLUG = slug; renderFsTree(); toast(`📁 Viewing outputs/${slug}/`); }

function buildFolderTree(slug) {
    const m = FS[slug]; if (!m) return '';
    const s = slug;
    function badge(populated, folder, filename) {
        if (populated) return `<span class="fs-filebadge dl" onclick="fsDownload('${s}','${folder}','${filename}')">⬇ DL</span>`;
        return `<span class="fs-filebadge pending">pending</span>`;
    }
    function file(folder, filename) {
        const pop = fsIsPopulated(s, folder, filename);
        return `<div class="fs-file ${pop ? 'populated' : 'pending'}">
      <span class="file-icon">${pop ? '📄' : '○'}</span>
      <span class="fs-filename">${filename}</span>
      ${badge(pop, folder, filename)}</div>`;
    }
    function folder(label, key, files, open) {
        const hasAny = files.some(f => fsIsPopulated(s, key, f));
        return `<div class="fs-folder-group ${open || hasAny ? 'open' : ''}" id="fsg-${s}-${key}">
      <div class="fs-folder" onclick="toggleFolder('fsg-${s}-${key}')"><span class="folder-icon"></span><span>${label}/</span></div>
      <div class="fs-folder-children fs-indent">${files.map(f => file(key, f)).join('')}</div></div>`;
    }
    return `<div class="fs-header"><div class="fs-title">📁 outputs/${s}/</div>
    <div class="fs-meta">Created: ${m.createdAt} · ${m.displayName}${m.displayName2 ? ' + ' + m.displayName2 : ''}</div></div>
  <div class="fs-root">
    ${folder('input', 'input', ['movie_synopsis.txt', 'youtube_metadata.json'], true)}
    ${folder('scenes', 'scenes', ['scene_list.json', 'scene_keywords.json', 'scene_01.txt', 'scene_02.txt'])}
    ${folder('script', 'script', [`${s}_recap_script.txt`, `${s}_narration_script.txt`])}
    ${folder('storyboard', 'storyboard', ['storyboard_frames.json', 'ai_image_prompts.json', 'drawstory_prompts.txt'])}
    ${folder('audio', 'audio', ['narration.mp3', 'music_track.mp3'])}
    ${folder('video', 'video', ['scene_01.mp4', 'scene_02.mp4', `${s}_shot_list.json`])}
    ${folder('final', 'final', [`${s}_cinematic_recap.mp4`])}
  </div>`;
}

function renderFsTree() {
    const slug = ACTIVE_FS_SLUG; if (!slug || !FS[slug]) return;
    const slugs = Object.keys(FS);
    const bar = document.getElementById('multi-movie-bar'), chips = document.getElementById('movie-chips');
    if (slugs.length > 1) {
        bar.style.display = 'block';
        chips.innerHTML = slugs.map(sl => `<span class="movie-chip ${sl === ACTIVE_FS_SLUG ? 'active-chip' : ''}" onclick="switchActiveMovie('${sl}')">${FS[sl].displayName}</span>`).join('');
    } else bar.style.display = 'none';
    document.getElementById('fs-section-title').textContent = `outputs/${slug}/ — INITIALIZED`;
    document.getElementById('fs-slug-inline').textContent = slug;
    document.getElementById('fs-tree').innerHTML = buildFolderTree(slug);
}

function fsDownload(slug, folder, filename) {
    const m = FS[slug]; if (!m) return;
    let content = '';
    if (folder === 'input' && filename === 'movie_synopsis.txt') {
        content = `MOVIE: ${m.displayName}\n${'─'.repeat(40)}\n\n${m.synopsis1}`;
        if (m.synopsis2) content += `\n\n${'─'.repeat(40)}\nSECOND MOVIE: ${m.displayName2}\n\n${m.synopsis2}`;
    } else if (folder === 'scenes' && filename === 'scene_list.json') {
        content = JSON.stringify({ movie: m.displayName, scenes: m.scenes }, null, 2);
    } else if (folder === 'script') {
        content = `${m.displayName.toUpperCase()} — RECAP SCRIPT\n${'─'.repeat(50)}\n\n`;
        content += m.script.map(s => `[${s.time}]\n${s.narration}`).join('\n\n');
    } else if (folder === 'storyboard' && filename === 'storyboard_frames.json') {
        content = JSON.stringify({ movie: m.displayName, panels: m.panels }, null, 2);
    } else if (filename === 'full_source_material.txt') { // New case for comprehensive text export
        let txt = `CineGen.ai - Cinematic Recap Source Material\n`;
        txt += `=======================================================\n\n`;

        txt += `[ SCENE EXTRACTION ]\n`;
        txt += `-------------------------------------------------------\n`;
        m.scenes.forEach((s, i) => {
            const numStr = String(s.scene_number || s.num || i + 1).padStart(2, '0');
            txt += `[${numStr}] ${s.title} (${s.film || 'film1'}): ${s.description || s.desc}\n`;
        });

        txt += `\n\n[ RECAP SCRIPT ]\n`;
        txt += `-------------------------------------------------------\n`;
        m.script.forEach(s => {
            txt += `[${s.time}] ${s.narration || s.text || ''}\n`;
        });

        txt += `\n\n[ STORYBOARD PLAN ]\n`;
        txt += `-------------------------------------------------------\n`;
        m.panels.forEach(p => {
            txt += `Panel ${p.frame_number}: ${p.visual_description}\n`;
        });

        txt += `\n\n[ VIDEO PRODUCTION SHOT LIST ]\n`;
        txt += `-------------------------------------------------------\n`;
        m.shots.forEach(s => {
            txt += `Shot ${s.shot_number} [${s.duration}] - ${s.shot_type} / ${s.camera_motion}\n`;
            txt += `  Audio: ${s.sound_effect} | VO: ${s.narration_text}\n`;
        });

        if (m.ai_prompts) {
            txt += `\n\n[ AI IMAGE PROMPTS ]\n`;
            txt += `-------------------------------------------------------\n`;
            m.ai_prompts.forEach(p => {
                txt += `Panel ${p.frame_number} Prompt: ${p._internal_prompt}\n`;
            });
        }
        content = txt;
    } else if (folder === 'input' && filename === 'youtube_metadata.json') {
        const yt = m._yt_meta || {};
        content = JSON.stringify({ title: yt.title, channel: yt.channelName, videoId: yt.videoId, url: yt.url, thumbnail: yt.thumbnail }, null, 2);
    } else if (folder === 'input' && filename === 'transcript.txt') {
        const yt = m._yt_meta || {};
        content = yt.transcript || '(Transcript unavailable)';
    } else if (folder === 'input' && filename === 'scene_analysis.json') {
        const scenes = m._yt_scenes || [];
        content = JSON.stringify({ movie: m.displayName, analyzedScenes: scenes }, null, 2);
    } else { toast('⚠ This file is generated in the full production pipeline'); return; }
    dlBlob(content, filename, filename.endsWith('.json') ? 'application/json' : 'text/plain');
    toast(`⬇ Downloaded: ${filename}`);
}

// ══════════════════════════════════════════════════════════════════
// SCENE CARD BUILDER
// ══════════════════════════════════════════════════════════════════
function buildSceneCard(s, i) {
    const isF1 = s.film === 'film1';
    const lbl = (isF1 ? (window.MOVIE_NAME || 'Film 1') : (window.MOVIE_NAME_2 || 'Film 2')).toUpperCase();
    const numStr = String(s.scene_number || s.num || i + 1).padStart(2, '0');
    const el = document.createElement('div');
    el.className = `scene-card ${s.film || 'film1'}`;
    el.style.animationDelay = `${i * 0.05}s`;
    el.innerHTML = `
    <div class="scene-num">${numStr}</div>
    <div class="scene-title">${s.title}</div>
    <div class="scene-desc">${s.description || s.desc}</div>
    <div class="scene-tags">
      <span class="tag ${isF1 ? 'tag-film1' : 'tag-film2'}">${lbl}</span>
      <span class="tag tag-tone">${s.tone}</span>
      ${s.anim ? '<span class="tag tag-anim">⚡ ANIMATE</span>' : ''}
      ${s.flash ? '<span class="tag tag-flash">↩ FLASHBACK</span>' : ''}
    </div>`;
    return el;
}

// ══════════════════════════════════════════════════════════════════
// API SETTINGS
// ══════════════════════════════════════════════════════════════════
function getApiPayload() {
    return {
        apiKey: sessionStorage.getItem('cinegen_api_key') || '',
        model: sessionStorage.getItem('cinegen_model') || 'claude-3-7-sonnet-20250219'
    };
}

async function fetchStage(endpoint, payload) {
    const res = await fetch(`http://localhost:3333/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, ...getApiPayload() })
    });
    if (!res.ok) throw new Error(`API Error: ${res.statusText}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error || 'Unknown API Error');
    return data;
}

// ══════════════════════════════════════════════════════════════════
// STAGE 1 — SCENE EXTRACTION
// ══════════════════════════════════════════════════════════════════
async function runStage1() {
    const isSyn = document.getElementById('tab-synopsis').style.display !== 'none';
    let s1 = document.getElementById('synopsis1').value.trim();
    const s2 = document.getElementById('synopsis2').value.trim();

    // ── YouTube tab: full pipeline path ──
    if (!isSyn) {
        if (!window.YT_META || !window.YT_META.videoId) {
            toast('⚠ Please paste a YouTube link first');
            return;
        }
        const yt = window.YT_META;
        if (!document.getElementById('yttitle1').value.trim()) {
            document.getElementById('yttitle1').value = yt.cleanedTitle || yt.title;
        }
        resolveMovieNames();

        // Multi-step loading UI
        const loadEl = document.getElementById('loading-1');
        loadEl.classList.add('visible');
        loadEl.innerHTML = `<div id="yt-steps" style="display:flex;flex-direction:column;gap:.5rem;font-size:.78rem;font-weight:600;"></div>`;
        const stepsEl = document.getElementById('yt-steps');
        function ytStep(icon, msg) {
            const d = document.createElement('div');
            d.style.cssText = 'display:flex;align-items:center;gap:.6rem;color:var(--text2)';
            d.innerHTML = `<span style="font-size:.85rem">${icon}</span>${msg}`;
            stepsEl.appendChild(d); return d;
        }
        function ytCheck(el, msg) { el.innerHTML = `<span style="font-size:.85rem">✅</span><span style="color:var(--green)">${msg}</span>`; }

        const slug = getSlug();
        resolveMovieNames();
        const slug2 = getSlug2();
        s1 = `[SOURCE: YouTube Video]\nTitle: ${yt.title}\nChannel: ${yt.channelName}\nVideo URL: ${yt.url}\nVideo ID: ${yt.videoId}\n\nThe following pipeline will generate a cinematic recap based on this video's title and metadata.`;
        fsRegister(slug, { displayName: window.MOVIE_NAME, displayName2: window.MOVIE_NAME_2, slug2, synopsis1: yt.title, synopsis2: '' });
        fsPopulate(slug, 'input', 'movie_synopsis.txt');

        const s1el = ytStep('⏳', `Fetching video metadata…`);
        await delay(400);
        ytCheck(s1el, `Video identified: "${(yt.cleanedTitle || yt.title).substring(0, 40)}"`);

        const s2el = ytStep('⏳', 'Downloading transcript…');
        await delay(800);
        if (yt.transcript) {
            const wc = yt.transcript.split(/\s+/).length;
            ytCheck(s2el, `Transcript loaded (${wc.toLocaleString()} words)`);
        } else {
            ytCheck(s2el, 'Using title + metadata (no transcript)');
        }

        const s3el = ytStep('⏳', 'Analyzing replay patterns…');
        await delay(600);
        const yt_scenes = window.YT_SCENES || [];
        ytCheck(s3el, `${yt_scenes.length || 0} key scenes scored`);

        const s4el = ytStep('⏳', 'Sending to Claude AI…');
        setNode('node-input', 'done'); setNode('node-fs', 'active');
        renderFsTree(); showPanel('output-fs');
        setNode('node-fs', 'done'); setNode('node-1', 'active');

        try {
            // Step 1: fetch oEmbed metadata
            const videoIdMatch = yt1.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
            const videoId = videoIdMatch ? videoIdMatch[1] : null;
            if (!videoId) { toast('⚠ INVALID YOUTUBE URL'); return; }

            const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const oembedData = await oembedRes.json();
            window.YT_META = {
                title: oembedData.title,
                channelName: oembedData.author_name,
                thumbnail: oembedData.thumbnail_url,
                videoId,
                url: yt1,
                transcript: null
            };
            resolveMovieNames();

            // Step 2: fetch transcript via CORS proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.kome.ai/api/tools/youtube-transcripts?video_id=${videoId}&format=true`)}`;
                const tRes = await fetch(proxyUrl);
                const tData = await tRes.json();
                const tParsed = JSON.parse(tData.contents);
                if (tParsed.transcript) {
                    YT_META.transcript = tParsed.transcript;
                }
            } catch (te) {
                console.warn('Transcript fetch failed:', te);
            }

            // Step 3: analyze transcript for high-value segments
            if (YT_META.transcript) {
                const words = YT_META.transcript.split(' ');
                const segSize = Math.ceil(words.length / 20);
                const actionRe = /fight|run|kill|escape|reveal|shock|attack|win|lose|die|love|betray|laugh|cry|scream|gasp/gi;
                window.YT_SCENES = [];
                for (let i = 0; i < words.length; i += segSize) {
                    const seg = words.slice(i, i + segSize).join(' ');
                    let score = (seg.match(actionRe) || []).length * 15;
                    score += (seg.match(/[A-Z][a-z]+/g) || []).length * 2;
                    const pos = i / words.length;
                    if (pos < 0.1 || pos > 0.85) score *= 1.2;
                    YT_SCENES.push({
                        rank: 0,
                        startTime: `${String(Math.floor(i / 150)).padStart(2, '0')}:${String((i % 150) * 0).padStart(2, '0')}`,
                        score: Math.round(score),
                        text: seg.substring(0, 600),
                        keywords: [...new Set(seg.match(/[A-Z][a-z]{3,}/g) || [])].slice(0, 4),
                        type: score > 40 ? 'climax' : score > 20 ? 'action' : 'dialogue'
                    });
                }
                YT_SCENES = YT_SCENES.sort((a, b) => b.score - a.score).slice(0, 16).map((s, i) => ({ ...s, rank: i + 1 }));
            }

            // Step 4: send transcript + scored scenes to Claude for real scene extraction
            const ytScenePrompt = `You are a cinematic script analyst. Analyze this YouTube video and extract the 16 most important scenes for a 3–5 minute recap video. Give HIGHEST priority to the most replayed and high-scoring segments.

VIDEO TITLE: ${YT_META.title}
CHANNEL: ${YT_META.channelName}

${YT_SCENES ? `TOP SCORED SEGMENTS (prioritize these for the storyboard):
${YT_SCENES.slice(0, 8).map(s => `[RANK ${s.rank} | Score:${s.score} | Type:${s.type} | Keywords:${s.keywords.join(',')}]
${s.text}`).join('\n\n')}` : ''}

${YT_META.transcript ? `FULL TRANSCRIPT (first 10000 chars):
${YT_META.transcript.slice(0, 10000)}` : ''}

Return ONLY a valid JSON array of exactly 16 scene objects, no markdown:
[{"num":"01","film":"film1","title":"Scene title","desc":"2-3 sentence description of what actually happens","tone":"Comedy","anim":false,"flash":false}]`;

            const ytRes = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': getApiPayload().apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerously-allow-browser': 'true'
                },
                body: JSON.stringify({
                    model: getApiPayload().model || 'claude-3-5-sonnet-20241022',
                    max_tokens: 4000,
                    messages: [{ role: 'user', content: ytScenePrompt }]
                })
            });
            const ytJson = await ytRes.json();
            const ytRaw = ytJson.content.map(c => c.text || '').join('');
            const ytClean = ytRaw.replace(/```json|```/g, '').trim();
            const ytStart = ytClean.indexOf('[');
            SCENES_DATA = JSON.parse(ytStart >= 0 ? ytClean.slice(ytStart) : ytClean);
            toast('✓ CLAUDE EXTRACTED SCENES FROM YOUTUBE VIDEO');

        } catch (err) {
            console.error('YouTube pipeline failed:', err);
            SCENES_DATA = getScenesData();
            toast('⚠ YOUTUBE PIPELINE FAILED — USING TEMPLATE');
        }

        const s5el = ytStep('⏳', 'Building pipeline…');
        await delay(400);

        // Register YT files in FS
        fsPopulate(slug, 'input', 'youtube_metadata.json');
        if (yt.transcript) fsPopulate(slug, 'input', 'transcript.txt');
        if (yt_scenes.length) fsPopulate(slug, 'input', 'scene_analysis.json');
        FS[slug].scenes = SCENES_DATA;
        fsPopulate(slug, 'scenes', 'scene_list.json'); fsPopulate(slug, 'scenes', 'scene_keywords.json');
        SCENES_DATA.slice(0, 2).forEach((_, i) => fsPopulate(slug, 'scenes', `scene_0${i + 1}.txt`));
        // Store YT data for fsDownload
        FS[slug]._yt_meta = yt;
        FS[slug]._yt_scenes = yt_scenes;

        ytCheck(s5el, 'Ready');
        await delay(500);
        loadEl.classList.remove('visible');
        loadEl.innerHTML = `<div class="spinner"></div>Detecting movie title &amp; extracting scenes…`;

        const f1 = SCENES_DATA.filter(s => s.film === 'film1');
        const f2 = SCENES_DATA.filter(s => s.film === 'film2');
        const an = SCENES_DATA.filter(s => s.anim);
        document.getElementById('s1-title').textContent = `SCENE EXTRACTION — ${window.MOVIE_NAME.toUpperCase()}`;
        document.getElementById('stats-1').innerHTML = `
    <div class="stat-chip red"><strong>${SCENES_DATA.length}</strong>Total Scenes</div>
    <div class="stat-chip yellow"><strong>${f1.length}</strong>${window.MOVIE_NAME}</div>
    ${window.MOVIE_NAME_2 ? `<div class="stat-chip cyan"><strong>${f2.length}</strong>${window.MOVIE_NAME_2}</div>` : ''}
    <div class="stat-chip purple"><strong>${an.length}</strong>Anim Triggers</div>
    <div class="stat-chip teal">outputs/${slug}/scenes/</div>`;

        const container = document.getElementById('scenes-output'); container.innerHTML = '';
        const d1 = document.createElement('div'); d1.className = 'film-divider';
        d1.innerHTML = `<div class="film-divider-text">🎬 ${window.MOVIE_NAME.toUpperCase()}</div>`; container.appendChild(d1);
        f1.forEach((s, i) => container.appendChild(buildSceneCard(s, i)));
        if (f2.length) {
            const d2 = document.createElement('div'); d2.className = 'film-divider';
            d2.innerHTML = `<div class="film-divider-text">🎬 ${(window.MOVIE_NAME_2 || window.MOVIE_NAME + ' 2').toUpperCase()}</div>`; container.appendChild(d2);
            f2.forEach((s, i) => container.appendChild(buildSceneCard(s, i)));
        }
        renderFsTree(); setNode('node-1', 'done'); showPanel('output-1');
        toast(`✓ Stage 1 — ${SCENES_DATA.length} scenes extracted from YouTube`);
        return; // Skip synopsis path below
    }

    if (isSyn && !s1) { toast('⚠ Paste a synopsis or click "Try Demo Mode" first'); return; }

    resolveMovieNames();
    const slug = getSlug(), slug2 = getSlug2();
    fsRegister(slug, { displayName: window.MOVIE_NAME, displayName2: window.MOVIE_NAME_2, slug2, synopsis1: s1, synopsis2: s2 });
    fsPopulate(slug, 'input', 'movie_synopsis.txt');

    const isYT = !isSyn && yt1;
    document.querySelector('#loading-1').innerHTML = `<div class="spinner" style="border-top-color:#7c3aed"></div>${isYT ? 'Reading video · Analyzing replay patterns · Extracting scenes via Claude AI...' : 'Reading synopsis · Extracting real scenes via Claude AI...'}`;
    document.getElementById('loading-1').classList.add('visible');
    setNode('node-input', 'done'); setNode('node-fs', 'active');
    await delay(400);

    renderFsTree(); showPanel('output-fs');
    setNode('node-fs', 'done'); setNode('node-1', 'active');

    try {
        const scenePrompt = `You are a cinematic script analyst. Read this movie synopsis carefully and extract exactly 16 distinct scenes for a 3–5 minute recap video.

MOVIE: ${window.MOVIE_NAME}${window.MOVIE_NAME_2 ? ' and ' + window.MOVIE_NAME_2 : ''}

SYNOPSIS 1 (${window.MOVIE_NAME}):
${s1}

${s2 ? `SYNOPSIS 2 (${window.MOVIE_NAME_2}):\n${s2}` : ''}

Extract 16 scenes total. ${s2 ? `First 9 from Synopsis 1 (film:'film1'), last 7 from Synopsis 2 (film:'film2').` : `All 16 from the synopsis (film:'film1').`}

Rules:
- Each scene must reference actual characters, events, and locations from the synopsis
- Capture the real plot points in chronological order
- tone must be one of: Narrative, Comedy, Slapstick, Chaos, Fight, Climax, Absurdist, Drama, Action
- Set anim:true for action/fight/chaos/climax scenes, false for dialogue/narrative
- Set flash:true only for flashback or time-jump scenes

Return ONLY a valid JSON array, no markdown:
[
  {
    "num": "01",
    "film": "film1",
    "title": "Scene title here",
    "desc": "2-3 sentence description referencing actual synopsis events",
    "tone": "Comedy",
    "anim": false,
    "flash": false
  }
]`;

        const sceneRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': getApiPayload().apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerously-allow-browser': 'true'
            },
            body: JSON.stringify({
                model: getApiPayload().model || 'claude-3-5-sonnet-20241022',
                max_tokens: 4000,
                messages: [{ role: 'user', content: scenePrompt }]
            })
        });
        const sceneJson = await sceneRes.json();
        const sceneRaw = sceneJson.content.map(c => c.text || '').join('');
        const sceneClean = sceneRaw.replace(/```json|```/g, '').trim();
        const sceneStart = sceneClean.indexOf('[');
        const sceneStr = sceneStart >= 0 ? sceneClean.slice(sceneStart) : sceneClean;
        SCENES_DATA = JSON.parse(sceneStr);
        toast('✓ CLAUDE EXTRACTED REAL SCENES FROM SYNOPSIS');
    } catch (err) {
        console.error('Scene extraction failed, using fallback:', err);
        SCENES_DATA = getScenesData(); // from data.js
        toast('⚠ AI UNAVAILABLE — USING TEMPLATE SCENES');
    }

    document.getElementById('loading-1').classList.remove('visible');

    FS[slug].scenes = SCENES_DATA;
    fsPopulate(slug, 'scenes', 'scene_list.json'); fsPopulate(slug, 'scenes', 'scene_keywords.json');
    SCENES_DATA.slice(0, 2).forEach((_, i) => fsPopulate(slug, 'scenes', `scene_0${i + 1}.txt`));

    const f1 = SCENES_DATA.filter(s => s.film === 'film1');
    const f2 = SCENES_DATA.filter(s => s.film === 'film2');
    const an = SCENES_DATA.filter(s => s.anim);
    document.getElementById('s1-title').textContent = `SCENE EXTRACTION — ${window.MOVIE_NAME.toUpperCase()}`;
    document.getElementById('stats-1').innerHTML = `
    <div class="stat-chip red"><strong>${SCENES_DATA.length}</strong>Total Scenes</div>
    <div class="stat-chip yellow"><strong>${f1.length}</strong>${window.MOVIE_NAME}</div>
    ${window.MOVIE_NAME_2 ? `<div class="stat-chip cyan"><strong>${f2.length}</strong>${window.MOVIE_NAME_2}</div>` : ''}
    <div class="stat-chip purple"><strong>${an.length}</strong>Anim Triggers</div>
    <div class="stat-chip teal">outputs/${slug}/scenes/</div>`;

    const container = document.getElementById('scenes-output'); container.innerHTML = '';
    const d1 = document.createElement('div'); d1.className = 'film-divider';
    d1.innerHTML = `<div class="film-divider-text">🎬 ${window.MOVIE_NAME.toUpperCase()}</div>`; container.appendChild(d1);
    f1.forEach((s, i) => container.appendChild(buildSceneCard(s, i)));
    if (f2.length) {
        const d2 = document.createElement('div'); d2.className = 'film-divider';
        d2.innerHTML = `<div class="film-divider-text">🎬 ${(window.MOVIE_NAME_2 || window.MOVIE_NAME + ' 2').toUpperCase()}</div>`; container.appendChild(d2);
        f2.forEach((s, i) => container.appendChild(buildSceneCard(s, i)));
    }

    renderFsTree(); setNode('node-1', 'done'); showPanel('output-1');
    toast(`✓ Stage 1 — ${SCENES_DATA.length} scenes extracted`);
}

// ══════════════════════════════════════════════════════════════════
// STAGE 2 — SCRIPT
// ══════════════════════════════════════════════════════════════════
async function runStage2() {
    document.getElementById('loading-2').classList.add('visible');
    setNode('node-2', 'active');

    const slug = getSlug();
    const s1 = document.getElementById('synopsis1')?.value?.trim() || '';
    const s2 = document.getElementById('synopsis2')?.value?.trim() || '';
    const hasRealScenes = SCENES_DATA.length > 0 && !(SCENES_DATA[0].desc || SCENES_DATA[0].description || '').includes('lead character is established');

    if (window.YT_META && window.YT_META.videoId) {
        // ── YOUTUBE TAB: Emotion-aware script from transcript + scored scenes ──
        try {
            const topScenes = window.YT_SCENES ? window.YT_SCENES.slice(0, 8) : [];
            const transcriptSnippet = window.YT_META.transcript
                ? window.YT_META.transcript.slice(0, 10000)
                : null;

            const ytScriptPrompt = `You are a professional cinematic narrator and screenwriter. Write a dramatic, emotionally intelligent narration script for a 3–5 minute recap video of this YouTube video.

VIDEO TITLE: ${window.YT_META.title}
CHANNEL: ${window.YT_META.channelName}

${topScenes.length ? `MOST REPLAYED / HIGHEST SCORED SEGMENTS (these are the emotional peaks — give them the most powerful narration lines):
${topScenes.map(s => `[RANK ${s.rank} | Score:${s.score} | Type:${s.type} | At:${s.startTime}]
Keywords: ${s.keywords.join(', ')}
Content: ${s.text}`).join('\n\n')}` : ''}

${transcriptSnippet ? `FULL TRANSCRIPT (first 10000 chars — use this to understand the natural language, dialogue rhythm, and emotional tone of the video):
${transcriptSnippet}` : ''}

${SCENES_DATA.length ? `EXTRACTED SCENES (use as your structural backbone, one narration line per scene):
${SCENES_DATA.map(s => `[${s.num}] "${s.title}" (${s.tone}${s.anim ? ', HIGH ENERGY' : ''}): ${s.desc}`).join('\n')}` : ''}

YOUR TASK:
Write exactly ${SCENES_DATA.length || 16} narration lines — one per scene in chronological order — that together tell the COMPLETE story of this video from beginning to end.

CRITICAL RULES FOR EMOTIONAL INTELLIGENCE:
1. PRIORITIZE the highest-scored replay segments — these are the moments viewers rewatched most. Your narration for those scenes must be the most powerful, memorable lines in the entire script.

2. DETECT TONE FROM THE TRANSCRIPT and match your writing style:
   - If the transcript has rapid back-and-forth dialogue → short punchy narration lines
   - If the transcript has long explanatory passages → flowing, building sentences
   - If the transcript has shouting or exclamation → high energy staccato rhythm
   - If the transcript has quiet or emotional moments → slow, deliberate word choices
   - If the transcript has comedy → deadpan delivery, matter-of-fact about absurd events

3. STORY ARC — script must feel like a complete film:
   - Opening lines: Hook the viewer. Establish who and what.
   - Middle lines: Escalate. Things get complicated. Stakes rise.
   - Peak lines (matching top replay segments): Maximum impact. Best writing.
   - Final lines: Resolution. Earned ending that references how it all started.

4. NATURAL LANGUAGE RULES:
   - Use actual names, places, and events from the transcript
   - Vary sentence length deliberately — mix 4-word punches with 20-word flows
   - Never use "journey", "adventure", or "little did they know"
   - Each line must connect to the previous and lead into the next
   - Lines for high-score segments: max 15 words, maximum impact
   - Lines for low-score segments: can be longer, more atmospheric

5. TIMING — base on scene energy:
   - High energy / top replay scenes: 10-11 seconds apart
   - Normal scenes: 13-14 seconds apart
   - Slow / emotional scenes: 16-18 seconds apart
   - Start at 00:15

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "time": "00:15",
    "text": "narration line here",
    "tone": "comedy|action|drama|climax|chaos|absurdist",
    "energy": "low|medium|high",
    "sceneRef": "01",
    "isReplayPeak": true
  }
]`;

            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': getApiPayload().apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerously-allow-browser': 'true'
                },
                body: JSON.stringify({
                    model: getApiPayload().model || 'claude-3-5-sonnet-20241022',
                    max_tokens: 3000,
                    messages: [{ role: 'user', content: ytScriptPrompt }]
                })
            });

            const data = await res.json();
            const raw = data.content.map(c => c.text || '').join('');
            const clean = raw.replace(/```json|```/g, '').trim();
            const jsonStart = clean.indexOf('[');
            const jsonStr = jsonStart >= 0 ? clean.slice(jsonStart) : clean;
            SCRIPT_DATA = JSON.parse(jsonStr);
            toast('✓ CLAUDE WROTE SCRIPT FROM VIDEO TRANSCRIPT');

        } catch (err) {
            console.error('YouTube script generation failed:', err);
            SCRIPT_DATA = getScriptData();
            toast('⚠ YOUTUBE SCRIPT FAILED — USING TEMPLATE');
        }

    } else {
        try {
            const film1Scenes = SCENES_DATA.filter(s => s.film === 'film1' || s.film === 'bridge');
            const film2Scenes = SCENES_DATA.filter(s => s.film === 'film2');
            const hasSequel = film2Scenes.length > 0 && window.MOVIE_NAME_2;

            const scriptPrompt = `You are a professional cinematic narrator and screenwriter. Write a richly detailed, emotionally intelligent narration script for a 3–5 minute cinematic recap video.

${hasSequel ? `THIS IS A TWO-FILM RECAP: "${window.MOVIE_NAME}" AND "${window.MOVIE_NAME_2}"
The script MUST cover BOTH films completely — Film 1 first, then a clear bridge cut, then Film 2.
Do NOT stop after Film 1. Film 2 is equally important and must get equal narration depth.` : `FILM: "${window.MOVIE_NAME}"`}

FULL SYNOPSIS:
${s1}${s2 ? `\n\nSEQUEL SYNOPSIS (${window.MOVIE_NAME_2}) — MUST BE FULLY COVERED:\n${s2}` : ''}

EXTRACTED SCENES — write one elaborated script block per scene:
${SCENES_DATA.map(s => `[${s.num}] [${(s.film || '').toUpperCase()}] "${s.title}" | Tone: ${s.tone}${s.anim ? ' | HIGH ENERGY' : ''}${s.flash ? ' | FLASHBACK' : ''}\nSynopsis detail: ${s.desc}`).join('\n\n')}

YOUR TASK:
Write exactly ${SCENES_DATA.length} script blocks — one per scene above, in the same order.
${hasSequel ? `MANDATORY: The first ${film1Scenes.length} blocks cover ${window.MOVIE_NAME}. The remaining ${film2Scenes.length} blocks MUST cover ${window.MOVIE_NAME_2} with equal depth and detail.` : ''}

ELABORATION RULES — each script block must have 3–5 sentences:
- Sentence 1 (ESTABLISH): Set the scene. Where are we? Who is here? What is the mood?
- Sentence 2 (ACTION): What actually happens in this scene? Reference specific events, character names, objects from the synopsis.
- Sentence 3 (CONFLICT/TWIST): What goes wrong, what is revealed, or what makes this scene memorable?
- Sentence 4 (EMOTIONAL BEAT): How does this feel? What does the audience experience?
- Sentence 5 (BRIDGE — optional): A transition line that leads into the next scene.

TONE MATCHING per scene type:
- Comedy/Slapstick → deadpan delivery, matter-of-fact about absurd events, dry wit
- Action/Fight → short punchy sentences mixed with rapid-fire lists. No long clauses.
- Chaos → slightly unhinged run-ons that spiral and pile up, comma after comma
- Climax → slow. deliberate. one beat at a time. then a single long release sentence.
- Absurdist → completely calm narration of completely insane events
- Drama/Narrative → warm, flowing, measured sentences with weight
- Flashback/Bridge → single sharp cut line. tonal reset. one sentence only. then silence.

STORY ARC REQUIREMENTS:
- Film 1 opening (scenes 1-3): Hook the viewer. Establish Shaji Pappan's world immediately.
- Film 1 escalation (scenes 4-7): Each scene must feel worse than the last. Stack the chaos.
- Film 1 climax (scenes 8-9): Maximum impact. The ironic resolution. Reference the specific MacGuffin.
${hasSequel ? `- Bridge scene: Hard cut. One line. Reset everything.
- Film 2 opening: Re-establish the world. Show what changed and what didn't.
- Film 2 escalation: New stakes, familiar incompetence. Reference Film 1 events.
- Film 2 climax: Earned ending. Reference how both films connect.` : '- Final scenes: Earned ending. Reference how it all started.'}

NATURAL LANGUAGE RULES:
- Use ACTUAL names from synopsis: ${[...new Set([...s1.match(/[A-Z][a-z]+ [A-Z][a-z]+/g) || [], ...s1.match(/Shaji|Pinky|Dude|Sarbath|Abu|Cleetus|Satan|Xavier/g) || []])].slice(0, 8).join(', ')}
- Reference SPECIFIC objects and events: goat, herb, trophy, currency plates, demonetisation, costumes
- Vary sentence length: mix 4-word punches with 20-word flowing sentences
- Never use "journey", "adventure", "little did they know", "in a world"
- Each block must be self-contained but flow naturally into the next

TIMING — one timestamp per scene block:
- High energy/chaos scenes: 10-11 seconds apart
- Normal scenes: 13-14 seconds apart
- Slow/emotional/bridge scenes: 16-18 seconds apart
- Start at 00:15

Return ONLY a valid JSON array of exactly ${SCENES_DATA.length} objects, no markdown:
[
  {
    "time": "00:15",
    "sceneNum": "01",
    "film": "film1",
    "title": "scene title",
    "text": "Full elaborated 3-5 sentence narration block here. Second sentence with specific event details. Third sentence with the twist or conflict. Fourth sentence with the emotional beat.",
    "tone": "comedy|action|drama|climax|chaos|absurdist|slapstick|bridge",
    "energy": "low|medium|high",
    "wordCount": 45
  }
]`;

            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': getApiPayload().apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerously-allow-browser': 'true'
                },
                body: JSON.stringify({
                    model: getApiPayload().model || 'claude-3-5-sonnet-20241022',
                    max_tokens: 3000,
                    messages: [{ role: 'user', content: scriptPrompt }]
                })
            });

            const data = await res.json();
            const raw = data.content.map(c => c.text || '').join('');
            const clean = raw.replace(/```json|```/g, '').trim();
            const jsonStart = clean.indexOf('[');
            const jsonStr = jsonStart >= 0 ? clean.slice(jsonStart) : clean;
            SCRIPT_DATA = JSON.parse(jsonStr);
            toast('✓ CLAUDE WROTE EMOTIONALLY INTELLIGENT SCRIPT');

        } catch (err) {
            console.error('Script generation failed, using fallback:', err);
            SCRIPT_DATA = getScriptData();
            toast('⚠ AI UNAVAILABLE — USING TEMPLATE SCRIPT');
        }
    }

    document.getElementById('loading-2').classList.remove('visible');
    FS[slug].script = SCRIPT_DATA;
    fsPopulate(slug, 'script', `${slug}_recap_script.txt`); fsPopulate(slug, 'script', `${slug}_narration_script.txt`);

    document.getElementById('s2-title').textContent = window.MOVIE_NAME_2
        ? `CINEMATIC RECAP SCRIPT — ${window.MOVIE_NAME.toUpperCase()} + ${window.MOVIE_NAME_2.toUpperCase()}`
        : `CINEMATIC RECAP SCRIPT — ${window.MOVIE_NAME.toUpperCase()}`;

    const wordCount = SCRIPT_DATA.reduce((acc, s) => acc + (s.narration || s.text || '').split(' ').length, 0);
    const bridges = SCRIPT_DATA.filter(s => (s.narration || s.text || '').includes('⚡') || (s.tone && s.tone.includes('flash'))).length;
    const lastTime = SCRIPT_DATA[SCRIPT_DATA.length - 1]?.time || '03:20';
    const highEnergy = SCRIPT_DATA.filter(s => s.energy === 'high').length;
    document.getElementById('stats-2').innerHTML = `
    <div class="stat-chip red"><strong>~${wordCount}</strong>Words</div>
    <div class="stat-chip yellow"><strong>${SCRIPT_DATA.length}</strong>Timestamps</div>
    <div class="stat-chip cyan"><strong>${lastTime}</strong>Est. Duration</div>
    <div class="stat-chip purple"><strong>${bridges}</strong>Bridge Cuts</div>
    <div class="stat-chip amber"><strong>${highEnergy}</strong>High Energy</div>
    ${window.YT_META ? `<div class="stat-chip purple"><strong>${SCRIPT_DATA.filter(s => s.isReplayPeak).length}</strong>Replay Peaks</div>` : ''}`;

    const scriptContent = document.getElementById('script-output');
    scriptContent.innerHTML = SCRIPT_DATA.map((line, i) => {
        const s = line;
        const nar = s.narration || s.text || '';
        const isBridge = nar.includes('BRIDGE CUT') || nar.includes('⚡');

        const sceneNum = String(i + 1).padStart(2, '0');
        const sceneData = SCENES_DATA[i] || {};
        const locationMap = { comedy: 'INT. COMEDY SEQUENCE', action: 'EXT. ACTION SEQUENCE', fight: 'INT. FIGHT SEQUENCE', climax: 'EXT. CLIMAX', narrative: 'INT. ESTABLISHING SHOT', chaos: 'EXT. CHAOS SEQUENCE', drama: 'INT. DRAMATIC SCENE', slapstick: 'INT. SLAPSTICK SEQUENCE', absurdist: 'INT. ABSURDIST SCENE' };
        const sceneTag = locationMap[(s.tone || sceneData.tone || '').toLowerCase()] || `SCENE ${sceneNum}`;
        const timeOfDay = s.energy === 'high' ? 'NIGHT' : i < (SCRIPT_DATA.length / 2) ? 'DAY' : 'NIGHT';
        const cameraDir = s.energy === 'high' ? 'Camera cuts rapidly, handheld urgency.' : s.energy === 'low' ? 'Camera holds still. Let the silence breathe.' : 'Camera pushes slowly forward, establishing the scene.';

        return `${s.film === 'film2' && (i === 0 || SCRIPT_DATA[i - 1]?.film !== 'film2') ? `<div style="border-top:1px solid var(--border2);margin:1.5rem 0;padding-top:1rem;font-family:Sora,sans-serif;font-size:.7rem;color:var(--accent-light);letter-spacing:.1em">🎬 ${(window.MOVIE_NAME_2 || 'FILM 2').toUpperCase()} — CONTINUES</div>` : ''}
    <div style="padding:.6rem 0;border-bottom:1px solid var(--border);flex-direction:column;display:flex;gap:.15rem;${isBridge ? 'border-left:3px solid var(--amber);padding-left:.75rem;' : ''}">
      <div class="script-scene-tag">[SCENE ${sceneNum} — ${sceneTag}]</div>
      <div class="script-scene-action">${cameraDir}</div>
      <div class="script-narrator">NARRATOR (V.O.):${s.isReplayPeak ? ' <span style="font-size:.6rem;background:rgba(124,58,237,.3);color:#a78bfa;padding:1px 6px;border-radius:10px;margin-left:6px;font-family:Inter,sans-serif;font-weight:600">★ REPLAY PEAK</span>' : ''}</div>
      <div class="script-vo-text" style="line-height:1.9">${nar}</div>
      ${s.wordCount ? `<div style="font-size:.62rem;color:var(--text3);margin-top:.4rem;font-family:monospace">${s.wordCount} words · ${s.time}</div>` : ''}
    </div>`;
    }).join('') + '<span class="script-cursor"></span>';

    renderFsTree(); setNode('node-2', 'done'); showPanel('output-2');
    toast(`✓ Stage 2 — Script generated (${SCRIPT_DATA.length} timestamps)`);
}

// ══════════════════════════════════════════════════════════════════
// STAGE 3 — STORYBOARD
// ══════════════════════════════════════════════════════════════════
const CAMERAS = { '01': 'Slow tracking push-in', '02': 'Dynamic zoom-out', '03': 'Rapid-cut multi-angle', '04': 'Aerial wide → track', '05': 'Low-angle slow push-in', '06': 'Overhead map → zoom', '07': 'Side-scroll wide', '08': 'Extreme slow-mo', '09': 'Static DVD aesthetic', '10': 'Mirror of opening', '11': 'Fixed wide, comedy', '12': 'Stadium → close-up', '13': 'Speed-ramp split screen', '14': 'Slow pan wide → close', '15': 'Continuous side-scroll' };
const TIMINGS = ['00:05', '00:18', '00:30', '00:45', '00:58', '01:18', '01:30', '01:45', '02:05', '02:22', '02:38', '02:48', '03:00', '03:12', '03:28'];

async function runStage3() {
    document.getElementById('loading-3').classList.add('visible');
    setNode('node-3', 'active');

    const slug = getSlug();
    try {
        const data = await fetchStage('storyboard', {
            scenes: SCENES_DATA, script: SCRIPT_DATA, movieName: window.MOVIE_NAME, movieName2: window.MOVIE_NAME_2
        });
        PANELS_DATA = data.panels;
    } catch (err) {
        console.error(err);
        toast('⚠ API error — falling back to demo storyboard');
        PANELS_DATA = getPanelsData();
    }

    document.getElementById('loading-3').classList.remove('visible');

    FS[slug].panels = PANELS_DATA;
    fsPopulate(slug, 'storyboard', 'storyboard_frames.json');

    document.getElementById('s3-title').textContent = `VISUAL STORYBOARD — ${PANELS_DATA.length} Panels`;

    // Build filmstrip decoration
    document.getElementById('filmstrip-row').innerHTML = Array(20).fill('<div class="filmstrip-cell"></div>').join('');

    // TAB A — Panel grid
    const container = document.getElementById('storyboard-output'); container.innerHTML = '';
    PANELS_DATA.forEach((p, i) => {
        const frameNum = String(p.frame_number || p.num || i + 1).padStart(2, '0');
        const visualDesc = p.visual_description || p.desc || '';
        const title = p._internal_title || p.title || 'Scene ' + frameNum;
        const emoji = p._internal_emoji || p.emoji || '🎬';
        const typeCls = p.style || p.animation_style || p.shot_type || p.type || 'cinematic';
        const isAnim = typeCls === 'animated' || typeCls === 'comic';

        const filmCls = p.film === 'film1' ? 'film1' : p.film === 'film2' ? 'film2' : 'bridge';
        const filmLbl = p.film === 'film1' ? (window.MOVIE_NAME || 'Film 1') : p.film === 'film2' ? (window.MOVIE_NAME_2 || 'Film 2') : 'Bridge';
        const filmTagCls = p.film === 'film1' ? 'film1-tag' : p.film === 'film2' ? 'film2-tag' : 'bridge-tag';
        const el = document.createElement('div'); el.className = 'story-panel'; el.style.animationDelay = `${i * .06}s`;
        el.innerHTML = `
      <div class="panel-visual ${filmCls}">
        <span class="panel-num">SCENE ${frameNum}</span>
        <span style="font-size:2.5rem;z-index:1;position:relative">${emoji}</span>
        <span class="panel-type-badge ${typeCls}">${isAnim ? 'Animated' : 'Cinematic'}</span>
      </div>
      <div class="panel-info"><div class="panel-title">${title}</div><div class="panel-desc">${visualDesc}</div></div>
      <div class="panel-footer"><span class="panel-film-tag ${filmTagCls}">${filmLbl}</span><span style="font-size:.65rem;color:var(--text3)">⋯</span></div>`;
        container.appendChild(el);
    });

    // TAB B — DrawStory
    buildDrawStoryPanel();

    // TAB C — AI prompts ready
    document.getElementById('aip-gen-btn').disabled = false;
    document.getElementById('aip-grid').innerHTML = `<p style="font-size:.65rem;color:var(--text2);text-align:center;padding:1.5rem">✅ Click <strong style="color:var(--accent)">"Generate AI Image Prompts"</strong> above to get Midjourney / DALL-E / SD prompts for all ${PANELS_DATA.length} panels.</p>`;

    renderFsTree(); setNode('node-3', 'done'); showPanel('output-3');
    toast(`✓ Stage 3 — ${PANELS_DATA.length} storyboard panels built`);
}

// DrawStory panel builder
function buildDrawStoryPanel() {
    const m1 = window.MOVIE_NAME || 'Film';
    const list = document.getElementById('ds-scene-list'); list.innerHTML = '';
    PANELS_DATA.forEach((p, i) => {
        const frameNum = String(p.frame_number || p.num || i + 1).padStart(2, '0');
        const visualDesc = p.visual_description || p.desc || '';
        const title = p._internal_title || p.title || 'Scene ' + frameNum;
        const typeCls = p.animation_style || p.shot_type || p.type || 'cinematic';
        const isAnim = typeCls === 'animated' || typeCls === 'comic';
        const script = SCRIPT_DATA[i] || SCRIPT_DATA[SCRIPT_DATA.length - 1] || {};
        const nar = script.narration || script.text || '';
        const filmTag = p.film === 'film1' ? m1 : p.film === 'film2' ? (window.MOVIE_NAME_2 || m1 + ' 2') : 'Bridge';
        const style = isAnim ? 'Anime storyboard, bold outlines, flat vibrant colors, dynamic action lines' : 'Cinematic storyboard, dramatic lighting, film noir shadows, high contrast';
        const prompt = `Scene: ${title}. ${visualDesc} ${nar ? 'Narration: "' + nar.substring(0, 60) + '..."' : ''} Style: ${style}. Film: ${filmTag}. Camera: ${CAMERAS[frameNum] || 'Medium shot'}. Render as storyboard panel.`;
        const el = document.createElement('div'); el.className = 'ds-scene-item';
        el.innerHTML = `
      <div class="ds-scene-header">
        <span class="ds-scene-num">${frameNum}</span>
        <span class="ds-scene-title">${title}</span>
        <div class="ds-scene-badges">
          <span class="ds-badge ${isAnim ? 'ds-badge-anim' : 'ds-badge-real'}">${isAnim ? '⚡ Animated' : '📷 Realistic'}</span>
          <span class="ds-badge ds-badge-shot">${filmTag}</span>
        </div>
      </div>
      <div class="ds-prompt-box" onclick="copyText(this.dataset.prompt,'PROMPT ${frameNum} COPIED')" data-prompt="${prompt.replace(/"/g, '&quot;')}">
        ${prompt}
        <button class="ds-copy-btn" onclick="event.stopPropagation();copyText(this.parentElement.dataset.prompt,'COPIED')">COPY</button>
      </div>
      <div class="ds-scene-meta">
        <span class="ds-meta-pill">🎥 ${CAMERAS[frameNum] || 'Medium shot'}</span>
        <span class="ds-meta-pill">⏱ ${TIMINGS[i] || '00:00'}</span>
        <span class="ds-meta-pill">🎨 ${isAnim ? 'Anime' : 'Cinematic'}</span>
      </div>`;
        list.appendChild(el);
    });
}
function copyText(text, msg) { navigator.clipboard.writeText(text).then(() => toast(`📋 ${msg || 'COPIED'}`)); }
function copyAllDrawStoryPrompts() {
    const els = document.querySelectorAll('.ds-prompt-box'); if (!els.length) { toast('⚠ Run Stage 3 first'); return; }
    copyText(Array.from(els).map((el, i) => `=== SCENE ${String(i + 1).padStart(2, '0')} ===\n${el.dataset.prompt}`).join('\n\n'), `All ${els.length} DrawStory prompts copied`);
}
function exportDrawStoryTxt() {
    if (!PANELS_DATA.length) { toast('⚠ Run Stage 3 first'); return; }
    const els = document.querySelectorAll('.ds-prompt-box');
    const slug = getSlug();
    dlBlob(Array.from(els).map((el, i) => `SCENE ${String(i + 1).padStart(2, '0')} — ${PANELS_DATA[i]?.title || ''}\n${el.dataset.prompt}`).join('\n\n────────────────────────\n\n'), `${slug}_drawstory_prompts.txt`, 'text/plain');
    toast(`⬇ ${slug}_drawstory_prompts.txt`);
}

// AI Image Prompts
async function generateAIImagePrompts() {
    if (!PANELS_DATA.length) { toast('⚠ Run Stage 3 first'); return; }
    const btn = document.getElementById('aip-gen-btn'), loading = document.getElementById('aip-loading'), grid = document.getElementById('aip-grid');
    btn.disabled = true; loading.classList.add('visible'); grid.innerHTML = '';

    try {
        const data = await fetchStage('image-prompts', {
            panels: PANELS_DATA, script: SCRIPT_DATA, movieName: window.MOVIE_NAME
        });
        AI_PROMPTS_DATA = data.prompts;
    } catch (err) {
        console.error(err);
        toast('⚠ API error — falling back to local fallback generator');
        AI_PROMPTS_DATA = generateFallbackPrompts();
    }

    loading.classList.remove('visible');
    renderAIPrompts(AI_PROMPTS_DATA);
    fsPopulate(getSlug(), 'storyboard', 'ai_image_prompts.json');
    renderFsTree();
    toast(`✓ ${AI_PROMPTS_DATA.length} AI image prompts generated`);
}
function generateFallbackPrompts() {
    const m1 = window.MOVIE_NAME || 'Film';
    return PANELS_DATA.map((p, i) => {
        const isAnim = (p.style || p.shot_type) === 'comic' || (p.style || p.shot_type) === 'animated';
        const title = p._internal_title || p.title || `Panel ${i + 1}`;
        const promptText = isAnim
            ? `${title} — ${p.visual_description || ''} Characters are expressive and dynamic. Camera: ${p.camera_angle || 'Medium shot'}. Lighting: ${p.lighting || 'Dramatic'}. Comic-book visual style: bold black outlines, flat vibrant colors, dynamic action lines, manga panel energy, speed lines, high saturation. Film: ${m1}. Aspect ratio 16:9.`
            : `${title} — ${p.visual_description || ''} Characters are detailed and realistic. Camera: ${p.camera_angle || 'Medium shot'}. Lighting: ${p.lighting || 'Dramatic'}. Cinematic composition: chiaroscuro, film grain, anamorphic lens bokeh, shallow depth of field. Film: ${m1}. Aspect ratio 16:9.`;
        return {
            frame_number: p.frame_number || (i + 1),
            prompt: promptText,
            _internal_title: title,
            _internal_prompt: promptText,
            style: isAnim ? 'animated' : 'cinematic',
            negative: 'blurry, low quality, watermark, text overlay, bad anatomy, deformed',
            aspect: '16:9', tools: ['midjourney', 'dalle', 'stable-diffusion']
        };
    });
}
function renderAIPrompts(prompts) {
    const grid = document.getElementById('aip-grid'); grid.innerHTML = '';
    prompts.forEach((p, i) => {
        const style = p.style === 'anime' || p.style === 'animated' ? 'animated' : p.style === 'manga' ? 'manga' : 'cinematic';
        const promptText = p.prompt || p._internal_prompt || '';
        const safePrompt = promptText.replace(/'/g, "\\'");
        const title = p._internal_title || PANELS_DATA[i]?._internal_title || PANELS_DATA[i]?.title || 'Panel ' + (p.frame_number || i + 1);
        const el = document.createElement('div'); el.className = 'aip-card'; el.style.animationDelay = `${i * .04}s`;
        el.innerHTML = `
      <div class="aip-card-header">
        <span class="aip-card-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="aip-card-title">${title}</span>
        <span class="aip-style-badge ${style}">${p.style || 'cinematic'}</span>
      </div>
      <div class="aip-card-body">
        <div class="aip-prompt-label">IMAGE PROMPT</div>
        <div class="aip-prompt-text" onclick="copyText('${safePrompt}','Prompt ${i + 1} copied')">${promptText}</div>
        ${p.negative ? `<div class="aip-prompt-label" style="margin-top:.6rem">NEGATIVE PROMPT</div><div style="font-size:.6rem;color:var(--text2);background:var(--bg);border:1px solid var(--border);border-radius:3px;padding:.5rem .75rem;margin-top:.2rem">${p.negative}</div>` : ''}
        <div class="aip-tool-row" style="margin-top:.65rem">
          <span style="font-size:.55rem;color:var(--text2)">USE IN:</span>
          <span class="aip-tool-chip mj" onclick="copyForTool('${safePrompt}','midjourney',${i})">Midjourney</span>
          <span class="aip-tool-chip dalle" onclick="copyForTool('${safePrompt}','dalle',${i})">DALL-E 3</span>
          <span class="aip-tool-chip sd" onclick="copyForTool('${safePrompt}','stable-diffusion',${i})">Stable Diffusion</span>
        </div>
      </div>
      <div class="aip-card-footer">
        <span class="aip-footer-pill">📐 ${p.aspect || '16:9'}</span>
        <span class="aip-footer-pill">🖼 Frame ${p.frame_number || String(i + 1).padStart(2, '0')}</span>
        <span class="aip-footer-pill">🎨 ${p.style || 'cinematic'} style</span>
      </div>`;
        grid.appendChild(el);
    });
    const row = document.createElement('div'); row.className = 'btn-row'; row.style.marginTop = '1rem';
    row.innerHTML = `<button class="btn btn-ghost" onclick="exportAIPrompts()">⬇ Download All AI Prompts (.json)</button><button class="btn btn-ghost" onclick="copyAllAIPrompts()">📋 Copy All</button>`;
    grid.appendChild(row);
}
function copyForTool(prompt, tool, idx) {
    let f = prompt;
    if (tool === 'midjourney') f += ' --ar 16:9 --v 6 --style raw';
    if (tool === 'stable-diffusion') f += ', masterpiece, best quality, ultra detailed';
    navigator.clipboard.writeText(f).then(() => toast(`📋 Prompt ${idx + 1} copied for ${tool}`));
}
function exportAIPrompts() {
    if (!AI_PROMPTS_DATA.length) { toast('⚠ Generate prompts first'); return; }
    const slug = getSlug(), fname = `${slug}_ai_image_prompts.json`;
    dlBlob(JSON.stringify({ movie: window.MOVIE_NAME, generated: new Date().toISOString(), prompts: AI_PROMPTS_DATA }, null, 2), fname, 'application/json');
    toast(`⬇ ${fname}`);
}
function copyAllAIPrompts() {
    if (!AI_PROMPTS_DATA.length) { toast('⚠ Generate prompts first'); return; }
    copyText(AI_PROMPTS_DATA.map((p, i) => `=== FRAME ${String(i + 1).padStart(2, '0')} — ${p.title} ===\n${p._internal_prompt}\nNEGATIVE: ${p.negative || ''}`).join('\n\n─────────────────────────\n\n'), `All ${AI_PROMPTS_DATA.length} AI prompts copied`);
}

// ══════════════════════════════════════════════════════════════════
// STAGE 4 — VIDEO PLAN
// ══════════════════════════════════════════════════════════════════
async function runStage4() {
    document.getElementById('loading-4').classList.add('visible');
    setNode('node-4', 'active');

    const slug = getSlug();
    try {
        const data = await fetchStage('video-plan', {
            panels: PANELS_DATA, script: SCRIPT_DATA, movieName: window.MOVIE_NAME, movieName2: window.MOVIE_NAME_2
        });
        SHOTS_DATA = data.shots;
    } catch (err) {
        console.error(err);
        toast('⚠ API error — falling back to demo video plan');
        SHOTS_DATA = getShotsData();
    }

    document.getElementById('loading-4').classList.remove('visible');

    const anim = SHOTS_DATA.filter(s => s.shot_type === 'animated').length;
    const real = SHOTS_DATA.filter(s => s.shot_type === 'realistic').length;

    document.getElementById('s4-title').textContent = `VIDEO PLAN — ${window.MOVIE_NAME.toUpperCase()}`;
    document.getElementById('stats-4').innerHTML = `
    <div class="stat-chip red"><strong>${SHOTS_DATA.length}</strong>Total Shots</div>
    <div class="stat-chip cyan"><strong>${anim}</strong>Animated</div>
    <div class="stat-chip yellow"><strong>${real}</strong>Realistic</div>
    <div class="stat-chip purple"><strong>4:50</strong>Runtime</div>
    <div class="stat-chip teal">outputs/${slug}/video/</div>`;

    document.getElementById('tl-label-1').textContent = window.MOVIE_NAME || 'FILM 1';
    document.getElementById('tl-label-2').textContent = window.MOVIE_NAME_2 || 'FILM 2';

    const container = document.getElementById('shots-output'); container.innerHTML = '';
    SHOTS_DATA.forEach((s, i) => {
        const shotNum = String(s.shot_number || s.num || i + 1).padStart(2, '0');
        const title = s._internal_title || s.title || 'Shot ' + shotNum;
        const typeCls = s.shot_type || s.type || 'realistic';
        const isAnim = typeCls === 'animated';
        const camera = s.camera_movement || s.camera_motion || s.camera || 'Static';
        const sfx = s.sound_effect || s.sfx || '';
        const music = s.music_cue || s.music_track || s._internal_music || s.music || '';
        const vo = s.narration_text || s.vo || '';

        const el = document.createElement('div'); el.className = 'shot-item'; el.style.animationDelay = `${i * .04}s`;
        el.innerHTML = `
      <div class="shot-num-col">
        <div class="shot-number">${shotNum}</div>
        <div class="shot-duration">${s.duration || ''}</div>
        <div class="shot-type-badge ${typeCls}">${isAnim ? '⚡ ANIM' : '📷 REAL'}</div>
      </div>
      <div>
        <div class="shot-title">${title}</div>
        <div class="shot-meta">
          <span class="shot-meta-item">🎥 ${camera}</span>
          <span class="shot-meta-item">🔊 ${sfx}</span>
          <span class="shot-meta-item">🎵 ${music}</span>
        </div>
        <div class="shot-vo">${vo}</div>
      </div>`;
        container.appendChild(el);
    });

    renderFsTree(); setNode('node-4', 'done'); setNode('node-final', 'active'); showPanel('output-4');
    toast(`✓ Stage 4 — ${SHOTS_DATA.length} shots planned`);
}

// ══════════════════════════════════════════════════════════════════
// EXPORT PANEL + DOWNLOADS
// ══════════════════════════════════════════════════════════════════
function showExport() {
    const slug = getSlug();
    const label = window.MOVIE_NAME_2 ? `${window.MOVIE_NAME} + ${window.MOVIE_NAME_2}` : (window.MOVIE_NAME || 'your film');
    document.getElementById('export-title-label').textContent = `Final_Recap_${slug}_v1.mp4`;
    document.getElementById('export-title-label-2').textContent = label;
    document.getElementById('ex-script-name').textContent = `outputs/${slug}/script/${slug}_recap_script.txt`;
    document.getElementById('ex-storyboard-name').textContent = `outputs/${slug}/storyboard/storyboard_frames.json`;
    document.getElementById('ex-shotlist-name').textContent = `outputs/${slug}/video/${slug}_shot_list.json`;
    document.getElementById('ex-scenes-name').textContent = `outputs/${slug}/scenes/scene_list.json`;
    document.getElementById('ex-bundle-name').textContent = `outputs/${slug}/${slug}_full_bundle.json`;
    document.getElementById('ex-synopsis-name').textContent = `outputs/${slug}/input/movie_synopsis.txt`;
    fsPopulate(slug, 'final', `${slug}_cinematic_recap.mp4`);
    renderFsTree(); setNode('node-final', 'done'); showPanel('output-final');
    toast('✓ Pipeline complete — all stages done');
}
function exportScript() {
    if (!SCRIPT_DATA.length) { toast('⚠ Run Stage 2 first'); return; }
    const slug = getSlug();
    dlBlob(`${window.MOVIE_NAME.toUpperCase()} — CINEMATIC RECAP SCRIPT\n${'─'.repeat(50)}\n\n` + SCRIPT_DATA.map(s => `[${s.time}]\n${s.narration || s.text || ''}`).join('\n\n'), `${slug}_recap_script.txt`, 'text/plain');
    toast(`⬇ ${slug}_recap_script.txt`);
}
function exportStoryboard() {
    if (!PANELS_DATA.length) { toast('⚠ Run Stage 3 first'); return; }
    dlBlob(JSON.stringify({ movie: window.MOVIE_NAME, panels: PANELS_DATA }, null, 2), 'storyboard_frames.json', 'application/json');
    toast('⬇ storyboard_frames.json');
}
function exportShotList() {
    if (!SHOTS_DATA.length) { toast('⚠ Run Stage 4 first'); return; }
    const slug = getSlug();
    dlBlob(JSON.stringify({ movie: window.MOVIE_NAME, runtime: '4:50', shots: SHOTS_DATA }, null, 2), `${slug}_shot_list.json`, 'application/json');
    toast(`⬇ ${slug}_shot_list.json`);
}
function exportScenes() {
    if (!SCENES_DATA.length) { toast('⚠ Run Stage 1 first'); return; }
    dlBlob(JSON.stringify({ movie: window.MOVIE_NAME, scenes: SCENES_DATA }, null, 2), 'scene_list.json', 'application/json');
    toast('⬇ scene_list.json');
}
function exportFullBundle() {
    if (!SCENES_DATA.length && !SCRIPT_DATA.length) { toast('⚠ Run pipeline stages first'); return; }
    const slug = getSlug();
    const bundle = { movie: window.MOVIE_NAME, movie2: window.MOVIE_NAME_2 || null, slug, generated: new Date().toISOString(), pipeline: { scenes: SCENES_DATA, script: SCRIPT_DATA, storyboard: PANELS_DATA, shots: SHOTS_DATA, ai_prompts: AI_PROMPTS_DATA } };
    dlBlob(JSON.stringify(bundle, null, 2), `${slug}_full_bundle.json`, 'application/json');
    toast(`⬇ ${slug}_full_bundle.json — complete bundle`);
}
function exportSynopsis() {
    const s1 = document.getElementById('synopsis1').value.trim(); if (!s1) { toast('⚠ No synopsis to export'); return; }
    const s2 = document.getElementById('synopsis2').value.trim();
    let content = `MOVIE: ${window.MOVIE_NAME}\n${'─'.repeat(40)}\n\n${s1}`;
    if (s2) content += `\n\n${'─'.repeat(40)}\nSECOND MOVIE: ${window.MOVIE_NAME_2 || 'Film 2'}\n\n${s2}`;
    dlBlob(content, 'movie_synopsis.txt', 'text/plain');
    toast('⬇ movie_synopsis.txt');
}

// ══════════════════════════════════════════════════════════════════
// RESET
// ══════════════════════════════════════════════════════════════════
function resetPipeline() {
    SCENES_DATA = []; SCRIPT_DATA = []; PANELS_DATA = []; SHOTS_DATA = []; AI_PROMPTS_DATA = [];
    window.MOVIE_NAME = ''; window.MOVIE_NAME_2 = '';
    document.querySelectorAll('.output-panel').forEach(p => p.classList.remove('visible'));
    ['node-input', 'node-fs', 'node-1', 'node-2', 'node-3', 'node-4', 'node-final'].forEach(id => setNode(id, ''));
    setNode('node-input', 'active');
    document.getElementById('movie-name-badge').innerHTML = '';
    document.getElementById('synopsis1').value = '';
    document.getElementById('synopsis2').value = '';
    document.getElementById('title1').value = '';
    document.getElementById('title2').value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('🔄 Pipeline reset — start a new project');
}

// ══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUT: Ctrl+Enter to generate
// ══════════════════════════════════════════════════════════════════
document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runStage1(); }
});
