import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MANIFEST_FILE = path.join(__dirname, '..', 'output', 'stories-manifest.json');
const INDEX_DIR = path.join(__dirname, '..', 'output', 'stories-index');
const QUIZ_DIR = path.join(__dirname, '..', 'output', 'quizzes');

const systemPrompt = `You are a curriculum designer for children aged 5-10.
Your task is to generate a 30-question multiple-choice quiz based STRICTLY on the provided story text.

Requirements:
- Exactly 30 questions.
- Each question must have exactly 4 options.
- Exactly 1 correct option, 3 distractors.
- Options must be distinct.
- Include a 1-sentence kid-friendly explanation of why the answer is correct.
- Ensure the questions are grounded ONLY in the story text.

Return the result as a raw JSON object (NO markdown backticks, NO extra text) matching this schema exactly:
{
  "storyId": "string",
  "questions": [
    {
      "id": "string",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": number,
      "explanation": "string"
    }
  ]
}`;

async function generateQuizForStory(story, storyText) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not defined in .env");
  }

  const userPrompt = `Story ID: ${story.id}\n\nSTORY TEXT:\n"""\n${storyText}\n"""\n\nGenerate the JSON quiz now.`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }]
      },
      contents: [
        { role: 'user', parts: [{ text: userPrompt }] }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  let rawContent = data.candidates[0].content.parts[0].text;
  
  // Clean up potential markdown formatting if the model still outputs it despite responseMimeType
  rawContent = rawContent.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
  
  const parsed = JSON.parse(rawContent);
  
  // Validate structure
  if (!parsed.storyId || !Array.isArray(parsed.questions) || parsed.questions.length < 15) {
    throw new Error("Invalid output format: Missing required fields or incorrect number of questions.");
  }
  
  for (let q of parsed.questions) {
    if (!q.id || !q.question || !Array.isArray(q.options) || q.options.length !== 4 || typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3 || !q.explanation) {
      throw new Error(`Invalid question format for question ID: ${q.id}`);
    }
  }

  return parsed;
}

async function run() {
  console.log("🚀 Starting Quiz Generation...");
  
  await fs.ensureDir(QUIZ_DIR);

  if (!await fs.pathExists(MANIFEST_FILE)) {
    console.error("❌ stories-manifest.json not found. Run the story indexer first.");
    process.exit(1);
  }

  const manifest = await fs.readJson(MANIFEST_FILE);
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  const failedStories = [];

  for (const story of manifest) {
    const quizPath = path.join(QUIZ_DIR, `${story.id}.json`);
    
    if (!force && await fs.pathExists(quizPath)) {
      console.log(`⏩ Skipping ${story.title} (already exists)`);
      skipped++;
      continue;
    }

    console.log(`⏳ Generating quiz for: ${story.title}...`);
    
    try {
      const indexPath = path.join(INDEX_DIR, `${story.slug}.json`);
      let storyText = "";
      if (await fs.pathExists(indexPath)) {
        const indexData = await fs.readJson(indexPath);
        storyText = indexData.fullText;
      } else {
        throw new Error("Story index file missing");
      }
      
      // Ensure we don't blow up the prompt context window completely (though Gemini handles 1M tokens)
      const truncatedText = storyText.substring(0, 100000); 

      // Attempt generation
      let quizData;
      try {
        quizData = await generateQuizForStory(story, truncatedText);
      } catch (err) {
        console.warn(`   ⚠️ First attempt failed: ${err.message}. Retrying...`);
        quizData = await generateQuizForStory(story, truncatedText);
      }

      await fs.writeJson(quizPath, quizData, { spaces: 2 });
      console.log(`   ✅ Success! Saved to ${story.id}.json`);
      generated++;
      
      // Artificial delay to prevent aggressive rate limiting
      await new Promise(r => setTimeout(r, 2000));
      
    } catch (error) {
      console.error(`   ❌ Failed to generate quiz for ${story.title}: ${error.message}`);
      failed++;
      failedStories.push(story.title);
    }
  }

  console.log("\n--- 📊 Generation Summary ---");
  console.log(`Total Stories: ${manifest.length}`);
  console.log(`✅ Generated:  ${generated}`);
  console.log(`⏩ Skipped:    ${skipped}`);
  console.log(`❌ Failed:     ${failed}`);
  
  if (failed > 0) {
    console.log("\nFailed Stories:");
    failedStories.forEach(s => console.log(` - ${s}`));
  }
}

run();
