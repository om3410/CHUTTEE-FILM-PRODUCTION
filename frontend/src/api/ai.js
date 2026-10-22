import api from './client';

/* ─── 1. Script Structure Analysis (multipart upload) ─── */
export const analyzeScript = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/ml/script/analyze/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};

/* ─── 2. Screenplay Summarization ─── */
export const summarizeScript = (text, style = 'short') =>
  api.post('/ml/script/summarize/', { text, style }).then((r) => r.data);

/* ─── 3. Mood & Genre Classification ─── */
export const classifyMood = (text) =>
  api.post('/ml/script/mood/', { text }).then((r) => r.data);

/* ─── 4. Natural Language to SQL ─── */
export const askDatabase = (question) =>
  api.post('/ml/query/sql/', { question }).then((r) => r.data);

/* ─── 5. Image Generation (for Film Assets) ─── */
export const generateImage = (prompt, width = 1024, height = 768) =>
  api.post('/ml/media/generate-image/', { prompt, width, height }).then((r) => r.data);