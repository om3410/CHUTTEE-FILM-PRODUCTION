import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiX, FiArrowRight, FiChevronDown, FiChevronUp,
  FiMail, FiMessageSquare, FiUsers, FiFilm, FiDollarSign,
  FiCreditCard, FiSettings, FiInbox, FiVideo, FiCpu,
  FiZap, FiDownload,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import PageHero from '../components/ui/PageHero';
import { useToast } from '../context/ToastContext';

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   CONTACT INFO — your real details
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const CONTACT = {
  email: 'omrewaskar4@gmail.com',
  phone: '+91 74101 14971',
  phoneRaw: '+917410114971',
  office: 'Mumbai, Maharashtra, India',
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   DATA
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

const HELP_ROUTES = [
  { number: '01', icon: FiZap,        eyebrow: 'Getting Started', title: 'Set Up Your Studio',       description: 'Create your workspace, invite your team, and configure your first production.',                  category: 'Getting Started' },
  { number: '02', icon: FiUsers,      eyebrow: 'People',          title: 'Crew & Cast',               description: 'Add crew, manage cast, set rate cards, and assign people to scenes and shoot days.',             category: 'Crew' },
  { number: '03', icon: FiFilm,       eyebrow: 'Production',      title: 'Scenes & Schedule',         description: 'Build scene breakdowns, create shoot days, and manage the production pipeline.',                 category: 'Scenes' },
  { number: '04', icon: FiDollarSign, eyebrow: 'Money',           title: 'Budget & Billing',          description: 'Track expenses, monitor planned vs actual, and generate GST-ready invoices.',                    category: 'Budget' },
  { number: '05', icon: FiVideo,      eyebrow: 'Assets',          title: 'Film Assets',               description: 'Upload posters, stills and BTS shots. Organise by category and project.',                        category: 'Assets' },
  { number: '06', icon: FiCpu,        eyebrow: 'AI Studio',       title: 'GenAI Features',            description: 'Query your database in English, analyse scripts, summarise screenplays and classify mood.',     category: 'AI' },
];

const FAQ_CATEGORIES = [
  { key: 'Getting Started', icon: FiZap },
  { key: 'Crew',            icon: FiUsers },
  { key: 'Scenes',          icon: FiFilm },
  { key: 'Budget',          icon: FiDollarSign },
  { key: 'Billing',         icon: FiCreditCard },
  { key: 'Assets',          icon: FiVideo },
  { key: 'AI',              icon: FiCpu },
  { key: 'Settings',        icon: FiSettings },
];

const FAQS = [
  { category: 'Getting Started', q: 'How do I set up my production house?',               a: 'After signing up, you will land on the Dashboard. Click "New Project" to create your first production. You can then invite crew, add cast, and start planning scenes.' },
  { category: 'Getting Started', q: 'Can I manage multiple production companies?',        a: 'Yes. CHUTTEE supports multi-company workspaces. Each production house keeps its own projects, people, budgets and invoices completely isolated.' },
  { category: 'Getting Started', q: 'How do I invite my team?',                          a: 'Open Settings → Team, then click "Invite". Enter your teammate\'s email and choose their role (Owner, Producer, Crew, or Viewer). They receive a link to join.' },
  { category: 'Getting Started', q: 'Is there a mobile app?',                            a: 'CHUTTEE is a mobile-first web app. Open it on any phone browser — you get the same premium experience including the bottom navigation bar.' },

  { category: 'Crew',            q: 'How do I add a crew member?',                        a: 'Go to Crew, click "Add Crew Member", and fill in their name, role, department and daily rate. You can also add skills, email and phone for faster booking.' },
  { category: 'Crew',            q: 'How do I mark someone as available or busy?',       a: 'On each crew card, click the Available/Busy badge. This instantly updates their status across all productions.' },
  { category: 'Crew',            q: 'Can I bulk-remove crew members?',                    a: 'Yes. Hover over any crew card to reveal its checkbox, select multiple people, and use the floating bulk-actions bar to remove them all at once.' },
  { category: 'Crew',            q: 'How do I assign crew to a shoot day?',              a: 'Open the scene or shoot-day detail, then use "Assign Crew" to link specific team members. Their availability is checked automatically.' },

  { category: 'Scenes',          q: 'How do I create a scene?',                           a: 'Open Scenes and click "Add Scene". Fill in the title, location and time of day. Scene numbers are auto-assigned.' },
  { category: 'Scenes',          q: 'Can I drag scenes between statuses?',                a: 'Yes. In the Board view, simply drag any scene card between Planning, Shooting, Post and Released columns — statuses update instantly.' },
  { category: 'Scenes',          q: 'How do I build a shooting schedule?',                a: 'From a scene, click "Assign to Shoot Day" or open the Schedule view. You can create shoot days with locations and assign scenes to each day.' },

  { category: 'Budget',          q: 'How do I log an expense?',                           a: 'Open Budget and click "Log Expense". Enter the description, department, amount, date and status (pending, paid, overdue, draft).' },
  { category: 'Budget',          q: 'Can I edit a planned department budget?',           a: 'Yes. In the Budget chart, click a "Planned" bar to open the editor. Enter the new amount and save.' },
  { category: 'Budget',          q: 'How do I export my budget?',                         a: 'Click "Export CSV" on the Budget page. You get a CSV file with every transaction, category, and status ready for your accountant.' },

  { category: 'Billing',         q: 'How do I create an invoice?',                        a: 'Open Billing and click "New Invoice". Fill in the client details, project, amount and due date. GST is calculated at 18% automatically.' },
  { category: 'Billing',         q: 'How do I download an invoice as PDF?',              a: 'Click the download icon next to any invoice. It opens a printable view in a new tab — use your browser\'s "Print → Save as PDF" to save it.' },
  { category: 'Billing',         q: 'Can I send bulk invoices?',                          a: 'Yes. Select multiple invoices using the checkboxes, then use the bulk bar at the bottom to send or mark them all paid in one click.' },

  { category: 'Assets',          q: 'How do I upload a poster or still?',                 a: 'Open Film Assets and click "Upload Asset". Choose the category (Poster, Still, BTS, Concept) and the image will be added to your archive.' },
  { category: 'Assets',          q: 'Can I download high-res assets?',                    a: 'Yes. Click any asset in the gallery to open the lightbox, then download from the lightbox view in full resolution.' },
  { category: 'Assets',          q: 'How do I organise assets by project?',               a: 'Each asset is tagged with its project. Use the search bar to filter by project name, or filter by category to narrow the view.' },

  { category: 'AI',              q: 'How do I query my database in plain English?',       a: 'Open AI Studio → Text-to-SQL. Type a question like "Show the first 3 film projects with their title and total_budget". CHUTTEE returns the actual SQL and results.' },
  { category: 'AI',              q: 'How do I analyse a screenplay?',                     a: 'Open AI Studio → Script Analyzer, upload a .txt screenplay file, and you will get total scenes, characters, locations, and speaking percentages.' },
  { category: 'AI',              q: 'What does the mood classifier do?',                  a: 'Paste any screenplay text and CHUTTEE returns the dominant genre plus a percentage breakdown — e.g. Romance 50%, Drama 30%, Coming-of-Age 20%.' },
  { category: 'AI',              q: 'Is my data sent to third parties?',                  a: 'Yes, but only to free-tier LLM providers (Gemini, Groq, Cerebras, and others) via the fallback chain. No paid APIs are used.' },

  { category: 'Settings',        q: 'How do I change the theme?',                         a: 'Open Settings → Appearance and choose Dark, Light, or System. Your choice is remembered across sessions.' },
  { category: 'Settings',        q: 'How do I enable two-factor authentication?',         a: 'Open Settings → Security and click "Enable" next to Two-Factor. Follow the on-screen steps with your authenticator app.' },
  { category: 'Settings',        q: 'How do I sign out of all devices?',                  a: 'Open Settings → Security → Manage sessions. Click the trash icon next to any device to revoke it.' },
];

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   MAIN COMPONENT
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

export default function Help() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [openFaq, setOpenFaq] = useState(0);

  const filteredFaqs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FAQS.filter((f) => {
      const matchesSearch = !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
      const matchesCategory = !categoryFilter || f.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [search, categoryFilter]);

  const counts = useMemo(() => {
    const c = { all: FAQS.length };
    FAQ_CATEGORIES.forEach((cat) => {
      c[cat.key] = FAQS.filter((f) => f.category === cat.key).length;
    });
    return c;
  }, []);

  const hasActiveFilters = Boolean(search || categoryFilter);
  const clearFilters = () => { setSearch(''); setCategoryFilter(''); };
  const scrollToFaqs = () => setTimeout(() => document.getElementById('faq-list')?.scrollIntoView({ behavior: 'smooth' }), 100);

  const toggleFaq = (idx) => {
    setOpenFaq((prev) => (prev === idx ? -1 : idx));
  };

  const filterByCategory = (key) => {
    if (categoryFilter === key) setCategoryFilter('');
    else setCategoryFilter(key);
    scrollToFaqs();
  };

  const countByCategory = (key) => counts[key] ?? 0;

  const emailSupport = () => {
    window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent('CHUTTEE Support Request')}`;
    toast(`Opening your email client — write to ${CONTACT.email}`, 'success');
  };

  const downloadDocs = () => {
    const html = `<!DOCTYPE html><html><head><title>CHUTTEE Help Manual</title>
<style>body{font-family:Georgia,serif;max-width:820px;margin:40px auto;padding:24px;color:#111;line-height:1.6}
h1{color:#b8942b}h2{margin-top:32px;border-bottom:1px solid #ddd;padding-bottom:8px}
.q{font-weight:bold;margin-top:16px}.a{color:#444;margin-bottom:12px}</style></head><body>
<h1>CHUTTEE Film Production — Help Manual</h1>
<p>Generated ${new Date().toLocaleString()}</p>
${FAQ_CATEGORIES.map(cat => `
  <h2>${cat.key}</h2>
  ${FAQS.filter(f => f.category === cat.key).map(f => `
    <p class="q">${f.q}</p>
    <p class="a">${f.a}</p>
  `).join('')}
`).join('')}
</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    toast('Manual opened — save as PDF from the Print dialog.', 'success');
  };

  return (
    <div className="space-y-16 animate-fade-in">

      {/* 1. HERO */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="We Answer Before the Credits Roll"
        title="Every Question, Answered."
        subtitle="Every Problem, Solved."
        lead="Browse frequently asked questions. Reach out by email or chat. Get help with projects, crew, cast, budgets, billing and the new AI Studio. Find the answers you need so you can get back to shooting."
        slogan="Every question has an answer. The right help, the right moment, the right guidance can change what happens next."
      />

      {/* 2. QUICK SEARCH STRIP */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Find the Answer</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with What You Need Help With.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Search by keyword or filter by category. Every article is written for the people who make films.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Search</span>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search FAQs — e.g. invite crew, GST invoice, export budget…"
                className="input pl-10"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Category</span>
            <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); scrollToFaqs(); }} className="input">
              <option value="">All categories</option>
              {FAQ_CATEGORIES.map((cat) => (
                <option key={cat.key} value={cat.key}>{cat.key} ({counts[cat.key] ?? 0})</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" icon={FiMail} onClick={emailSupport}>
            Email Support
          </Button>
          <Button variant="outline" size="sm" icon={FiMessageSquare} onClick={() => navigate('/inbox')}>
            Open Inbox
          </Button>
          {hasActiveFilters && (
            <>
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-premium border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-gold-500/40 hover:text-gold-400">
                <FiX className="h-3 w-3" /> Clear filters
              </button>
              <span className="text-xs text-zinc-500">Showing {filteredFaqs.length} of {FAQS.length} articles</span>
            </>
          )}
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatNumber value={FAQS.length} label="Help articles" note="Written by the team" />
        <StatNumber value={FAQ_CATEGORIES.length} label="Categories" note="Across the whole product" />
        <StatNumber value={countByCategory('AI')} label="AI Studio guides" note="Text-to-SQL, scripts, mood" />
        <StatNumber value={countByCategory('Billing')} label="Billing guides" note="GST, invoices, exports" />
      </section>

      <Quote>
        "A great product does not need a great manual. But when you need help, it should feel like a conversation with someone who knows the craft."
      </Quote>

      {/* 5. SIX HELP ROUTES */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Where CHUTTEE Can Help You</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">What Do You Need Help With?</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every area of the platform has its own guide. Choose the one you need and jump straight to the answers.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {HELP_ROUTES.map((route) => (
            <RouteCard
              key={route.number}
              number={route.number}
              icon={route.icon}
              eyebrow={route.eyebrow}
              title={route.title}
              description={route.description}
              count={countByCategory(route.category)}
              isActive={categoryFilter === route.category}
              action={categoryFilter === route.category ? 'Clear filter' : 'View articles →'}
              onAction={() => filterByCategory(route.category)}
            />
          ))}
        </div>
      </section>

      <Quote>
        "The best help is the help you never have to ask for. The second best is the help that arrives before you finish typing."
      </Quote>

      {/* 7. CATEGORY CHIPS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Explore by Category</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Search the Way Users Actually Think.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            One click shows every article in that category.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FAQ_CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat.key}
              icon={cat.icon}
              label={cat.key}
              count={counts[cat.key] ?? 0}
              isActive={categoryFilter === cat.key}
              onClick={() => filterByCategory(cat.key)}
            />
          ))}
        </div>
      </section>

      {/* 9. SPLIT JOURNEYS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Built for Every Stage of the Journey</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            A New User Wants Clarity. A Pro Wants Speed.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE supports both journeys — one for the first-time user, one for the power user who needs to jump straight to a specific answer.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="For New Users"
            steps={['Register', 'Dashboard', 'First Scene', 'First Invoice', 'AI Studio']}
            description="Create an account. Open your dashboard. Add your first scene. Send your first invoice. Explore the AI Studio. In under ten minutes you will understand the whole system."
            onStepClick={(step) => {
              if (step === 'Register')      navigate('/register');
              if (step === 'Dashboard')     navigate('/dashboard');
              if (step === 'First Scene')   navigate('/scenes', { state: { openAdd: true } });
              if (step === 'First Invoice') navigate('/billing');
              if (step === 'AI Studio')     navigate('/ai');
            }}
          />
          <JourneyCard
            title="For Power Users"
            steps={['Search', 'Shortcut', 'Export', 'Automate', 'Extend']}
            description="Search the FAQ with keywords. Use keyboard shortcuts (⌘K). Export any list. Automate with the AI Studio. Extend the platform with your own workflows."
            onStepClick={(step) => {
              if (step === 'Search') {
                const el = document.querySelector('input[placeholder*="Search FAQs"]');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  el.focus();
                }
              }
              if (step === 'Shortcut') toast('Press ⌘K anywhere to open the command palette', 'info');
              if (step === 'Export') navigate('/budget');
              if (step === 'Automate' || step === 'Extend') navigate('/ai');
            }}
          />
        </div>
      </section>

      <Quote>
        "The best production teams learn from every shoot. The best software helps them remember what they learned."
      </Quote>

      {/* 11. FAQ ACCORDION */}
      <section id="faq-list" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Frequently Asked Questions</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Every Answer, in One Place.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            {filteredFaqs.length} of {FAQS.length} articles shown
            {categoryFilter && ` — ${categoryFilter}`}
            {search && ` · matching "${search}"`}.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {filteredFaqs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-sm text-zinc-500">No articles match your search. Try different keywords or clear the filters.</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>
                Clear filters
              </Button>
            </Card>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={`${faq.category}-${idx}`} className="premium-card overflow-hidden">
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-zinc-900/40"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 rounded-full border border-gold-500/30 bg-gold-500/10 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-gold-400">
                        {faq.category}
                      </span>
                      <span className="font-serif text-base font-semibold text-zinc-100">{faq.q}</span>
                    </div>
                    <span className="shrink-0 text-zinc-500">
                      {isOpen ? <FiChevronUp className="h-5 w-5 text-gold-400" /> : <FiChevronDown className="h-5 w-5" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-zinc-800 bg-zinc-900/30 px-5 py-4">
                      <p className="text-sm leading-relaxed text-zinc-300">{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      <Quote>
        "A film crew is only as good as the clarity it operates with. Help documentation is not overhead — it is production infrastructure."
      </Quote>

      {/* 13. QUICK ACTIONS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Still Stuck?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Start with the Action You Need Most.</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction
            icon={FiMail}
            title="Email Support"
            description={`Write to ${CONTACT.email} — replies within 24 hours.`}
            onAction={emailSupport}
          />
          <QuickAction
            icon={FiMessageSquare}
            title="Open Inbox"
            description="Message our production desk directly from the app."
            onAction={() => navigate('/inbox')}
          />
          <QuickAction
            icon={FiDownload}
            title="Download Docs"
            description="Get a printable HTML of the full user manual."
            onAction={downloadDocs}
          />
        </div>
      </section>

      {/* 15. CONTACT STRIP */}
      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Priority Support</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">Need a Human? We're Here.</h3>
            <p className="mt-2 text-sm text-zinc-400">
              For urgent production issues, our desk answers before the credits roll.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href={`mailto:${CONTACT.email}`} className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">
              {CONTACT.email}
            </a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href={`tel:${CONTACT.phoneRaw}`} className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">
              {CONTACT.phone}
            </a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Office</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{CONTACT.office}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiMail} onClick={emailSupport}>
                Email Us
              </Button>
              <Button variant="outline" size="sm" icon={FiInbox} onClick={() => navigate('/inbox')}>
                Open Inbox
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPER COMPONENTS
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

function StatNumber({ value, label, note }) {
  return (
    <div className="premium-card p-6">
      <p className="font-serif text-4xl font-bold text-gold-gradient">{value}</p>
      <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-300">{label}</p>
      <p className="mt-1 text-xs text-zinc-500">{note}</p>
    </div>
  );
}

function Quote({ children }) {
  return (
    <section className="premium-card relative overflow-hidden p-8 sm:p-12">
      <div className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full bg-gold-500/10 blur-3xl" />
      <p className="relative max-w-4xl font-serif italic text-lg sm:text-xl leading-relaxed text-gold-300">{children}</p>
      <div className="relative mt-6 h-[2px] w-20 bg-gradient-to-r from-gold-400 to-transparent" />
    </section>
  );
}

function RouteCard({ number, icon: Icon, eyebrow, title, description, action, onAction, count, isActive }) {
  return (
    <div className={`premium-card group flex flex-col p-6 transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-premium bg-gold-500/10 text-gold-400">
            <Icon className="h-4 w-4" />
          </span>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">{number} · {eyebrow}</p>
        </div>
        {typeof count === 'number' && (
          <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 text-[10px] font-medium text-zinc-400">{count}</span>
        )}
      </div>
      <h3 className="mt-4 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-400">{description}</p>
      <button type="button" onClick={onAction} className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        {action}
      </button>
    </div>
  );
}

function CategoryChip({ icon: Icon, label, count, isActive, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`premium-card group flex items-center justify-between gap-3 p-4 text-left transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
          <Icon className="h-4 w-4" />
        </span>
        <p className="truncate font-serif text-base font-semibold text-zinc-100">{label}</p>
      </div>
      <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 text-[10px] font-medium text-zinc-400">{count}</span>
    </button>
  );
}

function JourneyCard({ title, steps, description, onStepClick }) {
  return (
    <div className="premium-card p-6">
      <p className="text-[10px] uppercase tracking-[0.25em] text-gold-400">Journey</p>
      <h3 className="mt-3 font-serif text-xl font-bold text-zinc-100">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{description}</p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        {steps.map((step, i) => (
          <span key={step} className="flex items-center gap-2">
            <button type="button" onClick={() => onStepClick?.(step)}
              className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-[11px] font-medium text-zinc-300 transition-all hover:border-gold-500/40 hover:text-gold-400">
              {step}
            </button>
            {i < steps.length - 1 && <FiArrowRight className="h-3 w-3 text-gold-400/60" />}
          </span>
        ))}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, title, description, onAction }) {
  return (
    <button type="button" onClick={onAction}
      className="group flex flex-col items-start gap-3 rounded-premium border border-zinc-800 bg-zinc-900/40 p-5 text-left transition-all hover:border-gold-500/40 hover:bg-zinc-900/60">
      <span className="grid h-11 w-11 place-items-center rounded-premium bg-gold-500/10 text-gold-400 transition-transform group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </span>
      <span className="font-serif text-lg font-semibold text-zinc-100">{title}</span>
      <span className="text-sm text-zinc-500">{description}</span>
      <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gold-400 transition-transform group-hover:translate-x-1">
        Continue <FiArrowRight className="h-3 w-3" />
      </span>
    </button>
  );
}