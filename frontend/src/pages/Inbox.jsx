import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiStar, FiArchive, FiInbox, FiPlus, FiSend,
  FiX, FiArrowRight, FiMail, FiMessageSquare, FiCheckCircle,
  FiUsers, FiAtSign, FiHelpCircle, FiDownload, FiTrash2,
  FiCornerUpLeft, FiCornerUpRight, FiBookmark,
} from 'react-icons/fi';
import { MOCK } from '../utils/constants';
import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import EmptyState from '../components/feedback/EmptyState';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import PageHero from '../components/ui/PageHero';
import { useToast } from '../context/ToastContext';

/* ─────────── Message categories ─────────── */
const MESSAGE_ROUTES = [
  { number: '01', icon: FiMail,          eyebrow: 'Direct',     title: 'Direct Messages',    description: 'One-to-one messages from crew, cast and collaborators.',         types: ['direct'] },
  { number: '02', icon: FiMessageSquare, eyebrow: 'Notes',      title: 'Production Notes',   description: 'Scene notes, script feedback and continuity discussions.',       types: ['note'] },
  { number: '03', icon: FiCheckCircle,   eyebrow: 'Approvals',  title: 'Reviews & Sign-offs', description: 'Budget approvals, scene confirmations and workflow decisions.', types: ['approval'] },
  { number: '04', icon: FiAtSign,        eyebrow: 'Mentions',   title: 'Mentions & Tags',    description: 'Every @mention across scenes, budgets and crew records.',        types: ['mention'] },
];

const POPULAR_FILTERS = [
  { key: 'direct',   label: 'Direct' },
  { key: 'note',     label: 'Notes' },
  { key: 'approval', label: 'Approvals' },
  { key: 'mention',  label: 'Mentions' },
];

const classifyMessage = (m) => {
  const s = String(m.subject ?? '').toLowerCase();
  if (s.includes('approv') || s.includes('sign')) return 'approval';
  if (s.includes('note') || s.includes('scene')) return 'note';
  if (String(m.preview ?? '').includes('@')) return 'mention';
  return 'direct';
};

const relativeTime = (time) => {
  if (!time) return '—';
  const t = String(time).trim();
  if (/ago|now|yesterday|today/i.test(t)) return t;
  return `${t} ago`;
};

export default function Inbox() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [active, setActive] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [view, setView] = useState('inbox');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [mobileDetail, setMobileDetail] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [composeOpen, setComposeOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState({ to: '', subject: '', body: '' });

  useEffect(() => {
    const timer = setTimeout(() => {
      const inbox = (MOCK.inbox || []).map((m) => ({
        ...m,
        type: classifyMessage(m),
        archived: false,
        pinned: false,
      }));
      setMessages(inbox);
      setActive(inbox[0] ?? null);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, []);

  /* ─────────── Derived lists ─────────── */
  const inboxMessages = useMemo(() => messages.filter((m) => !m.archived), [messages]);
  const archivedMessages = useMemo(() => messages.filter((m) => m.archived), [messages]);
  const baseList = view === 'archived' ? archivedMessages : inboxMessages;

  const counts = useMemo(() => {
    const c = { all: inboxMessages.length, unread: 0, starred: 0, archived: archivedMessages.length };
    ['direct', 'note', 'approval', 'mention'].forEach((k) => { c[k] = 0; });
    inboxMessages.forEach((m) => {
      if (m.unread) c.unread += 1;
      if (m.starred) c.starred += 1;
      const t = m.type || 'direct';
      c[t] = (c[t] || 0) + 1;
    });
    return c;
  }, [inboxMessages, archivedMessages]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseList.filter((m) => {
      const matchesSearch = !q || [m.subject, m.from, m.preview].some((v) => String(v ?? '').toLowerCase().includes(q));
      const matchesType = !typeFilter || (m.type || 'direct') === typeFilter;
      const matchesUnread = !onlyUnread || m.unread;
      const matchesStarred = !onlyStarred || m.starred;
      return matchesSearch && matchesType && matchesUnread && matchesStarred;
    });
  }, [baseList, search, typeFilter, onlyUnread, onlyStarred]);

  /* Keep `active` valid whenever the filtered list or view changes */
  useEffect(() => {
    if (loading) return;
    if (!active) {
      if (filtered.length > 0) setActive(filtered[0]);
      return;
    }
    const stillVisible = filtered.some((m) => m.id === active.id);
    if (!stillVisible) {
      setActive(filtered[0] ?? null);
      setMobileDetail(false);
    }
  }, [filtered, active, loading]);

  const hasActiveFilters = Boolean(search || typeFilter || onlyUnread || onlyStarred);
  const clearFilters = () => { setSearch(''); setTypeFilter(''); setOnlyUnread(false); setOnlyStarred(false); };

  const countByTypes = (types) => inboxMessages.filter((m) => types.includes(m.type)).length;

  /* ─────────── Actions ─────────── */
  const openMessage = (m) => {
    const updated = m.unread ? { ...m, unread: false } : m;
    setActive(updated);
    setMobileDetail(true);
    if (m.unread) {
      setMessages((list) => list.map((msg) => (msg.id === m.id ? updated : msg)));
    }
  };

  const toggleStar = (message = active) => {
    if (!message) return;
    const updated = { ...message, starred: !message.starred };
    setActive((prev) => (prev && prev.id === message.id ? updated : prev));
    setMessages((list) => list.map((msg) => (msg.id === message.id ? updated : msg)));
  };

  const togglePin = (message = active) => {
    if (!message) return;
    const updated = { ...message, pinned: !message.pinned };
    setActive((prev) => (prev && prev.id === message.id ? updated : prev));
    setMessages((list) => list.map((msg) => (msg.id === message.id ? updated : msg)));
    toast(updated.pinned ? 'Message pinned' : 'Message unpinned', 'success');
  };

  const toggleRead = (message = active) => {
    if (!message) return;
    const updated = { ...message, unread: !message.unread };
    setActive((prev) => (prev && prev.id === message.id ? updated : prev));
    setMessages((list) => list.map((msg) => (msg.id === message.id ? updated : msg)));
    toast(updated.unread ? 'Marked as unread' : 'Marked as read', 'success');
  };

  const archiveActive = () => {
    if (!active) return;
    const id = active.id;
    setMessages((list) => list.map((msg) => (msg.id === id ? { ...msg, archived: true } : msg)));
    toast('Message archived', 'success');
    const remaining = inboxMessages.filter((m) => m.id !== id);
    setActive(remaining[0] ?? null);
    setMobileDetail(false);
  };

  const unarchiveActive = () => {
    if (!active) return;
    const id = active.id;
    setMessages((list) => list.map((msg) => (msg.id === id ? { ...msg, archived: false } : msg)));
    toast('Message restored to inbox', 'success');
    setActive(null);
    setMobileDetail(false);
  };

  const deleteActive = () => {
    if (!active) return;
    const id = active.id;
    setMessages((list) => list.filter((msg) => msg.id !== id));
    toast('Message deleted', 'success');
    setActive(null);
    setMobileDetail(false);
  };

  const markAllRead = () => {
    setMessages((list) => list.map((m) => (m.archived ? m : { ...m, unread: false })));
    setActive((prev) => (prev ? { ...prev, unread: false } : prev));
    toast('All messages marked as read', 'success');
  };

  const replyTo = (message = active) => {
    if (!message) return;
    setDraft({
      to: message.from,
      subject: message.subject.toLowerCase().startsWith('re:') ? message.subject : `Re: ${message.subject}`,
      body: `\n\n---\nOn ${relativeTime(message.time)}, ${message.from} wrote:\n${message.body || message.preview}`,
    });
    setComposeOpen(true);
  };

  const forwardMessage = (message = active) => {
    if (!message) return;
    setDraft({
      to: '',
      subject: message.subject.toLowerCase().startsWith('fwd:') ? message.subject : `Fwd: ${message.subject}`,
      body: `\n\n--- Forwarded message ---\nFrom: ${message.from}\nSubject: ${message.subject}\n\n${message.body || message.preview}`,
    });
    setComposeOpen(true);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const clearSelection = () => setSelectedIds([]);

  const bulkArchive = () => {
    const ids = new Set(selectedIds);
    setMessages((list) => list.map((m) => (ids.has(m.id) ? { ...m, archived: true } : m)));
    setActive((prev) => (prev && ids.has(prev.id) ? null : prev));
    setMobileDetail(false);
    toast(`${selectedIds.length} messages archived`, 'success');
    clearSelection();
  };
  const bulkDelete = () => {
    const ids = new Set(selectedIds);
    setMessages((list) => list.filter((m) => !ids.has(m.id)));
    setActive((prev) => (prev && ids.has(prev.id) ? null : prev));
    setMobileDetail(false);
    toast(`${selectedIds.length} messages deleted`, 'success');
    clearSelection();
  };
  const bulkMarkRead = () => {
    const ids = new Set(selectedIds);
    setMessages((list) => list.map((m) => (ids.has(m.id) ? { ...m, unread: false } : m)));
    setActive((prev) => (prev && ids.has(prev.id) ? { ...prev, unread: false } : prev));
    toast(`${selectedIds.length} messages marked read`, 'success');
    clearSelection();
  };

  const exportInbox = () => {
    const rows = filtered.length ? filtered : messages;
    if (!rows.length) { toast('No messages to export.', 'error'); return; }
    try {
      const header = ['Type', 'From', 'Subject', 'Preview', 'Time', 'Unread', 'Starred', 'Archived'];
      const body = rows.map((m) => [
        m.type || 'direct', m.from, m.subject, m.preview, m.time,
        m.unread ? 'yes' : 'no', m.starred ? 'yes' : 'no', m.archived ? 'yes' : 'no',
      ]);
      const csv = [header, ...body]
        .map((r) => r.map((v) => `"${String(v ?? '').replaceAll('"', '""')}"`).join(','))
        .join('\r\n');
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `chuttee-inbox-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast('Inbox exported to CSV', 'success');
    } catch {
      toast('Could not export inbox.', 'error');
    }
  };

  const openCompose = () => {
    setDraft({ to: '', subject: '', body: '' });
    setComposeOpen(true);
  };

  const closeCompose = () => {
    setComposeOpen(false);
    setDraft({ to: '', subject: '', body: '' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!draft.to.trim() || !draft.subject.trim() || !draft.body.trim()) {
      toast('Please fill in recipient, subject and message.', 'error');
      return;
    }
    setSending(true);
    try {
      const message = {
        id: `m${Date.now()}`,
        from: 'me',
        to: draft.to,
        subject: draft.subject,
        preview: draft.body.slice(0, 120),
        body: draft.body,
        time: 'just now',
        unread: false,
        starred: false,
        archived: false,
        pinned: false,
        type: 'direct',
      };
      setMessages((list) => [message, ...list]);
      setActive(message);
      setView('inbox');
      setComposeOpen(false);
      setDraft({ to: '', subject: '', body: '' });
      toast('Message sent', 'success');
    } catch {
      toast('Could not send message', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-16 animate-fade-in">

      {/* 1. HERO */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="Every Voice, One Stage"
        title="Every Message, in One Place."
        subtitle="Every Conversation, Yours to Keep."
        lead="Receive notes from crew, cast and collaborators. Stay on top of approvals and comments. Reply, tag and resolve in context. Keep every conversation attached to its project — from casting notes to budget sign-offs."
        slogan="Every message has a purpose. The right reply, the right moment, the right clarity can turn a production team into a production family."
      />

      {/* 2. QUICK SEARCH STRIP */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Find the Message</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Conversation You Need.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Search by sender, subject or preview. Filter by message type. Find the exact thread.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 rounded-premium border border-zinc-800 bg-zinc-900/40 p-1 w-fit">
          <button
            onClick={() => { setView('inbox'); clearSelection(); }}
            className={`rounded-[10px] px-4 py-1.5 text-xs font-medium transition-all ${
              view === 'inbox' ? 'bg-gold-500/15 text-gold-400' : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            Inbox · {counts.all}
          </button>
          <button
            onClick={() => { setView('archived'); clearSelection(); }}
            className={`rounded-[10px] px-4 py-1.5 text-xs font-medium transition-all ${
              view === 'archived' ? 'bg-gold-500/15 text-gold-400' : 'text-zinc-500 hover:text-zinc-200'
            }`}
          >
            Archived · {counts.archived}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Search</span>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sender, subject, preview…" className="input pl-10" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Type</span>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="input">
              <option value="">All types</option>
              <option value="direct">Direct</option>
              <option value="note">Notes</option>
              <option value="approval">Approvals</option>
              <option value="mention">Mentions</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" icon={FiPlus} onClick={openCompose}>Compose</Button>
          <Button variant="outline" size="sm" icon={FiCheckCircle} onClick={markAllRead} disabled={counts.unread === 0}>Mark all read</Button>
          <Button variant="outline" size="sm" icon={FiDownload} onClick={exportInbox} disabled={messages.length === 0}>Export</Button>
          {hasActiveFilters && (
            <>
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-premium border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-gold-500/40 hover:text-gold-400">
                <FiX className="h-3 w-3" /> Clear filters
              </button>
              <span className="text-xs text-zinc-500">Showing {filtered.length} of {baseList.length}</span>
            </>
          )}
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          value={counts.all}
          label="Total messages"
          note="Across all conversations"
          isActive={!onlyUnread && !onlyStarred && !typeFilter}
          onClick={() => { clearFilters(); setView('inbox'); }}
        />
        <StatCard
          value={counts.unread}
          label="Unread"
          note="Waiting for your attention"
          isActive={onlyUnread}
          onClick={() => { setOnlyUnread((v) => !v); setOnlyStarred(false); }}
        />
        <StatCard
          value={counts.starred}
          label="Starred"
          note="Marked as important"
          isActive={onlyStarred}
          onClick={() => { setOnlyStarred((v) => !v); setOnlyUnread(false); }}
        />
        <StatCard
          value={counts.approval}
          label="Approvals"
          note="Require sign-off"
          isActive={typeFilter === 'approval'}
          onClick={() => setTypeFilter((prev) => (prev === 'approval' ? '' : 'approval'))}
        />
      </section>

      <Quote>
        "An inbox is not a queue. It is the rhythm of a production — the conversations that keep the story moving forward."
      </Quote>

      {/* 5. FOUR MESSAGE ROUTES */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Where CHUTTEE Can Help You</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">What Kind of Message?</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every message belongs to a category. Choose the one you need and CHUTTEE surfaces the conversation.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MESSAGE_ROUTES.map((route) => {
            const isActive = route.types.includes(typeFilter);
            return (
              <RouteCard
                key={route.number}
                number={route.number}
                icon={route.icon}
                eyebrow={route.eyebrow}
                title={route.title}
                description={route.description}
                count={countByTypes(route.types)}
                isActive={isActive}
                action={isActive ? 'Clear filter' : 'View messages →'}
                onAction={() => {
                  if (isActive) setTypeFilter('');
                  else setTypeFilter(route.types[0]);
                }}
              />
            );
          })}
        </div>
      </section>

      <Quote>
        "The best productions are not built on one big conversation. They are built on a hundred small ones, each answered clearly."
      </Quote>

      {/* 7. FILTER CHIPS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Explore by Type</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Search the Way Producers Actually Think.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            One click shows every message in that category.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {POPULAR_FILTERS.map((f) => (
            <CategoryChip
              key={f.key}
              label={f.label}
              count={counts[f.key] ?? 0}
              isActive={typeFilter === f.key}
              onClick={() => setTypeFilter((prev) => (prev === f.key ? '' : f.key))}
            />
          ))}
        </div>
      </section>

      {/* 9. SPLIT JOURNEYS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Built for Both Sides of the Conversation</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            A Producer Wants Context. A Crew Wants Clarity.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE supports both journeys — one for the person receiving updates, one for the person sending them.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="For Producers & Showrunners"
            steps={['Read', 'Reply', 'Forward', 'Approve', 'Archive']}
            description="Read incoming messages. Reply with notes. Forward to the right person. Approve or reject. Archive when resolved."
            onStepClick={(step) => {
              if (step === 'Read') clearFilters();
              if (step === 'Reply') replyTo();
              if (step === 'Forward') forwardMessage();
              if (step === 'Approve') setTypeFilter('approval');
              if (step === 'Archive') archiveActive();
            }}
          />
          <JourneyCard
            title="For Crew & Cast"
            steps={['Receive', 'Clarify', 'Confirm', 'Update', 'Submit']}
            description="Receive notes and call sheets. Ask clarifying questions. Confirm availability. Update progress. Submit final deliverables."
            onStepClick={(step) => {
              if (step === 'Receive') clearFilters();
              if (step === 'Clarify' || step === 'Confirm') openCompose();
              if (step === 'Update') setTypeFilter('note');
              if (step === 'Submit') setTypeFilter('approval');
            }}
          />
        </div>
      </section>

      <Quote>
        "Every reply is a choice. Every approval is a promise. Every archive is a story completed."
      </Quote>

      {/* 11. MAIN INBOX + DETAIL */}
      <section className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">The Inbox</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            {view === 'archived' ? 'Archived Conversations.' : 'Every Conversation, in Order.'}
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            {filtered.length} of {baseList.length} messages shown
            {typeFilter && ` — ${POPULAR_FILTERS.find((f) => f.key === typeFilter)?.label ?? typeFilter}`}
            {onlyUnread && ' · unread only'}
            {onlyStarred && ' · starred only'}.
          </p>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
              <SkeletonLoader variant="card" />
              <div className="hidden lg:block"><SkeletonLoader variant="card" /></div>
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={view === 'archived' ? FiArchive : FiInbox}
              title={view === 'archived' ? 'No archived messages' : 'No messages'}
              description={hasActiveFilters ? 'Try clearing the filters.' : view === 'archived' ? 'Archived conversations will appear here.' : "You're all caught up."}
            />
          ) : (
            <>
              <div className="hidden lg:grid gap-4 lg:grid-cols-[380px_1fr]">
                <MessageList
                  messages={filtered}
                  activeId={active?.id}
                  selectedIds={selectedIds}
                  onSelect={openMessage}
                  onToggleSelect={toggleSelect}
                />
                <MessageDetail
                  active={active}
                  view={view}
                  onStar={() => toggleStar()}
                  onPin={() => togglePin()}
                  onToggleRead={() => toggleRead()}
                  onReply={() => replyTo()}
                  onForward={() => forwardMessage()}
                  onArchive={view === 'archived' ? unarchiveActive : archiveActive}
                  onDelete={deleteActive}
                />
              </div>

              <div className="lg:hidden">
                <MessageList
                  messages={filtered}
                  activeId={active?.id}
                  selectedIds={selectedIds}
                  onSelect={openMessage}
                  onToggleSelect={toggleSelect}
                />
                {mobileDetail && active && (
                  <div className="fixed inset-0 z-50 bg-zinc-950 overflow-y-auto">
                    <div className="sticky top-0 z-10 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur p-4 flex items-center justify-between">
                      <button
                        onClick={() => setMobileDetail(false)}
                        className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-gold-400"
                      >
                        ← Back to inbox
                      </button>
                    </div>
                    <div className="p-4">
                      <MessageDetail
                        active={active}
                        view={view}
                        onStar={() => toggleStar()}
                        onPin={() => togglePin()}
                        onToggleRead={() => toggleRead()}
                        onReply={() => { replyTo(); setMobileDetail(false); }}
                        onForward={() => { forwardMessage(); setMobileDetail(false); }}
                        onArchive={() => {
                          if (view === 'archived') unarchiveActive();
                          else archiveActive();
                          setMobileDetail(false);
                        }}
                        onDelete={() => { deleteActive(); setMobileDetail(false); }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* 12. BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 lg:bottom-6">
          <div className="flex items-center gap-2 rounded-premium border border-gold-500/40 bg-zinc-900/95 px-4 py-2 shadow-gold backdrop-blur">
            <span className="text-sm text-zinc-200">
              {selectedIds.length} selected
            </span>
            <span className="h-4 w-px bg-zinc-700" />
            <button onClick={bulkMarkRead} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-gold-400" title="Mark read">
              <FiMail className="h-4 w-4" />
            </button>
            <button onClick={bulkArchive} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-gold-400" title="Archive">
              <FiArchive className="h-4 w-4" />
            </button>
            <button onClick={bulkDelete} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10" title="Delete">
              <FiTrash2 className="h-4 w-4" />
            </button>
            <button onClick={clearSelection} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800" title="Clear selection">
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Quote>
        "The films that endure are the ones where every conversation was answered — not just received."
      </Quote>

      {/* 14. QUICK ACTIONS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ready to Reply?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Start with the Action You Need Most.</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction icon={FiPlus} title="Compose Message" description="Send a new note to any crew member or client." onAction={openCompose} />
          <QuickAction icon={FiCheckCircle} title="Mark All Read" description="Clear your unread count in one click." onAction={markAllRead} />
          <QuickAction icon={FiArchive} title={view === 'archived' ? 'Back to Inbox' : 'View Archived'} description={view === 'archived' ? 'Return to your active messages.' : 'Open the archived conversations folder.'} onAction={() => setView(view === 'archived' ? 'inbox' : 'archived')} />
        </div>
      </section>

      {/* 15. CONTACT STRIP */}
      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Contact CHUTTEE</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">Need a Direct Line? Tell Us What You Need.</h3>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href="mailto:inbox@chuttee.in" className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">inbox@chuttee.in</a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href="tel:+919876543210" className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">+91 98765 43210</a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Need help?</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Reach out to our production desk for urgent messages and escalations.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiHelpCircle} onClick={() => navigate('/help')}>Talk to us</Button>
              <Button variant="outline" size="sm" icon={FiUsers} onClick={() => navigate('/crew')}>View Crew</Button>
            </div>
          </div>
        </div>
      </section>

      {/* COMPOSE MODAL */}
      <Modal open={composeOpen} onClose={closeCompose} title="New Message" icon={FiSend} size="sm">
        <form onSubmit={sendMessage} className="space-y-4">
          <Input label="To" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} placeholder="recipient@example.com" required />
          <Input label="Subject" value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} required />
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Message</label>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={8}
              className="input w-full resize-none font-mono text-xs"
              placeholder="Write your message…"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={closeCompose}>Cancel</Button>
            <Button type="submit" variant="primary" icon={FiSend} disabled={sending}>
              {sending ? 'Sending…' : 'Send'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   SHARED COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function MessageList({ messages, activeId, selectedIds, onSelect, onToggleSelect }) {
  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-zinc-800/60 max-h-[70vh] overflow-y-auto">
        {messages.map((m) => {
          const isSelected = selectedIds.includes(m.id);
          return (
            <li key={m.id} className={isSelected ? 'bg-gold-500/5' : ''}>
              <div className="flex items-start">
                <label className="pl-3 pt-4 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(m.id)}
                    className="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-gold-500 focus:ring-gold-500"
                  />
                </label>
                <button
                  onClick={() => onSelect(m)}
                  className={`flex-1 px-3 py-3 text-left transition-colors ${
                    activeId === m.id ? 'bg-gold-500/5 border-l-2 border-gold-400' : 'hover:bg-zinc-800/40 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <Avatar name={m.from} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`truncate text-sm ${m.unread ? 'font-semibold text-zinc-100' : 'text-zinc-300'}`}>
                          {m.from}
                        </p>
                        <span className="shrink-0 text-[10px] text-zinc-500">{relativeTime(m.time)}</span>
                      </div>
                      <p className="truncate text-xs text-zinc-400">{m.subject}</p>
                      <p className="mt-0.5 truncate text-xs text-zinc-500">{m.preview}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {m.unread && <span className="h-2 w-2 rounded-full bg-gold-500" />}
                      {m.starred && <FiStar className="h-3 w-3 text-gold-400" />}
                      {m.pinned && <FiBookmark className="h-3 w-3 text-amber-400" />}
                    </div>
                  </div>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function MessageDetail({ active, view, onStar, onPin, onToggleRead, onReply, onForward, onArchive, onDelete }) {
  if (!active) {
    return (
      <Card>
        <div className="flex h-full items-center justify-center p-12 text-sm text-zinc-500">
          Select a message to view details
        </div>
      </Card>
    );
  }
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <Avatar name={active.from} />
            <div>
              <p className="font-serif text-base font-semibold text-zinc-100">{active.from}</p>
              <p className="text-xs text-zinc-500">to me · {relativeTime(active.time)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <IconBtn onClick={onStar} title={active.starred ? 'Remove star' : 'Star message'} active={active.starred}>
              <FiStar className="h-4 w-4" />
            </IconBtn>
            <IconBtn onClick={onPin} title={active.pinned ? 'Unpin' : 'Pin message'} active={active.pinned}>
              <FiBookmark className="h-4 w-4" />
            </IconBtn>
            <IconBtn onClick={onToggleRead} title={active.unread ? 'Mark as read' : 'Mark as unread'}>
              <FiMail className="h-4 w-4" />
            </IconBtn>
            <IconBtn onClick={onArchive} title={view === 'archived' ? 'Restore to inbox' : 'Archive'}>
              <FiArchive className="h-4 w-4" />
            </IconBtn>
            <IconBtn onClick={onDelete} title="Delete" danger>
              <FiTrash2 className="h-4 w-4" />
            </IconBtn>
          </div>
        </div>

        <h2 className="mt-4 font-serif text-xl font-bold text-zinc-100">{active.subject}</h2>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
          {active.body || active.preview}
        </p>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-zinc-800 pt-4">
          <Button variant="outline" size="sm" icon={FiCornerUpLeft} onClick={onReply}>
            Reply
          </Button>
          <Button variant="outline" size="sm" icon={FiCornerUpRight} onClick={onForward}>
            Forward
          </Button>
        </div>
      </div>
    </Card>
  );
}

function IconBtn({ children, onClick, title, active, danger }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`rounded-lg p-2 transition-colors ${
        danger
          ? 'text-zinc-500 hover:bg-red-500/10 hover:text-red-400'
          : active
            ? 'text-gold-400 hover:bg-zinc-800'
            : 'text-zinc-500 hover:bg-zinc-800 hover:text-gold-400'
      }`}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════════════════════ */

function StatCard({ value, label, note, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`premium-card p-6 text-left transition-all ${
        isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'
      }`}
    >
      <p className="font-serif text-4xl font-bold text-gold-gradient">{value}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">{note}</p>
      {isActive && <p className="mt-2 text-[10px] uppercase tracking-wider text-gold-400">Active filter</p>}
    </button>
  );
}

function Quote({ children }) {
  return (
    <section className="premium-card relative overflow-hidden p-8 sm:p-12">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
      <p className="relative max-w-4xl font-serif italic text-lg sm:text-xl leading-relaxed text-gold-300">{children}</p>
      <div className="relative mt-6 h-[2px] w-20 bg-gradient-to-r from-gold-400 to-transparent" />
    </section>
  );
}

function RouteCard({ number, icon: Icon, eyebrow, title, description, action, onAction, count, isActive }) {
  return (
    <div className={`premium-card group flex flex-col p-6 transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">{number} · {eyebrow}</p>
        </div>
        {typeof count === 'number' && (
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">{count}</span>
        )}
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
      <button type="button" onClick={onAction} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        {action}
      </button>
    </div>
  );
}

function CategoryChip({ label, count, isActive, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`premium-card group flex items-center justify-between gap-3 p-4 text-left transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
          <FiInbox className="h-4 w-4" />
        </span>
        <p className="truncate font-serif text-base font-semibold text-zinc-100">{label}</p>
      </div>
      <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400">{count}</span>
    </button>
  );
}

function JourneyCard({ title, steps, description, onStepClick }) {
  return (
    <div className="premium-card p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">Journey</p>
      <h3 className="mt-3 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <button type="button" onClick={() => onStepClick?.(step)}
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-all hover:border-gold-500/40 hover:text-gold-400">
              {step}
            </button>
            {i < steps.length - 1 && <FiArrowRight className="h-3 w-3 text-gold-400/60" />}
          </span>
        ))}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, onAction }) {
  return (
    <button type="button" onClick={onAction}
      className="group flex flex-col items-start gap-3 rounded-premium border border-zinc-800 bg-zinc-900/40 p-5 text-left transition-all hover:border-gold-500/40 hover:bg-zinc-900/60">
      <span className="grid h-11 w-11 place-items-center rounded-premium bg-gold-500/10 text-gold-400 transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-serif text-lg font-semibold text-zinc-100">{title}</span>
      <span className="text-sm text-zinc-500">{description}</span>
      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        Continue <FiArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}