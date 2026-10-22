export const APP_NAME = 'CHUTTEE';
export const APP_TAGLINE = 'Film Production Suite';
export const APP_VERSION = '1.0.0';

export const DEPARTMENTS = ['Camera', 'Sound', 'Art', 'Wardrobe', 'Production', 'Post'];
export const SCENE_STATUSES = ['Not Started', 'In Progress', 'Shot', 'Cut'];

export const MOCK = {
  dashboard: [
    { id: 'd1', projects: 3, crew: 6, cast: 3, risks: 3, budgetTotal: 4500000, budgetSpent: 2780000, completion: 62 },
  ],
  projects: [
    { id: 'p1', title: 'Monsoon Letters', status: 'Filming', completion: 62, budgetTotal: 4500000, budgetSpent: 2780000, crewCount: 24, castCount: 12, startDate: '2026-01-15', wrapDate: '2026-06-20' },
    { id: 'p2', title: 'The Last Rehearsal', status: 'Pre-Production', completion: 18, budgetTotal: 1800000, budgetSpent: 240000, crewCount: 11, castCount: 6, startDate: '2026-05-01', wrapDate: '2026-08-10' },
    { id: 'p3', title: 'Kaapi & Karma', status: 'Post', completion: 88, budgetTotal: 900000, budgetSpent: 845000, crewCount: 8, castCount: 4, startDate: '2025-10-10', wrapDate: '2026-02-28' },
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
    { id: 's1', number: 1, title: 'INT. COFFEE HOUSE — DAY', status: 'Shot', location: 'Fort Kochi', timeOfDay: 'Day', tags: ['dialogue'] },
    { id: 's2', number: 2, title: 'EXT. FISHING DOCK — GOLDEN HOUR', status: 'Shot', location: 'Marine Drive', timeOfDay: 'Golden', tags: ['vfx'] },
    { id: 's3', number: 3, title: 'INT. APARTMENT — NIGHT', status: 'In Progress', location: 'Studio A', timeOfDay: 'Night', tags: ['dialogue', 'closeup'] },
    { id: 's4', number: 4, title: 'EXT. BUS STOP — RAIN', status: 'Not Started', location: 'MG Road', timeOfDay: 'Day', tags: ['action'] },
    { id: 's5', number: 5, title: 'INT. HOSPITAL CORRIDOR — DAY', status: 'Not Started', location: 'Studio B', timeOfDay: 'Day', tags: ['dialogue'] },
    { id: 's6', number: 6, title: 'EXT. TEMPLE STEPS — SUNRISE', status: 'Cut', location: 'Thrissur', timeOfDay: 'Dawn', tags: ['montage'] },
  ],
  transactions: [
    { id: 't1', date: '2026-09-20', description: 'Camera rental — RED Komodo', category: 'Equipment', amount: 48000 },
    { id: 't2', date: '2026-09-21', description: 'Location permit — Marine Drive', category: 'Locations', amount: 15000 },
    { id: 't3', date: '2026-09-22', description: 'Crew lunch x24', category: 'Catering', amount: 9600 },
    { id: 't4', date: '2026-09-23', description: 'Costume fabric — Meera', category: 'Wardrobe', amount: 22000 },
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
  assets: [
    { id: 'e1', name: 'RED Komodo 6K', category: 'Camera', status: 'In Use', serial: 'RK-4421' },
    { id: 'e2', name: 'ARRI SkyPanel S60', category: 'Lighting', status: 'Available', serial: 'AS-0987' },
    { id: 'e3', name: 'Sennheiser MKH 416', category: 'Sound', status: 'Available', serial: 'SM-2210' },
    { id: 'e4', name: 'DJI Ronin 4D', category: 'Gimbal', status: 'In Use', serial: 'DR-1145' },
  ],
  activity: [
    { id: 1, type: 'scene_shot', message: 'Scene 2 marked as Shot by Ananya', timestamp: '12m ago' },
    { id: 2, type: 'expense_added', message: 'Rs 48000 logged — Camera rental', timestamp: '1h ago' },
    { id: 3, type: 'crew_added', message: 'Meera Joseph added to Wardrobe', timestamp: '3h ago' },
    { id: 4, type: 'comment', message: 'Rohit commented on Scene 4', timestamp: '5h ago' },
    { id: 5, type: 'scene_shot', message: 'Scene 6 marked as Cut by Vikram', timestamp: '1d ago' },
  ],
  inbox: [
    { id: 1, from: 'Ananya Iyer', subject: 'Scene 4 storyboard attached', preview: 'Check the new shots — I think we should shoot wider.', time: '12m', unread: true },
    { id: 2, from: 'Sandeep Pillai', subject: 'Weekly budget summary', preview: 'Camera over by 12%. Need your sign-off.', time: '2h', unread: true },
    { id: 3, from: 'Rohit Menon', subject: 'Location scouting notes', preview: 'Marine Drive works best during golden hour.', time: '1d', unread: false },
  ],
  ai: [
    { id: 'a1', kind: 'risk', title: 'Weather risk on 3 outdoor scenes', severity: 'High', detail: '80% rain probability on shoot day 12.' },
    { id: 'a2', kind: 'insight', title: 'Budget variance +12% on Camera', severity: 'Medium', detail: 'Consider renegotiating the rental package.' },
    { id: 'a3', kind: 'suggestion', title: 'Cast recommendation for Scene 7', severity: 'Low', detail: 'Try Nithya Menon — 94% style match.' },
  ],
  billing: [
    { id: 'i1', date: '2026-09-01', plan: 'Studio', amount: 24000, status: 'Paid' },
    { id: 'i2', date: '2026-08-01', plan: 'Studio', amount: 24000, status: 'Paid' },
    { id: 'i3', date: '2026-07-01', plan: 'Studio', amount: 24000, status: 'Paid' },
  ],
};