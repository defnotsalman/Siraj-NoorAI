import { supabase } from '../supabase/supabaseClient';

/**
 * Mark a story as read in the reading_progress table
 * @param {string} userId - The Supabase user UUID
 * @param {string} storyId - The ID of the story read
 */
export const markStoryAsRead = async (userId, storyId) => {
  const { error } = await supabase
    .from('reading_progress')
    .upsert(
      {
        user_id: userId,
        story_id: storyId,
        completed: true,
        completed_at: new Date().toISOString()
      },
      { onConflict: 'user_id, story_id' }
    );

  if (error) {
    console.error("Error updating reading progress:", error);
    throw error;
  }
};

/**
 * Synchronize locally stored completed stories to the Supabase database
 * @param {string} userId - The Supabase user UUID
 * @param {number} currentStoriesRead - Current profile.storiesRead count
 * @param {function} updateProfileFn - Function to update user profile
 */
export const syncLocalProgress = async (userId, currentStoriesRead, updateProfileFn) => {
  try {
    const completedLocal = JSON.parse(localStorage.getItem('completedStories') || '[]');
    if (!completedLocal || completedLocal.length === 0) return;

    // First fetch existing records so we don't do unnecessary upserts
    const { data: existingRecords } = await supabase
      .from('reading_progress')
      .select('story_id')
      .eq('user_id', userId);
      
    const existingIds = new Set(existingRecords?.map(r => r.story_id) || []);
    
    // Find missing records
    const missingRecords = completedLocal.filter(id => !existingIds.has(id));
    
    if (missingRecords.length > 0) {
      const recordsToInsert = missingRecords.map(storyId => ({
        user_id: userId,
        story_id: storyId,
        completed: true,
        completed_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('reading_progress')
        .upsert(recordsToInsert, { onConflict: 'user_id, story_id' });
        
      if (error) throw error;
      
      // Update profile count if we inserted new ones and the total is higher
      const newTotal = Math.max(currentStoriesRead, existingIds.size + missingRecords.length);
      if (newTotal > currentStoriesRead && updateProfileFn) {
        await updateProfileFn(userId, { storiesRead: newTotal });
      }
    }
  } catch (err) {
    console.error("Failed to sync local progress:", err);
  }
};
