import os
import io
import torch
import librosa
from fastapi import FastAPI, UploadFile, File, Form
from pydantic import BaseModel
from transformers import WhisperProcessor, WhisperForConditionalGeneration
from fastapi.middleware.cors import CORSMiddleware
import traceback

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_NAME = "tarteel-ai/whisper-base-ar-quran"

print(f"Loading Whisper model {MODEL_NAME}...")
try:
    processor = WhisperProcessor.from_pretrained(MODEL_NAME)
    model = WhisperForConditionalGeneration.from_pretrained(MODEL_NAME)
    model.config.forced_decoder_ids = None
    
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    print(f"Model loaded successfully on {device}!")
except Exception as e:
    print(f"Error loading model: {e}")
    # We allow the app to start even if model loading fails, for debugging.
    processor = None
    model = None

class EvaluateResponse(BaseModel):
    transcription: str
    error: str = None

@app.get("/")
def read_root():
    return {"status": "ok", "message": "NoorKids AI Engine Running"}

@app.post("/evaluate", response_model=EvaluateResponse)
async def evaluate_audio(
    audio: UploadFile = File(...),
    expected_text: str = Form(None)
):
    """
    Receives an audio file (typically webm or wav) and transcribes it using
    tarteel-ai/whisper-base-ar-quran.
    """
    if model is None or processor is None:
        return {"transcription": "", "error": "Model not loaded properly on the server."}
        
    try:
        audio_bytes = await audio.read()
        
        # Save WebM to temp file
        import tempfile
        import subprocess
        import numpy as np
        import scipy.io.wavfile as wavfile
        import imageio_ffmpeg
        
        fd_in, path_in = tempfile.mkstemp(suffix=".webm")
        with os.fdopen(fd_in, 'wb') as f:
            f.write(audio_bytes)
            
        fd_out, path_out = tempfile.mkstemp(suffix=".wav")
        os.close(fd_out) # We'll let ffmpeg overwrite it
        
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        
        # Convert to 16kHz mono WAV using ffmpeg
        subprocess.run([
            ffmpeg_exe, '-y', '-i', path_in, 
            '-ar', '16000', '-ac', '1', path_out
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Load WAV
        sr, y_int16 = wavfile.read(path_out)
        
        # Normalize to [-1.0, 1.0] float32 as Whisper expects
        y = y_int16.astype(np.float32) / 32768.0
        
        # Cleanup
        os.remove(path_in)
        os.remove(path_out)
        
        # Process input
        input_features = processor(
            y, sampling_rate=16000, return_tensors="pt"
        ).input_features.to(model.device)
        
        # Generate token ids
        predicted_ids = model.generate(input_features)
        
        # Decode token ids to text
        transcription = processor.batch_decode(predicted_ids, skip_special_tokens=True)[0]
        
        print(f"[EVALUATE] Transcribed: {transcription}")
        
        return {
            "transcription": transcription,
            "error": None
        }
        
    except Exception as e:
        print(f"Evaluation error: {traceback.format_exc()}")
        return {"transcription": "", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
