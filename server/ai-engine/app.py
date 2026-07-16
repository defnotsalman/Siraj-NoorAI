import os
import io
import torch
import numpy as np
import traceback
import tempfile
import subprocess
from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="NoorKids AI Engine", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Model Configuration ──
MODEL_NAME = "tarteel-ai/whisper-base-ar-quran"

print(f"Loading Whisper model: {MODEL_NAME} ...")
try:
    processor = WhisperProcessor.from_pretrained(MODEL_NAME)
    model = WhisperForConditionalGeneration.from_pretrained(MODEL_NAME)
    
    # Force Arabic language and transcription task
    model.config.forced_decoder_ids = processor.get_decoder_prompt_ids(
        language="ar", task="transcribe"
    )
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    print(f"Model loaded successfully on {device}!")
except Exception as e:
    print(f"Error loading model: {e}")
    traceback.print_exc()
    processor = None
    model = None


def get_ffmpeg_path():
    """Try to find ffmpeg — check imageio_ffmpeg first, then system PATH."""
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        pass
    
    # Try system ffmpeg
    import shutil
    ffmpeg_path = shutil.which("ffmpeg")
    if ffmpeg_path:
        return ffmpeg_path
    
    raise RuntimeError(
        "ffmpeg not found! Install it via: pip install imageio-ffmpeg  OR  install ffmpeg system-wide"
    )


class EvaluateResponse(BaseModel):
    transcription: str
    error: str = None


@app.get("/")
def read_root():
    return {
        "status": "ok",
        "message": "NoorKids AI Engine Running",
        "model": MODEL_NAME,
        "model_loaded": model is not None,
        "device": str(model.device) if model else "N/A"
    }


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "healthy": model is not None and processor is not None,
        "model": MODEL_NAME,
        "device": str(model.device) if model else "N/A"
    }


@app.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_audio(
    audio: UploadFile = File(...),
    expected_text: str = Form(None)
):
    """
    Receives an audio file (typically webm or wav) and transcribes it using
    tarteel-ai/whisper-base-ar-quran — a Whisper model fine-tuned specifically
    on Quranic Arabic recitation.
    """
    if model is None or processor is None:
        return {"transcription": "", "error": "Model not loaded properly on the server."}
        
    path_in = None
    path_out = None
    
    try:
        audio_bytes = await audio.read()
        
        if len(audio_bytes) < 100:
            return {"transcription": "", "error": "Audio file is too small — likely empty recording."}
        
        # Save to temp file
        fd_in, path_in = tempfile.mkstemp(suffix=".webm")
        with os.fdopen(fd_in, 'wb') as f:
            f.write(audio_bytes)
            
        fd_out, path_out = tempfile.mkstemp(suffix=".wav")
        os.close(fd_out)
        
        # Find ffmpeg
        ffmpeg_exe = get_ffmpeg_path()
        
        # Convert to 16kHz mono WAV using ffmpeg
        subprocess.run([
            ffmpeg_exe, '-y', '-i', path_in, 
            '-ar', '16000', '-ac', '1', path_out
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Load WAV
        import scipy.io.wavfile as wavfile
        sr, y_int16 = wavfile.read(path_out)
        
        # Check for empty audio data
        if y_int16.size == 0:
            return {"transcription": "", "error": "Audio file is empty."}
        
        # Handle stereo (shouldn't happen with -ac 1 but just in case)
        if len(y_int16.shape) > 1:
            y_int16 = y_int16[:, 0]
        
        # Normalize to [-1.0, 1.0] float32 as Whisper expects
        y = y_int16.astype(np.float32) / 32768.0
        
        # Skip if audio is essentially silence
        if np.max(np.abs(y)) < 0.01:
            return {"transcription": "", "error": "Audio is too quiet — no speech detected."}
        
        # Process input through Whisper
        input_features = processor(
            y, sampling_rate=16000, return_tensors="pt"
        ).input_features.to(model.device)
        
        # Generate token ids with forced Arabic language
        predicted_ids = model.generate(
            input_features,
            max_new_tokens=448,  # Allow longer transcriptions
        )
        
        # Decode token ids to text
        transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
        
        print(f"[EVALUATE] Transcribed: {transcription}")
        
        return {
            "transcription": transcription.strip(),
            "error": None
        }
        
    except Exception as e:
        print(f"Evaluation error: {traceback.format_exc()}")
        return {"transcription": "", "error": str(e)}
    finally:
        # Always clean up temp files
        if path_in and os.path.exists(path_in):
            os.remove(path_in)
        if path_out and os.path.exists(path_out):
            os.remove(path_out)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
