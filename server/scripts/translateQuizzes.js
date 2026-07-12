import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { translateQuizToEnglish } from './buildQuizzes.js';

// Load .env from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const QUIZ_DIR = path.join(__dirname, '..', 'output', 'quizzes');

async function run() {
  console.log("🚀 Starting Batch Translation of Quizzes to English...");

  if (!await fs.pathExists(QUIZ_DIR)) {
    console.error("Quiz directory not found.");
    process.exit(1);
  }

  const files = await fs.readdir(QUIZ_DIR);
  const urduFiles = files.filter(f => f.endsWith('.json') && !f.endsWith('_en.json'));

  let count = 0;
  for (const file of urduFiles) {
    const baseName = file.replace('.json', '');
    const enFile = `${baseName}_en.json`;
    const enFilePath = path.join(QUIZ_DIR, enFile);

    if (await fs.pathExists(enFilePath)) {
      console.log(`Skipping ${baseName} - English quiz already exists.`);
      continue;
    }

    console.log(`Translating ${baseName} to English...`);
    let success = false;
    let retries = 5;
    
    while (!success && retries > 0) {
      try {
        const quizPath = path.join(QUIZ_DIR, file);
        const quizData = await fs.readJson(quizPath);
        
        const enQuizData = await translateQuizToEnglish(quizData);
        
        await fs.writeJson(enFilePath, enQuizData, { spaces: 2 });
        console.log(`✅ Successfully translated ${baseName}`);
        count++;
        success = true;
        
        // Wait 30 seconds between successful requests to respect 12k TPM limit
        await new Promise(resolve => setTimeout(resolve, 30000));
      } catch (err) {
        if (err.message.includes('Rate limit') || err.message.includes('429')) {
          console.warn(`⏳ Rate limit hit for ${baseName}. Waiting 20 seconds before retry...`);
          await new Promise(resolve => setTimeout(resolve, 20000));
          retries--;
        } else {
          console.error(`❌ Error translating ${baseName}:`, err.message);
          break; // Don't retry for non-rate limit errors
        }
      }
    }
  }

  console.log(`\n🎉 Finished! Translated ${count} quizzes.`);
}

run().catch(console.error);
