import os
import numpy as np
import logging
from typing import Dict, Any, List

from audio_processor import preprocess_audio
from phonetizer import ArabicPhonetizer
from mdd_model import TajweedMDDModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("inference")

class TajweedEvaluator:
    def __init__(self):
        self.phonetizer = ArabicPhonetizer()
        self.mdd_model = TajweedMDDModel()
        
        # Empirical GOP thresholds for different Tajweed rules
        self.thresholds = {
            "Izhar": 50.0,
            "Ikhfa": 55.0,
            "Iqlab": 55.0,
            "Idghaam_Ghunnah": 55.0,
            "Idghaam_no_Ghunnah": 50.0,
            "Qalqalah": 60.0,
            "Madd_2": 55.0,
            "Madd_4": 60.0,
            "Madd_6": 60.0
        }

    def evaluate_recitation(self, audio_path: str, target_ayah_text: str) -> Dict[str, Any]:
        """
        Evaluates the recitation audio file against target_ayah_text.
        Returns a structured JSON-serializable dictionary.
        """
        try:
            logger.info(f"Starting evaluation of {audio_path} against '{target_ayah_text}'")
            
            # 1. Preprocess Audio
            y = preprocess_audio(audio_path, target_sr=16000)
            if len(y) == 0:
                return {"score": 0, "error": "Silence/empty audio input"}
                
            # 2. Phonetize Target Text
            expected_phonemes = self.phonetizer.phonetize(target_ayah_text)
            if not expected_phonemes:
                return {"score": 0, "error": "No valid Arabic phonemes parsed from expected text"}
                
            target_chars = [p["char"] for p in expected_phonemes]
            
            # 3. Compute Log Probabilities from Wav2Vec2
            log_probs = self.mdd_model.compute_posteriors(y, sr=16000)
            
            # 4. Perform Force Alignment (Viterbi)
            alignment = self.mdd_model.align(log_probs, target_chars)
            
            # 5. Compute Goodness of Pronunciation (GOP) Scores
            gops = self.mdd_model.calculate_gop(log_probs, target_chars, alignment)
            
            # 6. Diagnose errors at phoneme level
            phoneme_details = []
            words_in_ayah = target_ayah_text.split()
            
            for k, p in enumerate(expected_phonemes):
                start_frame, end_frame = alignment[k]
                gop_score = gops[k]
                rule = p["rule"]
                
                # Default status logic based on thresholds
                threshold = self.thresholds.get(rule, 50.0)
                status = "Correct" if gop_score >= threshold else "Wrong Articulation / Makhraj"
                feedback = "Correct pronunciation." if status == "Correct" else "Verify makhraj (articulation point)."
                
                # Check frame duration for Madd vowels (Wav2Vec2 frame duration = 20ms)
                if start_frame != -1 and end_frame != -1:
                    duration_sec = (end_frame - start_frame + 1) * 0.02
                    
                    if "Madd" in rule:
                        expected_duration = p["duration"] * 0.2  # Approximate scale
                        if duration_sec < expected_duration:
                            status = "Madd too short"
                            feedback = f"Extend long vowel length (Madd). Aligned duration: {duration_sec:.2f}s."
                    elif rule == "Qalqalah" and gop_score < threshold:
                        status = "Qalqalah missing"
                        feedback = "Perform plosive release (bouncing echo) on the letter."
                    elif rule in ["Ikhfa", "Iqlab", "Idghaam_Ghunnah"] and gop_score < threshold:
                        status = "Ghunnah missing"
                        feedback = "Ensure proper nasal sound (Ghunnah) is held."
                else:
                    status = "Skipped"
                    feedback = "Letter was skipped or not vocalized clearly."
                    duration_sec = 0.0
                
                phoneme_details.append({
                    "char": p["char"],
                    "phone": p["phone"],
                    "rule": rule,
                    "gop": round(gop_score, 1),
                    "status": status,
                    "feedback": feedback,
                    "duration_sec": round(duration_sec, 2),
                    "word_index": p["word_index"]
                })
                
            # 7. Aggregate into word-level accuracy segment markers
            word_details = []
            num_words = len(words_in_ayah)
            
            for w_idx in range(num_words):
                word_phones = [p for p in phoneme_details if p["word_index"] == w_idx]
                if not word_phones:
                    continue
                    
                # Calculate word timings
                valid_phones = [p for p in word_phones if p["status"] != "Skipped"]
                if valid_phones:
                    # Find min/max boundaries
                    word_start = min(alignment[k][0] for k, p in enumerate(expected_phonemes) if p["word_index"] == w_idx and alignment[k][0] != -1) * 0.02
                    word_end = max(alignment[k][1] for k, p in enumerate(expected_phonemes) if p["word_index"] == w_idx and alignment[k][1] != -1) * 0.02
                else:
                    word_start = 0.0
                    word_end = 0.0
                    
                # Word score is average of phone GOPs
                word_gop = sum(p["gop"] for p in word_phones) / len(word_phones)
                word_correct = word_gop >= 55.0
                
                word_details.append({
                    "word": words_in_ayah[w_idx],
                    "start_time": round(word_start, 2),
                    "end_time": round(word_end, 2),
                    "matched": word_correct,
                    "accuracy": round(word_gop, 1)
                })
                
            # Compute overall score
            overall_score = round(sum(p["gop"] for p in phoneme_details) / len(phoneme_details))
            
            return {
                "score": overall_score,
                "words": word_details,
                "phonemes": phoneme_details,
                "error": None
            }
            
        except Exception as e:
            logger.error(f"Failed to evaluate recitation: {e}", exc_info=True)
            return {"score": 0, "error": str(e)}
