import { detectAnomalies, detectCategorySpikes } from './anomaly';
import { predictSceneDuration, predictRisk, predictFestival, predictBudgetRunway } from './predictor';
import { analyzeSentiment } from './sentiment';
import { matchCastToScene } from './matching';

const RESPONSE_DELAY = 600;

export async function generateAIResponse(query, context) {
  await new Promise((r) => setTimeout(r, RESPONSE_DELAY));
  const q = query.toLowerCase();
  const { project, crew, cast, scenes, transactions, budgetByDept, risks, activity } = context;

  if (/(budget|spend|cost|money|expense|burn)/.test(q)) {
    const { anomalies, stats } = detectAnomalies(transactions || []);
    const spikes = detectCategorySpikes(budgetByDept || []);
    const runway = predictBudgetRunway(project?.budgetSpent || 0, project?.budgetTotal || 1, 15000);

    return {
      text: `**Budget analysis for ${project?.title}**\n\n` +
        `• Spent: ₹${((project?.budgetSpent || 0) / 100000).toFixed(1)}L of ₹${((project?.budgetTotal || 0) / 100000).toFixed(1)}L (${Math.round(((project?.budgetSpent || 0) / (project?.budgetTotal || 1)) * 100)}%)\n` +
        `• Average transaction: ₹${stats?.mean?.toLocaleString('en-IN') || 0}\n` +
        `• Runway at current burn: **${runway.daysLeft} days** (${runway.weeksLeft} weeks)\n` +
        (anomalies.length ? `• âš ï¸ ${anomalies.length} unusual transaction${anomalies.length > 1 ? 's' : ''} detected\n` : '• No anomalies detected\n') +
        (spikes.length ? `• 📈 Over-budget: ${spikes.map((s) => `${s.name} (+${s.variance}%)`).join(', ')}` : ''),
      actions: ['Show all expenses', 'Detect anomalies', 'Project runway'],
      widgets: [
        { type: 'budgetRunway', data: runway },
        ...(anomalies.length ? [{ type: 'anomalyList', data: anomalies.slice(0, 3) }] : []),
      ],
    };
  }

  if (/(scene|shoot|shot|duration|timing)/.test(q)) {
    const predictions = (scenes || []).slice(0, 5).map((s) => ({ scene: s, prediction: predictSceneDuration(s) }));
    const totalMin = predictions.reduce((sum, p) => sum + p.prediction.minutes, 0);

    return {
      text: `**Scene analysis**\n\nI analyzed ${scenes?.length || 0} scenes. Predicted total runtime for the first ${predictions.length}: **${totalMin} minutes**.\n\n` +
        predictions.map((p) => `• Scene #${p.scene.number} — ${p.prediction.minutes} min (${p.prediction.confidence}% confidence)`).join('\n'),
      actions: ['Export schedule', 'Optimize for daylight'],
      widgets: [{ type: 'scenePredictions', data: predictions }],
    };
  }

  if (/(cast|actor|recommend|matching|who should|suggest)/.test(q)) {
    const scene = scenes?.[0];
    const matches = scene ? matchCastToScene(scene, cast || []) : [];
    return {
      text: `**Cast recommendations for Scene #${scene?.number || 1}**\n\n` +
        matches.map((m, i) => `${i + 1}. **${m.actor.name}** — ${m.score}% match\n   ${m.reasons.join(' · ')}`).join('\n\n'),
      actions: ['Invite to audition', 'See full roster'],
      widgets: [{ type: 'castMatches', data: matches }],
    };
  }

  if (/(sentiment|emotion|mood|feel|tone)/.test(q)) {
    const analyzed = (scenes || []).slice(0, 5).map((s) => ({ scene: s, sentiment: analyzeSentiment(`${s.title} ${(s.tags || []).join(' ')}`) }));
    return {
      text: `**Sentiment analysis**\n\nScript tone across the first ${analyzed.length} scenes:\n\n` +
        analyzed.map((a) => `• #${a.scene.number}: **${a.sentiment.overall}** (dominant: ${a.sentiment.dominant}, ${a.sentiment.confidence}% confidence)`).join('\n'),
      actions: ['Export analysis', 'Compare with previous draft'],
      widgets: [{ type: 'sentimentList', data: analyzed }],
    };
  }

  if (/(risk|danger|threat|issue|problem)/.test(q)) {
    const analyzed = predictRisk(risks || []);
    const critical = analyzed.filter((r) => r.quadrant === 'Critical').length;
    return {
      text: `**Risk forecast**\n\n${analyzed.length} risks analyzed. **${critical} critical** issue${critical !== 1 ? 's' : ''} require immediate attention.\n\n` +
        analyzed.map((r) => `• **${r.title}**\n   Probability: ${r.probability}% · Impact: ${r.impact}/10 · Score: ${r.score} (${r.quadrant})`).join('\n\n'),
      actions: ['Create mitigation plan', 'Assign owner'],
      widgets: [{ type: 'riskMatrix', data: analyzed }],
    };
  }

  if (/(festival|award|win|cannes|sundance|iffi)/.test(q)) {
    const prediction = predictFestival(project || { completion: 60, budgetSpent: 2000000, budgetTotal: 4000000 });
    return {
      text: `**Festival win prediction for ${project?.title}**\n\nOverall win probability: **${prediction.winProbability}%**\n\n` +
        prediction.festivals.map((f) => `• ${f.name}: ${f.chance}%`).join('\n'),
      actions: ['Track submissions', 'See past winners'],
      widgets: [{ type: 'festivalPrediction', data: prediction }],
    };
  }

  if (/(crew|team|staff|department)/.test(q)) {
    const byDept = (crew || []).reduce((acc, c) => { acc[c.department] = (acc[c.department] || 0) + 1; return acc; }, {});
    const available = (crew || []).filter((c) => c.available).length;
    return {
      text: `**Crew overview**\n\n• Total: **${crew?.length || 0} members**\n• Available now: **${available}**\n\nBy department:\n` +
        Object.entries(byDept).map(([dept, n]) => `• ${dept}: ${n}`).join('\n'),
      actions: ['View all crew', 'Find available'],
      widgets: [{ type: 'crewBreakdown', data: byDept }],
    };
  }

  if (/(activity|recent|latest|update|what.*happening)/.test(q)) {
    return {
      text: `**Latest activity**\n\n` + (activity || []).slice(0, 5).map((a) => `• ${a.message} _(${a.timestamp})_`).join('\n'),
      actions: ['View all activity'],
      widgets: [],
    };
  }

  return {
    text: `I can help with production intelligence across:\n\n` +
      `💰 **Budget** — "How is my budget tracking?"\n` +
      `**Scenes** — "Predict duration for scene 3"\n` +
      `**Cast** — "Recommend cast for scene 4"\n` +
      `😊 **Sentiment** — "Analyze script tone"\n` +
      `âš ï¸ **Risks** — "What are my top risks?"\n` +
      `🏆 **Festival** — "Festival win chances?"\n` +
      `**Crew** — "Show crew availability"`,
    actions: ['Show me a demo', 'What can you do?'],
    widgets: [],
  };
}

export const SUGGESTED_PROMPTS = [
  { icon: '💰', text: 'How is my budget tracking?' },
  { icon: '', text: 'Predict duration for all scenes' },
  { icon: 'âš ï¸', text: 'What are my top risks?' },
  { icon: '', text: 'Recommend cast for scene 4' },
  { icon: '😊', text: 'Analyze script sentiment' },
  { icon: '🏆', text: 'What are my festival chances?' },
];