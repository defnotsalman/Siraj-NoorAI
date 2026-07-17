import os
import numpy as np
import librosa
import soundfile as sf
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("audio_processor")

def load_audio(file_path: str, target_sr: int = 16000) -> np.ndarray:
    """Loads an audio file, resamples to target_sr, and normalizes it."""
    try:
        # Load audio using librosa
        y, sr = librosa.load(file_path, sr=target_sr, mono=True)
        logger.info(f"Loaded audio {file_path} using librosa (sr={sr}, shape={y.shape})")
    except Exception as e:
        logger.warning(f"Librosa load failed: {e}. Trying soundfile/scipy...")
        try:
            # Fallback to soundfile
            y, sr = sf.read(file_path)
            if len(y.shape) > 1:
                y = y[:, 0]  # Mono conversion
            if sr != target_sr:
                y = librosa.resample(y, orig_sr=sr, target_sr=target_sr)
            logger.info(f"Loaded audio {file_path} using soundfile (sr={target_sr})")
        except Exception as e2:
            raise RuntimeError(f"Failed to load audio: {e2}")
            
    # Normalize volume levels
    max_val = np.max(np.abs(y))
    if max_val > 0:
        y = y / max_val
        
    return y

def energy_based_vad(y: np.ndarray, sr: int = 16000, 
                     threshold_db: float = -35.0, 
                     frame_length_ms: float = 30.0, 
                     hop_length_ms: float = 10.0) -> np.ndarray:
    """Trims silence from start/end of the audio using an energy threshold."""
    frame_length = int(sr * frame_length_ms / 1000.0)
    hop_length = int(sr * hop_length_ms / 1000.0)
    
    # Calculate short-time root-mean-square (RMS) energy
    rms = librosa.feature.rms(y=y, frame_length=frame_length, hop_length=hop_length)[0]
    
    # Convert threshold from dB to linear scale
    threshold_linear = librosa.db_to_amplitude(threshold_db)
    
    # Find active frames
    active_frames = np.where(rms > threshold_linear)[0]
    if len(active_frames) == 0:
        logger.warning("No speech detected — entire audio is below threshold.")
        return y
        
    start_frame = active_frames[0]
    end_frame = active_frames[-1]
    
    # Map back to sample indices
    start_sample = start_frame * hop_length
    end_sample = min(len(y), (end_frame + 1) * hop_length + frame_length)
    
    logger.info(f"VAD trimmed audio from {len(y)} samples to {end_sample - start_sample} samples")
    return y[start_sample:end_sample]

def preprocess_audio(file_path: str, target_sr: int = 16000) -> np.ndarray:
    """Loads, resamples, trims silence, and normalizes audio."""
    y = load_audio(file_path, target_sr=target_sr)
    y_trimmed = energy_based_vad(y, sr=target_sr)
    return y_trimmed
