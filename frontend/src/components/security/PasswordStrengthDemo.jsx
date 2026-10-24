import { useState } from 'react';
import { FiKey, FiRefreshCw } from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import { strength, generate } from '../../security/passwordForge';

export default function PasswordStrengthDemo() {
  const [password, setPassword] = useState('');
  const result = strength(password);

  const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-400'];

  return (
    <Card>
      <CardHeader title="PasswordForge" subtitle="Real strength meter" icon={FiKey} />
      <CardBody className="space-y-4">
        <div className="flex gap-2">
          <input
            id="password-strength-input"
            name="password-strength-input"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Type a password…"
            className="w-full flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 font-mono text-sm text-zinc-100 outline-none focus:border-brand-500"
            aria-label="Password to test"
          />
          <Button variant="outline" icon={FiRefreshCw} onClick={() => setPassword(generate(16))}>
            Generate
          </Button>
        </div>

        <div>
          <div className="flex justify-between text-xs">
            <span className="text-zinc-500">Strength</span>
            <span className="font-medium">{result.label} ({result.percent}%)</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all ${colors[Math.min(4, Math.floor(result.percent / 25))]}`}
              style={{ width: `${result.percent}%` }}
            />
          </div>
        </div>

        {result.issues.length > 0 && (
          <ul className="space-y-1 text-xs text-amber-400">
            {result.issues.map((issue, i) => <li key={i}>• {issue}</li>)}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}