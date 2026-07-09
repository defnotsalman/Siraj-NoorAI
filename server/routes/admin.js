import express from 'express';
import { supabaseAdmin } from '../supabaseClient.js';
import {
  uploadStoryMiddleware,
  uploadStory,
  processStoryJob,
  getStories,
  updateStory,
  deleteStory,
  getUsers,
  getUserDetail,
  registerUser,
  getChatLogs
} from '../controllers/adminController.js';

const router = express.Router();

// Middleware to verify Admin JWT
const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error("verifyAdmin: userError", userError);
      return res.status(401).json({ error: "Invalid token" });
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('is_admin')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile?.is_admin) {
      console.error("verifyAdmin: profileError or not admin", profileError, profile);
      return res.status(403).json({ error: "Forbidden: Admin access required" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Apply middleware to all admin routes
router.use(verifyAdmin);

// Routes
router.post('/stories/upload', uploadStoryMiddleware, uploadStory);
router.post('/stories/process', processStoryJob); // Changed from /:storyId/process because we pass storagePath/title via body
router.get('/stories', getStories);
router.patch('/stories/:storyId', updateStory);
router.delete('/stories/:storyId', deleteStory);

router.get('/users', getUsers);
router.post('/users/register', registerUser);
router.get('/users/:userId', getUserDetail);

router.get('/chat-logs', getChatLogs);

export default router;
