import os
import re
import numpy as np
import logging
import torch
from typing import Dict, Any, List

from audio_processor import preprocess_audio
from quran_muaalem import Muaalem
from quran_transcript import MoshafAttributes, quran_phonetizer, Aya

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("inference")

class TajweedEvaluator:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Initializing Muaalem model on {self.device}...")
        
        # Load the CTC-based acoustic phoneme model
        # Use torch.bfloat16 on GPU for efficiency, torch.float32 on CPU to avoid warnings
        dtype = torch.float32 if self.device == "cpu" else torch.bfloat16
        self.muaalem = Muaalem(
            model_name_or_path='obadx/muaalem-model-v3_2',
            device=self.device,
            dtype=dtype
        )
        logger.info("Muaalem model loaded successfully!")

        # Configure MoshafAttributes for standard Hafs recitation
        self.moshaf = MoshafAttributes(
            rewaya='hafs',
            madd_monfasel_len=4,
            madd_mottasel_len=4,
            madd_mottasel_waqf=4,
            madd_aared_len=4
        )

        # Empirical GOP/Sifa thresholds
        self.gop_threshold = 0.50
        self.sifa_threshold = 0.50

        # Build a lookup cache of normalized Arabic text to original Uthmani text
        self.ayah_lookup = {}
        self._build_ayah_lookup_cache()

    def _build_ayah_lookup_cache(self):
        logger.info("Building Quran Uthmani lookup cache...")
        allowed_surahs = [1] + list(range(78, 115))
        for s_num in allowed_surahs:
            try:
                temp_aya = Aya(sura_idx=s_num, aya_idx=1).get()
                num_ayat = temp_aya.num_ayat_in_sura
                for a_num in range(1, num_ayat + 1):
                    aya_data = Aya(sura_idx=s_num, aya_idx=a_num).get()
                    norm_uthmani = self.normalize_text(aya_data.uthmani)
                    norm_imlaey = self.normalize_text(aya_data.imlaey)
                    self.ayah_lookup[norm_uthmani] = aya_data.uthmani
                    self.ayah_lookup[norm_imlaey] = aya_data.uthmani
            except Exception as e:
                logger.warning(f"Failed to cache Surah {s_num}: {e}")
        logger.info(f"Cached {len(self.ayah_lookup)} entries for Uthmani lookup.")

    def normalize_text(self, text: str) -> str:
        if not text:
            return ""
        # Strip HTML tags
        text = re.sub(r'<[^>]*>', '', text)
        # Strip bracket notes
        text = re.sub(r'\[.*?\]', '', text)
        # Remove tashkeel / waqf marks
        text = re.sub(r'[\u064B-\u065F\u06D6-\u06ED]', '', text)
        # Remove Tatweel (Kashida)
        text = text.replace('\u0640', '')
        # Standardize visually similar characters
        text = text.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ٱ', 'ا')
        text = text.replace('ة', 'ه').replace('ى', 'ا')
        # Keep only Arabic characters and spaces
        text = "".join([c for c in text if c.isspace() or '\u0621' <= c <= '\u064A'])
        return " ".join(text.split())

    def get_uthmani_text(self, input_text: str) -> str:
        """Looks up the fully vocalized Uthmani script for the target text."""
        normalized = self.normalize_text(input_text)
        if normalized in self.ayah_lookup:
            return self.ayah_lookup[normalized]
        
        # Fallback to direct input if not found in cache
        return input_text

    @staticmethod
    def _normalize_ar(text: str) -> str:
        """Strip diacritics / tatweel for loose word comparison."""
        import re
        text = re.sub('[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]', '', text)
        text = text.replace('\u0640', '')  # tatweel
        text = text.replace('\u0671', '\u0627')  # alef wasla -> alef
        return text.strip()

    def evaluate_recitation(self, audio_path: str, target_ayah_text: str, surah_number: int = None, ayah_number: int = None, whisper_transcript: str = None) -> Dict[str, Any]:
        """
        Evaluates the recitation audio file against target_ayah_text using CTC-based QPS alignment.
        Returns word-by-word pronunciation feedback.
        """
        try:
            logger.info(f"Starting evaluation of {audio_path} against '{target_ayah_text}' (Surah: {surah_number}, Ayah: {ayah_number})")
            
            # 1. Preprocess Audio
            y = preprocess_audio(audio_path, target_sr=16000)
            if len(y) == 0:
                return {
                    "overall_pass": False,
                    "score": 0,
                    "words": [],
                    "error": "Silence/empty audio input"
                }

            # 2. Get reference Uthmani text and phonetize
            if surah_number and ayah_number:
                try:
                    # Convert to integers to make sure they are valid
                    s_idx = int(surah_number)
                    a_idx = int(ayah_number)
                    uthmani_text = Aya(sura_idx=s_idx, aya_idx=a_idx).get().uthmani
                    logger.info(f"Resolved Uthmani target directly by index: {uthmani_text}")
                except Exception as index_err:
                    logger.warning(f"Uthmani direct lookup failed ({index_err}). Falling back to text lookup.")
                    uthmani_text = self.get_uthmani_text(target_ayah_text)
            else:
                uthmani_text = self.get_uthmani_text(target_ayah_text)

            logger.info(f"Resolved Uthmani target: {uthmani_text}")
            ref_qps = quran_phonetizer(uthmani_text, self.moshaf)

            # 3. Model Inference (defensive wrapper to catch potential silent audio/empty CTC alignment crashes)
            try:
                outputs = self.muaalem([y], [ref_qps], 16000)
                output = outputs[0]
            except Exception as e:
                logger.error(f"Error during Muaalem model execution: {e}", exc_info=True)
                # Fail gracefully by marking all words as incorrect and prompting clear speech
                return {
                    "words": [
                        {
                            "word": w,
                            "correct": False,
                            "issue": "makhraj",
                            "letter": "",
                            "note": "Recitation not recognized. Please speak clearly into the microphone."
                        }
                        for w in target_ayah_text.split()
                    ],
                    "overall_pass": False,
                    "score": 0,
                    "error": str(e)
                }

            # 4. Map phonemes and sifat to display words
            target_words = target_ayah_text.split()
            words_result = []
            for target_word in target_words:
                words_result.append({
                    "word": target_word,
                    "correct": True,
                    "issue": None,
                    "letter": None,
                    "note": None
                })

            # Check for empty predictions
            if not output.phonemes.text or len(output.phonemes.probs) == 0:
                return {
                    "words": [
                        {
                            "word": w,
                            "correct": False,
                            "issue": "makhraj",
                            "letter": "",
                            "note": "No speech detected or pronunciation incorrect."
                        }
                        for w in target_words
                    ],
                    "overall_pass": False,
                    "score": 0
                }

            # 5. Evaluate Phonemes (Makhraj) at word-level
            # ref_qps.phonemes is a space-separated string of QPS words representing the expected pronunciation
            word_indices = []
            curr_w_idx = 0
            for char in ref_qps.phonemes:
                if char == ' ':
                    word_indices.append(-1)
                    curr_w_idx += 1
                else:
                    word_indices.append(curr_w_idx)

            # Mark low confidence phonemes
            for char_idx, char in enumerate(ref_qps.phonemes):
                w_idx = word_indices[char_idx]
                if w_idx == -1 or w_idx >= len(words_result):
                    continue
                
                # Check model probability for this aligned slot
                if char_idx < len(output.phonemes.probs):
                    prob = output.phonemes.probs[char_idx]
                    if prob < self.gop_threshold:
                        words_result[w_idx]["correct"] = False
                        words_result[w_idx]["issue"] = "makhraj"
                        words_result[w_idx]["letter"] = char
                        words_result[w_idx]["note"] = "sound produced doesn't match expected articulation point"

            # 6. Evaluate Sifat (Tajweed Rules) at word-level
            # sifat_word_indices maps each SifaOutput group to a target word
            sifat_word_indices = []
            phonemes_words = ref_qps.phonemes.split()
            curr_word_idx = 0
            curr_word_char_idx = 0

            for s in ref_qps.sifat:
                s_len = len(s.phonemes)
                sifat_word_indices.append(curr_word_idx)
                curr_word_char_idx += s_len
                if curr_word_char_idx >= len(phonemes_words[curr_word_idx]):
                    curr_word_idx = min(curr_word_idx + 1, len(phonemes_words) - 1)
                    curr_word_char_idx = 0

            # Evaluate each sifa item
            for s_idx, ref_sifa in enumerate(ref_qps.sifat):
                w_idx = sifat_word_indices[s_idx]
                if w_idx >= len(words_result):
                    continue
                
                if s_idx < len(output.sifat):
                    pred_sifa = output.sifat[s_idx]
                    
                    # Qalqalah (Bouncing release) rule
                    if ref_sifa.qalqla == "moqalqal":
                        if not pred_sifa.qalqla or pred_sifa.qalqla.text != "moqalqal" or pred_sifa.qalqla.prob < self.sifa_threshold:
                            words_result[w_idx]["correct"] = False
                            words_result[w_idx]["issue"] = "qalqalah"
                            words_result[w_idx]["letter"] = ref_sifa.phonemes
                            words_result[w_idx]["note"] = "remember to make a bouncing/echo sound here"
                            
                    # Ghunnah (Nasalization) rule
                    if ref_sifa.ghonna == "maghnoon":
                        if not pred_sifa.ghonna or pred_sifa.ghonna.text != "maghnoon" or pred_sifa.ghonna.prob < self.sifa_threshold:
                            words_result[w_idx]["correct"] = False
                            words_result[w_idx]["issue"] = "ghunnah"
                            words_result[w_idx]["letter"] = ref_sifa.phonemes
                            words_result[w_idx]["note"] = "hold the nasal sound a bit longer"

            # 7. Cross-reference with Whisper transcript to detect unspoken words
            if whisper_transcript:
                whisper_words = [self._normalize_ar(w) for w in whisper_transcript.split()]
                spoken_count = len(whisper_words)
                logger.info(f"Whisper detected {spoken_count} words out of {len(words_result)} target words")
                
                # Determine which target words were actually spoken via sequential matching
                spoken_flags = [False] * len(words_result)
                w_idx = 0
                for i, wr in enumerate(words_result):
                    if w_idx >= spoken_count:
                        break
                    target_norm = self._normalize_ar(wr["word"])
                    # Allow fuzzy: if Whisper word shares >50% characters with target
                    whisper_w = whisper_words[w_idx]
                    common = sum(1 for c in whisper_w if c in target_norm)
                    similarity = common / max(len(target_norm), 1)
                    if similarity > 0.3:
                        spoken_flags[i] = True
                        w_idx += 1
                
                # Mark unspoken words
                for i, wr in enumerate(words_result):
                    if not spoken_flags[i]:
                        wr["correct"] = False
                        wr["issue"] = "not_recited"
                        wr["note"] = "this word was not recited"

            # 8. Compute overall pass & accuracy score
            correct_words = sum(1 for w in words_result if w["correct"])
            overall_pass = (correct_words == len(words_result))
            score = int((correct_words / len(words_result)) * 100) if len(words_result) > 0 else 0

            return {
                "words": words_result,
                "overall_pass": overall_pass,
                "score": score,
                "error": None
            }

        except Exception as e:
            logger.error(f"Failed to evaluate recitation: {e}", exc_info=True)
            return {
                "overall_pass": False,
                "score": 0,
                "words": [],
                "error": str(e)
            }
