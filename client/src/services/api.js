/**
 * Central API base URL — reads from VITE_API_URL env variable.
 * Falls back to localhost:5000 for safety.
 * Change IP only in client/.env, never in source files.
 */
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default API_BASE;
