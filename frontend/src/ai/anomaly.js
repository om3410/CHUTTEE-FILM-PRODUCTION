export function detectAnomalies(transactions = []) {
  if (transactions.length < 3) return { anomalies: [], stats: null };

  const amounts = transactions.map((t) => t.amount);
  const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const variance = amounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);

  const anomalies = transactions
    .map((t) => {
      const zScore = stdDev ? (t.amount - mean) / stdDev : 0;
      const severity = Math.abs(zScore) > 2.5 ? 'High' : Math.abs(zScore) > 1.5 ? 'Medium' : 'Low';
      const direction = zScore > 0 ? 'high' : 'low';
      return { ...t, zScore: Number(zScore.toFixed(2)), severity, direction, isAnomaly: Math.abs(zScore) > 1.5 };
    })
    .filter((t) => t.isAnomaly)
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

  return {
    anomalies,
    stats: { mean: Math.round(mean), stdDev: Math.round(stdDev), total: amounts.reduce((a, b) => a + b, 0), count: transactions.length },
  };
}

export function detectCategorySpikes(budgetByDept = []) {
  return budgetByDept
    .map((d) => {
      const variance = ((d.actual - d.budget) / d.budget) * 100;
      return { ...d, variance: Number(variance.toFixed(1)), overBudget: variance > 5 };
    })
    .filter((d) => d.overBudget)
    .sort((a, b) => b.variance - a.variance);
}