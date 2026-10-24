// All 40+ GenAI features from the catalog, organised by production stage

export const FEATURES = [
  // ── Script & Story ──
  { id: 'scene-weaver', name: 'SceneWeaver', stage: 'Script', priority: 'P0',
    description: 'Scene-by-scene outlines from a premise', icon: '🎬', handler: 'script' },
  { id: 'character-forge', name: 'CharacterForge', stage: 'Script', priority: 'P0',
    description: 'Bios, arcs, relationship maps', icon: '👤', handler: 'character' },
  { id: 'script-coverage', name: 'ScriptCoverage', stage: 'Script', priority: 'P0',
    description: "Auto reader's report + marketability score", icon: '📋', handler: 'script' },
  { id: 'logline-lab', name: 'LoglineLab', stage: 'Script', priority: 'P0',
    description: 'Loglines, synopses, one-pagers', icon: '💡', handler: 'logline' },
  { id: 'script-qa', name: 'ScriptQ&A', stage: 'Script', priority: 'P0',
    description: 'NL questions about your script (RAG)', icon: '❓', handler: 'script' },
  { id: 'dialogue-doctor', name: 'DialogueDoctor', stage: 'Script', priority: 'P1',
    description: 'Rewrite dialogue in target voice', icon: '💬', handler: 'script' },
  { id: 'beat-sheet', name: 'BeatSheetAI', stage: 'Script', priority: 'P1',
    description: "Save-the-Cat / Hero's Journey beats", icon: '🥁', handler: 'script' },

  // ── Pre-Visualisation ──
  { id: 'storyboard', name: 'StoryBoardAI', stage: 'Pre-Viz', priority: 'P1',
    description: 'Text→storyboard frames', icon: '🎨', handler: 'default' },
  { id: 'shotlist', name: 'ShotListGenie', stage: 'Pre-Viz', priority: 'P0',
    description: 'Auto shot list from scene', icon: '📸', handler: 'default' },
  { id: 'moodboard', name: 'MoodBoardGen', stage: 'Pre-Viz', priority: 'P2',
    description: 'Visual reference sheets per scene', icon: '🖼️', handler: 'default' },

  // ── Casting ──
  { id: 'cast-match', name: 'CastMatch', stage: 'Casting', priority: 'P1',
    description: 'Actor archetype suggestions', icon: '🎭', handler: 'character' },
  { id: 'audition', name: 'AuditionAnalyzer', stage: 'Casting', priority: 'P2',
    description: 'Score self-tapes', icon: '🎥', handler: 'default' },

  // ── Production Planning ──
  { id: 'budget-bot', name: 'BudgetBot', stage: 'Planning', priority: 'P0',
    description: 'Budget line items from script', icon: '💰', handler: 'budget' },
  { id: 'schedule-sensei', name: 'ScheduleSensei', stage: 'Planning', priority: 'P1',
    description: 'Optimised shooting schedule', icon: '📅', handler: 'schedule' },
  { id: 'call-sheet', name: 'CallSheetCopilot', stage: 'Planning', priority: 'P1',
    description: 'Auto call sheets', icon: '📞', handler: 'default' },
  { id: 'continuity', name: 'ContinuityGuard', stage: 'Planning', priority: 'P2',
    description: 'Flag continuity errors', icon: '🔍', handler: 'script' },
  { id: 'risk-radar', name: 'RiskRadar', stage: 'Planning', priority: 'P2',
    description: 'Production risk register', icon: '⚠️', handler: 'default' },

  // ── Post-Production ──
  { id: 'edit-advisor', name: 'EditAdvisor', stage: 'Post', priority: 'P2',
    description: 'Rough-cut pacing notes', icon: '✂️', handler: 'script' },
  { id: 'subtitle-studio', name: 'SubtitleStudio', stage: 'Post', priority: 'P1',
    description: 'Auto subtitles + translation', icon: '📝', handler: 'default' },
  { id: 'dub-master', name: 'DubMaster', stage: 'Post', priority: 'P2',
    description: 'Dubbing script + lip-sync guidance', icon: '🎙️', handler: 'default' },
  { id: 'trailer-craft', name: 'TrailerCraft', stage: 'Post', priority: 'P2',
    description: 'Trailer script/beats', icon: '🎞️', handler: 'script' },

  // ── Marketing ──
  { id: 'poster-forge', name: 'PosterForge', stage: 'Marketing', priority: 'P1',
    description: 'Poster concepts', icon: '🖼️', handler: 'default' },
  { id: 'tagline-titan', name: 'TaglineTitan', stage: 'Marketing', priority: 'P0',
    description: 'Taglines + marketing copy', icon: '✨', handler: 'tagline' },
  { id: 'press-kit', name: 'PressKitPro', stage: 'Marketing', priority: 'P1',
    description: 'EPK / press kit generator', icon: '📰', handler: 'default' },
  { id: 'pitch-deck', name: 'PitchDeckAI', stage: 'Marketing', priority: 'P1',
    description: 'Investor deck outline + copy', icon: '📊', handler: 'default' },

  // ── Analytics ──
  { id: 'box-office', name: 'BoxOfficeOracle', stage: 'Analytics', priority: 'P2',
    description: 'Performance prediction from comps', icon: '📈', handler: 'default' },
  { id: 'audience-atlas', name: 'AudienceAtlas', stage: 'Analytics', priority: 'P1',
    description: 'Audience personas/segments', icon: '🧠', handler: 'default' },

  // ── Knowledge ──
  { id: 'production-wiki', name: 'ProductionWiki', stage: 'Knowledge', priority: 'P0',
    description: 'RAG Q&A over scripts/schedules/contracts', icon: '📚', handler: 'script' },
];

export const STAGES = ['All', 'Script', 'Pre-Viz', 'Casting', 'Planning', 'Post', 'Marketing', 'Analytics', 'Knowledge'];

export function byStage(stage) {
  return stage === 'All' ? FEATURES : FEATURES.filter((f) => f.stage === stage);
}

export function byId(id) {
  return FEATURES.find((f) => f.id === id);
}