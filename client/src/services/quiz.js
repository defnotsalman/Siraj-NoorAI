const API_URL = 'http://192.168.1.69:5000/api/quiz';

/**
 * Fetch the quiz for a specific story
 * @param {string} storyId 
 * @returns {Promise<Object>} The quiz data containing questions and options (without answers)
 */
export const getQuiz = async (storyId, lang = 'ur') => {
  const response = await fetch(`${API_URL}/${storyId}?lang=${lang}`);
  if (!response.ok) {
    throw new Error('Failed to fetch quiz');
  }
  return response.json();
};

/**
 * Submit quiz answers for grading
 * @param {string} storyId 
 * @param {Array<{questionId: string, selectedIndex: number}>} answers 
 * @param {string} lang The language of the quiz (ur or en)
 * @returns {Promise<Object>} The grading results, including the score and explanations
 */
export const submitQuiz = async (storyId, answers, lang = 'ur') => {
  const response = await fetch(`${API_URL}/${storyId}/submit?lang=${lang}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ answers }),
  });
  if (!response.ok) {
    throw new Error('Failed to submit quiz');
  }
  return response.json();
};

