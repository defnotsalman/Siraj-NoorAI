import unittest
import numpy as np
import torch
from unittest.mock import MagicMock, patch

from inference import TajweedEvaluator
from quran_muaalem.muaalem_typing import MuaalemOutput, Unit, Sifa, SingleUnit
from quran_transcript import MoshafAttributes, quran_phonetizer, Aya

class TestPronunciationEvaluation(unittest.TestCase):
    def setUp(self):
        # Patch Muaalem loading during init to run tests instantly without loading 600MB weights
        with patch('inference.Muaalem') as mock_muaalem_class:
            self.evaluator = TajweedEvaluator()
            self.evaluator.muaalem = MagicMock()

        # Patch preprocess_audio in inference to return a dummy array
        self.preprocess_patcher = patch('inference.preprocess_audio')
        self.mock_preprocess = self.preprocess_patcher.start()
        self.mock_preprocess.return_value = np.zeros(16000, dtype=np.float32)

    def tearDown(self):
        self.preprocess_patcher.stop()

    def test_normalize_text(self):
        text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
        normalized = self.evaluator.normalize_text(text)
        self.assertEqual(normalized, "بسم الله الرحمن الرحيم")

    def test_correct_recitation(self):
        # 1. Prepare expected Uthmani and reference QPS
        uthmani_text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
        ref_qps = quran_phonetizer(uthmani_text, self.evaluator.moshaf)
        
        # 2. Mock model output with 100% confidence for all phonemes and sifat
        mock_probs = torch.ones(len(ref_qps.phonemes))
        mock_ids = torch.ones(len(ref_qps.phonemes), dtype=torch.long)
        
        mock_sifat = []
        for s in ref_qps.sifat:
            mock_sifat.append(Sifa(
                phonemes_group=s.phonemes,
                hams_or_jahr=SingleUnit(text=s.hams_or_jahr, prob=0.99, idx=1) if s.hams_or_jahr else None,
                shidda_or_rakhawa=SingleUnit(text=s.shidda_or_rakhawa, prob=0.99, idx=1) if s.shidda_or_rakhawa else None,
                tafkheem_or_taqeeq=SingleUnit(text=s.tafkheem_or_taqeeq, prob=0.99, idx=1) if s.tafkheem_or_taqeeq else None,
                itbaq=SingleUnit(text=s.itbaq, prob=0.99, idx=1) if s.itbaq else None,
                safeer=SingleUnit(text=s.safeer, prob=0.99, idx=1) if s.safeer else None,
                qalqla=SingleUnit(text=s.qalqla, prob=0.99, idx=1) if s.qalqla else None,
                tikraar=SingleUnit(text=s.tikraar, prob=0.99, idx=1) if s.tikraar else None,
                tafashie=SingleUnit(text=s.tafashie, prob=0.99, idx=1) if s.tafashie else None,
                istitala=SingleUnit(text=s.istitala, prob=0.99, idx=1) if s.istitala else None,
                ghonna=SingleUnit(text=s.ghonna, prob=0.99, idx=1) if s.ghonna else None
            ))
            
        mock_output = MuaalemOutput(
            phonemes=Unit(text=ref_qps.phonemes, probs=mock_probs, ids=mock_ids),
            sifat=mock_sifat
        )
        
        self.evaluator.muaalem.return_value = [mock_output]
        
        # Run evaluation
        result = self.evaluator.evaluate_recitation("dummy.wav", uthmani_text)
        
        # Verify
        self.assertTrue(result["overall_pass"])
        self.assertEqual(result["score"], 100)
        for w in result["words"]:
            self.assertTrue(w["correct"])
            self.assertIsNone(w["issue"])

    def test_incorrect_makhraj_evaluation(self):
        # 1. Prepare expected Uthmani and reference QPS
        uthmani_text = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ"
        ref_qps = quran_phonetizer(uthmani_text, self.evaluator.moshaf)
        
        # 2. Mock model output where a phoneme in the second word ("اللَّهِ") has a very low GOP probability (0.2)
        mock_probs = torch.ones(len(ref_qps.phonemes))
        target_idx = ref_qps.phonemes.find('ل')
        mock_probs[target_idx] = 0.20  # Low confidence
        
        mock_sifat = []
        for s in ref_qps.sifat:
            mock_sifat.append(Sifa(
                phonemes_group=s.phonemes,
                hams_or_jahr=SingleUnit(text=s.hams_or_jahr, prob=0.99, idx=1) if s.hams_or_jahr else None,
                shidda_or_rakhawa=SingleUnit(text=s.shidda_or_rakhawa, prob=0.99, idx=1) if s.shidda_or_rakhawa else None,
                tafkheem_or_taqeeq=SingleUnit(text=s.tafkheem_or_taqeeq, prob=0.99, idx=1) if s.tafkheem_or_taqeeq else None,
                itbaq=SingleUnit(text=s.itbaq, prob=0.99, idx=1) if s.itbaq else None,
                safeer=SingleUnit(text=s.safeer, prob=0.99, idx=1) if s.safeer else None,
                qalqla=SingleUnit(text=s.qalqla, prob=0.99, idx=1) if s.qalqla else None,
                tikraar=SingleUnit(text=s.tikraar, prob=0.99, idx=1) if s.tikraar else None,
                tafashie=SingleUnit(text=s.tafashie, prob=0.99, idx=1) if s.tafashie else None,
                istitala=SingleUnit(text=s.istitala, prob=0.99, idx=1) if s.istitala else None,
                ghonna=SingleUnit(text=s.ghonna, prob=0.99, idx=1) if s.ghonna else None
            ))
            
        mock_output = MuaalemOutput(
            phonemes=Unit(text=ref_qps.phonemes, probs=mock_probs, ids=torch.ones(len(ref_qps.phonemes), dtype=torch.long)),
            sifat=mock_sifat
        )
        
        self.evaluator.muaalem.return_value = [mock_output]
        
        # Run evaluation
        result = self.evaluator.evaluate_recitation("dummy.wav", uthmani_text)
        
        # Verify
        self.assertFalse(result["overall_pass"])
        self.assertLess(result["score"], 100)
        
        # Word 1 ("اللَّهِ") should be flagged as incorrect due to makhraj
        self.assertTrue(result["words"][0]["correct"]) # "بِسْمِ" is correct
        self.assertFalse(result["words"][1]["correct"]) # "اللَّهِ" is incorrect
        self.assertEqual(result["words"][1]["issue"], "makhraj")
        self.assertEqual(result["words"][1]["letter"], "ل")
        self.assertEqual(result["words"][1]["note"], "sound produced doesn't match expected articulation point")

    def test_incorrect_qalqalah_evaluation(self):
        # Surah Al-Alaq: "خَلَقْنَا" expects Qalqalah on ق
        uthmani_text = "خَلَقْنَا"
        ref_qps = quran_phonetizer(uthmani_text, self.evaluator.moshaf)
        
        # Mock model output where Qalqalah is predicted as "not_moqalqal"
        mock_sifat = []
        for s in ref_qps.sifat:
            qalqalah_val = s.qalqla
            if s.phonemes == "قڇ":
                qalqalah_val = "not_moqalqal"
            mock_sifat.append(Sifa(
                phonemes_group=s.phonemes,
                hams_or_jahr=SingleUnit(text=s.hams_or_jahr, prob=0.99, idx=1) if s.hams_or_jahr else None,
                shidda_or_rakhawa=SingleUnit(text=s.shidda_or_rakhawa, prob=0.99, idx=1) if s.shidda_or_rakhawa else None,
                tafkheem_or_taqeeq=SingleUnit(text=s.tafkheem_or_taqeeq, prob=0.99, idx=1) if s.tafkheem_or_taqeeq else None,
                itbaq=SingleUnit(text=s.itbaq, prob=0.99, idx=1) if s.itbaq else None,
                safeer=SingleUnit(text=s.safeer, prob=0.99, idx=1) if s.safeer else None,
                qalqla=SingleUnit(text=qalqalah_val, prob=0.99, idx=1) if s.qalqla else None,
                tikraar=SingleUnit(text=s.tikraar, prob=0.99, idx=1) if s.tikraar else None,
                tafashie=SingleUnit(text=s.tafashie, prob=0.99, idx=1) if s.tafashie else None,
                istitala=SingleUnit(text=s.istitala, prob=0.99, idx=1) if s.istitala else None,
                ghonna=SingleUnit(text=s.ghonna, prob=0.99, idx=1) if s.ghonna else None
            ))
            
        mock_output = MuaalemOutput(
            phonemes=Unit(text=ref_qps.phonemes, probs=torch.ones(len(ref_qps.phonemes)), ids=torch.ones(len(ref_qps.phonemes), dtype=torch.long)),
            sifat=mock_sifat
        )
        
        self.evaluator.muaalem.return_value = [mock_output]
        result = self.evaluator.evaluate_recitation("dummy.wav", uthmani_text)
        
        # Verify
        self.assertFalse(result["overall_pass"])
        self.assertEqual(result["words"][0]["issue"], "qalqalah")
        self.assertEqual(result["words"][0]["note"], "remember to make a bouncing/echo sound here")

if __name__ == '__main__':
    unittest.main()
