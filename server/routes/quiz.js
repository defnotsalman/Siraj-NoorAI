import express from 'express';
import { getQuiz, submitQuiz } from '../controllers/quizController.js';

const router = express.Router();

router.get('/:storyId', getQuiz);
router.post('/:storyId/submit', submitQuiz);

export default router;
