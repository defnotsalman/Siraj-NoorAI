# NoorKids AI - RAG Feature

## Overview
The "Ask Noor" AI feature uses Retrieval-Augmented Generation (RAG) to ground the chatbot's answers exclusively in the text of the actual Islamic stories in this app. 

It uses OpenAI's `text-embedding-3-small` for vectorizing the stories, and `gpt-4o-mini` for fast and cost-effective chat completions.

## How to add a new story
1. Drop the new `.docx` file into the root `stories/` directory.
2. In the `server` directory, run:
   ```bash
   npm run build:stories
   ```
3. The script will parse the `.docx`, clean the text, split it into chunks, generate embeddings, and create a JSON index for the story in `server/output/stories-index/`. It will also update `server/output/stories-manifest.json`.

*(Note: the script skips files over 5MB to prevent Node memory issues with large image-heavy docx files. Remove images or split large files if needed).*

## Endpoints
- `GET /api/stories`: Returns the stories manifest (id, slug, title, category, wordCount).
- `GET /api/stories/:id`: Returns the story metadata along with `content` (the full text).
- `POST /api/ai/ask`: The main AI endpoint.
  - **Body**: `{ storyId: "...", question: "...", conversationHistory: [...] }`
  - **Response**: `{ answer: "...", storyId: "..." }`

## Constraints & Future Upgrades
- **Rate limiting:** Basic in-memory rate limiting is implemented to protect against abuse. For production, switch to Redis.
- **Vector DB:** We currently use in-memory cosine similarity on the JSON chunks. With ~35 stories, this is highly performant and requires zero ops overhead. If the library grows past 500+ stories, consider migrating the `stories-index` to a real Vector DB (like Pinecone or Chroma).
- **Environment:** Requires `OPENAI_API_KEY` in `server/.env`.
