import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream } from 'fs';
import axios from 'axios';
import FormData from 'form-data';
import https from 'https';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const QURAN_DIR = path.join(__dirname, '..', 'output', 'quran');
const MANIFEST_FILE = path.join(QURAN_DIR, 'manifest.json');

// ── Para 30 (Juz' Amma) scope: Surah 1 (Al-Fatiha) + Surahs 78–114 ──
const ALLOWED_SURAHS = new Set([1, ...Array.from({ length: 37 }, (_, i) => 78 + i)]);

// In-memory cache
let manifestCache = null;
const surahCache = new Map();

export const getManifest = async (req, res) => {
  try {
    if (!manifestCache) {
      if (await fs.pathExists(MANIFEST_FILE)) {
        const full = await fs.readJson(MANIFEST_FILE);
        // Filter to only Para 30 surahs
        manifestCache = full.filter(s => ALLOWED_SURAHS.has(s.number));
      } else {
        return res.status(404).json({ error: "Quran data not built yet. Run: node scripts/buildQuranData.js" });
      }
    }
    res.json(manifestCache);
  } catch (err) {
    console.error("Error serving manifest:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSurah = async (req, res) => {
  try {
    const num = parseInt(req.params.number, 10);
    if (isNaN(num) || num < 1 || num > 114) {
      return res.status(400).json({ error: "Invalid surah number" });
    }

    // Block surahs outside Para 30 scope
    if (!ALLOWED_SURAHS.has(num)) {
      return res.status(403).json({ error: "This app currently only supports Juz' Amma (Para 30): Surahs 78–114 and Al-Fatiha." });
    }

    if (surahCache.has(num)) {
      return res.json(surahCache.get(num));
    }

    const filepath = path.join(QURAN_DIR, `${num}.json`);
    if (await fs.pathExists(filepath)) {
      const data = await fs.readJson(filepath);
      surahCache.set(num, data);
      return res.json(data);
    } else {
      return res.status(404).json({ error: "Surah not found. Run: node scripts/buildQuranData.js" });
    }
  } catch (err) {
    console.error(`Error serving surah ${req.params.number}:`, err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const proxyAudio = (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: "No URL provided" });

  const client = url.startsWith('https') ? https : http;
  
  client.get(url, (proxyRes) => {
    if (proxyRes.statusCode !== 200) {
      return res.status(proxyRes.statusCode).json({ error: "Failed to fetch audio" });
    }
    
    // Pass headers along with explicit CORS and caching
    res.set('Content-Type', proxyRes.headers['content-type'] || 'audio/mpeg');
    res.set('Accept-Ranges', 'bytes');
    res.set('Content-Length', proxyRes.headers['content-length']);
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    proxyRes.pipe(res);
  }).on('error', (e) => {
    console.error("Proxy error:", e);
    res.status(500).json({ error: "Internal server error" });
  });
};

// ── Arabic text normalization ──
function normalizeArabic(text) {
  if (!text) return "";
  
  // Remove HTML tags
  let cleanText = text.replace(/<[^>]*>/g, '');
  
  // Remove custom Tajweed bracket syntax (e.g. [h:1[ٱ] or [l[ل] or ])
  cleanText = cleanText.replace(/\[[a-zA-Z]+(:\d+)?\[/g, '');
  cleanText = cleanText.replace(/\]/g, '');
  
  // Specific Uthmani orthography mappings BEFORE stripping diacritics
  cleanText = cleanText.replace(/\u0648\u0670/g, '\u0627'); // Waw + Dagger Alif -> Alif
  cleanText = cleanText.replace(/\u064A\u0670/g, '\u0627'); // Ya + Dagger Alif -> Alif
  cleanText = cleanText.replace(/\u0670/g, '\u0627'); // Dagger Alif -> Alif
  
  // Remove diacritics (tashkeel) and standard Unicode Waqf marks
  cleanText = cleanText.replace(/[\u064B-\u065F\u06D6-\u06ED]/g, '');
  
  // Remove isolated Waqf letters and marks so they don't count as spoken words
  cleanText = cleanText.replace(/(?:^|\s+)[\u0637\u062C\u0632\u0635\u0642\u0643](?:\s+|$)/g, ' '); // isolated ط, ج, ز, ص, ق, ك
  cleanText = cleanText.replace(/(?:^|\s+)(?:لا|صل|قف)(?:\s+|$)/g, ' '); // isolated لا, صل, قف
  
  // Normalize visually similar characters
  cleanText = cleanText.replace(/[\u0622\u0623\u0625\u0671\u0672\u0673]/g, '\u0627'); // Alif variants
  cleanText = cleanText.replace(/\u0629/g, '\u0647'); // Ta Marbuta -> Ha
  cleanText = cleanText.replace(/\u064A/g, '\u0649'); // Ya -> Alif Maqsura
  cleanText = cleanText.replace(/\u0624/g, '\u0648'); // Waw with Hamza -> Waw
  cleanText = cleanText.replace(/\u0626/g, '\u064A'); // Ya with Hamza -> Ya
  
  // Remove Tatweel (Kashida)
  cleanText = cleanText.replace(/\u0640/g, '');
  
  // Remove Arabic punctuation and standard punctuation
  cleanText = cleanText.replace(/[\u060C\u061B\u061F\.,!\?]/g, '');
  
  // Remove all non-arabic word characters, just keep spaces
  cleanText = cleanText.replace(/[^\u0600-\u06FF\s]/g, '');
  
  return cleanText.trim();
}

// ── Levenshtein distance for fuzzy word matching ──
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// ── Word similarity (0..1) based on Levenshtein ──
function wordSimilarity(a, b) {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  return 1.0 - levenshtein(a, b) / maxLen;
}

// ── Improved word-by-word alignment with fuzzy matching ──
const FUZZY_THRESHOLD = 1.0; // Disable fuzzy matching/autocorrect (require 100% match)

function alignWords(expectedNorm, actualNorm, expectedOriginal) {
  const expWords = expectedNorm.split(/\s+/).filter(Boolean);
  const actWords = actualNorm.split(/\s+/).filter(Boolean);
  
  // Strip the bracket syntax from expectedOriginal for UI display
  let cleanOriginal = expectedOriginal || '';
  cleanOriginal = cleanOriginal.replace(/\[[a-zA-Z]+(:\d+)?\[/g, '');
  cleanOriginal = cleanOriginal.replace(/\]/g, '');
  const origWords = cleanOriginal.split(/\s+/).filter(Boolean);
  
  const result = [];
  let actIndex = 0;
  let correctCount = 0;
  
  for (let i = 0; i < expWords.length; i++) {
    const e = expWords[i];
    let matched = false;
    let bestSim = 0;
    let bestJ = -1;
    
    // Look ahead up to 4 words to tolerate insertions/skips
    const searchEnd = Math.min(actWords.length, actIndex + 4);
    for (let j = actIndex; j < searchEnd; j++) {
      const sim = wordSimilarity(e, actWords[j]);
      if (sim > bestSim) {
        bestSim = sim;
        bestJ = j;
      }
    }
    
    if (bestSim >= FUZZY_THRESHOLD && bestJ >= 0) {
      matched = true;
      actIndex = bestJ + 1;
    }
    
    const displayWord = origWords[i] || e;
    
    result.push({
      word: displayWord,
      matched,
      similarity: Math.round(bestSim * 100),
      index: i
    });
    
    if (matched) correctCount++;
  }
  
  const score = expWords.length > 0 ? Math.round((correctCount / expWords.length) * 100) : 0;
  return { result, score };
}

// ── Main grading endpoint ──
export const gradeRecitation = async (req, res) => {
  let tempPathWithExt = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No audio file provided." });
    }
    
    const { targetText } = req.body;
    if (!targetText) {
      return res.status(400).json({ error: "Target text is required." });
    }

    // Rename temp file to have a proper extension
    tempPathWithExt = req.file.path + '.webm';
    await fs.rename(req.file.path, tempPathWithExt);

    const cleanPromptText = normalizeArabic(targetText);
    let transcription = "";
    let aiEngineAvailable = true;

    try {
      const formData = new FormData();
      formData.append('audio', createReadStream(tempPathWithExt));
      formData.append('expected_text', cleanPromptText);

      console.log("Sending audio to local AI Engine for evaluation...");
      const aiResponse = await axios.post('http://127.0.0.1:8000/evaluate', formData, {
        headers: formData.getHeaders(),
        timeout: 30000 // 30s timeout
      });
      
      transcription = aiResponse.data.transcription || '';
      if (aiResponse.data.error) {
        console.error("AI Engine Error:", aiResponse.data.error);
        return res.status(400).json({ error: aiResponse.data.error });
      }
    } catch (aiError) {
      console.error("AI Engine unreachable:", aiError.message);
      console.error("Make sure the Python AI engine is running: cd ai-engine && python app.py");
      aiEngineAvailable = false;
      // Return a clear error instead of fake scores
      return res.status(503).json({
        error: "AI Engine is not running. Start it with: cd server/ai-engine && python app.py",
        aiEngineDown: true
      });
    }

    const normalizedTarget = normalizeArabic(targetText);
    const normalizedActual = normalizeArabic(transcription);
    
    console.log("=== RECITATION GRADING DEBUG ===");
    console.log("Whisper Output:", transcription);
    console.log("Norm Target:", normalizedTarget);
    console.log("Norm Actual:", normalizedActual);

    const { result, score } = alignWords(normalizedTarget, normalizedActual, targetText);
    console.log("Final Score:", score);
    console.log("================================");

    res.json({
      score,
      transcript: transcription,
      words: result
    });

  } catch (err) {
    console.error("Error grading recitation:", err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    // Always clean up temp files
    if (tempPathWithExt) {
      fs.unlink(tempPathWithExt).catch(() => {});
    }
    if (req.file && req.file.path) {
      fs.unlink(req.file.path).catch(() => {});
    }
  }
};
