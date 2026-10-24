// Mock LLM for frontend-only mode
// Swap this out for a real backend call when ready

const RESPONSES = {
  script: (input) => `**Script Analysis**\n\nYour input contains ${input.split(/\s+/).length} words.\n\n` +
    `• **Tone:** contemplative, character-driven\n` +
    `• **Pacing:** moderate, with strong dialogue beats\n` +
    `• **Structure:** three-act with clear turning points\n\n` +
    `_Suggestion:_ Strengthen the midpoint with a revelation that raises the stakes.`,

  character: (name = 'Character') => `**${name}**\n\n` +
    `**Archetype:** The Reluctant Hero\n` +
    `**Wound:** Betrayed by a mentor figure\n` +
    `**Want:** To restore family honour\n` +
    `**Need:** To forgive themselves\n` +
    `**Arc:** From isolation → reluctant alliance → sacrifice → redemption\n\n` +
    `**Voice:** Terse, observant, defensive humour.`,

  logline: (input) => {
    const topic = input.slice(0, 80);
    return `**Logline**\n\n_When a ${topic.replace(/\.$/, '')}, a reluctant hero must confront their past before it destroys everything they love._\n\n**Alternate:** A single decision unravels a carefully constructed life, forcing a reckoning no one saw coming.`;
  },

  budget: () => `**Budget Estimate**\n\n` +
    `• **Above the line:** ₹85L (director, producer, cast)\n` +
    `• **Below the line:** ₹1.2Cr (crew, equipment, locations)\n` +
    `• **Post:** ₹45L\n` +
    `• **Contingency (10%):** ₹25L\n\n` +
    `**Total:** ~₹2.75Cr\n\n` +
    `_Assumption: 25 shoot days, 2 locations, 1 VFX-heavy sequence._`,

  schedule: () => `**Optimised Shooting Schedule**\n\n` +
    `• **Day 1–5:** Fort Kochi (exteriors, golden hour)\n` +
    `• **Day 6–12:** Marine Drive (dock scenes, night shoots)\n` +
    `• **Day 13–18:** Studio A (interiors)\n` +
    `• **Day 19–22:** Thrissur (temple, sunrise)\n` +
    `• **Day 23–25:** Pickups + reshoots\n\n` +
    `_Weather buffer built into Day 11 and Day 20._`,

  tagline: () => `**Tagline Options**\n\n` +
    `1. _Every secret has a season._\n` +
    `2. _Some storms are made of memories._\n` +
    `3. _The past doesn't knock. It floods._\n` +
    `4. _Where the rain remembers._`,

  default: (input) => `I've received your request: "${input.slice(0, 100)}…"\n\n` +
    `Here's a general analysis:\n\n` +
    `• **Structure:** Well-formed input with clear intent.\n` +
    `• **Suggestions:** Consider narrowing the scope for sharper results.\n` +
    `• **Next step:** Try a more specific prompt or choose a feature from the catalogue.`,
};

export async function generate({ feature = 'default', input = '', provider = 'mock' }) {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));

  const handler = RESPONSES[feature] || RESPONSES.default;
  const text = handler(input);

  return {
    text,
    raw: text,
    provider,
    tokensIn: input.split(/\s+/).length,
    tokensOut: text.split(/\s+/).length,
    model: `mock-${feature}-v1`,
  };
}

export const PROVIDERS = [
  { id: 'gemini', label: 'Gemini', free: true, status: 'ready' },
  { id: 'groq', label: 'Groq', free: true, status: 'ready' },
  { id: 'cerebras', label: 'Cerebras', free: true, status: 'ready' },
  { id: 'openrouter', label: 'OpenRouter', free: true, status: 'ready' },
  { id: 'mistral', label: 'Mistral', free: true, status: 'ready' },
  { id: 'deepseek', label: 'DeepSeek', free: true, status: 'ready' },
  { id: 'cohere', label: 'Cohere', free: true, status: 'ready' },
  { id: 'huggingface', label: 'HuggingFace', free: true, status: 'ready' },
];