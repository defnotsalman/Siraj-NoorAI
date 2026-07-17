import re
from typing import List, Dict, Any

class ArabicPhonetizer:
    # Character maps to phonetic symbols
    CHAR_TO_PHONE = {
        'أ': 'hamza', 'إ': 'hamza', 'آ': 'hamza_madd', 'ء': 'hamza', 'ؤ': 'hamza', 'ئ': 'hamza',
        'ا': 'a', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'j', 'ح': 'h_gutt', 'خ': 'kh', 
        'د': 'd', 'ذ': 'dh', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh', 'ص': 's_emph', 
        'ض': 'd_emph', 'ط': 't_emph', 'ظ': 'dh_emph', 'ع': 'a_gutt', 'غ': 'gh', 
        'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n', 'ه': 'h', 
        'و': 'w', 'ي': 'y', 'ى': 'a', 'ة': 't'
    }

    # Diacritic definitions
    FATHA = '\u064E'
    DAMMA = '\u064F'
    KASRA = '\u0650'
    FATHATAYN = '\u064B'
    DAMMATAYN = '\u064C'
    KASRATAYN = '\u064D'
    SUKUN = '\u0652'
    SHADDAH = '\u0651'
    DAGGER_ALIF = '\u0670'

    QALQALAH_LETTERS = {'ق', 'ط', 'ب', 'ج', 'د'}
    THROAT_LETTERS = {'أ', 'إ', 'ء', 'ه', 'ع', 'ح', 'غ', 'خ'}
    YARMALOON_LETTERS = {'ي', 'ر', 'م', 'ل', 'و', 'ن'}
    IDGHAM_NO_GHUNNAH = {'ر', 'ل'}

    def __init__(self):
        pass

    def clean_text(self, text: str) -> str:
        """Removes symbols/brackets, keeps letters and tashkeel."""
        if not text:
            return ""
        # Remove HTML/custom brackets
        clean = re.sub(r'<[^>]*>', '', text)
        clean = re.sub(r'\[.*?\]', '', clean)
        # Keep Arabic range, space, and tashkeel (064B-0652, 0670)
        clean = "".join([c for c in clean if c.isspace() or '\u0600' <= c <= '\u06FF'])
        return " ".join(clean.split())

    def phonetize(self, text: str) -> List[Dict[str, Any]]:
        """
        Converts fully vocalized Arabic text into a sequence of canonical phonemes,
        annotating each with Tajweed rules and duration markers.
        """
        cleaned = self.clean_text(text)
        words = cleaned.split()
        phonemes = []
        
        for w_idx, word in enumerate(words):
            word_phonemes = []
            i = 0
            n_chars = len(word)
            
            while i < n_chars:
                char = word[i]
                
                # Retrieve next characters and diacritics
                diacritics = []
                next_letter = None
                
                # Check for subsequent diacritics (Shaddah, Fatha, etc.)
                j = i + 1
                while j < n_chars and word[j] in [self.FATHA, self.DAMMA, self.KASRA, 
                                                 self.FATHATAYN, self.DAMMATAYN, self.KASRATAYN, 
                                                 self.SUKUN, self.SHADDAH, self.DAGGER_ALIF]:
                    diacritics.append(word[j])
                    j += 1
                
                # Find the next actual letter (could be in the next word if we are at the end)
                if j < n_chars:
                    next_letter = word[j]
                elif w_idx + 1 < len(words):
                    next_letter = words[w_idx + 1][0]  # First letter of next word
                
                # Basic phone mapping
                phone = self.CHAR_TO_PHONE.get(char, char)
                
                if phone not in self.CHAR_TO_PHONE.values():
                    # If it's a diacritic itself or unknown, skip
                    i = j
                    continue
                
                rule = "Izhar"  # Default rule (plain pronunciation)
                duration = 1.0   # Standard duration scale
                
                # ── Tajweed Rule: Noon Sakinah & Tanween ──
                is_noon_sakinah = (char == 'ن' and (self.SUKUN in diacritics or not diacritics))
                is_tanween = any(t in diacritics for t in [self.FATHATAYN, self.DAMMATAYN, self.KASRATAYN])
                
                if (is_noon_sakinah or is_tanween) and next_letter:
                    if next_letter == 'ب':
                        rule = "Iqlab"
                        phone = "m"  # Shifts Nun to Meem sound
                        duration = 2.0
                    elif next_letter in self.YARMALOON_LETTERS:
                        if next_letter in self.IDGHAM_NO_GHUNNAH:
                            rule = "Idghaam_no_Ghunnah"
                            phone = ""  # Skip Nun sound entirely
                            duration = 0.5
                        else:
                            rule = "Idghaam_Ghunnah"
                            phone = self.CHAR_TO_PHONE.get(next_letter, next_letter)  # Merges into next letter
                            duration = 2.0
                    elif next_letter in self.THROAT_LETTERS:
                        rule = "Izhar"
                        duration = 1.0
                    else:
                        rule = "Ikhfa"
                        duration = 2.0
                
                # ── Tajweed Rule: Qalqalah ──
                is_silent = (self.SUKUN in diacritics) or (j == n_chars)  # At end of word, letter implicitly gets Sukun when stopping
                if char in self.QALQALAH_LETTERS and is_silent:
                    rule = "Qalqalah"
                    duration = 1.2  # Plosive release duration extension
                
                # ── Tajweed Rule: Madd (Elongation) ──
                is_long_vowel = False
                if char in ['ا', 'و', 'ي']:
                    # Check if preceded by corresponding short vowel
                    prev_char = word[i-1] if i > 0 else ""
                    if char == 'ا' and prev_char == self.FATHA:
                        is_long_vowel = True
                    elif char == 'و' and prev_char == self.DAMMA:
                        is_long_vowel = True
                    elif char == 'ي' and prev_char == self.KASRA:
                        is_long_vowel = True
                        
                if (is_long_vowel or self.DAGGER_ALIF in diacritics):
                    duration = 2.0  # Standard Madd is 2 counts
                    rule = "Madd_2"
                    # Look ahead for Hamza or Sukun/Shaddah to trigger longer Madd
                    if next_letter in ['ء', 'أ', 'إ']:
                        rule = "Madd_4"  # Madd Muttasil/Munfasil
                        duration = 4.0
                    elif next_letter and (next_letter in word and (self.SUKUN in word or self.SHADDAH in word)):
                        rule = "Madd_6"  # Madd Lazim
                        duration = 6.0
                
                # Handle Shaddah (gemination / doubling)
                if self.SHADDAH in diacritics:
                    duration += 1.0
                    
                # Append phone
                if phone:  # Omit empty phones (like in Idgham without Ghunnah)
                    word_phonemes.append({
                        "char": char,
                        "phone": phone,
                        "rule": rule,
                        "duration": duration,
                        "word_index": w_idx,
                        "char_index": i
                    })
                
                i = j
            
            phonemes.extend(word_phonemes)
            
        return phonemes
