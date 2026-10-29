import { useState } from 'react';
import { FiLock, FiRefreshCw } from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { mask } from '../../security/privacyMask';

// â¬‡ï¸ REPLACE THESE WITH YOUR REAL INFO IF YOU WANT THE DEMO TO SHOW THEM
const MY_EMAIL = 'omrewaskar4@gmail.com';
const MY_PHONE = '+91 74101 14971';

const SAMPLE = `Contact ${MY_EMAIL} or call ${MY_PHONE}. My card 4111 1111 1111 1111 was declined on 2026-09-20.`;

const EXAMPLES = [
  {
    label: 'My contact info',
    text: `Email: ${MY_EMAIL}\nPhone: ${MY_PHONE}`,
  },
  {
    label: 'Credit card',
    text: 'Card 4111 1111 1111 1111 was declined. Please retry.',
  },
  {
    label: 'Aadhaar + PAN',
    text: 'Aadhaar: 1234 5678 9012 Â· PAN: ABCDE1234F',
  },
  {
    label: 'IP + URL token',
    text: 'Request from 192.168.1.42 using https://api.example.com/data?token=secret123abc',
  },
  {
    label: 'Full mix',
    text: `Contact ${MY_EMAIL} or ${MY_PHONE}. Card 4111 1111 1111 1111. SSN 123-45-6789. IP 10.0.0.1.`,
  },
];

export default function PrivacyMaskDemo() {
  const [input, setInput] = useState(SAMPLE);
  const [result, setResult] = useState(null);

  const test = () => setResult(mask(input));

  const reset = () => {
    setInput(SAMPLE);
    setResult(null);
  };

  return (
    <Card>
      <CardHeader title="PrivacyMask Demo" subtitle="Real PII redaction â€” edit anything below" icon={FiLock} />
      <CardBody className="space-y-4">
        {/* Quick-fill examples */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              onClick={() => {
                setInput(ex.text);
                setResult(null);
              }}
              className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 hover:border-gold-500/50 hover:text-gold-400"
            >
              {ex.label}
            </button>
          ))}
        </div>

        {/* Editable textarea */}
        <textarea
          id="privacy-mask-input"
          name="privacy-mask-input"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResult(null);
          }}
          rows={4}
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 font-mono text-xs text-zinc-100 outline-none focus:border-gold-500"
          aria-label="Text to redact PII from"
          placeholder="Type or paste any text with emails, phones, cards, or other PIIâ€¦"
        />

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={FiLock} onClick={test} disabled={!input.trim()}>
            Redact PII
          </Button>
          <Button variant="outline" icon={FiRefreshCw} onClick={reset}>
            Reset
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            {/* Masked output */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">Masked output</p>
              <pre className="whitespace-pre-wrap text-xs text-zinc-200">{result.text}</pre>
            </div>

            {/* What was redacted */}
            {result.redacted.length > 0 ? (
              <>
                <div>
                  <p className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">
                    {result.redacted.length} item{result.redacted.length !== 1 ? 's' : ''} redacted
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[...new Set(result.redacted.map((r) => r.type))].map((t) => (
                      <Badge key={t} variant="warn">{t}</Badge>
                    ))}
                  </div>
                </div>

                {/* Original values that were caught */}
                <details className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
                  <summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-200">
                    Show detected PII (sensitive)
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs">
                    {result.redacted.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-zinc-300">
                        <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] text-amber-400">
                          {r.type}
                        </span>
                        <span className="break-all font-mono">{r.value}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              </>
            ) : (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-400">
                âœ“ No PII detected in this input
              </p>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}