import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const QUIZ_DIR = path.join(__dirname, '..', 'output', 'quizzes');

// Simple in-memory cache for loaded quizzes
const quizCache = new Map();

async function loadQuiz(storyId, lang = 'ur') {
  const cacheKey = `${storyId}_${lang}`;
  if (quizCache.has(cacheKey)) {
    return quizCache.get(cacheKey);
  }

  const fileName = lang === 'en' ? `${storyId}_en.json` : `${storyId}.json`;
  const quizPath = path.join(QUIZ_DIR, fileName);
  if (!await fs.pathExists(quizPath)) {
    return null; // Quiz not generated yet
  }

  const quizData = await fs.readJson(quizPath);
  quizCache.set(cacheKey, quizData);
  return quizData;
}

export const getQuiz = async (req, res) => {
  const { storyId } = req.params;
  const { lang = 'ur' } = req.query;

  try {
    const quizData = await loadQuiz(storyId, lang);

    if (!quizData) {
      return res.status(404).json({ error: "Quiz for this story isn't ready yet." });
    }

    // Shuffle the questions array using Fisher-Yates
    const shuffledQuestions = [...quizData.questions];
    for (let i = shuffledQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQuestions[i], shuffledQuestions[j]] = [shuffledQuestions[j], shuffledQuestions[i]];
    }
    
    // Pick the first 10 questions (or less if the bank has fewer than 10)
    const selectedQuestions = shuffledQuestions.slice(0, 10);

    // Strip out the correct answers and explanations before sending to the client
    const safeQuizData = {
      storyId: quizData.storyId,
      questions: selectedQuestions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options
      }))
    };

    res.json(safeQuizData);
  } catch (error) {
    console.error('Quiz Controller Error (GET):', error);
    res.status(500).json({ error: "Failed to load quiz." });
  }
};

export const submitQuiz = async (req, res) => {
  const { storyId } = req.params;
  const { lang = 'ur' } = req.query;
  const { answers } = req.body; // Array of { questionId, selectedIndex }

  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: "Invalid submission format." });
  }

  try {
    const quizData = await loadQuiz(storyId, lang);

    if (!quizData) {
      return res.status(404).json({ error: "Quiz not found." });
    }

    let correctCount = 0;
    const results = answers.map(answer => {
      const question = quizData.questions.find(q => q.id === answer.questionId);
      if (!question) {
        return { questionId: answer.questionId, correct: false, error: "Question not found" };
      }

      const isCorrect = question.correctIndex === answer.selectedIndex;
      if (isCorrect) correctCount++;

      return {
        questionId: question.id,
        correct: isCorrect,
        correctIndex: question.correctIndex, // Reveal correct answer
        explanation: question.explanation // Reveal explanation
      };
    });

    res.json({
      score: correctCount,
      total: answers.length,
      results
    });

  } catch (error) {
    console.error('Quiz Controller Error (POST):', error);
    res.status(500).json({ error: "Failed to submit quiz." });
  }
};
