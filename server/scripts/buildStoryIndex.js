import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import mammoth from 'mammoth';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_crash_if_not_set_yet'
});

const STORIES_DIR = process.env.STORIES_SOURCE_DIR || path.join(__dirname, '..', '..', 'stories');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const INDEX_DIR = path.join(OUTPUT_DIR, 'stories-index');
const MANIFEST_FILE = path.join(OUTPUT_DIR, 'stories-manifest.json');

// Helper to clean and generate slug
function generateSlug(filename) {
  return filename
    .replace(/\(revised\)/i, '')
    .replace(/\.docx$/i, '')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

function chunkText(text, maxTokens = 400, overlap = 50) {
  // Rough approximation: 1 token ~= 4 characters
  const chunkSize = maxTokens * 4;
  const overlapSize = overlap * 4;
  const chunks = [];
  
  if (text.length <= chunkSize) {
    return [text];
  }

  let i = 0;
  while (i < text.length) {
    let end = i + chunkSize;
    if (end > text.length) end = text.length;
    
    // Try to break at a space or newline
    if (end < text.length) {
      let spaceIndex = text.lastIndexOf(' ', end);
      if (spaceIndex > i + overlapSize) {
        end = spaceIndex;
      }
    }
    
    chunks.push(text.slice(i, end).trim());
    if (end >= text.length) break;
    i = end - overlapSize;
  }
  return chunks;
}

async function getEmbeddings(chunks) {
  if (process.env.OPENAI_API_KEY) {
    const embeddings = [];
    for (const chunk of chunks) {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: chunk,
      });
      embeddings.push(response.data[0].embedding);
    }
    return embeddings;
  }
  // Fallback dummy embeddings if no key (so build doesn't crash during dev)
  return chunks.map(() => new Array(1536).fill(0));
}

async function main() {
  await fs.ensureDir(INDEX_DIR);
  
  let existingManifest = [];
  if (await fs.pathExists(MANIFEST_FILE)) {
    existingManifest = await fs.readJson(MANIFEST_FILE);
  }

  const manifestMap = new Map(existingManifest.map(m => [m.slug, m]));
  
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  const files = await fs.readdir(STORIES_DIR);
  const docxFiles = files.filter(f => f.toLowerCase().endsWith('.docx') && !f.startsWith('~'));

  for (const file of docxFiles) {
    const filePath = path.join(STORIES_DIR, file);
    try {
      const stat = await fs.stat(filePath);
      const mtime = stat.mtimeMs;
      const size = stat.size;
      
      if (size > 5 * 1024 * 1024) {
        console.log(`Skipping ${file} because it is too large (${(size/1024/1024).toFixed(2)} MB)`);
        continue;
      }
      
      const slug = generateSlug(file);
      const id = crypto.createHash('md5').update(slug).digest('hex').slice(0, 10);
      
      const existing = manifestMap.get(slug);
      if (existing && existing.mtime === mtime && await fs.pathExists(path.join(INDEX_DIR, `${slug}.json`))) {
        skipped++;
        continue;
      }
      
      console.log(`Processing ${file}...`);
      
      const result = await mammoth.extractRawText({ path: filePath });
      let text = result.value.replace(/\s+/g, ' ').trim();
      
      const chunks = chunkText(text);
      const embeddings = await getEmbeddings(chunks);
      
      const chunkData = chunks.map((c, i) => ({
        text: c,
        embedding: embeddings[i]
      }));

      const title = file.replace(/\(revised\)/i, '').replace(/\.docx$/i, '').trim();
      const wordCount = text.split(' ').length;
      
      const storyIndex = {
        id,
        slug,
        title,
        englishTitle: title,
        fullText: text,
        chunks: chunkData
      };
      
      await fs.writeJson(path.join(INDEX_DIR, `${slug}.json`), storyIndex);
      
      manifestMap.set(slug, {
        id,
        slug,
        title,
        englishTitle: title,
        category: "Prophets", 
        wordCount,
        mtime
      });
      
      processed++;
    } catch (err) {
      console.error(`Failed to process ${file}:`, err);
      failed++;
    }
  }

  const newManifest = Array.from(manifestMap.values());
  await fs.writeJson(MANIFEST_FILE, newManifest, { spaces: 2 });
  
  console.log(`\n=== Build Summary ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Skipped (unchanged): ${skipped}`);
  console.log(`Failed: ${failed}`);
  if (!process.env.OPENAI_API_KEY) {
    console.log(`WARNING: OPENAI_API_KEY is not set. Generated dummy zero embeddings!`);
  }
}

main().catch(console.error);
