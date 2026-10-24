import { pipeline } from '../security';
import { generate, PROVIDERS } from './mockLLM';
import { byId } from './features';
import * as auditLog from '../security/auditLog';

export async function runFeature({ featureId, input, provider = 'mock', userId = 'anonymous' }) {
  const feature = byId(featureId);
  if (!feature) throw new Error(`Unknown feature: ${featureId}`);

  const result = await pipeline.run({
    action: 'ai:run',
    prompt: input,
    provider,
    userId,
    llmCall: async (maskedPrompt) =>
      generate({ feature: feature.handler, input: maskedPrompt, provider }),
    metadata: { featureId, featureName: feature.name, stage: feature.stage },
  });

  return { feature, ...result };
}

export async function runChat({ input, provider = 'mock', userId = 'anonymous' }) {
  const result = await pipeline.run({
    action: 'ai:chat',
    prompt: input,
    provider,
    userId,
    llmCall: async (maskedPrompt) =>
      generate({ feature: 'default', input: maskedPrompt, provider }),
    metadata: { type: 'chat' },
  });

  return result;
}

export function availableProviders() {
  return PROVIDERS;
}