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

export async function generateQuizForStory(story, storyText) {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    throw new Error("GROQ_API_KEY is not defined in .env");
  }

  const userPrompt = `Story ID: ${story.id}\n\nSTORY TEXT:\n"""\n${storyText}\n"""\n\nGenerate the JSON quiz now.`;

  const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${groqApiKey}`
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2
    })
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);

  let rawContent = data.choices[0].message.content;
  
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

export async function generateQuiz(storyId) {
  await fs.ensureDir(QUIZ_DIR);
  
  if (!await fs.pathExists(MANIFEST_FILE)) {
    throw new Error("stories-manifest.json not found.");
  }
  
  const manifest = await fs.readJson(MANIFEST_FILE);
  const story = manifest.find(s => s.id === storyId || s.slug === storyId);
  
  if (!story) {
    throw new Error(`Story ${storyId} not found in manifest.`);
  }

  const quizPath = path.join(QUIZ_DIR, `${story.id}.json`);
  const indexPath = path.join(INDEX_DIR, `${story.slug}.json`);
  
  if (!await fs.pathExists(indexPath)) {
    throw new Error("Story index file missing");
  }
  
  const indexData = await fs.readJson(indexPath);
  const storyText = indexData.fullText;
  const truncatedText = storyText.substring(0, 100000); 

  let quizData;
  try {
    quizData = await generateQuizForStory(story, truncatedText);
  } catch (err) {
    console.warn(`⚠️ First attempt failed: ${err.message}. Retrying...`);
    quizData = await generateQuizForStory(story, truncatedText);
  }

  await fs.writeJson(quizPath, quizData, { spaces: 2 });
  return quizData;
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
      
      // Artificial delay to prevent aggressive rate limiting (Groq Free Tier has 12K TPM limit)
      // Since each request can use 8-9k tokens, we must wait over a minute between generations.
      await new Promise(r => setTimeout(r, 65000));
      
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

if (process.argv[1] === __filename) {
  run().catch(console.error);
}
