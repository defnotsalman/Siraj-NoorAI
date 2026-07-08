import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const INDEX_DIR = path.join(OUTPUT_DIR, 'stories-index');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'stories-manifest.json');

// Default ElevenLabs Voice ID (Adam or a default multilingual-compatible voice)
const VOICE_ID = "pNInz6obpgDQGcFmaJgB"; // Adam

async function synthesizeSpeech(text) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not defined in .env");
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs API Error: ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ElevenLabs has a soft limit around 5000 chars per request.
function chunkUrduText(text, maxChars = 4000) {
  const chunks = [];
  let currentChunk = '';
  
  // Split by common Urdu/Arabic punctuation marks (full stop, question mark) or newlines
  const sentences = text.split(/([۔؟!:\n]+)/);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    if (currentChunk.length + sentence.length > maxChars) {
      if (currentChunk.trim()) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

async function processStory(storyId, slug, fullText, force = false) {
  const outputFile = path.join(AUDIO_DIR, `${storyId}.mp3`);
  
  if (!force && await fs.pathExists(outputFile)) {
    console.log(`[SKIP] Audio already exists for ${slug}`);
    return { status: 'skipped', chars: 0 };
  }

  console.log(`[PROCESS] Generating audio for ${slug}...`);
  const chunks = chunkUrduText(fullText);
  const audioBuffers = [];
  let charCount = 0;

  for (let i = 0; i < chunks.length; i++) {
    console.log(`  -> Synthesizing chunk ${i + 1}/${chunks.length} using ElevenLabs...`);
    const buffer = await synthesizeSpeech(chunks[i]);
    audioBuffers.push(buffer);
    charCount += chunks[i].length;
  }

  const finalBuffer = Buffer.concat(audioBuffers);
  await fs.writeFile(outputFile, finalBuffer);
  
  console.log(`[SUCCESS] Saved ${storyId}.mp3`);
  return { status: 'success', chars: charCount };
}

async function main() {
  await fs.ensureDir(AUDIO_DIR);

  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const targetStorySlug = args.find(a => !a.startsWith('--'));

  if (!await fs.pathExists(MANIFEST_FILE)) {
    console.error("Manifest file not found. Run build:stories first.");
    return;
  }

  const manifest = await fs.readJson(MANIFEST_FILE);
  let totalCharsUsed = 0;
  let successCount = 0;
  let skipCount = 0;
  let failCount = 0;

  for (const story of manifest) {
    if (targetStorySlug && story.slug !== targetStorySlug) continue;

    const indexFile = path.join(INDEX_DIR, `${story.slug}.json`);
    if (!await fs.pathExists(indexFile)) continue;

    const storyData = await fs.readJson(indexFile);
    try {
      const result = await processStory(story.id, story.slug, storyData.fullText, force);
      if (result.status === 'success') successCount++;
      if (result.status === 'skipped') skipCount++;
      totalCharsUsed += result.chars;
    } catch (err) {
      console.error(`[ERROR] Failed to process ${story.slug}:`, err.message);
      failCount++;
    }
  }

  console.log(`\n=== Audio Build Summary ===`);
  console.log(`Generated: ${successCount}`);
  console.log(`Skipped:   ${skipCount}`);
  console.log(`Failed:    ${failCount}`);
  console.log(`\nCumulative characters used this run: ${totalCharsUsed}`);
}

main().catch(console.error);
