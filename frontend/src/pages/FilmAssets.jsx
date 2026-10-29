import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiPlus, FiSearch, FiImage, FiCamera, FiVideo, FiFolder,
  FiX, FiArrowRight, FiMaximize2, FiUploadCloud, FiStar,
  FiCheckCircle, FiHelpCircle, FiInbox, FiLayers, FiTrash2,
  FiDownload, FiLink, FiZap, FiRefreshCw,
} from 'react-icons/fi';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import EmptyState from '../components/feedback/EmptyState';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Lightbox from '../components/Lightbox';
import PageHero from '../components/ui/PageHero';
import { useToast } from '../context/ToastContext';
import { generateImage } from '../api/ai';

const CONTACT = {
  email: 'omrewaskar4@gmail.com',
  phone: '+91 74101 14971',
  phoneRaw: '+917410114971',
};

/* ——————————— Asset categories ——————————— */
const ASSET_CATEGORIES = [
  { number: '01', icon: FiImage,  eyebrow: 'Marketing',      title: 'Posters & Key Art',     description: 'Theatrical posters, teaser art, and OTT thumbnails.',                filter: 'Poster' },
  { number: '02', icon: FiCamera, eyebrow: 'On Set',         title: 'Production Stills',     description: 'High-resolution stills captured during principal photography.',       filter: 'Still' },
  { number: '03', icon: FiVideo,  eyebrow: 'Behind Scenes',  title: 'BTS & Raw Footage',     description: 'Behind-the-scenes moments, bloopers, and raw camera feeds.',          filter: 'BTS' },
  { number: '04', icon: FiFolder, eyebrow: 'Development',    title: 'Concept & Mood Boards', description: 'Early concept art, colour palettes, and visual references.',          filter: 'Concept' },
];

const POPULAR_FILTERS = ['Poster', 'Still', 'BTS', 'Concept', 'Location'];

/* ——————————— Seed assets ——————————— */
const SEED_ASSETS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800', caption: 'Monsoon Letters — Teaser Poster', category: 'Poster',    project: 'Monsoon Letters' },
  { id: 2, image: 'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=800', caption: 'The Salt Road — On Set',          category: 'Still',     project: 'The Salt Road' },
  { id: 3, image: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800', caption: 'Paper Lanterns — Key Art',        category: 'Poster',    project: 'Paper Lanterns' },
  { id: 4, image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=800', caption: 'BTS — Camera Setup',              category: 'BTS',       project: 'Monsoon Letters' },
  { id: 5, image: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=800', caption: 'Location Scout — Goa',            category: 'Location',  project: 'The Salt Road' },
  { id: 6, image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800', caption: 'Concept Art — Climax',            category: 'Concept',   project: 'Paper Lanterns' },
  { id: 7, image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800', caption: 'Still — The Lead',                category: 'Still',     project: 'Monsoon Letters' },
  { id: 8, image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800', caption: 'BTS — Lighting Setup',            category: 'BTS',       project: 'The Salt Road' },
];

const LS_KEY = 'chuttee.assets';

export default function FilmAssets() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return saved ? JSON.parse(saved) : SEED_ASSETS;
    } catch {
      return SEED_ASSETS;
    }
  });

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [lightbox, setLightbox] = useState(-1);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [newAsset, setNewAsset] = useState({ image: '', caption: '', category: 'Poster', project: '' });

  // AI generation state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState('');
  const [aiProvider, setAiProvider] = useState('');

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(assets)); } catch {}
  }, [assets]);

  /* ——————————— Derived ——————————— */
  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((asset) => {
      const matchesSearch = !q || [asset.caption, asset.project, asset.category].some((v) => String(v ?? '').toLowerCase().includes(q));
      const matchesFilter = !filter || asset.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [assets, search, filter]);

  const counts = useMemo(() => {
    const c = { all: assets.length };
    POPULAR_FILTERS.forEach((cat) => {
      c[cat] = assets.filter((a) => a.category === cat).length;
    });
    return c;
  }, [assets]);

  const hasActiveFilters = Boolean(search || filter);
  const clearFilters = () => { setSearch(''); setFilter(''); };
  const scrollToGallery = () => setTimeout(() => document.getElementById('asset-gallery')?.scrollIntoView({ behavior: 'smooth' }), 100);

  const countByCategory = (cat) => counts[cat] ?? 0;
  const filterByCategory = (cat) => {
    if (filter === cat) setFilter('');
    else { setFilter(cat); scrollToGallery(); }
  };

  /* ——————————— AI Generation ——————————— */
  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast('Write a prompt describing the image you want.', 'error');
      return;
    }

    setAiGenerating(true);
    setAiPreview('');
    setAiProvider('');

    try {
      const result = await generateImage(aiPrompt.trim(), 1024, 768);
      if (result.success && result.image) {
        setAiPreview(result.image);
        setAiProvider(result.provider || 'AI');
        setNewAsset((prev) => ({ ...prev, image: result.image }));
        toast(`Image generated with ${result.provider}`, 'success');
      } else {
        toast('Could not generate image. Try a different prompt.', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Could not generate image. Try a different prompt.';
      toast(msg, 'error');
      console.error('AI generation failed:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  /* ——————————— Actions ——————————— */
  const uploadAsset = (e) => {
    e.preventDefault();
    if (!newAsset.image.trim()) { toast('Add an image URL or generate one first.', 'error'); return; }
    const created = {
      id: Date.now(),
      image: newAsset.image.trim(),
      caption: newAsset.caption.trim() || 'Untitled asset',
      category: newAsset.category,
      project: newAsset.project.trim() || 'Unassigned',
    };
    setAssets((list) => [created, ...list]);
    setNewAsset({ image: '', caption: '', category: 'Poster', project: '' });
    setAiPreview('');
    setAiPrompt('');
    setAiProvider('');
    setUploadOpen(false);
    toast('Asset added to archive', 'success');
  };

  const deleteAsset = () => {
    if (!confirmDelete) return;
    setAssets((list) => list.filter((a) => a.id !== confirmDelete.id));
    toast(`"${confirmDelete.caption}" deleted`, 'success');
    setConfirmDelete(null);
    if (lightbox >= 0) setLightbox(-1);
  };

  const downloadAsset = (asset) => {
    const link = document.createElement('a');
    link.href = asset.image;
    link.download = `${asset.caption.replace(/\s+/g, '-').toLowerCase()}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast('Download started', 'success');
  };

  const copyLink = async (asset) => {
    try {
      await navigator.clipboard.writeText(asset.image);
      toast('Link copied to clipboard', 'success');
    } catch {
      toast('Could not copy link', 'error');
    }
  };

  const openUpload = () => {
    setNewAsset({ image: '', caption: '', category: 'Poster', project: '' });
    setAiPreview('');
    setAiPrompt('');
    setAiProvider('');
    setUploadOpen(true);
  };

  return (
    <div className="space-y-16 animate-fade-in">

      {/* 1. HERO */}
      <PageHero
        image="/images/hero/hero-bg.jpg"
        eyebrow="The Visual Memory of Your Production"
        title="Every Frame, Preserved."
        subtitle="Every Moment, Yours."
        lead="Upload and organise posters, stills, BTS shots, concept art, and location references. Generate new images with AI when you don't have one. Keep the visual history of every production in one place."
        slogan="Every image has a story. The right archive, the right memory, the right visual reference can change how a film is remembered long after the shoot wraps."
      />

      {/* 2. QUICK SEARCH STRIP */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Find the Asset</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            Start with the Image You Need.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Search by caption, project or category. Or generate a new image with AI in seconds.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block lg:col-span-2">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Search</span>
            <div className="relative">
              <FiSearch className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Caption, project, category…" className="input pl-10" />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] uppercase tracking-[0.2em] text-zinc-500">Category</span>
            <select value={filter} onChange={(e) => { setFilter(e.target.value); scrollToGallery(); }} className="input">
              <option value="">All Categories</option>
              {POPULAR_FILTERS.map((f) => <option key={f} value={f}>{f} ({countByCategory(f)})</option>)}
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="primary" size="sm" icon={FiUploadCloud} onClick={openUpload}>
            Upload or Generate
          </Button>
          {hasActiveFilters && (
            <>
              <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 rounded-premium border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-gold-500/40 hover:text-gold-400">
                <FiX className="h-3 w-3" /> Clear filters
              </button>
              <span className="text-xs text-zinc-500">Showing {filteredAssets.length} of {assets.length} assets</span>
            </>
          )}
        </div>
      </section>

      {/* 3. STATS STRIP */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatNumber value={assets.length} label="Total Assets" note="Across all categories" />
        <StatNumber value={countByCategory('Poster')} label="Posters & Key Art" note="Marketing ready" />
        <StatNumber value={countByCategory('Still')} label="Production Stills" note="On-set captures" />
        <StatNumber value={countByCategory('BTS')} label="BTS & Raw" note="Behind the scenes" />
      </section>

      <Quote>
        "A film is remembered in moments. The right still, the right poster, the right frame can outlive the film itself."
      </Quote>

      {/* 5. FOUR ASSET ROUTES */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Where CHUTTEE Can Help You</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">What Are You Looking For?</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            Every image belongs to a category. Choose the one you need, and CHUTTEE surfaces the archive.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ASSET_CATEGORIES.map((route) => (
            <RouteCard
              key={route.number}
              number={route.number}
              icon={route.icon}
              eyebrow={route.eyebrow}
              title={route.title}
              description={route.description}
              count={countByCategory(route.filter)}
              isActive={filter === route.filter}
              action={filter === route.filter ? 'Clear filter' : 'View assets →'}
              onAction={() => filterByCategory(route.filter)}
            />
          ))}
        </div>
      </section>

      <Quote>
        "The best marketing is honest. The right still, the right poster, the right moment — no exaggeration needed."
      </Quote>

      {/* 7. CATEGORY CHIPS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Explore by Category</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Search the Way Designers Actually Think.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            One click shows everything in that category.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {POPULAR_FILTERS.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              count={countByCategory(cat)}
              isActive={filter === cat}
              onClick={() => filterByCategory(cat)}
            />
          ))}
        </div>
      </section>

      {/* 9. SPLIT JOURNEYS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Built for Both Sides of the Production</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">
            A Director Wants Memory. A Designer Wants Assets.
          </h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            CHUTTEE supports both journeys — one for the person preserving the craft, one for the person marketing the film.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <JourneyCard
            title="For Directors & Producers"
            steps={['Capture', 'Organise', 'Review', 'Archive', 'Preserve']}
            description="Capture everything on set. Organise by project and category. Review the best frames. Archive for the long term. Preserve the visual history of the film."
            onStepClick={(step) => {
              if (step === 'Capture') openUpload();
              if (step === 'Organise' || step === 'Review') scrollToGallery();
              if (step === 'Archive' || step === 'Preserve') toast('Archive view coming — for now use the gallery search.', 'info');
            }}
          />
          <JourneyCard
            title="For Designers & Marketing"
            steps={['Browse', 'Select', 'Generate', 'Download', 'Publish']}
            description="Browse the archive. Select the best stills and posters. Generate new ones with AI if needed. Download in the right resolution. Publish to the world."
            onStepClick={(step) => {
              if (step === 'Browse') scrollToGallery();
              if (step === 'Select') setLightbox(0);
              if (step === 'Generate') openUpload();
              if (step === 'Download' && filteredAssets[0]) downloadAsset(filteredAssets[0]);
              if (step === 'Publish') navigate('/help');
            }}
          />
        </div>
      </section>

      <Quote>
        "Every asset is a piece of the story. The right archive is what keeps that story alive."
      </Quote>

      {/* 11. MAIN GALLERY */}
      <section id="asset-gallery" className="scroll-mt-24">
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">The Archive</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Every Asset, in One Place.</h2>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
            {filteredAssets.length} of {assets.length} assets shown
            {filter && ` — ${filter}`}.
          </p>
        </div>

        <div className="mt-8">
          {filteredAssets.length === 0 ? (
            <EmptyState
              icon={FiImage}
              title="No assets found"
              description={hasActiveFilters ? 'Try clearing the filters.' : 'Upload your first asset or generate one with AI.'}
              actionLabel="Upload or Generate"
              onAction={openUpload}
            />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredAssets.map((asset, i) => (
                <figure key={asset.id} className="premium-card group overflow-hidden">
                  <div className="relative aspect-[3/2] overflow-hidden bg-zinc-950 cursor-pointer" onClick={() => setLightbox(i)}>
                    <img
                      src={asset.image}
                      alt={asset.caption}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-premium group-hover:scale-110"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/50 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-white/90 backdrop-blur-sm">
                      {asset.category}
                    </div>

                    <div className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-premium bg-black/50 text-white/80 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      <FiMaximize2 size={14} />
                    </div>

                    <figcaption className="absolute inset-x-0 bottom-0 p-5 translate-y-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="font-serif text-base font-semibold text-white drop-shadow">{asset.caption}</p>
                      <p className="text-xs text-gold-400 mt-1">{asset.project}</p>
                    </figcaption>
                  </div>

                  <div className="flex items-center justify-between border-t border-zinc-800 px-3 py-2">
                    <p className="truncate text-xs text-zinc-400">{asset.caption}</p>
                    <div className="flex shrink-0 gap-1">
                      <button onClick={() => downloadAsset(asset)} title="Download" className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-gold-400">
                        <FiDownload className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => copyLink(asset)} title="Copy link" className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-gold-400">
                        <FiLink className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => setConfirmDelete(asset)} title="Delete" className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400">
                        <FiTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      <Quote>
        "The films that endure are not just remembered by the audience. They are remembered by the archive."
      </Quote>

      {/* 14. QUICK ACTIONS */}
      <section>
        <div className="max-w-3xl">
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Ready to Add to the Archive?</p>
          <h2 className="mt-3 font-serif text-3xl font-bold text-zinc-100 sm:text-4xl">Start with the Asset You Need Most.</h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <QuickAction icon={FiUploadCloud} title="Upload Asset" description="Add a new poster, still, or BTS shot to the archive." onAction={openUpload} />
          <QuickAction icon={FiZap} title="Generate with AI" description="Create a poster or still from a text prompt." onAction={() => { openUpload(); setTimeout(() => document.querySelector('textarea[placeholder*="Cinematic"]')?.focus(), 200); }} />
          <QuickAction icon={FiImage} title="Open Gallery" description="View the full visual archive in a lightbox." onAction={() => filteredAssets[0] ? setLightbox(0) : toast('No assets to view.', 'info')} />
        </div>
      </section>

      {/* 15. CONTACT STRIP */}
      <section className="premium-card relative overflow-hidden p-8 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-gold-400">Contact CHUTTEE</p>
            <h3 className="mt-3 font-serif text-2xl font-bold text-zinc-100">Need a Specific Image? Tell Us What You Need.</h3>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Email</p>
            <a href={`mailto:${CONTACT.email}`} className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">{CONTACT.email}</a>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-zinc-500">Phone</p>
            <a href={`tel:${CONTACT.phoneRaw}`} className="mt-2 block text-sm text-zinc-300 transition-colors hover:text-gold-400">{CONTACT.phone}</a>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Need help?</p>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Reach out to our media desk for high-res downloads and press assets.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" size="sm" icon={FiHelpCircle} onClick={() => navigate('/help')}>Talk to us</Button>
              <Button variant="outline" size="sm" icon={FiInbox} onClick={() => navigate('/inbox')}>Open Inbox</Button>
            </div>
          </div>
        </div>
      </section>

      {/* UPLOAD / AI-GENERATE MODAL */}
      <Modal open={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload or Generate Asset" icon={FiUploadCloud} size="md">
        <form onSubmit={uploadAsset} className="space-y-4">

          {/* AI Generator */}
          <div className="rounded-premium border border-gold-500/30 bg-gold-500/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <FiZap className="h-4 w-4 text-gold-400" />
              <p className="text-sm font-semibold text-gold-400">Generate with AI</p>
            </div>
            <p className="text-xs text-zinc-400 mb-3">
              Don't have an image? Describe what you need and CHUTTEE will generate one for you.
            </p>

            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              placeholder="e.g., Cinematic teaser poster for a monsoon romance film, warm amber tones, silhouettes of two lovers under an umbrella, film grain, 35mm"
              className="input w-full resize-none text-sm"
              disabled={aiGenerating}
            />

            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-[11px] text-zinc-500">
                {aiPreview
                  ? `Generated with ${aiProvider}`
                  : 'Free · powered by Pollinations / Stability / HuggingFace'}
              </p>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={aiGenerating ? FiRefreshCw : FiZap}
                onClick={generateWithAI}
                disabled={aiGenerating || !aiPrompt.trim()}
              >
                {aiGenerating ? 'Generating…' : 'Generate'}
              </Button>
            </div>

            {aiPreview && (
              <div className="mt-3 overflow-hidden rounded-premium border border-zinc-800">
                <img src={aiPreview} alt="AI preview" className="h-48 w-full object-cover" />
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-zinc-500">
            <div className="h-px flex-1 bg-zinc-800" />
            <span>Or paste an image URL</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>

          <Input
            label="Image URL"
            value={newAsset.image.startsWith('data:') ? '' : newAsset.image}
            onChange={(e) => {
              setNewAsset({ ...newAsset, image: e.target.value });
              setAiPreview('');
            }}
            placeholder="https://images.unsplash.com/photo-…"
          />

          <Input
            label="Caption"
            value={newAsset.caption}
            onChange={(e) => setNewAsset({ ...newAsset, caption: e.target.value })}
            placeholder="Monsoon Letters — Teaser Poster"
          />

          <label className="block space-y-1.5 text-xs font-medium text-zinc-400">
            <span>Category</span>
            <select
              value={newAsset.category}
              onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })}
              className="input"
            >
              {POPULAR_FILTERS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <Input
            label="Project (optional)"
            value={newAsset.project}
            onChange={(e) => setNewAsset({ ...newAsset, project: e.target.value })}
            placeholder="Monsoon Letters"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="primary"
              icon={FiUploadCloud}
              disabled={!newAsset.image.trim()}
            >
              {aiPreview ? 'Add Generated Asset' : 'Upload'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Asset" icon={FiTrash2} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-zinc-300">
            Delete <span className="font-semibold text-white">{confirmDelete?.caption}</span>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button type="button" variant="destructive" onClick={deleteAsset} icon={FiTrash2}>Delete</Button>
          </div>
        </div>
      </Modal>

      {/* Lightbox */}
      {lightbox >= 0 && filteredAssets.length > 0 && (
        <Lightbox
          images={filteredAssets.map((a) => a.image)}
          index={lightbox}
          onClose={() => setLightbox(-1)}
          onChange={setLightbox}
        />
      )}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   HELPERS
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

function CategoryChip({ label, count, isActive, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`premium-card group flex items-center justify-between gap-3 p-4 text-left transition-all ${isActive ? 'border-gold-500/50 shadow-gold' : 'hover:border-gold-500/40'}`}>
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400">
          <FiStar className="h-4 w-4" />
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