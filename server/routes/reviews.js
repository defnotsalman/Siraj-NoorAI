import express from 'express';
import { supabaseAdmin } from '../supabaseClient.js';

const router = express.Router();

// Public route to get APPROVED reviews
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('name, text, rating, created_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching reviews:", error);
      return res.status(500).json({ error: "Failed to fetch reviews" });
    }

    res.json(data || []);
  } catch (err) {
    console.error("Reviews GET Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Public route to submit a new review (pending approval)
router.post('/', async (req, res) => {
  const { name, email, rating, text } = req.body;

  if (!name || !email || !rating || !text) {
    return res.status(400).json({ error: "All fields are required (name, email, rating, text)" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert([
        {
          name,
          email,
          rating: parseInt(rating),
          text,
          is_approved: false
        }
      ]);

    if (error) {
      console.error("Error submitting review:", error);
      return res.status(500).json({ error: "Failed to submit review" });
    }

    res.status(201).json({ message: "Review submitted successfully and is pending approval." });
  } catch (err) {
    console.error("Reviews POST Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
