# NoorKids Admin Panel Guide

The NoorKids Admin Panel is a secure, responsive dashboard for managing stories, viewing registered kids' progress, and monitoring AI chat logs.

## 1. Setup Required: Supabase Storage Bucket

Before using the admin panel to upload new stories, you must create a storage bucket in Supabase:
1. Go to your Supabase Dashboard -> **Storage**.
2. Click **New Bucket**.
3. Name it exactly `story-uploads`.
4. You can make it Public, or keep it Private since the backend uses the Service Role Key to upload and download from it.

## 2. Setup Required: Granting Admin Access

Admin access is strictly controlled by database Row Level Security (RLS) to prevent unauthorized access. You cannot grant admin access through the frontend UI.

To make a user an admin, you must run a SQL query directly in the Supabase SQL Editor:
```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = '<user-uuid-here>';
```
Replace `<user-uuid-here>` with the UUID of the user you want to grant access to.

## 3. How Story Processing Works

Historically, stories were processed using CLI scripts (`npm run build:stories`). 
With the new Admin Panel, the core logic from these scripts has been extracted into reusable functions:
- `processStory()` handles chunking, embeddings, and extracting the moral lesson.
- `generateQuiz()` contacts the LLM to build a 30-question quiz.
- `generateAudio()` contacts ElevenLabs to synthesize Urdu TTS audio.

When an admin uploads a `.docx` file through the dashboard, it is first saved to the `story-uploads` bucket. Then, upon clicking "Confirm & Process", the backend triggers the three functions sequentially, streaming real-time status updates back to the UI using Server-Sent Events (SSE). 

The original CLI scripts still work exactly as before, but they now share the exact same underlying logic as the web dashboard!

## 4. Accessing the Panel

Once you have granted yourself `is_admin = true`, simply navigate to `http://localhost:5173/admin` (or your deployed URL) while logged in. If you are not an admin, you will be automatically redirected away.
