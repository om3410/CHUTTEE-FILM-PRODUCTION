export function predictSceneDuration(scene) {
  const wordCount = (scene.summary?.split(/\s+/).length || 0) + (scene.title?.split(/\s+/).length || 0);
  let minutes = Math.max(1, Math.round(wordCount / 250) * 1.5);

  if (scene.timeOfDay === 'Golden') minutes += 3;
  if (scene.timeOfDay === 'Dawn' || scene.timeOfDay === 'Sunset') minutes += 4;
  if (scene.timeOfDay === 'Night') minutes += 2;

  const tags = scene.tags || [];
  if (tags.includes('vfx')) minutes += 8;
  if (tags.includes('action')) minutes += 5;
  if (tags.includes('closeup')) minutes += 1;
  if (tags.includes('montage')) minutes += 6;
  if (tags.includes('dialogue')) minutes += 2;

  const jitter = Math.round((Math.random() - 0.5) * 4);
  minutes = Math.max(2, minutes + jitter);

  return {
    minutes,
    confidence: Math.round(70 + Math.random() * 25),
    drivers: [
      tags.includes('vfx') && 'VFX work',
      tags.includes('action') && 'Action sequence',
      ['Golden', 'Dawn', 'Sunset'].includes(scene.timeOfDay) && 'Natural light timing',
      wordCount > 300 && 'Long script page',
    ].filter(Boolean),
  };
}

export function predictRisk(risks = []) {
  const IMPACT = { High: 9, Medium: 5, Low: 2 };
  return risks.map((r) => {
    const probability = 30 + Math.round(Math.random() * 60);
    const impact = IMPACT[r.severity] || 3;
    const score = (probability * impact) / 100;
    return {
      ...r,
      probability,
      impact,
      score: Number(score.toFixed(1)),
      quadrant: probability > 60 && impact > 6 ? 'Critical' : probability > 60 ? 'Likely' : impact > 6 ? 'Severe' : 'Watch',
    };
  }).sort((a, b) => b.score - a.score);
}

export function predictFestival(project) {
  const completionScore = project.completion * 0.4;
  const budgetRatio = project.budgetSpent / project.budgetTotal;
  const budgetScore = (1 - Math.abs(0.6 - budgetRatio)) * 30;
  const timelineScore = 20 + Math.random() * 10;
  const total = Math.min(98, Math.round(completionScore + budgetScore + timelineScore));

  return {
    winProbability: total,
    festivals: [
      { name: 'Sundance', chance: Math.max(5, total - 30) },
      { name: 'IFFI Goa', chance: Math.max(10, total - 15) },
      { name: 'Cannes', chance: Math.max(2, total - 45) },
      { name: 'Locarno', chance: Math.max(5, total - 35) },
    ],
  };
}

export function predictBudgetRunway(spent, total, dailyBurn) {
  const remaining = total - spent;
  const daysLeft = dailyBurn > 0 ? Math.floor(remaining / dailyBurn) : 999;
  return {
    remaining,
    dailyBurn,
    daysLeft,
    weeksLeft: Math.round(daysLeft / 7),
    status: daysLeft < 14 ? 'critical' : daysLeft < 30 ? 'warning' : 'healthy',
  };
}