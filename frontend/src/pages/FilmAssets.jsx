import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiPlus, FiCamera, FiSearch, FiBox, FiImage, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import SkeletonLoader from '../components/feedback/SkeletonLoader';
import EmptyState from '../components/feedback/EmptyState';
import { useToast } from '../context/ToastContext';
import { createEquipment, createFilmAsset, fetchEquipment, fetchFilmAssets } from '../api/production';
import { getApiErrorMessage } from '../api/auth';

export default function FilmAssets() {
  const { toast } = useToast();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(Boolean(location.state?.openAdd));
  const [mediaAddOpen, setMediaAddOpen] = useState(Boolean(location.state?.openMediaAdd));
  const [saving, setSaving] = useState(false);
  const [savingMedia, setSavingMedia] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: '', category: '', serial: '' });
  const [newMediaAsset, setNewMediaAsset] = useState({ title: '', category: 'POSTER', images: [] });

  useEffect(() => {
    if (location.state?.openAdd) setAddOpen(true);
    if (location.state?.openMediaAdd) setMediaAddOpen(true);
  }, [location.key, location.state]);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchEquipment(), fetchFilmAssets()])
      .then(([equipmentResult, mediaResult]) => {
        if (cancelled) return;
        if (equipmentResult.status === 'fulfilled') {
          setAssets(equipmentResult.value);
        } else {
          toast(getApiErrorMessage(equipmentResult.reason, 'Could not load equipment.'), 'error');
        }
        if (mediaResult.status === 'fulfilled') {
          setMediaAssets(mediaResult.value);
        } else {
          toast(getApiErrorMessage(mediaResult.reason, 'Could not load film assets.'), 'error');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [toast]);

  const filtered = assets.filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()));
  const mediaGroups = [...mediaAssets.reduce((groups, asset) => {
    const key = `${asset.category}\u0000${asset.title}`;
    const group = groups.get(key) ?? { id: key, title: asset.title, category: asset.category, images: [] };
    if (asset.image) group.images.push(asset.image);
    groups.set(key, group);
    return groups;
  }, new Map()).values()];
  const filteredMediaAssets = mediaGroups.filter((asset) => !search || asset.title.toLowerCase().includes(search.toLowerCase()));
  const addAsset = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const asset = await createEquipment(newAsset);
      setAssets((list) => [...list, asset]);
      setNewAsset({ name: '', category: '', serial: '' });
      setAddOpen(false);
      toast('Equipment added', 'success');
    } catch (error) {
      toast(getApiErrorMessage(error, 'Could not save equipment.'), 'error');
    } finally {
      setSaving(false);
    }
  };
  const addMediaAsset = async (e) => {
    e.preventDefault();
    if (!newMediaAsset.images.length) {
      toast('Select at least one image to upload.', 'error');
      return;
    }
    setSavingMedia(true);
    const uploadedAssets = [];
    try {
      for (const image of newMediaAsset.images) {
        uploadedAssets.push(await createFilmAsset({
          title: newMediaAsset.title,
          category: newMediaAsset.category,
          image,
        }));
      }
      setMediaAssets((list) => [...uploadedAssets, ...list]);
      setNewMediaAsset({ title: '', category: 'POSTER', images: [] });
      setMediaAddOpen(false);
      toast(`${uploadedAssets.length} image${uploadedAssets.length === 1 ? '' : 's'} added to the media card`, 'success');
    } catch (error) {
      if (uploadedAssets.length) {
        setMediaAssets((list) => [...uploadedAssets, ...list]);
        setNewMediaAsset((form) => ({ ...form, images: form.images.slice(uploadedAssets.length) }));
        toast(`${uploadedAssets.length} image${uploadedAssets.length === 1 ? '' : 's'} uploaded; remaining images failed. ${getApiErrorMessage(error, 'Could not save film asset.')}`, 'error');
      } else {
        toast(getApiErrorMessage(error, 'Could not save film asset.'), 'error');
      }
    } finally {
      setSavingMedia(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Film Assets</h1>
          <p className="text-sm text-zinc-400">{filtered.length + filteredMediaAssets.length} items</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={() => setAddOpen(true)}>Add Equipment</Button>
      </div>

      <div className="relative max-w-md">
        <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search assets…" className="input pl-10" />
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonLoader key={i} variant="card" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FiBox} title="No equipment found" description="Add your first equipment item." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Card key={item.id} className="p-5 transition-all hover:border-brand-500/40 hover:scale-[1.02]">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-zinc-800 p-3 text-brand-400"><FiCamera className="h-5 w-5" /></div>
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-zinc-500">{item.category} · #{item.serial}</p>
                </div>
              </div>
              <div className="mt-4"><Badge variant={item.status === 'Available' ? 'success' : 'warn'}>{item.status}</Badge></div>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Production Media</h2>
          <p className="text-sm text-zinc-400">{filteredMediaAssets.length} items from the asset library</p>
        </div>
        <Button variant="primary" icon={FiPlus} onClick={() => setMediaAddOpen(true)}>Add Media Asset</Button>
      </div>

      {filteredMediaAssets.length === 0 ? (
        <EmptyState icon={FiImage} title="No media assets found" description="Uploaded posters, headshots, color palettes, and behind-the-scenes images will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMediaAssets.map((item) => (
            <MediaAssetCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Equipment" icon={FiCamera} size="sm">
        <form onSubmit={addAsset} className="space-y-4">
          <Input label="Equipment name" value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} required />
          <Input label="Category" value={newAsset.category} onChange={(e) => setNewAsset({ ...newAsset, category: e.target.value })} required />
          <Input label="Serial number" value={newAsset.serial} onChange={(e) => setNewAsset({ ...newAsset, serial: e.target.value })} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving…' : 'Add Equipment'}</Button>
          </div>
        </form>
      </Modal>

      <Modal open={mediaAddOpen} onClose={() => setMediaAddOpen(false)} title="Add Media Asset" icon={FiImage} size="sm">
        <form onSubmit={addMediaAsset} className="space-y-4">
          <Input label="Title" value={newMediaAsset.title} onChange={(e) => setNewMediaAsset({ ...newMediaAsset, title: e.target.value })} required />
          <div className="space-y-1.5">
            <label htmlFor="media-asset-category" className="block text-xs font-medium text-zinc-400">Category</label>
            <select id="media-asset-category" value={newMediaAsset.category} onChange={(e) => setNewMediaAsset({ ...newMediaAsset, category: e.target.value })} className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20">
              <option value="POSTER">Poster</option>
              <option value="HEADSHOT">Cast &amp; Crew Headshot</option>
              <option value="COLOR_PALETTE">Color Palette</option>
              <option value="BTS">Behind The Scenes</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="media-asset-image" className="block text-xs font-medium text-zinc-400">Images</label>
            <input id="media-asset-image" type="file" accept="image/*" multiple onChange={(e) => setNewMediaAsset({ ...newMediaAsset, images: Array.from(e.target.files ?? []) })} required className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-800 file:px-3 file:py-1.5 file:text-zinc-200" />
            <p className="text-xs text-zinc-500">Choose multiple images to add them as slides in one card. Reuse the same title and category to add more slides later.</p>
            {newMediaAsset.images.length > 0 && <p className="text-xs text-zinc-400">{newMediaAsset.images.length} image{newMediaAsset.images.length === 1 ? '' : 's'} selected</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setMediaAddOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={savingMedia}>{savingMedia ? 'Uploading…' : 'Add Media Asset'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function MediaAssetCard({ item }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const imageCount = item.images.length;
  const imageIndex = imageCount ? activeIndex % imageCount : 0;

  return (
    <Card className="overflow-hidden transition-all hover:border-brand-500/40 hover:scale-[1.02]">
      <div className="relative">
        {imageCount ? (
          <img src={item.images[imageIndex]} alt={`${item.title} image ${imageIndex + 1}`} className="h-48 w-full object-cover" />
        ) : (
          <div className="flex h-48 items-center justify-center bg-zinc-900 text-zinc-600"><FiImage className="h-10 w-10" /></div>
        )}
        {imageCount > 1 && (
          <>
            <button
              type="button"
              onClick={() => setActiveIndex((index) => (index - 1 + imageCount) % imageCount)}
              aria-label={`Previous image for ${item.title}`}
              className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((index) => (index + 1) % imageCount)}
              aria-label={`Next image for ${item.title}`}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white">
              {imageIndex + 1}/{imageCount}
            </span>
          </>
        )}
      </div>
      <div className="p-4">
        <p className="font-semibold">{item.title}</p>
        <p className="mt-1 text-xs text-zinc-500">{item.category.replaceAll('_', ' ')}{imageCount > 1 ? ` · ${imageCount} images` : ''}</p>
      </div>
    </Card>
  );
}