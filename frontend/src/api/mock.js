export const MOCK = {
  projects: [
    { id: 'p1', title: 'Monsoon Letters', status: 'Filming', completion: 62,
      budgetTotal: 4500000, budgetSpent: 2780000, crewCount: 24, castCount: 12,
      startDate: '2026-01-15', wrapDate: '2026-06-20' },
    { id: 'p2', title: 'The Last Rehearsal', status: 'Pre-Production', completion: 18,
      budgetTotal: 1800000, budgetSpent: 240000, crewCount: 11, castCount: 6,
      startDate: '2026-05-01', wrapDate: '2026-08-10' },
    { id: 'p3', title: 'Kaapi and Karma', status: 'Post', completion: 88,
      budgetTotal: 900000, budgetSpent: 845000, crewCount: 8, castCount: 4,
      startDate: '2025-10-10', wrapDate: '2026-02-28' },
  ],
  crew: [
    { id: 'c1', name: 'Ananya Iyer', role: 'Director of Photography', department: 'Camera', dailyRate: 12000, available: true, skills: ['RED Komodo', 'Gimbal', 'Low-light'] },
    { id: 'c2', name: 'Rohit Menon', role: 'Sound Recordist', department: 'Sound', dailyRate: 8000, available: false, skills: ['Location sound', 'Boom op'] },
    { id: 'c3', name: 'Priya Nair', role: 'Art Director', department: 'Art', dailyRate: 9500, available: true, skills: ['Set design', 'Props'] },
    { id: 'c4', name: 'Karthik Rao', role: '1st AC', department: 'Camera', dailyRate: 5500, available: true, skills: ['Focus pull', 'ARRI'] },
    { id: 'c5', name: 'Meera Joseph', role: 'Costume Designer', department: 'Wardrobe', dailyRate: 7000, available: true, skills: ['Period', 'Contemporary'] },
    { id: 'c6', name: 'Sandeep Pillai', role: 'Line Producer', department: 'Production', dailyRate: 14000, available: false, skills: ['Scheduling', 'Budgets'] },
  ],
  cast: [
    { id: 'a1', name: 'Vikram Shah', character: 'Advait', age: 34, skills: ['Method', 'Malayalam', 'Tamil'] },
    { id: 'a2', name: 'Divya Krishna', character: 'Meera', age: 28, skills: ['Improvisation', 'Hindi', 'English'] },
    { id: 'a3', name: 'Arjun Das', character: 'Uncle Ravi', age: 56, skills: ['Theatre', 'Malayalam'] },
  ],
  scenes: [
    { id: 's1', number: 1, title: 'INT. COFFEE HOUSE - DAY', status: 'Shot', location: 'Fort Kochi', timeOfDay: 'Day', tags: ['dialogue'] },
    { id: 's2', number: 2, title: 'EXT. FISHING DOCK - GOLDEN HOUR', status: 'Shot', location: 'Marine Drive', timeOfDay: 'Golden', tags: ['vfx'] },
    { id: 's3', number: 3, title: 'INT. APARTMENT - NIGHT', status: 'In Progress', location: 'Studio A', timeOfDay: 'Night', tags: ['dialogue', 'closeup'] },
    { id: 's4', number: 4, title: 'EXT. BUS STOP - RAIN', status: 'Not Started', location: 'MG Road', timeOfDay: 'Day', tags: ['action'] },
    { id: 's5', number: 5, title: 'INT. HOSPITAL CORRIDOR - DAY', status: 'Not Started', location: 'Studio B', timeOfDay: 'Day', tags: ['dialogue'] },
    { id: 's6', number: 6, title: 'EXT. TEMPLE STEPS - SUNRISE', status: 'Cut', location: 'Thrissur', timeOfDay: 'Dawn', tags: ['montage'] },
  ],
  shootDays: [
    { id: 'd1', date: '2026-09-28', callTime: '05:30', location: 'Fort Kochi', scenes: ['s4'], weather: 'Rain likely - 27C' },
    { id: 'd2', date: '2026-09-29', callTime: '06:00', location: 'Marine Drive', scenes: ['s5'], weather: 'Cloudy - 29C' },
    { id: 'd3', date: '2026-10-02', callTime: '04:45', location: 'Thrissur', scenes: [], weather: 'Clear - 26C' },
  ],
  transactions: [
    { id: 't1', date: '2026-09-20', description: 'Camera rental - RED Komodo', category: 'Equipment', amount: 48000 },
    { id: 't2', date: '2026-09-21', description: 'Location permit - Marine Drive', category: 'Locations', amount: 15000 },
    { id: 't3', date: '2026-09-22', description: 'Crew lunch x24', category: 'Catering', amount: 9600 },
    { id: 't4', date: '2026-09-23', description: 'Costume fabric - Meera', category: 'Wardrobe', amount: 22000 },
    { id: 't5', date: '2026-09-24', description: 'Generator diesel', category: 'Equipment', amount: 3400 },
    { id: 't6', date: '2026-09-25', description: 'Sound gear rental', category: 'Equipment', amount: 18500 },
  ],
  budgetByDept: [
    { name: 'Camera', budget: 900000, actual: 720000 },
    { name: 'Sound', budget: 300000, actual: 210000 },
    { name: 'Art', budget: 600000, actual: 480000 },
    { name: 'Wardrobe', budget: 350000, actual: 240000 },
    { name: 'Location', budget: 500000, actual: 380000 },
    { name: 'Cast', budget: 900000, actual: 780000 },
  ],
  equipment: [
    { id: 'e1', name: 'RED Komodo 6K', category: 'Camera', status: 'In Use', serial: 'RK-4421' },
    { id: 'e2', name: 'ARRI SkyPanel S60', category: 'Lighting', status: 'Available', serial: 'AS-0987' },
    { id: 'e3', name: 'Sennheiser MKH 416', category: 'Sound', status: 'Available', serial: 'SM-2210' },
    { id: 'e4', name: 'DJI Ronin 4D', category: 'Gimbal', status: 'In Use', serial: 'DR-1145' },
  ],
  filmAssets: [],
  activity: [
    { id: 1, type: 'scene_shot', message: 'Scene 2 marked as Shot by Ananya', timestamp: '12m ago' },
    { id: 2, type: 'expense_added', message: 'Rs 48000 logged - Camera rental', timestamp: '1h ago' },
    { id: 3, type: 'crew_added', message: 'Meera Joseph added to Wardrobe', timestamp: '3h ago' },
    { id: 4, type: 'comment', message: 'Rohit commented on Scene 4', timestamp: '5h ago' },
    { id: 5, type: 'scene_shot', message: 'Scene 6 marked as Cut by Vikram', timestamp: '1d ago' },
  ],
  risks: [
    { id: 1, title: 'Weather risk - 3 scenes scheduled outdoors', severity: 'High' },
    { id: 2, title: 'Budget variance on camera rental +12%', severity: 'Medium' },
    { id: 3, title: 'Actor availability for Scene 7 unconfirmed', severity: 'Medium' },
  ],
  analytics: {
    scenesPerDay: [
      { day: 'Mon', scenes: 4 }, { day: 'Tue', scenes: 6 },
      { day: 'Wed', scenes: 3 }, { day: 'Thu', scenes: 7 },
      { day: 'Fri', scenes: 5 }, { day: 'Sat', scenes: 8 },
      { day: 'Sun', scenes: 2 },
    ],
    burnDown: [
      { week: 'W1', planned: 400000, actual: 380000 },
      { week: 'W2', planned: 800000, actual: 850000 },
      { week: 'W3', planned: 1200000, actual: 1180000 },
      { week: 'W4', planned: 1600000, actual: 1720000 },
      { week: 'W5', planned: 2000000, actual: 2050000 },
      { week: 'W6', planned: 2400000, actual: 2480000 },
    ],
  },
};

const delay = (ms = 200) => new Promise((r) => setTimeout(r, ms));

export const mockApi = {
  async get(path) {
    await delay();
    const productionResource = path.match(/^\/production\/(projects|crew|cast|scenes|budget|equipment|film-assets|shoot-days)\/(?:([^/?]+)\/?)?/);
    if (productionResource) {
      const [, resource, id] = productionResource;
      const key = getMockCollectionKey(resource);
      const collection = readMockCollection(key);
      const found = id ? collection.find((item) => String(item.id) === id) : null;
      return { data: found || { results: collection, count: collection.length } };
    }
    if (path.startsWith('/dashboard/summary/')) {
      return { data: { projects: MOCK.projects.length, crew: MOCK.crew.length, cast: MOCK.cast.length, risks: MOCK.risks.length } };
    }
    if (path.startsWith('/projects/')) {
      const id = path.split('/')[2];
      if (id) {
        const p = MOCK.projects.find((x) => x.id === id);
        if (p) return { data: p };
      }
      return { data: { results: MOCK.projects, count: MOCK.projects.length } };
    }
    if (path.startsWith('/api/production/crew/') || path.startsWith('/crew/')) {
      const id = path.startsWith('/api/production/crew/') ? path.split('/')[3] : path.split('/')[2];
      if (id) {
        const c = MOCK.crew.find((x) => x.id === id);
        if (c) return { data: c };
      }
      return { data: { results: MOCK.crew, count: MOCK.crew.length } };
    }
    if (path.startsWith('/cast/')) return { data: { results: MOCK.cast } };
    if (path.startsWith('/scenes/')) return { data: { results: MOCK.scenes } };
    if (path.startsWith('/schedule/')) return { data: { results: readMockCollection('shootDays') } };
    if (path.startsWith('/budget/transactions/')) return { data: MOCK.transactions };
    if (path.startsWith('/budget/by-category/')) return { data: MOCK.budgetByDept };
    if (path.startsWith('/equipment/')) return { data: { results: MOCK.equipment } };
    if (path.startsWith('/activity/')) return { data: { items: MOCK.activity, nextOffset: null } };
    return { data: {} };
  },
  async post(path, payload) {
    await delay();
    const productionResource = path.match(/^\/production\/(crew|cast|scenes|budget|equipment|film-assets|shoot-days)\/?/);
    if (productionResource) {
      const resource = productionResource[1];
      const key = getMockCollectionKey(resource);
      const collection = readMockCollection(key);
      const item = { id: `mock-${Date.now()}`, ...payload };
      saveMockCollection(key, [...collection, item]);
      return { data: item };
    }
    if (path.startsWith('/api/production/crew/')) {
      const member = {
        id: `c-${Date.now()}`,
        name: payload.full_name,
        role: payload.role,
        department: payload.department,
        dailyRate: payload.daily_rate,
        available: payload.is_available,
        skills: payload.skills || [],
      };
      MOCK.crew.push(member);
      return { data: member };
    }
    return { data: { ok: true } };
  },
  async patch(path, payload) {
    await delay();
    const productionResource = path.match(/^\/production\/(crew|cast|scenes|budget|equipment|film-assets|projects|shoot-days)\/([^/?]+)\/?/);
    if (productionResource) {
      const [, resource, id] = productionResource;
      const key = getMockCollectionKey(resource);
      const collection = readMockCollection(key);
      let updated;
      const next = collection.map((item) => {
        if (String(item.id) !== id) return item;
        updated = { ...item, ...payload };
        return updated;
      });
      if (!updated) throw new Error(`No ${resource} record exists with id ${id}`);
      saveMockCollection(key, next);
      return { data: updated };
    }
    return { data: { ok: true } };
  },
  async delete(path) {
    await delay();
    const productionResource = path.match(/^\/production\/(crew|cast|scenes|budget|equipment|film-assets|shoot-days)\/([^/?]+)\/?/);
    if (productionResource) {
      const [, resource, id] = productionResource;
      const key = getMockCollectionKey(resource);
      const collection = readMockCollection(key);
      saveMockCollection(key, collection.filter((item) => String(item.id) !== id));
      return { data: { ok: true } };
    }
    if (path.startsWith('/api/production/crew/')) {
      const id = path.split('/')[3];
      const index = MOCK.crew.findIndex((member) => member.id === id);
      if (index !== -1) MOCK.crew.splice(index, 1);
    }
    return { data: { ok: true } };
  },
};

const MOCK_STORAGE_PREFIX = 'chuttee-mock-';

function readMockCollection(key) {
  const stored = localStorage.getItem(`${MOCK_STORAGE_PREFIX}${key}`);
  if (stored !== null) {
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) throw new Error(`Stored mock ${key} data is invalid`);
    return parsed;
  }
  const initial = MOCK[key] || [];
  return JSON.parse(JSON.stringify(initial));
}

function saveMockCollection(key, collection) {
  localStorage.setItem(`${MOCK_STORAGE_PREFIX}${key}`, JSON.stringify(collection));
}

function getMockCollectionKey(resource) {
  if (resource === 'budget') return 'transactions';
  if (resource === 'film-assets') return 'filmAssets';
  if (resource === 'shoot-days') return 'shootDays';
  return resource;
}

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';