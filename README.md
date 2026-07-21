# 🌙 NoorKids

![NoorKids Logo](./assets/logo.png)

**An Islamic storytelling app for children where kids can read, listen to, and ask questions about the stories of the Prophets, in Urdu and English.**

> **⚠️ PROPRIETARY AND CONFIDENTIAL**
> This project is a proprietary, closed-source company application. It is NOT open-source and is not intended for public use, redistribution, or modification. Unauthorized copying of this repository, via any medium, is strictly prohibited.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Auth-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Groq](https://img.shields.io/badge/Groq-AI_Inference-F55036?logo=groq&logoColor=white)](https://groq.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

## 📖 About

NoorKids is a children's app built around a collection of Prophet stories including Hazrat Adam, Nuh, Ibrahim, Musa, Yousaf, Suleman, and many more. Every story can be read on screen, listened to as narrated Urdu audio, discussed with an AI companion that answers questions about that specific story, and reviewed through a short quiz. The app also keeps track of what each child has read so far and how much time they have spent reading.

It is built for two kinds of people at once. Children around five to ten years old will use it directly, and parents will want to feel confident it is trustworthy, well made, and worth their child's time.

## ✨ Features

📚 A growing library of Prophet stories written in Urdu, with English titles and categories so parents can browse easily.

🤖 An AI companion named Noor that a child can chat with after reading a story. It only answers using that story's own content, in a warm and gentle tone suited to young children.

🔊 A listen feature that plays natural Urdu narration for each story, with the ability to pause, seek, change playback speed, and download for offline playback (PWA).

📝 A short quiz for every story, generated from the story's own content, with instant feedback and a final score.

📊 Progress tracking that remembers the last story a child read, how much of each story they have completed, and their total reading time.

🔐 Accounts and profiles, including email sign up and Google sign in, along with a short profile setup step for each child.

🛠️ An admin panel, separate from the main app, where new stories can be uploaded and registered users can be reviewed.

## 🧠 AI and Data Integrations

NoorKids leverages a state-of-the-art hybrid AI architecture combining proprietary/open LLM providers for interactive storytelling chat with specialized speech models for real-time Quranic Arabic recitation analysis.

- **OpenAI (GPT-4o / GPT-4o-mini)**: Powers the children's companion conversational interface, utilizing retrieval-augmented generation (RAG) to ensure responses are safe, accurate, and context-bound.
- **tarteel-ai/whisper-base-ar-quran**: A speech-to-text model fine-tuned on Quranic recitation, used to transcribe audio and detect word-level boundaries and sequence order.
- **obadx/quran-muaalem-model-v3_2**: A specialized CTC-based acoustic phoneme alignment model used for Goodness of Pronunciation (GOP) scoring at the phoneme/letter level, and Tajweed rule verification (e.g., Qalqalah, Ghunnah).
- **Groq (Llama-3)**: Handles high-speed offline batch processing (such as moral lesson extraction, QA chunk generation, and story indexing during the build step).
- **ElevenLabs & Google Cloud TTS**: Generates rich, professional Urdu voice narrations for all story library audio playback.
- **Quran.com API (v4)**: Fetches verified Uthmani script and word-by-word translations.

---

## 📖 Complete Pipeline Architectures

### 1. "Ask Noor" Story Companion (RAG Pipeline)

To ensure that the companion chatbot answers children's questions using **only** the details from the specific Prophet story they read (preventing hallucinations, external lookups, or references to inappropriate content), we implement a strict localized RAG pipeline.

#### Architecture Flow:
```
[User Docx Story] -> [CLI / Admin Panel Processing]
                            |
                            v
                      [Text Cleaner]
                            |
                            v
               [Sliding Window Chunking] (e.g. 300 words, 50-word overlap)
                            |
                            v
              [text-embedding-3-small] -> [JSON Embedding Indexes]
                                                    |
[User Chat Request]                                 | (Cosine Similarity)
    + [Question]   ---------------------------------+
    + [History]             |
                            v
                    [Retrieve Top-K Chunks]
                            |
                            v
                 [System Prompt Augmentation]
                            |
                            v
                 [gpt-4o-mini Completion] -> [Response back to Child]
```

#### Step-by-Step Execution:
1. **Story Ingestion & Parsing**: The CLI indexer (`npm run build:stories`) or Admin Panel extracts text from `.docx` files. It strips embedded images, styling, and tables, ensuring only clean Unicode Arabic/Urdu/English text remains.
2. **Dynamic Chunking**: The clean text is split into chunks of ~300 words using a sliding window with a 50-word overlap to preserve semantic context across chunk boundaries.
3. **Embedding Generation**: Each chunk is sent to OpenAI's `text-embedding-3-small` API to generate a 1536-dimensional vector representation. These vectors are saved locally under `server/output/stories-index/[story-slug].json`.
4. **Vector Retrieval (RAG Query)**: When a child asks a question about a story:
   * The backend generates a 1536-dim vector for the child's query.
   * It calculates the Cosine Similarity between the query vector and all chunks belonging to that specific story.
   * The top 3 most relevant chunks are retrieved.
5. **System Prompt Augmentation & Completion**: The retrieved chunks are injected into a highly restrictive system prompt:
   ```markdown
   You are Noor, a warm, gentle, and child-friendly Islamic companion.
   Answer the child's question using ONLY the provided story text below.
   If the answer is not in the text, politely tell the child that you only know
   about this story and invite them to ask something else about it.
   [Retrieved Story Text Chunks]
   ```
   This prompt is processed by `gpt-4o-mini` to return a safe, kid-friendly answer.

---

### 2. Quran Recitation & Tajweed Evaluation Pipeline

Evaluating Quranic recitation requires a multi-stage approach. A typical Speech-to-Text (STT) model like Whisper has a strong language model bias, meaning it will automatically "correct" mispronounced words to match standard vocabulary. To prevent this and provide real-time letter-level accuracy, NoorKids implements a hybrid **Whisper + Muaalem CTC Alignment** pipeline.

#### Pipeline Flow:
```
[User Audio (WebM/WAV)]
         |
         v
  [Express Server] ---> (FFmpeg Conversion: mono, 16kHz WAV)
         |
         v
  [AI Engine (Python)]
         |
         +--> [tarteel-ai/whisper-base-ar-quran] (Greedy Generation: num_beams=1)
         |        |
         |        +--> [Whisper Transcription Output]
         |
         +--> [Direct Uthmani Index Lookup] ---> [Uthmani Reference Text]
         |                                                 |
         |                                                 v
         |                                       [quran-phonetizer]
         |                                                 |
         |                                                 v
         +------------------------------------> [obadx/quran-muaalem-model-v3_2]
                                                           |
                                                           v
                                            [CTC Phone Alignment & GOP Scoring]
                                                           |
                                                           v
                                              [Cross-Reference Validator]
                                            (Detects silent/unrecited words)
                                                           |
                                                           v
                                              [Resilient Fallback Engine]
                                            (Failsafe if alignment model crashes)
                                                           |
                                                           v
                                             [React UI Colored Highlights]
```

#### Step-by-Step Execution:
1. **Audio Recording & Metadata Bundling**:
   * The child clicks record in `PracticeRecitation.jsx` (MediaRecorder API).
   * Upon stopping, the React client bundles the audio blob, the target text, `surahNumber`, and `ayahNumber` into a `FormData` object.
   * **Crucial Detail**: Text metadata fields are appended *before* the large binary audio blob, ensuring Node's `multer` parses the fields successfully before parsing the file stream.
2. **Audio Normalization**: The Express controller receives the audio, converts it using `ffmpeg` to `16000Hz` sampling rate, single-channel (`mono`), signed `16-bit` PCM WAV format.
3. **Dual Model Processing in AI Engine**:
   * **Model A: Whisper Transcription**: The audio is transcribed using `tarteel-ai/whisper-base-ar-quran`. We enforce greedy decoding (`num_beams=1`, `do_sample=False`) to prevent the model from autocorrecting incorrect pronunciations, capturing the raw spoken output.
   * **Reference Retrieval**: Using `surah_number` and `ayah_number`, the engine retrieves the exact vocalized Uthmani script (e.g. `Aya(sura_idx, aya_idx).get().uthmani`) directly, bypassing fuzzy text matching which causes lookup failures due to spelling normalization.
   * **Model B: Muaalem Phonetizer & CTC Alignment**:
     * The target Uthmani text is converted into expected phone sequences (QPS representation) by the `quran-phonetizer`.
     * The `obadx/quran-muaalem-model-v3_2` CTC model aligns the audio frames with the expected phonemes.
     * The engine calculates a **Goodness of Pronunciation (GOP)** score by comparing the acoustic frame log-probability of each phoneme against a threshold.
     * The engine evaluates Tajweed properties from the acoustic predictions:
       * **Qalqalah** (bouncing/echo sound on letters: *ق, ط, ب, ج, د*)
       * **Ghunnah** (nasalization duration on letters: *ن, م*)
4. **Cross-Reference Validation (Partial Recitation Handling)**:
   * Phonetizers naturally align acoustic features to expected phones even if the user remained silent or stopped halfway through the Ayah.
   * To prevent unspoken words from falsely appearing green (correct), the engine cross-references the alignment words with the Whisper transcription.
   * Target words that share less than a 30% match similarity with the Whisper transcription stream are immediately flagged as `"not_recited"` and marked incorrect (displayed as red with a tooltip: `"this word was not recited"`).
5. **Resilient Fallback Engine**:
   * If the CTC phonetizer crashes (e.g., due to unusual letter sequence structures), the backend falls back automatically to standard Levenshtein-based word matching (`alignWords`) between the Whisper transcription and the normalized expected text.
   * This guarantees the child always receives a visual feedback block with highlights, instead of a broken layout or empty screen.
6. **Frontend Visualizer**:
   * The React UI maps the returned `words` array.
   * Words with `correct: true` (or `matched: true`) render in **green** with a glowing drop-shadow.
   * Words with `correct: false` render in **red** with an underline. Hovering or clicking on the word displays tooltips specifying the Tajweed error, the letter where the mistake occurred, or the unrecited flag.

#### Complete Recitation Example:
* **Target Ayah (Uthmani)**: `قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ` (Surah 114, Ayah 1)
* **User Audio**: The child recites only `"قُلْ"` and stops.
* **Whisper output**: `"قُلْ"`
* **Pipeline Processing**:
  * Whisper transcription matches the first word.
  * Phonetizer aligns the audio for `"قُلْ"`.
  * The Cross-Reference Validator sees that the Whisper output lacks any similarity for the remaining words: `أَعُوذُ`, `بِرَبِّ`, `ٱلنَّاسِ`.
  * These three words are flagged with issue `not_recited`.
* **Output Payload**:
  ```json
  {
    "score": 25,
    "transcript": "قل",
    "words": [
      { "word": "قُلْ", "correct": true, "issue": null },
      { "word": "أَعُوذُ", "correct": false, "issue": "not_recited", "note": "this word was not recited" },
      { "word": "بِرَبِّ", "correct": false, "issue": "not_recited", "note": "this word was not recited" },
      { "word": "ٱلنَّاسِ", "correct": false, "issue": "not_recited", "note": "this word was not recited" }
    ]
  }
  ```
* **UI Display**: The user sees `قُلْ` in green, and `أَعُوذُ بِرَبِّ ٱلنَّاسِ` in red, showing exactly where they stopped.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7 |
| **Backend** | Node.js (Express), Axios, Multer |
| **AI Engine (Local)** | FastAPI, PyTorch, Transformers (Whisper & Wav2Vec2) |
| **Database & Auth** | Supabase (Postgres, GoTrue Auth, Storage, Row Level Security) |
| **Urdu TTS Engine** | ElevenLabs / Google Cloud Text-to-Speech |
| **Document Parsing** | mammoth (.docx), pdf-parse (.pdf) |

## 🚀 Getting Started (Internal Company Use Only)

### What you will need

You will need Node.js version 18 or later, access to the company's Supabase project, and a Groq/OpenAI API key.

### Installing the project

```bash
git clone https://github.com/OwaisTanoli71/noorkids-app.git
cd NoorKidsApp

cd client
npm install

cd ../server
npm install
```

### Setting up your environment variables

Your repository contains `.env.example` files. You must duplicate them and rename them to `.env`.

Create `.env` inside the `client` folder with the following:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Create `.env` inside the `server` folder with the following:

```env
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Please keep both of these files private and out of version control. They are already listed in `.gitignore`.

### Setting up the database

This project uses a shared Supabase database. As long as you have the correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your client `.env` file, the app will automatically connect to the database!

### Adding and processing stories (CLI)

New stories are added as `.docx` or `.pdf` files inside the `stories` folder at the root of the project. Once a story is added, run the following from inside the `server` folder:

```bash
npm run build:stories
npm run build:quizzes
npm run build:audio
```

These three commands read the story text, build the search index the AI companion uses, generate a quiz using Groq, and generate the narrated audio.

### Running the app

Run the server from inside the server folder and the client from inside the client folder, each in its own terminal:

```bash
npm run dev
```

By default the client will run at http://localhost:5173 and the server at http://localhost:5000.

---

## 🛡️ Admin Panel Guide

The NoorKids Admin Panel is a secure, responsive dashboard for managing stories, viewing registered kids' progress, and monitoring AI chat logs.

### 1. Setup Required: Supabase Storage Bucket

Before using the admin panel to upload new stories, you must create a storage bucket in Supabase:
1. Go to your Supabase Dashboard -> **Storage**.
2. Click **New Bucket**.
3. Name it exactly `story-uploads`.
4. You can make it Public, or keep it Private since the backend uses the Service Role Key to upload and download from it.

### 2. Setup Required: Granting Admin Access

Admin access is strictly controlled by database Row Level Security (RLS) to prevent unauthorized access. You cannot grant admin access through the frontend UI.

To make a user an admin, you must run a SQL query directly in the Supabase SQL Editor:
```sql
UPDATE profiles 
SET is_admin = true 
WHERE id = '<user-uuid-here>';
```
Replace `<user-uuid-here>` with the UUID of the user you want to grant access to.

### 3. How Story Processing Works

Historically, stories were processed using CLI scripts (`npm run build:stories`). 
With the Admin Panel, the core logic from these scripts has been extracted into reusable functions:
- `processStory()` handles chunking, embeddings, and extracting the moral lesson.
- `generateQuiz()` contacts the LLM to build a 30-question quiz.
- `generateAudio()` contacts ElevenLabs / Google TTS to synthesize Urdu TTS audio.

When an admin uploads a `.docx` file through the dashboard, it is first saved to the `story-uploads` bucket. Then, upon clicking "Confirm & Process", the backend triggers the three functions sequentially, streaming real-time status updates back to the UI using Server-Sent Events (SSE). 

The original CLI scripts still work exactly as before, but they now share the exact same underlying logic as the web dashboard!

### 4. Accessing the Panel

Once you have granted yourself `is_admin = true`, simply navigate to `http://localhost:5173/admin` (or your deployed URL) while logged in. If you are not an admin, you will be automatically redirected away.

---

## 📁 Project Structure

```
NoorKidsApp
  stories                 the original story docx files
  client                  the React frontend
    src
      pages
      components
      admin               the admin panel
      context
      hooks
      services
  server                  the Express backend
    routes
    controllers
    scripts               the story, quiz, and audio pipeline
    output                generated story indexes, quizzes, and audio files
  supabase
    schema.sql
```

## 📄 License

**PROPRIETARY AND CONFIDENTIAL**

This software and its documentation are strictly confidential and proprietary to the company.
It is NOT open source. Unauthorized copying, distribution, or use of this project is strictly prohibited. All rights reserved.
