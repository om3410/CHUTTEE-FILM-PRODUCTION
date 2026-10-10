const POSITIVE = ['love', 'great', 'wonderful', 'hope', 'happy', 'joy', 'smile', 'success', 'win', 'beautiful', 'warm', 'kind', 'together', 'reunion', 'celebrate', 'peace'];
const NEGATIVE = ['hate', 'angry', 'sad', 'cry', 'death', 'lost', 'fear', 'afraid', 'dark', 'alone', 'cold', 'fight', 'kill', 'blood', 'storm', 'broken', 'fail', 'hurt'];
const TENSE = ['wait', 'hide', 'run', 'chase', 'danger', 'risk', 'warn', 'threat', 'suspense', 'secret', 'reveal', 'sudden'];
const ROMANTIC = ['kiss', 'heart', 'touch', 'hold', 'close', 'soft', 'whisper', 'eyes', 'love', 'promise'];
const ACTION = ['run', 'jump', 'chase', 'fight', 'crash', 'drive', 'shoot', 'escape', 'explode'];

const DICT = { positive: POSITIVE, negative: NEGATIVE, tense: TENSE, romantic: ROMANTIC, action: ACTION };

export function analyzeSentiment(text = '') {
  const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
  const scores = { positive: 0, negative: 0, tense: 0, romantic: 0, action: 0 };
  const matched = { positive: [], negative: [], tense: [], romantic: [], action: [] };

  words.forEach((w) => {
    Object.keys(DICT).forEach((cat) => {
      if (DICT[cat].includes(w)) { scores[cat] += 1; matched[cat].push(w); }
    });
  });

  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const percentages = {};
  Object.keys(scores).forEach((k) => { percentages[k] = Math.round((scores[k] / total) * 100); });

  let overall = 'neutral';
  if (scores.positive > scores.negative) overall = 'positive';
  else if (scores.negative > scores.positive) overall = 'negative';
  if (scores.tense > 2) overall = 'tense';
  if (scores.action > 2) overall = 'action';
  if (scores.romantic > 2) overall = 'romantic';

  const dominant = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const confidence = Math.min(95, Math.round((total / Math.max(1, words.length)) * 400) || 0);

  return { overall, dominant, scores, percentages, matched, confidence, wordCount: words.length };
}

export function dominantEmotion(scene) {
  const text = `${scene.title || ''} ${scene.summary || ''} ${(scene.tags || []).join(' ')}`;
  return analyzeSentiment(text);
}