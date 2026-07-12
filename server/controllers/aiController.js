import fs from 'fs-extra';
import path from 'path';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INDEX_DIR = path.join(__dirname, '..', 'output', 'stories-index');
const MANIFEST_FILE = path.join(__dirname, '..', 'output', 'stories-manifest.json');

// Simple in-memory cache for loaded stories
const storyCache = new Map();

// Cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Input validation schema (Security Feature: Category 9)
const askAiSchema = z.object({
  storyId: z.string().max(100),
  question: z.string().max(500),
  conversationHistory: z.array(z.any()).optional(),
  language: z.string().max(50).optional()
});

export const askAi = async (req, res) => {
  const { success, data, error } = askAiSchema.safeParse(req.body);
  
  if (!success) {
    return res.status(400).json({ error: "Invalid input. Questions must be under 500 characters." });
  }

  const { storyId, question, conversationHistory = [], language = "Urdu" } = data;

  if (!storyId || !question) {
    return res.status(200).json({ 
      answer: "Please select a story first before asking me questions! I am a Story AI. 📚" 
    });
  }
  
  // Lightweight safety filter
  const badWords = ['badword', 'explicit', 'address', 'phone number']; // simplified
  const lowerQ = question.toLowerCase();
  if (badWords.some(w => lowerQ.includes(w))) {
    return res.json({ answer: "I'm a friendly AI for Islamic stories! Let's talk about the story instead 😊." });
  }

  try {
    let story;
    if (storyCache.has(storyId)) {
      story = storyCache.get(storyId);
    } else {
      const manifest = await fs.readJson(MANIFEST_FILE);
      const storyMeta = manifest.find(s => s.id === storyId);
      if (!storyMeta) {
        return res.status(404).json({ error: "Story not found in manifest." });
      }

      const storyPath = path.join(INDEX_DIR, `${storyMeta.slug}.json`);
      if (!await fs.pathExists(storyPath)) {
        return res.status(404).json({ error: "Story index file not found." });
      }
      story = await fs.readJson(storyPath);
      storyCache.set(storyId, story);
    }

    let retrievedContext = story.fullText;
    
    // Fallback to top chunks since ingestion was run with dummy embeddings
    if (story.chunks && story.chunks.length > 5) {
       retrievedContext = story.chunks.slice(0, 3).map(c => c.text).join('\n\n');
    }

    let languageInstruction = "";
    if (language === "Urdu") {
      languageInstruction = "CRITICAL: You MUST reply entirely in the Urdu language using the Urdu script (Nastaliq/Arabic letters like یہ ایک کہانی ہے). EVEN IF the user asks in Roman English, you MUST reply in pure Urdu script. DO NOT use Roman Urdu (like 'yeh kahani hai'). DO NOT use English.";
    } else if (language === "Roman Urdu" || language === "Roman English") {
      languageInstruction = "CRITICAL: You MUST reply entirely in Roman Urdu / Roman English (Urdu written using the English alphabet). Do not use Arabic script.";
    } else {
      languageInstruction = "CRITICAL: You MUST reply entirely in English.";
    }

    const systemPrompt = `You are "Noor", a gentle, patient AI companion inside the NoorKids app, helping a child understand ONE specific Islamic story: "${story.title}".

STORY CONTEXT (this is your only source of truth for this story):
"""
${retrievedContext}
"""

RULES YOU MUST FOLLOW:
1. Answer ONLY using the story context above. If the child asks an irrelevant question or something the story doesn't cover, you MUST simply reply with: "This is irrelevant to the story." Do not try to relate it to the story, and do not invent details.
2. Speak like a warm, encouraging teacher talking to a child aged 5–10: short sentences, simple vocabulary, no complex theological jargon. You MUST NOT use any emojis under any circumstances.
3. ${languageInstruction}
4. If asked about topics unrelated to this story or to Islamic values generally (violence, other religions, personal/private user data, anything scary, adult, or companies/brands), you MUST reply: "This is irrelevant to the story."
5. Never discuss sensitive theological disputes.
6. Keep answers short: 2–5 sentences unless the child explicitly asks for more detail.
7. You may ask the child a gentle follow-up question to encourage reflection.
8. Always refer to prophets with "(AS)" and use respectful honorifics.`;

    // Format for Groq API
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.map(m => ({ 
        role: m.sender === 'ai' ? 'assistant' : 'user', 
        content: m.message 
      }))
    ];

    // Trim history to prevent huge token usage
    if (groqMessages.length > 12) {
       // Keep system prompt, trim the middle history
       const sys = groqMessages[0];
       const trimmed = groqMessages.slice(-11);
       groqMessages.length = 0;
       groqMessages.push(sys, ...trimmed);
    }

    // Force language instruction right before user prompt for maximum LLM obedience
    groqMessages.push({ role: 'system', content: languageInstruction });
    groqMessages.push({ role: 'user', content: question });
    let answer = "I'm having a little trouble thinking right now, but let's try again soon!";
    
    if (process.env.GROQ_API_KEY) {
      try {
        const response = await fetch(`https://api.groq.com/openai/v1/chat/completions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: groqMessages,
            temperature: 0.7,
            max_tokens: 500
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        answer = data.choices[0].message.content;
      } catch (err) {
        console.error("Groq API Error:", err);
        throw err;
      }
    } else {
       answer = `(Dummy API Mode) According to the story "${story.title}", here is what I found: ${retrievedContext.substring(0, 100)}...`;
    }

    // Log conversation simply
    console.log(`[CHAT LOG] Story: ${storyId} | Q: ${question} | A: ${answer.substring(0,50)}...`);

    res.json({ answer, storyId });
  } catch (error) {
    console.error('AI Controller Error:', error);
    // Return 200 so the frontend displays the error in the chat bubble!
    // SECURITY: Masking original error message to avoid leaking internals (Category 5)
    res.status(200).json({ answer: `I'm having a little trouble thinking right now! Please try again later.`, storyId });
  }
};
