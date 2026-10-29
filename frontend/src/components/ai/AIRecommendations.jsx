import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiZap, FiArrowRight, FiRefreshCw, FiCpu, FiAlertTriangle, FiTrendingUp, FiUser, FiDollarSign } from 'react-icons/fi';
import { MOCK } from '../../utils/constants';
import { Card, CardHeader, CardBody } from '../ui/Card';
import Badge from '../ui/Badge';
import { detectAnomalies } from '../../ai/anomaly';
import { predictRisk } from '../../ai/predictor';
import { analyzeSentiment } from '../../ai/sentiment';
import { matchCastToScene } from '../../ai/matching';
import { useToast } from '../../context/ToastContext';

export default function AIRecommendations() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const recs = [];

      const { anomalies } = detectAnomalies(MOCK.transactions);
      if (anomalies.length > 0) {
        recs.push({
          id: 'budget-anomaly',
          icon: FiDollarSign,
          color: 'text-red-400 bg-red-500/15',
          priority: 'High',
          title: `${anomalies.length} unusual transaction${anomalies.length > 1 ? 's' : ''} detected`,
          detail: `"${anomalies[0].description}" deviates by ${anomalies[0].zScore}Ïƒ from the mean.`,
          action: 'Review expenses',
        });
      }

      const risks = predictRisk(MOCK.ai.filter((a) => a.kind === 'risk'));
      const critical = risks.filter((r) => r.quadrant === 'Critical' || r.quadrant === 'Severe');
      if (critical.length > 0) {
        recs.push({
          id: 'risk',
          icon: FiAlertTriangle,
          color: 'text-orange-400 bg-orange-500/15',
          priority: 'High',
          title: `${critical.length} high-impact risk${critical.length > 1 ? 's' : ''} identified`,
          detail: `"${critical[0].title}" â€” ${critical[0].probability}% probability, impact ${critical[0].impact}/10.`,
          action: 'Create mitigation plan',
        });
      }

      const scene = MOCK.scenes.find((s) => s.status === 'Not Started') || MOCK.scenes[0];
      const matches = matchCastToScene(scene, MOCK.cast);
      if (matches.length > 0) {
        recs.push({
          id: 'cast',
          icon: FiUser,
          color: 'text-blue-400 bg-blue-500/15',
          priority: 'Medium',
          title: `Best cast for Scene #${scene.number}`,
          detail: `${matches[0].actor.name} scores ${matches[0].score}% match â€” ${matches[0].reasons[0] || 'available'}.`,
          action: 'View cast',
        });
      }

      const analyzed = MOCK.scenes.slice(0, 3).map((s) => ({ scene: s, sentiment: analyzeSentiment(`${s.title} ${(s.tags || []).join(' ')}`) }));
      recs.push({
        id: 'sentiment',
        icon: FiTrendingUp,
        color: 'text-purple-400 bg-purple-500/15',
        priority: 'Low',
        title: `Script tone is trending ${analyzed[0].sentiment.overall}`,
        detail: `Dominant emotion: ${analyzed[0].sentiment.dominant}. Confidence: ${analyzed[0].sentiment.confidence}%.`,
        action: 'See analysis',
      });

      setRecommendations(recs);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [refreshKey]);

  const priorityVariant = { High: 'danger', Medium: 'warn', Low: 'info' };
  const openRecommendation = (id) => {
    if (id === 'budget-anomaly') navigate('/budget');
    else if (id === 'cast') navigate('/cast');
    else if (id === 'sentiment') navigate('/scenes');
    else toast('Risk mitigation planning is not available yet', 'info');
  };

  return (
    <Card>
      <CardHeader
        title="AI Recommendations"
        subtitle="Proactive signals from your production"
        icon={FiCpu}
        action={
          <button onClick={() => setRefreshKey((k) => k + 1)} className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800" title="Refresh">
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />
      <CardBody className="space-y-2.5">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="animate-pulse rounded-lg bg-zinc-800/70 h-16" />)
        ) : (
          recommendations.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="group flex items-start gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 transition-colors hover:border-gold-500/40"
              >
                <div className={`rounded-lg p-2 ${r.color}`}><Icon className="h-4 w-4" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-zinc-200">{r.title}</p>
                    <Badge variant={priorityVariant[r.priority]}>{r.priority}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">{r.detail}</p>
                  <button onClick={() => openRecommendation(r.id)} className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-gold-400 opacity-0 transition-opacity group-hover:opacity-100">
                    {r.action} <FiArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
        <div className="flex items-center gap-2 rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-2.5 text-[10px] text-zinc-500">
          <FiZap className="h-3 w-3 text-gold-400" />
          <span>Suggestions refresh automatically Â· Ask CHUTTEE AI for deeper analysis</span>
        </div>
      </CardBody>
    </Card>
  );
}