import { shield } from './promptShield';
import { mask } from './privacyMask';
import { sanitize } from './renderSafe';
import { check as throttleCheck } from './throttleWall';
import { classifyData, isProviderAllowed } from './providerAllowlist';
import * as auditLog from './auditLog';

/**
 * The unified pipeline for every AI call.
 *
 * Flow:
 *  1. Throttle check
 *  2. Prompt injection shield
 *  3. Data classification
 *  4. Provider allowlist
 *  5. PII masking
 *  6. Call the LLM (passed-in function)
 *  7. Sanitize output
 *  8. Audit log
 */
export async function run({
  action = 'ai:run',
  prompt,
  dataClass,
  provider = 'mock',
  llmCall,            // async (maskedPrompt) => { text, raw }
  userId = 'anonymous',
  metadata = {},
}) {
  const trace = {
    id: crypto.randomUUID?.() || `trace-${Date.now()}`,
    startedAt: Date.now(),
    action,
    steps: [],
  };

  const step = (name, status, detail) => {
    trace.steps.push({ name, status, detail, at: Date.now() });
  };

  // ── 1. THROTTLE ──
  const throttle = throttleCheck(action);
  step('throttle', throttle.allowed ? 'pass' : 'block', throttle);
  if (!throttle.allowed) {
    auditLog.log({
      level: 'warn',
      action: 'pipeline.throttled',
      message: `Rate limit hit for ${action}`,
      meta: { retryAfter: throttle.retryAfter },
    });
    return { ok: false, error: 'rate_limited', retryAfter: throttle.retryAfter, trace };
  }

  // ── 2. PROMPT SHIELD ──
  const shieldResult = shield(prompt);
  step('promptShield', shieldResult.safe ? 'pass' : 'block', {
    riskScore: shieldResult.riskScore,
    matches: shieldResult.matches,
  });
  if (!shieldResult.safe) {
    auditLog.log({
      level: 'error',
      action: 'pipeline.injection_blocked',
      message: 'Prompt injection attempt blocked',
      meta: { matches: shieldResult.matches, userId },
    });
    return {
      ok: false,
      error: 'injection_blocked',
      matches: shieldResult.matches,
      trace,
    };
  }

  // ── 3. DATA CLASSIFICATION ──
  const detectedClass = dataClass || classifyData(prompt);
  step('classify', 'pass', { detectedClass });

  // ── 4. PROVIDER ALLOWLIST ──
  const providerAllowed = isProviderAllowed(detectedClass, provider);
  step('allowlist', providerAllowed ? 'pass' : 'block', { provider, detectedClass });
  if (!providerAllowed) {
    auditLog.log({
      level: 'error',
      action: 'pipeline.provider_blocked',
      message: `Provider ${provider} not allowed for ${detectedClass} data`,
      meta: { userId },
    });
    return { ok: false, error: 'provider_blocked', detectedClass, provider, trace };
  }

  // ── 5. PII MASKING ──
  const masked = mask(prompt);
  step('privacyMask', 'pass', {
    redacted: masked.redacted.length,
    types: [...new Set(masked.redacted.map((r) => r.type))],
  });

  // ── 6. CALL LLM ──
  let raw;
  try {
    raw = await llmCall(masked.text);
    step('llm', 'pass', { provider });
  } catch (err) {
    step('llm', 'error', { message: err.message });
    auditLog.log({
      level: 'error',
      action: 'pipeline.llm_failed',
      message: err.message,
      meta: { userId },
    });
    return { ok: false, error: 'llm_failed', message: err.message, trace };
  }

  // ── 7. RENDER SAFE ──
  const safeOutput = typeof raw === 'string' ? sanitize(raw) : raw;
  step('renderSafe', 'pass', { changed: safeOutput !== raw });

  // ── 8. AUDIT ──
  trace.finishedAt = Date.now();
  trace.durationMs = trace.finishedAt - trace.startedAt;

  auditLog.log({
    level: 'info',
    action: 'pipeline.success',
    message: `${action} completed`,
    meta: {
      userId,
      provider,
      detectedClass,
      redacted: masked.redacted.length,
      durationMs: trace.durationMs,
      ...metadata,
    },
  });

  return {
    ok: true,
    output: safeOutput,
    raw,
    redacted: masked.redacted,
    detectedClass,
    provider,
    trace,
  };
}

export function preview(prompt) {
  // Dry run without calling the LLM
  const shieldResult = shield(prompt);
  const masked = mask(prompt);
  const detectedClass = classifyData(prompt);

  return {
    safe: shieldResult.safe,
    riskScore: shieldResult.riskScore,
    matches: shieldResult.matches,
    maskedText: masked.text,
    redacted: masked.redacted,
    detectedClass,
  };
}