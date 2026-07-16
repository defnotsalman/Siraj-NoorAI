# 🚀 How to Run NoorKids App

## Prerequisites

- **Node.js** v18+ ([download](https://nodejs.org/))
- **Python** 3.10+ ([download](https://www.python.org/downloads/))
- **Git** ([download](https://git-scm.com/))

---

## Step 1: Install Dependencies

Open **three separate terminals**. You'll need all three running simultaneously.

### Terminal 1 — Server
```bash
cd NoorKidsApp/server
npm install
```

### Terminal 2 — Client
```bash
cd NoorKidsApp/client
npm install
```

### Terminal 3 — AI Engine (Python)
```bash
cd NoorKidsApp/server/ai-engine

# Create a virtual environment (first time only)
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

> **Note**: The `torch` package is large (~2GB). The first install will take a while.
> If you have an NVIDIA GPU and want faster inference, install PyTorch with CUDA:
> ```bash
> pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
> ```

---

## Step 2: Set Up Environment Variables

### Client `.env` (in `client/` folder)
Create a file called `.env` inside `client/`:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Server `.env` (in `server/` folder)
Create a file called `.env` inside `server/`:
```env
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
OPENAI_API_KEY=your_openai_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

---

## Step 3: Build Quran Data (First Time Only)

The Quran data (Para 30 — Surahs 78-114 + Al-Fatiha) needs to be fetched from the Al Quran Cloud API once:

```bash
cd NoorKidsApp/server
node scripts/buildQuranData.js
```

This creates JSON files in `server/output/quran/`. It only fetches surahs that don't already exist, so it's safe to run multiple times.

---

## Step 4: Start All Three Services

### Terminal 1 — Start the Node.js Server
```bash
cd NoorKidsApp/server
npm run dev
```
Server runs at: **http://localhost:5000**

### Terminal 2 — Start the React Client
```bash
cd NoorKidsApp/client
npm run dev
```
Client runs at: **http://localhost:5173**

### Terminal 3 — Start the AI Engine (for Quran recitation grading)
```bash
cd NoorKidsApp/server/ai-engine

# Activate venv first
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

python app.py
```
AI Engine runs at: **http://127.0.0.1:8000**

> **Important**: The AI Engine must be running for the "Practice Recitation" feature to work.
> On first launch, it will download the `tarteel-ai/whisper-base-ar-quran` model (~300MB).

---

## Step 5: Open the App

Open your browser and go to: **http://localhost:5173**

---

## Troubleshooting

### "AI Engine is not running" error when practicing recitation
Make sure Terminal 3 (the Python AI engine) is running. You should see:
```
✅ Model loaded successfully on cpu!
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### `axios` or module resolution errors
If you see axios-related errors, delete the root-level `node_modules` and reinstall:
```bash
# From the NoorKidsApp root
rm -rf node_modules package-lock.json
# Then reinstall in client and server separately
cd client && npm install
cd ../server && npm install
```

### `ffmpeg not found` error in the AI engine
Install ffmpeg for audio conversion:
```bash
pip install imageio-ffmpeg
```
Or install ffmpeg system-wide: https://ffmpeg.org/download.html

### Port already in use
If port 5000 or 5173 is already in use:
```bash
# Find and kill the process (Windows)
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Python venv issues on Windows
If `venv\Scripts\activate` doesn't work, try:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

---

## Architecture

```
NoorKidsApp/
├── client/          → React frontend (Vite + Tailwind v4)
│   └── src/
│       ├── pages/Quran.jsx        → Surah listing (Para 30 only)
│       ├── pages/SurahDetails.jsx → Ayah view + recitation practice
│       └── components/Quran/      → PracticeRecitation component
├── server/          → Express.js backend
│   ├── controllers/quranController.js → Quran API + grading logic
│   ├── scripts/buildQuranData.js      → Fetch Quran data from API
│   ├── output/quran/                  → Cached Quran JSON data
│   └── ai-engine/   → Python FastAPI service
│       └── app.py   → Whisper model for Quranic Arabic ASR
```

### How Recitation Practice Works

1. **User records** → Browser captures audio via MediaRecorder API
2. **Audio sent to Express** → `/api/quran/practice` endpoint
3. **Express forwards to Python AI** → `http://127.0.0.1:8000/evaluate`
4. **Whisper transcribes** → `tarteel-ai/whisper-base-ar-quran` model
5. **Word alignment** → Levenshtein fuzzy matching compares transcription to target ayah
6. **Score returned** → Each word is marked as matched/unmatched with similarity %
