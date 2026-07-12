import axios from 'axios';

const API_URL = 'http://localhost:5000/api/quiz';

/**
 * Fetch the quiz for a specific story
 * @param {string} storyId 
 * @returns {Promise<Object>} The quiz data containing questions and options (without answers)
 */
export const getQuiz = async (storyId, lang = 'ur') => {
  const response = await axios.get(`${API_URL}/${storyId}?lang=${lang}`);
  return response.data;
};

/**
 * Submit quiz answers for grading
 * @param {string} storyId 
 * @param {Array<{questionId: string, selectedIndex: number}>} answers 
 * @param {string} lang The language of the quiz (ur or en)
 * @returns {Promise<Object>} The grading results, including the score and explanations
 */
export const submitQuiz = async (storyId, answers, lang = 'ur') => {
  const response = await axios.post(`${API_URL}/${storyId}/submit?lang=${lang}`, { answers });
  return response.data;
};
