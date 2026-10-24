import { useState, useEffect } from 'react';
import { FiClock, FiRefreshCw, FiLogOut } from 'react-icons/fi';
import { Card, CardHeader, CardBody } from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { get, clear, rotate, isExpired } from '../../security/sessionGuard';

export default function SessionMonitor() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(get());
    const t = setInterval(() => setSession(get()), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <Card>
      <CardHeader title="SessionGuard" subtitle="Idle timeout · rotation · expiry" icon={FiClock} />
      <CardBody className="space-y-4">
        {!session ? (
          <p className="py-6 text-center text-sm text-zinc-500">No active session</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Session ID" value={session.id?.slice(0, 8)} />
              <Field label="Started" value={new Date(session.startedAt).toLocaleTimeString()} />
              <Field label="Last active" value={new Date(session.lastActiveAt).toLocaleTimeString()} />
              <Field label="Status">
                <Badge variant={isExpired() ? 'danger' : 'success'}>
                  {isExpired() ? 'Expired' : 'Active'}
                </Badge>
              </Field>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" icon={FiRefreshCw} onClick={() => { rotate(); setSession(get()); }}>
                Rotate Session
              </Button>
              <Button variant="destructive" icon={FiLogOut} onClick={() => { clear(); setSession(null); }}>
                Kill Session
              </Button>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function Field({ label, value, children }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">{label}</p>
      <div className="mt-1 text-sm text-zinc-200">{children || value}</div>
    </div>
  );
}