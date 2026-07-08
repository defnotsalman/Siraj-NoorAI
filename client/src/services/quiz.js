import axios from 'axios';

const API_URL = 'http://localhost:5000/api/quiz';

/**
 * Fetch the quiz for a specific story
 * @param {string} storyId 
 * @returns {Promise<Object>} The quiz data containing questions and options (without answers)
 */
export const getQuiz = async (storyId) => {
  const response = await axios.get(`${API_URL}/${storyId}`);
  return response.data;
};

/**
 * Submit quiz answers for grading
 * @param {string} storyId 
 * @param {Array<{questionId: string, selectedIndex: number}>} answers 
 * @returns {Promise<Object>} The grading results, including the score and explanations
 */
export const submitQuiz = async (storyId, answers) => {
  const response = await axios.post(`${API_URL}/${storyId}/submit`, { answers });
  return response.data;
};
