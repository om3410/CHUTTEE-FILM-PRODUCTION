export function matchCastToScene(scene, cast = []) {
  const tags = scene.tags || [];
  const timeOfDay = scene.timeOfDay || 'Day';

  return cast
    .map((actor) => {
      let score = 50;
      const reasons = [];

      const actorSkills = actor.skills || [];
      if (tags.includes('action') && actorSkills.some((s) => /action|stunt|fight/i.test(s))) {
        score += 25; reasons.push('Action-trained');
      }
      if (tags.includes('dialogue') && actorSkills.some((s) => /theatre|method|improv/i.test(s))) {
        score += 20; reasons.push('Strong dialogue background');
      }
      if (tags.includes('romantic') && actorSkills.some((s) => /romantic|method|improv/i.test(s))) {
        score += 15; reasons.push('Romantic range');
      }
      if (scene.characterAge && Math.abs(actor.age - scene.characterAge) < 8) {
        score += 15; reasons.push('Age match');
      }
      if (scene.language && actorSkills.some((s) => s.toLowerCase() === scene.language.toLowerCase())) {
        score += 10; reasons.push(`${scene.language} fluent`);
      }

      score += Math.round((Math.random() - 0.5) * 8);

      return { actor, score: Math.min(98, Math.max(20, score)), reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export function recommendCrewRole(scene, crew = []) {
  const needs = [];
  const tags = scene.tags || [];
  if (tags.includes('action')) needs.push('Camera');
  if (tags.includes('dialogue')) needs.push('Sound');
  if (tags.includes('vfx')) needs.push('Post');
  needs.push('Production');

  return crew.filter((c) => needs.includes(c.department)).slice(0, 4);
}