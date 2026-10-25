import api from './client';

/* â”€â”€â”€ 1. Script Structure Analysis (multipart upload) â”€â”€â”€ */
export const analyzeScript = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/ml/script/analyze/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

/* â”€â”€â”€ 2. Screenplay Summarization â”€â”€â”€ */
export const summarizeScript = (text, style = 'short') =>
  api.post('/api/ml/script/summarize/', { text, style }).then((r) => r.data);

/* â”€â”€â”€ 3. Mood & Genre Classification â”€â”€â”€ */
export const classifyMood = (text) =>
  api.post('/api/ml/script/mood/', { text }).then((r) => r.data);

/* â”€â”€â”€ 4. Natural Language to SQL â”€â”€â”€ */
export const askDatabase = (question) =>
  api.post('/api/ml/query/sql/', { question }).then((r) => r.data);

/* â”€â”€â”€ 5. Image Generation (for Film Assets) â”€â”€â”€ */
export const generateImage = (prompt, width = 1024, height = 768) =>
  api.post('/api/ml/media/generate-image/', { prompt, width, height }).then((r) => r.data);