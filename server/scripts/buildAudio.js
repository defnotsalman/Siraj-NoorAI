import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import * as googleTTS from 'google-tts-api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const INDEX_DIR = path.join(OUTPUT_DIR, 'stories-index');
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'stories-manifest.json');

async function synthesizeSpeech(text) {
  // Use the free Google Translate API
  const base64Audio = await googleTTS.getAudioBase64(text, {
    lang: 'ur',
    slow: false,
    host: 'https://translate.google.com',
    timeout: 10000,
  });
  return Buffer.from(base64Audio, 'base64');
}

// google-tts-api has a strict 200 character limit per request. 
function chunkUrduText(text, maxChars = 180) {
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
    console.log(`  -> Synthesizing chunk ${i + 1}/${chunks.length}...`);
    const buffer = await synthesizeSpeech(chunks[i]);
    audioBuffers.push(buffer);
    charCount += chunks[i].length;
  }

  // Concatenate all MP3 buffers sequentially
  // (Note: simple buffer concatenation works reasonably well for basic MP3 TTS, 
  // but if glitches appear at boundaries, ffmpeg-based concatenation is the upgrade path)
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

    // Process all stories in the manifest
    // (Removed the proof-of-concept single story limit)
  }

  console.log(`\n=== Audio Build Summary ===`);
  console.log(`Generated: ${successCount}`);
  console.log(`Skipped:   ${skipCount}`);
  console.log(`Failed:    ${failCount}`);
  console.log(`\nCumulative characters used this run: ${totalCharsUsed}`);
  console.log(`Google Cloud Free Tier limits you to 4,000,000 characters per month!`);
}

main().catch(console.error);
