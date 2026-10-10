import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiSend, FiCpu, FiMinimize2, FiMaximize2, FiTrash2, FiCopy, FiThumbsUp, FiThumbsDown, FiZap, FiUser } from 'react-icons/fi';
import { useAIChat } from '../../hooks/useAIChat';
import { SUGGESTED_PROMPTS } from '../../ai/engine';

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState('');
  const { messages, thinking, send, clear } = useAIChat();
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, thinking]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    send(input);
    setInput('');
  };

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition-transform hover:scale-110 active:scale-95"
            title="Open AI assistant"
            aria-label="Open AI assistant"
          >
            <FiCpu className="h-6 w-6" />
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-zinc-950">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className={`fixed z-40 flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl ${
              expanded
                ? 'bottom-6 right-6 top-6 left-6 md:left-auto md:w-[640px]'
                : 'bottom-6 right-6 h-[600px] max-h-[calc(100vh-3rem)] w-[400px] max-w-[calc(100vw-3rem)]'
            }`}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/15">
                  <FiCpu className="h-5 w-5 text-brand-400" />
                  <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                </div>
                <div>
                  <p className="text-sm font-semibold">CHUTTEE AI</p>
                  <p className="text-[10px] text-zinc-500">{thinking ? 'Thinking…' : 'Online · Production copilot'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={clear} className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800" title="Clear chat"><FiTrash2 className="h-4 w-4" /></button>
                <button onClick={() => setExpanded((e) => !e)} className="hidden rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 md:block" title={expanded ? 'Minimize' : 'Maximize'}>
                  {expanded ? <FiMinimize2 className="h-4 w-4" /> : <FiMaximize2 className="h-4 w-4" />}
                </button>
                <button onClick={() => setOpen(false)} title="Close assistant" aria-label="Close assistant" className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800"><FiX className="h-4 w-4" /></button>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
              {messages.map((m) => <MessageBubble key={m.id} message={m} onAction={(a) => send(a)} />)}
              {thinking && (
                <div className="flex items-start gap-3 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/15">
                    <FiCpu className="h-4 w-4 text-brand-400" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-zinc-800 px-4 py-3">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-500" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="border-t border-zinc-800 px-4 py-3">
                <p className="mb-2 flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500"><FiZap className="h-3 w-3" /> Try asking</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button key={p.text} onClick={() => send(p.text)} className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-brand-500/50 hover:text-brand-400">
                      {p.icon} {p.text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="border-t border-zinc-800 bg-zinc-900/95 p-3 backdrop-blur">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
                  rows={1}
                  placeholder="Ask about budget, scenes, cast, risks…"
                  className="max-h-32 flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm outline-none placeholder:text-zinc-600 focus:border-brand-500"
                />
                <button type="submit" title="Send message" aria-label="Send message" disabled={!input.trim() || thinking} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white transition-colors hover:bg-brand-400 disabled:opacity-40">
                  <FiSend className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-zinc-600">Runs entirely in your browser · No data leaves your device</p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ message, onAction }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-start gap-3 py-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isUser ? 'bg-zinc-800' : 'bg-brand-500/15'}`}>
        {isUser ? <FiUser className="h-4 w-4 text-zinc-400" /> : <FiCpu className="h-4 w-4 text-brand-400" />}
      </div>
      <div className={`flex-1 min-w-0 ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block max-w-full rounded-2xl px-4 py-3 text-sm ${isUser ? 'rounded-tr-sm bg-brand-500 text-white' : 'rounded-tl-sm bg-zinc-800 text-zinc-100'}`}>
          <FormattedText text={message.text} />
        </div>
        {message.widgets?.length > 0 && (
          <div className="mt-2 space-y-2">{message.widgets.map((w, i) => <InlineWidget key={i} widget={w} />)}</div>
        )}
        {message.actions?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.actions.map((a) => (
              <button key={a} onClick={() => onAction(a)} className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-[11px] text-zinc-300 transition-colors hover:border-brand-500/50 hover:text-brand-400">
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FormattedText({ text = '' }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className={i > 0 ? 'mt-1.5' : ''}>
          {line.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
            if (part.startsWith('_') && part.endsWith('_')) return <em key={j} className="text-xs opacity-75">{part.slice(1, -1)}</em>;
            return <span key={j}>{part}</span>;
          })}
        </p>
      ))}
    </>
  );
}

function InlineWidget({ widget }) {
  if (widget.type === 'budgetRunway') {
    const { daysLeft, weeksLeft, status } = widget.data;
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Budget runway</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-brand-400">{daysLeft}</span>
          <span className="text-xs text-zinc-400">days ({weeksLeft} weeks)</span>
        </div>
        <div className={`mt-1 text-[10px] ${status === 'critical' ? 'text-red-400' : status === 'warning' ? 'text-amber-400' : 'text-emerald-400'}`}>
          {status === 'critical' ? '⚠️ Critical — under 2 weeks' : status === 'warning' ? '⚠️ Watch closely' : '✓ Healthy'}
        </div>
      </div>
    );
  }
  if (widget.type === 'anomalyList') {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-left">
        <p className="text-[10px] uppercase tracking-wider text-red-400">Anomalies detected</p>
        <ul className="mt-1.5 space-y-1">
          {widget.data.map((a) => (
            <li key={a.id} className="flex items-center justify-between text-xs">
              <span className="truncate text-zinc-300">{a.description}</span>
              <span className="ml-2 shrink-0 font-mono text-red-400">{a.zScore}σ</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (widget.type === 'sentimentList') {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Sentiment by scene</p>
        <div className="mt-1.5 space-y-1">
          {widget.data.map((d) => (
            <div key={d.scene.id} className="flex items-center justify-between text-xs">
              <span className="truncate text-zinc-300">#{d.scene.number} {d.scene.title}</span>
              <span className="ml-2 shrink-0 capitalize text-zinc-400">{d.sentiment.overall}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (widget.type === 'castMatches') {
    return (
      <div className="space-y-1.5">
        {widget.data.slice(0, 3).map((m) => (
          <div key={m.actor.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-left">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-[10px] font-bold text-brand-400">{m.actor.name.charAt(0)}</div>
              <div className="min-w-0">
                <p className="truncate text-xs font-medium">{m.actor.name}</p>
                <p className="truncate text-[10px] text-zinc-500">{m.reasons.slice(0, 2).join(' · ')}</p>
              </div>
            </div>
            <span className="ml-2 shrink-0 text-xs font-semibold text-brand-400">{m.score}%</span>
          </div>
        ))}
      </div>
    );
  }
  if (widget.type === 'riskMatrix') {
    return (
      <div className="space-y-1.5">
        {widget.data.slice(0, 3).map((r) => (
          <div key={r.id} className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-2.5 text-left">
            <div className="flex items-center justify-between">
              <p className="truncate text-xs font-medium">{r.title}</p>
              <span className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] ${r.quadrant === 'Critical' ? 'bg-red-500/20 text-red-400' : r.quadrant === 'Severe' ? 'bg-orange-500/20 text-orange-400' : r.quadrant === 'Likely' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-700 text-zinc-400'}`}>{r.quadrant}</span>
            </div>
            <div className="mt-1 flex gap-3 text-[10px] text-zinc-500">
              <span>P: {r.probability}%</span><span>I: {r.impact}/10</span><span>Score: {r.score}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  if (widget.type === 'festivalPrediction') {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Festival chances</p>
        <div className="mt-1.5 space-y-1.5">
          {widget.data.festivals.map((f) => (
            <div key={f.name} className="flex items-center gap-2">
              <span className="w-20 shrink-0 text-xs text-zinc-300">{f.name}</span>
              <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400" style={{ width: `${f.chance}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-[10px] text-brand-400">{f.chance}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (widget.type === 'scenePredictions') {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Predicted durations</p>
        <ul className="mt-1.5 space-y-1">
          {widget.data.map((p) => (
            <li key={p.scene.id} className="flex items-center justify-between text-xs">
              <span className="truncate text-zinc-300">#{p.scene.number} {p.scene.title}</span>
              <span className="ml-2 shrink-0 font-mono text-brand-400">{p.prediction.minutes}m</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  if (widget.type === 'crewBreakdown') {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-left">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Crew by department</p>
        <ul className="mt-1.5 space-y-1">
          {Object.entries(widget.data).map(([dept, n]) => (
            <li key={dept} className="flex items-center justify-between text-xs">
              <span className="text-zinc-300">{dept}</span>
              <span className="text-brand-400">{n}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return null;
}