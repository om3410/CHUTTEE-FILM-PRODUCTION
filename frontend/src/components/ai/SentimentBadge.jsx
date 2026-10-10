import { FiSmile, FiMeh, FiFrown, FiZap, FiHeart, FiAlertTriangle } from 'react-icons/fi';

const CONFIG = {
  positive: { icon: FiSmile, color: 'text-emerald-400 bg-emerald-500/15 ring-emerald-500/30' },
  negative: { icon: FiFrown, color: 'text-red-400 bg-red-500/15 ring-red-500/30' },
  neutral: { icon: FiMeh, color: 'text-zinc-400 bg-zinc-800 ring-zinc-700' },
  tense: { icon: FiAlertTriangle, color: 'text-amber-400 bg-amber-500/15 ring-amber-500/30' },
  action: { icon: FiZap, color: 'text-orange-400 bg-orange-500/15 ring-orange-500/30' },
  romantic: { icon: FiHeart, color: 'text-pink-400 bg-pink-500/15 ring-pink-500/30' },
};

export default function SentimentBadge({ sentiment = 'neutral', score, showScore = true }) {
  const config = CONFIG[sentiment] || CONFIG.neutral;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1 ring-inset ${config.color}`}>
      <Icon className="h-3 w-3" />
      <span className="capitalize">{sentiment}</span>
      {showScore && score !== undefined && <span className="opacity-70">· {score}%</span>}
    </span>
  );
}