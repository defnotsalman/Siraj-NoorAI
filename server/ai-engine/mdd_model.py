import os
import torch
import numpy as np
import logging
from typing import List, Dict, Tuple, Any
from transformers import Wav2Vec2Processor, Wav2Vec2ForCTC

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mdd_model")

class TajweedMDDModel:
    def __init__(self, model_name: str = "jonatasgrosman/wav2vec2-large-xlsr-53-arabic"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model_name = model_name
        logger.info(f"Loading Wav2Vec2 model: {self.model_name} on {self.device}...")
        
        try:
            self.processor = Wav2Vec2Processor.from_pretrained(self.model_name)
            self.model = Wav2Vec2ForCTC.from_pretrained(self.model_name).to(self.device)
            logger.info("Wav2Vec2 model loaded successfully!")
        except Exception as e:
            logger.error(f"Failed to load model from online repository: {e}")
            logger.info("Attempting local load fallback...")
            try:
                self.processor = Wav2Vec2Processor.from_pretrained(self.model_name, local_files_only=True)
                self.model = Wav2Vec2ForCTC.from_pretrained(self.model_name, local_files_only=True).to(self.device)
                logger.info("Loaded local Wav2Vec2 model successfully!")
            except Exception as e_local:
                raise RuntimeError(f"Acoustic model could not be loaded: {e_local}")
                
        # Vocabulary mapping
        self.vocab = self.processor.tokenizer.get_vocab()
        self.blank_id = self.vocab.get("<pad>", 0)

    def get_char_id(self, char: str) -> int:
        """Retrieves vocabulary ID for an Arabic character, handling normalized variants."""
        # Simple character mappings to handle orthographic variations in the vocab
        mappings = {
            'ة': 'ه', 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ى': 'ا', 'ء': 'ا'
        }
        
        if char in self.vocab:
            return self.vocab[char]
            
        mapped = mappings.get(char, char)
        if mapped in self.vocab:
            return self.vocab[mapped]
            
        # Default fallback (returns first letter ID or a space if not found)
        return self.vocab.get('ا', 1)

    def compute_posteriors(self, y: np.ndarray, sr: int = 16000) -> np.ndarray:
        """Passes raw waveform through Wav2Vec2 to compute log probabilities."""
        inputs = self.processor(y, sampling_rate=sr, return_tensors="pt", padding=True)
        input_values = inputs.input_values.to(self.device)
        
        with torch.no_grad():
            logits = self.model(input_values).logits[0]  # Shape: (T, V)
            
        # Apply Log Softmax to get log probabilities
        log_probs = torch.log_softmax(logits, dim=-1).cpu().numpy()
        return log_probs

    def align(self, log_probs: np.ndarray, target_chars: List[str]) -> List[Tuple[int, int]]:
        """
        Runs the Viterbi alignment algorithm to find boundaries for each target character.
        """
        target_ids = [self.get_char_id(c) for c in target_chars]
        T = log_probs.shape[0]
        L = len(target_ids)
        
        # Interleave target IDs with blanks: 2L + 1 states
        states = []
        for tid in target_ids:
            states.append(self.blank_id)
            states.append(tid)
        states.append(self.blank_id)
        
        S = len(states)
        dp = np.full((T, S), -np.inf)
        backpointer = np.zeros((T, S), dtype=int)
        
        # Initial frame 0
        dp[0, 0] = log_probs[0, states[0]]
        if S > 1:
            dp[0, 1] = log_probs[0, states[1]]
            
        for t in range(1, T):
            for s in range(S):
                # Self-loop transition
                best_prev_s = s
                best_val = dp[t-1, s]
                
                # Move from s-1
                if s > 0 and dp[t-1, s-1] > best_val:
                    best_prev_s = s-1
                    best_val = dp[t-1, s-1]
                    
                # Move from s-2 (skip blank)
                if s > 1 and states[s] != self.blank_id and states[s] != states[s-2]:
                    if dp[t-1, s-2] > best_val:
                        best_prev_s = s-2
                        best_val = dp[t-1, s-2]
                        
                dp[t, s] = best_val + log_probs[t, states[s]]
                backpointer[t, s] = best_prev_s
                
        # Backtrack
        best_s = S - 1
        if S > 1 and dp[T-1, S-2] > dp[T-1, S-1]:
            best_s = S - 2
            
        path = []
        curr_s = best_s
        for t in range(T-1, -1, -1):
            path.append(curr_s)
            curr_s = backpointer[t, curr_s]
        path.reverse()
        
        # Extract boundaries (start and end frames) for each target character (state 2k + 1)
        alignment = []
        for k in range(L):
            state_idx = 2 * k + 1
            frames = [t for t, s in enumerate(path) if s == state_idx]
            if frames:
                alignment.append((frames[0], frames[-1]))
            else:
                alignment.append((-1, -1))
                
        return alignment

    def calculate_gop(self, log_probs: np.ndarray, target_chars: List[str], alignment: List[Tuple[int, int]]) -> List[float]:
        """Calculates GOP score (0-100) for each expected character slot."""
        target_ids = [self.get_char_id(c) for c in target_chars]
        gop_scores = []
        probs = np.exp(log_probs)
        
        for k, (start, end) in enumerate(alignment):
            if start == -1 or end == -1:
                gop_scores.append(0.0)
                continue
                
            dur = end - start + 1
            gop_sum = 0.0
            
            for t in range(start, end + 1):
                target_prob = probs[t, target_ids[k]]
                max_prob = np.max(probs[t, :])
                if max_prob <= 0: max_prob = 1e-6
                if target_prob <= 0: target_prob = 1e-6
                gop_sum += np.log(target_prob / max_prob)
                
            gop_avg = gop_sum / dur
            # Map log likelihood ratio to 0-100 percentage
            gop_pct = np.clip(np.exp(gop_avg) * 100.0, 0.0, 100.0)
            gop_scores.append(float(gop_pct))
            
        return gop_scores
