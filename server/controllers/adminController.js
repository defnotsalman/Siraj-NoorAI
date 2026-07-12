import multer from 'multer';
import mammoth from 'mammoth';
import { supabaseAdmin } from '../supabaseClient.js';
import { processStory } from '../scripts/buildStoryIndex.js';
import { generateQuiz } from '../scripts/buildQuizzes.js';
import { generateAudio } from '../scripts/buildAudio.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MANIFEST_FILE = path.join(process.cwd(), 'output', 'stories-manifest.json');

// Memory storage for multer
const upload = multer({ storage: multer.memoryStorage() });

export const uploadStoryMiddleware = upload.single('file');

export const uploadStory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const originalName = req.file.originalname;

    // 1. Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('story-uploads')
      .upload(`docs/${Date.now()}_${originalName}`, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        upsert: true
      });

    if (uploadError) {
      console.error("Supabase storage error:", uploadError);
      return res.status(500).json({ error: 'Failed to upload file to storage.' });
    }

    // 2. Extract text via mammoth for preview
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    const text = result.value.replace(/\s+/g, ' ').trim();
    const wordCount = text.split(' ').length;
    const defaultTitle = originalName.replace(/\(revised\)/i, '').replace(/\.docx$/i, '').trim();

    res.json({
      success: true,
      storagePath: uploadData.path,
      metadata: {
        title: defaultTitle,
        wordCount: wordCount,
        previewText: text.substring(0, 500) + '...'
      }
    });

  } catch (error) {
    console.error("Upload story error:", error);
    res.status(500).json({ error: "Failed to upload story" });
  }
};

// Input validation schema (Security Feature: Category 9)
const processStorySchema = z.object({
  storagePath: z.string().max(255),
  title: z.string().max(200).optional()
});

export const processStoryJob = async (req, res) => {
  const { success, data, error } = processStorySchema.safeParse(req.body);
  if (!success) {
    return res.status(400).json({ error: "Invalid input parameters." });
  }

  const { storagePath, title } = data;

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    sendEvent('status', { message: 'Downloading from storage...' });
    
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('story-uploads')
      .download(storagePath);
      
    if (downloadError) throw downloadError;
    
    const arrayBuffer = await fileData.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    sendEvent('status', { message: 'Generating story index and embeddings...' });
    const originalFilename = path.basename(storagePath);
    // Note: The processStory function will use the original filename for slug, but we'll update title in manifest
    const manifestEntry = await processStory(fileBuffer, originalFilename);
    
    sendEvent('status', { message: 'Generating quiz...' });
    await generateQuiz(manifestEntry.id);
    
    sendEvent('status', { message: 'Generating audio...' });
    await generateAudio(manifestEntry.id);

    sendEvent('status', { message: 'Complete!' });
    sendEvent('complete', { success: true, storyId: manifestEntry.id });
    res.end();
  } catch (error) {
    console.error("Processing error:", error);
    // SECURITY: Masking original error message to avoid leaking internals (Category 5)
    sendEvent('error', { message: "An error occurred during processing. Please try again." });
    res.end();
  }
};

export const getStories = async (req, res) => {
  try {
    let manifest = [];
    if (await fs.pathExists(MANIFEST_FILE)) {
      manifest = await fs.readJson(MANIFEST_FILE);
    }
    
    // Check status for each story
    const QUIZ_DIR = path.join(__dirname, '..', 'output', 'quizzes');
    const AUDIO_DIR = path.join(__dirname, '..', 'output', 'audio');
    
    const enriched = await Promise.all(manifest.map(async (story) => {
      const hasQuiz = await fs.pathExists(path.join(QUIZ_DIR, `${story.id}.json`));
      const hasAudio = await fs.pathExists(path.join(AUDIO_DIR, `${story.id}.mp3`));
      return {
        ...story,
        hasQuiz,
        hasAudio
      };
    }));
    
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stories" });
  }
};

export const updateStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const updates = req.body;
    
    if (await fs.pathExists(MANIFEST_FILE)) {
      let manifest = await fs.readJson(MANIFEST_FILE);
      const index = manifest.findIndex(s => s.id === storyId);
      if (index !== -1) {
        manifest[index] = { ...manifest[index], ...updates };
        await fs.writeJson(MANIFEST_FILE, manifest, { spaces: 2 });
        return res.json(manifest[index]);
      }
    }
    res.status(404).json({ error: "Story not found" });
  } catch (err) {
    res.status(500).json({ error: "Failed to update story" });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    
    if (await fs.pathExists(MANIFEST_FILE)) {
      let manifest = await fs.readJson(MANIFEST_FILE);
      const filtered = manifest.filter(s => s.id !== storyId);
      await fs.writeJson(MANIFEST_FILE, filtered, { spaces: 2 });
      return res.json({ success: true });
    }
    res.status(404).json({ error: "Story not found" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete story" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('*');
      
    if (error) throw error;
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

export const getUserDetail = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (profileError) throw profileError;

    // Fetch reading progress
    const { data: progress, error: progressError } = await supabaseAdmin
      .from('reading_progress')
      .select('*')
      .eq('user_id', userId);
      
    if (progressError && progressError.code !== '42P01') { 
      // 42P01 is relation does not exist, ignore if table missing
      console.error(progressError);
    }
      
    res.json({ profile, progress: progress || [] });
  } catch (err) {
    console.error("getUserDetail Error:", err);
    res.status(500).json({ error: "Failed to fetch user details" });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: "is_active must be a boolean" });
    }

    // Update public.users table
    const { data: profile, error: dbError } = await supabaseAdmin
      .from('users')
      .update({ is_active })
      .eq('id', userId)
      .select()
      .single();

    if (dbError) throw dbError;

    // Optional: Also ban/unban the user in Supabase Auth to instantly kill sessions
    if (is_active) {
      await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: 'none' });
    } else {
      await supabaseAdmin.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    }

    res.json(profile);
  } catch (err) {
    console.error("Update user status error:", err);
    res.status(500).json({ error: "Failed to update user status" });
  }
};

// Input validation schema for registration (Security Feature: Category 3 & 9)
const registerUserSchema = z.object({
  email: z.string().email().max(100),
  password: z.string().min(6).max(128), // Category 3: Prevent Long Password DoS
  displayName: z.string().max(50).optional(),
  parentEmail: z.string().email().max(100).optional(),
  age: z.string().or(z.number()).optional()
});

export const registerUser = async (req, res) => {
  try {
    const { success, data, error: validationError } = registerUserSchema.safeParse(req.body);
    if (!success) {
      return res.status(400).json({ error: "Invalid registration data provided." });
    }
    
    const { email, password, displayName, parentEmail, age } = data;
    
    // 1. Create user in auth via Admin API to bypass email verification and sign-up restrictions
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Force confirmation so they can log in instantly
    });
    
    if (authError) {
      console.error("Auth creation error:", authError);
      return res.status(400).json({ error: authError.message });
    }
    
    const userId = authData.user.id;
    
    // 2. Insert into users table
    const { error: dbError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email: email,
      parentEmail: parentEmail || email,
      displayName: displayName || email.split('@')[0],
      age: parseInt(age) || null,
      is_admin: false,
      createdAt: new Date().toISOString()
    });
    
    if (dbError) {
      console.error("Database insert error:", dbError);
      // Even if this fails, the auth user exists. But we return error for visibility.
      return res.status(500).json({ error: "User created but failed to save profile details." });
    }
    
    res.json({ success: true, user: authData.user });
  } catch (err) {
    console.error("registerUser Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getChatLogs = async (req, res) => {
  try {
    // Basic chat logs - assuming we have a file or we can just return empty for now if not implemented
    const LOGS_FILE = path.join(__dirname, '..', 'output', 'chat-logs.json');
    if (await fs.pathExists(LOGS_FILE)) {
      const logs = await fs.readJson(LOGS_FILE);
      res.json(logs);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch chat logs" });
  }
};

// --- REVIEWS MANAGEMENT ---

export const getAllReviews = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching all reviews:", error);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }

    res.json(data || []);
  } catch (err) {
    console.error("getAllReviews error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const approveReview = async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({ is_approved: true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error approving review:", error);
      return res.status(500).json({ error: "Failed to approve review" });
    }

    res.json({ success: true, review: data });
  } catch (err) {
    console.error("approveReview error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting review:", error);
      return res.status(500).json({ error: "Failed to delete review" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error("deleteReview error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
