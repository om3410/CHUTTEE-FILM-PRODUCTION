import { useEffect, useState } from 'react';
import { FiSearch, FiStar, FiArchive, FiInbox } from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import EmptyState from '../components/feedback/EmptyState';
import { useToast } from '../context/ToastContext';

export default function Inbox() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const inbox = MOCK.inbox || [];
      setMessages(inbox);
      setActive(inbox[0] ?? null);
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  const filtered = messages.filter((m) => !search || m.subject.toLowerCase().includes(search.toLowerCase()) || m.from.toLowerCase().includes(search.toLowerCase()));
  const toggleStar = () => {
    const updated = { ...active, starred: !active.starred };
    setActive(updated);
    setMessages((list) => list.map((message) => message.id === active.id ? updated : message));
  };
  const archiveActive = () => {
    const remaining = messages.filter((message) => message.id !== active.id);
    setMessages(remaining);
    setActive(remaining[0] || null);
    toast('Message archived', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-brand-500/15 p-3"><FiInbox className="h-6 w-6 text-brand-400" /></div>
        <div>
          <h1 className="text-2xl font-bold">Inbox</h1>
          <p className="text-sm text-zinc-400">{messages.filter((m) => m.unread).length} unread</p>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader variant="card" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={FiInbox} title="Inbox is empty" description="You're all caught up." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-zinc-800 p-3">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search inbox…" className="input pl-10" />
              </div>
            </div>
            <ul className="divide-y divide-zinc-800/60">
              {filtered.map((m) => (
                <li key={m.id}>
                  <button onClick={() => setActive(m)} className={`w-full px-4 py-3 text-left transition-colors ${active?.id === m.id ? 'bg-brand-500/5' : 'hover:bg-zinc-800/40'}`}>
                    <div className="flex items-start gap-3">
                      <Avatar name={m.from} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate text-sm ${m.unread ? 'font-semibold text-zinc-100' : 'text-zinc-300'}`}>{m.from}</p>
                          <span className="shrink-0 text-[10px] text-zinc-500">{m.time}</span>
                        </div>
                        <p className="truncate text-xs text-zinc-400">{m.subject}</p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500">{m.preview}</p>
                      </div>
                      {m.unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="hidden lg:block">
            {active ? (
              <div className="p-6">
                <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={active.from} />
                    <div>
                      <p className="font-semibold">{active.from}</p>
                      <p className="text-xs text-zinc-500">to me · {active.time} ago</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={toggleStar} title={active.starred ? 'Remove star' : 'Star message'} aria-label={active.starred ? 'Remove star' : 'Star message'} className={`rounded-lg p-2 hover:bg-zinc-800 ${active.starred ? 'text-amber-400' : 'text-zinc-500'}`}><FiStar className="h-4 w-4" /></button>
                    <button onClick={archiveActive} title="Archive message" aria-label="Archive message" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800"><FiArchive className="h-4 w-4" /></button>
                  </div>
                </div>
                <h2 className="mt-4 text-lg font-bold">{active.subject}</h2>
                <p className="mt-4 text-sm leading-relaxed text-zinc-400">{active.preview}</p>
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-zinc-500">Select a message</div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}